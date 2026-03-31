// ═══ 영역 5: SMS 파서 클라이언트↔서버 동기화 검증 ═══
// data.js(클라이언트)와 gas/Code.js(서버)의 매핑 테이블이 동기화 상태인지 검증한다.
// AGENTS.md 규칙: "sms-parser.js, data.js의 파싱/자동매칭 함수는 Code.js와 반드시 동일해야 한다"
'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const pathMod = require('path');

// ── 클라이언트 소스는 _setup.js에서 이미 로드됨 ──
require('./_setup.js');

// ── 서버(GAS) 소스 텍스트 ──
const gasCode = fs.readFileSync(pathMod.join(__dirname, '..', 'gas', 'Code.js'), 'utf-8');

// ── 안전한 오브젝트 추출: 중괄호 매칭으로 블록을 잘라낸 뒤 Function으로 평가 ──
function extractObject(src, varName) {
  var pattern = new RegExp('var\\s+' + varName + '\\s*=\\s*\\{');
  var match = pattern.exec(src);
  if (!match) return null;
  var braceStart = src.indexOf('{', match.index);
  var depth = 0;
  for (var i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        var block = src.substring(braceStart, i + 1);
        // 한줄 주석 제거
        block = block.replace(/\/\/[^\n]*/g, '');
        try {
          return (new Function('return ' + block))();
        } catch (e) {
          return null;
        }
      }
    }
  }
  return null;
}

// ── 함수 본문 추출 ──
function extractFunction(src, fnName) {
  var pattern = new RegExp('function\\s+' + fnName + '\\s*\\([^)]*\\)\\s*\\{');
  var match = pattern.exec(src);
  if (!match) return null;
  var braceStart = src.indexOf('{', match.index);
  var depth = 0;
  for (var i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        return src.substring(match.index, i + 1);
      }
    }
  }
  return null;
}

var gasBrandCategoryMap = extractObject(gasCode, 'BRAND_CATEGORY_MAP');
var gasMerchantToBrand = extractObject(gasCode, 'MERCHANT_TO_BRAND');

describe('영역 5: SMS 파서 클라이언트↔서버 동기화', () => {

  // 5-1: MERCHANT_TO_BRAND 키 동기화
  it('5-1: MERCHANT_TO_BRAND — 클라이언트와 서버의 키 집합이 동일하다', () => {
    assert.ok(gasMerchantToBrand, 'GAS Code.js에서 MERCHANT_TO_BRAND 추출 실패');
    var clientKeys = Object.keys(MERCHANT_TO_BRAND).sort();
    var serverKeys = Object.keys(gasMerchantToBrand).sort();
    var clientOnly = clientKeys.filter(function(k) { return !gasMerchantToBrand.hasOwnProperty(k); });
    var serverOnly = serverKeys.filter(function(k) { return !MERCHANT_TO_BRAND.hasOwnProperty(k); });
    assert.deepEqual(clientOnly, [], '클라이언트에만 있는 매출처 키: ' + clientOnly.join(', '));
    assert.deepEqual(serverOnly, [], '서버에만 있는 매출처 키: ' + serverOnly.join(', '));
  });

  // 5-2: MERCHANT_TO_BRAND 값(브랜드명) 동기화
  it('5-2: MERCHANT_TO_BRAND — 동일 키의 브랜드명이 일치한다', () => {
    assert.ok(gasMerchantToBrand, 'GAS Code.js에서 MERCHANT_TO_BRAND 추출 실패');
    var mismatches = [];
    Object.keys(MERCHANT_TO_BRAND).forEach(function(key) {
      if (gasMerchantToBrand[key] && MERCHANT_TO_BRAND[key] !== gasMerchantToBrand[key]) {
        mismatches.push(key + ': client=' + MERCHANT_TO_BRAND[key] + ' server=' + gasMerchantToBrand[key]);
      }
    });
    assert.deepEqual(mismatches, [], '브랜드명 불일치: ' + mismatches.join(' | '));
  });

  // 5-3: BRAND_CATEGORY_MAP 키 동기화
  it('5-3: BRAND_CATEGORY_MAP — 클라이언트와 서버의 브랜드 키 집합이 동일하다', () => {
    assert.ok(gasBrandCategoryMap, 'GAS Code.js에서 BRAND_CATEGORY_MAP 추출 실패');
    var clientKeys = Object.keys(BRAND_CATEGORY_MAP).sort();
    var serverKeys = Object.keys(gasBrandCategoryMap).sort();
    var clientOnly = clientKeys.filter(function(k) { return !gasBrandCategoryMap.hasOwnProperty(k); });
    var serverOnly = serverKeys.filter(function(k) { return !BRAND_CATEGORY_MAP.hasOwnProperty(k); });
    assert.deepEqual(clientOnly, [], '클라이언트에만 있는 브랜드: ' + clientOnly.join(', '));
    assert.deepEqual(serverOnly, [], '서버에만 있는 브랜드: ' + serverOnly.join(', '));
  });

  // 5-4: BRAND_CATEGORY_MAP 값(카테고리) 동기화
  it('5-4: BRAND_CATEGORY_MAP — 동일 브랜드의 카테고리가 일치한다', () => {
    assert.ok(gasBrandCategoryMap, 'GAS Code.js에서 BRAND_CATEGORY_MAP 추출 실패');
    var mismatches = [];
    Object.keys(BRAND_CATEGORY_MAP).forEach(function(brand) {
      if (gasBrandCategoryMap[brand] && BRAND_CATEGORY_MAP[brand] !== gasBrandCategoryMap[brand]) {
        mismatches.push(brand + ': client=' + BRAND_CATEGORY_MAP[brand] + ' server=' + gasBrandCategoryMap[brand]);
      }
    });
    assert.deepEqual(mismatches, [], '카테고리 불일치: ' + mismatches.join(' | '));
  });

  // 5-5: cleanMerchantName 동기화 — 대표 입력에 대해 양쪽 결과 일치
  it('5-5: cleanMerchantName — 대표 입력 10개에 대해 클라이언트와 서버 결과가 동일하다', () => {
    var fnCode = extractFunction(gasCode, 'cleanMerchantName');
    assert.ok(fnCode, 'GAS Code.js에서 cleanMerchantName 함수를 찾을 수 없음');

    // 함수 본문만 추출 (function cleanMerchantName(merchant) { ... } → 내부만)
    var bodyStart = fnCode.indexOf('{') + 1;
    var bodyEnd = fnCode.lastIndexOf('}');
    var body = fnCode.substring(bodyStart, bodyEnd);
    var gasCleanMerchant = new Function('merchant', body);

    var testInputs = [
      '신한온누리 사러가연희수퍼마켓',
      'USD 22.00 CLAUDE',
      '1차 민생회복 씨유홍대3호',
      '또부겠지스마일',
      'HUF 124,000.00 COS',
      'SP STUSSY HONOLULU',
      'KITH HAWAII',
      'LARINASCENTE',
      'www.curefip.com',
      'KIX DFS OSAKA'
    ];

    var mismatches = [];
    testInputs.forEach(function(input) {
      var clientResult = cleanMerchantName(input);
      var serverResult = gasCleanMerchant(input);
      if (clientResult !== serverResult) {
        mismatches.push(input + ': client=[' + clientResult + '] server=[' + serverResult + ']');
      }
    });
    assert.deepEqual(mismatches, [], 'cleanMerchantName 불일치: ' + mismatches.join(' | '));
  });
});
