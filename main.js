/* ============================================================
   Usul Learning — main.js
   Frontend for Worker endpoints
   ============================================================ */

// Contact goes directly to Web3Forms from the browser (free plan, no server-side proxy needed).
// Web3Forms access keys are explicitly safe to expose in client-side code.
const CONTACT_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_KEY = '2e08d270-7507-4f31-a552-3aa165969329';
const SUBSCRIBE_URL = '/api/subscribe';

/* ── DEVICE CAPABILITY DETECTION ───────────────────────────── */

// Batch all layout reads (innerWidth) and media queries BEFORE writing body
// classes, so we never read a geometric property after invalidating layout
// (avoids a forced synchronous reflow at startup).
const noHover = !window.matchMedia('(hover: hover)').matches;
const isSmallScreen = window.innerWidth < 600;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (noHover) {
  document.body.classList.add('no-hover');
}
if (isSmallScreen || prefersReducedMotion) {
  document.body.classList.add('reduce-motion');
}

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector('.nav__toggle');
  const mobileNav = document.querySelector('.nav__mobile');
  const header = document.querySelector('header[role="banner"]');
  if (mobileNav && header && !header.contains(mobileNav)) header.appendChild(mobileNav);

  if (toggle) toggle.setAttribute('aria-expanded', 'false');

  toggle?.addEventListener('click', () => {
    const isOpen = mobileNav?.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    const spans = toggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  document.querySelectorAll('.nav__mobile .nav__link').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.querySelectorAll('span')?.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav?.classList.contains('open')) {
      mobileNav.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.querySelectorAll('span')?.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      toggle?.focus();
    }
  });

  const _path = window.location.pathname.replace(/\/$/, '');
  const currentPage = (_path === '' || _path === '/') ? '/' : _path.split('/').pop();
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = (link.getAttribute('href') || '').replace(/\/$/, '');
    if (href === currentPage || (currentPage === '/' && (href === '' || href === '/'))) {
      link.classList.add('active');
    }
  });

  const fadeEls = document.querySelectorAll('.fade-up');
  if (isSmallScreen || prefersReducedMotion) {
    fadeEls.forEach(el => el.classList.add('visible'));
  } else if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });
    fadeEls.forEach(el => obs.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  setTimeout(() => {
    fadeEls.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
    });
  }, 100);

  const cookieBanner = document.getElementById('cookieBanner');
  const cookieAccept = document.getElementById('cookieAccept');
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

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 768 && mobileNav?.classList.contains('open')) {
        mobileNav.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
        toggle?.querySelectorAll('span')?.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    }, 150);
  }, { passive: true });

  // ── Form button wiring (replaces inline onclick attributes) ──────────────
  // Contact form
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', handleContact);
  contactForm
    ?.querySelectorAll('#name, #email, #subject, #message')
    .forEach(field => {
      field.addEventListener('input', () => {
        if (!field.required || field.checkValidity()) {
          field.removeAttribute('aria-invalid');
        }
      });
    });

  // Books page — print edition interest
  wireNotifyForm('notifyPODForm', 'notifyEmailPOD', 'notifyPODBtn', 'notifyPODStatus');

});

/* ============================================================
   CONTACT FORM
   ============================================================ */

function handleContact(event) {
  event?.preventDefault();

  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const subjectEl = document.getElementById('subject');
  const msgEl = document.getElementById('message');
  const btn = document.querySelector('.contact__form .btn--primary');

  const name = nameEl?.value?.trim();
  const email = emailEl?.value?.trim();
  const subject = subjectEl?.value?.trim();
  const message = msgEl?.value?.trim();

  clearContactInvalid([nameEl, emailEl, subjectEl, msgEl]);
  setContactStatus('');

  if (!name) return showContactError(nameEl, 'Please enter your name.');
  if (!email || !emailEl?.checkValidity()) return showContactError(emailEl, 'Please enter a valid email address.');
  if (!message) return showContactError(msgEl, 'Please write your message.');

  if (document.querySelector('input[name="_gotcha"]')?.value) return;
  if (isContactRateLimited()) return;

  const orig = btn?.textContent || 'Send Message';
  setBtn(btn, 'Sending…', false);
  setContactStatus('Sending…');

  fetch(CONTACT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      name,
      email,
      subject: subject || 'Message from Usul Learning website',
      message,
      from_name: 'Usul Learning Contact Form',
    }),
  })
    .then(r => {
      // Read the body first regardless of status so we can surface the real
      // Web3Forms error message (e.g. "unverified key") instead of just "HTTP 500".
      return r.json().then(data => ({ ok: r.ok, status: r.status, data }));
    })
    .then(({ ok, status, data }) => {
      if (data.success) {
        setBtn(btn, 'Message Sent ✓', false, '#0d4a47');
        [nameEl, emailEl, subjectEl, msgEl].forEach(el => { if (el) el.value = ''; });
        clearContactInvalid([nameEl, emailEl, subjectEl, msgEl]);
        setContactStatus('Message Sent ✓');
        setTimeout(() => { window.location.href = 'thank-you'; }, 1200);
      } else {
        // Log the full Web3Forms response so the real reason is visible in console.
        console.error('Web3Forms response:', status, data);
        throw new Error(data.message || ('HTTP ' + status));
      }
    })
    .catch(err => {
      setBtn(btn, orig, true);
      // TypeError means a network-level block (ad blocker, CORS, offline).
      // Give the user a specific, actionable message rather than a generic one.
      if (err instanceof TypeError) {
        showContactFailure('Your browser or an extension blocked the form. Please disable your ad blocker for this site, or email us at contact@usullearning.com');
      } else {
        console.error('Contact form:', err.message);
        showContactFailure('Could not send — ' + err.message + '. Please email contact@usullearning.com');
      }
    });
}

