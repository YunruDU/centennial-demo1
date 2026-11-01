/* 百年大事記（WP3）：時光長廊
   - 上方固定一條 1928–2028 年份軸：分四個時期，捲動時顯示目前年份與進度，點時期跳過去；右邊是關鍵字搜尋
   - 內容分章：每個時期一個大標（年份＋名稱＋一句說明），底下事件左右交錯
   - 事件以舊照片為主角（白邊相片），大年份數字＋標題＋一句說明，點了跳出圖文方塊 */
import { boot } from "../core/page.js";
import { load, sanitize } from "../core/content.js";
import { t, pick, fmtDate, lang, fallbackLang, htmlLang } from "../core/i18n.js";
import { reveal } from "../core/motion.js";
import { el, bi, img } from "../components/dom.js";
import { filterBar, matchText } from "../components/filterbar.js";
import { openModal } from "../components/modal.js";
import { pageHead } from "../components/pagehead.js";

const { main } = await boot("chronicle");
const items = [...(await load("chronicle"))].sort((a, b) => a.year - b.year || String(a.date).localeCompare(String(b.date)));
const START = 1928, END = 2028;
// 時期（示意分期）：起訖年＋ui.json 的名稱與說明
const ERAS = [
  { key: "era1", from: 1928, to: 1948 },
  { key: "era2", from: 1949, to: 1959 },
  { key: "era3", from: 1960, to: 1989 },
  { key: "era4", from: 1990, to: 2028 },
];
const eraOf = it => ERAS.find(e => it.year >= e.from && it.year <= e.to);
const pct = y => ((y - START) / (END - START)) * 100;
const yearText = it => (/s$/.test(String(it.date)) ? (lang === "en" ? String(it.date) : `${parseInt(it.date, 10)} 年代`) : String(it.year));
const plain = html => { const d = document.createElement("div"); d.innerHTML = html; return (d.querySelector("p") || d).textContent; };

main.append(await pageHead("chronicle", { image: { src: "assets/img/photos/campus-aerial.jpg", alt: { zh: "", en: "" }, width: 1600, height: 578 } }));
const box = el("div", { class: "l-container p-chronicle" });
main.append(box);

/* 圖文方塊 */
function openItem(list, i, opener) {
  const it = list[i];
  const content = el("div", { class: "p-chronicle-modal" });
  content.append(el("p", { class: "c-article__meta", text: fmtDate(it.date) }));
  (it.images || []).forEach(image => {
    const fig = el("figure", { class: "c-article__figure" }, img(image, { lazy: false }));
    fig.append(bi("figcaption", image.alt));
    content.append(fig);
  });
  const body = el("div", { class: "c-article__body" });
  const fb = fallbackLang(it.body); if (fb) body.lang = htmlLang(fb);
  body.append(sanitize(pick(it.body)));
  content.append(body);
  const go = d => { modal.close(); openItem(list, (i + d + list.length) % list.length, opener); };
  const prev = el("button", { type: "button", class: "c-btn c-btn--ghost", "aria-label": t("prev_item"), text: "‹" });
  const nxt = el("button", { type: "button", class: "c-btn c-btn--ghost", "aria-label": t("next_item"), text: "›" });
  prev.addEventListener("click", () => go(-1)); nxt.addEventListener("click", () => go(1));
  content.append(el("div", { class: "p-chronicle-modal__nav" }, [prev, el("span", { class: "u-muted", text: `${i + 1} / ${list.length}` }), nxt]));
  const modal = openModal({ title: it.title, content, opener });
  modal.dialog.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
}

