

```markdown
# WORKFLOW.md — 이름표 프로젝트 작업 가이드

## 이 문서의 용도

이 문서는 AI가 코드 수정 요청을 받았을 때 따라야 하는 규칙이다.

**작업 흐름 요약**

1. 사용자가 이 문서 + 필요한 파일들을 업로드하고 수정 요청을 보낸다.
2. AI는 이 문서를 읽고 요청을 분석한다.
3. AI는 업로드된 파일들을 참조하거나 추가 파일 업로드를 요청한다.
4. AI는 **방향 확인서**를 출력한다 (해결 방향 + 영향 범위 요약).
5. 사용자가 방향을 승인하거나 수정을 요청한다.
6. 사용자가 승인하면, AI는 영향 범위 분석(18번)을 수행하고 작업지시서를 출력한다.
7. 사용자가 작업지시서를 VS Code 에이전트에 복사해서 실행한다.

---

## 0. 작업 흐름 (직접 업로드 방식)

### 프로토콜

**턴 1 (사용자):** 이 문서 + 필요한 파일들 업로드 + 수정 요청

**턴 2 (AI — 방향 확인):**
1. 이 문서를 읽고 요청을 분석한다.
2. "파일별 상세 맵"(8번), "전역 상태 변수 목록"(12번), "핵심 함수 호출 체인"(14번)을 참조하여 필요한 파일을 판단한다.
3. 업로드된 파일들을 검토하거나 누락된 파일을 요청한다.
4. 아래 형식으로 **방향 확인서**를 출력하고, 작업지시서는 아직 만들지 않는다.

**방향 확인서 형식:**
```
## 방향 확인: [요청 요약]

### 요청 이해
- [사용자의 요청을 AI가 어떻게 이해했는지 1~3문장으로 정리]

### 원인 분석 (버그 수정일 때만)
- [어디서 어떤 값이 적용되어서 이런 결과가 나오는지]

### 해결 방향
- [어떤 파일의 어떤 함수를 어떻게 바꿀 것인지. 구체적 함수명과 변경 개요 포함]
- [변경 포인트가 여럿이면 번호로 나열]

### 영향 범위
- [영향 받는 전역 변수, 함수, 플랫폼별 차이]

### 관련 기존 규칙
- [이 문서에서 참조해야 할 규칙 번호와 항목명. 없으면 "없음"]

### 대안 (있을 경우)
- [다른 접근법이 있으면 장단점과 함께 제시]
```

**턴 3 (사용자):** 방향 승인("작업지시서 만들어") 또는 방향 수정 요청

**턴 4 (AI — 작업지시서):**
1. 승인된 방향을 기반으로 영향 범위 분석을 수행한다 (18번).
2. 작업지시서를 출력한다 (2번 형식).

### 방향 확인 단계 규칙

- AI는 턴 2에서 **절대 작업지시서를 출력하지 않는다.** 방향 확인서만 출력한다.
- 사용자가 "작업지시서 만들어", "진행해", "좋아 만들어" 등 명시적으로 승인해야 작업지시서를 작성한다.
- 사용자가 방향을 수정하면, AI는 수정된 방향으로 방향 확인서를 다시 출력한다.
- 사소한 수정(오타, CSS 값 하나 변경 등)이라도 방향 확인 단계를 생략하지 않는다.
- 방향 확인서의 "해결 방향"은 함수명과 변경 개요를 포함해야 하지만, 구체적인 코드 블록은 포함하지 않는다. 코드 블록은 작업지시서에서만 제공한다.

### 파일 업로드 요청 기준

| 작업 유형 | 업로드해야 할 파일 | 추가 확인 가능 |
|---|---|---|
| CSS만 변경 | style.css | — |
| JS 함수 수정 | 해당 함수가 있는 JS | 호출 관계 파일 |
| 새 탭/뷰 추가 | ui.js + 해당 JS + style.css + index.html | data.js |
| 가계부 관련 | ui-expense.js + editor.js | style.css |
| 루틴 관련 | routine.js + routine-cal.js | style.css |
| 데이터 스키마 변경 | storage.js + data.js | sync.js |
| 에디터 기능 | editor.js | ui.js |
| 동기화 관련 | sync.js | data.js |
| 레이아웃/전환 | style.css + ui.js | index.html |
| GAS 서버 수정 | gas-nametag/Code.gs | sync.js |

### style.css 업로드 전략
style.css는 ~3,000줄로 크다. AI는 다음 순서로 판단한다:
1. **상세 맵(8번)의 섹션 정보만으로 작업지시서를 쓸 수 있는가?** — 새 CSS 추가이고 삽입 위치만 특정하면 되는 경우, 전체를 업로드하지 않아도 된다.
2. **기존 선택자 충돌/중복 확인이 필요한가?** — 전체를 업로드해야 한다.
3. **특정 섹션의 현재 값을 확인해야 하는가?** — 전체를 업로드하되, 필요한 섹션에 집중한다.

### 주의사항
- `js/gesture.js`는 참고만 가능하며 수정하는 Step을 만들지 않는다. 필요시 구조 이해를 위해 업로드를 요청할 수 있다.
- Haiku가 작업지시서 실행 후 커밋+푸시까지 일괄 처리하므로, 다음 세션에서는 해당 파일들을 다시 업로드해야 한다.

---

## 1. 작업 유형을 먼저 판별한다

사용자의 요청을 아래 세 가지 중 하나로 분류하고, 작업지시서 상단에 명시한다.

**기능 추가** — 새로운 기능을 만든다. 기존 코드의 구조를 바꾸지 않는다.

**버그 수정** — 기존 기능이 의도대로 동작하지 않는 것을 고친다. 고치는 범위 밖의 코드를 건드리지 않는다.

**정리(리팩토링)** — 동작을 바꾸지 않고 코드 구조를 개선한다. 기능을 추가하지 않는다.

---

## 2. 작업지시서 출력 규칙

### 형식

```
## 작업지시서: [기능명 또는 수정 대상]
작업 유형: [기능 추가 / 버그 수정 / 정리]

### 영향 범위 분석
- 영향 받는 전역 변수: [목록]
- 영향 받는 함수: [목록]
- 고위험 함수 수정 여부: [있음/없음 — 있으면 전체 테스트 필요]
- switchTab/renderListPanel/loadDoc 영향: [있음/없음]
- 플랫폼별 차이: [모바일/태블릿/PC 중 영향이 다른 곳]

### Step 1
- 파일: [파일명]
- 위치: [함수명 또는 기존 코드의 어떤 부분 근처인지]
- 작업: [정확히 무엇을 추가/수정/삭제하는지. 구체적인 코드를 포함한다.]
- 영향 받는 함수: [이 변경으로 동작이 달라질 수 있는 다른 함수]
- 영향 받는 전역 상태: [이 변경이 읽거나 쓰는 전역 변수]
- 완료 확인: [이 단계가 끝나면 어떤 상태여야 하는지]

### Step 2
(이하 반복)

### WORKFLOW.md 갱신 (해당 시)
- 8번 파일별 상세 맵: [추가/삭제/변경된 함수·상수 목록]
- 12번 전역 상태 변수: [추가/삭제된 변수]
- 14번 호출 체인: [변경된 흐름]
- 15번 데이터 스키마: [변경된 필드]

### 최종 확인
- 모바일(768px 이하): [확인할 동작]
- 태블릿(769~1400px): [확인할 동작]
- PC(1401px 이상): [확인할 동작]
- 영향 없음 확인: [변경하지 않았지만, 같은 상태를 사용하는 함수가 기존대로 동작하는지]

### 정리 부채 (해당 시)
- [작업 중 발견한 중복 코드나 개선 가능한 부분]
```

### Haiku 4.5를 위한 규칙

Haiku 4.5는 한 번에 하나의 명확한 작업을 처리할 때 가장 정확하다. 다음 규칙으로 작업지시서를 작성한다.

- 한 Step에 한 파일만 다룬다.
- 한 Step에 한 가지 변경만 한다.
- 각 Step은 이전 Step이 완료된 상태에서 독립적으로 실행 가능해야 한다.
- 작업 내용에 구체적인 코드를 포함한다. "적절히 추가해줘" 같은 모호한 표현을 쓰지 않는다.
- 기존 함수를 수정할 때는 함수명과 현재 동작을 명시한다.
- 새 CSS를 추가할 때는 삽입 위치(어떤 선택자 아래/위)를 명시한다.
- 기존 코드에서 변경할 부분을 정확히 지목한다. "이 함수의 3번째 if문 안에서" 수준으로 구체적이어야 한다.
- gesture.js는 어떤 Step에서도 포함하지 않는다.

### WORKFLOW.md 갱신 규칙

**작업지시서의 마지막 Step은 WORKFLOW.md 갱신이다.** 다음 중 하나라도 해당하면 WORKFLOW.md를 갱신하는 Step을 반드시 포함한다:
- 함수가 추가/삭제/이름 변경되었을 때 → 8번(파일별 상세 맵) 갱신
- 전역 변수가 추가/삭제되었을 때 → 12번(전역 상태 변수 목록) 갱신
- 데이터 스키마가 변경되었을 때 → 15번(데이터 스키마) 갱신
- 호출 체인이 바뀌었을 때 → 14번(핵심 함수 호출 체인) 갱신
- 새 파일이 추가되었을 때 → 7번(파일 구조) 갱신

변경 사항이 위 어디에도 해당하지 않으면 이 Step을 생략한다.

### 커밋 & 푸시 규칙

모든 작업지시서의 마지막 Step에 커밋+푸시를 포함한다. WORKFLOW.md 갱신 Step이 있으면 그 이후에, 없으면 코드 변경 Step 이후에 배치한다.

- 커밋 메시지 형식: `[작업유형]: [변경 요약]` (예: `feat: 루틴 주간 리포트 추가`)
- 작업유형: feat / fix / chore / refactor
- 푸시 실패 시 에러 메시지를 사용자에게 보고하고 작업을 중단한다.

**템플릿:**

```
### Step N (최종): 커밋 & 푸시
- 작업:
  ```bash
  git add .
  git commit -m "[타입]: [요약]"
  git push origin main
  ```
