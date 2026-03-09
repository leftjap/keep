// ═══════════════════════════════════════
// data.js — 문서/책/어구/메모 CRUD + 통계
// ═══════════════════════════════════════

// ═══ 상태 변수 ═══
let activeTab = 'navi';
const textTypes = ['navi', 'fiction', 'blog'];
const TAB_META  = {
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

function getMonthlyTrend() {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
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

// ═══════════════════════════════════════
// 가계부 상수 및 유틸 (storage.js에서 이동)
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// 가계부 카테고리 상수
// ═══════════════════════════════════════
const EXPENSE_CATEGORIES = [
  { id: 'food',      name: '식비',       color: '#E55643', bg: '#E55643' },
  { id: 'dining',    name: '외식/카페',  color: '#E8845A', bg: '#E8845A' },
  { id: 'shopping',  name: '쇼핑/미용',  color: '#D4789A', bg: '#D4789A' },
  { id: 'transport', name: '교통',       color: '#5A8EC4', bg: '#5A8EC4' },
  { id: 'utility',   name: '주거/공과금', color: '#F0A848', bg: '#F0A848' },
  { id: 'medical',   name: '의료',       color: '#6AB0A0', bg: '#6AB0A0' },
  { id: 'culture',   name: '문화/여가',  color: '#9A6CB8', bg: '#9A6CB8' },
  { id: 'loan',      name: '대출/금융',  color: '#8B8B8B', bg: '#8B8B8B' },
  { id: 'pet',       name: '반려동물',   color: '#C4885A', bg: '#C4885A' },
  { id: 'gift',      name: '경조/선물',  color: '#E87461', bg: '#E87461' },
  { id: 'etc',       name: '기타',       color: '#B0B0B8', bg: '#B0B0B8' }
];

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
