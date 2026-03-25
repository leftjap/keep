# AGENTS.md — keep 프로젝트 작업 가이드

> **공통 규칙**: AI의 응답은 간결한 경어체로 작성합니다.
> 이 문서는 규칙만 담는다. 함수 목록, 호출 체인, 데이터 스키마는 소스 코드를 직접 읽어서 확인한다.

## 이 문서의 용도

이 문서는 AI가 코드 수정 요청을 받았을 때 따라야 하는 규칙이다.
코드 구조(함수 목록, 전역 변수, 호출 체인, 데이터 스키마)는 이 문서에 기재하지 않는다.
AI는 작업에 필요한 코드 구조를 GitHub raw URL 또는 사용자 업로드 파일에서 직접 확인한다.

**작업 흐름 요약**

1. 사용자가 이 문서를 업로드하고 수정 요청을 보낸다.
2. AI는 이 문서를 읽고 요청을 분석한다.
3. AI는 파일 구조(7번)에서 관련 파일을 특정한 뒤, GitHub raw URL로 소스를 직접 읽어 함수/변수를 확인한다. 크롤링 불가 파일(17번)은 사용자에게 업로드를 요청한다.
4. AI는 방향 확인서 또는 작업지시서를 출력한다.
5. 사용자가 작업지시서를 VS Code 에이전트에 복사해서 실행한다.

---

## 0. 작업 흐름

### 트랙 A — 즉시 진행

조건 (모두 충족): 요청이 명확 / 해법이 하나 / 영향 범위 좁음 (1~2개 파일, 고위험 함수 미포함)
→ 영향 범위 분석(13번) 후 바로 작업지시서 출력.

### 트랙 B — 방향 확인 후 진행

조건 (하나라도 해당): 해법 여러 개 / 요청 모호 / 영향 범위 넓음 (3개+ 파일, 고위험 함수) / 기존 동작 변경 가능
→ 방향 확인서 출력 → 사용자 승인 → 작업지시서 출력. 승인 후 재확인하지 않는다.

### 판단 규칙
- 트랙 A면 `[트랙 A]`, 트랙 B면 `[트랙 B]` 표기
- 애매하면 트랙 B
- 사용자가 "바로 만들어" 등 명시하면 트랙 A로 전환

### 방향 확인서 형식

```
## 방향 확인: [요청 요약]

### 요청 이해
- [1~3문장]

### 원인 분석 (버그 수정 시)
- [어디서 어떤 값이 적용되어 이런 결과가 나오는지]

### 해결 방향
- [어떤 파일의 어떤 함수를 어떻게 바꿀 것인지]

### 영향 범위
- [영향 받는 전역 변수, 함수, 플랫폼별 차이]

### 관련 기존 규칙
- [참조할 규칙 번호. 없으면 "없음"]

### 대안 (있을 경우)
- [장단점과 함께]
```

### 파일 업로드 요청 기준

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

### style.css 업로드 전략
style.css는 ~3,000줄로 크다. 새 CSS 추가이고 삽입 위치만 특정하면 되는 경우 업로드 불필요. 기존 선택자 충돌/중복 확인이 필요하면 업로드 필수.

---

## 1. 작업 유형 판별

**기능 추가** — 새 기능. 기존 구조 불변.
**버그 수정** — 의도대로 동작하지 않는 것을 고침. 범위 밖 불변.
**정리(리팩토링)** — 동작 불변, 구조만 개선.

---

## 2. 작업지시서 출력 규칙

### 형식

