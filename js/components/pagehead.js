/* 分頁標題區：背景照片＋麵包屑＋另一種語言的小標＋大標題＋說明。（WP0 擁有）

   main.append(await pageHead("events", { image }));
*/
import { load, ROOT } from "../core/content.js";
import { t, lang, localHref, htmlLang } from "../core/i18n.js";
import { el, img } from "./dom.js";
import { breadcrumb } from "./breadcrumb.js";

export async function pageHead(key, { image } = {}) {
  const ui = await load("ui");
  const other = lang === "en" ? "zh" : "en";
  const s = el("section", { class: "c-pagehead", "aria-labelledby": `ph-${key}` });
  if (image) {
    const pic = img(image, { lazy: false });
    pic.alt = "";                                   // 背景裝飾
    s.append(el("div", { class: "c-pagehead__bg" }, pic));
  }
  const inner = el("div", { class: "l-container c-pagehead__inner" });
  // 標題 → 麵包屑 → 一行說明（拿掉英文小標，讓標題區矮一點）
  inner.append(el("h1", { id: `ph-${key}`, class: "c-pagehead__title", text: t(`page.${key}`) }));
  inner.append(breadcrumb([{ label: t("page.home"), href: localHref("index.html", ROOT) }, { label: t(`page.${key}`) }]));
  if (ui[`lead.${key}`]) inner.append(el("p", { class: "c-pagehead__lead", text: t(`lead.${key}`) }));
  s.append(inner);
  return s;
}

/* 區塊標題（頁內用）：小標＋標題 */
export function sectionTitle(text, { id, level = 2 } = {}) {
  return el(`h${level}`, { class: "c-sec-title", id: id || null, text });
}
