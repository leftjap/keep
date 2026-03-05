// ═══════════════════════════════════════
// gesture.js — 모바일/태블릿/PC 제스처 통합
// ═══════════════════════════════════════

// ═══ 모바일 스와이프 (768px 이하) ═══
function setupGesturesAndUI() {
  const app      = document.getElementById('mainApp');
  const editorEl = document.querySelector('.editor');
  const listEl   = document.querySelector('.list-panel');
  const sideEl   = document.querySelector('.side');
  const allEls   = [editorEl, listEl, sideEl];
  window._itemSwiping = false;

  let startX = 0, startY = 0, swiping = false, swipeDir = null, decided = false, startState = null;

  function getState() {
    if (app.classList.contains('view-side'))   return 'side';
    if (app.classList.contains('view-editor')) return 'editor';
    return 'list';
  }

  function cleanStyles() {
    allEls.forEach(el => { if (el) { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; } });
    const rp = document.getElementById('sideRubber');
    if (rp) { rp.style.transition = ''; rp.style.width = '0'; }
    if (sideEl) {
      const sh = sideEl.querySelector('.side-hdr'), ss = sideEl.querySelector('.side-scroll');
      if (sh) { sh.style.transition = ''; sh.style.transform = ''; }
      if (ss) { ss.style.transition = ''; ss.style.transform = ''; }
    }
    const erp = document.getElementById('editorRubber');
    if (erp) { erp.style.transition = ''; erp.style.width = '0'; }
    ['.ed-topbar', null, null, null, null, null].forEach(() => {});
    const edEls = [
      editorEl ? editorEl.querySelector('.ed-topbar') : null,
      document.getElementById('edToolbar'),
      document.getElementById('editorText'),
      document.getElementById('editorBook'),
      document.getElementById('editorQuote'),
      document.getElementById('editorMemo')
    ];
    edEls.forEach(el => { if (el) { el.style.transition = ''; el.style.transform = ''; } });
  }

  function animateBack() {
    const T = 'transform .25s ease, opacity .25s';
    allEls.forEach(el => { if (el) { el.style.transition = T; el.style.transform = ''; el.style.opacity = ''; } });
    const rp = document.getElementById('sideRubber');
    if (rp) { rp.style.transition = 'width .25s ease'; rp.style.width = '0'; }
    if (sideEl) {
      const sh = sideEl.querySelector('.side-hdr'), ss = sideEl.querySelector('.side-scroll');
      if (sh) { sh.style.transition = 'transform .25s ease'; sh.style.transform = ''; }
      if (ss) { ss.style.transition = 'transform .25s ease'; ss.style.transform = ''; }
    }
    const edRubber = document.getElementById('editorRubber');
    if (edRubber) { edRubber.style.transition = 'width .25s ease'; edRubber.style.width = '0'; }
    const edEls = [
      editorEl ? editorEl.querySelector('.ed-topbar') : null,
      document.getElementById('edToolbar'),
      document.getElementById('editorText'),
      document.getElementById('editorBook'),
      document.getElementById('editorQuote'),
      document.getElementById('editorMemo')
    ];
    edEls.forEach(el => { if (el) { el.style.transition = 'transform .25s ease'; el.style.transform = ''; } });
    setTimeout(cleanStyles, 280);
  }

  document.addEventListener('touchstart', function(e) {
    if (window.innerWidth > 768) return;
    if (e.touches.length !== 1 || window._itemSwiping) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (t && (t.closest('button') || t.closest('.fab-btn'))) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    swiping = false; swipeDir = null; decided = false;
    startState = getState();
  }, { capture: true, passive: true });

  document.addEventListener('touchmove', function(e) {
    if (window.innerWidth > 768 || startState === null) return;
    if (window._itemSwiping) { startState = null; return; }
    if (e.touches.length !== 1) return;
    const cx = e.touches[0].clientX, cy = e.touches[0].clientY;
    const dx = cx - startX, dy = cy - startY;

    if (!decided) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      decided = true;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) { startState = null; return; }
      swipeDir = dx > 0 ? 'right' : 'left';
      if (startState === 'list' && swipeDir === 'left') { startState = null; return; }
      swiping = true;
      if (e.cancelable) e.preventDefault();
      allEls.forEach(el => { if (el) el.style.transition = 'none'; });
    }
    if (!swiping) return;
    if (e.cancelable) e.preventDefault();

    const vw   = window.innerWidth;
    const sideW = sideEl ? Math.min(sideEl.offsetWidth, vw * 0.82) : vw * 0.75;

    if (startState === 'side' && swipeDir === 'right') {
      const maxRubber = 80, raw = Math.max(0, dx);
      const rubberDx  = maxRubber * (1 - Math.exp(-raw / maxRubber));
      const rp        = document.getElementById('sideRubber');
      const sh = sideEl.querySelector('.side-hdr'), ss = sideEl.querySelector('.side-scroll');
      if (rp) rp.style.width = rubberDx + 'px';
      if (sh) sh.style.transform = `translate3d(${rubberDx}px,0,0)`;
      if (ss) ss.style.transform = `translate3d(${rubberDx}px,0,0)`;
    } else if (startState === 'side' && swipeDir === 'left') {
      const move = Math.max(-sideW, Math.min(0, dx));
      const prog = Math.abs(move) / sideW;
      if (sideEl) sideEl.style.transform = `translate3d(${move}px,0,0)`;
      if (listEl) { listEl.style.transform = `translate3d(${Math.max(0, sideW + dx)}px,0,0)`; listEl.style.opacity = String(Math.min(1, 0.4 + prog * 0.6)); }
    } else if (startState === 'list' && swipeDir === 'right') {
      const move = Math.max(0, Math.min(dx, sideW));
      const prog = move / sideW;
      if (sideEl) sideEl.style.transform = `translate3d(${-sideW + move}px,0,0)`;
      if (listEl) { listEl.style.transform = `translate3d(${move}px,0,0)`; listEl.style.opacity = String(Math.max(0.5, 1 - prog * 0.5)); }
    } else if (startState === 'editor' && swipeDir === 'left') {
      const maxRubber = 80, raw = Math.max(0, Math.abs(dx));
      const rubberDx  = maxRubber * (1 - Math.exp(-raw / maxRubber));
      const edRubber  = document.getElementById('editorRubber');
      const edTopbar  = editorEl.querySelector('.ed-topbar');
      const edEls     = [edTopbar, document.getElementById('edToolbar'), document.getElementById('editorText'), document.getElementById('editorBook'), document.getElementById('editorQuote'), document.getElementById('editorMemo')];
      if (edRubber) edRubber.style.width = rubberDx + 'px';
      const shift = `translate3d(-${rubberDx}px,0,0)`;
      edEls.forEach(el => { if (el) el.style.transform = shift; });
    } else if (startState === 'editor' && swipeDir === 'right') {
      const move = Math.max(0, Math.min(dx, vw));
      if (editorEl) editorEl.style.transform = `translate3d(${move}px,0,0)`;
      if (listEl)   { listEl.style.transform = `translate3d(${-vw * 0.3 + move * 0.3}px,0,0)`; listEl.style.opacity = String(Math.min(1, 0.6 + move / vw * 0.4)); }
    }
  }, { capture: true, passive: false });

  document.addEventListener('touchend', function(e) {
    if (window.innerWidth > 768 || !swiping || startState === null) { startState = null; decided = false; return; }
    const dx         = e.changedTouches[0].clientX - startX;
    const savedState = startState, savedDir = swipeDir;
    swiping = false; swipeDir = null; decided = false; startState = null;
    const vw = window.innerWidth, minSwipe = Math.max(80, vw * 0.25);
    let didSwipe = false;
    if (savedState === 'side'   && dx < -minSwipe) didSwipe = true;
    else if (savedState === 'list'   && dx >  minSwipe) didSwipe = true;
    else if (savedState === 'editor' && dx >  minSwipe) didSwipe = true;

    if ((savedState === 'side' && savedDir === 'right') || (savedState === 'editor' && savedDir === 'left')) {
      animateBack();
    } else if (didSwipe) {
      if (savedState === 'list')   app.classList.add('view-side');
      else if (savedState === 'side') app.classList.remove('view-side');
      cleanStyles();
      if (savedState === 'editor') handleDone();
    } else {
      animateBack();
    }
  }, { capture: true, passive: true });

  document.addEventListener('touchcancel', function() {
    if (swiping) animateBack();
    startState = null; decided = false; swiping = false;
  }, { capture: true, passive: true });
}

