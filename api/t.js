const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// TRILUME API: one endpoint, ?action=...
// Public actions are used by students' phones; instructor actions need the passcode.
//
// A session uses ONE tool (maya, meta or insight) or ALL THREE.
// Students rate every idea of a presenter with every tool of the session.

// The passcode can be changed in the app; the new one is stored as a salted hash in the settings table.
// Until it is changed, the INSTRUCTOR_PASSCODE environment variable is used.
const ENV_PASSCODE = process.env.INSTRUCTOR_PASSCODE;
function hashPass(salt, pass) { return crypto.createHash('sha256').update(salt + '|' + pass).digest('hex'); }
async function passOk(sql, pass) {
  if (typeof pass !== 'string' || !pass) return false;
  let rows = [];
  try { rows = await sql`SELECT value FROM settings WHERE key = 'passcode'`; } catch (e) { rows = []; } // table not created yet
  if (rows.length) {
    const [salt, hash] = rows[0].value.split(':');
    const a = Buffer.from(hashPass(salt, pass)), b = Buffer.from(hash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return !!ENV_PASSCODE && pass === ENV_PASSCODE;
}

const ALL_LENSES = ['maya', 'meta', 'insight'];
const MAYA_PRESETS = {
  'Consumer product': { cx: 3.6, cy: 3.6, rx: 0.8, ry: 0.7 },
  'Medical device': { cx: 4.0, cy: 2.8, rx: 0.7, ry: 0.6 },
  'Fashion / lifestyle': { cx: 2.8, cy: 4.0, rx: 0.8, ry: 0.7 },
  'Consumer electronics': { cx: 3.5, cy: 3.5, rx: 0.7, ry: 0.7 },
  'Architecture / interior': { cx: 3.4, cy: 3.4, rx: 0.8, ry: 0.7 }
};
const DEFAULT_ZONES = {
  meta: { cx: 3.5, cy: 4.4, rx: 0.55, ry: 0.55 },
  insight: { cx: 4.0, cy: 4.0, rx: 0.7, ry: 0.7 }
};

// AI reference ideas: only for the Insight Lens.
// How many reference ideas the AI writes (instructor can choose 10–30; default 24, about one class).
function promptFor(n) {
  return 'You are helping a design instructor. For the design brief below, list ' + n + ' different ' +
  'design ideas that a typical design student or an AI assistant would be likely to propose. For each idea give: ' +
  'a short title (max 8 words) and one sentence explaining the reasoning behind it (max 25 words). Return JSON only: ' +
    '[{"title": "...", "reasoning": "..."}].\nDesign brief: ';
}
const MODELS = (process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []).concat(['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-flash-lite-latest']);

function num(v, lo, hi, d) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : d;
}
function clampZone(z, d) {
  z = z || {};
  return { cx: num(z.cx, 0, 5, d.cx), cy: num(z.cy, 0, 5, d.cy), rx: num(z.rx, 0.2, 2, d.rx), ry: num(z.ry, 0.2, 2, d.ry) };
}
function cleanText(s, max) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max); }
function cleanNames(names) {
  if (!Array.isArray(names)) return [];
  const seen = new Set(), out = [];
  for (const raw of names) {
    const n = cleanText(raw, 80);
    if (!n || seen.has(n.toLowerCase())) continue;
    seen.add(n.toLowerCase()); out.push(n);
  }
  return out.slice(0, 200);
}
// One tool, or all three. Never two.
function cleanLenses(list) {
  const l = (Array.isArray(list) ? list : [list]).filter(x => ALL_LENSES.includes(x));
  if (l.length === 1) return l;
  return ALL_LENSES.slice();
}
function cleanRefs(list) {
  if (!Array.isArray(list)) return [];
  return list.map(r => ({ title: cleanText(r && r.title, 120), reasoning: cleanText(r && r.reasoning, 300) }))
    .filter(r => r.title).slice(0, 60);
}

