/* 百年院慶系列活動（WP2）
   - 最上方「即將登場」：下一場活動放大（海報＋倒數＋按鈕）
   - 篩選列在上方一整列（類別分頁含筆數、年份、搜尋、檢視切換），捲動時固定
   - 「區塊」：海報畫廊，一排 4 張；「列表」：依月份分組，每列小海報＋日期＋名稱＋摘要＋按鈕
   - 點海報放大：海報＋說明＋活動詳情／加入行事曆／相關連結，可前後切換 */
import { boot } from "../core/page.js";
import { load, ROOT } from "../core/content.js";
import { t, pick, lang, fmtRange, localHref } from "../core/i18n.js";
import { externalLink } from "../core/a11y.js";
import { el, bi, img } from "../components/dom.js";
import { filterBar, matchText } from "../components/filterbar.js";
import { openModal } from "../components/modal.js";
import { pageHead } from "../components/pagehead.js";

const { main } = await boot("events");
const events = [...(await load("events"))].sort((a, b) => a.date_start.localeCompare(b.date_start) || a.id.localeCompare(b.id));
const detailHref = it => localHref(`item.html?type=event&id=${it.id}`, ROOT);
const when = it => (it.date_label ? pick(it.date_label) : fmtRange(it.date_start, it.date_end));
const posterOf = it => it.poster || it.image;
const catLabel = c => t(`cat.${c}`);
const monthLabel = ym => {
  const [y, m] = ym.split("-").map(Number);
  return lang === "en" ? new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "long" }).format(new Date(y, m - 1, 1)) : `${y} 年 ${m} 月`;
};

main.append(await pageHead("events", { image: { src: "assets/img/photos/lecture-hall.jpg", alt: { zh: "", en: "" }, width: 1200, height: 800 } }));
const box = el("div", { class: "l-container p-events" });
main.append(box);

/* ---------- 即將登場 ---------- */
const today = new Date().toISOString().slice(0, 10);
const next = events.find(e => e.date_end >= today) || events[events.length - 1];
if (next) {
  const days = Math.max(0, Math.ceil((new Date(next.date_start) - new Date(today)) / 86400000));
  const frame = el("button", { type: "button", class: "p-events-frame", "aria-label": `${t("open_poster")}：${pick(next.title)}`, "aria-haspopup": "dialog" }, img(posterOf(next), { lazy: false }));
  frame.addEventListener("click", () => openLightbox(events, events.indexOf(next), frame));
  box.append(el("section", { class: "p-events-feature", "aria-labelledby": "ev-next" }, [
    frame,
    el("div", { class: "p-events-feature__info" }, [
      el("p", { class: "p-events-feature__kicker", text: t("upcoming") }),
      el("h2", { id: "ev-next", class: "p-events-feature__title" }, bi("a", next.title, { href: detailHref(next) })),
      el("p", { class: "p-events-feature__when" }, [el("span", { text: when(next) }), el("span", { class: "u-muted", text: `｜${catLabel(next.category)}` })]),
      bi("p", next.location, { class: "u-muted" }),
      bi("p", next.summary, { class: "p-events-feature__summary" }),
      el("p", { class: "p-events-feature__count" }, [el("strong", { text: String(days) }), el("span", { text: ` ${t("days_left_unit")}` })]),
      el("div", { class: "p-events-actions" }, [
        el("a", { class: "c-btn", href: detailHref(next), text: t("event_detail") }),
        el("a", { class: "c-btn c-btn--ghost", href: icsUrl(next), download: `${next.id}.ics`, text: t("add_calendar") }),
      ]),
    ]),
  ]));
}

/* ---------- 篩選列（上方一整列，捲動時固定） ---------- */
const years = [...new Set(events.map(e => e.date_start.slice(0, 4)))];
const count = c => events.filter(e => e.category === c).length;
let shown = events;
const bar = filterBar({
  fields: [
    { type: "chips", key: "category", label: t("category"), allLabel: `${t("filter_all")} ${events.length}`,
      options: ["seminar", "exhibition", "celebration"].map(c => ({ value: c, label: `${catLabel(c)} ${count(c)}` })) },
    { type: "chips", key: "year", label: t("year"), options: years.map(y => ({ value: y, label: y })) },
    { type: "search", key: "q", label: t("keyword") },
  ],
  onChange: st => {
    shown = events.filter(it => (!st.category || it.category === st.category) && (!st.year || it.date_start.startsWith(st.year) || it.date_end.startsWith(st.year))
      && matchText(st.q, it.title, it.summary, it.location));
    bar.setCount(shown.length);
    render();
  },
});
let view = new URLSearchParams(location.search).get("view") === "list" ? "list" : "grid";
const seg = el("div", { class: "c-seg", role: "group", "aria-label": t("view_switch") });
const segBtns = ["grid", "list"].map(v => {
  const b = el("button", { type: "button", "aria-pressed": String(v === view), text: t(`view_${v}`) });
  b.addEventListener("click", () => {
    view = v; segBtns.forEach((x, i) => x.setAttribute("aria-pressed", String(["grid", "list"][i] === v)));
    const u = new URL(location.href); u.searchParams.set("view", v); history.replaceState(null, "", u);
    render();
  });
  seg.append(b); return b;
});
bar.element.append(seg);
const toolbar = el("div", { class: "p-events-toolbar" }, bar.element);
const results = el("div", { class: "p-events-results" });
box.append(toolbar, results);

