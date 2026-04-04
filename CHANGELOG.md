# Changelog — keep

형식: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## 2026-04-04

### Fixed
- 파트너 모드에서 가계부 탭 경유 후 글쓰기 탭 전환 시 가계부 UI(캘린더·지출 요약) 잔류 수정 — switchTab 파트너 모드 else 블록에서 expense 관련 DOM/클래스 정리 누락 [UI.패널상태] (js/ui.js)
- 알림 시간이 게시물 작성 시간 대신 마지막 저장 시간으로 표시되던 문제 수정 — checkNotifications에서 new_post 알림의 created를 문서의 실제 created로 보정. [소셜.알림시각] (gas/Code.js)
- 가계부 롱프레스 시 플로팅 팝업이 불필요하게 닫히는 문제 수정 — overlay 정상화로 별도 닫기 불필요, showExpensePopup의 closeExpenseFloatingPopup 제거. [UI.팝업잔류] (js/ui-expense.js)
- 가계부 타임라인 롱프레스/우클릭 메뉴가 즉시 닫히는 버그 수정 — overlay 즉시 open 시 같은 이벤트 시퀀스의 후속 click이 overlay onclick을 발동. showContextMenuAt과 동일하게 setTimeout으로 open 지연. [UI.팝업잔류] (js/ui-expense.js)
- 파트너 모드 topbar('내 공간으로 돌아가기')가 기존 UI를 밀어내던 문제 수정 — padding-top 제거, position:fixed 오버레이만으로 기존 UI 위에 겹침. [UI.파트너모드] (style.css)
- 파트너 가계부 진입 후 퇴장 시 UI 혼재 수정 — exitPartnerMode에서 expense-active·list-closed·tablet-list-closed·expense-edit-active 클래스 및 대시보드/상세 패널 display 정리. [UI.파트너모드] (js/ui.js)
- 가계부 지출 내역 꾹누르기 삭제/수정 팝업이 화면 전환 후에도 잔류하던 문제 수정 — setMobileView·switchTab 진입 시 closeLpPopup·closeExpenseFloatingPopup 호출. [UI.팝업잔류] (js/ui.js)
- 알림 목록 시간 정보가 게시 시각과 불일치하던 문제 수정 — _notifyNaviPost에서 기존 알림 갱신 시 created(최초 게시 시각)를 덮어쓰지 않고 updated 필드로 분리. 정렬 기준도 updated 우선으로 변경. [소셜.알림시각] (gas/Code.js)
- 로딩 중 콘텐츠가 서버에서 로딩되지 않던 문제 수정 — 서버 동기화 타임아웃 4초→8초(서버 응답 5초 수용). 타임아웃 후 뒤늦은 응답 도착 시 에디터 문서 재로드 제거(content shift 방지). [로직.초기화순서] (app.js)
- 대량 삭제 후 서버 saveDatabase 반복 실패 교착 상태 수정 — loadDatabase가 _deleted 항목을 localStorage에서 제거하여 _deletedIds가 빈 배열로 전송됨. 서버 급감 검증도 _deleted 포함 전체 건수 기준이라 정상 저장 차단. [연동.삭제동기화] (js/sync.js, js/data.js, gas/Code.js)
- mergeServerExpenses에서 _deleted 항목이 필터링되어 expenses 삭제 후 saveDatabase 교착 가능성 수정 — loadDatabase·mergeServerDocs와 동일하게 _deleted 보존 방식으로 통일. [연동.삭제동기화] (js/sync.js)
- 가계부 탭 경유 후 휴지통 진입 시 list-panel이 접힌 상태로 남아 휴지통 UI 미표시 수정 — enterTrashMode에서 expense-active·list-closed·tablet-list-closed 클래스 및 edToolbar 상태를 정리. [UI.패널상태] (js/ui.js)
- 가계부 플로팅 팝업에서 지출 항목 우클릭/꾹누르기 시 수정/삭제 메뉴가 바깥 클릭으로 닫히지 않는 버그 수정 — expFloatingPopupOverlay(z-index 9800)가 lpPopupOverlay(z-index 998)를 가려 dismiss 이벤트 차단. showExpensePopup 시작에서 플로팅 팝업을 닫아 해결 [UI.z-index차단] (js/ui-expense.js)

## 2026-04-03

### Changed
- 동기화 전략을 merge에서 server-wins(단순 교체)로 전환 — 서버 JSON을 source of truth로 확립. 2인 상시 온라인 환경에서 병합 복잡도가 동기화 문제를 반복 유발하여 제거. (js/sync.js)

### Fixed
- PWA에서 삭제한 글이 반영되지 않는 문제 수정 — 기존 병합 로직의 "로컬에만 있는 항목 보존"이 서버 삭제를 무효화함. server-wins로 근본 해결. [상태.병합보존] (js/sync.js)
- saveDatabase 재시도 한도 초과 시 _unsyncedLocal 플래그가 false로 리셋되어 미동기화 변경이 서버 데이터로 덮어써질 수 있던 문제 수정. [상태.플래그리셋] (js/sync.js)
- 앱에서 문서 삭제 시 Drive 구글문서를 휴지통으로 이동 — delDoc/delBook/delMemo에서 driveId가 있으면 GAS trash_doc 호출. 실패 시 앱 삭제는 정상 진행 (gas/Code.js, js/sync.js, js/data.js)
- saveDatabase 검증 2/3/4가 _deletedIds를 고려하지 않아 정당한 삭제 시 서버 저장 차단 — _deletedIds 중 서버에 실존하는 ID를 검증하여 설명 가능한 감소분 허용. [로직.급감오판] (gas/Code.js)
- 로컬 백업 스크립트 인증 실패 — `$TOKEN`이 `nametag2026`이나 GAS Script Properties의 `SMS_SERVICE_TOKEN`은 `keep-sms-2026`으로 불일치. 토큰 갱신 + 작업 스케줄러 등록. [설정.토큰불일치] (backup-keep-db.ps1)
- CSS Guard K-2 테스트 실패 수정 — `#ed-topbar`(ID)를 `.ed-topbar`(클래스)로 변경. style.css는 클래스 셀렉터만 사용. [설정.셀렉터불일치] (__tests__/css-guard.test.js)

### Added
- loadDatabase의 expenses 교체에도 급감 가드 추가 — docs/books/quotes/memos와 동일한 보호 수준 적용. (js/sync.js)
- loadDatabase·mergeServerDocs·mergeServerExpenses에 급감 가드 추가 — 서버 데이터가 비정상(0건)일 때 로컬 교체를 차단. (js/sync.js)
- mergeServerAll에 _dbSaveQueued 가드 추가 — 편집 후 빠른 백그라운드/포그라운드 전환 시 race condition 방지. (js/sync.js)
- sync.js server-wins 불변 조건 소스 주석(🛡️) 추가 — loadDatabase, mergeServerDocs, mergeServerExpenses, mergeServerAll 4곳. (js/sync.js)
- GAS 에디터의 디버깅/복구 유틸 함수를 Code.js에 병합 — cleanForeignExpenses, checkBackupExpenses, checkSoyounExpenses 등. GAS ↔ 로컬 동기화 (gas/Code.js)

### Changed (기존)
- 백업 파일 저장 경로를 backups/ 폴더로 분리 — `apps/keep/{user}/` → `backups/keep/{user}/`. 운영 DB 경로는 유지. (gas/Code.js)

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
