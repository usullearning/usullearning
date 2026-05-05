/* ============================================================
   Usul Learning — main.js
   Frontend for Worker endpoints
   ============================================================ */

// Contact goes directly to Web3Forms from the browser (free plan, no server-side proxy needed).
// Web3Forms access keys are explicitly safe to expose in client-side code.
const CONTACT_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_KEY = '2e08d270-7507-4f31-a552-3aa165969329'; // replace with your actual key
const SUBSCRIBE_URL = '/api/subscribe';

/* ── DEVICE CAPABILITY DETECTION ───────────────────────────── */

if (!window.matchMedia('(hover: hover)').matches) {
  document.body.classList.add('no-hover');
}

const isSmallScreen = window.innerWidth < 600;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  const _path = window.location.pathname;
  const currentPage = (_path === '/' || _path === '/index.html') ? '/' : _path.split('/').pop();
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '/' && (href === '/' || href === 'index.html'))) {
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
  document.getElementById('contactSubmitBtn')
    ?.addEventListener('click', handleContact);

  // Books page — print edition interest
  const podBtn = document.getElementById('notifyPODBtn');
  if (podBtn) {
    podBtn.addEventListener('click', () =>
      handleNotifySubmit('notifyEmailPOD', podBtn, SUBSCRIBE_URL)
    );
  }

  // Books page — volume notifications footer form
  const footerBtn = document.getElementById('notifyFooterBtn');
  if (footerBtn) {
    footerBtn.addEventListener('click', () =>
      handleNotifySubmit('notifyEmailFooter', footerBtn, SUBSCRIBE_URL)
    );
  }
});

/* ============================================================
   CONTACT FORM
   ============================================================ */

function handleContact() {
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const subjectEl = document.getElementById('subject');
  const msgEl = document.getElementById('message');
  const btn = document.querySelector('.contact__form .btn--primary');

  const name = nameEl?.value?.trim();
  const email = emailEl?.value?.trim();
  const subject = subjectEl?.value?.trim();
  const message = msgEl?.value?.trim();

  if (!name) { nameEl?.focus(); return showError('Please enter your name.'); }
  if (!email || !email.includes('@')) { emailEl?.focus(); return showError('Please enter a valid email address.'); }
  if (!message) { msgEl?.focus(); return showError('Please write your message.'); }

  if (document.querySelector('input[name="_gotcha"]')?.value) return;
  if (isRateLimited('contact', 30000)) return;

  const orig = btn?.textContent || 'Send Message';
  setBtn(btn, 'Sending…', false);

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
        setTimeout(() => { window.location.href = 'thank-you.html'; }, 1200);
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
        showError('Your browser or an extension blocked the form. Please disable your ad blocker for this site, or email us at contact@usullearning.com');
      } else {
        console.error('Contact form:', err.message);
        showError('Could not send — ' + err.message + '. Please email contact@usullearning.com');
      }
    });
}

/* ============================================================
   SUBSCRIPTIONS
   ============================================================ */

function handleNotifySubmit(inputId, btnEl, url) {
  const input = document.getElementById(inputId);
  const email = input?.value?.trim();

  if (!email || !email.includes('@')) { input?.focus(); return; }
  if (isRateLimited('subscribe_' + inputId, 10000)) return;

  const orig = btnEl?.textContent || 'Notify Me';
  setBtn(btnEl, 'Adding you…', false);

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
      if (input) input.value = '';
      setTimeout(() => setBtn(btnEl, orig, true), 3500);
    })
    .catch(err => {
      console.error('Subscription:', err);
      setBtn(btnEl, orig, true);
      showError('Could not subscribe. Email contact@usullearning.com to be added.', inputId);
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
