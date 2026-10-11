# TRILUME: Development notes

Start here before changing anything. This file explains what TRILUME is, where everything lives, how to make the most common changes, and how to deploy and test them.

---

## 1. What TRILUME is

TRILUME is a **research instrument** for Aya Al-Shaikhly's MDes thesis on **Creativity & Cognitive Impact** (School of Industrial Design, Carleton University). It looks at each student idea through three lenses:

| Lens | Question | Whose framework |
|---|---|---|
| MAYA Lens | Will people accept this product? (Familiarity × Novelty) | Raymond Loewy (MAYA principle) |
| Metaphor Lens | How is the metaphor working? (Literalness × Effectiveness of UP & GP) | Prof. WonJoon Chung’s Metaphoric Design Evaluation Matrix |
| **Insight Lens** | How much real thinking is in this idea? (Unexpectedness × Depth of Reasoning) | **Aya Al-Shaikhly’s Insight Evaluation Matrix** |

**Why TRILUME?** An idea can be new but hard to accept, or beautiful but with no clear thinking behind it. Each tool sees one side: **MAYA** (will people accept it?), **Metaphor** (does the metaphor work?) and **Insight** (is there real thinking in it, beyond what an AI would suggest?). Together, and on the 3D map, they give a fuller and fairer picture of each idea. Students get quick, anonymous feedback on which way to develop their ideas while there is still time to change them, and instructors see the whole class at once.

Aya's own contributions are the **Insight Lens**, the **AI obvious zone** (AI-written reference ideas for the same brief, rated in a warm-up) and the **three-tool integration with the 3D map**. TRILUME is **standalone**: it does not link to the Design Evaluation Suite (v1/v2/v3) or EUREKA.

**How a session works.** The instructor chooses **one tool or all three** (never two).
- One tool: students rate all the ideas of each presenter on that tool's two scales, exactly like the Design Evaluation Suite v3.
- All three: students rate each presenter with MAYA, then Metaphor, then Insight (three steps, one Submit). Results show one map per tool plus a **3D map** (axes MAYA, Metaphor, Insight).
- The AI reference ideas, warm-up and AI obvious zone exist **only with the Insight Lens**.

Students rate with **sliders** (1.0–5.0, steps of 0.1; each starts empty) and may add one **comment per idea** on the last step (anonymous, instructor only).

**Design rule: simple first.** Every slider shows the value and the meaning of the closest level. The wording is always developmental ("which way to develop it"), never "good" or "bad".

---

## 2. Where everything lives

| Thing | Location |
|---|---|
| Live app | https://www.ayaalshaikhly.com/TRILUME (also `/trilume` and https://trilume.vercel.app) |
| Code | this folder: `Desktop/Desktop 13-09-2026/Aya master/TRILUME/app` |
| GitHub | https://github.com/ayaalshaikhly/trilume (public). Commits are authored by **Aya Al-Shaikhly only** |
| Vercel | project `trilume`, team `crolog` |
| Database | Neon project `trilume` (org "Aya", AWS us-east-2) |
| Domain routing | `C:\Users\huger\crolog`: `next.config.ts` (rewrites for `/trilume` and `/TRILUME`) and `middleware.ts` (passthrough) |
| Plan | `../TRILUME_Project_Plan.md` and `.docx` |
| Guides | `../Guides/TRILUME_Student_Guide` and `TRILUME_Instructor_Guide` (.docx + .pdf) |

