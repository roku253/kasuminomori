(function () {
  function bindHero() {
    var slides = document.querySelectorAll(".city-top-hero__slide");
    if (slides.length < 2) return;
    var i = 0;
    setInterval(next, 6000);
    function next() {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindHero);
  } else {
    bindHero();
  }
})();
