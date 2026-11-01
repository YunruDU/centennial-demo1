/* 無障礙工具：螢幕報讀通知、焦點鎖定、外部連結提示。（WP0 擁有） */
import { t } from "./i18n.js";

let live;
/** 讓螢幕報讀器念出訊息（例如「共 12 筆」） */
export function announce(msg) {
  if (!live) {
    live = document.createElement("div");
    live.className = "u-visually-hidden";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("role", "status");
    document.body.append(live);
  }
  live.textContent = "";
  // 等一個 frame 再填入，確保報讀器偵測到變化
  requestAnimationFrame(() => { live.textContent = msg; });
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 把 Tab 鍵鎖在 container 裡；回傳解除函式 */
export function trapFocus(container) {
  const onKey = e => {
    if (e.key !== "Tab") return;
    const items = [...container.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}

/** 外部連結：另開新視窗，並加上給報讀器的提示文字 */
export function externalLink(a) {
  a.target = "_blank";
  a.rel = "noopener";
  const hint = document.createElement("span");
  hint.className = "u-visually-hidden";
  hint.textContent = t("external_hint");
  a.append(hint);
  return a;
}
