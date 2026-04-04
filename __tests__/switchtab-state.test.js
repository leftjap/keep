// ═══ 영역 6: switchTab 패널 상태 정합성 테스트 ═══
// AGENTS.md 규칙: "switchTab()은 else 블록에서 현재 에디터 서브패널을 숨기고,
// 진입 시 적절한 패널을 복원해야 한다"
// "에디터 서브패널은 한 번에 하나만 보여야 한다"
'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// ═══ DOM 모킹 인프라 ═══
const _elements = {};

function makeElement(id) {
  if (_elements[id]) return _elements[id];
  const classes = new Set();
  const el = {
    id: id,
    style: {},
    textContent: '',
    innerHTML: '',
    value: '',
    classList: {
      add(...cls) { cls.forEach(c => classes.add(c)); },
      remove(...cls) { cls.forEach(c => classes.delete(c)); },
      contains(c) { return classes.has(c); },
      toggle(c, force) {
        if (force === undefined) { if (classes.has(c)) classes.delete(c); else classes.add(c); }
        else { if (force) classes.add(c); else classes.delete(c); }
      }
    },
    _classes: classes,
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {},
    focus() {},
    scrollIntoView() {},
    remove() {}
  };
  _elements[id] = el;
  return el;
}

// switchTab이 사용하는 모든 DOM 요소
const panelIds = [
  'editorText', 'editorBook', 'editorQuote', 'editorMemo',
  'editorExpense', 'editorDayList', 'edToolbar',
  'expenseFullDashboard', 'expFullDetailPane',
  'pane-list', 'pane-photo', 'pane-calendar',
  'pane-expense-dashboard', 'pane-expense-detail',
  'pane-routine', 'editorRoutineDetail',
  'mainApp', 'edTabLabel', 'viewSwitcher', 'searchBar', 'searchInput',
  'clearSearchBtn', 'syncStatus', 'syncDot', 'syncCloudLabel',
  'edTitle', 'edBody', 'sideNav', 'trashBadge', 'photoGrid', 'calWrap'
];

// querySelector용 고정 요소
const _qsElements = {};
function makeQsElement(key) {
  if (!_qsElements[key]) _qsElements[key] = makeElement('_qs_' + key);
  return _qsElements[key];
}

function resetDom() {
  // 기존 요소의 style과 class를 리셋
  Object.keys(_elements).forEach(id => {
    _elements[id].style = {};
    _elements[id].textContent = '';
    _elements[id].innerHTML = '';
    _elements[id].value = '';
    _elements[id]._classes.clear();
  });
}

// ═══ 글로벌 설정 (1회) ═══
const _store = {};
global.localStorage = {
  getItem(key) { return _store[key] !== undefined ? _store[key] : null; },
  setItem(key, value) { _store[key] = String(value); },
  removeItem(key) { delete _store[key]; },
  clear() { Object.keys(_store).forEach(k => delete _store[k]); }
};

// DOM 초기 생성
panelIds.forEach(id => makeElement(id));

global.document = {
  getElementById(id) { return _elements[id] || makeElement(id); },
  querySelector(sel) {
    if (sel === '.list-panel') return makeQsElement('list-panel');
    if (sel === '.fab-btn') return makeQsElement('fab-btn');
    if (sel === '.ed-new-btn') return makeQsElement('ed-new-btn');
    if (sel === '.ed-more-btn') return makeQsElement('ed-more-btn');
    if (sel === '.ed-aa-btn') return makeQsElement('ed-aa-btn');
    if (sel === '.lp-search-btn') return makeQsElement('lp-search-btn');
    if (sel === '.expense-compact') return makeQsElement('expense-compact');
    if (sel === '.routine-compact') return makeQsElement('routine-compact');
    if (sel === '.editor') return makeQsElement('editor');
    return null;
  },
  querySelectorAll(sel) {
    if (sel === '.side-menu') return [];
    if (sel === '.exp-month-nav-inline') return [];
    return [];
  },
  addEventListener() {},
  createElement() {
    return { style: {}, textContent: '', innerHTML: '', classList: { add() {}, remove() {} }, appendChild() {}, remove() {} };
  },
  body: { appendChild() {} },
  documentElement: { style: { setProperty() {} } }
};

global.window = global;
global.addEventListener = function() {};
global.alert = function() {};
global.confirm = function() { return true; };
global.requestAnimationFrame = function(fn) { fn(); };
global.getSelection = function() { return { removeAllRanges: function() {} }; };
global.fetch = function() { return Promise.resolve({ ok: true, json() { return Promise.resolve({}); } }); };
global.APP_USER = 'leftjap';
global._partnerMode = false;
global._partnerData = null;
if (!global.navigator) global.navigator = {};
if (!global.navigator.storage) {
  Object.defineProperty(global.navigator, 'storage', {
    value: { persist() { return Promise.resolve(); } },
    writable: true, configurable: true
  });
}

// ── keep 소스 1회 로드 ──
function loadFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  const code = fs.readFileSync(filePath, 'utf-8');
  vm.runInThisContext(code, { filename: filePath });
}

loadFile('js/storage.js');
loadFile('js/sms-parser.js');
loadFile('js/sync.js');
loadFile('js/data.js');

