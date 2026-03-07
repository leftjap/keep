// ═══════════════════════════════════════
// ui-expense.js — 가계부 UI 렌더링
// ═══════════════════════════════════════

function updateExpenseCompact() {
  const el = document.getElementById('expenseCompactAmount');
  if (!el) return;
  const thisYM = today().slice(0, 7);
  const total = getMonthTotal(thisYM);
  el.textContent = total > 0 ? formatAmount(total) : '';
}

function showExpenseDashboard() {
  document.getElementById('pane-expense-dashboard').style.display = 'flex';
  document.getElementById('pane-expense-detail').style.display = 'none';
  renderExpenseDashboard();
}

function showExpenseDetail(yearMonth) {
  document.getElementById('pane-expense-dashboard').style.display = 'none';
  document.getElementById('pane-expense-detail').style.display = 'flex';
  renderExpenseDetail(yearMonth);
}

function renderExpenseDashboard() {
  const container = document.getElementById('expenseDashboard');
  if (!container) return;

  const thisYM = today().slice(0, 7);
  const pace = getExpensePace();
  const projected = getProjectedMonthTotal();
  const trend = getMonthlyTrend();
  const sevenDaysAgo = getLocalYMD(new Date(Date.now() - 7 * 86400000));

  let html = '';

  // ① 이달 총액 + 페이스
  const thisMonthTotal = getMonthTotal(thisYM);
  const totalDisplay = thisMonthTotal > 0 ? formatAmount(thisMonthTotal) : '0';
  html += `<div class="exp-summary">
    <div class="exp-summary-title">오늘까지 ${totalDisplay}원 썼어요</div>`;
  if (pace) {
    const paceText = pace.isLess
      ? `지난달보다 ${formatAmount(Math.abs(pace.diff))}원 덜 쓰는 중`
      : `지난달보다 ${formatAmount(pace.diff)}원 더 쓰는 중`;
    const paceClass = pace.isLess ? '' : 'over';
    html += `<div class="exp-summary-sub ${paceClass}">${paceText}</div>`;
  }
  html += '</div>';

  // ② 누적 곡선 차트 (이번달 vs 전월)
  html += renderCumulativeChart(thisYM);

  // ③ 예상 지출 + 막대 차트
  html += `<div class="exp-projection">
    <div class="exp-projection-title">이번 달엔 ${formatAmount(projected)}원 쓸 것 같아요</div>
    <div class="exp-projection-sub">한 달에 평균 ${formatAmount(getMonthlyAverage())}원 정도 써요</div>`;
  html += renderMonthlyBarChart(trend);
  html += '</div>';

  // ④ 주간 캘린더
  html += renderWeeklyCalendar(thisYM);

  // ⑤ 최근 7일 지출 내역
  html += renderRecentExpenses(thisYM);

  // ⑥ "내역 더 보기" 버튼
  html += `<button class="exp-more-btn" onclick="showExpenseDetail('${thisYM}')">내역 더 보기 →</button>`;

  container.innerHTML = html;
}