// ═══ 리스트 아이템 스와이프 액션 (좌 스와이프 → pin/del) ═══
function setupSwipeActions() {
  const listEl = document.getElementById('pane-list');
  if (!listEl) return;
  let startX = 0, startY = 0, currentItem = null, currentActions = null, swiping = false, dx = 0;
  let wasSwiped = false, rafId = null;
  const THRESHOLD = 60, ACTIONS_W = 160;

  function getActions(item) { return item ? item.querySelector('.swipe-actions') : null; }
  function closeCurrent() {
    if (!currentItem) return;
    const acts = getActions(currentItem);
    currentItem.style.transition = 'transform .28s cubic-bezier(.25,.1,.25,1)';
    currentItem.style.transform  = '';
    currentItem.classList.remove('swiped');
    currentItem.style.willChange = '';
    if (acts) { acts.style.transition = 'width .28s cubic-bezier(.25,.1,.25,1)'; acts.style.width = '0px'; setTimeout(() => { acts.style.transition = ''; }, 300); }
    currentItem = null; currentActions = null;
  }

  listEl.addEventListener('touchstart', e => {
    const item = e.target.closest('.lp-item'); if (!item) return;
    if (currentItem && currentItem !== item) closeCurrent();
    currentItem    = item;
    currentActions = getActions(item);
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    swiping = false; dx = 0;
    wasSwiped = item.classList.contains('swiped');
    window._itemSwiping = wasSwiped;
    item.style.transition = 'none'; item.style.willChange = 'transform';
    if (currentActions) currentActions.style.transition = 'none';
  }, { passive: true });

  listEl.addEventListener('touchmove', e => {
    if (!currentItem) { window._itemSwiping = false; return; }
    const mx = e.touches[0].clientX - startX, my = e.touches[0].clientY - startY;
    if (!swiping) {
      if (Math.abs(my) > Math.abs(mx) && Math.abs(my) > 8) { currentItem.style.willChange = ''; currentItem = null; currentActions = null; window._itemSwiping = false; return; }
      if (Math.abs(mx) > Math.abs(my) && Math.abs(mx) > 10) {
        if (mx > 0 && !wasSwiped) { currentItem.style.transform = ''; currentItem.style.willChange = ''; currentItem = null; currentActions = null; window._itemSwiping = false; return; }
        swiping = true; window._itemSwiping = true;
        if (e.cancelable) e.preventDefault();
      } else { return; }
    }
    if (!swiping) return;
    if (e.cancelable) e.preventDefault();
    dx = wasSwiped ? Math.min(0, Math.max(-ACTIONS_W, mx - ACTIONS_W)) : Math.min(0, mx);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      if (!currentItem) return;
      const absDx = Math.min(Math.abs(dx), ACTIONS_W);
      currentItem.style.transform = `translate3d(${dx}px,0,0)`;
      if (currentActions) currentActions.style.width = absDx + 'px';
    });
  }, { passive: false });

  listEl.addEventListener('touchend', e => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (!currentItem || !swiping) { swiping = false; window._itemSwiping = false; return; }
    currentItem.style.willChange = '';
    currentItem.style.transition = 'transform .28s cubic-bezier(.25,.1,.25,1)';
    if (currentActions) currentActions.style.transition = 'width .28s cubic-bezier(.25,.1,.25,1)';
    if (wasSwiped) {
      if (dx > -THRESHOLD) { currentItem.style.transform = ''; currentItem.classList.remove('swiped'); if (currentActions) currentActions.style.width = '0px'; }
      else { currentItem.style.transform = `translate3d(-${ACTIONS_W}px,0,0)`; if (currentActions) currentActions.style.width = ACTIONS_W + 'px'; }
    } else {
      if (dx < -THRESHOLD) { currentItem.style.transform = `translate3d(-${ACTIONS_W}px,0,0)`; currentItem.classList.add('swiped'); if (currentActions) currentActions.style.width = ACTIONS_W + 'px'; }
      else { currentItem.style.transform = ''; currentItem.classList.remove('swiped'); if (currentActions) currentActions.style.width = '0px'; }
    }
    setTimeout(() => { if (currentItem) currentItem.style.transition = ''; if (currentActions) currentActions.style.transition = ''; }, 300);
    swiping = false; window._itemSwiping = false;
  }, { passive: true });

  document.addEventListener('touchstart', e => {
    if (currentItem && !e.target.closest('.lp-item') && !e.target.closest('.swipe-actions')) closeCurrent();
  }, { passive: true });
}

