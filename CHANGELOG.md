# Changelog — keep

형식: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## 2026-03-31

### Added
- 매출처-카테고리 사용자 학습 자동 분류 — 사용자가 카테고리를 변경하면 학습 맵(gb_merchant_categories)에 저장, 동일 매출처 재입력 시 자동 적용. 서버 동기화 미포함. (storage.js, data.js, sms-parser.js, ui-expense.js)
- GAS 배포 자동화 스크립트 deploy.ps1 추가 — clasp push + deploy를 한 줄로 실행. (gas/deploy.ps1) (B-63)
- GitHub Actions GAS 자동 배포 workflow — git push → clasp push → clasp deploy 자동 실행. (.github/workflows/deploy-gas.yml) (B-63)
- 테스트 인프라 셋업: Node.js node:test 기반, localStorage 모킹, pre-commit hook으로 커밋 전 자동 테스트 (B-57)
- Golden Path 테스트 영역 1: docs CRUD (newDoc, saveDocs, getDocs 타입 필터링, 빈 상태 동작) (B-57)
- Golden Path 테스트 영역 3: Soft Delete (삭제 플래그, 필터링, 복원, 30일 정리, 영구 삭제 ID 추적) (B-57)
- Golden Path 테스트 영역 4: 가계부 입력 — SMS 파싱(국내/자동결제/해외/거절), cleanMerchantName, autoMatchCategory, brand→category 연쇄, 사용자 학습 우선순위, 수동 입력 기본값, updateExpense 카테고리 보존 (B-57)

### Fixed
- 가계부 항목 꾹누르기 시 OS 텍스트 선택 겹침 방지 — .exp-tl-item에 user-select: none 적용. (style.css)

## 2026-03-30

### Added
- Soft-delete 30일 백업 + sync guard (B-54)
- 휴지통 UI — 복원/영구 삭제 (B-55)
- Sentry 에러 모니터링 도입
- JWT 서명 검증 도입 + 폴백 토큰 제거

### Changed
- 보안 조치: Gemini+CSE 키 삭제, Code.js 데드 코드 제거

### Fixed
- 에디터 제목 입력 시 리스트 미반영 (B-56)
- iOS PWA 제목→본문 탭 시 UI 깨짐 (B-57)
- iOS PWA 초기 로드 시 빈 문서 자동 생성 방지 (B-61)
