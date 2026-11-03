// Headless smoke test over file://: node tests/smoke.js [url]
const { chromium } = require('playwright'); const path = require('path');
const base = process.argv[2] || ('file://' + path.resolve(__dirname, '..', 'index.html'));
let failures = 0; const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; };
const T = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  const b = await chromium.launch(); const errs = [];
  const p = await b.newPage({ viewport: { width: 360, height: 640 }, hasTouch: true });
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
