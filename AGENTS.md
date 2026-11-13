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

## 공식 일정 수신함

- 일정 운영 규칙과 시트 계약은 `SCHEDULE_AGENT.md`를 따른다.
- Mnet Plus 홍이삭 소속사 공식 일정 페이지를 1차 출처로 사용한다. 공식 Instagram `@hongisaac_official`과 공식 예매처는 보충·교차 확인 출처다.
- 사용자가 제공한 로그인 브라우저 탭, 게시물 URL 또는 포스터 이미지에서 캡션과 이미지 문자를 모두 확인한다.
- Google Drive의 `홍이삭 공식 일정 관리` 시트에 후보를 기록한다. URL이나 인증 정보는 저장소에 커밋하지 않는다.
- 게시물 하나의 여러 회차는 회차별 한 행으로 나누고, `sourceMediaId`와 제목+시작일시로 중복을 막는다.
- 정보가 불완전하면 `status=review`, 공식 출처로 확인되면 `status=approved`를 사용한다.
- 사이트 반영 요청을 받으면 `approved` 행만 `data/schedule.json`에 동기화한다. `review`, `rejected`, `cancelled`는 노출하지 않는다.
- 공연 회차는 `data/performances.json`에서 자동 합쳐지므로 일반 일정 JSON에 중복 입력하지 않는다.
- 동기화 후 `npm run build`를 실행하고 데스크톱·모바일 월간 캘린더를 확인한다.
- 카카오톡 일정 등록 웹훅은 `app/api/kakao/schedule/route.ts`, 파서는 `lib/kakao-schedule.ts`, Google Sheet 기록기는 `scripts/google-apps-script/Code.gs`에서 관리한다.
- 카카오톡 봇 연결이나 환경 변수 변경 시 `docs/KAKAO_SCHEDULE_BOT_SETUP.md`를 함께 확인한다.
- 공용 Google Calendar와 Sheet 동기화는 `docs/GOOGLE_CALENDAR_SYNC_SETUP.md`와 `scripts/google-apps-script/Code.gs`를 따른다.

## 음악 데이터 규칙

- 일반 업로드의 YouTube 음악 카테고리 ID `10`만으로 노래를 판별하지 않는다. 자체 콘텐츠도 음악 카테고리로 분류될 수 있다.
- 발매작의 기준은 `https://www.youtube.com/@pngisacofficial/releases`의 선택된 Releases 탭이다.
- Releases 탭에서는 `OLAK5uy_...` 발매 플레이리스트 ID만 수집하고, 실제 트랙과 조회수는 기존 `YOUTUBE_API_KEY`를 사용하는 공식 YouTube Data API v3로 조회한다.
- Releases 탭을 읽지 못하면 일반 업로드로 대체하지 않고 음악 섹션을 숨긴다.
- `최근 음악`은 영상 업로드일이 아니라 Releases 탭의 공식 발매 목록 순서와 앨범 내 트랙 순서로 계산한다. 유통사 이전으로 오래된 음원이 다시 업로드될 수 있으므로 `snippet.publishedAt`을 발매일로 사용하지 않는다.
- 최근 음악의 오른쪽에는 잘못된 업로드 날짜 대신 발매 앨범명을 표시한다. `인기 음악`은 조회수순으로 계산한다.
- 음악 로직을 수정하거나 배포하기 전에는 `npm run check:youtube-releases`가 통과해야 한다.
- 조회수 기반 목록을 YouTube Music 공식 차트라고 표현하지 않는다. 화면에는 `공식 채널 조회수 기준`을 명시한다.
- 곡 제목은 YouTube Data API에 `hl=ko`를 지정해 공식 한국어 현지화 제목을 우선한다. 현지화 제목이 없으면 원문을 유지하며 임의 번역하지 않는다.
- 공식 국내 음원 페이지에서 한국어 곡명을 확인한 경우 `data/music-title-overrides.json`에 YouTube 영상 ID, 공식 제목, 근거 URL, 확인일을 저장한다. 이 검증값이 API 제목보다 우선한다.
- 멜론·벅스 HTML을 런타임에 직접 파싱하지 않는다. 페이지 구조 변경이나 접근 차단이 사이트 장애로 이어지지 않게 한다.
- 개별 곡 링크는 무료 계정에서도 열리는 `https://www.youtube.com/watch?v=VIDEO_ID` 형식으로 연결한다. 상단 아티스트 버튼만 YouTube Music을 사용한다.
