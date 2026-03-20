// ═══════════════════════════════════════
// ui.js — UI 전환, 탭, 리스트/사진/캘린더 렌더링
// ═══════════════════════════════════════

// ═══ 탭 색상 ═══
const TAB_COLORS = {
  navi: '#7EB5F4', fiction: '#F4B77E', blog: '#82C99A',
  book: '#7E9CF4', quote: '#C49ADE',   memo: '#B0B0B8'
};

function applyTabColor(tabId) {
  document.documentElement.style.setProperty('--tab-color', '#E55643');
}

// ═══ 레이아웃 전환 ═══
function switchListView(view) {
  currentListView = view;
  ['list','photo','calendar'].forEach(v => {
    document.getElementById('pane-' + v).style.display = 'none';
    document.getElementById('btn-' + v).classList.remove('on');
  });
  const target = document.getElementById('pane-' + view);
  target.style.display = (view === 'list') ? 'flex' : 'block';
  document.getElementById('btn-' + view).classList.add('on');
  renderListPanel();
}

function toggleSidebar() {
  const app = document.getElementById('mainApp');
  const w   = window.innerWidth;
  if (w >= 769 && w <= 1400) {
    app.classList.toggle('tablet-side-open');
  } else if (w > 1400) {
    app.classList.toggle('sidebar-closed');
  } else {
    app.classList.contains('view-side')
      ? app.classList.remove('view-side')
      : app.classList.add('view-side');
  }
}

function setMobileView(view) {
  const app = document.getElementById('mainApp');
  const w   = window.innerWidth;

  if (w >= 769 && w <= 1400) {
    if (view === 'list') {
      app.classList.remove('tablet-side-open');
      app.classList.remove('tablet-list-closed');
      renderListPanel();
    }
    if (view === 'side')   toggleSidebar();
    if (activeTab === 'expense') { const vs = document.getElementById('viewSwitcher'); if (vs) vs.style.display = 'none'; }
    return;
  }
  if (w > 1400) {
    if (view === 'list') {
      if (app.classList.contains('list-closed')) app.classList.remove('list-closed');
      renderListPanel();
    }
    if (view === 'side') toggleSidebar();
    if (activeTab === 'expense') { const vs = document.getElementById('viewSwitcher'); if (vs) vs.style.display = 'none'; }
    return;
  }
  // 모바일
  if (view === 'side') { app.classList.add('view-side'); return; }
  app.classList.remove('view-side','view-list','view-editor');
  app.classList.add('view-' + view);
  if (view === 'list') renderListPanel();
  if (activeTab === 'expense') { const vs = document.getElementById('viewSwitcher'); if (vs) vs.style.display = 'none'; }
}

// ═══ 검색 ═══
function toggleSearch() {
  const bar = document.getElementById('searchBar');
  const input = document.getElementById('searchInput');
  const vs    = document.getElementById('viewSwitcher');
  bar.classList.toggle('active');
  if (bar.classList.contains('active')) { vs.style.display = 'none'; input.focus(); }
  else clearSearch();
}

function handleSearch(e) {
  currentSearchQuery = e.target.value.trim();
  document.getElementById('clearSearchBtn').style.display = currentSearchQuery ? 'flex' : 'none';
  renderListPanel();
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  currentSearchQuery = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  document.getElementById('searchBar').classList.remove('active');
  document.getElementById('viewSwitcher').style.display = 'flex';
  renderListPanel();
}

function setTagSearch(tag) {
  const bar   = document.getElementById('searchBar');
  const input = document.getElementById('searchInput');
  const vs    = document.getElementById('viewSwitcher');
  bar.classList.add('active');
  vs.style.display = 'none';
  input.value = tag;
  currentSearchQuery = tag;
  document.getElementById('clearSearchBtn').style.display = 'flex';
  if (window.innerWidth <= 768) setMobileView('list');
  renderListPanel();
}

