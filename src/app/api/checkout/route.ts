import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { sendReservationEmail, sendInvoiceRequestEmail } from '@/services/email';
import { z } from 'zod';

// Stripe is optional — only loaded when configured
const STRIPE_CONFIGURED = !!(process.env.STRIPE_SECRET_KEY);
let stripe: import('stripe').default | null = null;

if (STRIPE_CONFIGURED) {
  const Stripe = require('stripe').default;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
}

const checkoutBodySchema = z.object({
  orderType: z.enum(['online_payment', 'in_store_payment']),
  fulfillmentType: z.enum(['pickup', 'shipping']),
  notes: z.string().max(1000).optional().default(''),
  pickupDate: z.string().optional(),
  pickupSlot: z.string().optional(),
  shippingZip: z.string().optional(),
  invoiceRequested: z.boolean().default(false),
  idempotencyKey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const adminSupabase = createAdminSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkoutBodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dati non validi', details: validation.error.flatten() }, { status: 400 });
    }

    const data = validation.data;

    // Block online payment if Stripe not configured
    if (data.orderType === 'online_payment' && !STRIPE_CONFIGURED) {
      return NextResponse.json({
        error: 'Il pagamento online non è ancora disponibile. Scegli prenotazione con pagamento in negozio.',
      }, { status: 400 });
    }

    // Get user cart
    const { data: cart } = await adminSupabase
      .from('carts').select('id').eq('user_id', user.id).single();
    if (!cart) return NextResponse.json({ error: 'Carrello non trovato' }, { status: 400 });

    const { data: cartItems } = await adminSupabase
      .from('cart_items').select('*, product:products(*)').eq('cart_id', cart.id);
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Il carrello è vuoto' }, { status: 400 });
    }

    // Validate shipping ZIP
    if (data.fulfillmentType === 'shipping') {
      if (!data.shippingZip || !/^\d{5}$/.test(data.shippingZip)) {
        return NextResponse.json({ error: 'CAP non valido' }, { status: 400 });
      }
      const { data: rule } = await adminSupabase
        .from('shipping_rules').select('cost_cent')
        .eq('zip_code', data.shippingZip).eq('is_active', true).limit(1).single();
      if (!rule) {
        return NextResponse.json({ error: 'Spedizione non disponibile per questo CAP' }, { status: 400 });
      }
    }

    // Prepare items for RPC
    const prepareItems = (items: typeof cartItems) =>
      JSON.stringify(items.map((i: { product_id: string; quantity: number }) => ({
        product_id: i.product_id, quantity: i.quantity,
      })));

    // Get user addresses
    const { data: shippingAddr } = await adminSupabase.from('shipping_addresses').select('*').eq('user_id', user.id).single();
    const { data: billingAddr } = await adminSupabase.from('billing_addresses').select('*').eq('user_id', user.id).single();
    const { data: invoiceProfile } = await adminSupabase.from('invoice_profiles').select('*').eq('user_id', user.id).single();

    if (data.invoiceRequested && !invoiceProfile) {
      return NextResponse.json({ error: 'Completa i dati di fatturazione per procedere' }, { status: 400 });
    }

    // Create order via atomic RPC
    const { data: orderId, error: orderError } = await adminSupabase.rpc('create_order_with_stock', {
      p_user_id: user.id,
      p_order_type: data.orderType,
      p_fulfillment_type: data.fulfillmentType,
      p_items: prepareItems(cartItems),
      p_shipping_zip: data.fulfillmentType === 'shipping' ? data.shippingZip : null,
      p_notes: data.notes || '',
      p_invoice_requested: data.invoiceRequested,
      p_pickup_date: data.pickupDate,
      p_pickup_slot: data.pickupSlot,
      p_shipping_address: shippingAddr ? JSON.stringify(shippingAddr) : null,
      p_billing_address: billingAddr ? JSON.stringify(billingAddr) : null,
      p_invoice_profile: invoiceProfile ? JSON.stringify(invoiceProfile) : null,
      p_idempotency_key: data.idempotencyKey,
    });

    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 });

    // Clear cart
    await adminSupabase.from('cart_items').delete().eq('cart_id', cart.id);

    // Online payment with Stripe
    if (data.orderType === 'online_payment' && stripe) {
      const { data: order } = await adminSupabase.from('orders').select('grand_total_cent, order_number').eq('id', orderId).single();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'eur', product_data: { name: `Ordine #${order?.order_number} - Macelleria Amici` }, unit_amount: order?.grand_total_cent ?? 0 }, quantity: 1 }],
        metadata: { order_ids: orderId, user_id: user.id },
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/conferma?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/carrello`,
        expires_at: Math.floor(Date.now() / 1000) + 900,
      });
      await adminSupabase.from('orders').update({
        stripe_session_id: session.id, order_status: 'pending_payment', payment_status: 'pending',
      }).eq('id', orderId);
      return NextResponse.json({ type: 'single', stripeUrl: session.url, orderId });
    }

    // Reservation (in-store payment) — send emails
    const { data: createdOrder } = await adminSupabase.from('orders').select('order_number').eq('id', orderId).single();
    const { data: userProfile } = await adminSupabase.from('profiles').select('first_name, email').eq('id', user.id).single();

    if (userProfile && createdOrder) {
      sendReservationEmail(adminSupabase, userProfile.email, userProfile.first_name, createdOrder.order_number).catch(console.error);
      if (data.invoiceRequested) {
        sendInvoiceRequestEmail(adminSupabase, userProfile.email, userProfile.first_name, createdOrder.order_number).catch(console.error);
      }
    }

    return NextResponse.json({
      type: 'single',
      orderId,
      orderNumber: createdOrder?.order_number,
      message: 'La prenotazione è stata registrata correttamente',
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Errore durante il checkout. Riprova.' }, { status: 500 });
  }
}
