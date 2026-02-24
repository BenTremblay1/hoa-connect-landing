import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type WaitlistRole = 'board_member' | 'resident' | 'property_manager';
type WaitlistHoaSize = '1-25' | '26-50' | '51-100' | '101-200' | '201+';

interface WaitlistSignupRequest {
  email: string;
  role?: WaitlistRole;
  hoa_size?: WaitlistHoaSize;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const validRoles = new Set<WaitlistRole>(['board_member', 'resident', 'property_manager']);
const validHoaSizes = new Set<WaitlistHoaSize>(['1-25', '26-50', '51-100', '101-200', '201+']);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const normalizeText = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const getClientIp = (request: Request) => {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  return cfConnectingIp || 'unknown';
};

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  existing.count += 1;
  rateLimitStore.set(ip, existing);

  return existing.count > RATE_LIMIT_MAX_REQUESTS;
};

const sendResendEmail = async ({
  apiKey,
  from,
  to,
  subject,
  html,
  replyTo,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Resend send failed', response.status, body);
  }
};

serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ success: false, code: 'SERVER_ERROR' }, 405);
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return jsonResponse({ success: false, code: 'RATE_LIMITED' }, 429);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    return jsonResponse({ success: false, code: 'SERVER_ERROR' }, 500);
  }

  let payload: WaitlistSignupRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ success: false, code: 'INVALID_EMAIL' }, 400);
  }

  const email = normalizeText(payload.email)?.toLowerCase();
  if (!email || !emailRegex.test(email)) {
    return jsonResponse({ success: false, code: 'INVALID_EMAIL' }, 400);
  }

  const role = normalizeText(payload.role);
  const hoaSize = normalizeText(payload.hoa_size);

  if (role && !validRoles.has(role as WaitlistRole)) {
    return jsonResponse({ success: false, code: 'SERVER_ERROR' }, 400);
  }

  if (hoaSize && !validHoaSizes.has(hoaSize as WaitlistHoaSize)) {
    return jsonResponse({ success: false, code: 'SERVER_ERROR' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase.from('waitlist_signups').insert({
    email,
    role,
    hoa_size: hoaSize,
    source: 'landing_page',
    utm_source: normalizeText(payload.utm_source),
    utm_medium: normalizeText(payload.utm_medium),
    utm_campaign: normalizeText(payload.utm_campaign),
  });

  if (error?.code === '23505') {
    return jsonResponse({ success: true, status: 'duplicate' }, 200);
  }

  if (error) {
    console.error('Supabase insert failed', error);
    return jsonResponse({ success: false, code: 'SERVER_ERROR' }, 500);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('WAITLIST_FROM_EMAIL') || 'HOA Connect <onboarding@resend.dev>';
  const replyToEmail = Deno.env.get('WAITLIST_REPLY_TO_EMAIL') || undefined;
  const notifyEmail = Deno.env.get('WAITLIST_NOTIFICATION_EMAIL') || undefined;

  if (resendApiKey) {
    await sendResendEmail({
      apiKey: resendApiKey,
      from: fromEmail,
      to: email,
      subject: 'You are on the HOA Connect waitlist',
      replyTo: replyToEmail,
      html: `
        <p>Thanks for joining the HOA Connect waitlist.</p>
        <p>We will send you launch updates and beta access details soon.</p>
        <p>- HOA Connect</p>
      `,
    });

    if (notifyEmail) {
      await sendResendEmail({
        apiKey: resendApiKey,
        from: fromEmail,
        to: notifyEmail,
        subject: 'New HOA Connect waitlist signup',
        replyTo: replyToEmail,
        html: `
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Role:</strong> ${role || 'not provided'}</p>
          <p><strong>HOA size:</strong> ${hoaSize || 'not provided'}</p>
          <p><strong>UTM source:</strong> ${payload.utm_source || 'not provided'}</p>
          <p><strong>UTM medium:</strong> ${payload.utm_medium || 'not provided'}</p>
          <p><strong>UTM campaign:</strong> ${payload.utm_campaign || 'not provided'}</p>
          <p><strong>Source:</strong> landing_page</p>
        `,
      });
    }
  }

  return jsonResponse({ success: true, status: 'created' }, 200);
});
