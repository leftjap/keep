// ═══════════════════════════════════════
// ui-expense.js — 가계부 UI 렌더링
// ═══════════════════════════════════════

// 카테고리 아이콘 매핑
var CATEGORY_ICONS = {
  '식비': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 3v18M6 3v7c0 1.1.9 2 2 2h2a2 2 0 002-2V3M10 3v18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '카페': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '교통': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="7.5" cy="15" r="1.5" fill="currentColor"/><circle cx="16.5" cy="15" r="1.5" fill="currentColor"/><path d="M3 10h18" stroke="currentColor" stroke-width="1.8"/></svg>',
  '쇼핑': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '생활': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '공과금': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '대출': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/><path d="M6 14h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  '의료': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M12 9v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" stroke-width="1.8"/></svg>',
  '반려동물': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="7" cy="8" r="2" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="8" r="2" stroke="currentColor" stroke-width="1.8"/><circle cx="4" cy="14" r="1.5" stroke="currentColor" stroke-width="1.8"/><circle cx="20" cy="14" r="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.1-1.8 2-4 2s-4-.9-4-2z" stroke="currentColor" stroke-width="1.8"/></svg>',
  '문화': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  '기타': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
};

function getCategoryIcon(category) {
  if (!category) return CATEGORY_ICONS['기타'];
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  // 부분 매칭 (예: '식비/외식' → '식비')
  var keys = Object.keys(CATEGORY_ICONS);
  for (var i = 0; i < keys.length; i++) {
    if (category.indexOf(keys[i]) !== -1 || keys[i].indexOf(category) !== -1) {
      return CATEGORY_ICONS[keys[i]];
    }
  }
  return CATEGORY_ICONS['기타'];
}

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
  renderExpenseDashboard('mobile');
}

function renderExpenseDashboard(platform) {
  var container = platform === 'pc'
    ? document.getElementById('expFullDashboardPane')
    : document.getElementById('expenseDashboard');
  if (!container) return;

  var thisYM = getExpenseViewYM();
  var pace = getExpensePace();
  var projected = getProjectedMonthTotal();
  var trend = getMonthlyTrend();
  var catBreakdown = getCategoryBreakdown(thisYM);
  var thisMonthTotal = getMonthTotal(thisYM);
  var d = new Date(thisYM + '-01');
  var monthLabel = (d.getMonth() + 1) + '월';
  var totalDisplay = thisMonthTotal > 0 ? formatAmount(thisMonthTotal) + '원' : '0원';

  var html = '';

  // 1. 월 이동 헤더 — 전체 너비, 가운데 정렬
  var _isNowMonth = (thisYM === today().slice(0, 7));
  html += '<div class="exp-month-nav">'
    + '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(-1)"><svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg></button>'
    + '<span class="exp-month-nav-label" onclick="openMonthPicker()" style="cursor:pointer;">' + monthLabel + '</span>'
    + '<button class="exp-month-nav-btn' + (_isNowMonth ? ' exp-nav-disabled' : '') + '"' + (_isNowMonth ? '' : ' onclick="changeExpenseMonth(1)"') + '><svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg></button>'
    + '</div>';

  var summaryTitle = '오늘까지 ' + totalDisplay + ' 썼어요';

  var paceHtml = '';
  if (pace) {
    var diffAmount = formatAmount(Math.abs(pace.diff)) + '원';
    if (pace.isLess) {
      paceHtml = '<div class="exp-summary-sub">지난달보다 <span style="color:#E55643;font-weight:600;">' + diffAmount + ' 덜</span> 쓰는 중</div>';
    } else {
      paceHtml = '<div class="exp-summary-sub over">지난달보다 <span style="font-weight:600;">' + diffAmount + ' 더</span> 쓰는 중</div>';
    }
  }

  if (platform === 'pc') {
    // 2. PC 2열: (이달 총액 + 누적 차트) | (카테고리별 지출)
    html += '<div class="exp-two-col">';

    // 좌측 카드: 이달 총액 + 페이스 + 누적 차트
    html += '<div class="exp-two-col-card">';
    html += '<div class="exp-summary" style="padding:0 0 16px;">';
    html += '<div class="exp-summary-title">' + summaryTitle + '</div>';
    html += paceHtml;
    html += '</div>';
    html += renderCumulativeChart(thisYM);
    html += '</div>';

    // 우측 카드: 카테고리별 지출
    html += '<div class="exp-two-col-card">';
    html += renderCategoryChart(catBreakdown);
    html += '</div>';

    html += '</div>';
  } else {
    // 모바일: 1열 순차
    html += '<div class="exp-summary">';
    html += '<div class="exp-summary-title">' + summaryTitle + '</div>';
    html += paceHtml;
    html += '</div>';
    html += renderCumulativeChart(thisYM);
    html += '<div class="exp-section-gap"></div>';
    html += renderCategoryChart(catBreakdown);
  }

  // 3. 예상 지출 + 월별 막대 차트 — 전체 너비
  html += '<div class="exp-section-gap"></div>';
  html += '<div class="exp-projection">';
  html += '<div class="exp-projection-title">이번 달엔 ' + formatAmount(projected) + '원 쓸 것 같아요</div>';
  html += '<div class="exp-projection-sub">한 달에 평균 ' + formatAmount(getMonthlyAverage()) + '원 정도 써요</div>';
  html += renderMonthlyBarChart(trend);
  html += '</div>';

  // 4. 주간 캘린더 — 전체 너비
  html += '<div class="exp-section-gap"></div>';
  html += renderWeeklyCalendar(thisYM);

  // 5. 최근 7일 타임라인 — 전체 너비
  html += '<div class="exp-section-gap"></div>';
  html += renderRecentExpenses(thisYM);

  // 6. "내역 더 보기" 버튼
  if (platform === 'pc') {
    html += '<button class="exp-more-btn" onclick="showExpenseFullDetail(\'' + thisYM + '\')">내역 더 보기 →</button>';
  } else {
    html += '<button class="exp-more-btn" onclick="showExpenseFullDetailMobile(\'' + thisYM + '\')">내역 더 보기 →</button>';
  }

  container.innerHTML = html;
}

