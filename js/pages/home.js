/* 首頁（WP1）：主視覺＋倒數、形象影片、百大貢獻精選、最新消息、近期活動。
   區塊順序與內容由 content/home.json 決定；3 款風格只靠 CSS 改變版面。 */
import { boot } from "../core/page.js";
import { load, ROOT, siteUrl } from "../core/content.js";
import { t, pick, fmtDate, fmtRange, localHref } from "../core/i18n.js";
import { externalLink } from "../core/a11y.js";
import { reducedMotion, reveal } from "../core/motion.js";
import { el, bi, img } from "../components/dom.js";
import { card, cardGrid } from "../components/card.js";
import { particleHero } from "./home-particles.js";

const { site, main } = await boot("home");
const [home, contributions, news, events, chronicle] = await Promise.all([load("home"), load("contributions"), load("news"), load("events"), load("chronicle")]);
const href = path => localHref(path, ROOT);

/* ---------- 共用：區塊標題列（小標＋大標＋看更多） ---------- */
function sectionHead(sec, morePath) {
  const head = el("div", { class: "p-home-sec__head" });
  const titles = el("div");
  titles.append(bi("p", sec.title, { class: "p-home-sec__kicker" }));
  titles.append(bi("h2", sec.heading || sec.title, { class: "p-home-sec__title" }));
  head.append(titles);
  if (morePath) {
    const a = el("a", { class: "c-more", href: href(morePath) }, [t("read_more"), el("span", { class: "u-visually-hidden", text: `：${pick(sec.title)}` }), el("span", { "aria-hidden": "true", text: " →" })]);
    head.append(a);
  }
  return head;
}
function section(key, sec, body, morePath) {
  const s = el("section", { class: `p-home-sec p-home-sec--${key} js-reveal` }, el("div", { class: "l-container" }, [sectionHead(sec, morePath), body]));
  return s;
}

/* ---------- 主視覺「百年光廊」：左邊標題與倒數，右邊用三張照片拼成的「100」，底下一條院史照片長廊 ---------- */
function hero(sec) {
  const s = el("section", { class: "p-home-hero", "aria-labelledby": "hero-title" });
  // 背景：慢慢漂動的極光柔光＋淡淡的點陣（裝飾）
  s.append(el("div", { class: "p-home-aurora", "aria-hidden": "true" }, [el("span", { class: "p-home-aurora__a" }), el("span", { class: "p-home-aurora__b" }), el("span", { class: "p-home-aurora__c" })]));
  const grid = el("div", { class: "l-container p-home-hero__grid" });

  const text = el("div", { class: "p-home-hero__text" });
  text.append(bi("p", sec.eyebrow, { class: "p-home-hero__eyebrow" }));
  text.append(bi("h1", sec.title, { id: "hero-title", class: "p-home-hero__title" }));
  text.append(bi("p", sec.lead, { class: "p-home-hero__lead" }));
  text.append(countdown(site.countdown_target));
  const ctas = el("div", { class: "p-home-hero__ctas" });
  (sec.ctas || []).forEach((c, i) => ctas.append(bi("a", c.label, { class: `c-btn${i ? " c-btn--ghost" : ""}`, href: href(c.href) })));
  text.append(ctas);
  if (sec.note) text.append(bi("p", sec.note, { class: "p-home-hero__note" }));

  // 右邊：粒子「100」的位置（粒子畫在整個主視覺的 canvas 上，這個框只是決定 100 擺在哪裡）
  const mark = el("div", { class: "p-home-hero__mark", "aria-hidden": "true" });
  const caption = el("p", { class: "p-home-hero__caption" });
  mark.append(caption);
  grid.append(text, mark);
  s.append(grid, strip(s));
  const photos = [
    ...chronicle.filter(c => (c.images || []).length).sort((a, b) => a.year - b.year).map(c => ({ src: siteUrl(c.images[0].src), year: c.year })),
    ...(sec.mark_recent || []).map(src => ({ src: siteUrl(src), year: 2026 })),
  ];
  heroInit = () => particleHero({
    hero: s, region: mark, captionEl: caption, photos, reduced: reducedMotion(),
    captions: { hundred: t("hero_cap_100"), taiwan: t("hero_cap_tw") },
    isPaused: () => s.classList.contains("is-paused"),
  });
  return s;
}

