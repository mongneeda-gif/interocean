/* ==================================================
   Sub
================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Parallax : 스크롤에 따라 요소 이동 ----------
     data-speed   : 위로 이동 (값이 클수록 빠름)
     data-speed-x : 왼쪽으로 이동 (값이 클수록 빠름, 음수면 오른쪽) */
  /* data-move-x : 부모 영역이 화면 중앙에 올 때 원위치, 스크롤에 따라 왼쪽으로 이동
     (페이지 아래쪽 섹션용 / 값이 클수록 빠름, 음수면 오른쪽) */
  /* data-slide-x="거리(px)" : 화면 아래로 들어올 때 오른쪽으로 거리만큼 떨어져 있다가
     스크롤에 따라 왼쪽으로 이동, 요소 상단이 화면 중앙에 오면 원위치에서 멈춤 (음수면 왼쪽에서 들어옴)
     ※ transform 대신 translate 속성 사용 → 다른 transform 과 충돌 없음 */
  const items = document.querySelectorAll('[data-speed], [data-speed-x]');
  const moveItems = document.querySelectorAll('[data-move-x]');
  const slideItems = document.querySelectorAll('[data-slide-x]');
  if ((items.length || moveItems.length || slideItems.length) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      items.forEach((el) => {
        const moveX = -y * Number(el.dataset.speedX || 0);
        const moveY = -y * Number(el.dataset.speed || 0);
        el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });

      const viewCenter = window.innerHeight / 2;
      moveItems.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        const offset = rect.top + rect.height / 2 - viewCenter;
        el.style.transform = `translate3d(${offset * Number(el.dataset.moveX)}px, 0, 0)`;
      });

      slideItems.forEach((el) => {
        const top = el.getBoundingClientRect().top;
        // 1 : 화면 하단에 막 들어옴 → 0 : 화면 중앙 도착
        const progress = Math.min(Math.max((top - viewCenter) / viewCenter, 0), 1);
        el.style.translate = `${progress * Number(el.dataset.slideX)}px 0`;
      });
      ticking = false;
    };

    window.addEventListener('resize', update);

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------- 꽉 참 → 제자리 : [data-expand] ----------
     요소 상단이 화면 하단에 들어올 때 = 화면 가로 꽉 참, 거기서 화면 높이의 110% 만큼 스크롤하면 = 부모 콘텐츠 폭(제자리)
     양옆을 clip-path 로 잘라내는 방식 (CSS 의 --clip-x, --clip-r 갱신) / 위로 올리면 다시 넓어짐 */
  const expandItems = document.querySelectorAll('[data-expand]');
  if (expandItems.length) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let expandTicking = false;

    const updateExpand = () => {
      const vh = window.innerHeight;
      expandItems.forEach((el) => {
        const parent = el.parentElement;
        const ps = getComputedStyle(parent);
        const contentW = parent.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
        const maxClip = Math.max((el.offsetWidth - contentW) / 2, 0);
        const radius = parseFloat(getComputedStyle(el).getPropertyValue('--radius')) || 0;

        const top = el.getBoundingClientRect().top;
        const progress = reduce ? 1 : Math.min(Math.max((vh - top) / (vh * 1.1), 0), 1);
        el.style.setProperty('--clip-x', `${maxClip * progress}px`);
        el.style.setProperty('--clip-r', `${radius * progress}px`);
      });
      expandTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!expandTicking) {
        requestAnimationFrame(updateExpand);
        expandTicking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateExpand);
    updateExpand();
  }

  /* ---------- 순차 활성화 : [data-auto-active="간격(ms)"] ----------
     목록의 자식(li)에 차례로 .is-active 부여 (마우스 오버한 것처럼 하나씩 강조)
     - 화면에 보일 때만 진행, 목록에 마우스를 올리면 멈추고 오버한 항목부터 이어서 진행
     - 강조 스타일은 CSS 에서 li:hover 와 li.is-active 를 함께 지정 */
  document.querySelectorAll('[data-auto-active]').forEach((list) => {
    const items = [...list.children];
    if (items.length < 2) return;
    const delay = Number(list.dataset.autoActive) || 2000;
    let index = 0;
    let timer = null;
    let inView = false;
    let hovering = false;

    const setActive = (i) => {
      index = (i + items.length) % items.length;
      items.forEach((el, n) => el.classList.toggle('is-active', n === index));
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      if (timer || !inView || hovering) return;
      timer = setInterval(() => setActive(index + 1), delay);
    };

    setActive(0);
    items.forEach((el, n) => el.addEventListener('mouseenter', () => setActive(n)));
    list.addEventListener('mouseenter', () => { hovering = true; stop(); });
    list.addEventListener('mouseleave', () => { hovering = false; start(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start(); else stop();
      }, { threshold: 0.3 }).observe(list);
    } else {
      inView = true;
      start();
    }
  });

  /* ---------- 연혁 : 현재 보고 있는 연대 메뉴 활성화 ----------
     화면 위에서 40% 지점을 지난 마지막 연대(.history-decade)를 현재 연대로 판단 */
  const historyLinks = document.querySelectorAll('.history-nav a');
  if (historyLinks.length) {
    const decades = [...historyLinks].map((a) => document.querySelector(a.getAttribute('href')));
    let historyTicking = false;

    const updateHistory = () => {
      const line = window.innerHeight * 0.4;
      let current = 0;
      decades.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) current = i;
      });
      historyLinks.forEach((a, i) => a.classList.toggle('is-active', i === current));
      historyTicking = false;
    };

    window.addEventListener('scroll', () => {
      if (!historyTicking) {
        requestAnimationFrame(updateHistory);
        historyTicking = true;
      }
    }, { passive: true });
    updateHistory();
  }

  /* ---------- 인증사항 : 분류 탭 ----------
     탭의 data-filter 와 같은 data-cate 항목만 표시 (all = 전체) */
  const certTabs = document.querySelectorAll('.cert-filter [data-filter]');
  const certItems = document.querySelectorAll('.cert-item');
  if (certTabs.length) {
    certTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        certTabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on);
        });
        certItems.forEach((item) => {
          const show = filter === 'all' || item.dataset.cate === filter;
          item.hidden = !show;
          item.classList.remove('is-in');
          if (show) {
            void item.offsetWidth; // 등장 애니메이션 다시 시작
            item.classList.add('is-in');
          }
        });
      });
    });
  }

  /* ---------- 인증사항 : 크게 보기 팝업 ----------
     카드 클릭 → 팝업 / 이전·다음은 현재 탭에 보이는 항목 안에서 이동 / ESC · 바깥 클릭 · 닫기 버튼으로 닫음 */
  const certModal = document.querySelector('.cert-modal');
  if (certModal && certItems.length) {
    const modalImg = certModal.querySelector('.cert-modal-img');
    const modalTitle = certModal.querySelector('.cert-modal-title');
    let visible = [];
    let current = 0;
    let lastFocus = null;

    const show = (i) => {
      current = (i + visible.length) % visible.length;
      const card = visible[current].querySelector('.cert-card');
      const img = card.querySelector('img');
      modalImg.src = card.dataset.full;
      modalImg.alt = img.alt;
      modalTitle.textContent = card.querySelector('.cert-title').textContent;
    };

    const open = (item) => {
      visible = [...certItems].filter((el) => !el.hidden);
      lastFocus = document.activeElement;
      show(visible.indexOf(item));
      certModal.hidden = false;
      document.body.classList.add('is-lock');
      certModal.querySelector('.cert-modal-close').focus();
    };

    const close = () => {
      certModal.hidden = true;
      document.body.classList.remove('is-lock');
      if (lastFocus) lastFocus.focus();
    };

    certItems.forEach((item) => {
      item.querySelector('.cert-card').addEventListener('click', () => open(item));
    });
    certModal.querySelector('.cert-modal-close').addEventListener('click', close);
    certModal.querySelector('.cert-modal-prev').addEventListener('click', () => show(current - 1));
    certModal.querySelector('.cert-modal-next').addEventListener('click', () => show(current + 1));
    certModal.addEventListener('click', (e) => { if (e.target === certModal) close(); }); // 바깥(어두운 영역) 클릭
    document.addEventListener('keydown', (e) => {
      if (certModal.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- 찾아오시는 길 : 지점 탭 ----------
     탭 클릭 → 해당 정보 패널(aria-controls)만 표시 + 지도 iframe 주소를 탭의 data-map 으로 교체 */
  const locTabs = document.querySelectorAll('.loc-tabs [role="tab"]');
  const locMap = document.querySelector('.loc-map iframe');
  if (locTabs.length) {
    locTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        locTabs.forEach((t) => {
          const on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on);
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          if (!panel) return;
          panel.hidden = !on;
          panel.classList.remove('is-in');
          if (on) {
            void panel.offsetWidth; // 등장 애니메이션 다시 시작
            panel.classList.add('is-in');
          }
        });
        if (locMap && tab.dataset.map && locMap.getAttribute('src') !== tab.dataset.map) {
          locMap.setAttribute('src', tab.dataset.map);
        }
      });
    });
  }

  /* ---------- 사업문의 폼 ----------
     - 첨부파일 : 선택한 파일 이름 표시
     - 문의하기 : 필수 항목 · 이메일 형식 확인 → 빠진 칸 빨간 테두리 + 안내 문구, 첫 칸으로 이동
     ※ 정적 페이지라 실제 전송 없음 → 서버 연동 시 아래 "전송 안내" 부분을 실제 전송(form.submit() 또는 fetch)으로 교체 */
  const inqForm = document.querySelector('.inq-form');
  if (inqForm) {
    const msg = inqForm.querySelector('.inq-msg');
    const fileInput = inqForm.querySelector('.inq-file input');
    const fileName = inqForm.querySelector('.inq-file-name');
    const agree = inqForm.querySelector('[name="agree"]');
    const labelOf = (el) => {
      const lb = el.id && inqForm.querySelector(`label[for="${el.id}"]`);
      return lb ? lb.childNodes[0].textContent.trim() : '개인정보 수집·이용 동의';
    };

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        fileName.textContent = fileInput.files.length ? fileInput.files[0].name : '선택된 파일 없음';
      });
    }

    // 입력하면 해당 칸의 오류 표시 해제
    inqForm.addEventListener('input', (e) => e.target.classList.remove('is-error'));
    agree.addEventListener('change', () => agree.closest('.inq-agree').classList.toggle('is-error', !agree.checked));

    inqForm.addEventListener('reset', () => {
      inqForm.querySelectorAll('.is-error').forEach((el) => el.classList.remove('is-error'));
      fileName.textContent = '선택된 파일 없음';
      msg.textContent = ''; msg.classList.remove('is-ok');
    });

    inqForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const missing = [];
      let first = null;
      inqForm.querySelectorAll('.inq-input[required]').forEach((el) => {
        const empty = !el.value.trim();
        const badEmail = el.type === 'email' && !empty && !el.checkValidity();
        el.classList.toggle('is-error', empty || badEmail);
        if (empty) missing.push(labelOf(el));
        if (badEmail) missing.push('이메일 형식');
        if ((empty || badEmail) && !first) first = el;
      });
      agree.closest('.inq-agree').classList.toggle('is-error', !agree.checked);
      if (!agree.checked) { missing.push('개인정보 수집·이용 동의'); if (!first) first = agree; }

      msg.classList.remove('is-ok');
      if (missing.length) {
        msg.textContent = `다음 항목을 확인해 주세요 : ${missing.join(', ')}`;
        first.focus();
        return;
      }
      // 전송 안내 (서버 연동 전)
      msg.classList.add('is-ok');
      msg.textContent = '입력 내용이 확인되었습니다. (현재 퍼블리싱 단계로 실제 전송은 서버 연동 후 가능합니다)';
    });
  }

  
});
