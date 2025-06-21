
// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Hide loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1000);

    // Theme management
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    const defaultTheme = storedTheme || (prefersDark ? 'dark' : 'light');

    // Set initial theme
    document.documentElement.setAttribute('data-theme', defaultTheme);
    updateThemeToggle(defaultTheme);

    // Theme toggle handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggle(newTheme);
    });

    function updateThemeToggle(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Portfolio switcher
    const portfolioSwitcher = document.getElementById('portfolioSwitcher');
    portfolioSwitcher.addEventListener('change', (e) => {
        window.location.href = e.target.value;
    });

    // Scroll progress bar
    const scrollProgress = document.getElementById('scrollProgress');
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        scrollProgress.style.width = scrolled + '%';
    });

    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Active navigation link - This functionality is handled later in the unified scroll handler

    // Resume modal
    const resumeBtn = document.getElementById('resumeBtn');
    const resumeModal = document.getElementById('resumeModal');
    const resumeClose = document.getElementById('resumeClose');

    resumeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resumeModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    resumeClose.addEventListener('click', () => {
        resumeModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && resumeModal.classList.contains('active')) {
            resumeClose.click();
        }
    });

    // Close modal on backdrop click
    resumeModal.addEventListener('click', (e) => {
        if (e.target === resumeModal) {
            resumeClose.click();
        }
    });

    // EmailJS Configuration - Safe for public repos
    const EMAILJS_CONFIG = {
        publicKey: "JJYrlbmwaCoxBgcHG", // Your EmailJS public key
        serviceId: "service_4wre7f9", // Your EmailJS service ID  
        templateId: "template_4alqdiv" // Your EmailJS template ID
    };

    // Initialize EmailJS
    emailjs.init({
        publicKey: EMAILJS_CONFIG.publicKey,
        // Additional security options
        blockHeadless: true, // Block headless browsers
        limitRate: {
            id: 'app',
            throttle: 10000, // 10 seconds between requests
        }
    });

    // Input validation and sanitization
    function validateAndSanitizeForm(formData) {
        const name = formData.get('name').trim();
        const email = formData.get('email').trim();
        const subject = formData.get('subject').trim();
        const message = formData.get('message').trim();

        // Basic validation
        if (!name || name.length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Please enter a valid email address');
        }
        if (!message || message.length < 10) {
            throw new Error('Message must be at least 10 characters long');
        }

        // Sanitize inputs (remove potential HTML/script tags)
        const cleanName = name.replace(/<[^>]*>/g, '').substring(0, 100);
        const cleanEmail = email.replace(/<[^>]*>/g, '').substring(0, 100);
        const cleanSubject = subject.replace(/<[^>]*>/g, '').substring(0, 200) || 'Contact Form Message';
        const cleanMessage = message.replace(/<[^>]*>/g, '').substring(0, 2000);

        // Format timestamp for the template
        const currentTime = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        // Create well-formatted message for the beautiful template
        const enhancedMessage = `📋 SUBJECT: ${cleanSubject}

📧 SENDER EMAIL: ${cleanEmail}

💬 MESSAGE:
${cleanMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 This message was submitted through your portfolio contact form
🌐 Source: https://vijaygupta18.github.io`;

        return {
            name: cleanName,
            email: cleanEmail,
            time: currentTime,
            message: enhancedMessage,
            title: cleanSubject,
            subject: `Contact Us: ${cleanSubject}`,
            reply_to: cleanEmail
        };
    }

    // Contact form with enhanced security
    const contactForm = document.getElementById('contactForm');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    let lastSubmissionTime = 0;
    let isSubmitting = false; // Add submission guard

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent multiple rapid submissions
        if (isSubmitting) {
            return;
        }

        // Rate limiting on client side (additional to EmailJS limits)
        const now = Date.now();
        if (now - lastSubmissionTime < 10000) { // 10 seconds
            showNotification('⏰ Please wait 10 seconds between submissions.', 'error');
            return;
        }

        // Set submission guard
        isSubmitting = true;

        // Update button to show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            // Check if template ID is set
            if (EMAILJS_CONFIG.templateId === "YOUR_TEMPLATE_ID") {
                throw new Error('Template ID not configured. Please create an email template in EmailJS dashboard.');
            }

            // Validate and sanitize form data
            const formData = new FormData(contactForm);
            const sanitizedData = validateAndSanitizeForm(formData);

            // Send email using EmailJS with sanitized data
            const result = await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                sanitizedData
            );
            lastSubmissionTime = now;

            // Show success message
            showNotification('✅ Message sent successfully! I\'ll get back to you soon.', 'success');
            contactForm.reset();

            // Clear any field errors
            contactForm.querySelectorAll('.field-error').forEach(error => error.remove());

        } catch (error) {
            console.error('Failed to send email:', error);

            if (error.message && error.message.includes('Template ID not configured')) {
                showNotification('❌ Email template not set up yet. Please contact me directly at vijayrauniyar1818@gmail.com', 'error');
            } else if (error.message && error.message.includes('valid')) {
                showNotification(`❌ ${error.message}`, 'error');
            } else if (error.text) {
                // EmailJS specific errors
                if (error.text.includes('rate')) {
                    showNotification('⏰ Too many requests. Please try again later.', 'error');
                } else if (error.text.includes('template')) {
                    showNotification('❌ Email template error. Please contact me directly at vijayrauniyar1818@gmail.com', 'error');
                } else if (error.text.includes('service')) {
                    showNotification('❌ Email service error. Please contact me directly at vijayrauniyar1818@gmail.com', 'error');
                } else {
                    showNotification(`❌ Email error: ${error.text}. Please contact me directly at vijayrauniyar1818@gmail.com`, 'error');
                }
            } else {
                showNotification('❌ Failed to send message. Please try again or email me directly at vijayrauniyar1818@gmail.com', 'error');
            }
        } finally {
            // Reset submission guard and button
            isSubmitting = false;
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Notification system
    function showNotification(message, type) {
        // Remove any existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    // Enhanced smooth scrolling with proper offset calculation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;

                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });
            }
        });
    });

    // Enhanced active navigation with better section detection
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNavigation() {
        const headerHeight = document.getElementById('header').offsetHeight;
        const scrollPosition = window.scrollY + headerHeight + 50; // Buffer for better detection

        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // Unified scroll event handler
    window.addEventListener('scroll', () => {
        const header = document.getElementById('header');
        const headerHeight = header.offsetHeight;
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;

        // Update scroll progress
        scrollProgress.style.width = scrolled + '%';

        // Update header scroll state
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Update active navigation
        updateActiveNavigation();

        // Enhanced section-based progress indication
        const currentScrollWithOffset = window.scrollY + headerHeight + 100;
        let currentSectionIndex = 0;

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (currentScrollWithOffset >= sectionTop && currentScrollWithOffset < sectionBottom) {
                currentSectionIndex = index;
            }
        });

        // Update progress bar color based on section
        const hue = (currentSectionIndex / sections.length) * 360;
        scrollProgress.style.background = `linear-gradient(90deg, hsl(${hue}, 70%, 50%) 0%, hsl(${hue + 60}, 70%, 60%) 100%)`;
    });

    // Performance optimization: Lazy load images
    const images = document.querySelectorAll('img[src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Add hover effects for cards
    const cards = document.querySelectorAll('.skill-category, .experience-item, .project-card, .education-card, .cert-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    // Particle Animation System
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const color = currentTheme === 'dark' ? '255, 255, 255' : '59, 130, 246';

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color}, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Initialize particles
    function initParticles() {
        particles = [];
        const particleCount = Math.min(50, Math.floor(canvas.width * canvas.height / 10000));
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections
        particles.forEach((particle, i) => {
            particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    const currentTheme = document.documentElement.getAttribute('data-theme');
                    const color = currentTheme === 'dark' ? '255, 255, 255' : '59, 130, 246';
                    const opacity = (100 - distance) / 100 * 0.1;

                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.strokeStyle = `rgba(${color}, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        });

        animationId = requestAnimationFrame(animate);
    }

    // Mouse interaction
    let mouse = { x: 0, y: 0 };
    canvas.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        particles.forEach(particle => {
            const dx = mouse.x - particle.x;
            const dy = mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.vx += (dx / distance) * force * 0.01;
                particle.vy += (dy / distance) * force * 0.01;

                // Limit velocity
                particle.vx = Math.max(-2, Math.min(2, particle.vx));
                particle.vy = Math.max(-2, Math.min(2, particle.vy));
            }
        });
    });

    // Initialize and start animation
    resizeCanvas();
    initParticles();
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    // Pause animation when tab is not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });

    // Typing Animation for Hero
    const dynamicText = document.getElementById('dynamicText');
    const roles = [
        'Software Engineer',
        'Backend Developer',
        'System Architect',
        'Performance Engineer',
        'Cloud Expert',
        'Problem Solver'
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function typeText() {
        const currentRole = roles[roleIndex];

        if (isDeleting) {
            dynamicText.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            dynamicText.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentRole.length) {
            setTimeout(() => { isDeleting = true; }, 2000);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
        }

        setTimeout(typeText, typingSpeed);
    }

    // Start typing animation
    setTimeout(typeText, 1000);

    // Animated Counters
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeOutQuart);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // Counter Animation Observer
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                animateCounter(counter, target);
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    // Observe all counter elements
    document.querySelectorAll('[data-count]').forEach(counter => {
        counterObserver.observe(counter);
    });

    // Tech Item Animations
    const techObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const techItem = entry.target;
                setTimeout(() => {
                    techItem.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        techItem.style.transform = 'scale(1)';
                    }, 200);
                }, Math.random() * 300);
                techObserver.unobserve(techItem);
            }
        });
    }, { threshold: 0.3 });

    // Observe all tech items
    document.querySelectorAll('.tech-item, .specialization-item').forEach(item => {
        techObserver.observe(item);
    });

    // Enhanced Achievement Card Animations
    const achievementCards = document.querySelectorAll('.achievement-card');
    achievementCards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = `translateY(-8px) rotateY(${Math.random() * 10 - 5}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateY(0deg)';
        });
    });

    // Enhanced scroll progress with sections
    const totalSections = sections.length;

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        scrollProgress.style.width = scrolled + '%';

        // Add section-based progress indication
        let currentSection = 0;
        sections.forEach((section, index) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                currentSection = index;
            }
        });

        // Update progress bar color based on section
        const hue = (currentSection / totalSections) * 360;
        scrollProgress.style.background = `linear-gradient(90deg, hsl(${hue}, 70%, 50%) 0%, hsl(${hue + 60}, 70%, 60%) 100%)`;
    });

    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero::before');
        if (parallax) {
            const speed = scrolled * 0.5;
            parallax.style.transform = `translateY(${speed}px)`;
        }
    });

    // Enhanced image loading
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('load', () => {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        });

        // Set initial state
        img.style.opacity = '0';
        img.style.transform = 'scale(0.95)';
        img.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });

    // Enhanced project card interactions
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // True Infinite Carousel with Seamless Looping
    function setupInfiniteCarousel(carouselId, prevBtnId, nextBtnId, cardWidth, gap) {
        const carousel = document.getElementById(carouselId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (!carousel || !prevBtn || !nextBtn) return;

        const originalGrid = carousel.querySelector('.projects-grid, .recommendations-grid');
        if (!originalGrid) return;

        const cards = Array.from(originalGrid.querySelectorAll('.project-card, .recommendation-card'));
        const totalCards = cards.length;
        const cardWidthWithGap = cardWidth + gap;

        // Clear existing clones
        const existingClones = originalGrid.querySelectorAll('.card-clone');
        existingClones.forEach(clone => clone.remove());

        // Create seamless infinite scroll - clone only what we need for smooth transitions
        // Add clones at the beginning and end for seamless looping
        const firstClones = [];
        const lastClones = [];

        // Clone first few cards and append to end
        for (let i = 0; i < Math.min(3, totalCards); i++) {
            const clone = cards[i].cloneNode(true);
            clone.classList.add('card-clone');
            lastClones.push(clone);
            originalGrid.appendChild(clone);
        }

        // Clone last few cards and prepend to beginning
        for (let i = Math.max(0, totalCards - 3); i < totalCards; i++) {
            const clone = cards[i].cloneNode(true);
            clone.classList.add('card-clone');
            firstClones.unshift(clone);
            originalGrid.insertBefore(clone, originalGrid.firstChild);
        }

        // Set up continuous animation
        let animationId;
        const singleSetWidth = totalCards * cardWidthWithGap;
        const startPosition = -firstClones.length * cardWidthWithGap;
        let currentTranslate = startPosition;
        const animationSpeed = 0.5; // pixels per frame
        let isPaused = false;
        let isManualControl = false;

        // Set initial position to account for prepended clones
        carousel.style.transform = `translateX(${currentTranslate}px)`;

        function animateCarousel() {
            if (!isPaused && !isManualControl) {
                currentTranslate -= animationSpeed;

                // Reset position when we've moved too far right (showing end clones)
                const maxTranslate = startPosition - singleSetWidth;
                if (currentTranslate <= maxTranslate) {
                    currentTranslate = startPosition;
                }

                carousel.style.transform = `translateX(${currentTranslate}px)`;
            }
            animationId = requestAnimationFrame(animateCarousel);
        }

        // Manual controls for user interaction
        let currentIndex = 0;

        function slideNext() {
            isManualControl = true;
            currentIndex = (currentIndex + 1) % totalCards;
            const targetTranslate = startPosition - (currentIndex * cardWidthWithGap);

            // Smooth transition to next card
            carousel.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            carousel.style.transform = `translateX(${targetTranslate}px)`;
            currentTranslate = targetTranslate;

            setTimeout(() => {
                carousel.style.transition = 'none';
                isManualControl = false;
            }, 400);
        }

        function slidePrev() {
            isManualControl = true;
            currentIndex = (currentIndex - 1 + totalCards) % totalCards;
            const targetTranslate = startPosition - (currentIndex * cardWidthWithGap);

            // Smooth transition to previous card
            carousel.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            carousel.style.transform = `translateX(${targetTranslate}px)`;
            currentTranslate = targetTranslate;

            setTimeout(() => {
                carousel.style.transition = 'none';
                isManualControl = false;
            }, 400);
        }

        // Event listeners for manual controls
        nextBtn.addEventListener('click', () => {
            isPaused = true;
            slideNext();
            setTimeout(() => {
                isPaused = false;
            }, 800);
        });

        prevBtn.addEventListener('click', () => {
            isPaused = true;
            slidePrev();
            setTimeout(() => {
                isPaused = false;
            }, 800);
        });

        // Pause on hover for better user experience
        carousel.addEventListener('mouseenter', () => {
            isPaused = true;
        });

        carousel.addEventListener('mouseleave', () => {
            isPaused = false;
        });

        // Touch/swipe support for mobile
        let startX = 0;
        let isDragging = false;

        carousel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            isPaused = true;
        });

        carousel.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
        });

        carousel.addEventListener('touchend', (e) => {
            if (!isDragging) return;

            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    slideNext();
                } else {
                    slidePrev();
                }
            }

            isDragging = false;
            setTimeout(() => {
                isPaused = false;
            }, 800);
        });

        // Start the animation
        carousel.style.transition = 'none';
        animateCarousel();

        // Handle window resize
        const handleResize = () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            // Recalculate and restart after a brief delay
            setTimeout(() => {
                const newStartPosition = -firstClones.length * cardWidthWithGap;
                currentTranslate = newStartPosition;
                carousel.style.transform = `translateX(${currentTranslate}px)`;
                animateCarousel();
            }, 100);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            window.removeEventListener('resize', handleResize);
        };
    }

    // Setup carousels with responsive card sizes for infinite scrolling
    function setupResponsiveCarousels() {
        const isMobile = window.innerWidth <= 768;
        const projectCardWidth = isMobile ? 350 : 400;
        const recommendationCardWidth = isMobile ? 380 : 480;
        const gap = 24;

        setupInfiniteCarousel('projectsCarousel', 'projectsPrev', 'projectsNext', projectCardWidth, gap);
        setupInfiniteCarousel('recommendationsCarousel', 'recommendationsPrev', 'recommendationsNext', recommendationCardWidth, gap);
    }

    // Initial setup
    setupResponsiveCarousels();

    // Re-setup on window resize
    window.addEventListener('resize', setupResponsiveCarousels);

    // Add ripple effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function (e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });


    // Advanced Intersection Observer for animations
    const animationObserverOptions = {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: '-50px 0px -100px 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;

                // Add entrance animations based on element type
                if (element.classList.contains('experience-item')) {
                    element.style.animation = 'slideInFromLeft 0.6s ease-out forwards';
                } else if (element.classList.contains('project-card')) {
                    element.style.animation = 'scaleIn 0.5s ease-out forwards';
                } else if (element.classList.contains('skill-category')) {
                    element.style.animation = 'fadeInUp 0.4s ease-out forwards';
                } else {
                    element.classList.add('visible');
                }

                // Trigger any custom animations
                if (element.dataset.animation) {
                    element.style.animation = element.dataset.animation;
                }

                animationObserver.unobserve(element);
            }
        });
    }, animationObserverOptions);

    // Observe all animatable elements
    document.querySelectorAll('.fade-in, .experience-item, .project-card, .skill-category, .contact-item').forEach(el => {
        animationObserver.observe(el);
    });

    // Enhanced keyboard navigation
    function initializeKeyboardNavigation() {
        const focusableElements = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
        const modal = document.querySelector('.resume-modal');

        // Trap focus in modal when open
        modal?.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeResumeModal();
                return;
            }

            if (e.key === 'Tab') {
                const focusable = modal.querySelectorAll(focusableElements);
                const firstFocusable = focusable[0];
                const lastFocusable = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });

        // Skip link for screen readers
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--color-primary);
      color: white;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 4px;
      transition: top 0.3s;
    `;
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    initializeKeyboardNavigation();

    // Enhanced form validation and submission
    function enhanceContactForm() {
        const form = document.querySelector('#contactForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea');
        let validationTimeouts = new Map();

        // Real-time validation with debounce
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', (e) => {
                clearErrors(e);

                // Debounce validation for input events
                if (validationTimeouts.has(input)) {
                    clearTimeout(validationTimeouts.get(input));
                }

                const timeoutId = setTimeout(() => {
                    if (input.value.trim()) { // Only validate if there's content
                        validateField(e);
                    }
                    validationTimeouts.delete(input);
                }, 500); // 500ms debounce

                validationTimeouts.set(input, timeoutId);
            });
        });

        function validateField(e) {
            const field = e.target;
            const value = field.value.trim();
            const type = field.type;

            clearFieldError(field);

            if (field.hasAttribute('required') && !value) {
                showFieldError(field, 'This field is required');
                return false;
            }

            if (type === 'email' && value && !isValidEmail(value)) {
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }

            // Add message length validation for real-time feedback
            if (field.name === 'message' && value && value.length < 10) {
                showFieldError(field, `Message must be at least 10 characters long (${value.length}/10)`);
                return false;
            }

            return true;
        }

        function clearErrors(e) {
            clearFieldError(e.target);
        }

        function showFieldError(field, message) {
            // Remove existing error first to prevent duplicates
            clearFieldError(field);

            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = message;
            errorElement.style.cssText = 'color: var(--color-error); font-size: 0.875rem; margin-top: 0.25rem; transition: opacity 0.2s ease;';

            field.parentNode.appendChild(errorElement);
            field.setAttribute('aria-invalid', 'true');
            field.setAttribute('aria-describedby', errorElement.id = `error-${field.name}`);

            // Animate in
            setTimeout(() => {
                errorElement.style.opacity = '1';
            }, 10);
        }

        function clearFieldError(field) {
            const error = field.parentNode.querySelector('.field-error');
            if (error) {
                error.style.opacity = '0';
                setTimeout(() => {
                    if (error.parentNode) {
                        error.remove();
                    }
                }, 200);
                field.removeAttribute('aria-invalid');
                field.removeAttribute('aria-describedby');
            }
        }

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        // Note: Form submission is handled by the main contactForm event listener above
        // This function only handles real-time validation to avoid duplicate submissions
    }

    enhanceContactForm();

    // Add custom CSS animations
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideInFromLeft {
      from { transform: translateX(-100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes fadeInUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .field-error {
      color: var(--color-error);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `;
    document.head.appendChild(style);

});
const sectionContext = {
    hero: "Namaste! My name is Vijay Gupta and I'm a Software Engineer. Welcome to my professional space, where I share my journey, passion, and work in the world of technology.",
    about: "Here's a quick introduction to my background, values, and what drives me professionally.",
    achievements: "Here are some milestones and achievements that reflect the hard work and dedication I bring to every opportunity.",
    skills: "These are the technical skills and tools I've picked up along the way, helping me build efficient and scalable solutions.",
    experience: "Here's a glimpse of my career journey so far, and the roles that have helped me grow as an engineer.",
    projects: "Here are a few projects I've worked on—each one taught me something new and helped sharpen my problem-solving abilities.",
    education: "Here's a glimpse into my academic journey and how it has shaped my approach to learning and innovation.",
    recommendations: "Here's what mentors, colleagues, and peers have kindly shared about their experience working with me.",
    contact: "If you'd like to connect, collaborate, or just say hello—here's how you can reach me. Looking forward to it!"
};

