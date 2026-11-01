/* 首頁主視覺：粒子「100」→ 清楚的照片 → 臺灣（WP1）
   1. 幾千顆粒子從星空聚成「100」（顏色取自三張照片：1＝早年、0＝南港初期、0＝今日）
   2. 粒子淡出，換成清楚的大照片；三個數字各自輪播同年代的照片，滑鼠移動時「100」微微立體傾斜
   3. 照片散回粒子，流動變成金色臺灣島，再回到「100」（換下一組照片）
   暫停鈕可凍結；減少動態效果時直接顯示靜止的照片「100」。純 Canvas 2D＋SVG，不用外部套件。 */

const VW = 760, VH = 340;                                            // 「100」的座標系
const ONE = "M44,98 L128,40 L184,40 L184,300 L110,300 L110,128 L44,156 Z";
const RINGS = [330, 610], RX = 92, RY = 120, SW = 80, CY = 170;
const BOXES = [[44, 40, 140, 260], ...RINGS.map(cx => [cx - RX - SW / 2, CY - RY - SW / 2, 2 * (RX + SW / 2), 2 * (RY + SW / 2)])];
const TW_LL = [[121.54, 25.30], [121.74, 25.16], [122.00, 25.01], [121.86, 24.60], [121.70, 24.25], [121.60, 23.98],
  [121.48, 23.50], [121.38, 23.10], [121.15, 22.76], [120.90, 22.36], [120.85, 21.92], [120.73, 21.95],
  [120.62, 22.30], [120.42, 22.48], [120.26, 22.65], [120.10, 23.00], [120.10, 23.30], [120.20, 23.70],
  [120.40, 24.10], [120.70, 24.55], [120.95, 24.88], [121.15, 25.08], [121.38, 25.20]];
const T_GATHER = 2300, T_PHOTO = 9000, T_TW = 6000, T_SWAP = 2600;

const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
const toneOf = y => (y < 1960 ? "sepia(.7) contrast(1.05)" : y < 2000 ? "grayscale(.55) sepia(.2)" : "saturate(1.1)");

function taiwanPath(x, y, h) {
  const k = h / (25.30 - 21.92);
  const pts = TW_LL.map(([lon, lat]) => [x + (lon - 120.10) * 0.915 * k, y + (25.30 - lat) * k]);
  const p = new Path2D(); const n = pts.length; p.moveTo(...pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n], t = .45 / 3;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t, p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t, p2[0], p2[1]);
  }
  p.closePath(); return { path: p, w: (122.00 - 120.10) * 0.915 * k };
}
function drawDigits(o) {
  o.fill(new Path2D(ONE));
  o.lineWidth = SW;
  RINGS.forEach(cx => { o.beginPath(); o.ellipse(cx, CY, RX, RY, 0, 0, Math.PI * 2); o.stroke(); });
}
function cover(c, im, x, y, w, h) {
  const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
  c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
}

