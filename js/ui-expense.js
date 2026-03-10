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
  var thisMonthTotal = getMonthTotal(thisYM);
  var totalDisplay = thisMonthTotal > 0 ? formatAmount(thisMonthTotal) + '원' : '0원';
  var nowYM = today().slice(0, 7);
  var isCurrentMonth = (thisYM === nowYM);

  // 월 헤더를 상단 네비에 렌더링
  renderExpenseMonthNav(thisYM);

  if (platform === 'pc') {
    // ═══ PC/태블릿: 단일 스크롤 통합 대시보드 ═══
    var html = '';
    var nowYM = today().slice(0, 7);
    var isCurrentMonth = (thisYM === nowYM);
    var ymDate = new Date(thisYM + '-01');
    var monthNum = ymDate.getMonth() + 1;
    var daysInMonth = new Date(ymDate.getFullYear(), ymDate.getMonth() + 1, 0).getDate();

    // 하루 평균 계산
    var dailyAvg = 0;
    if (isCurrentMonth) {
      var todayDay = new Date().getDate();
      dailyAvg = todayDay > 0 ? Math.round(thisMonthTotal / todayDay) : 0;
    } else {
      dailyAvg = daysInMonth > 0 ? Math.round(thisMonthTotal / daysInMonth) : 0;
    }

    // ── 섹션 1: 요약 텍스트 (1열) ──
    html += '<div class="exp-summary">';
    if (isCurrentMonth) {
      html += '<div class="exp-summary-title">' + monthNum + '월에는 <span style="color:#E55643;">' + totalDisplay + '</span> 쓰고 있어요</div>';
      html += '<div class="exp-summary-sub">하루 평균 <span style="color:#E55643;">' + dailyAvg.toLocaleString() + '원</span> 쓰고 있어요</div>';
    } else {
      html += '<div class="exp-summary-title">' + monthNum + '월에는 <span style="color:#E55643;">' + totalDisplay + '</span> 썼어요</div>';
      html += '<div class="exp-summary-sub">하루 평균 <span style="color:#E55643;">' + dailyAvg.toLocaleString() + '원</span> 썼어요</div>';
    }
    html += '</div>';

    // ── 섹션 2: 월간 캘린더 (1열, 컴팩트) ──
    html += '<div class="exp-pc-calendar-wrap">';
    html += renderMonthCalendar(thisYM);
    html += '</div>';

    // ── 섹션 3: 월간 상호별 랭킹 (히어로 1위 + 그리드 2~7위) ──
    var merchantBreakdown = getMerchantBreakdown(thisYM);
    if (merchantBreakdown.length > 0) {
      html += '<div class="exp-section-gap"></div>';
      html += renderMonthlyMerchantHero(merchantBreakdown, thisYM, isCurrentMonth, monthNum);
    }

    // ── 섹션 4: 월별 막대 차트 (1열) ──
    var trendCount = window.innerWidth > 1400 ? 10 : 8;
    var trend = isCurrentMonth ? getMonthlyTrend(trendCount) : getMonthlyTrendAround(thisYM);
    html += '<div class="exp-section-gap"></div>';
    html += '<div class="exp-projection">';
    html += renderMonthlyBarChart(trend);
    html += '</div>';

    // ── 섹션 5: 연간 누적 (단순 리스트, 5위까지 + 더보기) ──
    var currentYear = ymDate.getFullYear();
    var yearlyHtml = renderYearlySection(currentYear);
    if (yearlyHtml) {
      html += '<div class="exp-section-gap"></div>';
      html += '<div style="padding:0 20px;">';
      html += yearlyHtml;
      html += '</div>';
    }

    container.innerHTML = html;

  } else {
    // ═══ 모바일: PC와 동일 구성 ═══
    var html = '';
    var ymDate = new Date(thisYM + '-01');
    var monthNum = ymDate.getMonth() + 1;
    var daysInMonth = new Date(ymDate.getFullYear(), ymDate.getMonth() + 1, 0).getDate();

    // 하루 평균 계산
    var dailyAvg = 0;
    if (isCurrentMonth) {
      var todayDay = new Date().getDate();
      dailyAvg = todayDay > 0 ? Math.round(thisMonthTotal / todayDay) : 0;
    } else {
      dailyAvg = daysInMonth > 0 ? Math.round(thisMonthTotal / daysInMonth) : 0;
    }

    // ── 섹션 1: 요약 텍스트 ──
    html += '<div class="exp-summary">';
    if (isCurrentMonth) {
      html += '<div class="exp-summary-title">' + monthNum + '월에는 <span style="color:#E55643;">' + totalDisplay + '</span> 쓰고 있어요</div>';
      html += '<div class="exp-summary-sub">하루 평균 <span style="color:#E55643;">' + dailyAvg.toLocaleString() + '원</span> 쓰고 있어요</div>';
    } else {
      html += '<div class="exp-summary-title">' + monthNum + '월에는 <span style="color:#E55643;">' + totalDisplay + '</span> 썼어요</div>';
      html += '<div class="exp-summary-sub">하루 평균 <span style="color:#E55643;">' + dailyAvg.toLocaleString() + '원</span> 썼어요</div>';
    }
    html += '</div>';

    // ── 섹션 2: 월간 캘린더 ──
    html += '<div class="exp-pc-calendar-wrap">';
    html += renderMonthCalendar(thisYM, 'reRenderDashboardA');
    html += '</div>';

    // ── 섹션 3: 월간 상호별 랭킹 ──
    var merchantBreakdown = getMerchantBreakdown(thisYM);
    if (merchantBreakdown.length > 0) {
      html += '<div class="exp-section-gap"></div>';
      html += renderMonthlyMerchantHero(merchantBreakdown, thisYM, isCurrentMonth, monthNum);
    }

    // ── 섹션 4: 월별 막대 차트 ──
    var trend = isCurrentMonth ? getMonthlyTrend(6) : getMonthlyTrendAround(thisYM);
    html += '<div class="exp-section-gap"></div>';
    html += '<div class="exp-projection">';
    html += renderMonthlyBarChart(trend);
    html += '</div>';

    // ── 섹션 5: 연간 누적 ──
    var currentYear = ymDate.getFullYear();
    var yearlyHtml = renderYearlySection(currentYear);
    if (yearlyHtml) {
      html += '<div class="exp-section-gap"></div>';
      html += '<div style="padding:0 4px;">';
      html += yearlyHtml;
      html += '</div>';
    }

    container.innerHTML = html;
  }
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
  var showPrevLine = isCurrentMonth; // 과거 월이면 전월선 숨김

  var thisMonthCumulative = {};
  var prevMonthCumulative = {};
  var thisSum = 0, prevSum = 0;

  for (var i = 1; i <= daysInMonth; i++) {
    var d = yearMonth + '-' + String(i).padStart(2,'0');
    thisSum += getDayTotal(d);
    thisMonthCumulative[i] = thisSum;

    if (showPrevLine) {
      var prevD = prevYM + '-' + String(i).padStart(2,'0');
      var prevDayTotal = prevMonthExpenses.reduce(function(s, e) { return e.date === prevD ? s + e.amount : s; }, 0);
      prevSum += prevDayTotal;
      prevMonthCumulative[i] = prevSum;
    }
  }

  // maxY 계산
  var relevantVals = [1];
  for (var rv = 1; rv <= lastDataDay; rv++) {
    relevantVals.push(thisMonthCumulative[rv]);
    if (showPrevLine) relevantVals.push(prevMonthCumulative[rv]);
  }
  if (showPrevLine) {
    for (var rv2 = lastDataDay + 1; rv2 <= daysInMonth; rv2++) {
      relevantVals.push(prevMonthCumulative[rv2]);
    }
  }
  var maxY = Math.max.apply(null, relevantVals);

  var width = 260, height = 150;
  var padTop = 6, padBottom = 20;
  var graphLeft = 0, graphRight = width;
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

    if (j <= lastDataDay) {
      thisPoints += x + ',' + thisY + ' ';
      thisFill += x + ',' + thisY + ' ';
      dotX = x;
      dotY = thisY;
    }

    if (showPrevLine) {
      var prevY = graphTop + graphHeight - (prevMonthCumulative[j] / maxY) * graphHeight;
      prevPoints += x + ',' + prevY + ' ';
      prevFill += x + ',' + prevY + ' ';
    }
  }

  var lastThisX = graphLeft + (lastDataDay - 1) / (daysInMonth - 1) * graphWidth;
  thisFill += lastThisX + ',' + graphBottom;
  if (showPrevLine) {
    prevFill += graphRight + ',' + graphBottom;
  }

  var labelY = height - 4;
  var startLabel = monthNum + '.1';
  var endLabel = monthNum + '.' + daysInMonth;
  var todayLabel = monthNum + '.' + lastDataDay;
  var todayLabelX = dotX;

  var svgHtml = '<svg class="exp-chart-svg" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">'
    + '<defs>'
    + '<linearGradient id="thisMonthGrad" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#E55643" stop-opacity="0.25"/>'
    + '<stop offset="100%" stop-color="#E55643" stop-opacity="0.02"/>'
    + '</linearGradient>'
    + '<linearGradient id="prevMonthGrad" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#C8C8C8" stop-opacity="0.2"/>'
    + '<stop offset="100%" stop-color="#C8C8C8" stop-opacity="0.02"/>'
    + '</linearGradient>'
    + '</defs>';

  if (showPrevLine) {
    svgHtml += '<polygon points="' + prevFill + '" fill="url(#prevMonthGrad)"/>';
    svgHtml += '<polyline points="' + prevPoints + '" fill="none" stroke="#D0D0D0" stroke-width="1.5"/>';
  }

  svgHtml += '<polygon points="' + thisFill + '" fill="url(#thisMonthGrad)"/>';
  svgHtml += '<polyline points="' + thisPoints + '" fill="none" stroke="#E55643" stroke-width="2"/>';

  if (isCurrentMonth) {
    svgHtml += '<circle cx="' + dotX + '" cy="' + dotY + '" r="7" fill="#E55643" opacity="0.2"/>';
    svgHtml += '<circle cx="' + dotX + '" cy="' + dotY + '" r="4" fill="#E55643"/>';
  }

  svgHtml += '<text x="' + graphLeft + '" y="' + labelY + '" font-size="10" fill="#aaa" font-family="Pretendard,sans-serif" text-anchor="start">' + startLabel + '</text>';
  if (isCurrentMonth && lastDataDay < daysInMonth) {
    svgHtml += '<text x="' + todayLabelX + '" y="' + labelY + '" font-size="10" fill="#E55643" font-weight="600" font-family="Pretendard,sans-serif" text-anchor="middle">' + todayLabel + '</text>';
  }
  svgHtml += '<text x="' + graphRight + '" y="' + labelY + '" font-size="10" fill="#aaa" font-family="Pretendard,sans-serif" text-anchor="end">' + endLabel + '</text>';
  svgHtml += '</svg>';

  // 범례
  var legendHtml = '<div class="exp-chart-legend">';
  legendHtml += '<span><span class="exp-chart-legend-dot" style="background:#E55643;"></span>' + monthNum + '월</span>';
  if (showPrevLine) {
    legendHtml += '<span><span class="exp-chart-legend-dot" style="background:#D0D0D0;"></span>' + (new Date(prevYM + '-01').getMonth() + 1) + '월</span>';
  }
  legendHtml += '</div>';

  return '<div class="exp-chart-wrap">' + svgHtml + legendHtml + '</div>';
}

