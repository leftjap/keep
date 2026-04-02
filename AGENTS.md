<!-- PROJECT: keep -->

# AGENTS.md — keep 프로젝트 작업 가이드

> **공통 규칙**: AI의 응답은 간결한 경어체로 작성합니다.
> 이 문서는 keep 고유 규칙만 담는다. 코드 구조는 소스를 직접 읽어서 확인한다.
> 공통 규칙(트랙 판단, 작업지시서 형식, Claude Code 규칙, 디버깅 프로토콜)은
> https://raw.githubusercontent.com/leftjap/opus/main/common-rules.md 를 따른다.

---

## 0. 파일 업로드 기준

| 작업 유형 | 필요 파일 | 추가 확인 가능 |
|---|---|---|
| CSS만 변경 | style.css | — |
| JS 함수 수정 | 해당 JS | 호출 관계 파일 |
| 새 탭/뷰 추가 | ui.js + 해당 JS + style.css + index.html | data.js |
| 가계부 관련 | ui-expense.js + editor.js | style.css |
| 루틴 관련 | routine.js + routine-cal.js | style.css |
| 데이터 스키마 변경 | storage.js + data.js | sync.js |
| 에디터 기능 | editor.js | ui.js |
| 동기화 관련 | sync.js | data.js |
| 레이아웃/전환 | style.css + ui.js | index.html |
| GAS 서버 수정 | gas/Code.js | sync.js |

style.css는 ~3,000줄. 새 CSS 추가이고 삽입 위치만 특정하면 되는 경우 업로드 불필요. 기존 선택자 충돌 확인 시 업로드 필수.

---

## 1. 파일 구조

```
js/storage.js     — LocalStorage, 날짜 유틸, 상수
js/data.js        — 문서/책/어구/메모/가계부 CRUD, 통계. ⚠️ cleanMerchantName/autoMatchCategory는 sms-parser.js·Code.js와 동일 로직
js/routine.js     — 루틴 데이터 + 사이드바/상세카드
js/routine-cal.js — 루틴 캘린더 뷰
js/sms-parser.js  — 카드 문자 파싱. ⚠️ data.js·Code.js와 동일 로직 유지 필수
js/ui.js          — 탭 전환, 리스트, 팝업, 알림, 파트너 모드, 댓글. ⚠️ switchTab: 에디터 패널 전환 + expense-active 관리
js/ui-expense.js  — 가계부 대시보드/상세/차트. ⚠️ getMerchantIconHtml: brandIcons→merchantIcons→카테고리 폴백
js/editor.js      — 에디터 툴바, 서식, 이미지, 자동저장, 가계부 폼
js/gesture.js     — 제스처 (⛔ 수정 금지)
js/sync.js        — GAS 동기화. ⚠️ mergeServerAll: load_db 1회로 expenses+docs 병합
js/app.js         — 인증, init, 진입점
style.css         — ~3,000줄. 미디어쿼리: ~768 모바일, 769~1400 태블릿, 1401~ PC
index.html        — 에디터 하위 패널: editorText/Book/Quote/Memo/Expense/DayList/RoutineDetail/expenseFullDashboard — 한 번에 하나만 표시
gas/Code.js       — GAS 서버 ~1,600줄. ⚠️ USER_CONFIG 멀티유저. parseSMSServer/autoMatchCategoryServer는 클라이언트와 동일 로직 필수
gas/.clasp.json   — clasp 설정
gas/appsscript.json — GAS 런타임 설정
```

### sync.js ↔ GAS 연결

| sync.js 메서드 | GAS action | GAS 함수 |
|---|---|---|
| save_db | save_db | saveDatabase() |
| load_db | load_db | loadDatabase() |
| save_doc | save_doc | saveDocument() |
| save_routine | save_routine | saveRoutineToSheet() |
| save_quote | save_quote | saveQuoteToSheet() |
| upload_image | upload_image | uploadImageToDrive() |
| save_expense_sms | save_expense_sms | saveExpenseFromSMS() |
| mergeServerExpenses() | load_db | loadDatabase() → expenses 병합 |
| checkNotifications() | check_notifications | checkNotifications() |
| loadPartnerDb() | load_partner_db | loadPartnerDb() |
| postComment() | post_comment | postComment() |
| markRead() | mark_read | markRead() |

