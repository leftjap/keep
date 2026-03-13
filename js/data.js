// ═══════════════════════════════════════
// data.js — 문서/책/어구/메모 CRUD + 통계
// ═══════════════════════════════════════

// ═══ 상태 변수 ═══
let activeTab = 'navi';
let textTypes = ['navi', 'fiction', 'blog'];
let TAB_META  = {
  navi: '오늘의 네비', fiction: '단편 습작', blog: '블로그',
  book: '서재', quote: '어구', memo: '메모', expense: '가계부'
};

function currentLocProfile() {
  return activeTab === 'fiction' ? 'soyeon' : 'gio';
}

const curIds = {};
let curQuoteId = null;
let curBookId  = null;
let curMemoId  = null;
let currentLoadedDoc   = { type: null, id: null };
let currentSearchQuery = '';
let currentListView    = 'list';

// ═══ Documents ═══
function allDocs()        { return L(K.docs) || []; }
function getDocs(type)    { return allDocs().filter(d => d.type === type); }
function saveDocs(docs)   { S(K.docs, docs); }

function newDoc(type) {
  const doc = {
    id: Date.now().toString(), driveId: null, type,
    title: '', tags: '', content: '', location: '', weather: '',
    lat: null, lng: null,
    created: new Date().toISOString(), updated: new Date().toISOString(), pinned: false
  };
  const docs = allDocs();
  docs.unshift(doc);
  saveDocs(docs);
  return doc;
}

function updateMetaBar(type, title) {
  const footLocText = document.getElementById('edFootLocText');
  if (footLocText) {
    footLocText.textContent = (type === 'fiction') ? 'Shinjuku, Tokyo' : '와우산로37길 Mapo-gu';
  }
}

function loadDoc(type, id, force = false) {
  const doc = allDocs().find(d => d.id === id);
  if (!doc) return;
  if (!force && currentLoadedDoc.type === type && currentLoadedDoc.id === id) return;
  curIds[type] = id;
  currentLoadedDoc = { type, id };
  document.getElementById('edTitle').value      = doc.title;
  document.getElementById('edBody').innerHTML   = fixDriveImageUrls(doc.content);
  document.getElementById('edDate').textContent = formatTopDate(doc.created);
  updateWC();
  updateMetaBar(type, doc.title);
  renderListPanel();
}

function saveCurDoc(type) {
  if (!curIds[type]) return;
  const title   = document.getElementById('edTitle').value.trim();
  const content = document.getElementById('edBody').innerHTML;
  const docs    = allDocs();
  const idx     = docs.findIndex(d => d.id === curIds[type]);
  if (idx !== -1) {
    docs[idx].title   = title;
    docs[idx].tags    = '';
    docs[idx].content = content;
    docs[idx].updated = new Date().toISOString();
    const locEl = document.getElementById('edFootLocText');
    if (locEl && locEl.textContent && locEl.textContent !== '위치 정보 없음') {
      docs[idx].location = locEl.textContent;
    }
    saveDocs(docs);
  }
}

function delDoc(type, id, e) {
  e.stopPropagation();
  if (!confirm('삭제할까요?')) return;
  saveDocs(allDocs().filter(d => d.id !== id));
  if (curIds[type] === id) { curIds[type] = null; currentLoadedDoc = { type: null, id: null }; }
  renderListPanel();
  SYNC.scheduleDatabaseSave();
  const docs = getDocs(type);
  if (docs.length) loadDoc(type, docs[0].id, true);
  else { const nd = newDoc(type); loadDoc(type, nd.id, true); }
}

function updateWC() {
  const target = activeTab === 'memo'
    ? document.getElementById('memo-body')
    : document.getElementById('edBody');
  const t     = target ? target.textContent.trim() : '';
  const c     = t.replace(/\s/g, '').length;
  const w     = t.split(/\s+/).filter(x => x).length;
  const pages = (c / 200).toFixed(1);
  if (document.getElementById('edWords')) document.getElementById('edWords').textContent = w.toLocaleString() + '단어';
  if (document.getElementById('edPages')) document.getElementById('edPages').textContent = pages + '매';
  updateWritingStats();
}

// ═══ Books ═══
function getBooks()       { return L(K.books) || []; }
function saveBooks(b)     { S(K.books, b); }