function renderCumulativeChart(yearMonth) {
  var thisMonthExpenses = getMonthExpenses(yearMonth);
  var prevMonth = new Date(yearMonth + '-01');
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  var prevYM = prevMonth.getFullYear() + '-' + String(prevMonth.getMonth()+1).padStart(2,'0');
  var prevMonthExpenses = getMonthExpenses(prevYM);

  var monthNum = new Date(yearMonth + '-01').getMonth() + 1;
  var daysInMonth = new Date(new Date(yearMonth + '-01').getFullYear(), new Date(yearMonth + '-01').getMonth() + 1, 0).getDate();
  var todayDate = new Date().getDate();
  var isCurrentMonth = (yearMonth === today().slice(0, 7));
  var lastDataDay = isCurrentMonth ? Math.min(todayDate, daysInMonth) : daysInMonth;

  var thisMonthCumulative = {};
  var prevMonthCumulative = {};
  var thisSum = 0, prevSum = 0;

  for (var i = 1; i <= daysInMonth; i++) {
    var d = yearMonth + '-' + String(i).padStart(2,'0');
    thisSum += getDayTotal(d);
    thisMonthCumulative[i] = thisSum;

    var prevD = prevYM + '-' + String(i).padStart(2,'0');
    var prevDayTotal = prevMonthExpenses.reduce(function(s, e) { return e.date === prevD ? s + e.amount : s; }, 0);
    prevSum += prevDayTotal;
    prevMonthCumulative[i] = prevSum;
  }

  var allVals = Object.values(thisMonthCumulative).concat(Object.values(prevMonthCumulative)).concat([1]);
  var maxY = Math.max.apply(null, allVals);
  var width = 260, height = 170, padding = 20;
  var graphWidth = width - padding * 2;
  var graphHeight = height - padding * 2 - 18;
  var bottom = padding + graphHeight;

  var thisPoints = '', prevPoints = '';
  var thisFill = padding + ',' + bottom + ' ';
  var prevFill = padding + ',' + bottom + ' ';
  var dotX = 0, dotY = 0;

  for (var j = 1; j <= daysInMonth; j++) {
    var x = padding + (j - 1) / (daysInMonth - 1) * graphWidth;
    var thisY = padding + graphHeight - (thisMonthCumulative[j] / maxY) * graphHeight;
    var prevY = padding + graphHeight - (prevMonthCumulative[j] / maxY) * graphHeight;

    if (j <= lastDataDay) {
      thisPoints += x + ',' + thisY + ' ';
      thisFill += x + ',' + thisY + ' ';
      dotX = x;
      dotY = thisY;
    }

    prevPoints += x + ',' + prevY + ' ';
    prevFill += x + ',' + prevY + ' ';
  }

  var lastThisX = padding + (lastDataDay - 1) / (daysInMonth - 1) * graphWidth;
  thisFill += lastThisX + ',' + bottom;
  var lastPrevX = padding + graphWidth;
  prevFill += lastPrevX + ',' + bottom;

  var labelY = bottom + 16;
  var startLabel = monthNum + '.1';
  var endLabel = monthNum + '.' + daysInMonth;
  var todayLabel = monthNum + '.' + lastDataDay;
  var todayLabelX = dotX;
  var startX = padding;
  var endX = padding + graphWidth;

  return '<div class="exp-chart-wrap">'
    + '<svg class="exp-chart-svg" viewBox="0 0 ' + width + ' ' + height + '">'
    + '<defs>'
    + '<linearGradient id="thisMonthGrad" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#E55643" stop-opacity="0.25"/>'
    + '<stop offset="100%" stop-color="#E55643" stop-opacity="0.02"/>'
    + '</linearGradient>'
    + '<linearGradient id="prevMonthGrad" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#C8C8C8" stop-opacity="0.2"/>'
    + '<stop offset="100%" stop-color="#C8C8C8" stop-opacity="0.02"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<polygon points="' + prevFill + '" fill="url(#prevMonthGrad)"/>'
    + '<polyline points="' + prevPoints + '" fill="none" stroke="#D0D0D0" stroke-width="1.5"/>'
    + '<polygon points="' + thisFill + '" fill="url(#thisMonthGrad)"/>'
    + '<polyline points="' + thisPoints + '" fill="none" stroke="#E55643" stroke-width="2"/>'
    + '<circle cx="' + dotX + '" cy="' + dotY + '" r="7" fill="#E55643" opacity="0.2"/>'
    + '<circle cx="' + dotX + '" cy="' + dotY + '" r="4" fill="#E55643"/>'
    + '<text x="' + startX + '" y="' + labelY + '" font-size="10" fill="#aaa" font-family="Pretendard,sans-serif" text-anchor="start">' + startLabel + '</text>'
    + (isCurrentMonth && lastDataDay < daysInMonth ? '<text x="' + todayLabelX + '" y="' + labelY + '" font-size="10" fill="#E55643" font-weight="600" font-family="Pretendard,sans-serif" text-anchor="middle">' + todayLabel + '</text>' : '')
    + '<text x="' + endX + '" y="' + labelY + '" font-size="10" fill="#aaa" font-family="Pretendard,sans-serif" text-anchor="end">' + endLabel + '</text>'
    + '</svg>'
    + '<div class="exp-chart-legend">'
    + '<span><span class="exp-chart-legend-dot" style="background:#E55643;"></span>' + monthNum + '월</span>'
    + '<span><span class="exp-chart-legend-dot" style="background:#D0D0D0;"></span>' + (new Date(prevYM + '-01').getMonth() + 1) + '월</span>'
    + '</div>'
    + '</div>';
}

