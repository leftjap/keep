// ═══ routine-cal.js — 루틴 캘린더 뷰 (3단 에디터) ═══
var _routineViewYM = null;
var _selectedRoutineDate = null;

function renderRoutineMonthNav(yearMonth) {
  var parts = yearMonth.split('-');
  var mo = parseInt(parts[1]);
  var nowYM = today().slice(0, 7);
  var isNow = (yearMonth === nowYM);

  var navHtml = '<div class="exp-month-nav-inline" id="routineMonthNavInline">'
    + '<button class="exp-month-nav-btn" onclick="changeRoutineMonth(-1)">'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '<span class="exp-month-nav-label" onclick="openRoutineMonthPicker()" style="cursor:pointer;">' + mo + '월</span>'
    + '<button class="exp-month-nav-btn' + (isNow ? ' exp-nav-disabled' : '') + '"'
    + (isNow ? '' : ' onclick="changeRoutineMonth(1)"') + '>'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '</div>';

  document.querySelectorAll('#routineMonthNavInline').forEach(function(el) { el.remove(); });

  var w = window.innerWidth;
  if (w <= 768) {
    return false;
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
  var mb = document.querySelector('.ed-more-btn');
  var ab = document.querySelector('.ed-aa-btn');
  var nb = document.querySelector('.ed-new-btn');
  if (mb) mb.style.display = 'none';
  if (ab) ab.style.display = 'none';
  if (nb) nb.style.display = 'none';
  var tl = document.getElementById('edTabLabel');
  if (tl) tl.style.display = 'none';
  panel.style.display = 'flex';
  _routineViewYM = today().slice(0, 7);
  _selectedRoutineDate = today();
  renderRoutineCalView(_routineViewYM);
  if (window.innerWidth <= 768) setMobileView('editor');
  var app = document.getElementById('mainApp');
  var w = window.innerWidth;
  if (w >= 769 && w <= 1400) {
    app.classList.remove('tablet-side-open');
    if (!keepListPanel) {
      app.classList.add('tablet-list-closed');
    }
  }
}

function hideRoutineCalView() {
  var panel = document.getElementById('editorRoutineDetail');
  if (panel) panel.style.display = 'none';
  removeRoutineMonthNav();
  _routineViewYM = null;
  _selectedRoutineDate = null;
  var mb = document.querySelector('.ed-more-btn');
  var ab = document.querySelector('.ed-aa-btn');
  var nb = document.querySelector('.ed-new-btn');
  if (mb) mb.style.display = '';
  if (ab) ab.style.display = '';
  if (nb) nb.style.display = '';
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
  if (delta > 0 && _routineViewYM >= nowYM) return;
  var d = new Date(_routineViewYM + '-01');
  d.setMonth(d.getMonth() + delta);
  _routineViewYM = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  if (_routineViewYM === nowYM) {
    _selectedRoutineDate = today();
  } else {
    var dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    _selectedRoutineDate = _routineViewYM + '-' + String(dim).padStart(2, '0');
  }
  renderRoutineCalView(_routineViewYM);
}

function selectRoutineDate(dateStr) {
  _selectedRoutineDate = dateStr;
  renderRoutineCalView(_routineViewYM);
}

function openRoutineMonthPicker() {
  var old = document.getElementById('routineMonthPickerOverlay');
  if (old) old.remove();
  var currentYM = _routineViewYM || today().slice(0, 7);
  var now = new Date();
  var months = [];
  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    months.push({ ym: ym, label: d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월', sel: ym === currentYM });
  }
  var list = months.map(function(m) {
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
  _routineViewYM = ym;
  closeRoutineMonthPicker();
  var nowYM = today().slice(0, 7);
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

  h += buildRCChart(dim, checkDays, thisCum, prevCum, pDim, mo, prevMo);

  h += '<div class="rc-gap"></div>';
  var fdow = new Date(y, mo - 1, 1).getDay();
  h += '<div class="rc-cal"><div class="rc-cal-grid">';
  h += '<div class="rc-dow">일</div><div class="rc-dow">월</div><div class="rc-dow">화</div><div class="rc-dow">수</div><div class="rc-dow">목</div><div class="rc-dow">금</div><div class="rc-dow">토</div>';
  for (var e = 0; e < fdow; e++) h += '<div class="rc-day empty"></div>';
  dayData.forEach(function(dd) {
    var cls = 'rc-day';
    if (dd.isFuture) cls += ' future';
    if (dd.isToday) cls += ' today';
    if (_selectedRoutineDate === dd.date) cls += ' sel';
    if (!dd.isFuture && dd.pct === 100) cls += ' p100';
    var oc = dd.isFuture ? '' : ' onclick="selectRoutineDate(\'' + dd.date + '\')"';
    h += '<div class="' + cls + '"' + oc + '><div class="rc-day-n">' + dd.day + '</div>';
    if (!dd.isFuture && dd.pct > 0) h += '<div class="rc-day-p">' + dd.pct + '%</div>';
    h += '</div>';
  });
  h += '</div></div>';

  if (_selectedRoutineDate && _selectedRoutineDate.startsWith(yearMonth)) {
    var dc = all[_selectedRoutineDate] || {};
    var dO = new Date(_selectedRoutineDate + 'T00:00:00');
    var dn = ['일','월','화','수','목','금','토'][dO.getDay()];
    var doneN = 0;
    ROUTINE_META.forEach(function(r) { if (dc[r.id]) doneN++; });
    h += '<div class="rc-report">';
    h += '<div class="rc-report-hdr"><span>' + (dO.getMonth() + 1) + '월 ' + dO.getDate() + '일 ' + dn + '요일</span><span class="rc-report-cnt">' + doneN + '/' + ROUTINE_META.length + '</span></div>';
    h += '<div class="rc-report-list">';
    ROUTINE_META.forEach(function(r) {
      var d = !!dc[r.id];
      h += '<div class="rc-report-row' + (d ? ' done' : '') + '"><div class="rc-report-dot" style="background:' + (d ? r.color : 'var(--border-l)') + '"></div><span class="rc-report-name">' + r.name + '</span><span class="rc-report-chk">' + (d ? '✓' : '') + '</span></div>';
    });
    h += '</div></div>';
  }

  h += '</div>';
  panel.querySelector('.editor-scroll-area').innerHTML = h;
}

function buildRCChart(dim, lastDay, thisCum, prevCum, pDim, mNum, pNum) {
  var allV = thisCum.concat(prevCum).concat([1]);
  var maxY = Math.max.apply(null, allV);
  var W = 260;
  var H = 170;
  var P = 20;
  var gw = W - P * 2;
  var gh = H - P * 2 - 18;
  var bot = P + gh;
  var tp = '';
  var pp = '';
  var tf = P + ',' + bot + ' ';
  var pf = P + ',' + bot + ' ';
  var dx = 0;
  var dy = 0;
  for (var i = 0; i < dim; i++) {
    var x = P + i / Math.max(dim - 1, 1) * gw;
    var ty = P + gh - (thisCum[i] / maxY) * gh;
    if (i < lastDay) {
      tp += x + ',' + ty + ' ';
      tf += x + ',' + ty + ' ';
      dx = x;
      dy = ty;
    }
  }
  for (var j = 0; j < pDim; j++) {
    var px = P + j / Math.max(pDim - 1, 1) * gw;
    var py = P + gh - (prevCum[j] / maxY) * gh;
    pp += px + ',' + py + ' ';
    pf += px + ',' + py + ' ';
  }
  tf += (P + (lastDay - 1) / Math.max(dim - 1, 1) * gw) + ',' + bot;
  pf += (P + gw) + ',' + bot;
  var lY = bot + 16;
  var s = '<div class="rc-chart">';
  s += '<svg class="rc-chart-svg" viewBox="0 0 ' + W + ' ' + H + '">';
  s += '<defs>';
  s += '<linearGradient id="rcG1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E55643" stop-opacity=".25"/><stop offset="100%" stop-color="#E55643" stop-opacity=".02"/></linearGradient>';
  s += '<linearGradient id="rcG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B0B0B0" stop-opacity=".35"/><stop offset="100%" stop-color="#B0B0B0" stop-opacity=".05"/></linearGradient>';
  s += '</defs>';
  s += '<polygon points="' + pf + '" fill="url(#rcG2)"/>';
  s += '<polyline points="' + pp + '" fill="none" stroke="#D0D0D0" stroke-width="1.5"/>';
  s += '<polygon points="' + tf + '" fill="url(#rcG1)"/>';
  s += '<polyline points="' + tp + '" fill="none" stroke="#E55643" stroke-width="2"/>';
  s += '<circle cx="' + dx + '" cy="' + dy + '" r="7" fill="#E55643" opacity=".2"/>';
  s += '<circle cx="' + dx + '" cy="' + dy + '" r="4" fill="#E55643"/>';
  s += '<text x="' + P + '" y="' + lY + '" font-size="10" fill="#aaa" text-anchor="start">' + mNum + '.1</text>';
  s += '<text x="' + (P + gw) + '" y="' + lY + '" font-size="10" fill="#aaa" text-anchor="end">' + mNum + '.' + dim + '</text>';
  s += '</svg>';
  s += '<div class="rc-chart-leg">';
  s += '<span><span class="rc-leg-dot" style="background:#E55643"></span>' + mNum + '월</span>';
  s += '<span><span class="rc-leg-dot" style="background:#D0D0D0"></span>' + pNum + '월</span>';
  s += '</div></div>';
  return s;
}
