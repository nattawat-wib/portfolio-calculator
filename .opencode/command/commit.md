---
description: Commit only staged changes with an auto-generated conventional commit message and push.
---

1. Run `git status` and `git diff --staged` to see all staged changes in the working directory.
2. If there are no staged changes, ask the user whether to proceed — do NOT commit or push without confirmation.
3. Analyze the staged changes and generate a **conventional commit message** in the format:
   `<type>(<scope>): <description>`
   - Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `perf`
   - Scope should reflect the file or area changed (e.g. `index`, `style`, `data`)
   - Description is a concise summary in imperative mood, lowercase, no period
4. If the user provides extra context via `$ARGUMENTS`, incorporate it into the commit message as a body paragraph after a blank line.
5. Execute:
   ```
   git commit -m "<generated-message>"
   git push
   ```
