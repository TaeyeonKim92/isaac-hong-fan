# 홍이삭 (Isaac Hong) Fan Page

홍이삭의 최신 음악, 영상, 뉴스를 자동으로 보여주는 팬 페이지입니다.
Spotify, YouTube, Google News를 매일 자동으로 불러옵니다.

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.local.example .env.local
```
`.env.local` 파일을 열고 API 키를 입력하세요.

### 3. Spotify API 키 발급
1. [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) 접속
2. 로그인 → **Create app**
3. App name: `Isaac Hong Fan` / Redirect URI: `http://localhost:3000`
4. **Client ID**와 **Client Secret** 복사 → `.env.local`에 입력

### 4. YouTube API 키 발급
1. [console.cloud.google.com](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 → **API 및 서비스** → **라이브러리**
3. `YouTube Data API v3` 검색 → 사용 설정
4. **사용자 인증 정보** → **API 키 만들기** → 복사 → `.env.local`에 입력

### 5. 로컬 실행
```bash
npm run dev
```
[http://localhost:3000](http://localhost:3000) 접속

## Vercel 배포

1. GitHub에 push
2. [vercel.com](https://vercel.com) 로그인 → **Add New Project** → GitHub 레포 선택
3. Environment Variables에 `.env.local`의 키 3개 입력
4. **Deploy** 클릭

## 기술 스택

- **Framework**: Next.js 14 (App Router, ISR)
- **Styling**: Tailwind CSS
- **Data**: Spotify Web API, YouTube Data API v3, Google News RSS
- **Update**: 매일 자동 갱신 (ISR revalidate: 86400초)
- **Hosting**: Vercel (무료)
