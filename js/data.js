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

// ═══ 브랜드 카테고리 매핑 ═══
var BRAND_CATEGORY_MAP = {
  // overseas (해외)
  'AIRALO': 'overseas', 'BART': 'overseas', 'DOUBLETREE': 'overseas',
  'Dusit Thani': 'overseas', 'KIX DUTY FREE': 'overseas', 'KKday': 'overseas',
  'LA RINASCENTE': 'overseas', 'Pullman': 'overseas', 'Sokha Hotels': 'overseas',
  'THE WESTIN': 'overseas', '대한항공': 'overseas', '롯데면세점': 'overseas',
  '마이리얼트립': 'overseas', '신세계면세점': 'overseas',
  '인터컨티넨탈호텔': 'overseas', '인터파크': 'overseas',

  // fashion (패션/뷰티)
  'COS': 'fashion', 'H&M': 'fashion', 'HDC아이파크몰': 'fashion',
  'KITH': 'fashion', 'LF': 'fashion', 'STUSSY': 'fashion',
  'SUPREME': 'fashion', '나이키': 'fashion', '네이버페이': 'fashion',
  '더현대닷컴': 'fashion', '롯데백화점': 'fashion', '무신사': 'fashion',
  '비너스': 'fashion', '삼성물산': 'fashion', '신세계인터내셔날': 'fashion',
  '아모레퍼시픽': 'fashion', '올리브영': 'fashion', '유니클로': 'fashion',
  '이니스프리': 'fashion', '이솝': 'fashion', '이케아': 'fashion',
  '인스턴트펑크': 'fashion', '커스텀멜로우': 'fashion', '코오롱': 'fashion',
  '크린토피아': 'fashion', '트라이본즈': 'fashion', '현대홈쇼핑': 'fashion',
  '베네피트': 'fashion', '무인양품': 'fashion',

  // food (식품/마트)
  'CJ': 'food', 'SSG.COM': 'food', '금옥당': 'food', '뚜레쥬르': 'food',
  '띵굴': 'food', '롯데온': 'food', '베즐리': 'food', '사러가': 'food',
  '신세계': 'food', '오아시스': 'food', '온브릭스': 'food', '이마트': 'food',
  '쿠팡': 'food', '컬리': 'food', '태극당': 'food', '파리바게뜨': 'food',
  '파리크라상': 'food', '풀무원': 'food', '하나로마트': 'food',
  '한화커넥트': 'food', '현대그린푸드': 'food', '현대백화점 식품관': 'food',
  '고디바': 'food',

  // dining (외식)
  'KFC': 'dining', '계륵장군': 'dining', '구스토타코': 'dining',
  '도미노피자': 'dining', '등촌동샤브샤브': 'dining', '또보겠지': 'dining',
  '롯데리아': 'dining', '만석닭강정': 'dining', '명동교자': 'dining',
  '미분당': 'dining', '배달의민족': 'dining', '뱃고동': 'dining',
  '버거리': 'dining', '버거킹': 'dining', '봉피양': 'dining',
  '새마을식당': 'dining', '송계옥': 'dining', '신차이': 'dining',
  '아오이토리': 'dining', '아워당N인더박스': 'dining', '아워홈': 'dining',
  '연타발': 'dining', '육전국밥': 'dining', '인앤아웃': 'dining',
  '진진': 'dining', '천하의 문타로': 'dining', '탐탐오향족발': 'dining',
  '한솥도시락': 'dining', '황생가': 'dining', '피크니크': 'dining',

  // cafe (카페)
  'T카페나폴레옹': 'cafe', '공차': 'cafe', '논탄토': 'cafe',
  '매머드커피': 'cafe', '메가MGC커피': 'cafe', '모모스': 'cafe',
  '블루보틀': 'cafe', '앤트러사이트': 'cafe', '엔제리너스': 'cafe',
  '이디야커피': 'cafe', '잠바주스': 'cafe', '카멜커피': 'cafe',
  '크렘드마롱': 'cafe', '투썸플레이스': 'cafe', '팀홀튼': 'cafe',
  '폴바셋': 'cafe', '할리스': 'cafe', '아우어베이커리': 'cafe',
  '던킨도너츠': 'cafe',

  // convenience (편의점)
  'CU': 'convenience', 'GS25': 'convenience', '미니스톱': 'convenience',
  '세븐일레븐': 'convenience', '이마트24': 'convenience',

  // culture (문화)
  'CGV': 'culture', 'YBM': 'culture', 'Apple': 'culture',
  '교보문고': 'culture', '디즈니플러스': 'culture', '땡스북스': 'culture',
  '메가박스': 'culture', '모닝글로리': 'culture', '밀리의서재': 'culture',
  '예스24': 'culture', '롯데시네마': 'culture', '화담숲': 'culture',

  // health (건강)
  '가톨릭대학교서울성모병원': 'health', '신촌세브란스병원': 'health',
  '연세의료원': 'health', '헬스보이짐': 'health',

  // gift (선물)
  '미니골드': 'gift', '호텔신라': 'gift', '롯데': 'gift',

  // cat (고양이)
  'CUREFIP': 'cat',

  // etc (특정 불가)
  'SK네트웍스': 'etc', 'SK텔레콤': 'etc', '삼성화재': 'etc', '티머니': 'etc'
};

