/* 時間軸：分組（例如每 10 年一段）＋每組的事件。（WP0 擁有）

   timeline([
     { id: "d1920", label: "1920s", items: [
       { date: "1928-06-09", title: {zh,en}, summary: {zh,en}, href: "…" },          // 連到內頁
       { date: "1928", title: {zh,en}, onOpen: (btn) => openModal({…, opener: btn}) }, // 跳出圖文方塊
     ] },
   ])
   每組會有 id，可以用「依年度跳轉」的選單連到 #id。
*/
import { el, bi } from "./dom.js";
import { fmtDate } from "../core/i18n.js";

export function timeline(groups, { headingLevel = 2 } = {}) {
  const wrap = el("div", { class: "c-timeline" });
  groups.forEach(g => {
    const sec = el("section", { class: "c-timeline__group", id: g.id || null, "aria-labelledby": g.id ? `${g.id}-h` : null });
    sec.append(bi(`h${headingLevel}`, g.label, { class: "c-timeline__label", id: g.id ? `${g.id}-h` : null }));
    const ul = el("ul", { class: "c-timeline__list" });
    g.items.forEach(it => {
      const li = el("li", { class: "c-timeline__item" });
      if (it.dateLabel) li.append(el("p", { class: "c-timeline__date", text: it.dateLabel }));
      else if (it.date) li.append(el("p", { class: "c-timeline__date" }, el("time", { datetime: it.date, text: fmtDate(it.date) })));
      const h = el(`h${headingLevel + 1}`, { class: "c-timeline__title" });
      if (it.href) h.append(bi("a", it.title, { href: it.href }));
      else if (it.onOpen) {
        const btn = bi("button", it.title, { class: "c-timeline__btn", type: "button", "aria-haspopup": "dialog" });
        btn.addEventListener("click", () => it.onOpen(btn));
        h.append(btn);
      } else h.append(bi("span", it.title));
      li.append(h);
      if (it.summary) li.append(bi("p", it.summary, { class: "u-muted" }));
      ul.append(li);
    });
    sec.append(ul);
    wrap.append(sec);
  });
  return wrap;
}
