/* ────────────────────────────────────────────────────
   features.js — Portfolio extras
   1. Interactive terminal (hero)
   2. Command palette  (⌘K / Ctrl+K)
   3. Section file-loading transitions
   ──────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     1. INTERACTIVE TERMINAL
  ═══════════════════════════════════════════ */

  const termBody   = document.getElementById('termBody');
  const termOutput = document.getElementById('termOutput');
  const termInput  = document.getElementById('termInput');

  /* ── scroll helper (used by terminal commands) ── */
  function scrollToSection(id) {
    const target = document.querySelector(id);
    if (!target) return;
    const header = document.getElementById('header');
    const top = target.offsetTop - (header ? header.offsetHeight : 70);
    setTimeout(() => window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }), 300);
  }

  if (termBody && termOutput && termInput) {
    const history = [];
    let   histIdx = -1;

    /* ── helpers ── */
    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function line(html, cls) {
      const d = document.createElement('div');
      d.className = 'tl' + (cls ? ' ' + cls : '');
      d.innerHTML = html;
      termOutput.appendChild(d);
      return d;
    }

    function blank() {
      const d = document.createElement('div');
      d.className = 'tl tl-blank';
      termOutput.appendChild(d);
    }

    function scrollBot() {
      termBody.scrollTop = termBody.scrollHeight;
    }

    function sep(char, len) {
      char = char || '─';
      len  = len  || 52;
      line('<span class="tc-border">' + char.repeat(len) + '</span>');
    }

    function printEcho(cmd) {
      line(
        '<span class="tc-ps1">vijay@portfolio:~$</span>&nbsp;<span class="tc-cmd">' + esc(cmd) + '</span>',
        'tl-echo'
      );
    }

    /* ── command registry ── */
    const CMDS = {

      help() {
        line('<span class="tc-accent">AVAILABLE COMMANDS</span>');
        sep();
        const rows = [
          ['whoami',     'who is vijay gupta?'],
          ['skills',     'tech stack'],
          ['experience', 'work history'],
          ['projects',   'things I\'ve built'],
          ['education',  'degrees & certifications'],
          ['contact',    'get in touch'],
          ['resume',     'open resume PDF'],
          ['clear',      'clear terminal'],
        ];
        rows.forEach(([cmd, desc]) => {
          line(
            '  <span class="tc-cmd">' + cmd.padEnd(14) + '</span>' +
            '<span class="tc-muted">— ' + desc + '</span>'
          );
        });
        sep();
        line('  <span class="tc-muted">↑↓ history · Tab autocomplete · also try: </span>' +
          '<span class="tc-cmd">git log</span>' +
          '<span class="tc-muted">, </span><span class="tc-cmd">man vijay</span>' +
          '<span class="tc-muted">, </span><span class="tc-cmd">sudo</span>');
      },

      whoami() {
        scrollToSection('#about');
        line('<span class="tc-accent">VIJAY GUPTA</span>');
        sep();
        const facts = [
          ['role',     'Software Development Engineer @ Juspay'],
          ['product',  'NammaYatri (India\'s largest open-source ride-hailing app)'],
          ['location', 'Bengaluru, India'],
          ['email',    'vijayrauniyar1818@gmail.com'],
          ['github',   'github.com/vijaygupta18'],
          ['leetcode', 'leetcode.com/rdxvijay'],
        ];
        facts.forEach(([k, v]) => {
          line(
            '  <span class="tc-key">' + k.padEnd(10) + '</span>' +
            '<span class="tc-muted">: </span>' +
            '<span class="tc-val">' + esc(v) + '</span>'
          );
        });
        blank();
        line('  Software Engineer with 3+ years designing scalable backend');
        line('  systems. Reduced latency by <span class="tc-accent">40%</span> and infra costs by <span class="tc-accent">50%</span>');
        line('  using Redis, AWS, and Haskell.');
        blank();
        sep('·');
        line(
          '  <span class="tc-accent">40%</span> latency cut  ' +
          '<span class="tc-muted">·</span>  ' +
          '<span class="tc-accent">50%</span> infra cost cut  ' +
          '<span class="tc-muted">·</span>  ' +
          '<span class="tc-accent">3+</span> years production'
        );
        sep('·');
      },

      skills() {
        scrollToSection('#skills');
        line('<span class="tc-muted">// Languages</span>');
        line(
          '<span class="tc-key">import</span> { ' +
          '<span class="tc-val">Haskell, Python, C++, JavaScript, PureScript, SQL</span>' +
          ' } <span class="tc-key">from</span> <span class="tc-str">"languages"</span>'
        );
        blank();
        line('<span class="tc-muted">// Data &amp; Messaging</span>');
        line(
          '<span class="tc-key">import</span> { ' +
          '<span class="tc-val">Redis, Valkey, Kafka, RabbitMQ, PostgreSQL, Clickhouse</span>' +
          ' } <span class="tc-key">from</span> <span class="tc-str">"data-layer"</span>'
        );
        blank();
        line('<span class="tc-muted">// Backend</span>');
        line(
          '<span class="tc-key">import</span> { ' +
          '<span class="tc-val">Node.js, Express, REST_APIs, Microservices</span>' +
          ' } <span class="tc-key">from</span> <span class="tc-str">"backend"</span>'
        );
        blank();
        line('<span class="tc-muted">// Cloud &amp; DevOps</span>');
        line(
          '<span class="tc-key">import</span> { ' +
          '<span class="tc-val">AWS, Kubernetes, Docker, Git, CI_CD</span>' +
          ' } <span class="tc-key">from</span> <span class="tc-str">"infrastructure"</span>'
        );
        blank();
        line('<span class="tc-muted">// Engineering focus</span>');
        line(
          '<span class="tc-key">const</span> <span class="tc-val">focus</span> = [' +
          '<span class="tc-str">"System Design"</span>, ' +
          '<span class="tc-str">"Performance Tuning"</span>, ' +
          '<span class="tc-str">"Distributed Systems"</span>, ' +
          '<span class="tc-str">"DSA &amp; OOP"</span>]'
        );
      },

      experience() {
        scrollToSection('#experience');
        /* ── Juspay ── */
        line(
          '  <span class="tc-accent">Juspay — NammaYatri</span>' +
          '  <span class="tc-muted">May 2023 – Present</span>'
        );
        line('  <span class="tc-muted">Software Development Engineer · Bengaluru</span>');
        sep('·');
        line('  <span class="tc-key">Cost Optimization &amp; Efficiency</span>');
        line('  <span class="tc-border">→</span> KV storage (Redis): DB cost cut <span class="tc-accent">40%</span>');
        line('  <span class="tc-border">→</span> Table sharding + Redis slot opt: nodes reduced <span class="tc-accent">30%</span>');
        line('  <span class="tc-border">→</span> AWS ALB cost down <span class="tc-accent">25%</span> via compression &amp; zone routing');
        line('  <span class="tc-border">→</span> Redis → Valkey + zstd: <span class="tc-accent">50%</span> memory &amp; instance cost drop');
        blank();
        line('  <span class="tc-key">Scalability &amp; Architecture</span>');
        line('  <span class="tc-border">→</span> Auto-scaling Redis/RDS via custom CloudWatch metrics');
        line('  <span class="tc-border">→</span> Multithreading in hot-path services, cut container needs');
        line('  <span class="tc-border">→</span> Decoupled drainer for async sync to Clickhouse &amp; PostgreSQL');
        blank();
        line('  <span class="tc-key">Performance &amp; Dev Efficiency</span>');
        line('  <span class="tc-border">→</span> Backend latency reduced <span class="tc-accent">40%</span> via profiling &amp; I/O opt');
        line('  <span class="tc-border">→</span> ART framework: QA time reduced <span class="tc-accent">60%</span>');
        line('  <span class="tc-border">→</span> Dynamic real-time pricing engine + ETA predictor');
        sep('·');
        blank();

        /* ── Vahan ── */
        line(
          '  <span class="tc-accent">Vahan</span>' +
          '  <span class="tc-muted">Jun 2022 – Apr 2023</span>'
        );
        line('  <span class="tc-muted">Software Development Engineer I · Bengaluru</span>');
        sep('·');
        line('  <span class="tc-border">→</span> WhatsApp Bot redesign: API time <span class="tc-accent">↓40%</span>, engagement <span class="tc-accent">↑35%</span>');
        line('  <span class="tc-border">→</span> Concurrent chat processing: telecalling costs <span class="tc-accent">↓32%</span>');
        line('  <span class="tc-border">→</span> Uber fallback mechanism: <span class="tc-accent">98%</span> data accuracy during outages');
        line('  <span class="tc-border">→</span> Automated status tracking via offline data warehouse uploads');
        sep('·');
      },

      projects() {
        scrollToSection('#projects');
        const hdr = '  ' + 'NAME'.padEnd(30) + 'STACK';
        line('<span class="tc-muted">' + esc(hdr) + '</span>');
        sep();
        const projects = [
          ['location-healthcheck', 'Haskell, Redis Streams',       null,                                             '@ Juspay'],
          ['master-oogway',        'Python, FastAPI, Prometheus',  'github.com/nammayatri/Master-Oogway',            '@ Juspay'],
          ['bus-route-tracker',    'Python, Redis, Clickhouse',    'github.com/nammayatri/bus-route-tracker',        '@ Juspay'],
          ['multi-cloud-db-mgr',   'TypeScript, PostgreSQL, Redis','github.com/vijaygupta18/Multi-Cloud-DB-Manager',  null],
          ['nodesage',             'Node.js, Ollama, RAG',        'github.com/vijaygupta18/NodeSage',               null],
          ['k8s-dashboard',        'FastAPI, React, Kubernetes',   'github.com/vijaygupta18/k8s-dashboard',          null],
          ['writemytext',          'JavaScript, Canvas API',       'github.com/vijaygupta18/writemytext',            null],
        ];
        projects.forEach(([name, stack, link, badge]) => {
          const nameCol = name.padEnd(30);
          const badgeHtml = badge ? ' <span class="tc-muted">' + badge + '</span>' : '';
          const linkHtml = link
            ? '  <a class="tc-link" href="https://' + link + '" target="_blank" rel="noopener">↗</a>'
            : '';
          line(
            '  <span class="tc-val">' + nameCol + '</span>' +
            '<span class="tc-muted">' + esc(stack) + '</span>' +
            badgeHtml + linkHtml
          );
        });
      },

      education() {
        scrollToSection('#education');
        line('<span class="tc-accent">DEGREES</span>');
        sep();
        line('  <span class="tc-val">B.Tech — Computer Science</span>');
        line('  <span class="tc-muted">Kamla Nehru Institute of Technology, Sultanpur</span>');
        line('  <span class="tc-key">Aug 2018 – Jun 2022</span>  <span class="tc-muted">·</span>  <span class="tc-accent">8.5 CGPA (Top 5%)</span>');
        blank();
        line('<span class="tc-accent">CERTIFICATIONS</span>');
        sep();
        const certs = [
          'Neural Networks & Deep Learning  — Coursera / DeepLearning.AI',
          'Improving Deep Neural Networks   — Coursera',
          'Problem Solving (Intermediate)   — HackerRank',
          'Python (Basic)                   — HackerRank',
          'JavaScript (Intermediate)        — HackerRank',
          'Complete Node.js Developer       — Udemy',
        ];
        certs.forEach(c => line('  <span class="tc-muted"><i class="fa-solid fa-check fa-xs"></i></span> ' + esc(c)));
      },

      contact() {
        scrollToSection('#contact');
        line('<span class="tc-accent">GET IN TOUCH</span>');
        sep();
        const items = [
          ['email',    'vijayrauniyar1818@gmail.com'],
          ['location', 'Bengaluru, India'],
          ['github',   'github.com/vijaygupta18'],
          ['linkedin', 'linkedin.com/in/vijaygupta18'],
          ['codechef', 'codechef.com/users/rdxvijay'],
          ['leetcode', 'leetcode.com/rdxvijay'],
        ];
        items.forEach(([k, v]) => {
          line(
            '  <span class="tc-key">' + k.padEnd(10) + '</span>' +
            '<span class="tc-muted">: </span>' +
            '<span class="tc-val">' + esc(v) + '</span>'
          );
        });
        blank();
        line('  <span class="tc-muted">Or scroll down to send a message →</span>');
      },

      resume() {
        line('  <span class="tc-muted">Opening resume.pdf...</span>');
        const modal = document.getElementById('resumeModal');
        if (modal) {
          setTimeout(() => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }, 400);
          line('  <span class="tc-success"><i class="fa-solid fa-check fa-xs"></i> opened</span>');
        }
      },

      clear() {
        termOutput.innerHTML = '';
        boot();
        return true;
      },

      ls() {
        line('  <span class="tc-muted">./</span>');
        [
          ['├──', 'about.json'],
          ['├──', 'stack.ts'],
          ['├──', 'experience.json'],
          ['├──', 'builds.json'],
          ['├──', 'education.json'],
          ['└──', 'contact.json'],
        ].forEach(([sym, f]) =>
          line('  <span class="tc-border">' + sym + '</span> <span class="tc-val">' + f + '</span>')
        );
        blank();
        line('  <span class="tc-muted">Type a command name or \'cd &lt;section&gt;\' to navigate.</span>');
      },

      pwd() { line('/home/vijay/portfolio'); },

      'git log'() {
        [
          ['c8ff00', 'HEAD → main', 'May 2023 → Present', 'feat: distributed systems @ Juspay/NammaYatri'],
          ['8db800', '',            'Jun 2022 – Apr 2023', 'feat: backend engineer @ Vahan'],
          ['161616', '',            'Aug 2018',            'init: B.Tech IT @ KNIT Sultanpur'],
        ].forEach(([hash, ref, date, msg]) => {
          line(
            '<span class="tc-key">commit</span> <span class="tc-accent">' + hash + '</span>' +
            (ref ? ' <span class="tc-muted">(' + ref + ')</span>' : '')
          );
          line('<span class="tc-muted">Date:   ' + date + '</span>');
          blank();
          line('    ' + esc(msg));
          blank();
        });
      },

      sudo()  { line('<span class="tc-error">sudo: permission denied. Nice try.</span>'); },
      exit()  { line('  <span class="tc-muted">logout: No escape. You\'re already here.</span>'); },
      vim()   { line('  <span class="tc-muted">Vim opened. Press :q! if you know how.</span>'); },
      ping()  {
        line('<span class="tc-muted">PING vijayrauniyar1818@gmail.com: 56 bytes</span>');
        line('<span class="tc-success">64 bytes: time=0.42ms  —  "Happy to hear from you."</span>');
      },
      uname() { line('vijay.portfolio 6.0.0 haskell-kernel #SDE Bengaluru'); },

      'man vijay'() {
        line('<span class="tc-accent">VIJAY(1)              Portfolio Manual              VIJAY(1)</span>');
        blank();
        line('<span class="tc-key">NAME</span>');
        line('       vijay — backend engineer, system builder');
        blank();
        line('<span class="tc-key">SYNOPSIS</span>');
        line('       vijay [--hire] [--collaborate] [--coffee]');
        blank();
        line('<span class="tc-key">DESCRIPTION</span>');
        line('       3+ years designing scalable backend systems.');
        line('       Expert in Haskell, Redis, distributed systems.');
        line('       Reduced latency 40%, infra costs 50%.');
        blank();
        line('<span class="tc-key">SEE ALSO</span>');
        line('       contact(1), resume(1), github(1)');
        blank();
        line('<span class="tc-key">BUGS</span>');
        line('       None known. Reports: vijayrauniyar1818@gmail.com');
      },
    };

    /* cd <section> */
    function handleCd(section) {
      const map = {
        about: '#about', skills: '#skills', stack: '#skills',
        work: '#experience', experience: '#experience',
        projects: '#projects', builds: '#projects',
        education: '#education', contact: '#contact',
      };
      const href = map[section.toLowerCase()];
      if (href) {
        scrollToSection(href);
        line('  <span class="tc-muted">→ scrolled to #' + esc(section) + '</span>');
        return true;
      }
      line('<span class="tc-error">cd: ' + esc(section) + ': No such section</span>');
      return true;
    }

    /* cat <file> → alias */
    const CAT_ALIASES = {
      about: 'whoami', stack: 'skills', experience: 'experience',
      builds: 'projects', contact: 'contact',
    };

    function execute(raw) {
      const cmd = raw.trim();
      if (!cmd) return;

      if (cmd.toLowerCase().startsWith('cd ')) return handleCd(cmd.slice(3).trim());

      if (cmd.toLowerCase().startsWith('cat ')) {
        const file = cmd.slice(4).trim().replace(/\.\w+$/, '').toLowerCase();
        const target = CAT_ALIASES[file];
        if (target && CMDS[target]) { CMDS[target](); return; }
      }

      if (cmd.toLowerCase() === 'git log')   { CMDS['git log']();   return; }
      if (cmd.toLowerCase() === 'man vijay') { CMDS['man vijay'](); return; }
      if (cmd.toLowerCase().startsWith('uname')) { CMDS.uname(); return; }

      const fn = CMDS[cmd.toLowerCase()];
      if (fn) { const skip = fn(); return skip; }

      line('<span class="tc-error">command not found: ' + esc(cmd) + '</span>');
      line('  <span class="tc-muted">Type </span><span class="tc-cmd">help</span><span class="tc-muted"> for available commands.</span>');
    }

    /* ── key handling ── */
    termInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const cmd = termInput.value;
        termInput.value = '';
        if (cmd.trim()) { history.unshift(cmd.trim()); histIdx = -1; }
        printEcho(cmd);
        const skip = execute(cmd);
        if (!skip) blank();
        scrollBot();

      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (histIdx < history.length - 1) { histIdx++; termInput.value = history[histIdx]; }

      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; termInput.value = history[histIdx]; }
        else { histIdx = -1; termInput.value = ''; }

      } else if (e.key === 'Tab') {
        e.preventDefault();
        const partial = termInput.value.toLowerCase().trim();
        if (!partial) return;
        const matches = Object.keys(CMDS).filter(c => c.startsWith(partial));
        if (matches.length === 1) termInput.value = matches[0];

      } else if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        CMDS.clear();
      }
    });

    termBody.addEventListener('click', () => termInput.focus());

    /* ── boot: show commands immediately ── */
    function boot() {
      line(
        '<span class="tc-accent">vijay.portfolio</span>' +
        ' <span class="tc-muted">v6.0.0 · backend engineer · distributed systems</span>'
      );
      sep();
      blank();
      line('<span class="tc-accent">AVAILABLE COMMANDS</span>');
      sep('·');
      const rows = [
        ['whoami',     'who is vijay gupta?'],
        ['skills',     'tech stack'],
        ['experience', 'work history'],
        ['projects',   'things I\'ve built'],
        ['education',  'degrees & certifications'],
        ['contact',    'get in touch'],
        ['resume',     'open resume PDF'],
        ['clear',      'clear terminal'],
      ];
      rows.forEach(([cmd, desc]) => {
        line(
          '  <span class="tc-cmd">' + cmd.padEnd(14) + '</span>' +
          '<span class="tc-muted">— ' + desc + '</span>'
        );
      });
      sep('·');
      line(
        '  <span class="tc-muted">↑↓ history · Tab autocomplete · try: </span>' +
        '<span class="tc-cmd">git log</span>' +
        '<span class="tc-muted">, </span><span class="tc-cmd">man vijay</span>' +
        '<span class="tc-muted">, </span><span class="tc-cmd">sudo</span>'
      );
      blank();
      scrollBot();
    }

    boot();
    if (window.innerWidth > 768) termInput.focus();
  }


  /* ═══════════════════════════════════════════
     2. COMMAND PALETTE (⌘K / Ctrl+K)
  ═══════════════════════════════════════════ */

  const PALETTE_CMDS = [
    { name: 'About',        type: 'nav',    icon: '<i class="fa-solid fa-hashtag"></i>', href: '#about' },
    { name: 'Stack',        type: 'nav',    icon: '<i class="fa-solid fa-hashtag"></i>', href: '#skills' },
    { name: 'Work',         type: 'nav',    icon: '<i class="fa-solid fa-hashtag"></i>', href: '#experience' },
    { name: 'Builds',       type: 'nav',    icon: '<i class="fa-solid fa-hashtag"></i>', href: '#projects' },
    { name: 'Education',    type: 'nav',    icon: '<i class="fa-solid fa-hashtag"></i>', href: '#education' },
    { name: 'Contact',      type: 'nav',    icon: '<i class="fa-solid fa-hashtag"></i>', href: '#contact' },
    { name: 'Resume',       type: 'action', icon: '<i class="fa-solid fa-file-lines"></i>', action: 'resume' },
    { name: 'Toggle Theme', type: 'action', icon: '<i class="fa-solid fa-circle-half-stroke"></i>', action: 'theme' },
    { name: 'GitHub',       type: 'link',   icon: '<i class="fa-solid fa-arrow-up-right-from-square"></i>', href: 'https://github.com/vijaygupta18' },
    { name: 'LinkedIn',     type: 'link',   icon: '<i class="fa-solid fa-arrow-up-right-from-square"></i>', href: 'https://linkedin.com/in/vijaygupta18' },
    { name: 'Twitter / X',  type: 'link',   icon: '<i class="fa-solid fa-arrow-up-right-from-square"></i>', href: 'https://twitter.com/vijaygupta18' },
  ];

  const palette = document.getElementById('cmdPalette');
  const pInput  = document.getElementById('cmdInput');
  const pList   = document.getElementById('cmdResults');
  let   pIdx    = -1;

  function openPalette() {
    if (!palette) return;
    palette.removeAttribute('hidden');
    if (pInput) { pInput.value = ''; }
    renderPalette('');
    if (pInput) pInput.focus();
    document.body.style.overflow = 'hidden';
  }

  function closePalette() {
    if (!palette) return;
    palette.setAttribute('hidden', '');
    document.body.style.overflow = '';
    pIdx = -1;
  }

  function renderPalette(q) {
    if (!pList) return [];
    const filtered = q
      ? PALETTE_CMDS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
      : PALETTE_CMDS;
    pList.innerHTML = '';
    pIdx = filtered.length ? 0 : -1;
    filtered.forEach((cmd, i) => {
      const li = document.createElement('li');
      li.className = 'cmd-item' + (i === 0 ? ' active' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      li.innerHTML =
        '<span class="cmd-item__icon" aria-hidden="true">' + cmd.icon + '</span>' +
        '<span class="cmd-item__name">' + cmd.name + '</span>' +
        '<span class="cmd-item__type">' + cmd.type + '</span>';
      li.addEventListener('click', () => { execPalette(cmd); closePalette(); });
      pList.appendChild(li);
    });
    return filtered;
  }

  function setPaletteActive(idx) {
    const items = pList ? pList.querySelectorAll('.cmd-item') : [];
    items.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });
    pIdx = idx;
    if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
  }

  function execPalette(cmd) {
    if (cmd.action === 'resume') {
      const modal = document.getElementById('resumeModal');
      if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    } else if (cmd.action === 'theme') {
      document.getElementById('themeToggle')?.click();
    } else if (cmd.href && cmd.href.startsWith('#')) {
      scrollToSection(cmd.href);
    } else if (cmd.href) {
      window.open(cmd.href, '_blank', 'noopener,noreferrer');
    }
  }

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (document.activeElement === termInput) return;
      palette && palette.hasAttribute('hidden') ? openPalette() : closePalette();
      return;
    }
    if (!palette || palette.hasAttribute('hidden')) return;
    if (e.key === 'Escape') { closePalette(); return; }

    const items = pList ? pList.querySelectorAll('.cmd-item') : [];
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setPaletteActive(Math.min(pIdx + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setPaletteActive(Math.max(pIdx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (pIdx >= 0) {
        const q = pInput ? pInput.value.toLowerCase().trim() : '';
        const filtered = q
          ? PALETTE_CMDS.filter(c => c.name.toLowerCase().includes(q))
          : PALETTE_CMDS;
        if (filtered[pIdx]) { execPalette(filtered[pIdx]); closePalette(); }
      }
    }
  });

  if (pInput) pInput.addEventListener('input', e => renderPalette(e.target.value));
  if (palette) {
    const backdrop = palette.querySelector('.cmd-backdrop');
    if (backdrop) backdrop.addEventListener('click', closePalette);
  }


  /* ═══════════════════════════════════════════
     3. SECTION FILE-LOADING TRANSITIONS
  ═══════════════════════════════════════════ */

  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const section   = entry.target;
      const filename  = section.getAttribute('data-file');
      const container = section.querySelector('.container');
      if (!container || !filename) return;
      sectionIO.unobserve(section);

      const loader = document.createElement('div');
      loader.className = 'section-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.textContent = '$ loading ' + filename + '…';
      container.insertBefore(loader, container.firstChild);

      requestAnimationFrame(() => {
        loader.classList.add('visible');
        setTimeout(() => {
          loader.classList.remove('visible');
          loader.classList.add('done');
          setTimeout(() => loader.remove(), 300);
        }, 900);
      });
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('section[data-file]').forEach(s => sectionIO.observe(s));

})();
