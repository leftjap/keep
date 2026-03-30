# 데이터 보존 사고 보고서 — keep 프로젝트

- 작성일: 2026-03-30
- 작성자: Claude (AI 어시스턴트)
- 관련 세션: Sentry 도입 + 데이터 동기화 정리

---

## 사고 요약

keep PWA 앱에서 PC와 iOS 간 데이터 동기화 과정에서 두 가지 문제가 발생했다.

1. PC에서 삭제한 문서가 동기화 시 반복적으로 부활
2. iOS PWA 초기 로드 시 빈 문서("제목 없음")가 자동 생성

---

## 문제 1: 삭제한 문서가 동기화 시 부활

### 증상

PC에서 불필요한 문서 11건을 정리했으나, 앱 새로고침 시 서버에서 16건이 다시 내려와 삭제가 무효화되었다.

### 원인 추적 과정

1. localStorage를 콘솔에서 직접 조작하여 5건만 남김
2. 앱 새로고침 → 서버에서 16건 복원됨
3. 콘솔 로그에 `Integrity check failed: docs item(s) missing (6 ids)` 출력
4. GAS Code.js 분석 결과, 서버 무결성 검증이 정상 작동하여 비정상 삭제를 차단한 것으로 확인

### 근본 원인

콘솔에서 localStorage를 직접 조작하면 `_deleted: true` 플래그가 설정되지 않는다. 서버의 `saveDatabase()` 검증 4.5(개별 항목 소실 감지)는 `_deletedIds`에 포함되지 않은 누락 항목을 비정상 소실로 판정한다. 4건 이상 누락 시 저장을 차단하고, 다음 동기화 시 서버 데이터로 로컬을 복원한다.

### 해결

앱 UI의 삭제 기능을 사용하여 정상 삭제를 수행했다.

- `_softDelete()` → `_deleted: true`, `_deletedAt` 타임스탬프 설정
- `saveDatabase()` → `_deletedIds` 배열에 삭제된 ID 포함하여 서버 전송
- 서버는 `_deletedIds`에 포함된 항목을 정상 삭제로 인식 → 저장 허용

### 검증 결과

- PC: navi 5건만 남음 (플레이북, 행동이 뇌를 만든다, 재미, her, 이품)
- iOS PWA: 동일하게 5건만 표시
- Sentry: 새로운 에러 없음

---

## 문제 2: iOS PWA 빈 문서 자동 생성 (B-61)

### 증상

iOS PWA를 열면 navi 탭에 "제목 없음" 빈 문서가 자동 생성되었다. PC에는 없는 문서가 iOS에서만 나타남.

### 근본 원인

`app.js`의 `init()` 함수에서 특정 탭에 문서가 0건일 때 `newDoc()`을 무조건 호출하는 로직이 존재했다.

```javascript
// 문제 코드 (수정 전)
} else {
  var nd = newDoc(initialTab);  // 빈 문서 자동 생성
  loadDoc(initialTab, nd.id, true);
}
```

발생 시나리오:

1. iOS PWA 열기 → `hasLocalData = true` (expenses 존재)
2. 서버 응답 지연 또는 실패
3. `getDocs('navi')` = 빈 배열 (로컬에 navi 문서 없음)
4. `SYNC._dbLoading = false` (서버 응답 완료 또는 에러 처리 후)
5. 마지막 else 분기 → `newDoc()` 실행 → 빈 문서 생성

### 해결

`js/sync.js`에 `_serverLoaded: false` 플래그를 추가하고, `loadDatabase()` 성공 시에만 `true`로 설정했다. `js/app.js`의 `init()` 조건을 확장하여 서버 데이터 미수신 상태에서는 빈 문서를 생성하지 않도록 했다.

```javascript
// 수정 후
} else if (SYNC._dbLoading || (GAS_URL && !SYNC._serverLoaded)) {
  console.log('init: 서버 데이터 수신 전이므로 빈 문서 생성 보류');
  document.getElementById('edTitle').value = '';
  document.getElementById('edBody').innerHTML = '';
} else {
  var nd = newDoc(initialTab);
  loadDoc(initialTab, nd.id, true);
}
```

### 보호 시나리오 검증

