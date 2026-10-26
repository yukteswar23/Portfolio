// Paper page: paper details + problem statement + pinned map tour.
(function () {
  "use strict";
  var SITE = window.SITE, M = window.MAP, ROADS = M.ROADS, $ = UI.$, esc = UI.esc;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var id = document.body.dataset.paper;
  var paper = SITE.papers.filter(function (p) { return p.id === id; })[0];
  var other = SITE.papers.filter(function (p) { return p.id !== id; })[0];
  document.documentElement.style.setProperty("--accent", paper.accent);

  /* ───────────── Fill the page ───────────── */
  $("#pVenue").textContent = paper.venue;
  $("#pShort").textContent = paper.short;
  $("#pTitle").textContent = paper.title;
  $("#pAuthors").textContent = paper.authors;
  $("#pLink").href = paper.href;
  $("#pLinkLabel").textContent = paper.linkLabel;
  $("#pSummary").textContent = paper.summary;
  $("#pIdeas").innerHTML = paper.keyIdeas.map(function (k) { return "<li>" + esc(k) + "</li>"; }).join("");
  $("#pWhy").textContent = paper.why;
  $("#pArt").innerHTML = M.art[paper.id]();
  $("#probQ").innerHTML = SITE.problem.question.replace("real-time", "<em>real-time</em>").replace("sparse data", "<em>sparse data</em>");
  $("#probContext").textContent = SITE.problem.context;
  var next = $("#nextPaper");
  next.href = other.page;
  next.style.setProperty("--accent", other.accent);
  $("#nextName").textContent = other.short;
  $("#nextVenue").textContent = other.venue;
  $(".paper-hero").dataset.say = "This is <em>" + esc(paper.short) + "</em>. Scroll for the problem it helps with.";

  /* ───────────── Tour ───────────── */
  var TOUR = paper.tour;
  $("#tourQuestion").innerHTML = $("#probQ").innerHTML;
  $("#tourProgress").innerHTML = TOUR.map(function () { return "<li><i></i></li>"; }).join("");
  $("#tourSteps").innerHTML = TOUR.map(function (s, i) { return '<div class="tour-step" data-step="' + i + '"></div>'; }).join("");

  var canvas = $("#map"), ctx = canvas.getContext("2d");
  var roadLayer = document.createElement("canvas");
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  var step = 0, stepStart = performance.now(), tourVisible = false;
  var C = { paper: "#fbfbf8", blue: "#5b8cff", purple: "#b57bff", yellow: "#ffe64e", teal: "#4fc3f7" };

  // the trip that the story follows: a long drive through the middle of the city
  var hero = (function () {
    var r = M.rng(2026), best = null;
    for (var i = 0; i < 600; i++) {
      var w = M.randomWalk(r, 380, 520);
      var mid = w.pts.reduce(function (a, p) { return [a[0] + p[0] / w.pts.length, a[1] + p[1] / w.pts.length]; }, [0, 0]);
      if (Math.hypot(mid[0] - ROADS.w / 2, mid[1] - ROADS.h / 2) < 220 && (!best || w.len > best.len)) best = w;
    }
    return best;
  })();
  var heroDense = M.resample(hero.pts, 4), heroSegs = M.resample(hero.pts, 18);
  var pings = (function () {
    var r = M.rng(77), out = [];
    for (var d = 0; d < heroDense.length; d += Math.round(42 / 4 * (0.7 + r() * 0.8))) {
      var p = heroDense[d];
      out.push([p[0] + (r() - .5) * 6, p[1] + (r() - .5) * 6]);
    }
    return out;
  })();
  var noiseR = M.rng(31), noise = heroDense.map(function () { return [noiseR() * 2 - 1, noiseR() * 2 - 1]; });

  function X(x) { return view.ox + x * view.s; }
  function Y(y) { return view.oy + y * view.s; }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.w = rect.width; view.h = rect.height;
    canvas.width = Math.round(rect.width * view.dpr);
    canvas.height = Math.round(rect.height * view.dpr);
    view.s = Math.max(rect.width / ROADS.w, rect.height / ROADS.h) * 1.15;
    view.ox = rect.width / 2 - ROADS.w / 2 * view.s; view.oy = rect.height / 2 - ROADS.h / 2 * view.s;
    roadLayer.width = canvas.width; roadLayer.height = canvas.height;
    var r = roadLayer.getContext("2d");
    r.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    r.lineCap = "round"; r.lineJoin = "round";
    [3, 2, 1, 0].forEach(function (rank) {
      r.strokeStyle = "rgba(251,251,248," + [0.55, 0.38, 0.24, 0.14][rank] + ")";
      r.lineWidth = [2.4, 1.6, 1.1, 0.8][rank];
      r.beginPath();
      ROADS.roads.forEach(function (rd) {
        if (rd[0] !== rank) return;
        var c = rd[1];
        r.moveTo(X(c[0]), Y(c[1]));
        for (var i = 2; i < c.length; i += 2) r.lineTo(X(c[i]), Y(c[i + 1]));
      });
      r.stroke();
    });
    draw(performance.now());
  }

  function strokePath(pts, n, color, width, alpha) {
    if (n < 2) return;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
    for (var i = 1; i < n; i++) ctx.lineTo(X(pts[i][0]), Y(pts[i][1]));
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  function dot(p, r, color, ring) {
    ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    if (ring) { ctx.lineWidth = 1.5; ctx.strokeStyle = ring; ctx.stroke(); }
  }
  function drawPings(t, pulse) {
    pings.forEach(function (p, i) {
      var appear = Math.min(1, Math.max(0, (t - i * 120) / 300));
      if (appear <= 0) return;
      if (pulse) {
        var ph = ((t / 1600) + i * 0.13) % 1;
        ctx.globalAlpha = (1 - ph) * 0.6 * appear;
        ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 4 + ph * 16, 0, Math.PI * 2);
        ctx.strokeStyle = C.yellow; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.globalAlpha = appear; dot(p, 4, C.yellow, "#06202f"); ctx.globalAlpha = 1;
    });
  }

  // realtime: a stream of synthetic trips
  var fleet = [], fleetCount = 0, fleetR = M.rng(99), lastSpawn = 0;
  var FLEET = [C.blue, C.purple, C.yellow, C.paper, C.teal];
  function spawnTrip(now) {
    var w = M.randomWalk(fleetR, 120, 320);
    if (w.pts.length < 3) return;
    fleet.push({ pts: M.resample(w.pts, 3), born: now, speed: 0.09 + fleetR() * 0.08, color: FLEET[fleetCount % FLEET.length] });
    fleetCount++;
  }

  var stat = $("#tourStat");
  function setStat(s) { if (stat.textContent !== s) stat.textContent = s; }

  var MODES = {
    graph: function (t) {
      setStat(ROADS.roads.length.toLocaleString() + " road ways");
    },
    sparse: function (t) {
      // straight dashed guesses between pings show how much is missing
      ctx.setLineDash([4, 5]);
      strokePath(pings, Math.min(pings.length, Math.floor(t / 120) + 1), C.yellow, 1.2, 0.5);
      ctx.setLineDash([]);
      drawPings(t, true);
      var gap = hero.len * M.M_PER_UNIT / (pings.length - 1);
      setStat(pings.length + " pings · ~" + Math.round(gap / 10) * 10 + " m apart");
    },
    seed: function (t) {
      var per = 260, n = Math.min(heroSegs.length, Math.floor(t / per) + 1), frac = (t % per) / per;
      strokePath(heroSegs, n, C.blue, 4);
      // the segment being "denoised" right now
      if (n < heroSegs.length) {
        var a = heroSegs[n - 1], b = heroSegs[n], j = (1 - frac) * 10;
        var tip = [b[0] + Math.sin(t / 50) * j / view.s, b[1] + Math.cos(t / 43) * j / view.s];
        strokePath([a, [a[0] + (tip[0] - a[0]) * frac, a[1] + (tip[1] - a[1]) * frac]], 2, C.yellow, 4, 0.9);
      }
      for (var i = 0; i < n; i++) dot(heroSegs[i], 2.6, "#06202f", C.blue);
      drawPings(1e6, false);
      setStat("segment " + Math.min(n, heroSegs.length - 1) + " / " + (heroSegs.length - 1));
    },
    control: function (t) {
      // diffusion: noise level falls from T to 0, then holds on the road-faithful path
      var k = Math.min(1, Math.max(0, t / 3200)), level = Math.pow(1 - k, 1.6), amp = level * 78 / view.s;
      strokePath(hero.pts, hero.pts.length, C.purple, 7, 0.18 + 0.2 * k);
      heroDense.forEach(function (p, i) { if (i % 2 === 0) dot([p[0] + noise[i][0] * amp, p[1] + noise[i][1] * amp], 1.8, C.purple); });
      if (k === 1) strokePath(heroDense, heroDense.length, C.purple, 3.5);
      drawPings(1e6, false);
      setStat("denoising t = " + Math.round(level * 1000) + " → 0");
    },
    realtime: function (t, now) {
      if (!reduced && now - lastSpawn > 140 && fleet.length < 60) { spawnTrip(now); lastSpawn = now; }
      if (reduced && !fleet.length) for (var s = 0; s < 40; s++) spawnTrip(0);
      fleet = fleet.filter(function (f) {
        var head = reduced ? f.pts.length : (now - f.born) * f.speed;
        var tail = Math.max(0, head - 40), end = Math.min(f.pts.length, Math.floor(head));
        if (tail >= f.pts.length) return false;
        if (end - Math.floor(tail) >= 2) {
          var seg = f.pts.slice(Math.floor(tail), end);
          strokePath(seg, seg.length, f.color, 2.2, 0.85);
          if (head < f.pts.length) dot(seg[seg.length - 1], 2.6, f.color);
        }
        return true;
      });
      setStat(fleetCount.toLocaleString() + " trips · ~" + (reduced ? "7" : (fleetCount / Math.max(1, t / 1000)).toFixed(1)) + "/s");
    },
  };

  function draw(now) {
    if (!view.w) return;
    var t = reduced ? 1e6 : Math.max(0, now - stepStart), mode = TOUR[step].mode;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = mode === "graph" && !reduced ? Math.min(1, t / 900) : 1;
    ctx.drawImage(roadLayer, 0, 0);
    ctx.globalAlpha = 1;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    MODES[mode](t, now);
  }

  var raf = 0;
  function loop(now) { draw(now); raf = tourVisible && !reduced ? requestAnimationFrame(loop) : 0; }
  function kick() { if (reduced) draw(performance.now()); else if (!raf && tourVisible) raf = requestAnimationFrame(loop); }

  function stepLine(i) { var s = TOUR[i]; return s.pre + " <em>" + esc(s.em) + "</em>" + s.post; }
  function setStep(i) {
    if (i === step) return;
    step = i; stepStart = performance.now();
    if (TOUR[i].mode !== "realtime") { fleet = []; fleetCount = 0; }
    $("#tourTitle").textContent = TOUR[i].title;
    if (UI.currentZone() === tourEl) UI.say(stepLine(i));
    kick();
  }

  var tourEl = $("#tour"), bars = document.querySelectorAll("#tourProgress i");
  $("#tourTitle").textContent = TOUR[0].title;
  function onScroll() {
    var r = tourEl.getBoundingClientRect(), span = r.height - innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / span)), n = TOUR.length;
    bars.forEach(function (b, k) { b.style.setProperty("--p", Math.min(1, Math.max(0, p * n - k))); });
    setStep(Math.min(n - 1, Math.floor(p * n * 0.999)));
  }

  UI.onZone(function (z) { return z === tourEl ? stepLine(step) : null; });
  new IntersectionObserver(function (es) {
    tourVisible = es[0].isIntersecting;
    if (tourVisible) { onScroll(); kick(); }
  }).observe(tourEl);
  addEventListener("scroll", function () { if (tourVisible) onScroll(); }, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  else addEventListener("resize", resize);
  resize();
})();
