# TRILUME: Development notes

Start here before changing anything. This file explains what TRILUME is, where everything lives, how to make the most common changes, and how to deploy and test them.

---

## 1. What TRILUME is

TRILUME is a **research instrument** for Aya Al-Shaikhly's MDes thesis on **Creativity & Cognitive Impact** (School of Industrial Design, Carleton University). It looks at each student idea through three lenses:

| Lens | Question | Whose framework |
|---|---|---|
| MAYA Lens | Will people accept this product? (Familiarity × Novelty) | Raymond Loewy (MAYA principle) |
| Metaphor Lens | How is the metaphor working? (Literalness × Effectiveness of UP & GP) | Prof. WonJoon Chung (Metaphoric Design Evaluation Matrix V2) |
| **Insight Lens** | How much real thinking is in this idea? (Unexpectedness × Depth of Reasoning) | **Aya Al-Shaikhly** |

Aya's own contributions are the **Insight Lens**, the **AI obvious zone** (AI-written reference ideas for the same brief, rated in a warm-up) and the **three-lens integration**. TRILUME is **standalone**: it does not link to the Design Evaluation Suite (v1/v2/v3) or EUREKA.

**Design rule: simple first.** Rating one presenter takes about 8 taps. Every scale point shows its meaning. The wording is always developmental ("which way to develop it"), never "good" or "bad".

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
  index.html    Instructor: passcode, sessions, new session (4 steps), Class / Live results / Class map / Summary / Settings tabs, projector, CSV, change passcode.
  go.html       Student phone: warm-up → name list → rate with the assigned lens; "I'm presenting" → ideas + prediction pins (+ changes from round 2) → My results.
  lenses.js     Shared engine: lens definitions and wording, scoring, Insight regions, suggestions, AI cloud, SVG maps, triangle, idea card.
  style.css     Design. System fonts only (the domain's CSP blocks web fonts).
  qrcode.min.js, xlsx.full.min.js   QR codes and Excel class lists (third-party libraries).
deploy.sh       Deploys a git-free copy to Vercel and runs /api/setup-db.
```

Pages load their CSS/JS through a `document.write('<base href=...>')` line at the top of each HTML file, because the app is served at `/TRILUME` without a trailing slash. Keep new pages on the same pattern.

### API actions (`api/t.js`)
| Public (phones) | Instructor (passcode) |
|---|---|
| `get` session + class list | `check` passcode |
| `assign` which lens this phone uses for a presenter | `changePass` new passcode |
| `rate` submit ratings | `generate` AI reference ideas from the brief |
| `warmup` 3 reference ideas to rate | `create`, `update`, `delete`, `eraseAll`, `list` |
| `rateRefs` submit warm-up ratings | `refs` list reference ideas |
| `present` idea names, predictions, changes | |
| `results` everything needed to draw results (no rater tokens) | |

### Database (`api/setup-db.js`)
| Table | One row per |
|---|---|
| `sessions` | class activity: title, brief, product type, lenses, zones (JSON), ideas per presenter, current round, hide names, warm-up on/off, AI model/prompt/date |
| `students` | name in the class list (`active = false` when removed; ratings are kept) |
| `refs` | AI reference idea (title, reasoning) |
| `ref_ratings` | warm-up rating of one reference idea by one phone (Insight Lens) |
| `ideas` | presenter × round × slot (1–3): title, prediction (x, y), move type, change source, why |
| `ratings` | rater phone × presenter × round × slot × lens: x, y (1–5) |
| `settings` | `passcode` = salt:sha256 hash |

Ratings are anonymous: the `token` is a random code stored on the phone, used only to balance lenses and replace repeated answers. The API never returns it.

---

## 4. How the main rules work

- **Lens assignment** (`assign` in `api/t.js`): for each presenter and round, a phone gets the active lens with the **fewest raters so far** (random among ties). A phone keeps the same lens for that presenter in that round.
- **Score per lens** (`closeness` in `lenses.js`): 100 inside the target zone; outside, 100 − 25 × (distance from the zone's edge in scale points), never below 0. **Overall** = average of the lens scores.
- **Insight regions** (`region` in `lenses.js`): Insight zone (inside the target circle) · Almost (both > 3) · Safe thinker (reasoning > 3, unexpectedness ≤ 3) · Wild guess (unexpectedness > 3, reasoning ≤ 3) · Autopilot (both ≤ 3).
- **AI obvious zone** (`cloudOf` in `lenses.js`): each reference idea's position = mean of its warm-up ratings; the zone = an ellipse around their mean, one standard deviation wide (minimum 0.4); needs at least 3 rated reference ideas.
- **Prediction gap**: distance between the presenter's pin and the class mean on the Insight map (≤ 0.75 = "well judged").
- **Paths**: an idea in round *r* is linked to the same slot in the latest earlier round with ratings.

---

## 5. Common changes (where to edit)

| I want to… | Edit |
|---|---|
| Change the wording of a scale or a level | `LENSES` at the top of `public/lenses.js` (`question`, `low`, `high`, `levels`). Also update the Student Guide tables |
| Change a suggestion text | `REGIONS` (Insight) and `suggestion()` (MAYA, Metaphor) in `public/lenses.js` |
| Change the default target zones | `MAYA_PRESETS` and `DEFAULT_ZONES` in `api/t.js` (new sessions only; existing sessions are changed in Settings → Target zones) |
| Change the thinking moves or change sources | `MOVES` and `SOURCES` in `public/lenses.js` |
| Change the AI prompt or the number of reference ideas | `PROMPT` and `N_REFS` in `api/t.js` |
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
- **Full end-to-end test (used on Oct 10, 2026):** a Node script (puppeteer-core + headless Edge) that drives the instructor laptop and four separate phones through two rounds: 54 checks, all passing. Each phone needs its **own browser context** (otherwise they share one rater token). Scroll a map into view before tapping it.
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
| 1.0 | 2026-10-10 | First release: three lenses with balanced assignment, AI reference ideas (Gemini) and AI obvious zone, warm-up, prediction pins, rounds with thinking moves and sources, live projector view, class map, summary, CSV export, changeable passcode, student and instructor guides |
