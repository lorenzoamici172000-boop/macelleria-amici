/**
 * Client-side PDF generation for order invoices.
 * Uses jsPDF + jspdf-autotable for professional output.
 * Only callable from admin panel.
 */

interface PdfOrderData {
  business: {
    name: string;
    operational_address: string;
    legal_address: string;
    phone: string;
  };
  order: {
    number: number;
    date: string;
    status: string;
    payment_status: string;
    type: string;
    fulfillment: string;
    notes: string;
    invoice_requested: boolean;
  };
  customer: {
    name: string;
    email: string;
  };
  shipping_address: Record<string, string> | null;
  billing_address: Record<string, string> | null;
  invoice_profile: Record<string, string> | null;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: string;
    vat_rate: string;
    row_total: string;
    row_vat: string;
    status: string;
    refund: string | null;
  }>;
  totals: {
    subtotal: string;
    vat: string;
    shipping: string;
    grand_total: string;
  };
}

export async function generateOrderPdf(orderId: string): Promise<void> {
  try {
    // Fetch data from API
    const response = await fetch(`/api/admin/pdf?orderId=${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order data');
    const data: PdfOrderData = await response.json();

    // Dynamic import jsPDF (only when needed)
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header - Business info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(data.business.name, 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(data.business.operational_address, 14, y);
    y += 4;
    if (data.business.legal_address) {
      doc.text(`Sede legale: ${data.business.legal_address}`, 14, y);
      y += 4;
    }
    doc.text(`Tel: ${data.business.phone}`, 14, y);
    y += 10;

    // Order title
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const title = data.order.invoice_requested
      ? `RIEPILOGO FATTURA - Ordine #${data.order.number}`
      : `RIEPILOGO ORDINE #${data.order.number}`;
    doc.text(title, 14, y);
    y += 8;

    // Order meta
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${data.order.date}`, 14, y);
    doc.text(`Tipo: ${data.order.type === 'online_payment' ? 'Pagamento online' : 'Prenotazione'}`, pageWidth / 2, y);
    y += 4;
    doc.text(`Consegna: ${data.order.fulfillment === 'pickup' ? 'Ritiro in negozio' : 'Spedizione'}`, 14, y);
    y += 8;

    // Customer info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Dati cliente', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(data.customer.name, 14, y); y += 4;
    doc.text(data.customer.email, 14, y); y += 6;

    // Shipping address
    if (data.shipping_address) {
      doc.setFont('helvetica', 'bold');
      doc.text('Indirizzo spedizione', 14, y); y += 5;
      doc.setFont('helvetica', 'normal');
      const addr = data.shipping_address;
      doc.text(`${addr.first_name || ''} ${addr.last_name || ''}`, 14, y); y += 4;
      doc.text(`${addr.street || ''} ${addr.street_number || ''}`, 14, y); y += 4;
      doc.text(`${addr.zip_code || ''} ${addr.city || ''} (${addr.province || ''})`, 14, y); y += 4;
      if (addr.phone) { doc.text(`Tel: ${addr.phone}`, 14, y); y += 4; }
      y += 4;
    }

    // Billing / Invoice profile
    if (data.order.invoice_requested && data.invoice_profile) {
      doc.setFont('helvetica', 'bold');
      doc.text('Dati fatturazione', pageWidth / 2, y - (data.shipping_address ? 24 : 0));
      const fy = y - (data.shipping_address ? 19 : 0);
      doc.setFont('helvetica', 'normal');
      const inv = data.invoice_profile;
      let ify = fy;
      if (inv.invoice_type === 'company') {
        doc.text(inv.company_name || '', pageWidth / 2, ify); ify += 4;
        doc.text(`P.IVA: ${inv.vat_number || ''}`, pageWidth / 2, ify); ify += 4;
        doc.text(`SDI: ${inv.sdi_code || ''}`, pageWidth / 2, ify); ify += 4;
        doc.text(`PEC: ${inv.pec || ''}`, pageWidth / 2, ify); ify += 4;
      } else {
        doc.text(`${inv.first_name || ''} ${inv.last_name || ''}`, pageWidth / 2, ify); ify += 4;
        doc.text(`C.F.: ${inv.tax_code || ''}`, pageWidth / 2, ify); ify += 4;
      }
      if (inv.full_address) { doc.text(inv.full_address, pageWidth / 2, ify); }
    }

    y += 4;

    // Items table
    autoTable(doc, {
      startY: y,
      head: [['Prodotto', 'Qtà', 'Prezzo', 'IVA', 'Totale', 'Stato']],
      body: data.items.map((item) => [
        item.name,
        String(item.quantity),
        item.unit_price,
        item.vat_rate,
        item.row_total,
        item.status === 'refunded' ? `Rimborsato (${item.refund})` : 'Attivo',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [26, 26, 26], textColor: [192, 192, 192] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'center', cellWidth: 30 },
      },
    });

    // @ts-expect-error - autoTable sets lastAutoTable
    const finalY = doc.lastAutoTable?.finalY || y + 40;

    // Totals
    const totalsY = finalY + 10;
    doc.setFontSize(9);
    doc.text('Subtotale:', pageWidth - 70, totalsY);
    doc.text(data.totals.subtotal, pageWidth - 14, totalsY, { align: 'right' });

    doc.text('di cui IVA:', pageWidth - 70, totalsY + 5);
    doc.text(data.totals.vat, pageWidth - 14, totalsY + 5, { align: 'right' });

    doc.text('Spedizione:', pageWidth - 70, totalsY + 10);
    doc.text(data.totals.shipping, pageWidth - 14, totalsY + 10, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALE:', pageWidth - 70, totalsY + 18);
    doc.text(data.totals.grand_total, pageWidth - 14, totalsY + 18, { align: 'right' });

    // Invoice note
    if (data.order.invoice_requested) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text('Richiesta fattura: Sì', 14, totalsY + 18);
    }

    // Notes
    if (data.order.notes) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Note: ${data.order.notes}`, 14, totalsY + 26);
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Documento generato il ${new Date().toLocaleDateString('it-IT')} - ${data.business.name}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    // Save
    doc.save(`ordine-${data.order.number}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Errore nella generazione del PDF');
  }
}
