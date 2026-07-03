// Rate limiting should be handled through Cloudflare WAF/Turnstile/KV in a future phase, not in-memory Worker state.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/download/volume-1') {
      return handleVolumeOneDownload(request, env);
    }

    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || 'https://usullearning.com';

    // Normalise www → apex so users arriving via https://www.usullearning.com
    // are not rejected. The browser sends the origin of the page they loaded,
    // which may be the www variant if the www→apex redirect ever fails or if
    // a user bookmarked the www URL directly.
    const effectiveOrigin = origin.replace(/^https:\/\/www\./, 'https://');
    const effectiveAllowed = allowed.replace(/^https:\/\/www\./, 'https://');

    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, effectiveOrigin, effectiveAllowed);
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, effectiveOrigin, effectiveAllowed);
    }

    if (effectiveOrigin !== effectiveAllowed) {
      return corsResponse(JSON.stringify({ error: 'Forbidden' }), 403, effectiveOrigin, effectiveAllowed);
    }

    if (url.pathname === '/api/subscribe') {
      return handleSubscribe(request, env, effectiveOrigin, effectiveAllowed);
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404, effectiveOrigin, effectiveAllowed);
  },
};

async function handleVolumeOneDownload(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        Allow: 'GET, HEAD',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const object = await env.BOOKS_BUCKET.get('essentials-shafii-worship-volume-1-review-edition.pdf');

  if (!object) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="essentials-shafii-worship-volume-1-review-edition.pdf"',
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
  });

  if (object.httpEtag) {
    headers.set('ETag', object.httpEtag);
  }

  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

async function handleSubscribe(request, env, origin, allowed) {
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, origin, allowed);
  }

  const { email } = body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return corsResponse(JSON.stringify({ error: 'Invalid email' }), 400, origin, allowed);
  }

  // BREVO_LIST_ID must be set and valid; no fallback to prevent misconfiguration
  if (!env.BREVO_LIST_ID || isNaN(parseInt(env.BREVO_LIST_ID, 10))) {
    return corsResponse(JSON.stringify({ error: 'Server configuration error' }), 500, origin, allowed);
  }
  const listId = parseInt(env.BREVO_LIST_ID, 10);

  if (!env.BREVO_KEY) {
    console.error('Subscribe Worker configuration error: missing Brevo API key');
    return corsResponse(JSON.stringify({ error: 'Server configuration error' }), 500, origin, allowed);
  }

  const upstream = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': env.BREVO_KEY,
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
      attributes: { SOURCE: 'usullearning.com' },
    }),
  });

  if (upstream.status === 200 || upstream.status === 201 || upstream.status === 204) {
    return corsResponse(JSON.stringify({ success: true }), 200, origin, allowed);
  }

  const data = await upstream.json().catch(() => ({}));
  return corsResponse(
    JSON.stringify({ error: data.message || 'Subscription failed' }),
    502,
    origin,
    allowed
  );
}

function corsResponse(body, status, origin, allowed) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'X-Content-Type-Options': 'nosniff',
  };
  // Only set the CORS header when the origin matches - never set it to the
  // string 'null', which browsers treat as a non-matching value and block.
  if (origin === allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
  }
  return new Response(body, { status, headers });
}
