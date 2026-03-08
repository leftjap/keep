// ═══════════════════════════════════════
// routine.js — 데일리 루틴 데이터 + 렌더링
// ═══════════════════════════════════════

const ROUTINE_META = [
  { id:'exercise', name:'운동',    color:'#e87461', bg:'#fdf1ef' },
  { id:'vitamin',  name:'영양제',  color:'#f0a848', bg:'#fef6eb' },
  { id:'english',  name:'영어',    color:'#5a8ec4', bg:'#eff3f9' },
  { id:'japanese', name:'일본어',  color:'#7cb87c', bg:'#f2f8f2' },
  { id:'drawing',  name:'드로잉',  color:'#9a6cb8', bg:'#f5f0f8' },
  { id:'ukulele',  name:'우쿨렐레', color:'#d4789a', bg:'#fbf1f5' },
  { id:'nodrink',  name:'금주',    color:'#6ab0a0', bg:'#f0f7f5' }
];

// ═══ 루틴 체크 데이터 ═══
function getChk()         { return (L(K.checks) || {})[today()] || {}; }
function saveChk(id, v)   { const d = L(K.checks) || {}; if (!d[today()]) d[today()] = {}; d[today()][id] = v; S(K.checks, d); }
function getAllChk()       { return L(K.checks) || {}; }

let _chkT = null;
function toggleChk(id)    { toggleDay(id, today()); renderRoutineRing(); }

function toggleDay(id, dateStr) {
  const d = L(K.checks) || {};
  if (!d[dateStr]) d[dateStr] = {};
  d[dateStr][id] = !d[dateStr][id];
  S(K.checks, d);
  renderChk();
  renderRoutineRing();
  if (document.getElementById('pane-routine') && document.getElementById('pane-routine').style.display !== 'none') {
    renderRoutineCardBody();
    renderStreakCard();
    renderMonthlyCard();
  }
  clearTimeout(_chkT);
  _chkT = setTimeout(() => {
    SYNC.saveChecksToSheet(dateStr, d[dateStr]);
    SYNC.scheduleDatabaseSave();
  }, 1200);
}

function toggleDayCard(id, dateStr) {
  const d = L(K.checks) || {};
  if (!d[dateStr]) d[dateStr] = {};
  d[dateStr][id] = !d[dateStr][id];
  S(K.checks, d);
  renderRoutineCardBody();
  renderStreakCard();
  renderMonthlyCard();
  renderChk();
  renderRoutineRing();
  clearTimeout(_chkT);
  _chkT = setTimeout(() => {
    SYNC.saveChecksToSheet(dateStr, d[dateStr]);
    SYNC.scheduleDatabaseSave();
  }, 1200);
}

// ═══ 루틴 루틴 상세 열기/닫기 ═══
function openRoutineDetail() {
  showRoutineCard();
  setMobileView('list');
}

function showRoutineCard() {
  const pane = document.getElementById('pane-routine');
  if (!pane) return;
  pane.style.display = 'flex';
  pane.style.flexDirection = 'column';
  document.getElementById('pane-list').style.display = 'none';
  document.getElementById('pane-photo').style.display = 'none';
  document.getElementById('pane-calendar').style.display = 'none';
  const vs = document.getElementById('viewSwitcher');
  if (vs) vs.style.display = 'none';
  const fab = document.querySelector('.fab-btn');
  if (fab) fab.style.display = 'none';
  renderStreakCard();
  renderMonthlyCard();

  const weekDates = getWeekDates();
  const weekLabel =
    (new Date(weekDates[0])).getMonth()+1 + '/' + (new Date(weekDates[0])).getDate() +
    ' ~ ' +
    (new Date(weekDates[6])).getMonth()+1 + '/' + (new Date(weekDates[6])).getDate();
  const weekEl = document.getElementById('routineCardWeek');
  if (weekEl) weekEl.textContent = weekLabel;
  renderRoutineCardBody();
}