```
⚠️ 모든 Step을 빠짐없이 순서대로 실행하세요. 특히 마지막 커밋 & 푸시 Step을 절대 생략하지 마세요.

## 프로젝트 경로 (모든 Step에서 이 절대 경로를 사용하세요)
- 메인 프로젝트: C:\dev\apps\keep\
- GAS 프로젝트: C:\dev\apps\keep\gas\

모든 파일은 이미 존재합니다. 새로 만들지 마세요.

## 작업지시서: [기능명 또는 수정 대상]
작업 유형: [기능 추가 / 버그 수정 / 정리]

### 영향 범위 분석
- 영향 받는 전역 변수: [목록]
- 영향 받는 함수: [목록]
- 고위험 함수 수정 여부: [있음/없음]
- switchTab/renderListPanel/loadDoc 영향: [있음/없음]
- 플랫폼별 차이: [모바일/태블릿/PC]

### Step 1
- 파일: [절대 경로]
- 위치: [함수명]
- 작업: [구체적 코드 포함]
- 영향 받는 함수: [목록]
- 완료 확인: [상태]

(Step 반복)

### Step N-1 — playbook.md 갱신 (해당 시)
- 파일: C:\dev\playbook\playbook.md
- 커밋: cd "C:\dev\playbook" → git add/commit/push

### Step N — 커밋 & 푸시
  cd "C:\dev\apps\keep"
  git add .
  git commit -m "[타입]: [요약]"
  git push origin main

⛔ 여기서 작업을 종료하세요.

### 최종 확인
- 모바일(768px 이하): [확인]
- 태블릿(769~1400px): [확인]
- PC(1401px 이상): [확인]
```

### Haiku를 위한 규칙

- 한 Step에 한 파일, 한 가지 변경.
- **함수 수정 시 함수 전체를 교체 코드로 제공.** 부분 스니펫 비교 금지.
- CSS 수정 시 선택자 블록 전체 제공.
- 모든 파일 경로는 절대 경로 (`C:\dev\apps\keep\js\ui.js`).
- "적절히", "비슷하게" 등 모호한 표현 금지.
- 기존 함수 수정 시 함수명과 현재 동작을 명시.
- gesture.js는 어떤 Step에서도 포함하지 않는다.
- 동일 증상에 대해 fix/style 커밋 3회 연속 실패 시 작업을 즉시 중단하고, 시도 내역·실패 원인·다음 시도 방향을 정리하여 사용자에게 보고한다. 무한 반복 커밋 금지.

### AGENTS.md 갱신 규칙

이 문서에는 코드 구조(함수 목록, 전역 변수, 호출 체인, 스키마)를 기재하지 않으므로, 코드 변경에 따른 갱신은 원칙적으로 불필요하다.

**갱신이 필요한 경우:**
- 새 파일 추가 시 → 7번(파일 구조)에 추가
- 8번(주의사항), 13번(영향 범위)의 고위험/중위험 함수 목록 변경 시
- 운영 규칙 자체가 변경될 때

### 커밋 & 푸시 규칙

모든 작업지시서의 마지막 Step에 커밋+푸시. 커밋 메시지: `[타입]: [요약]` (feat/fix/chore/refactor).

### playbook.md 갱신 규칙

모든 작업지시서의 커밋 & 푸시 Step 직전에 playbook.md 갱신 Step을 포함한다. 이 규칙은 절대 생략하지 않는다.

- 파일: `C:\dev\playbook\playbook.md`
- 크롤링 경로: `https://raw.githubusercontent.com/leftjap/playbook/main/playbook.md`
- 갱신 불필요: CSS만 변경, 오타 수정 등 백로그 외 사소한 수정

### GAS 배포 규칙

Code.js 수정 시 반드시 `clasp push` Step + 웹앱 재배포 안내를 포함한다.
GAS 배포 성공 후 Git 커밋. GAS 실패 시 클라이언트 코드도 푸시하지 않는다.
`clasp push` 후 웹앱 재배포는 항상 필요 (GAS 편집기에서 사용자 수동 실행).

### AI 응답 규칙

- 작업 규모를 부풀리지 않는다. 한 번에 할 수 있으면 묻지 않고 한 번에 한다.
- 선택지를 나열하는 것으로 끝내지 않는다. 추천 + 근거를 붙인다.
- 확신 수준: "확실합니다" / "높은 확률이지만 검증 필요" / "추측입니다".
- 검증 강도 "강화" 이상에서는 코드에 문제가 있다고 가정하고 찾는다.

### 파일 내용 일괄 치환

사용: VS Code Ctrl+H / PowerShell `(Get-Content) -replace`
금지: sed, tr 등 Unix 도구
PowerShell 치환 시 `[regex]::Escape()` 필수.

---

## 3. 기능 추가 시 규칙