---

## 2. keep 고유 주의사항

### 에디터 서브 패널 복원 규칙
switchTab()에서 에디터 패널 display를 변경하면 반드시 else 블록에서 해당 패널을 숨기고 현재 탭에 맞는 패널을 복원해야 한다. 체크: ①진입 시 켠 패널을 else에서 끄는가 ②진입 시 끈 패널을 else에서 복원하는가 ③숨긴 UI를 else에서 복원하는가

### 가계부 탭 뷰 스위처 숨김
gesture.js가 인라인 display:flex를 설정하므로 CSS !important로 대응. switchTab()에서 가계부 진입 시 expense-active 추가, 다른 탭 시 제거.

### SVG 차트
viewBox 비율과 CSS 영역 비율 일치 필수. 미래 날짜 데이터를 maxY에 포함하지 않는다.

### 사이드바 화살표
모든 화살표는 .side-arrow SVG. 패딩 차이로 right 보정 (글쓰기 14px, 루틴/가계부 26px). 8개 화살표 수평 정렬 확인.

### GAS 코드 수정
- parseSMSServer() ↔ parseSMS(): 동일 로직. 한쪽 수정 시 양쪽.
- autoMatchCategoryServer() ↔ autoMatchCategory(): 동일.
- LockService 사용 함수 수정 시 finally lock 해제 확인.

### 멀티유저 보호
USER_CONFIG 개별 설정은 해당 사용자 명시 요청 없이 변경 금지. 체크: ①expenseCategories/routines/tabs 각자 유지 ②새 필드에 기존 사용자 폴백 ③data.js 기본값 변경 시 타 사용자 미노출 ④applyServerConfig() 수정 시 모든 사용자 정상

사용자별 카드: leftjap — 삼성1337. soyoun312 — 현대백화점, 삼성2737, 신한8244, 신한8579, 신한8619.

### 에디터 패널 규칙
editor 안 하위 패널은 한 번에 하나만 표시. 새 패널 추가 시 다른 패널 모두 숨기기 포함.

### 작업 전 체크리스트
- [ ] switchTab else 블록 패널/UI 복원?
- [ ] gesture.js 인라인 스타일을 CSS !important로?
- [ ] .side-arrow right 값과 부모 패딩?
- [ ] SVG viewBox와 CSS 영역 비율?
- [ ] 미디어쿼리 3곳?
- [ ] 캘린더 선택 시 가계부/루틴/모바일/PC 4곳?
- [ ] USER_CONFIG 무단 변경?
- [ ] getMerchantIconHtml에 category, brand?

---

## B-57 추가 보호 체크리스트

#### switchTab 패널 상태
- `switchTab()` 호출 후 `.editor-panel` 중 `display:block` 또는 `display:flex`인 요소는 반드시 **1개**여야 한다.
- 탭 전환 시 `.expense-active` 클래스가 남아 있으면 안 된다 (expense → 다른 탭).
- `#dashboard`는 탭 전환 시 반드시 `display:none`으로 복원되어야 한다.

#### iOS PWA CSS (style.css)
- `editor-content-wrap`의 `min-height` 삭제 금지 — iPhone 홈화면 앱에서 빈 화면 발생.
- `#ed-topbar`의 `position`/`top` 수정 시 iOS safe-area-inset-top 확인 필수.
- `safe-area-inset-bottom` 관련 padding 삭제 금지.
- 위 속성에는 `B-57 PROTECT` 주석이 존재해야 한다.

#### gesture.js 상태 초기화 조건
- `touchend`/`pointerup` 핸들러 종료 시 아래 변수가 반드시 초기값으로 복원되어야 한다:
  - `_gestureActive = false`
  - `swiping = false`
  - `swipeDir = null`
  - `decided = false`