function newBook() {
  curBookId = null;
  currentLoadedDoc = { type: 'book', id: null };
  ['book-title','book-author','book-publisher'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('book-pages').value  = '';
  document.getElementById('book-body').innerHTML = '';
  document.getElementById('edDate').textContent  = formatTopDate(new Date().toISOString());
  updateMetaBar('book', '');
}

function saveBook() {
  const title = document.getElementById('book-title').value.trim();
  if (!title) return;
  const b = {
    id:        curBookId || Date.now().toString(),
    driveId:   null,
    title,
    author:    document.getElementById('book-author').value.trim(),
    publisher: document.getElementById('book-publisher').value.trim(),
    pages:     parseInt(document.getElementById('book-pages').value) || 0,
    memo:      document.getElementById('book-body').innerHTML,
    date:      today(),
    pinned:    false
  };
  const books = getBooks();
  if (curBookId) {
    const idx = books.findIndex(x => x.id === curBookId);
    if (idx !== -1) { b.pinned = books[idx].pinned; b.driveId = books[idx].driveId; books[idx] = b; }
  } else {
    books.unshift(b);
  }
  curBookId = b.id;
  saveBooks(books);
  updateBookStats();
  SYNC.scheduleBookSave(b);
}

function loadBook(id, force = false) {
  const b = getBooks().find(x => x.id === id);
  if (!b) return;
  if (!force && currentLoadedDoc.type === 'book' && currentLoadedDoc.id === id) return;
  curBookId = id;
  currentLoadedDoc = { type: 'book', id };
  document.getElementById('book-title').value     = b.title;
  document.getElementById('book-author').value    = b.author || '';
  document.getElementById('book-publisher').value = b.publisher || '';
  document.getElementById('book-pages').value     = b.pages || '';
  document.getElementById('book-body').innerHTML  = b.memo || '';
  document.getElementById('edDate').textContent   = formatTopDate(b.date ? new Date(b.date).toISOString() : new Date().toISOString());
  updateMetaBar('book', b.title);
  renderListPanel();
}

function delBook(id, e) {
  e.stopPropagation();
  if (!confirm('삭제할까요?')) return;
  saveBooks(getBooks().filter(b => b.id !== id));
  if (curBookId === id) { curBookId = null; currentLoadedDoc = { type: null, id: null }; }
  renderListPanel();
  updateBookStats();
  SYNC.scheduleDatabaseSave();
}

function updateBookStats() {
  const books = getBooks(), td = today(), tm = td.slice(0, 7);
  let pT = 0, pM = 0, pAll = 0;
  books.forEach(b => {
    const p = parseInt(b.pages) || 0, d = b.date;
    pAll += p;
    if (!d) return;
    if (d === td)           pT  += p;
    if (d.startsWith(tm))   pM  += p;
  });
  if (document.getElementById('bToday'))    document.getElementById('bToday').innerHTML    = pT  + `<span class='unit'>p</span>`;
  if (document.getElementById('bMonthSub')) document.getElementById('bMonthSub').innerHTML = '월간 ' + pM + 'p<br>누적 ' + pAll + 'p';
}

// ═══ Quotes ═══
function getQuotes()      { return L(K.quotes) || []; }
function saveQuotes(q)    { S(K.quotes, q); }

function saveQuote() {
  const text = document.getElementById('quote-body').innerText.trim();
  if (!text) return;
  const by     = document.getElementById('quote-by').value.trim();
  const quotes = getQuotes();
  if (curQuoteId) {
    const idx = quotes.findIndex(q => q.id === curQuoteId);
    if (idx !== -1) { quotes[idx].text = text; quotes[idx].by = by; }
  } else {
    const q = { id: Date.now().toString(), text, by, created: new Date().toISOString(), pinned: false };
    quotes.unshift(q);
    curQuoteId = q.id;
  }
  saveQuotes(quotes);
  SYNC.scheduleQuoteSave(text, by, curQuoteId);
}

function newQuoteForm() {
  curQuoteId = null;
  currentLoadedDoc = { type: 'quote', id: null };
  document.getElementById('quote-body').innerHTML = '';
  document.getElementById('quote-by').value       = '';
  document.getElementById('edDate').textContent   = formatTopDate(new Date().toISOString());
  updateMetaBar('quote', '');
}

function loadQuote(id, force = false) {
  const q = getQuotes().find(x => x.id === id);
  if (!q) return;
  if (!force && currentLoadedDoc.type === 'quote' && currentLoadedDoc.id === id) return;
  curQuoteId = id;
  currentLoadedDoc = { type: 'quote', id };
  document.getElementById('quote-body').innerText = q.text;
  document.getElementById('quote-by').value       = q.by || '';
  document.getElementById('edDate').textContent   = formatTopDate(q.created);
  updateMetaBar('quote', '');
  renderListPanel();
}

function delQuote(id, e) {
  e.stopPropagation();
  if (!confirm('삭제할까요?')) return;
  saveQuotes(getQuotes().filter(q => q.id !== id));
  if (curQuoteId === id) { curQuoteId = null; currentLoadedDoc = { type: null, id: null }; }
  renderListPanel();
  showRandomQuote();
  SYNC.scheduleDatabaseSave();
}

function showRandomQuote() {
  // quote 탭이 없는 사용자는 어구 표시 안 함
  if (!TAB_META.quote) return;
  const quotes = getQuotes();
  if (!quotes.length) {
    if (document.getElementById('quoteText')) document.getElementById('quoteText').textContent = '어구록에 문장을 추가해보세요';
    if (document.getElementById('quoteBy'))   document.getElementById('quoteBy').textContent   = '';
    return;
  }
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  if (document.getElementById('quoteText')) document.getElementById('quoteText').textContent = q.text.length > 80 ? q.text.slice(0, 80) + '…' : q.text;
  if (document.getElementById('quoteBy'))  document.getElementById('quoteBy').textContent  = q.by ? '— ' + q.by : '';
}

// ═══ Memos ═══
function getMemos()       { return L(K.memos) || []; }
function saveMemos(m)     { S(K.memos, m); }

function saveMemo() {
  const title = document.getElementById('memo-title').value.trim();
  const body  = document.getElementById('memo-body').innerHTML;
  if (!title && !stripHtml(body).trim()) return;
  const memos = getMemos();
  if (curMemoId) {
    const idx = memos.findIndex(m => m.id === curMemoId);
    if (idx !== -1) {
      memos[idx].title   = title;
      memos[idx].tags    = '';
      memos[idx].content = body;
      memos[idx].updated = new Date().toISOString();
    }
  } else {
    const memo = {
      id: Date.now().toString(), driveId: null,
      title, tags: '', content: body,
      created: new Date().toISOString(), updated: new Date().toISOString(), pinned: false
    };
    memos.unshift(memo);
    curMemoId = memo.id;
  }
  saveMemos(memos);
  SYNC.scheduleDocSave('memo');
}

function loadMemo(id, force = false) {
  const m = getMemos().find(x => x.id === id);
  if (!m) return;
  if (!force && currentLoadedDoc.type === 'memo' && currentLoadedDoc.id === id) return;
  curMemoId = id;
  currentLoadedDoc = { type: 'memo', id };
  document.getElementById('memo-title').value     = m.title || '';
  document.getElementById('memo-body').innerHTML  = fixDriveImageUrls(m.content);
  document.getElementById('edDate').textContent   = formatTopDate(m.created);
  updateWC();
  updateMetaBar('memo', m.title);
  renderListPanel();
}

function newMemoForm() {
  curMemoId = null;
  currentLoadedDoc = { type: 'memo', id: null };
  document.getElementById('memo-title').value    = '';
  document.getElementById('memo-body').innerHTML = '';
  document.getElementById('edDate').textContent  = formatTopDate(new Date().toISOString());
  updateMetaBar('memo', '');
}

function delMemo(id, e) {
  e.stopPropagation();
  if (!confirm('삭제할까요?')) return;
  saveMemos(getMemos().filter(m => m.id !== id));
  if (curMemoId === id) { curMemoId = null; currentLoadedDoc = { type: null, id: null }; }
  renderListPanel();
  SYNC.scheduleDatabaseSave();
}

// ═══ 통계 ═══
function getTabCount(t) {
  if (textTypes.includes(t)) return getDocs(t).length;
  if (t === 'book')  return (L(K.books)  || []).length;
  if (t === 'quote') return (L(K.quotes) || []).length;
  if (t === 'memo')  return (L(K.memos)  || []).length;
  return 0;
}

function updateWritingStats() {
  const docs = allDocs().filter(d => d.type === 'fiction');
  const td = today(), tm = td.slice(0, 7);
  let tT = 0, tM = 0, tAll = 0;
  docs.forEach(d => {
    const c  = stripHtml(d.content).replace(/\s/g, '').length;
    tAll += c;
    const dt = (d.updated || d.created || '').slice(0, 10);
    if (!dt) return;
    if (dt === td)           tT  += c;
    if (dt.startsWith(tm))   tM  += c;
  });
  const todayPages = Math.floor(tT   / 200);
  const monthPages = Math.floor(tM   / 200);
  const allPages   = Math.floor(tAll / 200);
  if (document.getElementById('wToday'))    document.getElementById('wToday').innerHTML    = todayPages + `<span class='unit'>매</span>`;
  if (document.getElementById('wMonthSub')) document.getElementById('wMonthSub').innerHTML = '월간 ' + monthPages + '매<br>누적 ' + allPages + '매';
}

function togglePin(type, id, e) {
  e.stopPropagation();
  let items = type === 'memo'  ? (L(K.memos)  || [])
            : type === 'book'  ? (L(K.books)  || [])
            : type === 'quote' ? (L(K.quotes) || [])
            : allDocs();
  const idx = items.findIndex(x => x.id === id);
  if (idx !== -1) items[idx].pinned = !items[idx].pinned;
  if (type === 'memo')       S(K.memos,  items);
  else if (type === 'book')  S(K.books,  items);
  else if (type === 'quote') S(K.quotes, items);
  else                       S(K.docs,   items);
  renderListPanel();
  SYNC.scheduleDatabaseSave();
}

// ═══════════════════════════════════════
// 가계부 (Expense) CRUD
// ═══════════════════════════════════════
function getExpenses() {
  return L(K.expenses) || [];
}

function saveExpenses(arr) {
  S(K.expenses, arr);
}

function newExpense(data) {
  const expense = {
    id: Date.now().toString(),
    amount: data.amount || 0,
    category: data.category || 'etc',
    merchant: data.merchant || '',
    card: data.card || '',
    memo: data.memo || '',
    date: data.date || today(),
    time: data.time || '',
    created: new Date().toISOString(),
    source: data.source || 'manual'
  };
  const expenses = getExpenses();
  expenses.unshift(expense);
  saveExpenses(expenses);
  return expense;
}

function updateExpense(id, data) {
  const expenses = getExpenses();
  const idx = expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    Object.assign(expenses[idx], data);
    saveExpenses(expenses);
  }
}

