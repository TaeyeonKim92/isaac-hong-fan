# 카카오톡 일정 등록 봇 연결

카카오톡 채널의 관리자만 공식 일정 후보를 Google Sheet `일정관리` 탭에 `review` 상태로 등록하는 연결이다. 봇은 일정을 승인하거나 사이트에 바로 공개하지 않는다.

## 구성

```text
카카오톡 채널 → 카카오 i 오픈빌더 Skill → Vercel /api/kakao/schedule
→ Google Apps Script Web App → 홍이삭 공식 일정 관리 시트
```

## 1. Google Apps Script 배포

1. `홍이삭 공식 일정 관리` 시트에서 **확장 프로그램 → Apps Script**를 연다.
2. `scripts/google-apps-script/Code.gs` 내용을 붙여넣고 저장한다.
3. Apps Script의 **프로젝트 설정 → 스크립트 속성**에 다음 값을 추가한다.
   - `SPREADSHEET_ID`: 일정관리 Google Sheet URL의 `/d/`와 `/edit` 사이 값
   - `SHEET_NAME`: `일정관리`
   - `WEBHOOK_SECRET`: 충분히 긴 임의 문자열
4. **배포 → 새 배포 → 웹 앱**을 선택한다.
   - 실행 사용자: 나
   - 액세스 권한: 모든 사용자
5. 발급된 `/exec` URL을 `GOOGLE_APPS_SCRIPT_WEBHOOK_URL`로 사용한다.

웹 앱은 요청 본문의 비밀값을 먼저 검사하며, 시트에는 `review` 상태만 허용한다. 동일 `eventId`는 다시 쓰지 않는다.

## 2. Vercel 환경 변수

```env
KAKAO_SKILL_TOKEN=오픈빌더_URL에_붙일_임의_토큰
KAKAO_SCHEDULE_ADMIN_IDS=허용할_카카오_사용자_ID
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
SCHEDULE_WEBHOOK_SECRET=Apps_Script의_WEBHOOK_SECRET과_같은_값
```

환경 변수를 등록한 뒤 Vercel을 다시 배포한다.

## 3. 카카오 i 오픈빌더

1. 카카오톡 채널과 오픈빌더 봇을 연결한다.
2. 새 Skill의 URL을 다음처럼 설정한다.

```text
https://isaac-hong-fan.vercel.app/api/kakao/schedule?token=KAKAO_SKILL_TOKEN
```

3. 폴백 블록 또는 일정 관리 블록에 Skill을 연결하고 응답을 `스킬 데이터`로 설정한다.
4. 봇을 배포한다.
5. 채널에서 `내 아이디`를 보내 받은 값을 `KAKAO_SCHEDULE_ADMIN_IDS`에 등록하고 Vercel을 다시 배포한다.

## 4. 일정 입력

```text
일정등록
날짜: 2026-11-20
시간: 19:00
분류: 라디오
제목: 배철수의 음악캠프
장소: MBC FM4U
설명: 홍이삭 출연
출처: https://www.instagram.com/...
```

- 필수: 날짜, 분류, 제목
- 선택: 시간, 장소, 설명, 출처, 예매
- 분류: 공연, 방송, 라디오, 발매, 팬이벤트, 티켓오픈, 기타
- 같은 날짜에도 제목·시간·출처가 다르면 별도 일정으로 등록된다.
- 모든 신규 행은 `review`이며, 시트에서 확인한 뒤에만 `approved`로 바꾼다.

## 5. 운영 안전장치

- Skill URL의 토큰과 관리자 사용자 ID를 모두 검사한다.
- Apps Script는 별도 공유 비밀값을 검사한다.
- 동일 내용을 다시 보내도 `eventId` 중복으로 재등록하지 않는다.
- 시트의 헤더 구조가 다르면 쓰기를 중단한다.
- 사이트 공개는 `approved` 행을 `data/schedule.json`에 동기화한 다음 별도 배포한다.