// ═══ 탭 전환 ═══
function renderWritingGrid() {
  const nav = document.getElementById('sideNav');
  if (!nav) return;
  // config.tabs에서 expense를 제외한 탭 목록 동적 생성
  var allTabs = Object.keys(TAB_META);
  var tabs = [];
  // textTypes 먼저, 그 다음 나머지 (expense 제외)
  var ordered = [];
  textTypes.forEach(function(t) { ordered.push(t); });
  allTabs.forEach(function(t) {
    if (t !== 'expense' && ordered.indexOf(t) === -1) ordered.push(t);
  });
  ordered.forEach(function(id) {
    if (id === 'expense') return;
    tabs.push({ id: id, label: TAB_META[id] || id });
  });
  nav.innerHTML = tabs.map(t => {
    const count = (_partnerMode && _partnerData) ? _getPartnerTabCount(t.id) : getTabCount(t.id);
    return `
    <div class="side-menu ${activeTab === t.id ? 'on' : ''}" data-tab="${t.id}"
         onclick="switchTab('${t.id}'); setMobileView('list');">
      <div class="side-menu-l">${t.label}</div>
      <span class="badge-pill">${count}</span>
      <svg class="side-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
  }).join('');
}

function updateEdTabLabel() {
  const label = document.getElementById('edTabLabel');
  if (label) label.textContent = TAB_META[activeTab] || '';
}

window.addEventListener('resize', () => {
  renderWritingGrid();
  renderChk();
  updateBackBtnIcon();
});

function switchTab(t, keepLayout) {
  // 댓글 섹션 숨기기
  hideComments();

  // 파트너 모드: 저장 없이 탭만 전환하고 상대방 데이터 렌더
  if (_partnerMode) {
    if (t === 'expense') return; // 파트너 가계부는 별도 처리 필요 — 현재는 차단
    activeTab = t;
    updateEdTabLabel();
    // 사이드바 메뉴 활성 표시
    var sms = document.querySelectorAll('.side-menu');
    sms.forEach(function(m) { m.classList.remove('on'); });
    var am = document.querySelector('.side-menu[data-tab="' + t + '"]');
    if (am) am.classList.add('on');
    // 에디터 패널 리셋
    document.getElementById('editorText').style.display = textTypes.includes(t) ? 'flex' : 'none';
    document.getElementById('editorBook').style.display = t === 'book' ? 'flex' : 'none';
    document.getElementById('editorQuote').style.display = t === 'quote' ? 'flex' : 'none';
    document.getElementById('editorMemo').style.display = t === 'memo' ? 'flex' : 'none';
    // 리스트 렌더
    document.getElementById('pane-list').style.display = 'flex';
    renderListPanel();
    if (window.innerWidth <= 768) setMobileView('list');
    return;
  }

  if (textTypes.includes(activeTab)) saveCurDoc(activeTab);
  // 태블릿: topbar-fixed 버튼은 body에 유지
  activeTab = t;
  applyTabColor(t);
  updateEdTabLabel();

  // 사이드바 메뉴 활성 표시
  const sideMenus = document.querySelectorAll('.side-menu');
  sideMenus.forEach(m => m.classList.remove('on'));
  const activeMenu = document.querySelector(`.side-menu[data-tab="${t}"]`);
  if (activeMenu) activeMenu.classList.add('on');

  // 가계부 compact 활성 표시
  const expCompact = document.querySelector('.expense-compact');
  if (expCompact) {
    expCompact.classList.toggle('on', t === 'expense');
  }

  // 루틴 compact 활성 해제
  var routineCompact = document.querySelector('.routine-compact');
  if (routineCompact) routineCompact.classList.remove('on');

  clearSearch();
  hideRoutineCard();
  // 가계부 폼 활성 클래스 정리 (다른 탭으로 전환 시)
  if (t !== 'expense') {
    document.querySelector('.editor').classList.remove('expense-edit-active');
  }
  // 루틴 캘린더 뷰 정리
  var _rcPanel = document.getElementById('editorRoutineDetail');
  if (_rcPanel && _rcPanel.style.display !== 'none') {
    if (typeof hideRoutineCalView === 'function') hideRoutineCalView();
  }

  if (t === 'expense') {
    // 가계부 탭: list-panel에 expense-active 클래스 추가 (CSS로 뷰 스위처 강제 숨김)
    document.querySelector('.list-panel').classList.add('expense-active');

    const w = window.innerWidth;

    // 일반 pane 숨기기
    document.getElementById('pane-list').style.display = 'none';
    document.getElementById('pane-photo').style.display = 'none';
    document.getElementById('pane-calendar').style.display = 'none';

    // 뷰 스위처 숨기기, 검색 닫기
    const vs = document.getElementById('viewSwitcher');
    if (vs) vs.style.display = 'none';
    const sb = document.getElementById('searchBar');
    if (sb) sb.classList.remove('active');
    var searchBtn = document.querySelector('.lp-search-btn');
    if (searchBtn) searchBtn.style.display = 'none';

    // 더보기, Aa 버튼 숨기기
    var moreBtn = document.querySelector('.ed-more-btn');
    var aaBtn = document.querySelector('.ed-aa-btn');
    if (moreBtn) moreBtn.style.display = 'none';
    if (aaBtn) aaBtn.style.display = 'none';

    // FAB 처리
    const fab = document.querySelector('.fab-btn');

    // 월 뷰 리셋
    _expenseViewYM = null;

    if (w > 768) {
      // ── PC/태블릿 ──
      // 가계부: list-panel을 CSS 클래스로 접어서 에디터 전체 너비
      var app = document.getElementById('mainApp');
      if (w >= 769 && w <= 1400) {
        app.classList.remove('tablet-side-open');
        app.classList.add('tablet-list-closed');
      } else if (w > 1400) {
        app.classList.add('list-closed');
      }

      // editor 내부: 기존 에디터 패널 모두 숨기기
      document.getElementById('editorText').style.display = 'none';
      document.getElementById('editorBook').style.display = 'none';
      document.getElementById('editorQuote').style.display = 'none';
      document.getElementById('editorMemo').style.display = 'none';
      document.getElementById('editorExpense').style.display = 'none';
      var dayList = document.getElementById('editorDayList');
      if (dayList) dayList.style.display = 'none';
      document.getElementById('edToolbar').style.display = 'none';

      // expenseFullDashboard 표시
      var fullDb = document.getElementById('expenseFullDashboard');
      if (fullDb) fullDb.style.display = 'flex';

      // expFullDetailPane 명시적으로 숨기기 (B화면 진입 차단)
      var detailPane = document.getElementById('expFullDetailPane');
      if (detailPane) detailPane.style.display = 'none';

      if (fab) fab.style.display = 'none';

      // 원페이지 대시보드 렌더
      renderExpenseDashboard('pc');
    } else {
      // ── 모바일 ──
      // editorExpense 표시, 입력 폼 렌더
      document.getElementById('editorExpense').style.display = 'flex';
      document.getElementById('editorText').style.display = 'none';
      document.getElementById('editorBook').style.display = 'none';
      document.getElementById('editorQuote').style.display = 'none';
      document.getElementById('editorMemo').style.display = 'none';
      var dayList2 = document.getElementById('editorDayList');
      if (dayList2) dayList2.style.display = 'none';
      document.getElementById('edToolbar').style.display = 'none';

      // expenseFullDashboard 숨기기
      var fullDb2 = document.getElementById('expenseFullDashboard');
      if (fullDb2) fullDb2.style.display = 'none';

      if (fab) fab.style.display = '';

      // pane-expense-dashboard 표시, 대시보드 A 렌더
      document.getElementById('pane-expense-dashboard').style.display = 'flex';
      document.getElementById('pane-expense-detail').style.display = 'none';
      renderExpenseDashboard('mobile');

      // 에디터: 입력 폼
      newExpenseForm();
      renderExpenseCategoryGrid();

      // 모바일: 사이드바 닫고 리스트 뷰로 전환
      var mApp = document.getElementById('mainApp');
      mApp.classList.remove('view-side');
      mApp.classList.remove('view-editor');
      mApp.classList.add('view-list');
    }
  } else {
    // 가계부 탭 해제: list-panel에서 expense-active 클래스 제거
    document.querySelector('.list-panel').classList.remove('expense-active');

    // ── 가계부에서 나올 때 복원 ──
    // 가계부에서 나올 때 list-panel 복원
    var appEl = document.getElementById('mainApp');
    var ww = window.innerWidth;
    if (ww >= 769 && ww <= 1400) {
      appEl.classList.remove('tablet-list-closed');
    } else if (ww > 1400) {
      appEl.classList.remove('list-closed');
    }

    // 가계부 pane 숨기기
    document.getElementById('pane-expense-dashboard').style.display = 'none';
    document.getElementById('pane-expense-detail').style.display = 'none';

    // 풀 대시보드 숨기기
    var fullDb = document.getElementById('expenseFullDashboard');
    if (fullDb) fullDb.style.display = 'none';

    // 가계부 에디터 폼 숨기고 현재 탭에 맞는 에디터 패널 복원
    var edExpense = document.getElementById('editorExpense');
    if (edExpense) edExpense.style.display = 'none';
    document.getElementById('editorText').style.display  = textTypes.includes(t) ? 'flex' : 'none';
    document.getElementById('editorBook').style.display  = t === 'book'  ? 'flex' : 'none';
    document.getElementById('editorQuote').style.display = t === 'quote' ? 'flex' : 'none';
    document.getElementById('editorMemo').style.display  = t === 'memo'  ? 'flex' : 'none';
    var edDayList = document.getElementById('editorDayList');
    if (edDayList) edDayList.style.display = 'none';
    document.getElementById('edToolbar').style.display = ['book','quote'].includes(t) ? 'none' : 'flex';

    // 모달 닫기
    if (typeof closeExpenseModal === 'function') closeExpenseModal();

    // 더보기, Aa 버튼 복원
    var moreBtn = document.querySelector('.ed-more-btn');
    var aaBtn = document.querySelector('.ed-aa-btn');
    if (moreBtn) moreBtn.style.display = '';
    if (aaBtn) aaBtn.style.display = '';

    // FAB 복원
    var fab = document.querySelector('.fab-btn');
    if (fab) fab.style.display = '';

    // 뷰 스위처 복원
    var vs = document.getElementById('viewSwitcher');
    if (vs) vs.style.display = 'flex';
    var searchBtn = document.querySelector('.lp-search-btn');
    if (searchBtn) searchBtn.style.display = '';
    // 월 네비 모두 제거
    document.querySelectorAll('.exp-month-nav-inline').forEach(function(el) { el.remove(); });
    // 탭 라벨 복원
    var tabLabel = document.getElementById('edTabLabel');
    if (tabLabel) tabLabel.style.display = '';

    switchListView('list');
  }

  if (!keepLayout && t !== 'expense') {
    const app = document.getElementById('mainApp');
    if (window.innerWidth >= 769 && window.innerWidth <= 1400 && app.classList.contains('tablet-side-open')) {
      app.classList.remove('tablet-side-open');
    }
    setMobileView('list');
  }

  updateBackBtnIcon();

  if (textTypes.includes(t)) {
    const docs = getDocs(t);
    if (curIds[t])       loadDoc(t, curIds[t], true);
    else if (docs.length) loadDoc(t, docs[0].id, true);
    else { const nd = newDoc(t); loadDoc(t, nd.id, true); }
  }
  if (t === 'book') {
    if (curBookId)        loadBook(curBookId, true);
    else { const b = getBooks(); if (b.length) loadBook(b[0].id, true); else newBook(); }
  }
  if (t === 'memo') {
    if (curMemoId)        loadMemo(curMemoId, true);
    else { const m = getMemos(); if (m.length) loadMemo(m[0].id, true); else newMemoForm(); }
  }
  if (t === 'quote') newQuoteForm();

  // navi 외 탭 전환 시 루틴 캘린더 뷰 숨기기
  if (t !== 'navi' && window.innerWidth > 768) {
    const detailPanel = document.getElementById('editorRoutineDetail');
    if (detailPanel) detailPanel.style.display = 'none';
  }

  if (t !== 'expense') renderListPanel();
}

// ═══ 리스트 패널 헬퍼 ═══
function getThumb(content) {
  if (!content) return '';
  const m = content.match(/<img[^>]+src=["'](data:image[^"']+|https?:[^"']+)["'][^>]*>/i);
  return m ? m[1] : '';
}

function getThumbs(content, max) {
  if (!content) return [];
  const regex = /<img[^>]+src=["'](data:image[^"']+|https?:[^"']+)["'][^>]*>/gi;
  const results = [];
  let m;
  while ((m = regex.exec(content)) !== null && results.length < (max || 2)) {
    results.push(m[1]);
  }
  return results;
}

function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date(), d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)     return '방금 전';
  if (diff < 3600)   return Math.floor(diff / 60)   + '분 전';
  if (diff < 86400)  return Math.floor(diff / 3600)  + '시간 전';
  if (diff < 604800) return Math.floor(diff / 86400) + '일 전';
  const y = d.getFullYear(), mo = d.getMonth() + 1, day = d.getDate();
  if (y === now.getFullYear()) return mo + '월 ' + day + '일';
  return y + '년 ' + mo + '월 ' + day + '일';
}

const escapeHtml = str => {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
};

const hl = txt => {
  if (!txt) return '';
  const safe = escapeHtml(txt);
  if (!currentSearchQuery) return safe;
  const safeQuery = escapeHtml(currentSearchQuery).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${safeQuery})`, 'gi'), '<mark class="highlight">$1</mark>');
};

const getPreviewText = html => {
  let raw = stripHtml(html || '').replace(/https?:\/\/[^\s]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!currentSearchQuery) return raw.slice(0, 80);
  const idx = raw.toLowerCase().indexOf(currentSearchQuery.toLowerCase());
  if (idx !== -1) {
    const start = Math.max(0, idx - 30), end = Math.min(raw.length, idx + currentSearchQuery.length + 30);
    return (start > 0 ? '...' : '') + raw.substring(start, end) + (end < raw.length ? '...' : '');
  }
  return raw.slice(0, 80);
};

// ═══ 아이템 HTML 생성 ═══
const _pinIcon = `<svg style="width:12px;height:12px;vertical-align:-1px;margin-right:2px;" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>  `;
const _swipePin = fn => `<div class="swipe-action pin-action" onclick="event.stopPropagation();${fn}"><span><svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>고정</span></div>`;
const _swipeDel = fn => `<div class="swipe-action del-action" onclick="event.stopPropagation();${fn}"><span><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>삭제</span></div>`;

function generateItemHtml(item, t, showDate) {
  if (showDate === undefined) showDate = true;
  const relTime     = getRelativeTime(item.created || item.date);
  const sameDateCls = showDate ? '' : ' same-date';
  const dateBlock   = showDate
    ? `<div class="lp-date-wrap"><div class="lp-dow">${weekdays[new Date(item.created||item.date||Date.now()).getDay()]}</div><div class="lp-day">${new Date(item.created||item.date||Date.now()).getDate()}</div></div>`
    : `<div class="lp-date-wrap no-date"><div class="lp-dow">&nbsp;</div><div class="lp-day">&nbsp;</div></div>`;

  if (textTypes.includes(t)) {
    const isCur    = curIds[t] === item.id;
    const preview  = hl(getPreviewText(item.content));
    const thumbs   = getThumbs(item.content, 5);
    const thumbsHtml = thumbs.length ? `<div class="lp-thumbs">${thumbs.map(src => `<img src="${src}" alt="">`).join('')}</div>` : '';
    const tagHtml  = item.tags ? `<div class="lp-item-tags">${hl(item.tags)}</div>` : '';
    return `<div class="lp-item${sameDateCls} ${isCur?'on':''}" onclick="loadDoc('${t}','${item.id}'); setMobileView('editor');">
      <div class="lp-item-title">${hl(item.title||'제목 없음')}</div>${tagHtml}
      ${preview ? `<div class="lp-item-preview">${preview}</div>` : ''}${thumbsHtml}
      <div class="lp-item-meta">${item.pinned?_pinIcon:''}${relTime}</div>
      <div class="swipe-actions">${_swipePin(`togglePin('${t}','${item.id}',event)`)}${_swipeDel(`delDoc('${t}','${item.id}',event)`)}</div>
    </div>`;
  }
  if (t === 'book') {
    const isCur    = curBookId === item.id;
    const authorPub = [item.author, item.publisher].filter(Boolean).join(' · ');
    return `<div class="lp-item${sameDateCls} ${isCur?'on':''}" onclick="loadBook('${item.id}'); setMobileView('editor');">
      <div class="lp-item-title">${hl(item.title)}</div>
      <div class="lp-item-preview">${hl(authorPub)}</div>
      <div class="lp-item-meta">${item.pinned?_pinIcon:''}${relTime}</div>
      <div class="swipe-actions">${_swipePin(`togglePin('${t}','${item.id}',event)`)}${_swipeDel(`delBook('${item.id}',event)`)}</div>
    </div>`;
  }
  if (t === 'quote') {
    const isCur = curQuoteId === item.id;
    return `<div class="lp-item${sameDateCls} ${isCur?'on':''}" onclick="loadQuote('${item.id}'); setMobileView('editor');">
      <div class="quote-txt">${hl(item.text)}</div>
      <div class="lp-item-meta" style="margin-top:4px;">${item.pinned?_pinIcon:''}${item.by?hl(item.by)+' · ':''}${relTime}</div>
      <div class="swipe-actions">${_swipePin(`togglePin('${t}','${item.id}',event)`)}${_swipeDel(`delQuote('${item.id}',event)`)}</div>
    </div>`;
  }
  if (t === 'memo') {
    const isCur    = curMemoId === item.id;
    const preview  = hl(getPreviewText(item.content));
    const thumbs   = getThumbs(item.content, 5);
    const thumbsHtml = thumbs.length ? `<div class="lp-thumbs">${thumbs.map(src => `<img src="${src}" alt="">`).join('')}</div>` : '';
    const tagHtml  = item.tags ? `<div class="lp-item-tags">${hl(item.tags)}</div>` : '';
    return `<div class="lp-item${sameDateCls} ${isCur?'on':''}" onclick="loadMemo('${item.id}'); setMobileView('editor');">
      <div class="lp-item-title">${hl(item.title||'제목 없음')}</div>${tagHtml}
      ${preview ? `<div class="lp-item-preview">${preview}</div>` : ''}${thumbsHtml}
      <div class="lp-item-meta">${item.pinned?_pinIcon:''}${relTime}</div>
      <div class="swipe-actions">${_swipePin(`togglePin('${t}','${item.id}',event)`)}${_swipeDel(`delMemo('${item.id}',event)`)}</div>
    </div>`;
  }
  return '';
}