function delExpense(id) {
  saveExpenses(getExpenses().filter(e => e.id !== id));
}

// ═══════════════════════════════════════
// 가계부 통계 함수
// ═══════════════════════════════════════
function getMonthExpenses(yearMonth) {
  return getExpenses().filter(e => e.date.startsWith(yearMonth));
}

function getMonthTotal(yearMonth) {
  return getMonthExpenses(yearMonth).reduce((s, e) => s + e.amount, 0);
}

function getDayExpenses(dateStr) {
  return getExpenses().filter(e => e.date === dateStr);
}

function getDayTotal(dateStr) {
  return getDayExpenses(dateStr).reduce((s, e) => s + e.amount, 0);
}

function getExpensePace() {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const thisYM = getLocalYMD(now).slice(0, 7);

  const thisMonthSoFar = getMonthExpenses(thisYM)
    .filter(e => parseInt(e.date.slice(8, 10)) <= dayOfMonth)
    .reduce((s, e) => s + e.amount, 0);

  let pastTotals = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const daysInThatMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const compareTo = Math.min(dayOfMonth, daysInThatMonth);
    const total = getMonthExpenses(ym)
      .filter(e => parseInt(e.date.slice(8, 10)) <= compareTo)
      .reduce((s, e) => s + e.amount, 0);
    if (total > 0) pastTotals.push(total);
  }

  if (pastTotals.length === 0) return null;

  const avg = pastTotals.reduce((a, b) => a + b, 0) / pastTotals.length;
  const diff = thisMonthSoFar - avg;
  const pct = avg > 0 ? Math.round(Math.abs(diff) / avg * 100) : 0;

  return {
    current: thisMonthSoFar,
    average: Math.round(avg),
    diff: Math.round(diff),
    pct,
    isLess: diff < 0
  };
}

