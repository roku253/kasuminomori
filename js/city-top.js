(function () {
  function bindTools() {
    var modal = document.getElementById("city-tools-modal");
    var openBtn = document.getElementById("city-open-tools");
    var openTop = document.getElementById("city-open-tools-top");
    function open() {
      if (modal) {
        modal.hidden = false;
        document.body.style.overflow = "hidden";
      }
    }
    function close() {
      if (modal) {
        modal.hidden = true;
        document.body.style.overflow = "";
      }
    }
    if (openBtn) openBtn.addEventListener("click", open);
    if (openTop) openTop.addEventListener("click", open);
    document.querySelectorAll("[data-close-tools]").forEach(function (el) {
      el.addEventListener("click", close);
    });
  }

  function bindMenu() {
    var panel = document.getElementById("city-mega-panel");
    var btn = document.getElementById("city-open-menu");
    var fab = document.getElementById("city-menu-fab");
    function toggle() {
      if (!panel) return;
      var open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        if (btn) btn.setAttribute("aria-expanded", "true");
      } else {
        panel.setAttribute("hidden", "");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    }
    if (btn) btn.addEventListener("click", toggle);
    if (fab) fab.addEventListener("click", toggle);
  }

  function bindHero() {
    var slides = document.querySelectorAll(".city-top-hero__slide");
    if (slides.length < 2) return;
    var i = 0;
    var playBtn = document.getElementById("city-hero-play");
    var timer = setInterval(next, 6000);
    function next() {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        clearInterval(timer);
        next();
        timer = setInterval(next, 6000);
      });
    }
  }

  window.cityTopInit = function () {
    bindTools();
    bindMenu();
    bindHero();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindHero();
      document.addEventListener("city-includes-loaded", bindTools);
      document.addEventListener("city-includes-loaded", bindMenu);
    });
  } else {
    bindHero();
  }
})();
