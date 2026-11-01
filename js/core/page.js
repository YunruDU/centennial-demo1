/* 每一頁的進入點：載入介面文字、畫頁首頁尾、套用 data-t 文字、設定頁面標題。（WP0 擁有）

   用法（js/pages/news.js）：
     import { boot } from "../core/page.js";
     const { site, main } = await boot("news");
     // 接著在 main 裡畫內容
*/
import { initUI, applyTexts, t, pick } from "./i18n.js";
import { renderShell } from "./shell.js";
import { renderStyleSwitch } from "./style.js";

export async function boot(page, { title } = {}) {
  const main = document.getElementById("main");
  try {
    await initUI();
    const site = await renderShell(page);
    applyTexts();
    if (site.style_proposals) renderStyleSwitch();   // 第一階段：3 款風格切換
    setTitle(title || t(`page.${page}`), site);
    return { site, main };
  } catch (err) {
    console.error(err);
    if (main) {
      main.innerHTML = "";
      const p = document.createElement("p");
      p.className = "c-notice l-container";
      p.textContent = `載入失敗 / Failed to load: ${err.message}`;
      main.append(p);
    }
    throw err;
  }
}

let siteRef = null;
/** 設定 <title>：「頁面｜網站名稱」 */
export function setTitle(text, site = siteRef) {
  if (site) siteRef = site;
  const name = siteRef ? pick(siteRef.name) : "";
  document.title = text ? `${text}｜${name}` : name;
}
