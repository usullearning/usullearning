/* ============================================================
   Usul Learning — Cloudflare Worker Proxy
   worker.js
   ============================================================

   WHAT THIS DOES
   ──────────────
   Sits between usullearning.com and the two external APIs.
   The browser calls YOUR Worker. The Worker adds the secret
   API keys and forwards to the real endpoint. Keys never
   reach the browser.

   Browser → Worker (your domain) → Web3Forms / Brevo
                ↑ keys live here only

   DEPLOYMENT (10 minutes, completely free)
   ─────────────────────────────────────────
   1. Go to dash.cloudflare.com → Workers & Pages → Create
   2. Click "Create Worker" → name it "usul-proxy" → Deploy
   3. Click "Edit Code" → paste the entire contents of this
      file → Save and Deploy
   4. Go to Settings → Variables → Add the following secrets
      (use "Encrypt" — they will never be visible again):

        WEB3FORMS_KEY   →  your Web3Forms access key
        BREVO_KEY       →  your Brevo API key
        BREVO_LIST_ID   →  your Brevo list ID (number as string, e.g. "3")
        ALLOWED_ORIGIN  →  https://usullearning.com

   5. Go to Workers & Pages → usul-proxy → Triggers → Add Route:
        Route:  usullearning.com/api/*
        Zone:   usullearning.com
      This makes https://usullearning.com/api/contact and
      https://usullearning.com/api/subscribe route to this Worker.

   6. In main.js, change the two WORKER_URL lines to:
        const CONTACT_URL   = '/api/contact';
        const SUBSCRIBE_URL = '/api/subscribe';

   That's it. Keys are gone from the browser forever.
   ============================================================ */

export default {
  async fetch(request, env) {

    // ── CORS — only accept requests from your own domain ──
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || 'https://usullearning.com';

    // Preflight (OPTIONS) — browser sends this before POST
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, origin, allowed);
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, origin, allowed);
    }

    // Only accept requests from your site (not from random callers)
    if (origin !== allowed) {
      return corsResponse(JSON.stringify({ error: 'Forbidden' }), 403, origin, allowed);
    }

    const url = new URL(request.url);

    // ── Route: /api/contact → Web3Forms ───────────────────
    if (url.pathname === '/api/contact') {
      return handleContact(request, env, origin, allowed);
    }

    // ── Route: /api/subscribe → Brevo ─────────────────────
    if (url.pathname === '/api/subscribe') {
      return handleSubscribe(request, env, origin, allowed);
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404, origin, allowed);
  },
};


/* ── Contact form → Web3Forms ─────────────────────────────── */

async function handleContact(request, env, origin, allowed) {
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, origin, allowed);
  }

  // Validate required fields server-side (second line of defence)
  const { name, email, subject, message } = body;
  if (!name || !email || !email.includes('@') || !message) {
    return corsResponse(
      JSON.stringify({ error: 'Missing required fields' }), 400, origin, allowed
    );
  }

  // Honeypot — bots often send a _gotcha value
  if (body._gotcha) {
    // Return 200 so bots think it worked, but do nothing
    return corsResponse(JSON.stringify({ success: true }), 200, origin, allowed);
  }

  // Forward to Web3Forms with the secret key added server-side
  const upstream = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_KEY,
      name,
      email,
      subject:   subject || 'Message from Usul Learning website',
      message,
      from_name: 'Usul Learning Contact Form',
      redirect:  'false',
    }),
  });

  const data = await upstream.json();

  if (data.success) {
    return corsResponse(JSON.stringify({ success: true }), 200, origin, allowed);
  } else {
    return corsResponse(
      JSON.stringify({ error: data.message || 'Submission failed' }), 502, origin, allowed
    );
  }
}


/* ── Subscribe → Brevo ────────────────────────────────────── */

async function handleSubscribe(request, env, origin, allowed) {
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, origin, allowed);
  }

  const { email } = body;
  if (!email || !email.includes('@')) {
    return corsResponse(JSON.stringify({ error: 'Invalid email' }), 400, origin, allowed);
  }

  const listId = parseInt(env.BREVO_LIST_ID, 10);
  if (!listId) {
    return corsResponse(
      JSON.stringify({ error: 'List not configured' }), 500, origin, allowed
    );
  }

  // Forward to Brevo with the secret key added server-side
  const upstream = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept:         'application/json',
      'api-key':      env.BREVO_KEY,
    },
    body: JSON.stringify({
      email,
      listIds:       [listId],
      updateEnabled: true,
      attributes:    { SOURCE: 'usullearning.com' },
    }),
  });

  // 201 = created, 204 = already exists — both are success
  if (upstream.status === 201 || upstream.status === 204) {
    return corsResponse(JSON.stringify({ success: true }), 200, origin, allowed);
  }

  const data = await upstream.json().catch(() => ({}));
  return corsResponse(
    JSON.stringify({ error: data.message || 'Subscription failed' }), 502, origin, allowed
  );
}


/* ── CORS helper ──────────────────────────────────────────── */

function corsResponse(body, status, origin, allowed) {
  const headers = {
    'Content-Type':                'application/json',
    'Access-Control-Allow-Origin': origin === allowed ? allowed : 'null',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'X-Content-Type-Options':      'nosniff',
  };
  return new Response(body, { status, headers });
}
