// ═══ 영역 1: docs CRUD Golden Path 테스트 ═══
'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage } = require('./_setup.js');

describe('영역 1: docs CRUD', () => {

  beforeEach(() => {
    resetStorage();
  });

  // 1-1: newDoc → allDocs
  it('1-1: newDoc 후 allDocs에 해당 문서가 존재한다', () => {
    const doc = newDoc('navi');
    const all = allDocs();
    assert.ok(all.some(d => d.id === doc.id), 'newDoc으로 생성한 문서가 allDocs에 없음');
    assert.equal(doc.type, 'navi');
    assert.ok(doc.id, 'id가 비어 있음');
    assert.ok(doc.created, 'created가 비어 있음');
  });

  // 1-2: saveDocs → allDocs 데이터 보존
  it('1-2: saveDocs로 저장한 title/content가 allDocs에서 동일하게 조회된다', () => {
    const doc = newDoc('navi');
    const docs = L(K.docs) || [];
    const idx = docs.findIndex(d => d.id === doc.id);
    docs[idx].title = '테스트 제목';
    docs[idx].content = '<p>테스트 본문</p>';
    docs[idx].updated = new Date().toISOString();
    saveDocs(docs);

    const loaded = allDocs().find(d => d.id === doc.id);
    assert.equal(loaded.title, '테스트 제목');
    assert.equal(loaded.content, '<p>테스트 본문</p>');
  });

  // 1-3: getDocs 타입 필터링
  it('1-3: getDocs가 타입별로 정확히 필터링한다', () => {
    newDoc('navi');
    newDoc('navi');
    newDoc('fiction');

    assert.equal(getDocs('navi').length, 2, 'navi 문서 수가 2가 아님');
    assert.equal(getDocs('fiction').length, 1, 'fiction 문서 수가 1이 아님');
    assert.equal(getDocs('blog').length, 0, 'blog 문서가 0이 아님');
  });

  // 1-4: 빈 상태에서 newDoc
  it('1-4: localStorage가 비어있을 때 newDoc이 정상 동작한다', () => {
    assert.equal(L(K.docs), null, '초기 상태가 null이 아님');
    const doc = newDoc('blog');
    assert.ok(doc.id, '빈 상태에서 newDoc 실패');
    assert.equal(allDocs().length, 1);
  });

  // 1-5: 다수 문서 생성 후 순서 확인 (최신이 앞)
  it('1-5: newDoc은 배열 앞에 추가된다 (최신순)', () => {
    const doc1 = newDoc('navi');
    const doc2 = newDoc('navi');
    const all = allDocs();
    assert.equal(all[0].id, doc2.id, '최신 문서가 맨 앞이 아님');
    assert.equal(all[1].id, doc1.id);
  });
});
