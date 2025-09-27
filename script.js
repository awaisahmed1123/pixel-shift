document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', (event) => {
            // Stop click from propagating to the document
            event.stopPropagation();
            mobileMenu.classList.toggle('is-open');
        });

        // Click outside to close
        document.addEventListener('click', (event) => {
            const isClickInsideMenu = mobileMenu.contains(event.target);
            const isClickOnHamburger = hamburgerBtn.contains(event.target);

            if (mobileMenu.classList.contains('is-open') && !isClickInsideMenu && !isClickOnHamburger) {
                mobileMenu.classList.remove('is-open');
            }
        });
    }
});