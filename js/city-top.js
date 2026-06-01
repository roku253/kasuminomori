(function () {
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindHero);
  } else {
    bindHero();
  }
})();
