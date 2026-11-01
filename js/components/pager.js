/* 分頁器（WP0 擁有）

   pager({ page: 1, total: 30, perPage: 9, onPage: p => {…重畫…} })
*/
import { el } from "./dom.js";
import { t } from "../core/i18n.js";

export function pager({ page, total, perPage, onPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const nav = el("nav", { class: "c-pager", "aria-label": t("pagination") });
  if (pages <= 1) return nav;
  const ul = el("ul");
  const btn = (label, p, { current = false, disabled = false, aria } = {}) => {
    const b = el("button", { type: "button", "aria-current": current ? "page" : null, "aria-label": aria || null, disabled }, label);
    b.addEventListener("click", () => onPage(p));
    ul.append(el("li", {}, b));
  };
  btn("‹", page - 1, { disabled: page <= 1, aria: t("prev") });
  for (let p = 1; p <= pages; p++) btn(String(p), p, { current: p === page, aria: t("page_n", { n: p }) });
  btn("›", page + 1, { disabled: page >= pages, aria: t("next") });
  nav.append(ul);
  return nav;
}