function getCategoryByBrand(brand) {
  if (!brand) return null;
  return BRAND_CATEGORY_MAP[brand] || null;
}

// 매출처명 정제
function cleanMerchantName(merchant) {
  if (!merchant) return merchant;
  var m = merchant.trim();

  // 1. 신한온누리 접두어 제거
  m = m.replace(/^신한온누리\s*/, '');

  // 2. 민생회복/1차 민생 접두어 제거
  m = m.replace(/^(1차\s*)?민생(회복)?\s*/, '');

  // 3. 통화코드 접두어 제거 (달러, 엔화, 유로, 위안, 바트, 페소 등 + 숫자)
  m = m.replace(/^(달러|엔화|유로|위안|바트|페소)\s+/, '');
  m = m.replace(/^[A-Z]{3}\s+[\d\s]+\s+/, '');
  m = m.replace(/^\d+\s+/, '');

  // 4. 매출처명 변형 통합
  if (m.match(/^사러가/)) m = '사러가';
  if (m.match(/^또[보부]겠지/)) m = '또보겠지';
  if (m.match(/^COS\s*HU/i)) m = 'COS';
  if (m.match(/온브릭스/)) m = '온브릭스';
  if (m.match(/^SP\s+STUSSY/i)) m = 'STUSSY';
  if (m.match(/^KITH\s+HAWAI/i)) m = 'KITH';
  if (m.match(/^LARINASCEN/i)) m = 'LA RINASCENTE';
  if (m.match(/^www\.curefi|^CUREFIP\.CO/i)) m = 'CUREFIP';
  if (m.match(/^KIX\s*(DFS|DUTY)/i)) m = 'KIX DUTY FREE';

  return m;
}

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
    source: data.source || 'manual',
    brand: data.brand || null
  };

  // 매출처명 정제
  expense.merchant = cleanMerchantName(expense.merchant);

  // brand가 있으면 BRAND_CATEGORY_MAP에서 카테고리 자동 부여
  if (expense.brand && BRAND_CATEGORY_MAP[expense.brand]) {
    expense.category = BRAND_CATEGORY_MAP[expense.brand];
  }

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

    // 매출처명 정제
    expenses[idx].merchant = cleanMerchantName(expenses[idx].merchant);

    // brand가 있으면 BRAND_CATEGORY_MAP에서 카테고리 자동 부여
    if (expenses[idx].brand && BRAND_CATEGORY_MAP[expenses[idx].brand]) {
      expenses[idx].category = BRAND_CATEGORY_MAP[expenses[idx].brand];
    }

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

