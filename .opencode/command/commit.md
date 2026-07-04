---
description: Stage all changes, commit with an auto-generated conventional commit message, and push.
---

1. Run `git status` and `git diff --staged` and `git diff` to see all changes (staged and unstaged) in the working directory.
2. Analyze the changes and generate a **conventional commit message** in the format:
   `<type>(<scope>): <description>`
   - Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`, `perf`
   - Scope should reflect the file or area changed (e.g. `index`, `style`, `data`)
   - Description is a concise summary in imperative mood, lowercase, no period
3. If the user provides extra context via `$ARGUMENTS`, incorporate it into the commit message as a body paragraph after a blank line.
4. Execute:
   ```
   git add -A
   git commit -m "<generated-message>"
   git push
   ```
