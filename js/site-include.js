(function () {
  var script = document.currentScript;
  var base = (script && script.getAttribute("data-base")) || "";
  var includes = document.querySelectorAll("[data-city-include]");
  if (!includes.length) return;

  function fixUrls(html) {
    return html.replace(/\{\{BASE\}\}/g, base);
  }

  var names = [];
  includes.forEach(function (el) {
    var n = el.getAttribute("data-city-include");
    if (n && names.indexOf(n) === -1) names.push(n);
  });

  Promise.all(
    names.map(function (name) {
      return fetch(base + "partials/city-" + name + ".html").then(function (r) {
        if (!r.ok) throw new Error(name);
        return r.text();
      });
    })
  )
    .then(function (parts) {
      var map = {};
      names.forEach(function (name, i) {
        map[name] = fixUrls(parts[i]);
      });
      includes.forEach(function (el) {
        var n = el.getAttribute("data-city-include");
        if (map[n]) el.innerHTML = map[n];
      });
      document.dispatchEvent(new CustomEvent("city-includes-loaded"));
      if (window.cityTopInit) window.cityTopInit();
    })
    .catch(function () {
      /* offline / file:// */
    });
})();
