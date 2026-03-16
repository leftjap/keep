// ═══════════════════════════════════════
// ui-expense.js — 가계부 UI 렌더링
// ═══════════════════════════════════════

// 아이콘 URL 로드 검증
function validateIconUrl(url, callback) {
  if (!url) { callback(true); return; }
  var img = new Image();
  img.onload = function() { callback(true); };
  img.onerror = function() { callback(false); };
  img.src = url;
}

// ═══ 기본 아이콘 (미사용 — 카테고리 폴백으로 통일) ═══

// ═══ 카테고리 아이콘 폴백용 짧은 이름 ═══
function getCatShortName(catId) {
  var shortNames = { 'online': '쇼핑' };
  if (shortNames[catId]) return shortNames[catId];
  var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === catId; });
  return catObj ? catObj.name.substring(0, 2) : '기타';
}

function getMerchantIconHtml(item) {
  var merchant = (item.merchant || '').trim();
  var brand = item.brand || null;
  var iconUrl = null;

  // 1. brand가 있으면 brandIcons에서 조회
  if (brand) {
    iconUrl = getBrandIcon(brand);
  }

  // 2. brandIcons에 없으면 merchantIcons에서 조회 (별명 역조회 포함)
  if (!iconUrl) {
    var resolved = resolveAlias(merchant);
    iconUrl = findMerchantIcon(resolved) || findMerchantIcon(merchant);
  }

  // 3. 항목 자체에 icon 필드가 있으면 우선
  if (item.icon) iconUrl = item.icon;

  // 4. 아이콘이 있으면 이미지, 없으면 카테고리 아이콘 폴백
  if (iconUrl) {
    var category = item.category || 'etc';
    return '<div class="exp-tl-item-icon exp-tl-item-icon-img">'
      + '<img src="' + iconUrl + '" width="40" height="40" onerror="_logoFallback(this,\'' + category + '\')">'
      + '</div>';
  }

  // 5. 카테고리 아이콘 폴백
  var catId = item.category || 'etc';
  var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === catId; });
  var catColor = catObj ? catObj.color : '#B0B0B8';
  var catName = catObj ? catObj.name : '기타';
  return '<div class="exp-tl-item-icon exp-tl-item-icon-cat" style="background:' + catColor + ';">'
    + '<span style="color:#fff;font-size:11px;font-weight:600;">' + getCatShortName(catId) + '</span>'
    + '</div>';
}

function _logoFallback(el, category) {
  var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === category; });
  var catColor = catObj ? catObj.color : '#B0B0B8';
  var catName = catObj ? catObj.name : '기타';
  var parent = el.parentElement;
  if (parent) {
    parent.className = 'exp-tl-item-icon exp-tl-item-icon-cat';
    parent.style.background = catColor;
    parent.innerHTML = '<span style="color:#fff;font-size:11px;font-weight:600;">' + getCatShortName(category) + '</span>';
  }
}

