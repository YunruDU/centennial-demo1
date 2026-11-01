/* 圖文方塊（modal）：role="dialog"、焦點鎖定、Esc 關閉、關閉後焦點回到原按鈕。（WP0 擁有）

   openModal({ title: {zh,en} 或字串, content: 元素, opener: 觸發的按鈕 })
*/
import { el, bi } from "./dom.js";
import { t } from "../core/i18n.js";
import { trapFocus } from "../core/a11y.js";

let uid = 0;

export function openModal({ title, content, opener }) {
  const id = `modal-title-${++uid}`;
  const root = el("div", { class: "c-modal" });
  const dialog = el("div", { class: "c-modal__dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": id, tabindex: "-1" });
  const close = el("button", { class: "c-modal__close", type: "button", "aria-label": t("close") }, "×");
  const heading = bi("h2", title, { id });
  dialog.append(close, heading, content);
  root.append(dialog);
  document.body.append(root);
  document.body.classList.add("is-modal-open");

  // 背景內容對報讀器隱藏
  const siblings = [...document.body.children].filter(n => n !== root && !n.hasAttribute("inert"));
  siblings.forEach(n => n.setAttribute("inert", ""));

  const release = trapFocus(dialog);
  const doClose = () => {
    release();
    siblings.forEach(n => n.removeAttribute("inert"));
    document.body.classList.remove("is-modal-open");
    document.removeEventListener("keydown", onKey);
    root.remove();
    if (opener) opener.focus();
  };
  const onKey = e => { if (e.key === "Escape") doClose(); };
  document.addEventListener("keydown", onKey);
  close.addEventListener("click", doClose);
  root.addEventListener("click", e => { if (e.target === root) doClose(); });

  close.focus();
  return { close: doClose, dialog };
}