// ═══ 태블릿+PC 제스처 (769px~1400px / 1401px+) ═══
window._gestureReady = false;

function setupTabletPCGestures() {
  if (window._gestureReady) return;
  const app = document.getElementById('mainApp');
  if (!app || app.style.display === 'none' || app.style.display === '') {
    setTimeout(setupTabletPCGestures, 300); return;
  }
  window._gestureReady = true;

  let sx = 0, sy = 0, panel = null, swiping = false, dir = null;
  let tracking = false, decided = false, startState = null, isMouse = false;
  const TH = 50, DECIDE_DIST = 6;
  let SIDE_W = 240, LIST_W = 300;

  const sideEl   = document.querySelector('.side');
  const listEl   = document.querySelector('.list-panel');
  const editorEl = document.querySelector('.editor');
  const allPanels = [sideEl, listEl, editorEl];

  const isTablet = () => { const w = window.innerWidth; return w >= 769 && w <= 1400; };
  const isPC     = () => window.innerWidth > 1400;

  function findPanel(el) {
    while (el && el !== document.body) {
      if (el.classList) {
        if (el.classList.contains('side'))        return 'side';
        if (el.classList.contains('editor'))      return 'editor';
        if (el.classList.contains('list-panel'))  return 'list';
      }
      el = el.parentElement;
    }
    return null;
  }

  function getTabletState() {
    if (app.classList.contains('tablet-side-open'))   return 'side-open';
    if (app.classList.contains('tablet-list-closed')) return 'editor-only';
    return 'list-editor';
  }
  function getPCState() {
    const so = !app.classList.contains('sidebar-closed');
    const lo = !app.classList.contains('list-closed');
    if (so && lo) return 'all';
    if (!so && lo) return 'no-side';
    if (!so && !lo) return 'editor-only';
    return 'all';
  }

  function isValidTabletGesture(state, pn, d) {
    if (state === 'list-editor')  return (pn === 'list' && (d === 'right' || d === 'left')) || (pn === 'editor' && (d === 'left' || d === 'right'));
    if (state === 'side-open')    return d === 'left' || (pn === 'side' && d === 'right');
    if (state === 'editor-only')  return pn === 'editor' && (d === 'right' || d === 'left');
    return false;
  }
  function isValidPCGesture(state, pn, d) {
    if (state === 'all')          return (pn === 'side' || pn === 'editor') && d === 'left';
    if (state === 'no-side')      return (pn === 'list' && d === 'right') || (pn === 'editor' && (d === 'left' || d === 'right'));
    if (state === 'editor-only')  return pn === 'editor' && d === 'right';
    return false;
  }

  function clearInlineStyles() {
    app.classList.remove('gesture-active');
    allPanels.forEach(el => { if (el) { el.style.transition = ''; el.style.webkitTransition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.left = ''; el.style.width = ''; } });
    const edR = document.getElementById('editorRubber'), siR = document.getElementById('sideRubber');
    if (edR) { edR.style.transition = ''; edR.style.width = '0'; }
    if (siR) { siR.style.transition = ''; siR.style.width = '0'; }
  }

  function restoreFixedEls() {
    const f = window._fixedEls; if (!f) return;
    if (f.tr) { f.tr.classList.remove('gesture-fixed'); if (f.parent && !f.parent.contains(f.tr)) f.parent.appendChild(f.tr); }
    window._fixedEls = null;
  }

  function resetState() {
    clearInlineStyles(); restoreFixedEls();
    tracking = false; swiping = false; panel = null; dir = null; decided = false; startState = null; isMouse = false;
    window._gestureActive = false;
    const paneList = document.getElementById('pane-list');
    if (paneList) paneList.style.touchAction = '';
  }

  function canStartGesture(target) {
    if (target.closest('input') || target.closest('textarea')) return false;
    if (target.closest('.swipe-actions') || target.closest('#swipeOverlay')) return false;
    if (target.closest('.chk-dot') || target.closest('.tb-btn') || target.closest('.tb-heading-btn')) return false;
    if (target.closest('button') || target.closest('.ed-title') || target.closest('.special-form')) return false;
    if (target.closest('[contenteditable="true"]')) {
      if (isTablet() && !isMouse && editorEl) window._gestureFromEditable = true;
      else return false;
    }
    window._gestureStartTarget = target;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) return false;
    return true;
  }

  function getTabletSizes() {
    SIDE_W = sideEl   ? Math.round(sideEl.getBoundingClientRect().width)   || 240 : 240;
    LIST_W = listEl   ? Math.round(listEl.getBoundingClientRect().width)   || 300 : 300;
  }
  function getTabletBasePositions(st) {
    if (st === 'side-open')    return { side: 0,      list: SIDE_W,        editor: SIDE_W + LIST_W };
    if (st === 'editor-only')  return { side: -SIDE_W, list: -LIST_W,       editor: 0 };
    return                            { side: -SIDE_W, list: 0,             editor: LIST_W };
  }

  function tabletMove(dx) {
    if (!app.classList.contains('gesture-active')) app.classList.add('gesture-active');
    const setPos = (el, x) => { if (el) el.style.transform = `translate3d(${x}px,0,0)`; };

    if (startState === 'list-editor' && dir === 'right') {
      const m = Math.max(0, Math.min(dx, SIDE_W));
      setPos(sideEl, -SIDE_W + m); setPos(listEl, m); setPos(editorEl, LIST_W + m);
    } else if (startState === 'list-editor' && dir === 'left') {
      const m = Math.max(-LIST_W, Math.min(0, dx));
      setPos(listEl, m); setPos(editorEl, LIST_W + m);
    } else if (startState === 'side-open' && dir === 'right') {
      const maxR = 80, rubberDx = maxR * (1 - Math.exp(-Math.max(0, dx) / maxR));
      const rp = document.getElementById('sideRubber'), sh = sideEl && sideEl.querySelector('.side-hdr'), ss = sideEl && sideEl.querySelector('.side-scroll');
      if (rp) { rp.style.transition = 'none'; rp.style.width = rubberDx + 'px'; }
      if (sh) { sh.style.transition = 'none'; sh.style.transform = `translate3d(${rubberDx}px,0,0)`; }
      if (ss) { ss.style.transition = 'none'; ss.style.transform = `translate3d(${rubberDx}px,0,0)`; }
    } else if (startState === 'side-open' && dir === 'left') {
      const m = Math.max(-SIDE_W, Math.min(0, dx));
      setPos(sideEl, m); setPos(listEl, SIDE_W + m); setPos(editorEl, SIDE_W + LIST_W + m);
    } else if (startState === 'editor-only' && dir === 'left') {
      const maxR = 80, rubberDx = maxR * (1 - Math.exp(-Math.max(0, Math.abs(dx)) / maxR));
      const edR = document.getElementById('editorRubber'), edTopbar = editorEl && editorEl.querySelector('.ed-topbar');
      const edEls = [edTopbar, document.getElementById('edToolbar'), document.getElementById('editorText'), document.getElementById('editorBook'), document.getElementById('editorQuote'), document.getElementById('editorMemo')];
      if (edR) { edR.style.transition = 'none'; edR.style.width = rubberDx + 'px'; }
      const shift = `translate3d(-${rubberDx}px,0,0)`;
      edEls.forEach(el => { if (el) { el.style.transition = 'none'; el.style.transform = shift; } });
    } else if (startState === 'editor-only' && dir === 'right') {
      const m = Math.max(0, Math.min(dx, LIST_W));
      setPos(sideEl, -SIDE_W); setPos(listEl, -LIST_W + m); setPos(editorEl, m);
    }
  }

  function tabletEnd(dx) {
    const elapsed  = Date.now() - (window._gestureStartTime || Date.now());
    const velocity = elapsed > 0 ? Math.abs(dx) / elapsed : 0;
    const totalDist = (startState === 'list-editor' && dir === 'left') || (startState === 'editor-only' && dir === 'right') ? LIST_W : SIDE_W;
    const pctMoved  = Math.abs(dx) / totalDist;
    const didSwipe  = pctMoved > 0.5 || (velocity > 0.5 && pctMoved > 0.2);

    let baseDur = 1.2;
    if (velocity > 0.8) baseDur = 0.7; else if (velocity > 0.4) baseDur = 0.85; else if (velocity > 0.2) baseDur = 1.0;
    const remainRatio = didSwipe ? (1 - pctMoved) : pctMoved;
    const dur         = Math.max(0.55, baseDur * Math.max(0.5, remainRatio));
    const curve       = 'cubic-bezier(.25,.46,.45,.94)';
    const durStr      = dur.toFixed(2) + 's';
    const transStr    = `transform ${durStr} ${curve}`;
    const cleanupDelay = Math.round(dur * 1000) + 80;

    let targetState = startState;
    if (didSwipe) {
      if (startState === 'list-editor' && dir === 'right') targetState = 'side-open';
      else if (startState === 'list-editor' && dir === 'left')  targetState = 'editor-only';
      else if (startState === 'side-open'   && dir === 'left')  targetState = 'list-editor';
      else if (startState === 'editor-only' && dir === 'right') targetState = 'list-editor';
    }

    // 고무줄 스프링백 처리
    if ((startState === 'side-open' && dir === 'right') || (startState === 'editor-only' && dir === 'left')) {
      const rbDur = Math.max(0.65, 0.95 * (1 - Math.min(velocity, 1) * 0.25));
      const rbDurStr = rbDur.toFixed(2) + 's', rbCurve = 'cubic-bezier(.25,.46,.45,.94)';
      if (startState === 'side-open') {
        const rp = document.getElementById('sideRubber'), sh = sideEl && sideEl.querySelector('.side-hdr'), ss = sideEl && sideEl.querySelector('.side-scroll');
        if (rp) { rp.style.transition = `width ${rbDurStr} ${rbCurve}`; rp.style.width = '0'; }
        if (sh) { sh.style.transition = `transform ${rbDurStr} ${rbCurve}`; sh.style.transform = ''; }
        if (ss) { ss.style.transition = `transform ${rbDurStr} ${rbCurve}`; ss.style.transform = ''; }
        setTimeout(() => { if (rp) rp.style.transition = ''; if (sh) { sh.style.transition = ''; sh.style.transform = ''; } if (ss) { ss.style.transition = ''; ss.style.transform = ''; } clearInlineStyles(); restoreFixedEls(); }, Math.round(rbDur * 1000) + 60);
      } else {
        const edR = document.getElementById('editorRubber'), edTopbar = editorEl && editorEl.querySelector('.ed-topbar');
        const edEls = [edTopbar, document.getElementById('edToolbar'), document.getElementById('editorText'), document.getElementById('editorBook'), document.getElementById('editorQuote'), document.getElementById('editorMemo')];
        if (edR) { edR.style.transition = `width ${rbDurStr} ${rbCurve}`; edR.style.width = '0'; }
        edEls.forEach(el => { if (el) { el.style.transition = `transform ${rbDurStr} ${rbCurve}`; el.style.transform = ''; } });
        setTimeout(() => { if (edR) edR.style.transition = ''; edEls.forEach(el => { if (el) { el.style.transition = ''; el.style.transform = ''; } }); clearInlineStyles(); restoreFixedEls(); }, Math.round(rbDur * 1000) + 60);
      }
      tracking = false; swiping = false; panel = null; dir = null; decided = false; startState = null; isMouse = false;
      return;
    }

    let pendingClass = null;
    if (didSwipe) {
      if (startState === 'list-editor' && dir === 'right') pendingClass = { action: 'add',    cls: 'tablet-side-open' };
      else if (startState === 'list-editor' && dir === 'left')  pendingClass = { action: 'add',    cls: 'tablet-list-closed' };
      else if (startState === 'side-open'   && dir === 'left')  pendingClass = { action: 'remove', cls: 'tablet-side-open' };
      else if (startState === 'editor-only' && dir === 'right') pendingClass = { action: 'remove', cls: 'tablet-list-closed' };
    }

    const targets = getTabletBasePositions(didSwipe ? targetState : startState);
    let editorCurrentWidth = null;
    if (editorEl && pendingClass) { editorCurrentWidth = editorEl.getBoundingClientRect().width; editorEl.style.width = editorCurrentWidth + 'px'; }

    app.classList.remove('gesture-active');
    app.classList.add('gesture-animating');

    requestAnimationFrame(() => {
      allPanels.forEach(el => { if (el) { el.style.transition = transStr; el.style.webkitTransition = transStr; } });
      if (editorEl && pendingClass) { editorEl.style.transition = `${transStr}, width ${durStr} ${curve}`; editorEl.style.webkitTransition = `${transStr}, width ${durStr} ${curve}`; }

      requestAnimationFrame(() => {
        if (sideEl)   sideEl.style.transform   = `translate3d(${targets.side}px,0,0)`;
        if (listEl)   listEl.style.transform   = `translate3d(${targets.list}px,0,0)`;
        if (editorEl) editorEl.style.transform = `translate3d(${targets.editor}px,0,0)`;
        if (pendingClass) { if (pendingClass.action === 'add') app.classList.add(pendingClass.cls); else app.classList.remove(pendingClass.cls); }
        if (editorEl && editorCurrentWidth !== null) { requestAnimationFrame(() => { editorEl.style.width = ''; }); }

        setTimeout(() => {
          allPanels.forEach(el => { if (el) { el.style.transition = ''; el.style.webkitTransition = ''; el.style.transform = ''; el.style.opacity = ''; el.style.width = ''; } });
          restoreFixedEls();
          app.classList.remove('gesture-animating');
          if (typeof updateBackBtnIcon === 'function') updateBackBtnIcon();
        }, Math.max(cleanupDelay, 550));
      });
    });
  }

  // ─── PC 제스처 로직 ───
  function pcMove(dx) {
    const state = startState;
    const sideW = sideEl ? sideEl.offsetWidth : 240;
    const listW = listEl ? listEl.offsetWidth : 280;
    allPanels.forEach(el => { if (el) el.style.transition = 'none'; });
    if (state === 'all' && dir === 'left') {
      const m = Math.max(-sideW, Math.min(0, dx)), prog = Math.abs(m) / sideW;
      if (sideEl) { sideEl.style.transform = `translateX(${m}px)`; sideEl.style.opacity = String(Math.max(0, 1 - prog)); }
      if (listEl) listEl.style.opacity = String(Math.min(1, 0.7 + prog * 0.3));
    } else if (state === 'no-side' && dir === 'right') {
      const m = Math.max(0, Math.min(dx, sideW)), prog = m / sideW;
      if (sideEl) { sideEl.style.transform = `translateX(${-sideW + m}px)`; sideEl.style.opacity = String(Math.min(1, prog)); }
      if (listEl) listEl.style.opacity = String(Math.max(0.7, 1 - prog * 0.3));
    } else if (state === 'no-side' && dir === 'left') {
      const m = Math.max(-listW, Math.min(0, dx)), prog = Math.abs(m) / listW;
      if (listEl) { listEl.style.transform = `translateX(${m}px)`; listEl.style.opacity = String(Math.max(0.3, 1 - prog * 0.7)); }
    } else if (state === 'editor-only' && dir === 'right') {
      const m = Math.max(0, Math.min(dx, listW)), prog = m / listW;
      if (listEl) { listEl.style.transform = `translateX(${-listW + m}px)`; listEl.style.opacity = String(Math.min(1, 0.3 + prog * 0.7)); }
    }
  }

  function pcEnd(dx) {
    allPanels.forEach(el => { if (el) el.style.transition = 'transform .32s cubic-bezier(.25,.1,.25,1), opacity .32s cubic-bezier(.25,.1,.25,1)'; });
    if (Math.abs(dx) > TH) {
      clearInlineStyles();
      if (startState === 'all'         && dir === 'left')  app.classList.add('sidebar-closed');
      else if (startState === 'no-side'     && dir === 'right') app.classList.remove('sidebar-closed');
      else if (startState === 'no-side'     && dir === 'left')  app.classList.add('list-closed');
      else if (startState === 'editor-only' && dir === 'right') app.classList.remove('list-closed');
    } else {
      resetState();
    }
  }

  // ─── 공통 핸들러 ───
  function handleStart(x, y, target) {
    if (window.innerWidth <= 768 || window.innerWidth > 1400) return;
    window._gestureFromEditable = false;
    if (!canStartGesture(target)) return;
    const pn = findPanel(target); if (!pn) return;
    sx = x; sy = y; panel = pn; swiping = false; dir = null; tracking = true; decided = false;
    window._itemSwiping = false; window._gestureStartTime = Date.now(); window._fixedEls = null;
    if (isTablet()) { getTabletSizes(); startState = getTabletState(); }
    else if (isPC()) startState = getPCState();
  }

  function handleMove(x, y, e) {
    if (typeof cancelLongPress === 'function') cancelLongPress();
    if (!tracking || window.innerWidth <= 768) return;
    if (window._itemSwiping) { tracking = false; return; }
    const dx = x - sx, dy = y - sy;
    if (!decided) {
      const decideDist = window._gestureFromEditable ? 10 : DECIDE_DIST;
      if (Math.abs(dx) < decideDist && Math.abs(dy) < decideDist) return;
      decided = true; window._gestureActive = true;
      if (typeof cancelLongPress === 'function') cancelLongPress();
      const angleThreshold = window._gestureFromEditable ? 0.7 : 0.8;
      if (Math.abs(dy) > Math.abs(dx) * angleThreshold) { tracking = false; window._gestureActive = false; return; }
      if (window._gestureFromEditable) { const s = window.getSelection(); if (s) s.removeAllRanges(); }
      dir = dx > 0 ? 'right' : 'left';
      if (dir === 'left' && panel === 'list' && window._gestureStartTarget && window._gestureStartTarget.closest && window._gestureStartTarget.closest('.lp-item')) { tracking = false; swiping = false; decided = false; return; }
      const valid = isTablet() ? isValidTabletGesture(startState, panel, dir) : (isPC() ? isValidPCGesture(startState, panel, dir) : false);
      if (!valid) { tracking = false; swiping = false; decided = false; return; }
      swiping = true;
      if (isTablet() && editorEl && !window._fixedEls) {
        const tr = editorEl.querySelector('.ed-topbar-right'), tp = editorEl.querySelector('.col-header.ed-topbar');
        if (tr) { tr.classList.add('gesture-fixed'); document.body.appendChild(tr); }
        window._fixedEls = { tr, parent: tp };
      }
    }
    if (swiping && e && e.cancelable) {
      e.preventDefault(); e.stopPropagation();
      const dx2 = x - sx;
      if (window._gestureRaf) cancelAnimationFrame(window._gestureRaf);
      window._gestureRaf = requestAnimationFrame(() => {
        window._gestureRaf = null;
        if (isTablet()) tabletMove(dx2); else if (isPC()) pcMove(dx2);
      });
    }
  }

  function handleEnd(x) {
    window._gestureActive = false;
    if (window._gestureRaf) { cancelAnimationFrame(window._gestureRaf); window._gestureRaf = null; }
    const pl = document.getElementById('pane-list');
    if (!tracking || !swiping || window.innerWidth <= 768) { resetState(); if (pl) pl.style.touchAction = ''; return; }
    const dx = x - sx;
    if (isTablet()) tabletEnd(dx); else if (isPC()) pcEnd(dx);
    tracking = false; swiping = false; panel = null; dir = null; decided = false; startState = null; isMouse = false;
    if (pl) pl.style.touchAction = '';
  }

  // ─── 터치 이벤트 ───
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1) return;
    isMouse = false;
    handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
  }, { capture: true, passive: true });

  document.addEventListener('touchmove', function(e) {
    if (isMouse) return;
    if (e.touches.length !== 1) { tracking = false; return; }
    handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
  }, { capture: true, passive: false });

  document.addEventListener('touchend', function(e) {
    if (isMouse) return;
    handleEnd(e.changedTouches[0].clientX);
  }, { capture: true, passive: true });

  document.addEventListener('touchcancel', function() { resetState(); }, { capture: true, passive: true });

  // ─── 마우스 이벤트 ───
  document.addEventListener('mousedown', function(e) {
    if (window.innerWidth <= 768 || window.innerWidth > 1400 || e.button !== 0) return;
    isMouse = true;
    if (e.target.closest('[contenteditable]')) return;
    handleStart(e.clientX, e.clientY, e.target);
  }, true);

  document.addEventListener('mousemove', function(e) {
    if (!isMouse || !tracking) return;
    handleMove(e.clientX, e.clientY, e);
  }, true);

  document.addEventListener('mouseup', function(e) {
    if (!isMouse) return;
    handleEnd(e.clientX);
  }, true);
}
