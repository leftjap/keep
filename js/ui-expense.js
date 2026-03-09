// ═══════════════════════════════════════
// ui-expense.js — 가계부 UI 렌더링
// ═══════════════════════════════════════

// ═══ 기본 아이콘 ═══
var DEFAULT_ICON_URL = 'default-icon.jpg';

function getMerchantIconHtml(item) {
  var merchant = (item.merchant || '').trim();
  // 1. 사용자 지정 아이콘 매핑 확인
  var iconUrl = findMerchantIcon(merchant);
  // 2. 항목 자체에 icon 필드가 있으면 우선
  if (item.icon) iconUrl = item.icon;
  // 3. 아이콘 URL이 있으면 해당 이미지, 없으면 고양이
  var src = iconUrl || DEFAULT_ICON_URL;
  return '<div class="exp-tl-item-icon exp-tl-item-icon-img">'
    + '<img src="' + src + '" width="40" height="40" onerror="this.onerror=null;this.src=\'' + DEFAULT_ICON_URL + '\';">'
    + '</div>';
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
  var trendCount = window.innerWidth > 1400 ? 10 : window.innerWidth > 768 ? 8 : 6;
  var trend = getMonthlyTrend(trendCount);
  var catBreakdown = getCategoryBreakdown(thisYM);
  var thisMonthTotal = getMonthTotal(thisYM);
  var totalDisplay = thisMonthTotal > 0 ? formatAmount(thisMonthTotal) + '원' : '0원';

  // 월 헤더를 상단 네비에 렌더링 (PC/태블릿은 topbar, 모바일은 false 반환)
  var ymParts = thisYM.split('-');
  var mo = parseInt(ymParts[1]);
  var isNow = (thisYM === today().slice(0, 7));
  var topbarNav = renderExpenseMonthNav(thisYM);

  var html = '';

  var summaryTitle = '오늘까지 ' + totalDisplay + ' 썼어요';

  var paceHtml = '';
  if (pace) {
    var diffAmount = formatAmount(Math.abs(pace.diff)) + '원';
    if (pace.isLess) {
      paceHtml = '<div class="exp-summary-sub">지난달보다 <span style="color:#E55643;font-weight:600;">' + diffAmount + ' 덜</span> 쓰는 중</div>';
    } else {
      paceHtml = '<div class="exp-summary-sub">지난달보다 <span style="color:#E55643;font-weight:600;">' + diffAmount + ' 더</span> 쓰는 중</div>';
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
    html += '<button class="exp-more-btn" onclick="showExpenseFullDetail(\'' + thisYM + '\')">내역 더 보기 →</button>';
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

  // ── maxY: 현재까지 데이터 + 전월 전체 중 최대값 ──
  var relevantVals = [1];
  for (var rv = 1; rv <= lastDataDay; rv++) {
    relevantVals.push(thisMonthCumulative[rv]);
    relevantVals.push(prevMonthCumulative[rv]);
  }
  for (var rv2 = lastDataDay + 1; rv2 <= daysInMonth; rv2++) {
    relevantVals.push(prevMonthCumulative[rv2]);
  }
  var maxY = Math.max.apply(null, relevantVals);

  // ── SVG 좌표계: viewBox 전체를 그래프에 사용 ──
  var width = 260, height = 150;
  var padTop = 6, padBottom = 20; // 상단 약간 여유, 하단 라벨 영역
  var graphLeft = 0, graphRight = width; // 좌우 끝까지
  var graphWidth = graphRight - graphLeft;
  var graphTop = padTop;
  var graphBottom = height - padBottom;
  var graphHeight = graphBottom - graphTop;

  var thisPoints = '', prevPoints = '';
  var thisFill = graphLeft + ',' + graphBottom + ' ';
  var prevFill = graphLeft + ',' + graphBottom + ' ';
  var dotX = 0, dotY = 0;

  for (var j = 1; j <= daysInMonth; j++) {
    var x = graphLeft + (j - 1) / (daysInMonth - 1) * graphWidth;
    var thisY = graphTop + graphHeight - (thisMonthCumulative[j] / maxY) * graphHeight;
    var prevY = graphTop + graphHeight - (prevMonthCumulative[j] / maxY) * graphHeight;

    if (j <= lastDataDay) {
      thisPoints += x + ',' + thisY + ' ';
      thisFill += x + ',' + thisY + ' ';
      dotX = x;
      dotY = thisY;
    }

    prevPoints += x + ',' + prevY + ' ';
    prevFill += x + ',' + prevY + ' ';
  }

  var lastThisX = graphLeft + (lastDataDay - 1) / (daysInMonth - 1) * graphWidth;
  thisFill += lastThisX + ',' + graphBottom;
  var lastPrevX = graphRight;
  prevFill += lastPrevX + ',' + graphBottom;

  var labelY = height - 4; // 라벨을 SVG 하단에 배치
  var startLabel = monthNum + '.1';
  var endLabel = monthNum + '.' + daysInMonth;
  var todayLabel = monthNum + '.' + lastDataDay;
  var todayLabelX = dotX;
  var startX = graphLeft;
  var endX = graphRight;

  return '<div class="exp-chart-wrap">'
    + '<svg class="exp-chart-svg" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">'
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
      + (t.isCurrent && t.ym === today().slice(0, 7) ? '<div class="exp-bar-projected">예상</div>' : '')
      + '<div class="exp-bar-value">' + Math.round(t.total / 10000) + '</div>'
      + '<div class="exp-bar-fill" style="height:' + Math.max(pct, 4) + '%"></div>'
      + '<div class="exp-bar-label">' + t.label + '</div>'
      + '</div>';
  });
  html += '</div>';
  return html;
}

