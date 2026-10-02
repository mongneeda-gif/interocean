/* ==================================================
   Main
================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Hero ① : 글자 단위 순차 등장 (+ 흐림 → 선명, CSS) ----------
     각 줄의 글자를 <span class="char" style="--i:순번"> 으로 나눔 → CSS 가 순번만큼 늦게 등장시킴
     지구본(.globe)은 자기 줄(BEY○ND)의 마지막 글자 다음 순번 → 첫 줄이 끝나자마자 톡 튀어나옴 */
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    // 스크린리더는 문장 하나로 읽음 (지구본 = 글자 'O')
    const labelSrc = heroTitle.cloneNode(true);
    labelSrc.querySelectorAll('.globe').forEach((g) => g.replaceWith('O'));
    heroTitle.setAttribute('aria-label', labelSrc.textContent.replace(/\s+/g, ' ').trim());

    let index = 0;
    heroTitle.querySelectorAll('.line > span').forEach((lineInner) => {
      lineInner.setAttribute('aria-hidden', 'true');
      [...lineInner.childNodes].forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE) return; // 지구본(<i>)은 그대로 둠
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'char';
          span.style.setProperty('--i', index++);
          span.textContent = ch;
          frag.appendChild(span);
        });
        node.replaceWith(frag);
      });
      // 지구본이 있는 줄이면 : 그 줄 글자가 모두 나온 직후 순번
      const globe = lineInner.querySelector('.globe');
      if (globe) globe.style.setProperty('--i', index);
    });
  }
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));

  /* ---------- Hero ② : 스크롤하면 줄마다 반대 방향으로 밀려남 ----------
     1·3번째 줄은 왼쪽, 2번째 줄은 오른쪽 / HERO_DRIFT : 스크롤 1px 당 이동량 (클수록 빠르게 벌어짐)
     translate 속성 사용 → 글자 등장 효과(transform)와 충돌 없음 / 동작 줄이기 설정에서는 안 함 */
  const heroLines = heroTitle ? heroTitle.querySelectorAll('.line') : [];
  if (heroLines.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const HERO_DRIFT = 0.35;
    let driftTicking = false;

    const updateDrift = () => {
      const y = Math.min(window.scrollY, window.innerHeight * 1.5); // hero 가 화면을 벗어난 뒤엔 계산 중단
      heroLines.forEach((line, i) => {
        const dir = i % 2 === 0 ? -1 : 1; // 짝수 번째(0,2) 왼쪽 / 홀수 번째(1) 오른쪽
        line.style.translate = `${dir * y * HERO_DRIFT}px 0`;
      });
      driftTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!driftTicking) {
        requestAnimationFrame(updateDrift);
        driftTicking = true;
      }
    }, { passive: true });
    updateDrift();
  }

  /* ---------- Intro : 세로 라인 + 다이버 (스크롤을 따라 내려옴) ---------- */
  const intro = document.querySelector('.intro');
  const introLine = intro && intro.querySelector('.intro-line');
  const introDiver = intro && intro.querySelector('.intro-diver');
  if (introLine) {
    const DIVER_RATIO = 0.9;  // 다이버 목표 위치 = 라인 길이의 90% (라인 끝보다 살짝 위)
    const DIVER_EASE = 0.08;  // 목표까지 따라가는 속도 (작을수록 더 늦게 따라옴)
    let lineTicking = false;
    let diverTarget = 0;
    let diverY = 0;
    let diverRunning = false;

    // 다이버 : 매 프레임 목표 위치로 조금씩 이동 → 라인보다 한 박자 늦게 도착
    const moveDiver = () => {
      diverY += (diverTarget - diverY) * DIVER_EASE;
      if (Math.abs(diverTarget - diverY) < 0.5) diverY = diverTarget;
      introDiver.style.translate = `0 ${diverY}px`;
      diverRunning = diverY !== diverTarget;
      if (diverRunning) requestAnimationFrame(moveDiver);
    };

    // 라인 끝이 화면 세로 60% 지점을 따라가도록 진행률 계산
    const updateLine = () => {
      const rect = intro.getBoundingClientRect();
      const progress = Math.min(Math.max((window.innerHeight * 0.6 - rect.top) / rect.height, 0), 1);
      introLine.style.setProperty('--line-progress', progress);

      if (introDiver) {
        diverTarget = Math.max(progress * rect.height * DIVER_RATIO - introDiver.offsetHeight, 0);
        introDiver.style.opacity = Math.min(progress * 5, 1); // 라인이 그려지기 시작하면 나타남
        if (!diverRunning) {
          diverRunning = true;
          requestAnimationFrame(moveDiver);
        }
      }
      lineTicking = false;
    };

    const requestLine = () => {
      if (!lineTicking) {
        requestAnimationFrame(updateLine);
        lineTicking = true;
      }
    };

    window.addEventListener('scroll', requestLine, { passive: true });
    window.addEventListener('resize', requestLine);
    updateLine();
  }

  /* ---------- Business : 카드 슬라이더 ---------- */
  if (window.Swiper) {
    // loop 모드에서 슬라이드 수가 부족하지 않도록 1회 복제
    const bizWrapper = document.querySelector('.business-slider .swiper-wrapper');
    [...bizWrapper.children].forEach((slide) => bizWrapper.appendChild(slide.cloneNode(true)));

    new Swiper('.business-slider', {
      slidesPerView: 'auto',
      spaceBetween: 24,
      centeredSlides: true,
      loop: true,
      speed: 900,
      grabCursor: true,
      autoplay: { delay: 3000, disableOnInteraction: false },
      breakpoints: { 0: { spaceBetween: 14 }, 769: { spaceBetween: 24 } },
    });
  }

  /* ---------- Process : 단계 탭 (자동 순환) ---------- */
  const processData = [
    {
      title: '드라이슈트 설계',
      desc: '인터오션 드라이슈트 설계는 3D 체형 측정에서 시작합니다. 개인 패턴으로 재단 위치를 정하고, 씰·지퍼·밸브 구조까지 방수와 활동성을 함께 맞춥니다.',
    },
    {
      title: '생산 품질관리',
      desc: '숙련된 기술진이 재단부터 봉제, 방수 테스트까지 전 공정을 직접 관리하며 엄격한 품질 기준을 적용합니다.',
    },
    {
      title: '스마트 제조',
      desc: '자동화 재단 설비와 데이터 기반 생산 관리로 균일한 품질과 빠른 납기를 실현합니다.',
    },
    {
      title: '연구 개발',
      desc: '현장 피드백과 소재 연구를 바탕으로 더 안전하고 편안한 수중 장비를 개발합니다.',
    },
  ];

  const cycleItems = document.querySelectorAll('.cycle-item');
  const detail = document.querySelector('.process-detail');
  const detailTitle = detail.querySelector('.detail-title');
  const detailDesc = detail.querySelector('.detail-desc');
  let current = 0;
  let timer = null;

  const setStep = (idx) => {
    current = idx;
    cycleItems.forEach((btn, i) => {
      const on = i === idx;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on);
    });
    detailTitle.textContent = processData[idx].title;
    detailDesc.textContent = processData[idx].desc;
    detail.classList.remove('is-change');
    void detail.offsetWidth; // 애니메이션 재시작
    detail.classList.add('is-change');
  };

  const startAuto = () => {
    clearInterval(timer);
    timer = setInterval(() => setStep((current + 1) % processData.length), 3500);
  };

  cycleItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      setStep(Number(btn.dataset.step));
      startAuto();
    });
  });
  startAuto();

  /* ---------- Partner : 로고 무한 롤링용 복제 ---------- */
  document.querySelectorAll('.partner-track').forEach((track) => {
    [...track.children].forEach((li) => {
      const clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  });
});