function getProjectedMonthTotal() {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const thisYM = getLocalYMD(now).slice(0, 7);
  const soFar = getMonthTotal(thisYM);
  if (dayOfMonth === 0) return 0;
  return Math.round(soFar / dayOfMonth * daysInMonth);
}

function getMonthlyAverage() {
  const now = new Date();
  let totals = [];
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const t = getMonthTotal(ym);
    if (t > 0) totals.push(t);
  }
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
}

function getCategoryBreakdown(yearMonth) {
  const expenses = getMonthExpenses(yearMonth);
  const map = {};
  EXPENSE_CATEGORIES.forEach(c => { map[c.id] = 0; });
  expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
  return EXPENSE_CATEGORIES
    .map(c => ({ ...c, amount: map[c.id] }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

function getTopCategoryChange(ym) {
  var thisBreakdown = getCategoryBreakdown(ym);
  if (!thisBreakdown.length) return null;
  var prevD = new Date(ym + '-01');
  prevD.setMonth(prevD.getMonth() - 1);
  var prevYM = prevD.getFullYear() + '-' + String(prevD.getMonth() + 1).padStart(2, '0');
  var prevBreakdown = getCategoryBreakdown(prevYM);
  var prevMap = {};
  prevBreakdown.forEach(function(c) { prevMap[c.id] = c.amount; });
  var best = null;
  thisBreakdown.forEach(function(c) {
    var prev = prevMap[c.id] || 0;
    var diff = c.amount - prev;
    if (!best || Math.abs(diff) > Math.abs(best.diff)) {
      best = { name: c.name, diff: diff };
    }
  });
  return best && best.diff !== 0 ? best : null;
}

function getMonthlyTrend(count) {
  if (!count) count = 6;
  const now = new Date();
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = (d.getMonth() + 1) + '월';
    result.push({ ym, label, total: getMonthTotal(ym), isCurrent: i === 0 });
  }
  return result;
}

function getMonthlyTrendAround(centerYM) {
  var centerDate = new Date(centerYM + '-01');
  var result = [];
  for (var i = -5; i <= 0; i++) {
    var d = new Date(centerDate.getFullYear(), centerDate.getMonth() + i, 1);
    var ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var label = (d.getMonth() + 1) + '월';
    var isCurrent = (ym === centerYM);
    result.push({ ym: ym, label: label, total: getMonthTotal(ym), isCurrent: isCurrent });
  }
  return result;
}

function getMerchantBreakdown(ym) {
  var expenses = getMonthExpenses(ym);
  if (!expenses.length) return [];
  var total = expenses.reduce(function(s, e) { return s + e.amount; }, 0);
  var map = {};
  expenses.forEach(function(e) {
    var raw = (e.merchant || '미분류').trim();
    var key;
    var isBrand = false;
    if (e.brand) {
      key = e.brand;
      isBrand = true;
    } else {
      key = raw;
    }
    if (!map[key]) {
      map[key] = { merchant: key, amount: 0, count: 0, catCount: {}, isBrand: isBrand };
    }
    map[key].amount += e.amount;
    map[key].count += 1;
    var cat = e.category || 'etc';
    map[key].catCount[cat] = (map[key].catCount[cat] || 0) + 1;
  });
  var result = [];
  Object.keys(map).forEach(function(key) {
    var item = map[key];
    // 최다 빈도 카테고리
    var bestCat = 'etc';
    var bestCatCount = 0;
    Object.keys(item.catCount).forEach(function(cat) {
      if (item.catCount[cat] > bestCatCount) {
        bestCat = cat;
        bestCatCount = item.catCount[cat];
      }
    });
    result.push({
      merchant: item.merchant,
      amount: item.amount,
      count: item.count,
      percent: total > 0 ? Math.round(item.amount / total * 1000) / 10 : 0,
      category: bestCat,
      isBrand: item.isBrand
    });
  });
  result.sort(function(a, b) { return b.amount - a.amount; });
  return result;
}

function getYearMerchantBreakdown(year) {
  var allExp = getExpenses();
  var yearStr = String(year);
  var yearExpenses = allExp.filter(function(e) { return e.date && e.date.startsWith(yearStr); });
  if (!yearExpenses.length) return { startDate: null, endDate: null, total: 0, merchants: [] };

  var total = yearExpenses.reduce(function(s, e) { return s + e.amount; }, 0);
  var dates = yearExpenses.map(function(e) { return e.date; }).sort();
  var startDate = dates[0];
  var todayStr = today();
  var endDate = todayStr.startsWith(yearStr) ? todayStr : dates[dates.length - 1];

  var map = {};
  yearExpenses.forEach(function(e) {
    var raw = (e.merchant || '미분류').trim();
    var key;
    var isBrand = false;
    if (e.brand) {
      key = e.brand;
      isBrand = true;
    } else {
      key = raw;
    }
    if (!map[key]) {
      map[key] = { merchant: key, amount: 0, count: 0, catCount: {}, isBrand: isBrand };
    }
    map[key].amount += e.amount;
    map[key].count += 1;
    var cat = e.category || 'etc';
    map[key].catCount[cat] = (map[key].catCount[cat] || 0) + 1;
  });

  var merchants = [];
  Object.keys(map).forEach(function(key) {
    var item = map[key];
    var bestCat = 'etc';
    var bestCatCount = 0;
    Object.keys(item.catCount).forEach(function(cat) {
      if (item.catCount[cat] > bestCatCount) {
        bestCat = cat;
        bestCatCount = item.catCount[cat];
      }
    });
    merchants.push({
      merchant: item.merchant,
      amount: item.amount,
      count: item.count,
      percent: total > 0 ? Math.round(item.amount / total * 1000) / 10 : 0,
      category: bestCat,
      isBrand: item.isBrand
    });
  });
  merchants.sort(function(a, b) { return b.amount - a.amount; });

  // 연간 기타 묶기: 비브랜드 + 1건 + 10만원 이하 → 카테고리별 기타로 묶기
  var grouped = [];
  var etcByCat = {}; // catId → { items: [...], totalAmount, totalCount }

  merchants.forEach(function(m) {
    if (!m.isBrand && m.count <= 1 && m.amount <= 100000) {
      // 기타 묶기 대상
      var cat = m.category || 'etc';
      if (!etcByCat[cat]) {
        etcByCat[cat] = { items: [], totalAmount: 0, totalCount: 0 };
      }
      etcByCat[cat].items.push(m);
      etcByCat[cat].totalAmount += m.amount;
      etcByCat[cat].totalCount += m.count;
    } else {
      // 개별 표시 대상
      grouped.push(m);
    }
  });

  // 카테고리별 기타 항목 생성
  Object.keys(etcByCat).forEach(function(catId) {
    var info = etcByCat[catId];
    var catObj = EXPENSE_CATEGORIES.find(function(c) { return c.id === catId; });
    var catName = catObj ? catObj.name : '기타';
    grouped.push({
      merchant: catId === 'etc' ? '기타' : catName + ' 기타',
      amount: info.totalAmount,
      count: info.totalCount,
      percent: total > 0 ? Math.round(info.totalAmount / total * 1000) / 10 : 0,
      category: catId,
      isBrand: false,
      isCategoryEtc: true,
      etcItems: info.items
    });
  });

  // 금액 내림차순 재정렬
  grouped.sort(function(a, b) { return b.amount - a.amount; });

  merchants = grouped;

  return {
    startDate: startDate,
    endDate: endDate,
    total: total,
    merchants: merchants
  };
}

// ═══ 데이터 존재 월 범위 ═══
function getOldestExpenseYM() {
  var expenses = getExpenses();
  if (!expenses.length) return today().slice(0, 7);
  var oldest = expenses.reduce(function(min, e) {
    var ym = (e.date || '').slice(0, 7);
    return ym && ym < min ? ym : min;
  }, today().slice(0, 7));
  return oldest;
}

function getOldestRoutineYM() {
  var all = getAllChk();
  var keys = Object.keys(all);
  if (!keys.length) return today().slice(0, 7);
  var oldest = keys.reduce(function(min, dateStr) {
    var ym = dateStr.slice(0, 7);
    return ym < min ? ym : min;
  }, today().slice(0, 7));
  return oldest;
}

function hasExpenseDataInMonth(ym) {
  return getMonthExpenses(ym).length > 0;
}

function hasRoutineDataInMonth(ym) {
  var all = getAllChk();
  var keys = Object.keys(all);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].slice(0, 7) === ym) return true;
  }
  return false;
}

