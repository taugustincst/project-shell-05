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
