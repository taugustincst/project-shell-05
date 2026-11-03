// Renders icons and a staged store screenshot with the pre-installed Chromium. node tools/make-icons.js [pageUrl]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#f3ecdc"/>
<g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
<rect x="56" y="150" width="400" height="300" rx="18" fill="#8b5a2b"/><rect x="76" y="170" width="360" height="260" rx="10" fill="#b8793f"/>
<rect x="96" y="200" width="320" height="18" fill="#6b3f1d"/><rect x="96" y="300" width="320" height="18" fill="#6b3f1d"/>
<rect x="120" y="150" width="90" height="50" rx="6" fill="#2d4f7a"/><rect x="230" y="135" width="70" height="65" rx="8" fill="#a8362b"/><circle cx="360" cy="170" r="28" fill="#e0b84a"/>
<rect x="110" y="236" width="120" height="64" rx="6" fill="#2f6b45"/><rect x="250" y="250" width="150" height="50" rx="6" fill="#d9c8a3"/>
<rect x="150" y="320" width="220" height="90" rx="12" fill="#fff9ec" stroke="#2b2418" stroke-width="6"/>
<text x="260" y="378" font-family="Courier New, monospace" font-size="52" font-weight="700" text-anchor="middle" fill="#2f6b45" transform="rotate(-4 260 378)">RETURN</text>
</g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  const out = path.join(__dirname, '..', 'icons'); fs.mkdirSync(out, { recursive: true });
  for (const [name, pad, size] of [['icon-512.png', 0, 512], ['icon-192.png', 0, 192], ['maskable-512.png', 70, 512]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:#f3ecdc">${svg(pad).replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`)}</body></html>`);
    await p.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } });
  }
  const base = process.argv[2];
  if (base) {
    const q = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
    await q.goto(base); await q.waitForSelector('#app:not([hidden])');
    await q.evaluate(() => { const K = window.__lostproperty; K.seedDay(5, 11); const c = K.E.current(K.state); if (c && c.correct.tag) K.select(c.correct.tag); K.setTab('shelves'); });
    await q.waitForTimeout(400); await q.screenshot({ path: path.join(out, 'screenshot-portrait.png') });
  }
  await b.close(); console.log('icons written');
})();
