document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  
  window.toggleMenu = function() {
    if (hamburger && mobileMenu) {
      hamburger.classList.toggle('navbar__hamburger--active');
      mobileMenu.classList.toggle('mobile-menu--active');
      document.body.style.overflow = mobileMenu.classList.contains('mobile-menu--active') ? 'hidden' : '';
    }
  };

  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }

  // Mobile menu dropdowns
  const dropdowns = document.querySelectorAll('.mobile-menu__dropdown');
  dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('.mobile-menu__link');
    if (link) {
      link.addEventListener('click', (e) => {
        // Only prevent default if it's acting as a toggle
        e.preventDefault();
        dropdown.classList.toggle('active');
      });
    }
  });

  // Ensure logo closes mobile menu
  const navBrands = document.querySelectorAll('.navbar__brand a');
  navBrands.forEach(brand => {
    brand.addEventListener('click', () => {
      if (mobileMenu && mobileMenu.classList.contains('mobile-menu--active')) {
        toggleMenu();
      }
    });
  });
});
