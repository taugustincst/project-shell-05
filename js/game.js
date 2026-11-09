/* Lost Property Office — UI, save, flow. The rules live in engine.js. */
(function () {
'use strict';
const E = window.LPO, D = E.D;
const VERSION = '1.1.0', SAVE_KEY = 'lostproperty.v1', BACKUP_KEY = 'lostproperty.v1.backup';
// The first week is free; the rest of the season is one Google Play purchase (js/billing.js).
const BILL = window.createBilling({ storageKey: 'lostproperty.unlock', productId: 'full_unlock' });
let unlockReason = null;
const $ = id => document.getElementById(id);
let S = null, profile = null, selectedTag = null, activeTab = 'shelves', shownResult = false;

/* ---------- save ---------- */
function freshMeta() { return { seasons: 0, best: 0, rings: 0 }; }
function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { try { localStorage.setItem(BACKUP_KEY, localStorage.getItem(SAVE_KEY) || ''); } catch (e2) { } }
  const m = raw && raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  const n = (v, lo, hi) => { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo; };
  profile = { meta: { seasons: Math.round(n(m.seasons, 0, 1e6)), best: Math.round(n(m.best, 0, 1e7)), rings: Math.round(n(m.rings, 0, 1e6)) }, settings: { large: !!(raw && raw.settings && raw.settings.large === true), helped: !!(raw && raw.settings && raw.settings.helped === true), quiet: !!(raw && raw.settings && raw.settings.quiet === true) } };
  S = raw && raw.run ? E.sanitize(raw.run) : null;
  if (!S) S = E.newRun({});
}
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, run: S, meta: profile.meta, settings: profile.settings })); } catch (e) { } }

/* ---------- helpers ---------- */
const T = id => E.typeById[id] || { name: id, icon: '?', a: 'a' };
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const dayName = d => `Day ${d}`;
let toastTimer = 0; function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); }
function show(id) { $(id).hidden = false; } function hide(id) { $(id).hidden = true; }

/* ---------- the stamp's thunk ---------- */
let audio = null;
function thunk(ok) {
  try { if (navigator.vibrate) navigator.vibrate(ok ? 18 : [18, 40, 18]); } catch (e) { }
  if (profile.settings.quiet) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)(); const a = audio, t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(ok ? 150 : 110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.18);
    const n = a.createBufferSource(), b = a.createBuffer(1, Math.floor(a.sampleRate * 0.05), a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const ng = a.createGain(); ng.gain.value = 0.18; n.buffer = b; n.connect(ng).connect(a.destination); n.start(t);
  } catch (e) { /* no sound on this device */ }
}

/* ---------- the unlock ---------- */
const owned = () => BILL.state.owned;
const lockedNow = () => S.day > D.FREE_DAYS && !owned() && S.phase !== 'done';
function showUnlock(reason) { unlockReason = reason; renderUnlock(); show('modal-unlock'); }
function renderUnlock() {
  const b = BILL.state, note = $('u-note');
  $('u-date').textContent = unlockReason === 'blocked' ? dayName(S.day) : 'End of the first week';
  $('u-later').textContent = unlockReason === 'blocked' ? 'Start a new season' : 'Not now';
  let msg = '';
  if (!b.available) msg = 'The full season is unlocked in the Google Play edition of the game.';
  else if (b.pending) msg = 'Your purchase is waiting for the payment to clear. The season unlocks as soon as Google Play confirms it.';
  else if (b.error) msg = b.error;
  else if (b.busy) msg = 'Waiting for Google Play…';
  note.hidden = !msg; note.textContent = msg;
  $('u-buy').textContent = b.price ? `Unlock the full season · ${b.price}` : 'Unlock the full season';
  $('u-buy').disabled = !b.available || b.busy || b.pending; $('u-restore').disabled = !b.available || b.busy;
}
function unlocked() {
  if ($('modal-unlock').hidden) return;
  hide('modal-unlock'); toast('The full season is yours. Thank you.');
  if (unlockReason === 'morning' && S.phase === 'morning') openCounter();
  else render();
  unlockReason = null;
}

