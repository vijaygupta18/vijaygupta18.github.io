/* ────────────────────────────────────────────────
   Vijay Gupta Portfolio — index.js
   Clean, focused, no complex carousel/particles
   ──────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── Theme ── */
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const stored = localStorage.getItem('vg-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initTheme = stored || (prefersDark ? 'dark' : 'light');
  html.setAttribute('data-theme', initTheme);
  updateThemeIcon(initTheme);

  themeBtn && themeBtn.addEventListener('click', () => {
    const cur = html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('vg-theme', next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(t) {
    if (!themeBtn) return;
    themeBtn.textContent = t === 'dark' ? '☀' : '◑';
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  /* ── Portfolio version switcher ── */
  const switcher = document.getElementById('portfolioSwitcher');
  switcher && switcher.addEventListener('change', e => {
    window.location.href = e.target.value;
  });

  /* ── Mobile menu ── */
  const menuBtn = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  menuBtn && menuBtn.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => {
      navMenu && navMenu.classList.remove('open');
      menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Resume modal ── */
  const modal = document.getElementById('resumeModal');
  const closeBtn = document.getElementById('resumeClose');
  function openModal() { modal && modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal() { modal && modal.classList.remove('active'); document.body.style.overflow = ''; }

  document.getElementById('resumeBtn') && document.getElementById('resumeBtn').addEventListener('click', e => { e.preventDefault(); openModal(); });
  document.getElementById('resumeNavBtn') && document.getElementById('resumeNavBtn').addEventListener('click', e => { e.preventDefault(); openModal(); });
  closeBtn && closeBtn.addEventListener('click', closeModal);
  modal && modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ── Scroll progress ── */
  const bar = document.getElementById('scrollProgress');
  function updateProgress() {
    if (!bar) return;
    const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = (window.scrollY / total * 100) + '%';
  }

  /* ── Header scroll class ── */
  const header = document.getElementById('header');
  function onScroll() {
    updateProgress();
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Active nav on scroll ── */
  function updateActiveNav() {
    const links = document.querySelectorAll('.nav-link[href^="#"]');
    const offset = (header ? header.offsetHeight : 60) + 20;
    let current = '';
    document.querySelectorAll('section[id]').forEach(s => {
      if (window.scrollY >= s.offsetTop - offset) current = s.id;
    });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  }

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.offsetTop - (header ? header.offsetHeight : 60);
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  });

  /* ── Fade-in on scroll ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));

  /* ── Animated counters ── */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        counterIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  function animateCount(el) {
    const target = +el.getAttribute('data-count');
    const dur = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor(p * p * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }
  document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

  /* ── Typing animation ── */
  const typeEl = document.getElementById('dynamicText');
  const roles = [
    'Software Engineer',
    'Backend Developer',
    'System Architect',
    'Performance Engineer',
    'Cloud Infrastructure Expert',
    'Distributed Systems Builder'
  ];
  let ri = 0, ci = 0, deleting = false;

  function type() {
    if (!typeEl) return;
    const word = roles[ri];
    if (deleting) {
      typeEl.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; setTimeout(type, 400); return; }
      setTimeout(type, 45);
    } else {
      typeEl.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(type, 2200); return; }
      setTimeout(type, 95);
    }
  }
  setTimeout(type, 1200);

  /* ── Contact form (EmailJS) ── */
  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: 'JJYrlbmwaCoxBgcHG', blockHeadless: true, limitRate: { id: 'app', throttle: 10000 } });
  }

  const form = document.getElementById('contactForm');
  let submitting = false, lastSent = 0;

  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitting) return;
    if (Date.now() - lastSent < 10000) { notify('Please wait before sending again.', 'error'); return; }
    submitting = true;
    const btn = form.querySelector('button[type=submit]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spin">◌</span> Sending…';
    btn.disabled = true;
    try {
      const fd = new FormData(form);
      const name = fd.get('name').trim();
      const email = fd.get('email').trim();
      const subject = fd.get('subject').trim() || 'Portfolio Contact';
      const message = fd.get('message').trim();
      if (!name || name.length < 2) throw new Error('Please enter your name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email.');
      if (!message || message.length < 10) throw new Error('Message must be at least 10 characters.');
      const clean = s => s.replace(/<[^>]*>/g, '').substring(0, 2000);
      await emailjs.send('service_4wre7f9', 'template_4alqdiv', {
        name: clean(name), email: clean(email), title: clean(subject),
        subject: 'Contact: ' + clean(subject), reply_to: clean(email),
        message: `📋 ${clean(subject)}\n\n${clean(message)}\n\nFrom: ${clean(email)}`,
        time: new Date().toLocaleString()
      });
      lastSent = Date.now();
      form.reset();
      notify('Message sent! I\u2019ll get back to you soon.', 'success');
    } catch (err) {
      notify(err.message || 'Failed to send. Email me directly: vijayrauniyar1818@gmail.com', 'error');
    } finally {
      submitting = false; btn.innerHTML = orig; btn.disabled = false;
    }
  });

  /* ── Notify ── */
  function notify(msg, type) {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    const n = document.createElement('div');
    n.className = 'notification notification-' + type;
    n.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()" aria-label="Close">×</button>`;
    document.body.appendChild(n);
    requestAnimationFrame(() => n.classList.add('show'));
    setTimeout(() => n && n.remove(), 5000);
  }

  /* ── Projects filter ── */
  const filterBtns = document.querySelectorAll('[data-filter]');
  const projectCards = document.querySelectorAll('.project-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.getAttribute('data-filter');
      projectCards.forEach(c => {
        const cats = c.getAttribute('data-category') || '';
        c.style.display = (f === 'all' || cats.includes(f)) ? '' : 'none';
      });
    });
  });

  /* ── Loader hide ── */
  const loader = document.getElementById('loader');
  loader && loader.classList.add('hidden');

})();
