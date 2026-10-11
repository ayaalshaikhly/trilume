# TRILUME: Development notes

Start here before changing anything. This file records **everything** about TRILUME: what it is, every decision and its reason, where everything lives, how to change things, and how to deploy and test. Version 2.3, October 11, 2026.

---

## 1. What TRILUME is

TRILUME is a **research instrument** for Aya Al-Shaikhly's MDes thesis on **Creativity & Cognitive Impact** (School of Industrial Design, Carleton University; supervisor Prof. WonJoon Chung). Students rate each other's design ideas on their phones through three lenses:

| Lens | Question | Scales (sliders 1.0–5.0) | Framework |
|---|---|---|---|
| **MAYA Lens** (blue) | Will people accept this product? | Familiarity × Novelty | Raymond Loewy’s MAYA principle |
| **Metaphor Lens** (red) | How is the metaphor working? | Literalness of Representation × Effectiveness of Underlying Properties (UP) and Gestalt Principles (GP) | Prof. WonJoon Chung’s Metaphoric Design Evaluation Matrix |
| **Insight Lens** (green) | How much real thinking is in this idea? | Unexpectedness × Depth of Reasoning | **Aya Al-Shaikhly’s Insight Evaluation Matrix** |

### What does TRILUME mean?
- **Tri** means *three*: the three tools (MAYA, Metaphor, Insight).
- **Lume** means *light*, from the Latin *lumen*, as in "illuminate" or "luminous".

So **TRILUME** means **"three lights"**: one idea seen in the light of three lenses, like light through a prism. It also echoes the *illumination* stage of creativity (Wallas): Prof. Chung wants students to find their own illumination instead of taking it from the professor or from AI.

### Why TRILUME?
An idea can be new but hard to accept, or beautiful but with no clear thinking behind it. Each tool sees one side: **MAYA** (will people accept it?), **Metaphor** (does the metaphor work?) and **Insight** (is there real thinking in it, beyond what an AI would suggest?). Together, and on the 3D map, they give a fuller and fairer picture of each idea. Students get quick, anonymous feedback on which way to develop their ideas while there is still time to change them, and instructors see the whole class at once.

### Whose work is what
- MAYA (Loewy) and the Metaphoric matrix (Prof. Chung) are existing frameworks, used as two lenses.
- **Aya's contributions:** the **Insight Lens**, the **AI obvious zone** (AI-written reference ideas for the same brief, rated by students in a warm-up), and the **three-lens integration with the 3D map**.
- TRILUME is **standalone**: it never links to the Design Evaluation Suite (v1/v2/v3) or EUREKA.

---

## 2. How a session works

1. **Instructor, before class:** create a session: name, ideas per presenter (1–3), the tool, the class list (name + optional email), and, with the Insight Lens, the design brief and the AI reference ideas.
2. **Tool choice:** **one tool** (MAYA Lens, Metaphor Lens or Insight Lens) or **TRILUME (all three lenses)**. Never two.
   - One tool works exactly like the Design Evaluation Suite v3.
   - TRILUME (all three lenses): students rate each presenter with MAYA → Next → Metaphor → Next → Insight → Submit. Results add a **3D map**.