function renderCumulativeChart(yearMonth) {
  const thisMonthExpenses = getMonthExpenses(yearMonth);
  const prevMonth = new Date(yearMonth + '-01');
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevYM = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}`;
  const prevMonthExpenses = getMonthExpenses(prevYM);

  const daysInMonth = new Date(new Date(yearMonth + '-01').getFullYear(), new Date(yearMonth + '-01').getMonth() + 1, 0).getDate();
  const today_d = new Date().getDate();

  // 누적 합산 계산
  const thisMonthCumulative = {};
  const prevMonthCumulative = {};
  let thisSum = 0, prevSum = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const d = `${yearMonth}-${String(i).padStart(2,'0')}`;
    const dayTotal = getDayTotal(d);
    thisSum += dayTotal;
    thisMonthCumulative[i] = thisSum;

    const prevD = `${prevYM}-${String(i).padStart(2,'0')}`;
    const prevDayTotal = prevMonthExpenses.reduce((s, e) => e.date === prevD ? s + e.amount : s, 0);
    prevSum += prevDayTotal;
    prevMonthCumulative[i] = prevSum;
  }

  // SVG 좌표 계산
  const maxY = Math.max(...Object.values(thisMonthCumulative), ...Object.values(prevMonthCumulative), 1);
  const width = 260, height = 140, padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  let thisPoints = '', prevPoints = '';
  for (let i = 1; i <= daysInMonth; i++) {
    const x = padding + (i - 1) / (daysInMonth - 1) * graphWidth;
    const thisY = padding + graphHeight - (thisMonthCumulative[i] / maxY) * graphHeight;
    const prevY = padding + graphHeight - (prevMonthCumulative[i] / maxY) * graphHeight;
    thisPoints += `${x},${thisY} `;
    prevPoints += `${x},${prevY} `;
  }

  return `<div class="exp-chart-wrap">
    <svg class="exp-chart-svg" viewBox="0 0 ${width} ${height}">
      <polyline points="${prevPoints}" fill="none" stroke="var(--border)" stroke-width="2"/>
      <polyline points="${thisPoints}" fill="none" stroke="var(--tab-color)" stroke-width="2.5"/>
    </svg>
    <div class="exp-chart-legend">
      <span><span class="exp-chart-legend-dot" style="background:var(--border);"></span>${new Date(prevYM + '-01').getMonth() + 1}월</span>
      <span><span class="exp-chart-legend-dot" style="background:var(--tab-color);"></span>${new Date(yearMonth + '-01').getMonth() + 1}월</span>
    </div>
  </div>`;
}

function renderMonthlyBarChart(trend) {
  const maxTotal = Math.max(...trend.map(t => t.total), 1);
  let html = '<div class="exp-bar-chart">';
  trend.forEach(t => {
    const pct = (t.total / maxTotal) * 100;
    const isCurrentClass = t.isCurrent ? 'current' : '';
    html += `<div class="exp-bar-item ${isCurrentClass}">
      ${t.isCurrent ? '<div class="exp-bar-projected">예상</div>' : ''}
      <div class="exp-bar-fill" style="height:${Math.max(pct, 2)}%"></div>
      <div class="exp-bar-value">${formatAmount(t.total)}</div>
      <div class="exp-bar-label">${t.label}</div>
    </div>`;
  });
  html += '</div>';
  return html;
}

function renderWeeklyCalendar(yearMonth) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);

  let html = '<div class="exp-week-cal"><div class="exp-week-grid">';
  html += '<div class="exp-week-dow">일</div><div class="exp-week-dow">월</div><div class="exp-week-dow">화</div>';
  html += '<div class="exp-week-dow">수</div><div class="exp-week-dow">목</div><div class="exp-week-dow">금</div><div class="exp-week-dow">토</div>';

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = getLocalYMD(d);
    const total = getDayTotal(dateStr);
    const isToday = dateStr === getLocalYMD(now) ? 'today' : '';
    const amountClass = total > 50000 ? 'high' : '';
    html += `<div class="exp-week-day ${isToday}">
      <div class="exp-week-day-num">${d.getDate()}</div>
      ${total > 0 ? `<div class="exp-week-day-amount ${amountClass}">${formatAmountShort(total)}</div>` : ''}
    </div>`;
  }
  html += '</div></div>';
  return html;
}

function renderRecentExpenses(yearMonth) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const expenses = getExpenses()
    .filter(e => {
      const eDate = new Date(e.date);
      return eDate >= sevenDaysAgo && eDate <= now;
    })
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

  let html = '<div class="exp-timeline">';

  let currentDate = '';
  let daySum = 0;

  expenses.forEach(e => {
    if (e.date !== currentDate) {
      if (currentDate) {
        html += `<div class="exp-day-total">소계: ${daySum.toLocaleString()}</div>`;
      }
      currentDate = e.date;
      daySum = 0;
      const d = new Date(e.date);
      const dayName = ['일','월','화','수','목','금','토'][d.getDay()];
      html += `<div class="exp-date-header">${dayName} · ${d.getMonth() + 1}월 ${d.getDate()}일</div>`;
    }
    daySum += e.amount;
    html += `<div class="exp-item" onclick="loadExpense('${e.id}'); setMobileView('editor');">
      <div class="exp-item-merchant">${e.merchant}</div>
      <div class="exp-item-amount">${e.amount.toLocaleString()}</div>
    </div>`;
  });

  if (currentDate && daySum > 0) {
    html += `<div class="exp-day-total">소계: ${daySum.toLocaleString()}</div>`;
  }

  html += '</div>';
  return html;
}

function renderExpenseDetail(yearMonth) {
  const container = document.getElementById('expenseDetail');

  let html = '';

  // 검색 바
  html += `<div class="exp-search-wrap">
    <input type="text" class="exp-search-input" id="expenseSearchInput"
           placeholder="검색" oninput="filterExpenseDetail()">
  </div>`;

  // 월 캘린더
  html += renderMonthCalendar(yearMonth);

  // 전체 타임라인
  html += renderExpenseTimeline(yearMonth);

  // 이전 월 버튼
  const prevMonth = new Date(yearMonth + '-01');
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevYM = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth()+1).padStart(2,'0')}`;
  html += `<button class="exp-more-btn" onclick="showExpenseDetail('${prevYM}')">${prevMonth.getMonth() + 1}월 내역 더 보기 →</button>`;

  container.innerHTML = html;
}

