/* ==================================================
   Common
================================================== */

/* ---------- Include : <div data-include="경로"></div> 자리에 공통 html 삽입 ----------
   ※ fetch 사용 → 로컬 서버(VS Code Live Server 등)에서 열어야 동작 (file:// 불가) */
const loadIncludes = () => {
  const targets = document.querySelectorAll('[data-include]');
  return Promise.all([...targets].map(async (el) => {
    try {
      const res = await fetch(el.dataset.include);
      if (!res.ok) throw new Error(res.status);
      el.outerHTML = await res.text();
    } catch (err) {
      console.warn(`[include] ${el.dataset.include} 로드 실패 - 로컬 서버에서 실행했는지 확인하세요.`, err);
    }
  }));
};

/* ---------- Header ---------- */
const initHeader = () => {
  const header = document.getElementById('header');
  if (!header) return;
  const btnMenu = header.querySelector('.btn-menu');

  // 현재 메뉴 : <body data-gnb="company" data-sub="ci"> → 해당 1depth / 2depth 링크 활성화
  const { gnb, sub } = document.body.dataset;
  if (gnb) {
    const link = header.querySelector(`.gnb a[data-gnb="${gnb}"]`);
    if (link) link.setAttribute('aria-current', 'page');
  }
  if (sub) {
    const link = header.querySelector(`.gnb a[data-sub="${sub}"]`);
    if (link) link.setAttribute('aria-current', 'page');
  }

  // 상단 고정, 스크롤 시 배경
  let ticking = false;

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 50);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  // Mobile menu
  const closeMenu = () => {
    header.classList.remove('is-open');
    document.body.classList.remove('is-lock');
    btnMenu.setAttribute('aria-expanded', 'false');
    btnMenu.setAttribute('aria-label', '메뉴 열기');
  };

  btnMenu.addEventListener('click', () => {
    const open = !header.classList.contains('is-open');
    if (!open) return closeMenu();
    header.classList.add('is-open');
    document.body.classList.add('is-lock');
    btnMenu.setAttribute('aria-expanded', 'true');
    btnMenu.setAttribute('aria-label', '메뉴 닫기');
  });

  header.querySelectorAll('.gnb a').forEach((a) => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
};

/* ---------- Scroll reveal ----------
   기본 : 한 번 나타나면 유지
   <body data-reveal-repeat> : 페이지 전체 반복 - 위로 스크롤해 요소가 화면 아래로 벗어나면 원위치 → 다시 내리면 재등장
   data-reveal="repeat"      : 해당 요소만 반복 */
const initReveal = () => {
  const reveals = document.querySelectorAll('[data-reveal]');
  const repeatAll = document.body.hasAttribute('data-reveal-repeat');
  const isRepeat = (el) => repeatAll || el.dataset.reveal === 'repeat';
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const repeat = isRepeat(entry.target);
        if (entry.isIntersecting) {
          entry.target.classList.add('is-show');
          if (!repeat) io.unobserve(entry.target);
        } else if (repeat && entry.boundingClientRect.top > 0) {
          // 화면 아래쪽으로 벗어난 경우만 (위로 지나간 요소는 유지)
          entry.target.classList.remove('is-show');
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-show'));
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  initReveal();
  await loadIncludes();
  initHeader();
});