// ui.js 의존성 스텁 (ui.js 로드 전에 선언)
global.hideComments = function() {};
global.hideRoutineCard = function() {};
global.hideRoutineCalView = function() {};
global.renderListPanel = function() {};
global.renderChk = function() {};
global.updateBackBtnIcon = function() {};
global.renderExpenseDashboard = function() {};
global.newExpenseForm = function() {};
global.renderExpenseCategoryGrid = function() {};
global.closeExpenseModal = function() {};
global.closeExpenseFloatingPopup = function() {};
global.updateExpenseCompact = function() {};
global.saveCurDoc = function() {};
global.loadDoc = function() {};
global.loadBook = function() {};
global.loadMemo = function() {};
global.loadQuote = function() {};
global.newBook = function() {};
global.newMemoForm = function() {};
global.newQuoteForm = function() {};
global.getTabCount = function() { return 0; };
global._getPartnerTabCount = function() { return 0; };
global._expenseViewYM = null;
global.stripHtml = function(s) { return (s || '').replace(/<[^>]*>/g, ''); };
global.weekdays = ['일','월','화','수','목','금','토'];
global._at = null;
global.selectedPhotoId = null;

loadFile('js/ui.js');

// ═══ 테스트 ═══
describe('영역 6: switchTab 패널 상태 정합성', () => {

  beforeEach(() => {
    // DOM 상태 리셋 (소스 재로드 없음)
    resetDom();
    localStorage.clear();
    SYNC.scheduleDatabaseSave = function() {};
    SYNC.isDbLoaded = true;

    // switchTab 의존 함수 재스텁 (로드 후 덮어쓰인 경우 대비)
    global.saveCurDoc = function() {};
    global.loadDoc = function() {};
    global.loadBook = function() {};
    global.loadMemo = function() {};
    global.loadQuote = function() {};
    global.newBook = function() {};
    global.newMemoForm = function() {};
    global.newQuoteForm = function() {};
    global.renderListPanel = function() {};
    global.updateBackBtnIcon = function() {};
    global.renderExpenseDashboard = function() {};
    global.newExpenseForm = function() {};
    global.renderExpenseCategoryGrid = function() {};

    // 초기 탭 상태
    activeTab = 'navi';
    window.innerWidth = 1500; // PC 모드
  });

  // 6-1: 글쓰기 탭 전환 시 editorText만 visible
  it('6-1: navi→fiction 전환 후 editorText만 display:flex이고 나머지 에디터 패널은 none이다', () => {
    switchTab('fiction');

    assert.equal(_elements['editorText'].style.display, 'flex', 'editorText가 flex가 아님');
    assert.equal(_elements['editorBook'].style.display, 'none', 'editorBook이 숨겨지지 않음');
    assert.equal(_elements['editorQuote'].style.display, 'none', 'editorQuote가 숨겨지지 않음');
    assert.equal(_elements['editorMemo'].style.display, 'none', 'editorMemo가 숨겨지지 않음');
  });

  // 6-2: book 탭 전환 시 editorBook만 visible
  it('6-2: navi→book 전환 후 editorBook만 display:flex이다', () => {
    switchTab('book');

    assert.equal(_elements['editorBook'].style.display, 'flex', 'editorBook이 flex가 아님');
    assert.equal(_elements['editorText'].style.display, 'none', 'editorText가 숨겨지지 않음');
    assert.equal(_elements['editorQuote'].style.display, 'none', 'editorQuote가 숨겨지지 않음');
    assert.equal(_elements['editorMemo'].style.display, 'none', 'editorMemo가 숨겨지지 않음');
  });

  // 6-3: expense 탭에서 나올 때 expense-active 클래스 제거
  it('6-3: expense→navi 전환 후 list-panel에 expense-active 클래스가 없다', () => {
    switchTab('expense');
    const listPanel = makeQsElement('list-panel');
    assert.ok(listPanel._classes.has('expense-active'),
      'expense 탭 진입 시 expense-active가 없음');

    switchTab('navi');
    assert.ok(!listPanel._classes.has('expense-active'),
      'navi 탭 전환 후 expense-active가 남아있음');
  });

  // 6-4: expense에서 다른 탭으로 전환 시 expenseFullDashboard 숨김
  it('6-4: expense→memo 전환 후 expenseFullDashboard가 숨겨진다', () => {
    switchTab('expense');
    switchTab('memo');

    assert.equal(_elements['expenseFullDashboard'].style.display, 'none',
      'expenseFullDashboard가 숨겨지지 않음');
    assert.equal(_elements['pane-expense-dashboard'].style.display, 'none',
      'pane-expense-dashboard가 숨겨지지 않음');
  });

  // 6-5: 모든 글쓰기 탭 순회 — 항상 editorText만 visible
  it('6-5: textTypes 탭 순회 시 항상 editorText만 visible이다', () => {
    for (const t of ['navi', 'fiction', 'blog']) {
      activeTab = 'memo';
      switchTab(t);

      assert.equal(_elements['editorText'].style.display, 'flex',
        t + ' 탭에서 editorText가 flex가 아님');
      assert.equal(_elements['editorBook'].style.display, 'none',
        t + ' 탭에서 editorBook이 숨겨지지 않음');
      assert.equal(_elements['editorMemo'].style.display, 'none',
        t + ' 탭에서 editorMemo가 숨겨지지 않음');
    }
  });

  // 6-6: expense→expense 외 탭 전환 시 edToolbar 복원
  it('6-6: expense→navi 전환 후 edToolbar가 display:flex로 복원된다', () => {
    switchTab('expense');
    assert.equal(_elements['edToolbar'].style.display, 'none',
      'expense 탭에서 edToolbar가 숨겨지지 않음');

    switchTab('navi');
    assert.equal(_elements['edToolbar'].style.display, 'flex',
      'navi 탭에서 edToolbar가 복원되지 않음');
  });
});