function renderMonthlyBarChart(trend) {
  var maxTotal = Math.max.apply(null, trend.map(function(t) { return t.total; }).concat([1]));
  var html = '<div class="exp-bar-chart">';
  trend.forEach(function(t) {
    var pct = (t.total / maxTotal) * 100;
    var isCurrentClass = t.isCurrent ? 'current' : '';
    html += '<div class="exp-bar-item ' + isCurrentClass + '">'
      + (t.isCurrent ? '<div class="exp-bar-projected">예상</div>' : '')
      + '<div class="exp-bar-value">' + formatAmount(t.total) + '</div>'
      + '<div class="exp-bar-fill" style="height:' + Math.max(pct, 4) + '%"></div>'
      + '<div class="exp-bar-label">' + t.label + '</div>'
      + '</div>';
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

  const entries = getExpenses()
    .filter(e => {
      const eDate = new Date(e.date);
      return eDate >= sevenDaysAgo && eDate <= now;
    })
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

  if (!entries || entries.length === 0) {
    return '<div class="exp-tl-empty">내역이 없습니다</div>';
  }

  // 날짜별 그룹핑
  var grouped = {};
  var dateOrder = [];
  entries.forEach(function(e) {
    var d = e.date;
    if (!grouped[d]) {
      grouped[d] = [];
      dateOrder.push(d);
    }
    grouped[d].push(e);
  });

  // 날짜 내림차순 정렬
  dateOrder.sort(function(a, b) { return b.localeCompare(a); });

  var dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var html = '';

  dateOrder.forEach(function(dateStr) {
    var items = grouped[dateStr];
    var dateObj = new Date(dateStr + 'T00:00:00');
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    var dayName = dayNames[dateObj.getDay()];

    html += '<div class="exp-tl-date-group">';
    html += '<div class="exp-tl-date-header">' + month + '월 ' + day + '일 ' + dayName + '</div>';

    items.forEach(function(item, idx) {
      html += '<div class="exp-tl-item" onclick="loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');">';
      html += '<div class="exp-tl-item-icon">' + getCategoryIcon(item.category) + '</div>';
      html += '<div class="exp-tl-item-left">';
      html += '<span class="exp-tl-item-amount">' + item.amount.toLocaleString() + '원</span>';
      html += '<span class="exp-tl-item-sub">' + (item.merchant || '미분류');
      if (item.payMethod) {
        html += ' | ' + item.payMethod;
      }
      html += '</span>';
      html += '</div>';
      html += '</div>';

      if (idx < items.length - 1) {
        html += '<div class="exp-tl-item-divider"></div>';
      }
    });

    html += '</div>';
  });

  return html;
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

  // 빈 셀 (월 시작 전)
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
  var entries = getMonthExpenses(yearMonth)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

  if (!entries || entries.length === 0) {
    return '<div class="exp-tl-empty">내역이 없습니다</div>';
  }

  // 날짜별 그룹핑
  var grouped = {};
  var dateOrder = [];
  entries.forEach(function(e) {
    var d = e.date;
    if (!grouped[d]) {
      grouped[d] = [];
      dateOrder.push(d);
    }
    grouped[d].push(e);
  });

  // 날짜 내림차순 정렬
  dateOrder.sort(function(a, b) { return b.localeCompare(a); });

  var dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var html = '';

  dateOrder.forEach(function(dateStr) {
    var items = grouped[dateStr];
    var dateObj = new Date(dateStr + 'T00:00:00');
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    var dayName = dayNames[dateObj.getDay()];

    html += '<div class="exp-tl-date-group">';
    html += '<div class="exp-tl-date-header">' + month + '월 ' + day + '일 ' + dayName + '</div>';

    items.forEach(function(item, idx) {
      var clickAction = useModal
        ? 'openExpenseModal(\'' + item.id + '\')'
        : 'loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';

      html += '<div class="exp-tl-item" onclick="' + clickAction + '">';
      html += '<div class="exp-tl-item-icon">' + getCategoryIcon(item.category) + '</div>';
      html += '<div class="exp-tl-item-left">';
      html += '<span class="exp-tl-item-amount">' + item.amount.toLocaleString() + '원</span>';
      html += '<span class="exp-tl-item-sub">' + (item.merchant || '미분류');
      if (item.payMethod) {
        html += ' | ' + item.payMethod;
      }
      html += '</span>';
      html += '</div>';
      html += '</div>';

      if (idx < items.length - 1) {
        html += '<div class="exp-tl-item-divider"></div>';
      }
    });

    html += '</div>';
  });

  return html;
}

// ═══════════════════════════════════════
// 카테고리별 비율 차트 (수평 바)
// ═══════════════════════════════════════
function renderCategoryChart(catBreakdown) {
  if (!catBreakdown || catBreakdown.length === 0) return '';
  var maxAmount = catBreakdown[0].amount;
  var html = '<div class="exp-category-chart">';
  html += '<div class="exp-category-title">카테고리별 지출</div>';

  catBreakdown.forEach(function(cat, i) {
    var pct = (cat.amount / maxAmount) * 100;
    var opacity = Math.max(0.2, 1 - i * 0.12);

    html += '<div class="exp-category-row">'
      + '<div class="exp-category-name">' + cat.name + '</div>'
      + '<div class="exp-category-bar-wrap">'
      + '<div class="exp-category-bar" style="width:' + Math.max(pct, 3) + '%;background:#E55643;opacity:' + opacity + '"></div>'
      + '</div>'
      + '<div class="exp-category-amount">' + formatAmount(cat.amount) + '</div>'
      + '</div>';
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
// ═══════════════════════════════════════
// renderCategoryBarCompact() — 카테고리 스택 바
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
  if (delta > 0 && current >= today().slice(0, 7)) return;
  var d = new Date(current + '-01');
  d.setMonth(d.getMonth() + delta);
  _expenseViewYM = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

  var nowYM = today().slice(0, 7);
  var isNow = (_expenseViewYM === nowYM);

  if (window.innerWidth > 768) {
    if (isNow) {
      showExpenseDashboardFromDetail();
      renderExpenseDashboard('pc');
    } else {
      showExpenseFullDetail(_expenseViewYM);
    }
  } else {
    if (isNow) {
      showExpenseDashboardFromDetailMobile();
      renderExpenseDashboard('mobile');
    } else {
      showExpenseFullDetailMobile(_expenseViewYM);
    }
  }
}

// ═══════════════════════════════════════
// A ↔ B 전환 함수
// ═══════════════════════════════════════
function showExpenseFullDetail(yearMonth) {
  // B(전체 내역) 표시, A 숨김
  var dashPane = document.getElementById('expFullDashboardPane');
  var detailPane = document.getElementById('expFullDetailPane');

  if (dashPane) dashPane.style.display = 'none';
  if (detailPane) detailPane.style.display = 'block';

  renderExpenseFullDetail(yearMonth);
}

function showExpenseDashboardFromDetail() {
  _expenseViewYM = today().slice(0, 7);
  var dashPane = document.getElementById('expFullDashboardPane');
  var detailPane = document.getElementById('expFullDetailPane');
  if (dashPane) dashPane.style.display = 'block';
  if (detailPane) detailPane.style.display = 'none';
  renderExpenseDashboard('pc');
}

// ═══════════════════════════════════════
// B. 전체 내역 렌더 (전체 내역 페이지)
// ═══════════════════════════════════════
var _expenseDetailSearchQuery = '';

function renderExpenseFullDetail(yearMonth) {
  var container = document.getElementById('expFullDetailPane');
  if (!container) return;

  var d = new Date(yearMonth + '-01');
  var monthNum = d.getMonth() + 1;
  var monthLabel = monthNum + '월';
  var fullMonthLabel = d.getFullYear() + '년 ' + monthNum + '월';
  var nowYM = today().slice(0, 7);
  var isCurrentMonth = (yearMonth === nowYM);
  var isFutureDisabled = (yearMonth >= nowYM);
  var monthTotal = getMonthTotal(yearMonth);
  var catBreakdown = getCategoryBreakdown(yearMonth);

  var html = '';

  // 월 이동 헤더
  var _leftSvg = '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg>';
  var _rightSvg = '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg>';

  html += '<div class="exp-month-nav">';
  html += '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(-1)">' + _leftSvg + '</button>';
  html += '<span class="exp-month-nav-label" onclick="openMonthPicker()" style="cursor:pointer;">' + monthLabel + '</span>';
  html += '<button class="exp-month-nav-btn' + (isFutureDisabled ? '' : '') + '" onclick="changeExpenseMonth(1)">' + _rightSvg + '</button>';
  html += '</div>';

  if (!isCurrentMonth) {
    var totalDisplay = monthTotal > 0 ? formatAmount(monthTotal) + '원' : '0원';
    html += '<div class="exp-summary" style="padding:8px 20px 16px;">';
    html += '<div class="exp-summary-title">' + monthNum + '월에 ' + totalDisplay + ' 썼어요</div>';
    html += '</div>';

    html += renderMonthCalendar(yearMonth);
    html += '<div class="exp-section-gap"></div>';

    if (catBreakdown.length > 0) {
      html += renderCategoryChart(catBreakdown);
      html += '<div class="exp-section-gap"></div>';
    }
  } else {
    // 현재 월 전체 내역: 기존 헤더
    html += '<div class="exp-detail-header">';
    html += '<span class="exp-detail-title">' + fullMonthLabel + ' 전체 내역</span>';
    html += '</div>';

    html += renderMonthCalendar(yearMonth);
  }

  // 검색
  html += '<div class="exp-search-bar">';
  html += '<input type="text" class="exp-search-input" id="expenseSearchInput" placeholder="검색" ';
  html += 'onkeyup="filterExpenseDetail(this.value)">';
  html += '</div>';

  // 타임라인
  html += '<div class="exp-full-timeline-wrap">';
  html += renderExpenseFullTimeline(yearMonth, _expenseDetailSearchQuery);
  html += '</div>';

  // 이전 월 버튼
  var prevMonthD = new Date(yearMonth + '-01');
  prevMonthD.setMonth(prevMonthD.getMonth() - 1);
  var prevYM = prevMonthD.getFullYear() + '-' + String(prevMonthD.getMonth() + 1).padStart(2, '0');
  var prevMonthLabel = prevMonthD.getFullYear() + '년 ' + (prevMonthD.getMonth() + 1) + '월';

  html += '<div style="padding:20px;text-align:center">';
  html += '<button class="exp-more-btn" onclick="_expenseViewYM=\'' + prevYM + '\';showExpenseFullDetail(\'' + prevYM + '\')">';
  html += prevMonthLabel + ' 내역 더 보기 →';
  html += '</button>';
  html += '</div>';

  container.innerHTML = html;
}

function renderExpenseFullTimeline(yearMonth, query = '') {
  var entries = getMonthExpenses(yearMonth)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

  // 검색 필터
  if (query && query.trim()) {
    entries = entries.filter(e =>
      e.merchant.toLowerCase().includes(query.toLowerCase()) ||
      (e.memo && e.memo.toLowerCase().includes(query.toLowerCase()))
    );
  }

  if (!entries || entries.length === 0) {
    return '<div class="exp-tl-empty">내역이 없습니다</div>';
  }

  // 날짜별 그룹핑
  var grouped = {};
  var dateOrder = [];
  entries.forEach(function(e) {
    var d = e.date; // 'YYYY-MM-DD'
    if (!grouped[d]) {
      grouped[d] = [];
      dateOrder.push(d);
    }
    grouped[d].push(e);
  });

  // 날짜 내림차순 정렬 (최신 먼저)
  dateOrder.sort(function(a, b) { return b.localeCompare(a); });

  var dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var html = '';

  dateOrder.forEach(function(dateStr) {
    var items = grouped[dateStr];
    var dateObj = new Date(dateStr + 'T00:00:00');
    var month = dateObj.getMonth() + 1;
    var day = dateObj.getDate();
    var dayName = dayNames[dateObj.getDay()];

    // 날짜 헤더
    html += '<div class="exp-tl-date-group">';
    html += '<div class="exp-tl-date-header">' + month + '월 ' + day + '일 ' + dayName + '</div>';

    // 해당 날짜의 항목들
    items.forEach(function(item, idx) {
      var clickAction = window.innerWidth > 768
        ? 'openExpenseModal(\'' + item.id + '\')'
        : 'loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';

      html += '<div class="exp-tl-item" onclick="' + clickAction + '">';
      html += '<div class="exp-tl-item-icon">' + getCategoryIcon(item.category) + '</div>';
      html += '<div class="exp-tl-item-left">';
      html += '<span class="exp-tl-item-amount">' + item.amount.toLocaleString() + '원</span>';
      html += '<span class="exp-tl-item-sub">' + (item.merchant || '미분류');
      if (item.payMethod) {
        html += ' | ' + item.payMethod;
      }
      html += '</span>';
      html += '</div>';
      html += '</div>';

      // 같은 날짜 내 항목 사이 구분선 (마지막 항목 제외)
      if (idx < items.length - 1) {
        html += '<div class="exp-tl-item-divider"></div>';
      }
    });

    html += '</div>'; // .exp-tl-date-group 닫기
  });

  return html;
}

function filterExpenseDetail(query) {
  _expenseDetailSearchQuery = query;
  var timelineWrap = document.querySelector('.exp-full-timeline-wrap');
  if (timelineWrap) {
    timelineWrap.innerHTML = renderExpenseFullTimeline(getExpenseViewYM(), query);
  }
}

function showExpenseFullDetailMobile(yearMonth) {
  var dashboard = document.getElementById('pane-expense-dashboard');
  var detail = document.getElementById('pane-expense-detail');
  if (dashboard) dashboard.style.display = 'none';
  if (detail) detail.style.display = 'flex';
  renderExpenseFullDetailMobile(yearMonth);
}

function showExpenseDashboardFromDetailMobile() {
  _expenseViewYM = today().slice(0, 7);
  var dashboard = document.getElementById('pane-expense-dashboard');
  var detail = document.getElementById('pane-expense-detail');
  if (detail) detail.style.display = 'none';
  if (dashboard) dashboard.style.display = 'flex';
  renderExpenseDashboard('mobile');
}

function renderExpenseFullDetailMobile(yearMonth) {
  var container = document.getElementById('expenseDetail');
  if (!container) return;

  var d = new Date(yearMonth + '-01');
  var monthNum = d.getMonth() + 1;
  var monthLabel = monthNum + '월';
  var fullMonthLabel = d.getFullYear() + '년 ' + monthNum + '월';
  var nowYM = today().slice(0, 7);
  var isCurrentMonth = (yearMonth === nowYM);
  var isFutureDisabled = (yearMonth >= nowYM);
  var monthTotal = getMonthTotal(yearMonth);
  var catBreakdown = getCategoryBreakdown(yearMonth);

  var html = '';

  // 월 이동 헤더
  var _leftSvg = '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg>';
  var _rightSvg = '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg>';

  html += '<div class="exp-month-nav">';
  html += '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(-1)">' + _leftSvg + '</button>';
  html += '<span class="exp-month-nav-label" onclick="openMonthPicker()" style="cursor:pointer;">' + monthLabel + '</span>';
  html += '<button class="exp-month-nav-btn' + (isFutureDisabled ? ' exp-nav-disabled' : '') + '"' + (isFutureDisabled ? '' : ' onclick="changeExpenseMonth(1)"') + '>' + _rightSvg + '</button>';
  html += '</div>';

  if (!isCurrentMonth) {
    var totalDisplay = monthTotal > 0 ? formatAmount(monthTotal) + '원' : '0원';
    html += '<div class="exp-summary" style="padding:8px 20px 16px;">';
    html += '<div class="exp-summary-title">' + monthNum + '월에 ' + totalDisplay + ' 썼어요</div>';
    html += '</div>';

    html += renderMonthCalendar(yearMonth);
    html += '<div class="exp-section-gap"></div>';

    if (catBreakdown.length > 0) {
      html += renderCategoryChart(catBreakdown);
      html += '<div class="exp-section-gap"></div>';
    }
  } else {
    html += '<div class="exp-detail-header">';
    html += '<span class="exp-detail-title">' + fullMonthLabel + ' 전체 내역</span>';
    html += '</div>';

    html += renderMonthCalendar(yearMonth);
  }

  // 검색
  html += '<div class="exp-search-bar">';
  html += '<input type="text" class="exp-search-input" placeholder="검색" oninput="filterExpenseDetailMobile(this.value, \'' + yearMonth + '\')">';
  html += '</div>';

  // 타임라인
  html += '<div id="expMobileTimeline">';
  html += renderExpenseFullTimeline(yearMonth, '');
  html += '</div>';

  // 이전 월 버튼
  var prevD = new Date(yearMonth + '-01');
  prevD.setMonth(prevD.getMonth() - 1);
  var prevYM = prevD.getFullYear() + '-' + String(prevD.getMonth() + 1).padStart(2, '0');
  var prevLabel = prevD.getFullYear() + '년 ' + (prevD.getMonth() + 1) + '월';
  html += '<div style="padding:20px 0;text-align:center">';
  html += '<button class="exp-more-btn" onclick="showExpenseFullDetailMobile(\'' + prevYM + '\')">' + prevLabel + ' 내역 →</button>';
  html += '</div>';

  container.innerHTML = html;
}

function filterExpenseDetailMobile(query, yearMonth) {
  var wrap = document.getElementById('expMobileTimeline');
  if (wrap) {
    wrap.innerHTML = renderExpenseFullTimeline(yearMonth, query);
  }
}

// ═══════════════════════════════════════
// 월 선택 모달
// ═══════════════════════════════════════
function openMonthPicker() {
  var existing = document.getElementById('expMonthPickerOverlay');
  if (existing) existing.remove();

  var currentYM = getExpenseViewYM();
  var nowYM = today().slice(0, 7);
  var now = new Date();

  var months = [];
  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var label = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월';
    months.push({ ym: ym, label: label, selected: ym === currentYM });
  }

  var listHtml = months.map(function(m) {
    return '<div class="exp-mp-item' + (m.selected ? ' exp-mp-selected' : '') + '" onclick="selectMonth(\'' + m.ym + '\')">'
      + '<span>' + m.label + '</span>'
      + (m.selected ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10L8 14L16 6" stroke="#E55643" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>';
  }).join('');

  var overlay = document.createElement('div');
  overlay.id = 'expMonthPickerOverlay';
  overlay.className = 'exp-mp-overlay';
  overlay.innerHTML = '<div class="exp-mp-sheet">'
    + '<div class="exp-mp-header">'
    + '<span class="exp-mp-title">월 선택하기</span>'
    + '<button class="exp-mp-close" onclick="closeMonthPicker()"><svg width="16" height="16" viewBox="0 0 16 16"><line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>'
    + '</div>'
    + '<div class="exp-mp-list">' + listHtml + '</div>'
    + '</div>';

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeMonthPicker();
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(function() {
    overlay.classList.add('open');
  });
}

function closeMonthPicker() {
  var overlay = document.getElementById('expMonthPickerOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(function() {
    if (overlay.parentNode) overlay.remove();
  }, 300);
}

function selectMonth(ym) {
  _expenseViewYM = ym;
  closeMonthPicker();

  var nowYM = today().slice(0, 7);
  var isNow = (ym === nowYM);

  if (window.innerWidth > 768) {
    if (isNow) {
      showExpenseDashboardFromDetail();
      renderExpenseDashboard('pc');
    } else {
      showExpenseFullDetail(ym);
    }
  } else {
    if (isNow) {
      showExpenseDashboardFromDetailMobile();
      renderExpenseDashboard('mobile');
    } else {
      showExpenseFullDetailMobile(ym);
    }
  }
}
