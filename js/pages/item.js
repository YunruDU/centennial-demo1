/* 第三層內頁：item.html?type=event|contribution|news|message|division&id=…（WP0 擁有）
   各類型要多顯示什麼，請在自己的 handoff 檔寫變更提案，由 WP0 加進 SOURCES。 */
import { boot, setTitle } from "../core/page.js";
import { load, sanitize, ROOT, siteUrl } from "../core/content.js";
import { t, pick, setText, fmtDate, fmtRange, localHref, fallbackLang, htmlLang } from "../core/i18n.js";
import { externalLink } from "../core/a11y.js";
import { el, bi, img } from "../components/dom.js";
import { breadcrumb } from "../components/breadcrumb.js";
import { openModal } from "../components/modal.js";

const SOURCES = {
  event: {
    file: "events", parent: "events", list: d => d,
    meta: it => [[t("date"), it.date_label ? pick(it.date_label) : fmtRange(it.date_start, it.date_end)], [t("location"), pick(it.location)], [t("category"), it.category ? t(`cat.${it.category}`) : ""]],
    images: it => (it.image ? [it.image] : []),
  },
  contribution: {
    file: "contributions", parent: "contributions", list: d => d.items || [],
    meta: it => [[t("category"), it.division ? t(`div.${it.division}`) : ""]],
    images: it => (it.image ? [it.image] : []),
    links: it => (it.external_url ? [{ label: t("further_reading"), url: it.external_url }] : []),
    tags: it => it.keywords || [],
  },
  news: {
    file: "news", parent: "news", list: d => d,
    meta: it => [[t("date"), fmtDate(it.date)]],
    images: it => it.images || [],
  },
  message: {
    file: "centennial", parent: "centennial", list: d => (d.message ? [d.message] : []),
    meta: it => [[t("name"), pick(it.name)]],
    images: it => (it.photo ? [it.photo] : []),
  },
  division: {
    file: "centennial", parent: "centennial", list: d => d.divisions || [],
    title: it => it.name,
    body: it => it.summary,
    images: () => [],
  },
};

const params = new URLSearchParams(location.search);
const type = params.get("type");
const id = params.get("id");
const src = SOURCES[type];

const { main } = await boot("item");
const box = el("div", { class: "l-container l-section" });
main.append(box);

let item = null;
if (src && id) {
  try {
    const data = await load(src.file);
    item = src.list(data).find(x => x.id === id) || null;
  } catch (e) {
    console.error(e);
  }
}

const crumbs = [{ label: t("page.home"), href: localHref("index.html", ROOT) }];
if (src) crumbs.push({ label: t(`page.${src.parent}`), href: localHref(`${src.parent}.html`, ROOT) });