/* ---------- 呈現 ---------- */
function posterButton(list, i) {
  const it = list[i];
  const b = el("button", { type: "button", class: "p-events-frame", "aria-label": `${t("open_poster")}：${pick(it.title)}`, "aria-haspopup": "dialog" }, img(posterOf(it)));
  b.addEventListener("click", () => openLightbox(list, i, b));
  return b;
}
function render() {
  results.replaceChildren();
  if (!shown.length) { results.append(el("p", { class: "c-empty", text: t("no_results") })); return; }
  if (view === "grid") {
    results.append(el("h2", { class: "u-visually-hidden", text: t("list_events") }));   // 標題層級：h1 → h2 → 海報 h3
    const wall = el("ul", { class: "p-events-wall", role: "list" });
    shown.forEach((it, i) => {
      wall.append(el("li", { class: "p-events-item" }, [
        posterButton(shown, i),
        el("div", { class: "p-events-label" }, [
          el("p", { class: "p-events-label__meta", text: `${catLabel(it.category)}｜${when(it)}` }),
          el("h3", { class: "p-events-label__title" }, bi("a", it.title, { href: detailHref(it) })),
        ]),
      ]));
    });
    results.append(wall);
    return;
  }
  // 列表：依月份分組
  const months = [...new Set(shown.map(e => e.date_start.slice(0, 7)))];
  months.forEach(ym => {
    const sec = el("section", { class: "p-events-month", "aria-label": monthLabel(ym) });
    sec.append(el("h2", { class: "p-events-month__title", text: monthLabel(ym) }));
    const ul = el("ul", { class: "p-events-rows", role: "list" });
    shown.forEach((it, i) => {
      if (it.date_start.slice(0, 7) !== ym) return;
      const d = new Date(it.date_start);
      ul.append(el("li", { class: "p-events-row" }, [
        posterButton(shown, i),
        el("div", { class: "p-events-row__date", "aria-hidden": "true" }, [
          el("span", { class: "p-events-row__day", text: String(d.getDate()).padStart(2, "0") }),
          el("span", { class: "p-events-row__mon", text: lang === "en" ? d.toLocaleString("en-GB", { month: "short" }).toUpperCase() : `${d.getMonth() + 1} 月` }),
        ]),
        el("div", { class: "p-events-row__info" }, [
          el("p", { class: "p-events-label__meta", text: `${catLabel(it.category)}｜${when(it)}` }),
          el("h3", { class: "p-events-row__title" }, bi("a", it.title, { href: detailHref(it) })),
          bi("p", it.summary, { class: "p-events-label__summary" }),
          bi("p", it.location, { class: "u-muted u-small" }),
        ]),
        el("div", { class: "p-events-actions p-events-row__actions" }, [
          el("a", { class: "c-btn c-btn--ghost", href: detailHref(it), text: t("event_detail") }),
          el("a", { class: "c-btn c-btn--ghost", href: icsUrl(it), download: `${it.id}.ics`, text: t("add_calendar") }),
        ]),
      ]));
    });
    sec.append(ul);
    results.append(sec);
  });
}

/* ---------- 放大檢視 ---------- */
function icsUrl(it) {
  const d = s => s.replace(/-/g, "");
  const end = new Date(it.date_end); end.setDate(end.getDate() + 1);
  const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Centennial concept demo//ZH", "BEGIN:VEVENT", `UID:${it.id}@centennial-demo`,
    `DTSTART;VALUE=DATE:${d(it.date_start)}`, `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `SUMMARY:${pick(it.title)}`, `LOCATION:${pick(it.location)}`, `DESCRIPTION:${pick(it.summary)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return URL.createObjectURL(new Blob([txt], { type: "text/calendar" }));
}
function openLightbox(list, i, opener) {
  const it = list[i];
  const content = el("div", { class: "p-events-lb" });
  content.append(el("figure", { class: "p-events-lb__poster" }, img(posterOf(it), { lazy: false })));
  const info = el("div", { class: "p-events-lb__info" });
  info.append(el("p", { class: "p-events-label__meta", text: `${catLabel(it.category)}｜${when(it)}` }));
  info.append(bi("p", it.location, { class: "u-muted" }));
  info.append(bi("p", it.summary, { class: "p-events-lb__summary" }));
  info.append(el("div", { class: "p-events-actions" }, [
    el("a", { class: "c-btn", href: detailHref(it), text: t("event_detail") }),
    el("a", { class: "c-btn c-btn--ghost", href: icsUrl(it), download: `${it.id}.ics`, text: t("add_calendar") }),
  ]));
  if ((it.links || []).length) {
    const ul = el("ul", { class: "p-events-lb__links" });
    it.links.forEach(l => { const a = bi("a", l.label, { href: l.url }); if (/^https?:/.test(l.url)) externalLink(a); ul.append(el("li", {}, a)); });
    info.append(ul);
  }
  const go = d => { modal.close(); openLightbox(list, (i + d + list.length) % list.length, opener); };
  const prev = el("button", { type: "button", class: "c-btn c-btn--ghost", "aria-label": t("prev_item"), text: "‹" });
  const nxt = el("button", { type: "button", class: "c-btn c-btn--ghost", "aria-label": t("next_item"), text: "›" });
  prev.addEventListener("click", () => go(-1)); nxt.addEventListener("click", () => go(1));
  info.append(el("div", { class: "p-events-lb__nav" }, [prev, el("span", { class: "u-muted", text: `${i + 1} / ${list.length}` }), nxt]));
  content.append(info);
  const modal = openModal({ title: it.title, content, opener });
  modal.dialog.classList.add("c-modal__dialog--wide");
  modal.dialog.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); });
}

bar.run();
