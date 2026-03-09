

```markdown
# WORKFLOW.md — 이름표 프로젝트 작업 가이드

## 이 문서의 용도

이 문서는 AI가 코드 수정 요청을 받았을 때 따라야 하는 규칙이다.

**작업 흐름 요약**

1. 사용자가 이 문서 + 필요한 파일들을 업로드하고 수정 요청을 보낸다.
2. AI는 이 문서를 읽고 요청을 분석한다.
3. AI는 업로드된 파일들을 참조하거나 추가 파일 업로드를 요청한다.
4. AI는 영향 범위 분석을 수행한다 (18번 참조).
5. AI는 Haiku 4.5가 한 단계씩 실행할 수 있는 작업지시서를 출력한다.
6. 사용자가 작업지시서를 VS Code 에이전트에 복사해서 실행한다.

---

## 0. 작업 흐름 (직접 업로드 방식)

### 프로토콜

**턴 1 (사용자):** 이 문서 + 필요한 파일들 업로드 + 수정 요청

**턴 2 (AI):**
1. 이 문서를 읽고 요청을 분석한다.
2. "파일별 상세 맵"(8번), "전역 상태 변수 목록"(12번), "핵심 함수 호출 체인"(14번)을 참조하여 필요한 파일을 판단한다.
3. 업로드된 파일들을 검토하거나 누락된 파일을 요청한다.
4. 영향 범위 분석을 수행한다 (18번).
5. 작업지시서를 출력한다.

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
```

---

## 8. 파일별 상세 맵

### js/storage.js (~400줄)
**역할:** 앱의 기반 유틸리티. 다른 모든 JS보다 먼저 로드된다.

**전역 상수:**
- `APP_TOKEN` — 동기화 인증 토큰
- `K` — LocalStorage 키 객체 (docs, checks, books, quotes, memos, expenses)
- `EXPENSE_CATEGORIES` — 가계부 카테고리 배열 [{id, name, color, bg}, ...]
- `MERCHANT_LOGOS` — 매출처→도메인 매핑 (파비콘 로고용)

**유틸 함수:**
- `L(key)` / `S(key, val)` — LocalStorage 읽기/쓰기
- `today()`, `getLocalYMD(date)`, `getWeekDates()` — 날짜 유틸
- `formatFullDate(iso)`, `formatTimeOnly(iso)`, `getMonthYearStr(iso)` — 날짜 포맷
- `stripHtml(s)` — HTML 태그 제거
- `fixDriveImageUrls(html)` — 구글 드라이브 이미지 URL 변환
- `buildDocContent(doc)` — 문서 내용 + 메타 문자열 생성
- `formatAmount(n)`, `formatAmountShort(n)` — 금액 포맷 (만원 단위)
- `getMerchantLogoUrl(merchant)` — 매출처명 → 파비콘 URL

**모의 데이터:**
- `injectMockData()` — 문서/책/어구/메모/루틴 더미 데이터
- `injectExpenseMockData()` — 가계부 6개월치 더미 데이터

**이 파일을 업로드해야 할 때:** 새 카테고리 추가, 날짜 포맷 변경, 데이터 스키마 변경, 새 LocalStorage 키 추가

---

### js/data.js (~350줄)
**역할:** 모든 데이터 타입의 CRUD + 통계.

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
- `getMonthlyTrend()`, `getMonthlyTrendAround(centerYM)` — 월별 추이

**기타:** `getTabCount(t)`, `updateWritingStats()`, `updateBookStats()`, `showRandomQuote()`, `togglePin(type, id, e)`

**이 파일을 업로드해야 할 때:** 새 데이터 타입 추가, CRUD 함수 수정, 통계 로직 변경, 검색/정렬 변경

---

### js/ui.js (~750줄)
**역할:** 탭 전환, 리스트/사진/캘린더 뷰 렌더링, 팝업 메뉴, 네비게이션.

