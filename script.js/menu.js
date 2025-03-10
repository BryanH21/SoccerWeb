document.addEventListener("DOMContentLoaded", function () {
    // Select elements
    const menu = document.querySelector(".nav-links");
    const toggle = document.querySelector(".hamburger");

    if (menu && toggle) {
        toggle.addEventListener("click", function () {
            menu.classList.toggle("active");

            // Debugging: Log to console
            console.log("Hamburger clicked. Active class toggled:", menu.classList.contains("active"));
        });
    } else {
        console.error("Error: Hamburger menu elements not found!");
    }
});