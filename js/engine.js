/* Lost Property Office — the rules engine. Pure functions over a plain state; seeded RNG; no DOM. Runs in Node and the browser. */
(function (root) {
'use strict';
const D = (typeof LPO_DATA !== 'undefined') ? LPO_DATA : require('./data.js');
const CAP_BASE = 40, CAP_SHELVING = 12, AUCTION_AGE = 14, AUCTION_DAYS = [22, 29], LATE_DAY = 14;
const typeById = {}; D.TYPES.forEach(t => { typeById[t.id] = t; }); D.PROHIBITED.forEach(t => { typeById[t.id] = t; });
const upById = {}; D.UPGRADES.forEach(u => { upById[u.id] = u; });

function rand(s) { s.seed = (s.seed + 0x6D2B79F5) | 0; let t = s.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = (s, a) => a[Math.floor(rand(s) * a.length)];
const pickNot = (s, a, not) => { let v = pick(s, a); for (let i = 0; i < 10 && v === not; i++) v = pick(s, a); return v; };
const tagStr = n => String.fromCharCode(65 + Math.floor((n - 1) / 99) % 26) + '-' + String(((n - 1) % 99) + 1).padStart(2, '0');

function newRun(opts) {
  opts = opts || {};
  const s = { v: 1, seed: (opts.seed | 0) || ((Date.now() ^ (Math.random() * 1e9)) | 0), day: 0, phase: 'morning', rep: 10, budget: 6, bought: {}, warehouse: [], log: [], nextTag: 1, claimants: [], idx: 0, results: [], flags: {}, storyDone: {}, stats: { returns: 0, wrongReturns: 0, holds: 0, wrongHolds: 0, flags: 0, wrongFlags: 0, days: 0 }, history: [], ended: null, journal: [] };
  if (opts.skipTo) { s.day = (opts.skipTo | 0) - 1; }
  startDay(s);
  return s;
}
function has(s, id) { return !!s.bought[id]; }
function cap(s) { return CAP_BASE + (has(s, 'shelving') ? CAP_SHELVING : 0); }
function ordersFor(day) { return D.ORDERS.filter(o => o.day <= day); }
function orderOn(s, id) { const o = D.ORDERS.find(x => x.id === id); return !!o && o.day <= s.day; }
function prohibitedFor(day) { return D.PROHIBITED.filter(p => p.day <= day); }
function isProhibited(s, type) { return prohibitedFor(s.day).some(p => p.id === type); }

/* ---------- objects and the log ---------- */
function addItem(s, item, foundDay) {
  // an authored object never shares type+mark with a chance one: the chance one is relabelled
  if (item.story) for (const twin of s.warehouse) if (twin.status === 'shelf' && !twin.story && twin.type === item.type && twin.mark === item.mark) { twin.mark = unusedMark(s, twin.type); const le = logEntry(s, twin.tag); if (le) le.mark = twin.mark; for (const c of s.claimants) if (c.target === twin.tag) c.claim.mark = twin.mark; }
  const tag = tagStr(s.nextTag++);
  const it = { tag, type: item.type, colour: item.colour, material: item.material, mark: item.mark, foundDay: foundDay, line: item.line | 0, where: item.where | 0, status: 'shelf', story: item.story || null, keep: !!item.keep, note: item.note || null, custom: item.custom || null };
  s.warehouse.push(it);
  // the log is written by a tired colleague: one entry in five mis-transcribes colour or material. Dates and trains are reliable.
  const entry = { tag, foundDay: it.foundDay, line: it.line, where: it.where, type: it.type, colour: it.colour, material: it.material, mark: it.mark, status: 'SHELF', slip: null };
  if (!item.story && rand(s) < 0.2) { if (rand(s) < 0.5) { entry.colour = pickNot(s, D.COLOURS, it.colour); entry.slip = 'colour'; } else { const t = typeById[it.type]; entry.material = pickNot(s, t.materials.length > 1 ? t.materials : D.TYPES[0].materials, it.material); entry.slip = 'material'; } }
  s.log.push(entry);
  return it;
}
function genericItem(s, typeId) {
  const t = typeId ? typeById[typeId] : pick(s, D.TYPES);
  // no accidental twins: a type+mark pair already on the shelf, or in a closed log entry, is not reused by chance
  const taken = new Set(s.warehouse.filter(i => i.type === t.id && i.status === 'shelf').map(i => i.mark).concat(s.log.filter(e => e.type === t.id && e.status !== 'SHELF').map(e => e.mark)));
  const free = D.MARKS.filter(m => !taken.has(m));
  return { type: t.id, colour: pick(s, D.COLOURS), material: pick(s, t.materials), mark: pick(s, free.length ? free : D.MARKS), line: Math.floor(rand(s) * D.LINES.length), where: Math.floor(rand(s) * D.CARRIAGE.length) };
}
function shelf(s) { return s.warehouse.filter(i => i.status === 'shelf'); }
function logEntry(s, tag) { return s.log.find(e => e.tag === tag); }
function matches(s, claim) { return claim.mark ? shelf(s).filter(i => i.type === claim.type && i.mark === claim.mark) : []; }
function visibleLog(s) { const keep = has(s, 'ledger') ? 999 : AUCTION_AGE; return s.log.filter(e => e.status === 'SHELF' || (e.closedDay != null && s.day - e.closedDay <= keep)); }

/* ---------- the rules: what the right stamp is, from visible evidence only ---------- */
function evidenceFlag(s, c) {
  const claim = c.claim;
  if (isProhibited(s, claim.type)) return { action: 'FLAG', why: 'Order 3: prohibited article.' };
  if (orderOn(s, 'o_forms') && c.form && (c.form.type !== claim.type || c.form.colour !== claim.colour)) return { action: 'FLAG', why: 'Order 6: the insurance form disagrees with the claim.' };
  const m = matches(s, claim);
  if (orderOn(s, 'o_date') && m.length === 1 && claim.lossDay != null && claim.lossDay > logEntry(s, m[0].tag).foundDay) return { action: 'FLAG', why: 'Order 4: the loss is dated after the log\'s found date.' };
  if (orderOn(s, 'o_returned') && claim.mark && m.length === 0 && visibleLog(s).some(e => e.status === 'RETURNED' && e.closedDay < s.day && e.type === claim.type && e.mark === claim.mark)) return { action: 'FLAG', why: 'Order 5: the log records that article as already returned.' };
  return null;
}
function correctFor(s, c, all) {
  const claim = c.claim;
  const ev = evidenceFlag(s, c); if (ev) return ev;
  const m = matches(s, claim);
  if (!claim.mark) return { action: 'HOLD', why: 'Order 2: no distinguishing mark given.' };
  if (m.length === 0) return { action: 'HOLD', why: 'Order 2: nothing on the shelves fits.' };
  if (m.length > 1) return { action: 'HOLD', why: 'Order 2: more than one object fits.' };
  const obj = m[0];
  if (orderOn(s, 'o_rivals')) {
    const rivals = (all || s.claimants).filter(o => o !== c && o.claim.mark === claim.mark && o.claim.type === claim.type && !evidenceFlag(s, o));
    if (rivals.length) {
      const mine = claim.line === obj.line, theirs = rivals.some(r => r.claim.line === obj.line);
      if (mine && !theirs) return { action: 'RETURN', tag: obj.tag, why: 'Order 7: this claimant\'s train matches the log; the rival\'s does not.' };
      return { action: 'HOLD', why: mine ? 'Order 7: both rivals name the logged train.' : (theirs ? 'Order 7: the rival\'s train matches the log; this one\'s does not.' : 'Order 7: neither rival names the logged train.') };
    }
  }
  return { action: 'RETURN', tag: obj.tag, why: 'Order 1: one object of that type bears that mark.' };
}

/* ---------- claimant generation ---------- */
function describe(s, item, errors, profile) {
  const claim = { type: item.type, colour: item.colour, material: item.material, mark: item.mark, lossDay: item.foundDay - (rand(s) < 0.7 ? 0 : 1), line: item.line };
  const fields = ['colour', 'material', 'lossDay', 'line'];
  for (let i = 0; i < errors; i++) {
    const f = pick(s, fields);
    if (f === 'colour') claim.colour = pickNot(s, D.COLOURS, item.colour);
    else if (f === 'material') { const t = typeById[item.type]; claim.material = pickNot(s, t.materials.length > 1 ? t.materials : D.TYPES[1].materials, item.material); }
    else if (f === 'lossDay') claim.lossDay = Math.max(1, item.foundDay - 1 - Math.floor(rand(s) * 3));
    else claim.line = (item.line + 1 + Math.floor(rand(s) * (D.LINES.length - 1))) % D.LINES.length;
  }
  if (profile === 'confused' && rand(s) < 0.15) claim.mark = null;
  return claim;
}
function nameFor(s, used) { let n = pick(s, D.FIRST); for (let i = 0; i < 20 && used[n]; i++) n = pick(s, D.FIRST); used[n] = 1; return n; }
const up1 = x => x.charAt(0).toUpperCase() + x.slice(1);
function fill(f, v) { return f.replace(/\{([a-zA-Z])\}/g, (m, k) => { const low = k.toLowerCase(); const val = v[low] == null ? '' : v[low]; return k === low ? val : up1(val); }); }
function sayFor(s, c) {
  const t = typeById[c.claim.type], F = D.FRAMES;
  const d = c.claim.lossDay === s.day ? 'this morning' : c.claim.lossDay === s.day - 1 ? 'yesterday' : 'on day ' + c.claim.lossDay;
  const v = { a: t.a, c: c.claim.colour, n: t.name, m: c.claim.material ? ', ' + c.claim.material : '', k: c.claim.mark, l: D.LINES[c.claim.line], d };
  const bits = [(c.form ? 'I have the insurance form here. ' : '') + fill(pick(s, F.article), v)];
  bits.push(c.claim.mark ? fill(pick(s, F.mark), v) : pick(s, F.nomark));
  bits.push(fill(pick(s, F.lost), v));
  bits.push(pick(s, D.PROFILES[c.profile].manner));
  // the beats come in a different order now and then, as people talk
  if (rand(s) < 0.3) { const x = bits[1]; bits[1] = bits[2]; bits[2] = x; }
  return bits.join(' ');
}
function makeClaimant(s, profile, item, opts) {
  opts = opts || {};
  const errs = D.PROFILES[profile].errors;
  const c = { name: opts.name, profile, claim: describe(s, item, opts.errors != null ? opts.errors : pick(s, errs), profile), target: item.tag, form: null, story: null, say: null, after: null };
  if (opts.form) c.form = opts.form; if (opts.claim) Object.assign(c.claim, opts.claim);
  if (opts.noMark) c.claim.mark = null;
  return c;
}
function fraudClaimant(s, used) {
  const kinds = ['wrongmark'];
  if (orderOn(s, 'o_date')) kinds.push('date', 'date', 'date');
  if (orderOn(s, 'o_returned') && visibleLog(s).some(e => e.status === 'RETURNED' && e.closedDay < s.day)) kinds.push('returned', 'returned', 'returned');
  if (orderOn(s, 'o_forms')) kinds.push('form', 'form');
  kinds.push('prohibited');
  const kind = pick(s, kinds);
  const pool = shelf(s).filter(i => !i.keep && !i.story && !isProhibited(s, i.type) && !s.claimants.some(c => c.target === i.tag));
  if (kind === 'prohibited') { const p = pick(s, prohibitedFor(s.day)); const item = { tag: null, type: p.id, colour: pick(s, D.COLOURS), material: p.materials[0], mark: pick(s, D.MARKS), foundDay: s.day, line: Math.floor(rand(s) * D.LINES.length) }; const c = makeClaimant(s, 'fraud', item, { name: nameFor(s, used), errors: 0 }); c.target = null; return c; }
  if (kind === 'returned') { const e = pick(s, visibleLog(s).filter(e => e.status === 'RETURNED' && e.closedDay < s.day)); const item = { tag: null, type: e.type, colour: e.colour, material: e.material, mark: e.mark, foundDay: e.foundDay, line: e.line }; const c = makeClaimant(s, 'fraud', item, { name: nameFor(s, used), errors: 0 }); c.claim.lossDay = Math.min(c.claim.lossDay, e.foundDay); c.target = null; return c; }
  if (!pool.length) return null;
  const item = pick(s, pool);
  if (kind === 'date') { const c = makeClaimant(s, 'fraud', item, { name: nameFor(s, used), errors: 0 }); c.claim.lossDay = item.foundDay + 1 + Math.floor(rand(s) * 2); return c; }
  if (kind === 'form') { const c = makeClaimant(s, 'fraud', item, { name: nameFor(s, used), errors: 0 }); c.form = rand(s) < 0.5 ? { type: item.type, colour: pickNot(s, D.COLOURS, c.claim.colour) } : { type: pickNot(s, D.TYPES, typeById[item.type]).id, colour: c.claim.colour }; return c; }
  const c = makeClaimant(s, 'fraud', item, { name: nameFor(s, used), errors: 0 }); c.claim.mark = unusedMark(s, item.type); c.target = null; return c; // no evidence: the right stamp is HOLD
}
function unusedMark(s, type) { const taken = new Set(shelf(s).filter(i => i.type === type).map(i => i.mark)); const free = D.MARKS.filter(m => !taken.has(m)); return pick(s, free.length ? free : D.MARKS); }
function storyItemFor(st) { return { type: st.item.type, colour: st.item.colour, material: st.item.material, mark: st.item.mark, line: st.line | 0, where: st.where | 0, story: st.who || st.note || 'story', keep: !!st.keep, note: st.note, custom: st.item.custom }; }

function startDay(s) {
  s.day++; s.phase = 'counter'; s.idx = 0; s.results = []; s.claimants = [];
  if (s.day > D.SEASON_DAYS) { finish(s); return; }
  const used = {};
  // story objects logged today
  const stories = D.STORY.filter(st => st.day === s.day);
  for (const st of stories) {
    if (st.requires && !s.flags[st.requires]) continue;
    if (st.kind === 'found') { addItem(s, storyItemFor(st), s.day); s.journal.push({ day: s.day, text: st.note }); continue; }
    if (st.returnedAlready) {
      for (const twin of shelf(s)) if (twin.type === st.item.type && twin.mark === st.item.mark && !twin.story) { twin.mark = unusedMark(s, twin.type); logEntry(s, twin.tag).mark = twin.mark; }
      const it = addItem(s, Object.assign(storyItemFor(st), { keep: false }), s.day - 4); it.status = 'returned'; const e = logEntry(s, it.tag); e.status = 'RETURNED'; e.closedDay = s.day - 3;
    }
  }
  // generic arrivals
  const n = 3 + Math.floor(rand(s) * 3);
  for (let i = 0; i < n; i++) addItem(s, genericItem(s), s.day);
  // the story claims
  for (const st of stories) {
    if (st.kind !== 'claim') continue; if (st.requires && !s.flags[st.requires]) continue;
    let target = null;
    if (st.profile !== 'fraud' || st.form || st.dateFraud) {
      if (st.foundDay != null) target = addItem(s, storyItemFor(st), st.foundDay);
      else target = s.warehouse.find(i => i.story && i.type === st.item.type && i.mark === st.item.mark && i.status === 'shelf') || null;
    }
    const base = target || { tag: null, type: st.item.type, colour: st.item.colour, material: st.item.material, mark: st.item.mark, foundDay: st.lossDay || s.day, line: st.line | 0 };
    const c = makeClaimant(s, st.profile, base, { name: st.who, errors: 0, form: st.form || null });
    c.claim.colour = st.item.colour; c.claim.material = st.item.material; c.claim.mark = st.item.mark; c.claim.line = st.line | 0;
    if (st.lossDay != null) c.claim.lossDay = st.lossDay; else if (target) c.claim.lossDay = target.foundDay;
    if (st.profile === 'fraud' && !st.form && !st.returnedAlready && !st.dateFraud) { c.claim.mark = unusedMark(s, st.item.type); c.target = null; target = null; }
    c.story = st; c.say = st.say; c.after = st.after; c.target = target ? target.tag : null;
    used[st.who] = 1; s.claimants.push(c);
  }
  // decoys: for every story target, another object of the same type with a different mark
  for (const c of s.claimants) if (c.target) { const it = s.warehouse.find(i => i.tag === c.target); if (!shelf(s).some(i => i.type === it.type && i.tag !== it.tag)) { const g = genericItem(s, it.type); if (g.mark === it.mark) g.mark = pickNot(s, D.MARKS, it.mark); addItem(s, g, Math.max(1, s.day - 1 - Math.floor(rand(s) * 3))); } }
  // generic claimants
  const count = Math.max(0, 2 + Math.floor((s.day - 1) / 6) - (s.claimants.length > 1 ? 1 : 0));
  const fraudP = 0.12 + 0.2 * (s.day / D.SEASON_DAYS);
  let rivalDone = false;
  for (let i = 0; i < count; i++) {
    const pool = shelf(s).filter(it => !it.keep && !it.story && !isProhibited(s, it.type) && !s.claimants.some(c => c.target === it.tag));
    if (rand(s) < fraudP) { const f = fraudClaimant(s, used); if (f) { s.claimants.push(f); continue; } }
    if (!pool.length) { addItem(s, genericItem(s), s.day); i--; continue; }
    const item = pick(s, pool);
    const profile = pick(s, ['precise', 'confused', 'confused', 'exaggerator']);
    if (orderOn(s, 'o_rivals') && !rivalDone && rand(s) < 0.65) {
      rivalDone = true;
      const a = makeClaimant(s, 'precise', item, { name: nameFor(s, used), errors: 0 }); const b = makeClaimant(s, 'exaggerator', item, { name: nameFor(s, used), errors: 0 });
      const both = rand(s) < 0.25; a.claim.line = item.line; b.claim.line = both ? item.line : (item.line + 1 + Math.floor(rand(s) * (D.LINES.length - 1))) % D.LINES.length;
      if (!both && rand(s) < 0.5) { const t = a.claim.line; a.claim.line = b.claim.line; b.claim.line = t; }
      a.rival = b.name; b.rival = a.name; s.claimants.push(a, b); i++; continue;
    }
    const c = makeClaimant(s, profile, item, { name: nameFor(s, used) });
    if (orderOn(s, 'o_forms') && profile === 'precise' && rand(s) < 0.4) c.form = { type: c.claim.type, colour: c.claim.colour };
    if (s.day >= 6 && rand(s) < 0.3 && c.claim.mark) { const g = genericItem(s, item.type); g.mark = item.mark; addItem(s, g, s.day); } // two fit: HOLD
    if (!shelf(s).some(it => it.type === item.type && it.tag !== item.tag)) { const g = genericItem(s, item.type); if (g.mark === item.mark) g.mark = pickNot(s, D.MARKS, item.mark); addItem(s, g, s.day); }
    s.claimants.push(c);
  }
  // shuffle so story claims land anywhere in the queue, then write the speech
  for (let i = s.claimants.length - 1; i > 0; i--) { const j = Math.floor(rand(s) * (i + 1)); const t = s.claimants[i]; s.claimants[i] = s.claimants[j]; s.claimants[j] = t; }
  for (const c of s.claimants) if (c.profile === 'fraud' && !c.target && c.claim.mark && !c.form && matches(s, c.claim).length && !isProhibited(s, c.claim.type)) c.claim.mark = unusedMark(s, c.claim.type);
  for (const c of s.claimants) { if (!c.say) c.say = sayFor(s, c); c.correct = correctFor(s, c, s.claimants); }
}

/* ---------- the stamp ---------- */
function current(s) { return s.phase === 'counter' ? s.claimants[s.idx] || null : null; }
function stamp(s, action, tag) {
  const c = current(s); if (!c) return null;
  const right = correctFor(s, c, s.claimants); c.correct = right; let ok = right.action === action && (action !== 'RETURN' || right.tag === tag);
  const stool = has(s, 'stool') ? 1 : 0;
  let dRep = 0, dBudget = 0, text = '';
  if (ok) {
    if (action === 'RETURN') { dRep = 2; dBudget = 3; s.stats.returns++; text = c.after || `${c.name} took the ${typeById[c.claim.type].name} and had a better day for it.`; }
    else if (action === 'HOLD') { dRep = 1; dBudget = 1; s.stats.holds++; text = c.profile === 'fraud' ? `${c.name} said something about coming back with proof, and did not sound as if it were true.` : `${c.name} will come back with proof. ${right.why}`; }
    else { dRep = 2; dBudget = 2; s.stats.flags++; text = c.after || `Escalated to the station master. ${right.why}`; }
  } else {
    if (action === 'RETURN') { dRep = -3 + stool; dBudget = -2; s.stats.wrongReturns++; text = right.action === 'RETURN' ? `Wrong object. ${c.name} was too polite to say so at the counter, and wrote to the station master instead.` : (c.profile === 'fraud' ? `${c.name} left quickly with something that was never theirs. ${right.why}` : `That article belonged to someone else. ${right.why}`); }
    else if (action === 'HOLD') { dRep = has(s, 'refit') ? 0 : -1; s.stats.wrongHolds++; text = right.action === 'RETURN' ? `${c.name} went home without it, and it sat on the shelf. ${right.why}` : `${c.name} walked. ${right.why}`; }
    else { dRep = -2 + stool; dBudget = -1; s.stats.wrongFlags++; text = `${c.name} was honest, and is now also upset. ${right.why}`; }
  }
  // apply to the world
  if (action === 'RETURN' && tag) { const it = s.warehouse.find(i => i.tag === tag && i.status === 'shelf'); if (it) { it.status = 'returned'; const e = logEntry(s, tag); e.status = 'RETURNED'; e.closedDay = s.day; if (it.story && !ok) s.flags[it.type + '_lost'] = true; } }
  if (ok && c.story) { if (c.story.endsArc && action === 'RETURN') s.flags.ring_reunited = true; s.storyDone[c.story.day + ':' + c.story.who] = 1; }
  // from the third week a good office is expected, not admired: correct stamps earn half the reputation
  if (dRep > 0 && s.day > LATE_DAY) dRep = Math.ceil(dRep / 2);
  s.rep = Math.max(0, Math.min(100, s.rep + dRep)); s.budget = Math.max(0, s.budget + dBudget);
  const r = { name: c.name, action, tag: tag || null, ok, right, dRep, dBudget, text, story: !!c.story };
  s.results.push(r); s.journal.push({ day: s.day, text: `${c.name}: ${action}${ok ? '' : ' (wrong)'}. ${text}` });
  s.idx++;
  if (s.idx >= s.claimants.length) s.phase = AUCTION_DAYS.includes(s.day) ? 'auction' : 'ledger';
  return r;
}
function auctionLots(s) { return shelf(s).filter(i => s.day - i.foundDay >= AUCTION_AGE); }
function auction(s, withheld) {
  if (s.phase !== 'auction') return null; const keep = new Set(withheld || []); let sold = 0, lost = [];
  for (const it of auctionLots(s)) { if (keep.has(it.tag)) continue; it.status = 'auctioned'; const e = logEntry(s, it.tag); e.status = 'AUCTIONED'; e.closedDay = s.day; sold++; if (it.keep) { lost.push(it); s.flags[it.type + '_lost'] = true; } }
  s.budget += sold * 2; s.phase = 'ledger'; s.journal.push({ day: s.day, text: `Thursday auction: ${sold} lots sold.` + (lost.length ? ' Something went that should have stayed.' : '') });
  return { sold, lost };
}
function endDay(s) {
  if (s.phase !== 'ledger') return false;
  if (has(s, 'kettle')) s.rep = Math.min(100, s.rep + 1);
  // expectations rise: past the second week, a high reputation drifts back unless the office keeps earning it
  if (s.day > LATE_DAY && s.rep > 40) s.rep = Math.max(40, s.rep - Math.round((s.rep - 40) * (has(s, 'refit') ? 0.08 : 0.15)));
  if (has(s, 'clock') && s.results.length && s.results.every(r => r.ok)) s.budget += 1;
  // the warehouse overflows: the oldest unkept objects go to a quiet auction
  let over = shelf(s).length - cap(s);
  if (over > 0) for (const it of shelf(s).sort((a, b) => a.foundDay - b.foundDay)) { if (over <= 0) break; if (it.keep) continue; it.status = 'auctioned'; const e = logEntry(s, it.tag); e.status = 'AUCTIONED'; e.closedDay = s.day; s.budget += 1; over--; }
  s.history.push({ day: s.day, rep: s.rep, budget: s.budget, right: s.results.filter(r => r.ok).length, total: s.results.length });
  s.stats.days++;
  if (s.day >= D.SEASON_DAYS) { finish(s); return true; }
  s.phase = 'morning';
  return true;
}
function upgradeOpen(s, u) { return !u.from || s.day + 1 >= u.from; }
function buy(s, id) { const u = upById[id]; if (!u || s.bought[id] || s.budget < u.cost || s.phase !== 'morning' || !upgradeOpen(s, u)) return false; s.budget -= u.cost; s.bought[id] = 1; return true; }
function nextDay(s) { if (s.phase !== 'morning') return false; startDay(s); return true; }
function accuracy(s) { const t = s.stats; const right = t.returns + t.holds + t.flags, all = right + t.wrongReturns + t.wrongHolds + t.wrongFlags; return all ? right / all : 0; }
function finish(s) { if (s.ended) return; const a = accuracy(s); s.ended = (a >= 0.9 && s.rep >= 60) ? 'gold' : (a >= 0.7 && s.rep >= 35) ? 'good' : 'poor'; s.phase = 'done'; }
function score(s) { const t = s.stats; return Math.max(0, t.returns * 10 + t.flags * 8 + t.holds * 4 - t.wrongReturns * 15 - t.wrongFlags * 10 - t.wrongHolds * 4 + (s.flags.ring_reunited ? 100 : 0)); }

/* ---------- save hygiene ---------- */
const num = (v, def, lo, hi) => { v = +v; if (!isFinite(v)) v = def; return Math.min(hi, Math.max(lo, v)); };
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null;
  try {
    const s = newRun({ seed: raw.seed }); // regenerates from the seed; then overlay the trustworthy scalars
    const day = Math.round(num(raw.day, 1, 1, D.SEASON_DAYS + 1));
    if (!Array.isArray(raw.warehouse) || !Array.isArray(raw.log) || !Array.isArray(raw.claimants)) return null;
    s.day = day; s.phase = ['morning', 'counter', 'auction', 'ledger', 'done'].includes(raw.phase) ? raw.phase : 'counter';
    s.rep = num(raw.rep, 10, 0, 100); s.budget = num(raw.budget, 0, 0, 1e6); s.nextTag = Math.round(num(raw.nextTag, 1, 1, 1e6));
    s.bought = {}; if (raw.bought && typeof raw.bought === 'object') for (const k in raw.bought) if (upById[k]) s.bought[k] = 1;
    const okItem = i => i && typeof i === 'object' && typeof i.tag === 'string' && typeById[i.type] && typeof i.mark === 'string';
    s.warehouse = raw.warehouse.filter(okItem).slice(0, 500).map(i => ({ tag: String(i.tag).slice(0, 8), type: i.type, colour: String(i.colour).slice(0, 20), material: String(i.material).slice(0, 20), mark: String(i.mark).slice(0, 80), foundDay: Math.round(num(i.foundDay, 1, 1, 60)), line: Math.round(num(i.line, 0, 0, D.LINES.length - 1)), where: Math.round(num(i.where, 0, 0, D.CARRIAGE.length - 1)), status: ['shelf', 'returned', 'auctioned'].includes(i.status) ? i.status : 'shelf', story: typeof i.story === 'string' ? i.story.slice(0, 60) : null, keep: i.keep === true, note: typeof i.note === 'string' ? i.note.slice(0, 300) : null, custom: typeof i.custom === 'string' ? i.custom.slice(0, 80) : null }));
    s.log = raw.log.filter(e => e && typeof e.tag === 'string').slice(0, 500).map(e => ({ tag: String(e.tag).slice(0, 8), foundDay: Math.round(num(e.foundDay, 1, 1, 60)), line: Math.round(num(e.line, 0, 0, D.LINES.length - 1)), where: Math.round(num(e.where, 0, 0, D.CARRIAGE.length - 1)), type: typeById[e.type] ? e.type : 'book', colour: String(e.colour).slice(0, 20), material: String(e.material).slice(0, 20), mark: String(e.mark).slice(0, 80), status: ['SHELF', 'RETURNED', 'AUCTIONED'].includes(e.status) ? e.status : 'SHELF', slip: e.slip === 'colour' || e.slip === 'material' ? e.slip : null, closedDay: e.closedDay == null ? undefined : Math.round(num(e.closedDay, 1, 1, 60)) }));
    s.claimants = raw.claimants.filter(c => c && typeof c === 'object' && c.claim && typeof c.claim === 'object' && typeById[c.claim.type]).slice(0, 12).map(c => ({ name: String(c.name || 'A traveller').slice(0, 40), profile: D.PROFILES[c.profile] ? c.profile : 'confused', claim: { type: c.claim.type, colour: String(c.claim.colour).slice(0, 20), material: String(c.claim.material).slice(0, 20), mark: typeof c.claim.mark === 'string' ? c.claim.mark.slice(0, 80) : null, lossDay: Math.round(num(c.claim.lossDay, 1, 1, 60)), line: Math.round(num(c.claim.line, 0, 0, D.LINES.length - 1)) }, target: typeof c.target === 'string' ? c.target : null, form: c.form && typeof c.form === 'object' ? { type: String(c.form.type).slice(0, 20), colour: String(c.form.colour).slice(0, 20) } : null, story: c.story && typeof c.story === 'object' ? D.STORY.find(st => st.day === c.story.day && st.who === c.story.who) || null : null, say: String(c.say || '').slice(0, 600), after: typeof c.after === 'string' ? c.after.slice(0, 600) : null, rival: typeof c.rival === 'string' ? c.rival.slice(0, 40) : null }));
    for (const c of s.claimants) c.correct = correctFor(s, c, s.claimants);
    s.idx = Math.round(num(raw.idx, 0, 0, s.claimants.length));
    s.results = Array.isArray(raw.results) ? raw.results.filter(r => r && typeof r === 'object').slice(0, 12).map(r => ({ name: String(r.name).slice(0, 40), action: ['RETURN', 'HOLD', 'FLAG'].includes(r.action) ? r.action : 'HOLD', tag: typeof r.tag === 'string' ? r.tag : null, ok: r.ok === true, right: r.right && typeof r.right === 'object' ? { action: String(r.right.action), tag: r.right.tag, why: String(r.right.why || '').slice(0, 200) } : { action: 'HOLD', why: '' }, dRep: num(r.dRep, 0, -10, 10), dBudget: num(r.dBudget, 0, -10, 10), text: String(r.text || '').slice(0, 600), story: r.story === true })) : [];
    s.flags = {}; if (raw.flags && typeof raw.flags === 'object') for (const k in raw.flags) if (raw.flags[k]) s.flags[String(k).slice(0, 40)] = true;
    s.storyDone = {}; if (raw.storyDone && typeof raw.storyDone === 'object') for (const k in raw.storyDone) s.storyDone[String(k).slice(0, 60)] = 1;
    s.stats = { returns: 0, wrongReturns: 0, holds: 0, wrongHolds: 0, flags: 0, wrongFlags: 0, days: 0 }; if (raw.stats && typeof raw.stats === 'object') for (const k in s.stats) s.stats[k] = Math.round(num(raw.stats[k], 0, 0, 1e6));
    s.history = Array.isArray(raw.history) ? raw.history.filter(h => h && typeof h === 'object').slice(0, 40).map(h => ({ day: Math.round(num(h.day, 1, 1, 60)), rep: num(h.rep, 0, 0, 100), budget: num(h.budget, 0, 0, 1e6), right: Math.round(num(h.right, 0, 0, 20)), total: Math.round(num(h.total, 0, 0, 20)) })) : [];
    s.journal = Array.isArray(raw.journal) ? raw.journal.filter(j => j && typeof j.text === 'string').slice(-400).map(j => ({ day: Math.round(num(j.day, 1, 1, 60)), text: j.text.slice(0, 600) })) : [];
    s.ended = ['gold', 'good', 'poor'].includes(raw.ended) ? raw.ended : null; if (s.ended) s.phase = 'done';
    if (s.phase === 'counter' && s.idx >= s.claimants.length) s.phase = 'ledger';
    return s;
  } catch (e) { return null; }
}

const ENGINE = { D, typeById, upById, newRun, startDay, nextDay, current, stamp, auctionLots, auction, endDay, buy, finish, score, accuracy, correctFor, evidenceFlag, upgradeOpen, LATE_DAY, matches, shelf, visibleLog, logEntry, ordersFor, prohibitedFor, isProhibited, cap, has, sanitize, rand, tagStr };
if (typeof module !== 'undefined' && module.exports) module.exports = ENGINE; else root.LPO = ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
