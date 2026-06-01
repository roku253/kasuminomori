(function () {
  var SLIDE_TITLES = [
    "霞ノ杜の霧",
    "杜の吊り橋",
    "神社の参道",
    "杜川の夕暮れ",
    "三日月町",
    "杉並ヶ岡"
  ];

  function bindHero() {
    var slides = document.querySelectorAll(".city-top-hero__slide");
    var caption = document.getElementById("city-hero-slide-title");
    if (slides.length < 2) return;
    var i = 0;
    setInterval(next, 6000);
    function next() {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
      if (caption && SLIDE_TITLES[i]) caption.textContent = SLIDE_TITLES[i];
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindHero);
  } else {
    bindHero();
  }
})();
