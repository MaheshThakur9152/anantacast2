// Anantacast — embers, coals and heat-on-scroll. No libraries.
(() => {
  const EMAIL = 'hello@anantacast.com'; // SAMPLE: change to your real enquiry email address

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- split headlines into letters ---------- */
  function split(el) {
    const text = el.textContent.trim();
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text);
    const chars = [];
    const build = (target, str) => {
      target.textContent = '';
      str.split(/\s+/).forEach((word, wi) => {
        if (wi) target.append(' ');
        const w = document.createElement('span');
        w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        for (const ch of word) {
          const c = document.createElement('span');
          c.className = 'c'; c.textContent = ch;
          w.append(c); chars.push(c);
        }
        target.append(w);
      });
    };
    const lines = $$('.line', el);
    if (lines.length) lines.forEach(l => build(l, l.textContent.trim()));
    else build(el, text);
    return chars;
  }

  // hero: catch letter by letter, then flicker unevenly (CSS does the work)
  split($('.coal-hero')).forEach((c, i) => {
    c.style.setProperty('--d', (0.25 + i * 0.09 + Math.random() * 0.05).toFixed(2) + 's');
    c.style.setProperty('--fd', (1.6 + Math.random() * 2.6).toFixed(2) + 's');
  });

  // ash grey -> deep red -> ember -> glow -> white-hot
  const STOPS = [[0, 140, 130, 121], [.32, 120, 24, 8], [.58, 255, 90, 31], [.8, 255, 179, 107], [1, 255, 243, 226]];
  function heatColor(h) {
    for (let i = 1; i < STOPS.length; i++) {
      if (h <= STOPS[i][0]) {
        const a = STOPS[i - 1], b = STOPS[i], t = (h - a[0]) / (b[0] - a[0]);
        return `rgb(${a[1] + (b[1] - a[1]) * t | 0},${a[2] + (b[2] - a[2]) * t | 0},${a[3] + (b[3] - a[3]) * t | 0})`;
      }
    }
    return 'rgb(255,243,226)';
  }
  function paint(chars, p) {
    const n = chars.length, spread = 4;
    chars.forEach((c, i) => {
      const h = clamp((p * (n + spread) - i) / spread);
      if (c._h === h) return;
      c._h = h;
      c.style.color = heatColor(h);
      c.style.textShadow = h > .45 ? `0 0 ${(h * 34) | 0}px rgba(255,90,31,${(h * .55).toFixed(2)})` : 'none';
    });
  }
  const heads = $$('h2.coal').map(el => ({ el, chars: split(el) }));
  const footChars = split($('.coal-foot'));

  /* ---------- scroll-driven pieces ---------- */
  const stages = $$('.stage');
  const tempEl = $('#temp'), tempLbl = $('#tempLabel'), tempBar = $('#tempBar');
  const cards = $$('.card');
  const metals = $$('.metal');
  const steps = $$('.steps li'), seats = $$('.seats i').sort((a, b) => a.textContent - b.textContent);
  const bench = $('#bench'), band = $('.band img');
  let pointerX = -1, pointerY = -1;

  // ingot pile: row i holds i+1 ingots
  const ingotsG = $('#ingots'), fills = ['gY', 'gR', 'gW', 'gS'], stamps = ['916', '750', '750', '925'];
  const NS = 'http://www.w3.org/2000/svg';
  for (let r = 0; r < 4; r++) {
    const row = document.createElementNS(NS, 'g');
    row.setAttribute('class', 'ing'); row.dataset.row = r;
    const n = r + 1, w = 92, gap = 6, x0 = (420 - (n * w + (n - 1) * gap)) / 2, y = 22 + r * 86;
    for (let k = 0; k < n; k++) {
      const x = x0 + k * (w + gap);
      row.insertAdjacentHTML('beforeend',
        `<path d="M${x + 12} ${y} H${x + w - 12} L${x + w} ${y + 74} H${x} Z" fill="url(#${fills[r]})" stroke="#0E0C0B" stroke-width="2"/>` +
        `<path d="M${x + 22} ${y + 12} H${x + w - 22} L${x + w - 13} ${y + 62} H${x + 13} Z" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>` +
        `<text x="${x + w / 2}" y="${y + 44}" text-anchor="middle" font-family="Big Shoulders Display, sans-serif" font-weight="800" font-size="17" fill="rgba(14,12,11,.55)">${stamps[r]}</text>`);
    }
    ingotsG.append(row);
  }
  const ingotRows = $$('.ing', ingotsG);

  let shownTemp = 24;
  function update() {
    const vh = innerHeight, mid = vh / 2;

    heads.forEach(({ el, chars }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      // 0 when headline enters at bottom, 1 when its centre reaches mid-screen
      paint(chars, clamp((vh - (r.top + r.height / 2)) / (vh - mid)));
    });

    // footer name heats as you reach the bottom
    const left = document.documentElement.scrollHeight - (scrollY + vh);
    paint(footChars, clamp(1 - left / (vh * .7)));

    // kiln temperature: interpolate between stage centres
    if (stages.length) {
      const focus = innerWidth <= 860 ? vh * .62 : mid;
      const cs = stages.map(s => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
      let t = +stages[0].dataset.temp, near = 0;
      if (focus >= cs[cs.length - 1]) { t = +stages.at(-1).dataset.temp; near = cs.length - 1; }
      else if (focus > cs[0]) {
        for (let i = 0; i < cs.length - 1; i++) if (focus >= cs[i] && focus < cs[i + 1]) {
          const k = (focus - cs[i]) / (cs[i + 1] - cs[i]), e = k * k * (3 - 2 * k);
          t = +stages[i].dataset.temp + (+stages[i + 1].dataset.temp - +stages[i].dataset.temp) * e;
          near = k < .5 ? i : i + 1;
        }
      }
      shownTemp = t;
      tempEl.textContent = Math.round(t).toLocaleString('en-IN');
      tempEl.style.color = heatColor(clamp(t / 1060));
      tempEl.style.textShadow = t > 400 ? `0 0 ${t / 18 | 0}px rgba(255,90,31,${(t / 2200).toFixed(2)})` : 'none';
      tempBar.style.width = clamp(t / 1100) * 100 + '%';
      tempLbl.textContent = stages[near].dataset.name;
    }

    // glow the card nearest the middle (or nearest the pointer when it's over the grid)
    const grid = $('.cards').getBoundingClientRect();
    const usePtr = pointerY > grid.top && pointerY < grid.bottom && pointerX >= 0;
    const fx = usePtr ? pointerX : innerWidth / 2, fy = usePtr ? pointerY : mid;
    let best = null, bd = Infinity;
    cards.forEach(c => {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - fx, (r.top + r.height / 2 - fy) * 1.6);
      if (d < bd) { bd = d; best = c; }
    });
    cards.forEach(c => c.classList.toggle('hot', c === best && bd < vh * .55));

    // metals: highlight the one at the centre, and its row of ingots
    let mi = -1, md = Infinity;
    metals.forEach((m, i) => { const r = m.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - vh * .55); if (d < md) { md = d; mi = i; } });
    metals.forEach((m, i) => m.classList.toggle('on', i === mi));
    ingotRows.forEach((g, i) => g.classList.toggle('on', i === mi));

    // bench: stations light up one by one
    const br = bench.getBoundingClientRect();
    const lit = Math.floor(clamp((vh * .75 - br.top) / (br.height * .75)) * 8.99);
    steps.forEach((s, i) => s.classList.toggle('on', i < lit));
    seats.forEach((s, i) => s.classList.toggle('on', i < lit));

    // slow parallax on the photo band
    if (!reduce) {
      const r = band.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) band.style.transform = `translateY(${((r.top + r.height / 2 - mid) / vh) * -60}px)`;
    }
  }
  let queued = false;
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();

  /* ---------- enquiry form -> email app ---------- */
  $('#enquiry').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `Name: ${f.get('name')}\nContact: ${f.get('contact')}\nMetal: ${f.get('metal')}\n\n${f.get('msg')}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Casting enquiry')}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- hero coal bed ---------- */
  const coalCv = $('#coals'), cx = coalCv.getContext('2d');
  let coals = [], flecks = [], cw = 0, ch = 0, dpr = 1;
  function buildCoals() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cw = coalCv.clientWidth; ch = coalCv.clientHeight;
    coalCv.width = cw * dpr; coalCv.height = ch * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    coals = []; flecks = [];
    const size = clamp(cw / 30, 20, 44);
    for (let row = 0; row < 4; row++) {
      const y = ch * (0.32 + row * 0.24), r = size * (0.7 + row * 0.18);
      for (let x = -r * .4 + (row % 2) * r * .5; x < cw + r; x += r * (1.15 + Math.random() * .5)) {
        const pts = [], k = 7 + (Math.random() * 3 | 0);
        for (let j = 0; j < k; j++) {
          const a = j / k * Math.PI * 2, rr = r * (0.62 + Math.random() * .42);
          pts.push([Math.cos(a) * rr, Math.sin(a) * rr * .62]);
        }
        coals.push({ x: x + (Math.random() - .5) * r * .4, y: y + (Math.random() - .5) * r * .3, r, pts,
          base: Math.random() < .25 ? Math.random() * .08 : Math.random() * .35 + row * .08, sp: .6 + Math.random() * 1.6, ph: Math.random() * 7 });
        for (let f = 0; f < 3; f++) flecks.push({ x: x + (Math.random() - .5) * r, y: y + (Math.random() - .7) * r * .5, s: .6 + Math.random() * 1.6 });
      }
    }
    coals.sort((a, b) => a.y - b.y);
  }
  function drawCoals(t) {
    cx.clearRect(0, 0, cw, ch);
    for (const c of coals) {
      const h = clamp(c.base + Math.sin(t * c.sp + c.ph) * .16 + Math.sin(t * c.sp * 2.7 + c.ph * 3) * .07);
      const g = cx.createRadialGradient(c.x, c.y - c.r * .1, 0, c.x, c.y, c.r);
      // coal heat: dark crust -> deep red -> ember -> glow (skips the ash-grey used for headlines)
      g.addColorStop(0, heatColor(.3 + h * .42));
      g.addColorStop(.5, heatColor(.3 + h * .16));
      g.addColorStop(1, '#120503');
      cx.beginPath();
      c.pts.forEach(([px, py], i) => i ? cx.lineTo(c.x + px, c.y + py) : cx.moveTo(c.x + px, c.y + py));
      cx.closePath(); cx.fillStyle = g; cx.fill();
    }
    cx.fillStyle = 'rgba(160,150,140,.55)';
    for (const f of flecks) cx.fillRect(f.x, f.y, f.s, f.s);
  }

  /* ---------- embers across the whole page ---------- */
  const cv = $('#embers'), ctx = cv.getContext('2d');
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 32;
  { const s = sprite.getContext('2d'), g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,246,228,1)'); g.addColorStop(.25, 'rgba(255,179,107,.9)');
    g.addColorStop(.5, 'rgba(255,90,31,.45)'); g.addColorStop(1, 'rgba(255,90,31,0)');
    s.fillStyle = g; s.fillRect(0, 0, 32, 32); }
  let W = 0, H = 0, parts = [];
  const MAX = () => (innerWidth < 700 ? 22 : 45);
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildCoals();
  }
  function spawn(x, y, vx, vy, life, s) { parts.push({ x, y, vx, vy, life, max: life, s, ph: Math.random() * 6 }); }
  function ambient(startAnywhere) {
    spawn(Math.random() * W, startAnywhere ? Math.random() * H : H + 10,
      (Math.random() - .5) * .3, -(.35 + Math.random() * .9), 260 + Math.random() * 360, 1 + Math.random() ** 3 * 4);
  }
  size();
  addEventListener('resize', size);

  if (reduce) { drawCoals(0); return; } // calm: still coals, no drifting embers

  for (let i = 0; i < MAX(); i++) ambient(true);

  addEventListener('pointermove', e => {
    pointerX = e.clientX; pointerY = e.clientY;
    if (e.pointerType === 'mouse') for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2, sp = .6 + Math.random() * 2.2;
      spawn(e.clientX, e.clientY, Math.cos(a) * sp, Math.sin(a) * sp - .6, 40 + Math.random() * 50, 1.5 + Math.random() * 2.5);
    }
    for (const p of parts) {
      const dx = p.x - e.clientX, dy = p.y - e.clientY, d2 = dx * dx + dy * dy;
      if (d2 < 14400 && d2 > 1) { const d = Math.sqrt(d2), f = (120 - d) / 120 * 1.4; p.vx += dx / d * f; p.vy += dy / d * f; }
    }
    queue();
  }, { passive: true });

  let lastY = scrollY;
  addEventListener('scroll', () => {
    const d = scrollY - lastY; lastY = scrollY;
    const push = Math.min(Math.abs(d), 120);
    for (const p of parts) p.vy -= push * .012;
    for (let i = 0; i < push / 14 && parts.length < MAX() * 2.2; i++) ambient(false);
  }, { passive: true });

  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(coalCv);

  let t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    if (heroVisible) drawCoals(t);
    ctx.clearRect(0, 0, W, H);
    if (parts.length < MAX() && Math.random() < .5) ambient(false);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life--;
      p.vx = p.vx * .97 + Math.sin(t * 1.3 + p.ph) * .02;
      p.vy = p.vy * .975 - .012;
      p.x += p.vx; p.y += p.vy;
      if (p.life <= 0 || p.y < -30 || p.x < -30 || p.x > W + 30) { parts.splice(i, 1); continue; }
      const k = p.life / p.max, flick = .7 + Math.sin(t * 9 + p.ph * 5) * .3;
      ctx.globalAlpha = Math.min(1, k * 1.6) * flick;
      const s = p.s * (0.6 + k * .6) * 2.4;
      ctx.drawImage(sprite, p.x - s, p.y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