- 완료 확인: 푸시가 성공하고 `git status`에 "nothing to commit, working tree clean"이 표시된다.
- 푸시 실패 시: 작업을 중단하고 에러 메시지를 사용자에게 보고한다.
```

### GAS 배포 규칙

Code.gs를 수정하는 작업지시서에는 반드시 `clasp push` Step을 포함한다. Git 커밋 & 푸시와는 별도 Step이다.

**GAS 변경 시 Step 순서:**
1. Code.gs 수정 Step(들)
2. `clasp push` Step
3. (메인 레포 파일도 변경했으면) Git 커밋 & 푸시 Step
4. (해당 시) WORKFLOW.md 갱신 Step

**Code.gs만 수정하고 메인 레포 파일은 변경하지 않은 경우**, Git 커밋 & 푸시 Step은 생략한다. gas-nametag 폴더는 별도 프로젝트이고 메인 레포의 Git 관리 대상이 아니다.

**양쪽 모두 수정한 경우** (예: sync.js의 action 이름 변경 + Code.gs의 switch 분기 추가), GAS 배포가 먼저 성공한 뒤 Git 커밋 & 푸시를 실행한다. GAS 배포가 실패하면 클라이언트 코드도 푸시하지 않는다.

**`clasp push` 후 웹앱 재배포가 필요한 경우:** `doGet` 또는 `doPost`의 라우팅이 바뀌거나 새 action이 추가된 경우, `clasp push`만으로는 웹앱 URL에 반영되지 않는다. 이때는 Step에 재배포 안내를 포함한다.

**템플릿:**

```
### Step N: GAS 배포
- 파일: gas-nametag/Code.gs
- 작업:
  ```bash
  cd ~/바이브\ 코딩/gas-nametag
  clasp push
  ```
