/* 百年禮品（WP8）：商品型錄＋商品頁（不含購物車與金流）
   - 列表：商品卡（滑過換成另一個顏色）、色點、價格、一句說明
   - 點商品打開「商品頁」：大圖＋其他角度縮圖、顏色切換、尺寸（T 恤有「尺寸試穿」）、規格、販售地點
   - 網址帶 #商品代號（例如 gifts.html#tee），可直接分享某一個商品 */
import { boot } from "../core/page.js";
import { load } from "../core/content.js";
import { t, pick } from "../core/i18n.js";
import { reveal } from "../core/motion.js";
import { el, bi, img } from "../components/dom.js";
import { openModal } from "../components/modal.js";
import { pageHead } from "../components/pagehead.js";

const { main } = await boot("gifts");
const gifts = await load("gifts");
main.append(await pageHead("gifts", { image: { src: "assets/img/photos/campus-lawn.jpg", alt: { zh: "", en: "" }, width: 1200, height: 800 } }));

/* ---------- 商品列表 ---------- */
const ul = el("ul", { class: "p-gift-grid", role: "list", "aria-label": t("page.gifts") });
gifts.forEach(g => {
  const [v1, v2] = g.variants;
  const media = el("span", { class: "p-gift-card__media" }, img(v1.views[0]));
  if (v2) { const alt = img(v2.views[0]); alt.alt = ""; alt.classList.add("p-gift-card__alt"); media.append(alt); }
  const btn = el("button", { type: "button", class: "p-gift-card", "aria-haspopup": "dialog" }, [
    media,
    el("span", { class: "p-gift-card__body" }, [
      el("span", { class: "p-gift-card__dots", "aria-hidden": "true" }, g.variants.map(v => el("i", { style: `background:${v.swatch}` }))),
      bi("span", g.name, { class: "p-gift-card__name" }),
      bi("span", g.summary, { class: "p-gift-card__sum" }),
      el("span", { class: "p-gift-card__foot" }, [bi("span", g.price_note, { class: "p-gift-card__price" }), el("span", { class: "p-gift-card__more", text: `${t("view_product")} →` })]),
    ]),
  ]);
  btn.addEventListener("click", () => openProduct(g, btn));
  ul.append(el("li", { class: "js-reveal" }, btn));
});
main.append(el("section", { class: "c-light l-section" }, el("div", { class: "l-container" }, [ul, el("p", { class: "p-gift-note", text: t("no_shop") })])));
reveal();

