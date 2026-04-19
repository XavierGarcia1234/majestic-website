/* ============================================================
   MAJESTIC GARAGE DOORS — Scroll-Driven Hero Video Engine
   
   Uses an all-keyframe re-encoded video (herovid_scroll.mp4)
   for instant seeking at any position. Combined with a 
   requestAnimationFrame interpolation loop for buttery-smooth
   scroll-driven playback.
   
   No frame extraction needed. Minimal load time.
   ============================================================ */

(function () {
  'use strict';

  // ── DOM References ──────────────────────────────────────
  const video           = document.getElementById('heroVideo');
  const hero            = document.getElementById('hero');
  const navbar          = document.getElementById('navbar');
  const tagline         = document.getElementById('heroTagline');
  const taglineLine     = document.getElementById('taglineLine');
  const scrollIndicator = document.getElementById('scrollIndicator');
  const loadingOverlay  = document.getElementById('loadingOverlay');
  const loadingBar      = document.getElementById('loadingBar');

  // ── State ───────────────────────────────────────────────
  let videoReady   = false;
  let taglineShown = false;
  let targetTime   = 0;
  let currentTime  = 0;

  // Lerp factor — controls the smooth glide speed
  // Higher = more responsive, lower = smoother glide
  const LERP = 0.12;

  // ── Register GSAP Plugin ────────────────────────────────
  gsap.registerPlugin(ScrollTrigger);

  // ── Preload Video ───────────────────────────────────────
  // Fetch as blob so the entire file is in memory for 
  // instant seeking (no network round-trips on seek)
  async function preloadVideo() {
    try {
      loadingBar.style.width = '5%';

      const response = await fetch('assets/herovid_scroll.mp4');
      if (!response.ok) throw new Error('Fetch failed');

      const reader = response.body.getReader();
      const contentLength = +response.headers.get('Content-Length') || 0;
      let received = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;

        if (contentLength > 0) {
          loadingBar.style.width = Math.min(90, (received / contentLength) * 90) + '%';
        }
      }

      const blob = new Blob(chunks, { type: 'video/mp4' });
      const blobUrl = URL.createObjectURL(blob);

      // Remove any <source> children and set src directly
      while (video.firstChild) video.removeChild(video.firstChild);
      video.src = blobUrl;
      video.load();

      loadingBar.style.width = '95%';

      return new Promise((resolve) => {
        const ready = () => { videoReady = true; resolve(); };
        video.addEventListener('loadeddata', ready, { once: true });
        if (video.readyState >= 2) ready();
      });

    } catch (err) {
      console.warn('Blob preload failed, using native:', err);
      // Fallback: let browser load natively
      while (video.firstChild) video.removeChild(video.firstChild);
      video.src = 'assets/herovid_scroll.mp4';
      return new Promise((resolve) => {
        const ready = () => { videoReady = true; resolve(); };
        video.addEventListener('loadeddata', ready, { once: true });
        if (video.readyState >= 2) ready();
      });
    }
  }

  // ── Dismiss Loading Overlay ─────────────────────────────
  function dismissLoading() {
    loadingBar.style.width = '100%';
    setTimeout(() => {
      loadingOverlay.classList.add('loading-overlay--hidden');
      setTimeout(() => { loadingOverlay.style.display = 'none'; }, 800);
    }, 200);
  }

  // ── Smooth rAF Interpolation Loop ──────────────────────
  // Runs every frame at 60fps. Smoothly lerps video.currentTime
  // toward the scroll-target time. Because the video has every
  // frame as a keyframe, seeking is instant — no decode lag.
  function startSmoothLoop() {
    function tick() {
      if (videoReady && video.duration) {
        const delta = targetTime - currentTime;

        if (Math.abs(delta) > 0.005) {
          currentTime += delta * LERP;
          currentTime = Math.max(0, Math.min(currentTime, video.duration));
          video.currentTime = currentTime;
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Show Tagline + Navbar ───────────────────────────────
  function revealTagline() {
    if (taglineShown) return;
    taglineShown = true;

    const tl = gsap.timeline();
    tl.to(tagline, { opacity: 1, duration: 1, ease: 'power2.out' })
      .from('.tagline--semibold', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.7')
      .from('.tagline--bold', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .to(taglineLine, { opacity: 1, scaleX: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      .add(() => {
        navbar.classList.remove('navbar--hidden');
        navbar.classList.add('navbar--visible');
      }, '-=0.3');
  }

  // ── Hide Tagline + Navbar ───────────────────────────────
  function hideTagline() {
    if (!taglineShown) return;
    taglineShown = false;

    gsap.to(tagline, { opacity: 0, duration: 0.4, ease: 'power2.in' });
    gsap.to(taglineLine, { opacity: 0, scaleX: 0, duration: 0.3, ease: 'power2.in' });
    navbar.classList.remove('navbar--visible');
    navbar.classList.add('navbar--hidden');
  }

  // ── Initialize ScrollTrigger ────────────────────────────
  function initScrollVideo() {
    video.currentTime = 0;
    currentTime = 0;
    targetTime = 0;

    startSmoothLoop();

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '+=300%',
      pin: true,
      scrub: 0.1,
      onUpdate: (self) => {
        if (!videoReady || !video.duration) return;

        // Map 0–0.85 scroll to full video, 0.85–1.0 holds final frame
        const videoProgress = Math.min(self.progress / 0.85, 1);
        targetTime = videoProgress * video.duration;

        // Scroll indicator
        if (self.progress > 0.02) {
          scrollIndicator.classList.add('scroll-indicator--hidden');
        } else {
          scrollIndicator.classList.remove('scroll-indicator--hidden');
        }

        // Tagline reveal
        if (self.progress >= 0.85) {
          revealTagline();
        } else if (self.progress < 0.8) {
          hideTagline();
        }
      },
    });
  }

  // ── Before / After Comparison Slider ───────────────────
  function initComparison() {
    const wrapper = document.querySelector('.comparison__wrapper');
    const beforeEl = document.getElementById('comparisonBefore');
    const slider   = document.getElementById('comparisonSlider');

    if (!wrapper || !beforeEl || !slider) return;

    let isDragging = false;
    let wrapperRect = wrapper.getBoundingClientRect();

    function updateSlider(clientX) {
      wrapperRect = wrapper.getBoundingClientRect();
      const x = clientX - wrapperRect.left;
      const pct = Math.max(0, Math.min(x / wrapperRect.width, 1));

      // Update clip-path on "before" overlay
      beforeEl.style.clipPath = `inset(0 ${(1 - pct) * 100}% 0 0)`;
      // Move slider line
      slider.style.left = `${pct * 100}%`;
    }

    // Pointer events (mouse + touch unified)
    wrapper.addEventListener('pointerdown', (e) => {
      isDragging = true;
      wrapper.setPointerCapture(e.pointerId);
      updateSlider(e.clientX);
    });

    wrapper.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    });

    wrapper.addEventListener('pointerup', () => { isDragging = false; });
    wrapper.addEventListener('pointercancel', () => { isDragging = false; });

    // Auto-animate on first scroll into view: sweep from 50% → 20% → 80% → 50%
    ScrollTrigger.create({
      trigger: wrapper,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ delay: 0.3 });
        const animate = { val: 50 };

        tl.to(animate, {
          val: 15,
          duration: 0.9,
          ease: 'power2.inOut',
          onUpdate: () => {
            const pct = animate.val / 100;
            beforeEl.style.clipPath = `inset(0 ${(1 - pct) * 100}% 0 0)`;
            slider.style.left = `${pct * 100}%`;
          },
        })
        .to(animate, {
          val: 85,
          duration: 1.1,
          ease: 'power2.inOut',
          onUpdate: () => {
            const pct = animate.val / 100;
            beforeEl.style.clipPath = `inset(0 ${(1 - pct) * 100}% 0 0)`;
            slider.style.left = `${pct * 100}%`;
          },
        })
        .to(animate, {
          val: 50,
          duration: 0.7,
          ease: 'power2.inOut',
          onUpdate: () => {
            const pct = animate.val / 100;
            beforeEl.style.clipPath = `inset(0 ${(1 - pct) * 100}% 0 0)`;
            slider.style.left = `${pct * 100}%`;
          },
        });
      },
    });
  }

  // ── About Section Scroll Animations ────────────────────
  function initAboutAnimations() {
    const aboutCopy = document.querySelector('.about__copy');
    const comparison = document.querySelector('.about__comparison');

    if (!aboutCopy || !comparison) return;

    // Comparison image entrance
    gsap.from(comparison, {
      opacity: 0,
      x: -60,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: comparison,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Copy elements staggered entrance
    const copyElements = aboutCopy.querySelectorAll('.about__label, .about__heading, .about__rule, .about__text, .about__cta');

    gsap.from(copyElements, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: aboutCopy,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  }

  // ── Service Cards — 3D Tilt + Glow + Scroll Animations ──
  function initServiceCards() {
    const cards = document.querySelectorAll('.service-card');
    if (!cards.length) return;

    // 3D tilt + glow tracking
    cards.forEach((card) => {
      const glow = card.querySelector('.service-card__glow');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Tilt angles (max ±6°)
        const rotateY = ((x - centerX) / centerX) * 6;
        const rotateX = ((centerY - y) / centerY) * 6;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        // Move glow orb
        if (glow) {
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // Staggered scroll entrance
    gsap.from(cards, {
      opacity: 0,
      y: 60,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.services__grid',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    // Header entrance
    const headerEls = document.querySelectorAll('.services__label, .services__heading, .services__rule');
    gsap.from(headerEls, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.services__header',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  }

  // ── Reviews Marquee — 3D Tilt + Scroll Animations ──────
  function initReviewsCarousel() {
    const cards = document.querySelectorAll('.review-card');
    if (!cards.length) return;

    // 3D tilt + glow tracking on review cards
    cards.forEach((card) => {
      const glow = card.querySelector('.review-card__glow');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = ((x - centerX) / centerX) * 5;
        const rotateX = ((centerY - y) / centerY) * 5;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

        if (glow) {
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // GSAP Scroll Entrance — Header
    const headerEls = document.querySelectorAll('.reviews__label, .reviews__heading, .reviews__rule, .reviews__google-badge');
    gsap.from(headerEls, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.reviews__header',
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    // Marquee entrance
    gsap.from('.reviews-marquee', {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.reviews-marquee',
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  }

  // ── Boot ────────────────────────────────────────────────
  async function init() {
    document.body.style.overflow = 'hidden';

    await preloadVideo();

    document.body.style.overflow = '';
    dismissLoading();
    initScrollVideo();
    initComparison();
    initAboutAnimations();
    initServiceCards();
    initReviewsCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

