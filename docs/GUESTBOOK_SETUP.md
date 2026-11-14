# Google Sheet 방명록 연결

팬페이지의 공개 방명록은 방문자가 Google Sheet에 직접 접근하지 않고 아래 경로로 저장한다.

```text
브라우저 → Vercel /api/guestbook → Google Apps Script Web App → 방명록 탭
```

## Google Sheet

`홍이삭 공식 일정 관리` 파일의 `방명록` 탭을 사용한다.

| 열 | 용도 |
|---|---|
| `id` | 글 고유 ID |
| `createdAt` | Asia/Seoul 작성 시각 |
| `nickname` | 닉네임, 최대 30자 |
| `message` | 메시지, 최대 500자 |
| `status` | `published` 또는 `hidden` |
| `contentHash` | 동일 글 중복 방지용 해시 |
| `adminNote` | 관리자 메모 |

글을 숨기려면 `status`를 `hidden`으로 바꾼다. 다시 공개하려면 `published`로 바꾼다.

## Apps Script

1. 스프레드시트에서 **확장 프로그램 → Apps Script**를 연다.
2. `scripts/google-apps-script/Code.gs` 전체를 붙여넣고 저장한다.
3. **프로젝트 설정 → 스크립트 속성**에 아래 값을 둔다.
   - `SPREADSHEET_ID`: 해당 스프레드시트 ID
   - `SHEET_NAME`: `일정관리`
   - `GUESTBOOK_SHEET_NAME`: `방명록` (생략 시에도 기본값은 `방명록`)
   - `WEBHOOK_SECRET`: 충분히 긴 임의 문자열
4. 기존 웹 앱 배포가 있다면 **배포 관리 → 수정 → 새 버전**으로 갱신한다.
5. 새 배포라면 **배포 → 새 배포 → 웹 앱**을 선택한다.
   - 실행 사용자: 나
   - 액세스 권한: 모든 사용자

## Vercel 환경 변수

```env
GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
SCHEDULE_WEBHOOK_SECRET=Apps_Script의_WEBHOOK_SECRET과_같은_값
```

기존 일정 봇과 같은 Web App URL과 비밀값을 재사용한다. 비밀값은 브라우저에 전달되지 않고 Vercel 함수에서만 사용한다.

## 안전장치

- 닉네임 30자, 메시지 500자를 브라우저·Vercel·Apps Script에서 각각 검사한다.
- 메시지의 URL을 차단한다.
- 숨김 입력란(honeypot)과 최소 작성 시간을 검사한다.
- 방문자 네트워크 식별자는 Vercel에서 HMAC으로 변환한 뒤 1분 등록 제한에만 사용하고 시트에는 저장하지 않는다.
- 같은 닉네임과 메시지 조합은 중복 등록하지 않는다.
- 공개 응답에는 `published` 행만 포함하며 내부 해시와 관리자 메모는 반환하지 않는다.