// 3D Bot Assistant System
class VirtualAssistant {
    constructor() {
        this.isVisible = false;
        this.currentSection = null;
        this.readSections = new Set();
        this.completedSections = new Set();
        this.isReading = false;
        this.currentAudio = null;
        this.speechSynthesis = window.speechSynthesis;
        this.isMuted = false;
        this.sectionTimer = null;

        this.init();
    }

    init() {
        this.createBotStructure();
        this.setupEventListeners();
        this.observeSections();

        // Initial section detection after page load
        setTimeout(() => {
            this.debugSections(); // Debug helper
            this.checkCurrentSection();
            console.log('Initial section check completed');
        }, 500);
    }

    createBotStructure() {
        // Create toggle button
        const toggleButton = document.createElement('div');
        toggleButton.id = 'bot-toggle';
        toggleButton.innerHTML = `
      <div class="bot-toggle-icon">
        <i class="fas fa-robot"></i>
      </div>
    `;
        document.body.appendChild(toggleButton);

        // Create bot container
        const botContainer = document.createElement('div');
        botContainer.id = 'virtual-assistant';
        botContainer.innerHTML = `
       <div class="bot-container">
         <div class="bot-header">
           <div class="bot-avatar">
             <div class="human-avatar">
               <div class="avatar-head">
                 <div class="hair"></div>
                 <div class="face">
                   <div class="eyebrows">
                     <div class="eyebrow left"></div>
                     <div class="eyebrow right"></div>
                   </div>
                   <div class="eyes">
                     <div class="eye left">
                       <div class="eyeball">
                         <div class="pupil"></div>
                         <div class="iris"></div>
                       </div>
                       <div class="eyelid"></div>
                     </div>
                     <div class="eye right">
                       <div class="eyeball">
                         <div class="pupil"></div>
                         <div class="iris"></div>
                       </div>
                       <div class="eyelid"></div>
                     </div>
                   </div>
                   <div class="nose"></div>
                   <div class="mouth">
                     <div class="lips"></div>
                     <div class="teeth"></div>
                   </div>
                   <div class="chin"></div>
                 </div>
               </div>
               <div class="avatar-neck"></div>
               <div class="avatar-shoulders">
                 <div class="shoulder left"></div>
                 <div class="shoulder right"></div>
               </div>
             </div>
             <div class="avatar-glow"></div>
           </div>
           <div class="bot-info">
             <h3>Vijay's AI Assistant</h3>
             <p class="bot-status">
               <span class="status-indicator"></span>
               Ready to help!
             </p>
           </div>
           <button class="bot-close" id="bot-close">
             <i class="fas fa-times"></i>
           </button>
         </div>
         <div class="bot-content">
           <div class="bot-message-container">
             <div class="bot-message" id="bot-message">
               <div class="message-icon">
                 <i class="fas fa-comment-dots"></i>
               </div>
               <p>Hi! I'm here to guide you through Vijay's portfolio. I'll introduce each section as you navigate.</p>
             </div>
           </div>
           <div class="bot-controls">
             <button class="bot-btn tertiary" id="bot-mute">
               <i class="fas fa-volume-up"></i>
               <span>Mute</span>
             </button>
             <button class="bot-btn secondary" id="bot-replay" style="display: none;">
               <i class="fas fa-redo"></i>
               <span>Play Again</span>
             </button>
           </div>
           <div class="bot-progress" id="bot-progress">
             <div class="progress-bar"></div>
           </div>
         </div>
         <div class="bot-decoration">
           <div class="decoration-dots">
             <div class="dot"></div>
             <div class="dot"></div>
             <div class="dot"></div>
           </div>
         </div>
       </div>
     `;
        document.body.appendChild(botContainer);

        this.addBotStyles();
    }

