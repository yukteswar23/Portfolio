// Road graph for Gurgaon + generated SVG art. Exposes window.MAP.
(function () {
  "use strict";
  var ROADS = window.GURGAON;

  // seeded RNG so generated art is the same on every load
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ───────────── Road graph ───────────── */
  // Nodes are snapped to a small grid so roads that touch share a node.
  var SNAP = 2.5;
  var graph = { pos: [], adj: [] };
  (function buildGraph() {
    var ids = Object.create(null);
    function node(x, y) {
      var k = Math.round(x / SNAP) + "," + Math.round(y / SNAP);
      if (ids[k] === undefined) { ids[k] = graph.pos.length; graph.pos.push([x, y]); graph.adj.push([]); }
      return ids[k];
    }
    ROADS.roads.forEach(function (r) {
      var c = r[1], prev = -1;
      for (var i = 0; i < c.length; i += 2) {
        var n = node(c[i], c[i + 1]);
        if (prev >= 0 && prev !== n && graph.adj[prev].indexOf(n) < 0) { graph.adj[prev].push(n); graph.adj[n].push(prev); }
        prev = n;
      }
    });
  })();

  // A plausible drive: keep heading roughly straight, avoid U-turns and revisits.
  function randomWalk(rand, minLen, maxLen) {
    var cur = Math.floor(rand() * graph.pos.length), tries = 0;
    while (graph.adj[cur].length === 0 && tries++ < 50) cur = Math.floor(rand() * graph.pos.length);
    var path = [graph.pos[cur]], seen = {}, prev = -1, len = 0, target = minLen + rand() * (maxLen - minLen);
    seen[cur] = 1;
    while (len < target) {
      var opts = graph.adj[cur].filter(function (n) { return n !== prev && !seen[n]; });
      if (!opts.length) break;
      var p = graph.pos[cur], best = opts[0], bestScore = -Infinity;
      opts.forEach(function (n) {
        var q = graph.pos[n], score = rand() * 0.9;
        if (prev >= 0) {
          var o = graph.pos[prev];
          var ax = p[0] - o[0], ay = p[1] - o[1], bx = q[0] - p[0], by = q[1] - p[1];
          score += (ax * bx + ay * by) / ((Math.hypot(ax, ay) * Math.hypot(bx, by)) || 1);
        }
        if (score > bestScore) { bestScore = score; best = n; }
      });
      var q = graph.pos[best];
      len += Math.hypot(q[0] - p[0], q[1] - p[1]);
      path.push(q); seen[best] = 1; prev = cur; cur = best;
    }
    return { pts: path, len: len };
  }

  // resample a polyline at equal spacing
  function resample(pts, step) {
    var out = [pts[0]], carry = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), t = step - carry;
      while (t <= d) { out.push([a[0] + (b[0] - a[0]) * t / d, a[1] + (b[1] - a[1]) * t / d]); t += step; }
      carry = d - (t - step);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // metres per map unit (the bbox height in degrees of latitude maps to ROADS.h units)
  var M_PER_UNIT = ((ROADS.bbox[2] - ROADS.bbox[0]) * 111320) / ROADS.h;

  /* ───────────── SVG art ───────────── */
  var ROAD_D = ["", "", "", ""];
  ROADS.roads.forEach(function (r) {
    var c = r[1], s = "M" + c[0] + " " + c[1];
    for (var i = 2; i < c.length; i += 2) s += "L" + c[i] + " " + c[i + 1];
    ROAD_D[r[0]] += s;
  });

  function roadSvg(view, extra) {
    var widths = [3.2, 2.2, 1.4, 0.9];
    var g = ROAD_D.map(function (d, i) {
      return '<path d="' + d + '" fill="none" stroke="#fbfbf8" stroke-opacity="' + (0.55 - i * 0.1) + '" stroke-width="' + widths[i] + '" stroke-linecap="round" stroke-linejoin="round"/>';
    }).join("");
    return '<svg viewBox="' + view.map(function (v) { return v.toFixed(1); }).join(" ") + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + g + (extra || "") + "</svg>";
  }

  function polyline(pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(""); }

  // a walk that fits a 3:2 frame of the given width; returns it with a viewBox centred on it
  function framedWalk(seed, width, minLen) {
    var r = rng(seed), h = width * 2 / 3, pad = 20, best = null;
    for (var i = 0; i < 600; i++) {
      var w = randomWalk(r, minLen, minLen * 1.5);
      if (w.len < minLen * 0.85) continue;
      var xs = w.pts.map(function (p) { return p[0]; }), ys = w.pts.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), y0 = Math.min.apply(0, ys), y1 = Math.max.apply(0, ys);
      if (x1 - x0 > width - 2 * pad || y1 - y0 > h - 2 * pad) continue;
      var score = (x1 - x0) / width + (y1 - y0) / h; // prefer walks that fill the frame
      if (!best || score > best.score) best = { w: w, score: score, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
    }
    return { walk: best.w, view: [best.cx - width / 2, best.cy - h / 2, width, h] };
  }

  function seedArt() {
    var fw = framedWalk(42, 300, 220), segs = resample(fw.walk.pts, 22), r = rng(49), extra = "";
    // each generated segment drawn as its own token, the last few still "noisy"
    for (var i = 1; i < segs.length; i++) {
      var a = segs[i - 1], b = segs[i], late = i > segs.length - 4, j = late ? (segs.length - i) * 3 : 0;
      extra += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + (b[0] + (r() - .5) * j).toFixed(1) + '" y2="' + (b[1] + (r() - .5) * j).toFixed(1) +
        '" stroke="' + (late ? "#ffe64e" : "#fbfbf8") + '" stroke-width="5" stroke-linecap="round" stroke-opacity="' + (late ? 0.6 : 1) + '"/>';
      extra += '<circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="3.4" fill="#2261e9" stroke="#fbfbf8" stroke-width="1.6"/>';
    }
    return roadSvg(fw.view, extra);
  }

  function controlArt() {
    var fw = framedWalk(9, 280, 240), pts = resample(fw.walk.pts, 6), r = rng(12), extra = "";
    // noisy samples converging onto the road-constrained path
    [16, 8, 3].forEach(function (amp, k) {
      pts.forEach(function (p) {
        extra += '<circle cx="' + (p[0] + (r() - .5) * amp * 2).toFixed(1) + '" cy="' + (p[1] + (r() - .5) * amp * 2).toFixed(1) + '" r="' + (1.2 + k * .5) + '" fill="#fbfbf8" fill-opacity="' + (0.25 + k * 0.25) + '"/>';
      });
    });
    extra += '<path d="' + polyline(fw.walk.pts) + '" fill="none" stroke="#ffe64e" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>';
    return roadSvg(fw.view, extra);
  }

  function visionArt() {
    var r = rng(11), cells = "";
    for (var y = 0; y < 10; y++) for (var x = 0; x < 15; x++) {
      var v = Math.max(0, 1 - Math.hypot(x - 9.5, y - 4.5) / 6) * 0.7 + r() * 0.15;
      cells += '<rect x="' + (x * 20 + 1) + '" y="' + (y * 20 + 1) + '" width="18" height="18" rx="3" fill="#fbfbf8" fill-opacity="' + v.toFixed(2) + '"/>';
    }
    return '<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + cells +
      '<rect x="121" y="21" width="118" height="158" rx="6" fill="none" stroke="#ffe64e" stroke-width="3"/>' +
      '<rect x="121" y="8" width="62" height="16" rx="3" fill="#ffe64e"/><text x="127" y="20" font-family="Space Grotesk, sans-serif" font-size="11" font-weight="600" fill="#0b0b0c">car 0.94</text>' +
      '<rect x="21" y="101" width="58" height="58" rx="6" fill="none" stroke="#fbfbf8" stroke-width="2.5" stroke-dasharray="6 4"/></svg>';
  }

  function llmArt() {
    var r = rng(5), rows = "";
    for (var y = 0; y < 6; y++) {
      var x = 18;
      while (x < 270) {
        var w = 16 + Math.floor(r() * 46); if (x + w > 282) break;
        var hot = y === 5 && x > 150;
        rows += '<rect x="' + x + '" y="' + (22 + y * 27) + '" width="' + w + '" height="17" rx="8.5" fill="' + (hot ? "#ffe64e" : "#fbfbf8") + '" fill-opacity="' + (hot ? 1 : 0.35 + r() * 0.5).toFixed(2) + '"/>';
        x += w + 6;
      }
    }
    return '<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + rows + "</svg>";
  }

  function cookbookArt() {
    return '<svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<g transform="rotate(-6 150 100)"><rect x="104" y="26" width="104" height="150" rx="6" fill="#0b0b0c" opacity=".35" transform="translate(6 6)"/>' +
      '<rect x="104" y="26" width="104" height="150" rx="6" fill="#fbfbf8"/><rect x="104" y="26" width="14" height="150" rx="3" fill="#2261e9"/>' +
      '<text x="128" y="62" font-family="Funnel Display, sans-serif" font-weight="700" font-size="17" fill="#0b0b0c">Continual</text>' +
      '<text x="128" y="82" font-family="Funnel Display, sans-serif" font-weight="700" font-size="17" fill="#0b0b0c">Learning</text>' +
      '<text x="128" y="102" font-family="Funnel Display, sans-serif" font-weight="700" font-size="17" fill="#2261e9">Cookbook</text>' +
      '<rect x="128" y="120" width="60" height="4" rx="2" fill="#0b0b0c" opacity=".2"/><rect x="128" y="130" width="44" height="4" rx="2" fill="#0b0b0c" opacity=".2"/></g></svg>';
  }

  window.MAP = {
    ROADS: ROADS, graph: graph, rng: rng, randomWalk: randomWalk, resample: resample, M_PER_UNIT: M_PER_UNIT,
    art: { seed: seedArt, controltraj: controlArt, vision: visionArt, llm: llmArt, cookbook: cookbookArt },
  };
})();
