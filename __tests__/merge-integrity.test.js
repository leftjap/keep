const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

/**
 * sync.js loadDatabase() 내부의 merge 로직을 독립 함수로 재현.
 * 원본 코드의 for 루프 로직과 정확히 동일한 규칙:
 * - 로컬에만 있는 항목 → 보존
 * - 서버에만 있는 항목 → _deleted가 아니면 추가
 * - 양쪽 모두 있고 서버가 최신 → 서버로 갱신
 * - 로컬에서 _deleted → 서버 데이터로 복원하지 않음
 */
function mergeItems(localItems, serverItems) {
  // 로컬이 비어있으면 서버 데이터 적용 (삭제 항목 제외)
  if (!localItems || localItems.length === 0) {
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
      if (lv._deleted) continue;
      var svTime = sv.updated || sv.created || sv.date || '';
      var lvTime = lv.updated || lv.created || lv.date || '';
      if (svTime && lvTime && svTime > lvTime) {
        Object.assign(lv, sv);
      }
    } else {
      if (sv._deleted) continue;
      localItems.push(sv);
      localMap[sv.id] = sv;
    }
  }

  return localItems;
}

describe('Guard: mergeServerAll 병합 불변 조건', () => {

  it('로컬에만 있는 항목은 삭제되지 않음', () => {
    var local = [
      { id: 'doc1', title: '로컬 전용', updated: '2026-04-01T10:00:00' }
    ];
    var server = [
      { id: 'doc2', title: '서버 전용', updated: '2026-04-01T09:00:00' }
    ];
    var result = mergeItems(local, server);
    assert.ok(result.find(d => d.id === 'doc1'), '로컬 전용 항목 보존');
    assert.ok(result.find(d => d.id === 'doc2'), '서버 전용 항목 추가');
  });

  it('서버에만 있는 항목이 로컬에 추가됨', () => {
    var local = [{ id: 'doc1', title: '기존', updated: '2026-04-01T10:00:00' }];
    var server = [{ id: 'doc3', title: '새 서버 항목', updated: '2026-04-01T12:00:00' }];
    var result = mergeItems(local, server);
    assert.equal(result.length, 2);
    assert.ok(result.find(d => d.id === 'doc3'), '서버 항목 추가됨');
  });

  it('양쪽 모두 있고 서버가 최신이면 서버 버전으로 갱신', () => {
    var local = [{ id: 'doc1', title: '오래된 제목', updated: '2026-04-01T10:00:00' }];
    var server = [{ id: 'doc1', title: '새 제목', updated: '2026-04-01T15:00:00' }];
    var result = mergeItems(local, server);
    assert.equal(result[0].title, '새 제목', '서버 최신 → 갱신');
  });

  it('양쪽 모두 있고 로컬이 최신이면 로컬 유지', () => {
    var local = [{ id: 'doc1', title: '로컬 최신', updated: '2026-04-01T15:00:00' }];
    var server = [{ id: 'doc1', title: '서버 오래됨', updated: '2026-04-01T10:00:00' }];
    var result = mergeItems(local, server);
    assert.equal(result[0].title, '로컬 최신', '로컬이 최신이면 유지');
  });

  it('soft-delete된 항목(_deleted: true)은 병합 후에도 삭제 상태 유지', () => {
    var local = [{ id: 'doc1', title: '삭제됨', _deleted: true, updated: '2026-04-01T10:00:00' }];
    var server = [{ id: 'doc1', title: '서버 버전', updated: '2026-04-01T15:00:00' }];
    var result = mergeItems(local, server);
    assert.equal(result[0]._deleted, true, '로컬 삭제 상태 유지 — 서버로 복원 안 됨');
    assert.equal(result[0].title, '삭제됨', '제목도 서버로 덮어쓰지 않음');
  });

  it('서버의 _deleted 항목은 로컬에 추가되지 않음', () => {
    var local = [{ id: 'doc1', title: '기존', updated: '2026-04-01T10:00:00' }];
    var server = [{ id: 'doc2', title: '서버 삭제 항목', _deleted: true }];
    var result = mergeItems(local, server);
    assert.equal(result.length, 1, '삭제된 서버 항목은 추가 안 됨');
    assert.equal(result[0].id, 'doc1');
  });

  it('로컬이 비어있으면 서버 데이터 적용 (삭제 항목 제외)', () => {
    var local = [];
    var server = [
      { id: 'doc1', title: '정상' },
      { id: 'doc2', title: '삭제됨', _deleted: true }
    ];
    var result = mergeItems(local, server);
    assert.equal(result.length, 1, '삭제 항목 제외하고 적용');
    assert.equal(result[0].id, 'doc1');
  });
});
