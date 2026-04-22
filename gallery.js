/* ============================================================
   MAJESTIC GARAGE DOORS — Gallery Page Interactions
   ============================================================ */

(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  // ── Dismiss Loading Overlay ─────────────────────────────
  function dismissLoading() {
    const loadingBar = document.getElementById('loadingBar');
    const loadingOverlay = document.getElementById('loadingOverlay');

    if (loadingBar) {
      setTimeout(() => {
        loadingBar.style.width = '100%';
        setTimeout(() => {
          if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
              loadingOverlay.style.display = 'none';
            }, 800);
          }
        }, 200);
      }, 300);
    }
  }

  // ── Hero Entrance Animation ─────────────────────────────
  function initHero() {
    const heroContent = document.querySelectorAll('.gallery-hero__label, .gallery-hero__heading, .gallery-hero__rule, .gallery-hero__text');
    
    if (!heroContent.length) return;

    gsap.from(heroContent, {
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      delay: 0.5 // Wait for loading screen to clear
    });
  }

  // ── Gallery Grid Entrance & Hover Effects ───────────────
  function initGalleryGrid() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    if (!galleryItems.length) return;

    // Staggered scroll entrance
    gsap.from(galleryItems, {
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.gallery-grid',
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });

    // 3D tilt tracking for each poster
    galleryItems.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Tilt angles
        const rotateY = ((x - centerX) / centerX) * 4;
        const rotateX = ((centerY - y) / centerY) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.zIndex = '10';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.zIndex = '1';
      });
    });
  }

  // ── Lightbox Logic ──────────────────────────────────────
  function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item__img');
    const lightbox = document.getElementById('galleryLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    if (!lightbox || !galleryItems.length) return;

    let currentIndex = 0;
    const images = Array.from(galleryItems).map(img => img.src);

    function openLightbox(index) {
      currentIndex = index;
      lightboxImg.src = images[currentIndex];
      lightbox.classList.add('lightbox--active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeLightbox() {
      lightbox.classList.remove('lightbox--active');
      document.body.style.overflow = '';
      setTimeout(() => { lightboxImg.src = ''; }, 400); // Clear image after transition
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      lightboxImg.src = images[currentIndex];
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      lightboxImg.src = images[currentIndex];
    }

    galleryItems.forEach((img, index) => {
      // Add click to parent wrapper to ensure clicking anywhere on the item opens the image
      img.closest('.gallery-item').addEventListener('click', () => {
        openLightbox(index);
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('lightbox--active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    });
  }

  // ── Boot ────────────────────────────────────────────────
  function init() {
    dismissLoading();
    initHero();
    initGalleryGrid();
    initLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