/* ---------- 尺寸試穿：用身高推估體型，畫出人形與 T 恤 ---------- */
function tryOnFigure(height, s, color = "#1d2b4a") {
  const k = 1.5, feet = 318, Hpx = height * k;
  const bodyChest = height * 0.28;                       // 平放胸寬（cm），用身高粗估
  const cx = 130, r = Hpx * 0.065, headY = feet - Hpx + r;
  const shoulderY = feet - Hpx * 0.81;
  const bw = bodyChest * k * 1.05, sw = s.chest * k * 1.05, sl = s.length * k;
  const legTop = feet - Hpx * 0.47;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 260 330"); svg.setAttribute("aria-hidden", "true"); svg.classList.add("p-tryon__fig");
  svg.innerHTML = `
    <line x1="10" y1="${feet}" x2="250" y2="${feet}" stroke="#c9ced8" stroke-width="2"/>
    <rect x="${cx - bw * .42}" y="${legTop}" width="${bw * .38}" height="${feet - legTop}" rx="8" fill="#9aa6b8"/>
    <rect x="${cx + bw * .04}" y="${legTop}" width="${bw * .38}" height="${feet - legTop}" rx="8" fill="#9aa6b8"/>
    <rect x="${cx - bw / 2 - 14}" y="${shoulderY + 6}" width="14" height="${Hpx * .36}" rx="7" fill="#d9c2a5"/>
    <rect x="${cx + bw / 2}" y="${shoulderY + 6}" width="14" height="${Hpx * .36}" rx="7" fill="#d9c2a5"/>
    <rect x="${cx - bw / 2}" y="${shoulderY}" width="${bw}" height="${legTop - shoulderY + 6}" rx="14" fill="#b9c2d0"/>
    <circle cx="${cx}" cy="${headY}" r="${r}" fill="#d9c2a5"/>
    <path d="M${cx - sw / 2} ${shoulderY - 2} L${cx - sw / 2 - 22} ${shoulderY + 34} L${cx - sw / 2 - 6} ${shoulderY + 44} L${cx - sw / 2} ${shoulderY + 30}
             L${cx - sw / 2} ${shoulderY + sl} Q${cx} ${shoulderY + sl + 6} ${cx + sw / 2} ${shoulderY + sl} L${cx + sw / 2} ${shoulderY + 30}
             L${cx + sw / 2 + 6} ${shoulderY + 44} L${cx + sw / 2 + 22} ${shoulderY + 34} L${cx + sw / 2} ${shoulderY - 2}
             Q${cx} ${shoulderY + 12} ${cx - sw / 2} ${shoulderY - 2} Z" fill="${color}" stroke="#8a94a6" stroke-width="1.5" opacity=".95"/>
    <text x="250" y="${headY - r + 4}" text-anchor="end" font-size="12" fill="#5b6475">${height} cm</text>`;
  return { svg, ease: s.chest - bodyChest };
}
function fitKey(ease) { return ease < 3 ? "tight" : ease < 6 ? "fit" : ease < 9 ? "loose" : "xloose"; }
function tryOnPanel(g, getSize, getColor) {
  const heights = [155, 165, 175, 185];
  let h = 175;
  const box = el("section", { class: "p-tryon", "aria-labelledby": `to-${g.id}` });
  const stage = el("div", { class: "p-tryon__stage" });
  const verdict = el("p", { class: "p-tryon__verdict", "aria-live": "polite" });
  const hBtns = el("div", { class: "c-seg", role: "group", "aria-label": t("your_height") });
  const render = () => {
    const s = g.sizes.find(x => x.size === getSize());
    const { svg, ease } = tryOnFigure(h, s, getColor());
    stage.replaceChildren(svg);
    const rec = g.sizes.find(x => x.chest - h * 0.28 >= 3) || g.sizes[g.sizes.length - 1];
    verdict.replaceChildren(
      el("strong", { text: `${h} cm × ${s.size}：${t(`fit.${fitKey(ease)}`)}` }),
      el("span", { text: `　${t("recommended")} ${rec.size}` }),
    );
    hBtns.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.h) === h)));
  };
  heights.forEach(v => {
    const b = el("button", { type: "button", "data-h": String(v), text: `${v}` });
    b.addEventListener("click", () => { h = v; render(); });
    hBtns.append(b);
  });
  const table = el("table", { class: "p-tryon__table" }, [
    el("thead", {}, el("tr", {}, [el("th", { scope: "col", text: t("size") }), ...g.sizes.map(s => el("th", { scope: "col", text: s.size }))])),
    el("tbody", {}, [
      el("tr", {}, [el("th", { scope: "row", text: t("chest_w") }), ...g.sizes.map(s => el("td", { text: String(s.chest) }))]),
      el("tr", {}, [el("th", { scope: "row", text: t("body_len") }), ...g.sizes.map(s => el("td", { text: String(s.length) }))]),
    ]),
  ]);
  box.append(
    el("h3", { id: `to-${g.id}`, text: t("try_on") }),
    el("div", { class: "p-tryon__row" }, [el("span", { class: "p-gift-label", text: t("your_height") }), hBtns]),
    el("div", { class: "p-tryon__body" }, [stage, el("div", {}, [verdict, el("p", { class: "p-tryon__note", text: t("try_on_note") }), el("p", { class: "p-gift-label", text: t("size_chart") }), table])]),
  );
  render();
  return { element: box, render };
}

