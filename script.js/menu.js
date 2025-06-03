document.addEventListener("DOMContentLoaded", function () {
  const menu = document.querySelector(".nav-links");
  const toggle = document.querySelector(".hamburger");

  if (menu && toggle) {
      toggle.addEventListener("click", function () {
          menu.classList.toggle("active");
      });
  } else {
      console.error("Hamburger or nav menu not found.");
  }
});