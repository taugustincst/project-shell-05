# Evaluation — Lost Property Office (project-shell-05)

**Evaluator:** expert game-evaluation pass, 2026-11-02 · **Build audited:** `main` @ v1.0.0 draft (332 KB total, vanilla HTML5/CSS/JS)
**Brief:** HANDOFF.md in-repo (roster #5; PAID $2.99 upfront control title; targets: 5,000 paid units / 90 days, ≥4.5★)

## Scores

| Dimension | Score /10 |
|---|---|
| Brief compliance | 9 |
| Gameplay / design | 8 |
| Content / generation quality | 8 |
| Polish / presentation | 7 |
| UX / accessibility | 8 |
| Technical quality | 9 |
| Store readiness | 5 |
| **Overall** | **8** |

**Verdict: ship after fixes** — the game itself is essentially done and provably fair; what remains is ship packaging (Android wrapper, final store assets), not game rework.

---

## 1. Verification runs (verbatim)

### `npm test` — out of the box
Engine suite passes; smoke suite fails to start because dev dependencies are not installed and no lockfile is committed:

```
PASS same seed, same season
PASS FAIRNESS: every claimant on 300 seasons has exactly one provable stamp; frauds never earn a RETURN; honest people are never FLAGged
PASS the ring arc completes for a careful clerk and fails for a careless one
PASS perfect play ends gold; a clerk who HOLDs everything ends poor
PASS escalation layers appear on schedule
PASS wrong stamps cost reputation; the stool softens it
PASS upgrades: only in the morning, only with budget
PASS sanitize survives garbage and round-trips a live season
PASS every story entry is well-formed
ALL 9 PASSED
Error: Cannot find module 'playwright'  (tests/smoke.js)
```

After `npm install` (Playwright + cached Chromium were present on this machine), the smoke suite passes in full — **21/21**:

```
PASS first-day help appears · PASS day 1 has a claimant at the counter · PASS tapping an object selects it and reveals its mark
PASS a correct stamp is marked correct · PASS a wrong stamp explains the right one · PASS the day ends in a ledger
PASS the morning offers the shop · PASS buying shelf labels · PASS day 2 opens · PASS the type filter appears after buying labels
PASS the log lists entries · PASS standing orders are posted · PASS the season reloads where it was
PASS Thursday brings the auction with a warning on the ring · PASS a withheld lot stays on the shelf
PASS day 30 ends the season · PASS a new season starts on day 1
PASS a mangled save still loads: truncated JSON / wrong types / not an object
PASS no page errors, console errors or failed requests
ALL PASSED
```

### `node sim/sim.js 200` (five clerk heuristics, 200 seasons each)
```
byTheBook   gold=200 good=0 poor=0   avg rep=100.0 avg score=1275.8 ring=200/200 accuracy=100.0%
naive       gold=0 good=0 poor=200   avg rep=8.2   avg score=14.0   ring=0/200   accuracy=53.3%
markOnly    gold=0 good=200 poor=0   avg rep=98.4  avg score=668.5  ring=200/200 accuracy=78.0%
suspicious  gold=0 good=0 poor=200   avg rep=13.3  avg score=74.6   ring=200/200 accuracy=52.6%
auctioneer  gold=200                 avg rep=100.0                  ring=0/200   accuracy=100.0%
```
A clean skill gradient: only rule-following play reaches gold; careless auction play loses the ring 200/200. Two soft spots visible in the same data: reputation **pins at 100.0 from day ~15** under good play (the meter is dead for half the season), and a **mark-only clerk who ignores the log, dates and forms still earns a "good" ending at 78%** — the three-way check is partly optional.

### Independent generation probe (60 perfect-play seasons, 1,800 days)
- Claimants/day: min 2, max 8, **avg 4.87**; claimants/season avg **146** (range 145–148 — volume is nearly invariant; variety is compositional, not structural).
- Objects logged/season: avg **180** (171–190) vs the brief's ~200.
- Mix per 60 seasons: 1,560 story claimants (26/season), 7,198 generated; fraud ≈ 19.7% of all claimants; 721 form-carriers; 1,636 rival-linked claimants (≈27/season after day 15 — the week-3 layer is frequent, not rare).
- Variety: 840 distinct type+mark combinations observed on shelves (28 types × 30 marks); 7,189 unique assembled speech strings. But see §4 — uniqueness is combinatorial; the speech *shape* never changes.
- Ring arc under careful play: reunited **60/60**; lost **0/60** (it is lost only through auction carelessness or wrong stamps, as designed).

## 2. Brief compliance (9/10)

Everything the brief names is present and working:

- **Day loop — complete.** Claim with faulty traits (0–2 errors drawn from per-profile ranges; the mark never errs) → warehouse search (shelf cards with tag, traits, found day/train; type filter and mark search as purchasable upgrades) → found-item log cross-check (the log mis-transcribes colour/material on 1 in 5 non-story entries; Standing Orders codify which source is authoritative for what) → RETURN / HOLD / FLAG stamps → per-stamp result modal that explains the provably-correct stamp → day ledger (reputation + budget deltas per claimant) → morning shop → next day. 30 days, 3 endings (gold/good/poor by accuracy + reputation).
- **Three-way match is real.** Claim vs log vs object can each be the liar: claimant memory errs, the log slips on traits, frauds invent marks / backdate losses / forge forms / claim already-returned items.
- **Escalation layers — present, plus two bonus layers.** Brief asked for insurance forms (wk 2), rival claimants (wk 3), auction (wk 4). Build delivers: calendar rule day 3, closed-entries rule day 5, **insurance forms day 8**, **rival claimants day 15**, **auctions days 22 and 29** (ring, found day 6, is 16 days unclaimed on day 22 and is a lot — with an explicit warning and a withhold tick-box; smoke test verifies a withheld lot survives).
- **Solvability guarantee — genuinely proven, not asserted.** `correctFor` derives the one correct stamp from *visible evidence only* (the posted Standing Orders). The checker plays **300 seasons (~44k claimants)** asserting: exactly one provable stamp each; day-start and live verdicts agree; no fraud ever earns RETURN; no honest claimant is ever FLAGged; every non-fraud story claim is RETURN-able. All pass.
- **Generators.** Items composed type × colour × material × mark (28 × 12 × ~2.4 × 30); anti-twin logic prevents accidental type+mark collisions on the shelf and against closed log entries, and authored items relabel chance twins. Claimant generator has the brief's four profiles (precise / confused / exaggerator / fraud) with distinct error ranges and voice lines; frauds come in five evidence-based kinds (wrong mark, impossible date, already-returned, false form, prohibited article) that unlock as the corresponding Orders post.
- **Content counts vs brief.** STORY table = 29 entries (26 claims + 3 found-only): the ring arc in 5 beats (days 2, 6, 9, 24, 28) plus 21 smaller authored beats and 2 atmospheric found objects. Brief target was "30 authored story items" — **one short**, and the builder's own "24 authored claimants" phrasing doesn't match either count. Trivial, but it is the only numeric miss besides ~180 vs ~200 objects/season.
- **Monetization — exact.** Paid app; grep across `js/`, `index.html`, `sw.js`, manifest finds **no billing, purchase, IAP, ads, or analytics code at all** (the only `fetch(` is the service worker's cache-first handler). `privacy.html` states no collection/sharing, consistent with a no-data Data-safety declaration.
- **Save hardening — exemplary.** Versioned key `lostproperty.v1`, `v:1` payload, plus a backup key written when the main save fails to parse. The sanitizer regenerates a run from the seed and overlays only validated, clamped fields (warehouse/log capped at 500, strings truncated, enums whitelisted, story references re-resolved against the data table); corrupt saves fail soft to a fresh season. Smoke tests cover truncated JSON, wrong types, and non-object saves.
- **Test API** `window.__lostproperty`: `seedDay(day, seed)`, `select`, `stamp`, `auto`, `correct`, plus state/engine/data handles — exactly what staged screenshots and checks need.
- **Size / offline:** 332 KB total (brief: under 3 MB). PWA manifest + service worker; smoke runs over `file://` with zero failed requests.

Minor compliance notes: the listing copy says "Any of the three can be lying, including the log" — the log only ever slips on colour/material, which the rules make non-decisive; harmless flavour, slight overstatement. The brief's "claimants remember" is implemented only lightly (story return visits, e.g. Tommy Dobbs day 1 → day 30; generated claimants do not return with consequences).

## 3. Gameplay / design (8/10)

The core design decision — every stamp provable from a posted, growing rulebook — is the right one for the genre and is executed rigorously. Difficulty comes from *which rule applies*, not from hidden information, so a wrong stamp always teaches (the result modal names the correct stamp and the Order behind it). The eight upgrades are all information/quality-of-life tools (labels, index cards, lamp, second ledger, telephone) rather than power, which keeps deduction central while giving the budget a purpose; the kettle/stool/shelving each bend a real system (daily rep, mistake cost, warehouse cap/overflow auction).

Deductions: (a) reputation saturates — by-the-book and even mark-only play sit at rep 100/98 by mid-season, so the headline meter stops generating tension for the back half; budget similarly has no late sink once the eight upgrades are owned. (b) The mark-only shortcut (78%, "good") means a player can ignore dates, trains, forms and the log for most claimants; the FLAG rules are where the documents matter, and they are a minority of stamps. (c) Fraud density (~1 in 5 claimants, rising to ~32% spawn chance late) sits in tension with the "cozy" positioning — defensible as escalation, worth watching in reviews.

## 4. Content & generation quality (8/10) — repetition verdict

**Day-to-day, a first season does not feel repetitive:** 2–8 claimants/day in varying mixes, decoy objects beside every target, a new Order or prohibited item every few days, story beats on most days (29 entries across 30 days), auctions twice, and ~146 decisions per season. The authored writing is the standout — the ring arc (empty box day 2 → ring found day 6 → fraud attempt day 9 → Elsie's reunion day 24 → Albert's umbrella coda day 28) genuinely lands, lands *mechanically* (you can lose the ring at the day-22 auction, and the careless-auctioneer sim loses it 200/200), and the smaller beats are warm without being saccharine.

**The repetition risk is textural and on replay:**
1. Generated speech is a single four-beat template (article sentence → mark sentence → lost-on sentence → manner line) with only **4 manner lines per profile, 16 total**, heard ~120 times per season from generated claimants. The 7,189 unique strings are permutations of parts; the cadence is identical every time.
2. Claimant *volume* is almost fixed (145–148/season) and day composition follows one ramp, so a second season has the same shape.
3. The authored layer is single-use: identical story days, identical text, every season. Meta counters (seasons, rings reunited, best score) acknowledge replay, but seasons 2+ are carried entirely by the generator.

None of this blocks a $2.99, ~3–4-hour first season. It does cap replay value and long-tail review warmth ("finished it twice" players will notice).

## 5. Polish / presentation (7/10)

Coherent paper-and-ledger aesthetic (cream palette, stamp-mark result modal, journal tab that narrates your season back to you, generated icons + maskable). Help modal on day 1 teaches the one rule that matters (the mark never errs). Short of the roster's best: all visuals are emoji glyphs on cards (works, but reads "prototype" next to the Ironhold bar), there is no sound or haptic *thunk* for what the brief calls "a satisfying stamp," and the final screenshot set / feature graphic are not yet produced (one staged portrait exists under `icons/`).

## 6. UX / accessibility (8/10)

Portrait-first, tabbed one-handed layout (Shelves / Log / Orders / Journal), large touch targets for the three stamps, RETURN safely disabled until an object is selected. Colour is never the sole carrier of identity — the distinguishing mark (text) decides every stamp, and claim/log/shelf all present traits as text; the large-text toggle works via a root class. Wrong answers are always explained, which is the genre's core UX obligation.

Deductions: the large-text toggle lives only in the morning modal (unreachable mid-day, where reading load is highest); tabs carry `role="tablist"` but panels lack tab semantics and the stamp buttons have no pressed/aria state; shelf marks are hidden behind tap-to-open per item, which is real friction once the shelf passes ~40 items (partly bought back by the lamp upgrade and search — but those are mid-season purchases, so early friction is the default).

## 7. Technical quality (9/10)

Clean split: pure seeded engine (Node + browser), data as one table file, UI as a thin renderer. Deterministic per seed; the fairness checker doubles as a regression suite; CI workflow present; Pages deploy live. Save sanitizer is the best on the roster so far. The only blemishes: `npm test` fails cold without `npm install` (Playwright dev-dependency, no committed lockfile), and one operator-precedence smell in `renderAuction`'s warning expression (behaves as intended today).

## 8. Store readiness (5/10)

`store/listing.md` is a solid draft: title clean, short description is features-only (69 chars, no price/promo words — the Ironhold lesson applied), full description leads with the fantasy, captions state content, declarations pre-written honestly (IARC, 13+ audience, no data collected/shared, contact elderon@augustinnovations.io, $2.99 noted as Console-only). `privacy.html` is live on the repo's Pages site.

Not done — matching the HANDOFF's own "week 4 remains" note and its FOR TJ items: **no Android (TWA) wrapper in the repo yet**, no package name chosen (builder suggests `com.taugustincst.lostproperty`), no upload keystore, **no feature graphic and no final screenshot set in `store/`**, no Play Console app entry. Until those exist the title cannot be submitted; none of them touch the game code.

## Top 3 defects

1. **Not yet submittable:** Android wrapper, package name/keystore, feature graphic and final screenshot set are all still open (store readiness 5/10). This is the only thing between this build and review.
2. **Economy saturates mid-season:** reputation pins at 100 from ~day 15 under competent play and the budget outgrows its eight sinks; simultaneously the mark-only shortcut (78% → "good") lets players bypass the log/date/form checks for most claimants, softening the three-way deduction that is the game's selling point.
3. **Generated texture repeats:** one speech template + 16 manner lines across ~120 generated claimants per season, and an authored story that is identical on every replay — first season feels varied, second season will feel solved.

## Recommendation

Ship after fixes: (1) build the TWA wrapper + store pack (builder's own next steps), (2) cheap tuning pass — slow reputation gain after day 15 or add a late budget sink, and require log/date checks on a larger share of claimants (e.g. more two-fit HOLDs and date-sensitive returns), (3) widen the speech template pool (2–3 alternate frames per beat, 8+ manner lines per profile). Items 2–3 are data-level changes; nothing here needs rework.