function renderWeeklyCalendar(thisYM) {
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
    const avgDaily = getMonthTotal(today().slice(0, 7)) / new Date().getDate();
    const amountClass = total > avgDaily * 1.5 ? 'high' : '';
    const selectedClass = (_selectedExpenseDate === dateStr) ? ' exp-day-selected' : '';
    html += `<div class="exp-week-day ${isToday}${selectedClass}" onclick="toggleExpenseDaySelect('${dateStr}', function(){ reRenderDashboardA(); })">
      <div class="exp-week-day-num">${d.getDate()}</div>
      ${total > 0 ? `<div class="exp-week-day-amount ${amountClass}">${total.toLocaleString()}</div>` : ''}
    </div>`;
  }
  html += '</div></div>';

  // 주간 캘린더 아래 일별 내역 슬롯
  html += '<div id="expWeekDaySlot">';
  if (_selectedExpenseDate) {
    html += renderSelectedDayExpenses(_selectedExpenseDate);
  }
  html += '</div>';

  return html;
}

// ═══════════════════════════════════════
// 타임라인 공통 헬퍼
// ═══════════════════════════════════════

// 지출 항목 하나를 HTML로 생성
function renderExpenseItem(item, clickAction) {
  var html = '<div class="exp-tl-item" onclick="' + clickAction + '">';
  html += getMerchantIconHtml(item);
  html += '<div class="exp-tl-item-left">';
  html += '<span class="exp-tl-item-amount">' + item.amount.toLocaleString() + '원</span>';
  html += '<span class="exp-tl-item-sub">' + (item.merchant || '미분류');
  if (item.card) html += ' | ' + item.card;
  html += '</span>';
  html += '</div>';
  html += '</div>';
  return html;
}