/* ---------- render ---------- */
function render() {
  $('hdr-day').textContent = `${dayName(S.day)} of ${D.SEASON_DAYS}`;
  $('hdr-rep').textContent = Math.round(S.rep); $('hdr-budget').textContent = '£' + Math.round(S.budget);
  $('btn-large').setAttribute('aria-pressed', String(profile.settings.large)); $('btn-sound').setAttribute('aria-pressed', String(!profile.settings.quiet));
  if (lockedNow()) { if ($('modal-unlock').hidden) showUnlock('blocked'); return; }
  const c = E.current(S);
  if (c) {
    $('c-name').textContent = c.name; $('c-queue').textContent = `${S.idx + 1} of ${S.claimants.length} at the counter`;
    $('c-say').textContent = c.say;
    $('c-form').hidden = !c.form; if (c.form) $('c-form-body').textContent = `Article: ${T(c.form.type).name}   Colour: ${c.form.colour}   Policy: LP-${(S.day * 37 + S.idx * 11) % 9000 + 1000}`;
    $('c-rival').hidden = !c.rival; if (c.rival) $('c-rival').textContent = `${c.rival} is also in the queue for what sounds like the same article.`;
  } else { $('c-name').textContent = S.phase === 'done' ? 'Season over' : 'The counter is closed'; $('c-queue').textContent = ''; $('c-say').textContent = ''; $('c-form').hidden = true; $('c-rival').hidden = true; }
  $('stampbar').hidden = !c;
  $('st-return').disabled = !selectedTag;
  $('sel-text').textContent = selectedTag ? `Returning ${selectedTag} · tap RETURN to stamp` : 'Select an object on the shelves to return it.';
  $('filter-type').hidden = !E.has(S, 'labels'); $('search-shelf').hidden = !E.has(S, 'cards'); $('search-log').hidden = !E.has(S, 'cards'); $('phone-wrap').hidden = !E.has(S, 'telephone');
  renderShelves(); renderLog(); renderOrders(); renderJournal();
  // flow
  if (S.phase === 'auction') renderAuction();
  else if (S.phase === 'ledger') renderLedger();
  else if (S.phase === 'morning') renderMorning();
  else if (S.phase === 'done') renderEnding();
}
function renderShelves() {
  const box = $('shelves'); box.innerHTML = '';
  const ft = $('filter-type').value, q = ($('search-shelf').value || '').toLowerCase();
  const sel = $('filter-type'); if (sel.options.length === 1) { for (const t of D.TYPES.concat(D.PROHIBITED).sort((a, b) => a.name.localeCompare(b.name))) { const o = document.createElement('option'); o.value = t.id; o.textContent = cap1(t.name); sel.appendChild(o); } }
  let items = E.shelf(S).slice().sort((a, b) => b.foundDay - a.foundDay || a.tag.localeCompare(b.tag));
  if (ft) items = items.filter(i => i.type === ft); if (q) items = items.filter(i => (i.mark + ' ' + T(i.type).name + ' ' + i.colour + ' ' + i.material).toLowerCase().includes(q));
  if (!items.length) { box.innerHTML = '<div class="empty">Nothing on the shelves fits that.</div>'; return; }
  const lamp = E.has(S, 'lamp');
  for (const i of items) {
    const el = document.createElement('div'); el.className = 'item' + (selectedTag === i.tag ? ' selected' : '') + (i.open ? ' open' : ''); el.dataset.tag = i.tag;
    el.innerHTML = `<div class="icon"></div><div class="name"></div><div class="tag"></div><div class="traits"></div><div class="mark"></div>${i.note ? '<div class="story"></div>' : ''}`;
    el.querySelector('.icon').textContent = T(i.type).icon; el.querySelector('.name').textContent = cap1(T(i.type).name) + (i.custom ? ` (${i.custom})` : ''); el.querySelector('.tag').textContent = i.tag + (E.isProhibited(S, i.type) ? ' · PROHIBITED' : '');
    el.querySelector('.traits').textContent = `${i.colour} · ${i.material} · found ${dayName(i.foundDay)}, ${D.LINES[i.line]}`;
    const showMark = lamp || i.open || selectedTag === i.tag; el.querySelector('.mark').innerHTML = showMark ? 'Mark: <b></b>' : '<span class="muted">Tap to read the tag</span>'; if (showMark) el.querySelector('.mark b').textContent = i.mark;
    if (i.note) el.querySelector('.story').textContent = i.note;
    el.addEventListener('click', () => { i.open = true; selectedTag = selectedTag === i.tag ? null : i.tag; render(); });
    box.appendChild(el);
  }
}
function renderLog() {
  const ol = $('log'); ol.innerHTML = ''; const q = ($('search-log').value || '').toLowerCase(); const c = E.current(S); const phone = E.has(S, 'telephone') && $('phone-filter').checked && c;
  let rows = E.visibleLog(S).slice().reverse();
  if (q) rows = rows.filter(e => (e.mark + ' ' + T(e.type).name + ' ' + e.colour + ' ' + e.material + ' ' + e.tag).toLowerCase().includes(q));
  if (phone) rows = rows.filter(e => e.line === c.claim.line);
  for (const e of rows) {
    const li = document.createElement('li'); li.className = (e.status !== 'SHELF' ? 'returned' : '') + (c && c.claim.type === e.type && c.claim.mark === e.mark ? ' hl' : '');
    li.innerHTML = `<div class="lt"></div><div class="ll"></div><div class="ls"></div><div class="lm"></div>`;
    li.querySelector('.lt').textContent = e.tag; li.querySelector('.ll').textContent = `found ${dayName(e.foundDay)} · ${D.LINES[e.line]} · ${D.CARRIAGE[e.where]}`;
    li.querySelector('.ls').textContent = e.status + (e.closedDay ? ' ' + dayName(e.closedDay) : ''); li.querySelector('.lm').textContent = `${e.colour} ${e.material} ${T(e.type).name} — ${e.mark}`;
    ol.appendChild(li);
  }
  if (!rows.length) ol.innerHTML = '<li class="empty">No entries.</li>';
}
function renderOrders() {
  const box = $('orders'); box.innerHTML = '';
  for (const o of E.ordersFor(S.day)) { const d = document.createElement('div'); d.className = 'order'; d.innerHTML = '<h3></h3><p></p>'; d.querySelector('h3').textContent = o.title; d.querySelector('p').textContent = o.text; box.appendChild(d); }
  const p = document.createElement('div'); p.className = 'prohib'; p.textContent = 'Prohibited articles (posted at the counter): ' + E.prohibitedFor(S.day).map(x => x.name).join('; ') + '.'; box.appendChild(p);
}
function renderJournal() {
  const ol = $('journal'); ol.innerHTML = '';
  for (const j of S.journal.slice().reverse().slice(0, 120)) { const li = document.createElement('li'); li.innerHTML = '<div class="jd"></div><div></div>'; li.querySelector('.jd').textContent = dayName(j.day); li.lastElementChild.textContent = j.text; ol.appendChild(li); }
  if (!S.journal.length) ol.innerHTML = '<li class="empty">The season has not started.</li>';
}
function renderResult(r) {
  $('r-mark').textContent = r.action; $('r-mark').className = 'stamp-mark ' + (r.ok ? 'ok' : 'bad');
  $('r-title').textContent = r.ok ? 'Correct' : (r.right.action === r.action ? 'Wrong object' : 'That was not the right stamp');
  $('r-text').textContent = r.text; $('r-why').textContent = r.ok ? '' : `The right stamp was ${r.right.action}${r.right.tag ? ' (' + r.right.tag + ')' : ''}. ${r.right.why}`;
  show('modal-result');
}
function renderAuction() {
  const box = $('auction-lots'); box.innerHTML = '';
  const lots = E.auctionLots(S);
  if (!lots.length) box.innerHTML = '<div class="empty">Nothing has waited long enough. The auctioneer goes home.</div>';
  for (const i of lots) { const d = document.createElement('div'); d.className = 'lot'; d.innerHTML = `<input type="checkbox" data-tag="${i.tag}"><div><b></b><div class="muted"></div>${i.note || i.keep ? '<div class="warn">The log has a note on this one. Are you sure?</div>' : ''}</div>`; d.querySelector('b').textContent = `${i.tag} · ${cap1(T(i.type).name)}`; d.querySelector('.muted').textContent = `${i.colour} ${i.material} · ${i.mark} · found ${dayName(i.foundDay)}`; if (i.keep) d.querySelector('input').checked = false; box.appendChild(d); }
  show('modal-auction');
}
function renderLedger() {
  $('l-date').textContent = dayName(S.day); const rows = $('l-rows'); rows.innerHTML = '';
  for (const r of S.results) { const d = document.createElement('div'); d.className = 'lrow'; d.innerHTML = `<span></span><span class="${r.ok ? 'ok' : 'bad'}"></span><span></span>`; d.children[0].textContent = r.name; d.children[1].textContent = r.action + (r.ok ? ' ✓' : ' ✗'); d.children[2].textContent = `${r.dRep >= 0 ? '+' : ''}${r.dRep} rep · ${r.dBudget >= 0 ? '+' : ''}£${r.dBudget}`; rows.appendChild(d); }
  const right = S.results.filter(r => r.ok).length;
  $('l-sum').textContent = `${right} of ${S.results.length} right. Reputation ${Math.round(S.rep)}, budget £${Math.round(S.budget)}.` + (E.has(S, 'kettle') ? ' The tea round counts for one more.' : '');
  show('modal-ledger');
}
function renderMorning() {
  $('m-date').textContent = dayName(S.day + 1);
  const next = S.day + 1; const newOrders = D.ORDERS.filter(o => o.day === next); const newProh = D.PROHIBITED.filter(p => p.day === next);
  const newUps = D.UPGRADES.filter(u => u.from === next);
  $('m-news').textContent = (newUps.length ? `New in the catalogue: ${newUps.map(u => u.name).join(', ')}. ` : '') + (newOrders.length ? `New standing order posted: ${newOrders.map(o => o.title).join('; ')}. ` : '') + (newProh.length ? `Added to the prohibited list: ${newProh.map(p => p.name).join(', ')}. ` : '') + (next === 22 || next === 29 ? 'Thursday: auction day. ' : '') || 'A quiet morning. The kettle, if you have one, is on.';
  const box = $('shop'); box.innerHTML = '';
  if (!owned() && next <= D.FREE_DAYS) { const fw = document.createElement('div'); fw.className = 'freeweek'; fw.textContent = `Free week: day ${next} of ${D.FREE_DAYS}. The rest of the season is one purchase.`; box.appendChild(fw); }
  for (const u of D.UPGRADES) { if (!E.upgradeOpen(S, u)) continue; const d = document.createElement('div'); d.className = 'shop' + (S.bought[u.id] ? ' owned' : ''); d.innerHTML = `<b></b><button class="btn" data-up="${u.id}"></button><div class="d"></div>`; d.querySelector('b').textContent = u.name; d.querySelector('.d').textContent = u.desc; const b = d.querySelector('button'); b.textContent = S.bought[u.id] ? 'Owned' : '£' + u.cost; b.disabled = !!S.bought[u.id] || S.budget < u.cost; box.appendChild(d); }
  show('modal-morning');
}
function renderEnding() {
  const en = D.ENDINGS[S.ended]; $('e-title').textContent = en.title; $('e-text').textContent = en.text + (S.flags.ring_reunited ? ' The ring went home.' : S.flags.ring_lost ? ' The ring did not go home. It should have.' : '');
  const st = S.stats; $('e-stats').innerHTML = [['returns', st.returns], ['wrong returns', st.wrongReturns], ['holds', st.holds], ['frauds flagged', st.flags], ['honest people flagged', st.wrongFlags], ['reputation', Math.round(S.rep)], ['accuracy', Math.round(E.accuracy(S) * 100) + '%'], ['score', E.score(S)], ['best score', profile.meta.best]].map(p => `<div class="stat"><b>${p[1]}</b><span>${p[0]}</span></div>`).join('');
  show('modal-ending');
}