function sessionOut(s) {
  return {
    id: s.id, title: s.title, brief: s.brief, productType: s.product_type,
    lenses: s.lenses.split(',').filter(Boolean), zones: s.zones, ideasPer: s.ideas_per,
    hideNames: !!s.hide_names, warmup: !!s.warmup, liveResults: !!s.live_results,
    aiModel: s.ai_model, aiPrompt: s.ai_prompt, aiDate: s.ai_date, createdAt: s.created_at
  };
}
async function loadSession(sql, id) {
  const rows = await sql`SELECT * FROM sessions WHERE id = ${String(id || '')}`;
  return rows[0] || null;
}
async function loadStudents(sql, id) {
  return sql`SELECT id, name, position FROM students WHERE session_id = ${id} AND active = TRUE ORDER BY position, id`;
}
async function saveRefs(sql, id, refs) {
  await sql`DELETE FROM refs WHERE session_id = ${id}`;
  for (let i = 0; i < refs.length; i++) {
    await sql`INSERT INTO refs (session_id, n, title, reasoning) VALUES (${id}, ${i + 1}, ${refs[i].title}, ${refs[i].reasoning})`;
  }
}

async function generateRefs(brief, n) {
  const PROMPT = promptFor(n);
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('The AI key is not set up yet. You can paste ideas instead.');
  let lastErr = 'The AI did not answer.';
  for (const model of MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: PROMPT + brief }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 1.0 }
        })
      });
      const data = await r.json();
      if (!r.ok) { lastErr = (data.error && data.error.message) || ('AI error ' + r.status); continue; }
      const text = ((((data.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
      const m = text.match(/\[[\s\S]*\]/);
      const list = cleanRefs(JSON.parse(m ? m[0] : text));
      if (list.length < 5) { lastErr = 'The AI returned too few ideas.'; continue; }
      return { model, prompt: PROMPT + brief, ideas: list.slice(0, n) };
    } catch (e) { lastErr = e.message; }
  }
  throw new Error(lastErr);
}

module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const q = req.query || {};
  const action = q.action || '';
  const body = req.body || {};

  try {
    // ================= Public (students' phones) =================
    if (action === 'get' && req.method === 'GET') {
      const s = await loadSession(sql, q.id);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      const students = await loadStudents(sql, s.id);
      const rc = await sql`SELECT COUNT(*)::int AS n FROM refs WHERE session_id = ${s.id}`;
      return res.status(200).json({ ...sessionOut(s), students, refCount: rc[0].n });
    }

    // One Submit per presenter: every idea, every tool of the session. Rating again replaces the earlier answer.
    if (action === 'rate' && req.method === 'POST') {
      const s = await loadSession(sql, body.id);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      const token = cleanText(body.token, 64), student = parseInt(body.student);
      const lenses = s.lenses.split(',');
      if (!token || !Array.isArray(body.ratings) || !body.ratings.length) return res.status(400).json({ error: 'Missing rating details' });
      const st = await sql`SELECT id FROM students WHERE id = ${student} AND session_id = ${s.id} AND active = TRUE`;
      if (!st.length) return res.status(404).json({ error: 'Presenter not found' });
      for (const r of body.ratings) {
        const slot = parseInt(r.slot), x = parseInt(r.x), y = parseInt(r.y);
        if (!lenses.includes(r.lens) || !(slot >= 1 && slot <= s.ideas_per) || !(x >= 1 && x <= 5) || !(y >= 1 && y <= 5)) {
          return res.status(400).json({ error: 'Each idea needs two scores from 1 to 5 for each tool' });
        }
      }
      for (const r of body.ratings) {
        await sql`
          INSERT INTO ratings (session_id, student_id, round, slot, lens, token, x, y)
          VALUES (${s.id}, ${student}, 1, ${parseInt(r.slot)}, ${r.lens}, ${token}, ${parseInt(r.x)}, ${parseInt(r.y)})
          ON CONFLICT (session_id, student_id, round, slot, lens, token)
          DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y, created_at = NOW()`;
      }
      return res.status(200).json({ ok: true });
    }

    // Warm-up (Insight Lens only): up to 3 reference ideas this phone has not rated, the least-rated first.
    if (action === 'warmup' && req.method === 'GET') {
      const s = await loadSession(sql, q.id);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      if (!s.lenses.split(',').includes('insight')) return res.status(200).json({ refs: [] });
      const token = cleanText(q.token, 64);
      const rows = await sql`
        SELECT r.id, r.title, r.reasoning, COUNT(rr.id)::int AS n FROM refs r
        LEFT JOIN ref_ratings rr ON rr.ref_id = r.id
        WHERE r.session_id = ${s.id}
          AND NOT EXISTS (SELECT 1 FROM ref_ratings m WHERE m.ref_id = r.id AND m.token = ${token})
        GROUP BY r.id ORDER BY n ASC, random() LIMIT 3`;
      return res.status(200).json({ refs: rows.map(r => ({ id: r.id, title: r.title, reasoning: r.reasoning })) });
    }

    if (action === 'rateRefs' && req.method === 'POST') {
      const s = await loadSession(sql, body.id);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      const token = cleanText(body.token, 64);
      if (!token || !Array.isArray(body.ratings)) return res.status(400).json({ error: 'Missing ratings' });
      for (const r of body.ratings.slice(0, 5)) {
        const ref = parseInt(r.ref), x = parseInt(r.x), y = parseInt(r.y);
        if (!(x >= 1 && x <= 5) || !(y >= 1 && y <= 5)) continue;
        const ok = await sql`SELECT id FROM refs WHERE id = ${ref} AND session_id = ${s.id}`;
        if (!ok.length) continue;
        await sql`
          INSERT INTO ref_ratings (session_id, ref_id, token, x, y) VALUES (${s.id}, ${ref}, ${token}, ${x}, ${y})
          ON CONFLICT (ref_id, token) DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y`;
      }
      return res.status(200).json({ ok: true });
    }

    // Everything needed to draw results. Ratings are anonymous (no tokens returned).
    if (action === 'results' && req.method === 'GET') {
      const s = await loadSession(sql, q.id);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      const [students, ratings, refs] = await Promise.all([
        loadStudents(sql, s.id),
        sql`SELECT student_id, slot, lens, x, y FROM ratings WHERE session_id = ${s.id} ORDER BY created_at`,
        sql`SELECT r.id, r.n, r.title, AVG(rr.x)::float AS x, AVG(rr.y)::float AS y, COUNT(rr.id)::int AS count
            FROM refs r LEFT JOIN ref_ratings rr ON rr.ref_id = r.id WHERE r.session_id = ${s.id} GROUP BY r.id ORDER BY r.n`
      ]);
      return res.status(200).json({ ...sessionOut(s), students, ratings, refs });
    }

    // ================= Instructor only =================
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!(await passOk(sql, body.passcode))) return res.status(403).json({ error: 'Wrong passcode' });

    if (action === 'check') return res.status(200).json({ ok: true });

    if (action === 'changePass') {
      const np = String(body.newPass || '');
      if (np.length < 4 || np.length > 100) return res.status(400).json({ error: 'The new passcode needs at least 4 characters.' });
      const salt = crypto.randomBytes(16).toString('hex');
      await sql`INSERT INTO settings (key, value) VALUES ('passcode', ${salt + ':' + hashPass(salt, np)})
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
      return res.status(200).json({ ok: true });
    }

    if (action === 'generate') {
      const brief = cleanText(body.brief, 600);
      if (!brief) return res.status(400).json({ error: 'Write the design brief first.' });
      try {
        return res.status(200).json(await generateRefs(brief, Math.min(Math.max(parseInt(body.count) || 24, 10), 30)));
      } catch (e) {
        return res.status(502).json({ error: 'The AI could not make ideas right now (' + e.message + '). You can paste your own list instead.' });
      }
    }

    if (action === 'create') {
      const title = cleanText(body.title, 120);
      const names = cleanNames(body.names);
      if (!title) return res.status(400).json({ error: 'Give the session a name.' });
      if (!names.length) return res.status(400).json({ error: 'Add the class list.' });
      const product = MAYA_PRESETS[body.productType] ? body.productType : 'Consumer product';
      const zones = { maya: MAYA_PRESETS[product], meta: DEFAULT_ZONES.meta, insight: DEFAULT_ZONES.insight };
      const lenses = cleanLenses(body.lenses);
      const ideasPer = Math.min(Math.max(parseInt(body.ideasPer) || 3, 1), 3);
      const id = crypto.randomBytes(4).toString('hex');
      const refs = lenses.includes('insight') ? cleanRefs(body.refs) : [];
      const ai = body.ai || {};
      await sql`
        INSERT INTO sessions (id, title, brief, product_type, lenses, zones, ideas_per, ai_model, ai_prompt, ai_date)
        VALUES (${id}, ${title}, ${cleanText(body.brief, 600)}, ${product}, ${lenses.join(',')}, ${JSON.stringify(zones)}::jsonb, ${ideasPer},
                ${cleanText(ai.model, 80) || (refs.length ? 'typed by instructor' : '')}, ${String(ai.prompt || '').slice(0, 2000)},
                ${refs.length ? new Date().toISOString() : null})`;
      for (let i = 0; i < names.length; i++) {
        await sql`INSERT INTO students (session_id, name, position) VALUES (${id}, ${names[i]}, ${i})`;
      }
      await saveRefs(sql, id, refs);
      return res.status(201).json({ id });
    }

    if (action === 'update') {
      const s = await loadSession(sql, body.id);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      if (body.title !== undefined && cleanText(body.title, 120)) await sql`UPDATE sessions SET title = ${cleanText(body.title, 120)} WHERE id = ${s.id}`;
      if (body.brief !== undefined) await sql`UPDATE sessions SET brief = ${cleanText(body.brief, 600)} WHERE id = ${s.id}`;
      if (body.lenses) await sql`UPDATE sessions SET lenses = ${cleanLenses(body.lenses).join(',')} WHERE id = ${s.id}`;
      if (body.ideasPer) await sql`UPDATE sessions SET ideas_per = ${Math.min(Math.max(parseInt(body.ideasPer) || 3, 1), 3)} WHERE id = ${s.id}`;
      if (typeof body.hideNames === 'boolean') await sql`UPDATE sessions SET hide_names = ${body.hideNames} WHERE id = ${s.id}`;
      if (typeof body.warmup === 'boolean') await sql`UPDATE sessions SET warmup = ${body.warmup} WHERE id = ${s.id}`;
      if (typeof body.liveResults === 'boolean') await sql`UPDATE sessions SET live_results = ${body.liveResults} WHERE id = ${s.id}`;
      if (body.productType && MAYA_PRESETS[body.productType]) {
        const z = { ...s.zones, maya: MAYA_PRESETS[body.productType] };
        await sql`UPDATE sessions SET product_type = ${body.productType}, zones = ${JSON.stringify(z)}::jsonb WHERE id = ${s.id}`;
      }
      if (body.zone && ALL_LENSES.includes(body.zone.lens)) {
        const fresh = await loadSession(sql, s.id);
        const d = body.zone.lens === 'maya' ? MAYA_PRESETS[fresh.product_type] : DEFAULT_ZONES[body.zone.lens];
        const z = { ...fresh.zones, [body.zone.lens]: body.zone.reset ? d : clampZone(body.zone, d) };
        await sql`UPDATE sessions SET zones = ${JSON.stringify(z)}::jsonb WHERE id = ${s.id}`;
      }
      if (Array.isArray(body.addNames)) {
        const existing = await loadStudents(sql, s.id);
        const have = new Set(existing.map(p => p.name.toLowerCase()));
        let pos = existing.length ? Math.max(...existing.map(p => p.position)) + 1 : 0;
        for (const n of cleanNames(body.addNames)) {
          if (have.has(n.toLowerCase())) continue;
          await sql`INSERT INTO students (session_id, name, position) VALUES (${s.id}, ${n}, ${pos++})`;
        }
      }
      if (body.removeStudent) await sql`UPDATE students SET active = FALSE WHERE id = ${parseInt(body.removeStudent)} AND session_id = ${s.id}`;
      if (Array.isArray(body.refs)) {
        await saveRefs(sql, s.id, cleanRefs(body.refs));
        const ai = body.ai || {};
        await sql`UPDATE sessions SET ai_model = ${cleanText(ai.model, 80) || 'typed by instructor'}, ai_prompt = ${String(ai.prompt || '').slice(0, 2000)}, ai_date = NOW() WHERE id = ${s.id}`;
      }
      const fresh = await loadSession(sql, s.id);
      const students = await loadStudents(sql, s.id);
      return res.status(200).json({ ...sessionOut(fresh), students });
    }

    if (action === 'refs') {
      const refs = await sql`SELECT id, n, title, reasoning FROM refs WHERE session_id = ${String(body.id || '')} ORDER BY n`;
      return res.status(200).json({ refs });
    }

    if (action === 'delete') {
      await sql`DELETE FROM sessions WHERE id = ${String(body.id || '')}`;
      return res.status(200).json({ ok: true });
    }

    if (action === 'eraseAll') {
      await sql`DELETE FROM sessions`;
      return res.status(200).json({ ok: true });
    }

    if (action === 'list') {
      const rows = await sql`
        SELECT s.*,
          (SELECT COUNT(*)::int FROM students p WHERE p.session_id = s.id AND p.active) AS student_count,
          (SELECT COUNT(DISTINCT r.token)::int FROM ratings r WHERE r.session_id = s.id) AS rater_count
        FROM sessions s ORDER BY s.created_at DESC LIMIT 100`;
      return res.status(200).json(rows.map(s => ({ ...sessionOut(s), studentCount: s.student_count, raterCount: s.rater_count })));
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
