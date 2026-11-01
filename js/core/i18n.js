/* 語言：目前語言、介面文字 t()、雙語欄位 pick()、日期格式、站內連結帶語言。（WP0 擁有）
   語言來源順序：網址 ?lang= → localStorage → 預設中文 */
import { load } from "./content.js";

const KEY = "rfpdemo:lang";
export const LANGS = ["zh", "en"];

function detect() {
  const q = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(q)) {
    try { localStorage.setItem(KEY, q); } catch (e) { /* 私密模式 */ }
    return q;
  }
  try {
    const s = localStorage.getItem(KEY);
    if (LANGS.includes(s)) return s;
  } catch (e) { /* 私密模式 */ }
  return "zh";
}

/** 目前語言："zh" 或 "en" */
export const lang = detect();
export const htmlLang = l => (l === "en" ? "en" : "zh-Hant");

let UI = {};
/** 載入 content/ui.json（boot() 會先呼叫） */
export async function initUI() {
  UI = await load("ui");
  document.documentElement.lang = htmlLang(lang);
}

/** 取雙語欄位：{zh, en} → 目前語言；英文缺時退回中文 */
export function pick(v) {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  return v[lang] || v.zh || v.en || "";
}

/** 這個雙語欄位在目前語言是不是缺、用了另一種語言（要加 lang 屬性） */
export function fallbackLang(v) {
  if (!v || typeof v !== "object" || v[lang]) return null;
  return v.zh ? "zh" : v.en ? "en" : null;
}

/** 把雙語文字放進元素，英文缺時自動加上 lang="zh-Hant" */
export function setText(el, v) {
  el.textContent = pick(v);
  const fb = fallbackLang(v);
  if (fb) el.lang = htmlLang(fb);
  return el;
}

/** 介面文字：t("read_more")、t("results_count", { n: 12 }) */
export function t(key, vars) {
  let s = pick(UI[key]);
  if (!s) {
    console.warn(`ui.json 缺少 key：${key}`);
    s = key;
  }
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}

/** 把頁面上所有 [data-t="key"] 的元素換成介面文字；[data-t-attr="aria-label:key"] 換屬性 */
export function applyTexts(root = document) {
  root.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
  root.querySelectorAll("[data-t-attr]").forEach(el => {
    el.dataset.tAttr.split(";").forEach(pair => {
      const [attr, key] = pair.split(":").map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

/** 站內連結：英文時自動加 ?lang=en。href 是相對於站台根目錄的路徑，例如 "item.html?type=news&id=n01" */
export function localHref(href, root) {
  const u = new URL(href, root);
  if (lang === "en") u.searchParams.set("lang", "en");
  else u.searchParams.delete("lang");
  return u.href;
}

/** 同一頁、同一筆，切換到另一種語言的網址 */
export function switchLangHref() {
  const u = new URL(location.href);
  const other = lang === "en" ? "zh" : "en";
  u.searchParams.set("lang", other);
  return u.href;
}

/** 日期：中文顯示民國，英文顯示西元。iso 可以是 YYYY、YYYY-MM、YYYY-MM-DD */
export function fmtDate(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (lang === "en") {
    if (!m) return String(y);
    const opts = d ? { year: "numeric", month: "short", day: "numeric" } : { year: "numeric", month: "short" };
    return new Intl.DateTimeFormat("en-GB", opts).format(new Date(y, m - 1, d || 1));
  }
  const roc = y - 1911;
  const yy = roc > 0 ? `民國 ${roc} 年` : `${y} 年`;
  if (!m) return yy;
  return d ? `${yy} ${m} 月 ${d} 日` : `${yy} ${m} 月`;
}

/** 日期區間 */
export function fmtRange(a, b) {
  if (!b || a === b) return fmtDate(a);
  return `${fmtDate(a)} – ${fmtDate(b)}`;
}
