// Shared on every page: Pip the mascot, scroll reveals, click-to-copy email.
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ───────────── Pip ───────────── */
  var mascot = $("#mascot"), bubble = $("#bubble"), bubbleText = $("#bubbleText"), pip = $("#pip"), hideTimer = 0;
  var TRICKS = [
    ["t-hop", "Boing. <em>Elevation gain:</em> four centimetres."],
    ["t-spin", "Recalculating <em>route</em>…"],
    ["t-dizzy", "Too many <em>roundabouts</em> on Sohna Road."],
    ["t-lost", "Lost <em>GPS signal</em>… got it back!"],
    ["t-squash", "Hey, <em>that tickles</em>."],
    ["t-zoom", "Taking the <em>expressway</em>!"],
  ];
  var RINGS = ["#2261e9", "#762ed2", "#0e6a9b", "#90661f", "#ffe64e", "#fda296"];

  function say(html, holdMs) {
    bubbleText.innerHTML = html;
    bubble.classList.remove("hide", "pop"); void bubble.offsetWidth; bubble.classList.add("pop");
    clearTimeout(hideTimer);
    if (holdMs) hideTimer = setTimeout(function () { bubble.classList.add("hide"); }, holdMs);
  }

  var trickIdx = Math.floor(Math.random() * TRICKS.length), busy = false;
  function trick() {
    if (busy) return;
    var tr = TRICKS[trickIdx++ % TRICKS.length];
    busy = true;
    pip.classList.add(tr[0]);
    say(tr[1], 3500);
    setTimeout(function () { pip.classList.remove(tr[0]); busy = false; }, 1400);
  }
  pip.addEventListener("click", trick);
  var trickBtn = $("#trickBtn"), rerouteBtn = $("#rerouteBtn"), ringIdx = 0;
  if (trickBtn) trickBtn.addEventListener("click", trick);
  if (rerouteBtn) rerouteBtn.addEventListener("click", function () {
    ringIdx = (ringIdx + 1) % RINGS.length;
    pip.style.setProperty("--ring", RINGS[ringIdx]);
    say("New <em>colourway</em>. Very aerodynamic.", 3000);
  });

  // spawn: Pip drops in shortly after load, then says hello
  bubble.classList.add("hide");
  setTimeout(function () { mascot.classList.add("spawned"); }, 450);
  setTimeout(function () { mascot.classList.add("settled"); }, 1400);

  // Sections carry data-say="<html>"; whichever crosses the middle of the viewport sets Pip's line.
  var zone = null, sayHook = null;
  var zoneObserver = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting || e.target === zone) return;
      zone = e.target;
      var line = sayHook && sayHook(zone);
      if (line) say(line);
      else if (zone.dataset.say) say(zone.dataset.say, zone.dataset.hold ? +zone.dataset.hold : 7000);
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  setTimeout(function () {
    document.querySelectorAll("[data-say], [data-say-hook]").forEach(function (z) { zoneObserver.observe(z); });
  }, 1100);

  /* ───────────── Email copy ───────────── */
  var mail = $("#mail");
  if (mail) mail.addEventListener("click", function () {
    var addr = mail.dataset.email, out = mail.querySelector(".mail-copied");
    function done() {
      out.textContent = "Copied!";
      say("Copied! <em>Talk soon.</em>", 3500);
      setTimeout(function () { out.textContent = ""; }, 2200);
    }
    if (navigator.clipboard) navigator.clipboard.writeText(addr).then(done, function () { location.href = "mailto:" + addr; });
    else location.href = "mailto:" + addr;
  });

  /* ───────────── Reveals ───────────── */
  var ro = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add("in"); ro.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  function watchReveals() { document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { ro.observe(el); }); }
  watchReveals();
  requestAnimationFrame(function () { var t = $(".hero-title"); if (t) t.classList.add("in"); });

  window.UI = {
    $: $, esc: esc, say: say, watchReveals: watchReveals,
    onZone: function (fn) { sayHook = fn; },
    currentZone: function () { return zone; },
  };
})();
