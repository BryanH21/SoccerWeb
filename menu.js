document.addEventListener("DOMContentLoaded", function () {
    const menu = document.querySelector(".nav-links");
    const toggle = document.querySelector(".hamburger");

    toggle.addEventListener("click", function () {
        menu.classList.toggle("active");
    });
});