// ═══ 사진 뷰 ═══
let selectedPhotoId = null;
function renderPhotoView(items, t) {
  const grid = document.getElementById('photoGrid');
  const photoItems = items.filter(item => {
    return !!(textTypes.includes(t) || t === 'memo' ? getThumb(item.content) : '');
  });
  if (!photoItems.length) {
    grid.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--tx-hint);grid-column:1/-1;font-size:13px;">사진이 포함된 기록이 없습니다</div>';
    return;
  }
  grid.innerHTML = photoItems.map(item => {
    const thumb = getThumb(item.content);
    const dt    = new Date(item.created || item.date || Date.now());
    const day   = String(dt.getDate()).padStart(2,'0');
    const ym    = `${dt.getFullYear()}년 ${dt.getMonth()+1}월`;
    const isSolo     = photoItems.length === 1;
    const isSelected = selectedPhotoId === item.id;
    const clickFn    = t === 'memo'
      ? `loadMemo('${item.id}'); setMobileView('editor');`
      : `loadDoc('${t}','${item.id}'); setMobileView('editor');`;
    return `<div class="photo-cell${isSolo?' solo':''}${isSelected?' selected':''}"
          onclick="selectPhoto('${item.id}', event); ${clickFn}">
      <div class="photo-cell-bg" style="background-image:url('${thumb}');"></div>
      <div class="photo-date-block">
        <span class="photo-day-num">${day}</span>
        <span class="photo-ym">${ym}</span>
      </div>
    </div>`;
  }).join('');
}

function selectPhoto(id, e) {
  e.stopPropagation();
  selectedPhotoId = (selectedPhotoId === id) ? null : id;
  document.querySelectorAll('.photo-cell').forEach(el => el.classList.remove('selected'));
  if (selectedPhotoId) {
    document.querySelectorAll('.photo-cell').forEach(el => {
      if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(`'${selectedPhotoId}'`)) {
        el.classList.add('selected');
      }
    });
  }
}

// ═══ 캘린더 뷰 ═══
function renderCalendarView(items, t) {
  const calWrap  = document.getElementById('calWrap');
  const todayD   = new Date();
  const todayY   = todayD.getFullYear(), todayM = todayD.getMonth() + 1, todayDay = todayD.getDate();
  let minDate    = new Date(todayY, todayM - 1, 1);
  const maxDate  = new Date(todayY, todayM + 1, 0);
  const entriesMap = {}, photoDays = {}, itemMap = {};

  items.forEach(item => {
    const dt = new Date(item.created || item.date || Date.now());
    if (dt < minDate) minDate = new Date(dt.getFullYear(), dt.getMonth(), 1);
    const y = dt.getFullYear(), m = dt.getMonth() + 1, d = dt.getDate();
    const key = `${y}-${m}`, pKey = `${y}-${m}-${d}`;
    if (!entriesMap[key]) entriesMap[key] = new Set();
    entriesMap[key].add(d);
    if (!itemMap[pKey]) itemMap[pKey] = [];
    itemMap[pKey].push(item.id);
    const thumb = (textTypes.includes(t) || t === 'memo') ? getThumb(item.content) : '';
    if (thumb && !photoDays[pKey]) photoDays[pKey] = thumb;
  });

  let startY = minDate.getFullYear(), startM = minDate.getMonth() + 1;
  let endY   = maxDate.getFullYear(), endM   = maxDate.getMonth() + 1;
  const months = [];
  let cy = startY, cm = startM;
  while (cy < endY || (cy === endY && cm <= endM)) {
    months.push({ y: cy, m: cm, label: `${cy}년 ${cm}월` });
    cm++; if (cm > 12) { cm = 1; cy++; }
  }

  calWrap.innerHTML = months.map((mo, mi) => {
    const first   = new Date(mo.y, mo.m - 1, 1).getDay();
    const days    = new Date(mo.y, mo.m, 0).getDate();
    const key     = `${mo.y}-${mo.m}`;
    const entries = entriesMap[key] ? Array.from(entriesMap[key]) : [];
    let cells = '';
    for (let i = 0; i < first; i++) cells += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= days; d++) {
      const has     = entries.includes(d);
      const isToday = (mo.y === todayY && mo.m === todayM && d === todayDay);
      const pk      = `${mo.y}-${mo.m}-${d}`;
      const thumb   = photoDays[pk];
      let cls = 'cal-day';
      if (has)     cls += ' has-entry';
      if (isToday) cls += ' today';
      let inner = '', numHtml = d;
      if (thumb) { cls += ' has-photo'; inner = `<div class="cal-photo-bg" style="background-image:url('${thumb}');"></div>`; numHtml = `<span class="cal-day-num">${d}</span>`; }
      let clickFn = '';
      if (has && itemMap[pk] && itemMap[pk].length > 0) {
        if (itemMap[pk].length === 1) {
          const docId = itemMap[pk][0];
          let loadCall = `loadDoc('${t}','${docId}')`;
          if (t === 'book')  loadCall = `loadBook('${docId}')`;
          else if (t === 'quote') loadCall = `loadQuote('${docId}')`;
          else if (t === 'memo')  loadCall = `loadMemo('${docId}')`;
          clickFn = `onclick="selectCalDay(this); ${loadCall}; setMobileView('editor');"`;
        } else {
          clickFn = `onclick="selectCalDay(this); showDayList('${pk}','${t}'); setMobileView('editor');"`;
        }
      }
      cells += `<div class="${cls}" ${clickFn}>${inner}${numHtml}</div>`;
    }
    const monthId = `cal-month-${mo.y}-${mo.m}`;
    return `${mi > 0 ? '<div class="cal-separator"></div>' : ''}
      <div class="cal-month-title" id="${monthId}">${mo.label}</div>
      <div class="cal-grid">${cells}</div>`;
  }).join('');

  requestAnimationFrame(() => {
    const currentEl = document.getElementById(`cal-month-${todayY}-${todayM}`);
    if (currentEl) {
      const pane = document.getElementById('pane-calendar');
      if (pane) { currentEl.scrollIntoView({ block: 'start' }); pane.scrollTop = Math.max(0, pane.scrollTop - 40); }
    }
  });
}

function selectCalDay(element) {
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
  if (element) element.classList.add('selected');
}

