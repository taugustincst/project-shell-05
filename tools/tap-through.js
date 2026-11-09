#!/usr/bin/env node
// Emulator tap-through: every screen and stamp of Lost Property Office, driven with
// real Android touch input (adb shell input), on a debug build of the Play
// edition. Play's 3 Nov 2026 review of Bubble Pop's first upload listed
// "Unresponsive UI elements, such as buttons or icons"; this test, built the
// same way as Bubble Pop's, fails unless each control visibly does its job
// when a finger taps it: a whole first day at the counter, the shop, the
// tabs, the free-week unlock sheet (the emulator has no Play Store, so it
// must say so and let the player carry on), Back, and a relaunch that
// resumes the season.
//
// The page's layout and state are read over WebView DevTools (enabled only in
// debuggable builds, see MainActivity), so every tap lands on the element's
// measured centre and every step is checked against the game's own state.
// Taps themselves never go through DevTools: they are real touches.
//
//   node tools/tap-through.js <debug-apk> [package]
// Screenshots and a log go to $TAP_THROUGH_OUT (default tap-through/).
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APK = process.argv[2];
const PKG = process.argv[3] || 'com.taugustincst.lostproperty';
const OUT = process.env.TAP_THROUGH_OUT || 'tap-through';
const PORT = 9333;
if (!APK) { console.error('usage: node tools/tap-through.js <debug-apk> [package]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const adb = (...a) => execFileSync('adb', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 << 20 }).trim();
let shotN = 0;
const shot = name => {
  const f = path.join(OUT, String(++shotN).padStart(2, '0') + '-' + name + '.png');
  try { fs.writeFileSync(f, execFileSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 })); } catch (e) { /* best effort */ }
};
let failures = 0;
const check = (name, ok, extra = '') => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
  if (!ok) failures++;
  return ok;
};
const fatal = msg => { console.log('FAIL ' + msg); finish(true); };

// ---------------------------------------------------------------- DevTools
let ws = null, msgId = 0;
const pending = new Map();
const pageErrors = [];
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('DevTools timeout: ' + method)); } }, 15000);
  });
}
async function js(expression) {
  const m = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (m.error) throw new Error('DevTools: ' + m.error.message);
  if (m.result.exceptionDetails) {
    const d = m.result.exceptionDetails;
    throw new Error('page: ' + ((d.exception && d.exception.description) || d.text));
  }
  return m.result.result.value;
}
async function connect() {
  for (let i = 0; i < 40; i++) {
    let pid = '';
    try { pid = adb('shell', 'pidof', PKG); } catch (e) { /* not up yet */ }
    if (pid) {
      try {
        adb('forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid.split(/\s+/)[0]}`);
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
        const page = list.find(t => t.type === 'page' && /appassets\.androidplatform\.net/.test(t.url));
        if (page) {
          ws = new WebSocket(page.webSocketDebuggerUrl);
          await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
          ws.onmessage = e => {
            const m = JSON.parse(e.data);
            if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
            if (m.method === 'Runtime.exceptionThrown') pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
          };
          await send('Runtime.enable');
          if (await js('!!(window.__lostproperty)')) return;
          ws.close(); ws = null;
        }
      } catch (e) { /* the page or its DevTools socket is not ready yet */ }
    }
    await sleep(1000);
  }
  fatal('could not reach the game page over WebView DevTools (is this a debug build?)');
}

// ----------------------------------------------------------------- geometry
let dpr = 1, offX = 0, offY = 0, screenW = 0, screenH = 0;
// Measure an element (scrolled into view programmatically if it sits in a
// scrolling panel) and make sure it is the topmost thing at its centre, so a
// tap there reaches it and nothing covers it.
async function measure(sel) {
  return js(`(function(){
    var el=document.querySelector(${JSON.stringify(sel)});
    if(!el) return {missing:true};
    el.scrollIntoView({block:'center',inline:'center'});
    var r=el.getBoundingClientRect();
    var cx=r.left+r.width/2, cy=r.top+r.height/2;
    var top=document.elementFromPoint(cx,cy);
    var visible=r.width>0&&r.height>0&&cx>=0&&cy>=0&&cx<=innerWidth&&cy<=innerHeight;
    return {cx:cx,cy:cy,w:r.width,h:r.height,visible:visible,onTop:!!top&&(top===el||el.contains(top))};
  })()`);
}
const toScreen = (cx, cy) => [Math.round(cx * dpr + offX), Math.round(cy * dpr + offY)];
// Wait for the layout to settle (the soft keyboard opening or closing
// resizes the page), so the tap lands where the element really is.
async function measureSettled(sel) {
  let m = await measure(sel);
  for (let i = 0; i < 12 && !m.missing; i++) {
    await sleep(250);
    const n = await measure(sel);
    if (n.missing || (Math.abs(n.cx - m.cx) < 1 && Math.abs(n.cy - m.cy) < 1)) return n;
    m = n;
  }
  return m;
}
async function tap(sel, label) {
  await sleep(150);
  const m = await measureSettled(sel);
  if (m.missing) return check(`${label}: on screen`, false, `${sel} not in the page`);
  if (!check(`${label}: visible and not covered`, m.visible && m.onTop, JSON.stringify(m))) return false;
  const [x, y] = toScreen(m.cx, m.cy);
  adb('shell', 'input', 'tap', String(x), String(y));
  return true;
}
async function longPress(sel, ms) {
  const m = await measureSettled(sel);
  const [x, y] = toScreen(m.cx, m.cy);
  adb('shell', 'input', 'swipe', String(x), String(y), String(x), String(y), String(ms));
}
async function waitFor(expr, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    let v = false;
    try { v = await js(expr); } catch (e) { /* page busy */ }
    if (v) return true;
    if (Date.now() > end) return false;
    await sleep(150);
  }
}
const hidden = id => `document.getElementById(${JSON.stringify(id)}).hidden`;
const shown = id => `!document.getElementById(${JSON.stringify(id)}).hidden`;
function alive() { try { return adb('shell', 'pidof', PKG) !== ''; } catch (e) { return false; } }

