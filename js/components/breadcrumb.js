/* 麵包屑（WP0 擁有）

   breadcrumb([{ label: t("page.home"), href }, { label: t("page.news"), href }, { label: 標題 }])
   最後一項是目前頁，不加連結。label 可以是字串或雙語物件。
*/
import { el, bi } from "./dom.js";
import { t } from "../core/i18n.js";

export function breadcrumb(items) {
  const nav = el("nav", { class: "c-breadcrumb", "aria-label": t("breadcrumb") });
  const ol = el("ol");
  items.forEach((it, i) => {
    const last = i === items.length - 1;
    const node = !last && it.href ? bi("a", it.label, { href: it.href }) : bi("span", it.label, { "aria-current": last ? "page" : null });
    ol.append(el("li", {}, node));
  });
  nav.append(ol);
  return nav;
}
