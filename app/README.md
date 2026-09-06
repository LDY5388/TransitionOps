# TransitionOps Demo

중소 제조기업의 압축공기 설비투자 자료 준비, 승인 공유, 은행 보완 요청을 시연하는 웹 앱입니다.

```bash
npm ci
npm run dev
```

Node.js 22.13 이상이 필요합니다. 실행된 로컬 주소에서 제조기업·은행 RM·운영 역할을 전환할 수 있습니다. 별도 API 키는 필요하지 않습니다.

```bash
npm test
npx tsc --noEmit
npm run build
```

- 업무 상태와 공유본: `lib/demo/engine.ts`
- 합성 자료·출처: `lib/demo/scenario.json`
- 화면: `app/page.tsx`
- 계산·공유·버전·복구 검사: `tests/workflow.test.mjs`

계산과 상태 전환은 실제 코드로 처리합니다. 검토 초안은 규칙 기반이며 실시간 LLM·RAG·금융기관 연계는 없습니다. 현재 역할은 같은 브라우저의 미리보기이고, 상태는 브라우저 로컬 저장소에 저장합니다. 실제 권한 분리나 금융망 격리를 구현한 서비스로 해석하지 않습니다.

사이트 배포용 `.openai/hosting.json`의 `project_id`는 원 프로젝트 식별자입니다. 다른 계정으로 별도 배포할 때는 자신의 새 사이트로 등록해야 합니다.