function hideRoutineCard() {
  const pane = document.getElementById('pane-routine');
  if (pane) pane.style.display = 'none';
  if (currentListView === 'list') document.getElementById('pane-list').style.display = 'flex';
  else if (currentListView === 'photo') document.getElementById('pane-photo').style.display = 'block';
  else if (currentListView === 'calendar') document.getElementById('pane-calendar').style.display = 'block';
  const vs = document.getElementById('viewSwitcher');
  if (vs) vs.style.display = 'flex';
  const fab = document.querySelector('.fab-btn');
  if (fab) fab.style.display = '';
}

// ═══ 블롭 헬퍼 ═══
function _makeBlobParams(W, H, doneCount) {
  const CENTER_MAP = {
    1: { cx: -15, cy: -8 },
    2: { cx: 0, cy: H },
    3: { cx: 0, cy: H / 2 },
    4: { cx: W * 0.15, cy: 0 },
    5: { cx: -10, cy: 0 },
    6: { cx: 0, cy: H * 0.3 }
  };

  function circleRectArea(cx, cy, r) {
    const steps = 200, dy = H / steps; let area = 0;
    for (let i = 0; i < steps; i++) {
      const y = (i + 0.5) * dy, d2 = r * r - (y - cy) * (y - cy);
      if (d2 <= 0) continue;
      const hw = Math.sqrt(d2), x0 = Math.max(0, cx - hw), x1 = Math.min(W, cx + hw);
      if (x1 > x0) area += (x1 - x0) * dy;
    }
    return area;
  }
  function findRadius(cx, cy, targetArea) {
    let lo = 0, hi = W * 3;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (circleRectArea(cx, cy, mid) < targetArea) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  const target = (doneCount === 1) ? (1.7 / 7) * W * H : (doneCount / 7) * W * H;
  const { cx, cy } = CENTER_MAP[doneCount];
  const rr = findRadius(cx, cy, target);
  return { cx, cy, rr };
}

function _buildBlobHtml(r, doneCount, W, H) {
  if (doneCount === 0) return '';
  if (doneCount === 7) {
    return `<div class="chk-blob" style="background:${r.color};width:9999px;height:9999px;left:-4999px;top:${H/2-4999}px;"></div>`;
  }
  const { cx, cy, rr } = _makeBlobParams(W, H, doneCount);
  return `<div class="chk-blob" style="background:${r.color};width:${rr*2}px;height:${rr*2}px;left:${cx-rr}px;top:${cy-rr}px;"></div>`;
}

// ═══ 사이드바 루틴 렌더링 ═══
function renderChk() {
  const chk = getChk(), all = getAllChk(), week = getWeekDates(), td = today();
  const container = document.getElementById('chkTable');
  const mob = window.innerWidth <= 768;
  const W = mob ? Math.max(200, window.innerWidth - 68) : 240;
  const H = mob ? 48 : 52;
  const dayN = ['일','월','화','수','목','금','토'];

  let h = '<div class="chk-week-hdr"><div class="chk-week-hdr-spacer"></div><div class="day-labels">'
    + dayN.map(d => '<span class="day-lbl">' + d + '</span>').join('')
    + '</div></div>';

  ROUTINE_META.forEach(r => {
    const weekDone  = week.map(dt => all[dt] && all[dt][r.id] ? 1 : 0);
    const doneCount = weekDone.filter(d => d).length;
    const pct       = Math.round((doneCount / 7) * 100);
    const blobHtml  = _buildBlobHtml(r, doneCount, W, H);
    const dotHtml   = weekDone.map((done, i) => {
      const dt = week[i], isTd = dt === td;
      return `<div class="chk-dot ${done?'done':''} ${isTd?'today':''}" onclick="event.stopPropagation();toggleDay('${r.id}','${dt}')"></div>`;
    }).join('');

    h += `<div class="chk-row" onclick="toggleChk('${r.id}')">${blobHtml}`
      + (doneCount > 0 ? `<span class="chk-pct">${pct}%</span>` : '')
      + `<div class="chk-left"><span class="chk-lb">${r.name}</span></div>`
      + `<div class="chk-dots">${dotHtml}</div>`
      + '</div>';
  });
  container.innerHTML = h;
}

// ═══ 루틴 상세 카드 본문 렌더링 ═══
function renderRoutineCardBody() {
  const container = document.getElementById('routineCardBody');
  if (!container) return;
  const all = getAllChk(), week = getWeekDates(), td = today();
  const dayN = ['일','월','화','수','목','금','토'];
  const W = Math.max(200, container.offsetWidth - 80);
  const H = 40;

  let h = '<div class="chk-table">';
  h += '<div class="chk-week-hdr"><div class="chk-week-hdr-spacer"></div><div class="day-labels">'
    + dayN.map(d => '<span class="day-lbl">' + d + '</span>').join('')
    + '</div></div>';

  ROUTINE_META.forEach(r => {
    const weekDone  = week.map(dt => all[dt] && all[dt][r.id] ? 1 : 0);
    const doneCount = weekDone.filter(d => d).length;
    const blobHtml  = _buildBlobHtml(r, doneCount, W, H);
    const dotHtml   = weekDone.map((done, i) => {
      const dt = week[i], isTd = dt === td;
      return `<div class="chk-dot ${done?'done':''} ${isTd?'today':''}" onclick="event.stopPropagation();toggleDayCard('${r.id}','${dt}')"></div>`;
    }).join('');

    h += `<div class="chk-row" onclick="toggleDayCard('${r.id}','${td}')">`
      + blobHtml
      + `<div class="chk-left"><span class="chk-lb">${r.name}</span></div>`
      + `<div class="chk-dots">${dotHtml}</div>`
      + '</div>';
  });
  h += '</div>';
  container.innerHTML = h;
}

// ═══ 루틴 링 (미니 원형 진행바) ═══
function renderRoutineRing() {
  const canvas = document.getElementById('routineRing');
  if (!canvas) return;
  const ctx   = canvas.getContext('2d');
  const chk   = getChk();
  let done    = 0;
  ROUTINE_META.forEach(r => { if (chk[r.id]) done++; });
  const total = ROUTINE_META.length;
  const pct   = total > 0 ? done / total : 0;
  const size  = 44, dpr = window.devicePixelRatio || 1;

  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width  = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);

  const cx = size / 2, cy = size / 2, radius = 17, lineW = 3.5;
  const startAngle = -Math.PI / 2;
  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,.1)';
  ctx.lineWidth   = lineW;
  ctx.stroke();

  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + Math.PI * 2 * pct);
    ctx.strokeStyle = '#E55643';
    ctx.lineWidth   = lineW;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  ctx.fillStyle    = 'rgba(255,255,255,.85)';
  ctx.font         = '600 13px Pretendard, -apple-system, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(done + '/' + total, cx, cy);

  const sub = document.getElementById('routineCompactSub');
  if (sub) sub.textContent = done + '/' + total + ' 완료';
}