// 날짜 그룹(헤더 + 항목 목록)을 HTML로 생성
function renderExpenseDateGroup(dateStr, items, getClickAction) {
  var dateObj = new Date(dateStr + 'T00:00:00');
  var dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var month = dateObj.getMonth() + 1;
  var day = dateObj.getDate();
  var dayName = dayNames[dateObj.getDay()];

  var html = '<div class="exp-tl-date-group">';
  html += '<div class="exp-tl-date-header">' + month + '월 ' + day + '일 ' + dayName + '</div>';
  items.forEach(function(item, idx) {
    html += renderExpenseItem(item, getClickAction(item));
    if (idx < items.length - 1) html += '<div class="exp-tl-item-divider"></div>';
  });
  html += '</div>';
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

  var html = '';

  dateOrder.forEach(function(dateStr) {
    html += renderExpenseDateGroup(dateStr, grouped[dateStr], function(item) {
      return window.innerWidth > 768
        ? 'openExpenseModal(\'' + item.id + '\')'
        : 'loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';
    });
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
  const monthExpenses = getMonthExpenses(yearMonth);
  const totalDaysWithExpense = new Set(monthExpenses.map(e => e.date)).size;
  const avgDaily = totalDaysWithExpense > 0 ? monthExpenses.reduce((s, e) => s + e.amount, 0) / totalDaysWithExpense : 0;
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${yearMonth}-${String(i).padStart(2,'0')}`;
    const total = getDayTotal(dateStr);
    const isToday = dateStr === today ? 'today' : '';
    const amountClass = total > avgDaily * 1.5 ? 'high' : '';
    var selectedClass = (_selectedExpenseDate === dateStr) ? ' exp-day-selected' : '';
    html += `<div class="exp-month-day ${isToday}${selectedClass}" onclick="toggleExpenseDaySelect('${dateStr}', reRenderDetail)">
      <div class="exp-month-day-num">${i}</div>
      ${total > 0 ? `<div class="exp-month-day-amount ${amountClass}">${total.toLocaleString()}</div>` : ''}
    </div>`;
  }

  html += '</div></div>';
  html += '<div id="expMonthDaySlot">';
  if (_selectedExpenseDate && _selectedExpenseDate.startsWith(yearMonth)) {
    html += renderSelectedDayExpenses(_selectedExpenseDate);
    html += '<div class="exp-section-gap"></div>';
  }
  html += '</div>';
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

  var html = '';

  dateOrder.forEach(function(dateStr) {
    html += renderExpenseDateGroup(dateStr, grouped[dateStr], function(item) {
      return useModal
        ? 'openExpenseModal(\'' + item.id + '\')'
        : 'loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';
    });
  });

  return html;
}

// ═══════════════════════════════════════
// 카테고리별 비율 차트 (수평 바)
// ═══════════════════════════════════════
function renderCategoryChart(catBreakdown) {
  if (!catBreakdown || catBreakdown.length === 0) return '';
  var maxAmount = catBreakdown[0].amount;
  var showCount = 4;
  var hasMore = catBreakdown.length > showCount;

  var html = '<div class="exp-category-chart">';
  html += '<div class="exp-category-title">카테고리별 지출</div>';

  var catChange = getTopCategoryChange(getExpenseViewYM());
  if (catChange) {
    var absDiff = formatAmount(Math.abs(catChange.diff));
    if (catChange.diff > 0) {
      html += '<div class="exp-category-sub">' + catChange.name + '이 지난달보다 <span style="color:#E55643;font-weight:600;">' + absDiff + '원 늘었어요</span></div>';
    } else {
      html += '<div class="exp-category-sub">' + catChange.name + '이 지난달보다 <span style="color:#5A8EC4;font-weight:600;">' + absDiff + '원 줄었어요</span></div>';
    }
  }

  // 항상 보이는 항목들
  catBreakdown.slice(0, showCount).forEach(function(cat, i) {
    var pct = (cat.amount / maxAmount) * 100;
    var opacity = Math.max(0.2, 1 - i * 0.12);
    html += '<div class="exp-category-row" onclick="openCategoryDetail(\'' + cat.id + '\',\'' + cat.name + '\')">'
      + '<div class="exp-category-name">' + cat.name + '</div>'
      + '<div class="exp-category-bar-wrap">'
      + '<div class="exp-category-bar" style="width:' + Math.max(pct, 3) + '%;background:#E55643;opacity:' + opacity + '"></div>'
      + '</div>'
      + '<div class="exp-category-amount">' + formatAmount(cat.amount) + '</div>'
      + '</div>';
  });

  // 더보기 항목들 (숨겨진 상태)
  if (hasMore) {
    html += '<div class="exp-category-more" style="display:none;">';
    catBreakdown.slice(showCount).forEach(function(cat, i) {
      var pct = (cat.amount / maxAmount) * 100;
      var opacity = Math.max(0.2, 1 - (i + showCount) * 0.12);
      html += '<div class="exp-category-row" onclick="openCategoryDetail(\'' + cat.id + '\',\'' + cat.name + '\')">'
        + '<div class="exp-category-name">' + cat.name + '</div>'
        + '<div class="exp-category-bar-wrap">'
        + '<div class="exp-category-bar" style="width:' + Math.max(pct, 3) + '%;background:#E55643;opacity:' + opacity + '"></div>'
        + '</div>'
        + '<div class="exp-category-amount">' + formatAmount(cat.amount) + '</div>'
        + '</div>';
    });
    html += '</div>';
    // 더보기/접기 버튼 — 항상 맨 아래
    html += '<div class="exp-cat-more-wrap">';
    html += '<button class="exp-cat-more-btn" onclick="toggleCategoryMore(this)">더보기</button>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function toggleCategoryMore(btn) {
  var moreDiv = btn.parentElement.previousElementSibling;
  if (!moreDiv || !moreDiv.classList.contains('exp-category-more')) return;
  if (moreDiv.style.display === 'none') {
    moreDiv.style.display = 'block';
    btn.textContent = '접기';
  } else {
    moreDiv.style.display = 'none';
    btn.textContent = '더보기';
  }
}

function openCategoryDetail(catId, catName) {
  _expenseCategoryFilter = catId;
  _expenseCategoryFilterName = catName;
  var ym = getExpenseViewYM();
  showExpenseFullDetail(ym);
}

function clearCategoryFilter() {
  _expenseCategoryFilter = null;
  _expenseCategoryFilterName = null;
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
  modal.classList.add('open');
}

function closeExpenseModal() {
  const modal = document.getElementById('expenseModalOverlay');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
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
  _selectedExpenseDate = null;
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
      showExpenseDashboardFromDetail();
      renderExpenseDashboard('mobile');
    } else {
      showExpenseFullDetail(_expenseViewYM);
    }
  }
}

// ═══════════════════════════════════════
// A ↔ B 전환 함수
// ═══════════════════════════════════════
function showExpenseFullDetail(yearMonth) {
  if (window.innerWidth > 768) {
    var dashPane = document.getElementById('expFullDashboardPane');
    var detailPane = document.getElementById('expFullDetailPane');
    if (dashPane) dashPane.style.display = 'none';
    if (detailPane) detailPane.style.display = 'block';
    renderExpenseFullDetail(yearMonth);
  } else {
    var dashboard = document.getElementById('pane-expense-dashboard');
    var detail = document.getElementById('pane-expense-detail');
    if (dashboard) dashboard.style.display = 'none';
    if (detail) detail.style.display = 'flex';
    renderExpenseFullDetailMobile(yearMonth);
  }
}
// gesture.js 호환 래퍼
function showExpenseFullDetailMobile(ym) { showExpenseFullDetail(ym); }

function showExpenseDashboardFromDetail() {
  _expenseViewYM = today().slice(0, 7);
  clearCategoryFilter();
  if (window.innerWidth > 768) {
    var dashPane = document.getElementById('expFullDashboardPane');
    var detailPane = document.getElementById('expFullDetailPane');
    if (dashPane) dashPane.style.display = 'block';
    if (detailPane) detailPane.style.display = 'none';
    renderExpenseDashboard('pc');
  } else {
    var dashboard = document.getElementById('pane-expense-dashboard');
    var detail = document.getElementById('pane-expense-detail');
    if (detail) detail.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    renderExpenseDashboard('mobile');
  }
}

// ═══════════════════════════════════════
// B. 전체 내역 렌더 (전체 내역 페이지)
// ═══════════════════════════════════════
var _expenseDetailSearchQuery = '';
var _selectedExpenseDate = null;
var _expenseCategoryFilter = null;
var _expenseCategoryFilterName = null;

function renderExpenseFullDetail(yearMonth) {
  var container = document.getElementById('expFullDetailPane');
  if (!container) return;

  // 월 헤더를 상단 네비에 렌더링
  var detailParts = yearMonth.split('-');
  var detailMo = parseInt(detailParts[1]);
  var detailIsNow = (yearMonth === today().slice(0, 7));
  var detailTopbarNav = renderExpenseMonthNav(yearMonth);

  var html = '';

  var monthTotal = getMonthTotal(yearMonth);
  var d = new Date(yearMonth + '-01');
  var monthNum = d.getMonth() + 1;
  var nowYM = today().slice(0, 7);

  if (_expenseCategoryFilter) {
    // 카테고리 필터 활성 — 해당 카테고리 합계 계산
    var catEntries = getMonthExpenses(yearMonth).filter(function(e) { return e.category === _expenseCategoryFilter; });
    var catTotal = catEntries.reduce(function(s, e) { return s + e.amount; }, 0);
    html += '<div class="exp-summary" style="padding:8px 20px 12px;">';
    html += '<div class="exp-summary-title">' + (_expenseCategoryFilterName || '') + ' ' + formatAmount(catTotal) + '원</div>';
    html += '<div style="margin-top:8px;"><button class="exp-more-btn" style="margin:0;padding:6px 16px;font-size:13px;" onclick="clearCategoryFilter();renderExpenseFullDetail(\'' + yearMonth + '\')">전체 내역 보기</button></div>';
    html += '</div>';
  } else if (yearMonth === nowYM) {
    html += '<div class="exp-summary" style="padding:8px 20px 12px;"><div class="exp-summary-title">이번 달 ' + formatAmount(monthTotal) + '원</div></div>';
  } else {
    html += '<div class="exp-summary" style="padding:8px 20px 12px;"><div class="exp-summary-title">' + monthNum + '월에 ' + formatAmount(monthTotal) + '원 썼어요</div></div>';
  }

  // 월간 캘린더
  html += renderMonthCalendar(yearMonth);

  // 전체 타임라인
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

  // 카테고리 필터
  if (_expenseCategoryFilter) {
    entries = entries.filter(function(e) { return e.category === _expenseCategoryFilter; });
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

  var html = '';

  dateOrder.forEach(function(dateStr) {
    html += renderExpenseDateGroup(dateStr, grouped[dateStr], function(item) {
      return window.innerWidth > 768
        ? 'openExpenseModal(\'' + item.id + '\')'
        : 'loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';
    });
  });

  return html;
}

function filterExpenseDetail(query) {
  _expenseDetailSearchQuery = query;
  if (window.innerWidth > 768) {
    var timelineWrap = document.querySelector('.exp-full-timeline-wrap');
    if (timelineWrap) timelineWrap.innerHTML = renderExpenseFullTimeline(getExpenseViewYM(), query);
  } else {
    var wrap = document.getElementById('expMobileTimeline');
    if (wrap) wrap.innerHTML = renderExpenseFullTimeline(getExpenseViewYM(), query);
  }
}


function renderExpenseFullDetailMobile(yearMonth) {
  var container = document.getElementById('expenseDetail');
  if (!container) return;

  // 월 헤더를 상단 네비에 렌더링
  renderExpenseMonthNav(yearMonth);

  var html = '';

  var monthTotal = getMonthTotal(yearMonth);
  var d = new Date(yearMonth + '-01');
  var monthNum = d.getMonth() + 1;
  var nowYM = today().slice(0, 7);

  if (_expenseCategoryFilter) {
    // 카테고리 필터 활성 — 해당 카테고리 합계 계산
    var catEntries = getMonthExpenses(yearMonth).filter(function(e) { return e.category === _expenseCategoryFilter; });
    var catTotal = catEntries.reduce(function(s, e) { return s + e.amount; }, 0);
    html += '<div class="exp-summary" style="padding:8px 20px 12px;">';
    html += '<div class="exp-summary-title">' + (_expenseCategoryFilterName || '') + ' ' + formatAmount(catTotal) + '원</div>';
    html += '<div style="margin-top:8px;"><button class="exp-more-btn" style="margin:0;padding:6px 16px;font-size:13px;" onclick="clearCategoryFilter();renderExpenseFullDetailMobile(\'' + yearMonth + '\')">전체 내역 보기</button></div>';
    html += '</div>';
  } else if (yearMonth === nowYM) {
    html += '<div class="exp-summary" style="padding:8px 20px 12px;"><div class="exp-summary-title">이번 달 ' + formatAmount(monthTotal) + '원</div></div>';
  } else {
    html += '<div class="exp-summary" style="padding:8px 20px 12px;"><div class="exp-summary-title">' + monthNum + '월에 ' + formatAmount(monthTotal) + '원 썼어요</div></div>';
  }

  // 월간 캘린더
  html += renderMonthCalendar(yearMonth);

  // 전체 타임라인
  html += '<div id="expMobileTimeline">';
  html += renderExpenseFullTimeline(yearMonth, '');
  html += '</div>';

  // 이전 월 버튼
  var prevD = new Date(yearMonth + '-01');
  prevD.setMonth(prevD.getMonth() - 1);
  var prevYM = prevD.getFullYear() + '-' + String(prevD.getMonth() + 1).padStart(2, '0');
  var prevLabel = prevD.getFullYear() + '년 ' + (prevD.getMonth() + 1) + '월';
  html += '<div style="padding:20px 0;text-align:center">';
  html += '<button class="exp-more-btn" onclick="showExpenseFullDetail(\'' + prevYM + '\')">' + prevLabel + ' 내역 →</button>';
  html += '</div>';

  container.innerHTML = html;
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
      showExpenseDashboardFromDetail();
      renderExpenseDashboard('mobile');
    } else {
      showExpenseFullDetail(ym);
    }
  }
}

// ═══════════════════════════════════════
// 월 헤더 렌더링 (상단 네비 바)
// ═══════════════════════════════════════
function renderExpenseMonthNav(yearMonth) {
  var parts = yearMonth.split('-');
  var mo = parseInt(parts[1]);
  var nowYM = today().slice(0, 7);
  var isNow = (yearMonth === nowYM);

  var navHtml = '<div class="exp-month-nav-inline" id="expenseMonthNavInline">'
    + '<button class="exp-month-nav-btn" onclick="changeExpenseMonth(-1)">'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '<span class="exp-month-nav-label" onclick="openMonthPicker()" style="cursor:pointer;">' + mo + '월</span>'
    + '<button class="exp-month-nav-btn' + (isNow ? ' exp-nav-disabled' : '') + '"'
    + (isNow ? '' : ' onclick="changeExpenseMonth(1)"') + '>'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '</div>';

  // 기존 네비 제거
  document.querySelectorAll('#expenseMonthNavInline').forEach(function(el) { el.remove(); });

  var w = window.innerWidth;
  if (w <= 768) {
    // 모바일: lp-hdr 센터에 삽입
    var tabLabel = document.getElementById('edTabLabel');
    if (tabLabel) tabLabel.style.display = 'none';
    var lpHdr = document.querySelector('.lp-hdr');
    if (lpHdr) {
      lpHdr.insertAdjacentHTML('beforeend', navHtml);
    }
    return true;
  } else {
    // PC/태블릿: ed-topbar 센터에 삽입
    var tabLabel = document.getElementById('edTabLabel');
    if (tabLabel) tabLabel.style.display = 'none';
    var topbar = document.querySelector('.ed-topbar');
    if (topbar) {
      var leftEl = topbar.querySelector('.ed-topbar-left');
      if (leftEl) leftEl.insertAdjacentHTML('afterend', navHtml);
    }
    return true;
  }
}

function renderSelectedDayExpenses(dateStr) {
  var expenses = getDayExpenses(dateStr).sort(function(a, b) {
    return (b.time || '').localeCompare(a.time || '');
  });
  if (expenses.length === 0) return '';

  var dateObj = new Date(dateStr + 'T00:00:00');
  var dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var month = dateObj.getMonth() + 1;
  var day = dateObj.getDate();
  var dayName = dayNames[dateObj.getDay()];
  var dayTotal = expenses.reduce(function(s, e) { return s + e.amount; }, 0);

  var html = '<div class="exp-day-detail">';
  html += '<div class="exp-tl-date-group">';
  html += '<div class="exp-tl-date-header">' + month + '월 ' + day + '일 ' + dayName + '</div>';

  expenses.forEach(function(item, idx) {
    var clickAction = window.innerWidth > 768
      ? 'openExpenseModal(\'' + item.id + '\')'
      : 'loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';
    html += renderExpenseItem(item, clickAction);
    if (idx < expenses.length - 1) html += '<div class="exp-tl-item-divider"></div>';
  });

  html += '</div>';
  html += '</div>';
  return html;
}

function toggleExpenseDaySelect(dateStr, rerenderFn) {
  if (_selectedExpenseDate === dateStr) {
    _selectedExpenseDate = null;
  } else {
    _selectedExpenseDate = dateStr;
  }
  rerenderFn();
}

function reRenderDashboardA() {
  var platform = window.innerWidth > 768 ? 'pc' : 'mobile';
  renderExpenseDashboard(platform);
}

function reRenderDetail() {
  var ym = getExpenseViewYM();
  if (window.innerWidth > 768) {
    renderExpenseFullDetail(ym);
  } else {
    renderExpenseFullDetailMobile(ym);
  }
}
// gesture.js 호환 래퍼
function reRenderDetailPC()     { reRenderDetail(); }
function reRenderDetailMobile() { reRenderDetail(); }

// ═══════════════════════════════════════
// 가계부 입력 폼 로직 (editor.js에서 이동)
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// 가계부 폼 로직
// ═══════════════════════════════════════

let curExpenseId = null;

function newExpenseForm(mode = 'normal') {
  curExpenseId = null;
  // 모바일 에디터: 가계부 폼 활성 클래스 추가
  if (mode === 'normal') {
    var editorEl = document.querySelector('.editor');
    if (editorEl) editorEl.classList.add('expense-edit-active');
  }
  const suffix = mode === 'modal' ? 'Modal' : '';
  document.getElementById('expenseAmountInput' + suffix).value = '';
  document.getElementById('expenseMerchantInput' + suffix).value = '';
  document.getElementById('expenseCardInput' + suffix).value = '';
  document.getElementById('expenseIconKeyword' + suffix).value = '';
  document.getElementById('expenseIconUrl' + suffix).value = '';
  // 상단 휴지통 버튼 숨기기
  var trashBtn = document.getElementById(mode === 'modal' ? 'expenseTrashBtnModal' : 'expenseTrashBtn');
  if (trashBtn) trashBtn.style.display = 'none';
  const now = new Date();
  document.getElementById('expenseDateValue' + suffix).textContent = formatExpenseDate(now);
  clearCategorySelection(mode);
  updateExpenseSaveBtn(mode);
}

function loadExpense(id, mode = 'normal') {
  // 모바일 에디터: 가계부 폼 활성 클래스 추가
  if (mode === 'normal') {
    var editorEl = document.querySelector('.editor');
    if (editorEl) editorEl.classList.add('expense-edit-active');
  }
  const e = getExpenses().find(x => x.id === id);
  if (!e) return;
  curExpenseId = id;
  const suffix = mode === 'modal' ? 'Modal' : '';
  document.getElementById('expenseAmountInput' + suffix).value = e.amount.toLocaleString();
  document.getElementById('expenseMerchantInput' + suffix).value = e.merchant;
  document.getElementById('expenseCardInput' + suffix).value = e.card;
  const d = new Date(e.date + 'T' + (e.time || '00:00'));
  document.getElementById('expenseDateValue' + suffix).textContent = formatExpenseDate(d);
  selectCategory(e.category, mode);

  // 아이콘 매핑 자동 채우기
  var existingIcon = findMerchantIcon(e.merchant);
  if (existingIcon) {
    var icons = getMerchantIcons();
    icons.sort(function(a, b) { return b.keyword.length - a.keyword.length; });
    for (var mi = 0; mi < icons.length; mi++) {
      if (e.merchant.indexOf(icons[mi].keyword) !== -1) {
        document.getElementById('expenseIconKeyword' + suffix).value = icons[mi].keyword;
        document.getElementById('expenseIconUrl' + suffix).value = icons[mi].icon;
        break;
      }
    }
  } else {
    document.getElementById('expenseIconKeyword' + suffix).value = '';
    document.getElementById('expenseIconUrl' + suffix).value = '';
  }

  // 기존 항목이므로 상단 휴지통 버튼 표시
  var trashBtn = document.getElementById(mode === 'modal' ? 'expenseTrashBtnModal' : 'expenseTrashBtn');
  if (trashBtn) trashBtn.style.display = 'flex';

  updateExpenseSaveBtn(mode);
}

function deleteExpenseFromForm(mode = 'normal') {
  if (!curExpenseId) {
    alert('삭제할 항목이 없습니다.');
    return;
  }
  if (!confirm('정말 삭제하시겠습니까?')) return;
  delExpense(curExpenseId);
  curExpenseId = null;

  // 상단 휴지통 숨기기
  var trashBtn = document.getElementById(mode === 'modal' ? 'expenseTrashBtnModal' : 'expenseTrashBtn');
  if (trashBtn) trashBtn.style.display = 'none';

  if (mode === 'modal') {
    closeExpenseModal();
    // 대시보드 갱신
    if (window.innerWidth > 768) {
      renderExpenseDashboard('pc');
    }
  } else {
    // 모바일: 대시보드 갱신 후 리스트 뷰로
    var editorEl = document.querySelector('.editor');
    if (editorEl) editorEl.classList.remove('expense-edit-active');
    renderExpenseDashboard('mobile');
    setMobileView('list');
  }

  updateExpenseCompact();
  SYNC.scheduleDatabaseSave();
}

function formatExpenseAmount(input) {
  let val = input.value.replace(/[^\d]/g, '');
  if (val) input.value = parseInt(val).toLocaleString();
  else input.value = '';
  updateExpenseSaveBtn();
}

function renderExpenseCategoryGrid(mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (!grid) return;
  grid.innerHTML = EXPENSE_CATEGORIES.map(c =>
    `<button class="expense-cat-btn" data-cat="${c.id}" data-mode="${mode}" onclick="selectCategory('${c.id}', '${mode}')">
      <span class="expense-cat-name">${c.name}</span>
    </button>`
  ).join('');
}

function selectCategory(catId, mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (!grid) return;
  const btns = grid.querySelectorAll('.expense-cat-btn');
  btns.forEach(btn => {
    const isSelected = btn.getAttribute('data-cat') === catId;
    btn.classList.toggle('selected', isSelected);
    btn.style.borderColor = '';
  });
}

function getSelectedCategory(mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (!grid) return 'etc';
  const sel = grid.querySelector('.expense-cat-btn.selected');
  return sel ? sel.getAttribute('data-cat') : 'etc';
}

function clearCategorySelection(mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (!grid) return;
  const btns = grid.querySelectorAll('.expense-cat-btn');
  btns.forEach(btn => {
    btn.classList.remove('selected');
    btn.style.borderColor = '';
  });
}

function formatExpenseDate(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}월 ${day}일 ${h}:${min}`;
}

function parseExpenseDateText(text) {
  const match = text.match(/(\d+)월\s*(\d+)일\s*(\d+):(\d+)/);
  if (!match) return { date: today(), time: '' };
  const y = new Date().getFullYear();
  const m = match[1].padStart(2, '0');
  const d = match[2].padStart(2, '0');
  return { date: `${y}-${m}-${d}`, time: `${match[3].padStart(2, '0')}:${match[4]}` };
}

function updateExpenseSaveBtn(mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const val = document.getElementById('expenseAmountInput' + suffix).value.replace(/,/g, '');
  const btn = document.getElementById('expenseSaveBtn' + suffix);
  if (btn) {
    const hasAmount = parseInt(val) > 0;
    btn.disabled = !hasAmount;
    btn.style.opacity = hasAmount ? '1' : '0.4';
  }
}


function openExpenseDatePicker() {
  // TODO: 날짜 선택 모달 (현재는 간단히 일반 input date 사용 가능)
  alert('날짜 선택 기능은 추후 구현됩니다.');
}

var _smsPasteMode = 'normal';

async function pasteFromClipboard(mode) {
  _smsPasteMode = mode || 'normal';
  var suffix = _smsPasteMode === 'modal' ? 'Modal' : '';
  try {
    var text = await navigator.clipboard.readText();
    if (!text || !text.trim()) {
      alert('클립보드가 비어 있습니다.\n카드 문자를 먼저 복사해주세요.');
      return;
    }
    var parsed = parseSMS(text.trim());
    if (!parsed) {
      alert('카드 문자 형식을 인식할 수 없습니다.\n직접 입력해주세요.');
      return;
    }
    document.getElementById('expenseAmountInput' + suffix).value = parsed.amount.toLocaleString();
    document.getElementById('expenseMerchantInput' + suffix).value = parsed.merchant;
    document.getElementById('expenseCardInput' + suffix).value = parsed.card;
    if (parsed.date) {
      var d = new Date(parsed.date + 'T' + (parsed.time || '00:00'));
      document.getElementById('expenseDateValue' + suffix).textContent = formatExpenseDate(d);
    }
    selectCategory(parsed.category, _smsPasteMode);
    updateExpenseSaveBtn(_smsPasteMode);
  } catch (err) {
    alert('클립보드를 읽을 수 없습니다.\n브라우저 권한을 확인해주세요.');
  }
}

function saveExpenseForm(mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const amountStr = document.getElementById('expenseAmountInput' + suffix).value.replace(/,/g, '');
  const amount = parseInt(amountStr);
  if (!amount || amount <= 0) return;

  const merchant = document.getElementById('expenseMerchantInput' + suffix).value.trim();
  const card = document.getElementById('expenseCardInput' + suffix).value.trim();
  const memo = '';
  const category = getSelectedCategory(mode);
  const dateText = document.getElementById('expenseDateValue' + suffix).textContent;
  const { date, time } = parseExpenseDateText(dateText);

  if (curExpenseId) {
    updateExpense(curExpenseId, { amount, category, merchant, card, memo, date, time });
  } else {
    newExpense({ amount, category, merchant, card, memo, date, time, source: 'manual' });
  }

  // 매출처 아이콘 매핑 저장
  var iconKeyword = document.getElementById('expenseIconKeyword' + suffix).value.trim();
  var iconUrl = document.getElementById('expenseIconUrl' + suffix).value.trim();
  if (iconKeyword && iconUrl) {
    saveMerchantIcon(iconKeyword, iconUrl);
    SYNC.scheduleDatabaseSave();
  }

  // UI 업데이트 및 정리
  updateExpenseCompact();
  SYNC.scheduleDatabaseSave();

  if (mode === 'modal') {
    // 모달: 닫고 대시보드 갱신
    closeExpenseModal();
    if (window.innerWidth > 768) {
      renderExpenseDashboard('pc');
    }
    return;
  } else if (window.innerWidth <= 768) {
    // 모바일: 대시보드 화면으로 전환
    var editorEl = document.querySelector('.editor');
    if (editorEl) editorEl.classList.remove('expense-edit-active');
    renderExpenseDashboard('mobile');
    setMobileView('list');
  } else {
    // PC 에디터: 폼 초기화
    newExpenseForm();
  }
}
