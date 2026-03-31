// ═══ 영역 2: 동기화 병합 Golden Path 테스트 ═══
// sync.js의 loadDatabase/mergeServerDocs/mergeServerExpenses 병합 로직을 검증한다.
// 실제 서버 호출 없이, 병합 함수의 핵심 로직만 테스트한다.
// loadDatabase 내부의 merge 로직을 직접 재현하여 검증한다.
'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage } = require('./_setup.js');

// ── 병합 로직 헬퍼 (loadDatabase 내부 로직을 추출) ──
// loadDatabase의 merge 로직은 sync.js 안에 있으나 서버 호출과 결합되어 있어
// 직접 호출이 어렵다. 핵심 병합 패턴을 독립 함수로 재현하여 테스트한다.
// 이 함수는 loadDatabase의 mergeKeys 루프와 동일한 로직이다.

function mergeItems(localItems, serverItems) {
  // loadDatabase 내부 병합 로직 재현
  if (!localItems || localItems.length === 0) {
    // 로컬 비어있음: 서버 데이터 적용 (삭제 항목 제외)
    var filtered = [];
    for (var fi = 0; fi < serverItems.length; fi++) {
      if (!serverItems[fi]._deleted) filtered.push(serverItems[fi]);
    }
    return filtered;
  }

  var localMap = {};
  for (var li = 0; li < localItems.length; li++) {
    localMap[localItems[li].id] = localItems[li];
  }

  for (var si = 0; si < serverItems.length; si++) {
    var sv = serverItems[si];
    var lv = localMap[sv.id];
    if (lv) {
      // 로컬에서 삭제된 항목은 서버 데이터로 복원하지 않음
      if (lv._deleted) continue;
      var svTime = sv.updated || sv.created || sv.date || '';
      var lvTime = lv.updated || lv.created || lv.date || '';
      if (svTime && lvTime && svTime > lvTime) {
        Object.assign(lv, sv);
      }
    } else {
      // 서버에만 있는 항목: 삭제 상태면 추가하지 않음
      if (sv._deleted) continue;
      localItems.push(sv);
      localMap[sv.id] = sv;
    }
  }

  return localItems;
}

// ── expenses 병합 헬퍼 (mergeServerExpenses 내부 로직 재현) ──
function mergeExpenses(localExpenses, serverExpenses) {
  if (!localExpenses || localExpenses.length === 0) {
    var filtered = [];
    for (var fi = 0; fi < serverExpenses.length; fi++) {
      if (!serverExpenses[fi]._deleted) filtered.push(serverExpenses[fi]);
    }
    return filtered;
  }

  var localMap = {};
  for (var i = 0; i < localExpenses.length; i++) {
    localMap[localExpenses[i].id] = localExpenses[i];
  }

  for (var j = 0; j < serverExpenses.length; j++) {
    var se = serverExpenses[j];
    var le = localMap[se.id];
    if (le) {
      if (le._deleted) continue;
      // expenses는 updated 필드가 없으므로 created 사용
      var seTime = se.created || se.date || '';
      var leTime = le.created || le.date || '';
      if (seTime && leTime && seTime > leTime) {
        Object.assign(le, se);
      }
    } else {
      if (se._deleted) continue;
      localExpenses.push(se);
      localMap[se.id] = se;
    }
  }

  return localExpenses;
}

