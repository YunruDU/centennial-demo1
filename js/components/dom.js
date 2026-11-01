/* 小工具：建立元素、圖片。（WP0 擁有） */
import { pick, setText } from "../core/i18n.js";
import { siteUrl } from "../core/content.js";

/** el("p", { class: "x" }, "文字" 或 [子元素…]) */
export function el(tag, attrs = {}, children) {
  const e = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === "text") e.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? "" : v);
  });
  if (children != null) e.append(...[].concat(children).filter(c => c != null && c !== false));
  return e;
}

/** 雙語文字元素：bi("h2", item.title, { class: "x" }) */
export function bi(tag, value, attrs) {
  return setText(el(tag, attrs), value);
}

/** 圖片：image 物件 { src, alt: {zh,en}, width?, height? }。alt 必填；純裝飾圖 alt 給空字串 */
export function img(image, { lazy = true, className, sizes } = {}) {
  if (!image || !image.src) return null;
  return el("img", {
    src: siteUrl(image.src),
    alt: pick(image.alt),
    loading: lazy ? "lazy" : null,
    decoding: "async",
    width: image.width || null,
    height: image.height || null,
    class: className || null,
    sizes: sizes || null,
  });
}
