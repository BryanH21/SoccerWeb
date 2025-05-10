// HAMBURGER MENU LOGIC
document.addEventListener("DOMContentLoaded", function () {
    const menu = document.querySelector(".nav-links");
    const toggle = document.querySelector(".hamburger");

    if (menu && toggle) {
        toggle.addEventListener("click", function () {
            menu.classList.toggle("active");
        });
    } else {
        console.error("Error: Hamburger menu elements not found!");
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".card");
  
    cards.forEach(card => {
      card.addEventListener("click", () => {
        // Collapse other cards
        cards.forEach(c => {
          if (c !== card) c.classList.remove("expanded");
        });
  
        // Toggle clicked card
        card.classList.toggle("expanded");
      });
    });
  });