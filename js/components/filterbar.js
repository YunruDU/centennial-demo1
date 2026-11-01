/* 篩選列：關鍵字＋下拉選單，狀態同步到網址（可分享），結果筆數用 aria-live 告知。（WP0 擁有）

   const bar = filterBar({
     fields: [
       { type: "search", key: "q", label: t("search") },
       { type: "chips", key: "category", label: t("category"), options: [{ value: "seminar", label: {zh,en} }, …] },   // 也可用 "select"
     ],
     onChange: state => { …依 state 篩選並重畫…; bar.setCount(n); },
   });
   container.append(bar.element);
   bar.state  // 目前的值，例如 { q: "", category: "" }
*/
import { el } from "./dom.js";
import { t, pick } from "../core/i18n.js";
import { announce } from "../core/a11y.js";

let uid = 0;

export function filterBar({ fields, onChange, label }) {
  const params = new URLSearchParams(location.search);
  const state = {};
  const form = el("form", { class: "c-filter", role: "search", "aria-label": label || t("filter"), onsubmit: e => e.preventDefault() });
  const count = el("p", { class: "c-filter__count" });

  const update = () => {
    const u = new URL(location.href);
    Object.entries(state).forEach(([k, v]) => { if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); });
    history.replaceState(null, "", u);
    onChange({ ...state });
  };

  let timer;
  fields.forEach(f => {
    const id = `flt-${++uid}-${f.key}`;
    state[f.key] = params.get(f.key) || "";
    if (f.type === "chips") {
      // 膠囊按鈕：全部＋各選項，一次只能選一個
      const group = el("div", { class: "c-chips", role: "group", "aria-label": f.label });
      const opts = [{ value: "", label: f.allLabel || t("filter_all") }, ...f.options];
      const btns = opts.map(o => {
        const b = el("button", { type: "button", class: "c-chip", "aria-pressed": String(state[f.key] === o.value), text: pick(o.label) });
        b.addEventListener("click", () => {
          state[f.key] = o.value;
          btns.forEach((x, i) => x.setAttribute("aria-pressed", String(opts[i].value === o.value)));
          update();
        });
        group.append(b); return b;
      });
      form.append(group);
      return;
    }
    const wrap = el("div", { class: "c-filter__field" }, el("label", { for: id, text: f.label }));
    let input;
    if (f.type === "select") {
      input = el("select", { id, name: f.key });
      input.append(el("option", { value: "", text: f.allLabel || t("filter_all") }));
      f.options.forEach(o => input.append(el("option", { value: o.value, text: pick(o.label) })));
      input.value = state[f.key];
      input.addEventListener("change", () => { state[f.key] = input.value; update(); });
    } else {
      input = el("input", { id, name: f.key, type: "search", placeholder: f.placeholder || t("search_placeholder"), autocomplete: "off" });
      input.value = state[f.key];
      input.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => { state[f.key] = input.value.trim(); update(); }, 250);
      });
    }
    wrap.append(input);
    form.append(wrap);
  });
  form.append(count);

  return {
    element: form,
    state,
    /** 更新筆數並通知報讀器 */
    setCount(n) {
      const msg = n ? t("results_count", { n }) : t("no_results");
      count.textContent = msg;
      announce(msg);
    },
    /** 第一次畫面用：依網址上的條件跑一次 */
    run() { onChange({ ...state }); },
  };
}

/** 關鍵字比對：在多個雙語欄位裡找（不分大小寫） */
export function matchText(q, ...values) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return values.some(v => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.some(x => matchText(q, x));
    if (typeof v === "object") return Object.values(v).some(x => String(x).toLowerCase().includes(needle));
    return String(v).toLowerCase().includes(needle);
  });
}
