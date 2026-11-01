/* 「這一頁還沒做」提示：把 [data-stub="WPx"] 填上說明文字。各 WP 完成頁面時，把頁面裡的 data-stub 區塊與這支的引用一起刪掉。（WP0 擁有） */
import { t } from "../core/i18n.js";

export function stub(root = document) {
  root.querySelectorAll("[data-stub]").forEach(box => {
    const p = document.createElement("p");
    p.textContent = t("stub_pending", { wp: box.dataset.stub });
    box.replaceChildren(p);
  });
}
