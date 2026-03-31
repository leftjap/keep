// ═══ 테스트 환경 셋업: localStorage 모킹 + keep 소스 로드 ═══
'use strict';

// ── localStorage 모킹 ──
const _store = {};
global.localStorage = {
  getItem(key) { return _store[key] !== undefined ? _store[key] : null; },
  setItem(key, value) { _store[key] = String(value); },
  removeItem(key) { delete _store[key]; },
  clear() { Object.keys(_store).forEach(k => delete _store[k]); }
};

// ── 최소 DOM 모킹 (data.js 로드 시 필요한 것만) ──
global.window = global;
global.document = {
  getElementById() {
    return {
      value: '', textContent: '', innerHTML: '',
      style: {}, classList: { add() {}, remove() {}, contains() { return false; } },
      addEventListener() {}
    };
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {},
  createElement(tag) {
    return {
      style: {}, textContent: '', innerHTML: '',
      classList: { add() {}, remove() {} },
      appendChild() {}, remove() {}
    };
  },
  body: { appendChild() {} }
};

// navigator 객체 확장 (읽기 전용이므로 Object.defineProperty 사용)
if (!global.navigator) { global.navigator = {}; }
if (!global.navigator.storage) {
  Object.defineProperty(global.navigator, 'storage', {
    value: { persist() { return Promise.resolve(); } },
    writable: true,
    configurable: true
  });
}

global.alert = function() {};
global.confirm = function() { return true; };
global.requestAnimationFrame = function(fn) { fn(); };
global.fetch = function() { return Promise.resolve({ ok: true, json() { return Promise.resolve({}); } }); };

// ── keep 전역 변수 사전 설정 (app.js 없이 data.js 로드 가능하도록) ──
global.APP_USER = 'leftjap';
global._partnerMode = false;
global._partnerData = null;

// ── keep 소스 로드 (순서 중요) ──
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadKeepFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  const code = fs.readFileSync(filePath, 'utf-8');
  vm.runInThisContext(code, { filename: filePath });
}

loadKeepFile('js/storage.js');
loadKeepFile('js/sms-parser.js');
loadKeepFile('js/sync.js');
loadKeepFile('js/data.js');

// ── 헬퍼: 테스트 간 localStorage 초기화 ──
function resetStorage() {
  localStorage.clear();
}

module.exports = { resetStorage };
