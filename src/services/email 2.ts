// ==============================================
// Email Service - Templates and sending via Supabase
// All emails in Italian with professional tone
// ==============================================

import type { SupabaseClient } from '@supabase/supabase-js';

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@tuodominio.it';

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via Supabase Edge Function or external SMTP.
 * This is a placeholder that should be connected to your email provider.
 * Options: Supabase Auth emails, Resend, SendGrid, AWS SES, etc.
 */
export async function sendEmail(supabase: SupabaseClient, data: EmailData): Promise<boolean> {
  try {
    // Log the email attempt for audit
    await supabase.from('admin_audit_logs').insert({
      admin_id: '00000000-0000-0000-0000-000000000000', // system
      action: 'email_sent',
      entity_type: 'email',
      entity_id: null,
      new_value: { to: data.to, subject: data.subject },
    });

    // In production, integrate with your email provider here.
    // Example with Supabase Edge Function:
    // await supabase.functions.invoke('send-email', { body: data });

    console.log(`[EMAIL] To: ${data.to} | Subject: ${data.subject}`);
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    return false;
  }
}

function wrapHtml(businessName: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#1a1a1a;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="color:#c0c0c0;margin:0;font-size:24px;">${businessName}</h1>
    </div>
    <div style="background:#ffffff;padding:30px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
      ${content}
    </div>
    <div style="text-align:center;padding:20px;color:#999;font-size:12px;">
      © ${new Date().getFullYear()} ${businessName}. Tutti i diritti riservati.
    </div>
  </div>
</body>
</html>`;
}

// ---- Registration Complete ----
export async function sendRegistrationEmail(
  supabase: SupabaseClient,
  to: string,
  firstName: string,
  businessName: string = 'Macelleria Amici'
): Promise<boolean> {
  return sendEmail(supabase, {
    to,
    subject: `Benvenuto su ${businessName}`,
    html: wrapHtml(businessName, `
      <p style="font-size:16px;color:#333;">Ciao <strong>${firstName}</strong>,</p>
      <p style="color:#555;">la registrazione è stata completata correttamente.</p>
      <p style="color:#555;">Ora puoi accedere al tuo account, aggiungere prodotti al carrello, salvarli nei preferiti e completare i tuoi ordini.</p>
      <p style="color:#555;">Grazie per aver scelto ${businessName}.</p>
    `),
  });
}

// ---- Order Created ----
export async function sendOrderCreatedEmail(
  supabase: SupabaseClient,
  to: string,
  firstName: string,
  orderNumber: number,
  businessName: string = 'Macelleria Amici'
): Promise<boolean> {
  return sendEmail(supabase, {
    to,
    subject: `Ordine ricevuto #${orderNumber}`,
    html: wrapHtml(businessName, `
      <p style="font-size:16px;color:#333;">Ciao <strong>${firstName}</strong>,</p>
      <p style="color:#555;">abbiamo ricevuto il tuo ordine <strong>#${orderNumber}</strong>.</p>
      <p style="color:#555;">Puoi consultare il riepilogo nell'area utente.</p>
      <p style="color:#555;">Ti aggiorneremo sullo stato dell'ordine.</p>
    `),
  });
}

// ---- Payment Confirmed ----
export async function sendPaymentConfirmedEmail(
  supabase: SupabaseClient,
  to: string,
  firstName: string,
  orderNumber: number,
  businessName: string = 'Macelleria Amici'
): Promise<boolean> {
  return sendEmail(supabase, {
    to,
    subject: `Pagamento confermato per l'ordine #${orderNumber}`,
    html: wrapHtml(businessName, `
      <p style="font-size:16px;color:#333;">Ciao <strong>${firstName}</strong>,</p>
      <p style="color:#555;">il pagamento del tuo ordine <strong>#${orderNumber}</strong> è stato confermato correttamente.</p>
      <p style="color:#555;">Puoi visualizzare il dettaglio nell'area utente.</p>
    `),
  });
}

// ---- Reservation Registered ----
export async function sendReservationEmail(
  supabase: SupabaseClient,
  to: string,
  firstName: string,
  orderNumber: number,
  businessName: string = 'Macelleria Amici'
): Promise<boolean> {
  return sendEmail(supabase, {
    to,
    subject: `Prenotazione registrata #${orderNumber}`,
    html: wrapHtml(businessName, `
      <p style="font-size:16px;color:#333;">Ciao <strong>${firstName}</strong>,</p>
      <p style="color:#555;">la tua prenotazione <strong>#${orderNumber}</strong> è stata registrata correttamente.</p>
      <p style="color:#555;">Il ritiro e il pagamento in negozio saranno gestiti secondo le informazioni mostrate nel dettaglio ordine.</p>
    `),
  });
}

// ---- Refund Executed ----
export async function sendRefundEmail(
  supabase: SupabaseClient,
  to: string,
  firstName: string,
  orderNumber: number,
  businessName: string = 'Macelleria Amici'
): Promise<boolean> {
  return sendEmail(supabase, {
    to,
    subject: `Rimborso eseguito per l'ordine #${orderNumber}`,
    html: wrapHtml(businessName, `
      <p style="font-size:16px;color:#333;">Ciao <strong>${firstName}</strong>,</p>
      <p style="color:#555;">è stato eseguito un rimborso relativo all'ordine <strong>#${orderNumber}</strong>.</p>
      <p style="color:#555;">Puoi verificare i dettagli nella tua area ordini.</p>
    `),
  });
}

// ---- Refund Failed ----
export async function sendRefundFailedEmail(
  supabase: SupabaseClient,
  to: string,
  firstName: string,
  orderNumber: number,
  businessName: string = 'Macelleria Amici'
): Promise<boolean> {
  return sendEmail(supabase, {
    to,
    subject: `Aggiornamento rimborso ordine #${orderNumber}`,
    html: wrapHtml(businessName, `
      <p style="font-size:16px;color:#333;">Ciao <strong>${firstName}</strong>,</p>
      <p style="color:#555;">si è verificato un problema tecnico durante il rimborso relativo all'ordine <strong>#${orderNumber}</strong>.</p>
      <p style="color:#555;">La richiesta è stata registrata e verrà gestita nuovamente.</p>
    `),
  });
}

// ---- Invoice Request Received ----
export async function sendInvoiceRequestEmail(
  supabase: SupabaseClient,
  to: string,
  firstName: string,
  orderNumber: number,
  businessName: string = 'Macelleria Amici'
): Promise<boolean> {
  return sendEmail(supabase, {
    to,
    subject: `Richiesta fattura registrata per l'ordine #${orderNumber}`,
    html: wrapHtml(businessName, `
      <p style="font-size:16px;color:#333;">Ciao <strong>${firstName}</strong>,</p>
      <p style="color:#555;">abbiamo registrato la tua richiesta fattura per l'ordine <strong>#${orderNumber}</strong>.</p>
      <p style="color:#555;">I dati fiscali associati all'ordine risultano acquisiti correttamente.</p>
    `),
  });
}
