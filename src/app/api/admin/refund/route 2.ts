import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const adminDb = createAdminSupabase();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Accesso non autorizzato' }, { status: 403 });
    }

    const body = await request.json();
    const { orderItemId, orderId } = body;

    if (!orderItemId || !orderId) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Get order and item
    const { data: order } = await adminDb
      .from('orders')
      .select('stripe_payment_intent_id, payment_status')
      .eq('id', orderId)
      .single();

    if (!order?.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Nessun pagamento Stripe associato' }, { status: 400 });
    }

    const { data: item } = await adminDb
      .from('order_items')
      .select('row_total_cent, row_status')
      .eq('id', orderItemId)
      .single();

    if (!item || item.row_status !== 'active') {
      return NextResponse.json({ error: 'Riga ordine non rimborsabile' }, { status: 400 });
    }

    // Execute Stripe refund
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: item.row_total_cent,
      }, {
        idempotencyKey: `refund-${orderItemId}`,
      });

      // Process in DB
      await adminDb.rpc('process_refund', {
        p_admin_id: user.id,
        p_order_item_id: orderItemId,
        p_refund_cent: item.row_total_cent,
        p_stripe_refund_id: refund.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Il rimborso è stato registrato correttamente',
        refundId: refund.id,
      });

    } catch (stripeError) {
      console.error('Stripe refund failed:', stripeError);

      // Mark as refund_failed_retry
      await adminDb
        .from('orders')
        .update({ payment_status: 'refund_failed_retry' })
        .eq('id', orderId);

      await adminDb.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'refund_failed',
        entity_type: 'order_item',
        entity_id: orderItemId,
        new_value: { error: String(stripeError) },
      });

      return NextResponse.json({
        success: false,
        error: 'Il rimborso non è stato completato. È necessario riprovare.',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