- 새 탭/뷰는 가계부(expense) 탭 패턴 참조: `switchTab` → pane 표시/숨김 → 렌더 함수.
- 플랫폼 분기는 매개변수로 처리: `renderExpenseDashboard('pc'|'mobile')` 패턴.
- 새 함수 전에 기존 함수 재사용 가능 여부 확인.
- 새 CSS 추가 시 같은 선택자 존재 여부 먼저 검색. `!important` 금지.
- 미디어쿼리 모바일/태블릿/PC 3곳 모두 확인.

---

## 4. 버그 수정 시 규칙

- 수정 전에 원인을 먼저 설명.
- 새 규칙 덮어쓰기 금지. 잘못된 선언을 직접 수정.

---

## 5. 정리(리팩토링) 시 규칙

- 전후 동작 동일. 파일 하나씩 진행.

---

## 6. 수정 금지 파일

`gesture.js` — 어떤 작업에서도 수정 Step을 만들지 않는다.

---

## 7. 파일 구조

```
js/storage.js     — LocalStorage, 날짜 유틸, 상수, 모의 데이터
js/data.js        — 문서/책/어구/메모/가계부 CRUD, 통계. ⚠️ cleanMerchantName/autoMatchCategory는 sms-parser.js·Code.js와 동일 로직 — 한쪽 수정 시 양쪽 필수
js/routine.js     — 루틴 데이터 + 사이드바/상세카드 렌더링
js/routine-cal.js — 루틴 캘린더 뷰 (에디터 3단)
js/sms-parser.js  — 카드 문자 파싱, 카테고리 매칭. ⚠️ data.js·Code.js와 동일 로직 유지 필수
js/ui.js          — 탭 전환, 리스트/사진/캘린더 렌더링, 팝업, 알림, 파트너 모드, 댓글. ⚠️ switchTab: 에디터 패널 전환 + expense-active 클래스 관리
js/ui-expense.js  — 가계부 대시보드/상세/차트/타임라인/연간 누적/폼/브랜드 편집. ⚠️ getMerchantIconHtml: brandIcons→merchantIcons→카테고리 폴백. _yearlyEndYM 전역 참조
js/editor.js      — 에디터 툴바, 서식, 이미지, 자동저장, 가계부 폼. ⚠️ _editorDirty/_unsyncedLocal: 멀티 디바이스 동기화 판단용
js/gesture.js     — 제스처 (수정 금지). CSS 클래스: view-side, view-list, view-editor, tablet-side-open, tablet-list-closed, sidebar-closed, list-closed
js/sync.js        — GAS 동기화 (DB/문서/이미지/루틴/어구, SMS 병합, 소셜). ⚠️ mergeServerAll: load_db 1회로 expenses+docs 병합
js/app.js         — 인증, init, 진입점
style.css         — 전체 스타일 (~3,000줄). 미디어쿼리: ~768 모바일, 769~1400 태블릿, 1401~ PC
index.html        — DOM 구조. 에디터 하위 패널: editorText/Book/Quote/Memo/Expense/DayList/RoutineDetail/expenseFullDashboard — 한 번에 하나만 표시

gas/Code.js       — GAS 서버 (~1,600줄). ⚠️ USER_CONFIG: 멀티유저 설정. parseSMSServer/autoMatchCategoryServer는 클라이언트와 동일 로직 필수. LockService 사용 함수 수정 시 finally 확인. clasp push 후 반드시 웹앱 재배포
gas/.clasp.json   — clasp 프로젝트 설정
gas/appsscript.json — GAS 런타임 설정
```

### sync.js ↔ GAS 연결

| sync.js 메서드 | GAS action | GAS 함수 |
|---|---|---|
| `SYNC._post({action:'save_db'})` | save_db | `saveDatabase()` |
| `SYNC._post({action:'load_db'})` | load_db | `loadDatabase()` |
| `SYNC._post({action:'save_doc'})` | save_doc | `saveDocument()` |
| `SYNC._post({action:'save_routine'})` | save_routine | `saveRoutineToSheet()` |
| `SYNC._post({action:'save_quote'})` | save_quote | `saveQuoteToSheet()` |
| `SYNC._post({action:'upload_image'})` | upload_image | `uploadImageToDrive()` |
| `SYNC._post({action:'save_expense_sms'})` | save_expense_sms | `saveExpenseFromSMS()` |
| `SYNC.mergeServerExpenses()` | load_db | `loadDatabase()` → expenses 병합 |
| `SYNC.checkNotifications()` | check_notifications | `checkNotifications()` |
| `SYNC.loadPartnerDb()` | load_partner_db | `loadPartnerDb()` |
| `SYNC.postComment()` | post_comment | `postComment()` |
| `SYNC.markRead()` | mark_read | `markRead()` |

