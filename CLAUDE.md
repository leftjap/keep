# CLAUDE.md — keep

> 공통 실행 규칙은 playbook CLAUDE.md 참조.
> 이 파일은 keep 고유 주의사항만 담는다.

## keep 고유 주의
- gesture.js는 절대 수정하지 않는다
- gas/Code.js 수정 후 반드시 clasp push + 웹앱 재배포
- parseSMSServer ↔ parseSMS, autoMatchCategoryServer ↔ autoMatchCategory: 한쪽 수정 시 양쪽 필수
- switchTab() else 블록에서 에디터 서브 패널 복원을 빠뜨리지 않는다
- USER_CONFIG 개별 사용자 설정은 해당 사용자 명시 요청 없이 변경 금지
- style.css (~3,000줄), gas/Code.js (~1,600줄)는 크롤링하지 말고 사용자 업로드를 기다린다