/* 院史照片長廊：慢慢往左移動，可暫停；減少動態效果時改成可左右捲動 */
function strip(heroEl) {
  const items = chronicle.filter(c => (c.images || []).length).sort((a, b) => a.year - b.year);
  const wrap = el("div", { class: "p-home-strip" });
  const head = el("div", { class: "l-container p-home-strip__head" });
  head.append(el("p", { class: "p-home-strip__title", text: t("strip_title") }));
  const pause = el("button", { class: "p-home-strip__pause", type: "button", "aria-pressed": "false" });
  // 一顆按鈕暫停主視覺所有動態：背景極光、照片翻面、照片長廊
  const setPaused = p => { heroEl.classList.toggle("is-paused", p); pause.setAttribute("aria-pressed", String(p)); pause.textContent = p ? t("play_motion") : t("pause_motion"); };
  pause.addEventListener("click", () => setPaused(!heroEl.classList.contains("is-paused")));
  head.append(pause);
  const track = el("ul", { class: "p-home-strip__track", role: "list" });
  const make = (c, hidden) => {
    const li = el("li", { class: "p-home-strip__item", "aria-hidden": hidden ? "true" : null });
    const a = el("a", { href: href(`chronicle.html#d${Math.floor(c.year / 10) * 10}`), tabindex: hidden ? "-1" : null });
    const pic = img(c.images[0]); if (hidden) pic.alt = "";
    a.append(el("figure", {}, [pic, el("figcaption", {}, [el("span", { class: "p-home-strip__year", text: String(c.year) }), bi("span", c.title, { class: "p-home-strip__cap" })])]));
    li.append(a); return li;
  };
  items.forEach(c => track.append(make(c, false)));
  items.forEach(c => track.append(make(c, true)));      // 第二份讓長廊可以無縫循環（報讀器略過）
  wrap.append(head, el("div", { class: "p-home-strip__viewport" }, track));
  setPaused(reducedMotion());
  return wrap;
}

function countdown(target) {
  const end = new Date(target).getTime();
  const box = el("div", { class: "p-home-countdown" });
  const label = el("span", { class: "p-home-countdown__label", text: t("countdown_label") });
  const sr = el("p", { class: "u-visually-hidden" });          // 報讀器只念一次天數，不每秒更新
  const cells = ["days", "hours", "minutes", "seconds"].map(k => {
    const num = el("span", { class: "p-home-countdown__num" });
    const cell = el("div", { class: "p-home-countdown__cell", "aria-hidden": "true" }, [num, el("span", { class: "p-home-countdown__unit", text: t(k) })]);
    return { k, num, cell };
  });
  const grid = el("div", { class: "p-home-countdown__grid" }, cells.map(c => c.cell));
  box.append(label, grid, sr);
  const tick = () => {
    let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    const v = { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
    cells.forEach(c => { c.num.textContent = c.k === "days" ? String(v.days) : String(v[c.k]).padStart(2, "0"); });
    return v.days;
  };
  sr.textContent = t("countdown_text", { d: tick() });
  setInterval(tick, 1000);
  return box;
}

/* ---------- 形象影片：連到 YouTube（不嵌入外部播放器） ---------- */
function video(sec) {
  const wrap = el("div", { class: "p-home-video" });
  const a = el("a", { class: "p-home-video__poster", href: sec.url });
  a.append(img(sec.poster), el("span", { class: "p-home-video__play", "aria-hidden": "true" }), el("span", { class: "u-visually-hidden", text: t("watch_on_youtube") }));
  externalLink(a);
  const text = el("div", { class: "p-home-video__text" });
  text.append(bi("p", sec.text));
  const btn = el("a", { class: "c-btn c-btn--ghost", href: sec.url, text: t("watch_on_youtube") });
  externalLink(btn);
  text.append(btn);
  wrap.append(a, text);
  return section("video", sec, wrap);
}

/* ---------- 精選卡片 ---------- */
function contributionsSec(sec) {
  const items = (contributions.items || []).slice(0, sec.limit || 6);
  const cards = items.map(it => card({
    href: href(`item.html?type=contribution&id=${it.id}`), image: it.image, title: it.title,
    meta: t(`div.${it.division}`), summary: it.summary,
  }));
  return section("contributions", sec, cardGrid(cards, { label: pick(sec.title) }), "contributions.html");
}

function newsSec(sec) {
  const items = [...news].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, sec.limit || 4);
  const ul = el("ul", { class: "p-home-news", role: "list" });
  items.forEach(it => {
    const li = el("li", { class: "p-home-news__item" });
    li.append(el("time", { class: "p-home-news__date", datetime: it.date, text: fmtDate(it.date) }));
    li.append(el("h3", { class: "p-home-news__title" }, bi("a", it.title, { href: href(`item.html?type=news&id=${it.id}`) })));
    if (it.summary) li.append(bi("p", it.summary, { class: "p-home-news__summary" }));
    ul.append(li);
  });
  return section("news", sec, ul, "news.html");
}

function eventsSec(sec) {
  const items = [...events].sort((a, b) => (a.date_start > b.date_start ? 1 : -1)).slice(0, sec.limit || 3);
  const cards = items.map(it => card({
    href: href(`item.html?type=event&id=${it.id}`), image: it.image, title: it.title,
    meta: `${it.date_label ? pick(it.date_label) : fmtRange(it.date_start, it.date_end)}｜${t(`cat.${it.category}`)}`,
    summary: it.summary,
  }));
  return section("events", sec, cardGrid(cards, { label: pick(sec.title) }), "events.html");
}

let heroInit = null;
const RENDER = { hero, video, contributions: contributionsSec, news: newsSec, events: eventsSec };
main.replaceChildren(...home.sections.map(sec => (RENDER[sec.type] ? RENDER[sec.type](sec) : null)).filter(Boolean));
reveal(main.querySelectorAll(".js-reveal"));
if (heroInit) requestAnimationFrame(() => heroInit());   // 版面排好後再算粒子位置