// ═══════════════════════════════════════
// 가계부 상수 및 유틸 (storage.js에서 이동)
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// 가계부 카테고리 상수
// ═══════════════════════════════════════
let EXPENSE_CATEGORIES = [
  { id: 'food',      name: '식비',       color: '#E55643', bg: '#E55643' },
  { id: 'dining',    name: '외식/배달',  color: '#E8845A', bg: '#E8845A' },
  { id: 'shopping',  name: '쇼핑',       color: '#D4789A', bg: '#D4789A' },
  { id: 'transport', name: '교통',       color: '#5A8EC4', bg: '#5A8EC4' },
  { id: 'subscribe', name: '구독/통신',  color: '#F0A848', bg: '#F0A848' },
  { id: 'medical',   name: '의료',       color: '#6AB0A0', bg: '#6AB0A0' },
  { id: 'leisure',   name: '유흥',       color: '#9A6CB8', bg: '#9A6CB8' },
  { id: 'beauty',    name: '미용',       color: '#C4885A', bg: '#C4885A' },
  { id: 'pet',       name: '반려동물',   color: '#E87461', bg: '#E87461' },
  { id: 'invest',    name: '투자',       color: '#5B6ABF', bg: '#5B6ABF' },
  { id: 'utility',   name: '공과금',     color: '#8B8B8B', bg: '#8B8B8B' },
  { id: 'etc',       name: '기타',       color: '#B0B0B8', bg: '#B0B0B8' }
];

