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

  // ── Boot ────────────────────────────────────────────────
  async function init() {
    document.body.style.overflow = 'hidden';

    await preloadVideo();

    document.body.style.overflow = '';
    dismissLoading();
    initScrollVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
