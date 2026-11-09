// Headless smoke test over file://: node tests/smoke.js [url]
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn, a) => p.evaluate(fn, a);
// A stand-in for the Play app's billing bridge (android/play/.../PlayBilling.java). owned: what Play says at start.
const fakePlay = owned => () => {
  const say = m => setTimeout(() => window.__billingEvent(JSON.stringify(m)), 30);
  window.__buys = 0;
  window.AndroidBilling = {
    // Play remembers a purchase across launches, as the real store does.
    start(id) { say({ type: 'ready', product: id }); say({ type: 'price', product: id, price: '$2.99' }); say({ type: 'owned', product: id, owned: window.__ownedAtStart || localStorage.getItem('fakeplay.bought') === '1' }); },
    buy(id) { window.__buys++; localStorage.setItem('fakeplay.bought', '1'); say({ type: 'purchased', product: id }); },
    restore(id) { say({ type: 'owned', product: id, owned: true }); }
  };
  window.__ownedAtStart = owned;
};
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
  await p.addInitScript(`(${fakePlay(true).toString()})()`.replace('window.__ownedAtStart = owned', 'window.__ownedAtStart = true'));
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); }); p.on('dialog', d => d.accept());
  await p.goto(base); await p.waitForSelector('#app:not([hidden])');
  check('first-day help appears', await p.isVisible('#modal-help')); await p.click('#btn-help');
  check('day 1 has a claimant at the counter', (await p.textContent('#c-queue')).includes('1 of'));
  await T(p, () => window.__lostproperty.seedDay(1, 3));
  // find the correct object and stamp through the UI
  const right = await T(p, () => window.__lostproperty.correct());
  if (right.action === 'RETURN') { await p.click(`.item[data-tag="${right.tag}"]`); check('tapping an object selects it and reveals its mark', await p.isVisible('.item.selected .mark b')); await p.click('#st-return'); }
  else await p.click(right.action === 'HOLD' ? '#st-hold' : '#st-flag');
  await p.waitForSelector('#modal-result:not([hidden])');
  check('a correct stamp is marked correct', (await p.textContent('#r-title')) === 'Correct'); await p.click('#r-next');
  // a wrong stamp
  const r2 = await T(p, () => window.__lostproperty.correct());
  await p.click(r2.action === 'FLAG' ? '#st-hold' : '#st-flag'); await p.waitForSelector('#modal-result:not([hidden])');
  check('a wrong stamp explains the right one', (await p.textContent('#r-why')).includes('The right stamp was')); await p.click('#r-next');
  // finish the day through the test API, then the ledger and the morning shop
  await T(p, () => { const K = window.__lostproperty; while (K.E.current(K.state)) { K.auto(); K.closeModals(); } K.render(); });
  await p.waitForSelector('#modal-ledger:not([hidden])'); check('the day ends in a ledger', (await p.locator('.lrow').count()) >= 2); await p.click('#btn-ledger');
  await p.waitForSelector('#modal-morning:not([hidden])'); check('the morning offers the shop', (await p.locator('.shop').count()) === 8);
  await T(p, () => { window.__lostproperty.state.budget = 100; window.__lostproperty.render(); }); await p.click('[data-up="labels"]'); check('buying shelf labels', await T(p, () => window.__lostproperty.state.bought.labels === 1));
  await p.click('#btn-open'); check('day 2 opens', (await p.textContent('#hdr-day')).startsWith('Day 2'));
  check('the type filter appears after buying labels', await p.isVisible('#filter-type'));
  // the log and orders tabs render
  await p.click('.tab[data-tab="log"]'); check('the log lists entries', (await p.locator('#log li').count()) > 3);
  await p.click('.tab[data-tab="orders"]'); check('standing orders are posted', (await p.locator('.order').count()) === 3);
  // save and reload
  const before = await T(p, () => { const K = window.__lostproperty; K.save(); return K.state.day + ':' + K.state.idx + ':' + K.state.warehouse.length; });
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  check('the season reloads where it was', before === await T(p, () => { const K = window.__lostproperty; return K.state.day + ':' + K.state.idx + ':' + K.state.warehouse.length; }));
  // auction day with a story item, and the ending
  await T(p, () => { const K = window.__lostproperty; K.seedDay(22, 3); K.state.warehouse.push({ tag: 'Z-99', type: 'ring', colour: 'gold', material: 'gold', mark: 'a wedding-day date engraved inside', foundDay: 6, line: 1, where: 3, status: 'shelf', story: 'x', keep: true, note: 'Found behind a mirror.' }); K.state.log.push({ tag: 'Z-99', foundDay: 6, line: 1, where: 3, type: 'ring', colour: 'gold', material: 'gold', mark: 'a wedding-day date engraved inside', status: 'SHELF' }); while (K.E.current(K.state)) { K.auto(); K.closeModals(); } K.render(); });
  await p.waitForSelector('#modal-auction:not([hidden])'); check('Thursday brings the auction with a warning on the ring', (await p.locator('.lot .warn').count()) >= 1);
  await p.check('.lot input[data-tag="Z-99"]'); await p.click('#btn-auction'); check('a withheld lot stays on the shelf', await T(p, () => window.__lostproperty.state.warehouse.find(i => i.tag === 'Z-99').status === 'shelf'));
  await T(p, () => { const K = window.__lostproperty; K.seedDay(30, 3); while (K.E.current(K.state)) { K.auto(); K.closeModals(); } K.render(); }); await p.click('#btn-ledger');
  await p.waitForSelector('#modal-ending:not([hidden])'); check('day 30 ends the season', (await p.textContent('#e-title')).length > 3);
  await p.click('#btn-again'); check('a new season starts on day 1', (await p.textContent('#hdr-day')).startsWith('Day 1 '));
  // the free week and the one-time unlock
  const fresh = async (init, save) => { const ctx = await b.newContext({ viewport: { width: 360, height: 640 }, hasTouch: true }); const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message)); q.on('dialog', d => d.accept()); await q.addInitScript(() => { try { if (!sessionStorage.getItem('cleared')) { sessionStorage.setItem('cleared', '1'); localStorage.clear(); } } catch (e) { } }); if (init) await q.addInitScript(init); if (save) await q.addInitScript(sv => { try { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('lostproperty.v1', sv); } } catch (e) { } }, save); await q.goto(base); await q.waitForSelector('#app:not([hidden])'); return { ctx, q }; };
  const toMorningAfter = async (q, day) => { await T(q, d => { const K = window.__lostproperty; K.seedDay(d, 5); while (K.E.current(K.state)) { K.auto(); K.closeModals(); } K.render(); }, day); await q.click('#btn-ledger'); await q.waitForSelector('#modal-morning:not([hidden])'); };
  {
    const { ctx, q } = await fresh(null);
    await toMorningAfter(q, 6); { const shop = await q.textContent('#shop'); check('the morning counts the free week', shop.includes('Free week: day 7 of 7'), shop.slice(0, 80) + ' ' + JSON.stringify(await T(q, () => window.__lostproperty.billing.state))); }
    await q.click('#btn-open'); check('day 7 is still free', (await q.textContent('#hdr-day')).startsWith('Day 7') && await q.isHidden('#modal-unlock'));
    await toMorningAfter(q, 7);
    await q.click('#btn-open'); await q.waitForSelector('#modal-unlock:not([hidden])');
    check('day 8 asks for the unlock', (await q.textContent('#hdr-day')).startsWith('Day 7'));
    check('outside the Play app the unlock says where to get it', await q.isDisabled('#u-buy') && (await q.textContent('#u-note')).includes('Google Play edition'));
    await q.click('#u-later'); check('Not now goes back to the morning', await q.isVisible('#modal-morning') && await q.isHidden('#modal-unlock'));
    await ctx.close();
  }
  {
    const { ctx, q } = await fresh(`(${fakePlay(false).toString()})()`.replace('window.__ownedAtStart = owned', 'window.__ownedAtStart = false'));
    await toMorningAfter(q, 7); await q.click('#btn-open'); await q.waitForSelector('#modal-unlock:not([hidden])');
    check('the unlock shows Play\'s price', (await q.textContent('#u-buy')).includes('$2.99'));
    await q.tap('#u-buy'); await q.waitForSelector('#modal-unlock', { state: 'hidden' });
    check('buying opens day 8 at once', (await q.textContent('#hdr-day')).startsWith('Day 8') && await T(q, () => window.__buys === 1));
    await q.reload(); await q.waitForSelector('#app:not([hidden])'); await q.waitForTimeout(200);
    check('the unlock survives a reload', await q.isHidden('#modal-unlock') && (await q.textContent('#hdr-day')).startsWith('Day 8'));
    await ctx.close();
  }
  {
    const day12 = JSON.stringify({ v: 1, run: (() => { const E = require('../js/engine.js'); return E.newRun({ seed: 9, skipTo: 12 }); })(), meta: {}, settings: { helped: true } });
    const { ctx, q } = await fresh(`(${fakePlay(false).toString()})()`.replace('window.__ownedAtStart = owned', 'window.__ownedAtStart = false'), day12);
    await q.waitForSelector('#modal-unlock:not([hidden])'); check('a locked day-12 season asks for the unlock', (await q.textContent('#u-later')) === 'Start a new season');
    await q.click('#u-restore'); await q.waitForSelector('#modal-unlock', { state: 'hidden' });
    check('Restore purchase unlocks it where it was', (await q.textContent('#hdr-day')).startsWith('Day 12'));
    await ctx.close();
  }
  // corrupt saves are fail-soft
  for (const [label, junk] of [['truncated JSON', '{"run":{"day":"zzz"'], ['wrong types', '{"v":1,"run":{"seed":1,"day":99,"warehouse":"no","log":[],"claimants":[]},"meta":{"seasons":"x"}}'], ['not an object', '42']]) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 640 } }); const q = await ctx.newPage(); const qerrs = []; q.on('pageerror', e => qerrs.push(e.message));
    await q.addInitScript(j => { try { localStorage.setItem('lostproperty.v1', j); } catch (e) { } }, junk);
    await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    check('a mangled save still loads: ' + label, qerrs.length === 0 && await T(q, () => { const s = window.__lostproperty.state; return s.day >= 1 && s.day <= 31 && isFinite(s.rep); }), qerrs.join(' | '));
    await ctx.close();
  }
  check('no page errors, console errors or failed requests', errs.length === 0, errs.join(' | '));
  await b.close(); console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
})();
