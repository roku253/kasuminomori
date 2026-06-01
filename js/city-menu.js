(function () {
  function placeTopMenu() {
    if (!document.body.classList.contains("city-body--top")) return;
    var btn = document.getElementById("city-open-menu");
    var header = document.querySelector(".city-top-header");
    if (btn && header && btn.parentElement !== header) {
      header.appendChild(btn);
    }
  }

  function bindMenu() {
    placeTopMenu();
    var panel = document.getElementById("city-mega-panel");
    var btn = document.getElementById("city-open-menu");
    if (!panel || !btn) return;

    function toggle() {
      var open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        btn.setAttribute("aria-expanded", "true");
        document.body.classList.add("city-mega-open");
      } else {
        panel.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", "false");
        document.body.classList.remove("city-mega-open");
      }
    }

    btn.addEventListener("click", toggle);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hasAttribute("hidden")) toggle();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      document.addEventListener("city-includes-loaded", bindMenu);
    });
  } else {
    document.addEventListener("city-includes-loaded", bindMenu);
  }
})();
