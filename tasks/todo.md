# Lost Property Office — build plan (v1.0.0 draft)

## Content targets (brief §1)
- [x] Item generator: type × colour × material × mark (28 × 12 × 30 = thousands of distinct objects; ~200 objects pass through a season)
- [x] Claimant generator with four profiles (honest-precise, honest-confused, exaggerator, fraud) and per-profile error ranges; mark never errs
- [x] Three-way check: claim vs log vs object (log mis-transcribes colour/material one entry in five; log is authority on dates/trains, object on traits)
- [x] Stamps: RETURN / HOLD / FLAG with Standing Orders that make every stamp provable
- [x] Day ledger: reputation + office budget; wrong returns cost both
- [x] 30-day season with the ring arc (5 beats, reunion on day 24, loseable at the day-22 auction) and 24 smaller authored beats (29 story entries, 30 authored story days)
- [x] Escalation: Order 4 calendar (day 3), Order 5 closed entries (day 5), insurance forms (day 8), rival claimants (day 15), auction days (22, 29)
- [x] Eight office upgrades (labels, index cards, kettle, lamp, second ledger, stool, shelving, telephone)
- [x] Three endings by accuracy + reputation

## Spec (brief §2)
- [x] Vanilla HTML/CSS/JS, no build, static files
- [x] Fully offline; zero network calls; PWA manifest + service worker
- [x] SOLVABLE-FAIR checker: tests/engine.test.js plays 300 seasons and asserts one provable stamp per claimant, no fraud ever RETURNed, no honest claimant ever FLAGged, every story claim returnable, day-start and live verdicts agree
- [x] Save: localStorage `lostproperty.v1`, sanitizer, fail-soft with backup key
- [x] `window.__lostproperty` test API (seedDay, select, stamp, auto, correct, render)
- [x] Portrait, one-handed, large-text toggle, colour never the only carrier of identity (marks carry it)
- [x] Under 3 MB (≈120 KB)

## Monetization (brief §3)
- [x] ~~Paid app, no IAP~~ Changed 2026-11-09 to free with one unlock (`full_unlock`) after day 7, per Taylor's "Free with paid unlock"; privacy.html says so

## Tests and tooling
- [x] tests/engine.test.js (13 tests incl. fairness over 300 seasons, season variety, reputation ceiling)
- [x] sim/sim.js (five clerk heuristics; difficulty and ending distribution)
- [x] tests/smoke.js (21 checks over file://)
- [x] tools/make-icons.js (icons + staged screenshot)
- [x] CI + Pages workflows

## Store pack
- [x] store/listing.md draft (title, short/full description, captions, declarations)
- [x] icons + one staged screenshot
- [ ] Final screenshot set, feature graphic, ASO title pass (week 4, after Tj's review)
- [ ] Android TWA wrapper (Ironhold pattern) — needs package name and keystore from Tj

## Review
Built a complete 30-day season: generators, three-way matching, eight standing orders arriving through the season, four escalation layers, the ring arc, eight upgrades, three endings. Verified by: engine tests (9/9, including the fairness checker over 300 generated seasons = ~44,000 claimants), the sim (by-the-book clerk 100% accuracy and gold on every seed; mark-only clerk 78% and "good"; naive and suspicious clerks "poor"; careless auctioneer loses the ring), and the Playwright smoke test (21/21). Balance note for week 3: the "good" band (70–90% accuracy) is where most real players will land on a first season; a second difficulty knob (fewer decoys early) may be wanted after playtesting.