describe('영역 2: 동기화 병합 — docs', () => {

  beforeEach(() => {
    resetStorage();
  });

  // 2-1: 서버에만 있는 항목 추가
  it('2-1: 서버에만 있는 문서가 로컬에 추가된다', () => {
    var local = [
      { id: 'a', title: '로컬A', type: 'navi', updated: '2026-03-30T10:00:00Z' }
    ];
    var server = [
      { id: 'a', title: '로컬A', type: 'navi', updated: '2026-03-30T10:00:00Z' },
      { id: 'b', title: '서버B', type: 'navi', updated: '2026-03-31T10:00:00Z' }
    ];
    var result = mergeItems(local, server);
    assert.equal(result.length, 2, '병합 후 항목 수가 2가 아님');
    assert.ok(result.some(d => d.id === 'b'), '서버 항목 b가 추가되지 않음');
  });

  // 2-2: 서버가 더 최신인 항목 갱신
  it('2-2: 서버 updated가 더 최신이면 로컬이 서버 값으로 갱신된다', () => {
    var local = [
      { id: 'a', title: '구버전', type: 'navi', updated: '2026-03-30T10:00:00Z' }
    ];
    var server = [
      { id: 'a', title: '신버전', type: 'navi', updated: '2026-03-31T10:00:00Z' }
    ];
    var result = mergeItems(local, server);
    assert.equal(result[0].title, '신버전', '서버 값으로 갱신되지 않음');
  });

  // 2-3: 로컬이 더 최신이면 유지
  it('2-3: 로컬 updated가 더 최신이면 로컬 값이 유지된다', () => {
    var local = [
      { id: 'a', title: '로컬최신', type: 'navi', updated: '2026-03-31T10:00:00Z' }
    ];
    var server = [
      { id: 'a', title: '서버구버전', type: 'navi', updated: '2026-03-30T10:00:00Z' }
    ];
    var result = mergeItems(local, server);
    assert.equal(result[0].title, '로컬최신', '로컬 값이 서버로 덮어쓰임');
  });

  // 2-4: 로컬 삭제 항목 복원 방지 (L-05)
  it('2-4: 로컬에서 삭제(_deleted)한 항목이 서버 데이터로 복원되지 않는다', () => {
    var local = [
      { id: 'a', title: '삭제됨', type: 'navi', updated: '2026-03-30T10:00:00Z', _deleted: true, _deletedAt: '2026-03-30T12:00:00Z' }
    ];
    var server = [
      { id: 'a', title: '서버판', type: 'navi', updated: '2026-03-31T10:00:00Z' }
    ];
    var result = mergeItems(local, server);
    var item = result.find(d => d.id === 'a');
    assert.equal(item._deleted, true, '삭제 항목이 복원됨 (L-05 위반)');
    assert.equal(item.title, '삭제됨', '삭제 항목의 title이 서버 값으로 변경됨');
  });

  // 2-5: 서버 삭제 항목 추가 방지
  it('2-5: 서버에만 있지만 _deleted:true인 항목은 로컬에 추가되지 않는다', () => {
    var local = [
      { id: 'a', title: '로컬A', type: 'navi', updated: '2026-03-30T10:00:00Z' }
    ];
    var server = [
      { id: 'a', title: '로컬A', type: 'navi', updated: '2026-03-30T10:00:00Z' },
      { id: 'b', title: '삭제됨', type: 'navi', updated: '2026-03-31T10:00:00Z', _deleted: true }
    ];
    var result = mergeItems(local, server);
    assert.equal(result.length, 1, '서버 삭제 항목이 로컬에 추가됨');
    assert.ok(!result.some(d => d.id === 'b'), '삭제된 항목 b가 로컬에 존재');
  });

  // 2-5b: 빈 로컬에 서버 데이터 적용 (첫 설치)
  it('2-5b: 로컬이 비어있으면 서버 데이터가 적용되되, 삭제 항목은 제외된다', () => {
    var local = [];
    var server = [
      { id: 'a', title: '정상', type: 'navi', updated: '2026-03-31T10:00:00Z' },
      { id: 'b', title: '삭제됨', type: 'navi', updated: '2026-03-31T10:00:00Z', _deleted: true }
    ];
    var result = mergeItems(local, server);
    assert.equal(result.length, 1, '삭제 항목이 포함됨');
    assert.equal(result[0].id, 'a');
  });
});

describe('영역 2: 동기화 병합 — expenses', () => {

  beforeEach(() => {
    resetStorage();
  });

  // 2-6a: 서버에만 있는 expense 추가
  it('2-6a: 서버에만 있는 expense가 로컬에 추가된다', () => {
    var local = [
      { id: 'e1', amount: 5000, date: '2026-03-30', created: '2026-03-30T10:00:00Z' }
    ];
    var server = [
      { id: 'e1', amount: 5000, date: '2026-03-30', created: '2026-03-30T10:00:00Z' },
      { id: 'e2', amount: 3000, date: '2026-03-31', created: '2026-03-31T10:00:00Z' }
    ];
    var result = mergeExpenses(local, server);
    assert.equal(result.length, 2, 'expense 병합 후 항목 수가 2가 아님');
  });

  // 2-6b: 로컬 삭제 expense 복원 방지
  it('2-6b: 로컬에서 삭제한 expense가 서버 데이터로 복원되지 않는다', () => {
    var local = [
      { id: 'e1', amount: 5000, date: '2026-03-30', created: '2026-03-30T10:00:00Z', _deleted: true, _deletedAt: '2026-03-30T12:00:00Z' }
    ];
    var server = [
      { id: 'e1', amount: 5000, date: '2026-03-30', created: '2026-03-31T10:00:00Z' }
    ];
    var result = mergeExpenses(local, server);
    var item = result.find(e => e.id === 'e1');
    assert.equal(item._deleted, true, '삭제된 expense가 복원됨 (L-05 위반)');
  });

  // 2-6c: 서버가 더 최신인 expense 갱신
  it('2-6c: 서버 created가 더 최신이면 로컬 expense가 갱신된다', () => {
    var local = [
      { id: 'e1', amount: 5000, merchant: '구', date: '2026-03-30', created: '2026-03-30T10:00:00Z' }
    ];
    var server = [
      { id: 'e1', amount: 7000, merchant: '신', date: '2026-03-30', created: '2026-03-31T10:00:00Z' }
    ];
    var result = mergeExpenses(local, server);
    assert.equal(result[0].amount, 7000, 'expense 금액이 서버 값으로 갱신되지 않음');
    assert.equal(result[0].merchant, '신', 'expense 가맹점이 서버 값으로 갱신되지 않음');
  });

  // 2-6d: 빈 로컬에 서버 expenses 적용
  it('2-6d: 로컬이 비어있으면 서버 expenses가 적용되되, 삭제 항목은 제외된다', () => {
    var local = [];
    var server = [
      { id: 'e1', amount: 5000, date: '2026-03-30', created: '2026-03-30T10:00:00Z' },
      { id: 'e2', amount: 3000, date: '2026-03-31', created: '2026-03-31T10:00:00Z', _deleted: true }
    ];
    var result = mergeExpenses(local, server);
    assert.equal(result.length, 1, '삭제 항목이 포함됨');
    assert.equal(result[0].id, 'e1');
  });
});
