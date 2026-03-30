# Changelog

이 파일은 keep 프로젝트의 주요 변경 내역을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)를 따릅니다.

## 2026-03-31

### Added
- 매출처-카테고리 사용자 학습 자동 분류 (storage.js, data.js, sms-parser.js, ui-expense.js) — 사용자가 카테고리를 변경하면 학습 맵에 기록, 동일 매출처 재입력 시 자동 적용. 서버 동기화는 미포함(B-63).

### Fixed
- 가계부 항목 꾹누르기 시 OS 텍스트 선택 겹침 방지 (style.css)

## 2026-03-30

### Fixed
- iOS PWA 초기 로드 시 빈 문서 자동 생성 방지 (sync.js, app.js) — B-61
- 에디터 제목 입력 시 리스트 미반영 (editor.js) — B-56
- iOS PWA 제목→본문 탭 시 UI 깨짐 (style.css, ui.js) — B-57

### Added
- Google 로그인 도입 + 토큰 제거 (app.js, Code.js)
- 보안 조치: Gemini+CSE 키 삭제, Code.js 데드 코드 제거, JWT 서명 검증 도입 + 폴백 토큰 제거
