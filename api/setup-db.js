const { neon } = require('@neondatabase/serverless');

// Creates every TRILUME table. Safe to run again (IF NOT EXISTS).
module.exports = async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        brief TEXT NOT NULL DEFAULT '',
        product_type TEXT NOT NULL DEFAULT 'Consumer product',
        lenses TEXT NOT NULL DEFAULT 'maya,meta,insight',
        zones JSONB NOT NULL DEFAULT '{}'::jsonb,
        ideas_per INTEGER NOT NULL DEFAULT 3 CHECK (ideas_per BETWEEN 1 AND 3),
        round INTEGER NOT NULL DEFAULT 1,
        hide_names BOOLEAN NOT NULL DEFAULT TRUE,
        warmup BOOLEAN NOT NULL DEFAULT TRUE,
        ai_model TEXT NOT NULL DEFAULT '',
        ai_prompt TEXT NOT NULL DEFAULT '',
        ai_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT TRUE
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS refs (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        n INTEGER NOT NULL,
        title TEXT NOT NULL,
        reasoning TEXT NOT NULL DEFAULT ''
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS ref_ratings (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        ref_id INTEGER NOT NULL REFERENCES refs(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        x REAL NOT NULL CHECK (x BETWEEN 1 AND 5),
        y REAL NOT NULL CHECK (y BETWEEN 1 AND 5),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (ref_id, token)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS ideas (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        round INTEGER NOT NULL,
        slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
        title TEXT NOT NULL DEFAULT '',
        pred_x REAL,
        pred_y REAL,
        move_type TEXT NOT NULL DEFAULT '',
        change_source TEXT NOT NULL DEFAULT '',
        why TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (session_id, student_id, round, slot)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        round INTEGER NOT NULL,
        slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
        lens TEXT NOT NULL CHECK (lens IN ('maya', 'meta', 'insight')),
        token TEXT NOT NULL,
        x REAL NOT NULL CHECK (x BETWEEN 1 AND 5),
        y REAL NOT NULL CHECK (y BETWEEN 1 AND 5),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (session_id, student_id, round, slot, lens, token)
      )`;
    await sql`CREATE INDEX IF NOT EXISTS ratings_session ON ratings (session_id, round)`;
    await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS live_results BOOLEAN NOT NULL DEFAULT TRUE`;
    await sql`ALTER TABLE sessions ALTER COLUMN live_results SET DEFAULT TRUE`;
    // Sliders: scores are decimals (1.0–5.0).
    await sql`ALTER TABLE ratings ALTER COLUMN x TYPE REAL, ALTER COLUMN y TYPE REAL`;
    await sql`ALTER TABLE ref_ratings ALTER COLUMN x TYPE REAL, ALTER COLUMN y TYPE REAL`;
    // Email results: each student may have an email address; emailed_at = when their results were last sent.
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ`;
    // Written feedback: one optional comment per rater per idea (anonymous).
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
        token TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (session_id, student_id, slot, token)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    res.status(200).json({ ok: true, message: 'TRILUME tables ready.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
