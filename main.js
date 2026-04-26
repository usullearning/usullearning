/* ============================================================
   Usul Learning — main.js
   All API calls are routed through the Cloudflare Worker proxy.
   No keys or credentials are stored in this file.
   ============================================================ */

const CONTACT_URL   = '/api/contact';
const SUBSCRIBE_URL = '/api/subscribe';

/* ── DEVICE CAPABILITY DETECTION ───────────────────────────── */

// Touch-only devices: disable hover-based transforms
if (!window.matchMedia('(hover: hover)').matches) {
  document.body.classList.add('no-hover');
}

// Disable animations on very small screens or low-end devices
const isSmallScreen = window.innerWidth < 600;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isSmallScreen || prefersReducedMotion) {
  document.body.classList.add('reduce-motion');
}

document.addEventListener('DOMContentLoaded', () => {

  /* ── Nav scroll state ────────────────────────────────────── */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile nav toggle (aria-expanded) ──────────────────── */
  const toggle    = document.querySelector('.nav__toggle');
  const mobileNav = document.querySelector('.nav__mobile');

  // Ensure mobile nav is inside header for landmark semantics
  const header = document.querySelector('header[role="banner"]');
  if (mobileNav && header && !header.contains(mobileNav)) {
    header.appendChild(mobileNav);
  }

  if (toggle) toggle.setAttribute('aria-expanded', 'false');

  toggle?.addEventListener('click', () => {
    const isOpen = mobileNav?.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const spans = toggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Close on mobile link click
  document.querySelectorAll('.nav__mobile .nav__link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.querySelectorAll('span')
             ?.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav?.classList.contains('open')) {
      mobileNav.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.querySelectorAll('span')
             ?.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      toggle?.focus();
    }
  });

  /* ── Active nav link ─────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── Fade-up scroll animations ───────────────────────────── */
  const fadeEls = document.querySelectorAll('.fade-up');

  // Skip animations on small screens or reduced motion
  if (isSmallScreen || prefersReducedMotion) {
    fadeEls.forEach(el => el.classList.add('visible'));
  } else if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.05 });
    fadeEls.forEach(el => obs.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  // Catch elements already in viewport on load
  setTimeout(() => {
    fadeEls.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
    });
  }, 100);

  /* ── Cookie Consent Banner ───────────────────────────────── */
  const cookieBanner  = document.getElementById('cookieBanner');
  const cookieAccept  = document.getElementById('cookieAccept');
  const cookieDecline = document.getElementById('cookieDecline');

  if (cookieBanner && !localStorage.getItem('ul_cookie_consent')) {
    cookieBanner.classList.remove('hidden');
  }
  cookieAccept?.addEventListener('click', () => {
    localStorage.setItem('ul_cookie_consent', 'accepted');
    cookieBanner.classList.add('hidden');
  });
  cookieDecline?.addEventListener('click', () => {
    localStorage.setItem('ul_cookie_consent', 'declined');
    cookieBanner.classList.add('hidden');
  });

  /* ── Responsive: re-check on resize ─────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Close mobile nav if viewport grows past mobile breakpoint
      if (window.innerWidth >= 768 && mobileNav?.classList.contains('open')) {
        mobileNav.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.querySelectorAll('span')
               ?.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    }, 150);
  }, { passive: true });

});


/* ============================================================
   CONTACT FORM  (via Cloudflare Worker)
   ============================================================ */

function handleContact() {
  const nameEl    = document.getElementById('name');
  const emailEl   = document.getElementById('email');
  const subjectEl = document.getElementById('subject');
  const msgEl     = document.getElementById('message');
  const btn       = document.querySelector('.contact__form .btn--primary');

  const name    = nameEl?.value?.trim();
  const email   = emailEl?.value?.trim();
  const subject = subjectEl?.value?.trim();
  const message = msgEl?.value?.trim();

  if (!name)                          { nameEl?.focus();  return showError('Please enter your name.'); }
  if (!email || !email.includes('@')) { emailEl?.focus(); return showError('Please enter a valid email address.'); }
  if (!message)                       { msgEl?.focus();   return showError('Please write your message.'); }

  // Honeypot — silently discard bot submissions
  if (document.querySelector('input[name="_gotcha"]')?.value) return;

  // Rate limiting
  if (isRateLimited('contact', 30000)) return;

  const orig = btn?.textContent || 'Send Message';
  setBtn(btn, 'Sending…', false);

  fetch(CONTACT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, email, subject, message }),
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      setBtn(btn, 'Message Sent ✓', false, '#0d4a47');
      [nameEl, emailEl, subjectEl, msgEl].forEach(el => { if (el) el.value = ''; });
      setTimeout(() => setBtn(btn, orig, true), 4000);
    } else {
      throw new Error(data.error || 'Submission failed');
    }
  })
  .catch(err => {
    console.error('Contact form:', err);
    setBtn(btn, orig, true);
    showError('Could not send. Please email us directly at contact@usullearning.com');
  });
}


/* ============================================================
   SUBSCRIPTIONS  (via Cloudflare Worker)
   ============================================================ */

function handleNotifySubmit(inputId, btnEl) {
  const input = document.getElementById(inputId);
  const email = input?.value?.trim();

  if (!email || !email.includes('@')) { input?.focus(); return; }
  if (isRateLimited('subscribe_' + inputId, 10000)) return;

  const orig = btnEl?.textContent || 'Notify Me';
  setBtn(btnEl, 'Adding you…', false);

  fetch(SUBSCRIBE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email }),
  })
  .then(r => r.json())
  .then(data => {
    if (!data.success) throw new Error(data.error || 'Failed');
    setBtn(btnEl, 'Subscribed ✓', false, '#0d4a47', 'var(--gold-pale)');
    if (input) input.value = '';
    setTimeout(() => setBtn(btnEl, orig, true), 3500);
  })
  .catch(err => {
    console.error('Subscription:', err);
    setBtn(btnEl, orig, true);
    showError('Could not subscribe. Email contact@usullearning.com to be added.', inputId);
  });
}

function handleNotify(event)       { handleNotifySubmit('notifyEmail', event?.target); }
function handleNotifyFooter(event) { handleNotifySubmit('notifyEmailFooter', event?.target); }
function handleNotifyPOD(event)    { handleNotifySubmit('notifyEmailPOD', event?.target); }


/* ============================================================
   HELPERS
   ============================================================ */

function setBtn(btn, text, enabled, bg = '', color = '') {
  if (!btn) return;
  btn.textContent      = text;
  btn.disabled         = !enabled;
  btn.style.opacity    = enabled ? '' : '0.8';
  btn.style.background = bg;
  btn.style.color      = color;
}

function showError(msg, nearId) {
  document.querySelectorAll('.ul-form-error').forEach(el => el.remove());
  const el = document.createElement('p');
  el.className   = 'ul-form-error';
  el.textContent = msg;
  el.style.cssText = 'color:#c0392b;font-size:0.82rem;margin-top:10px;font-weight:500;';
  const anchor = nearId
    ? document.getElementById(nearId)?.closest('.form-group')
    : document.querySelector('.contact__form .btn--primary');
  anchor?.insertAdjacentElement('afterend', el);
  setTimeout(() => el.remove(), 6000);
}

const _rateLimits = {};
function isRateLimited(key, limitMs = 30000) {
  const now = Date.now();
  if (_rateLimits[key] && now - _rateLimits[key] < limitMs) {
    const remaining = Math.ceil((limitMs - (now - _rateLimits[key])) / 1000);
    showError(`Please wait ${remaining} seconds before trying again.`);
    return true;
  }
  _rateLimits[key] = now;
  return false;
}