/* ---------- flow ---------- */
function doStamp(action) {
  const c = E.current(S); if (!c) return;
  if (action === 'RETURN' && !selectedTag) return;
  const r = E.stamp(S, action, action === 'RETURN' ? selectedTag : null); selectedTag = null; save(); thunk(r.ok); renderResult(r);
}
function openCounter() { hide('modal-morning'); E.nextDay(S); selectedTag = null; save(); setTab('shelves'); render(); }
function setTab(t) { activeTab = t; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + t)); }
function finishSeason() { if (!S.flags.counted) { S.flags.counted = true; profile.meta.seasons++; profile.meta.best = Math.max(profile.meta.best, E.score(S)); if (S.flags.ring_reunited) profile.meta.rings++; save(); } }

function init() {
  load(); document.documentElement.classList.toggle('large', profile.settings.large);
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  $('st-return').addEventListener('click', () => doStamp('RETURN')); $('st-hold').addEventListener('click', () => doStamp('HOLD')); $('st-flag').addEventListener('click', () => doStamp('FLAG'));
  $('r-next').addEventListener('click', () => { hide('modal-result'); render(); });
  $('btn-auction').addEventListener('click', () => { const keep = Array.from(document.querySelectorAll('#auction-lots input:checked')).map(i => i.dataset.tag); const r = E.auction(S, keep); hide('modal-auction'); if (r && r.lost.length) toast('Something went under the hammer that the log had a note on.'); save(); render(); });
  $('btn-ledger').addEventListener('click', () => { hide('modal-ledger'); E.endDay(S); if (S.ended) finishSeason(); save(); render(); });
  $('btn-open').addEventListener('click', () => { if (S.day + 1 > D.FREE_DAYS && !owned()) { hide('modal-morning'); showUnlock('morning'); return; } openCounter(); });
  $('u-buy').addEventListener('click', () => { BILL.buy(); renderUnlock(); });
  $('u-restore').addEventListener('click', () => { BILL.restore(); renderUnlock(); });
  $('u-later').addEventListener('click', () => {
    if (unlockReason === 'blocked') { if (!confirm('Start a new season from day 1? This season will be lost.')) return; hide('modal-unlock'); S = E.newRun({}); selectedTag = null; save(); unlockReason = null; render(); return; }
    hide('modal-unlock'); unlockReason = null; render();
  });
  BILL.onChange(st => { if (st.owned) unlocked(); else if (!$('modal-unlock').hidden) renderUnlock(); });
  $('btn-large').addEventListener('click', () => { profile.settings.large = !profile.settings.large; document.documentElement.classList.toggle('large', profile.settings.large); save(); render(); });
  $('btn-sound').addEventListener('click', () => { profile.settings.quiet = !profile.settings.quiet; save(); render(); if (!profile.settings.quiet) thunk(true); });
  $('shop').addEventListener('click', e => { const b = e.target.closest('[data-up]'); if (!b) return; if (E.buy(S, b.dataset.up)) { save(); toast(E.upById[b.dataset.up].name + ' — bought.'); renderMorning(); $('hdr-budget').textContent = '£' + Math.round(S.budget); } });
  $('btn-settings-large').addEventListener('click', () => { profile.settings.large = !profile.settings.large; document.documentElement.classList.toggle('large', profile.settings.large); save(); render(); });
  $('btn-newseason').addEventListener('click', () => { if (!confirm('Start a new season from day 1? This season is lost.')) return; hide('modal-morning'); S = E.newRun({}); selectedTag = null; save(); render(); });
  $('btn-again').addEventListener('click', () => { hide('modal-ending'); S = E.newRun({}); selectedTag = null; save(); render(); });
  $('btn-help').addEventListener('click', () => { hide('modal-help'); profile.settings.helped = true; save(); });
  $('filter-type').addEventListener('change', renderShelves); $('search-shelf').addEventListener('input', renderShelves); $('search-log').addEventListener('input', renderLog); $('phone-filter').addEventListener('change', renderLog);
  $('app').hidden = false; BILL.start(); render();
  if (!profile.settings.helped && S.day === 1 && S.idx === 0) show('modal-help');
  if (S.ended) finishSeason();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { });
  window.addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
}
window.__lostproperty = {
  get state() { return S; }, E, D, VERSION, billing: BILL,
  seedDay(day, seed) { S = E.newRun({ seed: seed | 0 || 1, skipTo: day | 0 || 1 }); selectedTag = null; hide('modal-help'); ['modal-result', 'modal-auction', 'modal-ledger', 'modal-morning', 'modal-ending'].forEach(hide); save(); render(); return S; },
  select(tag) { selectedTag = tag; render(); }, stamp: doStamp, correct() { const c = E.current(S); return c ? c.correct : null; },
  auto() { const c = E.current(S); if (!c) return null; selectedTag = c.correct.tag || null; return doStamp(c.correct.action); },
  closeModals() { ['modal-result', 'modal-help'].forEach(hide); render(); }, render, setTab, save, reset() { localStorage.removeItem(SAVE_KEY); location.reload(); }
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
