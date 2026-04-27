export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const subject = (data.subject || '').trim();
    const message = (data.message || '').trim();

    if (!name || !email || !email.includes('@') || !message) {
      return Response.json({ ok: false, success: false, error: 'Missing required fields' }, { status: 400 });
    }

    return Response.json({ ok: true, success: true, message: 'Contact received' });
  } catch {
    return Response.json({ ok: false, success: false, error: 'Invalid request' }, { status: 400 });
  }
}