| 시나리오 | 결과 |
|---------|------|
| PC 정상 동기화 | 기존대로 정상 ✅ |
| iOS PWA 서버 응답 정상 | 기존대로 정상 ✅ |
| iOS PWA 서버 응답 지연/실패 | 빈 문서 미생성 ✅ |
| 신규 사용자 (서버 데이터 없음) | 빈 문서 정상 생성 ✅ |
| 오프라인 전용 (GAS_URL 없음) | 빈 문서 정상 생성 ✅ |

커밋: `234839b`

---

## 참고: iOS Safari 7일 localStorage 정리 정책

Safari는 7일간 미방문 사이트의 localStorage, IndexedDB, Cache API 데이터를 자동 삭제한다 (WebKit ITP 정책). 홈 화면에 추가된 PWA는 이 정책에서 면제된다. keep 앱의 `showApp()`에 `navigator.storage.persist()` 호출이 존재하며, PWA 설치 시 Safari가 이를 허용한다.

주의사항: Safari 브라우저에서 직접 접속하여 7일 이상 미방문하면 모든 로컬 데이터가 소실된다. keep 앱은 반드시 홈 화면 PWA로 사용해야 한다.

출처: https://webkit.org/blog/14403/updates-to-storage-policy/ , Reddit r/webdev 2026-03-10 사례 보고

---

## 서버 보호 체계 (GAS Code.js saveDatabase)

| 검증 단계 | 내용 | 임계값 |
|----------|------|--------|
| 검증 0 | 전체 데이터 비어있음 차단 | 기존 합계 ≥10이고 신규 합계 = 0 |
| 검증 1 | expenses 건수 급변 | ±50% (기존 ≥50건) |
| 검증 2 | docs 건수 급감 | 50% 미만 (기존 ≥10건) |
| 검증 3 | books 건수 급감 | 50% 미만 (기존 ≥5건) |
| 검증 4 | quotes 건수 급감 | 50% 미만 (기존 ≥10건) |
| 검증 4.5 | 개별 항목 소실 | 1~3건 자동 보정, 4건↑ 차단 |
| 검증 5 | 카드 교차 오염 | 타 사용자 카드 감지 시 차단 |

설계 참고: Microsoft Entra Connect "Accidental Delete Threshold" 패턴

---

## 3계층 동기화 안전망

| 계층 | 역할 | 구현 위치 |
|------|------|----------|
| 1. 클라이언트 soft delete | `_deleted` 플래그 + `_deletedIds` 전달 | js/data.js, js/sync.js |
| 2. 서버 무결성 검증 | 6단계 검증으로 비정상 변경 차단 | gas/Code.js saveDatabase() |
| 3. 서버 자동 백업 | 1일 1회 백업, 30일분 보관 | gas/Code.js _backupDatabaseIfNeeded() |

---

## 교훈

1. **localStorage 직접 조작 금지** — 콘솔에서 `setItem`으로 데이터를 수정하면 `_deleted` 플래그가 없어 서버 무결성 검증에 걸린다. 데이터 정리는 반드시 앱 UI를 사용한다.
2. **자동 데이터 생성에 서버 확인 필수** — iOS PWA처럼 서버 응답이 불확실한 환경에서는 서버 데이터 수신을 확인한 후에만 자동 생성 로직을 실행한다.
3. **iOS PWA는 홈 화면 설치 필수** — Safari 브라우저 직접 접속은 7일 데이터 소실 위험이 있다.
4. **동기화 문제 디버깅 순서** — 로컬 상태 확인 → 서버 상태 확인 → 동기화 흐름 추적. 한쪽만 보면 오진한다.

---

## 관련 커밋

| 커밋 | 내용 |
|------|------|
| keep `2460595` | Sentry 에러 모니터링 도입 |
| keep `da1619f` | 디버그 로그 버튼 숨김 (?debug=true) |
| keep `234839b` | B-61 iOS PWA 빈 문서 자동 생성 방지 (커밋 메시지에 B-58로 표기되어 있으나 B-61이 정확) |
| gym `1ef876c` | Sentry 도입 |
| study `1a8ceac` | Sentry 도입 |
| opus `c09887e`, `fa96195` | Sentry 도입 반영 |