- 완료 확인: `clasp push` 출력에 "Pushed N files."가 표시된다.
- 실패 시: 에러 메시지를 사용자에게 보고하고 작업을 중단한다.
- [웹앱 재배포 필요 시] 안내: GAS 편집기(https://script.google.com)에서 배포 > 배포 관리 > 새 버전으로 배포를 실행하세요.
```

### 작업 실패 시 WORKFLOW.md 처리

사용자가 작업 결과가 실패/미해결이라고 보고하면, AI는 다음 작업지시서에서:
1. 직전 작업지시서의 WORKFLOW.md 갱신 내용이 여전히 유효한지 확인한다.
2. 유효하지 않으면 (함수가 결국 추가되지 않았거나, 이름이 바뀌었거나, 롤백되었으면) WORKFLOW.md를 되돌리거나 재수정하는 Step을 포함한다.
3. 재수정 코드가 동일한 함수/변수를 유지하면 WORKFLOW.md는 건드리지 않는다.

---

## 3. 기능 추가 시 규칙

### 기존 패턴 참조

새 탭이나 뷰를 추가할 때는 가계부(expense) 탭의 구현 패턴을 참조한다. `switchTab` → pane 표시/숨김 → 렌더 함수 호출 순서를 따른다.

플랫폼별 분기가 필요할 때는 하나의 함수에서 매개변수로 처리한다. `renderExpenseDashboard('pc')` / `renderExpenseDashboard('mobile')` 패턴을 따른다. 같은 로직의 함수를 플랫폼별로 별도 작성하지 않는다.

### 기존 함수 재사용

새 함수를 만들기 전에 기존 함수 중 같은 일을 하는 것이 있는지 확인한다. 있으면 기존 함수를 확장하거나 매개변수를 추가해서 재사용한다. 비슷한 함수를 새로 만들지 않는다.

### CSS 규칙

새 CSS 규칙을 추가할 때, 같은 선택자가 이미 존재하는지 먼저 검색한다. 존재하면 거기에 병합한다. 새 선언을 파일 하단에 덧붙이지 않는다.

`!important`는 사용하지 않는다. 우선순위 문제가 생기면 선택자 구조를 수정해서 해결한다.

새 기능의 CSS는 해당 파일의 상단 주석에 명시된 영역에 작성한다. 영역이 없으면 적절한 위치에 섹션 주석을 추가한 뒤 작성한다.

미디어 쿼리 안에 새 규칙을 추가할 때, 모바일(~768px)/태블릿(769px~1400px)/PC(1401px~) 세 곳 모두 확인하고 필요한 곳에만 추가한다. 한 곳만 추가하고 나머지를 빠뜨리지 않는다.

---

## 4. 버그 수정 시 규칙

수정 전에 원인을 먼저 설명한다. 작업지시서 상단에 "원인: 어디서 어떤 값이 적용되어서 이런 결과가 나온다"를 밝힌다.

새 규칙을 추가해서 덮어쓰는 방식으로 고치지 않는다. 원래 잘못된 선언을 찾아서 그것을 직접 수정하는 Step을 작성한다.

수정 범위를 명시한다. 어떤 파일의 어떤 부분을 바꾸는지, 다른 곳에 영향이 있는지 없는지를 밝힌다.

---

## 5. 정리(리팩토링) 시 규칙

정리 전후의 동작이 동일해야 한다. 시각적으로 달라지는 부분이 없어야 한다.

정리 대상 파일 하나씩 진행한다. 여러 파일을 한꺼번에 정리하지 않는다.

최종 확인 체크리스트에 모바일/태블릿/PC에서 무엇을 확인해야 하는지 구체적으로 적는다.

---

## 6. 절대 건드리지 않는 파일

`gesture.js` — 스와이프 제스처 전체를 담당한다. 어떤 작업에서도 이 파일을 수정하는 Step을 만들지 않는다. 새 기능이 제스처와 연동되어야 하면, 기존 패널 구조(.side, .list-panel, .editor) 안에서 해결한다.

---

## 7. 파일 구조

```
js/storage.js     — LocalStorage, 날짜 유틸, 상수, 카테고리 상수, 모의 데이터
js/data.js        — 문서/책/어구/메모/가계부 CRUD, 통계 함수
js/routine.js     — 루틴 데이터 + 사이드바/상세카드 렌더링
js/routine-cal.js — 루틴 캘린더 뷰 (에디터 3단)
js/sms-parser.js  — 카드 문자 파싱, 카테고리 자동 매칭
js/ui.js          — 탭 전환, 리스트/사진/캘린더 렌더링, 팝업, 에디터 더보기 메뉴
js/ui-expense.js  — 가계부 대시보드/상세/차트/타임라인 UI
js/editor.js      — 에디터 툴바, 서식, 이미지, 자동저장, 가계부 폼 로직
js/gesture.js     — 제스처 (수정 금지)
js/sync.js        — GAS 동기화
js/app.js         — 인증, init, 지도 모달, 앱 진입점
style.css         — 전체 스타일 (미디어쿼리: ~768 모바일, 769~1400 태블릿, 1401~ PC)
index.html        — 마크업

### GAS (별도 프로젝트 — clasp 배포)
gas-nametag/          — Google Apps Script (메인 레포와 별도 폴더)
  .clasp.json         — clasp 프로젝트 설정 (scriptId)
  appsscript.json     — GAS 런타임 설정 (V8, webapp)
  Code.gs             — 서버 동기화, SMS 파싱, DB/문서/이미지/루틴/어구 저장
```

---

## 8. 파일별 상세 맵

### js/storage.js (~400줄)
**역할:** 앱의 기반 유틸리티. 다른 모든 JS보다 먼저 로드된다.

**전역 상수:**
- `APP_TOKEN` — 동기화 인증 토큰
- `K` — LocalStorage 키 객체 (docs, checks, books, quotes, memos, expenses)

**유틸 함수:**
- `L(key)` / `S(key, val)` — LocalStorage 읽기/쓰기
- `today()`, `getLocalYMD(date)`, `getWeekDates()` — 날짜 유틸
- `formatFullDate(iso)`, `formatTimeOnly(iso)`, `getMonthYearStr(iso)` — 날짜 포맷
- `stripHtml(s)` — HTML 태그 제거
- `fixDriveImageUrls(html)` — 구글 드라이브 이미지 URL 변환
- `buildDocContent(doc)` — 문서 내용 + 메타 문자열 생성
- `formatAmount(n)`, `formatAmountShort(n)` — 금액 포맷 (만원 단위)

**모의 데이터:**
- `injectMockData()` — 문서/책/어구/메모/루틴 더미 데이터
- `injectExpenseMockData()` — 가계부 6개월치 더미 데이터

**이 파일을 업로드해야 할 때:** 새 카테고리 추가, 날짜 포맷 변경, 데이터 스키마 변경, 새 LocalStorage 키 추가

---

### js/data.js (~620줄)
**역할:** 모든 데이터 타입의 CRUD + 통계 + 가계부 상수.

**전역 상수:**
- `EXPENSE_CATEGORIES` — 가계부 카테고리 배열 [{id, name, color, bg}, ...]
- `MERCHANT_LOGOS` — 매출처 키워드 → 도메인 매핑 (Google 파비콘용)

**전역 상태:**
- `activeTab` — 현재 탭 ('navi'|'fiction'|'blog'|'book'|'quote'|'memo'|'expense')
- `textTypes` — ['navi','fiction','blog']
- `TAB_META` — 탭 ID → 표시명 매핑
- `curIds` — 텍스트 탭별 현재 문서 ID 객체
- `curBookId`, `curQuoteId`, `curMemoId` — 현재 편집 중인 항목 ID
- `currentLoadedDoc` — 에디터에 로드된 문서 {type, id} (중복 로드 방지)
- `currentSearchQuery` — 현재 검색어
- `currentListView` — 리스트 뷰 모드 ('list'|'photo'|'calendar')

**문서 CRUD:**
- `allDocs()`, `getDocs(type)`, `saveDocs(docs)`, `newDoc(type)`
- `loadDoc(type, id, force)` — 에디터에 문서 로드 → `renderListPanel()` 호출
- `saveCurDoc(type)`, `delDoc(type, id, e)`
- `updateWC()` — 단어수/원고지 업데이트 → `updateWritingStats()` 호출
- `updateMetaBar(type, title)` — 하단 위치 정보 업데이트

**책 CRUD:** `getBooks()`, `saveBooks()`, `newBook()`, `saveBook()`, `loadBook(id, force)`, `delBook(id, e)`
**어구 CRUD:** `getQuotes()`, `saveQuotes()`, `saveQuote()`, `newQuoteForm()`, `loadQuote(id, force)`, `delQuote(id, e)`
**메모 CRUD:** `getMemos()`, `saveMemos()`, `saveMemo()`, `newMemoForm()`, `loadMemo(id, force)`, `delMemo(id, e)`

**가계부 CRUD:**
- `getExpenses()`, `saveExpenses(arr)`, `newExpense(data)`, `updateExpense(id, data)`, `delExpense(id)`

**가계부 통계:**
- `getMonthExpenses(ym)`, `getMonthTotal(ym)`, `getDayExpenses(date)`, `getDayTotal(date)`
- `getExpensePace()` — 전월 대비 지출 페이스
- `getProjectedMonthTotal()` — 예상 월 지출
- `getMonthlyAverage()` — 6개월 월 평균
- `getCategoryBreakdown(ym)` — 카테고리별 지출 내역
- `getTopCategoryChange(ym)` — 전월 대비 가장 변화폭이 큰 카테고리 {name, diff}
- `getMonthlyTrend(count)` — 월별 추이 (count: 개월수, 기본값 6)
- `getMonthlyTrendAround(centerYM)` — 중심 월 기준 월별 추이
- `getMerchantBreakdown(ym)` — 월간 상호별 지출 분석 [{merchant, amount, count, percent, category}, ...]
- `getYearMerchantBreakdown(year)` — 연간 상호별 지출 분석 {startDate, endDate, total, merchants: [...]}

**기타:** `getTabCount(t)`, `updateWritingStats()`, `updateBookStats()`, `showRandomQuote()`, `togglePin(type, id, e)`

**데이터 범위 조회:**
- `getOldestExpenseYM()` — 가계부 데이터가 있는 가장 오래된 월(YYYY-MM) 반환
- `getOldestRoutineYM()` — 루틴 체크 데이터가 있는 가장 오래된 월(YYYY-MM) 반환
- `hasExpenseDataInMonth(ym)` — 해당 월에 가계부 항목이 1개 이상 있는지 boolean
- `hasRoutineDataInMonth(ym)` — 해당 월에 루틴 체크 기록이 있는지 boolean

**이 파일을 업로드해야 할 때:** 새 데이터 타입 추가, CRUD 함수 수정, 통계 로직 변경, 검색/정렬 변경

---

### js/ui.js (~750줄)
**역할:** 탭 전환, 리스트/사진/캘린더 뷰 렌더링, 팝업 메뉴, 네비게이션.

**탭 전환:**
- `TAB_COLORS` — 탭별 색상 (현재 미사용, 단일 색상 #E55643 적용)
- `applyTabColor(tabId)` — CSS 변수 `--tab-color` 설정
- `switchTab(t, keepLayout)` — **핵심 함수**. 모든 탭 전환의 진입점. 에디터 패널 전환, pane 표시/숨김, 레이아웃 클래스 조정, 데이터 로드 포함. expense 탭 진입 시 PC/태블릿에서 expFullDetailPane 명시적으로 숨김
- `renderWritingGrid()` — 사이드바 글쓰기 메뉴 렌더링
- `updateEdTabLabel()` — 에디터 상단 탭 라벨 텍스트

**레이아웃 전환:**
- `switchListView(view)` — 목록/사진/캘린더 전환
- `toggleSidebar()` — PC/태블릿/모바일 사이드바 토글
- `setMobileView(view)` — 모바일 뷰 전환 ('side'|'list'|'editor'). 태블릿/PC에서도 분기 처리

**검색:**
- `toggleSearch()`, `handleSearch(e)`, `clearSearch()`, `setTagSearch(tag)`

**리스트 렌더링:**
- `renderListPanel()` — **핵심 함수**. 현재 탭/검색/뷰모드에 따라 리스트 전체 렌더. `renderWritingGrid()` 호출
- `generateItemHtml(item, t, showDate)` — 단일 아이템 HTML 생성
- `_patchRoutineOnclick(itemHtml, item)` — 루틴 모드에서 아이템 onclick을 switchTab 포함으로 패치
- 헬퍼: `getThumb()`, `getThumbs()`, `getRelativeTime()`, `escapeHtml()`, `hl()`, `getPreviewText()`

**사진 뷰:** `renderPhotoView(items, t)`, `selectPhoto(id, e)`
**캘린더 뷰:** `renderCalendarView(items, t)`, `selectCalDay(el)`, `showDayList(dateKey, type)`, `hideDayList()`

**에디터 더보기 팝업:**
- `toggleEditorMenu(e)` — 팝업 열기 (lpPopupCard 재사용)
- `lpPopupAction(action)` — 팝업 메뉴 액션 (pin/copymd/photo/delete)

**리스트 꾹누르기 팝업:**
- `contextItemId`, `contextItemType` — 팝업 대상
- `showContextMenuAt(item, x, y, fromTouch)` — 팝업 표시 (리프트 애니메이션 포함)
- `closeLpPopup()` — 팝업 닫기
- `setupListContextMenu()` — 터치/마우스 꾹누르기 이벤트 등록
- `cancelLongPress()` — 제스처 충돌 시 long press 취소

**네비게이션 버튼:**
- `handleNew()` — FAB/새 글 버튼 핸들러
- `handleBackBtn()` — 뒤로가기 (에디터→리스트)
- `handleDone()` — 완료 버튼
- `toggleTabletList()`, `updateBackBtnIcon()`

**이 파일을 업로드해야 할 때:** 탭 전환 로직 변경, 리스트 렌더링 수정, 새 탭 추가, 팝업 메뉴 수정, 네비게이션 변경

---

### js/ui-expense.js (~850줄)
**역할:** 가계부 대시보드(A)/전체 내역(B) 렌더링, 차트, 타임라인, 월 이동.

**전역 상태:**
- `_expenseViewYM` — 현재 보고 있는 월 (YYYY-MM)
- `_selectedExpenseDate` — 캘린더에서 선택된 날짜
- `_expenseDetailSearchQuery` — 전체 내역 검색어
- `_expenseCategoryFilter` — 카테고리 필터 ID
- `_expenseCategoryFilterName` — 카테고리 필터 표시명
- `_smsPasteMode` — 문자 붙여넣기 시트의 대상 폼 모드 (normal/modal)

**상수/헬퍼:**
- `CATEGORY_ICONS` — 카테고리별 SVG 아이콘 매핑
- `getCategoryIcon(item)`, `getCategoryBg(item)` — 아이콘/배경색 조회
- `_findMerchantDomain(merchant)` — MERCHANT_LOGOS 매핑에서 매출처 도메인 검색 (긴 키워드 우선)
- `getMerchantIconHtml(item)` — 매출처 파비콘 또는 카테고리 아이콘 HTML. MERCHANT_LOGOS 매핑 사용
- `_logoFallback(el, category)` — 이미지 로드 실패 시 카테고리 아이콘으로 대체
- `updateExpenseCompact()` — 사이드바 가계부 금액 업데이트

**대시보드 A (renderExpenseDashboard):**
- `renderExpenseDashboard(platform)` — 'pc'|'mobile'. 요약+차트+카테고리+예상+주간캘린더+타임라인
- `renderCumulativeChart(ym)` — 누적 곡선 SVG
- `renderMonthlyBarChart(trend)` — 월별 막대 차트 (클릭 시 `_onBarChartClick()` 호출)
- `_onBarChartClick(ym)` — PC/태블릿: 통합 대시보드 렌더, 모바일: B화면(showExpenseFullDetail) 표시
- `renderWeeklyCalendar(ym)` — 주간 캘린더 그리드
- `renderRecentExpenses(ym)` — 최근 7일 타임라인
- `renderCategoryChart(catBreakdown)` — 카테고리별 수평 바 차트 (상위 4개 표시 + 더보기 + 행 클릭 시 openCategoryDetail)
- `toggleCategoryMore(btn)` — 카테고리 더보기/접기 토글
- `openCategoryDetail(catId, catName)` — 카테고리 클릭 → 화면B 진입 및 필터 설정
- `clearCategoryFilter()` — 카테고리 필터 초기화
- `renderCategoryBarCompact(catBreakdown, total)` — 스택 바
- `openCategoryExpensePopup(catId, catName)` — 카테고리 태그 클릭 → 해당 카테고리 월간 내역 플로팅 팝업

**전체 내역 B:**
- `showExpenseFullDetail(ym)` — PC/태블릿: 통합 대시보드 렌더 (B화면 진입 차단), 모바일: B 표시
- `showExpenseFullDetailMobile(ym)` — 모바일: B 표시
- `renderExpenseFullDetail(ym)` — PC B 렌더
- `renderExpenseFullDetailMobile(ym)` — 모바일 B 렌더
- `renderMonthCalendar(ym)` — 월간 캘린더 그리드
- `renderExpenseTimeline(ym, useModal)` — 타임라인
- `renderExpenseFullTimeline(ym, query)` — 검색/필터 적용 타임라인

**A↔B 전환:**
- `showExpenseDashboardFromDetail()` — PC/태블릿: 통합 대시보드 렌더 (pane 관리는 switchTab에서), 모바일: A 표시
- `showExpenseDashboardFromDetailMobile()` — 모바일: A 표시

**월 이동:**
- `getExpenseViewYM()`, `changeExpenseMonth(delta)`
- `renderExpenseMonthNav(ym)` — 상단 월 네비 렌더 (lp-hdr 또는 ed-topbar에 삽입)
- `_buildMonthNavHtml(ym)` — 월 네비 HTML
- `openMonthPicker()`, `closeMonthPicker()`, `selectMonth(ym)` — 월 선택 모달

**날짜 선택:**
- `toggleExpenseDaySelect(dateStr, rerenderFn)`
- `renderSelectedDayExpenses(dateStr)` — 선택 날짜 상세 내역
- `reRenderDashboardA()`, `reRenderDetailPC()`, `reRenderDetailMobile()`

**카테고리 필터:**
- `openCategoryDetail(catId, catName)`, `clearCategoryFilter()`
- `toggleCategoryMore(btn)` — 더보기/접기

**모달:**
- `openExpenseModal(expenseId)`, `closeExpenseModal()`, `onExpenseModalOverlayClick(e)`

**폼 관리:**
- `pasteFromClipboard(mode)` — 문자 붙여넣기 하단 시트 열기 (사전 읽기 텍스트 우선 사용)
- `closeSmsPasteSheet(e)` — 하단 시트 닫기
- `handleSmsPaste()` — textarea 내용 파싱 → 폼 반영
- `prefetchClipboardForExpense(mode)` — FAB/새글 클릭 시 클립보드 사전 읽기 + SMS 자동 폼 반영
- `deleteExpenseFromForm(mode)` — 기존 항목 삭제 (확인 대화 포함, 모바일|모달 모드 지원)

**타임라인 컨텍스트 메뉴:**
- `showExpensePopup(expenseId, x, y)` — 타임라인 항목 우클릭/꾹누르기 팝업 (수정/삭제)
- `_deleteExpenseFromPopup(expenseId)` — 팝업에서 삭제 실행 + PC/태블릿: 항상 통합 대시보드 렌더, 모바일: 현재 화면에 따라 리렌더
- `setupExpenseContextMenu()` — document 레벨 이벤트 위임 등록 (우클릭 + 꾹누르기 600ms)

**플로팅 팝업 (공용 컴포넌트):**
- `openExpenseFloatingPopup(title, contentHtml, anchorX, anchorY)` — 플로팅 팝업 열기 (PC: 앵커 근처 카드, 모바일: 하단 시트)
- `closeExpenseFloatingPopup()` — 플로팅 팝업 닫기 (fade-out 애니메이션)

**상호별 랭킹 (공용 렌더 함수):**
- `renderMerchantRanking(merchants, limit, options)` — 상호별 랭킹 리스트 HTML 생성 (각 행: 파비콘/상호명/금액/건수/비중/수평바/카테고리태그)
- `_escMerchant(str)` — onclick에서 상호명 안전하게 이스케이프
- `openMerchantDetail(merchant)` — 상호 클릭 → 월간 내역을 플로팅 팝업으로 표시

**연간 누적 섹션 (버블 차트 + 랭킹):**
- `renderYearlySection(year)` — 연간 누적 섹션 (버블 차트 + 랭킹 리스트 10개 + "전체 순위 보기") HTML 생성
- `_packCircles(items, containerW, containerH)` — circle packing 알고리즘 (force-based, 금액 비례 반지름)
- `_renderYearlyBubbles(merchants, containerW, containerH)` — 버블 차트 HTML 생성 (상위 10개 + 기타, 파비콘 표시, 카테고리 배경색)
- `_renderYearlyRankList(merchants, limit)` — 랭킹 리스트 HTML 생성 (뉴트럴 그라데이션 배경, 순위+파비콘+상호명+금액)
- `_renderYearlyGridItem(m, rank)` — 연간 그리드 아이템 HTML 생성 (월간 히어로 그리드에서 사용)
- `openYearlyFullPopup(year)` — 연간 전체 상호 리스트 팝업 (순위+파비콘+상호명+금액 리스트)

**주요 렌더 함수 출력 구조:**
- `renderWeeklyCalendar()` → `.exp-week-cal > .exp-week-grid > (.exp-week-dow-row > .exp-week-dow×7) + .exp-week-day×7` + `#expWeekDaySlot`
- `renderMonthCalendar()` → `.exp-month-cal > .exp-month-grid > (.exp-month-dow-row > .exp-month-dow×7) + .exp-month-day×N` + `#expMonthDaySlot`
- `renderExpenseDashboard('pc')` → `.exp-two-col > (차트카드 + 카테고리카드)` + `.exp-projection` + 주간캘린더 + 타임라인 + 더보기
- `renderExpenseDashboard('mobile')` → `.exp-summary` + 차트 + 카테고리 + `.exp-projection` + 주간캘린더 + 타임라인 + 더보기

**이 파일을 업로드해야 할 때:** 가계부 UI 변경, 차트 스타일, 타임라인 수정, 월 이동 로직, 카테고리 표시

---

### js/editor.js (~550줄)
**역할:** 에디터 툴바, 서식, 이미지 처리, 자동저장, 가계부 폼.

**전역 상태:**
- `curExpenseId` — 현재 편집 중인 가계부 항목 ID
- `imgCtxTarget` — 이미지 컨텍스트 메뉴 대상 IMG 요소
- `savedSelection` — 플로팅 툴바용 텍스트 선택 범위

**툴바/서식:**
- `execCmd(cmd, val)`, `insertChecklist()`, `setupEnterKey()`
- `toggleAaMenu(e)` — Aa 서식 메뉴 (lpPopupCard 재사용)
- `aaPopupAction(type)`, `aaAction(type)` — 서식 적용 (h1~h3, ul, ol, check, quote, hr)
- `toggleHeadingMenu()`, `applyHeading(tag)` — PC 제목 드롭다운

**플로팅 툴바:**
- `checkSelection()`, `hideFloatingToolbar()`, `setupFloatingToolbar()`
- `saveSelection()`, `restoreSelection()`, `updateFtActiveStates()`

**이미지:**
- `setupEditorImageSelection()` — 클릭/우클릭/꾹누르기 이벤트
- `showImgContextMenu(x, y)`, `hideImgContextMenu()`, `imgCtxAction(action)`
- `handleMediaUpload(e)` — 파일 업로드 → 드라이브 저장
- `handlePaste(e)` — 붙여넣기 (이미지/텍스트)
- `setupCopyHandler()` — 복사 시 플레인 텍스트 변환
- `hideResizeHandle()`

**자동저장:**
- `setupAutoSave()` — 800ms 디바운스 → 로컬 저장 → DB 동기화(3초) + 문서 동기화(5초)

**가계부 폼:**
- `newExpenseForm(mode)`, `loadExpense(id, mode)` — 'normal'|'modal'
- `formatExpenseAmount(input)` — 금액 콤마 포맷
- `renderExpenseCategoryGrid(mode)`, `selectCategory(catId, mode)`, `getSelectedCategory(mode)`, `clearCategorySelection(mode)`
- `formatExpenseDate(d)`, `parseExpenseDateText(text)`, `updateExpenseSaveBtn(mode)`
- `pasteFromClipboard(mode)` — 카드 문자 붙여넣기 → parseSMS
- `saveExpenseForm(mode)` — 저장 → updateExpenseCompact → SYNC

**이 파일을 업로드해야 할 때:** 에디터 서식 추가, 이미지 처리 변경, 자동저장 로직, 가계부 입력 폼 수정

---

### js/routine.js (~350줄)
**역할:** 루틴 데이터 관리 + 사이드바/상세카드/스트릭/월간 렌더링.

**전역 상수:**
- `ROUTINE_META` — 루틴 항목 배열 [{id, name, color, bg}, ...] (7개: exercise~nodrink)

**데이터:**
- `getChk()`, `saveChk(id, v)`, `getAllChk()` — 루틴 체크 읽기/쓰기
- `toggleChk(id)`, `toggleDay(id, dateStr)`, `toggleDayCard(id, dateStr)` — 체크 토글 → 렌더+동기화

**렌더링:**
- `renderChk()` — 사이드바 루틴 테이블 (블롭 애니메이션 포함)
- `renderRoutineCardBody()` — 2단 리스트 상단 루틴 카드 본문
- `renderRoutineRing()` — 사이드바 미니 원형 진행바 (Canvas)
- `renderStreakCard()` — 연속 기록 (히어로 카드 + 그리드)
- `renderMonthlyCard()` — 월간 통계 (달성률, 완벽한 날, 일 평균, 리듬 차트)

**루틴 상세 열기/닫기:**
- `openRoutineDetail()` — 모바일: 리스트 뷰, PC/태블릿: 캘린더 뷰
- `showRoutineCard()`, `hideRoutineCard()` — pane-routine 표시/숨김

**블롭 헬퍼:** `_makeBlobParams(W, H, doneCount)`, `_buildBlobHtml(r, doneCount, W, H)`

**이 파일을 업로드해야 할 때:** 루틴 항목 추가/변경, 사이드바 루틴 표시 수정, 스트릭/월간 통계 변경

---

### js/routine-cal.js (~280줄)
**역할:** 루틴 캘린더 뷰 (에디터 3단 — editorRoutineDetail 패널).

**전역 상태:**
- `_routineViewYM` — 현재 보고 있는 월
- `_selectedRoutineDate` — 선택된 날짜

**함수:**
- `showRoutineCalendarView(keepListPanel)` — 에디터를 루틴 캘린더로 전환
- `hideRoutineCalView()` — 캘린더 닫고 원래 에디터 복원
- `renderRoutineCalView(ym)` — 캘린더 뷰 렌더 (요약+차트+캘린더+리포트)
- `changeRoutineMonth(delta)`, `selectRoutineDate(dateStr)`
- `renderRoutineMonthNav(ym)` — 상단 월 네비 (ed-topbar에 삽입)
- `removeRoutineMonthNav()` — 월 네비 제거
- `openRoutineMonthPicker()`, `closeRoutineMonthPicker()`, `pickRoutineMonth(ym)`
- `buildRCChart(...)` — 누적 곡선 SVG 생성

**주요 렌더 함수 출력 구조:**
- `renderRoutineCalView()` → `.rc-view > .rc-summary` + 차트 + `.rc-gap` + `.rc-cal > .rc-cal-grid > (.rc-dow-row > .rc-dow×7) + .rc-day×N` + `.rc-report`

**이 파일을 업로드해야 할 때:** 루틴 캘린더 UI 변경, 루틴 통계 차트 수정

---

### js/sms-parser.js (~120줄)
**역할:** 카드 결제 문자(SMS) 파싱 → 가계부 자동 입력.

**함수:**
- `parseSMS(text)` — 문자열 → {amount, merchant, card, date, time, category}. 카드사 짧은 키워드(삼성, 신한 등) → 풀네임 변환 (CARD_MAP), 마스킹 이름(고*진) 제거, 누적 금액 제거, 카드+숫자 패턴 제거
- `autoMatchCategory(merchant)` — 가맹점명 → 카테고리 자동 매칭

**이 파일을 업로드해야 할 때:** 문자 파싱 규칙 변경, 카테고리 매칭 규칙 추가

---

### js/sync.js (~200줄)
**역할:** Google Apps Script 기반 동기화.

**전역:**
- `GAS_URL` — GAS 배포 URL
- `SYNC` — 동기화 객체

**SYNC 메서드:**
- `setSyncStatus(text, type)` — 동기화 상태 표시
- `_post(data)` — GAS 통신
- `loadDatabase()` — 앱 시작 시 DB 불러오기
- `saveDatabase()`, `scheduleDatabaseSave()` — DB 저장 (3초 디바운스)
- `uploadImage(base64, filename, mime)` — 이미지 → 구글 드라이브
- `saveDocToGDrive(id, type)`, `scheduleDocSave(type)` — 문서 → 드라이브 (5초 디바운스)
- `mergeServerExpenses()` — 서버에서 expenses를 가져와 LocalStorage와 ID 기준 병합 (SMS 자동 반영)
- `saveChecksToSheet(dateStr, checkData)` — 루틴 → 스프레드시트
- `scheduleBookSave(book)`, `saveBooksToSheet(book)` — 책 → 드라이브
- `scheduleQuoteSave(text, by, id)`, `saveQuotesToSheet(text, by)` — 어구 → 스프레드시트
- `syncAll()` — 전체 동기화

**이 파일을 업로드해야 할 때:** 동기화 로직 변경, 새 데이터 타입 동기화 추가

---

### gas-nametag/Code.gs (~380줄)
**역할:** Google Apps Script 서버. DB 동기화, 문서 저장, 이미지 업로드, 루틴/어구 시트 저장, SMS 가계부 자동 저장, 매출처 로고 검색 프록시.

**경로:** 메인 레포(`nametag-game`)와 별도 폴더. `~/바이브 코딩/gas-nametag/`

**배포:** `clasp push` → GAS 편집기에서 웹앱 재배포 (action 추가/라우팅 변경 시)

**전역 상수:**
- `ALLOWED_EMAIL` — 인증 허용 이메일
- `ROUTINE_SHEET_ID` — 루틴 체크 스프레드시트 ID
- `QUOTE_SHEET_ID` — 어구록 스프레드시트 ID
- `ROOT_FOLDER_NAME` — 드라이브 루트 폴더명 ('글방')
- `CARD_NAME_MAP` — 카드번호 → 풀네임 매핑 (예: '삼성1337' → '삼성카드 & MILEAGE PLATINUM')
- `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX` — Google Custom Search API 키 (매출처 로고 검색용)

**인증:**
- `verifyUser(idToken)` — JWT 디코딩 → 이메일 확인

**라우터:**
- `doGet(e)` — GET 요청. `action=searchMerchant` → Google Custom Search 이미지 검색 프록시
- `doPost(e)` — POST 요청. action별 분기: save_db, load_db, save_doc, save_routine, save_quote, upload_image, save_expense_sms

**헬퍼:**
- `_jsonResponse(obj)` — JSON ContentService 응답 생성
- `getOrCreateFolder(parentFolder, name)` — 하위 폴더 조회/생성
- `getSubFolder(name)` — '글방' 하위 폴더 조회/생성
- `getDatabaseFile()` — `app_database.json` 파일 조회/생성

**문서/DB:**
- `saveDocument(docId, driveId, folderName, title, content)` — 구글 Docs 생성/업데이트 (driveId → description 검색 → 신규 생성 순). LockService 사용
- `saveDatabase(dbData)` — `app_database.json`에 전체 DB 저장
- `loadDatabase()` — `app_database.json`에서 전체 DB 로드

**시트 저장:**
- `saveRoutineToSheet(dateStr, checks)` — 루틴 체크 스프레드시트 저장 (날짜 기준 행 갱신/추가). LockService 사용
- `saveQuoteToSheet(text, by)` — 어구록 스프레드시트 행 추가

**이미지:**
- `uploadImageToDrive(bytes, mimeType, filename)` — base64 → Blob → '첨부이미지' 폴더에 파일 생성, 링크 공유 설정

**SMS 가계부:**
- `saveExpenseFromSMS(smsText)` — SMS 텍스트 → 파싱 → `app_database.json`의 `gb_expenses`에 추가. LockService 사용
- `parseSMSServer(text)` — SMS 문자열 파싱 → {amount, merchant, card, date, time, category}. 거절/취소 필터, 카드사+번호 매핑(CARD_NAME_MAP), 가맹점 정제
- `autoMatchCategoryServer(merchant)` — 가맹점명 → 카테고리 매칭 (food, dining, shopping, transport, utility, loan, medical, pet, culture, etc)

**일괄 유틸 (GAS 편집기에서 수동 실행):**
- `importCardSmsSheet()` — card_sms 스프레드시트에서 가계부 일괄 가져오기 (중복 체크, 날짜순 정렬)
- `removeFakeSms()` — source가 'import'가 아닌 항목 제거
- `clearAllExpenses()` — 가계부 데이터 전체 삭제

**클라이언트(sync.js)와의 연결:**

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

**이 파일을 업로드해야 할 때:** SMS 파싱 규칙 변경, 새 action 추가, 동기화 로직 수정, 카테고리 매칭 변경, 카드 매핑 추가

---

### js/app.js (~120줄)
**역할:** 인증, 앱 초기화, 진입점.

**인증:**
- `GOOGLE_CLIENT_ID`, `ALLOWED_EMAIL`
- `handleCredentialResponse(response)` — 구글 로그인 콜백

**초기화:**
- `window.onload` — 인증 체크 → showApp
- `showApp()` — DB 로드 → 모의 데이터 → init → 앱 표시. 태블릿 topbar-fixed 처리, 리사이즈 핸들러
- `init()` — 렌더링 초기화, 이벤트 등록, 초기 문서 로드

**지도 모달:**
- `LOCATIONS` — 위치 프로필 (gio, soyeon)
- `openLocationModal(key)`, `closeLocationModal()`, `onLocationOverlayClick(e)`

**이 파일을 업로드해야 할 때:** 초기화 순서 변경, 인증 수정, 새 init 단계 추가

---

### js/gesture.js (수정 금지)
**역할:** 모바일/태블릿/PC 스와이프 제스처.

**함수 (참고용, 수정 불가):**
- `setupGesturesAndUI()` — 모바일 스와이프
- `setupSwipeActions()` — 리스트 아이템 좌 스와이프 (pin/del)
- `setupTabletPCGestures()` — 태블릿+PC 패널 스와이프

**제스처가 사용하는 CSS 클래스:** `view-side`, `view-list`, `view-editor`, `tablet-side-open`, `tablet-list-closed`, `sidebar-closed`, `list-closed`, `gesture-active`, `gesture-animating`

**이 파일은 절대 읽지도, 수정하지도 않는다.**

---

### style.css (~3,000줄)
**역할:** 전체 스타일. 미디어쿼리 기반 반응형.

**주요 섹션 (순서대로):**
1. `:root` 변수, 리셋
2. 로그인/로딩 화면
3. PC 레이아웃 (.app, .side, .list-panel, .editor)
4. 사이드바 (어구, 글쓰기 메뉴, **`.side-arrow` 통합 화살표**, 루틴, 기록 통계)
5. 리스트 패널 (lp-hdr, lp-item, 사진 그리드, 캘린더)
6. 에디터 (topbar, 툴바, ed-body, 서식, 플로팅 툴바)
7. 이미지 컨텍스트/리사이즈, 모달
8. 태블릿 미디어쿼리 (769px~1400px) — 다크 사이드바, 고정 패널, 제스처 클래스
9. 모바일 미디어쿼리 (~768px) — 풀스크린 패널, 다크 사이드바, FAB
10. PC 미디어쿼리 (1401px~) — 3단 레이아웃, 다크 사이드바
11. 루틴 카드/스트릭/월간/캘린더 뷰
12. 가계부 (사이드바 컴팩트, 대시보드, 폼, 타임라인, 모달, 풀 대시보드)
13. 가계부 캘린더 선택 효과
14. 루틴 캘린더 뷰 (.rc-*)
15. 가로 모드 차단
16. PC/태블릿 캘린더 폰트/선택 효과 강화

**선택자 위치 참조:**
- `.exp-week-*`, `.exp-month-*`, `.exp-bar-*`, `.exp-tl-*`, `.exp-cat-*` → 12번 가계부
- `.exp-fp-*` (`.exp-fp-overlay`, `.exp-fp-card`, `.exp-fp-header`, `.exp-fp-body`, `.exp-fp-footer`) → 12번 가계부 플로팅 팝업
- `.exp-mr-*` (`.exp-mr-list`, `.exp-mr-row`, `.exp-mr-info`, `.exp-mr-bar-wrap`, `.exp-mr-amount` 등) → 12번 상호별 랭킹 카드
- `.exp-yearly-*` (`.exp-yearly-section`, `.exp-yearly-bubble-wrap`, `.exp-yearly-bubble`, `.exp-yearly-rank-list`, `.exp-yearly-rank-row`, `.exp-yearly-rank-num`, `.exp-yearly-rank-icon`, `.exp-yearly-rank-name`, `.exp-yearly-rank-amount`, `.exp-yearly-grid`, `.exp-yearly-grid-item`, `.exp-yearly-header`, `.exp-yearly-title` 등) → 12번 연간 누적 섹션
- `.exp-fp-yearly-*` (`.exp-fp-yearly-list`, `.exp-fp-yearly-row`, `.exp-fp-yearly-rank`, `.exp-fp-yearly-amount` 등) → 12번 연간 전체 보기 팝업 내부
- `.exp-day-selected`, `.exp-day-detail` → 13번 가계부 캘린더 선택
- `.rc-*` → 14번 루틴 캘린더 뷰
- `.chk-*`, `.streak-*`, `.routine-*`, `.monthly-*`, `.rhythm-*` → 4번 사이드바 루틴~기록
- `.lp-*`, `.photo-*`, `.cal-*` → 5번 리스트 패널
- `.ed-*`, `.tb-*`, `.ft-*` → 6번 에디터
- `.side-menu`, `.side-arrow`, `.tab-color-dot` → 4번 사이드바 글쓰기 메뉴

**이 파일을 업로드할 때:** 0번의 "style.css 업로드 전략"을 따른다.

---

### index.html (~400줄)
**역할:** DOM 구조.

**주요 구조:**
```
#mainApp
  ├── .side (사이드바)
  │     ├── .side-hdr (브랜드, 동기화)
  │     └── .side-scroll
  │           ├── .quote-section (오늘의 어구)
  │           ├── .side-nav > #sideNav (글쓰기 탭 메뉴)
  │           ├── .routine-full / .routine-compact (루틴)
  │           ├── .expense-compact (가계부)
  │           └── .stats-wrap (기록 통계)
  │
  ├── .list-panel
  │     ├── .lp-hdr (사이드바 토글, 뷰스위처, 검색)
  │     ├── #pane-routine (루틴 상세)
  │     ├── #pane-list, #pane-photo, #pane-calendar
  │     ├── #pane-expense-dashboard, #pane-expense-detail
  │     └── .fab-btn
  │
  └── .editor
        ├── .ed-topbar (뒤로가기, 탭라벨, Aa, 더보기, 새글)
        ├── #aaDropdownMenu (Aa 서식)
        ├── #edToolbar (PC 서식 툴바)
        ├── #editorText (일반 문서 — edTitle + edBody + ed-foot)
        ├── #editorBook (서재 — book-title/author/publisher/pages + book-body)
        ├── #editorQuote (어구 — quote-by + quote-body)
        ├── #editorMemo (메모 — memo-title + memo-body)
        ├── #editorDayList (캘린더 날짜별 리스트)
        ├── #editorRoutineCal (미사용)
        ├── #editorRoutineDetail (루틴 캘린더 뷰)
        ├── #editorExpense (가계부 폼 — 모바일)
        └── #expenseFullDashboard (가계부 풀 대시보드 — PC/태블릿)
            ├── #expFullDashboardPane (A. 대시보드)
            └── #expFullDetailPane (B. 전체 내역)

#expenseModalOverlay (가계부 입력 모달 — PC/태블릿)
#modalOverlay (위치 모달)
```

**에디터 하위 패널:** 한 번에 하나만 표시. `switchTab()`에서 관리.

**이 파일을 업로드해야 할 때:** DOM 구조 확인, 새 패널/모달 추가, ID/클래스 확인

---

## 9. 주요 흐름 참고

### 탭 전환 흐름
`switchTab(탭이름)` → 이전 탭 저장 → 에디터 패널 표시/숨김 → pane 표시/숨김 → 레이아웃 클래스 조정 → 데이터 로드 → 리스트 렌더링

### 문서 로드 흐름
리스트 항목 클릭 → `loadDoc(type, id)` / `loadBook(id)` / `loadQuote(id)` / `loadMemo(id)` → 에디터 필드에 값 반영 → `renderListPanel()` → 모바일이면 `setMobileView('editor')`

### 자동 저장 흐름
에디터 입력 → 800ms 디바운스 → 로컬 저장 → DB 동기화(3초 디바운스) + 문서 동기화(5초 디바운스) → GAS 동기화

### 가계부 흐름 (현재 패턴)
사이드바 클릭 → `switchTab('expense')` → PC/태블릿: `expenseFullDashboard` 표시 + `renderExpenseDashboard('pc')` / 모바일: `pane-expense-dashboard` 표시 + `renderExpenseDashboard('mobile')` → "내역 더 보기" 클릭 → 전체 내역 표시

### SMS 가계부 자동 반영 흐름
iOS 단축어가 카드 문자 수신 → GAS `saveExpenseFromSMS` 호출 → `app_database.json`에 expense 추가 → 앱이 포그라운드 복귀 시 `visibilitychange` → `SYNC.mergeServerExpenses()` → 서버 expenses를 ID 기준으로 LocalStorage와 병합 → 가계부 탭이면 대시보드 리렌더

---

## 10. 작업지시서 작성 시 주의사항

### 변경 최소화
요청받은 범위만 수정하는 Step을 작성한다. "이왕 하는 김에" 다른 부분을 개선하는 Step을 넣지 않는다.

### 기존 코드 스타일 유지
변수명, 들여쓰기, 함수 선언 방식 등 기존 코드의 스타일을 따르는 코드를 작성한다. 더 나은 스타일이 있더라도 기존 코드와 다르면 기존 방식을 따른다.

### 각 Step에 충분한 컨텍스트 포함
Haiku 4.5는 전체 프로젝트 맥락을 알지 못할 수 있다. 각 Step에 "이 함수는 현재 이런 일을 하고 있고, 여기에 이것을 추가/수정한다"는 맥락을 포함한다.

### 에디터 서브 패널 복원 규칙

`switchTab()`에서 특정 탭 진입 시 에디터 서브 패널(editorText, editorBook, editorQuote, editorMemo, editorExpense, editorDayList, expenseFullDashboard 등)의 display를 직접 변경하는 경우, **반드시 else 블록(다른 탭으로 전환 시)에서 해당 패널을 숨기고 현재 탭에 맞는 패널을 복원하는 코드를 포함해야 한다.**

에디터 서브 패널은 한 번에 하나만 표시되어야 하며(13번 참조), `loadDoc`/`loadBook`/`loadMemo`/`loadQuote` 등의 함수는 에디터 패널 전환을 수행하지 않는다. 따라서 `switchTab`의 else 블록이 유일한 복원 지점이다.

**체크리스트 — 새 탭이 에디터 패널을 조작할 때:**
1. 진입 시 켠 패널을 else 블록에서 끄는가?
2. 진입 시 끈 패널(editorText 등)을 else 블록에서 현재 탭에 맞게 복원하는가?
3. 진입 시 숨긴 UI(toolbar, Aa버튼, 더보기버튼, FAB 등)를 else 블록에서 복원하는가?

### 코드 블록 포함
각 Step의 작업 내용에 Haiku가 그대로 적용할 수 있는 구체적인 코드 블록을 포함한다. 설명만 있고 코드가 없는 Step은 Haiku가 잘못 해석할 수 있다.

### SVG 차트 작성 시 주의
- SVG의 viewBox 비율과 CSS가 결정하는 실제 렌더링 영역 비율이 일치해야 한다. 불일치하면 `preserveAspectRatio` 기본값(meet)이 좌우 또는 상하에 여백을 만든다.
- 차트가 컨테이너를 꽉 채워야 하면 `preserveAspectRatio="none"`을 사용하고, CSS에서 `height: auto; aspect-ratio: [viewBox 비율]`로 맞춘다.
- CSS에서 `height`를 px로 강제(`!important` 포함)하면 viewBox 비율과 충돌할 수 있다. 높이 고정이 필요하면 viewBox 비율도 그에 맞춰야 한다.
- `maxY` 계산 시, 아직 데이터가 없는 미래 날짜의 값을 포함하면 그래프가 바닥에 깔린다. 현재 시점까지의 데이터만으로 스케일을 잡는다.

### 가계부 탭 뷰 스위처 숨김 규칙

가계부 탭(`expense`)에서는 `lp-hdr`의 뷰 스위처(리스트/사진/캘린더 아이콘)와 검색 버튼이 표시되면 안 된다. 가계부는 자체 대시보드/상세 뷰를 사용하며, 일반 탭의 리스트/사진/캘린더 전환과 무관하다.

**근본 원인:** gesture.js(수정 금지)의 모바일 스와이프 touchend 핸들러가 에디터→리스트 전환 성공 시, 탭 종류를 확인하지 않고 `viewSwitcher.style.display = 'flex'`를 설정한다. `switchTab('expense')`에서 `display: none`으로 숨겨도 gesture.js의 `setTimeout` 콜백이 이후에 실행되면서 다시 노출한다.

**해결 방식:** `.list-panel.expense-active .view-switcher { display: none !important; }`로 gesture.js의 인라인 스타일을 CSS `!important`로 덮어쓴다. `switchTab()`에서 가계부 진입 시 `.list-panel`에 `expense-active` 클래스를 추가하고, 다른 탭 전환 시 제거한다.

**체크리스트 — switchTab/setMobileView/renderListPanel/gesture.js 관련 코드를 수정할 때:**
1. `.list-panel`의 `expense-active` 클래스 추가/제거가 유지되는가?
2. CSS의 `!important` 규칙이 삭제되거나 덮어쓰여지지 않았는가?
3. 가계부 탭이 아닌 다른 탭으로 전환 시 `expense-active` 클래스가 정상 제거되는가?
4. 새로운 탭이 추가될 때 `switchTab()`의 else 블록에서 `expense-active` 제거가 실행되는가?

### 사이드바 화살표(›) 규칙
사이드바의 모든 화살표(글쓰기 메뉴, 루틴, 가계부)는 **`.side-arrow` SVG 클래스**를 통일해서 사용한다. 개별 클래스(`wi-arrow`, `routine-compact-arrow`, `expense-compact-arrow` 등)는 사용하지 않는다.
- HTML: `<svg class="side-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`
- CSS (style.css 기본): `.side-arrow { width: 20px; height: 20px; flex-shrink: 0; stroke: var(--tx-hint); stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }`
- CSS (다크 사이드바, 각 미디어쿼리): `.side .side-arrow { display: block; stroke: rgba(255,255,255, .25); }`
- 개별 화살표 클래스는 완전히 제거한다.

**정렬 기준점 주의:** `.side-arrow`는 `position: absolute; right: 14px`으로 부모 기준 배치된다. 글쓰기 메뉴(`.side-menu`)는 `.side-nav` 안에 있고, `.side-nav`에 인라인 `padding: 8px 12px 12px`이 있어 실제 사이드바 우측 끝에서 `14px + 12px = 26px` 위치에 화살표가 표시된다. 반면 루틴(`.routine-compact`)과 가계부(`.expense-compact`)는 좌우 패딩 0인 `.sec` 안에 있어 `right: 14px`이 곧 사이드바 끝에서 14px이다. 이 차이를 보정하기 위해 `.routine-compact .side-arrow, .expense-compact .side-arrow { right: 26px }`이 적용되어 있다.

**사이드바 항목 수정 시 반드시 확인:** `.side-nav`의 패딩을 변경하거나, 루틴/가계부의 부모 `.sec`의 패딩을 변경하거나, `.side-arrow`의 `right` 값을 변경할 때는 **8개 화살표 전체의 수평 정렬**이 유지되는지 확인해야 한다. 새로운 사이드바 항목에 `.side-arrow`를 추가할 때도 부모의 패딩 구조에 따라 `right` 값 보정이 필요할 수 있다.

### GAS 코드 수정 시 주의사항

- Code.gs의 `parseSMSServer()`와 클라이언트 `sms-parser.js`의 `parseSMS()`는 **같은 로직의 서버/클라이언트 버전**이다. 한쪽을 수정하면 다른 쪽도 동일하게 수정해야 한다. 작업지시서에 양쪽 수정 Step을 모두 포함한다.
- Code.gs의 `autoMatchCategoryServer()`와 `sms-parser.js`의 `autoMatchCategory()`도 마찬가지다.
- GAS 함수 내부의 스프레드시트 ID, 폴더명 등 상수를 변경할 때는 실제 구글 드라이브의 리소스와 일치하는지 확인하는 안내를 Step에 포함한다.
- `LockService`를 사용하는 함수(`saveDocument`, `saveRoutineToSheet`, `saveExpenseFromSMS`)를 수정할 때는 `finally` 블록의 lock 해제가 유지되는지 확인한다.
- Code.gs는 메인 레포의 Git 관리 대상이 아니다. Code.gs 변경 사항은 `clasp push`로만 배포하며, Git 커밋 메시지에 Code.gs 변경 내용을 포함하지 않는다.

---

## 11. 코드 비대화 방지 규칙

### 함수 크기 제한
렌더 함수가 80줄을 넘으면, 독립된 하위 함수로 분리한다. 새 섹션을 추가할 때는 반드시 별도 렌더 함수로 만든다.

### 플랫폼 분기 통합
같은 로직의 모바일/PC 버전 함수가 존재하면, 정리 작업으로 하나의 함수에 `platform` 매개변수를 받는 형태로 통합한다.

### 중복 함수 탐지
작업지시서를 작성하기 전에, 추가하려는 기능과 유사한 기존 함수가 있는지 반드시 파일별 상세 맵에서 확인한다.

### CSS 증가 억제
새 컴포넌트의 CSS를 추가할 때, 기존 컴포넌트의 클래스를 재사용할 수 있는지 먼저 확인한다.

### 정리 부채 기록
기능 추가 작업지시서에서 중복 코드를 발견하면, 하단에 "정리 부채" 항목으로 기록한다.

---

## 12. 전역 상태 변수 목록

| 변수명 | 파일 | 역할 |
|---|---|---|
| activeTab | data.js | 현재 선택된 탭 |
| curIds | data.js | 텍스트 탭별 현재 문서 ID |
| curBookId | data.js | 현재 편집 중인 책 ID |
| curQuoteId | data.js | 현재 편집 중인 어구 ID |
| curMemoId | data.js | 현재 편집 중인 메모 ID |
| curExpenseId | editor.js | 현재 편집 중인 가계부 항목 ID |
| currentLoadedDoc | data.js | 에디터에 로드된 문서 {type, id} |
| currentSearchQuery | data.js | 현재 검색어 |
| currentListView | data.js | 리스트 뷰 모드 (list/photo/calendar) |
| _expenseViewYM | ui-expense.js | 가계부에서 보고 있는 월 |
| _selectedExpenseDate | ui-expense.js | 가계부 캘린더 선택 날짜 |
| _expenseCategoryFilter | ui-expense.js | 가계부 카테고리 필터 ID |
| _expenseCategoryFilterName | ui-expense.js | 가계부 카테고리 필터 이름 |
| _expenseDetailSearchQuery | ui-expense.js | 가계부 전체 내역 검색어 |
| _prefetchedClipboard | ui-expense.js | 클립보드 사전 읽기 텍스트 (사용 후 null 초기화) |
| _routineViewYM | routine-cal.js | 루틴 캘린더 보고 있는 월 |
| _selectedRoutineDate | routine-cal.js | 루틴 캘린더 선택 날짜 |
| contextItemId | ui.js | 꾹누르기 팝업 대상 항목 ID |
| contextItemType | ui.js | 꾹누르기 팝업 대상 항목 타입 |
| selectedPhotoId | ui.js | 사진 뷰 선택 항목 ID |
| imgCtxTarget | editor.js | 이미지 컨텍스트 메뉴 대상 |
| savedSelection | editor.js | 플로팅 툴바 텍스트 선택 범위 |

---

## 13. 에디터 패널 규칙

editor 영역 안에 다음 하위 패널이 있다. 한 번에 하나만 표시한다.

- editorText — 일반 문서 (navi/fiction/blog)
- editorBook — 서재
- editorQuote — 어구
- editorMemo — 메모
- editorExpense — 가계부 입력 폼 (모바일)
- editorDayList — 캘린더 날짜별 다중 항목 리스트
- editorRoutineCal — (미사용)
- editorRoutineDetail — 루틴 상세 분석
- expenseFullDashboard — 가계부 풀 대시보드 (PC/태블릿)

새 패널을 추가할 때는 반드시 다른 패널을 모두 숨기는 코드를 포함한다.

---

## 14. 핵심 함수 호출 체인

### switchTab(t)
```
→ saveCurDoc() (이전 탭 저장)
→ applyTabColor(), updateEdTabLabel()
→ clearSearch(), hideRoutineCard()
→ [가계부] 패널/레이아웃 전환 → renderExpenseDashboard()
→ [일반 탭] 레이아웃 복원 → switchListView('list') → setMobileView('list') → loadDoc/Book/Memo
→ renderListPanel()
```

### renderListPanel()
```
→ renderWritingGrid()
→ 현재 탭 데이터 조회 + 검색 필터
→ currentListView에 따라: photo→renderPhotoView() / calendar→renderCalendarView()
→ pinned 우선 정렬 → generateItemHtml() → pane-list innerHTML
```

### loadDoc(type, id)
```
→ 중복 로드 체크 → curIds 갱신 → 에디터 필드 반영 → updateWC() → updateMetaBar() → renderListPanel()
```

### setMobileView(view)
```
→ 태블릿: tablet-side-open / tablet-list-closed 토글
→ PC: sidebar-closed / list-closed 토글
→ 모바일: view-side / view-list / view-editor 전환
→ view==='list'이면 renderListPanel()
```

---

## 15. 데이터 스키마

### 문서 (K.docs)
```
{ id, driveId, type, title, tags, content, location, weather, lat, lng, created, updated, pinned }
```

### 책 (K.books)
```
{ id, driveId, title, author, publisher, pages, memo, date, pinned }
```

### 어구 (K.quotes)
```
{ id, text, by, created, pinned }
```

### 메모 (K.memos)
```
{ id, driveId, title, tags, content, created, updated, pinned }
```

### 가계부 (K.expenses)
```
{ id, amount, category, merchant, card, memo, date, time, created, source }
```

### 루틴 체크 (K.checks)
```
{ "YYYY-MM-DD": { exercise: true, vitamin: false, ... } }
```

---

## 16. 동기화 호출 규칙

데이터 변경 후 반드시 동기화를 호출한다.

- 삭제: 함수 내부에서 `SYNC.scheduleDatabaseSave()`
- 자동저장: 800ms → 로컬 → 3초 DB → 5초 문서
- 수동저장 (togglePin 등): `SYNC.scheduleDatabaseSave()`
- 루틴: 1.2초 디바운스 → `SYNC.saveChecksToSheet()` + `scheduleDatabaseSave()`
- 가계부: `saveExpenseForm` 내부에서 `SYNC.scheduleDatabaseSave()`
- SMS 자동 반영: `visibilitychange(visible)` → `SYNC.mergeServerExpenses()` → 서버 expenses를 LocalStorage에 병합

---

## 17. 이벤트 핸들러 등록 규칙

- 동적 생성 요소 (리스트 아이템, 사이드바 메뉴, 캘린더 셀): HTML onclick 인라인
- 고정 요소 (에디터 본문, 붙여넣기): `init()`에서 addEventListener
- 전역 이벤트 (click 바깥 닫기, Escape): 해당 JS 파일 하단에서 document.addEventListener

---

## 18. 영향 범위 분석 규칙

### 변경 전 시뮬레이션 질문

1. 이 변경이 영향을 주는 전역 변수는 무엇인가?
2. 그 전역 변수를 읽는 다른 함수는 어디에 있는가?
3. switchTab, renderListPanel, loadDoc가 기존대로 동작하는가?
4. 모바일/태블릿/PC 세 환경 모두 영향이 같은가?

### 고위험 함수 (수정 시 전체 테스트)
- `switchTab()`, `renderListPanel()`, `setMobileView()`, `setupAutoSave()`, `init()`

### 중위험 함수 (해당 기능 테스트)
- `renderExpenseDashboard()`, `showRoutineCalendarView()`, `loadDoc/Book/Memo/Quote()`, `generateItemHtml()`, `toggleEditorMenu()`, `toggleAaMenu()`

---

## 19. 자주 겪는 실수 체크리스트

작업지시서 작성 전 해당 항목을 확인한다.

- [ ] switchTab의 else 블록에서 패널/UI 복원을 빠뜨리지 않았는가? (10번 "에디터 서브 패널 복원 규칙")
- [ ] gesture.js가 인라인 스타일로 덮어쓰는 요소를 CSS !important 없이 제어하려 하지 않았는가? (10번 "가계부 탭 뷰 스위처 숨김 규칙")
- [ ] .side-arrow의 right 값이 부모 패딩 구조와 맞는가? (10번 "사이드바 화살표 규칙")
- [ ] 그리드 gap으로 인해 border가 끊어지는 곳은 없는가? (래퍼로 감싸서 해결)
- [ ] SVG viewBox 비율과 CSS 렌더링 영역 비율이 일치하는가? (10번 "SVG 차트 작성 시 주의")
- [ ] 미디어쿼리 3곳(모바일/태블릿/PC) 모두 확인했는가?
- [ ] 캘린더 선택 효과(::before 카드) 수정 시: (1) 가계부(.exp-month-day/.exp-week-day)와 루틴(.rc-day)은 셀 콘텐츠가 달라 카드 크기가 다르다. (2) 모바일(inset 방식)과 PC/태블릿(고정 크기 방식)도 별도 규칙이다. 한 곳만 수정하면 나머지 3곳이 깨질 수 있다.
- [ ] 모바일 스트릭 그리드(`.streak-list`)가 3열(`repeat(3, 1fr)`)을 유지하는가? `auto-fill`이나 `minmax`로 변경하면 패딩에 따라 4열이 되어 텍스트가 넘칠 수 있다.

---

## 20. 이 문서 자체의 관리

이 문서는 프로젝트의 네비게이션 맵이다. 코드와 문서가 어긋나면 AI가 잘못된 판단을 한다.

**갱신 시점:** 모든 작업지시서의 마지막 Step에서 해당 사항이 있으면 이 문서를 갱신한다 (2번 "WORKFLOW.md 갱신 규칙" 참조).

**갱신 대상:**
- 프로젝트 구조가 바뀌면 → 7번, 8번
- 전역 변수가 추가/삭제되면 → 12번
- 데이터 스키마가 변경되면 → 15번
- 주요 흐름이 바뀌면 → 9번, 14번
- 새 파일이 추가되면 → 7번, 8번

---

## 변경 로그

| 날짜 | 변경 내용 |
|---|---|
| 2026-03-09 | 19번 자주 겪는 실수 체크리스트 추가, 방향 확인서에 관련 기존 규칙 항목 추가, 렌더 함수 HTML 구조(8번) 추가, CSS 선택자 인덱스(8번) 추가, 변경 로그 추가 |
| 2026-03-10 | GAS 배포 규칙 추가: 7번 파일 구조에 gas-nametag 추가, 8번 상세 맵에 Code.gs 추가, 0번 업로드 기준에 GAS 행 추가, 2번에 GAS 배포 규칙/템플릿 추가, 10번에 GAS 수정 주의사항 추가 |
| 2026-03-10 | 가계부 PC/태블릿 대시보드 레이아웃 개편: renderExpenseDashboard 재구성(요약/캘린더/2열+막대+연간), renderMerchantRanking 개선(1위빨강/태그회색/태그팝업), renderMonthlyBarChart 예상금액추가, renderYearlySection 재구성(순위/같은행/더보기), openCategoryExpensePopup/_renderYearlyGridItem/_loadMoreYearly/_yearlyLoadedCount 추가, 막대두께8px/태그스타일/금액정규화/그리드2열/모바일조정 CSS 변경 |
| 2026-03-11 | 연간 누적 섹션 교체: 리스트+바 → 버블 차트(circle packing)+랭킹 리스트(뉴트럴 그라데이션). _packCircles/_renderYearlyBubbles/_renderYearlyRankList 추가, _renderYearlyListItem/_loadMoreYearly/_yearlyLoadedCount 제거, renderYearlySection 전면 교체, CSS 버블/랭킹 스타일 추가, 8번/12번 WORKFLOW.md 갱신 |
| 2026-03-11 | 가계부/루틴 월 네비 데이터 없는 월 이동 차단: data.js에 getOldestExpenseYM/getOldestRoutineYM/hasExpenseDataInMonth/hasRoutineDataInMonth 추가, changeExpenseMonth/renderExpenseMonthNav/openMonthPicker/selectMonth에 데이터 유무 체크 추가, changeRoutineMonth/renderRoutineMonthNav/openRoutineMonthPicker/pickRoutineMonth에 동일 체크 추가, 월 피커에서 데이터 없는 월 회색 비활성 표시 |
| 2026-03-11 | 모바일 가계부 새 항목 진입 시 클립보드 자동 파싱: prefetchClipboardForExpense 추가, handleNew에서 가계부 탭 진입 시 호출, pasteFromClipboard에서 사전 읽기 텍스트 우선 사용, _prefetchedClipboard 전역 변수 추가 |
| 2026-03-11 | 캘린더 선택 효과 ::before 카드 방식 완성: exp-month-day/exp-week-day/rc-day의 scale(1.2) 제거 및 ::before 통일, today 선택 시 떠오름 해제(has 선택자), PC/태블릿에서 정사각형(68px) 고정 크기로 제한, 19번 체크리스트에 분기 주의사항 추가 |
| 2026-03-11 | 루틴 주간 날짜 표시 수정(getMonth()+1 우선순위), 미래 날짜 체크 차단, 연속 기록 계산 개선(현재+이번주최장+전체최장) |
| 2026-03-11 | 사이드바 글쓰기 메뉴 화살표→글 개수 표시, 가계부 화살표 제거, 19번 체크리스트에 badge-pill/캘린더 선택 효과 주의사항 추가 |
| 2026-03-11 | PC/태블릿 사이드바 오늘의 어구 표시 복원 (모바일만 숨김) |
| 2026-03-11 | 10번 사이드바 화살표 규칙에 예외 추가 (글쓰기 메뉴→글 개수, 가계부→금액만 표시, 화살표 숨김) |
| 2026-03-11 | 사이드바 화살표/글 개수 변경 롤백 — 원래 상태(전체 화살표 + badge-pill 숨김)로 복원, 10번/19번 관련 항목 제거 |
| 2026-03-11 | 모바일 스트릭 그리드 3열 복원, 19번 체크리스트에 스트릭 그리드 보호 규칙 추가 |
```
