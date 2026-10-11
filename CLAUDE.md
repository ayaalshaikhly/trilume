# TRILUME

Read `DEVELOPMENT.md` first: it explains what the app is for, where everything lives, how to make common changes, how to deploy and test, and the open items.

Rules for this project:
- TRILUME is a research instrument for Aya Al-Shaikhly's thesis on creativity and cognitive impact. It is standalone: never link it to the Design Evaluation Suite or EUREKA, and never change those projects from here.
- Keep it simple and easy to use; developmental wording only (never "good" or "bad").
- Commits are authored by Aya Al-Shaikhly only. Never add co-author or "generated with" lines.
- Never write the passcode or any key in code or docs; they live in Vercel environment variables.
- Only the design brief is sent to the AI, never student data.
- Deploy only with `bash deploy.sh`.
- Name test sessions "(delete me)" and delete them after testing.