// ═══════════════════════════════════════
// 매출처 아이콘 매핑
// ═══════════════════════════════════════
function getMerchantIcons() {
  return L(K.merchantIcons) || [];
}

function saveMerchantIcons(arr) {
  S(K.merchantIcons, arr);
}

function findMerchantIcon(merchant) {
  if (!merchant) return null;
  var icons = getMerchantIcons();
  // 긴 키워드 우선 매칭
  icons.sort(function(a, b) { return b.keyword.length - a.keyword.length; });
  for (var i = 0; i < icons.length; i++) {
    if (merchant.indexOf(icons[i].keyword) !== -1) return icons[i].icon;
  }
  // 별명→원본 역조회 후 재검색
  var originals = reverseAlias(merchant);
  for (var j = 0; j < originals.length; j++) {
    for (var k = 0; k < icons.length; k++) {
      if (originals[j].indexOf(icons[k].keyword) !== -1) return icons[k].icon;
    }
  }
  return null;
}

function saveMerchantIcon(keyword, iconUrl) {
  var icons = getMerchantIcons();
  var idx = icons.findIndex(function(item) { return item.keyword === keyword; });
  if (idx !== -1) {
    icons[idx].icon = iconUrl;
  } else {
    icons.push({ keyword: keyword, icon: iconUrl });
  }
  saveMerchantIcons(icons);
}

