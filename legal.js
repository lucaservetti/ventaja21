// Páginas legales de Edge 21: elige el idioma (#en en el enlace, el de la app o el del navegador)
// y maneja el botón ES/EN. Se carga en el <head>, así la página aparece directo en su idioma.
(function () {
  var root = document.documentElement;
  function fromHash() {
    var h = location.hash.slice(1, 3);
    return h === "en" || h === "es" ? h : null;
  }
  var l = fromHash();
  try {
    l = l || localStorage.getItem("edge21.lang");
  } catch (e) {}
  l = l || ((navigator.language || "es").toLowerCase().indexOf("es") === 0 ? "es" : "en");
  root.lang = l === "en" ? "en" : "es";
  window.addEventListener("hashchange", function () {
    var h = fromHash();
    if (h) root.lang = h;
    mark();
  });
  function mark() {
    var links = document.querySelectorAll(".lang a");
    for (var i = 0; i < links.length; i++) links[i].className = links[i].getAttribute("hreflang") === root.lang ? "on" : "";
  }
  document.addEventListener("DOMContentLoaded", function () {
    mark();
    var links = document.querySelectorAll(".lang a");
    for (var i = 0; i < links.length; i++)
      links[i].addEventListener("click", function (e) {
        e.preventDefault();
        var to = this.getAttribute("hreflang");
        root.lang = to;
        history.replaceState(null, "", "#" + to);
        try {
          localStorage.setItem("edge21.lang", to);
        } catch (err) {}
        mark();
        window.scrollTo(0, 0);
      });
  });
})();
