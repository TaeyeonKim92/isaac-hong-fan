# 공연 업데이트 런북

이 런북은 새 공연을 발견했을 때 에이전트가 일정과 링크를 안전하게 갱신하는 방법을 설명한다. 실행 규칙은 저장소 루트의 `AGENTS.md`가 기준이다.

## 하네스 구성

| 구성 | 역할 |
|---|---|
| `data/performances.json` | 공식 출처로 확인한 공연·회차·직접 예매 링크 |
| `lib/kopis.ts` | KOPIS 자동 검색, 직접 상품 링크 우선, 수동 데이터 병합 |
| `scripts/check-performances.mjs` | 스키마, 회차 누락, 날짜 범위, 검색 URL, 링크 상태 검사 |
| `app/page.tsx` | 여러 회차를 한 공연 카드에 표시 |
| `AGENTS.md` | 에이전트가 따라야 하는 조사·수정·검증 절차 |

## 데이터 계약

```json
{
  "id": "고유한-공연-id",
  "artist": "홍이삭",
  "title": "공식 공연명",
  "venue": "공식 공연장명",
  "startDate": "YYYY.MM.DD",
  "endDate": "YYYY.MM.DD",
  "genre": "대중음악",
  "state": "공연예정",
  "posterUrl": "",
  "bookingName": "예매처명",
  "bookingStatus": "on-sale",
  "bookingUrl": "https://예매처/직접-상품-주소",
  "sourceName": "공식 근거 이름",
  "sourceUrl": "https://공식-공지-주소",
  "verifiedAt": "YYYY-MM-DD",
  "schedule": [
    { "date": "YYYY.MM.DD", "day": "금", "time": "20:00" }
  ]
}
```

### `bookingStatus`

- `upcoming`: 공연은 발표됐지만 직접 예매 상품이 아직 열리지 않음. `bookingUrl`은 빈 문자열로 둔다.
- `on-sale`: 예매 가능. 직접 상품 URL이 반드시 필요하다.
- `closed`: 예매 종료. 공식 상품 URL은 근거로 유지할 수 있다.

## 링크 방어 규칙

- 검색 결과 주소는 공연이 검색되지 않거나 동명의 다른 상품으로 바뀔 수 있으므로 저장하지 않는다.
- 직접 상품 URL은 HTTP 200 여부와 페이지 안의 아티스트명을 검사한다.
- HTTP 404·410은 검증 실패다.
- 예매처가 봇 요청을 차단하거나 일시 장애를 반환하면 경고로 남기고 사람이 브라우저에서 재확인한다.
- 공식 상품이 아직 없을 때는 공식 공지를 상세 링크로 사용한다. 임의의 검색 URL로 대체하지 않는다.

## 회차 방어 규칙

- `schedule`은 최소 1개가 필요하다.
- 날짜와 시간은 오름차순이어야 한다.
- 같은 날짜·시간의 중복 회차를 허용하지 않는다.
- 첫 회차는 `startDate`, 마지막 회차는 `endDate`와 일치해야 한다.
- 모든 회차는 공연 기간 안에 있어야 한다.

## 실행

온라인 링크 검사 포함:

```bash
npm run check:performances
```

네트워크 없이 데이터 구조만 검사:

```bash
npm run check:performances:offline
```

최종 배포 전:

```bash
npm run check:performances
npm run build
```

## 에이전트 결과 보고 형식

- 추가·수정·종료 처리한 공연
- 확인한 공식 출처 링크
- 회차 수와 날짜 범위
- 직접 예매 링크 검증 결과
- KOPIS와 공식 공지의 차이
- 자동으로 확정하지 못한 항목