// ═══════════════════════════════════════
// 매출처 별명(alias) 매핑
// ═══════════════════════════════════════
function getMerchantAliases() {
  return L(K.merchantAliases) || [];
}

function saveMerchantAliases(arr) {
  S(K.merchantAliases, arr);
}

function setMerchantAlias(originalMerchant, alias) {
  var aliases = getMerchantAliases();
  var idx = aliases.findIndex(function(a) { return a.original === originalMerchant; });
  if (alias && alias.trim()) {
    if (idx !== -1) {
      aliases[idx].alias = alias.trim();
    } else {
      aliases.push({ original: originalMerchant, alias: alias.trim() });
    }
  } else {
    // 별명이 빈 문자열이면 해당 매핑 제거
    if (idx !== -1) aliases.splice(idx, 1);
  }
  saveMerchantAliases(aliases);
}

function resolveAlias(merchant) {
  if (!merchant) return merchant;
  var trimmed = merchant.trim();
  var aliases = getMerchantAliases();
  for (var i = 0; i < aliases.length; i++) {
    if (aliases[i].original === trimmed) return aliases[i].alias;
  }
  return trimmed;
}

function reverseAlias(alias) {
  if (!alias) return [];
  var trimmed = alias.trim();
  var aliases = getMerchantAliases();
  var originals = [];
  for (var i = 0; i < aliases.length; i++) {
    if (aliases[i].alias === trimmed) {
      originals.push(aliases[i].original);
    }
  }
  return originals;
}

// ═══════════════════════════════════════
// 브랜드 아이콘 (K.brandIcons)
// ═══════════════════════════════════════
function getBrandIcons() {
  return L(K.brandIcons) || {};
}

function saveBrandIcons(obj) {
  S(K.brandIcons, obj);
}

function getBrandIcon(brand) {
  if (!brand) return null;
  var icons = getBrandIcons();
  return icons[brand] || null;
}

function setBrandIcon(brand, iconUrl) {
  if (!brand) return;
  var icons = getBrandIcons();
  if (iconUrl) {
    icons[brand] = iconUrl;
  } else {
    delete icons[brand];
  }
  saveBrandIcons(icons);
}

// ═══════════════════════════════════════
// 브랜드 오버라이드 (K.brandOverrides)
// ═══════════════════════════════════════
function getBrandOverrides() {
  return L(K.brandOverrides) || {};
}

function saveBrandOverrides(obj) {
  S(K.brandOverrides, obj);
}

function getBrandOverride(merchant) {
  if (!merchant) return null;
  var overrides = getBrandOverrides();
  return overrides[merchant] || null;
}

function setBrandOverride(merchant, brand) {
  if (!merchant) return;
  var overrides = getBrandOverrides();
  overrides[merchant] = {
    brand: brand,
    created: today()
  };
  saveBrandOverrides(overrides);
}

