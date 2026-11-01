/* 百大貢獻的第三層內頁（item.html?type=contribution&id=…）
   - 上方主視覺：編號（No. 008）、學組、標題、一句摘要；右邊是標本卡（學組圖示＋大編號）
   - 中間：左邊內文（有真的圖才放圖，佔位圖不放）、右邊資訊卡（學組、編號、關鍵字、延伸閱讀）
   - 下方：同學組的其他貢獻、上一項／下一項 */
import { sanitize, ROOT } from "../core/content.js";
import { t, pick, localHref, fallbackLang, htmlLang } from "../core/i18n.js";
import { externalLink } from "../core/a11y.js";
import { el, bi, img } from "../components/dom.js";

const ICON = d => ({ src: `assets/img/icons/${d}.svg`, alt: { zh: "", en: "" }, width: 96, height: 96 });
const href = it => localHref(`item.html?type=contribution&id=${it.id}`, ROOT);
const no = i => String(i + 1).padStart(3, "0");

export function contributionPage(item, items) {
  const i = items.indexOf(item);
  const page = el("article", { class: "p-item-contrib", "data-division": item.division || "" });

  // 主視覺
  const icon = img(ICON(item.division), { lazy: false }); icon.alt = "";
  page.append(el("header", { class: "p-item-contrib__hero" }, [
    el("div", { class: "p-item-contrib__head" }, [
      el("p", { class: "p-item-contrib__kicker", text: `${t("page.contributions")}　No. ${no(i)}` }),
      bi("h1", item.title, { class: "p-item-contrib__title" }),
      el("p", { class: "p-item-contrib__div" }, [el("span", { class: "p-item-contrib__dot", "aria-hidden": "true" }), el("span", { text: t(`div.${item.division}`) })]),
      bi("p", item.summary, { class: "p-item-contrib__lead" }),
    ]),
    // 右邊：像博物館標本卡——學組圖示、大編號、/ 100、學組名稱
    el("div", { class: "p-item-contrib__art", "aria-hidden": "true" }, el("div", { class: "p-item-contrib__tag" }, [
      el("span", { class: "p-item-contrib__tag-icon" }, icon),
      el("span", { class: "p-item-contrib__tag-label", text: "No." }),
      el("span", { class: "p-item-contrib__num" }, [el("span", { text: no(i) }), el("small", { text: " / 100" })]),
      el("span", { class: "p-item-contrib__tag-div", text: t(`div.${item.division}`) }),
    ])),
  ]));

  // 內文＋資訊卡
  const main = el("div", { class: "p-item-contrib__main" });
  if (item.image && !/placeholder/.test(item.image.src)) {
    const fig = el("figure", { class: "c-article__figure" }, img(item.image));
    if (pick(item.image.alt)) fig.append(bi("figcaption", item.image.alt));
    main.append(fig);
  }
  const body = el("div", { class: "c-article__body" });
  const fb = fallbackLang(item.body); if (fb) body.lang = htmlLang(fb);
  body.append(sanitize(pick(item.body)));
  body.querySelectorAll('a[target="_blank"]').forEach(externalLink);
  main.append(body);

  const facts = el("dl", { class: "p-item-contrib__facts" });
  const fact = (k, v) => { if (v) facts.append(el("div", {}, [el("dt", { text: k }), el("dd", {}, v)])); };
  fact(t("category"), t(`div.${item.division}`));
  fact(t("contrib_no"), `No. ${no(i)} / 100`);
  if ((item.keywords || []).length) {
    const ul = el("ul", { class: "c-tags" });
    item.keywords.forEach(k => ul.append(el("li", {}, bi("span", k, { class: "c-tag" }))));
    fact(t("tags"), ul);
  }
  if (item.external_url) { const a = externalLink(el("a", { href: item.external_url, text: t("further_reading") })); fact(t("related_links"), a); }
  const aside = el("aside", { class: "p-item-contrib__aside", "aria-label": t("contrib_facts") }, [
    facts,
    el("a", { class: "c-btn c-btn--ghost", href: localHref("contributions.html", ROOT), text: `‹ ${t("back_to_contrib")}` }),
  ]);
  page.append(el("div", { class: "p-item-contrib__grid" }, [main, aside]));

  // 同學組的其他貢獻
  const same = items.filter(x => x !== item && x.division === item.division).slice(0, 3);
  if (same.length) {
    const ul = el("ul", { class: "p-item-contrib__more", role: "list" });
    same.forEach(x => {
      const ic = img(ICON(x.division)); ic.alt = "";
      ul.append(el("li", {}, el("a", { href: href(x), class: "p-item-contrib__card" }, [
        el("span", { class: "p-item-contrib__card-no", text: `No. ${no(items.indexOf(x))}` }),
        bi("span", x.title, { class: "p-item-contrib__card-title" }),
        bi("span", x.summary, { class: "p-item-contrib__card-sum" }),
        el("span", { class: "p-item-contrib__card-icon" }, ic),
      ])));
    });
    page.append(el("section", { class: "p-item-contrib__section", "aria-labelledby": "more-h" }, [
      el("h2", { id: "more-h", text: t("same_division") }), ul,
    ]));
  }

  // 上一項／下一項
  const prev = items[(i - 1 + items.length) % items.length], next = items[(i + 1) % items.length];
  page.append(el("nav", { class: "p-item-contrib__pager", "aria-label": t("contrib_pager") }, [
    el("a", { href: href(prev), rel: "prev" }, [el("span", { class: "u-muted", text: `‹ ${t("prev_contrib")}` }), bi("span", prev.title)]),
    el("a", { href: href(next), rel: "next" }, [el("span", { class: "u-muted", text: `${t("next_contrib")} ›` }), bi("span", next.title)]),
  ]));
  return page;
}
