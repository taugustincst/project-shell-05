// node tests/engine.test.js — rules engine and fairness checker
const assert = require('assert'); const E = require('../js/engine.js'); const D = E.D;
let n = 0; const t = (name, fn) => { try { fn(); n++; console.log('PASS ' + name); } catch (e) { console.log('FAIL ' + name + '\n  ' + e.message); process.exitCode = 1; } };
function playPerfect(seed, keepStory) { const s = E.newRun({ seed }); while (!s.ended) { while (s.phase === 'counter') { const c = E.current(s); E.stamp(s, c.correct.action, c.correct.tag); } if (s.phase === 'auction') E.auction(s, keepStory ? E.auctionLots(s).filter(i => i.keep).map(i => i.tag) : []); E.endDay(s); if (s.phase === 'morning') E.nextDay(s); } return s; }

t('same seed, same season', () => { const a = playPerfect(5, true), b = playPerfect(5, true); assert.strictEqual(JSON.stringify(a.journal), JSON.stringify(b.journal)); });
t('FAIRNESS: every claimant on 300 seasons has exactly one provable stamp; frauds never earn a RETURN; honest people are never FLAGged', () => {
  let tot = 0;
  for (let seed = 1; seed <= 300; seed++) { const s = E.newRun({ seed }); while (!s.ended) { while (s.phase === 'counter') { const c = E.current(s); tot++; const r = E.correctFor(s, c, s.claimants); assert.strictEqual(r.action + ':' + (r.tag || ''), c.correct.action + ':' + (c.correct.tag || ''), `day-start and live verdicts agree seed ${seed} day ${s.day}`); assert.ok(['RETURN', 'HOLD', 'FLAG'].includes(r.action)); if (r.action === 'RETURN') assert.ok(E.shelf(s).some(i => i.tag === r.tag), 'return tag on shelf'); assert.ok(!(c.profile === 'fraud' && r.action === 'RETURN'), `fraud return seed ${seed} day ${s.day}`); assert.ok(!(c.profile !== 'fraud' && r.action === 'FLAG'), `honest flag seed ${seed} day ${s.day}`); if (c.story && c.story.kind === 'claim' && c.story.profile !== 'fraud') assert.strictEqual(r.action, 'RETURN', `story claim ${c.name} day ${s.day} seed ${seed}: ${r.why}`); E.stamp(s, r.action, r.tag); } if (s.phase === 'auction') E.auction(s, E.auctionLots(s).filter(i => i.keep).map(i => i.tag)); E.endDay(s); if (s.phase === 'morning') E.nextDay(s); } }
  assert.ok(tot > 30000);
});
t('the ring arc completes for a careful clerk and fails for a careless one', () => {
  const a = playPerfect(3, true); assert.ok(a.flags.ring_reunited); assert.ok(a.journal.some(j => j.text.includes('Mrs Elsie Whitlow')));
  const b = playPerfect(3, false); assert.ok(!b.flags.ring_reunited && b.flags.ring_lost, 'auctioned ring is lost');
});
t('perfect play ends gold; a clerk who HOLDs everything ends poor', () => {
  assert.strictEqual(playPerfect(8, true).ended, 'gold');
  const s = E.newRun({ seed: 8 }); while (!s.ended) { while (s.phase === 'counter') E.stamp(s, 'HOLD'); if (s.phase === 'auction') E.auction(s, []); E.endDay(s); if (s.phase === 'morning') E.nextDay(s); } assert.strictEqual(s.ended, 'poor');
});
t('escalation layers appear on schedule', () => {
  const seen = { form: 0, rival: 0, auction: 0, returned: 0 };
  for (let seed = 1; seed <= 40; seed++) { const s = E.newRun({ seed }); while (!s.ended) { while (s.phase === 'counter') { const c = E.current(s); if (c.form) { assert.ok(s.day >= 8); seen.form++; } if (c.rival) { assert.ok(s.day >= 15); seen.rival++; } if (c.correct.why.startsWith('Order 5')) { assert.ok(s.day >= 5); seen.returned++; } E.stamp(s, c.correct.action, c.correct.tag); } if (s.phase === 'auction') { assert.ok(s.day === 22 || s.day === 29); seen.auction++; E.auction(s, []); } E.endDay(s); if (s.phase === 'morning') E.nextDay(s); } }
  for (const k in seen) assert.ok(seen[k] > 20, k + ' ' + seen[k]);
});
t('wrong stamps cost reputation; the stool softens it', () => {
  const s = E.newRun({ seed: 2 }); const c = E.current(s); const before = s.rep; E.stamp(s, c.correct.action === 'FLAG' ? 'RETURN' : 'FLAG', E.shelf(s)[0].tag); assert.ok(s.rep < before);
  const u = E.newRun({ seed: 2 }); u.bought.stool = 1; const c2 = E.current(u); E.stamp(u, c2.correct.action === 'FLAG' ? 'RETURN' : 'FLAG', E.shelf(u)[0].tag); assert.ok(u.rep > s.rep);
});
t('upgrades: only in the morning, only with budget', () => { const s = E.newRun({ seed: 4 }); assert.ok(!E.buy(s, 'labels')); while (s.phase === 'counter') E.stamp(s, 'HOLD'); E.endDay(s); s.budget = 5; assert.ok(!E.buy(s, 'labels')); s.budget = 50; assert.ok(E.buy(s, 'labels')); assert.ok(!E.buy(s, 'labels')); assert.ok(!E.buy(s, 'nope')); });
t('sanitize survives garbage and round-trips a live season', () => {
  assert.strictEqual(E.sanitize(null), null); assert.strictEqual(E.sanitize(7), null); assert.strictEqual(E.sanitize({ day: 'x' }), null);
  const s = E.newRun({ seed: 9 }); for (let i = 0; i < 2; i++) { const c = E.current(s); E.stamp(s, c.correct.action, c.correct.tag); }
  const r = E.sanitize(JSON.parse(JSON.stringify(s))); assert.strictEqual(r.day, s.day); assert.strictEqual(r.idx, s.idx); assert.strictEqual(r.rep, s.rep); assert.strictEqual(r.warehouse.length, s.warehouse.length); assert.strictEqual(E.current(r).name, E.current(s).name); assert.deepStrictEqual(E.current(r).correct, E.current(s).correct);
  const junk = E.sanitize({ seed: 1, day: 99, phase: 'zzz', rep: -40, budget: 'lots', warehouse: [{ tag: 'A-01', type: 'nothing' }, { tag: 'A-02', type: 'hat', mark: 'x', foundDay: -3, status: 'eaten' }], log: [{ tag: 3 }], claimants: [{ claim: { type: 'cat' } }], results: 'no', flags: { a: 1 }, stats: { returns: 'ten' } });
  assert.ok(junk); assert.strictEqual(junk.day, D.SEASON_DAYS + 1); assert.strictEqual(junk.rep, 0); assert.strictEqual(junk.warehouse.length, 1); assert.strictEqual(junk.warehouse[0].status, 'shelf'); assert.strictEqual(junk.claimants.length, 0); assert.strictEqual(junk.stats.returns, 0);
});
t('every story entry is well-formed', () => { for (const st of D.STORY) { assert.ok(E.typeById[st.item.type], st.who || st.note); assert.ok(D.MARKS.includes(st.item.mark), st.item.mark); if (st.kind === 'claim') assert.ok(D.PROFILES[st.profile] && st.say && st.after, st.who); } });
console.log(process.exitCode ? 'SOME FAILED' : `ALL ${n} PASSED`);
