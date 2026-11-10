/* Headless season simulator: node sim/sim.js [seeds]
   Plays the 30-day season with clerk heuristics of varying care and reports endings, reputation curves and the stamp mix. */
const E = require('../js/engine.js'); const D = E.D;
const CLERKS = {
  // Reads the Orders and applies them exactly.
  byTheBook: (s, c) => c.correct,
  // Returns anything of the right type whose colour the claimant got right; never flags. The day-one instinct.
  naive: (s, c) => { const m = E.shelf(s).filter(i => i.type === c.claim.type && i.colour === c.claim.colour); return m.length ? { action: 'RETURN', tag: m[0].tag } : { action: 'HOLD' }; },
  // Matches type + mark (reads Order 1) but ignores the calendar, forms and rivals.
  markOnly: (s, c) => { const m = E.matches(s, c.claim); return m.length === 1 ? { action: 'RETURN', tag: m[0].tag } : { action: 'HOLD' }; },
  // Suspicious of everyone: flags anything that does not match exactly.
  suspicious: (s, c) => { const m = E.matches(s, c.claim); return m.length === 1 && c.claim.colour === m[0].colour ? { action: 'RETURN', tag: m[0].tag } : { action: 'FLAG' }; },
  // Careless with the auction: by the book at the counter, sells everything on Thursdays.
  auctioneer: (s, c) => c.correct
};
const seeds = +(process.argv[2] || 200);
for (const name in CLERKS) {
  const ends = { gold: 0, good: 0, poor: 0 }; let rep = 0, score = 0, rings = 0, right = 0, total = 0, peak = 0, peakDay = 0; const curve = new Array(D.SEASON_DAYS + 1).fill(0);
  for (let seed = 1; seed <= seeds; seed++) {
    const s = E.newRun({ seed });
    while (!s.ended) {
      while (s.phase === 'counter') { const c = E.current(s); const v = CLERKS[name](s, c); const r = E.stamp(s, v.action, v.tag); total++; if (r.ok) right++; if (s.rep > peak) { peak = s.rep; peakDay = s.day; } }
      if (s.phase === 'auction') E.auction(s, name === 'auctioneer' ? [] : E.auctionLots(s).filter(i => i.keep).map(i => i.tag));
      curve[s.day] += s.rep; E.endDay(s); if (s.phase === 'morning') E.nextDay(s);
    }
    ends[s.ended]++; rep += s.rep; score += E.score(s); if (s.flags.ring_reunited) rings++;
  }
  const f = n => (n / seeds).toFixed(1);
  console.log(`${name.padEnd(11)} gold=${ends.gold} good=${ends.good} poor=${ends.poor}  avg rep=${f(rep)} avg score=${f(score)} ring=${rings}/${seeds} accuracy=${(100 * right / total).toFixed(1)}% peak rep=${peak} (day ${peakDay})  rep by day 5/10/15/20/25/30 = ${[5, 10, 15, 20, 25, 30].map(d => f(curve[d])).join('/')}`);
}
