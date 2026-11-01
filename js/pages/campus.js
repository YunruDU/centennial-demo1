/* 百年院區（WP7）：「時間大道」為主角的捲動敘事
   - 3D 時間大道滿版固定在背景（建築依興建年份沿路排列，不是地圖），文字卡片從上面捲過；
     捲到哪個年代，鏡頭沿路移到那一年，那時候蓋好的建築長出來（新蓋的變金色）；最後一章拉遠看全景
   - 老照片只當卡片裡的小張院史照片（原圖解析度不高，不放大）
   - 手機也看得到模型（上半部），卡片從下半部捲過
   - 沒有 JavaScript 時沒有模型，文字照順序閱讀 */
import { boot } from "../core/page.js";
import { load } from "../core/content.js";
import { t, pick } from "../core/i18n.js";
import { reducedMotion } from "../core/motion.js";
import { el, bi, img } from "../components/dom.js";
import { pageHead } from "../components/pagehead.js";
import { campusModel } from "./campus-model.js";

const { main } = await boot("campus");
const { chapters, model } = await load("campus");
main.append(await pageHead("campus", { image: { src: "assets/img/photos/campus-aerial.jpg", alt: { zh: "", en: "" }, width: 1600, height: 578 } }));

const story = el("section", { class: "p-campus-story", "aria-label": t("page.campus") });
const stage = el("div", { class: "p-campus-stage", "aria-hidden": "true" });
const cm = campusModel(model || [], { reduced: reducedMotion() });
const period = el("p", { class: "p-campus-stage__period" });
const count = el("p", { class: "p-campus-stage__count" });
// 年代進度：一排小點
const dots = el("ol", { class: "p-campus-stage__dots" }, chapters.map(ch => el("li", { text: pick(ch.period) })));
stage.append(cm.element, el("div", { class: "p-campus-stage__cap" }, [period, count, dots]), cm.controls, el("p", { class: "p-campus-stage__note", text: t("model_note") }));

const steps = el("ol", { class: "p-campus-steps" });
chapters.forEach((ch, i) => {
  const li = el("li", { class: "p-campus-step", "data-i": String(i) });
  // 卡片：上面大照片，下面左邊年代＋標題、右邊摘要＋照片說明
  const card = el("div", { class: "p-campus-card" });
  const fig = el("figure", { class: "p-campus-step__fig" }, img(ch.image));
  fig.append(el("figcaption", {}, [el("span", { class: "p-campus-step__src", text: t("archive_photo") }), bi("span", ch.image.alt)]));
  const right = el("div", { class: "p-campus-card__desc" }, bi("p", ch.body, { class: "p-campus-step__body" }));
  if (ch.detail) right.append(bi("p", ch.detail, { class: "p-campus-step__detail" }), el("p", { class: "p-campus-step__note", text: t("detail_note") }));
  card.append(fig, el("div", { class: "p-campus-card__text" }, [
    el("div", { class: "p-campus-card__head" }, [bi("p", ch.period, { class: "p-campus-step__period" }), bi("h2", ch.title, { class: "p-campus-step__title" })]),
    right,
  ]));
  li.append(card);
  steps.append(li);
});
story.append(stage, steps);
main.append(story);

document.documentElement.classList.add("has-js");
const built = y => (model || []).filter(b => b.kind !== "bus" && b.since <= y).length;   // 交通車不算建築
const setActive = i => {
  const ch = chapters[i];
  steps.querySelectorAll(".p-campus-step").forEach((s, k) => s.classList.toggle("is-active", k === i));
  dots.querySelectorAll("li").forEach((d, k) => { d.classList.toggle("is-current", k === i); d.classList.toggle("is-past", k < i); });
  period.textContent = pick(ch.period);
  // 最後一章拉遠，看整條時間大道
  const last = i === chapters.length - 1;
  if (ch.model_year) { cm.setYear(ch.model_year, i ? chapters[i - 1].model_year : -Infinity, { overview: last, zoom: ch.model_zoom || 1, rz: ch.model_rz }); count.textContent = t("buildings_count").replace("{n}", built(ch.model_year)); }
};
setActive(0);
const io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) setActive(Number(en.target.dataset.i)); });
}, { rootMargin: "-40% 0px -40% 0px" });
steps.querySelectorAll(".p-campus-step").forEach(s => io.observe(s));
if (reducedMotion()) story.classList.add("is-static");
