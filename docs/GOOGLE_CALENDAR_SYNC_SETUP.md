# Google Calendar → 일정관리 Sheet 동기화

## 기준 캘린더

- 이름: `홍이삭 공식 일정`
- Calendar ID: 공용 일정 캘린더의 **설정 및 공유 → 캘린더 통합**에서 확인
- 시간대: `Asia/Seoul`
- 공식 원본 우선순위: Mnet Plus 소속사 일정 → 공식 Instagram → 공식 예매처

## 이벤트 입력 규칙

제목 앞에 분류를 붙인다.

```text
[공연] 공연명
[라디오] 프로그램명
[방송] 프로그램명
[발매] 앨범명
[팬이벤트] 이벤트명
```

장소는 Calendar의 장소 필드에 입력한다. 설명에는 공식 출처 URL을 넣는다. Mnet Plus 일정 URL이 있으면 Sheet에서 `approved/high`, 없으면 `review/medium`으로 동기화한다.

같은 날 일정이 여러 개여도 Google Calendar event ID가 다르므로 각각 별도 행으로 유지된다.

## Apps Script 설정

`홍이삭 공식 일정 관리` Sheet에서 **확장 프로그램 → Apps Script**를 열고 `scripts/google-apps-script/Code.gs`를 붙여넣는다.

프로젝트 설정의 스크립트 속성에 다음을 추가한다.

```text
SPREADSHEET_ID=Google_Sheet_URL의_d와_edit_사이_ID
SHEET_NAME=일정관리
CALENDAR_ID=Google_Calendar_설정에서_복사한_ID
```

Apps Script 편집기에서 `installCalendarSyncTrigger`를 한 번 실행하고 Calendar·Sheets 권한을 승인한다. 이 함수는 기존 동기화 트리거를 정리하고 Calendar 변경 트리거를 설치한 다음 즉시 전체 동기화를 실행한다.

Calendar 변경 트리거는 변경된 이벤트 자체를 알려주지 않으므로, 일정 수가 적은 이 캘린더는 최근 1개월부터 향후 2년까지 전체를 다시 읽어 event ID로 upsert한다.

- 생성·수정: 같은 Calendar event ID 행을 갱신하거나 새 행 추가
- 삭제: 기존 행을 `cancelled`로 변경
- Mnet Plus 출처: `approved/high`
- 그 외 공동 입력: `review/medium`