export async function particleHero({ hero, region, captionEl, captions, photos, reduced, isPaused }) {
  /* 三段年代的照片：1＝最早三分之一、第一個 0＝中間、第二個 0＝最近 */
  const loaded = (await Promise.all(photos.map(p => loadImg(p.src)))).map((im, i) => im && { ...photos[i], im }).filter(Boolean);
  const third = Math.ceil(loaded.length / 3);
  const pools = [loaded.slice(0, third), loaded.slice(third, third * 2), loaded.slice(third * 2)].map(p => (p.length ? p : loaded));
  const cur = [0, 0, 0];

  /* ---------- 照片層（SVG，疊在 region 上，和粒子的「100」位置完全重疊） ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const ov = document.createElementNS(NS, "svg");
  ov.setAttribute("viewBox", `0 0 ${VW} ${VH}`); ov.setAttribute("preserveAspectRatio", "xMidYMid meet");
  ov.setAttribute("class", "p-home-photo100"); ov.setAttribute("aria-hidden", "true"); ov.setAttribute("focusable", "false");
  const ring = cx => `<ellipse cx="${cx}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="#fff" stroke-width="${SW}"/>`;
  ov.innerHTML = `<defs>
    <clipPath id="ph0"><path d="${ONE}"/></clipPath>
    <mask id="ph1" maskUnits="userSpaceOnUse" x="0" y="0" width="${VW}" height="${VH}">${ring(RINGS[0])}</mask>
    <mask id="ph2" maskUnits="userSpaceOnUse" x="0" y="0" width="${VW}" height="${VH}">${ring(RINGS[1])}</mask></defs>
    ${[0, 1, 2].map(d => `<g ${d === 0 ? 'clip-path="url(#ph0)"' : `mask="url(#ph${d})"`}>
      <image class="ph-a is-on" x="${BOXES[d][0]}" y="${BOXES[d][1]}" width="${BOXES[d][2]}" height="${BOXES[d][3]}" preserveAspectRatio="xMidYMid slice"/>
      <image class="ph-b" x="${BOXES[d][0]}" y="${BOXES[d][1]}" width="${BOXES[d][2]}" height="${BOXES[d][3]}" preserveAspectRatio="xMidYMid slice"/></g>`).join("")}
    <g fill="none" stroke="#d4b06a" stroke-width="1.2" opacity=".8">
      <path d="${ONE}" transform="translate(8 8)"/>
      ${RINGS.map(cx => `<ellipse cx="${cx + 8}" cy="${CY + 8}" rx="${RX + SW / 2}" ry="${RY + SW / 2}"/><ellipse cx="${cx + 8}" cy="${CY + 8}" rx="${RX - SW / 2}" ry="${RY - SW / 2}"/>`).join("")}
    </g>`;
  region.prepend(ov);
  const layers = [...ov.querySelectorAll("g[clip-path], g[mask]")].map(g => [...g.querySelectorAll("image")]);
  const setPhoto = (d, idx, instant) => {
    const ph = pools[d][idx % pools[d].length];
    const [a, b] = layers[d], on = a.classList.contains("is-on") ? a : b, off = on === a ? b : a;
    const target = instant ? on : off;
    target.setAttribute("href", ph.src); target.style.filter = toneOf(ph.year);
    if (!instant) { off.classList.add("is-on"); on.classList.remove("is-on"); }
  };
  [0, 1, 2].forEach(d => setPhoto(d, cur[d], true));

  /* ---------- 粒子層（canvas，鋪滿主視覺） ---------- */
  const canvas = document.createElement("canvas");
  canvas.className = "p-home-particles"; canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, geo = null, parts = [], hundredMask = [], taiwanT = [];
  let stage = "gather", stageAt = performance.now(), lastSwap = 0, swapDigit = 0, mouse = { x: -9999, y: -9999 };

  function geometry() {
    const hr = hero.getBoundingClientRect(), rr = region.getBoundingClientRect();
    W = Math.round(hr.width); H = Math.round(hr.height); dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
    const rx = rr.left - hr.left, ry = rr.top - hr.top, rw = rr.width, rh = rr.height;
    const s = Math.min(rw / VW, rh / VH);
    return { rx, ry, rw, rh, s, ox: rx + (rw - VW * s) / 2, oy: ry + (rh - VH * s) / 2, step: Math.max(4, Math.round(VW * s / 190)) };
  }

  /* 「100」的粒子位置（固定）＋依目前三張照片取顏色 */
  function hundredTargets() {
    const { s, ox, oy, step } = geo;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.setTransform(s, 0, 0, s, ox, oy);
    [0, 1, 2].forEach(d => {
      const ph = pools[d][cur[d] % pools[d].length];
      x.filter = toneOf(ph.year);
      const [bx, by, bw, bh] = BOXES[d];
      cover(x, ph.im, bx, by, bw, bh);
    });
    const col = x.getImageData(0, 0, W, H).data;
    return hundredMask.map(([px, py]) => { const k = (py * W + px) * 4; return { x: px, y: py, r: col[k], g: col[k + 1], b: col[k + 2] }; });
  }

  function build() {
    geo = geometry();
    const { s, ox, oy, step, rx, ry, rw, rh } = geo;
    const m = document.createElement("canvas"); m.width = W; m.height = H;
    const o = m.getContext("2d");
    o.setTransform(s, 0, 0, s, ox, oy); o.fillStyle = "#fff"; o.strokeStyle = "#fff"; drawDigits(o);
    const md = o.getImageData(0, 0, W, H).data;
    hundredMask = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (md[(y * W + x) * 4 + 3] > 128) hundredMask.push([x, y]);
    o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
    const th = rh * .98, tw = taiwanPath(0, 0, th).w;
    o.fill(taiwanPath(rx + (rw - tw) / 2, ry + (rh - th) / 2, th).path);
    const td = o.getImageData(0, 0, W, H).data;
    taiwanT = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
      if (td[(y * W + x) * 4 + 3] > 128) { const g = Math.random(); taiwanT.push({ x, y, r: 212 + g * 40, g: 176 + g * 50, b: 106 + g * 90 }); }
    }
    const N = Math.max(hundredMask.length, taiwanT.length), size = Math.max(2, step * .7), old = parts;
    parts = Array.from({ length: N }, (_, i) => old[i] || { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, r: 255, g: 255, b: 255, seed: Math.random() * 6.28 });
    parts.forEach(p => { p.size = size; });
    assign(stage === "tw" ? taiwanT : hundredTargets());
  }

  function assign(list) {
    if (!list.length) return;
    parts.forEach((p, i) => { const t = list[(i * 7919) % list.length]; p.tx = t.x; p.ty = t.y; p.tr = t.r; p.tg = t.g; p.tb = t.b; });
  }
  function setStage(st, now) {
    stage = st; stageAt = now;
    hero.classList.toggle("is-photo", st === "photo");
    if (captionEl) captionEl.textContent = st === "tw" ? captions.taiwan : captions.hundred;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) { ctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`; ctx.fillRect(p.x, p.y, p.size, p.size); }
  }
  function physics(t) {
    for (const p of parts) {
      const tx = p.tx + Math.cos(t * 1.3 + p.seed) * .8, ty = p.ty + Math.sin(t * 1.1 + p.seed) * .8;
      p.vx += (tx - p.x) * 0.02; p.vy += (ty - p.y) * 0.02;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 9000) { const f = (9000 - d2) / 9000 * 2.4, d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
      p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx; p.y += p.vy;
      p.r += (p.tr - p.r) * .07; p.g += (p.tg - p.g) * .07; p.b += (p.tb - p.b) * .07;
    }
  }

  function loop(now) {
    if (!isPaused() && !document.hidden) {
      const el = now - stageAt;
      if (stage === "gather" && el > T_GATHER) { setStage("photo", now); lastSwap = now; }   // 先停留，讓照片和粒子是同一張
      else if (stage === "photo") {
        if (now - lastSwap > T_SWAP) { lastSwap = now; cur[swapDigit] += 1; setPhoto(swapDigit, cur[swapDigit], false); swapDigit = (swapDigit + 1) % 3; }
        if (el > T_PHOTO) { assign(hundredTargets()); parts.forEach(p => { p.r = p.tr; p.g = p.tg; p.b = p.tb; }); setStage("tw", now); setTimeout(() => assign(taiwanT), 700); }
      } else if (stage === "tw" && el > T_TW) { [0, 1, 2].forEach(d => { cur[d] += 1; setPhoto(d, cur[d], true); }); assign(hundredTargets()); setStage("gather", now); }
      if (stage !== "photo") { physics(now / 1000); draw(); }
    }
    requestAnimationFrame(loop);
  }

  build();
  if (reduced) {
    setStage("photo", performance.now());          // 減少動態效果：直接顯示清楚的照片「100」
  } else {
    hero.addEventListener("pointermove", e => {
      const r = canvas.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      // 照片狀態時，「100」跟著滑鼠微微立體傾斜
      const rr = region.getBoundingClientRect(), nx = (e.clientX - rr.left) / rr.width - .5, ny = (e.clientY - rr.top) / rr.height - .5;
      ov.style.transform = `perspective(1200px) rotateY(${nx * 10}deg) rotateX(${-ny * 8}deg)`;
    });
    hero.addEventListener("pointerleave", () => { mouse = { x: -9999, y: -9999 }; ov.style.transform = ""; });
    requestAnimationFrame(loop);
  }
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 200); });
}