/* ---------- 年份軸（固定在頁首下方） ---------- */
const now = el("p", { class: "p-chronicle-rail__now", "aria-live": "off" }, [el("strong", { text: String(START) })]);
const track = el("div", { class: "p-chronicle-rail__track" });
const fill = el("span", { class: "p-chronicle-rail__fill", "aria-hidden": "true" });
const eraNav = el("ol", { class: "p-chronicle-rail__eras", "aria-label": t("jump_to_era") });
ERAS.forEach((e, n) => {
  const a = el("a", { href: `#${e.key}`, class: "p-chronicle-rail__era" }, [
    el("span", { class: "p-chronicle-rail__yrs", text: `${e.from}` }),
    el("span", { class: "p-chronicle-rail__name", text: t(`${e.key}_title`) }),
  ]);
  a.addEventListener("click", ev => {
    const target = document.getElementById(e.key); if (!target) return;
    ev.preventDefault();
    target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    const h = target.querySelector("h2"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  });
  eraNav.append(el("li", { style: `--w:${pct(Math.min(e.to + 1, END)) - pct(e.from)}%`, "data-era": e.key }, a));
});
track.append(fill, eraNav, el("span", { class: "p-chronicle-rail__end", "aria-hidden": "true", text: String(END) }));

const results = el("div", { class: "p-chronicle-results" });
const bar = filterBar({
  fields: [{ type: "search", key: "q", label: t("keyword") }],
  onChange: st => {
    const list = items.filter(it => matchText(st.q, it.title, it.body, String(it.year)));
    bar.setCount(list.length);
    render(list);
  },
});
const rail = el("div", { class: "p-chronicle-rail" }, el("div", { class: "p-chronicle-rail__inner" }, [now, track, bar.element]));
box.append(rail, results);

/* ---------- 章節＋事件 ---------- */
let io;
function render(list) {
  results.replaceChildren();
  if (io) io.disconnect();
  if (!list.length) { results.append(el("p", { class: "c-empty", text: t("no_results") })); return; }
  let side = 0;
  ERAS.forEach((e, n) => {
    const inEra = list.filter(it => eraOf(it) === e);
    if (!inEra.length) return;
    const sec = el("section", { id: e.key, class: "p-chronicle-era", "aria-labelledby": `${e.key}-h` });
    // 章節開頭：左邊大章號，右邊時期名稱＋這段時間的小時間軸（每個點是一筆事件）＋說明，背景淡淡放這個時期的第一張照片
    const bgPhoto = (inEra.find(it => (it.images || []).length) || {}).images;
    const head = el("header", { class: "p-chronicle-era__head js-reveal" });
    if (bgPhoto) { const bg = img(bgPhoto[0]); bg.alt = ""; head.append(el("div", { class: "p-chronicle-era__bg", "aria-hidden": "true" }, bg)); }
    const span = el("div", { class: "p-chronicle-era__span" }, [
      el("span", { class: "p-chronicle-era__from", text: String(e.from) }),
      el("span", { class: "p-chronicle-era__line", "aria-hidden": "true" },
        inEra.map(it => el("i", { style: `left:${((it.year - e.from) / Math.max(1, e.to - e.from)) * 100}%` }))),
      el("span", { class: "p-chronicle-era__to", text: String(e.to) }),
    ]);
    head.append(
      el("p", { class: "p-chronicle-era__no", "aria-hidden": "true", text: String(n + 1).padStart(2, "0") }),
      el("div", { class: "p-chronicle-era__body" }, [
        el("p", { class: "p-chronicle-era__kicker", text: `${t("chapter")} ${String(n + 1).padStart(2, "0")}・${inEra.length} ${t("events_unit")}` }),
        el("h2", { id: `${e.key}-h`, class: "p-chronicle-era__title", text: t(`${e.key}_title`) }),
        span,
        el("p", { class: "p-chronicle-era__desc", text: t(`${e.key}_desc`) }),
      ]),
    );
    sec.append(head);
    const ol = el("ol", { class: "p-chronicle-list", role: "list" });
    inEra.forEach(it => {
      const i = list.indexOf(it);
      const photo = (it.images || [])[0];
      const open = el("button", { type: "button", class: "p-chronicle-more", "aria-haspopup": "dialog", text: t("read_more") });
      open.addEventListener("click", () => openItem(list, i, open));
      const li = el("li", { class: `p-chronicle-ev js-reveal ${side++ % 2 ? "is-right" : "is-left"}${photo ? "" : " is-text"}`, "data-year": String(it.year) });
      if (photo) {
        const pbtn = el("button", { type: "button", class: "p-chronicle-photo", tabindex: "-1", "aria-hidden": "true" }, img(photo));
        pbtn.addEventListener("click", () => openItem(list, i, open));
        li.append(pbtn);
      }
      li.append(el("div", { class: "p-chronicle-ev__text" }, [
        el("p", { class: "p-chronicle-ev__year", text: yearText(it) }),
        el("h3", { class: "p-chronicle-ev__title", text: pick(it.title) }),
        el("p", { class: "p-chronicle-ev__sum", text: plain(pick(it.body)) }),
        open,
      ]));
      ol.append(li);
    });
    sec.append(ol);
    results.append(sec);
  });
  reveal(results.querySelectorAll(".js-reveal"));
  // 捲動時更新年份軸
  const setYear = y => {
    now.firstChild.textContent = y;
    fill.style.width = `${Math.max(1, pct(y))}%`;
    const era = ERAS.find(e => y >= e.from && y <= e.to);
    eraNav.querySelectorAll("li").forEach(li => li.classList.toggle("is-current", li.dataset.era === (era && era.key)));
  };
  io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) setYear(Number(en.target.dataset.year)); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  results.querySelectorAll(".p-chronicle-ev").forEach(li => io.observe(li));
  setYear(list[0].year);
}

bar.run();
