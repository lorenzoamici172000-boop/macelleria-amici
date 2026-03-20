import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server';
import { formatCents, centsToDecimal, formatVatRate } from '@/utils/currency';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const adminDb = createAdminSupabase();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'orderId mancante' }, { status: 400 });

    // Get order with items and user
    const { data: order } = await adminDb
      .from('orders')
      .select('*, items:order_items(*), user:profiles(first_name, last_name, email, username)')
      .eq('id', orderId)
      .single();

    if (!order) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });

    // Get business settings
    const { data: business } = await adminDb.from('business_settings').select('*').limit(1).single();

    // Generate HTML for PDF (will be rendered client-side with jsPDF, or use server-side generation)
    const pdfData = {
      business: {
        name: business?.business_name || 'Macelleria Amici',
        operational_address: business?.operational_address || '',
        legal_address: business?.legal_address || '',
        phone: business?.phone || '',
      },
      order: {
        number: order.order_number,
        date: new Date(order.created_at).toLocaleDateString('it-IT'),
        status: order.order_status,
        payment_status: order.payment_status,
        type: order.order_type,
        fulfillment: order.fulfillment_type,
        notes: order.notes,
        invoice_requested: order.invoice_requested,
      },
      customer: {
        name: `${(order.user as { first_name?: string })?.first_name || ''} ${(order.user as { last_name?: string })?.last_name || ''}`.trim(),
        email: (order.user as { email?: string })?.email || '',
      },
      shipping_address: order.shipping_address_snapshot,
      billing_address: order.billing_address_snapshot,
      invoice_profile: order.invoice_profile_snapshot,
      items: (order.items || []).map((item: {
        product_name_snapshot: string;
        quantity: number;
        unit_price_cent: number;
        discount_price_cent: number | null;
        vat_rate_snapshot: number;
        row_total_cent: number;
        row_vat_cent: number;
        row_status: string;
        refund_cent: number;
      }) => ({
        name: item.product_name_snapshot,
        quantity: item.quantity,
        unit_price: formatCents(item.discount_price_cent ?? item.unit_price_cent),
        vat_rate: formatVatRate(item.vat_rate_snapshot),
        row_total: formatCents(item.row_total_cent),
        row_vat: formatCents(item.row_vat_cent),
        status: item.row_status,
        refund: item.refund_cent > 0 ? formatCents(item.refund_cent) : null,
      })),
      totals: {
        subtotal: formatCents(order.subtotal_cent),
        vat: formatCents(order.vat_total_cent),
        shipping: formatCents(order.shipping_total_cent),
        grand_total: formatCents(order.grand_total_cent),
      },
    };

    return NextResponse.json(pdfData);
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Errore generazione PDF' }, { status: 500 });
  }
}