function getYearMerchantBreakdown(year, endYM) {
  var allExp = getExpenses();
  var yearStr = String(year);
  var yearExpenses;
  if (endYM) {
    // endYM이 주어지면 해당 월까지만 필터 (예: '2025-07' → 2025-07-31까지)
    var endParts = endYM.split('-');
    var endYear = parseInt(endParts[0]);
    var endMonth = parseInt(endParts[1]);
    var lastDay = new Date(endYear, endMonth, 0).getDate();
    var endDate = endYM + '-' + String(lastDay).padStart(2, '0');
    yearExpenses = allExp.filter(function(e) { return e.date && e.date.startsWith(yearStr) && e.date <= endDate; });
  } else {
    yearExpenses = allExp.filter(function(e) { return e.date && e.date.startsWith(yearStr); });
  }
  if (!yearExpenses.length) return { startDate: null, endDate: null, total: 0, merchants: [] };

  var total = yearExpenses.reduce(function(s, e) { return s + e.amount; }, 0);
  var dates = yearExpenses.map(function(e) { return e.date; }).sort();
  var startDate = dates[0];
  var todayStr = today();
  var displayEndDate;
  if (endYM) {
    var eParts = endYM.split('-');
    var eY = parseInt(eParts[0]);
    var eM = parseInt(eParts[1]);
    var eLastDay = new Date(eY, eM, 0).getDate();
    var nowYM = todayStr.slice(0, 7);
    displayEndDate = (endYM === nowYM) ? todayStr : endYM + '-' + String(eLastDay).padStart(2, '0');
  } else {
    displayEndDate = todayStr.startsWith(yearStr) ? todayStr : dates[dates.length - 1];
  }

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

  // 연간 기타 묶기: 1만원 이하 → 단일 "기타"로 묶기
  var grouped = [];
  var etcItems = [];
  var etcTotalAmount = 0;
  var etcTotalCount = 0;

  merchants.forEach(function(m) {
    if (m.amount <= 10000) {
      etcItems.push(m);
      etcTotalAmount += m.amount;
      etcTotalCount += m.count;
    } else {
      grouped.push(m);
    }
  });

  if (etcItems.length > 0) {
    grouped.push({
      merchant: '기타',
      amount: etcTotalAmount,
      count: etcTotalCount,
      percent: total > 0 ? Math.round(etcTotalAmount / total * 1000) / 10 : 0,
      category: 'etc',
      isBrand: false,
      isEtcGroup: true,
      etcItems: etcItems
    });
  }

  // 금액 내림차순 재정렬
  grouped.sort(function(a, b) { return b.amount - a.amount; });

  merchants = grouped;

  return {
    startDate: startDate,
    endDate: displayEndDate,
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
  { id: 'dining',    name: '외식',   color: '#E55643', bg: '#E55643' },
  { id: 'delivery',  name: '배달',   color: '#E8845A', bg: '#E8845A' },
  { id: 'online',    name: '온라인쇼핑', color: '#5BA0A0', bg: '#5BA0A0' },
  { id: 'conv',      name: '편의점', color: '#E09E6A', bg: '#E09E6A' },
  { id: 'cat',       name: '고양이', color: '#E8A87C', bg: '#E8A87C' },
  { id: 'health',    name: '건강',   color: '#7BAEAE', bg: '#7BAEAE' },
  { id: 'culture',   name: '문화',   color: '#7B83C4', bg: '#7B83C4' },
  { id: 'fashion',   name: '패션',   color: '#B5678E', bg: '#B5678E' },
  { id: 'subscribe', name: '구독',   color: '#8B7FBF', bg: '#8B7FBF' },
  { id: 'transport', name: '교통',   color: '#6A9FBF', bg: '#6A9FBF' },
  { id: 'etc',       name: '기타',   color: '#A0A0A8', bg: '#A0A0A8' }
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
        // leftjap 카테고리
        { id: 'dining',      color: '#E55643', bg: '#E55643' },
        { id: 'delivery',    color: '#E8845A', bg: '#E8845A' },
        { id: 'online',      color: '#5BA0A0', bg: '#5BA0A0' },
        { id: 'conv',        color: '#E09E6A', bg: '#E09E6A' },
        { id: 'subscribe',   color: '#8B7FBF', bg: '#8B7FBF' },
        { id: 'transport',   color: '#6A9FBF', bg: '#6A9FBF' },
        // soyoun312 전용 카테고리
        { id: 'food',        color: '#C96B4F', bg: '#C96B4F' },
        { id: 'cafe',        color: '#D4789A', bg: '#D4789A' },
        { id: 'convenience', color: '#E09E6A', bg: '#E09E6A' },
        { id: 'gift',        color: '#CC8899', bg: '#CC8899' },
        { id: 'overseas',    color: '#5B85B0', bg: '#5B85B0' },
        { id: 'invest',      color: '#6B7FA0', bg: '#6B7FA0' },
        // 공통 카테고리
        { id: 'cat',         color: '#E8A87C', bg: '#E8A87C' },
        { id: 'health',      color: '#7BAEAE', bg: '#7BAEAE' },
        { id: 'culture',     color: '#7B83C4', bg: '#7B83C4' },
        { id: 'fashion',     color: '#B5678E', bg: '#B5678E' },
        { id: 'etc',         color: '#A0A0A8', bg: '#A0A0A8' },
        // 레거시 (기존 데이터 호환)
        { id: 'shopping',    color: '#5BA0A0', bg: '#5BA0A0' },
        { id: 'medical',     color: '#7BAEAE', bg: '#7BAEAE' },
        { id: 'leisure',     color: '#7B83C4', bg: '#7B83C4' },
        { id: 'beauty',      color: '#B5678E', bg: '#B5678E' },
        { id: 'pet',         color: '#E8A87C', bg: '#E8A87C' },
        { id: 'utility',     color: '#A0A0A8', bg: '#A0A0A8' }
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
