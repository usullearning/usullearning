export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const email = (data.email || '').trim();

    if (!email || !email.includes('@')) {
      return Response.json({ ok: false, success: false, error: 'Valid email required' }, { status: 400 });
    }

    return Response.json({ ok: true, success: true, message: 'Interest received' });
  } catch {
    return Response.json({ ok: false, success: false, error: 'Invalid request' }, { status: 400 });
  }
}
