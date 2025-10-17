document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mainContainer = document.querySelector('.main-container'); // Bahar click karne ke liye

    if (hamburgerBtn && mobileMenu) {
        
        // 1. Hamburger button click karne par menu toggle karna
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Taake 'document' ka click event na chale
            mobileMenu.classList.toggle('open');
        });

        // 2. Menu ke bahar click karne par menu band karna
        document.addEventListener('click', (e) => {
            // Check karein ke click menu ya hamburger button ke andar nahi hua
            if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                if (mobileMenu.classList.contains('open')) {
                    mobileMenu.classList.remove('open');
                }
            }
        });

        // 3. Menu ke andar kisi link par click karne par menu band karna
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
            });
        });
    }
});