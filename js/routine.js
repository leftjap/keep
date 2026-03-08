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
  if (window.innerWidth > 768 && typeof showRoutineCalendarView === 'function') {
    showRoutineCalendarView(true);
  } else {
    setMobileView('list');
  }
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
// 사전 계산된 룩업 테이블 (W=240/H=52 기준, cx/W·cy/H·rr/√(W*H) 비율로 저장)
// doneCount 1~6에 대해 [cx비율, cy비율, rr비율] 저장
const _BLOB_LUT = {
  // [cxRatio(W기준), cyRatio(H기준), rrRatio(sqrt(W*H)기준)]
  1: [-0.0625, -0.1538, 0.740],
  2: [0,       1.0,     0.670],
  3: [0,       0.5,     0.930],
  4: [0.15,    0,       0.950],
  5: [-0.0417, 0,       1.650],
  6: [0,       0.3,     1.850]
};
function _makeBlobParams(W, H, doneCount) {
  const t = _BLOB_LUT[doneCount];
  return {
    cx: t[0] * W,
    cy: t[1] * H,
    rr: t[2] * Math.sqrt(W * H)
  };
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
