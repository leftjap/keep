// ═══ routine-cal.js — 루틴 캘린더 뷰 (3단 에디터) ═══
var _routineViewYM = null;
var _selectedRoutineDate = null;

function renderRoutineMonthNav(yearMonth) {
  var parts = yearMonth.split('-');
  var mo = parseInt(parts[1]);
  var nowYM = today().slice(0, 7);

  // 이전 월 데이터 유무 확인
  var prevD = new Date(yearMonth + '-01');
  prevD.setMonth(prevD.getMonth() - 1);
  var prevYM = prevD.getFullYear() + '-' + String(prevD.getMonth() + 1).padStart(2, '0');
  var prevDisabled = !hasRoutineDataInMonth(prevYM) && prevYM !== nowYM;

  // 다음 월 데이터 유무 확인
  var nextD = new Date(yearMonth + '-01');
  nextD.setMonth(nextD.getMonth() + 1);
  var nextYM = nextD.getFullYear() + '-' + String(nextD.getMonth() + 1).padStart(2, '0');
  var nextDisabled = (nextYM > nowYM) || (!hasRoutineDataInMonth(nextYM) && nextYM !== nowYM);

  var navHtml = '<div class="exp-month-nav-inline" id="routineMonthNavInline">'
    + '<button class="exp-month-nav-btn' + (prevDisabled ? ' exp-nav-disabled' : '') + '"'
    + (prevDisabled ? '' : ' onclick="changeRoutineMonth(-1)"') + '>'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '<span class="exp-month-nav-label" onclick="openRoutineMonthPicker()" style="cursor:pointer;">' + mo + '월</span>'
    + '<button class="exp-month-nav-btn' + (nextDisabled ? ' exp-nav-disabled' : '') + '"'
    + (nextDisabled ? '' : ' onclick="changeRoutineMonth(1)"') + '>'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '</div>';

  document.querySelectorAll('#routineMonthNavInline').forEach(function(el) { el.remove(); });

  var w = window.innerWidth;
  if (w <= 768) {
    var tabLabel0 = document.getElementById('edTabLabel');
    if (tabLabel0) tabLabel0.style.display = 'none';
    var topbar0 = document.querySelector('.ed-topbar');
    if (topbar0) {
      var leftEl0 = topbar0.querySelector('.ed-topbar-left');
      if (leftEl0) leftEl0.insertAdjacentHTML('afterend', navHtml);
    }
    return true;
  } else if (w <= 1400) {
    var tabLabel = document.getElementById('edTabLabel');
    if (tabLabel) tabLabel.style.display = 'none';
    var topbar = document.querySelector('.ed-topbar');
    if (topbar) {
      var leftEl = topbar.querySelector('.ed-topbar-left');
      if (leftEl) leftEl.insertAdjacentHTML('afterend', navHtml);
    }
    return true;
  } else {
    var tabLabel2 = document.getElementById('edTabLabel');
    if (tabLabel2) tabLabel2.style.display = 'none';
    var topbar2 = document.querySelector('.ed-topbar');
    if (topbar2) {
      var leftEl2 = topbar2.querySelector('.ed-topbar-left');
      if (leftEl2) leftEl2.insertAdjacentHTML('afterend', navHtml);
    }
    return true;
  }
}

function removeRoutineMonthNav() {
  document.querySelectorAll('#routineMonthNavInline').forEach(function(el) { el.remove(); });
  var tabLabel = document.getElementById('edTabLabel');
  if (tabLabel) tabLabel.style.display = '';
}

