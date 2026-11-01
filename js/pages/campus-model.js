/* 百年院區的「時間大道」（純 CSS 3D，不用外部套件）
   - 不是地圖：一條路就是時間軸（1950 → 今日），建築依興建年份沿路排列，左右交錯，不代表實際位置
   - setYear(y, 上一章年份)：已蓋好的建築長出來，這一章新蓋的變金色；鏡頭沿著路移到那一年
   - setYear(y, from, { overview: true })：拉遠看整條大道；{ zoom: 2 }：拉近看
   - 可拖曳或按按鈕旋轉；減少動態時不做動畫 */
import { t, pick } from "../core/i18n.js";
import { el } from "../components/dom.js";

const Y0 = 1948, Y1 = 2032, PX = 15;           // 每一年 15px
const PAD = 40, L = (Y1 - Y0) * PX + PAD * 2, DEPTH = 320;
const ROAD = [142, 178];                         // 路的上下緣
const xOf = y => PAD + (y - Y0) * PX;
const VIEW_RZ = -66, OVERVIEW_RZ = -22;          // 預設沿路往前看；全景時轉側面

export function campusModel(model, { reduced = false } = {}) {
  const root = el("div", { class: "p-cm" });
  const world = el("div", { class: "p-cm-world", style: `width:${L}px;height:${DEPTH}px;margin:-${DEPTH / 2 + 20}px 0 0 -${L / 2}px` });
  root.append(world);
  if (reduced) root.classList.add("is-static");

  // 地面：路＋每 10 年一條刻度線與年份
  const ticks = [];
  for (let y = 1950; y <= 2030; y += 10) ticks.push(y);
  const ground = el("div", { class: "p-cm-ground" });
  ground.innerHTML = `<svg viewBox="0 0 ${L} ${DEPTH}" width="${L}" height="${DEPTH}" aria-hidden="true">
    ${ticks.map(y => `<line x1="${xOf(y)}" y1="14" x2="${xOf(y)}" y2="${DEPTH - 40}" stroke="#d4b06a" stroke-opacity=".22" stroke-dasharray="2 6"/>
      <text x="${xOf(y)}" y="${DEPTH - 22}" text-anchor="middle" transform="rotate(45 ${xOf(y)} ${DEPTH - 22})" font-family="Georgia, serif" font-size="30" fill="#d4b06a" fill-opacity=".75">${y}</text>`).join("")}
    <rect x="0" y="${ROAD[0]}" width="${L}" height="${ROAD[1] - ROAD[0]}" fill="#26344a"/>
    <line x1="0" y1="${(ROAD[0] + ROAD[1]) / 2}" x2="${L}" y2="${(ROAD[0] + ROAD[1]) / 2}" stroke="#8a97ab" stroke-opacity=".6" stroke-dasharray="10 12"/>
  </svg>`;
  world.append(ground);
  // 「現在看到的年份」：一道金光橫過路面
  const nowLine = el("i", { class: "p-cm-now" });
  world.append(nowLine);

  const box = (b, cls, parent = world) => {
    const lift = b.z ? `;transform:translateZ(${b.z}px)` : "";   // z：離地高度（例如車身架在輪子上）
    const node = el("div", { class: `p-cm-b ${cls || ""}`, style: `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.d}px;--h:${b.h}px${lift}` });
    ["t", "n", "s", "e", "w"].forEach(f => node.append(el("i", { class: `p-cm-f p-cm-${f}` })));
    parent.append(node);
    return node;
  };

  // 行道樹：路兩旁，純裝飾
  for (let x = PAD; x < L - PAD; x += 52) {
    [18, DEPTH - 66].forEach((y, k) => box({ x: x + k * 26, y, w: 10, d: 10, h: 12 + ((x / 52) % 3) * 3 }, "is-tree is-up"));
  }

  /* 有院史照片的建築，照照片做簡化外觀（kind）；其他是普通方塊。
     回傳組成的方塊（相對於建築左上角）；front 是面向路的那一邊（0＝下緣、1＝上緣） */
  function partsOf(b, front) {
    const { w, d, h } = b;
    const fy = front ? -8 : d;                     // 雨庇放在面向路的那一邊
    switch (b.kind) {
      case "gate":                                 // 1950 年代：路兩側各一根門柱＋矮牆
        return [{ x: 0, y: 0, w: 7, d: 7, h, skin: "pillar" }, { x: 0, y: d - 7, w: 7, d: 7, h, skin: "pillar" },
          { x: 1, y: -24, w: 4, d: 24, h: h * .4, skin: "wall" }, { x: 1, y: d, w: 4, d: 24, h: h * .4, skin: "wall" }];
      case "gate-wide":                            // 拓寬後：更寬、四根門柱
        return [{ x: 0, y: -10, w: 8, d: 8, h, skin: "pillar" }, { x: 0, y: d + 2, w: 8, d: 8, h, skin: "pillar" },
          { x: 0, y: -26, w: 6, d: 6, h: h * .7, skin: "pillar" }, { x: 0, y: d + 20, w: 6, d: 6, h: h * .7, skin: "pillar" },
          { x: 1, y: -50, w: 4, d: 24, h: h * .35, skin: "wall" }, { x: 1, y: d + 26, w: 4, d: 24, h: h * .35, skin: "wall" }];
      case "store":                                // 1954 庫房：長長一層樓、一排窗
        return [{ x: 0, y: 0, w, d, h, skin: "store" }];
      case "math":                                 // 數學館：高瘦板樓、粉紅直條、入口雨庇
        return [{ x: 0, y: 0, w, d, h, skin: "math" }, { x: w * .3, y: fy, w: w * .4, d: 8, h: 7, skin: "canopy-light" }];
      case "chem":                                 // 化學館：寬板樓、紅磚橫帶＋灰色柱、屋頂梯間
        return [{ x: 0, y: 0, w, d, h, skin: "chem" }, { x: w * .42, y: d * .3, w: w * .16, d: d * .4, h: h + 9, skin: "concrete" }];
      case "phys":                                 // 物理館：L 形、白牆紅窗、深紅入口
        return [{ x: 0, y: 0, w: w * .56, d, h, skin: "phys" }, { x: w * .56, y: front ? 0 : d * .4, w: w * .44, d: d * .6, h: h - 9, skin: "phys" },
          { x: w * .36, y: fy, w: w * .3, d: 8, h: 8, skin: "canopy-red" }];
      case "bus":                                  // 1955 交通車：長車廂＋較矮的引擎鼻、前輪擋泥板（車頭朝向未來）
        {
          const z = h * .22;                       // 車身離地，下面露出車輪
          return [{ x: 0, y: 0, w: w * .74, d, h: h - z, z, skin: "bus" },
            { x: w * .74, y: d * .18, w: w * .24, d: d * .64, h: h * .5 - z * .5, z: z * .5, skin: "bus-hood" },
            { x: w * .72, y: -2, w: w * .22, d: d * .18 + 2, h: h * .14, z: h * .3, skin: "bus-fender" },
            { x: w * .72, y: d * .82, w: w * .22, d: d * .18 + 2, h: h * .14, z: h * .3, skin: "bus-fender" }];
        }
      default:
        return [{ x: 0, y: 0, w, d, h }];
    }
  }

  // 建築：依年份排在路的上下兩側，同一側擠在一起時往後挪；大門跨在路上
  const end = [0, 0];
  const gates = model.filter(b => /^gate/.test(b.kind)).map(b => xOf(b.since));
  let n = 1;                                       // 第一棟放路的下側，名稱才不會和大門疊在一起
  const blds = [...model].sort((a, b) => a.since - b.since).map((b, i) => {
    let x, y, side = 0, d = b.d;
    if (/^gate/.test(b.kind)) {
      x = xOf(b.since); y = ROAD[0] - 2; d = ROAD[1] - ROAD[0] + 4;
    } else if (b.kind === "bus") {                 // 交通車停在路上（靠下側車道）
      x = xOf(b.since) - b.w / 2; y = ROAD[1] - b.d - 3;
    } else {
      side = n++ % 2;
      x = Math.max(xOf(b.since) - b.w / 2, end[side] + 10);
      gates.forEach(gx => { if (x < gx + 30 && x + b.w > gx - 30) x = gx + 30; });   // 大門兩旁留空，才看得到
      end[side] = x + b.w;
      y = side ? ROAD[1] + 16 : ROAD[0] - 16 - b.d;
    }
    const g = { ...b, d };
    const shadow = el("i", { class: "p-cm-shadow", style: `left:${x}px;top:${y}px;width:${b.w}px;height:${d}px` });
    world.insertBefore(shadow, nowLine);
    const node = el("div", { class: `p-cm-g${b.kind ? " has-look" : ""}`, style: `left:${x}px;top:${y}px` });
    partsOf(g, side).forEach(p => box(p, p.skin ? `is-${p.skin}` : "", node));
    if (b.kind === "bus") {                        // 車輪：立起來的圓盤，前後各一對
      const r = b.h * .3;
      [[b.w * .83, -2.5], [b.w * .83, b.d + 2.5], [b.w * .2, -2.5], [b.w * .2, b.d + 2.5]]   /* 車輪貼在車身外側，不然會被車身蓋住一半 */.forEach(([cx, cy]) =>
        node.append(el("i", { class: "p-cm-wheel", style: `left:${cx - r}px;top:${cy - r}px;width:${r * 2}px;height:${r * 2}px;transform:translateZ(${r}px) rotateX(90deg)` })));
    }
    world.append(node);
    let label = null;
    if (b.name) {
      label = el("span", { class: "p-cm-label", style: `left:${x + b.w / 2}px;top:${y + d / 2}px;--h:${b.h}px`, text: pick(b.name) });
      world.append(label);
    }
    return { b, node, label, shadow };
  });

  let lastView = VIEW_RZ;
  function setYear(year, from = -Infinity, { overview = false, zoom = 1, rz: viewRz } = {}) {
    // 章節換視角時才轉（例如交通車那章從車頭斜前方看）；同一個視角下保留使用者自己轉的角度
    const target = viewRz ?? (overview ? OVERVIEW_RZ : VIEW_RZ);
    if (target !== lastView) { setRz(target); lastView = target; }
    blds.forEach(({ b, node, label, shadow }, i) => {
      const up = b.since <= year;
      const isNew = up && b.since > from;
      node.classList.toggle("is-up", up);
      node.classList.toggle("is-new", isNew);
      shadow.classList.toggle("is-on", up);
      shadow.classList.toggle("is-new", isNew && !!b.kind);
      if (label) label.classList.toggle("is-on", isNew && !overview);
      node.style.transitionDelay = isNew ? `${(i % 5) * 0.1 + 0.3}s` : "0s";
    });
    const fx = overview ? L / 2 + 110 : xOf(Math.min(year, Y1 - 6));   // 全景時往左挪，讓出右邊的文字卡片
    root.style.setProperty("--tx", `${L / 2 - fx}px`);
    root.style.setProperty("--zoom", overview ? ".42" : String(zoom));   // zoom：某一章想拉近看（例如交通車）
    nowLine.style.left = `${xOf(Math.min(year, 2028))}px`;
    nowLine.classList.toggle("is-hidden", overview);
  }

  // 旋轉
  // 預設：站在路上往前看（大門正對鏡頭，越往後的年份越遠）；全景時轉成側面看整條大道
  let rz = VIEW_RZ;
  const setRz = v => { rz = v; root.style.setProperty("--rz", `${rz}deg`); };
  setRz(rz);
  const rotL = el("button", { type: "button", class: "p-cm-btn", "aria-label": t("rotate_left"), text: "↺" });
  const rotR = el("button", { type: "button", class: "p-cm-btn", "aria-label": t("rotate_right"), text: "↻" });
  rotL.addEventListener("click", () => setRz(rz - 30));
  rotR.addEventListener("click", () => setRz(rz + 30));
  const controls = el("div", { class: "p-cm-controls" }, [rotL, el("span", { class: "p-cm-hint", text: t("drag_rotate") }), rotR]);

  let drag = null;
  root.addEventListener("pointerdown", e => { drag = { x: e.clientX, rz }; root.classList.add("is-dragging"); root.setPointerCapture(e.pointerId); });
  root.addEventListener("pointermove", e => { if (drag) setRz(drag.rz + (e.clientX - drag.x) * 0.4); });
  const stop = () => { drag = null; root.classList.remove("is-dragging"); };
  root.addEventListener("pointerup", stop); root.addEventListener("pointercancel", stop);

  // 依舞台大小縮放
  const fit = () => {
    const r = root.getBoundingClientRect();
    const narrow = r.width < 768;
    if (r.width) root.style.setProperty("--s", Math.min(r.width / (narrow ? 640 : 1500), r.height / (narrow ? 1300 : 640)).toFixed(3));
  };
  new ResizeObserver(fit).observe(root);

  return { element: root, controls, setYear };
}
