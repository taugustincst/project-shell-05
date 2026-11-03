# HANDOFF — project-shell-05 — LOST PROPERTY OFFICE

## Status: ASSIGNED 2026-11-02 — build priority #4 in the roster sequence

Roster assignment by Folder at Tj's direction, from the 2026-11-02 Google Play niche research. This file is the build brief AND the living handoff. Keep it updated.

## 1. THE GAME — exactly what to make

**Fantasy:** Day-shift clerk at a railway lost-property office. Everyone who comes to your counter is having a bad day; your job is to make it a little better with nothing but a good logbook and a sharp eye. Checking gameplay — zero dystopia, all warmth plus deduction.

**Why this game:** Papers, Please (~430k paid installs at $4.99, 4.6 stars) proved document/object-checking as a game loop, and its only mass-market imitator is an ad-clone with 140M installs — meaning mass appetite is currently served ONLY by adware quality. Nobody has made the warm, premium, object-matching version. It is also the smallest design on the roster: a clean 3–4 week build, and the portfolio's paid-upfront control title (see monetization).

**Core loop (one day):**
1. A claimant describes a lost item — from memory, so 0–2 traits are WRONG (wrong colour, wrong day, wrong carriage), and the description style hints at honesty.
2. You search the warehouse: shelved objects, each with a tag (found date, train/line, location in the carriage) and traits (type, colour, material, distinguishing mark).
3. You cross-check the found-item LOG: claim vs log entry vs the physical object. Three-way match — any leg can be the liar.
4. You stamp: RETURN (match found), HOLD (close, but not provable — claimant can return with proof), or FLAG (fraud attempt or contraband — escalate, don't accuse by default).
5. Day ledger: correct returns build reputation and the office budget (shelving, labels, a kettle for the tea round); wrong returns cost both. Claimants remember.
6. Season story across ~30 days: the lost wedding ring arc — fragments of one couple's story arrive as separate claims until you can reunite ring and owner. Plus smaller authored beats.

**Escalation layers (CORE scope, not stretch — they are the anti-repetition system):**
- Week 2: insurance claim forms (a second document to cross-check).
- Week 3: rival claimants (two people, one item, both plausible).
- Week 4: unclaimed-goods auction day (budget mini-game; story items can be lost forever if you are careless — with a warning).

**Content targets (v1.0):**
- Item generator: ~200 items composed from trait parts (type × colour × material × distinguishing mark), so claims are generated, not hand-placed.
- Claimant generator with per-type error/lie profiles (honest-confused, honest-precise, exaggerator, fraud).
- 30 authored story items and the full ring arc.

## 2. BUILD SPEC

- Vanilla HTML5/CSS/JS, no framework, no build step. Static files, GitHub Pages deploy from this repo (pattern: taugustincst/bubblepop, taugustincst/ironhold).
- Fully offline. Zero network calls, zero analytics, zero ads, zero accounts.
- Generators must be SOLVABLE-FAIR: a checker script verifies every generated day has at least one correct action per claimant given the log — no impossible days, no ambiguous double-matches unless the HOLD path is designed for them.
- Saves: localStorage, versioned key, sanitizer on load, fail-soft (Ironhold lesson).
- Expose a `window.__lostproperty` test API (seed day/items/claimant) for staged screenshots and day-generation checks.
- Portrait-first, one-handed, large-text option, colourblind-safe (traits never conveyed by colour alone — marks/patterns carry identity too). Flat icons + a satisfying stamp. Under 3 MB.

## 3. MONETIZATION — exact

- Google Play: PAID app, **$2.99** one-time. No in-app purchases of any kind, no ads.
- Why paid-upfront here when the roster default is free+unlock: deliberate portfolio experiment. This is a short, charming, impulse-priced title (Reigns logic: $2.99, 1.6M installs). Its sales curve vs shell-04's unlock conversion is the roster's A/B evidence for future pricing calls.
- Never discount-spam the listing and never put price language in the short description (Play promotion-warning rule — Ironhold lesson).

## 4. HOW IT SUCCEEDS — the launch playbook

- Store copy leads with the fantasy ("Every lost thing has a story") and the Papers, Please-shaped search terms (document/object checking, deduction). Short description: features only, no price/promo words.
- Screenshots: real staged days via the test API. Shot 1 = a claim being matched against the log with the stamp hovering. Captions state content ("30-day story · hundreds of lost things"), not price claims.
- Declarations: IARC; audience 13-15 / 16-17 / 18+; Data safety = none collected/shared; privacy policy at this repo's Pages site (privacy.html); contact elderon@augustinnovations.io.
- Process: internal draft → declarations → production → Folder expert review → submission only on Tj's explicit approval.
- Post-launch: reply to every review for 30 days; v1.1 from review themes (roster-wide promise from Ironhold's listing).
- SUCCESS TARGETS (90 days): 5,000 paid units; rating at or above 4.5 stars. Paid titles live and die on rating — below 4.3, stop and diagnose before any other roster title uses paid-upfront again.

## 5. BUILD ORDER (3–4 weeks)

- Week 1: Item/claimant generators + checker script + matching/stamp loop greybox.
- Week 2: Day loop, ledger/budget, reputation; escalation layer 1 (insurance forms).
- Week 3: Story (ring arc + beats), escalation layers 2–3, polish.
- Week 4: Store pack, expert review, submission prep.

## 6. COORDINATION RULES

- Tj decides scope, names, spending, submissions, and anything irreversible. Everything else, the working agent owns end to end.
- Log entries dated and appended below, newest last. Items needing Tj are marked FOR TJ.
- Verify live state before asserting. No prices on marketing websites. Passwords/signing keys are Tj's alone, secure forms only, Elderon-pattern keystore handling.

## Log

- **2026-10-28** — Shell created (README.md + this HANDOFF.md). Awaiting project assignment from Tj.
- **2026-11-02** — ASSIGNED: Lost Property Office (roster #5). Full build brief installed above by Folder. Build priority #4. This is the roster's paid-upfront control title.
- **2026-11-02** — GitHub Pages ENABLED (workflow deploy, standard static workflow added at .github/workflows/pages.yml). Site: https://taugustincst.github.io/project-shell-05/ — until the game is built, this serves the repo files (README/HANDOFF); the shipped game + privacy.html deploy from this same root.
- **2026-11-03** — **v1.0.0 DRAFT BUILT** and merged to `main`. Full 30-day season: item generator (28 types × 12 colours × 30 marks, ~200 objects per season), claimant generator with four profiles, three-way claim/log/object check with the log mis-transcribing one entry in five, eight Standing Orders arriving through the season, all four escalation layers (calendar + closed entries, insurance forms day 8, rival claimants day 15, auctions days 22 and 29), the ring arc (5 beats; reunion day 24; loseable at the day-22 auction with a warning) plus 24 authored claimants, eight office upgrades, three endings. SOLVABLE-FAIR checker in `tests/engine.test.js` plays 300 seasons (~44k claimants): one provable stamp each, no fraud ever returnable, no honest claimant ever flaggable. Sim (`node sim/sim.js`): by-the-book clerk 100%/gold; mark-only clerk 78%/good; naive and suspicious clerks poor; careless auctioneer loses the ring. Smoke test 21/21. Plan and verification in `tasks/todo.md`, lessons in `tasks/lessons.md`. Weeks 1–3 of the build order are in; week 4 (store pack, expert review) remains.
  - Pages was enabled by Folder on 2026-11-02 (its static workflow is kept as-is; `ci.yml` runs the tests on every non-main push). Live at https://taugustincst.github.io/project-shell-05/ once this merge deploys.
  - **FOR TJ:** (1) Play Console: paid app at $2.99, package name (suggest `com.taugustincst.lostproperty`), upload keystore (Elderon pattern). (2) Confirm contact email elderon@augustinnovations.io in privacy.html.
  - **Next (agent-owned):** Android TWA wrapper from Ironhold's `android/`; phone playtest of days 1–3 for pacing (the "good" band is where first seasons land); final screenshot set and feature graphic; Folder expert review; submission prep.
- **2026-11-03** — Roster-level handoff for Folder (all eight games, decisions, open items, lessons): https://github.com/taugustincst/taugustincst.github.io/blob/main/ROSTER-HANDOFF.md
- **2026-11-02 — FOR CLAUDE: EVALUATION FIX LIST (Folder's expert review, 2026-11-02). Overall 8/10 — ship after fixes; the game itself is essentially done and provably fair (checker: ~44k claimants, exactly one provable stamp each). Full report filed in this repo at EVALUATION-2026-11-02.md. Work in this priority order and log closures here.**
  - P1-1 SHIP PACKAGING (the only thing between this build and review): TWA/Android wrapper; feature graphic; final staged screenshot set in store/. Package name suggestion com.taugustincst.lostproperty is FOR TJ to confirm; keystore is Tj's step (Elderon pattern).
  - P2-2 MID-SEASON SATURATION: reputation pins at 100 from ~day 15 under competent play and the budget outgrows its eight upgrade sinks — the headline meters stop generating tension for half the season. Slow reputation gain after day 15 (or add decay) and add a late budget sink.
  - P2-3 STRENGTHEN THE THREE-WAY CHECK: a mark-only strategy that ignores the log, dates and forms still earns a "good" ending at 78% accuracy. Add more two-fit HOLDs and date-sensitive returns so document checks matter for a larger share of claimants — the three-way check is the game's selling point.
  - P3-4 SPEECH VARIETY: generated claimants use one four-beat speech template with only 4 manner lines per profile (16 total) across ~120 generated claimants per season. Add 2–3 alternate frames per beat and 8+ manner lines per profile.
  - P3-5 COUNTS + COPY: authored story items are 29 vs the brief's 30 — add one; the "24 authored claimants" phrasing in your notes matches neither count (29 entries / 26 claims) — correct it. Listing line "any of the three can be lying, including the log" overstates slightly (the log only slips on colour/material) — soften or make it true.
  - P3-6 SMALL UX/DEV ITEMS: large-text toggle should be reachable mid-day, not only in the morning modal; commit a lockfile so npm test runs from a cold checkout.

- **2026-11-03** — Claude (for Taylor's "package all 8"): Google Play edition added on branch `play/package`: `android/play` (Trusted Web Activity, package `com.taugustincst.lostproperty`), build and launch checks (`android.yml`), signed-bundle workflow (`release.yml`), store graphics in `store/`, and `PLAY.md` with the submission steps that need Taylor's accounts. Folder's evaluation fixes are untouched and still come first.

- **2026-11-03** — Claude (for Taylor: "None of the games should be free"): the game is now a paid download, $2.99 on Play, with no in-app purchases. It was already a paid download; the app now carries the game instead of opening the website. `android/play` is now a WebView app with the whole game packed inside the APK (WebViewAssetLoader, no internet permission) instead of a Trusted Web Activity, and `tools/launch-test.sh` fails unless the game loads with no script errors. The website becomes a store page (`site/index.html`, built from `store/listing.md`) that links to Play; merging `play/package` takes the free web copy down at once. `PLAY.md` lists the Console steps.