// -------------------------------------------------------------------- run
let finished = false;
function finish(stop) {
  if (finished) return; finished = true;
  try { fs.writeFileSync(path.join(OUT, 'logcat.txt'), adb('logcat', '-d')); } catch (e) { /* best effort */ }
  if (stop) failures = failures || 1;
  console.log(failures ? `tap-through: ${failures} FAILED` : 'tap-through: every screen and stamp responded');
  try { if (ws) ws.close(); } catch (e) { /* closing */ }
  process.exit(failures ? 1 : 0);
}
const K = 'window.__lostproperty';
const day = () => js(`${K}.state.day`);

(async () => {
  adb('wait-for-device');
  adb('install', '-r', APK);
  try { adb('shell', 'pm', 'clear', PKG); } catch (e) { /* fresh install */ }
  adb('logcat', '-c');
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  [screenW, screenH] = adb('shell', 'wm', 'size').match(/(\d+)x(\d+)\s*$/).slice(1).map(Number);
  dpr = await js('devicePixelRatio');
  await sleep(1500);
  shot('first-run');

  // 1. The first morning's help sheet.
  check('first run shows the first-day help', await waitFor(shown('modal-help')));
  // Calibrate: tap the help sheet's heading (no handler) and read back where
  // the touch landed in the page.
  await js(`window.__tt=[];addEventListener('pointerdown',function(e){__tt.push([e.clientX,e.clientY])},true);1`);
  {
    const m = await measure('#modal-help h2');
    const sx = Math.round(m.cx * dpr), sy = Math.round(m.cy * dpr);
    adb('shell', 'input', 'tap', String(sx), String(sy));
    if (!(await waitFor('__tt.length>0'))) fatal('a tap on the screen never reached the page (touch input is not getting through)');
    const [px, py] = await js('__tt[__tt.length-1]');
    offX = sx - px * dpr; offY = sy - py * dpr;
    console.log(`geometry: screen ${screenW}x${screenH}, devicePixelRatio ${dpr}, page offset ${offX.toFixed(1)},${offY.toFixed(1)}`);
    check('touch reaches the page where it was aimed', Math.abs(offX) < screenW && Math.abs(offY) < screenH);
  }
  await tap('#btn-help', 'Help sheet button');
  check('the help sheet closes', await waitFor(hidden('modal-help')));
  check('day 1 has a claimant at the counter', await waitFor(`${K}.E.current(${K}.state)!==null`));
  shot('counter');

  // 2. Header tools: large text and sound toggle with a tap and back.
  for (const [id, label] of [['btn-large', 'Large text'], ['btn-sound', 'Sound']]) {
    const was = await js(`document.getElementById('${id}').getAttribute('aria-pressed')`);
    await tap('#' + id, label);
    const flipped = await waitFor(`document.getElementById('${id}').getAttribute('aria-pressed')!==${JSON.stringify(was)}`);
    await tap('#' + id, label + ' again');
    check(`${label} toggles on a tap and back`, flipped && await waitFor(`document.getElementById('${id}').getAttribute('aria-pressed')===${JSON.stringify(was)}`));
  }

  // 3. The tabs.
  for (const t of ['log', 'orders', 'journal', 'shelves']) {
    await tap(`.tab[data-tab="${t}"]`, `${t} tab`);
    check(`the ${t} tab opens`, await waitFor(`document.querySelector('.tab[data-tab="${t}"]').classList.contains('active')`));
  }

  // 4. A whole first day at the counter with real taps: pick the object,
  // stamp, read the result, next.
  let served = 0, right = 0, wrongOnPurpose = false;
  while (served < 12 && await js(`!!${K}.E.current(${K}.state)`)) {
    const c = await js(`${K}.correct()`);
    let stamp = c.action;
    // One deliberate wrong stamp, to see the explanation.
    if (served === 1 && !wrongOnPurpose) { stamp = c.action === 'FLAG' ? 'HOLD' : 'FLAG'; wrongOnPurpose = true; }
    if (stamp === 'RETURN') {
      await tap(`.item[data-tag="${c.tag}"]`, `Object ${c.tag}`);
      check(`tapping ${c.tag} selects it`, await waitFor(`!!document.querySelector('.item.selected[data-tag="${c.tag}"]')`));
    }
    await tap(`#st-${stamp.toLowerCase()}`, `${stamp} stamp`);
    if (!check(`the ${stamp} stamp answers`, await waitFor(shown('modal-result')))) break;
    const title = await js(`document.getElementById('r-title').textContent`);
    if (stamp === c.action) { if (title === 'Correct') right++; }
    else check('a wrong stamp explains the right one', (await js(`document.getElementById('r-why').textContent`)).includes('The right stamp was'));
    if (served === 0) shot('result');
    await tap('#r-next', 'Next claimant');
    await waitFor(hidden('modal-result'));
    served++;
  }
  check('every correct stamp was marked correct', right === served - 1, `${right} of ${served - 1}`);

  // 5. The ledger and the morning shop.
  check('the day ends in a ledger', await waitFor(shown('modal-ledger')));
  shot('ledger');
  await tap('#btn-ledger', 'Ledger button');
  check('the morning opens', await waitFor(shown('modal-morning')));
  await js(`${K}.state.budget=100;${K}.render();1`);
  await tap('[data-up="labels"]', 'Buy shelf labels');
  check('buying shelf labels', await waitFor(`${K}.state.bought.labels===1`));
  shot('morning');
  await tap('#btn-open', 'Open the counter');
  check('day 2 opens', await waitFor(`${K}.state.day===2&&${hidden('modal-morning')}`));

  // 6. The free week ends: day 8 asks for the unlock. This emulator has no
  // Play Store, so the sheet must say Google Play is unavailable, keep its
  // buttons working, and let the player go back.
  await js(`(function(){var k=${K};k.seedDay(7,5);while(k.E.current(k.state)){k.auto();k.closeModals();}k.render();})();1`);
  check('day 7 ends in a ledger', await waitFor(shown('modal-ledger')));
  await tap('#btn-ledger', 'Ledger button (day 7)');
  check('the morning before day 8 opens', await waitFor(shown('modal-morning')));
  await tap('#btn-open', 'Open the counter (day 8)');
  check('day 8 asks for the unlock before it opens', await waitFor(shown('modal-unlock')) && (await day()) === 7 && await js(`${K}.state.phase==='morning'`));
  check('the app has the Play billing bridge', await js('!!window.AndroidBilling'));
  check('without a Play Store the sheet says so', await waitFor(`!document.getElementById('u-note').hidden&&document.getElementById('u-note').textContent.length>10`, 8000), await js(`document.getElementById('u-note').textContent`));
  shot('unlock');
  if (await js(`!document.getElementById('u-buy').disabled`)) {
    await tap('#u-buy', 'Unlock button');
    check('the unlock button answers and is not left waiting', await waitFor(`!${K}.billing.state.busy&&!document.getElementById('u-note').hidden`, 10000));
    check('nothing unlocked without Play', await js(`!${K}.billing.state.owned&&${shown('modal-unlock')}`));
  }
  if (await js(`!document.getElementById('u-restore').disabled`)) {
    await tap('#u-restore', 'Restore purchase');
    check('Restore answers and is not left waiting', await waitFor(`!${K}.billing.state.busy`, 10000));
  }
  await tap('#u-later', 'Not now');
  check('Not now goes back to the morning', await waitFor(`${hidden('modal-unlock')}&&${shown('modal-morning')}`));
  shot('morning-after-unlock');

  // 7. Back leaves the app without a crash, and the season resumes on relaunch.
  await js(`${K}.save();1`);
  adb('shell', 'input', 'keyevent', '4');
  await sleep(1500);
  const log1 = adb('logcat', '-d');
  check('Back leaves without a crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log1));
  try { ws.close(); } catch (e) { /* reconnecting */ } ws = null;
  adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
  await connect();
  await sleep(1000);
  check('the season resumes on relaunch', await waitFor(`${K}.state.day===7&&${K}.state.phase==='morning'`), `day ${await day()}`);
  shot('relaunch');

  // Wrap-up: no crash, no ANR, no page errors.
  const log = adb('logcat', '-d');
  check('no crash', !new RegExp(`FATAL EXCEPTION[\\s\\S]{0,200}Process: ${PKG.replace(/\./g, '\\.')}`).test(log));
  check(`no "app not responding"`, !log.includes(`ANR in ${PKG}`));
  check('no errors in the page', pageErrors.length === 0, pageErrors.join(' | '));
  check('the app is still running', alive());
  finish(false);
})().catch(e => { console.log('FAIL tap-through stopped: ' + (e && e.stack || e)); finish(true); });
