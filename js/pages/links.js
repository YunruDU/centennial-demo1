/* 相關連結（WP8）：索引式目錄
   - 依用途分組（院內活動與場館／獎項與夥伴／追蹤我們），每組一個標題
   - 每個連結一整列：編號、名稱、一句說明、網域＋↗；滑過時右邊淡入照片（沒有照片就不放）
   - 全部另開新視窗，並有「另開新視窗」的文字提示 */
import { boot } from "../core/page.js";
import { load } from "../core/content.js";
import { t, pick } from "../core/i18n.js";
import { externalLink } from "../core/a11y.js";
import { reveal } from "../core/motion.js";
import { el, bi, img } from "../components/dom.js";
import { pageHead } from "../components/pagehead.js";

const { main } = await boot("links");
const links = await load("links");
main.append(await pageHead("links", { image: { src: "assets/img/photos/campus-lawn.jpg", alt: { zh: "", en: "" }, width: 1200, height: 800 } }));

const GROUPS = ["campus", "partners", "follow"];
const domain = url => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
const box = el("div", { class: "l-container l-section p-links" });
let n = 0;
GROUPS.forEach(g => {
  const list = links.filter(l => (l.group || "campus") === g);
  if (!list.length) return;
  const ul = el("ul", { class: "p-links-list", role: "list" });
  list.forEach(l => {
    n++;
    const a = el("a", { class: "p-links-row", href: l.url }, [
      el("span", { class: "p-links-row__no", "aria-hidden": "true", text: String(n).padStart(2, "0") }),
      el("span", { class: "p-links-row__text" }, [bi("span", l.title, { class: "p-links-row__title" }), bi("span", l.summary, { class: "p-links-row__sum" })]),
      el("span", { class: "p-links-row__domain" }, [el("span", { text: domain(l.url) }), el("span", { class: "p-links-row__arrow", "aria-hidden": "true", text: "↗" })]),
    ]);
    if (l.image && !/placeholder/.test(l.image.src)) {
      const pic = img(l.image); pic.alt = "";
      a.append(el("span", { class: "p-links-row__pic", "aria-hidden": "true" }, pic));
    }
    ul.append(el("li", { class: "js-reveal" }, externalLink(a)));
  });
  box.append(el("section", { class: "p-links-group", "aria-labelledby": `lg-${g}` }, [
    el("h2", { id: `lg-${g}`, class: "p-links-group__title" }, [el("span", { text: t(`links_group.${g}`) }), el("span", { class: "p-links-group__count", text: String(list.length) })]),
    ul,
  ]));
});
main.append(box);
reveal();
