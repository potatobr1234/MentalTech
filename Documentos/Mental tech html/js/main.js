// Mental Tech — shared site behaviour
// Handles the hamburger menu (3-line icon) used in the header on every page.

document.addEventListener('DOMContentLoaded', function () {
  var toggles = document.querySelectorAll('.menu-toggle');

  toggles.forEach(function (toggle) {
    var panelId = toggle.getAttribute('aria-controls');
    var panel = document.getElementById(panelId);
    if (!panel) return;

    function closeMenu() {
      panel.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
      panel.classList.add('open');
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      var isOpen = panel.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close the menu after a link inside it is clicked.
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Close the menu when clicking anywhere outside of it.
    document.addEventListener('click', function (event) {
      if (!panel.contains(event.target) && event.target !== toggle) {
        closeMenu();
      }
    });

    // Close the menu on Escape.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  });
});