function updateExpenseCompact() {
  const el = document.getElementById('expenseCompactAmount');
  if (!el) return;
  const thisYM = today().slice(0, 7);
  const total = getMonthTotal(thisYM);
  el.textContent = total > 0 ? total.toLocaleString() + ' 원' : '';
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
    var yearlyHtml = renderYearlySection(currentYear, thisYM);
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
    html += renderMonthCalendar(thisYM);
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
    var yearlyHtml = renderYearlySection(currentYear, thisYM);
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
  var nowYM = today().slice(0, 7);
  var html = '<div class="exp-bar-chart">';
  trend.forEach(function(t) {
    var pct = (t.total / maxTotal) * 100;
    var isCurrentClass = t.isCurrent ? 'current' : '';
    var isCurrentMonth = (t.ym === nowYM);
    html += '<div class="exp-bar-item ' + isCurrentClass + '" onclick="_onBarChartClick(\'' + t.ym + '\')" style="cursor:pointer;">';
    if (isCurrentMonth && t.isCurrent) {
      html += '<div class="exp-bar-projected">현재 ' + Math.round(t.total / 10000) + '만</div>';
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
  _selectedExpenseDate = null;
  _yearlyRankLoaded = 10;
  if (window.innerWidth > 768) {
    // PC/태블릿: 통합 대시보드 다시 렌더 (B화면 진입 차단)
    var dashPane = document.getElementById('expFullDashboardPane');
    var detailPane = document.getElementById('expFullDetailPane');
    if (dashPane) dashPane.style.display = 'block';
    if (detailPane) detailPane.style.display = 'none';
    renderExpenseDashboard('pc');
  } else {
    // 모바일: 해당 월의 대시보드(A) 렌더
    var dashboard = document.getElementById('pane-expense-dashboard');
    var detail = document.getElementById('pane-expense-detail');
    if (detail) detail.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    renderExpenseDashboard('mobile');
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
  var displayMerchant = item.brand || (item.merchant || '').trim() || '미분류';
  var html = '<div class="exp-tl-item" data-expense-id="' + item.id + '" onclick="' + clickAction + '">';
  html += getMerchantIconHtml(item);
  html += '<div class="exp-tl-item-left">';
  html += '<span class="exp-tl-item-amount">' + item.amount.toLocaleString() + '원</span>';
  html += '<span class="exp-tl-item-sub">' + displayMerchant;
  if (item.memo) html += ' · ' + item.memo;
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

    html += `<div class="exp-month-day ${isToday}" onclick="onExpCalDayClick(event, '${dateStr}')">
      <div class="exp-month-day-num">${i}</div>
      ${total > 0 ? `<div class="exp-month-day-amount ${amountClass}">${total.toLocaleString()}</div>` : ''}
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
var _yearlyRankLoaded = 10;
var _yearlyEndYM = null;

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
  _yearlyRankLoaded = 10;
  var current = getExpenseViewYM();
  var nowYM = today().slice(0, 7);

  // 이동하려는 월 계산
  var d = new Date(current + '-01');
  d.setMonth(d.getMonth() + delta);
  var targetYM = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');

  // 미래 월(현재 월 이후)로는 이동 불가
  if (targetYM > nowYM) return;

  // 데이터 없는 월로는 이동 불가
  if (!hasExpenseDataInMonth(targetYM) && targetYM !== nowYM) return;

  _expenseViewYM = targetYM;

  if (window.innerWidth > 768) {
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
    var hasData = hasExpenseDataInMonth(ym) || ym === nowYM;
    months.push({ ym: ym, label: label, selected: ym === currentYM, hasData: hasData });
  }

  var listHtml = months.map(function(m) {
    if (!m.hasData) {
      return '<div class="exp-mp-item" style="color:var(--tx-hint);cursor:default;opacity:0.4;">'
        + '<span>' + m.label + '</span>'
        + '</div>';
    }
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
  var nowYM = today().slice(0, 7);
  // 데이터 없는 월(현재 월 제외)은 선택 불가
  if (!hasExpenseDataInMonth(ym) && ym !== nowYM) {
    closeMonthPicker();
    return;
  }

  _expenseViewYM = ym;
  _yearlyRankLoaded = 10;
  closeMonthPicker();

  if (window.innerWidth > 768) {
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
// 월 헤더 렌더링 (상단 네비 바)
// ═══════════════════════════════════════
function renderExpenseMonthNav(yearMonth) {
  var parts = yearMonth.split('-');
  var mo = parseInt(parts[1]);
  var nowYM = today().slice(0, 7);

  // 이전 월 데이터 유무 확인
  var prevD = new Date(yearMonth + '-01');
  prevD.setMonth(prevD.getMonth() - 1);
  var prevYM = prevD.getFullYear() + '-' + String(prevD.getMonth() + 1).padStart(2, '0');
  var prevDisabled = !hasExpenseDataInMonth(prevYM) && prevYM !== nowYM;

  // 다음 월 데이터 유무 확인
  var nextD = new Date(yearMonth + '-01');
  nextD.setMonth(nextD.getMonth() + 1);
  var nextYM = nextD.getFullYear() + '-' + String(nextD.getMonth() + 1).padStart(2, '0');
  var nextDisabled = (nextYM > nowYM) || (!hasExpenseDataInMonth(nextYM) && nextYM !== nowYM);

  var navHtml = '<div class="exp-month-nav-inline" id="expenseMonthNavInline">'
    + '<button class="exp-month-nav-btn' + (prevDisabled ? ' exp-nav-disabled' : '') + '"'
    + (prevDisabled ? '' : ' onclick="changeExpenseMonth(-1)"') + '>'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="7,0.5 1,7 7,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '<span class="exp-month-nav-label" onclick="openMonthPicker()" style="cursor:pointer;">' + mo + '월</span>'
    + '<button class="exp-month-nav-btn' + (nextDisabled ? ' exp-nav-disabled' : '') + '"'
    + (nextDisabled ? '' : ' onclick="changeExpenseMonth(1)"') + '>'
    + '<svg width="8" height="14" viewBox="0 0 8 14"><polygon points="1,0.5 7,7 1,13.5" fill="currentColor"/></svg>'
    + '</button>'
    + '</div>';

  // 기존 네비 제거
  document.querySelectorAll('#expenseMonthNavInline').forEach(function(el) { el.remove(); });

  var w = window.innerWidth;
  if (w <= 768) {
    var tabLabel = document.getElementById('edTabLabel');
    if (tabLabel) tabLabel.style.display = 'none';
    var lpHdr = document.querySelector('.lp-hdr');
    if (lpHdr) {
      lpHdr.insertAdjacentHTML('beforeend', navHtml);
    }
    return true;
  } else {
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
var _originalMerchant = null;

function clearIconUrlError(mode) {
  var suffix = mode === 'modal' ? 'Modal' : '';
  var urlInput = document.getElementById('expenseIconUrl' + suffix);
  var errorEl = document.getElementById('expenseIconError' + suffix);
  if (urlInput) urlInput.classList.remove('input-error');
  if (errorEl) errorEl.classList.remove('show');
}

function newExpenseForm(mode = 'normal') {
  curExpenseId = null;
  _originalMerchant = null;
  // 모바일 에디터: 가계부 폼 활성 클래스 추가
  if (mode === 'normal') {
    var editorEl = document.querySelector('.editor');
    if (editorEl) editorEl.classList.add('expense-edit-active');
  }
  const suffix = mode === 'modal' ? 'Modal' : '';
  document.getElementById('expenseAmountInput' + suffix).value = '';
  document.getElementById('expenseMerchantInput' + suffix).value = '';
  document.getElementById('expenseCardInput' + suffix).value = '';
  // 메모 초기화
  var memoEl = document.getElementById('expenseMemoInput' + suffix);
  if (memoEl) memoEl.value = '';
  // 매출처 입력 가능 (새 항목)
  var merchantEl = document.getElementById('expenseMerchantInput' + suffix);
  if (merchantEl) merchantEl.removeAttribute('readonly');
  // ── 금액, 카드 편집 가능 복원 ──
  var amountEl = document.getElementById('expenseAmountInput' + suffix);
  if (amountEl) amountEl.removeAttribute('readonly');

  var cardEl = document.getElementById('expenseCardInput' + suffix);
  if (cardEl) cardEl.removeAttribute('readonly');
  // 아이콘 URL 초기화
  var iconUrlEl = document.getElementById('expenseIconUrl' + suffix);
  if (iconUrlEl) iconUrlEl.value = '';
  // 브랜드 영역 숨김 (새 항목이므로 브랜드 없음)
  var brandField = document.getElementById('expenseBrandField' + suffix);
  if (brandField) brandField.style.display = 'none';
  // 상단 휴지통 버튼 숨기기
  var trashBtn = document.getElementById(mode === 'modal' ? 'expenseTrashBtnModal' : 'expenseTrashBtn');
  if (trashBtn) trashBtn.style.display = 'none';
  const now = new Date();
  var dateEl = document.getElementById('expenseDateValue' + suffix);
  if (dateEl) {
    dateEl.textContent = formatExpenseDate(now);
    dateEl.setAttribute('data-date', today());
    var nowH = ('0' + now.getHours()).slice(-2);
    var nowM = ('0' + now.getMinutes()).slice(-2);
    dateEl.setAttribute('data-time', nowH + ':' + nowM);
    dateEl.removeAttribute('onclick');
    dateEl.classList.add('expense-date-readonly');
  }
  // ── 문자 붙여넣기 표시 복원 ──
  var pasteBtn = document.getElementById('expensePasteBtn' + (suffix || ''));
  if (pasteBtn) pasteBtn.style.display = '';
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
  _originalMerchant = (e.merchant || '').trim();
  const suffix = mode === 'modal' ? 'Modal' : '';
  document.getElementById('expenseAmountInput' + suffix).value = e.amount.toLocaleString();
  document.getElementById('expenseMerchantInput' + suffix).value = e.merchant;
  document.getElementById('expenseCardInput' + suffix).value = e.card;
  // 메모 로드
  var memoEl = document.getElementById('expenseMemoInput' + suffix);
  if (memoEl) memoEl.value = e.memo || '';
  // ── 기존 항목: 금액 읽기 전용 ──
  var amountEl = document.getElementById('expenseAmountInput' + suffix);
  if (amountEl) amountEl.setAttribute('readonly', true);

  // 매출처 읽기 전용 (기존 항목)
  var merchantEl = document.getElementById('expenseMerchantInput' + suffix);
  if (merchantEl) merchantEl.setAttribute('readonly', true);

  // ── 추가: 카드 읽기 전용 ──
  var cardEl = document.getElementById('expenseCardInput' + suffix);
  if (cardEl) cardEl.setAttribute('readonly', true);
  // 아이콘 매핑 자동 채우기 (브랜드/비브랜드 분기)
  var existingIcon = null;
  if (e.brand) {
    existingIcon = getBrandIcon(e.brand);
  }
  if (!existingIcon) {
    existingIcon = findMerchantIcon(e.merchant);
  }
  var iconUrlEl = document.getElementById('expenseIconUrl' + suffix);
  if (iconUrlEl) iconUrlEl.value = existingIcon || '';
  const d = new Date(e.date + 'T' + (e.time || '00:00'));
  var dateEl = document.getElementById('expenseDateValue' + suffix);
  if (dateEl) {
    dateEl.textContent = formatExpenseDate(d);
    dateEl.setAttribute('data-date', e.date);
    dateEl.setAttribute('data-time', e.time || '');
    dateEl.removeAttribute('onclick');
    dateEl.classList.add('expense-date-readonly');
  }
  // 그리드 접힌 상태 보장
  var catGrid = document.getElementById('expenseCategoryGrid' + suffix);
  if (catGrid) { catGrid.classList.remove('grid-open'); catGrid.style.display = 'none'; }
  selectCategory(e.category, mode);

  // 브랜드 표시
  var brandField = document.getElementById('expenseBrandField' + suffix);
  var brandNameEl = document.getElementById('expenseBrandName' + suffix);
  if (brandField && brandNameEl) {
    if (e.brand) {
      brandNameEl.textContent = e.brand;
      brandField.style.display = 'block';
    } else {
      brandField.style.display = 'none';
    }
  }

  // 기존 항목이므로 상단 휴지통 버튼 표시
  var trashBtn = document.getElementById(mode === 'modal' ? 'expenseTrashBtnModal' : 'expenseTrashBtn');
  if (trashBtn) trashBtn.style.display = 'flex';

  // ── 문자 붙여넣기 숨김 ──
  var pasteBtn = document.getElementById('expensePasteBtn' + (suffix || ''));
  if (pasteBtn) pasteBtn.style.display = 'none';

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

function toggleCategoryGrid(mode) {
  var suffix = mode === 'modal' ? 'Modal' : '';
  var chip = document.getElementById('expenseCatChip' + suffix);
  var grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (!chip || !grid) return;

  var isOpen = grid.classList.contains('grid-open');
  if (isOpen) {
    // 접기
    grid.classList.remove('grid-open');
    grid.style.display = 'none';
    chip.classList.remove('open');
  } else {
    // 펼치기
    renderExpenseCategoryGrid(mode);
    grid.style.display = 'grid';
    // 다음 프레임에서 클래스 추가하여 애니메이션 트리거
    requestAnimationFrame(function() {
      grid.classList.add('grid-open');
    });
    chip.classList.add('open');
  }
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
  var suffix = mode === 'modal' ? 'Modal' : '';
  var grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (grid) {
    var btns = grid.querySelectorAll('.expense-cat-btn');
    btns.forEach(function(btn) {
      var isSelected = btn.getAttribute('data-cat') === catId;
      btn.classList.toggle('selected', isSelected);
      btn.style.borderColor = '';
    });
  }

  // 칩 텍스트 갱신
  var chip = document.getElementById('expenseCatChip' + suffix);
  var chipText = document.getElementById('expenseCatChipText' + suffix);
  if (chip && chipText) {
    var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === catId; });
    if (catObj) {
      // 칩 내용을 색상 도트 + 카테고리명으로 교체
      chipText.innerHTML = '<span class="expense-cat-chip-dot" style="background:' + catObj.color + ';"></span>' + catObj.name;
      chip.classList.add('has-value');
    } else {
      chipText.textContent = '카테고리 선택';
      chip.classList.remove('has-value');
    }
  }

  // 그리드 접기
  if (grid && grid.classList.contains('grid-open')) {
    grid.classList.remove('grid-open');
    setTimeout(function() { grid.style.display = 'none'; }, 250);
    if (chip) chip.classList.remove('open');
  }
}

function getSelectedCategory(mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (!grid) return 'etc';
  const sel = grid.querySelector('.expense-cat-btn.selected');
  return sel ? sel.getAttribute('data-cat') : 'etc';
}

function clearCategorySelection(mode) {
  mode = mode || 'normal';
  var suffix = mode === 'modal' ? 'Modal' : '';
  var grid = document.getElementById('expenseCategoryGrid' + suffix);
  if (grid) {
    var btns = grid.querySelectorAll('.expense-cat-btn');
    btns.forEach(function(btn) {
      btn.classList.remove('selected');
      btn.style.borderColor = '';
    });
    // 그리드 접기
    grid.classList.remove('grid-open');
    grid.style.display = 'none';
  }

  // 칩 초기화
  var chip = document.getElementById('expenseCatChip' + suffix);
  var chipText = document.getElementById('expenseCatChipText' + suffix);
  if (chip && chipText) {
    chipText.textContent = '카테고리 선택';
    chip.classList.remove('has-value');
    chip.classList.remove('open');
  }
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
  // 날짜 선택 UI 미구현 — 향후 구현 시 이 함수에 로직 추가
  return;
}

var _smsPasteMode = 'normal';
var _prefetchedClipboard = null;

async function pasteFromClipboard(mode) {
  _smsPasteMode = mode || 'normal';
  var suffix = _smsPasteMode === 'modal' ? 'Modal' : '';
  try {
    var text;
    if (_prefetchedClipboard) {
      text = _prefetchedClipboard;
      _prefetchedClipboard = null;
    } else {
      text = await navigator.clipboard.readText();
    }
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
      var pasteDateEl = document.getElementById('expenseDateValue' + suffix);
      if (pasteDateEl) {
        pasteDateEl.textContent = formatExpenseDate(d);
        pasteDateEl.setAttribute('data-date', parsed.date);
        pasteDateEl.setAttribute('data-time', parsed.time || '');
      }
    }
    selectCategory(parsed.category, _smsPasteMode);
    updateExpenseSaveBtn(_smsPasteMode);
  } catch (err) {
    alert('클립보드를 읽을 수 없습니다.\n브라우저 권한을 확인해주세요.');
  }
}

async function prefetchClipboardForExpense(mode) {
  try {
    var text = await navigator.clipboard.readText();
    if (!text || !text.trim()) return;
    var parsed = parseSMS(text.trim());
    if (!parsed) {
      _prefetchedClipboard = text.trim();
      return;
    }
    var suffix = mode === 'modal' ? 'Modal' : '';
    document.getElementById('expenseAmountInput' + suffix).value = parsed.amount.toLocaleString();
    document.getElementById('expenseMerchantInput' + suffix).value = parsed.merchant;
    document.getElementById('expenseCardInput' + suffix).value = parsed.card;
    if (parsed.date) {
      var d = new Date(parsed.date + 'T' + (parsed.time || '00:00'));
      var prefetchDateEl = document.getElementById('expenseDateValue' + suffix);
      if (prefetchDateEl) {
        prefetchDateEl.textContent = formatExpenseDate(d);
        prefetchDateEl.setAttribute('data-date', parsed.date);
        prefetchDateEl.setAttribute('data-time', parsed.time || '');
      }
    }
    selectCategory(parsed.category, mode);
    updateExpenseSaveBtn(mode);
    _prefetchedClipboard = null;
  } catch (err) {
    _prefetchedClipboard = null;
  }
}

function saveExpenseForm(mode = 'normal') {
  const suffix = mode === 'modal' ? 'Modal' : '';
  const amountStr = document.getElementById('expenseAmountInput' + suffix).value.replace(/,/g, '');
  const amount = parseInt(amountStr);
  if (!amount || amount <= 0) return;

  const merchant = document.getElementById('expenseMerchantInput' + suffix).value.trim();

  const card = document.getElementById('expenseCardInput' + suffix).value.trim();
  const memo = (document.getElementById('expenseMemoInput' + suffix) || {}).value || '';
  const category = getSelectedCategory(mode);
  var dateEl = document.getElementById('expenseDateValue' + suffix);
  var date, time;
  if (dateEl && dateEl.getAttribute('data-date')) {
    date = dateEl.getAttribute('data-date');
    time = dateEl.getAttribute('data-time') || '';
  } else {
    var parsed = parseExpenseDateText(dateEl ? dateEl.textContent : '');
    date = parsed.date;
    time = parsed.time;
  }

  if (curExpenseId) {
    updateExpense(curExpenseId, { amount, category, merchant, card, memo, date, time });
  } else {
    newExpense({ amount, category, merchant, card, memo, date, time, source: 'manual' });
  }

  // 매출처 아이콘 매핑 저장 (브랜드/비브랜드 분기)
  var iconUrl = (document.getElementById('expenseIconUrl' + suffix) || {}).value || '';
  iconUrl = iconUrl.trim();
  if (iconUrl && !iconUrl.match(/^https?:\/\//)) {
    var urlInput = document.getElementById('expenseIconUrl' + suffix);
    var errorEl = document.getElementById('expenseIconError' + suffix);
    if (urlInput) urlInput.classList.add('input-error');
    if (errorEl) errorEl.classList.add('show');
    return;
  }

  var currentBrand = null;
  if (curExpenseId) {
    var savedExp = getExpenses().find(function(x) { return x.id === curExpenseId; });
    if (savedExp) currentBrand = savedExp.brand || null;
  }

  // 아이콘 URL이 있으면 로드 검증
  if (iconUrl) {
    validateIconUrl(iconUrl, function(ok) {
      if (!ok) {
        alert('이 URL은 이미지를 로드할 수 없습니다. 다른 URL을 입력해주세요.');
        return;
      }
      // 검증 완료 후 저장 진행
      _saveIconAfterValidation(currentBrand, merchant, iconUrl, mode);
    });
    return;
  } else {
    // URL이 없으면 바로 삭제 로직 진행
    _saveIconAfterValidation(currentBrand, merchant, null, mode);
  }
}

function _saveIconAfterValidation(currentBrand, merchant, iconUrl, mode) {
  if (currentBrand && iconUrl) {
    var sameBrandCount = getExpenses().filter(function(ex) { return ex.brand === currentBrand; }).length;
    if (sameBrandCount > 1) {
      if (!confirm(currentBrand + ' 브랜드 전체 ' + sameBrandCount + '건에 새 아이콘이 적용됩니다. 계속할까요?')) return;
    }
    setBrandIcon(currentBrand, iconUrl);
  } else if (currentBrand && !iconUrl) {
    if (getBrandIcon(currentBrand)) {
      setBrandIcon(currentBrand, null);
    }
  } else if (!currentBrand && merchant && iconUrl) {
    saveMerchantIcon(merchant, iconUrl);
  } else if (!currentBrand && merchant && !iconUrl) {
    var icons = getMerchantIcons();
    var cleaned = icons.filter(function(item) { return item.keyword !== merchant; });
    if (cleaned.length !== icons.length) {
      saveMerchantIcons(cleaned);
    }
  }

  // UI 업데이트 및 정리
  updateExpenseCompact();
  SYNC.scheduleDatabaseSave();

  // 아이콘 변경 시 _yearlyRankLoaded 보존
  var prevRankLoaded = _yearlyRankLoaded;

  if (mode === 'modal') {
    // 모달: 닫고 대시보드 갱신
    closeExpenseModal();
    if (window.innerWidth > 768) {
      renderExpenseDashboard('pc');
    }
    _yearlyRankLoaded = prevRankLoaded;
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

  _yearlyRankLoaded = prevRankLoaded;
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
    var iconItem = { merchant: m.merchant, icon: null, category: m.category, brand: m.isBrand ? m.merchant : null };

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

// 상호 클릭 → 해당 상호의 월간/연간 내역을 플로팅 팝업으로 표시
function openMerchantDetail(merchant, year) {
  var expenses;
  var titleSuffix;

  if (year) {
    // 연간 모드 — _yearlyEndYM이 있으면 해당 월까지만
    var yearStr = String(year);
    var mdEndDate = null;
    if (_yearlyEndYM) {
      var mdParts = _yearlyEndYM.split('-');
      var mdLastDay = new Date(parseInt(mdParts[0]), parseInt(mdParts[1]), 0).getDate();
      mdEndDate = _yearlyEndYM + '-' + String(mdLastDay).padStart(2, '0');
    }
    expenses = getExpenses()
      .filter(function(e) {
        if (!e.date || !e.date.startsWith(yearStr)) return false;
        if (mdEndDate && e.date > mdEndDate) return false;
        if (e.brand && e.brand === merchant) return true;
        if (!e.brand && (e.merchant || '').trim() === merchant) return true;
        return false;
      })
      .sort(function(a, b) { return (b.date + ' ' + (b.time || '')).localeCompare(a.date + ' ' + (a.time || '')); });
    var mdMonth = _yearlyEndYM ? parseInt(_yearlyEndYM.split('-')[1]) : null;
    titleSuffix = (mdMonth && mdMonth < 12 ? year + '년 1~' + mdMonth + '월' : year + '년');
  } else {
    // 월간 모드: 현재 보고 있는 월
    var ym = getExpenseViewYM();
    expenses = getMonthExpenses(ym)
      .filter(function(e) {
        if (e.brand && e.brand === merchant) return true;
        if (!e.brand && (e.merchant || '').trim() === merchant) return true;
        return false;
      })
      .sort(function(a, b) { return (b.date + ' ' + (b.time || '')).localeCompare(a.date + ' ' + (a.time || '')); });
    var parts = ym.split('-');
    var mo = parseInt(parts[1]);
    titleSuffix = mo + '월';
  }

  var total = expenses.reduce(function(s, e) { return s + e.amount; }, 0);
  var title = merchant + ' · ' + titleSuffix;

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

// 연간 카테고리별 기타 클릭 → 해당 카테고리 내 상호별 소계 팝업
function openCategoryEtcPopup(catId, displayName, year) {
  var data = getYearMerchantBreakdown(year, _yearlyEndYM);
  if (!data || !data.merchants) return;

  // 해당 카테고리 기타 항목 찾기
  var etcEntry = data.merchants.find(function(m) {
    return m.isCategoryEtc && m.category === catId;
  });

  if (!etcEntry || !etcEntry.etcItems || etcEntry.etcItems.length === 0) return;

  var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === catId; });
  var catName = catObj ? catObj.name : '기타';
  var title = (catId === 'etc' ? '기타' : catName + ' 기타') + ' · ' + year + '년';

  var items = etcEntry.etcItems.slice().sort(function(a, b) { return b.amount - a.amount; });
  var total = items.reduce(function(s, m) { return s + m.amount; }, 0);

  var contentHtml = '<div class="exp-fp-yearly-list">';

  items.forEach(function(m, i) {
    var iconItem = { merchant: m.merchant, icon: null, category: m.category, brand: m.isBrand ? m.merchant : null };

    contentHtml += '<div class="exp-fp-yearly-row" style="cursor:pointer;" onclick="closeExpenseFloatingPopup(); openMerchantDetail(\'' + _escMerchant(m.merchant) + '\',' + year + ')">';
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

  contentHtml += '<div class="exp-fp-footer">';
  contentHtml += '<span class="exp-fp-footer-label">' + items.length + '개 상호 합계</span>';
  contentHtml += '<span class="exp-fp-footer-amount">' + total.toLocaleString() + '원</span>';
  contentHtml += '</div>';

  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2 - 50;
  openExpenseFloatingPopup(title, contentHtml, cx, cy);
}

// 카테고리 태그 클릭 → 해당 카테고리의 월간(year 없음) 또는 연간(year 있음) 내역을 플로팅 팝업으로 표시
function openCategoryExpensePopup(catId, catName, year) {
  var expenses;
  var title;

  if (year) {
    // 연간 모드 — _yearlyEndYM이 있으면 해당 월까지만
    var yearStr = String(year);
    var endDate = null;
    if (_yearlyEndYM) {
      var epParts = _yearlyEndYM.split('-');
      var epLastDay = new Date(parseInt(epParts[0]), parseInt(epParts[1]), 0).getDate();
      endDate = _yearlyEndYM + '-' + String(epLastDay).padStart(2, '0');
    }
    expenses = getExpenses()
      .filter(function(e) {
        if (!e.date || !e.date.startsWith(yearStr) || e.category !== catId) return false;
        if (endDate && e.date > endDate) return false;
        return true;
      })
      .sort(function(a, b) { return (b.date + ' ' + (b.time || '')).localeCompare(a.date + ' ' + (a.time || '')); });
    var epMonth = _yearlyEndYM ? parseInt(_yearlyEndYM.split('-')[1]) : null;
    title = catName + ' · ' + (epMonth && epMonth < 12 ? year + '년 1~' + epMonth + '월' : year + '년');
  } else {
    // 월간 모드 (기존 동작)
    var ym = getExpenseViewYM();
    expenses = getMonthExpenses(ym)
      .filter(function(e) { return e.category === catId; })
      .sort(function(a, b) { return (b.date + ' ' + (b.time || '')).localeCompare(a.date + ' ' + (a.time || '')); });
    var parts = ym.split('-');
    var mo = parseInt(parts[1]);
    title = catName + ' · ' + mo + '월';
  }

  var total = expenses.reduce(function(s, e) { return s + e.amount; }, 0);

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

  // 선택 효과 적용
  _selectedExpenseDate = dateStr;
  document.querySelectorAll('.exp-month-day.exp-day-selected').forEach(function(el) {
    el.classList.remove('exp-day-selected');
  });
  var clickedCell = event.currentTarget;
  if (clickedCell) clickedCell.classList.add('exp-day-selected');

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

  var iconItem1 = { merchant: top1.merchant, icon: null, category: top1.category, brand: top1.isBrand ? top1.merchant : null };

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
  html += '<div class="exp-yearly-hero" onclick="openMerchantDetail(\'' + _escMerchant(top1.merchant) + '\')">';
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
function renderYearlySection(year, endYM) {
  _yearlyEndYM = endYM || null;
  var data = getYearMerchantBreakdown(year, endYM);
  if (!data || !data.merchants || data.merchants.length === 0) {
    return '';
  }

  var merchants = data.merchants;

  // 현재 연도 판별
  var now = new Date();
  var currentYear = now.getFullYear();
  var isCurrentYear = (year === currentYear);

  // 버블 컨테이너 크기
  var containerW = Math.min(680, window.innerWidth - 80);
  var containerH = window.innerWidth <= 768 ? 160 : 280;

  // 헤더 텍스트에 월 정보 반영
  var endMonthNum = null;
  var endDayNum = null;
  var nowYM = today().slice(0, 7);
  if (endYM) {
    var epParts = endYM.split('-');
    endMonthNum = parseInt(epParts[1]);
    if (endYM === nowYM) {
      endDayNum = new Date().getDate();
    }
  }

  var html = '<div class="exp-yearly-section">';
  html += '<div class="exp-yearly-header">';
  if (isCurrentYear && endYM === nowYM) {
    // 현재 연도 + 현재 월: "올해 ~까지 총 X원 쓰고 있어요"
    if (window.innerWidth <= 768) {
      html += '<div class="exp-yearly-title">올해 <span style="color:#E55643;">총 ' + formatAmount(data.total) + '원</span> 쓰고 있어요</div>';
    } else {
      html += '<div class="exp-yearly-title">' + year + '년 ' + endMonthNum + '월 ' + endDayNum + '일까지 <span style="color:#E55643;">총 ' + formatAmount(data.total) + '원</span> 쓰고 있어요</div>';
    }
  } else if (isCurrentYear && endYM && endYM !== nowYM) {
    // 현재 연도 + 과거 월: "2026년 1~7월 총 X원 썼어요"
    html += '<div class="exp-yearly-title">' + year + '년 1~' + endMonthNum + '월 <span style="color:#E55643;">총 ' + formatAmount(data.total) + '원</span> 썼어요</div>';
  } else {
    // 과거 연도
    if (endYM && endMonthNum < 12) {
      html += '<div class="exp-yearly-title">' + year + '년 1~' + endMonthNum + '월 <span style="color:#E55643;">총 ' + formatAmount(data.total) + '원</span> 썼어요</div>';
    } else {
      html += '<div class="exp-yearly-title">' + year + '년 <span style="color:#E55643;">총 ' + formatAmount(data.total) + '원</span> 썼어요</div>';
    }
  }
  html += '</div>';

  // 카테고리 트리맵
  html += renderCategoryTreemap(year, endYM);

  // 버블 차트
  html += _renderYearlyBubbles(merchants, containerW, containerH);

  // 랭킹 리스트 (10개)
  var rankLimit = Math.min(Math.max(10, _yearlyRankLoaded), merchants.length);
  html += '<div class="yearly-rank-list-wrap" data-year="' + year + '" data-endym="' + (endYM || '') + '" data-loaded="' + rankLimit + '">';
  html += _renderYearlyRankList(merchants, rankLimit, year);
  html += '</div>';

  // "더 보기" 버튼 (10개 초과 시)
  if (merchants.length > rankLimit) {
    html += '<div class="exp-mr-more-wrap yearly-rank-more-wrap">';
    html += '<button class="exp-cat-more-btn" onclick="loadMoreYearlyRank()">더 보기</button>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

// 연간 그리드 아이템 HTML 생성 (공통)
function _renderYearlyGridItem(m, rank, year) {
  var iconItem = { merchant: m.merchant, icon: null, category: m.category, brand: m.isBrand ? m.merchant : null };
  var onclickYear = year ? ',' + year : '';
  var html = '<div class="exp-yearly-grid-item" onclick="openMerchantDetail(\'' + _escMerchant(m.merchant) + '\'' + onclickYear + ')">';
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
  if (!items || items.length === 0) return [];

  var maxAmount = items[0].amount;
  var minR = 14;
  var maxR = Math.min(containerW * 0.32, containerH * 0.40);
  var cx = containerW / 2;
  var cy = containerH / 2;

  var circles = items.map(function(item, i) {
    var ratio = Math.sqrt(item.amount / maxAmount);
    var r = Math.max(minR, ratio * maxR);
    return { x: cx, y: cy, r: r, item: item, index: i };
  });

  var maxR_actual = circles[0].r;

  // 첫 번째 원(가장 큰)은 정확히 중앙
  circles[0].x = cx;
  circles[0].y = cy;

  // 나머지 원: 크기 순서대로 중앙 근처에서 시작
  for (var i = 1; i < circles.length; i++) {
    var angle = i * 2.4; // golden angle
    var dist = circles[0].r + circles[i].r + 4;
    circles[i].x = cx + Math.cos(angle) * dist * 0.5;
    circles[i].y = cy + Math.sin(angle) * dist * 0.5;
  }

  // Force simulation
  for (var iter = 0; iter < 200; iter++) {
    // 겹침 해소: 작은 원이 더 많이 밀려남
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
          var totalR = circles[i].r + circles[j].r;
          var ratioI = circles[j].r / totalR;
          var ratioJ = circles[i].r / totalR;
          circles[i].x -= nx * overlap * ratioI;
          circles[i].y -= ny * overlap * ratioI;
          circles[j].x += nx * overlap * ratioJ;
          circles[j].y += ny * overlap * ratioJ;
        }
      }
    }

    // 중앙 끌기: 큰 원 강하게, 작은 원 약하게
    for (var i = 0; i < circles.length; i++) {
      var strength = 0.02 + 0.08 * (circles[i].r / maxR_actual);
      circles[i].x += (cx - circles[i].x) * strength;
      circles[i].y += (cy - circles[i].y) * strength;
    }

    // 경계 안에 유지
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
// 버블 차트 HTML 생성
function _renderYearlyBubbles(merchants, containerW, containerH) {
  // 1. brand 있는 항목과 없는 항목 분리
  var brandItems = [];
  var nonBrandByCat = {}; // catId → {amount, count, items[]}

  merchants.forEach(function(m) {
    if (m.isEtcGroup) {
      // 기타 묶음 → 'etc' 카테고리에 합산
      var cat = 'etc';
      if (!nonBrandByCat[cat]) nonBrandByCat[cat] = { amount: 0, count: 0, items: [] };
      nonBrandByCat[cat].amount += m.amount;
      nonBrandByCat[cat].count += m.count;
      if (m.etcItems) {
        m.etcItems.forEach(function(ei) { nonBrandByCat[cat].items.push(ei); });
      }
    } else if (m.isBrand) {
      // 아이콘이 있는 브랜드만 개별 버블로 (아이콘 없으면 버블에 표시 안 함)
      var src = getBrandIcon(m.merchant);
      if (!src) src = findMerchantIcon(m.merchant) || findMerchantIcon(resolveAlias(m.merchant));
      if (src) {
        brandItems.push(m);
      }
      // 아이콘 없는 브랜드는 카테고리 버블에도 합산하지 않음
    } else {
      // 비브랜드만 카테고리 버블에 합산
      var cat = m.category || 'etc';
      if (!nonBrandByCat[cat]) nonBrandByCat[cat] = { amount: 0, count: 0, items: [] };
      nonBrandByCat[cat].amount += m.amount;
      nonBrandByCat[cat].count += 1;
      nonBrandByCat[cat].items.push(m);
    }
  });

  // 2. 버블 아이템 준비: 브랜드 개별 + 카테고리 묶음
  var bubbleItems = [];

  // 브랜드 상위 20개
  var bubbleLimit = 20;
  brandItems.slice(0, bubbleLimit).forEach(function(m) {
    bubbleItems.push({
      type: 'brand',
      merchant: m.merchant,
      amount: m.amount,
      category: m.category,
      brand: m.merchant
    });
  });

  // 카테고리 묶음
  Object.keys(nonBrandByCat).forEach(function(catId) {
    var catData = nonBrandByCat[catId];
    if (catData.amount <= 0) return;
    var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === catId; });
    bubbleItems.push({
      type: 'category',
      catId: catId,
      merchant: catObj ? catObj.name : '기타',
      amount: catData.amount,
      category: catId,
      brand: null,
      catColor: catObj ? catObj.color : '#A0A0A8'
    });
  });

  // 금액 내림차순 정렬
  bubbleItems.sort(function(a, b) { return b.amount - a.amount; });

  var yearVal = new Date(getExpenseViewYM() + '-01').getFullYear();

  if (bubbleItems.length === 0) return '';

  var circles = _packCircles(bubbleItems, containerW, containerH);

  var html = '<div class="exp-yearly-bubble-wrap" style="width:100%;height:' + containerH + 'px;position:relative;overflow:hidden;">';

  circles.forEach(function(c) {
    var size = Math.round(c.r * 2);
    var left = Math.round(c.x - c.r);
    var top = Math.round(c.y - c.r);
    var imgSize = Math.round(c.r * 2 - 4);
    var item = c.item;

    var onclick;
    if (item.type === 'category') {
      onclick = 'openCategoryExpensePopup(\'' + item.catId + '\',\'' + item.merchant.replace(/'/g, "\\'") + '\',' + yearVal + ')';
    } else {
      onclick = 'openMerchantDetail(\'' + _escMerchant(item.merchant) + '\',' + yearVal + ')';
    }

    html += '<div class="exp-yearly-bubble" onclick="' + onclick + '" style="'
      + 'position:absolute;'
      + 'left:' + left + 'px;'
      + 'top:' + top + 'px;'
      + 'width:' + size + 'px;'
      + 'height:' + size + 'px;'
      + 'border-radius:50%;'
      + 'background:#fff;'
      + 'box-shadow:0 2px 12px rgba(0,0,0,0.10);'
      + 'display:flex;align-items:center;justify-content:center;'
      + 'cursor:pointer;transition:transform .15s,box-shadow .15s;'
      + '">';

    if (item.type === 'category') {
      // 카테고리 묶음 버블: 카테고리 색상 + 이름
      var catColor = item.catColor || '#A0A0A8';
      var bubbleFontSize = Math.max(10, Math.round(imgSize * 0.28));
      html += '<div style="width:' + imgSize + 'px;height:' + imgSize + 'px;border-radius:50%;background:' + catColor + ';display:flex;align-items:center;justify-content:center;">';
      html += '<span style="color:#fff;font-size:' + bubbleFontSize + 'px;font-weight:600;">' + item.merchant + '</span>';
      html += '</div>';
    } else {
      // 브랜드 개별 버블: 아이콘 표시
      var src = getBrandIcon(item.brand);
      if (!src) src = findMerchantIcon(item.merchant) || findMerchantIcon(resolveAlias(item.merchant));
      var category = item.category || 'etc';

      if (src) {
        html += '<img src="' + src + '" width="' + imgSize + '" height="' + imgSize + '" style="border-radius:50%;object-fit:cover;" onerror="_logoFallback(this,\'' + category + '\')">';
      } else {
        var bCatObj = EXPENSE_CATEGORIES.find(function(cc) { return cc.id === category; });
        var bCatColor = bCatObj ? bCatObj.color : '#B0B0B8';
        var bubbleFontSize = Math.max(10, Math.round(imgSize * 0.28));
        html += '<div style="width:' + imgSize + 'px;height:' + imgSize + 'px;border-radius:50%;background:' + bCatColor + ';display:flex;align-items:center;justify-content:center;">';
        html += '<span style="color:#fff;font-size:' + bubbleFontSize + 'px;font-weight:600;">' + getCatShortName(category) + '</span>';
        html += '</div>';
      }
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

// 랭킹 리스트 HTML 생성
function _renderYearlyRankList(merchants, limit, year) {
  var showList = merchants.slice(0, limit);

  var html = '<div class="exp-yearly-rank-list">';

  showList.forEach(function(m, i) {
    var rank = i + 1;
    var rankSize = rank <= 3 ? '20px' : '15px';
    var rankWeight = rank <= 3 ? '700' : '600';
    var rankColor = 'var(--tx-m)';
    var nameWeight = rank === 1 ? '600' : '400';

    var src = null;
    var useCatIcon = false;
    if (m.isEtcGroup) {
      useCatIcon = true;
    } else {
      if (m.isBrand) src = getBrandIcon(m.merchant);
      if (!src) src = findMerchantIcon(m.merchant) || findMerchantIcon(resolveAlias(m.merchant));
    }

    var rankOnclick = m.isEtcGroup
      ? 'openEtcGroupPopup(' + year + ')'
      : 'openMerchantDetail(\'' + _escMerchant(m.merchant) + '\',' + year + ')';
    html += '<div class="exp-yearly-rank-row" onclick="' + rankOnclick + '">';

    html += '<span class="exp-yearly-rank-num" style="font-size:' + rankSize + ';font-weight:' + rankWeight + ';color:' + rankColor + ';">' + rank + '</span>';

    html += '<div class="exp-yearly-rank-icon">';
    if (useCatIcon) {
      var eCatObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === m.category; });
      var eCatColor = eCatObj ? eCatObj.color : '#B0B0B8';
      var eCatName = eCatObj ? eCatObj.name : '기타';
      html += '<div style="width:36px;height:36px;border-radius:50%;background:' + eCatColor + ';display:flex;align-items:center;justify-content:center;">';
      html += '<span style="color:#fff;font-size:12px;font-weight:600;">' + getCatShortName(m.category) + '</span>';
      html += '</div>';
    } else {
      var catForFallback = m.category || 'etc';
      if (src) {
        html += '<img src="' + src + '" width="36" height="36" style="border-radius:50%;object-fit:cover;" onerror="_logoFallback(this,\'' + catForFallback + '\')">';
      } else {
        var rCatObj = EXPENSE_CATEGORIES.find(function(cc) { return cc.id === catForFallback; });
        var rCatColor = rCatObj ? rCatObj.color : '#B0B0B8';
        var rCatName = rCatObj ? rCatObj.name : '기타';
        html += '<div style="width:36px;height:36px;border-radius:50%;background:' + rCatColor + ';display:flex;align-items:center;justify-content:center;">';
        html += '<span style="color:#fff;font-size:12px;font-weight:600;">' + getCatShortName(catForFallback) + '</span>';
        html += '</div>';
      }
    }
    html += '</div>';

    html += '<div class="exp-yearly-rank-name" style="font-weight:' + nameWeight + ';">' + m.merchant + '</div>';

    html += '<div class="exp-yearly-rank-amount">' + formatAmount(m.amount) + '원</div>';

    html += '</div>';
  });

  html += '</div>';
  return html;
}

// 연간 랭킹 로드모어
function loadMoreYearlyRank() {
  // 현재 보이는 대시보드 컨테이너에서 찾기 (PC: expFullDashboardPane, 모바일: expenseDashboard)
  var container = null;
  if (window.innerWidth > 768) {
    container = document.getElementById('expFullDashboardPane');
  } else {
    container = document.getElementById('expenseDashboard');
  }
  if (!container) return;

  var wrap = container.querySelector('.yearly-rank-list-wrap');
  var moreWrap = container.querySelector('.yearly-rank-more-wrap');
  if (!wrap) return;

  var year = parseInt(wrap.getAttribute('data-year'));
  var loaded = parseInt(wrap.getAttribute('data-loaded'));
  var endYM = wrap.getAttribute('data-endym') || null;
  if (endYM === '') endYM = null;
  var data = getYearMerchantBreakdown(year, endYM);
  if (!data || !data.merchants) return;

  var merchants = data.merchants;
  var nextBatch = merchants.slice(loaded, loaded + 10);
  if (nextBatch.length === 0) return;

  // 랭킹 리스트 컨테이너 (exp-yearly-rank-list) 찾기
  var listEl = wrap.querySelector('.exp-yearly-rank-list');
  if (!listEl) return;

  // 추가 항목 HTML 생성
  var html = '';
  nextBatch.forEach(function(m, i) {
    var rank = loaded + i + 1;
    var rankSize = rank <= 3 ? '20px' : '15px';
    var rankWeight = rank <= 3 ? '700' : '600';
    var rankColor = 'var(--tx-m)';
    var nameWeight = rank === 1 ? '600' : '400';

    var src = null;
    var useCatIcon = false;
    if (m.isEtcGroup) {
      useCatIcon = true;
    } else {
      if (m.isBrand) src = getBrandIcon(m.merchant);
      if (!src) src = findMerchantIcon(m.merchant) || findMerchantIcon(resolveAlias(m.merchant));
    }

    var rankOnclick = m.isEtcGroup
      ? 'openEtcGroupPopup(' + year + ')'
      : 'openMerchantDetail(\'' + _escMerchant(m.merchant) + '\',' + year + ')';
    html += '<div class="exp-yearly-rank-row" onclick="' + rankOnclick + '">';
    html += '<span class="exp-yearly-rank-num" style="font-size:' + rankSize + ';font-weight:' + rankWeight + ';color:' + rankColor + ';">' + rank + '</span>';
    html += '<div class="exp-yearly-rank-icon">';
    if (useCatIcon) {
      var eCatObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === m.category; });
      var eCatColor = eCatObj ? eCatObj.color : '#B0B0B8';
      var eCatName = eCatObj ? eCatObj.name : '기타';
      html += '<div style="width:36px;height:36px;border-radius:50%;background:' + eCatColor + ';display:flex;align-items:center;justify-content:center;">';
      html += '<span style="color:#fff;font-size:12px;font-weight:600;">' + getCatShortName(m.category) + '</span>';
      html += '</div>';
    } else {
      var catForFallback = m.category || 'etc';
      if (src) {
        html += '<img src="' + src + '" width="36" height="36" style="border-radius:50%;object-fit:cover;" onerror="_logoFallback(this,\'' + catForFallback + '\')">';
      } else {
        var rCatObj = EXPENSE_CATEGORIES.find(function(cc) { return cc.id === catForFallback; });
        var rCatColor = rCatObj ? rCatObj.color : '#B0B0B8';
        var rCatName = rCatObj ? rCatObj.name : '기타';
        html += '<div style="width:36px;height:36px;border-radius:50%;background:' + rCatColor + ';display:flex;align-items:center;justify-content:center;">';
        html += '<span style="color:#fff;font-size:12px;font-weight:600;">' + getCatShortName(catForFallback) + '</span>';
        html += '</div>';
      }
    }
    html += '</div>';
    html += '<div class="exp-yearly-rank-name" style="font-weight:' + nameWeight + ';">' + m.merchant + '</div>';
    html += '<div class="exp-yearly-rank-amount">' + formatAmount(m.amount) + '원</div>';
    html += '</div>';
  });

  listEl.insertAdjacentHTML('beforeend', html);

  // loaded 카운트 갱신
  var newLoaded = loaded + nextBatch.length;
  wrap.setAttribute('data-loaded', newLoaded);
  _yearlyRankLoaded = newLoaded;

  // 더 이상 항목이 없으면 버튼 숨김
  if (newLoaded >= merchants.length && moreWrap) {
    moreWrap.style.display = 'none';
  }
}

// 연간 전체 상호 리스트 팝업
function openYearlyFullPopup(year, startFrom) {
  var data = getYearMerchantBreakdown(year, _yearlyEndYM);
  if (!data || !data.merchants || data.merchants.length === 0) return;

  var allMerchants = data.merchants;
  var merchants = startFrom ? allMerchants.slice(startFrom) : allMerchants;
  var rankOffset = startFrom || 0;
  var title = startFrom ? year + '년 ' + (startFrom + 1) + '위 이하' : year + '년 전체 상호';

  if (merchants.length === 0) return;

  var contentHtml = '<div class="exp-fp-yearly-list">';

  merchants.forEach(function(m, i) {
    var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === m.category; });
    var catColor = catObj ? catObj.color : '#B0B0B8';
    var iconItem = { merchant: m.merchant, icon: null, category: m.category, brand: m.isBrand ? m.merchant : null };

    var fpOnclick = m.isEtcGroup
      ? ''
      : 'closeExpenseFloatingPopup(); openMerchantDetail(\'' + _escMerchant(m.merchant) + '\',' + year + ')';
    contentHtml += '<div class="exp-fp-yearly-row" style="cursor:pointer;" onclick="' + fpOnclick + '">';
    contentHtml += '<span class="exp-fp-yearly-rank">' + (rankOffset + i + 1) + '</span>';
    if (m.isEtcGroup) {
      var fpCatObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === m.category; });
      var fpCatColor = fpCatObj ? fpCatObj.color : '#B0B0B8';
      var fpCatName = fpCatObj ? fpCatObj.name : '기타';
      contentHtml += '<div class="exp-tl-item-icon exp-tl-item-icon-cat" style="background:' + fpCatColor + ';">';
      contentHtml += '<span style="color:#fff;font-size:11px;font-weight:600;">' + fpCatName.substring(0, 2) + '</span>';
      contentHtml += '</div>';
    } else {
      contentHtml += getMerchantIconHtml(iconItem);
    }
    contentHtml += '<div class="exp-fp-yearly-info">';
    contentHtml += '<div class="exp-fp-yearly-name">' + m.merchant + '</div>';
    contentHtml += '<div class="exp-fp-yearly-meta">' + m.count + '건 · ' + m.percent + '%</div>';
    contentHtml += '</div>';
    contentHtml += '<div class="exp-fp-yearly-amount">' + formatAmount(m.amount) + '원</div>';
    contentHtml += '</div>';
  });

  contentHtml += '</div>';

  // 하단 합계
  var displayTotal = merchants.reduce(function(s, m) { return s + m.amount; }, 0);
  contentHtml += '<div class="exp-fp-footer">';
  contentHtml += '<span class="exp-fp-footer-label">' + merchants.length + '개 상호 합계</span>';
  contentHtml += '<span class="exp-fp-footer-amount">' + formatAmount(displayTotal) + '원</span>';
  contentHtml += '</div>';

  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2 - 50;
  openExpenseFloatingPopup(title, contentHtml, cx, cy);
}

// "기타" 묶음 클릭 → 소액 항목 리스트 팝업
function openEtcGroupPopup(year) {
  var data = getYearMerchantBreakdown(year, _yearlyEndYM);
  if (!data || !data.merchants) return;

  var etcEntry = data.merchants.find(function(m) { return m.isEtcGroup; });
  if (!etcEntry || !etcEntry.etcItems || etcEntry.etcItems.length === 0) return;

  var items = etcEntry.etcItems.slice().sort(function(a, b) { return b.amount - a.amount; });
  var total = items.reduce(function(s, m) { return s + m.amount; }, 0);
  var title = '기타 · ' + year + '년 (1만원 이하)';

  var contentHtml = '<div class="exp-fp-yearly-list">';

  items.forEach(function(m, i) {
    var iconItem = { merchant: m.merchant, icon: null, category: m.category, brand: m.isBrand ? m.merchant : null };

    contentHtml += '<div class="exp-fp-yearly-row" style="cursor:pointer;" onclick="closeExpenseFloatingPopup(); openMerchantDetail(\'' + _escMerchant(m.merchant) + '\',' + year + ')">';
    contentHtml += '<span class="exp-fp-yearly-rank">' + (i + 1) + '</span>';
    contentHtml += getMerchantIconHtml(iconItem);
    contentHtml += '<div class="exp-fp-yearly-info">';
    contentHtml += '<div class="exp-fp-yearly-name">' + m.merchant + '</div>';
    contentHtml += '<div class="exp-fp-yearly-meta">' + m.count + '건</div>';
    contentHtml += '</div>';
    contentHtml += '<div class="exp-fp-yearly-amount">' + formatAmount(m.amount) + '원</div>';
    contentHtml += '</div>';
  });

  contentHtml += '</div>';

  contentHtml += '<div class="exp-fp-footer">';
  contentHtml += '<span class="exp-fp-footer-label">' + items.length + '개 상호 합계</span>';
  contentHtml += '<span class="exp-fp-footer-amount">' + total.toLocaleString() + '원</span>';
  contentHtml += '</div>';

  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2 - 50;
  openExpenseFloatingPopup(title, contentHtml, cx, cy);
}

// ═══════════════════════════════════════
// 별명 일괄 관리 (레거시 — 브랜드 시스템으로 대체, merchantAliases 데이터는 보존)
// ═══════════════════════════════════════
function openAliasManager(mode) { /* 미사용 — 4단계에서 비활성화 */ }
function toggleAliasGroup(groupId) { /* 미사용 */ }
function openAliasEdit(expenseId, mode) { /* 미사용 */ }
function deleteAlias(originalMerchant, mode) { /* 미사용 */ }

// ═══ 브랜드 수정/삭제 (3-2에서 구현 예정) ═══
function openBrandEditPopup(mode) {
  if (!curExpenseId) return;
  var suffix = mode === 'modal' ? 'Modal' : '';
  var e = getExpenses().find(function(x) { return x.id === curExpenseId; });
  if (!e) return;
  var currentBrand = e.brand || '';
  var merchant = (e.merchant || '').trim();

  // 같은 브랜드를 가진 항목 수 (전체 적용 시 영향 범위)
  var sameBrandCount = 0;
  if (currentBrand) {
    sameBrandCount = getExpenses().filter(function(ex) { return ex.brand === currentBrand; }).length;
  }

  var contentHtml = '<div style="padding:0 18px 18px;">';

  // 브랜드명 입력
  contentHtml += '<div style="margin-bottom:16px;">';
  contentHtml += '<label style="display:block;font-size:12px;color:var(--tx-hint);font-weight:500;margin-bottom:6px;">브랜드명</label>';
  contentHtml += '<input type="text" id="brandEditInput" value="' + currentBrand.replace(/"/g, '&quot;') + '" placeholder="브랜드명 (비우면 비브랜드)" style="width:100%;border:none;border-bottom:1.5px solid var(--border-l);background:none;outline:none;padding:10px 0;font-size:15px;color:var(--tx);font-family:Pretendard,sans-serif;">';
  contentHtml += '</div>';

  // 매출처명 참고
  contentHtml += '<div style="font-size:12px;color:var(--tx-hint);margin-bottom:20px;">매출처: ' + merchant + '</div>';

  // 버튼들
  contentHtml += '<div style="display:flex;flex-direction:column;gap:8px;">';

  // "이 항목만 변경" 버튼
  contentHtml += '<button onclick="_applyBrandEdit(\'single\',\'' + mode + '\')" style="width:100%;padding:14px;background:#E55643;border:none;border-radius:10px;font-size:15px;color:#fff;font-weight:600;cursor:pointer;font-family:Pretendard,sans-serif;">이 항목만 변경</button>';

  // "이 브랜드 전체 변경" 버튼 (현재 브랜드가 있고 2건 이상일 때만)
  if (currentBrand && sameBrandCount > 1) {
    contentHtml += '<button onclick="_applyBrandEdit(\'all\',\'' + mode + '\')" style="width:100%;padding:14px;background:none;border:1px solid var(--border);border-radius:10px;font-size:15px;color:var(--tx-d);font-weight:500;cursor:pointer;font-family:Pretendard,sans-serif;">이 브랜드 전체 변경 (' + sameBrandCount + '건)</button>';
  }

  contentHtml += '</div>';
  contentHtml += '</div>';

  var cx = window.innerWidth / 2;
  var cy = window.innerHeight / 2 - 50;
  openExpenseFloatingPopup('브랜드 수정', contentHtml, cx, cy);
}

function _applyBrandEdit(scope, mode) {
  if (!curExpenseId) return;
  var suffix = mode === 'modal' ? 'Modal' : '';
  var inputEl = document.getElementById('brandEditInput');
  if (!inputEl) return;
  var newBrand = inputEl.value.trim() || null; // 빈 문자열 → null (비브랜드)
  var e = getExpenses().find(function(x) { return x.id === curExpenseId; });
  if (!e) return;
  var oldBrand = e.brand || null;
  var merchant = (e.merchant || '').trim();

  closeExpenseFloatingPopup();

  if (scope === 'single') {
    // "이 항목만 변경" — expense 업데이트 + brandOverrides 기록
    updateExpense(curExpenseId, { brand: newBrand });
    setBrandOverride(merchant, newBrand);

  } else if (scope === 'all') {
    // "이 브랜드 전체 변경" — 같은 brand 가진 모든 expense 일괄 업데이트
    if (!oldBrand) return;
    var expenses = getExpenses();
    var changed = 0;
    for (var i = 0; i < expenses.length; i++) {
      if (expenses[i].brand === oldBrand) {
        expenses[i].brand = newBrand;
        changed++;
      }
    }
    saveExpenses(expenses);

    // 새 브랜드에 기존 아이콘이 있으면 적용 안내
    if (newBrand && getBrandIcon(newBrand)) {
      // 이미 아이콘 있음 — 별도 처리 불필요
    } else if (newBrand && oldBrand && getBrandIcon(oldBrand)) {
      // 기존 브랜드 아이콘을 새 브랜드로 복사
      var oldIcon = getBrandIcon(oldBrand);
      setBrandIcon(newBrand, oldIcon);
    }
  }

  // UI 갱신: 브랜드 영역 업데이트
  var brandField = document.getElementById('expenseBrandField' + suffix);
  var brandNameEl = document.getElementById('expenseBrandName' + suffix);
  if (brandField && brandNameEl) {
    if (newBrand) {
      brandNameEl.textContent = newBrand;
      brandField.style.display = 'block';
    } else {
      brandField.style.display = 'none';
    }
  }

  SYNC.scheduleDatabaseSave();

  // 대시보드 리렌더
  if (mode === 'modal' && window.innerWidth > 768) {
    renderExpenseDashboard('pc');
  }
}

function removeBrandFromForm(mode) {
  if (!curExpenseId) return;
  if (!confirm('이 항목의 브랜드를 삭제할까요?')) return;
  var suffix = mode === 'modal' ? 'Modal' : '';
  var e = getExpenses().find(function(x) { return x.id === curExpenseId; });
  if (!e) return;

  // expense의 brand를 null로 변경
  updateExpense(curExpenseId, { brand: null });

  // brandOverrides에 명시적 비브랜드 기록
  setBrandOverride(e.merchant, null);

  // UI 업데이트: 브랜드 영역 숨김
  var brandField = document.getElementById('expenseBrandField' + suffix);
  if (brandField) brandField.style.display = 'none';

  SYNC.scheduleDatabaseSave();
}

// ═══════════════════════════════════════
// 카테고리 트리맵 (연간)
// ═══════════════════════════════════════
function renderCategoryTreemap(year, endYM) {
  var yearStr = String(year);
  var allExp;
  if (endYM) {
    var tmParts = endYM.split('-');
    var tmEndYear = parseInt(tmParts[0]);
    var tmEndMonth = parseInt(tmParts[1]);
    var tmLastDay = new Date(tmEndYear, tmEndMonth, 0).getDate();
    var tmEndDate = endYM + '-' + String(tmLastDay).padStart(2, '0');
    allExp = getExpenses().filter(function(e) { return e.date && e.date.startsWith(yearStr) && e.date <= tmEndDate; });
  } else {
    allExp = getExpenses().filter(function(e) { return e.date && e.date.startsWith(yearStr); });
  }
  if (!allExp.length) return '';

  var total = allExp.reduce(function(s, e) { return s + e.amount; }, 0);
  if (total <= 0) return '';

  // 카테고리별 합산
  var catMap = {};
  allExp.forEach(function(e) {
    var cat = e.category || 'etc';
    catMap[cat] = (catMap[cat] || 0) + e.amount;
  });

  // 기타(etc) 제외, 금액 > 0만 포함
  var items = [];
  EXPENSE_CATEGORIES.forEach(function(c) {
    if (c.id === 'etc') return;
    if (catMap[c.id] && catMap[c.id] > 0) {
      items.push({ id: c.id, name: c.name, color: c.color, amount: catMap[c.id] });
    }
  });

  if (items.length === 0) return '';

  // 금액 내림차순 정렬
  items.sort(function(a, b) { return b.amount - a.amount; });

  // 코랄 단색 그라데이션 팔레트
  var coralPalette = [
    'hsl(4, 65%, 52%)', 'hsl(4, 55%, 57%)', 'hsl(4, 48%, 61%)',
    'hsl(4, 42%, 65%)', 'hsl(4, 36%, 68%)', 'hsl(4, 36%, 68%)',
    'hsl(4, 30%, 71%)', 'hsl(4, 30%, 71%)', 'hsl(4, 25%, 73%)',
    'hsl(4, 25%, 73%)', 'hsl(4, 20%, 75%)', 'hsl(4, 20%, 75%)'
  ];

  // 면적 조정: pow(0.7)
  var adjustedItems = items.map(function(item, idx) {
    var colorIdx = Math.min(idx, coralPalette.length - 1);
    return {
      id: item.id, name: item.name,
      treemapColor: coralPalette[colorIdx],
      amount: item.amount,
      adjusted: Math.pow(item.amount, 0.7)
    };
  });

  // 최소 비율 동적 계산: 항목 수에 따라 각 항목이 충분한 면적을 갖도록
  var itemCount = adjustedItems.length;
  var minPct = Math.max(4, Math.round(60 / itemCount));
  var adjustedTotal = adjustedItems.reduce(function(s, it) { return s + it.adjusted; }, 0);
  adjustedItems.forEach(function(it) {
    var pct = it.adjusted / adjustedTotal * 100;
    if (pct < minPct) it.adjusted = adjustedTotal * minPct / (100 - minPct);
  });
  // 재계산
  adjustedTotal = adjustedItems.reduce(function(s, it) { return s + it.adjusted; }, 0);

  // 컨테이너 크기: 항목 수에 따라 높이 조절
  var containerW = 100;
  var baseH = window.innerWidth <= 768 ? 180 : 240;
  var containerH = itemCount > 6 ? baseH + (itemCount - 6) * 15 : baseH;

  // squarified treemap 레이아웃
  var rects = _squarify(adjustedItems.map(function(it) { return it.adjusted; }), 0, 0, containerW, containerH);

  // 실제 픽셀 너비
  var actualW = window.innerWidth <= 768 ? window.innerWidth - 40 : Math.min(680, window.innerWidth - 80);

  var html = '<div class="exp-treemap-wrap" style="height:' + containerH + 'px;">';

  adjustedItems.forEach(function(item, i) {
    var r = rects[i];
    if (!r) return;

    var cellPxW = r.w / 100 * actualW;
    var cellPxH = r.h;

    // 폰트 크기: 셀 면적에 비례
    var area = cellPxW * cellPxH;
    var nameFontSize = Math.round(Math.min(18, Math.max(10, Math.sqrt(area) * 0.12)));
    var amountFontSize = Math.round(Math.min(14, Math.max(9, Math.sqrt(area) * 0.09)));

    // 이름 표시 여부: 극히 작은 셀만 숨김
    var showName = cellPxH >= 16 && cellPxW >= 28;

    // 금액 텍스트
    var amountText = Math.round(item.amount / 10000) + '만';
    var showAmount = true;
    if (Math.round(item.amount / 10000) === 0) showAmount = false;

    // 세로 배치: 이름+금액+패딩이 확실히 들어가는 44px 이상에서만
    var useVertical = cellPxH >= 44;

    if (!useVertical) {
      // 가로 배치: 너비가 이름+금액 못 담으면 금액 숨김
      if (cellPxW < 45) showAmount = false;
      // 높이가 한 줄도 빠듯하면 금액 숨김
      if (cellPxH < 18) showAmount = false;
    }

    // 이름도 못 담으면 셀 자체를 렌더하지 않음
    if (!showName) return;

    var cellStyle = 'left:' + r.x + '%;top:' + r.y + 'px;width:' + r.w + '%;height:' + r.h + 'px;'
      + 'background:' + item.treemapColor + ';';

    if (useVertical) {
      cellStyle += 'flex-direction:column;gap:1px;';
    } else {
      cellStyle += 'flex-wrap:nowrap;gap:0 5px;';
    }

    html += '<div class="exp-treemap-cell" onclick="openCategoryExpensePopup(\'' + item.id + '\',\'' + item.name.replace(/'/g, "\\'") + '\',' + year + ')" style="' + cellStyle + '">';
    html += '<span class="exp-treemap-name" style="font-size:' + nameFontSize + 'px;">' + item.name + '</span>';
    if (showAmount) {
      html += '<span class="exp-treemap-amount" style="font-size:' + amountFontSize + 'px;">' + amountText + '</span>';
    }
    html += '</div>';
  });

  html += '</div>';
  return html;
}

// squarified treemap 알고리즘
function _squarify(values, x, y, w, h) {
  var total = values.reduce(function(s, v) { return s + v; }, 0);
  if (total <= 0 || values.length === 0) return [];
  if (values.length === 1) {
    return [{ x: x, y: y, w: w, h: h }];
  }

  var rects = [];
  var remaining = values.slice();
  var remainingTotal = total;
  var cx = x, cy = y, cw = w, ch = h;

  while (remaining.length > 0) {
    // 짧은 축 결정
    var isHorizontal = cw >= ch; // false면 세로 분할
    var shortSide = isHorizontal ? ch : cw;

    // 현재 행에 넣을 항목 결정
    var row = [remaining[0]];
    var rowTotal = remaining[0];
    var bestAspect = _worstAspect(row, rowTotal, remainingTotal, shortSide);

    for (var i = 1; i < remaining.length; i++) {
      var testRow = row.concat([remaining[i]]);
      var testTotal = rowTotal + remaining[i];
      var testAspect = _worstAspect(testRow, testTotal, remainingTotal, shortSide);
      if (testAspect <= bestAspect) {
        row = testRow;
        rowTotal = testTotal;
        bestAspect = testAspect;
      } else {
        break;
      }
    }

    // 행 배치
    var rowFraction = rowTotal / remainingTotal;
    var rowSize = isHorizontal ? cw * rowFraction : ch * rowFraction;

    var offset = 0;
    row.forEach(function(val) {
      var frac = val / rowTotal;
      var cellSize = shortSide * frac;

      if (isHorizontal) {
        rects.push({ x: cx, y: cy + offset, w: rowSize, h: cellSize });
      } else {
        rects.push({ x: cx + offset, y: cy, w: cellSize, h: rowSize });
      }
      offset += cellSize;
    });

    // 남은 영역 갱신
    remaining = remaining.slice(row.length);
    remainingTotal -= rowTotal;

    if (isHorizontal) {
      cx += rowSize;
      cw -= rowSize;
    } else {
      cy += rowSize;
      ch -= rowSize;
    }
  }

  return rects;
}

function _worstAspect(row, rowTotal, totalArea, shortSide) {
  if (shortSide <= 0 || rowTotal <= 0 || totalArea <= 0) return Infinity;
  var rowArea = shortSide * (rowTotal / totalArea) * shortSide; // 근사
  var s2 = shortSide * shortSide;
  var rowFrac = rowTotal / totalArea;
  var rowLen = shortSide;
  var rowThickness = rowLen * rowFrac; // 근사

  var worst = 0;
  row.forEach(function(val) {
    var frac = val / rowTotal;
    var cellW = rowThickness;
    var cellH = rowLen * frac;
    if (cellW <= 0 || cellH <= 0) return;
    var aspect = Math.max(cellW / cellH, cellH / cellW);
    if (aspect > worst) worst = aspect;
  });
  return worst;
}
