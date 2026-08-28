/* ═══════════════════════════════════════════════════════════
   WexForge — main.js
   ═══════════════════════════════════════════════════════════ */
'use strict';

const isMobile = window.innerWidth <= 768;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getApiBase() {
  const h = window.location.hostname;
  return (h.includes('vercel.app') || h.includes('wexforge.com'))
    ? 'https://wexforge.onrender.com' : '';
}
function wakeBackend() {
  try { fetch(getApiBase() + '/api/health', { method: 'GET' }); } catch { /**/ }
}

/* ── Intro / 3D Preloader ────────────────────────────────── */
const intro = document.getElementById('intro');
const introFill = document.getElementById('intro-fill');
const introPct = document.getElementById('intro-pct');
function closeIntro() {
  if (!intro || intro.classList.contains('intro-exit')) return;
  intro.classList.add('intro-exit');
  document.body.style.overflow = '';
  setTimeout(() => { intro.style.display = 'none'; }, 800);
}
function runIntro() {
  if (!intro) return;
  document.body.style.overflow = 'hidden';
  const MIN_SHOW = 1900; // let the 3D name/logo animation finish before it can close
  const start = performance.now();
  let p = 0;
  const tick = () => {
    p += Math.random() * 14 + 6;
    if (p > 100) p = 100;
    if (introFill) introFill.style.width = p + '%';
    if (introPct) introPct.textContent = Math.floor(p) + '%';
    if (p < 100) {
      setTimeout(tick, 90);
    } else {
      const elapsed = performance.now() - start;
      setTimeout(closeIntro, Math.max(0, MIN_SHOW - elapsed));
    }
  };
  tick();
}
window.addEventListener('load', () => {
  reducedMotion ? closeIntro() : runIntro();
  wakeBackend();
});
setTimeout(closeIntro, 5000);

