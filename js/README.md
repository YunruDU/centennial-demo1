# js/：怎麼寫一頁（給 WP2–WP9）

## 最小範例（js/pages/news.js）

```js
import { boot } from "../core/page.js";
import { load, ROOT } from "../core/content.js";
import { t, pick, fmtDate, localHref } from "../core/i18n.js";
import { el } from "../components/dom.js";
import { card, cardGrid } from "../components/card.js";

const { main } = await boot("news");          // 畫好頁首頁尾、套用 data-t 文字、設定 <title>
const items = await load("news");             // 讀 content/news.json（後台改過就讀 localStorage）

const cards = items.map(it => card({
  href: localHref(`item.html?type=news&id=${it.id}`, ROOT),   // 站內連結一律用 localHref（英文時自動帶 lang=en）
  image: it.images[0],
  title: it.title,                            // 雙語物件直接給，元件會用 pick() 取目前語言
  meta: fmtDate(it.date),                     // 中文顯示民國、英文顯示西元
  summary: it.summary,
}));
main.querySelector("[data-stub]")?.remove();  // 刪掉骨架提示
main.append(el("div", { class: "l-container" }, cardGrid(cards, { label: t("page.news") })));
```

做完後，把 HTML 裡的 `data-stub` 區塊和 `stub()` 的引用刪掉。

## 核心（js/core/，WP0 擁有）

| 模組 | 用途 |
|---|---|
| `page.js` | `boot(pageKey)`：每頁第一行；`setTitle(text)` |
| `content.js` | `load(name)`、`siteUrl(path)`、`ROOT`、`sanitize(html)`（內文 HTML 一律過濾）、後台用 `save`／`reset` |
| `i18n.js` | `lang`、`t(key, vars)`、`pick(雙語)`、`setText(el, 雙語)`、`localHref(path, ROOT)`、`fmtDate`、`fmtRange`、`applyTexts()` |
| `a11y.js` | `announce(訊息)`、`trapFocus(容器)`、`externalLink(a)`（外連加「另開新視窗」提示） |
| `motion.js` | `reducedMotion()`、`reveal(元素)` |
| `shell.js` | 頁首頁尾（boot 會呼叫，頁面不用碰） |

## 共用元件（js/components/，WP0 擁有）

| 元件 | 用途 |
|---|---|
| `dom.js` | `el(tag, attrs, children)`、`bi(tag, 雙語, attrs)`、`img(image)` |
| `card.js` | `card({...})`、`cardGrid(cards)`：整張可點、只有一個焦點 |
| `filterbar.js` | `filterBar({ fields, onChange })`、`matchText(q, ...欄位)`：條件同步到網址、筆數會念出來 |
| `modal.js` | `openModal({ title, content, opener })`：Esc 關閉、焦點鎖定、關閉後焦點回原處 |
| `timeline.js` | `timeline(groups)`：分組時間軸，項目可連內頁或開 modal |
| `pager.js` | `pager({ page, total, perPage, onPage })` |
| `breadcrumb.js` | `breadcrumb([{label, href}, ...])` |

## 規則提醒

- 畫面文字用 `t()` 或內容 JSON；缺的 key 寫變更提案請 WP0 加進 `content/ui.json`（`npm test` 會檢查）。
- 不要改 `js/core/`、`js/components/`、共用 CSS；需要新功能寫變更提案。
- 頁面專屬樣式寫在 `css/pages/<page>.css`，class 用 `p-<page>-` 開頭。