**탭 전환:**
- `TAB_COLORS` — 탭별 색상 (현재 미사용, 단일 색상 #E55643 적용)
- `applyTabColor(tabId)` — CSS 변수 `--tab-color` 설정
- `switchTab(t, keepLayout)` — **핵심 함수**. 모든 탭 전환의 진입점. 에디터 패널 전환, pane 표시/숨김, 레이아웃 클래스 조정, 데이터 로드 포함
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

**상수/헬퍼:**
- `CATEGORY_ICONS` — 카테고리별 SVG 아이콘 매핑
- `getCategoryIcon(item)`, `getCategoryBg(item)` — 아이콘/배경색 조회
- `getMerchantIconHtml(item)` — 매출처 로고(파비콘) 또는 카테고리 아이콘 HTML
- `_faviconFallback(el, item)` — 파비콘 로드 실패 시 카테고리 아이콘으로 대체
- `updateExpenseCompact()` — 사이드바 가계부 금액 업데이트

**대시보드 A (renderExpenseDashboard):**
- `renderExpenseDashboard(platform)` — 'pc'|'mobile'. 요약+차트+카테고리+예상+주간캘린더+타임라인
- `renderCumulativeChart(ym)` — 누적 곡선 SVG
- `renderMonthlyBarChart(trend)` — 월별 막대 차트
- `renderWeeklyCalendar(ym)` — 주간 캘린더 그리드
- `renderRecentExpenses(ym)` — 최근 7일 타임라인
- `renderCategoryChart(catBreakdown)` — 카테고리별 수평 바 차트 (상위 4개 표시 + 더보기 + 행 클릭 시 openCategoryDetail)
- `toggleCategoryMore(btn)` — 카테고리 더보기/접기 토글
- `openCategoryDetail(catId, catName)` — 카테고리 클릭 → 화면B 진입 및 필터 설정
- `clearCategoryFilter()` — 카테고리 필터 초기화
- `renderCategoryBarCompact(catBreakdown, total)` — 스택 바

**전체 내역 B:**
- `showExpenseFullDetail(ym)` — PC: B 표시, A 숨김
- `showExpenseFullDetailMobile(ym)` — 모바일: B 표시
- `renderExpenseFullDetail(ym)` — PC B 렌더
- `renderExpenseFullDetailMobile(ym)` — 모바일 B 렌더
- `renderMonthCalendar(ym)` — 월간 캘린더 그리드
- `renderExpenseTimeline(ym, useModal)` — 타임라인
- `renderExpenseFullTimeline(ym, query)` — 검색/필터 적용 타임라인

**A↔B 전환:**
- `showExpenseDashboardFromDetail()` — PC: B→A
- `showExpenseDashboardFromDetailMobile()` — 모바일: B→A

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

**이 파일을 업로드해야 할 때:** 루틴 캘린더 UI 변경, 루틴 통계 차트 수정

---

### js/sms-parser.js (~80줄)
**역할:** 카드 결제 문자(SMS) 파싱 → 가계부 자동 입력.

**함수:**
- `parseSMS(text)` — 문자열 → {amount, merchant, card, date, time, category}
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
- `saveChecksToSheet(dateStr, checkData)` — 루틴 → 스프레드시트
- `scheduleBookSave(book)`, `saveBooksToSheet(book)` — 책 → 드라이브
- `scheduleQuoteSave(text, by, id)`, `saveQuotesToSheet(text, by)` — 어구 → 스프레드시트
- `syncAll()` — 전체 동기화

**이 파일을 업로드해야 할 때:** 동기화 로직 변경, 새 데이터 타입 동기화 추가

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
4. 사이드바 (어구, 글쓰기 메뉴, 루틴, 기록 통계)
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

---

## 10. 작업지시서 작성 시 주의사항

### 변경 최소화
요청받은 범위만 수정하는 Step을 작성한다. "이왕 하는 김에" 다른 부분을 개선하는 Step을 넣지 않는다.

### 기존 코드 스타일 유지
변수명, 들여쓰기, 함수 선언 방식 등 기존 코드의 스타일을 따르는 코드를 작성한다. 더 나은 스타일이 있더라도 기존 코드와 다르면 기존 방식을 따른다.

### 각 Step에 충분한 컨텍스트 포함
Haiku 4.5는 전체 프로젝트 맥락을 알지 못할 수 있다. 각 Step에 "이 함수는 현재 이런 일을 하고 있고, 여기에 이것을 추가/수정한다"는 맥락을 포함한다.

### 코드 블록 포함
각 Step의 작업 내용에 Haiku가 그대로 적용할 수 있는 구체적인 코드 블록을 포함한다. 설명만 있고 코드가 없는 Step은 Haiku가 잘못 해석할 수 있다.

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

## 19. 이 문서 자체의 관리

이 문서는 프로젝트의 네비게이션 맵이다. 코드와 문서가 어긋나면 AI가 잘못된 판단을 한다.

**갱신 시점:** 모든 작업지시서의 마지막 Step에서 해당 사항이 있으면 이 문서를 갱신한다 (2번 "WORKFLOW.md 갱신 규칙" 참조).

**갱신 대상:**
- 프로젝트 구조가 바뀌면 → 7번, 8번
- 전역 변수가 추가/삭제되면 → 12번
- 데이터 스키마가 변경되면 → 15번
- 주요 흐름이 바뀌면 → 9번, 14번
- 새 파일이 추가되면 → 7번, 8번
```
