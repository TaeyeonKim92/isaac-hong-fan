# 공식 일정 관리 에이전트

## 운영 방식

Meta API 없이 공식 Instagram을 일정의 1차 출처로 사용한다. 사용자가 로그인된 브라우저 탭, 게시물 URL 또는 포스터 이미지를 제공하면 에이전트가 캡션과 이미지의 문자를 읽고 일정 후보를 만든다.

일정 후보는 Google Drive의 `홍이삭 공식 일정 관리` 스프레드시트 `일정관리` 탭에 기록한다. 시트 URL과 인증 정보는 공개 저장소에 커밋하지 않는다.

## 처리 절차

1. `https://www.instagram.com/hongisaac_official/`의 원본 게시물인지 확인한다.
2. 캡션과 포스터에서 일정 유형, 제목, 날짜, 시간, 장소, 예매·신청 링크를 추출한다.
3. 게시물 하나에 여러 회차가 있으면 회차마다 한 행을 만든다.
4. `sourceMediaId`, Instagram URL, 제목+시작일시를 기준으로 중복을 검사한다.
5. 예매처·소속사·주최사 공식 페이지가 있으면 교차 확인한다.
6. 완전히 확인되지 않은 일정은 `review`, 확인된 일정은 `approved`로 기록한다.
7. 변경·취소 공지는 새 일정을 추가하지 않고 기존 행을 갱신한다.
8. 추측한 날짜·시간·장소는 입력하지 않는다.

## 시트 계약

| 열 | 의미 |
| --- | --- |
| `eventId` | 일정 고유 ID |
| `status` | `review`, `approved`, `rejected`, `cancelled` |
| `category` | `공연`, `방송`, `라디오`, `발매`, `팬이벤트`, `티켓오픈`, `기타` |
| `title` | 화면에 표시할 일정명 |
| `startDate`, `startTime` | 시작 날짜 `YYYY-MM-DD`와 시간 `HH:mm` |
| `endDate`, `endTime` | 종료 날짜와 시간, 없으면 빈 값 |
| `venue` | 공연장·방송사·온라인 채널 |
| `description` | 짧은 일정 설명 |
| `bookingUrl` | 검색 결과가 아닌 직접 예매·신청 URL |
| `instagramUrl` | 원본 공식 Instagram 게시물 URL |
| `sourceName`, `sourceUrl` | 교차 확인한 공식 출처 |
| `sourceMediaId` | Instagram 게시물 중복 방지 ID |
| `confidence` | `high`, `medium`, `low` |
| `verifiedAt` | 최종 확인일 `YYYY-MM-DD` |
| `lastCheckedAt` | 에이전트가 원본을 마지막으로 확인한 시각 |
| `notes` | 변경·취소·미확인 정보 |

## 사용자 요청 예시

> 로그인된 공식 인스타그램 탭에서 마지막 확인 이후 게시물을 보고 새 일정을 업데이트해. 포스터도 읽고, 공식 예매처와 대조한 뒤 시트에는 검수대기로 넣어줘.

> 이 인스타그램 링크와 포스터에서 일정을 추출해. 기존 시트의 중복을 확인하고 회차별로 나눠서 추가해.

사이트 캘린더는 향후 `status=approved`인 행만 읽도록 연결한다. 연결 전까지 이 시트는 검수·승인용 기준 데이터로 사용한다.
