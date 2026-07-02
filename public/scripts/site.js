function toggleMobileNav() {
    const nav = document.querySelector('.header-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
}

// FAQ toggle
function toggleFaq(el) {
    const item = el.parentElement;
    const isOpen = item.classList.toggle('open');
    el.setAttribute('aria-expanded', isOpen);
    const answer = el.nextElementSibling;
    if (answer) answer.setAttribute('aria-hidden', !isOpen);
}
