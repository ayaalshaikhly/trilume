/* ============================================================
   TRILUME: lens definitions, scoring and drawing (SVG).
   Ratings are 1–5. x / y are the two scales of each lens.
   ============================================================ */
(function () {
  var LENSES = {
    maya: {
      key: 'maya', name: 'MAYA Lens', short: 'MAYA', color: '#0f766e', soft: '#e6f4f1',
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
      key: 'meta', name: 'Metaphor Lens', short: 'Metaphor', color: '#6d28d9', soft: '#f1ebfd',
      question: 'How is the metaphor working?', credit: 'Prof. Chung’s Metaphoric Design Evaluation Matrix (V2)',
      zoneName: 'target metaphoric design zone', axisMin: 0,
      x: { name: 'Literalness of Representation', question: 'How directly does the design represent the visual of the source?',
        low: 'Highly Literal', high: 'Highly Abstract',
        levels: { 1: 'Highly Literal: it looks like the source.', 2: 'Mostly Literal: it still looks quite a bit like the source.', 3: 'Subtle: I can see the connection, but it has been transformed.', 4: 'Mostly Abstract: I can’t really see the source, but I can understand the underlying properties.', 5: 'Highly Abstract: the source is not recognizable. The connection is mainly personal, not based on clear properties.' } },
      y: { name: 'Effectiveness of Underlying Properties (UP) and Gestalt Principles (GP)', axisName: 'Effectiveness of UP & GP', question: 'How effectively does the design use the underlying properties and Gestalt principles?',
        low: 'Not at all', high: 'Highly Effective',
        levels: { 1: 'Not at all: the UP and GP are not considered; the design is driven primarily by personal preference.', 2: 'Slightly: the UP and GP are considered superficially and have limited influence on the design’s development.', 3: 'Moderately: the UP and GP are used in the design, but some parts do not feel natural or work well.', 4: 'Strongly: the UP and GP are clearly identified and effectively incorporated into the design.', 5: 'Highly Effective: the UP and GP are clearly articulated and thoughtfully integrated, with their combination meaningfully informing the design.' } }
    },
    insight: {
      key: 'insight', name: 'Insight Lens', short: 'Insight', color: '#c2410c', soft: '#fdf0e7',
      question: 'How much real thinking is in this idea?', credit: 'Aya Al-Shaikhly',
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
  var MOVES = ['Lateral jump', 'Vertical refinement', 'Combined two ideas', 'New metaphor', 'AI suggested it'];
  var SOURCES = ['Myself', 'A classmate', 'The professor', 'AI'];

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

  // ---------- Turn raw results into one result per idea ----------
  function compute(data) {
    var lenses = data.lenses, cloud = cloudOf(data.refs), out = {}, list = [];
    var key = function (s, r, k) { return s + '|' + r + '|' + k; };
    var ideaRows = {};
    (data.ideas || []).forEach(function (i) { ideaRows[key(i.student_id, i.round, i.slot)] = i; });
    var groups = {};
    (data.ratings || []).forEach(function (r) {
      var k = key(r.student_id, r.round, r.slot);
      (groups[k] = groups[k] || []).push(r);
    });
    Object.keys(ideaRows).forEach(function (k) { groups[k] = groups[k] || []; });
    Object.keys(groups).forEach(function (k) {
      var p = k.split('|'), sid = +p[0], round = +p[1], slot = +p[2];
      if (slot > data.ideasPer) return;
      var rs = groups[k], row = ideaRows[k] || {}, res = {
        studentId: sid, round: round, slot: slot, title: row.title || '',
        moveType: row.move_type || '', source: row.change_source || '', why: row.why || '',
        pred: row.pred_x != null && row.pred_y != null ? { x: row.pred_x, y: row.pred_y } : null,
        lens: {}, scores: [], n: rs.length
      };
      lenses.forEach(function (l) {
        var lr = rs.filter(function (r) { return r.lens === l; });
        var z = data.zones[l];
        if (!lr.length) { res.lens[l] = { n: 0, ratings: [] }; return; }
        var x = mean(lr, 'x'), y = mean(lr, 'y'), sc = closeness(z, x, y);
        res.lens[l] = { n: lr.length, ratings: lr, x: x, y: y, inZone: inZone(z, x, y), score: sc, sug: suggestion(l, z, x, y) };
        res.scores.push(sc);
      });
      res.overall = res.scores.length ? Math.round(res.scores.reduce(function (a, b) { return a + b; }, 0) / res.scores.length) : null;
      var I = res.lens.insight;
      if (I && I.n) {
        res.region = region(data.zones.insight, I.x, I.y);
        if (cloud.ready) {
          var dx = I.x - cloud.zone.cx, dy = I.y - cloud.zone.cy;
          res.obvious = { inside: inZone(cloud.zone, I.x, I.y), dist: Math.sqrt(dx * dx + dy * dy) };
        }
        if (res.pred) { var gx = res.pred.x - I.x, gy = res.pred.y - I.y; res.gap = Math.sqrt(gx * gx + gy * gy); }
      }
      out[k] = res; list.push(res);
    });
    // Paths: link each idea to the same slot in the latest earlier round that has results.
    list.forEach(function (res) {
      res.prev = null;
      for (var r = res.round - 1; r >= 1; r--) {
        var pr = out[key(res.studentId, r, res.slot)];
        if (pr && pr.n) { res.prev = pr; break; }
      }
    });
    list.sort(function (a, b) { return a.round - b.round || a.studentId - b.studentId || a.slot - b.slot; });
    return { byKey: out, list: list, cloud: cloud, key: key };
  }

  // ---------- SVG map ----------
  // opts: lens, zone, cloud (insight only), dots [{x,y}], items [{x,y,color,label,pred,prev}], small, quadrants
  function svgMap(opts) {
    var L = LENSES[opts.lens], W = 340, H = 330, pad = { l: 46, r: 14, t: 14, b: 50 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b, lo = L.axisMin, span = 5 - lo;
    var X = function (v) { return pad.l + ((v - lo) / span) * pw; };
    var Y = function (v) { return pad.t + ph - ((v - lo) / span) * ph; };
    var s = '<svg class="map" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(L.name) + ' map">';
    s += '<rect x="' + pad.l + '" y="' + pad.t + '" width="' + pw + '" height="' + ph + '" fill="#fff" stroke="#d9d6cf"/>';
    for (var v = lo; v <= 5; v++) {
      s += '<line x1="' + X(v) + '" y1="' + pad.t + '" x2="' + X(v) + '" y2="' + (pad.t + ph) + '" stroke="#efece6"/>';
      s += '<line x1="' + pad.l + '" y1="' + Y(v) + '" x2="' + (pad.l + pw) + '" y2="' + Y(v) + '" stroke="#efece6"/>';
      s += '<text x="' + X(v) + '" y="' + (pad.t + ph + 13) + '" class="tick" text-anchor="middle">' + v + '</text>';
      s += '<text x="' + (pad.l - 7) + '" y="' + (Y(v) + 3.5) + '" class="tick" text-anchor="end">' + v + '</text>';
    }
    if (opts.lens === 'insight' && opts.quadrants !== false) {
      var mx = X(3), my = Y(3);
      s += '<line x1="' + mx + '" y1="' + pad.t + '" x2="' + mx + '" y2="' + (pad.t + ph) + '" stroke="#e2ddd3" stroke-dasharray="3 3"/>';
      s += '<line x1="' + pad.l + '" y1="' + my + '" x2="' + (pad.l + pw) + '" y2="' + my + '" stroke="#e2ddd3" stroke-dasharray="3 3"/>';
      s += '<text x="' + (pad.l + 6) + '" y="' + (pad.t + 13) + '" class="quad">SAFE THINKER</text>';
      s += '<text x="' + (pad.l + 6) + '" y="' + (pad.t + ph - 6) + '" class="quad">AUTOPILOT</text>';
      s += '<text x="' + (pad.l + pw - 6) + '" y="' + (pad.t + ph - 6) + '" class="quad" text-anchor="end">WILD GUESS</text>';
    }
    // Axis labels
    s += '<text x="' + pad.l + '" y="' + (H - 22) + '" class="end">' + esc(L.x.low) + '</text>';
    s += '<text x="' + (pad.l + pw) + '" y="' + (H - 22) + '" class="end" text-anchor="end">' + esc(L.x.high) + '</text>';
    s += '<text x="' + (pad.l + pw / 2) + '" y="' + (H - 6) + '" class="axis" text-anchor="middle">' + esc(L.x.name) + ' →</text>';
    s += '<text transform="translate(12 ' + (pad.t + ph / 2) + ') rotate(-90)" class="axis" text-anchor="middle">' + esc(L.y.axisName || L.y.name) + ' →</text>';
    // AI obvious zone
    var c = opts.cloud;
    if (opts.lens === 'insight' && c && c.points && c.points.length) {
      if (c.ready) {
        s += '<ellipse cx="' + X(c.zone.cx) + '" cy="' + Y(c.zone.cy) + '" rx="' + (c.zone.rx / span) * pw + '" ry="' + (c.zone.ry / span) * ph + '" fill="#8a8578" fill-opacity="0.13" stroke="#8a8578" stroke-opacity="0.5" stroke-dasharray="2 3"/>';
      }
      c.points.forEach(function (p) { s += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="2.6" fill="#8a8578" fill-opacity="0.55"/>'; });
      if (c.ready) s += '<text x="' + X(c.zone.cx) + '" y="' + (Y(c.zone.cy) + (c.zone.ry / span) * ph + 11) + '" class="cloud" text-anchor="middle">AI obvious zone</text>';
    }
    // Target zone
    var z = opts.zone, zx = X(z.cx), zy = Y(z.cy), zrx = (z.rx / span) * pw, zry = (z.ry / span) * ph;
    s += '<ellipse cx="' + zx + '" cy="' + zy + '" rx="' + zrx + '" ry="' + zry + '" fill="' + L.color + '" fill-opacity="0.10" stroke="' + L.color + '" stroke-width="1.6" stroke-dasharray="5 4"/>';
    var zly = zy - zry - 5 < pad.t + 9 ? zy + 3 : zy - zry - 5;
    s += '<text x="' + zx + '" y="' + zly + '" class="zone" fill="' + L.color + '" text-anchor="middle">' + esc(opts.lens === 'insight' ? 'INSIGHT ZONE' : opts.lens === 'maya' ? 'MAYA ZONE' : 'TARGET ZONE') + '</text>';
    // Individual ratings
    var counts = {};
    (opts.dots || []).forEach(function (d) { var k = d.x + ',' + d.y + ',' + (d.color || ''); counts[k] = (counts[k] || 0) + 1; });
    Object.keys(counts).forEach(function (k) {
      var p = k.split(','), n = counts[k], col = p[2] || L.color;
      s += '<circle cx="' + X(+p[0]) + '" cy="' + Y(+p[1]) + '" r="' + (3.5 + Math.sqrt(n) * 2.6) + '" fill="' + col + '" fill-opacity="0.22" stroke="' + col + '" stroke-opacity="0.6"/>';
      if (n > 1) s += '<text x="' + X(+p[0]) + '" y="' + (Y(+p[1]) + 3) + '" class="n" fill="' + col + '" text-anchor="middle">' + n + '</text>';
    });
    // Paths, predictions, averages
    (opts.items || []).forEach(function (it) {
      var col = it.color || L.color;
      if (it.prev && Math.abs(it.prev.x - it.x) + Math.abs(it.prev.y - it.y) > 0.05) {
        var x1 = X(it.prev.x), y1 = Y(it.prev.y), x2 = X(it.x), y2 = Y(it.y), ang = Math.atan2(y2 - y1, x2 - x1);
        s += '<circle cx="' + x1 + '" cy="' + y1 + '" r="4" fill="#fff" stroke="' + col + '" stroke-width="1.5"/>';
        s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + (x2 - 9 * Math.cos(ang)) + '" y2="' + (y2 - 9 * Math.sin(ang)) + '" stroke="' + col + '" stroke-width="2"/>';
        var bx = x2 - 9 * Math.cos(ang), by = y2 - 9 * Math.sin(ang);
        s += '<path d="M' + bx + ' ' + by + ' L' + (bx - 7 * Math.cos(ang - 0.45)) + ' ' + (by - 7 * Math.sin(ang - 0.45)) + ' M' + bx + ' ' + by + ' L' + (bx - 7 * Math.cos(ang + 0.45)) + ' ' + (by - 7 * Math.sin(ang + 0.45)) + '" stroke="' + col + '" stroke-width="2" fill="none"/>';
      }
      if (it.pred) {
        var px = X(it.pred.x), py = Y(it.pred.y);
        s += '<line x1="' + px + '" y1="' + py + '" x2="' + X(it.x) + '" y2="' + Y(it.y) + '" stroke="#555" stroke-dasharray="3 3"/>';
        s += '<circle cx="' + px + '" cy="' + py + '" r="6.5" fill="#fff" stroke="#333" stroke-width="2"/><circle cx="' + px + '" cy="' + py + '" r="1.8" fill="#333"/>';
      }
    });
    (opts.items || []).forEach(function (it) {
      var mx = X(it.x), my = Y(it.y), d = opts.small ? 7 : 8, col = it.color || L.color;
      s += '<path d="M' + mx + ' ' + (my - d) + ' L' + (mx + d) + ' ' + my + ' L' + mx + ' ' + (my + d) + ' L' + (mx - d) + ' ' + my + 'Z" fill="' + col + '" stroke="#fff" stroke-width="2"/>';
      if (it.label) {
        var right = mx < pad.l + pw - 70;
        s += '<text x="' + (right ? mx + d + 4 : mx - d - 4) + '" y="' + (my + 3.5) + '" class="lbl" fill="' + col + '" text-anchor="' + (right ? 'start' : 'end') + '" paint-order="stroke" stroke="#fff" stroke-width="3">' + esc(it.label) + '</text>';
      }
    });
    return s + '</svg>';
  }

  // ---------- Triangle: one corner per lens, 0–100 ----------
  function svgTriangle(res, lenses) {
    var act = ORDER.filter(function (l) { return lenses.indexOf(l) !== -1; });
    if (act.length < 3) {
      // Two lenses: two simple bars.
      return '<div class="bars">' + act.map(function (l) {
        var sc = res.lens[l] && res.lens[l].n ? res.lens[l].score : null;
        return '<div class="bar-row"><span class="bar-name" style="color:' + LENSES[l].color + '">' + LENSES[l].short + '</span>' +
          '<span class="bar"><span style="width:' + (sc || 0) + '%;background:' + LENSES[l].color + '"></span></span><b>' + (sc == null ? '–' : sc) + '</b></div>';
      }).join('') + '</div>';
    }
    var W = 230, H = 206, cx = 115, cy = 122, R = 78;
    // Insight on top (Aya's lens), MAYA bottom-left, Metaphor bottom-right
    var pos = { insight: -90, maya: 150, meta: 30 };
    var pt = function (l, f) { var a = pos[l] * Math.PI / 180; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; };
    var poly = function (f) { return ['insight', 'meta', 'maya'].map(function (l) { var p = pt(l, f); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); };
    var s = '<svg class="tri" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three-lens triangle">';
    s += '<polygon points="' + poly(1) + '" fill="#faf8f4" stroke="#d9d6cf"/>';
    s += '<polygon points="' + poly(0.5) + '" fill="none" stroke="#e8e4dc" stroke-dasharray="3 3"/>';
    ['insight', 'meta', 'maya'].forEach(function (l) { var p = pt(l, 1); s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#ece8e0"/>'; });
    var vals = {}, have = 0;
    ['insight', 'meta', 'maya'].forEach(function (l) { var r = res.lens[l]; vals[l] = r && r.n ? r.score : null; if (vals[l] != null) have++; });
    if (have) {
      var dp = ['insight', 'meta', 'maya'].map(function (l) { var p = pt(l, Math.max((vals[l] || 0) / 100, 0.04)); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
      s += '<polygon points="' + dp + '" fill="#1f2a44" fill-opacity="0.16" stroke="#1f2a44" stroke-width="2" stroke-linejoin="round"/>';
      ['insight', 'meta', 'maya'].forEach(function (l) { if (vals[l] == null) return; var p = pt(l, Math.max(vals[l] / 100, 0.04)); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="' + LENSES[l].color + '" stroke="#fff" stroke-width="1.5"/>'; });
    }
    var lab = function (l, x, y, anchor) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" class="tri-l" fill="' + LENSES[l].color + '">' + LENSES[l].short +
        ' <tspan class="tri-v">' + (vals[l] == null ? '–' : vals[l]) + '</tspan></text>';
    };
    s += lab('insight', cx, 26, 'middle');
    var pm = pt('maya', 1), pe = pt('meta', 1);
    s += lab('maya', pm[0] - 2, pm[1] + 22, 'start');
    s += lab('meta', pe[0] + 2, pe[1] + 22, 'end');
    return s + '</svg>';
  }

  // ---------- One idea card (projector, presenter's phone) ----------
  function ideaCard(res, data, comp, opts) {
    opts = opts || {};
    var lenses = data.lenses, html = '<div class="idea-card">';
    html += '<div class="idea-head"><span class="idea-num">Idea ' + res.slot + '</span><span class="idea-title">' + esc(res.title || (opts.noTitle || '')) + '</span>' +
      (res.overall != null ? '<span class="overall" title="Average closeness to the target zones (100 = inside)">Overall ' + res.overall + '</span>' : '') + '</div>';
    if (!res.n) {
      html += '<p class="muted small">No ratings yet.</p></div>';
      return html;
    }
    html += '<div class="idea-top">' + svgTriangle(res, lenses) + '<div class="lens-notes">';
    ORDER.forEach(function (l) {
      if (lenses.indexOf(l) === -1) return;
      var r = res.lens[l];
      html += '<div class="lens-note" style="border-color:' + LENSES[l].color + '"><div class="ln-head" style="color:' + LENSES[l].color + '">' + LENSES[l].name +
        ' <span class="ln-n">' + (r.n ? r.n + ' rating' + (r.n === 1 ? '' : 's') : 'no ratings yet') + '</span></div>' +
        (r.n ? '<div class="ln-text">' + esc(r.sug) + '</div>' : '') + '</div>';
    });
    if (res.obvious && res.obvious.inside) html += '<div class="flag">Close to the ideas an AI gives for this brief.</div>';
    if (res.gap != null) {
      html += '<div class="pred-note"><b>Predicted:</b> ' + esc(describe('insight', res.pred.x, res.pred.y)) +
        ' · <b>Class:</b> ' + esc(describe('insight', res.lens.insight.x, res.lens.insight.y)) + ' · <b>' + res.gap.toFixed(1) + '</b> apart' +
        (res.gap <= 0.75 ? ' (well judged)' : '') + '.</div>';
    }
    if (res.prev && (res.moveType || res.source)) {
      html += '<div class="pred-note"><b>Change:</b> ' + esc(res.moveType || '–') + (res.source ? ' · from ' + esc(res.source.toLowerCase()) : '') + (res.why ? ' · “' + esc(res.why) + '”' : '') + '</div>';
    }
    html += '</div></div>' + (opts.foldMaps ? '<details class="maps-toggle"><summary>Show the three maps</summary>' : '') + '<div class="mini-maps">';
    ORDER.forEach(function (l) {
      if (lenses.indexOf(l) === -1) return;
      var r = res.lens[l], items = [];
      if (r.n) {
        var it = { x: r.x, y: r.y };
        if (l === 'insight' && res.pred) it.pred = res.pred;
        if (res.prev && res.prev.lens[l] && res.prev.lens[l].n) it.prev = { x: res.prev.lens[l].x, y: res.prev.lens[l].y };
        items.push(it);
      }
      html += '<div class="mini"><div class="mini-name" style="color:' + LENSES[l].color + '">' + LENSES[l].name + '</div>' +
        svgMap({ lens: l, zone: data.zones[l], cloud: l === 'insight' ? comp.cloud : null, dots: r.ratings, items: items, small: true }) + '</div>';
    });
    return html + '</div>' + (opts.foldMaps ? '</details>' : '') + '</div>';
  }

  window.TL = {
    LENSES: LENSES, ORDER: ORDER, PRODUCT_TYPES: PRODUCT_TYPES, MOVES: MOVES, SOURCES: SOURCES, REGIONS: REGIONS,
    esc: esc, mean: mean, inZone: inZone, closeness: closeness, region: region, suggestion: suggestion, describe: describe,
    colorFor: colorFor, cloudOf: cloudOf, compute: compute, svgMap: svgMap, svgTriangle: svgTriangle, ideaCard: ideaCard
  };
})();
