// ═══ CSS Guard: keep B-57 PROTECT 속성 정적 검증 ═══
// style.css의 iOS PWA 보호 속성(min-height, position, safe-area-inset)이 존재하는지 검증한다.
// AGENTS.md: "iOS PWA CSS 속성은 절대 삭제 금지, B-57 PROTECT 주석 필수"
'use strict';
var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');

var css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf-8');

// 셀렉터 뒤 500자 이내의 CSS 텍스트를 반환한다.
function nearBlock(src, selector) {
  var idx = src.indexOf(selector);
  if (idx === -1) return null;
  return src.substring(idx, Math.min(idx + 500, src.length));
}

test.describe('CSS Guard: keep 보호 속성 검증', function () {

  test.it('K-1: .editor-content-wrap — min-height', function () {
    var near = nearBlock(css, '.editor-content-wrap');
    assert.ok(near !== null, '.editor-content-wrap 셀렉터를 찾을 수 없습니다 — style.css 셀렉터명 확인 필요');
    assert.ok(near.indexOf('min-height') !== -1, '.editor-content-wrap 근처에 min-height가 없습니다');
  });

  test.it('K-2: .ed-topbar — position', function () {
    var near = nearBlock(css, '.ed-topbar');
    assert.ok(near !== null, '.ed-topbar 셀렉터를 찾을 수 없습니다 — style.css 셀렉터명 확인 필요');
    assert.ok(near.indexOf('position') !== -1, '.ed-topbar 근처에 position 속성이 없습니다');
  });

  test.it('K-3: safe-area-inset-bottom 문자열 존재', function () {
    assert.ok(css.indexOf('safe-area-inset-bottom') !== -1, 'style.css에 safe-area-inset-bottom이 없습니다');
  });

  test.it('K-4: B-57 PROTECT 주석 최소 1개', function () {
    assert.ok(css.indexOf('B-57 PROTECT') !== -1, 'style.css에 B-57 PROTECT 주석이 없습니다');
  });

  test.it('K-5: B-57 PROTECT 주석과 safe-area-inset 근접성', function () {
    var lines = css.split('\n');
    var protectLines = [];
    var safeAreaLines = [];
    var i;
    for (i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('B-57 PROTECT') !== -1) protectLines.push(i);
      if (lines[i].indexOf('safe-area-inset') !== -1) safeAreaLines.push(i);
    }
    assert.ok(protectLines.length > 0, 'B-57 PROTECT 주석이 없습니다');
    assert.ok(safeAreaLines.length > 0, 'safe-area-inset 속성이 없습니다');
    var found = false;
    for (i = 0; i < safeAreaLines.length; i++) {
      for (var j = 0; j < protectLines.length; j++) {
        if (Math.abs(safeAreaLines[i] - protectLines[j]) <= 30) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    assert.ok(found, 'safe-area-inset과 B-57 PROTECT 주석이 30줄 이내에 함께 존재하지 않습니다');
  });
});
