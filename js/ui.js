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
  const tabs = [
    { id:'navi',    label:'오늘의 네비' },
    { id:'fiction', label:'단편 습작'   },
    { id:'blog',    label:'블로그'      },
    { id:'book',    label:'서재'        },
    { id:'quote',   label:'어구'        },
    { id:'memo',    label:'메모'        }
  ];
  nav.innerHTML = tabs.map(t => `
    <div class="side-menu ${activeTab === t.id ? 'on' : ''}" data-tab="${t.id}"
         onclick="switchTab('${t.id}'); setMobileView('list');">
      <div class="side-menu-l">${t.label}</div>
      <svg class="side-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`).join('');
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

      var trashBtnTop = document.getElementById('expenseTrashBtn');
      if (trashBtnTop) trashBtnTop.style.display = 'none';

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

    // 휴지통 버튼 복원
    var trashBtnRestore = document.getElementById('expenseTrashBtn');
    if (trashBtnRestore) trashBtnRestore.style.display = '';

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
    } else {
      newExpenseForm();
      renderExpenseCategoryGrid();
      setMobileView('editor');
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
