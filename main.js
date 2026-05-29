// ── 상수 ──────────────────────────────────────────
const TOTAL = 8;

// ── 순수 계산 ─────────────────────────────────────
const clamp        = (n, min, max)   => Math.min(Math.max(n, min), max);
const nextIndex    = (cur, d, total) => clamp(cur + d, 0, total - 1);
const toTransform  = (i)             => `translateX(${-i * 100}vw)`;
const toPercent    = (cur, total)    => `${(cur + 1) / total * 100}%`;
const toLabel      = (i)             => String(i + 1).padStart(2, '0');
const isFirst      = (i)             => i === 0;
const isLast       = (i, total)      => i === total - 1;
const staggerDelay = (i)             => 80 + i * 75;
const swipeDelta   = (dx, dy)        => Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36
                                          ? (dx < 0 ? 1 : -1)
                                          : 0;
const wheelDelta   = (e)             => Math.abs(e.deltaX) > Math.abs(e.deltaY)
                                          ? e.deltaX : e.deltaY;

// ── 상태 ──────────────────────────────────────────
const createState = ()              => ({ cur: 0, busy: false });
const setBusy     = (s, busy)       => ({ ...s, busy });
const moveTo      = (s, d, total)   => ({ cur: nextIndex(s.cur, d, total), busy: true });

// ── 원자 DOM 조작 (사이드이펙트) ──────────────────
const setTransform = (el, i)        => { el.style.transform = toTransform(i); };
const setWidth     = (el, v)        => { el.style.width = v; };
const setText      = (el, v)        => { el.textContent = v; };
const setClass     = (el, cls, on)  => { el.classList.toggle(cls, on); };

// ── 복합 DOM 업데이트 ──────────────────────────────
const updateDots   = (dots, cur) =>
  [...dots].forEach((d, i) => setClass(d, 'on', i === cur));

const updateArrows = (l, r, cur, total) => {
  setClass(l, 'hide', isFirst(cur));
  setClass(r, 'hide', isLast(cur, total));
};

const render = (state, els) => {
  setTransform(els.track,   state.cur);
  setWidth    (els.prog,    toPercent(state.cur, TOTAL));
  setText     (els.counter, toLabel(state.cur));
  updateDots  (els.dots.children, state.cur);
  updateArrows(els.arrL, els.arrR, state.cur, TOTAL);
};

// ── 애니메이션 ─────────────────────────────────────
const resetAnim   = (el)         => setClass(el, 'in', false);
const triggerAnim = (el, delay)  => setTimeout(() => setClass(el, 'in', true), delay);

const animateEls  = (els) =>
  els.forEach((el, i) => {
    resetAnim(el);
    requestAnimationFrame(() => triggerAnim(el, staggerDelay(i)));
  });

const animateBars = (bars) =>
  bars.forEach(bar => {
    setWidth(bar, '0');
    setTimeout(() => setWidth(bar, bar.dataset.w + '%'), 350);
  });

const animateSlide = (slide) => {
  animateEls ([...slide.querySelectorAll('.fu, .fl')]);
  animateBars([...slide.querySelectorAll('.bar-fill')]);
};

// ── 이벤트 핸들러 ─────────────────────────────────
const onKey = (go) => (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   go(-1);
};

const onSwipe = (go) => {
  let tx = 0, ty = 0;
  return {
    start: (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; },
    end:   (e) => {
      const d = swipeDelta(
        e.changedTouches[0].clientX - tx,
        e.changedTouches[0].clientY - ty
      );
      if (d) go(d);
    },
  };
};

const onWheel = (go) => {
  let lock = false;
  return (e) => {
    if (lock) return;
    const d = wheelDelta(e);
    if (Math.abs(d) < 15) return;
    go(d > 0 ? 1 : -1);
    lock = true;
    setTimeout(() => { lock = false; }, 850);
  };
};

// ── 도트 빌더 ─────────────────────────────────────
const buildDot = (i, total, go, getState) => {
  const d = document.createElement('div');
  d.className = 'dot' + (i === 0 ? ' on' : '');
  d.onclick   = () => go(i - getState().cur);
  return d;
};

const buildDots = (el, total, go, getState) =>
  Array.from({ length: total }, (_, i) => buildDot(i, total, go, getState))
       .forEach(d => el.appendChild(d));

// ── 초기화 ────────────────────────────────────────
const els = {
  track:   document.getElementById('track'),
  prog:    document.getElementById('prog'),
  counter: document.getElementById('curN'),
  dots:    document.getElementById('dots'),
  arrL:    document.getElementById('arrL'),
  arrR:    document.getElementById('arrR'),
};

let state = createState();
const getState = () => state;

const go = (delta) => {
  if (state.busy) return;
  state = moveTo(state, delta, TOTAL);
  render(state, els);
  animateSlide(els.track.children[state.cur]);
  setTimeout(() => { state = setBusy(state, false); }, 250);
};

buildDots(els.dots, TOTAL, go, getState);
render(state, els);
animateSlide(els.track.children[0]);

// ── 이벤트 등록 ───────────────────────────────────
const swipe = onSwipe(go);
document.addEventListener('keydown',    onKey(go),   );
document.addEventListener('touchstart', swipe.start, { passive: true });
document.addEventListener('touchend',   swipe.end,   { passive: true });
document.addEventListener('wheel',      onWheel(go), { passive: true });