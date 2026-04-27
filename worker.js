export default {
  async fetch(request, env) {
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

    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      return handleContact(request, env, effectiveOrigin, effectiveAllowed);
    }

    if (url.pathname === '/api/subscribe') {
      return handleSubscribe(request, env, effectiveOrigin, effectiveAllowed);
    }

    return corsResponse(JSON.stringify({ error: 'Not found' }), 404, effectiveOrigin, effectiveAllowed);
  },
};

async function handleContact(request, env, origin, allowed) {
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400, origin, allowed);
  }

  const { name, email, subject, message } = body;
  if (!name || !email || !email.includes('@') || !message) {
    return corsResponse(JSON.stringify({ error: 'Missing required fields' }), 400, origin, allowed);
  }

  if (body._gotcha) {
    return corsResponse(JSON.stringify({ success: true }), 200, origin, allowed);
  }

  const upstream = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: env.WEB3FORMS_KEY,
      name,
      email,
      subject: subject || 'Message from Usul Learning website',
      message,
      from_name: 'Usul Learning Contact Form',
      redirect: 'false',
    }),
  });

  const data = await upstream.json();

  if (data.success) {
    return corsResponse(JSON.stringify({ success: true }), 200, origin, allowed);
  }

  return corsResponse(
    JSON.stringify({ error: data.message || 'Submission failed' }),
    502,
    origin,
    allowed
  );
}

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
    return corsResponse(JSON.stringify({ error: 'List not configured' }), 500, origin, allowed);
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
  // Only set the CORS header when the origin matches — never set it to the
  // string 'null', which browsers treat as a non-matching value and block.
  if (origin === allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
  }
  return new Response(body, { status, headers });
}
