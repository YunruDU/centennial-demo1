/* 第一階段風格提案：切換 <html data-style="a|b|c">，記在網址 ?style= 與 localStorage。
   <head> 裡有一小段內嵌程式先套用，避免畫面閃一下。選定風格後這支可以刪掉。 */
import { t } from "./i18n.js";

const KEY = "rfpdemo:style";
export const STYLES = ["a", "b", "c"];

export function currentStyle() {
  return document.documentElement.dataset.style || "a";
}

export function setStyle(s) {
  if (!STYLES.includes(s)) return;
  document.documentElement.dataset.style = s;
  try { localStorage.setItem(KEY, s); } catch (e) { /* 私密模式 */ }
  const u = new URL(location.href);
  u.searchParams.set("style", s);
  history.replaceState(null, "", u);
  document.dispatchEvent(new CustomEvent("stylechange", { detail: s }));
}

/** 右下角的切換面板 */
export function renderStyleSwitch() {
  if (!document.documentElement.dataset.style) document.documentElement.dataset.style = "a";
  const box = document.createElement("div");
  box.className = "c-style-switch";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", t("style_switcher"));
  const label = document.createElement("span");
  label.className = "c-style-switch__label";
  label.textContent = t("style_switcher");
  label.setAttribute("aria-hidden", "true");
  box.append(label);
  const buttons = STYLES.map(s => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t(`style.${s}`);
    b.setAttribute("aria-pressed", String(currentStyle() === s));
    b.addEventListener("click", () => {
      setStyle(s);
      buttons.forEach((x, i) => x.setAttribute("aria-pressed", String(STYLES[i] === s)));
    });
    box.append(b);
    return b;
  });
  document.body.append(box);
  document.body.classList.add("has-style-switch");
}
