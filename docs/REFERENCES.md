# 공식 참고자료

확인 기준: 2026-09-06. 아래 자료는 기술 검토 원리와 역할 설계의 참고 근거입니다. TransitionOps와 실제 제휴하거나 같은 시스템을 도입했다는 뜻이 아닙니다. 원문 전체를 재배포하지 않고 링크를 제공합니다.

| 자료 | 적용한 내용 | 적용하지 않은 주장 |
|---|---|---|
| [미국 DOE — Improving Compressed Air System Performance](https://www.energy.gov/sites/prod/files/2016/03/f30/Improving%20Compressed%20Air%20Sourcebook%20version%203.pdf) | 압축기 단품보다 계통 경계·압력·공기질·운전 조건을 함께 검토 | 데모 수치가 DOE 실측값 또는 인증 성능이라는 주장 |
| [Gprnt — SME](https://www.gprnt.ai/platform/sme) / [Financial Institution](https://www.gprnt.ai/platform/financial-institution) | 기업이 정리하는 지속가능성 데이터와 금융기관 활용을 구분하는 설계 참고 | 국내 금융 규칙 충족 또는 실제 연계 |
| [OCBC Sustainability Report 2023](https://www.ocbc.com/iwov-resources/sg/ocbc/gbc/pdf/ocbc-sustainability-report-2023.pdf) | 금융기관과 전문 파트너가 기업 전환을 지원하는 사례 참고 | 데모 사용 기업의 금융 적격성·대출 승인 |
| [kt ds — 하나은행 AWS 관련 구축 사례](https://www.ktds.com/company/pr_news_view.jsp?idx=30511) | 은행 업무 주관과 외부 구축 수행을 구분하는 참고 | KT·kt cloud·kt ds를 동일 계약 주체로 간주 |
| [금융위원회 — 금융분야 AI 가이드라인 자료](https://fsc.go.kr/comm/getFile?fileNo=6&fileTy=ATTACH&srvcId=BBSTY1&upperNo=87142) | 금융 AI의 업무 책임과 통제 경계에 관한 조사 참고 | 개인 데모의 법규 적합성 인증 |

## 데이터 출처 구분

데모의 기업명, 설비 식별자, 공장 전력량, 부하별 소비전력, 운전시간, 견적금액, 가상 전력 단가는 직접 구성했습니다. 기술 참고자료의 수치와 서로 다른 공개 기업 데이터를 합쳐 한 제조기업의 실제 성과처럼 제시하지 않습니다.

압축공기 기술자료를 참고해 동일 계측 경계·동일 운전 조건을 확인하도록 설계했습니다. 계산 결과는 합성 조건에 한정되며, 설치 후 실측이나 탄소 감축 인증을 대신하지 않습니다.

이전 조사에서 살펴본 보조사업 공고와 별도 공개 데이터는 연구 자료로 유지합니다. 현재 앱은 실시간 공고 검색·신청 가능 여부 판단이나 해당 데이터의 기업 단위 통합을 구현하지 않습니다.