function showDayList(dateKey, type) {
  const parts   = dateKey.split('-');
  const y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
  const dt      = new Date(y, m - 1, d);
  const dayLabel = `${y}년 ${m}월 ${d}일 (${weekdays[dt.getDay()]})`;
  let items = [];
  if (textTypes.includes(type))  items = getDocs(type);
  else if (type === 'book')  items = getBooks();
  else if (type === 'quote') items = getQuotes();
  else if (type === 'memo')  items = getMemos();

  const dateItems = items.filter(item => {
    const itemDt = new Date(item.created || item.date || 0);
    return itemDt.getFullYear() === y && (itemDt.getMonth()+1) === m && itemDt.getDate() === d;
  }).sort((a, b) => new Date(b.created||b.date||0) - new Date(a.created||a.date||0));

  if (!dateItems.length) return;
  if (dateItems.length === 1) {
    hideDayList();
    if (textTypes.includes(type)) loadDoc(type, dateItems[0].id);
    else if (type === 'book')  loadBook(dateItems[0].id);
    else if (type === 'quote') loadQuote(dateItems[0].id);
    else if (type === 'memo')  loadMemo(dateItems[0].id);
    return;
  }

  document.getElementById('editorText').style.display  = 'none';
  document.getElementById('editorBook').style.display  = 'none';
  document.getElementById('editorQuote').style.display = 'none';
  document.getElementById('editorMemo').style.display  = 'none';
  document.getElementById('edToolbar').style.display   = 'none';
  const dayListPanel = document.getElementById('editorDayList');
  dayListPanel.style.display = 'flex';
  document.getElementById('edDate').textContent = dayLabel;

  let html = `<div class="day-list-header">${m}월 ${d}일</div>`;
  html += `<div class="day-list-sub">${dateItems.length}개의 기록</div>`;
  html += '<div class="day-list-items">';
  dateItems.forEach(item => {
    const time = formatTimeOnly(item.created || item.date);
    let title = '', preview = '', thumbs = [], clickFn = '';
    if (textTypes.includes(type)) {
      title   = item.title || '제목 없음';
      preview = stripHtml(item.content || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      thumbs  = getThumbs(item.content, 3);
      clickFn = `hideDayList(); loadDoc('${type}','${item.id}'); setMobileView('editor');`;
    } else if (type === 'book') {
      title   = item.title || '제목 없음';
      preview = [item.author, item.publisher].filter(Boolean).join(' · ');
      clickFn = `hideDayList(); loadBook('${item.id}'); setMobileView('editor');`;
    } else if (type === 'quote') {
      title   = item.text ? (item.text.length > 50 ? item.text.slice(0, 50) + '…' : item.text) : '';
      preview = item.by || '';
      clickFn = `hideDayList(); loadQuote('${item.id}'); setMobileView('editor');`;
    } else if (type === 'memo') {
      title   = item.title || '제목 없음';
      preview = stripHtml(item.content || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      thumbs  = getThumbs(item.content, 3);
      clickFn = `hideDayList(); loadMemo('${item.id}'); setMobileView('editor');`;
    }
    const safeTitle   = escapeHtml(title);
    const safePreview = escapeHtml(preview);
    html += `<div class="day-list-card" onclick="${clickFn}">`;
    if (thumbs.length === 1) html += `<img class="day-list-card-thumb" src="${thumbs[0]}" alt="">`;
    html += `<div class="day-list-card-body">`;
    html += `<div class="day-list-card-title">${safeTitle}</div>`;
    if (safePreview) html += `<div class="day-list-card-preview">${safePreview}</div>`;
    if (thumbs.length >= 2) {
      html += '<div class="day-list-card-thumbs">';
      thumbs.forEach(src => { html += `<img src="${src}" alt="">`; });
      html += '</div>';
    }
    html += `<div class="day-list-card-meta">${time}</div></div></div>`;
  });
  html += '</div>';
  document.getElementById('dayListWrap').innerHTML = html;
}

function hideDayList() {
  const p = document.getElementById('editorDayList');
  if (p) p.style.display = 'none';
  document.getElementById('editorText').style.display  = textTypes.includes(activeTab) ? 'flex' : 'none';
  document.getElementById('editorBook').style.display  = activeTab === 'book'  ? 'flex' : 'none';
  document.getElementById('editorQuote').style.display = activeTab === 'quote' ? 'flex' : 'none';
  document.getElementById('editorMemo').style.display  = activeTab === 'memo'  ? 'flex' : 'none';
  document.getElementById('edToolbar').style.display   = ['book','quote'].includes(activeTab) ? 'none' : 'flex';
}

// 루틴 모드에서 리스트 아이템 onclick을 switchTab 포함으로 패치
function _patchRoutineOnclick(itemHtml, item) {
  const itemType = item._type || item.type;
  if (!itemType) return itemHtml;
  // loadDoc('type','id') 패턴
  if (textTypes.includes(itemType)) {
    itemHtml = itemHtml.replace(
      /onclick="loadDoc\('([^']+)','([^']+)'\);\s*setMobileView\('editor'\);"/,
      'onclick="switchTab(\'' + itemType + '\', true); loadDoc(\'' + itemType + '\',\'' + item.id + '\'); setMobileView(\'editor\');"'
    );
  }
  // loadBook('id') 패턴
  else if (itemType === 'book') {
    itemHtml = itemHtml.replace(
      /onclick="loadBook\('([^']+)'\);\s*setMobileView\('editor'\);"/,
      'onclick="switchTab(\'book\', true); loadBook(\'' + item.id + '\'); setMobileView(\'editor\');"'
    );
  }
  // loadQuote('id') 패턴
  else if (itemType === 'quote') {
    itemHtml = itemHtml.replace(
      /onclick="loadQuote\('([^']+)'\);\s*setMobileView\('editor'\);"/,
      'onclick="switchTab(\'quote\', true); loadQuote(\'' + item.id + '\'); setMobileView(\'editor\');"'
    );
  }
  // loadMemo('id') 패턴
  else if (itemType === 'memo') {
    itemHtml = itemHtml.replace(
      /onclick="loadMemo\('([^']+)'\);\s*setMobileView\('editor'\);"/,
      'onclick="switchTab(\'memo\', true); loadMemo(\'' + item.id + '\'); setMobileView(\'editor\');"'
    );
  }
  return itemHtml;
}

// ═══ 리스트 패널 메인 렌더링 ═══
function renderListPanel() {
  renderWritingGrid();
  const t  = activeTab;
  const el = document.getElementById('pane-list');
  const emptyState = '<div style="text-align:center;padding:80px 20px;color:var(--tx-hint);font-size:15px">기록이 없습니다</div>';

  // 파트너 모드: 상대방 데이터로 렌더
  if (_partnerMode && _partnerData) {
    var partnerItems = _getPartnerDocs(activeTab);
    if (!partnerItems.length) {
      el.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--tx-hint);font-size:15px">기록이 없습니다</div>';
      return;
    }
    let pHtml = '';
    partnerItems.forEach(function(item) {
      // 타입 보정 (book/quote/memo는 type 필드가 없을 수 있음)
      if (!item.type && activeTab === 'book') item.type = 'book';
      if (!item.type && activeTab === 'quote') item.type = 'quote';
      if (!item.type && activeTab === 'memo') item.type = 'memo';
      if (!item.type) item.type = activeTab;

      var itemHtml = generateItemHtml(item, activeTab, true);
      // onclick을 파트너 전용으로 교체
      itemHtml = itemHtml.replace(/onclick="[^"]*"/,
        'onclick="_loadPartnerDoc(' + JSON.stringify(item).replace(/"/g, '&quot;') + '); if(window.innerWidth<=768) setMobileView(\'editor\');"');
      pHtml += itemHtml;
    });
    el.innerHTML = pHtml;
    return;
  }

  let items = [];
  const isRoutineMode = document.getElementById('pane-routine') &&
    document.getElementById('pane-routine').style.display !== 'none';

  if (isRoutineMode) {
    const td = today(), allItems = [];
    allDocs().forEach(d  => { if ((d.created||d.updated||'').slice(0,10) === td) allItems.push({...d, _type:d.type}); });
    getBooks().forEach(b => { if ((b.date||b.created||'').slice(0,10) === td)    allItems.push({...b, _type:'book'}); });
    getQuotes().forEach(q => { if ((q.created||'').slice(0,10) === td)            allItems.push({...q, _type:'quote'}); });
    getMemos().forEach(m => { if ((m.created||m.updated||'').slice(0,10) === td)  allItems.push({...m, _type:'memo'}); });
    allItems.sort((a, b) => new Date(b.created||b.date||0) - new Date(a.created||a.date||0));
    items = allItems;
  } else if (textTypes.includes(t)) items = getDocs(t);
  else if (t === 'book')  items = getBooks();
  else if (t === 'quote') items = getQuotes();
  else if (t === 'memo')  items = getMemos();

  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    items = items.filter(it => {
      const fields = [it.title,it.text,it.tags,it.by,it.author].map(v => (v||'').toLowerCase());
      const content = stripHtml(it.content || '').toLowerCase();
      const dStr    = getLocalYMD(new Date(it.created || it.date || Date.now()));
      return fields.some(f => f.includes(q)) || content.includes(q) || dStr.includes(q);
    });
  }

  if (currentListView === 'photo')    { renderPhotoView(items, t); }
  if (currentListView === 'calendar') { renderCalendarView(items, t); }
  if (!items.length) { if (isRoutineMode) { el.innerHTML = ''; return; } el.innerHTML = emptyState; return; }

  const sortFn        = (a, b) => new Date(b.created||b.date||0) - new Date(a.created||a.date||0);
  const pinnedItems   = items.filter(i => i.pinned).sort(sortFn);
  const unpinnedItems = items.filter(i => !i.pinned).sort(sortFn);
  let html = '';

  if (pinnedItems.length > 0) {
    let pinLastDate = '';
    pinnedItems.forEach(item => {
      const dateKey  = getLocalYMD(new Date(item.created || item.date || Date.now()));
      const showDate = (dateKey !== pinLastDate);
      pinLastDate    = dateKey;
      let itemHtml = generateItemHtml(item, item._type || t, showDate).replace('class="lp-item', 'class="lp-item pinned-item');
      if (isRoutineMode) itemHtml = _patchRoutineOnclick(itemHtml, item);
      html += itemHtml;
    });
  }

  let currentMonthStr = '', lastDateStr = '';
  unpinnedItems.forEach(item => {
    const dt    = new Date(item.created || item.date || Date.now());
    const mStr  = getMonthYearStr(dt.toISOString());
    if (mStr !== currentMonthStr) { currentMonthStr = mStr; lastDateStr = ''; }
    const dateKey  = getLocalYMD(dt);
    const showDate = (dateKey !== lastDateStr);
    lastDateStr    = dateKey;
    let itemHtml = generateItemHtml(item, item._type || t, showDate);
    if (isRoutineMode) itemHtml = _patchRoutineOnclick(itemHtml, item);
    html += itemHtml;
  });
  el.innerHTML = html;
}

// ═══ 에디터 더보기 메뉴 (팝업) ═══
function toggleEditorMenu(e) {
  e.stopPropagation();
  const aaMenu = document.getElementById('aaDropdownMenu');
  if (aaMenu) aaMenu.classList.remove('open');
  const tabDD = document.getElementById('edTabDropdown');
  if (tabDD) tabDD.classList.remove('open');
  const overlay = document.getElementById('lpPopupOverlay');
  if (overlay && overlay.classList.contains('open')) { closeLpPopup(); return; }

  let id = null, type = activeTab;
  if (textTypes.includes(activeTab)) id = curIds[activeTab];
  else if (activeTab === 'book')  id = curBookId;
  else if (activeTab === 'quote') id = curQuoteId;
  else if (activeTab === 'memo')  id = curMemoId;
  if (!id) return;

  let itemData = null;
  if (textTypes.includes(type))  itemData = allDocs().find(d => d.id === id);
  else if (type === 'book')  itemData = getBooks().find(d => d.id === id);
  else if (type === 'quote') itemData = getQuotes().find(d => d.id === id);
  else if (type === 'memo')  itemData = getMemos().find(d => d.id === id);
  if (!itemData) return;

  contextItemId   = id;
  contextItemType = type;

  const rawText = (type === 'quote') ? (itemData.text||'') : stripHtml(itemData.content || itemData.memo || '');
  const words   = rawText.split(/\s+/).filter(w => w).length;
  const chars   = rawText.replace(/\s/g,'').length;
  const pages   = (chars / 200).toFixed(1);
  const isPinned = !!itemData.pinned;

  const menuEl = document.getElementById('lpPopupMenu');
  menuEl.innerHTML = `
    <div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()"><span>단어수</span><span class="popup-menu-val">${words.toLocaleString()}단어</span></div>
    <div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()"><span>원고지</span><span class="popup-menu-val">${pages}매</span></div>
    <div class="lp-popup-sep"></div>
    <div class="lp-popup-menu-item" onclick="lpPopupAction('pin')"><span>${isPinned?'고정 해제':'고정'}</span><svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg></div>
    <div class="lp-popup-menu-item" onclick="lpPopupAction('copymd')"><span>본문 복사</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></div>
    <div class="lp-popup-sep"></div>
    <div class="lp-popup-menu-item" onclick="lpPopupAction('photo')"><span>사진 추가</span><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
    <div class="lp-popup-sep"></div>
    <div class="lp-popup-menu-item danger" onclick="lpPopupAction('delete')"><span>삭제</span><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>`;

  const moreBtn = document.querySelector('.ed-more-btn');
  const card    = document.getElementById('lpPopupCard');
  if (moreBtn && card) {
    const btnRect  = moreBtn.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    const cardW    = isMobile ? Math.min(260, window.innerWidth - 40) : Math.min(280, window.innerWidth - 32);
    let left = btnRect.right - cardW;
    if (left < 16) left = 16;
    if (left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16;
    let top = btnRect.bottom + 8;
    if (top + 260 > window.innerHeight - 16) top = btnRect.top - 260 - 8;
    if (top < 16) top = 16;
    card.style.left  = left + 'px';
    card.style.top   = top + 'px';
    card.style.width = cardW + 'px';
  }
  window._liftedOriginal = null;
  window._liftedClone    = null;
  overlay.classList.add('open');
  requestAnimationFrame(() => { card.classList.add('open'); });
}

document.addEventListener('click', e => {
  const menu = document.getElementById('editorDropdownMenu');
  if (menu && menu.classList.contains('open')) menu.classList.remove('open');
});

// ═══ 리스트 꾹누르기 팝업 ═══
let contextItemId   = null;
let contextItemType = null;

function showContextMenuAt(item, x, y, fromTouch) {
  // 꾹누르기 중 시작된 텍스트 선택 해제
  var sel = window.getSelection();
  if (sel) sel.removeAllRanges();

  const onclick = item.getAttribute('onclick') || '';
  const t = activeTab;
  contextItemId = null; contextItemType = null;

  if (textTypes.includes(t)) {
    const m = onclick.match(/loadDoc\('([^']+)','([^']+)'\)/);
    if (m) { contextItemType = m[1]; contextItemId = m[2]; }
  } else if (t === 'book') {
    const m = onclick.match(/loadBook\('([^']+)'\)/);
    if (m) { contextItemType = 'book'; contextItemId = m[1]; }
  } else if (t === 'quote') {
    const m = onclick.match(/loadQuote\('([^']+)'\)/);
    if (m) { contextItemType = 'quote'; contextItemId = m[1]; }
  } else if (t === 'memo') {
    const m = onclick.match(/loadMemo\('([^']+)'\)/);
    if (m) { contextItemType = 'memo'; contextItemId = m[1]; }
  }
  if (!contextItemId) return;

  let itemData = null;
  if (textTypes.includes(contextItemType))  itemData = allDocs().find(d => d.id === contextItemId);
  else if (contextItemType === 'book')  itemData = getBooks().find(d => d.id === contextItemId);
  else if (contextItemType === 'quote') itemData = getQuotes().find(d => d.id === contextItemId);
  else if (contextItemType === 'memo')  itemData = getMemos().find(d => d.id === contextItemId);
  if (!itemData) return;

  const itemRect  = item.getBoundingClientRect();
  const showClone = !!fromTouch;

  if (showClone) {
    const clone = item.cloneNode(true);
    window._liftedOriginal = item;
    clone.className = item.className.replace(/\bswiped\b/g,'').replace(/\bon\b/g,'');
    clone.classList.remove('swiped','on');
    clone.classList.add('lp-lifted');
    clone.style.cssText = `left:${itemRect.left}px;top:${itemRect.top}px;width:${itemRect.width}px;height:${itemRect.height}px;margin:0;background:#ffffff;box-sizing:border-box;transform-origin:center center;`;
    clone.onclick = null;
    const sa = clone.querySelector('.swipe-actions');
    if (sa) sa.remove();
    document.body.appendChild(clone);
    window._liftedClone    = clone;
    window._liftedOrigRect = { left: itemRect.left, width: itemRect.width };
    const liftPad = 12;
    item.style.transition = 'opacity .15s ease .05s';
    item.style.opacity    = '0.3';
    requestAnimationFrame(() => {
      clone.style.left  = (itemRect.left + liftPad) + 'px';
      clone.style.width = (itemRect.width - liftPad * 2) + 'px';
      clone.classList.add('lp-lifted-up');
    });
  } else {
    window._liftedOriginal = null;
    window._liftedClone    = null;
  }

  const rawText = (contextItemType === 'quote') ? (itemData.text||'') : stripHtml(itemData.content || itemData.memo || '');
  const words   = rawText.split(/\s+/).filter(w => w).length;
  const chars   = rawText.replace(/\s/g,'').length;
  const pages   = (chars / 200).toFixed(1);
  const isPinned = !!itemData.pinned;
  const menuEl   = document.getElementById('lpPopupMenu');

  menuEl.innerHTML = `
    <div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()"><span>단어수</span><span class="popup-menu-val">${words.toLocaleString()}단어</span></div>
    <div class="lp-popup-menu-item" style="cursor:default;" onclick="event.stopPropagation()"><span>원고지</span><span class="popup-menu-val">${pages}매</span></div>
    <div class="lp-popup-sep"></div>
    <div class="lp-popup-menu-item" onclick="lpPopupAction('pin')"><span>${isPinned?'고정 해제':'고정'}</span><svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg></div>
    <div class="lp-popup-menu-item" onclick="lpPopupAction('copymd')"><span>본문 복사</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></div>
    <div class="lp-popup-sep"></div>
    <div class="lp-popup-menu-item danger" onclick="lpPopupAction('delete')"><span>삭제</span><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>`;

  const overlay = document.getElementById('lpPopupOverlay');
  const card    = document.getElementById('lpPopupCard');
  const estimatedMenuH = 220;
  if (showClone) {
    const cardW = itemRect.width - 48;
    let left = itemRect.left + 24;
    if (left < 16) left = 16;
    if (left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16;
    let top = itemRect.bottom + 6;
    if (top + estimatedMenuH > window.innerHeight - 16) { top = itemRect.top - estimatedMenuH - 6; if (top < 16) top = 16; }
    card.style.left = left + 'px'; card.style.top = top + 'px'; card.style.width = cardW + 'px';
  } else {
    const cardW = 260;
    let left = x; if (left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16; if (left < 16) left = 16;
    let top  = y; if (top + estimatedMenuH > window.innerHeight - 16) top = y - estimatedMenuH; if (top < 16) top = 16;
    card.style.left = left + 'px'; card.style.top = top + 'px'; card.style.width = cardW + 'px';
    overlay.style.background         = 'transparent';
    overlay.style.backdropFilter     = 'none';
    overlay.style.webkitBackdropFilter = 'none';
  }

  if (!showClone) {
    overlay.classList.add('open');
    requestAnimationFrame(() => { card.classList.add('open'); });
  } else {
    overlay.style.background = ''; overlay.style.backdropFilter = ''; overlay.style.webkitBackdropFilter = '';
    setTimeout(() => { overlay.classList.add('open'); }, 120);
    setTimeout(() => { card.classList.add('open'); }, 220);
  }
}

function closeLpPopup() {
  // 남아있는 텍스트 선택 해제
  var sel = window.getSelection();
  if (sel) sel.removeAllRanges();

  const overlay  = document.getElementById('lpPopupOverlay');
  const card     = document.getElementById('lpPopupCard');
  if (card) card.classList.remove('open');
  const clone    = window._liftedClone;
  const original = window._liftedOriginal;
  window._liftedClone = null; window._liftedOriginal = null;

  if (clone) {
    const origRect = window._liftedOrigRect;
    window._liftedOrigRect = null;
    clone.classList.remove('lp-lifted-up');
    clone.style.transition = 'transform .25s cubic-bezier(.25,.1,.25,1), box-shadow .2s ease, border-radius .25s ease, left .25s cubic-bezier(.25,.1,.25,1), width .25s cubic-bezier(.25,.1,.25,1), opacity .18s ease .12s';
    clone.style.transform  = 'scale(1)';
    clone.style.boxShadow  = 'none';
    clone.style.opacity    = '0';
    if (origRect) { clone.style.left = origRect.left + 'px'; clone.style.width = origRect.width + 'px'; }
    if (original && original.parentNode) {
      setTimeout(() => { if (original.parentNode) { original.style.transition = 'opacity .2s ease'; original.style.opacity = '1'; } }, 80);
    }
    setTimeout(() => { if (overlay) overlay.classList.remove('open'); }, 100);
    setTimeout(() => { if (clone.parentNode) clone.remove(); if (original && original.parentNode) { original.style.transition = ''; original.style.opacity = ''; } }, 320);
  } else {
    if (overlay) overlay.classList.remove('open');
    if (original && original.parentNode) { original.style.transition = ''; original.style.opacity = ''; }
  }
  contextItemId = null; contextItemType = null;
}

function lpPopupAction(action) {
  if (!contextItemId || !contextItemType) { closeLpPopup(); return; }
  const id = contextItemId, type = contextItemType;
  if (action === 'pin') {
    closeLpPopup();
    togglePin(type, id, { stopPropagation: () => {} });
  } else if (action === 'copymd') {
    let itemData = null;
    if (textTypes.includes(type))  itemData = allDocs().find(d => d.id === id);
    else if (type === 'book')  itemData = getBooks().find(d => d.id === id);
    else if (type === 'quote') itemData = getQuotes().find(d => d.id === id);
    else if (type === 'memo')  itemData = getMemos().find(d => d.id === id);
    let md = '';
    if (itemData) {
      if (type === 'quote') md = (itemData.text||'') + (itemData.by ? '\n— ' + itemData.by : '');
      else if (type === 'book') md = (itemData.title||'') + '\n' + [itemData.author, itemData.publisher].filter(Boolean).join(' · ') + '\n\n' + stripHtml(itemData.memo||'');
      else md = stripHtml(itemData.content||'').trim();
    }
    navigator.clipboard.writeText(md.trim()).catch(() => {});
    closeLpPopup();
  } else if (action === 'photo') {
    closeLpPopup();
    document.getElementById('fileInput').click();
  } else if (action === 'delete') {
    closeLpPopup();
    const fakeEvent = { stopPropagation: () => {} };
    if (textTypes.includes(type))  delDoc(type, id, fakeEvent);
    else if (type === 'book')  delBook(id, fakeEvent);
    else if (type === 'quote') delQuote(id, fakeEvent);
    else if (type === 'memo')  delMemo(id, fakeEvent);
  } else {
    closeLpPopup();
  }
}

// ═══ 리스트 꾹누르기 이벤트 등록 ═══
let _lpTimer = null, _lpItem = null, _lpMoved = false;

function cancelLongPress() { _lpMoved = true; clearTimeout(_lpTimer); _lpItem = null; }

function setupListContextMenu() {
  const listEl = document.getElementById('pane-list');
  if (!listEl) return;
  let lpX = 0, lpY = 0;
  listEl.addEventListener('contextmenu', e => {
    const item = e.target.closest('.lp-item');
    if (!item) return;
    e.preventDefault();
    showContextMenuAt(item, e.clientX, e.clientY);
  });
  listEl.addEventListener('touchstart', e => {
    const item = e.target.closest('.lp-item');
    if (!item) return;
    _lpItem = item; _lpMoved = false; lpX = e.touches[0].clientX; lpY = e.touches[0].clientY;
    clearTimeout(_lpTimer);
    _lpTimer = setTimeout(() => {
      if (!_lpMoved && _lpItem && !window._gestureActive) {
        window._itemSwiping = true;
        if (navigator.vibrate) navigator.vibrate(20);
        showContextMenuAt(_lpItem, lpX, lpY, true);
        _lpItem = null;
        setTimeout(() => { window._itemSwiping = false; }, 100);
      } else { _lpItem = null; }
    }, 600);
  }, { passive: true });
  listEl.addEventListener('touchmove', e => {
    if (!_lpItem) return;
    if (Math.abs(e.touches[0].clientX - lpX) > 20 || Math.abs(e.touches[0].clientY - lpY) > 20) cancelLongPress();
  }, { passive: true });
  listEl.addEventListener('touchend',   () => { clearTimeout(_lpTimer); _lpItem = null; }, { passive: true });
  listEl.addEventListener('touchcancel', () => { cancelLongPress(); }, { passive: true });
}

// ═══ 네비게이션 버튼 ═══
function handleNew() {
  const t = activeTab;
  if (t === 'expense') {
    if (window.innerWidth > 768) {
      openExpenseModal();
      prefetchClipboardForExpense('modal');
    } else {
      newExpenseForm();
      renderExpenseCategoryGrid();
      setMobileView('editor');
      prefetchClipboardForExpense('normal');
    }
    return;
  }
  if (textTypes.includes(t))  { const nd = newDoc(t); loadDoc(t, nd.id, true); }
  else if (t === 'book')  newBook();
  else if (t === 'quote') newQuoteForm();
  else if (t === 'memo')  newMemoForm();
  renderListPanel();
  setMobileView('editor');
}

function handleBackBtn() {
  // 현재 탭을 유지한 채 에디터 → 리스트 뷰로 전환
  setMobileView('list');
}

function handleDone() {
  if (document.activeElement) document.activeElement.blur();
  setMobileView('list');
  const vs = document.getElementById('viewSwitcher');
  if (vs && document.getElementById('pane-routine').style.display === 'none') vs.style.display = 'flex';
}

function toggleTabletList() {
  document.getElementById('mainApp').classList.toggle('tablet-list-closed');
  updateBackBtnIcon();
}

function updateBackBtnIcon() {
  const app = document.getElementById('mainApp');
  const btn = document.querySelector('.editor .mobile-back-btn');
  if (!btn) return;
  const w = window.innerWidth;
  if (w >= 769 && w <= 1400) {
    btn.innerHTML = app.classList.contains('tablet-list-closed')
      ? '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>'
      : '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
  } else {
    btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  }
}

// ═══ 알림 (소셜) ═══
var _notifCache = [];
var _notifPopoverOpen = false;
var _lastNotifFetch = 0;
var _notifBlocked = false;

async function checkAndUpdateNotifBadge() {
  try {
    var res = await SYNC.checkNotifications();
    if (res && res.notifications) {
      _notifCache = res.notifications;
      _lastNotifFetch = Date.now();
    }
    var unread = res && typeof res.unreadCount === 'number' ? res.unreadCount : _notifCache.filter(function(n) { return !n.read; }).length;
    var badge = document.getElementById('notifBadge');
    if (badge) {
      if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : String(unread);
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {
    console.warn('[알림] 뱃지 업데이트 실패:', e.message);
  }
}

function toggleNotifPopover() {
  if (_notifBlocked) return;
  if (_notifPopoverOpen) {
    closeNotifPopover();
    return;
  }
  openNotifPopover();
}

function openNotifPopover() {
  var overlay = document.getElementById('notifPopoverOverlay');
  var card = document.getElementById('notifPopoverCard');
  if (!overlay || !card) return;

  _notifPopoverOpen = true;

  // 캐시가 비어있으면 로딩 표시, 있으면 즉시 렌더
  if (_notifCache.length === 0) {
    var listEl = document.getElementById('notifPopoverBody');
    if (listEl) listEl.innerHTML = '<div class="notif-empty" style="color:var(--tx-hint);padding:60px 20px;text-align:center;font-size:14px;">불러오는 중...</div>';
  } else {
    renderNotifList();
  }

  // 위치 설정
  var btn = document.getElementById('notifBellBtn');
  if (window.innerWidth > 768 && btn) {
    var rect = btn.getBoundingClientRect();
    var cardW = 340;
    var leftPos = rect.left;
    if (leftPos + cardW > window.innerWidth - 16) {
      leftPos = window.innerWidth - cardW - 16;
    }
    if (leftPos < 16) leftPos = 16;
    card.style.top = (rect.bottom + 8) + 'px';
    card.style.left = leftPos + 'px';
    card.style.right = 'auto';
    card.style.bottom = '';
  } else {
    card.style.top = '';
    card.style.left = '';
    card.style.right = '';
    card.style.bottom = '';
  }

  // 열기
  overlay.classList.add('open');
  card.classList.add('open');

  // 항상 서버에서 최신 알림 가져오기
  checkAndUpdateNotifBadge().then(function() {
    if (_notifPopoverOpen) {
      renderNotifList();
    }
  });
}

function closeNotifPopover() {
  var overlay = document.getElementById('notifPopoverOverlay');
  var card = document.getElementById('notifPopoverCard');
  if (card) card.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  _notifPopoverOpen = false;
}

function renderNotifList() {
  var listEl = document.getElementById('notifPopoverBody');
  if (!listEl) return;

  if (!_notifCache || _notifCache.length === 0) {
    listEl.innerHTML = '<div class="notif-empty">알림이 없습니다</div>';
    return;
  }

  var html = '';
  _notifCache.forEach(function(n) {
    var readClass = n.read ? ' notif-item-read' : '';
    var fromName = _getDisplayName(n.from);
    var title = '';
    var preview = '';
    var iconSvg = '';

    if (n.type === 'comment') {
      title = fromName + '님이 댓글을 남겼습니다';
      preview = n.preview || '';
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    } else {
      title = fromName + '님이 새 글을 올렸습니다';
      preview = n.docTitle || '';
      iconSvg = '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    }

    var time = n.created ? getRelativeTime(n.created) : '';

    html += '<div class="notif-item' + readClass + '" onclick="onNotifClick(\'' + n.id + '\',\'' + (n.docId || '') + '\',\'' + (n.from || '') + '\')">';
    html += '<div class="notif-item-icon">' + iconSvg + '</div>';
    html += '<div class="notif-item-body">';
    html += '<div class="notif-item-title">' + escapeHtml(title) + '</div>';
    if (preview) html += '<div class="notif-item-preview">' + escapeHtml(preview) + '</div>';
    html += '</div>';
    html += '<div class="notif-item-time">' + time + '</div>';
    html += '</div>';
  });

  listEl.innerHTML = html;
}

function _getDisplayName(email) {
  if (!email) return '알 수 없음';
  if (email.indexOf('soyoun') !== -1) return '소연';
  if (email.indexOf('leftjap') !== -1) return '지오';
  return email.split('@')[0];
}

function onNotifClick(notifId, docId, fromEmail) {
  var notif = _notifCache.find(function(n) { return n.id === notifId; });

  // 캐시에서 즉시 읽음 처리
  if (notif) notif.read = true;

  // 뱃지 즉시 업데이트
  var unread = _notifCache.filter(function(n) { return !n.read; }).length;
  var badge = document.getElementById('notifBadge');
  if (badge) {
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  // 팝오버 즉시 닫기
  closeNotifPopover();

  // 파트너 모드 즉시 진입
  if (fromEmail) {
    enterPartnerMode(fromEmail, docId || null);
  }

  // 서버 읽음 표시는 백그라운드 (await 안 함)
  SYNC.markRead([notifId]).catch(function(e) { console.warn('[알림] markRead 실패:', e); });
}

// ═══ 파트너 모드 (상대방 블로그 방문) ═══
var _partnerMode = false;
var _partnerData = null;  // { dbData, config, comments, partnerEmail }
var _myBackup = null;     // { docs, books, quotes, memos, checks, expenses, activeTab, curIds, ... }

async function enterPartnerMode(partnerEmail, targetDocId) {
  if (_partnerMode) return;
  console.log('[파트너] 진입 시작', partnerEmail, targetDocId);

  // 로딩 화면 표시
  var loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) { loadingScreen.classList.remove('hidden'); loadingScreen.style.display = ''; }

  // 내 데이터 백업 (const 변수는 복사본 생성)
  _myBackup = {
    activeTab: activeTab,
    curIdsCopy: JSON.parse(JSON.stringify(curIds)),
    curBookId: curBookId,
    curQuoteId: curQuoteId,
    curMemoId: curMemoId,
    textTypes: textTypes.slice(),
    TAB_META: JSON.parse(JSON.stringify(TAB_META))
  };

  try {
    var r = await SYNC.loadPartnerDb();
    if (!r || r.status !== 'ok') {
      console.error('[파트너] loadPartnerDb 실패');
      _myBackup = null;
      if (loadingScreen) { loadingScreen.classList.add('hidden'); loadingScreen.style.display = 'none'; }
      return;
    }

    _partnerData = {
      dbData: r.dbData,
      config: r.config,
      comments: r.comments || [],
      partnerEmail: r.partnerEmail
    };
  } catch (e) {
    console.error('[파트너] 에러:', e);
    _myBackup = null;
    if (loadingScreen) { loadingScreen.classList.add('hidden'); loadingScreen.style.display = 'none'; }
    return;
  }

  // 로딩 화면 숨김
  if (loadingScreen) { loadingScreen.classList.add('hidden'); loadingScreen.style.display = 'none'; }

  _partnerMode = true;

  // 파트너 config 적용 (const 변수 내용만 교체)
  var pc = _partnerData.config;
  if (pc) {
    textTypes.length = 0;
    (pc.textTypes || ['navi']).forEach(function(t) { textTypes.push(t); });

    Object.keys(TAB_META).forEach(function(k) { delete TAB_META[k]; });
    Object.assign(TAB_META, pc.tabNames || {});
  }

  // UI 전환
  _setBellAsBack(true);
  _setReadOnly(true);
  document.getElementById('mainApp').classList.add('partner-mode');

  // 상태 초기화 (const인 curIds는 내용만 비움)
  activeTab = textTypes[0] || 'navi';
  Object.keys(curIds).forEach(function(k) { delete curIds[k]; });
  curBookId = null;
  curQuoteId = null;
  curMemoId = null;
  currentLoadedDoc = { type: null, id: null };

  // 에디터 비우기 (파트너 문서 로드 전)
  document.getElementById('edTitle').value = '';
  document.getElementById('edBody').innerHTML = '';

  // 렌더링
  renderWritingGrid();
  _renderPartnerSidebar();
  document.getElementById('pane-list').style.display = 'flex';
  closeNotifPopover();
  renderListPanel();

  // 모바일 대응
  if (window.innerWidth <= 768) {
    var a = document.getElementById('mainApp');
    a.classList.remove('view-side', 'view-editor');
    a.classList.add('view-list');
  }

  // targetDoc 로드 (매칭 실패 시 첫 번째 문서)
  var docs = _getPartnerDocs(activeTab);
  if (targetDocId) {
    var found = docs.find(function(d) { return d.id === targetDocId; });
    if (found) {
      _loadPartnerDoc(found);
    } else if (docs.length > 0) {
      _loadPartnerDoc(docs[0]);
    }
  } else if (docs.length > 0) {
    _loadPartnerDoc(docs[0]);
  }

  console.log('[파트너] 진입 완료');
}

function exitPartnerMode() {
  if (!_partnerMode) return;
  console.log('[파트너] 퇴장 시작');

  _partnerMode = false;
  _partnerData = null;

  // 댓글 숨김
  if (typeof hideComments === 'function') hideComments();

  // ★ 핵심: 에디터 비우고 currentLoadedDoc 초기화
  // → switchTab 내부의 saveCurDoc이 실행되어도 저장 대상이 없음
  document.getElementById('edTitle').value = '';
  document.getElementById('edBody').innerHTML = '';
  currentLoadedDoc = { type: null, id: null };

  // 백업 복원 (const 변수는 내용만 교체)
  if (_myBackup) {
    activeTab = _myBackup.activeTab;

    Object.keys(curIds).forEach(function(k) { delete curIds[k]; });
    if (_myBackup.curIdsCopy) Object.assign(curIds, _myBackup.curIdsCopy);

    curBookId = _myBackup.curBookId;
    curQuoteId = _myBackup.curQuoteId;
    curMemoId = _myBackup.curMemoId;

    textTypes.length = 0;
    _myBackup.textTypes.forEach(function(t) { textTypes.push(t); });

    Object.keys(TAB_META).forEach(function(k) { delete TAB_META[k]; });
    Object.assign(TAB_META, _myBackup.TAB_META);

    _myBackup = null;
  }

  // UI 복원 — 벨 복원 중 팝오버 열림 차단
  _notifBlocked = true;
  _setBellAsBack(false);
  setTimeout(function() { _notifBlocked = false; }, 500);

  _setReadOnly(false);
  document.getElementById('mainApp').classList.remove('partner-mode');

  // 화면 갱신
  renderWritingGrid();
  renderChk();
  renderRoutineRing();
  showRandomQuote();
  updateExpenseCompact();
  updateWritingStats();
  updateBookStats();

  // ★ switchTab 전에 curIds가 복원되었으므로 saveCurDoc은
  // currentLoadedDoc이 null이 아닌 유효한 객체라 저장 시도하지만,
  // saveCurDoc 함수 시작에 안전장치가 있으므로 저장되지 않음
  switchTab(activeTab, true);

  // 레이아웃 복원 (keepLayout=true로 건너뛴 부분 수동 처리)
  var w = window.innerWidth;
  if (w >= 769 && w <= 1400) {
    var app = document.getElementById('mainApp');
    app.classList.remove('tablet-side-open');
    app.classList.remove('tablet-list-closed');
  } else if (w > 1400) {
    var app = document.getElementById('mainApp');
    app.classList.remove('sidebar-closed');
    app.classList.remove('list-closed');
  } else {
    setMobileView('list');
  }
  renderListPanel();

  console.log('[파트너] 퇴장 완료');
}

// ═══ 파트너 모드 헬퍼 ═══

function _setBellAsBack(isBack) {
  var btn = document.getElementById('notifBellBtn');
  if (!btn) return;

  // 기존 핸들러 제거
  var newBtn = btn.cloneNode(false);
  newBtn.removeAttribute('onclick');
  btn.parentNode.replaceChild(newBtn, btn);

  if (isBack) {
    newBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    newBtn.addEventListener('click', function(e) {
      e.stopImmediatePropagation();
      e.preventDefault();
      exitPartnerMode();
    });
    var badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
    console.log('[벨→뒤로] 바인딩 완료');
  } else {
    newBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span class="notif-badge" id="notifBadge" style="display:none"></span>';

    // 벨 버튼 복원 후 300ms 동안 클릭을 무시 (뒤로가기 이벤트 전파 차단)
    var _bellReady = false;
    setTimeout(function() { _bellReady = true; }, 300);

    newBtn.addEventListener('click', function(e) {
      if (!_bellReady) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      toggleNotifPopover();
    });

    // 뱃지 복원
    checkAndUpdateNotifBadge();
    console.log('[뒤로→벨] 복원 완료');
  }
}

function _setReadOnly(readOnly) {
  // contenteditable 전환
  var edBodies = ['edBody', 'book-body', 'quote-body', 'memo-body'];
  edBodies.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.contentEditable = readOnly ? 'false' : 'true';
  });

  // 입력 필드 readonly
  var inputs = ['edTitle', 'book-title', 'book-author', 'book-publisher', 'book-pages', 'quote-by', 'memo-title'];
  inputs.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.readOnly = readOnly;
  });

  // FAB, 새글 버튼, 더보기 버튼 숨김/표시
  var fab = document.querySelector('.fab-btn');
  var newBtn = document.querySelector('.ed-new-btn');
  var moreBtn = document.querySelector('.ed-more-btn');
  var aaBtn = document.querySelector('.ed-aa-btn');
  if (readOnly) {
    if (fab) fab.style.display = 'none';
    if (newBtn) newBtn.style.display = 'none';
    if (moreBtn) moreBtn.style.display = 'none';
    if (aaBtn) aaBtn.style.display = 'none';
  } else {
    if (fab) fab.style.display = '';
    if (newBtn) newBtn.style.display = '';
    if (moreBtn) moreBtn.style.display = '';
    if (aaBtn) aaBtn.style.display = '';
  }
}

function _renderPartnerSidebar() {
  // 상대방 이름으로 어구 영역 업데이트
  var quoteText = document.getElementById('quoteText');
  var quoteBy = document.getElementById('quoteBy');
  var partnerName = _getDisplayName(_partnerData.partnerEmail);
  if (quoteText) quoteText.textContent = partnerName + '님의 공간';
  if (quoteBy) quoteBy.textContent = '';

  // 루틴/가계부/통계는 상대방 데이터로 렌더 (LocalStorage가 아닌 파트너 DB에서)
  // 간소화: 루틴 링/체크는 빈 상태로, 가계부 금액은 상대방 것으로
  var routineSub = document.getElementById('routineCompactSub');
  if (routineSub) {
    var partnerChecks = _partnerData.dbData['gb_checks'] || {};
    var todayStr = today();
    var todayChecks = partnerChecks[todayStr] || {};
    var routineTotal = _partnerData.config.routines ? _partnerData.config.routines.length : 0;
    var doneCount = 0;
    for (var k in todayChecks) { if (todayChecks[k]) doneCount++; }
    routineSub.textContent = doneCount + '/' + routineTotal + ' 완료';
  }

  // 가계부 금액
  var expAmount = document.getElementById('expenseCompactAmount');
  if (expAmount) {
    var partnerExpenses = _partnerData.dbData['gb_expenses'] || [];
    var now = new Date();
    var ym = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    var monthTotal = 0;
    for (var i = 0; i < partnerExpenses.length; i++) {
      if ((partnerExpenses[i].date || '').startsWith(ym)) {
        monthTotal += (partnerExpenses[i].amount || 0);
      }
    }
    expAmount.textContent = formatAmount(monthTotal) + ' 원';
  }

  // 기록 통계
  var wToday = document.getElementById('wToday');
  var bToday = document.getElementById('bToday');
  if (wToday) wToday.textContent = '0';
  if (bToday) bToday.textContent = '0';
}

// 상대방 데이터에서 문서 목록 가져오기 (LocalStorage 대신 _partnerData.dbData 사용)
function _getPartnerDocs(type) {
  if (!_partnerData || !_partnerData.dbData) return [];
  var docs = _partnerData.dbData['gb_docs'] || [];
  if (textTypes.includes(type)) {
    return docs.filter(function(d) { return d.type === type; })
      .sort(function(a, b) { return (b.updated || b.created || '').localeCompare(a.updated || a.created || ''); });
  }
  if (type === 'book') {
    return (_partnerData.dbData['gb_books'] || [])
      .sort(function(a, b) { return (b.updated || b.date || '').localeCompare(a.updated || a.date || ''); });
  }
  if (type === 'quote') {
    return (_partnerData.dbData['gb_quotes'] || [])
      .sort(function(a, b) { return (b.created || '').localeCompare(a.created || ''); });
  }
  if (type === 'memo') {
    return (_partnerData.dbData['gb_memos'] || [])
      .sort(function(a, b) { return (b.updated || b.created || '').localeCompare(a.updated || a.created || ''); });
  }
  return [];
}

// 파트너 모드: 탭별 문서 수 계산
function _getPartnerTabCount(tabId) {
  if (!_partnerData || !_partnerData.dbData) return 0;
  if (textTypes.includes(tabId)) {
    var docs = _partnerData.dbData['gb_docs'] || [];
    return docs.filter(function(d) { return d.type === tabId; }).length;
  }
  if (tabId === 'book') return (_partnerData.dbData['gb_books'] || []).length;
  if (tabId === 'quote') return (_partnerData.dbData['gb_quotes'] || []).length;
  if (tabId === 'memo') return (_partnerData.dbData['gb_memos'] || []).length;
  return 0;
}

function _loadPartnerDoc(doc) {
  if (!doc) return;
  var type = doc.type;

  // 에디터 패널 전환
  document.getElementById('editorText').style.display = textTypes.includes(type) ? 'flex' : 'none';
  document.getElementById('editorBook').style.display = type === 'book' ? 'flex' : 'none';
  document.getElementById('editorQuote').style.display = type === 'quote' ? 'flex' : 'none';
  document.getElementById('editorMemo').style.display = type === 'memo' ? 'flex' : 'none';

  if (textTypes.includes(type)) {
    document.getElementById('edTitle').value = doc.title || '';
    document.getElementById('edBody').innerHTML = fixDriveImageUrls(doc.content || '');
  } else if (type === 'book') {
    document.getElementById('book-title').value = doc.title || '';
    document.getElementById('book-author').value = doc.author || '';
    document.getElementById('book-publisher').value = doc.publisher || '';
    document.getElementById('book-pages').value = doc.pages || '';
    document.getElementById('book-body').innerHTML = doc.memo || '';
  } else if (type === 'quote') {
    document.getElementById('quote-by').value = doc.by || '';
    document.getElementById('quote-body').innerHTML = doc.text || '';
  } else if (type === 'memo') {
    document.getElementById('memo-title').value = doc.title || '';
    document.getElementById('memo-body').innerHTML = fixDriveImageUrls(doc.content || '');
  }

  // 탭 라벨 업데이트
  updateEdTabLabel();

  // 댓글 렌더 (파트너 모드에서만)
  if (_partnerMode && _partnerData) {
    renderComments(doc.id, _partnerData.partnerEmail);
  }

  // 모바일: 에디터 뷰로 전환
  if (window.innerWidth <= 768) {
    setMobileView('editor');
  }
}

// ═══ 댓글 시스템 ═══
var _commentDocId = null;       // 현재 표시 중인 댓글 문서 ID
var _commentDocOwner = null;    // 현재 표시 중인 댓글 문서 소유자
var _myCommentCache = [];       // 자기 글에 달린 댓글 캐시 (비파트너 모드용)

function renderComments(docId, ownerEmail) {
  if (!docId || !ownerEmail) return;
  _commentDocId = docId;
  _commentDocOwner = ownerEmail;

  var commentSection = document.getElementById('commentSection');
  if (!commentSection) return;
  commentSection.style.display = 'flex';

  var commentList = document.getElementById('commentList');
  commentList.innerHTML = '';

  // 댓글 소스 결정
  var comments;
  if (_partnerMode && _partnerData && _partnerData.comments) {
    comments = _partnerData.comments;
  } else {
    comments = _myCommentCache;
  }

  var docComments = comments.filter(function(c) {
    return c.docId === docId && c.docOwner === ownerEmail;
  });

  if (!docComments.length) return;

  // 내 이메일 가져오기 (버튼 표시 판단용)
  var myEmail = '';
  try {
    var jwt = localStorage.getItem('gb_id_token');
    if (jwt) {
      var payload = JSON.parse(atob(jwt.split('.')[1]));
      myEmail = payload.email || '';
    }
  } catch(e) {}

  docComments.forEach(function(c) {
    var commentEl = document.createElement('div');
    commentEl.className = 'comment-item';
    commentEl.setAttribute('data-comment-id', c.id);

    var meta = document.createElement('div');
    meta.className = 'comment-meta';

    var author = document.createElement('span');
    author.className = 'comment-author';
    author.textContent = _getDisplayName(c.author);

    var time = document.createElement('span');
    time.className = 'comment-time';
    var timeText = c.created ? getRelativeTime(c.created) : '';
    if (c.edited) timeText += ' (수정됨)';
    time.textContent = timeText;

    meta.appendChild(author);
    meta.appendChild(time);

    // 본인 댓글이면 수정/삭제 버튼 추가
    if (c.author === myEmail) {
      var actions = document.createElement('span');
      actions.className = 'comment-actions';
      actions.innerHTML =
        '<button class="comment-action-btn" onclick="editComment(\'' + c.id + '\')" title="수정">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>' +
          '</svg>' +
        '</button>' +
        '<button class="comment-action-btn comment-action-del" onclick="deleteComment(\'' + c.id + '\')" title="삭제">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>';
      meta.appendChild(actions);
    }

    var text = document.createElement('div');
    text.className = 'comment-text';
    text.setAttribute('id', 'comment-text-' + c.id);
    text.textContent = c.text;

    commentEl.appendChild(meta);
    commentEl.appendChild(text);
    commentList.appendChild(commentEl);
  });
}

function _loadMyCommentsAndRender(docId) {
  if (!docId) return;
  // 자기 이메일 가져오기
  var myEmail = '';
  try {
    var jwt = localStorage.getItem('gb_id_token');
    if (jwt) {
      var payload = JSON.parse(atob(jwt.split('.')[1]));
      myEmail = payload.email || '';
    }
  } catch(e) {}
  if (!myEmail) return;

  // 캐시에 이미 있는 댓글로 즉시 렌더 (빠른 표시)
  renderComments(docId, myEmail);

  // 서버에서 최신 댓글 가져오기 (백그라운드)
  SYNC.loadMyComments().then(function(res) {
    if (res && res.comments) {
      _myCommentCache = res.comments;
      // 현재 열린 문서가 아직 같은 문서이면 리렌더
      if (_commentDocId === docId) {
        renderComments(docId, myEmail);
      }
    }
  }).catch(function(e) {
    console.warn('[댓글] 로드 실패:', e);
  });
}

function deleteComment(commentId) {
  if (!confirm('댓글을 삭제할까요?')) return;

  // 로컬 캐시에서 즉시 제거
  if (_partnerMode && _partnerData && _partnerData.comments) {
    _partnerData.comments = _partnerData.comments.filter(function(c) { return c.id !== commentId; });
  } else {
    _myCommentCache = _myCommentCache.filter(function(c) { return c.id !== commentId; });
  }

  // 즉시 리렌더
  renderComments(_commentDocId, _commentDocOwner);

  // 서버 삭제 (백그라운드)
  SYNC.deleteComment(commentId).then(function(res) {
    if (!res || res.status !== 'ok') {
      console.warn('[댓글] 서버 삭제 실패');
    }
  }).catch(function(e) {
    console.error('[댓글] 서버 삭제 에러:', e);
  });
}

function editComment(commentId) {
  var textEl = document.getElementById('comment-text-' + commentId);
  if (!textEl) return;

  var currentText = textEl.textContent;

  // 인라인 편집 UI로 전환
  textEl.innerHTML = '';
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'comment-edit-input';
  input.value = currentText;

  var btnWrap = document.createElement('span');
  btnWrap.className = 'comment-edit-btns';
  btnWrap.innerHTML =
    '<button class="comment-edit-save" onclick="_saveCommentEdit(\'' + commentId + '\')">저장</button>' +
    '<button class="comment-edit-cancel" onclick="_cancelCommentEdit(\'' + commentId + '\',\'' + currentText.replace(/'/g, "\\'").replace(/\\/g, "\\\\") + '\')">취소</button>';

  textEl.appendChild(input);
  textEl.appendChild(btnWrap);
  input.focus();
  input.select();

  // Enter 키로 저장, Escape 키로 취소
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); _saveCommentEdit(commentId); }
    if (e.key === 'Escape') { _cancelCommentEdit(commentId, currentText); }
  });
}

