/* 共用頁首、頁尾、導覽、語言切換、示意站標記。（WP0 擁有）
   頁面放兩個佔位：<div data-shell="header"></div>、<div data-shell="footer"></div> */
import { load, ROOT, siteUrl } from "./content.js";
import { t, pick, setText, lang, htmlLang, localHref, switchLangHref } from "./i18n.js";

const ICONS = {
  facebook: '<path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/>',
  youtube: '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z"/>',
  instagram: '<path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.9-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 4c2.2 0 2.4 0 3.3.1 2.2.1 3.2 1.1 3.3 3.3.1.9.1 1.1.1 3.3v2.6c0 2.2 0 2.4-.1 3.3-.1 2.2-1.1 3.2-3.3 3.3-.9.1-1.1.1-3.3.1s-2.4 0-3.3-.1c-2.2-.1-3.2-1.1-3.3-3.3C5.3 15.7 5.3 15.5 5.3 13.3v-2.6c0-2.2 0-2.4.1-3.3.1-2.2 1.1-3.2 3.3-3.3C9.6 4 9.8 4 12 4z"/>',
};

/* 百年院慶概念 LOGO（白線＋金色臺灣，放在深色頁首／頁尾） */
const LOGO_SRC = "assets/img/brand/logo-100.svg";
const MARK_SRC = "assets/img/brand/logo-100-mark.svg";   /* 百年院慶標誌的圓形部分（頁首小圖） */

function el(tag, attrs = {}, html) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); });
  if (html != null) e.innerHTML = html;
  return e;
}

/** 依頁面 key 找導覽列要標示的項目（內頁依 type 對回第二層） */
const ITEM_PARENT = { event: "events", contribution: "contributions", news: "news", message: "centennial", division: "centennial" };
export function sectionOf(page) {
  if (page === "item") return ITEM_PARENT[new URLSearchParams(location.search).get("type")] || null;
  return page;
}

function renderHeader(site, page) {
  const current = sectionOf(page);
  const header = el("header", { class: "c-header" });
  const skip = el("a", { class: "c-skip", href: "#main" });
  skip.textContent = t("skip_to_main");

  const bar = el("div", { class: "c-header__bar" });
  const brand = el("a", { class: "c-header__brand", href: localHref("index.html", ROOT) });
  brand.append(el("img", { class: "c-header__logo", src: siteUrl(MARK_SRC), alt: "", width: "96", height: "96" }));
  const names = el("span", { class: "c-header__names" });
  setText(names.appendChild(el("span", { class: "c-header__name" })), site.brand_line1 || site.name);
  setText(names.appendChild(el("span", { class: "c-header__sub" })), site.brand_line2 || site.short_name);
  brand.append(names);

  const tools = el("div", { class: "c-header__tools" });
  const badge = el("span", { class: "c-demo-badge" });
  badge.textContent = t("demo_badge");
  const langLink = el("a", { class: "c-header__lang", href: switchLangHref(), lang: htmlLang(lang === "en" ? "zh" : "en"), hreflang: htmlLang(lang === "en" ? "zh" : "en") });
  langLink.textContent = t("lang_switch");
  const menuBtn = el("button", { class: "c-header__menu-btn", type: "button", "aria-expanded": "false", "aria-controls": "site-nav" },
    '<span class="c-header__menu-icon" aria-hidden="true"></span>');
  menuBtn.append(el("span", { class: "c-header__menu-text" }, t("menu")));
  tools.append(badge, langLink, menuBtn);

  const nav = el("nav", { class: "c-nav", id: "site-nav", "aria-label": t("nav_main") });
  const ul = el("ul", { class: "c-nav__list" });
  site.nav.forEach(item => {
    const li = el("li");
    const a = el("a", { class: "c-nav__link", href: localHref(item.href, ROOT) });
    setText(a, item.nav_label || item.label);
    if (item.key === current) a.setAttribute("aria-current", "page");
    li.append(a);
    ul.append(li);
  });
  nav.append(ul);

  menuBtn.addEventListener("click", () => {
    const open = menuBtn.getAttribute("aria-expanded") !== "true";
    menuBtn.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      menuBtn.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      menuBtn.focus();
    }
  });

  bar.append(brand, nav, tools);
  header.append(bar);
  return [skip, header];
}

function renderFooter(site) {
  const footer = el("footer", { class: "c-footer" });
  const box = el("div", { class: "l-container" });

  const nav = el("nav", { "aria-label": t("nav_footer") });
  const ul = el("ul", { class: "c-footer__nav" });
  site.nav.forEach(item => {
    const a = el("a", { href: localHref(item.href, ROOT) });
    setText(a, item.label);
    const li = el("li"); li.append(a); ul.append(li);
  });
  nav.append(ul);

  const social = el("ul", { class: "c-footer__social", "aria-label": t("social") });
  (site.social || []).forEach(s => {
    const a = el("a", { href: s.url, "aria-label": pick(s.label) },
      `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[s.key] || ""}</svg>`);
    const li = el("li"); li.append(a); social.append(li);
  });

  const copy = el("p");
  setText(copy, site.footer);
  const disc = el("p", { class: "c-footer__disclaimer" });
  setText(disc, site.disclaimer);

  const logo = el("img", { class: "c-footer__logo", src: siteUrl(LOGO_SRC), alt: "", width: "400", height: "440", loading: "lazy" });   // 頁尾放完整標誌
  box.append(logo, nav, social, copy, disc);
  footer.append(box);
  return footer;
}

/** 畫出頁首頁尾；page 是頁面 key（home、news、item…） */
export async function renderShell(page) {
  const site = await load("site");
  const h = document.querySelector('[data-shell="header"]');
  const f = document.querySelector('[data-shell="footer"]');
  if (h) h.replaceWith(...renderHeader(site, page));
  if (f) f.replaceWith(renderFooter(site));
  return site;
}
