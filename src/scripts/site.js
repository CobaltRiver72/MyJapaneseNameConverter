function toggleMobileNav() {
    const nav = document.querySelector('.header-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
}