function _saveCommentEdit(commentId) {
  var textEl = document.getElementById('comment-text-' + commentId);
  if (!textEl) return;
  var input = textEl.querySelector('.comment-edit-input');
  if (!input) return;
  var newText = input.value.trim();
  if (!newText) return;

  // 로컬 캐시 업데이트
  var comments = (_partnerMode && _partnerData && _partnerData.comments) ? _partnerData.comments : _myCommentCache;
  for (var i = 0; i < comments.length; i++) {
    if (comments[i].id === commentId) {
      comments[i].text = newText;
      comments[i].edited = new Date().toISOString();
      break;
    }
  }

  // 즉시 리렌더
  renderComments(_commentDocId, _commentDocOwner);

  // 서버 수정 (백그라운드)
  SYNC.editComment(commentId, newText).then(function(res) {
    if (!res || res.status !== 'ok') {
      console.warn('[댓글] 서버 수정 실패');
    }
  }).catch(function(e) {
    console.error('[댓글] 서버 수정 에러:', e);
  });
}

function _cancelCommentEdit(commentId, originalText) {
  var textEl = document.getElementById('comment-text-' + commentId);
  if (!textEl) return;
  textEl.innerHTML = '';
  textEl.textContent = originalText;
}

function hideComments() {
  var commentSection = document.getElementById('commentSection');
  if (commentSection) commentSection.style.display = 'none';
  _commentDocId = null;
  _commentDocOwner = null;
}

