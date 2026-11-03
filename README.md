# Lost Property Office

**A cozy Papers, Please, for objects, not people.** Day-shift clerk at a railway lost-property office. Travellers describe lost items with faulty memories; you search the shelves, match claims against the found-item log, spot the frauds, and reunite a lost wedding ring with its owner across a season-long story.

Paid on Google Play at $2.99: pay once, no ads, no in-app purchases, fully offline.

Status: **v1.0.0 draft built 2026-11-03**, not yet submitted. Build brief and living log: [HANDOFF.md](HANDOFF.md). Plan and verification: [tasks/todo.md](tasks/todo.md). Repo rename at ship time (Tj's call).

Owner: Tj (Taylor Augustin) / AugustInnovations LLC.

## The game

- **One day**: claimants arrive at the counter. Each describes an article; honest memory errs on colour, material, day and train, never on the distinguishing mark. You search the **Shelves** (tagged objects), cross-check the **Log** (a colleague's transcription, wrong one entry in five on colour or material, right on dates and trains), read the **Orders**, and stamp **RETURN**, **HOLD** or **FLAG**.
- **Standing Orders** arrive through the season and make every stamp provable: returning (day 1), holding, prohibited articles, the calendar (day 3), closed entries (day 5), insurance forms (day 8), rival claimants (day 15), the auction (day 22).
- **Thirty days**, a budget for eight office upgrades (labels, index cards, a kettle, a lamp, a second ledger, a stool, shelving, a telephone), and a story: the ring arc across five beats, plus 24 authored claimants with their own small stories.
- **Endings** by accuracy and reputation: Clerk of the Year, A Good Season, A Hard Season.

## Code

| File | What it is |
| --- | --- |
| `js/data.js` | Content: item parts, claimant profiles, Standing Orders, prohibited list, upgrades, the authored story, endings. |
| `js/engine.js` | Rules engine: seeded generators, the three-way check, `correctFor()` (the provable stamp), stamping, auction, save sanitizer. Runs in Node and the browser. |
| `js/game.js` | UI, save, flow, `window.__lostproperty` test API. |
| `sim/sim.js` | Headless season sim with five clerk heuristics. |
| `tests/engine.test.js` | Engine tests and the SOLVABLE-FAIR checker (300 seasons). |
| `tests/smoke.js` | Playwright smoke test (runs over `file://`). |
| `tools/make-icons.js` | Icons and staged screenshot. |

```bash
node tests/engine.test.js        # rules + fairness
node sim/sim.js 200              # difficulty report
npm install && node tests/smoke.js
```

### Test API
`window.__lostproperty`: `state`, `seedDay(day, seed)`, `select(tag)`, `stamp(action)`, `auto()`, `correct()`, `closeModals()`, `render()`, `setTab(name)`, `save()`, `reset()`.

### Saves
`localStorage` key `lostproperty.v1`: `{ run, meta, settings }`. Every field is sanitized on load; an unreadable save is copied to `lostproperty.v1.backup` and a fresh season starts.

## Publishing
Ships as a Trusted Web Activity (Ironhold pattern); the Android project is not in this repository yet. Pages deploys from `main` via `.github/workflows/pages.yml` (Pages is enabled; live at https://taugustincst.github.io/project-shell-05/). Store copy draft: `store/listing.md`.
