/* 卡片：整張可點，但只有標題的連結是焦點（避免重複連結）。（WP0 擁有）

   card({ href, image, title, meta, summary, tags, headingLevel, external })
   - href：完整網址（站內請先用 localHref 轉）
   - title、summary：雙語物件或字串
   - meta：字串（例如日期）
*/
import { el, bi, img } from "./dom.js";
import { externalLink } from "../core/a11y.js";
import { pick } from "../core/i18n.js";

export function card({ href, image, title, meta, summary, tags, headingLevel = 3, external = false, className } = {}) {
  const article = el("article", { class: "c-card" + (className ? " " + className : "") });
  if (image) {
    const media = el("div", { class: "c-card__media" });
    const pic = img(image);
    if (pic) media.append(pic);
    article.append(media);
  }
  const body = el("div", { class: "c-card__body" });
  if (meta) body.append(el("p", { class: "c-card__meta", text: meta }));
  const h = el(`h${headingLevel}`, { class: "c-card__title" });
  if (href) {
    const a = bi("a", title, { href });
    if (external) externalLink(a);
    h.append(a);
  } else {
    h.textContent = pick(title);
  }
  body.append(h);
  if (summary) body.append(bi("p", summary, { class: "c-card__summary" }));
  if (tags && tags.length) {
    const ul = el("ul", { class: "c-tags" });
    tags.forEach(tg => ul.append(el("li", {}, bi("span", tg, { class: "c-tag" }))));
    body.append(ul);
  }
  article.append(body);
  return article;
}

/** 一組卡片的格線容器 */
export function cardGrid(cards, { label } = {}) {
  const ul = el("ul", { class: "l-grid c-card-list", role: "list", "aria-label": label || null });
  cards.forEach(c => ul.append(el("li", {}, c)));
  return ul;
}