/* ---------- 商品頁 ---------- */
let current = null;                                  // 目前打開的商品（換網址時先關掉）
function openProduct(g, opener) {
  let vi = 0, view = 0, size = g.sizes ? (g.sizes[1] || g.sizes[0]).size : null;
  const wrap = el("div", { class: "p-gift-sheet" });
  const stageImg = el("div", { class: "p-gift-sheet__stage" });
  const thumbs = el("div", { class: "p-gift-sheet__thumbs", role: "group", "aria-label": t("views") });
  const left = el("div", { class: "p-gift-sheet__media" }, [stageImg, thumbs]);
  const right = el("div", { class: "p-gift-sheet__info" });
  let tryOn = null;

  const draw = () => {
    const v = g.variants[vi];
    stageImg.replaceChildren(img(v.views[view], { lazy: false }));
    thumbs.replaceChildren(...v.views.map((im, i) => {
      const b = el("button", { type: "button", class: "p-gift-sheet__thumb", "aria-pressed": String(i === view), "aria-label": pick(g.view_labels[i]) }, [img(im), bi("span", g.view_labels[i])]);
      b.addEventListener("click", () => { view = i; draw(); });
      return b;
    }));
    swatches.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === vi)));
    colorName.textContent = pick(v.label);
    if (sizeBtns) sizeBtns.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.textContent === size)));
    if (tryOn) tryOn.render();
  };

  // 顏色
  const colorName = el("span", { class: "p-gift-sheet__colorname" });
  const swatches = el("div", { class: "p-gift-swatches", role: "group", "aria-label": t("color") });
  g.variants.forEach((v, i) => {
    const b = el("button", { type: "button", class: "p-gift-swatch", style: `--sw:${v.swatch}`, "aria-label": pick(v.label) });
    b.addEventListener("click", () => { vi = i; draw(); });
    swatches.append(b);
  });
  right.append(
    bi("p", g.price_note, { class: "p-gift-sheet__price" }),
    bi("p", g.desc, { class: "p-gift-sheet__desc" }),
  );
  // 只有一種顏色的商品（筆、積木）不顯示顏色選擇
  if (g.variants.length > 1) right.append(el("div", { class: "p-gift-sheet__opt" }, [el("p", { class: "p-gift-label" }, [el("span", { text: `${t("color")}：` }), colorName]), swatches]));
  // 尺寸＋試穿（只有衣服）
  let sizeBtns = null;
  if (g.sizes) {
    sizeBtns = el("div", { class: "c-seg p-gift-sizes", role: "group", "aria-label": t("size") });
    g.sizes.forEach(s => {
      const b = el("button", { type: "button", text: s.size });
      b.addEventListener("click", () => { size = s.size; draw(); });
      sizeBtns.append(b);
    });
    right.append(el("div", { class: "p-gift-sheet__opt" }, [el("p", { class: "p-gift-label", text: t("size") }), sizeBtns]));
    tryOn = tryOnPanel(g, () => size, () => g.variants[vi].swatch);
  }
  // 規格、販售地點
  const dl = el("dl", { class: "p-gift-specs" });
  g.specs.forEach(([k, v]) => dl.append(el("div", {}, [bi("dt", k), bi("dd", v)])));
  dl.append(el("div", {}, [el("dt", { text: t("where_to_buy") }), bi("dd", g.where_to_buy)]));
  right.append(el("h3", { class: "p-gift-sheet__h", text: t("specs") }), dl, el("p", { class: "p-gift-note", text: t("no_shop") }));

  wrap.append(left, right);
  if (tryOn) wrap.append(tryOn.element);
  draw();
  const modal = openModal({ title: g.name, content: wrap, opener });
  current = { id: g.id, close: () => modal.close() };
  modal.dialog.classList.add("c-modal__dialog--wide", "p-gift-dialog");
  history.replaceState(null, "", `#${g.id}`);
  const clear = () => history.replaceState(null, "", location.pathname + location.search);
  modal.dialog.closest(".c-modal").addEventListener("click", e => { if (e.target.classList.contains("c-modal")) clear(); });
  modal.dialog.querySelector(".c-modal__close").addEventListener("click", clear);
  document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { clear(); document.removeEventListener("keydown", esc); } });
}

// 網址帶 #商品代號 時直接打開（載入時，以及在同一頁改網址時）
const openFromHash = () => {
  const i = gifts.findIndex(g => g.id === location.hash.slice(1));
  if (i < 0) return;
  const open = document.querySelector(".p-gift-dialog");
  if (open && current && current.id === gifts[i].id) return;
  if (open && current) current.close();
  openProduct(gifts[i], ul.querySelectorAll(".p-gift-card")[i]);
};
openFromHash();
addEventListener("hashchange", openFromHash);
