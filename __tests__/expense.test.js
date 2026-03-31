// ═══ 영역 4: 가계부 입력 Golden Path 테스트 ═══
'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetStorage } = require('./_setup.js');

// ── SYNC 모킹 (newExpense 내부에서 호출 방지) ──
const _origSchedule = SYNC.scheduleDatabaseSave;

describe('영역 4: 가계부 입력', () => {

  beforeEach(() => {
    resetStorage();
    SYNC.scheduleDatabaseSave = function() {};
    SYNC.isDbLoaded = true;
  });

  // ═══ SMS 파싱 ═══

  // 4-1: 국내 일반 결제
  it('4-1: 국내 SMS — 금액, 가맹점, 카드, 카테고리가 정확히 파싱된다', () => {
    const result = parseSMS('삼성1337 승인 15,000원 스타벅스 03/31 14:30');
    assert.ok(result, 'parseSMS가 null을 반환함');
    assert.equal(result.amount, 15000, '금액이 15000이 아님');
    assert.ok(result.merchant.includes('스타벅스'), '가맹점에 스타벅스가 없음: ' + result.merchant);
    assert.equal(result.card, '삼성카드 & MILEAGE PLATINUM', '카드명 불일치');
    assert.equal(result.category, 'cafe', '카테고리가 cafe가 아님: ' + result.category);
    assert.equal(result.time, '14:30', '시간 불일치');
  });

  // 4-2: 자동결제
  it('4-2: 자동결제 SMS — 금액, 카테고리가 정확히 파싱된다', () => {
    const result = parseSMS('[삼성카드]1337 자동결제 9,900원 넷플릭스 03/31접수');
    assert.ok(result, 'parseSMS가 null을 반환함');
    assert.equal(result.amount, 9900, '금액이 9900이 아님');
    assert.equal(result.category, 'subscribe', '카테고리가 subscribe가 아님: ' + result.category);
  });

  // 4-3: 해외 결제
  it('4-3: 해외 SMS — 외화 금액이 원화로 환산된다', () => {
    const result = parseSMS('해외승인 250.79 달러 SUPREME 삼성1337 03/31');
    assert.ok(result, 'parseSMS가 null을 반환함');
    // 250.79 * 1350 = 338,566.5 → 반올림
    assert.ok(result.amount >= 330000 && result.amount <= 350000,
      '환산 금액 범위 밖: ' + result.amount);
    assert.equal(result.currency, 'USD', '통화가 USD가 아님');
    assert.equal(result.foreignAmount, 250.79, '외화 금액 불일치');
  });

  // 4-4: 거절/취소 무시
  it('4-4: 거절 또는 취소 문자는 null을 반환한다', () => {
    assert.equal(parseSMS('삼성1337 거절 15,000원 스타벅스'), null, '거절 문자가 null이 아님');
    assert.equal(parseSMS('삼성1337 취소 15,000원 스타벅스'), null, '취소 문자가 null이 아님');
  });

  // ═══ cleanMerchantName ═══

  // 4-5: 매출처명 정제
  it('4-5: cleanMerchantName이 접두어를 정확히 제거한다', () => {
    assert.equal(cleanMerchantName('신한온누리 사러가연희수퍼마켓'), '사러가',
      '사러가 정제 실패');
    assert.equal(cleanMerchantName('USD 22.00 CLAUDE'), 'CLAUDE',
      'USD 금액 접두어 제거 실패');
    assert.equal(cleanMerchantName('1차 민생회복 씨유홍대3호'), '씨유홍대3호',
      '민생회복 접두어 제거 실패');
    assert.equal(cleanMerchantName('또부겠지스마일'), '또보겠지',
      '또보겠지 변형 통합 실패');
  });

  // ═══ autoMatchCategory ═══

  // 4-6: 카테고리 자동 매칭
  it('4-6: autoMatchCategory가 키워드 기반으로 정확한 카테고리를 반환한다', () => {
    assert.equal(autoMatchCategory('스타벅스'), 'cafe', '스타벅스→cafe 실패');
    assert.equal(autoMatchCategory('배달의민족'), 'dining', '배달의민족→dining 실패');
    assert.equal(autoMatchCategory('카카오t일반'), 'transport', '카카오t→transport 실패');
    assert.equal(autoMatchCategory('넷플릭스'), 'subscribe', '넷플릭스→subscribe 실패');
    assert.equal(autoMatchCategory('완전모르는가게'), 'etc', '미매칭→etc 실패');
  });

  // ═══ MERCHANT_TO_BRAND + BRAND_CATEGORY_MAP 연쇄 ═══

  // 4-7: newExpense에서 brand→category 자동 부여
  it('4-7: newExpense가 MERCHANT_TO_BRAND → BRAND_CATEGORY_MAP 연쇄로 category를 부여한다', () => {
    const expense = newExpense({ merchant: '씨유홍대3호', amount: 3000 });
    assert.equal(expense.brand, 'CU', 'brand가 CU가 아님: ' + expense.brand);
    assert.equal(expense.category, 'convenience', 'category가 convenience가 아님: ' + expense.category);
  });

  // 4-7b: 브랜드 매핑 추가 검증
  it('4-7b: 다양한 매출처의 brand→category 연쇄가 정확하다', () => {
    const e1 = newExpense({ merchant: 'CLAUDE.AISUBSCRIPTION', amount: 27000 });
    assert.equal(e1.brand, 'Anthropic', 'Anthropic brand 매핑 실패');
    assert.equal(e1.category, 'subscribe', 'Anthropic→subscribe 실패');

    const e2 = newExpense({ merchant: '교보문고', amount: 15000 });
    assert.equal(e2.brand, '교보문고', '교보문고 brand 매핑 실패');
    assert.equal(e2.category, 'culture', '교보문고→culture 실패');
  });

  // ═══ 사용자 카테고리 학습 ═══

  // 4-8: getMerchantCategoryOverride 우선순위
  it('4-8: 사용자 학습 맵이 하드코딩 규칙보다 우선한다', () => {
    // 스타벅스는 하드코딩으로 cafe지만 사용자가 dining으로 설정
    setMerchantCategoryOverride('스타벅스', 'dining');
    assert.equal(autoMatchCategory('스타벅스'), 'dining',
      '사용자 학습 맵이 우선하지 않음');

    // 학습 맵을 지우면 원래 cafe로 복귀하는지 확인
    var map = getMerchantCategoryMap();
    delete map['스타벅스'];
    saveMerchantCategoryMap(map);
    assert.equal(autoMatchCategory('스타벅스'), 'cafe',
      '학습 맵 제거 후 원래 카테고리 복귀 실패');
  });

  // ═══ 수동 입력 ═══

  // 4-9: newExpense 기본값
  it('4-9: newExpense 기본값이 올바르다 (id, date, source)', () => {
    const expense = newExpense({ amount: 5000 });
    assert.ok(expense.id, 'id가 비어있음');
    assert.equal(expense.amount, 5000, 'amount 불일치');
    assert.equal(expense.date, today(), 'date가 today()가 아님');
    assert.equal(expense.source, 'manual', 'source가 manual이 아님');
    assert.equal(expense.category, 'etc', '기본 category가 etc가 아님');
  });

  // 4-10: updateExpense 사용자 카테고리 보존
  it('4-10: updateExpense에서 사용자가 지정한 category가 brand 자동 부여로 덮어쓰이지 않는다', () => {
    const expense = newExpense({ merchant: '씨유홍대3호', amount: 3000 });
    // brand=CU, category=convenience로 자동 부여됨
    assert.equal(expense.category, 'convenience');

    // 사용자가 카테고리를 food로 변경
    updateExpense(expense.id, { category: 'food' });
    var updated = getExpenses().find(e => e.id === expense.id);
    assert.equal(updated.category, 'food', '사용자 지정 카테고리가 덮어쓰임: ' + updated.category);
  });
});
