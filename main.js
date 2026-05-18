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
  const hamburger       = document.getElementById('hamburger');
  const mobileMenu      = document.getElementById('mobileMenu');

  // ── State ───────────────────────────────────────────────
  let videoReady   = false;
  let taglineShown = false;

  // ── Register GSAP Plugin ────────────────────────────────
  gsap.registerPlugin(ScrollTrigger);

  // ── Dismiss Loading Overlay ─────────────────────────────
  function dismissLoading() {
    loadingBar.style.width = '100%';
    setTimeout(() => {
      loadingOverlay.classList.add('loading-overlay--hidden');
      setTimeout(() => { loadingOverlay.style.display = 'none'; }, 800);
    }, 200);
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

  // ── Initialize Hero Video ───────────────────────────────
  function initHeroVideo() {
    const startVideo = () => {
      videoReady = true;
      video.playbackRate = 1.25;
      video.play().catch(err => console.warn("Autoplay blocked:", err));
      
      // Reveal tagline and navbar immediately after a short intro delay
      setTimeout(() => {
        revealTagline();
      }, 800);
    };

    if (video.readyState >= 2) {
      startVideo();
    } else {
      video.addEventListener('loadeddata', startVideo, { once: true });
    }

    // Simple scroll trigger to hide scroll indicator
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom center',
      onUpdate: (self) => {
        if (self.progress > 0.05) {
          scrollIndicator.classList.add('scroll-indicator--hidden');
        } else {
          scrollIndicator.classList.remove('scroll-indicator--hidden');
        }
      }
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

  // ── About Us (History) Animations ──────────────────────
  function initAboutUsAnimations() {
    const aboutUsCopy = document.querySelector('.about-us__copy');
    const visuals = document.querySelector('.about-us__visuals');

    if (!aboutUsCopy || !visuals) return;

    // Visuals entrance
    gsap.from('.about-us__img-wrapper--1', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: visuals,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    gsap.from('.about-us__img-wrapper--2', {
      opacity: 0,
      x: -40,
      duration: 1,
      delay: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: visuals,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    gsap.from('.about-us__badge', {
      opacity: 0,
      scale: 0,
      rotation: -45,
      duration: 0.8,
      delay: 0.6,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: visuals,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Copy staggered entrance
    const copyElements = aboutUsCopy.querySelectorAll('.about-us__label, .about-us__heading, .about-us__rule, .about-us__text');
    gsap.from(copyElements, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: aboutUsCopy,
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

    // Marquee entrance (only on desktop to avoid scroll conflicts if needed, or keep for both but refresh)
    gsap.from('.reviews-marquee', {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.reviews-marquee',
        start: 'top 95%', // increased start threshold to ensure it triggers
        toggleActions: 'play none none none',
      },
    });
  }

  // ── Gallery Teaser Animations ──────────────────────────
  function initGalleryTeaser() {
    const teaserContent = document.querySelectorAll('.gallery-teaser__label, .gallery-teaser__heading, .gallery-teaser__rule, .gallery-teaser__text, .gallery-teaser__cta');
    const teaserImages = document.querySelectorAll('.teaser-image');

    if (!teaserContent.length || !teaserImages.length) return;

    // Content fade up
    gsap.from(teaserContent, {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.gallery-teaser',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Image stagger entry
    gsap.fromTo(teaserImages, {
      opacity: 0,
      x: 50,
      rotationY: 15
    }, {
      opacity: 1,
      x: 0,
      rotationY: 0,
      transformOrigin: 'left center',
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.gallery-teaser__visuals',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  }

  // ── Mobile Menu Toggle ──────────────────────────────────
  function toggleMenu() {
    hamburger.classList.toggle('navbar__hamburger--active');
    mobileMenu.classList.toggle('mobile-menu--active');
    
    // Prevent scrolling when menu is open
    if (mobileMenu.classList.contains('mobile-menu--active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // Expose toggleMenu to window for the onclick handlers (if needed) or wire up here
  window.toggleMenu = toggleMenu;

  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }

  // ── Boot ────────────────────────────────────────────────
  function init() {
    document.body.style.overflow = 'hidden';

    // Ultra-fast loading bar animation (200ms)
    loadingBar.style.transition = 'width 0.2s ease-out';
    loadingBar.style.width = '100%';

    // Initialize components
    initHeroVideo();
    initComparison();
    initAboutAnimations();
    initAboutUsAnimations();
    initServiceCards();
    initGalleryTeaser();
    initReviewsCarousel();

    // Dismiss loading overlay almost instantly
    setTimeout(() => {
      document.body.style.overflow = '';
      dismissLoading();
    }, 200);

    // ── Handle Hash Links on Load with Pinned Sections ──────
    if (window.location.hash) {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Allow time for layout and initial animations
    }

    // Refresh ScrollTrigger after all images and fonts load to fix 50/50 disappearance bug
    if (document.readyState === 'complete') {
      setTimeout(() => ScrollTrigger.refresh(), 100);
    } else {
      window.addEventListener('load', () => {
        ScrollTrigger.refresh();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