3. **Students:** scan one QR code; with the Insight Lens they first do a one-minute **warm-up** (3 AI reference ideas); then after each presentation they tap the presenter's name, move the **sliders** for every idea, may add a **comment** per idea on the last screen, and press Submit.
4. **Results:** one map per tool per presenter (projector view, and on students' phones after Submit, on by default), a whole-class map, a 3D map with all three lenses, and **Save** (picture) on every map.
5. **After class:** **Email results to presenters** (one button, from the TRILUME Gmail account) and **Download** (ZIP for instructor or for research).

---

## 3. Decisions and the reasons for them

| Decision | Reason / who asked |
|---|---|
| One tool or all three, never two; no rounds | v1 (rounds, automatic lens assignment, prediction pins, triangle, summary) was "too complicated"; the user asked for v3 simplicity |
| AI part only for the Insight Lens | The Insight Lens depends on it (the obvious zone); MAYA and Metaphor do not |
| 24 AI reference ideas by default (10–30 adjustable) | About one class: ~28 students × 3 warm-up ratings ≈ 84 ratings → ~3–4 per idea. Rule of thumb: about the class size |
| Gemini model `gemini-flash-latest` (with fallbacks) | `gemini-2.5-flash` is closed to new users; the alias keeps working when Google renames models |
| Only the brief is sent to the AI | Privacy and ethics: no student data leaves TRILUME except results emails |
| Sliders 1.0–5.0 (steps 0.1), starting empty | Students said tapping 1–5 is unfair ("I want 1.3"); empty start stops lazy middle answers |
| Maps show only each idea's average | Prof. Chung found the single-rating circles and numbers distracting |
| Idea colours **red, blue, gold** | Prof. Chung found green and blue too similar; gold kept by the user even after the tools became RGB |
| Tool colours **RGB**: Insight green `#16A34A`, MAYA blue `#2563EB`, Metaphor red `#DC2626` | User's choice ("three lights", like an RGB colour triangle); the logo edges fade between these |
| Results on students' phones **on** by default | Prof. Chung's feedback; the instructor can turn it off |
| Save button on every map | Instructor and students wanted to keep the maps |
| One written comment per idea, optional, anonymous | Students wanted to explain their ratings; per idea so feedback is clear |
| Comments included in results emails by default (tick box) | User's choice; the instructor can untick it |
| Email results from a Gmail account (`noreply.trilume@gmail.com`, From: TRILUME, no reply) | Free; one click after class; Gmail addresses cannot contain hyphens |
| Downloads: *for instructor* (names, emails) or *for research* (codes P001…) | The Excel file is for the instructor, who needs names; research data must be anonymous (ethics) |
| Maps inside the Excel file + a maps folder with "Open (full size)" links | User asked to see each student's maps from the Excel file |
| About TRILUME on the public first page, sign-in below it | Anyone opening the link should first see what TRILUME is and why it is useful |
| Option named "TRILUME (all three lenses)" | Using the three lenses together *is* TRILUME |
| Insight target zone default (4.0, 4.0), radius 0.7 | A default choice ("surprising and strong reasoning"), to be confirmed by Aya and Prof. Chung |
| Metaphor zone (3.5, 4.4) | Copied from Prof. Chung's Metaphoric Design Evaluation Matrix graph |
| MAYA zone moves with product type | From the Week 1 notes (medical = more familiar, fashion = more novel); the numbers are a starting guess |

---

## 4. Where everything lives

| Thing | Location |
|---|---|
| Live app | https://www.ayaalshaikhly.com/TRILUME (also `/trilume` and https://trilume.vercel.app) |
| Code | this folder: `Desktop/Desktop 13-09-2026/Aya master/TRILUME/app` |
| GitHub | https://github.com/ayaalshaikhly/trilume (public). Commits are authored by **Aya Al-Shaikhly only** |
| Vercel | project `trilume`, team `crolog` |
| Database | Neon project `trilume` (org "Aya", AWS us-east-2) |
| Domain routing | `C:\Users\huger\crolog`: `next.config.ts` (rewrites `/trilume` and `/TRILUME`) and `middleware.ts` (passthrough, any letter case) |
| Email account | `noreply.trilume@gmail.com` (2-Step Verification on; Google App password "TRILUME") |
| Guides | `../Guides/TRILUME_Student_Guide` (11 p), `TRILUME_Instructor_Guide` (20 p), `TRILUME_How_to_Read_the_Zones` (2 p), each .docx + .pdf |
| First plan (v1, partly outdated) | `../TRILUME_Project_Plan.md` and `.docx` |
| Local notes with secrets (never commit) | `../API key.txt` (Gemini), `../Gmail.txt` (address + App password) |

### Secrets (Vercel environment variables only, never in the code or on GitHub)
| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `INSTRUCTOR_PASSCODE` | The first passcode. Once changed in the app, the salted hash in the `settings` table is used |
| `GEMINI_API_KEY` | Google AI Studio key (Aya's Google account) |
| `GEMINI_MODEL` | Optional. Overrides the model |
| `GMAIL_USER` | The TRILUME Gmail address |
| `GMAIL_APP_PASSWORD` | Its Google **App password** |

Change them in Vercel → project `trilume` → Settings → Environment Variables, then redeploy.

**If emails stop working:** sign in to the Gmail account → https://myaccount.google.com/apppasswords → create a new App password named TRILUME → replace `GMAIL_APP_PASSWORD` in Vercel (without spaces) → redeploy.

---

## 5. Code map

```
api/
  t.js            Every action (?action=...). Public actions for phones; instructor actions need the passcode.
  _email.js       The results email: HTML template + sending through Gmail (nodemailer, smtp.gmail.com:465).
  _email-logo.js  The TRILUME logo as PNG (email programs block SVG).
  setup-db.js     Creates/updates all tables. Safe to re-run. Open /api/setup-db after any schema change.
public/
  index.html      Public first page (About TRILUME + instructor sign in); then sessions, new session,
                  Class (QR, results on phones, warm-up, Email results, ratings so far) / Live results (projector) /
                  Class map / Settings (session, zones, class list with emails, AI reference ideas, downloads, delete);
                  change passcode; erase all data.
  go.html         Student phone: warm-up (Insight only) → name list → sliders (one tool, or three in steps) + comments → results.
  lenses.js       Shared engine: tool definitions and wording, scoring, Insight regions, suggestions, AI cloud,
                  SVG maps, 3D map, presenter results, map pictures (Save / email / Excel), "three lights" triangle.
  style.css       Design. System fonts only (the domain's CSP blocks web fonts).
  qrcode.min.js, xlsx.full.min.js, exceljs.min.js, jszip.min.js   Third-party libraries, hosted here
                  (the domain's CSP blocks most outside scripts). ExcelJS and JSZip load only when a download starts.
deploy.sh         Deploys a git-free copy to Vercel, runs /api/setup-db, purges the crolog cache.
```

Pages load their CSS/JS through a `document.write('<base href=...>')` line at the top of each HTML file, because the app is served at `/TRILUME` without a trailing slash. Keep new pages on the same pattern.

### API actions (`api/t.js`)
| Public (phones) | Instructor (passcode) |
|---|---|
| `get` session + class list (names only, never emails) | `check` passcode · `changePass` new passcode |
| `rate` all ideas × all tools of one presenter, plus comments (one Submit) | `generate` AI reference ideas from the brief (`count` 10–30) |
| `warmup` 3 reference ideas to rate (Insight only) | `create`, `update` (incl. `setEmail`, `addNames`, zones, lenses …), `delete`, `eraseAll`, `list` |
| `rateRefs` submit warm-up ratings | `refs` reference ideas · `comments` written comments |
| `results` everything needed to draw results (no rater tokens, no comments, no emails) | `roster` class list with emails and "sent" times |
| | `sendResults` email one presenter (`preview`, or `test` to another address) |

### Database (`api/setup-db.js`)
| Table | One row per |
|---|---|
| `sessions` | class activity: title, brief, product type, lenses (`maya`, `meta`, `insight`, or all three), zones (JSON), ideas per presenter, hide names, warm-up on/off, `live_results` (on by default), AI model/prompt/date |
| `students` | student in the class list: name, `email` (optional), `emailed_at`; `active = false` when removed (ratings kept) |
| `refs` | AI reference idea (title, reasoning) |
| `ref_ratings` | warm-up rating of one reference idea by one phone (Insight Lens, decimals) |
| `ratings` | rater phone × presenter × idea (slot 1–3) × tool: x, y (decimals 1.0–5.0). `round` is always 1 |
| `comments` | rater phone × presenter × idea: one written comment (≤ 300 characters) |
| `ideas` | not used since v2 (kept so old data is not lost) |
| `settings` | `passcode` = salt:sha256 hash |

Ratings and comments are anonymous: the `token` is a random code stored on the phone, used only so that a second rating of the same presenter replaces the first. The API never returns it.

---

## 6. How the main rules work

- **Tools** (`cleanLenses` in `api/t.js`): exactly one tool or all three.
- **Score per lens** (`closeness` in `lenses.js`): 100 inside the target zone; outside, 100 − 25 × (distance from the zone's edge in scale points), never below 0.
- **Insight regions** (`region`): Insight zone (inside the target circle) · Almost (both > 3) · Safe thinker (reasoning > 3, unexpectedness ≤ 3) · Wild guess (unexpectedness > 3, reasoning ≤ 3) · Autopilot (both ≤ 3).
- **AI obvious zone** (`cloudOf`): each reference idea's position = mean of its warm-up ratings; zone = ellipse around their mean, one standard deviation wide (minimum 0.4); needs ≥ 3 rated reference ideas.
- **3D map** (`mount3D`, `points3D`): across = MAYA, up = Insight, depth = Metaphor; each axis = the idea's score on that tool (0–100). Only ideas rated with all three tools appear. Drag to turn, double-click to reset. The glowing corner = inside all three zones.
- **Suggestions** use developmental wording only ("which way to develop it"), never "good" or "bad".

---

## 7. Common changes (where to edit)

| I want to… | Edit |
|---|---|
| Change the wording of a scale or a level | `LENSES` at the top of `public/lenses.js`. Also update the Student Guide tables |
| Change a suggestion text | `REGIONS` (Insight) and `suggestion()` (MAYA, Metaphor) in `public/lenses.js` |
| Change the default target zones | `MAYA_PRESETS` and `DEFAULT_ZONES` in `api/t.js` (new sessions only; existing ones in Settings → Target zones) |
| Change the tool colours | `:root` (`--maya`, `--meta`, `--insight`) in `public/style.css`, `color`/`soft` in `LENSES`, the logo gradients in `index.html`/`go.html`, the triangle colours in `triangleSvg()` |
| Change the idea colours (red, blue, gold) | `IDEA_COLORS` (and `outlineFor`) in `public/lenses.js` |
| Change the About text / first page | the `passView` section in `public/index.html` (and the README and guides) |
| Change the tool choice labels | `TOOL_CHOICES` in `public/index.html` |
| Change the slider | `scaleHtml()` and `descText()` in `public/go.html`; the server accepts 1.0–5.0 (`score()` in `api/t.js`) |
| Change the comment box | `renderStep()` in `public/go.html` (≤ 300 characters, also limited in `api/t.js`) |
| Change the AI prompt / model | `promptFor()` / `MODELS` in `api/t.js`, or the Vercel variable `GEMINI_MODEL` |
| Change the number choices for reference ideas | `fillCounts()` in `public/index.html` (server allows 10–30) |
| Change how many warm-up ideas each student rates | `LIMIT 3` in the `warmup` action (`api/t.js`) and the text in `go.html` |
| Change the score formula | `closeness()` in `public/lenses.js` (and the guides) |
| Change the results email | `buildHtml()` in `api/_email.js` (layout/text); `buildEmail()` in `index.html` (what goes in) |
| Change the downloads | `downloadAll()`, `ideasCsv()`, `ratingsCsv()` in `public/index.html` |
| Change the saved picture | `mapCanvas()` / `saveMap()` in `public/lenses.js` |
| Change the 3D map | `draw3D()` in `public/lenses.js` |
| Add a database column | `api/setup-db.js` (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`), then `api/t.js`, deploy, open `/api/setup-db` |

After changing wording or rules, update the **guides** (`../Guides`) so they still match the app.

---

## 8. Deploy

```bash
cd "Desktop/Desktop 13-09-2026/Aya master/TRILUME/app"
bash deploy.sh        # git-free copy to Vercel, runs /api/setup-db, purges the website cache
```

Pushing to GitHub does **not** redeploy the site. If `/TRILUME` ever stops loading, redeploy the routing site: `cd C:\Users\huger\crolog && vercel --prod --yes`, then `vercel cache purge --yes`.

## 9. Save to GitHub

```bash
gh auth switch --user ayaalshaikhly
git add -A
git commit -m "Short description of the change"
git push origin main
```

Commits are authored by Aya only (this folder's git config is set to Aya). Never add co-author or "generated with" lines. This folder uses `gh auth git-credential` for pushing (a plain push once hung on a sign-in prompt).

## 10. Test

- **Quick check:** open the live app, create a session called "Test (delete me)", open the student link on your phone, rate, check the projector, then delete the session.
- **Automated tests (Node + puppeteer-core + headless Edge), Oct 11, 2026:**
  - Full app test: every button, every phone rating stored and shown, one tool and TRILUME (all three lenses) with the AI warm-up and the 3D map, sliders, comments, Save: **94/94 passed**.
  - Email test: class list with emails, preview, test, send all, skipped students, wrong emails refused: **16/16 passed**; a real test email reached `ayaalshaikhly@cmail.carleton.ca`.
  - Download test: both ZIPs unzipped and the Excel file opened in Excel (sheets, embedded maps, links, no emails in the research version).
  - Each test phone needs its **own browser context** (otherwise they share one rater token). Purge the crolog cache after a deploy before testing.
- Name every test session "(delete me)" and delete it after testing.

---

## 11. Rules

- TRILUME is a research instrument for a thesis on creativity. Frame it that way in every document.
- Keep it standalone: no links to the Design Evaluation Suite or EUREKA.
- Keep it simple: before adding a feature, ask whether a student could use it without instructions.
- Never write the passcode, keys or the Gmail App password in the code, docs or GitHub.
- Only the design brief is ever sent to the AI. Emails go only to the students' own addresses.
- Research data only after CUREB clearance; use **Download for research**, and check that no comment mentions a name (comments are exported as written).

## 12. Open items / ideas

- [ ] Show TRILUME to Prof. Chung; confirm the Insight Lens wording and the Insight target zone.
- [ ] Name TRILUME, Gemini (brief only) and the Gmail results emails in the CUREB Very Low Risk application.
- [ ] Optional: French interface.
- [ ] Optional: per-session choice to hide the AI obvious zone from students.

## Change log

| Version | Date | Changes |
|---|---|---|
| 2.3 | 2026-10-11 | Downloads: ZIP *for instructor* (names, emails) or *for research* (codes): Excel with Summary + one sheet per presenter including their maps and "Open (full size)" links, maps folder, CSV files. Option renamed "TRILUME (all three lenses)" |
| 2.2 | 2026-10-11 | Email results (Gmail, From: TRILUME): class list with emails, preview, test, send all, per-student send, ✓ Sent; About moved to the public first page with "What does TRILUME mean?" and the "three lights" triangle; RGB tool colours; Insight Lens credited as Aya Al-Shaikhly’s Insight Evaluation Matrix |
| 2.1 | 2026-10-11 | Feedback from Prof. Chung and students: sliders; comments per idea; maps show only averages; idea colours red, blue, gold; results on phones on by default; Save on every map; Excel with one sheet per presenter |
| 2.0 | 2026-10-11 | Simplified: one tool or all three, no rounds/lens assignment/predictions/triangle; one map per tool like v3; 3D map; AI only for the Insight Lens (10–30 ideas); fixes (messages blocking buttons, full-screen QR) |
| 1.0 | 2026-10-10 | First release: balanced lens assignment, AI reference ideas and obvious zone, warm-up, prediction pins, rounds, projector, class map, summary, CSV, changeable passcode, guides |
