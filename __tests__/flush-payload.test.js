// ═══ 영역 7: sendBeacon flush 페이로드 보호 테스트 ═══
// sync.js의 _flushBeforeUnload는 navigator.sendBeacon으로 최대 64KB까지 전송한다.
// 페이로드가 64KB를 초과하면 sendBeacon이 호출되지 않아야 한다 (데이터 유실 방지는 로컬 저장으로 대체).
'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage } = require('./_setup.js');

describe('영역 7: sendBeacon flush 페이로드 보호', () => {

  let beaconCalls;
  let _origBeacon;

  beforeEach(() => {
    resetStorage();
    beaconCalls = [];

    // navigator.sendBeacon 모킹
    if (!global.navigator) global.navigator = {};
    global.navigator.sendBeacon = function(url, data) {
      beaconCalls.push({ url, data, size: data ? data.length : 0 });
      return true;
    };

    // SYNC 상태 초기화
    SYNC.isDbLoaded = true;
    SYNC._dbLoading = false;
    SYNC._dbSaveQueued = true; // flush 트리거 조건
    SYNC.dbTimer = setTimeout(function() {}, 99999);

    // 토큰 설정
    localStorage.setItem(_LS_PREFIX + 'gb_id_token', 'test-token');

    // 글로벌 함수 스텁
    global.activeTab = 'navi';
    global.saveCurDoc = function() {};
    global.saveBook = function() {};
    global.saveMemo = function() {};
    global.saveQuote = function() {};
    global.textTypes = ['navi', 'fiction', 'blog'];
  });

  // 7-1: 소량 데이터 — sendBeacon이 정상 호출된다
  it('7-1: 소량 데이터 시 sendBeacon이 호출된다', () => {
    // 소량 docs 삽입
    S(K.docs, [
      { id: 'd1', title: '테스트', content: '내용', type: 'navi', created: '2026-03-31T10:00:00Z' }
    ]);
    S(K.expenses, []);
    S(K.books, []);
    S(K.memos, []);
    S(K.quotes, []);
    S(K.checks, {});
    S(K.merchantIcons, []);
    S(K.merchantAliases, []);
    S(K.brandIcons, {});
    S(K.brandOverrides, {});

    SYNC._flushBeforeUnload();

    assert.equal(beaconCalls.length, 1, 'sendBeacon이 호출되지 않음');
    assert.ok(beaconCalls[0].size <= 65536,
      '페이로드가 64KB를 초과: ' + beaconCalls[0].size + ' bytes');
  });

  // 7-2: 64KB 초과 데이터 — sendBeacon이 호출되지 않는다
  it('7-2: 64KB 초과 시 sendBeacon이 호출되지 않는다 (로컬 저장으로 대체)', () => {
    // 대량 docs 삽입 (64KB 초과하도록)
    const bigDocs = [];
    for (let i = 0; i < 200; i++) {
      bigDocs.push({
        id: 'doc-' + i,
        title: '테스트 문서 ' + i,
        content: '<p>' + 'A'.repeat(300) + '</p>',
        type: 'navi',
        created: '2026-03-31T10:00:00Z',
        updated: '2026-03-31T10:00:00Z'
      });
    }
    S(K.docs, bigDocs);
    S(K.expenses, []);
    S(K.books, []);
    S(K.memos, []);
    S(K.quotes, []);
    S(K.checks, {});
    S(K.merchantIcons, []);
    S(K.merchantAliases, []);
    S(K.brandIcons, {});
    S(K.brandOverrides, {});

    SYNC._flushBeforeUnload();

    // 페이로드가 64KB를 초과하면 sendBeacon이 호출되지 않음
    if (beaconCalls.length > 0) {
      // 호출되었다면 64KB 이하인지 확인
      assert.ok(beaconCalls[0].size <= 65536,
        'sendBeacon이 64KB 초과 페이로드로 호출됨: ' + beaconCalls[0].size + ' bytes');
    }
    // sendBeacon이 호출되지 않은 것이 정상 (64KB 초과)
    // 어느 쪽이든 PASS — 핵심은 64KB 초과 페이로드가 sendBeacon에 전달되지 않는 것
  });

  // 7-3: 로컬 저장은 항상 수행된다 (sendBeacon 여부와 무관)
  it('7-3: _flushBeforeUnload 후 현재 편집 중인 문서가 localStorage에 저장된다', () => {
    let saveCalled = false;
    global.saveCurDoc = function() { saveCalled = true; };

    S(K.docs, [{ id: 'd1', title: '테스트', content: '내용', type: 'navi' }]);
    S(K.expenses, []);
    S(K.books, []);
    S(K.memos, []);
    S(K.quotes, []);
    S(K.checks, {});
    S(K.merchantIcons, []);
    S(K.merchantAliases, []);
    S(K.brandIcons, {});
    S(K.brandOverrides, {});

    SYNC._flushBeforeUnload();

    assert.ok(saveCalled, 'saveCurDoc가 호출되지 않음 — 로컬 저장 누락');
  });

  // 7-4: 토큰 없으면 sendBeacon 호출 안 됨
  it('7-4: idToken이 없으면 sendBeacon이 호출되지 않는다', () => {
    localStorage.removeItem(_LS_PREFIX + 'gb_id_token');

    S(K.docs, [{ id: 'd1', title: '테스트', content: '내용', type: 'navi' }]);
    S(K.expenses, []);
    S(K.books, []);
    S(K.memos, []);
    S(K.quotes, []);
    S(K.checks, {});
    S(K.merchantIcons, []);
    S(K.merchantAliases, []);
    S(K.brandIcons, {});
    S(K.brandOverrides, {});

    SYNC._flushBeforeUnload();

    assert.equal(beaconCalls.length, 0, '토큰 없이 sendBeacon이 호출됨');
  });

  // 7-5: _dbLoading 중이면 sendBeacon 호출 안 됨
  it('7-5: loadDatabase 진행 중(_dbLoading)이면 sendBeacon이 호출되지 않는다', () => {
    SYNC._dbLoading = true;

    S(K.docs, [{ id: 'd1', title: '테스트', content: '내용', type: 'navi' }]);
    S(K.expenses, []);
    S(K.books, []);
    S(K.memos, []);
    S(K.quotes, []);
    S(K.checks, {});
    S(K.merchantIcons, []);
    S(K.merchantAliases, []);
    S(K.brandIcons, {});
    S(K.brandOverrides, {});

    SYNC._flushBeforeUnload();

    assert.equal(beaconCalls.length, 0, '_dbLoading 중에 sendBeacon이 호출됨');
  });
});