function sendComment() {
  if (!_commentDocId || !_commentDocOwner) return;

  var input = document.getElementById('commentInput');
  var text = input.value.trim();
  if (!text) return;

  // 입력 필드 즉시 비우기
  input.value = '';

  // 로컬 캐시에 즉시 추가
  var myEmail = '';
  try {
    var jwt = localStorage.getItem('gb_id_token');
    if (jwt) {
      var payload = JSON.parse(atob(jwt.split('.')[1]));
      myEmail = payload.email || '';
    }
  } catch(e) {}

  var localComment = {
    id: 'cmt_local_' + Date.now(),
    docId: _commentDocId,
    docOwner: _commentDocOwner,
    author: myEmail,
    text: text,
    created: new Date().toISOString()
  };

  if (_partnerMode && _partnerData && _partnerData.comments) {
    _partnerData.comments.push(localComment);
  } else {
    _myCommentCache.push(localComment);
  }

  // 즉시 렌더
  renderComments(_commentDocId, _commentDocOwner);

  // 서버 저장은 백그라운드
  var docId = _commentDocId;
  var docOwner = _commentDocOwner;
  SYNC.postComment(docId, docOwner, text).then(function(res) {
    if (!res || res.status !== 'ok') {
      console.warn('[댓글] 서버 저장 실패');
    }
  }).catch(function(e) {
    console.error('[댓글] 서버 저장 에러:', e);
  });
}

async function loadMySocialComments() {
  if (!_partnerMode || !_partnerData) return;
  try {
    var res = await SYNC.loadPartnerDb();
    if (res && res.status === 'ok' && res.comments) {
      _partnerData.comments = res.comments;
    }
  } catch (e) {
    console.error('loadMySocialComments error:', e);
  }
}
