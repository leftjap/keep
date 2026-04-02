# Changelog — keep

형식: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## 2026-04-02 (2)

### Changed
- GAS Drive 경로 변경: rootFolder '글방'→'leftjap', '소연의 글방'→'soyoun'. 기준점을 DriveApp.getRootFolder()에서 apps/keep/으로 이동 — Drive 정리에 맞춘 경로 통일. (gas/Code.js)

## 2026-04-02

### Added
- GAS deploy.ps1에 스모크 테스트 추가 — 배포 후 GET 요청으로 정상 응답 확인, 실패 시 exit 1. (gas/deploy.ps1)
- Guard 등록: mergeServerAll 병합 불변 조건 — AGENTS.md 보호 체크리스트 + __tests__/merge-integrity.test.js. (AGENTS.md, __tests__/merge-integrity.test.js)
- merge-integrity.test.js를 tests/ → __tests__/로 이동 — npm test 경로 통일. (AGENTS.md)

### Fixed
- 백업 파일이 잘못된 경로(내 드라이브/leftjap/)에 생성되던 문제 수정 — apps/keep/leftjap/ 기준으로 통일. restoreFromBackup과 경로 정합. [경로.백업경로] (gas/Code.js)

## 2026-03-31

### Added
- **B-57 Phase 2**: 코드/문서 수준 보호 장치 추가
  - style.css: iOS PWA 보호 주석 7개소 삽입 (`B-57 PROTECT` — min-height, position, safe-area-inset-bottom)
  - AGENTS.md: switchTab 패널 상태, iOS PWA CSS, gesture.js 초기화, SMS 동기화, sendBeacon 보호 체크리스트 추가
  - common-rules.md: 변경 금지 CSS 속성·상태 변수 목록 등록

## 2026-03-31 (기존)

### Added
- 매출처-카테고리 사용자 학습 자동 분류 — 사용자가 카테고리를 변경하면 학습 맵(gb_merchant_categories)에 저장, 동일 매출처 재입력 시 자동 적용. 서버 동기화 미포함. (storage.js, data.js, sms-parser.js, ui-expense.js)
- GAS 배포 자동화 스크립트 deploy.ps1 추가 — clasp push + deploy를 한 줄로 실행. (gas/deploy.ps1) (B-63)
- GitHub Actions GAS 자동 배포 workflow — git push → clasp push → clasp deploy 자동 실행. (.github/workflows/deploy-gas.yml) (B-63)
- 테스트 인프라 셋업: Node.js node:test 기반, localStorage 모킹, pre-commit hook으로 커밋 전 자동 테스트 (B-57)
- Golden Path 테스트 영역 1: docs CRUD (newDoc, saveDocs, getDocs 타입 필터링, 빈 상태 동작) (B-57)
- Golden Path 테스트 영역 3: Soft Delete (삭제 플래그, 필터링, 복원, 30일 정리, 영구 삭제 ID 추적) (B-57)
- Golden Path 테스트 영역 4: 가계부 입력 — SMS 파싱(국내/자동결제/해외/거절), cleanMerchantName, autoMatchCategory, brand→category 연쇄, 사용자 학습 우선순위, 수동 입력 기본값, updateExpense 카테고리 보존 (B-57)
- Golden Path 테스트 영역 2: 동기화 병합 — 서버 항목 추가, 최신 우선 갱신, 로컬/서버 삭제 항목 복원 방지(L-05), 빈 로컬 첫 설치, expenses 병합 동일 패턴 (B-57)
- .claude/settings.json: 파일 수정·일반 명령 권한 자동 허용, 위험 명령(rm -rf, Stop-Process 등) 차단 (B-57)
- B-57: 영역 5 — SMS 파서 클라이언트↔서버 동기화 테스트 5건 (sms-parity.test.js)
- B-57: 영역 6 — switchTab 패널 상태 정합성 테스트 6건 (switchtab-state.test.js)
- B-57: 영역 7 — sendBeacon flush 페이로드 보호 테스트 5건 (flush-payload.test.js)

### Fixed
- 가계부 항목 꾹누르기 시 OS 텍스트 선택 겹침 방지 — .exp-tl-item에 user-select: none 적용. (style.css)
- B-57: gas/Code.js BRAND_CATEGORY_MAP·cleanMerchantName을 data.js 기준으로 동기화 — 20+건 카테고리 불일치 해소
- data.js·Code.js MERCHANT_TO_BRAND `또보겠지떡볶이` → `또보겠지` 통일 — BRAND_CATEGORY_MAP 키와 정합성 복원 (data.js, gas/Code.js)

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
