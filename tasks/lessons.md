# Lessons (Lost Property Office)

- Local ports are denied in the build sandbox: run Playwright over `file://` (service worker registration is skipped there by design).
- A `transform` CSS animation overrides an SVG element's `transform` attribute; wrap the animated path in a `<g transform>` (learned on Keep the Light).
- Planting a corrupt save then reloading does not test the sanitizer: `pagehide` saves the live state over it. Plant via `addInitScript` in a fresh browser context.
- GitHub Pages must be enabled by a person (Settings → Pages → Source: GitHub Actions); the workflow token cannot create the site. On this repo Folder had already done it, and had pushed a workflow to main while the build was in progress: fetch before merging, and keep the workflow that is already deployed.
- Fairness in a generated deduction game is about collisions, not rules: chance objects must never share type+mark with an authored object, a fraud's invented mark must not exist on the shelf, and a fraud must not target an object another claimant is about to take home. The 300-season checker caught each of these in turn.
- Verdicts must be stable within a day: "already returned" counts only entries closed before today, otherwise a rival's return mid-day changes the right stamp under the player.
- A reputation meter alone cannot decide the ending: it saturates. Use accuracy (right stamps / all stamps) with reputation as a floor.
- In Playwright, re-render a sheet after mutating state through the test API before clicking its buttons; a disabled button stays disabled until the next render.