### Secrets (Vercel environment variables only, never in the code or on GitHub)
| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `INSTRUCTOR_PASSCODE` | The first passcode. Once the passcode is changed in the app, the salted hash in the `settings` table is used instead |
| `GEMINI_API_KEY` | Google AI Studio key (Aya's Google account) |
| `GEMINI_MODEL` | Optional. Overrides the model (default `gemini-flash-latest`, with fallbacks) |

Change them in Vercel → project `trilume` → Settings → Environment Variables, then redeploy.

---

## 3. Code map

```
api/
  t.js          Every action (?action=...). Public actions for phones; instructor actions need the passcode.
  setup-db.js   Creates all tables. Safe to re-run. Open /api/setup-db after any schema change.
public/
  index.html    Public first page (About TRILUME + instructor sign in), then sessions, new session, Class / Live results / Class map / Settings tabs, projector, CSV, change passcode.
  go.html       Student phone: warm-up (Insight only) → name list → rate (one tool, or three tools in steps) → optional results.
  lenses.js     Shared engine: tool definitions and wording, scoring, Insight regions, suggestions, AI cloud, SVG maps, 3D map, presenter results.
  style.css     Design. System fonts only (the domain's CSP blocks web fonts).
  qrcode.min.js, xlsx.full.min.js   QR codes and Excel class lists (third-party libraries).
deploy.sh       Deploys a git-free copy to Vercel and runs /api/setup-db.
```

Pages load their CSS/JS through a `document.write('<base href=...>')` line at the top of each HTML file, because the app is served at `/TRILUME` without a trailing slash. Keep new pages on the same pattern.

### API actions (`api/t.js`)
| Public (phones) | Instructor (passcode) |
|---|---|
| `get` session + class list | `check` passcode |
| `rate` all ideas × all tools of one presenter, plus optional comments (one Submit) | `changePass` new passcode |
| `warmup` 3 reference ideas to rate (Insight only) | `generate` AI reference ideas from the brief (`count` 10–30) |
| `rateRefs` submit warm-up ratings | `create`, `update`, `delete`, `eraseAll`, `list` |
| `results` everything needed to draw results (no rater tokens, no comments) | `refs` list reference ideas |
| | `comments` the written comments (instructor only) |

### Database (`api/setup-db.js`)
| Table | One row per |
|---|---|
| `sessions` | class activity: title, brief, product type, lenses (`maya`, `meta`, `insight`, or all three), zones (JSON), ideas per presenter, hide names, warm-up on/off, results on phones (`live_results`, on by default), AI model/prompt/date |
| `students` | name in the class list (`active = false` when removed; ratings are kept) |
| `refs` | AI reference idea (title, reasoning) |
| `ref_ratings` | warm-up rating of one reference idea by one phone (Insight Lens, decimals) |
| `ratings` | rater phone × presenter × idea (slot 1–3) × tool: x, y (decimals 1.0–5.0). The `round` column is always 1 (rounds were removed in v2) |
| `comments` | rater phone × presenter × idea: one written comment (up to 300 characters) |
| `ideas` | not used since v2 (kept so old data is not lost) |
| `settings` | `passcode` = salt:sha256 hash |

Ratings are anonymous: the `token` is a random code stored on the phone, used only so that a second rating of the same presenter replaces the first. The API never returns it.

---

## 4. How the main rules work

- **Tools** (`cleanLenses` in `api/t.js`): a session has exactly one tool or all three; two are never allowed.
- **Score per lens** (`closeness` in `lenses.js`): 100 inside the target zone; outside, 100 − 25 × (distance from the zone's edge in scale points), never below 0. **Overall** = average of the lens scores.
- **Insight regions** (`region` in `lenses.js`): Insight zone (inside the target circle) · Almost (both > 3) · Safe thinker (reasoning > 3, unexpectedness ≤ 3) · Wild guess (unexpectedness > 3, reasoning ≤ 3) · Autopilot (both ≤ 3).
- **AI obvious zone** (`cloudOf` in `lenses.js`): each reference idea's position = mean of its warm-up ratings; the zone = an ellipse around their mean, one standard deviation wide (minimum 0.4); needs at least 3 rated reference ideas.
- **3D map** (`mount3D`, `points3D` in `lenses.js`): across = MAYA, up = Insight, depth = Metaphor; each axis = the idea's score on that tool (0–100). Only ideas rated with all three tools appear. Drag to turn, double-click to reset.

---

## 5. Common changes (where to edit)

| I want to… | Edit |
|---|---|
| Change the wording of a scale or a level | `LENSES` at the top of `public/lenses.js` (`question`, `low`, `high`, `levels`). Also update the Student Guide tables |
| Change a suggestion text | `REGIONS` (Insight) and `suggestion()` (MAYA, Metaphor) in `public/lenses.js` |
| Change the default target zones | `MAYA_PRESETS` and `DEFAULT_ZONES` in `api/t.js` (new sessions only; existing sessions are changed in Settings → Target zones) |
| Change the AI prompt | `promptFor()` in `api/t.js` |
| Change the choices for the number of reference ideas | `fillCounts()` in `public/index.html` (the server allows 10–30) |
| Change the idea colours (red, blue, gold) | `IDEA_COLORS` (and `outlineFor`, the dark outline for gold) in `public/lenses.js` |
| Change the slider (range, step, text) | `scaleHtml()` and `descText()` in `public/go.html`; the server accepts 1.0–5.0 (`score()` in `api/t.js`) |
| Change the comment box | `renderStep()` in `public/go.html` (max 300 characters, also limited in `api/t.js`) |
| Change the Excel download | the `dlExcel` click handler in `public/index.html` |
| Change the saved picture | `saveMap()` in `public/lenses.js` |
| Change the 3D map | `draw3D()` in `public/lenses.js` |
| Change the AI model | Vercel variable `GEMINI_MODEL`, or the `MODELS` list in `api/t.js` |
| Change how many warm-up ideas each student rates | `LIMIT 3` in the `warmup` action (`api/t.js`) and the text in `go.html` |
| Change colours | `:root` in `public/style.css` and `color` / `soft` in `LENSES` (`lenses.js`) |
| Change the score formula | `closeness()` in `public/lenses.js` (and the guides, which explain it) |
| Add a column to the CSV | the `dlIdeas` click handler in `public/index.html` |
| Add a database column | `api/setup-db.js` (use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`), then `api/t.js`, deploy, open `/api/setup-db` |

After changing wording or rules, update the **guides** (`../Guides`) so they still match the app.

---

## 6. Deploy

```bash
cd "Desktop/Desktop 13-09-2026/Aya master/TRILUME/app"
bash deploy.sh        # deploys a git-free copy to Vercel and runs /api/setup-db
```

Pushing to GitHub does **not** redeploy the site. Deploy with `deploy.sh`.

If `/TRILUME` ever stops loading, redeploy the routing site: `cd C:\Users\huger\crolog && vercel --prod --yes`, then `vercel cache purge --yes`.

## 7. Save to GitHub

```bash
gh auth switch --user ayaalshaikhly
git add -A
git commit -m "Short description of the change"
git push
```

Commits are authored by Aya only (this folder's git config is set to Aya). Never add co-author or "generated with" lines.

## 8. Test

- **Quick check:** open the live app, create a session called "Test (delete me)", open the student link on your phone, rate, check the projector, then delete the session.
- **Full end-to-end test (v2, Oct 11, 2026):** a Node script (puppeteer-core + headless Edge) that clicks every button and checks that every phone rating is stored and shown, for a one-tool session and a three-tool session with the AI warm-up and the 3D map; v2.1 adds sliders, decimals, comments, Save and Excel: 94 checks, all passing. Each phone needs its **own browser context** (otherwise they share one rater token). After a deploy, purge the crolog cache (`vercel cache purge --yes` in `C:\Users\huger\crolog`) so the website serves the new files.
- Name every test session "(delete me)" and delete it after testing.

---

## 9. Rules

- TRILUME is a research instrument for a thesis on creativity. Frame it that way in every document.
- Keep it standalone: no links to the Design Evaluation Suite or EUREKA.
- Never write the passcode or any key in the code, docs or GitHub.
- Only the design brief is ever sent to the AI. Never send student names, ideas or ratings.
- Research data only after CUREB clearance; export with "Replace names with codes" ticked.
- Keep it simple: before adding a feature, ask whether a student could use it without instructions.

## 10. Open items / ideas

- [ ] Show TRILUME to Prof. Chung; confirm the Insight Lens wording and target zone.
- [ ] Name TRILUME (and Gemini receiving only the brief) in the CUREB Very Low Risk application.
- [ ] Optional: French interface.
- [ ] Optional: per-session choice to hide the AI obvious zone from students.

## Change log

| Version | Date | Changes |
|---|---|---|
| 2.1 | 2026-10-11 | Feedback from Prof. Chung and students: sliders (1.0–5.0) instead of number buttons; optional written comment per idea (anonymous, instructor only); maps show only each idea's average (no single-rating circles); idea colours red, blue, gold; results on students' phones on by default; Save (picture) on every map; Excel download with one sheet per presenter including comments |
| 2.0 | 2026-10-11 | Simplified: one tool or all three (no rounds, no automatic lens assignment, no predictions, no triangle); students rate all ideas with every chosen tool; one map per tool like v3; 3D map for all three tools; AI reference ideas only for the Insight Lens, adjustable number (10–30); optional results on phones; fixes: messages no longer block buttons, full-screen QR fits the screen and closes with Esc |
| 1.0 | 2026-10-10 | First release: three lenses with balanced assignment, AI reference ideas (Gemini) and AI obvious zone, warm-up, prediction pins, rounds with thinking moves and sources, live projector view, class map, summary, CSV export, changeable passcode, student and instructor guides |