function renderMonthlyBarChart(trend) {
  var maxTotal = Math.max.apply(null, trend.map(function(t) { return t.total; }).concat([1]));
  var projected = getProjectedMonthTotal();
  var nowYM = today().slice(0, 7);
  var html = '<div class="exp-bar-chart">';
  trend.forEach(function(t) {
    var pct = (t.total / maxTotal) * 100;
    var isCurrentClass = t.isCurrent ? 'current' : '';
    var isCurrentMonth = (t.ym === nowYM);
    html += '<div class="exp-bar-item ' + isCurrentClass + '" onclick="_onBarChartClick(\'' + t.ym + '\')" style="cursor:pointer;">';
    if (isCurrentMonth && t.isCurrent) {
      html += '<div class="exp-bar-projected">예상 ' + Math.round(projected / 10000) + '만</div>';
    }
    html += '<div class="exp-bar-value">' + Math.round(t.total / 10000) + '</div>';
    html += '<div class="exp-bar-fill" style="height:' + Math.max(pct, 4) + '%"></div>';
    html += '<div class="exp-bar-label">' + t.label + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function _onBarChartClick(ym) {
  _expenseViewYM = ym;
  if (window.innerWidth > 768) {
    // PC/태블릿: 통합 대시보드 다시 렌더 (B화면 진입 차단)
    var dashPane = document.getElementById('expFullDashboardPane');
    var detailPane = document.getElementById('expFullDetailPane');
    if (dashPane) dashPane.style.display = 'block';
    if (detailPane) detailPane.style.display = 'none';
    renderExpenseDashboard('pc');
  } else {
    // 모바일: 기존 B화면 동작
    showExpenseFullDetail(ym);
  }
}

function renderWeeklyCalendar(thisYM) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);

  let html = '<div class="exp-week-cal"><div class="exp-week-grid">';
  html += '<div class="exp-week-dow-row">';
  html += '<div class="exp-week-dow">일</div><div class="exp-week-dow">월</div><div class="exp-week-dow">화</div>';
  html += '<div class="exp-week-dow">수</div><div class="exp-week-dow">목</div><div class="exp-week-dow">금</div><div class="exp-week-dow">토</div>';
  html += '</div>';

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
  var html = '<div class="exp-tl-item" data-expense-id="' + item.id + '" onclick="' + clickAction + '">';
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

function renderMonthCalendar(yearMonth, rerenderFnName) {
  if (!rerenderFnName) rerenderFnName = 'reRenderDetail';
  const d = new Date(yearMonth + '-01');
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  var isPC = window.innerWidth > 768;

  let html = '<div class="exp-month-cal"><div class="exp-month-grid">';
  html += '<div class="exp-month-dow-row">';
  html += '<div class="exp-month-dow">일</div><div class="exp-month-dow">월</div><div class="exp-month-dow">화</div>';
  html += '<div class="exp-month-dow">수</div><div class="exp-month-dow">목</div><div class="exp-month-dow">금</div><div class="exp-month-dow">토</div>';
  html += '</div>';

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="exp-month-day empty"></div>';
  }

  const now = new Date();
  const todayStr = getLocalYMD(now);
  const monthExpenses = getMonthExpenses(yearMonth);
  const totalDaysWithExpense = new Set(monthExpenses.map(e => e.date)).size;
  const avgDaily = totalDaysWithExpense > 0 ? monthExpenses.reduce((s, e) => s + e.amount, 0) / totalDaysWithExpense : 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${yearMonth}-${String(i).padStart(2,'0')}`;
    const total = getDayTotal(dateStr);
    const isToday = dateStr === todayStr ? 'today' : '';
    const amountClass = total > avgDaily * 1.5 ? 'high' : '';

    if (isPC) {
      // PC/태블릿: 플로팅 팝업 방식
      html += `<div class="exp-month-day ${isToday}" onclick="onExpCalDayClick(event, '${dateStr}')">
        <div class="exp-month-day-num">${i}</div>
        ${total > 0 ? `<div class="exp-month-day-amount ${amountClass}">${total.toLocaleString()}</div>` : ''}
      </div>`;
    } else {
      // 모바일: 기존 하단 펼침 방식
      var selectedClass = (_selectedExpenseDate === dateStr) ? ' exp-day-selected' : '';
      html += `<div class="exp-month-day ${isToday}${selectedClass}" onclick="toggleExpenseDaySelect('${dateStr}', ${rerenderFnName})">
        <div class="exp-month-day-num">${i}</div>
        ${total > 0 ? `<div class="exp-month-day-amount ${amountClass}">${total.toLocaleString()}</div>` : ''}
      </div>`;
    }
  }

  html += '</div></div>';

  // 모바일만 하단 슬롯 유지
  if (!isPC) {
    html += '<div id="expMonthDaySlot">';
    if (_selectedExpenseDate && _selectedExpenseDate.startsWith(yearMonth)) {
      html += renderSelectedDayExpenses(_selectedExpenseDate);
      html += '<div class="exp-section-gap"></div>';
    }
    html += '</div>';
  }

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
    // PC/태블릿: 항상 단일 대시보드 렌더
    renderExpenseDashboard('pc');
  } else {
    // 모바일: 기존 로직 유지
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
    // PC/태블릿: 통합 대시보드로 리다이렉트 (B화면 진입 차단)
    _expenseViewYM = yearMonth;
    var dashPane = document.getElementById('expFullDashboardPane');
    var detailPane = document.getElementById('expFullDetailPane');
    if (dashPane) dashPane.style.display = 'block';
    if (detailPane) detailPane.style.display = 'none';
    renderExpenseDashboard('pc');
  } else {
    // 모바일: 기존 B화면 동작
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
    // PC/태블릿: 통합 대시보드 렌더 (pane 관리는 switchTab에서)
    renderExpenseDashboard('pc');
  } else {
    // 모바일: 대시보드 패널 표시
    var dashboard = document.getElementById('pane-expense-dashboard');
    var detail = document.getElementById('pane-expense-detail');
    if (detail) detail.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    renderExpenseDashboard('mobile');
  }
}
// gesture.js 호환 래퍼
function showExpenseDashboardFromDetailMobile() { showExpenseDashboardFromDetail(); }

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
    // PC/태블릿: 항상 단일 대시보드 렌더
    renderExpenseDashboard('pc');
  } else {
    // 모바일: 기존 로직 유지
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

// ═══════════════════════════════════════
// 가계부 타임라인 꾹누르기/우클릭 팝업
// ═══════════════════════════════════════
var _expLpTimer = null;
var _expLpItem = null;
var _expLpMoved = false;
var _expLpX = 0;
var _expLpY = 0;

function showExpensePopup(expenseId, x, y) {
  var expense = getExpenses().find(function(e) { return e.id === expenseId; });
  if (!expense) return;

  var isPC = window.innerWidth > 768;
  var editAction = isPC
    ? 'openExpenseModal(\'' + expenseId + '\')'
    : 'loadExpense(\'' + expenseId + '\'); setMobileView(\'editor\');';

  var menuEl = document.getElementById('lpPopupMenu');
  menuEl.innerHTML = ''
    + '<div class="lp-popup-menu-item" onclick="closeLpPopup(); ' + editAction + '"><span>수정</span>'
    + '<svg viewBox="0 0 24 24"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="M15 5l4 4"/></svg></div>'
    + '<div class="lp-popup-sep"></div>'
    + '<div class="lp-popup-menu-item danger" onclick="_deleteExpenseFromPopup(\'' + expenseId + '\')"><span>삭제</span>'
    + '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>';

  var overlay = document.getElementById('lpPopupOverlay');
  var card = document.getElementById('lpPopupCard');

  var isMobile = window.innerWidth <= 768;
  var cardW = isMobile ? Math.min(220, window.innerWidth - 40) : Math.min(240, window.innerWidth - 32);
  var left = x - cardW / 2;
  if (left < 16) left = 16;
  if (left + cardW > window.innerWidth - 16) left = window.innerWidth - cardW - 16;
  var top = y + 8;
  if (top + 120 > window.innerHeight - 16) top = y - 120 - 8;
  if (top < 16) top = 16;

  card.style.left = left + 'px';
  card.style.top = top + 'px';
  card.style.width = cardW + 'px';

  window._liftedOriginal = null;
  window._liftedClone = null;
  contextItemId = null;
  contextItemType = null;

  overlay.classList.add('open');
  requestAnimationFrame(function() { card.classList.add('open'); });
}

function _deleteExpenseFromPopup(expenseId) {
  closeLpPopup();
  delExpense(expenseId);
  updateExpenseCompact();
  SYNC.scheduleDatabaseSave();
  // 현재 화면 리렌더
  if (window.innerWidth > 768) {
    // PC/태블릿: 항상 통합 대시보드 렌더
    renderExpenseDashboard('pc');
  } else {
    // 모바일: 현재 표시된 화면에 따라 렌더
    var mDetail = document.getElementById('pane-expense-detail');
    if (mDetail && mDetail.style.display !== 'none') {
      renderExpenseFullDetailMobile(getExpenseViewYM());
    } else {
      renderExpenseDashboard('mobile');
    }
  }
}

function setupExpenseContextMenu() {
  // 우클릭
  document.addEventListener('contextmenu', function(e) {
    var item = e.target.closest('.exp-tl-item');
    if (!item) return;
    var id = item.getAttribute('data-expense-id');
    if (!id) return;
    e.preventDefault();
    showExpensePopup(id, e.clientX, e.clientY);
  });

  // 꾹누르기 (모바일)
  document.addEventListener('touchstart', function(e) {
    var item = e.target.closest('.exp-tl-item');
    if (!item) return;
    var id = item.getAttribute('data-expense-id');
    if (!id) return;
    _expLpItem = item;
    _expLpMoved = false;
    _expLpX = e.touches[0].clientX;
    _expLpY = e.touches[0].clientY;
    clearTimeout(_expLpTimer);
    _expLpTimer = setTimeout(function() {
      if (!_expLpMoved && _expLpItem) {
        if (navigator.vibrate) navigator.vibrate(20);
        showExpensePopup(id, _expLpX, _expLpY);
        _expLpItem = null;
      }
    }, 600);
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!_expLpItem) return;
    if (Math.abs(e.touches[0].clientX - _expLpX) > 15 || Math.abs(e.touches[0].clientY - _expLpY) > 15) {
      _expLpMoved = true;
      clearTimeout(_expLpTimer);
      _expLpItem = null;
    }
  }, { passive: true });

  document.addEventListener('touchend', function() {
    clearTimeout(_expLpTimer);
    _expLpItem = null;
  }, { passive: true });
}

// ═══════════════════════════════════════
// 플로팅 팝업 (공용)
// ═══════════════════════════════════════
function openExpenseFloatingPopup(title, contentHtml, anchorX, anchorY) {
  closeExpenseFloatingPopup();

  var overlay = document.createElement('div');
  overlay.id = 'expFloatingPopupOverlay';
  overlay.className = 'exp-fp-overlay';

  var popup = document.createElement('div');
  popup.className = 'exp-fp-card';

  // 헤더
  var header = '<div class="exp-fp-header">'
    + '<span class="exp-fp-title">' + title + '</span>'
    + '<button class="exp-fp-close" onclick="closeExpenseFloatingPopup()">'
    + '<svg width="16" height="16" viewBox="0 0 16 16"><line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    + '</button>'
    + '</div>';

  // 본문
  var body = '<div class="exp-fp-body">' + contentHtml + '</div>';

  popup.innerHTML = header + body;
  overlay.appendChild(popup);

  // 바깥 클릭으로 닫기
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeExpenseFloatingPopup();
  });

  document.body.appendChild(overlay);

  // 위치 계산 (팝업 크기 확인 후)
  requestAnimationFrame(function() {
    var popupRect = popup.getBoundingClientRect();
    var popupW = popupRect.width;
    var popupH = popupRect.height;
    var winW = window.innerWidth;
    var winH = window.innerHeight;

    // 기본: 앵커 지점 근처. 공간 부족하면 화면 중앙
    var left, top;

    if (winW <= 768) {
      // 모바일: 하단 시트 스타일 (CSS에서 처리)
      left = 0;
      top = 0;
    } else {
      // PC/태블릿: 앵커 근처 배치
      left = anchorX - popupW / 2;
      top = anchorY + 12;

      // 화면 밖으로 넘어가지 않도록 보정
      if (left < 16) left = 16;
      if (left + popupW > winW - 16) left = winW - popupW - 16;
      if (top + popupH > winH - 16) top = anchorY - popupH - 12;
      if (top < 16) top = 16;

      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
    }

    overlay.classList.add('open');
  });
}

function closeExpenseFloatingPopup() {
  var overlay = document.getElementById('expFloatingPopupOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(function() {
    if (overlay.parentNode) overlay.remove();
  }, 250);
}

// ═══════════════════════════════════════
// 상호별 랭킹 카드 (공용)
// ═══════════════════════════════════════
function renderMerchantRanking(merchants, limit, options) {
  if (!merchants || merchants.length === 0) {
    return '<div class="exp-mr-empty">데이터가 없습니다</div>';
  }
  var opts = options || {};
  var maxAmount = merchants[0].amount;
  var showList = merchants.slice(0, limit);
  var hasMore = merchants.length > limit;

  var html = '<div class="exp-mr-list">';

  showList.forEach(function(m, i) {
    var barPct = maxAmount > 0 ? (m.amount / maxAmount) * 100 : 0;
    var barColor = (i === 0) ? '#E55643' : '#E8E8E8';
    var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === m.category; });
    var catName = catObj ? catObj.name : '기타';
    var iconItem = { merchant: m.merchant, icon: null };

    html += '<div class="exp-mr-row" onclick="openMerchantDetail(\'' + _escMerchant(m.merchant) + '\')">';
    html += getMerchantIconHtml(iconItem);
    html += '<div class="exp-mr-info">';
    html += '<div class="exp-mr-name">' + m.merchant + '</div>';
    html += '<div class="exp-mr-meta">';
    html += '<span class="exp-mr-count">' + m.count + '건</span>';
    html += '<span class="exp-mr-pct">' + m.percent + '%</span>';
    html += '<span class="exp-mr-cat-tag" onclick="event.stopPropagation(); openCategoryExpensePopup(\'' + m.category + '\',\'' + (catName.replace(/'/g, "\\'")) + '\')">' + catName + '</span>';
    html += '</div>';
    if (!opts.hideBar) {
      html += '<div class="exp-mr-bar-wrap"><div class="exp-mr-bar" style="width:' + Math.max(barPct, 3) + '%;background:' + barColor + ';"></div></div>';
    }
    html += '</div>';
    html += '<div class="exp-mr-amount">' + formatAmount(m.amount) + '원</div>';
    html += '</div>';
  });

  html += '</div>';

  if (hasMore && opts.onMoreClick) {
    html += '<div class="exp-mr-more-wrap">';
    html += '<button class="exp-cat-more-btn" onclick="' + opts.onMoreClick + '">전체 보기</button>';
    html += '</div>';
  }

  return html;
}

// 상호명에 특수문자가 있을 때 onclick 안전하게 이스케이프
function _escMerchant(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// 상호 클릭 → 해당 상호의 월간 내역을 플로팅 팝업으로 표시
function openMerchantDetail(merchant) {
  var ym = getExpenseViewYM();
  var expenses = getMonthExpenses(ym)
    .filter(function(e) { return (e.merchant || '').trim() === merchant; })
    .sort(function(a, b) { return (b.date + ' ' + (b.time || '')).localeCompare(a.date + ' ' + (a.time || '')); });

  var total = expenses.reduce(function(s, e) { return s + e.amount; }, 0);
  var parts = ym.split('-');
  var mo = parseInt(parts[1]);
  var title = merchant + ' · ' + mo + '월';

  var contentHtml = '';

  if (expenses.length === 0) {
    contentHtml = '<div class="exp-tl-empty">내역이 없습니다</div>';
  } else {
    // 날짜별 그룹핑
    var grouped = {};
    var dateOrder = [];
    expenses.forEach(function(e) {
      if (!grouped[e.date]) {
        grouped[e.date] = [];
        dateOrder.push(e.date);
      }
      grouped[e.date].push(e);
    });
    dateOrder.sort(function(a, b) { return b.localeCompare(a); });

    dateOrder.forEach(function(dateStr) {
      contentHtml += renderExpenseDateGroup(dateStr, grouped[dateStr], function(item) {
        return window.innerWidth > 768
          ? 'closeExpenseFloatingPopup(); openExpenseModal(\'' + item.id + '\')'
          : 'closeExpenseFloatingPopup(); loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';
      });
    });

    // 하단 합계
    contentHtml += '<div class="exp-fp-footer">';
    contentHtml += '<span class="exp-fp-footer-label">' + expenses.length + '건 합계</span>';
    contentHtml += '<span class="exp-fp-footer-amount">' + total.toLocaleString() + '원</span>';
    contentHtml += '</div>';
  }

  // 화면 중앙에서 열기
  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2 - 50;
  openExpenseFloatingPopup(title, contentHtml, cx, cy);
}

// 카테고리 태그 클릭 → 해당 카테고리의 월간 내역을 플로팅 팝업으로 표시
function openCategoryExpensePopup(catId, catName) {
  var ym = getExpenseViewYM();
  var expenses = getMonthExpenses(ym)
    .filter(function(e) { return e.category === catId; })
    .sort(function(a, b) { return (b.date + ' ' + (b.time || '')).localeCompare(a.date + ' ' + (a.time || '')); });

  var total = expenses.reduce(function(s, e) { return s + e.amount; }, 0);
  var parts = ym.split('-');
  var mo = parseInt(parts[1]);
  var title = catName + ' · ' + mo + '월';

  var contentHtml = '';

  if (expenses.length === 0) {
    contentHtml = '<div class="exp-tl-empty">내역이 없습니다</div>';
  } else {
    // 날짜별 그룹핑
    var grouped = {};
    var dateOrder = [];
    expenses.forEach(function(e) {
      if (!grouped[e.date]) {
        grouped[e.date] = [];
        dateOrder.push(e.date);
      }
      grouped[e.date].push(e);
    });
    dateOrder.sort(function(a, b) { return b.localeCompare(a); });

    dateOrder.forEach(function(dateStr) {
      contentHtml += renderExpenseDateGroup(dateStr, grouped[dateStr], function(item) {
        return window.innerWidth > 768
          ? 'closeExpenseFloatingPopup(); openExpenseModal(\'' + item.id + '\')'
          : 'closeExpenseFloatingPopup(); loadExpense(\'' + item.id + '\'); setMobileView(\'editor\');';
      });
    });

    contentHtml += '<div class="exp-fp-footer">';
    contentHtml += '<span class="exp-fp-footer-label">' + expenses.length + '건 합계</span>';
    contentHtml += '<span class="exp-fp-footer-amount">' + total.toLocaleString() + '원</span>';
    contentHtml += '</div>';
  }

  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2 - 50;
  openExpenseFloatingPopup(title, contentHtml, cx, cy);
}

// ═══════════════════════════════════════
// 캘린더 날짜 클릭 → 플로팅 팝업 (PC/태블릿)
// ═══════════════════════════════════════
function onExpCalDayClick(event, dateStr) {
  var expenses = getDayExpenses(dateStr).sort(function(a, b) {
    return (b.time || '').localeCompare(a.time || '');
  });
  if (expenses.length === 0) return;

  var dateObj = new Date(dateStr + 'T00:00:00');
  var dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  var month = dateObj.getMonth() + 1;
  var day = dateObj.getDate();
  var dayName = dayNames[dateObj.getDay()];
  var dayTotal = expenses.reduce(function(s, e) { return s + e.amount; }, 0);

  var title = month + '월 ' + day + '일 ' + dayName + '요일';

  var contentHtml = '';
  expenses.forEach(function(item, idx) {
    var clickAction = 'closeExpenseFloatingPopup(); openExpenseModal(\'' + item.id + '\')';
    contentHtml += renderExpenseItem(item, clickAction);
  });

  contentHtml += '<div class="exp-fp-footer">';
  contentHtml += '<span class="exp-fp-footer-label">' + expenses.length + '건</span>';
  contentHtml += '<span class="exp-fp-footer-amount">' + dayTotal.toLocaleString() + '원</span>';
  contentHtml += '</div>';

  var rect = event.currentTarget.getBoundingClientRect();
  var anchorX = rect.left + rect.width / 2;
  var anchorY = rect.bottom;
  openExpenseFloatingPopup(title, contentHtml, anchorX, anchorY);
}

// ═══════════════════════════════════════
// 월간 상호별 랭킹 — 히어로 + 그리드
// ═══════════════════════════════════════
function renderMonthlyMerchantHero(merchants, thisYM, isCurrentMonth, monthNum) {
  var top1 = merchants[0];
  var gridItems = merchants.slice(1, 7); // 2~7위

  var catObj1 = EXPENSE_CATEGORIES.find(function(c) { return c.id === top1.category; });
  var catColor1 = catObj1 ? catObj1.color : '#B0B0B8';
  var iconItem1 = { merchant: top1.merchant, icon: null };

  var html = '<div style="padding:0;">';

  // 헤더 텍스트
  html += '<div class="exp-summary" style="padding:20px 0 12px;">';
  if (isCurrentMonth) {
    html += '<div class="exp-summary-title" style="font-size:17px;">' + monthNum + '월에는 ' + top1.merchant + '에 많이 쓰고 있어요</div>';
  } else {
    html += '<div class="exp-summary-title" style="font-size:17px;">' + monthNum + '월에는 ' + top1.merchant + '에 많이 썼어요</div>';
  }
  html += '</div>';

  // 히어로 카드 (1위)
  html += '<div class="exp-yearly-hero" style="background:' + catColor1 + '10;border:1px solid ' + catColor1 + '20;" onclick="openMerchantDetail(\'' + _escMerchant(top1.merchant) + '\')">';
  html += '<div class="exp-yearly-hero-rank exp-monthly-hero-rank">1</div>';
  html += '<div class="exp-yearly-hero-icon">' + getMerchantIconHtml(iconItem1) + '</div>';
  html += '<div class="exp-yearly-hero-body">';
  html += '<div class="exp-yearly-hero-row"><span class="exp-yearly-hero-name">' + top1.merchant + '</span><span class="exp-yearly-hero-amount">' + formatAmount(top1.amount) + '원</span></div>';
  html += '<div class="exp-yearly-hero-desc">' + top1.count + '건 · ' + top1.percent + '%</div>';
  html += '</div>';
  html += '</div>';

  // 2열 그리드 (2~7위)
  if (gridItems.length > 0) {
    html += '<div class="exp-yearly-grid">';
    gridItems.forEach(function(m, i) {
      html += _renderYearlyGridItem(m, i + 2);
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// ═══════════════════════════════════════
// 연간 누적 섹션
// ═══════════════════════════════════════
function renderYearlySection(year) {
  var data = getYearMerchantBreakdown(year);
  if (!data || !data.merchants || data.merchants.length === 0) {
    return '';
  }

  var merchants = data.merchants;

  // 날짜 표시
  var now = new Date();
  var monthNum = now.getMonth() + 1;
  var dayNum = now.getDate();

  // 버블 컨테이너 크기
  var containerW = Math.min(680, window.innerWidth - 80);
  var containerH = window.innerWidth <= 768 ? 160 : 280;

  var html = '<div class="exp-yearly-section">';

  // 섹션 헤더
  html += '<div class="exp-yearly-header">';
  if (window.innerWidth <= 768) {
    html += '<div class="exp-yearly-title">올해 <span style="color:#E55643;">총 ' + formatAmount(data.total) + '원</span> 쓰고 있어요</div>';
  } else {
    html += '<div class="exp-yearly-title">' + year + '년 ' + monthNum + '월 ' + dayNum + '일까지 <span style="color:#E55643;">총 ' + formatAmount(data.total) + '원</span> 쓰고 있어요</div>';
  }
  html += '</div>';

  // 버블 차트
  html += _renderYearlyBubbles(merchants, containerW, containerH);

  // 랭킹 리스트 (10개)
  var rankLimit = Math.min(10, merchants.length);
  html += _renderYearlyRankList(merchants, rankLimit);

  // "전체 순위 보기" 버튼 (10개 초과 시)
  if (merchants.length > 10) {
    html += '<div class="exp-mr-more-wrap">';
    html += '<button class="exp-cat-more-btn" onclick="openYearlyFullPopup(' + year + ')">전체 순위 보기</button>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// 연간 그리드 아이템 HTML 생성 (공통)
function _renderYearlyGridItem(m, rank) {
  var iconItem = { merchant: m.merchant, icon: null };
  var html = '<div class="exp-yearly-grid-item" onclick="openMerchantDetail(\'' + _escMerchant(m.merchant) + '\')">';
  html += '<div class="exp-yearly-grid-rank">' + rank + '</div>';
  html += '<div class="exp-yearly-grid-icon">' + getMerchantIconHtml(iconItem) + '</div>';
  html += '<div class="exp-yearly-grid-row"><span class="exp-yearly-grid-name">' + m.merchant + '</span><span class="exp-yearly-grid-amount">' + formatAmount(m.amount) + '원</span></div>';
  html += '<div class="exp-yearly-grid-meta">' + m.count + '건 · ' + m.percent + '%</div>';
  html += '</div>';
  return html;
}

// ═══════════════════════════════════════
// 버블 차트 — Circle Packing
// ═══════════════════════════════════════
function _packCircles(items, containerW, containerH) {
  // items: [{merchant, amount, ...}], 금액 내림차순 정렬 전제
  if (!items || items.length === 0) return [];

  var maxAmount = items[0].amount;
  var minR = 18;
  var maxR = window.innerWidth <= 768
    ? Math.min(containerW, containerH) * 0.22
    : Math.min(containerW, containerH) * 0.28;
  var cx = containerW / 2;
  var cy = containerH / 2;

  // 반지름 계산 (면적 비례: r = sqrt(amount/max) * maxR)
  var circles = items.map(function(item, i) {
    var ratio = Math.sqrt(item.amount / maxAmount);
    var r = Math.max(minR, ratio * maxR);
    return { x: cx, y: cy, r: r, item: item, index: i };
  });

  // 첫 번째 원은 중앙
  circles[0].x = cx;
  circles[0].y = cy;

  // 나머지 원들을 나선형으로 배치 후 충돌 해소
  for (var i = 1; i < circles.length; i++) {
    var angle = i * 2.4; // golden angle ~137.5°
    var dist = circles[0].r + circles[i].r + 4;
    circles[i].x = cx + Math.cos(angle) * dist * 0.6;
    circles[i].y = cy + Math.sin(angle) * dist * 0.6;
  }

  // 간단한 force simulation (50회 반복)
  for (var iter = 0; iter < 60; iter++) {
    // 원끼리 겹침 해소
    for (var i = 0; i < circles.length; i++) {
      for (var j = i + 1; j < circles.length; j++) {
        var dx = circles[j].x - circles[i].x;
        var dy = circles[j].y - circles[i].y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var minDist = circles[i].r + circles[j].r + 3;
        if (dist < minDist) {
          var overlap = (minDist - dist) / 2;
          var nx = dx / dist;
          var ny = dy / dist;
          circles[i].x -= nx * overlap;
          circles[i].y -= ny * overlap;
          circles[j].x += nx * overlap;
          circles[j].y += ny * overlap;
        }
      }
    }
    // 중앙으로 약하게 끌어당기기
    for (var i = 0; i < circles.length; i++) {
      circles[i].x += (cx - circles[i].x) * 0.03;
      circles[i].y += (cy - circles[i].y) * 0.03;
    }
    // 컨테이너 경계 안에 유지
    for (var i = 0; i < circles.length; i++) {
      var c = circles[i];
      if (c.x - c.r < 0) c.x = c.r;
      if (c.x + c.r > containerW) c.x = containerW - c.r;
      if (c.y - c.r < 0) c.y = c.r;
      if (c.y + c.r > containerH) c.y = containerH - c.r;
    }
  }

  return circles;
}

// 버블 차트 HTML 생성
function _renderYearlyBubbles(merchants, containerW, containerH) {
  // 상위 10개 + 나머지를 "기타"로 묶기
  var bubbleItems = merchants.slice(0, 10).map(function(m) {
    return { merchant: m.merchant, amount: m.amount, category: m.category, icon: null };
  });

  // 기타 묶기
  if (merchants.length > 10) {
    var etcAmount = 0;
    for (var i = 10; i < merchants.length; i++) etcAmount += merchants[i].amount;
    if (etcAmount > 0) {
      bubbleItems.push({ merchant: '기타', amount: etcAmount, category: 'etc', icon: null, isEtc: true });
    }
  }

  var circles = _packCircles(bubbleItems, containerW, containerH);

  var html = '<div class="exp-yearly-bubble-wrap" style="width:100%;height:' + containerH + 'px;position:relative;overflow:hidden;">';

  circles.forEach(function(c) {
    var catObj = EXPENSE_CATEGORIES.find(function(cat) { return cat.id === c.item.category; });
    var bgColor = catObj ? catObj.bg : '#f0f0f0';
    var borderColor = catObj ? catObj.color : '#ccc';
    var size = Math.round(c.r * 2);
    var left = Math.round(c.x - c.r);
    var top = Math.round(c.y - c.r);
    var imgSize = Math.round(c.r * 2 - 4);

    var onclick = c.item.isEtc
      ? 'openYearlyFullPopup(' + new Date(getExpenseViewYM() + "-01").getFullYear() + ')'
      : 'openMerchantDetail(\'' + _escMerchant(c.item.merchant) + '\')';

    html += '<div class="exp-yearly-bubble" onclick="' + onclick + '" style="'
      + 'position:absolute;'
      + 'left:' + left + 'px;'
      + 'top:' + top + 'px;'
      + 'width:' + size + 'px;'
      + 'height:' + size + 'px;'
      + 'border-radius:50%;'
      + 'background:' + bgColor + ';'
      + 'border:2.5px solid #fff;'
      + 'display:flex;align-items:center;justify-content:center;'
      + 'cursor:pointer;transition:transform .15s,box-shadow .15s;'
      + '">';

    if (c.item.isEtc) {
      html += '<span style="font-size:' + Math.max(11, Math.round(c.r * 0.45)) + 'px;color:var(--tx-m);font-weight:500;">기타</span>';
    } else {
      var iconItem = { merchant: c.item.merchant, icon: c.item.icon };
      // 파비콘만 — getMerchantIconHtml의 img 태그 크기 조정
      var src = findMerchantIcon(c.item.merchant) || DEFAULT_ICON_URL;
      html += '<img src="' + src + '" width="' + imgSize + '" height="' + imgSize + '" style="border-radius:50%;object-fit:cover;" onerror="this.onerror=null;this.src=\'' + DEFAULT_ICON_URL + '\';">';
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

// 랭킹 리스트 HTML 생성
function _renderYearlyRankList(merchants, limit) {
  var showList = merchants.slice(0, limit);

  var html = '<div class="exp-yearly-rank-list">';

  showList.forEach(function(m, i) {
    var rank = i + 1;
    var rankSize = rank <= 3 ? '20px' : '15px';
    var rankWeight = rank <= 3 ? '700' : '600';
    var rankColor = 'var(--tx-m)';
    var nameWeight = rank === 1 ? '600' : '400';

    var src = findMerchantIcon(m.merchant) || DEFAULT_ICON_URL;

    html += '<div class="exp-yearly-rank-row" onclick="openMerchantDetail(\'' + _escMerchant(m.merchant) + '\')">';

    html += '<span class="exp-yearly-rank-num" style="font-size:' + rankSize + ';font-weight:' + rankWeight + ';color:' + rankColor + ';">' + rank + '</span>';

    html += '<div class="exp-yearly-rank-icon">';
    html += '<img src="' + src + '" width="36" height="36" style="border-radius:50%;object-fit:cover;" onerror="this.onerror=null;this.src=\'' + DEFAULT_ICON_URL + '\';">';
    html += '</div>';

    html += '<div class="exp-yearly-rank-name" style="font-weight:' + nameWeight + ';">' + m.merchant + '</div>';

    html += '<div class="exp-yearly-rank-amount">' + formatAmount(m.amount) + '원</div>';
    html += '<div class="exp-yearly-rank-pct">' + m.percent + '%</div>';

    html += '</div>';
  });

  html += '</div>';
  return html;
}

// 연간 전체 상호 리스트 팝업
function openYearlyFullPopup(year) {
  var data = getYearMerchantBreakdown(year);
  if (!data || !data.merchants || data.merchants.length === 0) return;

  var merchants = data.merchants;
  var title = year + '년 전체 상호';

  var contentHtml = '<div class="exp-fp-yearly-list">';

  merchants.forEach(function(m, i) {
    var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === m.category; });
    var catColor = catObj ? catObj.color : '#B0B0B8';
    var iconItem = { merchant: m.merchant, icon: null };

    contentHtml += '<div class="exp-fp-yearly-row">';
    contentHtml += '<span class="exp-fp-yearly-rank">' + (i + 1) + '</span>';
    contentHtml += getMerchantIconHtml(iconItem);
    contentHtml += '<div class="exp-fp-yearly-info">';
    contentHtml += '<div class="exp-fp-yearly-name">' + m.merchant + '</div>';
    contentHtml += '<div class="exp-fp-yearly-meta">' + m.count + '건 · ' + m.percent + '%</div>';
    contentHtml += '</div>';
    contentHtml += '<div class="exp-fp-yearly-amount">' + formatAmount(m.amount) + '원</div>';
    contentHtml += '</div>';
  });

  contentHtml += '</div>';

  // 하단 합계
  contentHtml += '<div class="exp-fp-footer">';
  contentHtml += '<span class="exp-fp-footer-label">' + merchants.length + '개 상호 합계</span>';
  contentHtml += '<span class="exp-fp-footer-amount">' + formatAmount(data.total) + '원</span>';
  contentHtml += '</div>';

  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2 - 50;
  openExpenseFloatingPopup(title, contentHtml, cx, cy);
}