// ═══════════════════════════════════════
// 서버 config 동적 적용
// ═══════════════════════════════════════
function applyServerConfig(config) {
  if (!config) return;

  // 탭 구성
  if (config.textTypes && Array.isArray(config.textTypes)) {
    textTypes = config.textTypes;
  }
  if (config.tabNames && typeof config.tabNames === 'object') {
    TAB_META = Object.assign({}, config.tabNames);
    // expense는 tabNames에 없을 수 있으므로 보장
    if (!TAB_META.expense) TAB_META.expense = '가계부';
  }

  // 초기 activeTab을 config.tabs의 첫 번째 항목으로 설정
  if (config.tabs && config.tabs.length > 0) {
    // textTypes에 포함된 첫 번째 탭을 기본 탭으로 설정
    var firstTextTab = null;
    for (var i = 0; i < config.tabs.length; i++) {
      if (textTypes.indexOf(config.tabs[i]) !== -1) {
        firstTextTab = config.tabs[i];
        break;
      }
    }
    if (firstTextTab) {
      activeTab = firstTextTab;
    }
  }

  // 루틴
  if (config.routines && Array.isArray(config.routines)) {
    ROUTINE_META = config.routines.map(function(r) {
      return {
        id:    r.id,
        name:  r.name,
        color: r.color || '#E55643',
        bg:    r.bg || '#fdf1ef'
      };
    });
  }

  // 가계부 카테고리
  if (config.expenseCategories && Array.isArray(config.expenseCategories)) {
    EXPENSE_CATEGORIES = config.expenseCategories.map(function(c) {
      // 서버에서 color/bg가 올 수도 있고, id만 올 수도 있음
      // 기존 EXPENSE_CATEGORIES의 color/bg를 id로 매칭하여 재사용
      var existing = null;
      var defaultCats = [
        { id: 'food', color: '#E55643', bg: '#E55643' },
        { id: 'dining', color: '#E8845A', bg: '#E8845A' },
        { id: 'shopping', color: '#D4789A', bg: '#D4789A' },
        { id: 'transport', color: '#5A8EC4', bg: '#5A8EC4' },
        { id: 'subscribe', color: '#F0A848', bg: '#F0A848' },
        { id: 'medical', color: '#6AB0A0', bg: '#6AB0A0' },
        { id: 'leisure', color: '#9A6CB8', bg: '#9A6CB8' },
        { id: 'beauty', color: '#C4885A', bg: '#C4885A' },
        { id: 'pet', color: '#E87461', bg: '#E87461' },
        { id: 'invest', color: '#5B6ABF', bg: '#5B6ABF' },
        { id: 'utility', color: '#8B8B8B', bg: '#8B8B8B' },
        { id: 'etc', color: '#B0B0B8', bg: '#B0B0B8' },
        // 아내 전용 카테고리 기본색
        { id: 'cafe', color: '#C4885A', bg: '#C4885A' },
        { id: 'convenience', color: '#F0A848', bg: '#F0A848' },
        { id: 'cat', color: '#E87461', bg: '#E87461' },
        { id: 'health', color: '#6AB0A0', bg: '#6AB0A0' },
        { id: 'culture', color: '#9A6CB8', bg: '#9A6CB8' },
        { id: 'fashion', color: '#D4789A', bg: '#D4789A' },
        { id: 'gift', color: '#E8845A', bg: '#E8845A' },
        { id: 'overseas', color: '#5A8EC4', bg: '#5A8EC4' }
      ];
      for (var j = 0; j < defaultCats.length; j++) {
        if (defaultCats[j].id === c.id) { existing = defaultCats[j]; break; }
      }
      return {
        id:    c.id,
        name:  c.name,
        color: c.color || (existing ? existing.color : '#B0B0B8'),
        bg:    c.bg || (existing ? existing.bg : '#B0B0B8')
      };
    });
  }

  // 카드 매핑 (sms-parser.js의 CARD_NAME_MAP 덮어쓰기)
  if (config.cardNameMap && typeof config.cardNameMap === 'object') {
    CARD_NAME_MAP = config.cardNameMap;
  }

  // folderMap 저장 (sync.js에서 사용)
  if (config.folderMap) {
    window._serverFolderMap = config.folderMap;
  }

  // 어구 섹션 표시/숨김 (CSS !important를 이기기 위해 클래스 기반)
  var quoteSection = document.querySelector('.quote-section');
  if (quoteSection) {
    if (config.tabs && config.tabs.indexOf('quote') === -1) {
      quoteSection.classList.add('quote-hidden');
    } else {
      quoteSection.classList.remove('quote-hidden');
    }
  }
}

// ═══════════════════════════════════════
// 금액 포맷 유틸
// ═══════════════════════════════════════
function formatAmount(n) {
  if (n >= 10000) {
    const man = Math.round(n / 10000);
    return man + '만';
  }
  return n.toLocaleString();
}

function formatAmountShort(n) {
  return n.toLocaleString();
}