// ═══ 연속 기록 카드 ═══
function renderStreakCard() {
  const container = document.getElementById('routineStreak');
  if (!container) return;
  const all = getAllChk();
  const d = new Date();

  const streakData = ROUTINE_META.map(r => {
    let current = 0, best = 0;
    for (let i = 0; i < 365; i++) {
      const dt = new Date(d); dt.setDate(d.getDate() - i);
      const key = getLocalYMD(dt);
      if (all[key] && all[key][r.id]) {
        if (i === 0 || current > 0) current++;
      } else {
        if (i === 0) current = 0;
        else break;
      }
    }
    let tempStreak = 0;
    for (let i = 0; i < 365; i++) {
      const dt = new Date(d); dt.setDate(d.getDate() - i);
      const key = getLocalYMD(dt);
      if (all[key] && all[key][r.id]) { tempStreak++; if (tempStreak > best) best = tempStreak; }
      else { tempStreak = 0; }
    }
    return { ...r, current, best, isBroken: current === 0 };
  });

  let heroIdx = -1, heroMax = 0;
  streakData.forEach((s, i) => { if (s.current > heroMax) { heroMax = s.current; heroIdx = i; } });

  let html = '<div class="streak-title">연속 기록</div>';
  if (heroIdx !== -1 && heroMax > 0) {
    const hero = streakData[heroIdx];
    html += `<div class="streak-hero" style="background:${hero.color}12;border:1px solid ${hero.color}30;">
      <div class="streak-hero-days" style="color:${hero.color}">${hero.current}</div>
      <div class="streak-hero-text">
        <span class="streak-hero-name">${hero.name}</span>
        <span class="streak-hero-sub">${hero.current}일 연속 진행 중 · 최장 ${hero.best}일</span>
      </div>
    </div>`;
  }

  html += '<div class="streak-list">';
  streakData.forEach((s, i) => {
    if (i === heroIdx) return;
    html += `<div class="streak-row${s.isBroken ? ' broken' : ''}">
      <span class="streak-days">${s.current > 0 ? s.current : '—'}</span>
      <span class="streak-name">${s.name}</span>
      <span class="streak-info">${s.current > 0 ? '일째 · 최장 ' + s.best : (s.best > 0 ? '최장 ' + s.best + '일' : '')}</span>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ═══ 월간 통계 카드 ═══
function renderMonthlyCard() {
  const container = document.getElementById('routineMonthly');
  if (!container) return;
  const all = getAllChk();
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayDate   = now.getDate();
  const monthName   = (m + 1) + '월';
  const total       = ROUTINE_META.length;

  let totalChecks = 0, perfectDays = 0;
  const dayData = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    let done = 0;
    ROUTINE_META.forEach(r => { if (all[key] && all[key][r.id]) done++; });
    dayData.push({ day, done, isFuture: day > todayDate });
    if (day <= todayDate) { totalChecks += done; if (done === total) perfectDays++; }
  }

  const totalPossible = todayDate * total;
  const overallPct    = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0;
  const avgPerDay     = todayDate > 0 ? (totalChecks / todayDate).toFixed(1) : '0';

  let html = `<div class="monthly-title">${monthName}</div>`;
  html += `<div class="rhythm-summary">
    <div class="rhythm-stat"><span class="rhythm-stat-num">${overallPct}<span class="rhythm-stat-unit">%</span></span><span class="rhythm-stat-label">달성률</span></div>
    <div class="rhythm-stat"><span class="rhythm-stat-num">${perfectDays}<span class="rhythm-stat-unit">일</span></span><span class="rhythm-stat-label">완벽한 날</span></div>
    <div class="rhythm-stat"><span class="rhythm-stat-num">${avgPerDay}<span class="rhythm-stat-unit">/${total}</span></span><span class="rhythm-stat-label">일 평균</span></div>
  </div>`;

  html += '<div class="rhythm-chart">';
  dayData.forEach(dd => {
    const heightPct = total > 0 ? (dd.done / total) * 100 : 0;
    let cls = 'rhythm-bar';
    if (dd.isFuture) cls += ' future';
    else if (dd.done === 0) cls += ' zero';
    else if (dd.done === total) cls += ' perfect';
    if (dd.day === todayDate) cls += ' today';
    const barStyle    = (!dd.isFuture && dd.done > 0) ? `height:${Math.max(heightPct, 8)}%` : '';
    const showLabel   = (dd.day === 1 || dd.day % 5 === 0 || dd.day === daysInMonth);
    html += `<div class="${cls}" title="${m+1}/${dd.day}: ${dd.done}/${total}">
      <div class="rhythm-bar-fill" style="${barStyle}"></div>
      ${showLabel ? '<span class="rhythm-bar-label">' + dd.day + '</span>' : ''}
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ═══ 루틴 개별 상세 통계 ═══

function getRoutineStreak(routineId) {
  var all = getAllChk();
  var d = new Date();
  var current = 0, best = 0, tempStreak = 0;

  // 현재 연속
  for (var i = 0; i < 365; i++) {
    var dt = new Date(d); dt.setDate(d.getDate() - i);
    var key = getLocalYMD(dt);
    if (all[key] && all[key][routineId]) {
      current++;
    } else {
      if (i === 0) current = 0;
      break;
    }
  }

  // 최장 연속
  for (var j = 0; j < 365; j++) {
    var dt2 = new Date(d); dt2.setDate(d.getDate() - j);
    var key2 = getLocalYMD(dt2);
    if (all[key2] && all[key2][routineId]) {
      tempStreak++;
      if (tempStreak > best) best = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  return { current: current, best: best };
}

function getRoutineMonthlyHeatmap(routineId, year, month) {
  var all = getAllChk();
  var daysInMonth = new Date(year, month, 0).getDate();
  var result = [];

  for (var day = 1; day <= daysInMonth; day++) {
    var key = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var done = !!(all[key] && all[key][routineId]);
    var dateObj = new Date(year, month - 1, day);
    result.push({
      day: day,
      date: key,
      done: done,
      dow: dateObj.getDay(),
      isFuture: dateObj > new Date()
    });
  }
  return result;
}

function getRoutineWeeklyTrend(routineId, numWeeks) {
  var all = getAllChk();
  var now = new Date();
  var result = [];

  for (var w = numWeeks - 1; w >= 0; w--) {
    var weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (w * 7));
    var weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    var done = 0, total = 7;
    for (var i = 0; i < 7; i++) {
      var dt = new Date(weekStart);
      dt.setDate(weekStart.getDate() + i);
      if (dt > now) { total = i; break; }
      var key = getLocalYMD(dt);
      if (all[key] && all[key][routineId]) done++;
    }

    var pct = total > 0 ? Math.round((done / total) * 100) : 0;
    var label = (weekStart.getMonth() + 1) + '/' + weekStart.getDate();
    result.push({ label: label, done: done, total: total, pct: pct });
  }
  return result;
}

function getRoutineStats(routineId) {
  var all = getAllChk();
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth();

  // 이번 달 달성률
  var todayDate = now.getDate();
  var monthDone = 0;
  for (var d = 1; d <= todayDate; d++) {
    var key = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    if (all[key] && all[key][routineId]) monthDone++;
  }
  var monthPct = todayDate > 0 ? Math.round((monthDone / todayDate) * 100) : 0;

  // 전체 기간 달성률 (최근 90일)
  var totalDone = 0, totalDays = 0;
  for (var i = 0; i < 90; i++) {
    var dt = new Date(now); dt.setDate(now.getDate() - i);
    var key2 = getLocalYMD(dt);
    totalDays++;
    if (all[key2] && all[key2][routineId]) totalDone++;
  }
  var totalPct = totalDays > 0 ? Math.round((totalDone / totalDays) * 100) : 0;

  // 요일별 달성률
  var dowDone = [0, 0, 0, 0, 0, 0, 0];
  var dowTotal = [0, 0, 0, 0, 0, 0, 0];
  for (var j = 0; j < 90; j++) {
    var dt2 = new Date(now); dt2.setDate(now.getDate() - j);
    var dow = dt2.getDay();
    var key3 = getLocalYMD(dt2);
    dowTotal[dow]++;
    if (all[key3] && all[key3][routineId]) dowDone[dow]++;
  }

  var dowNames = ['일', '월', '화', '수', '목', '금', '토'];
  var bestDow = 0, worstDow = 0, bestPct = -1, worstPct = 101;
  for (var k = 0; k < 7; k++) {
    var p = dowTotal[k] > 0 ? (dowDone[k] / dowTotal[k]) * 100 : 0;
    if (p > bestPct) { bestPct = p; bestDow = k; }
    if (p < worstPct) { worstPct = p; worstDow = k; }
  }

  return {
    monthDone: monthDone,
    monthTotal: todayDate,
    monthPct: monthPct,
    totalDone: totalDone,
    totalDays: totalDays,
    totalPct: totalPct,
    bestDow: dowNames[bestDow],
    bestDowPct: Math.round(bestPct),
    worstDow: dowNames[worstDow],
    worstDowPct: Math.round(worstPct),
    dowData: dowNames.map(function(name, idx) {
      return { name: name, pct: dowTotal[idx] > 0 ? Math.round((dowDone[idx] / dowTotal[idx]) * 100) : 0 };
    })
  };
}

// ═══ 루틴 상세 분석 UI 렌더링 ═══

function renderRoutineDetail(routineId) {
  var routines = getRoutines();
  var routine = routines.find(function(r) { return r.id === routineId; });
  if (!routine) return;

  var stats = getRoutineStats(routineId);
  var streak = getRoutineStreak(routineId);
  var now = new Date();
  var heatmap = getRoutineMonthlyHeatmap(routineId, now.getFullYear(), now.getMonth() + 1);
  var weeklyTrend = getRoutineWeeklyTrend(routineId, 8);

  var html = '<div class="routine-detail-wrapper">';

  // 제목 + 뒤로가기
  html += '<div class="routine-detail-header">';
  html += '<button class="routine-detail-back" onclick="renderRoutineOverview()">← 목록</button>';
  html += '<h2 class="routine-detail-title">' + routine.name + '</h2>';
  html += '</div>';

  // 주요 통계
  html += '<div class="routine-detail-stats">';
  html += '<div class="stat-card"><div class="stat-label">이번 달</div><div class="stat-value">' + stats.monthPct + '%</div></div>';
  html += '<div class="stat-card"><div class="stat-label">90일</div><div class="stat-value">' + stats.totalPct + '%</div></div>';
  html += '<div class="stat-card"><div class="stat-label">현재</div><div class="stat-value">' + streak.current + '일</div></div>';
  html += '<div class="stat-card"><div class="stat-label">최고</div><div class="stat-value">' + streak.best + '일</div></div>';
  html += '</div>';

  // 최고/최악 요일
  html += '<div class="routine-detail-dow">';
  html += '<div class="dow-card best"><div class="dow-label">최고 요일</div><div class="dow-name">' + stats.bestDow + '</div><div class="dow-pct">' + stats.bestDowPct + '%</div></div>';
  html += '<div class="dow-card worst"><div class="dow-label">최악 요일</div><div class="dow-name">' + stats.worstDow + '</div><div class="dow-pct">' + stats.worstDowPct + '%</div></div>';
  html += '</div>';

  // 요일별 차트
  html += '<div class="routine-detail-chart">';
  html += '<h3 class="chart-title">요일별 달성률</h3>';
  html += '<div class="dow-chart">';
  stats.dowData.forEach(function(d) {
    html += '<div class="dow-bar-wrapper"><div class="dow-bar-label">' + d.name + '</div><div class="dow-bar-container"><div class="dow-bar" style="height:' + d.pct + '%"></div></div><div class="dow-bar-value">' + d.pct + '%</div></div>';
  });
  html += '</div>';
  html += '</div>';

  // 주간 추이
  html += '<div class="routine-detail-trend">';
  html += '<h3 class="chart-title">8주 추이</h3>';
  html += '<div class="weekly-trend">';
  weeklyTrend.forEach(function(w) {
    html += '<div class="week-item"><div class="week-label">' + w.label + '</div><div class="week-pct">' + w.pct + '%</div><div class="week-bar" style="height:' + w.pct + '%"></div></div>';
  });
  html += '</div>';
  html += '</div>';

  html += '</div>';

  var container = document.querySelector('.routine-detail-content');
  if (container) container.innerHTML = html;
}

function renderRoutineOverview() {
  var routines = getRoutines();
  if (!routines || routines.length === 0) return;

  var html = '<div class="routine-overview-wrapper">';
  html += '<h2 class="routine-overview-title">데일리 루틴</h2>';
  html += '<div class="routine-list">';

  routines.forEach(function(routine) {
    var stats = getRoutineStats(routine.id);
    var streak = getRoutineStreak(routine.id);
    html += '<div class="routine-item" onclick="renderRoutineDetail(\'' + routine.id + '\')">';
    html += '<div class="routine-item-name">' + routine.name + '</div>';
    html += '<div class="routine-item-stats">';
    html += '<span class="routine-item-stat">이번 달 ' + stats.monthPct + '%</span>';
    html += '<span class="routine-item-stat">연속 ' + streak.current + '일</span>';
    html += '</div>';
    html += '</div>';
  });

  html += '</div>';
  html += '</div>';

  var container = document.querySelector('.routine-detail-content');
  if (container) container.innerHTML = html;
}
