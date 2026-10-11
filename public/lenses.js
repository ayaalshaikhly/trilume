/* ============================================================
   TRILUME: tool (lens) definitions, scoring, 2D maps (SVG) and the 3D map (canvas).
   Ratings are 1–5. x / y are the two scales of each lens.
   ============================================================ */
(function () {
  var LENSES = {
    maya: {
      key: 'maya', name: 'MAYA Lens', short: 'MAYA', color: '#2563EB', soft: '#e8effd',
      question: 'Will people accept this product?', credit: 'Raymond Loewy’s MAYA principle',
      zoneName: 'MAYA zone', axisMin: 1,
      x: { name: 'Familiarity', question: 'How easy is it to understand what this is and how it would be used?',
        low: 'Hard to understand', high: 'Instantly understood',
        levels: { 1: 'Hard to understand: I cannot tell what it is or how it would be used.', 2: 'Unclear: I need a lot of explanation to understand it.', 3: 'Understandable: I get it once it is explained.', 4: 'Easy to understand: I can tell what it is and how to use it.', 5: 'Instantly understood: it is immediately clear what it is and how it is used.' } },
      y: { name: 'Novelty', question: 'How new is this idea to you?',
        low: 'Very familiar', high: 'Never seen before',
        levels: { 1: 'Very familiar: I have seen this many times before.', 2: 'Mostly familiar: ideas like this are common; only small changes.', 3: 'Somewhat new: some parts feel new, others feel familiar.', 4: 'Quite new: I have rarely seen anything like this.', 5: 'Never seen before: I have never seen anything like this.' } }
    },
    meta: {
      key: 'meta', name: 'Metaphor Lens', short: 'Metaphor', color: '#DC2626', soft: '#fdeaea',
      question: 'How is the metaphor working?', credit: 'Prof. WonJoon Chung’s Metaphoric Design Evaluation Matrix',
      zoneName: 'target metaphoric design zone', axisMin: 0,
      x: { name: 'Literalness of Representation', question: 'How directly does the design represent the visual of the source?',
        low: 'Highly Literal', high: 'Highly Abstract',
        levels: { 1: 'Highly Literal: it looks like the source.', 2: 'Mostly Literal: it still looks quite a bit like the source.', 3: 'Subtle: I can see the connection, but it has been transformed.', 4: 'Mostly Abstract: I can’t really see the source, but I can understand the underlying properties.', 5: 'Highly Abstract: the source is not recognizable. The connection is mainly personal, not based on clear properties.' } },
      y: { name: 'Effectiveness of Underlying Properties (UP) and Gestalt Principles (GP)', axisName: 'Effectiveness of UP & GP', question: 'How effectively does the design use the underlying properties and Gestalt principles?',
        low: 'Not at all', high: 'Highly Effective',
        levels: { 1: 'Not at all: the UP and GP are not considered; the design is driven primarily by personal preference.', 2: 'Slightly: the UP and GP are considered superficially and have limited influence on the design’s development.', 3: 'Moderately: the UP and GP are used in the design, but some parts do not feel natural or work well.', 4: 'Strongly: the UP and GP are clearly identified and effectively incorporated into the design.', 5: 'Highly Effective: the UP and GP are clearly articulated and thoughtfully integrated, with their combination meaningfully informing the design.' } }
    },
    insight: {
      key: 'insight', name: 'Insight Lens', short: 'Insight', color: '#16A34A', soft: '#e8f6ec',
      question: 'How much real thinking is in this idea?', credit: 'Aya Al-Shaikhly’s Insight Evaluation Matrix',
      zoneName: 'Insight zone', axisMin: 1,
      x: { name: 'Unexpectedness', question: 'Could anyone have thought of this?',
        low: 'Obvious', high: 'Very unexpected',
        levels: { 1: 'Obvious: the first idea most people (or an AI) would have.', 2: 'Expected: a common approach with small changes.', 3: 'Somewhat surprising: a familiar idea with one fresh twist.', 4: 'Surprising: I would not have thought of this.', 5: 'Very unexpected: a connection no one in the room saw coming.' } },
      y: { name: 'Depth of Reasoning', question: 'Can you see the thinking behind it?',
        low: 'No reasoning', high: 'Deep',
        levels: { 1: 'No reasoning: it may look good, but I can’t tell why it is this way.', 2: 'Thin: one reason, not really connected to the problem.', 3: 'Some: the idea answers the brief in a clear way.', 4: 'Strong: each choice is linked to a user need or an insight.', 5: 'Deep: a clear chain from insight to idea; it couldn’t easily be otherwise.' } }
    }
  };
  var ORDER = ['maya', 'meta', 'insight'];
  var PRODUCT_TYPES = ['Consumer product', 'Medical device', 'Fashion / lifestyle', 'Consumer electronics', 'Architecture / interior'];

  var REGIONS = {
    insight: { name: 'Insight zone', text: 'Unexpected and well reasoned.' },
    almost: { name: 'Almost in the Insight zone', text: 'Unexpected and reasoned. Push one step further: a bolder connection, or a clearer reason for each choice.' },
    safe: { name: 'Safe thinker', text: 'Well reasoned. To make it less expected, try a lateral jump: connect it to something unrelated (bisociation).' },
    wild: { name: 'Wild guess', text: 'Surprising. To strengthen it, use vertical thinking: link each choice to a user need or an insight.' },
    autopilot: { name: 'Autopilot', text: 'Try a fresh direction: combine two unrelated things, then explain why the combination works.' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function mean(arr, k) { return arr.length ? arr.reduce(function (s, r) { return s + r[k]; }, 0) / arr.length : null; }
  function inZone(z, x, y) { var dx = (x - z.cx) / z.rx, dy = (y - z.cy) / z.ry; return dx * dx + dy * dy <= 1; }

  // 0–100: 100 inside the zone; minus 25 for every scale point outside the zone's edge.
  function closeness(z, x, y) {
    if (x == null || y == null) return null;
    if (inZone(z, x, y)) return 100;
    var dx = x - z.cx, dy = y - z.cy, d = Math.sqrt(dx * dx + dy * dy);
    var r = Math.sqrt((dx * dx) / (z.rx * z.rx) + (dy * dy) / (z.ry * z.ry));
    var edge = d * (1 - 1 / r);
    return Math.max(0, Math.round(100 - 25 * edge));
  }

  function region(z, x, y) {
    if (inZone(z, x, y)) return 'insight';
    if (x > 3 && y > 3) return 'almost';
    if (x <= 3 && y > 3) return 'safe';
    if (x > 3 && y <= 3) return 'wild';
    return 'autopilot';
  }

  // Developmental wording only: where the idea is, and which way to develop it.
  function suggestion(lens, z, x, y) {
    if (lens === 'insight') { var r = REGIONS[region(z, x, y)]; return r.name + '. ' + r.text; }
    if (inZone(z, x, y)) return lens === 'maya' ? 'In the MAYA zone: novel enough to excite, familiar enough to accept.' : 'In the target metaphoric design zone.';
    var dx = z.cx - x, dy = z.cy - y, parts = [];
    if (lens === 'meta') {
      if (dx > 0.3) parts.push('make it less literal: transform the source more, so it no longer just looks like it');
      else if (dx < -0.3) parts.push('make the connection to the source clearer: base it on the underlying properties, not a personal link');
      if (dy > 0.3) parts.push('use the underlying properties and Gestalt principles more clearly and effectively');
    } else {
      if (dy > 0.3) parts.push('push toward more novelty: explore unexpected directions (lateral thinking)');
      else if (dy < -0.3) parts.push('temper the novelty: make it easier to grasp (vertical thinking)');
      if (dx > 0.3) parts.push('strengthen the link to recognizable forms and uses');
      else if (dx < -0.3) parts.push('move away from the obvious: try unexpected combinations');
    }
    if (!parts.length) return 'Very close to the ' + LENSES[lens].zoneName + '.';
    return 'To develop it: ' + parts.join(', and ') + '.';
  }

  // Short words for a point on a map, e.g. "Surprising · Strong".
  function describe(lens, x, y) {
    var L = LENSES[lens];
    var lx = L.x.levels[Math.min(5, Math.max(1, Math.round(x)))].split(':')[0];
    var ly = L.y.levels[Math.min(5, Math.max(1, Math.round(y)))].split(':')[0];
    return lx + ' · ' + ly;
  }

  function colorFor(i) { return 'hsl(' + Math.round((i * 137.508) % 360) + ',58%,42%)'; }

  // ---------- The AI "obvious zone": where the reference ideas landed on the Insight map ----------
  function cloudOf(refs) {
    var pts = (refs || []).filter(function (r) { return r.count > 0 && r.x != null; });
    if (pts.length < 3) return { points: pts, ready: false };
    var cx = mean(pts, 'x'), cy = mean(pts, 'y');
    var sx = Math.sqrt(pts.reduce(function (s, p) { return s + (p.x - cx) * (p.x - cx); }, 0) / pts.length);
    var sy = Math.sqrt(pts.reduce(function (s, p) { return s + (p.y - cy) * (p.y - cy); }, 0) / pts.length);
    return { points: pts, ready: true, zone: { cx: cx, cy: cy, rx: Math.max(sx, 0.4), ry: Math.max(sy, 0.4) } };
  }

  // ---------- Results per idea (presenter × idea) ----------
  function compute(data) {
    var lenses = data.lenses, cloud = cloudOf(data.refs), out = {}, list = [];
    var key = function (s, k) { return s + '|' + k; };
    (data.ratings || []).forEach(function (r) {
      if (r.slot > data.ideasPer || lenses.indexOf(r.lens) === -1) return;
      var k = key(r.student_id, r.slot);
      (out[k] = out[k] || { studentId: r.student_id, slot: r.slot, all: [] }).all.push(r);
    });
    Object.keys(out).forEach(function (k) {
      var res = out[k]; res.lens = {}; res.complete = true;
      lenses.forEach(function (l) {
        var lr = res.all.filter(function (r) { return r.lens === l; }), z = data.zones[l];
        if (!lr.length) { res.lens[l] = { n: 0, ratings: [] }; res.complete = false; return; }
        var x = mean(lr, 'x'), y = mean(lr, 'y');
        res.lens[l] = { n: lr.length, ratings: lr, x: x, y: y, inZone: inZone(z, x, y), score: closeness(z, x, y), sug: suggestion(l, z, x, y) };
      });
      var I = res.lens.insight;
      if (I && I.n) {
        res.region = region(data.zones.insight, I.x, I.y);
        if (cloud.ready) { var dx = I.x - cloud.zone.cx, dy = I.y - cloud.zone.cy; res.obvious = { inside: inZone(cloud.zone, I.x, I.y), dist: Math.sqrt(dx * dx + dy * dy) }; }
      }
      list.push(res);
    });
    list.sort(function (a, b) { return a.studentId - b.studentId || a.slot - b.slot; });
    return { byKey: out, list: list, cloud: cloud, key: key };
  }

  var SVG_STYLE = '<style>text{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif}' +
    '.tick{font-size:10px;fill:#9a968c}.end{font-size:9.5px;fill:#9a968c}.axis{font-size:10.5px;font-weight:700;fill:#4b4a46}' +
    '.quad{font-size:8.5px;font-weight:700;fill:#bdb6a6;letter-spacing:.08em}.zone{font-size:9px;font-weight:800;letter-spacing:.06em}' +
    '.cloud{font-size:9px;font-weight:700;fill:#7b766a}.n{font-size:9px;font-weight:700}.lbl{font-size:10.5px;font-weight:700}</style>';
  // Idea 3 is gold: give light colours a dark outline so they stay visible on white.
  function outlineFor(col) { return col === '#E8A400' ? '#6b4e00' : '#fff'; }

  // ---------- SVG map (one tool) ----------
  // opts: lens, zone, cloud (Insight only), dots [{x,y,color}], items [{x,y,color,label}], small
  function svgMap(opts) {
    var L = LENSES[opts.lens], W = 340, H = 330, pad = { l: 46, r: 14, t: 14, b: 50 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b, lo = L.axisMin, span = 5 - lo;
    var X = function (v) { return pad.l + ((v - lo) / span) * pw; };
    var Y = function (v) { return pad.t + ph - ((v - lo) / span) * ph; };
    var s = '<svg class="map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(L.name) + ' map">' + SVG_STYLE;
    s += '<rect x="' + pad.l + '" y="' + pad.t + '" width="' + pw + '" height="' + ph + '" fill="#fff" stroke="#d9d6cf"/>';
    for (var v = lo; v <= 5; v++) {
      s += '<line x1="' + X(v) + '" y1="' + pad.t + '" x2="' + X(v) + '" y2="' + (pad.t + ph) + '" stroke="#efece6"/>';
      s += '<line x1="' + pad.l + '" y1="' + Y(v) + '" x2="' + (pad.l + pw) + '" y2="' + Y(v) + '" stroke="#efece6"/>';
      s += '<text x="' + X(v) + '" y="' + (pad.t + ph + 13) + '" class="tick" text-anchor="middle">' + v + '</text>';
      s += '<text x="' + (pad.l - 7) + '" y="' + (Y(v) + 3.5) + '" class="tick" text-anchor="end">' + v + '</text>';
    }
    if (opts.lens === 'insight') {
      var mx = X(3), my = Y(3);
      s += '<line x1="' + mx + '" y1="' + pad.t + '" x2="' + mx + '" y2="' + (pad.t + ph) + '" stroke="#e2ddd3" stroke-dasharray="3 3"/>';
      s += '<line x1="' + pad.l + '" y1="' + my + '" x2="' + (pad.l + pw) + '" y2="' + my + '" stroke="#e2ddd3" stroke-dasharray="3 3"/>';
      s += '<text x="' + (pad.l + 6) + '" y="' + (pad.t + 13) + '" class="quad">SAFE THINKER</text>';
      s += '<text x="' + (pad.l + 6) + '" y="' + (pad.t + ph - 6) + '" class="quad">AUTOPILOT</text>';
      s += '<text x="' + (pad.l + pw - 6) + '" y="' + (pad.t + ph - 6) + '" class="quad" text-anchor="end">WILD GUESS</text>';
    }
    s += '<text x="' + pad.l + '" y="' + (H - 22) + '" class="end">' + esc(L.x.low) + '</text>';
    s += '<text x="' + (pad.l + pw) + '" y="' + (H - 22) + '" class="end" text-anchor="end">' + esc(L.x.high) + '</text>';
    s += '<text x="' + (pad.l + pw / 2) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + esc(L.x.name) + ' →</text>';
    s += '<text transform="translate(12 ' + (pad.t + ph / 2) + ') rotate(-90)" class="axis" text-anchor="middle">' + esc(L.y.axisName || L.y.name) + ' →</text>';
    // AI obvious zone (Insight Lens only)
    var c = opts.cloud;
    if (opts.lens === 'insight' && c && c.points && c.points.length) {
      if (c.ready) s += '<ellipse cx="' + X(c.zone.cx) + '" cy="' + Y(c.zone.cy) + '" rx="' + (c.zone.rx / span) * pw + '" ry="' + (c.zone.ry / span) * ph + '" fill="#8a8578" fill-opacity="0.13" stroke="#8a8578" stroke-opacity="0.5" stroke-dasharray="2 3"/>';
      c.points.forEach(function (p) { s += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="2.6" fill="#8a8578" fill-opacity="0.55"/>'; });
      if (c.ready) s += '<text x="' + X(c.zone.cx) + '" y="' + (Y(c.zone.cy) + (c.zone.ry / span) * ph + 11) + '" class="cloud" text-anchor="middle">AI obvious zone</text>';
    }
    // Target zone
    var z = opts.zone, zx = X(z.cx), zy = Y(z.cy), zrx = (z.rx / span) * pw, zry = (z.ry / span) * ph;
    s += '<ellipse cx="' + zx + '" cy="' + zy + '" rx="' + zrx + '" ry="' + zry + '" fill="' + L.color + '" fill-opacity="0.10" stroke="' + L.color + '" stroke-width="1.6" stroke-dasharray="5 4"/>';
    var zly = zy - zry - 5 < pad.t + 9 ? zy + 3 : zy - zry - 5;
    s += '<text x="' + zx + '" y="' + zly + '" class="zone" fill="' + L.color + '" text-anchor="middle">' + esc(opts.lens === 'insight' ? 'INSIGHT ZONE' : opts.lens === 'maya' ? 'MAYA ZONE' : 'TARGET ZONE') + '</text>';
    // Single ratings: one circle per distinct score, bigger when more people gave it
    var counts = {};
    (opts.dots || []).forEach(function (d) { var k = d.x + ',' + d.y + ',' + (d.color || L.color); counts[k] = (counts[k] || 0) + 1; });
    Object.keys(counts).forEach(function (k) {
      var p = k.split(','), n = counts[k], col = p.slice(2).join(',');
      s += '<circle cx="' + X(+p[0]) + '" cy="' + Y(+p[1]) + '" r="' + (3.5 + Math.sqrt(n) * 2.6) + '" fill="' + col + '" fill-opacity="0.2" stroke="' + col + '" stroke-opacity="0.55"/>';
      if (n > 1) s += '<text x="' + X(+p[0]) + '" y="' + (Y(+p[1]) + 3) + '" class="n" fill="' + col + '" text-anchor="middle">' + n + '</text>';
    });
    // Averages (diamonds) with labels
    (opts.items || []).forEach(function (it) {
      var ix = X(it.x), iy = Y(it.y), d = opts.small ? 7 : 8, col = it.color || L.color;
      s += '<path d="M' + ix + ' ' + (iy - d) + ' L' + (ix + d) + ' ' + iy + ' L' + ix + ' ' + (iy + d) + ' L' + (ix - d) + ' ' + iy + 'Z" fill="' + col + '" stroke="' + outlineFor(col) + '" stroke-width="' + (outlineFor(col) === '#fff' ? 2 : 1.4) + '"/>';
      if (it.label) {
        var right = ix < pad.l + pw - 70;
        s += '<text x="' + (right ? ix + d + 4 : ix - d - 4) + '" y="' + (iy + 3.5) + '" class="lbl" fill="' + (col === '#E8A400' ? '#8a6500' : col) + '" text-anchor="' + (right ? 'start' : 'end') + '" paint-order="stroke" stroke="#fff" stroke-width="3">' + esc(it.label) + '</text>';
      }
    });
    return s + '</svg>';
  }

  // ---------- 3D map: one axis per tool (closeness to its zone, 0–100) ----------
  var views = {};
  function mount3D(canvas, points, key) {
    var v = views[key] = views[key] || { yaw: -0.65, pitch: 0.42 };
    v.points = points; v.canvas = canvas;
    if (!canvas.dataset.wired) {
      canvas.dataset.wired = '1';
      var drag = null;
      var down = function (x, y) { drag = { x: x, y: y, yaw: v.yaw, pitch: v.pitch }; v.dragging = true; };
      var move = function (x, y) { if (!drag) return; v.yaw = drag.yaw + (x - drag.x) * 0.01; v.pitch = Math.max(-0.2, Math.min(1.35, drag.pitch + (y - drag.y) * 0.01)); draw3D(v); };
      var up = function () { drag = null; v.dragging = false; };
      canvas.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
      window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
      window.addEventListener('mouseup', up);
      canvas.addEventListener('touchstart', function (e) { var t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
      canvas.addEventListener('touchmove', function (e) { var t = e.touches[0]; move(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
      canvas.addEventListener('touchend', up);
      canvas.addEventListener('dblclick', function () { v.yaw = -0.65; v.pitch = 0.42; draw3D(v); });
    }
    draw3D(v);
  }
  function draw3D(v) {
    var canvas = v.canvas, wrap = canvas.parentElement;
    var w = wrap.clientWidth; if (w < 120) return;
    var h = Math.round(Math.min(w * 0.85, 640)), dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    var S = Math.min(w, h) * 0.26, cx = w / 2, cy = h * 0.5;
    var cyw = Math.cos(v.yaw), syw = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
    // World: x = MAYA, y (up) = Insight, z = Metaphor; each 0–100 mapped to -1..1
    function P(a, b, c) {
      var x = a / 50 - 1, y = c / 50 - 1, z = b / 50 - 1;
      var x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      return { x: cx + x1 * S, y: cy - y2 * S, d: z2 };
    }
    function line(p, q, col, wdt, dash) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = col; ctx.lineWidth = wdt || 1; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]); }
    // Floor grid (Insight = 0)
    for (var g = 0; g <= 100; g += 25) {
      line(P(g, 0, 0), P(g, 100, 0), '#efece6'); line(P(0, g, 0), P(100, g, 0), '#efece6');
    }
    // Cube edges
    var E = [[0, 0, 0, 100, 0, 0], [0, 0, 0, 0, 100, 0], [0, 0, 0, 0, 0, 100], [100, 0, 0, 100, 100, 0], [100, 0, 0, 100, 0, 100], [0, 100, 0, 100, 100, 0], [0, 100, 0, 0, 100, 100], [0, 0, 100, 100, 0, 100], [0, 0, 100, 0, 100, 100], [100, 100, 0, 100, 100, 100], [100, 0, 100, 100, 100, 100], [0, 100, 100, 100, 100, 100]];
    E.forEach(function (e) { line(P(e[0], e[1], e[2]), P(e[3], e[4], e[5]), '#d9d6cf'); });
    // Axes in tool colours
    line(P(0, 0, 0), P(100, 0, 0), LENSES.maya.color, 2.5);
    line(P(0, 0, 0), P(0, 100, 0), LENSES.meta.color, 2.5);
    line(P(0, 0, 0), P(0, 0, 100), LENSES.insight.color, 2.5);
    ctx.font = '700 13px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.textAlign = 'center';
    function label(p, txt, col) { ctx.fillStyle = col; ctx.fillText(txt, p.x, p.y); }
    label(P(114, 0, -6), 'MAYA →', LENSES.maya.color);
    label(P(0, 112, -6), 'Metaphor →', LENSES.meta.color);
    label(P(0, 0, 112), 'Insight ↑', LENSES.insight.color);
    ctx.font = '11px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.fillStyle = '#9a968c';
    [50, 100].forEach(function (t) { var a = P(t, -8, 0), b = P(-8, t, 0), c = P(-6, -6, t); ctx.fillText(t, a.x, a.y + 4); ctx.fillText(t, b.x, b.y + 4); ctx.fillText(t, c.x - 8, c.y + 4); }); var o = P(-7, -7, 0); ctx.fillText('0', o.x, o.y + 4);
    // The corner where an idea is in all three zones
    var T = P(100, 100, 100);
    var grd = ctx.createRadialGradient(T.x, T.y, 2, T.x, T.y, 34); grd.addColorStop(0, 'rgba(227,160,8,0.55)'); grd.addColorStop(1, 'rgba(227,160,8,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(T.x, T.y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a5a00'; ctx.font = '700 11px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.fillText('All three zones', T.x, T.y - 22);
    // Ideas, far ones first
    var pts = (v.points || []).map(function (p) { var q = P(p.a, p.b, p.c); q.p = p; q.f = P(p.a, p.b, 0); return q; }).sort(function (a, b) { return b.d - a.d; });
    pts.forEach(function (q) {
      line(q.f, q, q.p.color, 1, [3, 3]);
      ctx.beginPath(); ctx.arc(q.f.x, q.f.y, 2.2, 0, Math.PI * 2); ctx.fillStyle = q.p.color; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(q.x, q.y, 7.5, 0, Math.PI * 2); ctx.fillStyle = q.p.color; ctx.fill(); ctx.strokeStyle = outlineFor(q.p.color); ctx.lineWidth = outlineFor(q.p.color) === '#fff' ? 2 : 1.5; ctx.stroke();
      if (q.p.label) {
        ctx.font = '700 11.5px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.textAlign = 'left';
        ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.strokeText(q.p.label, q.x + 10, q.y + 4);
        ctx.fillStyle = q.p.color === '#E8A400' ? '#8a6500' : q.p.color; ctx.fillText(q.p.label, q.x + 10, q.y + 4); ctx.textAlign = 'center';
      }
    });
    if (!pts.length) { ctx.fillStyle = '#9a968c'; ctx.font = '14px -apple-system,Segoe UI,Roboto,sans-serif'; ctx.fillText('Ideas appear here once they have ratings with all three tools.', w / 2, h - 16); }
  }
  window.addEventListener('resize', function () { Object.keys(views).forEach(function (k) { if (views[k].canvas && document.body.contains(views[k].canvas)) draw3D(views[k]); }); });

  // Points for the 3D map from computed results (only ideas rated with all three tools).
  function points3D(comp, colorOf, labelOf) {
    return comp.list.filter(function (r) { return r.complete && r.lens.maya && r.lens.meta && r.lens.insight; }).map(function (r) {
      return { a: r.lens.maya.score, b: r.lens.meta.score, c: r.lens.insight.score, color: colorOf(r), label: labelOf ? labelOf(r) : '' };
    });
  }

  // ---------- One presenter's results (like v3: one map per tool, every idea on it) ----------
  var IDEA_COLORS = ['#D62828', '#1D4ED8', '#E8A400'];
  function presenterHtml(data, comp, studentId, opts) {
    opts = opts || {};
    var html = '<div class="tool-grid tools-' + data.lenses.length + '">';
    data.lenses.forEach(function (l) {
      var L = LENSES[l], dots = [], items = [], rows = '', n = 0;
      for (var i = 1; i <= data.ideasPer; i++) {
        var r = comp.byKey[comp.key(studentId, i)], lr = r && r.lens[l];
        if (!lr || !lr.n) continue;
        n = Math.max(n, lr.n);
        items.push({ x: lr.x, y: lr.y, color: IDEA_COLORS[i - 1], label: data.ideasPer > 1 ? String(i) : '' });
        rows += '<div class="idea-row"><span class="idea-sw" style="background:' + IDEA_COLORS[i - 1] + '"></span><div><b>' + (data.ideasPer > 1 ? 'Idea ' + i : 'The idea') + '</b> · ' +
          esc(L.x.name.split(' (')[0]) + ' ' + lr.x.toFixed(1) + ' · ' + esc((L.y.axisName || L.y.name)) + ' ' + lr.y.toFixed(1) +
          '<div class="idea-sug">' + (lr.inZone ? '✔ ' : '↗ ') + esc(lr.sug) + (l === 'insight' && r.obvious && r.obvious.inside ? ' <span class="flag-inline">Close to the AI ideas for this brief.</span>' : '') + '</div></div></div>';
      }
      html += '<div class="tool-card" style="border-top-color:' + L.color + '"><div class="tool-head"><span class="tool-name" style="color:' + L.color + '">' + L.name + '</span><span class="muted small">' +
        (n ? n + ' rating' + (n === 1 ? '' : 's') : 'no ratings yet') + '</span>' +
        '<button type="button" class="save-btn" data-title="' + esc((opts.title ? opts.title + ' · ' : '') + L.name) + '">Save</button></div><div class="tool-q">' + L.question + '</div>' +
        svgMap({ lens: l, zone: data.zones[l], cloud: l === 'insight' ? comp.cloud : null, dots: dots, items: items, small: true }) +
        (rows || '<p class="muted small" style="padding:8px 0">Ratings appear here as classmates press Submit.</p>') + '</div>';
    });
    html += '</div>';
    if (data.lenses.length === 3) {
      html += '<div class="cube-card"><div class="tool-head"><span class="tool-name">3D map: all three tools</span><span class="muted small">Drag to turn it · double-click to reset</span>' +
        '<button type="button" class="save-btn" data-title="' + esc((opts.title ? opts.title + ' · ' : '') + '3D map') + '">Save</button></div>' +
        '<p class="tool-q">Each axis shows how close the idea is to that tool’s target zone (100 = inside the zone). The glowing corner is where an idea is in all three zones.</p>' +
        '<div class="cube-wrap"><canvas class="cube" data-cube="' + esc(opts.cubeKey || 'p') + '"></canvas></div></div>';
    }
    return html;
  }
  function mountPresenterCube(root, data, comp, studentId, key) {
    var cv = root.querySelector('canvas.cube'); if (!cv) return;
    var mine = { list: comp.list.filter(function (r) { return r.studentId === studentId; }) };
    mount3D(cv, points3D(mine, function (r) { return IDEA_COLORS[r.slot - 1]; }, function (r) { return data.ideasPer > 1 ? 'Idea ' + r.slot : ''; }), key);
  }

  // ---------- A map as a picture: a canvas with a title line, then the map ----------
  function mapCanvas(el, title, W) {
    W = W || 1200;
    var pad = Math.round(W / 30), head = Math.round(W / 15);
    return new Promise(function (resolve) {
      function finish(img, iw, ih) {
        var scale = (W - pad * 2) / iw, h = Math.round(ih * scale) + head + pad;
        var c = document.createElement('canvas'); c.width = W; c.height = h;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, h);
        x.fillStyle = '#1f2a44'; x.font = '700 ' + Math.round(W / 40) + 'px -apple-system,Segoe UI,Roboto,Arial,sans-serif'; x.fillText(title || 'TRILUME map', pad, head * 0.65);
        x.fillStyle = '#9a968c'; x.font = Math.round(W / 66) + 'px -apple-system,Segoe UI,Roboto,Arial,sans-serif'; x.textAlign = 'right'; x.fillText('TRILUME · ' + new Date().toLocaleDateString(), W - pad, head * 0.65); x.textAlign = 'left';
        x.drawImage(img, pad, head, iw * scale, ih * scale);
        resolve(c);
      }
      if (el.tagName.toLowerCase() === 'canvas') { finish(el, el.width, el.height); return; }
      var img = new Image();
      img.onload = function () { finish(img, 340 * 3, 330 * 3); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(el));
    });
  }
  // PNG data URL (used for the results emails).
  function mapToPng(el, title, W) { return mapCanvas(el, title, W).then(function (c) { return c.toDataURL('image/png'); }); }

  // ---------- Save a map as a picture (PNG): download on a computer, share/save on a phone ----------
  function saveMap(el, title) {
    mapCanvas(el, title, 1200).then(function (c) {
      c.toBlob(function (blob) {
        var name = ('TRILUME ' + (title || 'map')).replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_').slice(0, 80) + '.png';
        var file = window.File ? new File([blob], name, { type: 'image/png' }) : null;
        var mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        if (mobile && file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: name }).catch(function () {});
          return;
        }
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, 'image/png');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.save-btn'); if (!b) return;
    var card = b.closest('.tool-card, .cube-card, .card'), el = card && (card.querySelector('canvas.cube') || card.querySelector('svg.map'));
    if (el) saveMap(el, b.dataset.title);
  });

  // ---------- "Three lights" colour triangle (About page) ----------
  // A triangle split into small pieces; each piece mixes the three tool colours by its distance
  // to the corners, and the centre fades to white, like three lights meeting.
  function triangleSvg() {
    var W = 300, H = 250, A = [150, 34], B = [48, 204], C = [252, 204], N = 44;
    var hex = function (h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; };
    // Red, green and blue light (RGB): Insight = green, MAYA = blue, Metaphor = red.
    var cA = hex('#22C55E'), cB = hex('#3B82F6'), cC = hex('#EF4444');
    function col(a, b, c) {
      var m = [0, 1, 2].map(function (k) { return cA[k] * a + cB[k] * b + cC[k] * c; });
      var w = Math.pow(Math.min(a, b, c) * 3, 1.6);  // 1 at the centre, 0 on the edges
      return 'rgb(' + m.map(function (v) { return Math.round(v + (255 - v) * w * 0.95); }).join(',') + ')';
    }
    function pt(a, b, c) { return [A[0] * a + B[0] * b + C[0] * c, A[1] * a + B[1] * b + C[1] * c]; }
    var s = '<svg class="tri-name" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="One idea in the light of three lenses">';
    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N - i; j++) {
        // upward piece
        var p1 = [i / N, j / N], p2 = [(i + 1) / N, j / N], p3 = [i / N, (j + 1) / N];
        var tris = [[p1, p2, p3]];
        if (j < N - i - 1) tris.push([p2, [(i + 1) / N, (j + 1) / N], p3]);
        tris.forEach(function (t) {
          var ca = 0, cb = 0;
          var pts = t.map(function (q) { ca += q[0]; cb += q[1]; return pt(1 - q[0] - q[1], q[0], q[1]).map(function (v) { return v.toFixed(1); }).join(','); });
          ca /= 3; cb /= 3;
          var fill = col(1 - ca - cb, ca, cb);
          s += '<polygon points="' + pts.join(' ') + '" fill="' + fill + '" stroke="' + fill + '" stroke-width="0.9" stroke-linejoin="round"/>';
        });
      }
    }
    s += '<polygon points="' + [A, B, C].map(function (q) { return q.join(','); }).join(' ') + '" fill="none" stroke="#1f2a44" stroke-opacity="0.25" stroke-width="1.5" stroke-linejoin="round"/>';
    var font = 'font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif" font-weight="800" text-anchor="middle"';
    s += '<text x="150" y="24" ' + font + ' font-size="15" fill="' + LENSES.insight.color + '">Insight</text>';
    s += '<text x="48" y="228" ' + font + ' font-size="15" fill="' + LENSES.maya.color + '">MAYA</text>';
    s += '<text x="252" y="228" ' + font + ' font-size="15" fill="' + LENSES.meta.color + '">Metaphor</text>';
    s += '<text x="150" y="152" ' + font + ' font-size="17" fill="#1f2a44">Idea</text>';
    return s + '</svg>';
  }

  window.TL = {
    LENSES: LENSES, ORDER: ORDER, PRODUCT_TYPES: PRODUCT_TYPES, REGIONS: REGIONS, IDEA_COLORS: IDEA_COLORS,
    esc: esc, mean: mean, inZone: inZone, closeness: closeness, region: region, suggestion: suggestion, describe: describe,
    colorFor: colorFor, cloudOf: cloudOf, compute: compute, svgMap: svgMap, mount3D: mount3D, points3D: points3D,
    presenterHtml: presenterHtml, mountPresenterCube: mountPresenterCube, views: views, saveMap: saveMap, mapToPng: mapToPng, triangleSvg: triangleSvg
  };
})();
