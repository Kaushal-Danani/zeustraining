const hamburger = document.querySelector(".hamburger");
const navItems = document.querySelector(".mobile-navbar");

hamburger.addEventListener("click", () => {
    const isOpen = hamburger.classList.toggle("open");
    navItems.classList.toggle('show');

    hamburger.setAttribute('aria-expanded', isOpen);
})