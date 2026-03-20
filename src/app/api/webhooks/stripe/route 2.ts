import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminSupabase } from '@/lib/supabase/server';
import { sendPaymentConfirmedEmail, sendRefundEmail } from '@/services/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminSupabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderIdsStr = session.metadata?.order_ids;

        if (!orderIdsStr) {
          console.error('No order_ids in session metadata');
          break;
        }

        const orderIds = orderIdsStr.split(',').filter(Boolean);

        // Log payment event
        for (const orderId of orderIds) {
          await supabase.from('payments').insert({
            order_id: orderId,
            stripe_event_id: event.id,
            stripe_payment_intent_id: session.payment_intent as string,
            event_type: event.type,
            amount_cent: session.amount_total ?? 0,
            currency: session.currency ?? 'eur',
            status: 'paid',
            metadata: { session_id: session.id },
          });

          // Update order status - ONLY via webhook
          await supabase
            .from('orders')
            .update({
              order_status: 'paid',
              payment_status: 'paid',
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq('id', orderId)
            .in('order_status', ['new', 'pending_payment', 'reserved']);

          // Confirm reservations
          await supabase
            .from('stock_reservations')
            .update({ status: 'confirmed' })
            .eq('order_id', orderId)
            .eq('status', 'active');
        }

        console.log(`Payment confirmed for orders: ${orderIds.join(', ')}`);

        // Send payment confirmation emails (non-blocking)
        for (const oid of orderIds) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('order_number, user_id')
            .eq('id', oid)
            .single();

          if (orderData) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, email')
              .eq('id', orderData.user_id)
              .single();

            if (profile) {
              sendPaymentConfirmedEmail(supabase, profile.email, profile.first_name, orderData.order_number).catch(console.error);
            }
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderIdsStr = session.metadata?.order_ids;

        if (orderIdsStr) {
          const orderIds = orderIdsStr.split(',').filter(Boolean);
          for (const orderId of orderIds) {
            // Check if order wasn't already paid
            const { data: order } = await supabase
              .from('orders')
              .select('order_status, payment_status')
              .eq('id', orderId)
              .single();

            if (order && order.payment_status !== 'paid') {
              await supabase
                .from('orders')
                .update({ order_status: 'failed', payment_status: 'failed' })
                .eq('id', orderId);

              // Release stock reservations
              const { data: reservations } = await supabase
                .from('stock_reservations')
                .select('*')
                .eq('order_id', orderId)
                .eq('status', 'active');

              for (const res of reservations ?? []) {
                await supabase
                  .from('products')
                  .update({ stock: supabase.rpc ? undefined : 0 })
                  .eq('id', res.product_id);
                // Use raw SQL increment
                await supabase.rpc('release_expired_reservations');
              }

              await supabase.from('payments').insert({
                order_id: orderId,
                stripe_event_id: event.id,
                event_type: event.type,
                amount_cent: 0,
                status: 'expired',
              });
            }
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Find order by payment intent
        const { data: order } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (order) {
          await supabase.from('payments').insert({
            order_id: order.id,
            stripe_event_id: event.id,
            stripe_payment_intent_id: paymentIntentId,
            event_type: event.type,
            amount_cent: charge.amount_refunded ?? 0,
            currency: charge.currency ?? 'eur',
            status: 'refunded',
          });

          // Send refund email (non-blocking)
          const { data: refundOrder } = await supabase
            .from('orders')
            .select('order_number, user_id')
            .eq('id', order.id)
            .single();

          if (refundOrder) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, email')
              .eq('id', refundOrder.user_id)
              .single();

            if (profile) {
              sendRefundEmail(supabase, profile.email, profile.first_name, refundOrder.order_number).catch(console.error);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent retries for processing errors
    // The error is logged for manual investigation
  }

  return NextResponse.json({ received: true });
}
