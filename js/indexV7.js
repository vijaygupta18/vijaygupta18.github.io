/* ─────────────────────────────────────────────
   V7: "The Architect" — 3D Immersive Portfolio
   Three.js Node Network + 3D Tilt + Custom Cursor
   ───────────────────────────────────────────── */

(function () {
  'use strict';

  // ── Initialize Lucide Icons ──
  lucide.createIcons();

  // ═══════════════════════════════════════════
  // THREE.JS — Distributed System Node Network
  // ═══════════════════════════════════════════
  const heroCanvas = document.getElementById('heroCanvas');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroCanvas && typeof THREE !== 'undefined' && !prefersReducedMotion) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      canvas: heroCanvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Accent color from theme
    function getAccentColor() {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      return isDark ? 0x3FB950 : 0x1A7F37;
    }

    function getSecondaryColor() {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      return isDark ? 0x58A6FF : 0x0969DA;
    }

    // ─ Create Nodes (particles) ─
    const NODE_COUNT = 80;
    const FIELD_SIZE = 80;
    const nodePositions = [];
    const nodeVelocities = [];

    const nodeGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(NODE_COUNT * 3);
    const sizes = new Float32Array(NODE_COUNT);

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * FIELD_SIZE;
      const y = (Math.random() - 0.5) * FIELD_SIZE;
      const z = (Math.random() - 0.5) * 30;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      sizes[i] = Math.random() * 2 + 1;
      nodePositions.push(new THREE.Vector3(x, y, z));
      nodeVelocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.005
      ));
    }

    nodeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    nodeGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader for glowing nodes
    const nodeMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(getAccentColor()) },
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = size / 3.0;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(uColor, glow * vAlpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    // ─ Create Connections (lines between close nodes) ─
    const MAX_CONNECTIONS = 150;
    const CONNECTION_DIST = 18;
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineColors = new Float32Array(MAX_CONNECTIONS * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ─ Data pulse particles (flowing along connections) ─
    const PULSE_COUNT = 20;
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePos = new Float32Array(PULSE_COUNT * 3);
    const pulseSizes = new Float32Array(PULSE_COUNT);
    for (let i = 0; i < PULSE_COUNT; i++) {
      pulsePos[i * 3] = 0;
      pulsePos[i * 3 + 1] = 0;
      pulsePos[i * 3 + 2] = 0;
      pulseSizes[i] = 1.5;
    }
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    pulseGeo.setAttribute('size', new THREE.BufferAttribute(pulseSizes, 1));

    const pulseMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(getSecondaryColor()) },
      },
      vertexShader: `
        attribute float size;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.4, dist);
          gl_FragColor = vec4(uColor, glow * 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    scene.add(pulsePoints);

    // Pulse state
    const pulses = [];
    for (let i = 0; i < PULSE_COUNT; i++) {
      pulses.push({ from: 0, to: 1, t: Math.random(), speed: 0.005 + Math.random() * 0.01 });
    }

    // Mouse tracking for camera parallax
    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // ─ Animation Loop ─
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      time += 0.01;

      // Update node positions (gentle drift)
      const posAttr = nodeGeo.attributes.position;
      for (let i = 0; i < NODE_COUNT; i++) {
        nodePositions[i].add(nodeVelocities[i]);

        // Bounce at boundaries
        if (Math.abs(nodePositions[i].x) > FIELD_SIZE / 2) nodeVelocities[i].x *= -1;
        if (Math.abs(nodePositions[i].y) > FIELD_SIZE / 2) nodeVelocities[i].y *= -1;
        if (Math.abs(nodePositions[i].z) > 15) nodeVelocities[i].z *= -1;

        posAttr.array[i * 3] = nodePositions[i].x;
        posAttr.array[i * 3 + 1] = nodePositions[i].y;
        posAttr.array[i * 3 + 2] = nodePositions[i].z;
      }
      posAttr.needsUpdate = true;

      // Update connections
      let lineIdx = 0;
      const accentR = ((getAccentColor() >> 16) & 0xFF) / 255;
      const accentG = ((getAccentColor() >> 8) & 0xFF) / 255;
      const accentB = (getAccentColor() & 0xFF) / 255;

      const connectedPairs = [];

      for (let i = 0; i < NODE_COUNT && lineIdx < MAX_CONNECTIONS; i++) {
        for (let j = i + 1; j < NODE_COUNT && lineIdx < MAX_CONNECTIONS; j++) {
          const dist = nodePositions[i].distanceTo(nodePositions[j]);
          if (dist < CONNECTION_DIST) {
            const alpha = 1 - dist / CONNECTION_DIST;
            const li = lineIdx * 6;
            linePositions[li] = nodePositions[i].x;
            linePositions[li + 1] = nodePositions[i].y;
            linePositions[li + 2] = nodePositions[i].z;
            linePositions[li + 3] = nodePositions[j].x;
            linePositions[li + 4] = nodePositions[j].y;
            linePositions[li + 5] = nodePositions[j].z;

            lineColors[li] = accentR * alpha;
            lineColors[li + 1] = accentG * alpha;
            lineColors[li + 2] = accentB * alpha;
            lineColors[li + 3] = accentR * alpha;
            lineColors[li + 4] = accentG * alpha;
            lineColors[li + 5] = accentB * alpha;

            connectedPairs.push([i, j]);
            lineIdx++;
          }
        }
      }

      // Zero out unused connections
      for (let k = lineIdx * 6; k < MAX_CONNECTIONS * 6; k++) {
        linePositions[k] = 0;
        lineColors[k] = 0;
      }

      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;
      lineGeo.setDrawRange(0, lineIdx * 2);

      // Update pulse particles
      const pulsePosAttr = pulseGeo.attributes.position;
      for (let i = 0; i < PULSE_COUNT; i++) {
        const pulse = pulses[i];
        pulse.t += pulse.speed;
        if (pulse.t >= 1 || connectedPairs.length === 0) {
          pulse.t = 0;
          const pair = connectedPairs[Math.floor(Math.random() * connectedPairs.length)] || [0, 1];
          pulse.from = pair[0];
          pulse.to = pair[1];
        }
        const fromPos = nodePositions[pulse.from];
        const toPos = nodePositions[pulse.to];
        if (fromPos && toPos) {
          pulsePosAttr.array[i * 3] = fromPos.x + (toPos.x - fromPos.x) * pulse.t;
          pulsePosAttr.array[i * 3 + 1] = fromPos.y + (toPos.y - fromPos.y) * pulse.t;
          pulsePosAttr.array[i * 3 + 2] = fromPos.z + (toPos.z - fromPos.z) * pulse.t;
        }
      }
      pulsePosAttr.needsUpdate = true;

      // Camera parallax follow mouse
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 3 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      // Update uniforms
      nodeMat.uniforms.uTime.value = time;
      nodeMat.uniforms.uColor.value.set(getAccentColor());
      pulseMat.uniforms.uColor.value.set(getSecondaryColor());

      renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }


  // ═══════════════════════════════════════════
  // CUSTOM 3D CURSOR
  // ═══════════════════════════════════════════
  const cursor = document.getElementById('cursor');
  const isTouch = window.matchMedia('(hover: none)').matches;

  if (cursor && !isTouch && !prefersReducedMotion) {
    let cursorX = 0, cursorY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    }, { passive: true });

    document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
    document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));

    // Detect hoverable elements
    const hoverSelectors = 'a, button, select, input, textarea, .build-card, .social-icon, .pill, .cert-item, .btn, .nav-link, .resume-btn, .theme-btn';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.add('hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.remove('hovering');
      }
    });

    function updateCursor() {
      currentX += (cursorX - currentX) * 0.15;
      currentY += (cursorY - currentY) * 0.15;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(updateCursor);
    }
    updateCursor();
  } else if (cursor) {
    cursor.style.display = 'none';
    document.body.style.cursor = 'auto';
  }


  // ═══════════════════════════════════════════
  // 3D TILT EFFECT ON CARDS
  // ═══════════════════════════════════════════
  const tiltCards = document.querySelectorAll('.tilt-card, .build-card, .stat-card, .rec-card, .stack-group');

  if (!isTouch && !prefersReducedMotion) {
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;  // max 6 degrees
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;

        // Update glare position
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        card.style.setProperty('--mouse-x', percentX + '%');
        card.style.setProperty('--mouse-y', percentY + '%');
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        card.style.transition = 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { card.style.transition = ''; }, 400);
      });

      card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
      });
    });
  }


  // ═══════════════════════════════════════════
  // PARALLAX ON SCROLL — Floating shapes + sections
  // ═══════════════════════════════════════════
  const shapes = document.querySelectorAll('.shape');

  if (!prefersReducedMotion) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      shapes.forEach((shape, i) => {
        const speed = 0.03 + i * 0.015;
        shape.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }, { passive: true });
  }


  // ═══════════════════════════════════════════
  // STANDARD INTERACTIONS (from V7 base)
  // ═══════════════════════════════════════════

  // ── Theme Toggle ──
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme-v7', theme);
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    lucide.createIcons();
  }

  const savedTheme = localStorage.getItem('theme-v7') || 'dark';
  setTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ── Mobile Menu ──
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Scroll Progress Bar ──
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  }

  // ── Active Nav Link ──
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function updateActiveNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateScrollProgress();
        updateActiveNav();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // ── Reveal on Scroll ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── Animated Counters ──
  function animateCounter(el, target, duration) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'), 10);
        animateCounter(entry.target, target, 1200);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

  // ── Resume Modal ──
  const resumeModal = document.getElementById('resumeModal');
  const resumeNavBtn = document.getElementById('resumeNavBtn');
  const resumeClose = document.getElementById('resumeClose');

  function openResume(e) {
    e.preventDefault();
    resumeModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeResume() {
    resumeModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (resumeNavBtn) resumeNavBtn.addEventListener('click', openResume);
  if (resumeClose) resumeClose.addEventListener('click', closeResume);

  const modalBackdrop = resumeModal?.querySelector('.modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeResume);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resumeModal?.classList.contains('open')) {
      closeResume();
    }
  });

  // ── Contact Form (EmailJS) ──
  const contactForm = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  let lastSendTime = 0;

  function showToast(message, type) {
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
      toast.className = 'toast';
    }, 4000);
  }

  if (contactForm) {
    try {
      emailjs.init('YFU0HYHP-06V-ePxy');
    } catch (e) {}

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastSendTime < 10000) {
        showToast('Please wait before sending again.', 'error');
        return;
      }

      const name = contactForm.querySelector('#name').value.trim();
      const email = contactForm.querySelector('#email').value.trim();
      const subject = contactForm.querySelector('#subject').value.trim();
      const message = contactForm.querySelector('#message').value.trim();

      if (!name || !email || !message) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email.', 'error');
        return;
      }

      const btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.style.opacity = '0.6';

      try {
        await emailjs.send('service_jcl7yz7', 'template_xp4wqzk', {
          from_name: name,
          from_email: email,
          subject: subject || 'Portfolio Contact',
          message: message,
        });
        showToast('Message sent! I\'ll get back to you soon.', 'success');
        contactForm.reset();
        lastSendTime = now;
      } catch (err) {
        showToast('Failed to send. Please email me directly.', 'error');
      } finally {
        btn.disabled = false;
        btn.style.opacity = '';
      }
    });
  }

  // ── Version Switcher ──
  const portfolioSwitcher = document.getElementById('portfolioSwitcher');
  if (portfolioSwitcher) {
    portfolioSwitcher.addEventListener('change', () => {
      window.location.href = portfolioSwitcher.value;
    });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        if (navMenu) {
          navMenu.classList.remove('open');
          mobileToggle?.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // ── Header auto-hide on scroll ──
  let lastScrollY = 0;
  const header = document.getElementById('header');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (scrollY > 100) {
      header.style.opacity = scrollY > lastScrollY && scrollY > 300 ? '0' : '1';
      header.style.transform = scrollY > lastScrollY && scrollY > 300 ? 'translateY(-100%)' : 'translateY(0)';
    } else {
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }
    header.style.transition = 'opacity 300ms, transform 300ms';
    lastScrollY = scrollY;
  }, { passive: true });

})();
