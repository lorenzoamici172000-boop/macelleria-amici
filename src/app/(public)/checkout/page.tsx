'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getCart, type CartWithItems } from '@/services/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { formatCents, getEffectivePrice, calculateVatFromInclusive } from '@/utils/currency';
import { CreditCard, Store, Truck, MapPin } from 'lucide-react';
import type { ShippingAddress, BillingAddress, InvoiceProfile } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { settings } = useTheme();
  const { trackCheckoutStart, trackCheckoutComplete } = useAnalytics();
  const { isSubmitting: guardSubmitting, guard } = useSubmitGuard();

  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stripeEnabled, setStripeEnabled] = useState(false);

  // Form state — default to in-store payment (reservation)
  const [orderType, setOrderType] = useState<'online_payment' | 'in_store_payment'>('in_store_payment');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'shipping'>('pickup');
  const [notes, setNotes] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [zipError, setZipError] = useState('');
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // User data
  const [shippingAddr, setShippingAddr] = useState<ShippingAddress | null>(null);
  const [invoiceProfile, setInvoiceProfile] = useState<InvoiceProfile | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const [cartData, shipAddr, invProfile] = await Promise.all([
      getCart(supabase, user.id),
      supabase.from('shipping_addresses').select('*').eq('user_id', user.id).single(),
      supabase.from('invoice_profiles').select('*').eq('user_id', user.id).single(),
    ]);
    setCart(cartData);
    if (shipAddr.data) setShippingAddr(shipAddr.data as ShippingAddress);
    if (invProfile.data) setInvoiceProfile(invProfile.data as InvoiceProfile);
    setIsLoading(false);
  }, [supabase, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Check if Stripe is configured
  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(data => {
      setStripeEnabled(data.stripe === true);
    }).catch(() => setStripeEnabled(false));
  }, []);

  // Track checkout start
  useEffect(() => { trackCheckoutStart(); }, [trackCheckoutStart]);

  // Check shipping ZIP
  const checkZip = async (zip: string) => {
    setZipError('');
    setShippingCost(null);
    if (!/^\d{5}$/.test(zip)) {
      setZipError(t('checkout.zipInvalid'));
      return;
    }
    const { data } = await supabase
      .from('shipping_rules')
      .select('cost_cent')
      .eq('zip_code', zip)
      .eq('is_active', true)
      .single();
    if (!data) {
      setZipError(t('checkout.zipNotServed'));
    } else {
      setShippingCost(data.cost_cent as number);
    }
  };

  useEffect(() => {
    if (fulfillmentType === 'shipping' && shippingZip.length === 5) {
      checkZip(shippingZip);
    }
  }, [shippingZip, fulfillmentType]);

  const items = cart?.items ?? [];
  const subtotalCent = items.reduce((sum, item) => {
    if (!item.product?.is_active) return sum;
    return sum + getEffectivePrice(item.product.price_cent, item.product.discount_price_cent) * item.quantity;
  }, 0);
  const vatTotalCent = items.reduce((sum, item) => {
    if (!item.product?.is_active) return sum;
    const rowTotal = getEffectivePrice(item.product.price_cent, item.product.discount_price_cent) * item.quantity;
    return sum + calculateVatFromInclusive(rowTotal, item.product.vat_rate);
  }, 0);
  const finalShipping = fulfillmentType === 'shipping' ? (shippingCost ?? 0) : 0;
  const grandTotalCent = subtotalCent + finalShipping;

  const handleSubmit = async () => {
    setError('');
    if (!acceptTerms) {
      setError(t('checkout.acceptTerms'));
      return;
    }
    if (fulfillmentType === 'shipping' && zipError) return;
    if (invoiceRequested && !invoiceProfile) {
      setError(t('checkout.invoiceIncomplete'));
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `${user!.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          fulfillmentType,
          notes,
          pickupDate: fulfillmentType === 'pickup' ? pickupDate : undefined,
          pickupSlot: fulfillmentType === 'pickup' ? pickupSlot : undefined,
          shippingZip: fulfillmentType === 'shipping' ? shippingZip : undefined,
          invoiceRequested,
          idempotencyKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t('common.error'));
        setIsSubmitting(false);
        return;
      }

      if (result.stripeUrl) {
        trackCheckoutComplete();
        window.location.href = result.stripeUrl;
      } else {
        trackCheckoutComplete();
        router.push(`/checkout/conferma?order=${result.orderId || result.orderIds?.[0]}`);
      }
    } catch {
      setError(t('common.error'));
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">{t('cart.empty')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('checkout.title')}
      </h1>

      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Order Type */}
        <div className="p-6 rounded-lg border border-border">
          <h2 className="font-medium mb-4">{t('checkout.orderType')}</h2>
          <div className={`grid ${stripeEnabled ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {stripeEnabled && (
              <button
                onClick={() => setOrderType('online_payment')}
                className={`p-4 rounded-lg border text-sm text-left transition-colors ${
                  orderType === 'online_payment' ? 'border-primary bg-primary/5' : 'border-border hover:border-gray-300'
                }`}
              >
                <CreditCard size={20} className="mb-2" />
                <span className="font-medium">{t('checkout.onlinePayment')}</span>
              </button>
            )}
            <button
              onClick={() => setOrderType('in_store_payment')}
              className={`p-4 rounded-lg border text-sm text-left transition-colors ${
                orderType === 'in_store_payment' ? 'border-primary bg-primary/5' : 'border-border hover:border-gray-300'
              }`}
            >
              <Store size={20} className="mb-2" />
              <span className="font-medium">{t('checkout.inStorePayment')}</span>
            </button>
          </div>
          {!stripeEnabled && (
            <p className="mt-3 text-xs text-muted-foreground">
              Al momento è disponibile solo la prenotazione con pagamento in negozio.
            </p>
          )}
        </div>

        {/* Fulfillment Type */}
        <div className="p-6 rounded-lg border border-border">
          <h2 className="font-medium mb-4">{t('checkout.fulfillment')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFulfillmentType('pickup')}
              className={`p-4 rounded-lg border text-sm text-left transition-colors ${
                fulfillmentType === 'pickup' ? 'border-primary bg-primary/5' : 'border-border hover:border-gray-300'
              }`}
            >
              <MapPin size={20} className="mb-2" />
              <span className="font-medium">{t('checkout.pickup')}</span>
            </button>
            <button
              onClick={() => setFulfillmentType('shipping')}
              className={`p-4 rounded-lg border text-sm text-left transition-colors ${
                fulfillmentType === 'shipping' ? 'border-primary bg-primary/5' : 'border-border hover:border-gray-300'
              }`}
            >
              <Truck size={20} className="mb-2" />
              <span className="font-medium">{t('checkout.shipping')}</span>
            </button>
          </div>

          {/* Pickup details */}
          {fulfillmentType === 'pickup' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('checkout.pickupDate')}</label>
                <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('checkout.pickupSlot')}</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
                  value={pickupSlot}
                  onChange={(e) => setPickupSlot(e.target.value)}
                >
                  <option value="">-- Seleziona --</option>
                  <option value="09:00-10:00">09:00 - 10:00</option>
                  <option value="10:00-11:00">10:00 - 11:00</option>
                  <option value="11:00-12:00">11:00 - 12:00</option>
                  <option value="12:00-13:00">12:00 - 13:00</option>
                  <option value="16:30-17:30">16:30 - 17:30</option>
                  <option value="17:30-18:30">17:30 - 18:30</option>
                  <option value="18:30-19:00">18:30 - 19:00</option>
                </select>
              </div>
            </div>
          )}

          {/* Shipping ZIP */}
          {fulfillmentType === 'shipping' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">{t('checkout.zipCode')}</label>
              <Input
                value={shippingZip}
                onChange={(e) => setShippingZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
                error={zipError}
                placeholder="00137"
              />
              {shippingCost !== null && !zipError && (
                <p className="mt-1 text-sm text-green-600">
                  {t('checkout.shippingCost')}: {formatCents(shippingCost, locale)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Invoice */}
        <div className="p-6 rounded-lg border border-border">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={invoiceRequested}
              onChange={(e) => setInvoiceRequested(e.target.checked)}
              className="rounded"
            />
            <span className="font-medium text-sm">{t('checkout.invoiceRequest')}</span>
          </label>
          {invoiceRequested && !invoiceProfile && (
            <p className="mt-2 text-sm text-yellow-600">
              {t('checkout.invoiceIncomplete')}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="p-6 rounded-lg border border-border">
          <label className="block text-sm font-medium mb-1">{t('checkout.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-24 px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
            maxLength={1000}
          />
        </div>

        {/* Summary */}
        <div className="p-6 rounded-lg border border-border space-y-3">
          <h2 className="font-medium mb-4">Riepilogo</h2>

          {items.map((item) => {
            const price = getEffectivePrice(item.product.price_cent, item.product.discount_price_cent);
            return (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product.name} × {item.quantity}</span>
                <span>{formatCents(price * item.quantity, locale)}</span>
              </div>
            );
          })}

          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>{t('cart.subtotal')}</span>
              <span>{formatCents(subtotalCent, locale)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('checkout.vatTotal')}</span>
              <span>{formatCents(vatTotalCent, locale)}</span>
            </div>
            {fulfillmentType === 'shipping' && shippingCost !== null && (
              <div className="flex justify-between text-sm">
                <span>{t('checkout.shippingCost')}</span>
                <span>{shippingCost === 0 ? t('common.free') : formatCents(shippingCost, locale)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>{t('checkout.grandTotal')}</span>
              <span style={{ color: settings.color_primary }}>{formatCents(grandTotalCent, locale)}</span>
            </div>
          </div>
        </div>

        {/* Accept terms */}
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 rounded"
          />
          {t('checkout.acceptTerms')}
        </label>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={isSubmitting || !acceptTerms || (fulfillmentType === 'shipping' && !!zipError)}
          className="w-full"
          size="lg"
          style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
        >
          {orderType === 'online_payment' ? t('checkout.payNow') : t('checkout.placeOrder')}
        </Button>
      </div>
    </div>
  );
}
