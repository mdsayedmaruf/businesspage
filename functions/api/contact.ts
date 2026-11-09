// Cloudflare Pages Function: POST /api/contact
// Validates a quote request, checks Turnstile, and emails the lead to the business.

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

interface Context {
  request: Request;
  env: Env;
}

const MAX_BODY_BYTES = 20_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

// Best effort only: this memory is per-isolate. Add a free Cloudflare WAF rate
// limiting rule on /api/contact at launch for an account-wide limit.
const recent = new Map<string, number[]>();

function isRateLimited(ip: string, now: number): boolean {
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > RATE_MAX;
}

function reply(request: Request, ok: boolean, status: number, code: string): Response {
  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ ok, code }, { status, headers: { 'cache-control': 'no-store' } });
  }
  const target = new URL(ok ? '/thanks' : `/contact?error=${code}`, request.url);
  return Response.redirect(target.toString(), 303);
}

function field(form: FormData, name: string, max: number): string {
  const value = form.get(name);
  if (typeof value !== 'string') return '';
  return value.replace(/\r\n?/g, '\n').trim().slice(0, max);
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const { TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = env;
  if (!TURNSTILE_SECRET_KEY || !RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    return reply(request, false, 503, 'not_configured');
  }

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return reply(request, false, 403, 'bad_origin');
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return reply(request, false, 413, 'too_large');

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (isRateLimited(ip, Date.now())) return reply(request, false, 429, 'rate_limited');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, false, 400, 'invalid');
  }

  // Bots fill this hidden field. Pretend success so they don't adapt.
  if (field(form, 'company_site', 200)) return reply(request, true, 200, 'ok');

  const name = oneLine(field(form, 'name', 100));
  const phone = oneLine(field(form, 'phone', 30));
  const email = oneLine(field(form, 'email', 200));
  const city = oneLine(field(form, 'city', 100));
  const service = oneLine(field(form, 'service', 100));
  const message = field(form, 'message', 2000);

  const phoneDigits = phone.replace(/\D/g, '');
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (name.length < 2 || phoneDigits.length < 10 || phoneDigits.length > 15 || (email && !emailValid)) {
    return reply(request, false, 400, 'invalid');
  }

  const token = field(form, 'cf-turnstile-response', 4096);
  if (!token) return reply(request, false, 400, 'bot_check');

  const verifyBody = new FormData();
  verifyBody.append('secret', TURNSTILE_SECRET_KEY);
  verifyBody.append('response', token);
  verifyBody.append('remoteip', ip);

  try {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: verifyBody,
    });
    const outcome = (await verify.json()) as { success?: boolean };
    if (!outcome.success) return reply(request, false, 400, 'bot_check');
  } catch {
    return reply(request, false, 502, 'send_failed');
  }

  const text = [
    'New quote request from the website',
    '',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email || 'Not provided'}`,
    `City: ${city || 'Not provided'}`,
    `Service: ${service || 'Not provided'}`,
    '',
    'Message:',
    message || 'Not provided',
  ].join('\n');

  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        subject: `Website quote request: ${name}`,
        text,
        ...(email ? { reply_to: email } : {}),
      }),
    });
    if (!sent.ok) return reply(request, false, 502, 'send_failed');
  } catch {
    return reply(request, false, 502, 'send_failed');
  }

  return reply(request, true, 200, 'ok');
}
