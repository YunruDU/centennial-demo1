/* 最新消息（WP5）：圖文列表、關鍵字搜尋、分頁（每頁 9 則），點入第三層 */
import { boot } from "../core/page.js";
import { load, ROOT } from "../core/content.js";
import { t, fmtDate, localHref } from "../core/i18n.js";
import { announce } from "../core/a11y.js";
import { el } from "../components/dom.js";
import { card, cardGrid } from "../components/card.js";
import { filterBar, matchText } from "../components/filterbar.js";
import { pager } from "../components/pager.js";
import { pageHead } from "../components/pagehead.js";

const PER = 9;
const { main } = await boot("news");
const news = [...(await load("news"))].sort((a, b) => (a.date < b.date ? 1 : -1));

main.append(await pageHead("news", { image: { src: "assets/img/photos/campus-aerial.jpg", alt: { zh: "", en: "" }, width: 1600, height: 578 } }));
const box = el("div", { class: "l-container l-section" });
main.append(box);

const results = el("div");
let list = news, page = 1;
function render(focus) {
  const pages = Math.max(1, Math.ceil(list.length / PER));
  page = Math.min(page, pages);
  const slice = list.slice((page - 1) * PER, page * PER);
  results.replaceChildren();
  if (!list.length) { results.append(el("p", { class: "c-empty", text: t("no_results") })); return; }
  results.append(cardGrid(slice.map(it => card({
    href: localHref(`item.html?type=news&id=${it.id}`, ROOT), image: (it.images || [])[0] || { src: "assets/img/placeholder-16x9.svg", alt: { zh: "", en: "" }, width: 1600, height: 900 },
    title: it.title, meta: fmtDate(it.date), summary: it.summary,
  })), { label: t("page.news") }));
  results.append(pager({ page, total: list.length, perPage: PER, onPage: p => { page = p; render(true); announce(t("page_n", { n: p })); } }));
  if (focus) { const first = results.querySelector(".c-card__title a"); if (first) first.focus(); }
}
const bar = filterBar({
  fields: [{ type: "search", key: "q", label: t("keyword") }],
  onChange: st => { list = news.filter(it => matchText(st.q, it.title, it.summary, it.tags)); page = 1; bar.setCount(list.length); render(false); },
});
box.append(bar.element, el("h2", { class: "u-visually-hidden", text: t("list_news") }), results);   // 標題層級：h1 → h2 → 卡片 h3
bar.run();
