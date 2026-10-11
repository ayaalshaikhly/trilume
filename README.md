# TRILUME

**One idea, three lenses.** A peer evaluation tool for creativity and cognitive impact in the design studio.

Designed and developed by **Aya Al-Shaikhly**, School of Industrial Design, Carleton University, 2026.
The MAYA Lens follows Raymond Loewy's MAYA principle; the Metaphor Lens follows Prof. WonJoon Chung's Metaphoric Design Evaluation Matrix (V2); the Insight Lens and the AI obvious zone are Aya Al-Shaikhly's.

**Live:** https://www.ayaalshaikhly.com/TRILUME (also /trilume and https://trilume.vercel.app)

## How it works
1. The instructor creates a session (name, brief, lenses, class list). The AI (Google Gemini) writes about 24 reference ideas from the brief only.
2. Students scan one QR code. A one-minute warm-up rates 3 reference ideas on the Insight Lens, which draws the **AI obvious zone**.
3. Presenters name their ideas and predict where the class will place each one on the Insight map.
4. Classmates rate each presenter with **one lens**, assigned automatically and balanced (the lens with the fewest raters so far).
5. Each idea gets a triangle (0 to 100 per lens: 100 inside the target zone, minus 25 per scale point outside), suggestions, and three maps. A live projector view, class map and summary are available.
6. Round 2+: presenters record what changed, where the change came from and why; maps show arrows.

## Files
| File | What it does |
|---|---|
| `public/index.html` | Instructor: sessions, new session, class tab, projector, class map, summary, settings, CSV, passcode change |
| `public/go.html` | Student phone: warm-up, rate, I'm presenting, my results |
| `public/lenses.js` | Lens definitions and wording, scoring, AI cloud, SVG maps and triangle, idea card |
| `public/style.css` | Design (system fonts only; the domain's CSP blocks web fonts) |
| `api/t.js` | All actions (`?action=`), Gemini call, passcode check |
| `api/setup-db.js` | Creates the tables (safe to re-run) |
| `deploy.sh` | Deploys a git-free copy to Vercel and runs setup-db |

## Setup
| Where | Value |
|---|---|
| Vercel project | `trilume` (team crolog) |
| Neon project | `trilume` (org Aya) |
| `DATABASE_URL` | Neon connection string (Vercel env only) |
| `INSTRUCTOR_PASSCODE` | First passcode (Vercel env only); once changed in the app, the salted hash in the `settings` table is used |
| `GEMINI_API_KEY` | Google AI Studio key (Vercel env only). Model: `gemini-flash-latest` with fallbacks |
| Domain routing | `C:\Users\huger\crolog`: `next.config.ts` rewrites `/trilume` and `/TRILUME` + `middleware.ts` passthrough |

Deploy: `bash deploy.sh`

## Database
`sessions`, `students`, `refs`, `ref_ratings`, `ideas`, `ratings`, `settings`. Ratings are anonymous (a random phone token, never linked to a name; tokens are never returned by the API).

## License
Private, Carleton University.