function showRoutineCalendarView(keepListPanel) {
  var panel = document.getElementById('editorRoutineDetail');
  if (!panel) return;
  document.getElementById('editorText').style.display = 'none';
  document.getElementById('editorBook').style.display = 'none';
  document.getElementById('editorQuote').style.display = 'none';
  document.getElementById('editorMemo').style.display = 'none';
  document.getElementById('editorExpense').style.display = 'none';
  var dl = document.getElementById('editorDayList');
  if (dl) dl.style.display = 'none';
  var rc2 = document.getElementById('editorRoutineCal');
  if (rc2) rc2.style.display = 'none';
  document.getElementById('edToolbar').style.display = 'none';
  // 가계부 관련 요소 정리
  var fullDb = document.getElementById('expenseFullDashboard');
  if (fullDb) fullDb.style.display = 'none';
  var paneExpDash = document.getElementById('pane-expense-dashboard');
  if (paneExpDash) paneExpDash.style.display = 'none';
  var paneExpDetail = document.getElementById('pane-expense-detail');
  if (paneExpDetail) paneExpDetail.style.display = 'none';
  // 가계부 월 네비 제거
  document.querySelectorAll('.exp-month-nav-inline').forEach(function(el) { el.remove(); });
  var mb = document.querySelector('.ed-more-btn');
  var ab = document.querySelector('.ed-aa-btn');
  var nb = document.querySelector('.ed-new-btn');
  if (mb) mb.style.setProperty('display', 'none', 'important');
  if (ab) ab.style.setProperty('display', 'none', 'important');
  if (nb) nb.style.setProperty('display', 'none', 'important');
  var tl = document.getElementById('edTabLabel');
  if (tl) tl.style.display = 'none';
  document.querySelector('.editor').classList.add('routine-cal-active');
  panel.style.display = 'flex';
  document.querySelector('.editor').classList.add('routine-view-active');
  _routineViewYM = today().slice(0, 7);
  _selectedRoutineDate = today();
  renderRoutineCalView(_routineViewYM);
  if (window.innerWidth <= 768) setMobileView('editor');
  var app = document.getElementById('mainApp');
  var w = window.innerWidth;
  // 가계부에서 전환 시 list-panel 복원
  var appEl = document.getElementById('mainApp');
  if (w > 1400) {
    appEl.classList.remove('list-closed');
  } else if (w >= 769 && w <= 1400) {
    appEl.classList.remove('tablet-list-closed');
  }
  if (w >= 769 && w <= 1400) {
    app.classList.remove('tablet-side-open');
    if (!keepListPanel) {
      app.classList.add('tablet-list-closed');
    }
  }
}

function hideRoutineCalView() {
  var panel = document.getElementById('editorRoutineDetail');
  document.querySelector('.editor').classList.remove('routine-cal-active');
  if (panel) panel.style.display = 'none';
  removeRoutineMonthNav();
  _routineViewYM = null;
  _selectedRoutineDate = null;
  var mb = document.querySelector('.ed-more-btn');
  var ab = document.querySelector('.ed-aa-btn');
  var nb = document.querySelector('.ed-new-btn');
  if (mb) mb.style.removeProperty('display');
  if (ab) ab.style.removeProperty('display');
  if (nb) nb.style.removeProperty('display');
  document.querySelector('.editor').classList.remove('routine-view-active');
  var tl = document.getElementById('edTabLabel');
  if (tl) tl.style.display = '';
  if (textTypes.includes(activeTab)) {
    document.getElementById('editorText').style.display = 'flex';
    document.getElementById('edToolbar').style.display = 'flex';
  } else if (activeTab === 'book') {
    document.getElementById('editorBook').style.display = 'flex';
  } else if (activeTab === 'quote') {
    document.getElementById('editorQuote').style.display = 'flex';
  } else if (activeTab === 'memo') {
    document.getElementById('editorMemo').style.display = 'flex';
    document.getElementById('edToolbar').style.display = 'flex';
  }
  var app = document.getElementById('mainApp');
  if (window.innerWidth >= 769 && window.innerWidth <= 1400) {
    app.classList.remove('tablet-list-closed');
  }
}

function changeRoutineMonth(delta) {
  if (!_routineViewYM) _routineViewYM = today().slice(0, 7);
  var nowYM = today().slice(0, 7);

  // 이동하려는 월 계산
  var d = new Date(_routineViewYM + '-01');
  d.setMonth(d.getMonth() + delta);
  var targetYM = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

  // 미래 월(현재 월 이후)로는 이동 불가
  if (targetYM > nowYM) return;

  // 데이터 없는 월(현재 월 제외)로는 이동 불가
  if (!hasRoutineDataInMonth(targetYM) && targetYM !== nowYM) return;

  _routineViewYM = targetYM;
  if (_routineViewYM === nowYM) {
    _selectedRoutineDate = today();
  } else {
    var dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    _selectedRoutineDate = _routineViewYM + '-' + String(dim).padStart(2, '0');
  }
  renderRoutineCalView(_routineViewYM);
}

function renderRoutineDayReport(dateStr) {
  if (!dateStr) return '';
  var all = getAllChk();
  var dc = all[dateStr] || {};
  var dO = new Date(dateStr + 'T00:00:00');
  var dn = ['일','월','화','수','목','금','토'][dO.getDay()];
  var doneN = 0;
  ROUTINE_META.forEach(function(r) { if (dc[r.id]) doneN++; });
  var h = '<div class="rc-report">';
  h += '<div class="rc-report-hdr"><span>' + (dO.getMonth() + 1) + '월 ' + dO.getDate() + '일 ' + dn + '요일</span><span class="rc-report-cnt">' + doneN + '/' + ROUTINE_META.length + '</span></div>';
  h += '<div class="rc-report-list">';
  ROUTINE_META.forEach(function(r) {
    var d = !!dc[r.id];
    h += '<div class="rc-report-row' + (d ? ' done' : '') + '"><div class="rc-report-dot" style="background:' + (d ? r.color : 'var(--border-l)') + '"></div><span class="rc-report-name">' + r.name + '</span><span class="rc-report-chk">' + (d ? '✓' : '') + '</span></div>';
  });
  h += '</div></div>';
  return h;
}