    addBotStyles() {
        const style = document.createElement('style');
        style.textContent = `
       /* Bot Toggle Button */
       #bot-toggle {
         position: fixed;
         bottom: 30px;
         right: 30px;
         width: 55px;
         height: 55px;
         background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
         border-radius: 50%;
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;
         box-shadow: 
           0 8px 25px rgba(15, 23, 42, 0.4),
           0 0 0 0 rgba(30, 41, 59, 0.3);
         z-index: 1000;
         transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
         animation: float 4s ease-in-out infinite;
         border: 2px solid rgba(255, 255, 255, 0.1);
       }

       #bot-toggle:hover {
         transform: scale(1.1);
         box-shadow: 
           0 12px 35px rgba(15, 23, 42, 0.5),
           0 0 0 8px rgba(30, 41, 59, 0.15);
         animation-play-state: paused;
         background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
       }

       .bot-toggle-icon {
         color: white;
         font-size: 22px;
         transition: all 0.3s ease;
         filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
       }

       #bot-toggle:hover .bot-toggle-icon {
         transform: rotate(15deg) scale(1.1);
       }

                 /* Bot Container */
       #virtual-assistant {
         position: fixed;
         bottom: 120px;
         right: 30px;
         width: 320px;
         background: rgba(255, 255, 255, 0.98);
         backdrop-filter: blur(25px);
         border-radius: 20px;
         box-shadow: 
           0 25px 80px rgba(0, 0, 0, 0.12),
           0 0 0 1px rgba(255, 255, 255, 0.3);
         z-index: 1001;
         transform: translateY(100%) scale(0.8);
         opacity: 0;
         transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
         border: 2px solid rgba(255, 255, 255, 0.3);
         overflow: hidden;
       }

       #virtual-assistant.visible {
         transform: translateY(0) scale(1);
         opacity: 1;
       }

       .bot-container {
         position: relative;
         overflow: hidden;
         border-radius: 18px;
         background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
       }

                 /* Bot Header */
       .bot-header {
         display: flex;
         align-items: center;
         padding: 18px;
         background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
         color: white;
         position: relative;
         border-radius: 18px 18px 0 0;
       }

       .bot-avatar {
         width: 50px;
         height: 50px;
         margin-right: 14px;
         position: relative;
       }

       /* Human Avatar Styles */
       .human-avatar {
         width: 100%;
         height: 100%;
         position: relative;
         animation: bobbing 3s ease-in-out infinite;
       }

       .avatar-head {
         width: 100%;
         height: 70%;
         position: relative;
         background: linear-gradient(145deg, #ffeaa7 0%, #fab1a0 100%);
         border-radius: 50% 50% 45% 45%;
         box-shadow: 
           inset 0 2px 8px rgba(255, 255, 255, 0.3),
           0 4px 12px rgba(0, 0, 0, 0.15);
         border: 1px solid rgba(255, 255, 255, 0.2);
       }

       .hair {
         position: absolute;
         top: -2px;
         left: 10%;
         right: 10%;
         height: 35%;
         background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
         border-radius: 50% 50% 20% 20%;
         box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
       }

       .face {
         position: relative;
         width: 100%;
         height: 100%;
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         padding-top: 15%;
       }

       .eyebrows {
         display: flex;
         gap: 8px;
         margin-bottom: 3px;
       }

       .eyebrow {
         width: 8px;
         height: 2px;
         background: #2d3436;
         border-radius: 2px;
         animation: eyebrowMove 3s ease-in-out infinite;
       }

       .eyes {
         display: flex;
         gap: 6px;
         margin-bottom: 4px;
       }

       .eye {
         width: 12px;
         height: 8px;
         background: white;
         border-radius: 50%;
         position: relative;
         overflow: hidden;
         box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
       }

       .eyeball {
         width: 100%;
         height: 100%;
         position: relative;
       }

       .iris {
         position: absolute;
         width: 8px;
         height: 8px;
         background: linear-gradient(135deg, #0984e3 0%, #74b9ff 100%);
         border-radius: 50%;
         top: 0;
         left: 2px;
         animation: eyeMove 4s ease-in-out infinite;
       }

       .pupil {
         position: absolute;
         width: 4px;
         height: 4px;
         background: #2d3436;
         border-radius: 50%;
         top: 2px;
         left: 4px;
         z-index: 2;
         animation: eyeMove 4s ease-in-out infinite;
       }

       .eyelid {
         position: absolute;
         top: 0;
         left: 0;
         right: 0;
         height: 0;
         background: #ffeaa7;
         border-radius: 50%;
         animation: blink 4s ease-in-out infinite;
         z-index: 3;
       }

       .nose {
         width: 3px;
         height: 4px;
         background: linear-gradient(145deg, #e17055 0%, #fdcb6e 100%);
         border-radius: 50%;
         margin-bottom: 3px;
         box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
       }

       .mouth {
         position: relative;
         width: 10px;
         height: 6px;
         margin-bottom: 2px;
       }

       .lips {
         width: 100%;
         height: 100%;
         background: linear-gradient(145deg, #e84393 0%, #fd79a8 100%);
         border-radius: 0 0 10px 10px;
         animation: talk 2s ease-in-out infinite alternate;
         box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
       }

       .lips.speaking {
         animation: speaking 0.3s ease-in-out infinite alternate;
       }

       .teeth {
         position: absolute;
         top: 2px;
         left: 2px;
         right: 2px;
         height: 2px;
         background: white;
         border-radius: 1px;
         opacity: 0;
         animation: showTeeth 2s ease-in-out infinite;
       }

       .chin {
         width: 6px;
         height: 3px;
         background: linear-gradient(145deg, #ffeaa7 0%, #fab1a0 100%);
         border-radius: 50%;
         margin-top: 1px;
       }

       .avatar-neck {
         position: absolute;
         bottom: 25%;
         left: 35%;
         right: 35%;
         height: 15%;
         background: linear-gradient(145deg, #ffeaa7 0%, #fab1a0 100%);
         border-radius: 0 0 20% 20%;
         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
       }

       .avatar-shoulders {
         position: absolute;
         bottom: 0;
         left: 0;
         right: 0;
         height: 25%;
         display: flex;
       }

       .shoulder {
         flex: 1;
         background: linear-gradient(145deg, #6c5ce7 0%, #a29bfe 100%);
         border-radius: 20px 20px 0 0;
         box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
       }

       .shoulder.left {
         margin-right: 2px;
         transform: rotate(-5deg);
       }

       .shoulder.right {
         margin-left: 2px;
         transform: rotate(5deg);
       }

       .avatar-glow {
         position: absolute;
         top: -5px;
         left: -5px;
         right: -5px;
         bottom: -5px;
         border-radius: 50%;
         background: linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899);
         opacity: 0.2;
         filter: blur(10px);
         animation: glow 3s ease-in-out infinite alternate;
         z-index: -1;
       }

       .bot-info h3 {
         margin: 0;
         font-size: 17px;
         font-weight: 700;
         background: linear-gradient(45deg, #ffffff, #f1f5f9);
         -webkit-background-clip: text;
         -webkit-text-fill-color: transparent;
         background-clip: text;
         text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
       }

       .bot-status {
         margin: 6px 0 0 0;
         font-size: 13px;
         opacity: 0.95;
         display: flex;
         align-items: center;
         gap: 6px;
         font-weight: 500;
       }

       .status-indicator {
         width: 8px;
         height: 8px;
         background: #10b981;
         border-radius: 50%;
         animation: pulse-indicator 2s ease-in-out infinite;
         box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
       }

      .bot-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .bot-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }

                 /* Bot Content */
       .bot-content {
         padding: 18px;
         background: rgba(255, 255, 255, 0.02);
       }

       .bot-message-container {
         margin-bottom: 16px;
       }

       .bot-message {
         background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
         padding: 14px;
         border-radius: 12px;
         border: 1px solid rgba(99, 102, 241, 0.1);
         position: relative;
         box-shadow: 
           0 4px 12px rgba(0, 0, 0, 0.05),
           inset 0 1px 0 rgba(255, 255, 255, 0.6);
         display: flex;
         align-items: flex-start;
         gap: 10px;
       }

       .message-icon {
         width: 28px;
         height: 28px;
         background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
         border-radius: 50%;
         display: flex;
         align-items: center;
         justify-content: center;
         color: white;
         font-size: 12px;
         flex-shrink: 0;
         box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
       }

       .bot-message p {
         margin: 0;
         color: #334155;
         line-height: 1.6;
         font-size: 14px;
         font-weight: 500;
         flex: 1;
         padding-top: 4px;
       }

       .completion-badge {
         display: inline-block;
         background: linear-gradient(135deg, #10b981 0%, #059669 100%);
         color: white;
         padding: 2px 8px;
         border-radius: 12px;
         font-size: 11px;
         font-weight: 600;
         margin-left: 8px;
         vertical-align: middle;
         box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
       }

       .bot-controls {
         display: flex;
         justify-content: center;
         gap: 10px;
         margin-bottom: 12px;
       }

       .bot-btn {
         padding: 12px 16px;
         border: none;
         border-radius: 10px;
         color: white;
         cursor: pointer;
         transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         display: flex;
         align-items: center;
         justify-content: center;
         gap: 6px;
         font-size: 11px;
         font-weight: 600;
         text-transform: uppercase;
         letter-spacing: 0.5px;
         position: relative;
         overflow: hidden;
         min-width: 85px;
       }

                  .bot-btn.secondary {
         background: linear-gradient(135deg, #10b981 0%, #059669 100%);
         box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
       }

       .bot-btn.tertiary {
         background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
         box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
       }

       .bot-btn.muted {
         background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
         box-shadow: 0 6px 16px rgba(239, 68, 68, 0.3);
       }

       .bot-btn:hover {
         transform: translateY(-4px);
         filter: brightness(1.1);
       }

       .bot-btn.secondary:hover {
         box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
       }

       .bot-btn.tertiary:hover {
         box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
       }

       .bot-btn.muted:hover {
         box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4);
       }

       .bot-btn:disabled {
         opacity: 0.6;
         cursor: not-allowed;
         transform: none;
         filter: none;
       }

       .bot-btn i {
         font-size: 14px;
       }

       /* Progress Bar */
       .bot-progress {
         height: 4px;
         background: rgba(99, 102, 241, 0.1);
         border-radius: 2px;
         overflow: hidden;
         opacity: 0;
         transition: opacity 0.3s ease;
       }

       .bot-progress.active {
         opacity: 1;
       }

       .progress-bar {
         height: 100%;
         background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
         border-radius: 2px;
         transform: translateX(-100%);
         animation: progress 3s ease-in-out;
       }

       /* Decoration */
       .bot-decoration {
         position: absolute;
         bottom: 16px;
         right: 20px;
         opacity: 0.3;
       }

       .decoration-dots {
         display: flex;
         gap: 6px;
       }

       .decoration-dots .dot {
         width: 6px;
         height: 6px;
         background: linear-gradient(45deg, #6366f1, #8b5cf6);
         border-radius: 50%;
         animation: dotPulse 2s ease-in-out infinite;
       }

       .decoration-dots .dot:nth-child(2) {
         animation-delay: 0.3s;
       }

       .decoration-dots .dot:nth-child(3) {
         animation-delay: 0.6s;
       }

                 /* Enhanced Animations */
       @keyframes float {
         0%, 100% { transform: translateY(0px) rotate(0deg); }
         25% { transform: translateY(-8px) rotate(1deg); }
         50% { transform: translateY(-12px) rotate(0deg); }
         75% { transform: translateY(-8px) rotate(-1deg); }
       }

       @keyframes bobbing {
         0%, 100% { transform: translateY(0px) scale(1); }
         50% { transform: translateY(-4px) scale(1.02); }
       }

       @keyframes blink {
         0%, 90%, 100% { height: 0; }
         95% { height: 8px; }
       }

       @keyframes talk {
         0% { transform: scaleY(1); }
         50% { transform: scaleY(0.7); }
         100% { transform: scaleY(1); }
       }

       @keyframes speaking {
         0% { transform: scaleY(1) scaleX(1); border-radius: 0 0 10px 10px; }
         50% { transform: scaleY(1.3) scaleX(1.2); border-radius: 50%; }
         100% { transform: scaleY(1) scaleX(1); border-radius: 0 0 10px 10px; }
       }

       @keyframes glow {
         0% { opacity: 0.15; filter: blur(10px); }
         100% { opacity: 0.25; filter: blur(15px); }
       }

       @keyframes eyeMove {
         0%, 40%, 100% { transform: translateX(0); }
         20% { transform: translateX(-1px); }
         60% { transform: translateX(1px); }
       }

       @keyframes eyebrowMove {
         0%, 80%, 100% { transform: translateY(0); }
         40% { transform: translateY(-1px); }
       }

       @keyframes showTeeth {
         0%, 70%, 100% { opacity: 0; }
         85% { opacity: 0.8; }
       }

       @keyframes pulse-indicator {
         0%, 100% { opacity: 1; transform: scale(1); }
         50% { opacity: 0.5; transform: scale(1.2); }
       }

       @keyframes progress {
         0% { transform: translateX(-100%); }
         100% { transform: translateX(0%); }
       }

       @keyframes dotPulse {
         0%, 100% { opacity: 0.3; transform: scale(1); }
         50% { opacity: 1; transform: scale(1.3); }
       }

                 /* Responsive Design */
       @media (max-width: 768px) {
         #virtual-assistant {
           width: 300px;
           right: 20px;
           bottom: 100px;
         }

         #bot-toggle {
           bottom: 20px;
           right: 20px;
           width: 50px;
           height: 50px;
         }

         .bot-toggle-icon {
           font-size: 20px;
         }

         .bot-header {
           padding: 16px;
         }

         .bot-content {
           padding: 16px;
         }

         .bot-btn {
           padding: 10px 14px;
           font-size: 10px;
           min-width: 75px;
           gap: 4px;
         }
       }

       @media (max-width: 480px) {
         #virtual-assistant {
           width: calc(100vw - 40px);
           right: 20px;
           left: 20px;
         }

         .bot-btn {
           padding: 8px 12px;
           font-size: 9px;
           min-width: 65px;
           gap: 3px;
         }

         .bot-controls {
           flex-wrap: wrap;
           gap: 6px;
         }
       }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        #virtual-assistant {
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bot-message {
          background: rgba(51, 65, 85, 0.8);
        }

        .bot-message p {
          color: #e2e8f0;
        }
      }
    `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById('bot-toggle');
        const closeBtn = document.getElementById('bot-close');
        const muteBtn = document.getElementById('bot-mute');
        const replayBtn = document.getElementById('bot-replay');

        toggleBtn.addEventListener('click', () => this.toggleBot());
        closeBtn.addEventListener('click', () => this.hideBot());
        muteBtn.addEventListener('click', () => this.toggleMute());
        replayBtn.addEventListener('click', () => this.replayCurrentSection());

        // Handle page refresh/navigation
        window.addEventListener('beforeunload', () => {
            this.readSections.clear();
            this.completedSections.clear();
            this.stopAudio();
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            setTimeout(() => this.checkCurrentSection(), 100);
        });

        // Handle scroll events for better section detection
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.checkCurrentSection();
            }, 100);
        });
    }

    observeSections() {
        const options = {
            root: null,
            rootMargin: '-10% 0px -10% 0px',
            threshold: [0.1, 0.3, 0.5, 0.7]
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                    const sectionId = entry.target.id;
                    if (sectionId && sectionContext[sectionId]) {
                        this.handleSectionChange(sectionId);
                    }
                }
            });
        }, options);

        // Observe all sections
        Object.keys(sectionContext).forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                observer.observe(section);
                console.log(`Observing section: ${sectionId}`); // Debug log
            } else {
                console.warn(`Section not found: ${sectionId}`); // Debug log
            }
        });
    }

    handleSectionChange(sectionId) {
        if (this.currentSection === sectionId) return;

        // Clear any existing timer
        if (this.sectionTimer) {
            clearTimeout(this.sectionTimer);
            this.sectionTimer = null;
        }

        // Stop any current audio when changing sections
        this.stopAudio();

        this.currentSection = sectionId;

        // Always update message when section changes (only if bot is visible)
        if (this.isVisible) {
            this.updateBotMessage(sectionId);

            // Show replay button if section is completed, hide if not
            if (this.completedSections.has(sectionId)) {
                this.showReplayButton();
            } else {
                this.hideReplayButton();
            }
        }

        // Auto-play audio after 0.5 seconds if bot is visible, not muted, user stays in section, and section hasn't been completed
        if (this.isVisible && !this.isMuted && !this.completedSections.has(sectionId)) {
            this.sectionTimer = setTimeout(() => {
                // Double check if we're still in the same section, bot is still visible, and section hasn't been completed
                if (this.currentSection === sectionId && this.isVisible && !this.completedSections.has(sectionId)) {
                    this.readSections.add(sectionId);
                    this.playCurrentSectionAudio();
                    this.showProgress();
                }
                this.sectionTimer = null;
            }, 500); // 0.5 second delay
        }
    }

    updateBotMessage(sectionId) {
        const message = sectionContext[sectionId];
        const messageElement = document.getElementById('bot-message');

        if (messageElement && message) {
            const isCompleted = this.completedSections.has(sectionId);
            const iconClass = isCompleted ? 'fas fa-check-circle' : 'fas fa-comment-dots';
            const iconColor = isCompleted ? '#10b981' : '';

            messageElement.innerHTML = `
        <div class="message-icon" ${iconColor ? `style="background: ${iconColor};"` : ''}>
          <i class="${iconClass}"></i>
        </div>
        <p>${message} ${isCompleted ? '<span class="completion-badge">✓ Completed</span>' : ''}</p>
      `;

            // Add typing animation
            messageElement.style.opacity = '0';
            setTimeout(() => {
                messageElement.style.opacity = '1';
            }, 200);
        }
    }

    formatSectionName(sectionId) {
        return sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace(/([A-Z])/g, ' $1');
    }

    async playCurrentSectionAudio() {
        if (!this.currentSection || this.isReading || this.isMuted || !this.isVisible) return;

        this.stopAudio();

        const audioPath = `./images/audio/${this.currentSection}.wav`;
        const mouth = document.querySelector('.lips');

        try {
            this.isReading = true;
            mouth.classList.add('speaking');

            this.currentAudio = new Audio(audioPath);

            this.currentAudio.addEventListener('ended', () => {
                // Mark section as completed when audio finishes
                if (this.currentSection) {
                    this.completedSections.add(this.currentSection);
                    this.showReplayButton();
                    this.updateBotMessage(this.currentSection);
                }
                this.stopAudio();
            });

            this.currentAudio.addEventListener('error', () => {
                console.warn(`Audio file not found: ${audioPath}, falling back to text-to-speech`);
                this.fallbackToTTS();
            });

            await this.currentAudio.play();
            this.showProgress();

        } catch (error) {
            console.warn('Audio playback failed, falling back to text-to-speech:', error);
            this.fallbackToTTS();
        }
    }

    fallbackToTTS() {
        if (!this.currentSection || this.isMuted || !this.isVisible) return;

        const message = sectionContext[this.currentSection];
        const utterance = new SpeechSynthesisUtterance(message);

        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        utterance.onend = () => {
            // Mark section as completed when TTS finishes
            if (this.currentSection) {
                this.completedSections.add(this.currentSection);
                this.showReplayButton();
                this.updateBotMessage(this.currentSection);
            }
            this.stopAudio();
        };

        this.speechSynthesis.speak(utterance);
    }

    stopAudio() {
        const mouth = document.querySelector('.lips');
        const progressBar = document.getElementById('bot-progress');

        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }

        if (this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
        }

        this.isReading = false;

        if (mouth) mouth.classList.remove('speaking');

        // Hide progress bar
        if (progressBar) {
            progressBar.classList.remove('active');
        }
    }

    toggleBot() {
        if (this.isVisible) {
            this.hideBot();
        } else {
            this.showBot();
        }
    }

    showBot() {
        const bot = document.getElementById('virtual-assistant');
        const toggleBtn = document.getElementById('bot-toggle');

        this.isVisible = true;
        bot.classList.add('visible');
        toggleBtn.style.transform = 'scale(0.8)';

        // Check current section and update message
        this.checkCurrentSection();

        // Force check again after a short delay to ensure proper detection
        setTimeout(() => {
            this.checkCurrentSection();
        }, 100);

        // Auto-play current section if not muted and not completed (with 0.5s delay)
        if (this.currentSection && !this.isMuted && !this.completedSections.has(this.currentSection)) {
            this.sectionTimer = setTimeout(() => {
                if (this.currentSection && this.isVisible) {
                    this.playCurrentSectionAudio();
                }
                this.sectionTimer = null;
            }, 500);
        }

        setTimeout(() => {
            toggleBtn.style.transform = 'scale(1)';
        }, 200);
    }

    hideBot() {
        const bot = document.getElementById('virtual-assistant');
        const toggleBtn = document.getElementById('bot-toggle');

        this.isVisible = false;
        bot.classList.remove('visible');

        // Clear any pending timers when hiding bot
        if (this.sectionTimer) {
            clearTimeout(this.sectionTimer);
            this.sectionTimer = null;
        }

        this.stopAudio();
        this.hideReplayButton();

        toggleBtn.style.transform = 'scale(1.1)';
        setTimeout(() => {
            toggleBtn.style.transform = 'scale(1)';
        }, 200);
    }

    showProgress() {
        const progressBar = document.getElementById('bot-progress');
        if (progressBar) {
            progressBar.classList.add('active');

            // Reset and restart animation
            const bar = progressBar.querySelector('.progress-bar');
            bar.style.animation = 'none';
            setTimeout(() => {
                bar.style.animation = 'progress 3s ease-in-out';
            }, 10);
        }
    }

    showReplayButton() {
        const replayBtn = document.getElementById('bot-replay');
        if (replayBtn && this.isVisible) {
            replayBtn.style.display = 'flex';
            // Add entrance animation
            replayBtn.style.transform = 'scale(0.8)';
            replayBtn.style.opacity = '0';
            setTimeout(() => {
                replayBtn.style.transform = 'scale(1)';
                replayBtn.style.opacity = '1';
            }, 100);
        }
    }

    hideReplayButton() {
        const replayBtn = document.getElementById('bot-replay');
        if (replayBtn) {
            replayBtn.style.display = 'none';
        }
    }

    replayCurrentSection() {
        if (!this.currentSection || this.isReading) return;

        // Hide replay button during playback
        this.hideReplayButton();

        // Remove from completed sections temporarily to allow replay
        this.completedSections.delete(this.currentSection);

        // Play the audio
        this.playCurrentSectionAudio();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('bot-mute');
        const muteIcon = muteBtn.querySelector('i');
        const muteText = muteBtn.querySelector('span');

        if (this.isMuted) {
            // Clear any pending timers
            if (this.sectionTimer) {
                clearTimeout(this.sectionTimer);
                this.sectionTimer = null;
            }

            // Stop any current audio
            this.stopAudio();

            // Update button appearance
            muteBtn.classList.add('muted');
            muteIcon.className = 'fas fa-volume-mute';
            muteText.textContent = 'Unmute';

            // Update bot status
            const statusElement = document.querySelector('.bot-status');
            if (statusElement) {
                const indicator = statusElement.querySelector('.status-indicator');
                if (indicator) {
                    indicator.style.background = '#ef4444';
                }
                statusElement.innerHTML = '<span class="status-indicator"></span>Audio muted';
            }
        } else {
            // Update button appearance
            muteBtn.classList.remove('muted');
            muteIcon.className = 'fas fa-volume-up';
            muteText.textContent = 'Mute';

            // Update bot status
            const statusElement = document.querySelector('.bot-status');
            if (statusElement) {
                const indicator = statusElement.querySelector('.status-indicator');
                if (indicator) {
                    indicator.style.background = '#10b981';
                }
                statusElement.innerHTML = '<span class="status-indicator"></span>Ready to help!';
            }

            // Check current section when unmuting
            this.checkCurrentSection();

            // Auto-play current section if available, bot is visible, and section hasn't been completed (with delay)
            if (this.currentSection && this.isVisible && !this.completedSections.has(this.currentSection)) {
                this.sectionTimer = setTimeout(() => {
                    this.playCurrentSectionAudio();
                    this.sectionTimer = null;
                }, 500);
            }
        }
    }

    debugSections() {
        console.log('=== SECTION DEBUG INFO ===');
        Object.keys(sectionContext).forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                const rect = element.getBoundingClientRect();
                console.log(`Section ${sectionId}:`, {
                    exists: true,
                    offsetTop: element.offsetTop,
                    offsetHeight: element.offsetHeight,
                    rectTop: rect.top,
                    rectBottom: rect.bottom,
                    inViewport: rect.top < window.innerHeight && rect.bottom > 0
                });
            } else {
                console.warn(`Section ${sectionId}: NOT FOUND`);
            }
        });
        console.log('Current scroll position:', window.scrollY);
        console.log('Window height:', window.innerHeight);
        console.log('=== END DEBUG INFO ===');
    }

    checkCurrentSection() {
        // Get current section based on scroll position with header offset
        const sections = Object.keys(sectionContext);
        let currentSection = null;
        const headerHeight = document.getElementById('header')?.offsetHeight || 80;
        const scrollPosition = window.scrollY + headerHeight + 100;

        // Find the section that contains the current scroll position
        for (const sectionId of sections) {
            const element = document.getElementById(sectionId);
            if (element) {
                const sectionTop = element.offsetTop;
                const sectionBottom = sectionTop + element.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentSection = sectionId;
                    break;
                }
            }
        }

        // If no section found by scroll position, try viewport method as fallback
        if (!currentSection) {
            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Check if section is in viewport with reasonable threshold
                    if (rect.top < window.innerHeight * 0.6 && rect.bottom > window.innerHeight * 0.4) {
                        currentSection = sectionId;
                        break;
                    }
                }
            }
        }

        console.log(`Current section detected: ${currentSection}`); // Debug log

        if (currentSection && currentSection !== this.currentSection) {
            this.handleSectionChange(currentSection);
        } else if (currentSection) {
            this.currentSection = currentSection;
            this.updateBotMessage(currentSection);
        }
    }
}

// Initialize the Virtual Assistant
const virtualAssistant = new VirtualAssistant();

