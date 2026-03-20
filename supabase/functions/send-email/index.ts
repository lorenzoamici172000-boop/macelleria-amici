// supabase/functions/send-email/index.ts
// Deploy: supabase functions deploy send-email --no-verify-jwt
// Called internally by the app when emails need to be sent.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = Deno.env.get('EMAIL_FROM') || 'noreply@tuodominio.it';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.subject || !payload.html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Option 1: Send via Resend
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend error:', error);
        return new Response(
          JSON.stringify({ success: false, error }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, id: data.id }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Option 2: No email provider configured - log only
    console.log(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
    console.log(`[EMAIL] Body length: ${payload.html.length} chars`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email logged (no provider configured)',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