if (!item) {
  setTitle(t("not_found_title"));
  crumbs.push({ label: t("not_found_title") });
  box.append(
    breadcrumb(crumbs),
    el("h1", { text: t("not_found_title") }),
    el("p", { text: t("not_found_body") }),
    el("a", { class: "c-btn c-btn--ghost", href: crumbs[crumbs.length - 2].href, text: t("back") }),
  );
} else {
  const title = src.title ? src.title(item) : item.title;
  setTitle(pick(title));
  crumbs.push({ label: title });
  const art = el("article", { class: `c-article c-article--${type}` });   // 依類型微調版面（例如院長的話：圖在左、文在右）
  art.append(bi("h1", title));

  // 基本資料（日期、地點、類別…）
  const meta = (src.meta ? src.meta(item) : []).filter(([, v]) => v);
  if (meta.length) {
    const dl = el("dl", { class: "c-article__meta" });
    meta.forEach(([k, v]) => {
      dl.append(el("div", {}, [el("dt", { class: "u-visually-hidden", text: k }), el("dd", { text: v })]));
    });
    art.append(dl);
  }

  // 圖片：第一張大圖可點擊放大，其他排在下面
  const images = src.images(item).filter(Boolean);
  images.forEach((image, i) => {
    const fig = el("figure", { class: "c-article__figure" });
    const pic = img(image, { lazy: i > 0 });
    const zoom = el("button", { class: "c-zoom", type: "button", "aria-label": `${t("zoom_image")}：${pick(image.alt)}` }, pic);
    zoom.addEventListener("click", () => {
      openModal({ title: pick(image.alt) || t("zoom_image"), content: img(image, { lazy: false }), opener: zoom });
    });
    fig.append(zoom);
    art.append(fig);
  });

  // 內文（只允許安全的標籤）；英文缺時退回中文並標 lang
  const bodyVal = src.body ? src.body(item) : item.body;
  if (pick(bodyVal)) {
    const body = el("div", { class: "c-article__body" });
    const fb = fallbackLang(bodyVal);
    if (fb) body.lang = htmlLang(fb);
    if (/<[a-z]/i.test(pick(bodyVal))) {
      body.append(sanitize(pick(bodyVal)));
      body.querySelectorAll('a[target="_blank"]').forEach(externalLink);   // 外部連結加「另開新視窗」提示
    }
    else body.append(el("p", { text: pick(bodyVal) }));
    // 信件式內容（院長的話）：開頭稱呼、結尾簽名
    if (item.salutation) body.prepend(bi("p", item.salutation, { class: "c-article__salutation" }));
    if (item.sign) {
      const sign = el("div", { class: "c-article__sign" });
      if (item.sign.image) { const s = img(item.sign.image, { lazy: false }); sign.append(s); }
      sign.append(bi("p", item.sign.title, { class: "c-article__sign-title" }));
      if (item.sign.date) sign.append(bi("p", item.sign.date, { class: "c-article__sign-date" }));
      body.append(sign);
    }
    art.append(body);
  }

  // 影音（有才顯示）
  if (item.video && item.video.src) {
    const sec = el("section", { class: "c-article__section" }, el("h2", { text: t("video") }));
    const v = el("video", { controls: true, preload: "none", poster: item.video.poster ? siteUrl(item.video.poster.src) : null });
    v.append(el("source", { src: siteUrl(item.video.src) }));
    if (item.video.captions) v.append(el("track", { kind: "captions", src: siteUrl(item.video.captions), srclang: "zh-Hant", label: "中文", default: true }));
    sec.append(el("div", { class: "c-video" }, v));
    art.append(sec);
  }

  // 學組：所屬研究所及中心
  if (type === "division" && item.institutes && item.institutes.length) {
    const sec = el("section", { class: "c-article__section" }, el("h2", { text: t("institutes") }));
    const ul = el("ul", { class: "c-article__links" });
    item.institutes.forEach(ins => {
      const li = el("li");
      const a = externalLink(bi("a", ins.name, { href: ins.url }));
      li.append(a);
      if (ins.summary) li.append(bi("p", ins.summary, { class: "u-muted" }));
      ul.append(li);
    });
    sec.append(ul);
    art.append(sec);
  }

  // 相關連結
  const links = [...(item.links || []), ...(src.links ? src.links(item) : [])];
  if (links.length) {
    const sec = el("section", { class: "c-article__section" }, el("h2", { text: t("related_links") }));
    const ul = el("ul", { class: "c-article__links" });
    links.forEach(l => {
      const a = bi("a", l.label, { href: l.url });
      if (/^https?:/i.test(l.url)) externalLink(a);
      ul.append(el("li", {}, a));
    });
    sec.append(ul);
    art.append(sec);
  }

  // 關鍵字標籤
  const tags = src.tags ? src.tags(item) : item.tags || [];
  if (tags.length) {
    const sec = el("section", { class: "c-article__section" }, el("h2", { text: t("tags") }));
    const ul = el("ul", { class: "c-tags" });
    tags.forEach(tg => ul.append(el("li", {}, bi("span", tg, { class: "c-tag" }))));
    sec.append(ul);
    art.append(sec);
  }

  art.append(el("p", { class: "c-article__section" }, el("a", { href: crumbs[1].href, text: `‹ ${t("back")}` })));
  // 百大貢獻用專屬版面（主視覺＋資訊卡＋同學組其他貢獻），其他類型用通用文章版面
  if (type === "contribution") {
    const { contributionPage } = await import("./item-contribution.js");
    box.append(breadcrumb(crumbs), contributionPage(item, src.list(await load(src.file))));
  } else box.append(breadcrumb(crumbs), art);
}