function selectRoutineDate(dateStr) {
  var prev = _selectedRoutineDate;
  _selectedRoutineDate = dateStr;

  // 이전 선택 셀에서 sel 제거
  if (prev) {
    var prevEl = document.querySelector('.rc-day[data-date="' + prev + '"]');
    if (prevEl) prevEl.classList.remove('sel');
  }

  // 새 선택 셀에 sel 추가
  var newEl = document.querySelector('.rc-day[data-date="' + dateStr + '"]');
  if (newEl) newEl.classList.add('sel');

  // 슬롯 갱신
  var slot = document.getElementById('rcDaySlot');
  if (slot) slot.innerHTML = renderRoutineDayReport(dateStr);
}

function openRoutineMonthPicker() {
  var old = document.getElementById('routineMonthPickerOverlay');
  if (old) old.remove();
  var currentYM = _routineViewYM || today().slice(0, 7);
  var nowYM = today().slice(0, 7);
  var now = new Date();
  var months = [];
  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var hasData = hasRoutineDataInMonth(ym) || ym === nowYM;
    months.push({ ym: ym, label: d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월', sel: ym === currentYM, hasData: hasData });
  }
  var list = months.map(function(m) {
    if (!m.hasData) {
      return '<div class="exp-mp-item" style="color:var(--tx-hint);cursor:default;opacity:0.4;">'
        + '<span>' + m.label + '</span>'
        + '</div>';
    }
    return '<div class="exp-mp-item' + (m.sel ? ' exp-mp-selected' : '') + '" onclick="pickRoutineMonth(\'' + m.ym + '\')">'
      + '<span>' + m.label + '</span>'
      + (m.sel ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10L8 14L16 6" stroke="#E55643" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>';
  }).join('');
  var ov = document.createElement('div');
  ov.id = 'routineMonthPickerOverlay';
  ov.className = 'exp-mp-overlay';
  ov.innerHTML = '<div class="exp-mp-sheet"><div class="exp-mp-header"><span class="exp-mp-title">월 선택</span>'
    + '<button class="exp-mp-close" onclick="closeRoutineMonthPicker()"><svg width="16" height="16" viewBox="0 0 16 16"><line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>'
    + '</div><div class="exp-mp-list">' + list + '</div></div>';
  ov.addEventListener('click', function(e) { if (e.target === ov) closeRoutineMonthPicker(); });
  document.body.appendChild(ov);
  requestAnimationFrame(function() { ov.classList.add('open'); });
}

function closeRoutineMonthPicker() {
  var ov = document.getElementById('routineMonthPickerOverlay');
  if (!ov) return;
  ov.classList.remove('open');
  setTimeout(function() { if (ov.parentNode) ov.remove(); }, 300);
}

function pickRoutineMonth(ym) {
  var nowYM = today().slice(0, 7);
  // 데이터 없는 월(현재 월 제외)은 선택 불가
  if (!hasRoutineDataInMonth(ym) && ym !== nowYM) {
    closeRoutineMonthPicker();
    return;
  }

  _routineViewYM = ym;
  closeRoutineMonthPicker();
  if (ym === nowYM) {
    _selectedRoutineDate = today();
  } else {
    var d = new Date(ym + '-01');
    var dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    _selectedRoutineDate = ym + '-' + String(dim).padStart(2, '0');
  }
  renderRoutineCalView(ym);
}

function renderRoutineCalView(yearMonth) {
  var panel = document.getElementById('editorRoutineDetail');
  if (!panel) return;
  var parts = yearMonth.split('-');
  var y = parseInt(parts[0]);
  var mo = parseInt(parts[1]);
  var nowYM = today().slice(0, 7);
  var isNow = (yearMonth === nowYM);
  var all = getAllChk();
  var dim = new Date(y, mo, 0).getDate();
  var now = new Date();
  var todayStr = today();
  var todayDate = now.getDate();
  var checkDays = isNow ? todayDate : dim;

  var dayData = [];
  var totalChecks = 0;
  var perfectDays = 0;
  for (var day = 1; day <= dim; day++) {
    var key = yearMonth + '-' + String(day).padStart(2, '0');
    var done = 0;
    ROUTINE_META.forEach(function(r) { if (all[key] && all[key][r.id]) done++; });
    var total = ROUTINE_META.length;
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;
    var dObj = new Date(y, mo - 1, day);
    dayData.push({ day: day, date: key, done: done, total: total, pct: pct, isFuture: dObj > now, isToday: key === todayStr });
    if (day <= checkDays) { totalChecks += done; if (done === total) perfectDays++; }
  }

  var thisCum = [];
  var s1 = 0;
  for (var i = 0; i < dim; i++) { s1 += dayData[i].done; thisCum.push(s1); }

  var pD = new Date(y, mo - 2, 1);
  var pYM = pD.getFullYear() + '-' + String(pD.getMonth() + 1).padStart(2, '0');
  var pDim = new Date(pD.getFullYear(), pD.getMonth() + 1, 0).getDate();
  var prevCum = [];
  var s2 = 0;
  for (var j = 1; j <= pDim; j++) {
    var pk = pYM + '-' + String(j).padStart(2, '0');
    ROUTINE_META.forEach(function(r) { if (all[pk] && all[pk][r.id]) s2++; });
    prevCum.push(s2);
  }

  var thisAtPoint = thisCum[checkDays - 1] || 0;
  var prevCompare = Math.min(checkDays, pDim);
  var prevAtPoint = prevCum[prevCompare - 1] || 0;
  var diff = thisAtPoint - prevAtPoint;
  var prevMo = pD.getMonth() + 1;

  var topbarNav = renderRoutineMonthNav(yearMonth);

  var h = '<div class="rc-view">';

  if (!topbarNav) {
    h += '<div class="rc-month-nav">';
    h += '<button class="rc-nav-btn" onclick="changeRoutineMonth(-1)"><svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg></button>';
    h += '<span class="rc-nav-label" onclick="openRoutineMonthPicker()">' + mo + '월</span>';
    h += '<button class="rc-nav-btn' + (isNow ? ' rc-nav-off' : '') + '"' + (isNow ? '' : ' onclick="changeRoutineMonth(1)"') + '><svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg></button>';
    h += '</div>';
  }

  var avgPct = (checkDays * ROUTINE_META.length) > 0 ? Math.round((thisAtPoint / (checkDays * ROUTINE_META.length)) * 100) : 0;
  h += '<div class="rc-summary">';
  if (isNow) {
    h += '<div class="rc-summary-title">루틴 달성률 ' + avgPct + '%를 유지하고 있어요</div>';
  } else {
    h += '<div class="rc-summary-title">' + mo + '월 루틴 달성률은 ' + avgPct + '%였어요</div>';
  }
  if (diff > 0) {
    h += '<div class="rc-summary-sub">' + prevMo + '월보다 <span class="rc-up">' + diff + '회 더</span> 체크' + (isNow ? '했' : '하') + '어요</div>';
  } else if (diff < 0) {
    h += '<div class="rc-summary-sub">' + prevMo + '월보다 <span class="rc-down">' + Math.abs(diff) + '회 덜</span> 체크' + (isNow ? '했' : '하') + '어요</div>';
  } else if (prevAtPoint > 0) {
    h += '<div class="rc-summary-sub">' + prevMo + '월과 동일한 페이스' + (isNow ? '예' : '였') + '어요</div>';
  }
  h += '</div>';

  var fdow = new Date(y, mo - 1, 1).getDay();
  h += '<div class="rc-cal"><div class="rc-cal-grid">';
  h += '<div class="rc-dow-row">';
  h += '<div class="rc-dow">일</div><div class="rc-dow">월</div><div class="rc-dow">화</div><div class="rc-dow">수</div><div class="rc-dow">목</div><div class="rc-dow">금</div><div class="rc-dow">토</div>';
  h += '</div>';
  for (var e = 0; e < fdow; e++) h += '<div class="rc-day empty"></div>';
  dayData.forEach(function(dd) {
    var cls = 'rc-day';
    if (dd.isFuture) cls += ' future';
    if (dd.isToday) cls += ' today';
    if (_selectedRoutineDate === dd.date) cls += ' sel';
    if (!dd.isFuture && dd.pct === 100) cls += ' p100';
    var oc = dd.isFuture ? '' : ' onclick="selectRoutineDate(\'' + dd.date + '\')"';
    h += '<div class="' + cls + '" data-date="' + dd.date + '"' + oc + '><div class="rc-day-n">' + dd.day + '</div>';
    if (!dd.isFuture && dd.pct > 0) h += '<div class="rc-day-p">' + dd.pct + '%</div>';
    h += '</div>';
  });
  h += '</div></div>';

  h += '<div id="rcDaySlot">';
  h += renderRoutineDayReport(_selectedRoutineDate);
  h += '</div>';

  h += '</div>';
  panel.querySelector('.editor-scroll-area').innerHTML = h;

  // 루틴 캘린더 뷰에서 글쓰기 버튼 숨기기 (렌더링 후 확실히 숨김)
  var nb = document.querySelector('.ed-new-btn');
  if (nb) nb.style.setProperty('display', 'none', 'important');
}
