// supabase/functions/stripe-webhook/index.ts
// Alternative webhook handler via Supabase Edge Functions
// Use this if the Next.js API route on Netlify has issues with raw body parsing.
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Then point Stripe webhook to: https://<project>.supabase.co/functions/v1/stripe-webhook

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.12.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderIdsStr = session.metadata?.order_ids;
        if (!orderIdsStr) break;

        const orderIds = orderIdsStr.split(',').filter(Boolean);

        for (const orderId of orderIds) {
          // Log payment
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

          // Update order - ONLY place where paid status is set
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
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderIdsStr = session.metadata?.order_ids;
        if (!orderIdsStr) break;

        const orderIds = orderIdsStr.split(',').filter(Boolean);
        for (const orderId of orderIds) {
          const { data: order } = await supabase
            .from('orders')
            .select('payment_status')
            .eq('id', orderId)
            .single();

          if (order && order.payment_status !== 'paid') {
            await supabase
              .from('orders')
              .update({ order_status: 'failed', payment_status: 'failed' })
              .eq('id', orderId);

            // Release stock
            await supabase.rpc('release_expired_reservations');

            await supabase.from('payments').insert({
              order_id: orderId,
              stripe_event_id: event.id,
              event_type: event.type,
              amount_cent: 0,
              status: 'expired',
            });
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

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
        }
        break;
      }

      default:
        console.log(`Unhandled: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
