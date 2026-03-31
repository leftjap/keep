// ═══ 영역 3: Soft Delete 보호 테스트 ═══
'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage } = require('./_setup.js');

describe('영역 3: Soft Delete', () => {

  beforeEach(() => {
    resetStorage();
  });

  // 3-1: _softDelete 플래그
  it('3-1: _softDelete 후 _deleted:true와 _deletedAt이 존재한다', () => {
    const doc = newDoc('navi');
    var docs = L(K.docs) || [];
    _softDelete(docs, doc.id);
    saveDocs(docs);

    var raw = L(K.docs);
    var target = raw.find(d => d.id === doc.id);
    assert.equal(target._deleted, true, '_deleted가 true가 아님');
    assert.ok(target._deletedAt, '_deletedAt이 없음');
    assert.ok(target.updated, 'updated가 없음');
  });

  // 3-2: _filterDeleted 필터링
  it('3-2: 삭제된 항목이 allDocs/getBooks/getExpenses에서 제외된다', () => {
    // docs
    const doc = newDoc('navi');
    var docs = L(K.docs) || [];
    _softDelete(docs, doc.id);
    saveDocs(docs);
    assert.equal(allDocs().length, 0, '삭제된 doc가 allDocs에 포함됨');

    // books
    var books = [{ id: 'b1', title: '책', date: '2026-03-31', updated: new Date().toISOString() }];
    S(K.books, books);
    assert.equal(getBooks().length, 1);
    _softDelete(books, 'b1');
    S(K.books, books);
    assert.equal(getBooks().length, 0, '삭제된 book이 getBooks에 포함됨');

    // expenses
    var expenses = [{ id: 'e1', amount: 5000, date: '2026-03-31', category: 'etc' }];
    S(K.expenses, expenses);
    assert.equal(getExpenses().length, 1);
    _softDelete(expenses, 'e1');
    S(K.expenses, expenses);
    assert.equal(getExpenses().length, 0, '삭제된 expense가 getExpenses에 포함됨');
  });

  // 3-3: 복원
  it('3-3: restoreDeletedItem 후 삭제 플래그가 제거되고 조회에 포함된다', () => {
    const doc = newDoc('navi');
    var docs = L(K.docs) || [];
    _softDelete(docs, doc.id);
    saveDocs(docs);
    assert.equal(allDocs().length, 0);

    // SYNC 모킹 (restoreDeletedItem 내부에서 호출)
    var _origSchedule = SYNC.scheduleDatabaseSave;
    SYNC.scheduleDatabaseSave = function() {};

    restoreDeletedItem('doc', doc.id);

    SYNC.scheduleDatabaseSave = _origSchedule;

    assert.equal(allDocs().length, 1, '복원 후 allDocs에 포함되지 않음');
    var restored = (L(K.docs) || []).find(d => d.id === doc.id);
    assert.equal(restored._deleted, undefined, '복원 후 _deleted가 남아있음');
    assert.equal(restored._deletedAt, undefined, '복원 후 _deletedAt이 남아있음');
  });

  // 3-4: 30일 정리
  it('3-4: _purgeExpired는 30일 지난 삭제 항목을 제거하고 29일은 유지한다', () => {
    var now = new Date();
    var day31 = new Date(now);
    day31.setDate(now.getDate() - 31);
    var day29 = new Date(now);
    day29.setDate(now.getDate() - 29);

    var items = [
      { id: '1', _deleted: true, _deletedAt: day31.toISOString() },
      { id: '2', _deleted: true, _deletedAt: day29.toISOString() },
      { id: '3', title: '정상' }
    ];

    var result = _purgeExpired(items, 30);
    assert.equal(result.length, 2, '31일 된 항목이 제거되지 않음');
    assert.ok(result.some(i => i.id === '2'), '29일 된 항목이 잘못 제거됨');
    assert.ok(result.some(i => i.id === '3'), '정상 항목이 잘못 제거됨');
    assert.ok(!result.some(i => i.id === '1'), '31일 된 항목이 남아있음');
  });

  // 3-5: 영구 삭제 ID 추적
  it('3-5: permanentDeleteItem 후 gb_purgedIds에 해당 id가 기록된다', () => {
    const doc = newDoc('navi');
    var _origSchedule = SYNC.scheduleDatabaseSave;
    SYNC.scheduleDatabaseSave = function() {};

    permanentDeleteItem('doc', doc.id);

    SYNC.scheduleDatabaseSave = _origSchedule;

    assert.equal(allDocs().length, 0, '영구 삭제 후 문서가 남아있음');
    var purged = JSON.parse(localStorage.getItem('gb_purgedIds') || '{}');
    assert.ok(purged.docs, 'purgedIds에 docs 키가 없음');
    assert.ok(purged.docs.includes(String(doc.id)), 'purgedIds에 id가 기록되지 않음');
  });

  // 3-6: _getDeletedIds 구조 검증
  it('3-6: _getDeletedIds가 삭제된 항목의 id 배열을 반환한다', () => {
    var items = [
      { id: 'a', _deleted: true },
      { id: 'b' },
      { id: 'c', _deleted: true }
    ];
    var ids = _getDeletedIds(items);
    assert.deepEqual(ids, ['a', 'c']);
  });
});