---

## 8. 작업지시서 작성 시 주의사항

### 변경 최소화
요청 범위만 수정. "이왕 하는 김에" 금지.

### 기존 코드 스타일 유지
더 나은 스타일이 있어도 기존 방식을 따른다.

### 에디터 서브 패널 복원 규칙

`switchTab()`에서 에디터 패널 display를 변경하면, **반드시 else 블록에서 해당 패널을 숨기고 현재 탭에 맞는 패널을 복원**해야 한다. `loadDoc`/`loadBook` 등은 패널 전환을 하지 않으므로 `switchTab`의 else 블록이 유일한 복원 지점.

체크리스트:
1. 진입 시 켠 패널을 else에서 끄는가?
2. 진입 시 끈 패널을 else에서 복원하는가?
3. 숨긴 UI(toolbar, Aa, FAB 등)를 else에서 복원하는가?

### 가계부 탭 뷰 스위처 숨김 규칙

gesture.js가 인라인 `display: flex`를 설정하므로 CSS `!important`로 대응:
`.list-panel.expense-active .view-switcher { display: none !important; }`
`switchTab()`에서 가계부 진입 시 `expense-active` 추가, 다른 탭 시 제거.

체크리스트:
1. `expense-active` 추가/제거 유지?
2. CSS `!important` 규칙 삭제/덮어쓰기 없음?
3. 다른 탭 전환 시 `expense-active` 정상 제거?

### SVG 차트 주의
- viewBox 비율과 CSS 렌더링 영역 비율 일치 필수.
- 미래 날짜 데이터를 maxY에 포함하지 않는다.

### 사이드바 화살표(›) 규칙
모든 화살표는 `.side-arrow` SVG 클래스 통일. `.side-nav` 패딩 차이로 right 값 보정 필요 (글쓰기: 14px, 루틴/가계부: 26px). 사이드바 항목 수정 시 8개 화살표 전체 수평 정렬 확인.

### GAS 코드 수정 주의
- `parseSMSServer()` ↔ `parseSMS()`: 동일 로직. 한쪽 수정 시 양쪽.
- `autoMatchCategoryServer()` ↔ `autoMatchCategory()`: 동일 로직. 한쪽 수정 시 양쪽.
- `LockService` 사용 함수 수정 시 `finally` 블록 lock 해제 확인.
- `clasp push` 후 반드시 웹앱 재배포 (GAS 편집기에서 수동).
- Code.js는 Git 관리 대상 (`gas/` 폴더).

### 멀티유저 보호 규칙

`USER_CONFIG`의 개별 사용자 설정은 해당 사용자의 명시적 요청 없이 변경하지 않는다.

체크리스트:
1. 모든 사용자의 expenseCategories/routines/tabs가 각자 유지?
2. 새 필드에 기존 사용자용 폴백?
3. data.js 기본값 변경 시 다른 사용자에게 노출 안 됨?
4. applyServerConfig() 수정 시 모든 사용자 config 정상 적용?

사용자별 설정:

| 항목 | leftjap | soyoun312 |
|---|---|---|
| 탭 | navi, fiction, blog, book, quote, memo, expense | soyoun_navi, flight_diary, soyoun_blog, book, expense |
| 루틴 | 7개 (운동~금주) | 4개 (운동~글쓰기) |
| 카테고리 | 12개 (food~etc) | 12개 (dining~etc, 별도 구성) |

사용자별 카드:

| 사용자 | 카드 | cardNameMap 키 | 카드 정식명 |
|---|---|---|---|
| leftjap | 삼성 신용 | '삼성1337' | 삼성카드 & MILEAGE PLATINUM |
| soyoun312 | 현대백화점카드 | cardPatterns 매칭 | 현대백화점카드 |
| soyoun312 | 삼성 신용 | '삼성2737' | 삼성카드 iD SIMPLE |
| soyoun312 | 신한 신용 (Air) | '신한8244' | 신한카드 Air |
| soyoun312 | 신한 체크 (현재) | '신한8579' | K-패스 신한카드 체크 |
| soyoun312 | 신한 체크 (만료) | '신한8619' | K-패스 신한카드 체크 |

### 사이드바 디자인 보호 규칙

고정 요소: `.quote-section`, `.badge-pill`, 가계부 금액 — 3플랫폼 모두 표시.
숨김 요소: 글쓰기/가계부 화살표, 섹션 구분선 — 3플랫폼 모두 `display:none`.
유지: 루틴 화살표 — 3플랫폼 표시. 모바일 right:20px, PC·태블릿 right:28px.

체크리스트:
1. renderWritingGrid()가 .badge-pill 생성?
2. .quote-section이 3플랫폼 display:block?
3. 글쓰기/가계부 화살표 3플랫폼 display:none?
4. 루틴 화살표 right 값 맞음?

---

## 9. 코드 비대화 방지

- 렌더 함수 80줄 초과 시 하위 함수 분리.
- 동일 로직 모바일/PC 함수는 `platform` 매개변수로 통합.
- 새 기능 전에 유사 기존 함수 확인.
- 새 CSS 전에 기존 클래스 재사용 가능 여부 확인.

---

## 10. 에디터 패널 규칙

editor 안에 하위 패널이 있다. 한 번에 하나만 표시:
editorText, editorBook, editorQuote, editorMemo, editorExpense, editorDayList, editorRoutineDetail, expenseFullDashboard.
새 패널 추가 시 다른 패널 모두 숨기는 코드 포함.

---

## 11. 동기화 호출 규칙

데이터 변경 후 반드시 동기화:
- 삭제: `SYNC.scheduleDatabaseSave()`
- 자동저장: 800ms → 로컬 → 3초 DB → 5초 문서
- 루틴: 1.2초 디바운스 → `SYNC.saveChecksToSheet()` + `scheduleDatabaseSave()`
- 가계부: `saveExpenseForm` 내에서 `SYNC.scheduleDatabaseSave()`
- SMS 자동: `visibilitychange(visible)` → `SYNC.mergeServerExpenses()`

---

## 12. 이벤트 핸들러 규칙

- 동적 생성 요소: HTML onclick 인라인
- 고정 요소: `init()`에서 addEventListener
- 전역 이벤트: 해당 JS 하단에서 document.addEventListener

---

## 13. 영향 범위 분석 규칙

### 변경 전 시뮬레이션 질문
1. 영향 받는 전역 변수는?
2. 그 변수를 읽는 다른 함수는?
3. switchTab, renderListPanel, loadDoc이 기존대로 동작하는가?
4. 모바일/태블릿/PC 세 환경 모두 영향이 같은가?

### 고위험 함수 (수정 시 전체 테스트)
`switchTab()`, `renderListPanel()`, `setMobileView()`, `setupAutoSave()`, `init()`

### 중위험 함수 (해당 기능 테스트)
`renderExpenseDashboard()`, `showRoutineCalendarView()`, `loadDoc/Book/Memo/Quote()`, `generateItemHtml()`

---

## 14. 실수 체크리스트

- [ ] switchTab else 블록에서 패널/UI 복원 빠뜨림?
- [ ] gesture.js 인라인 스타일을 CSS !important 없이 제어?
- [ ] .side-arrow right 값이 부모 패딩과 맞는가?
- [ ] SVG viewBox 비율과 CSS 영역 비율 일치?
- [ ] 미디어쿼리 3곳 모두 확인?
- [ ] 캘린더 선택 효과 수정 시 가계부/루틴/모바일/PC 4곳 확인?
- [ ] renderWritingGrid()에서 .badge-pill 생성?
- [ ] .quote-section이 3플랫폼 display:block?
- [ ] USER_CONFIG 개별 설정 무단 변경 없음?
- [ ] data.js 기본값 변경 시 다른 사용자 영향?
- [ ] applyServerConfig() 수정 시 모든 사용자 config 정상?
- [ ] getMerchantIconHtml에 category, brand 필드 포함?

