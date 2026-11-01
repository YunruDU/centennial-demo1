/* 百年中研（WP6）：院長的話、院史電子書、三大學組、影音與專訪 */
import { boot } from "../core/page.js";
import { load, ROOT, siteUrl } from "../core/content.js";
import { t, pick, localHref } from "../core/i18n.js";
import { externalLink } from "../core/a11y.js";
import { reveal } from "../core/motion.js";
import { el, bi, img } from "../components/dom.js";
import { card, cardGrid } from "../components/card.js";
import { pageHead, sectionTitle } from "../components/pagehead.js";

const { main } = await boot("centennial");
const c = await load("centennial");
main.append(await pageHead("centennial", { image: { src: "assets/img/photos/campus-lawn.jpg", alt: { zh: "", en: "" }, width: 1200, height: 800 } }));

/* 院長的話 */
const m = c.message;
const msg = el("section", { class: "l-section js-reveal", "aria-labelledby": "sec-msg" }, el("div", { class: "l-container p-cen-msg" }, [
  el("figure", { class: "p-cen-msg__photo" }, img(m.photo)),
  el("div", { class: "p-cen-msg__text" }, [
    sectionTitle(t("president_message"), { id: "sec-msg" }),
    bi("blockquote", m.summary, { class: "p-cen-msg__quote" }),
    bi("p", m.name, { class: "u-muted" }),
    el("a", { class: "c-btn c-btn--ghost", href: localHref("item.html?type=message&id=president", ROOT), text: t("read_full") }),
  ]),
]));

/* 院史電子書 */
const e = c.ebook;
const actions = el("div", { class: "p-cen-book__actions" });
if (e.pdf) {
  const read = el("a", { class: "c-btn", href: siteUrl(e.pdf), text: t("read_online") }); externalLink(read);
  actions.append(read, el("a", { class: "c-btn c-btn--ghost", href: siteUrl(e.pdf), download: "", text: t("download") }));
} else {
  actions.append(el("span", { class: "c-btn c-btn--ghost is-disabled", "aria-disabled": "true", text: `${t("read_online")}（${t("coming_soon")}）` }));
}
const book = el("section", { class: "l-section c-light js-reveal", "aria-labelledby": "sec-book" }, el("div", { class: "l-container p-cen-book" }, [
  el("figure", { class: "p-cen-book__cover" }, img(e.cover)),
  el("div", {}, [sectionTitle(t("ebook"), { id: "sec-book" }), bi("h3", e.title), bi("p", e.summary), actions]),
]));

/* 三大學組 */
const divs = el("ul", { class: "p-cen-divs", role: "list" });
c.divisions.forEach(d => {
  const li = el("li", { class: "p-cen-div" });
  li.append(el("div", { class: "p-cen-div__icon" }, img(d.icon)));
  li.append(el("h3", { class: "p-cen-div__name" }, bi("a", d.name, { href: localHref(`item.html?type=division&id=${d.id}`, ROOT) })));
  li.append(bi("p", d.summary, { class: "u-muted" }));
  divs.append(li);
});
const divSec = el("section", { class: "l-section js-reveal", "aria-labelledby": "sec-div" }, el("div", { class: "l-container" }, [sectionTitle(t("divisions"), { id: "sec-div" }), divs]));

/* 影音與專訪 */
const media = cardGrid(c.media.map(mm => card({ href: mm.url, image: mm.image, title: mm.title, external: /^https?:/.test(mm.url) })));
const mediaSec = el("section", { class: "l-section c-light js-reveal", "aria-labelledby": "sec-media" }, el("div", { class: "l-container" }, [sectionTitle(t("media_interviews"), { id: "sec-media" }), media]));

main.append(msg, book, divSec, mediaSec);
reveal();
