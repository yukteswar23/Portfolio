// Homepage: research cards, interests, writing & LLM cards.
(function () {
  "use strict";
  var SITE = window.SITE, ART = window.MAP.art, $ = UI.$, esc = UI.esc;

  function card(o) {
    var ext = /^https?:/.test(o.href);
    return '<a class="card reveal" style="--accent:' + o.accent + '" href="' + esc(o.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" +
      '<div class="card-art">' + o.art + (o.badge ? '<span class="card-badge">' + esc(o.badge) + "</span>" : "") + "</div>" +
      '<div class="card-meta"><h3>' + esc(o.title) + ' <span class="arrow" aria-hidden="true">' + (ext ? "↗" : "→") + "</span></h3><span>" + esc(o.kind) + "</span></div>" +
      (o.text ? '<p class="card-text">' + esc(o.text) + "</p>" : "") + "</a>";
  }

  $("#researchGrid").innerHTML = SITE.papers.map(function (p) {
    return card({ href: p.page, accent: p.accent, art: ART[p.id](), title: p.short, kind: p.venue, text: p.blurb, badge: "Paper + problem statement" });
  }).join("");

  $("#interestList").innerHTML = SITE.interests.map(function (it, i) {
    return '<article class="interest reveal" style="--accent:' + it.accent + '">' +
      '<div class="interest-art">' + ART[it.art]() + "</div>" +
      '<div class="interest-text"><p class="interest-num">0' + (i + 1) + "</p><h3>" + esc(it.name) + "</h3><p>" + esc(it.text) + "</p></div></article>";
  }).join("");

  $("#workGrid").innerHTML = SITE.work.map(function (w) {
    return card({ href: w.href, accent: w.accent, art: ART[w.art](), title: w.title, kind: w.kind, text: w.text });
  }).join("");

  UI.watchReveals();
})();