/* ============================================================
   SUBSCRIPTIONS
   ============================================================ */

function wireNotifyForm(formId, inputId, btnId, statusId) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);

  form?.addEventListener('submit', event =>
    handleNotifySubmit(event, inputId, btn, statusId, SUBSCRIBE_URL)
  );

  input?.addEventListener('input', () => {
    if (input.checkValidity()) {
      input.removeAttribute('aria-invalid');
    }
  });
}

function handleNotifySubmit(event, inputId, btnEl, statusId, url) {
  event?.preventDefault();

  const input = document.getElementById(inputId);
  const email = input?.value?.trim();

  input?.removeAttribute('aria-invalid');
  setNotifyStatus(statusId, '');

  if (!email || !input?.checkValidity()) {
    const message = 'Please enter a valid email address.';
    input?.setAttribute('aria-invalid', 'true');
    setNotifyStatus(statusId, message);
    input?.focus();
    return;
  }

  if (isNotifyRateLimited('subscribe_' + inputId, statusId, 10000)) return;

  const orig = btnEl?.textContent || 'Notify Me';
  setBtn(btnEl, 'Adding you…', false);
  setNotifyStatus(statusId, 'Adding you…');

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email }),
  })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      if (!(data.success || data.ok)) throw new Error(data.error || 'Failed');
      setBtn(btnEl, 'Subscribed ✓', false, '#0d4a47', 'var(--gold-pale)');
      setNotifyStatus(statusId, 'Subscribed ✓');
      if (input) input.value = '';
      input?.removeAttribute('aria-invalid');
      setTimeout(() => setBtn(btnEl, orig, true), 3500);
    })
    .catch(err => {
      console.error('Subscription:', err);
      setBtn(btnEl, orig, true);
      setNotifyStatus(statusId, 'Could not subscribe. Email contact@usullearning.com to be added.');
    });
}


/* ============================================================
   HELPERS
   ============================================================ */

function setBtn(btn, text, enabled, bg = '', color = '') {
  if (!btn) return;
  btn.textContent = text;
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? '' : '0.8';
  btn.style.background = bg;
  btn.style.color = color;
}

function setContactStatus(msg, role = 'status', live = 'polite') {
  const status = document.getElementById('contactFormStatus');
  if (!status) return;
  status.setAttribute('role', role);
  status.setAttribute('aria-live', live);
  status.textContent = msg;
}

function clearContactInvalid(fields) {
  fields.forEach(field => field?.removeAttribute('aria-invalid'));
}

function showContactError(field, msg) {
  field?.setAttribute('aria-invalid', 'true');
  setContactStatus(msg, 'alert', 'assertive');
  field?.focus();
  showError(msg);
}

function showContactFailure(msg) {
  setContactStatus(msg, 'alert', 'assertive');
  showError(msg);
}

function setNotifyStatus(statusId, msg) {
  const status = document.getElementById(statusId);
  if (!status) return;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = !msg;
  status.textContent = msg;
}

function isContactRateLimited() {
  const now = Date.now();
  if (_rateLimits.contact && now - _rateLimits.contact < 30000) {
    const remaining = Math.ceil((30000 - (now - _rateLimits.contact)) / 1000);
    const msg = `Please wait ${remaining} seconds before trying again.`;
    showContactFailure(msg);
    return true;
  }
  _rateLimits.contact = now;
  return false;
}

function isNotifyRateLimited(key, statusId, limitMs = 30000) {
  const now = Date.now();
  if (_rateLimits[key] && now - _rateLimits[key] < limitMs) {
    const remaining = Math.ceil((limitMs - (now - _rateLimits[key])) / 1000);
    setNotifyStatus(statusId, `Please wait ${remaining} seconds before trying again.`);
    return true;
  }
  _rateLimits[key] = now;
  return false;
}

function showError(msg, nearId) {
  document.querySelectorAll('.ul-form-error').forEach(el => el.remove());
  const el = document.createElement('p');
  el.className = 'ul-form-error';
  el.textContent = msg;
  el.style.cssText = 'color:#c0392b;font-size:0.82rem;margin-top:10px;font-weight:500;';
  const anchor = nearId
    ? (document.getElementById(nearId)?.closest('.form-group') ?? document.getElementById(nearId))
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