- B→A 스와이프(오른쪽→왼쪽 복귀)에서 사이드바가 열리면 안 된다.
- inline `style.display` 잔류 금지 — 항상 `element.style.display = ''`로 초기화.

#### SMS 파서 동기화
- `data.js`의 `MERCHANT_TO_BRAND`, `BRAND_CATEGORY_MAP`, `cleanMerchantName` 수정 시 반드시 `gas/Code.js`도 동일하게 수정.
- `sms-parity.test.js`가 이를 자동 검증하므로 `npm test` 통과가 필수.

#### sendBeacon 페이로드
- `_flushBeforeUnload`에서 sendBeacon 페이로드는 64 KB를 초과할 수 없다.
- DB 로딩 중(`SYNC.dbLoading === true`)이면 sendBeacon을 호출하지 않는다.
- `flush-payload.test.js`가 이를 자동 검증.

#### 🛡️ Guard: mergeServerAll 병합 불변 조건
- 불변 조건:
  - 로컬에만 있는 항목은 삭제되지 않음.
  - 서버에만 있는 항목은 `_deleted`가 아니면 로컬에 추가됨.
  - 양쪽 모두 있고 서버가 최신(updated 비교)이면 서버 버전으로 갱신.
  - 로컬에서 `_deleted: true`인 항목은 서버 데이터로 복원하지 않음.
  - 서버의 `_deleted` 항목은 로컬에 추가하지 않음.
- 테스트: `tests/merge-integrity.test.js` (`npm test`로 자동 실행)

---

## 3. 동기화 호출 규칙

- 삭제: SYNC.scheduleDatabaseSave()
- 자동저장: 800ms → 로컬 → 3초 DB → 5초 문서
- 루틴: 1.2초 디바운스 → saveChecksToSheet + scheduleDatabaseSave
- 가계부: saveExpenseForm 내 scheduleDatabaseSave
- SMS 자동: visibilitychange(visible) → mergeServerExpenses

### SMS 파이프라인
iOS 단축어 → GAS POST (action: save_expense_sms, token: nametag2026, smsText: SMS원문) → saveExpenseFromSMS → 시트 저장 → keep visibilitychange → mergeServerExpenses.
트리거: "승인" + "자동결제" 포함 메시지.

### 이벤트 핸들러
- 동적 생성 요소: HTML onclick 인라인
- 고정 요소: init()에서 addEventListener
- 전역 이벤트: 해당 JS 하단에서 document.addEventListener

---

## 4. 영향 범위 분석

시뮬레이션: ①영향 받는 전역 변수 ②그 변수를 읽는 다른 함수 ③switchTab/renderListPanel/loadDoc 정상 동작 ④모바일/태블릿/PC 3환경 동일 여부

고위험: switchTab(), renderListPanel(), setMobileView(), setupAutoSave(), init()
중위험: renderExpenseDashboard(), showRoutineCalendarView(), loadDoc/Book/Memo/Quote(), generateItemHtml()

---

## 5. 가계부/매출처 운영

- importCardSmsSheet 후 미래 날짜 확인. fixFutureExpenses(email).
- reclassifyAllExpenses는 brandOverrides 건너뜀.
- manual 항목 전체 삭제 시 복구 불가.
- 카테고리 수정은 BRAND_CATEGORY_MAP 등록 후 코드 적용.
- cleanMerchantName 새 패턴 시 data.js + Code.js 양쪽 추가.

---

## 6. 소스 참조

| 항목 | 값 |
|---|---|
| 배포 URL | https://leftjap.github.io/keep/ |
| GitHub raw base | https://raw.githubusercontent.com/leftjap/keep/main/ |

크롤링 제외 (항상 업로드): style.css (~3,000줄), gas/Code.js (~1,600줄), js/ui.js (크롤러 잘림 확인 2026-03-28), js/data.js (크롤러 잘림 확인 2026-03-28), js/ui-expense.js (크롤러 잘림 확인 2026-03-30), js/gesture.js (크롤러 잘림 확인 2026-03-30)
