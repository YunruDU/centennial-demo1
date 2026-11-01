/* 動態效果：是否減少動態、捲動揭示。（WP0 擁有） */

const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

/** 使用者是否開啟「減少動態效果」 */
export const reducedMotion = () => mq.matches;

/** 捲動到畫面內才淡入。元素加上 class="js-reveal" 即可，或傳入元素清單 */
export function reveal(els = document.querySelectorAll(".js-reveal")) {
  const list = [...els];
  if (reducedMotion() || !("IntersectionObserver" in window)) {
    list.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  list.forEach(el => io.observe(el));
}
