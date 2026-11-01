/* 百大貢獻（WP4）：圖片牆＋學組／關鍵字查詢，點選進第三層 */
import { boot } from "../core/page.js";
import { load, ROOT } from "../core/content.js";
import { t, pick, localHref } from "../core/i18n.js";
import { reveal } from "../core/motion.js";
import { el } from "../components/dom.js";
import { card, cardGrid } from "../components/card.js";
import { filterBar, matchText } from "../components/filterbar.js";
import { pageHead } from "../components/pagehead.js";

const { main } = await boot("contributions");
const data = await load("contributions");
const items = data.items || [];

main.append(await pageHead("contributions", { image: { src: "assets/img/photos/lab.jpg", alt: { zh: "", en: "" }, width: 1200, height: 800 } }));
const sec = el("section", { class: "c-light l-section", "aria-label": t("page.contributions") });
const box = el("div", { class: "l-container" });
sec.append(box); main.append(sec);

// 開頭的大數字
box.append(el("div", { class: "p-contrib-intro" }, [
  el("p", { class: "p-contrib-intro__num", "aria-hidden": "true", text: "100" }),
  el("p", { class: "p-contrib-intro__text" }, [el("strong", { text: `100 ${t("contrib_total")}` }), el("br"), el("span", { class: "u-muted", text: t("contrib_note") })]),
]));

const results = el("div");
const bar = filterBar({
  fields: [
    { type: "search", key: "q", label: t("keyword") },
    { type: "chips", key: "division", label: t("category"), options: ["math", "life", "humanities"].map(d => ({ value: d, label: t(`div.${d}`) })) },
  ],
  onChange: st => {
    const list = items.filter(it => (!st.division || it.division === st.division) && matchText(st.q, it.title, it.summary, it.keywords));
    bar.setCount(list.length);
    results.replaceChildren(list.length
      ? cardGrid(list.map(it => card({ href: localHref(`item.html?type=contribution&id=${it.id}`, ROOT), image: it.image, title: it.title, meta: t(`div.${it.division}`), summary: it.summary })), { label: t("page.contributions") })
      : el("p", { class: "c-empty", text: t("no_results") }));
  },
});
box.append(bar.element, results);
bar.run();
reveal();