---

## 15. 가계부/매출처 운영 주의사항

- `importCardSmsSheet` 실행 후 반드시 미래 날짜 확인. `fixFutureExpenses(email)`.
- `reclassifyAllExpenses`는 brandOverrides 건너뜀. date/amount/merchant 불변.
- manual 항목(사용자 수동 입력)은 전체 삭제 시 복구 불가. 재import 시 Gemini 재분류 + BRAND-MAPPING.md 수동 정제 재적용 필요.
- 카테고리 수동 수정은 콘솔에서 하지 않는다. `BRAND_CATEGORY_MAP`에 등록 후 코드로 적용.
- 새 브랜드 추가 시 `BRAND_CATEGORY_MAP`과 `BRAND-MAPPING.md` 동시 갱신.
- `cleanMerchantName()` 새 패턴 발견 시 data.js와 Code.js 양쪽 추가.
- 아이콘 URL은 hotlink 차단 없는 도메인 사용.

---

## 16. 디버깅 프로토콜

### 1단계 — AI 자체 해결 (사용자 개입 0)
파일 구조(7번)에서 관련 파일 특정 → GitHub raw URL로 소스 직접 읽기 → 가설 수립 → 수정 코드 특정 → 작업지시서 출력.

### 2단계 — 1회 요청 (사용자 개입 1회)
조건: 런타임 상태(LocalStorage, DOM, 네트워크)를 알 수 없을 때.
규칙: 콘솔 명령어를 한 번에 전부 제시. 예상 결과 포함. "추가로 확인하겠습니다" 금지.

### 3단계 — 브라우저 조작 (최후 수단)

### 요청 규칙
- 소스코드로 먼저 추론. 추론으로 특정되면 스크린샷/콘솔 없이 작업지시서 출력.
- 콘솔 요청 금지: 함수 존재 여부, CSS 선택자, HTML 구조, 전역 변수 선언, 코드 로직.
- 콘솔 필요: LocalStorage 실제 데이터, 런타임 변수 값, computed style, JS 에러, 네트워크 결과.

### 증상 → 의심 파일

| 증상 | 의심 파일 |
|---|---|
| 탭 전환 후 화면 깨짐 | ui.js (switchTab) |
| 가계부 대시보드 빈 화면 | ui-expense.js + data.js |
| 가계부 폼 저장 안 됨 | ui-expense.js + editor.js |
| 가계부 뷰 스위처 노출 | style.css (.expense-active) + ui.js |
| 루틴 체크 안 됨 | routine.js |
| 에디터 자동저장 안 됨 | editor.js |
| SMS 자동 반영 안 됨 | sync.js + gas/Code.js |
| 브랜드 아이콘 안 나옴 | ui-expense.js + data.js |
| 매출처명 정제 안 됨 | data.js + gas/Code.js |

---

## 17. 소스 참조 프로토콜

### 경로

| 항목 | 값 |
|---|---|
| 배포 URL | `https://leftjap.github.io/keep/` |
| GitHub raw base | `https://raw.githubusercontent.com/leftjap/keep/main/` |

### 참조 우선순위
1순위 — 사용자 업로드 파일 (push 안 한 변경분 우선)
2순위 — GitHub raw URL 크롤링
3순위 — 사용자에게 업로드 요청 (1, 2 불가 시에만)

### 크롤링 규칙
- 4개 이하: 사용자에게 묻지 않고 크롤링
- 5개 이상: 안내 + 동시에 크롤링 시작
- 한 세션 최대 4파일 (압축 방지)

### 크롤링 제외 파일 (항상 업로드 요청)
- `style.css` (~3,000줄)
- `gas/Code.js` (~1,600줄)

### 혼합 참조 주의
- 직전 작업지시서가 수정한 파일은 크롤링 대신 업로드 요청
- 파일이 잘렸으면 (닫는 괄호 없음, 예상 함수 미발견) 업로드 요청

### 컨텍스트 압축 발생 시
- 사용자에게 알림 + 재업로드 요청
- 기억 의존 금지, GitHub raw로 재확인
