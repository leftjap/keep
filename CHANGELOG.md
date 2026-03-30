# Changelog — keep

형식: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

## 2026-03-31

### Added
- 매출처-카테고리 사용자 학습 자동 분류 — 사용자가 카테고리를 변경하면 학습 맵(gb_merchant_categories)에 저장, 동일 매출처 재입력 시 자동 적용. 서버 동기화 미포함. (storage.js, data.js, sms-parser.js, ui-expense.js)

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