/* ── Everything else runs after DOM is ready ─────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Scroll progress ─────────────────────────────────── */
  const scrollBar = document.getElementById('scroll-progress');
  function updateScrollBar() {
    const d = document.documentElement;
    const pct = d.scrollTop / (d.scrollHeight - d.clientHeight) * 100;
    if (scrollBar) scrollBar.style.width = (pct || 0) + '%';
  }

  /* ── Nav ──────────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  function updateNav() {
    nav && nav.classList.toggle('scrolled', window.scrollY > 20);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => { updateScrollBar(); updateNav(); ticking = false; });
    ticking = true;
  }, { passive: true });
  updateNav(); updateScrollBar();

  /* ── Mobile nav ───────────────────────────────────────── */
  const burger = document.getElementById('nav-burger');
  const navLinks = document.getElementById('nav-links');
  burger && burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  navLinks && navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger && burger.classList.remove('open');
    burger && burger.setAttribute('aria-expanded', 'false');
  }));

  /* ── Scroll reveal ────────────────────────────────────── */
  function revealEl(el) { el.classList.add('in-view'); }

  // Hard fallback: force-reveal everything after 800ms no matter what
  const fallbackTimer = setTimeout(() => {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(revealEl);
  }, 800);

  const revealEls = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');

  if ('IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { revealEl(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    revealEls.forEach(el => io.observe(el));
    // Also immediately check anything already in viewport
    setTimeout(() => {
      revealEls.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) revealEl(el);
      });
      clearTimeout(fallbackTimer);
    }, 100);
  } else {
    // No IntersectionObserver or reduced motion — show everything immediately
    revealEls.forEach(revealEl);
    clearTimeout(fallbackTimer);
  }

  // Stagger delays
  document.querySelectorAll('[data-reveal-stagger]').forEach(parent => {
    Array.from(parent.children).forEach((child, i) => { child.style.transitionDelay = (i * 80) + 'ms'; });
  });

  /* ── Counters ─────────────────────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.counter, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const dur = 1400; const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll('[data-counter]');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(c => {
      // Show target value immediately as fallback
      c.textContent = c.dataset.counter + (c.dataset.suffix || '');
      cio.observe(c);
    });
    // Also trigger counters already in view
    setTimeout(() => {
      counters.forEach(c => {
        const r = c.getBoundingClientRect();
        if (r.top < window.innerHeight) { animateCounter(c); cio.unobserve(c); }
      });
    }, 200);
  } else {
    counters.forEach(c => { c.textContent = c.dataset.counter + (c.dataset.suffix || ''); });
  }

  /* ── Cursor glow + ambient orb parallax (fine pointer only) ── */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !isMobile && !reducedMotion) {
    const glow = document.getElementById('cursor-glow');
    if (glow) {
      let cx = 0, cy = 0, tx = window.innerWidth / 2, ty = window.innerHeight / 2;
      window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
      (function raf() {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        glow.style.left = cx + 'px'; glow.style.top = cy + 'px';
        requestAnimationFrame(raf);
      })();
    }
  }

  /* ── Magnetic buttons (fine pointer only) ─────────────── */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) * 0.18;
        const my = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = `translate(${mx}px, ${my}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ── Card tilt (desktop only) ────────────────────────── */
  if (!isMobile && !reducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(800px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ── Tech marquee ─────────────────────────────────────── */
  const track = document.getElementById('tech-track');
  if (track) track.innerHTML += track.innerHTML;

  /* ── Portfolio detail ─────────────────────────────────── */
  document.querySelectorAll('.view-details').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('SpaceX — concept/demo project showcasing WexForge process and code quality.');
    });
  });

  /* ── FAQ accordion ────────────────────────────────────── */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const oa = other.querySelector('.faq-a');
          if (oa) oa.style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = !isOpen ? a.scrollHeight + 'px' : null;
      q.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ── Contact form → Supabase ──────────────────────────── */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  function setFieldValid(fieldEl, valid) { fieldEl && fieldEl.classList.toggle('invalid', !valid); }

  function validateForm() {
    let ok = true;
    const name = document.getElementById('cf-name');
    const email = document.getElementById('cf-email');
    const message = document.getElementById('cf-message');
    const phone = document.getElementById('cf-phone');
    const nOk = name && name.value.trim().length > 1; setFieldValid(name && name.closest('.field'), nOk); if (!nOk) ok = false;
    const eOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()); setFieldValid(email && email.closest('.field'), eOk); if (!eOk) ok = false;
    const mOk = message && message.value.trim().length > 4; setFieldValid(message && message.closest('.field'), mOk); if (!mOk) ok = false;
    const pVal = phone ? phone.value.trim() : '';
    const pOk = pVal === '' || /^[+\d][\d\s-]{6,}$/.test(pVal);
    setFieldValid(phone && phone.closest('.field'), pOk); if (!pOk) ok = false;
    return ok;
  }

  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    const honeypot = document.getElementById('cf-honeypot');
    if (honeypot && honeypot.value !== '') return;
    if (!validateForm()) {
      if (status) { status.textContent = 'Please fix the highlighted fields.'; status.className = 'form-status show error'; }
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn ? btn.textContent : 'Send';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    if (status) { status.textContent = ''; status.className = 'form-status'; }
    try {
      const SB_URL = 'https://mueazgfeyguleygqsmhe.supabase.co';
      const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWF6Z2ZleWd1bGV5Z3FzbWhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM3MDI2MCwiZXhwIjoyMDk1OTQ2MjYwfQ.Ga0QhknZ7i4gU_KA39H_wd8TrcAxyvjrbfcB3ChZZds';
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
        received_at: new Date().toISOString(),
        name: document.getElementById('cf-name').value.trim(),
        email: document.getElementById('cf-email').value.trim(),
        phone: document.getElementById('cf-phone').value.trim() || null,
        company: document.getElementById('cf-company').value.trim() || null,
        project_type: document.getElementById('cf-type').value || null,
        budget: document.getElementById('cf-budget').value || null,
        message: document.getElementById('cf-message').value.trim(),
      };
      const res = await fetch(`${SB_URL}/rest/v1/contact_submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Prefer': 'return=minimal' },
        body: JSON.stringify(entry),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Save failed'); }
      if (status) { status.textContent = 'Thanks! Your message has been sent — WexForge will reply within one business day.'; status.className = 'form-status show success'; }
      form.reset();
    } catch (err) {
      if (status) { status.textContent = err.message || 'Something went wrong — please email aakibkhatri99@gmail.com'; status.className = 'form-status show error'; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = orig; }
    }
  });

  /* ── Back to top ──────────────────────────────────────── */
  const btt = document.getElementById('back-to-top');
  btt && btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));

  /* ── Footer year ──────────────────────────────────────── */
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

}); // end DOMContentLoaded