function renderMonthCalendar(yearMonth) {
  const d = new Date(yearMonth + '-01');
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div class="exp-month-cal"><div class="exp-month-grid">';
  html += '<div class="exp-month-dow">일</div><div class="exp-month-dow">월</div><div class="exp-month-dow">화</div>';
  html += '<div class="exp-month-dow">수</div><div class="exp-month-dow">목</div><div class="exp-month-dow">금</div><div class="exp-month-dow">토</div>';

  // 빈 셀
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="exp-month-day empty"></div>';
  }

  // 날짜
  const now = new Date();
  const today = getLocalYMD(now);
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${yearMonth}-${String(i).padStart(2,'0')}`;
    const total = getDayTotal(dateStr);
    const isToday = dateStr === today ? 'today' : '';
    const amountClass = total > 50000 ? 'high' : '';
    html += `<div class="exp-month-day ${isToday}">
      <div class="exp-month-day-num">${i}</div>
      ${total > 0 ? `<div class="exp-month-day-amount ${amountClass}">${formatAmountShort(total)}</div>` : ''}
    </div>`;
  }

  html += '</div></div>';
  return html;
}

function renderExpenseTimeline(yearMonth, useModal) {
  const expenses = getMonthExpenses(yearMonth)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

  let html = '<div class="exp-timeline">';

  let currentDate = '';
  let daySum = 0;

  expenses.forEach(e => {
    if (e.date !== currentDate) {
      if (currentDate) {
        html += `<div class="exp-day-total">소계: ${daySum.toLocaleString()}</div>`;
      }
      currentDate = e.date;
      daySum = 0;
      const d = new Date(e.date);
      const dayName = ['일','월','화','수','목','금','토'][d.getDay()];
      html += `<div class="exp-date-header">${dayName} · ${d.getMonth() + 1}월 ${d.getDate()}일</div>`;
    }
    daySum += e.amount;

    // useModal=true이면 모달 열기, 아니면 화면 전환
    const clickAction = useModal
      ? `openExpenseModal('${e.id}')`
      : `loadExpense('${e.id}'); setMobileView('editor');`;

    html += `<div class="exp-item" onclick="${clickAction}">
      <div class="exp-item-merchant">${e.merchant}</div>
      <div class="exp-item-amount">${e.amount.toLocaleString()}</div>
    </div>`;
  });

  if (currentDate && daySum > 0) {
    html += `<div class="exp-day-total">소계: ${daySum.toLocaleString()}</div>`;
  }

  html += '</div>';
  return html;
}

function filterExpenseDetail() {
  // TODO: 검색 필터링 구현
}

// ═══════════════════════════════════════
// PC/태블릿용 풀 대시보드 (2+3단 통합)
// ═══════════════════════════════════════
function showExpenseFullDashboard() {
  var container = document.getElementById('expenseDashboardWrap');
  if (!container) return;

  var thisYM = getExpenseViewYM();
  var pace = getExpensePace();
  var projected = getProjectedMonthTotal();
  var trend = getMonthlyTrend();
  var catBreakdown = getCategoryBreakdown(thisYM);

  var html = '';

  // 페이스 요약
  if (pace) {
    var paceText = pace.isLess
      ? '지난달보다 ' + formatAmount(Math.abs(pace.diff)) + '원 덜 쓰는 중'
      : '지난달보다 ' + formatAmount(pace.diff) + '원 더 쓰는 중';
    html += '<div class="exp-summary" style="padding:24px 0 16px">';
    html += '<div class="exp-summary-sub ' + (pace.isLess ? '' : 'over') + '" style="font-size:14px">' + paceText + '</div>';
    html += '</div>';
  }

  // 누적 차트
  html += renderCumulativeChart(thisYM);

  // 예상 지출 + 막대 차트
  html += '<div class="exp-projection">';
  html += '<div class="exp-projection-title">이번 달엔 ' + formatAmount(projected) + '원 쓸 것 같아요</div>';
  html += '<div class="exp-projection-sub">한 달에 평균 ' + formatAmount(getMonthlyAverage()) + '원 정도 써요</div>';
  html += renderMonthlyBarChart(trend);
  html += '</div>';

  // 월간 캘린더
  html += renderMonthCalendar(thisYM);

  container.innerHTML = html;
}

// ═══════════════════════════════════════
// 카테고리별 비율 차트 (수평 바)
// ═══════════════════════════════════════
function renderCategoryChart(catBreakdown) {
  const maxAmount = Math.max(...catBreakdown.map(c => c.amount), 1);
  let html = '<div class="exp-category-chart">';
  html += '<div class="exp-category-title">카테고리별 지출</div>';

  catBreakdown.forEach(cat => {
    const pct = (cat.amount / maxAmount) * 100;
    const catName = cat.name;
    const catColor = cat.color;

    html += `<div class="exp-category-row">
      <div class="exp-category-name" style="color:${catColor}">${catName}</div>
      <div class="exp-category-bar-wrap">
        <div class="exp-category-bar" style="width:${Math.max(pct, 5)}%;background:${catColor}"></div>
      </div>
      <div class="exp-category-amount">${formatAmount(cat.amount)}</div>
    </div>`;
  });

  html += '</div>';
  return html;
}

// ═══════════════════════════════════════
// 모달 함수
// ═══════════════════════════════════════
function openExpenseModal(expenseId) {
  const modal = document.getElementById('expenseModalOverlay');
  if (!modal) return;

  // 모달용 폼 초기화
  if (expenseId) {
    const exp = getExpenses().find(e => e.id === expenseId);
    if (exp) loadExpense(expenseId, 'modal');
  } else {
    newExpenseForm('modal');
  }

  renderExpenseCategoryGrid('modal');
  modal.style.display = 'flex';
}

function closeExpenseModal() {
  const modal = document.getElementById('expenseModalOverlay');
  if (modal) modal.style.display = 'none';
}

function onExpenseModalOverlayClick(e) {
  if (e.target.id === 'expenseModalOverlay') {
    closeExpenseModal();
  }
}

// ═══════════════════════════════════════
// 월 이동 상태 관리
// ═══════════════════════════════════════
var _expenseViewYM = null;

function getExpenseViewYM() {
  if (!_expenseViewYM) _expenseViewYM = today().slice(0, 7);
  return _expenseViewYM;
}

// ═══════════════════════════════════════
// renderExpenseDashboardList() — list-panel용 (PC/태블릿)
// ═══════════════════════════════════════
function renderExpenseDashboardList() {
  var container = document.getElementById('expenseDashboard');
  if (!container) return;

  var thisYM = getExpenseViewYM();
  var thisMonthTotal = getMonthTotal(thisYM);
  var catBreakdown = getCategoryBreakdown(thisYM);
  var d = new Date(thisYM + '-01');
  var monthLabel = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월';

  var html = '';

  // 월 이동 헤더
  html += '<div class="exp-month-nav">';
  html += '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(-1)">‹</button>';
  html += '<span class="exp-month-nav-label">' + monthLabel + '</span>';
  html += '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(1)">›</button>';
  html += '</div>';

  // 이달 총액
  html += '<div class="exp-summary" style="padding:16px 20px 12px">';
  html += '<div class="exp-summary-title" style="font-size:18px">' + (thisMonthTotal > 0 ? thisMonthTotal.toLocaleString() + '원' : '0원') + '</div>';
  html += '</div>';

  // 카테고리 비율 (컴팩트)
  if (catBreakdown.length > 0) {
    html += '<div style="padding:0 20px 16px">';
    html += renderCategoryBarCompact(catBreakdown, thisMonthTotal);
    html += '</div>';
  }

  // 타임라인 (항목 클릭 시 모달)
  html += renderExpenseTimeline(thisYM, true);

  // + 추가 버튼
  html += '<div style="padding:20px;text-align:center">';
  html += '<button class="exp-more-btn" onclick="openExpenseModal()">+ 지출 추가</button>';
  html += '</div>';

  container.innerHTML = html;
}

// ═══════════════════════════════════════
// renderExpenseDashboardMobile() — 모바일용
// ═══════════════════════════════════════
function renderExpenseDashboardMobile() {
  var container = document.getElementById('expenseDashboard');
  if (!container) return;

  var thisYM = getExpenseViewYM();
  var pace = getExpensePace();
  var projected = getProjectedMonthTotal();
  var trend = getMonthlyTrend();
  var catBreakdown = getCategoryBreakdown(thisYM);
  var thisMonthTotal = getMonthTotal(thisYM);
  var d = new Date(thisYM + '-01');
  var monthLabel = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월';

  var html = '';

  // 월 이동 헤더
  html += '<div class="exp-month-nav">';
  html += '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(-1)">‹</button>';
  html += '<span class="exp-month-nav-label">' + monthLabel + '</span>';
  html += '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(1)">›</button>';
  html += '</div>';

  // 이달 총액
  html += '<div class="exp-summary">';
  html += '<div class="exp-summary-title">이달 총액: ' + formatAmount(thisMonthTotal) + '원</div>';
  if (pace) {
    var paceText = pace.isLess
      ? '지난달보다 ' + formatAmount(Math.abs(pace.diff)) + '원 덜 쓰는 중'
      : '지난달보다 ' + formatAmount(pace.diff) + '원 더 쓰는 중';
    html += '<div class="exp-summary-sub ' + (pace.isLess ? '' : 'over') + '">' + paceText + '</div>';
  }
  html += '</div>';

  // 누적 차트
  html += renderCumulativeChart(thisYM);

  // 카테고리
  html += renderCategoryChart(catBreakdown);

  // 예상 지출
  html += '<div class="exp-projection">';
  html += '<div class="exp-projection-title">이번 달엔 ' + formatAmount(projected) + '원 쓸 것 같아요</div>';
  html += '<div class="exp-projection-sub">한 달에 평균 ' + formatAmount(getMonthlyAverage()) + '원 정도 써요</div>';
  html += renderMonthlyBarChart(trend);
  html += '</div>';

  // 주간 캘린더
  html += renderWeeklyCalendar(thisYM);

  // 타임라인
  html += renderRecentExpenses(thisYM);

  container.innerHTML = html;
}

// ═══════════════════════════════════════
// showExpenseFullDashboard() 수정 — editor용 (PC/태블릿)
// ═══════════════════════════════════════
// (기존 함수 updateExpenseCompact는 유지, 아래 코드로 함수 수정)
// renderCumulativeChart, renderMonthlyBarChart, renderMonthCalendar 호출 및 _expenseViewYM 사용

// ═══════════════════════════════════════
// renderCategoryBarCompact() — 카테고리 스택 바 (list-panel용)
// ═══════════════════════════════════════
function renderCategoryBarCompact(catBreakdown, total) {
  if (!catBreakdown || catBreakdown.length === 0 || total <= 0) return '';
  var html = '<div class="exp-cat-stack-bar">';
  catBreakdown.forEach(function(cat) {
    var pct = (cat.amount / total) * 100;
    if (pct < 1) return;
    html += '<div class="exp-cat-stack-seg" style="width:' + pct + '%;background:' + cat.color + '" title="' + cat.name + ' ' + cat.amount.toLocaleString() + '원"></div>';
  });
  html += '</div>';

  // 범례
  html += '<div class="exp-cat-legend">';
  catBreakdown.slice(0, 5).forEach(function(cat) {
    html += '<span class="exp-cat-legend-item"><span class="exp-cat-legend-dot" style="background:' + cat.color + '"></span>' + cat.name + '</span>';
  });
  html += '</div>';
  return html;
}

// ═══════════════════════════════════════
// changeExpenseMonth() — 월 이동
// ═══════════════════════════════════════
function changeExpenseMonth(delta) {
  var current = getExpenseViewYM();
  var d = new Date(current + '-01');
  d.setMonth(d.getMonth() + delta);
  _expenseViewYM = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

  // 다시 렌더
  if (window.innerWidth > 768) {
    renderExpenseDashboardList();
    showExpenseFullDashboard();
  } else {
    renderExpenseDashboardMobile();
  }
}
