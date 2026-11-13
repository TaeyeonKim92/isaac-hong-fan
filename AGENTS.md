# Repository Agent Rules

이 저장소를 수정하는 에이전트는 `SITE_MANAGEMENT_GUIDE.md`를 먼저 읽고 기존 변경사항과 비밀값을 보존한다.

## 공연 업데이트 하네스

사용자가 “최근 공연 업데이트”, “공연 일정 체크”, “예매 링크 확인” 또는 같은 의미의 작업을 요청하면 아래 절차를 모두 수행한다.

1. `data/performances.json`과 `lib/kopis.ts`의 현재 데이터를 읽는다.
2. 현재 날짜는 Asia/Seoul 기준으로 판단한다.
3. KOPIS 결과만 믿지 말고 공연별 공식 근거를 찾는다. 출처 우선순위는 다음과 같다.
   - 아티스트·소속사의 공식 공지
   - 공식 예매처의 상품 페이지와 티켓오픈 공지
   - KOPIS 공연 상세
   - 언론 기사와 검색 결과는 발견용 보조 자료로만 사용
4. 공연명, 공연장, 모든 회차의 날짜·요일·시간을 최소 두 개의 신뢰 가능한 신호와 대조한다. 공식 예매처의 상품 페이지와 공지가 일치하면 이를 우선한다.
5. 예매 링크는 검색 결과 URL이 아니라 해당 공연의 직접 상품 URL을 저장한다.
   - 금지: `/search`, `?query=`, `?keyword=`, 포털 검색 결과
   - 허용: 예매처의 공연 상품 상세 URL
   - 상품 페이지가 아직 없으면 `bookingStatus`를 `upcoming`으로 두고 `bookingUrl`은 빈 문자열로 유지하며, `sourceUrl`에 공식 공지를 기록한다. 검색 URL을 임시 링크로 넣지 않는다.
6. 여러 회차가 있는 공연은 `schedule`에 모든 회차를 입력한다. 기간의 시작일·종료일만 입력하고 회차를 생략하지 않는다.
7. `sourceName`, `sourceUrl`, `verifiedAt`을 반드시 갱신한다. 추측한 정보는 저장하지 않는다.
8. 같은 공연이 KOPIS와 수동 데이터에 모두 있으면 중복되지 않는지 확인한다.
9. 아래 검증을 모두 실행한다.

```bash
npm run check:performances
npm run build
```

10. 검증이 실패하거나 공식 출처끼리 충돌하면 배포 가능한 상태라고 보고하지 않는다. 확인된 내용, 미확인 항목, 필요한 사용자 판단을 구분해 보고한다.

## 공연 데이터 수정 범위

- 공연의 사람이 확인한 기준 데이터: `data/performances.json`
- KOPIS 자동 수집·병합·중복 제거: `lib/kopis.ts`
- 화면 표시: `app/page.tsx`
- 데이터 계약과 검증: `scripts/check-performances.mjs`
- 운영 설명: `SITE_MANAGEMENT_GUIDE.md`

공연 데이터 구조나 검증 규칙을 바꾸면 위 파일과 운영 문서를 함께 수정한다.
