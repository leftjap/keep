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
  const thisYM = today().slice(0, 7);
  const pace = getExpensePace();
  const projected = getProjectedMonthTotal();
  const trend = getMonthlyTrend();
  const sevenDaysAgo = getLocalYMD(new Date(Date.now() - 7 * 86400000));

  let html = '';

  // ① 이달 총액 + 페이스
  const thisMonthTotal = getMonthTotal(thisYM);
  html += `<div class="exp-summary">
    <div class="exp-summary-title">오늘까지 ${formatAmount(thisMonthTotal)}원 썼어요</div>`;
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
    html += `<div class="exp-item" onclick="loadExpense('${e.id}'); switchTab('expense');">
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

function renderExpenseTimeline(yearMonth) {
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
    html += `<div class="exp-item" onclick="loadExpense('${e.id}'); switchTab('expense');">
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
