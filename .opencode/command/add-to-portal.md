---
description: Add a new app card link to the portal index.html
---

The user wants to add a new app card to the portal index.html at `/index.html`. Gather these details from the user if not provided in $ARGUMENTS:
- App name (short, e.g. "OXF3000")
- Description (one line)
- Relative href (e.g. "my-app/")
- Icon background color (CSS color, e.g. "#6c63ff")
- Icon text (1-2 chars, e.g. "OX")

Then edit `/index.html` to insert a new `.app-card` `<a>` element in the `.apps` div, following the exact same pattern as existing cards. Also add a CSS rule for `.app-icon.<name>` if the color is new.

Return a summary of what was added.
