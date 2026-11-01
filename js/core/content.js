/* 讀取 content/*.json。後台（admin）改過的資料存在 localStorage，前台優先讀那份。（WP0 擁有） */

const LS_PREFIX = "rfpdemo:content:";
const cache = new Map();

/** 站台根目錄（不論頁面在第幾層都正確），例如 http://host/sub/ */
export const ROOT = new URL("../../", import.meta.url);

/** 把站內相對路徑（例如 "assets/img/a.svg"、"news.html"）轉成完整網址 */
export function siteUrl(path) {
  return new URL(path, ROOT).href;
}

function readLocal(name) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + name);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/** 讀一個內容集合，例如 load("news") */
export async function load(name) {
  if (cache.has(name)) return cache.get(name);
  const p = (async () => {
    const local = readLocal(name);
    if (local) return local;
    const res = await fetch(siteUrl(`content/${name}.json`));
    if (!res.ok) throw new Error(`讀不到 content/${name}.json（${res.status}）`);
    return res.json();
  })();
  cache.set(name, p);
  return p;
}

/** 後台用：存一個集合到 localStorage */
export function save(name, data) {
  localStorage.setItem(LS_PREFIX + name, JSON.stringify(data));
  cache.delete(name);
}

/** 後台用：清掉 localStorage，回到 content/*.json 的示意資料 */
export function reset(name) {
  if (name) localStorage.removeItem(LS_PREFIX + name);
  else Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).forEach(k => localStorage.removeItem(k));
  cache.clear();
}

/** 是否有後台改過的資料 */
export function isEdited(name) {
  return readLocal(name) !== null;
}

/* ---------- 內文 HTML 過濾：只留允許的標籤與屬性（防止後台貼入 script） ---------- */
const ALLOWED = {
  P: [], H3: [], UL: [], OL: [], LI: [], STRONG: [], EM: [], FIGURE: [], FIGCAPTION: [], BR: [],
  A: ["href"], IMG: ["src", "alt"],
};
const SAFE_URL = /^(https?:|mailto:|#|\.{0,2}\/|[\w-]+[\w./-]*(\?[\w=&-]*)?(#[\w-]*)?$)/i;

export function sanitize(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = String(html || "");
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const allowed = ALLOWED[child.tagName];
        if (!allowed) {
          // 不允許的標籤：保留文字內容，去掉標籤（script、style 連內容一起丟）
          if (child.tagName === "SCRIPT" || child.tagName === "STYLE") child.remove();
          else { walk(child); child.replaceWith(...child.childNodes); }
          return;
        }
        [...child.attributes].forEach(a => {
          if (!allowed.includes(a.name)) child.removeAttribute(a.name);
          else if ((a.name === "href" || a.name === "src") && !SAFE_URL.test(a.value.trim())) child.removeAttribute(a.name);
        });
        if (child.tagName === "A" && /^https?:/i.test(child.getAttribute("href") || "")) {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener");
        }
        if (child.tagName === "IMG") child.setAttribute("loading", "lazy");
        walk(child);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    });
  };
  walk(tpl.content);
  return tpl.content;
}
