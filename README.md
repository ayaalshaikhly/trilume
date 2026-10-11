# TRILUME

**One idea, three lenses.** A peer evaluation tool for creativity and cognitive impact in the design studio.

Designed and developed by **Aya Al-Shaikhly**, School of Industrial Design, Carleton University, 2026.
The MAYA Lens follows Raymond Loewy's MAYA principle; the Metaphor Lens follows Prof. WonJoon Chung's Metaphoric Design Evaluation Matrix; the **Insight Lens** follows **Aya Al-Shaikhly's Insight Evaluation Matrix**, with the **AI obvious zone**.

**Live:** https://www.ayaalshaikhly.com/TRILUME (also `/trilume` and https://trilume.vercel.app)

## Why TRILUME?

An idea can be new but hard to accept, or beautiful but with no clear thinking behind it. Each tool sees one side: **MAYA** (will people accept it?), **Metaphor** (does the metaphor work?) and **Insight** (is there real thinking in it, beyond what an AI would suggest?). Together, and on the 3D map, they give a fuller and fairer picture of each idea. Students get quick, anonymous feedback on which way to develop their ideas while there is still time to change them, and instructors see the whole class at once.

## The three tools

Students rate each presenter's ideas with one tool, or with all three: the **MAYA Lens** (will people accept it? Raymond Loewy's MAYA principle), the **Metaphor Lens** (how is the metaphor working? Prof. WonJoon Chung's Metaphoric Design Evaluation Matrix) and the **Insight Lens** (how much real thinking is in it? Aya Al-Shaikhly's Insight Evaluation Matrix). With all three tools, every idea also appears on a 3D map. The Insight Lens map shows the AI obvious zone: where AI-written ideas for the same brief land.

| Tool | Question | Scales (sliders, 1.0–5.0) |
|---|---|---|
| MAYA Lens | Will people accept this product? | Familiarity × Novelty |
| Metaphor Lens | How is the metaphor working? | Literalness of Representation × Effectiveness of UP & GP |
| **Insight Lens** | How much real thinking is in this idea? | Unexpectedness × Depth of Reasoning |

## How it works

1. Before class, the instructor creates a session and chooses **one tool or all three** (never two), the number of ideas per presenter (1–3) and the class list.
2. With the Insight Lens, the AI (Google Gemini) writes reference ideas from the **brief only** (10–30, default 24). Students rate 3 of them in a one-minute warm-up; this draws the grey **AI obvious zone** on the Insight map.
3. Students scan one QR code. After each presentation they tap the presenter's name and rate **all the ideas** with **sliders** (any value from 1.0 to 5.0, for example 3.4; every slider starts empty):
   - **One tool:** two sliders per idea, then Submit (like the Design Evaluation Suite v3).
   - **All three tools:** MAYA → Next → Metaphor → Next → Insight → Submit.
   - On the last screen, an optional **written comment** per idea (anonymous, up to 300 characters, instructor only).
4. Results: one map per tool for each presenter with each idea's class average (red, blue, gold), shown on the projector and, by default, on students' phones after Submit; a whole-class map; and with all three tools a **3D map** where each idea is a point on the MAYA, Metaphor and Insight axes (each axis = closeness to that tool's target zone, 0–100). Every map has a **Save** button (picture).
5. Downloads: **Excel** (summary + one sheet per presenter with every tool's scores and the comments) and CSV files (ideas, all ratings, reference ideas), with names replaced by codes for research.

## Files

| File | What it does |
|---|---|
| `public/index.html` | Instructor: sessions, new session, Class / Live results / Class map / Settings tabs, projector, CSV, change passcode |
| `public/go.html` | Student phone: warm-up → name list → rate (one tool, or three tools in steps) → optional results |
| `public/lenses.js` | Tool definitions and wording, scoring, Insight regions, AI obvious zone, SVG maps, 3D map, presenter results |
| `public/style.css` | Design (system fonts only; the domain's CSP blocks web fonts) |
| `api/t.js` | All actions (`?action=`), Gemini call, passcode check |
| `api/setup-db.js` | Creates the tables (safe to re-run) |
| `deploy.sh` | Deploys a git-free copy to Vercel and runs setup-db |
| `DEVELOPMENT.md` | Full developer notes: where everything lives, how to change things, deploy and test |

## Setup

| Where | Value |
|---|---|
| Vercel project | `trilume` (team crolog) |
| Neon project | `trilume` (org Aya) |
| `DATABASE_URL` | Neon connection string (Vercel env only) |
| `INSTRUCTOR_PASSCODE` | First passcode (Vercel env only); once changed in the app, the salted hash in the `settings` table is used |
| `GEMINI_API_KEY` | Google AI Studio key (Vercel env only). Model: `gemini-flash-latest` with fallbacks |
| Domain routing | `crolog` project: `next.config.ts` rewrites `/trilume` and `/TRILUME` + `middleware.ts` passthrough |

Deploy: `bash deploy.sh`

## Privacy

Ratings and comments are anonymous (a random phone code, never linked to a name and never returned by the API). Comments are only in the instructor's downloads. Only the design brief is sent to the AI.

## License

Private, Carleton University.
