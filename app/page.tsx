import fs from 'fs'
import path from 'path'
import Image from 'next/image'
import AlbumCarousel from './components/AlbumCarousel'
import VideoCarousel from './components/VideoCarousel'
import ScheduleCalendar from './components/ScheduleCalendar'
import { getArtistInfo } from '@/lib/lastfm'
import { getInstagramPosts, formatInstagramDate } from '@/lib/instagram'
import { getLatestVideos, getYouTubeMusicTracks } from '@/lib/youtube'
import { getNewsArticles, formatNewsDate } from '@/lib/news'
import { getUpcomingPerformances } from '@/lib/kopis'
import { getScheduleEvents } from '@/lib/schedule'

export const revalidate = 86400

const SPOTIFY_ARTIST_URL = 'https://open.spotify.com/artist/4bST03NJ0YEysocK5AV1wB'
const MELON_ARTIST_URL = 'https://www.melon.com/artist/timeline.htm?artistId=774246'
const YOUTUBE_MUSIC_ARTIST_URL = 'https://music.youtube.com/channel/UCsnX5bnTB6NTzzXOguVcqZw'

// public/images/ 폴더에서 이미지 파일 목록 읽기
const IMG_EXT = /\.(jpg|jpeg|png|webp)$/i
function readImages(folder: string): string[] {
  const dir = path.join(process.cwd(), 'public', 'images', folder)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => IMG_EXT.test(f))
    .sort()
    .map((f) => `/images/${folder}/${f}`)
}

export default async function Home() {
  const [artist, youtubeMusic, instagramPosts, videos, news, performances] = await Promise.all([
    getArtistInfo(),
    getYouTubeMusicTracks(5),
    getInstagramPosts(3),
    getLatestVideos(50),
    getNewsArticles('홍이삭', 6),
    getUpcomingPerformances('홍이삭'),
  ])

  // 로컬 이미지 폴더 스캔 (빌드 시 실행)
  const heroImages = readImages('hero')     // 히어로 배경 — 가로 사진
  const galleryImages = readImages('gallery') // 갤러리 — 여러 장
  const profileImages = readImages('profile') // 프로필 — 세로 사진

  const heroBg = heroImages[0] ?? null
  const profileSrc = profileImages[0] ?? null
  const scheduleEvents = getScheduleEvents(performances)
  const albums = youtubeMusic.releases

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative min-h-screen flex flex-col items-center justify-end overflow-hidden bg-[#171111]"
      >
        {/* EP <결> 커버를 전체 배경과 상단 리본에 겹쳐 사용 */}
        {heroBg && (
          <>
            <div
              className="gyeol-hero-art absolute inset-0 pointer-events-none"
              style={{ backgroundImage: `url('${heroBg}')` }}
            />
            <div
              className="gyeol-hero-ribbon absolute inset-x-0 top-16 h-28 pointer-events-none opacity-90 md:h-36"
              style={{ backgroundImage: `url('${heroBg}')` }}
            />
          </>
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(75,14,13,0.02) 0%, rgba(20,14,14,0.08) 42%, rgba(15,10,10,0.82) 78%, rgba(10,7,7,0.96) 100%)',
          }}
        />

        {/* 본문 */}
        <div className="relative z-10 w-full max-w-6xl px-6 pb-24 pt-52 text-center text-[#f3eee8] md:px-10 md:pb-20">
          <p
            className="mb-5 text-[10px] tracking-[0.45em] uppercase text-[#e0c2bd]"
          >
            7th EP &middot; GYEOL
          </p>

          <h1 className="sr-only">Isaac Hong</h1>
          <img
            src="/images/logo/isaac-hong-logo.png"
            alt=""
            className="mx-auto mb-8 w-[min(62vw,26rem)] brightness-0 invert"
          />

          {/* 공식 채널 */}
          <p
            className="mb-4 text-[9px] tracking-[0.32em] uppercase text-[#c9aaa5]"
          >
            Official Channels
          </p>
          <div className="mx-auto flex max-w-md flex-wrap justify-center gap-3 sm:max-w-none sm:gap-4">
            <a
              href="https://www.instagram.com/hongisaac_official/"
              target="_blank"
              rel="noopener noreferrer"
              className="basis-[calc(50%-0.375rem)] px-3 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-70 sm:basis-auto sm:px-7 sm:text-[11px] sm:tracking-[0.25em]"
              style={{ background: 'var(--gyeol-red)', color: 'var(--gyeol-ivory)' }}
            >
              Instagram
            </a>
            <a
              href="https://youtube.com/@pngisacofficial"
              target="_blank"
              rel="noopener noreferrer"
              className="basis-[calc(50%-0.375rem)] px-3 py-2.5 text-[10px] tracking-[0.2em] uppercase border transition-all hover:opacity-70 sm:basis-auto sm:px-7 sm:text-[11px] sm:tracking-[0.25em]"
              style={{ borderColor: 'rgba(243,238,232,0.55)', color: 'var(--gyeol-ivory)' }}
            >
              YouTube
            </a>
            <a
              href={YOUTUBE_MUSIC_ARTIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="basis-[calc(50%-0.375rem)] px-3 py-2.5 text-[10px] tracking-[0.18em] uppercase border transition-all hover:opacity-70 sm:basis-auto sm:px-7 sm:text-[11px] sm:tracking-[0.25em]"
              style={{ borderColor: 'rgba(243,238,232,0.55)', color: 'var(--gyeol-ivory)' }}
            >
              YouTube Music
            </a>
            <a
              href={SPOTIFY_ARTIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="basis-[calc(50%-0.375rem)] px-3 py-2.5 text-[10px] tracking-[0.2em] uppercase border transition-all hover:opacity-70 sm:basis-auto sm:px-7 sm:text-[11px] sm:tracking-[0.25em]"
              style={{ borderColor: 'rgba(243,238,232,0.55)', color: 'var(--gyeol-ivory)' }}
            >
              Spotify
            </a>
            <a
              href={MELON_ARTIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="basis-[calc(50%-0.375rem)] px-3 py-2.5 text-[10px] tracking-[0.2em] uppercase border transition-all hover:opacity-70 sm:basis-auto sm:px-7 sm:text-[11px] sm:tracking-[0.25em]"
              style={{ borderColor: 'rgba(243,238,232,0.55)', color: 'var(--gyeol-ivory)' }}
            >
              Melon
            </a>
          </div>

          {/* 개인 채널 */}
          <div
            className="mt-5 flex items-center justify-center gap-x-4 gap-y-2 flex-wrap text-[10px] tracking-[0.22em] uppercase"
            style={{ color: '#bfa5a1' }}
          >
            <a
              href="https://youtube.com/@pngisac-video"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-60"
            >
              Vlog YouTube
            </a>
            <span aria-hidden="true" className="opacity-40">&middot;</span>
            <a
              href="https://www.instagram.com/pngisac/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-60"
            >
              Personal Instagram
            </a>
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: '#d7bbb7' }}
        >
          <div className="w-px h-14 opacity-30" style={{ background: 'var(--muted)' }} />
          <span className="text-[10px] tracking-[0.35em] uppercase opacity-50">Scroll</span>
        </div>
      </section>

      {/* ── 프로필 + 앨범 ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10">

        {/* 프로필 (public/images/profile/ 에 사진 넣으면 표시) */}
        {profileSrc && (
          <section className="py-20 grid gap-10 items-center md:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] md:gap-14">
            <div className="w-full">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#d8d5cf]">
                <Image
                  src={profileSrc}
                  alt="EP 결 프로필 사진 속 홍이삭"
                  fill
                  priority
                  className="object-cover object-center"
                />
              </div>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.35em] uppercase mb-3" style={{ color: 'var(--muted)' }}>
                About
              </p>
              <h2
                className="font-bold italic mb-5"
                style={{
                  fontFamily: 'var(--font-playfair), serif',
                  fontSize: '2.5rem',
                  color: 'var(--text)',
                }}
              >
                Isaac Hong
              </h2>
              {artist?.bio && (
                <p className="leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '36rem' }}>
                  {artist.bio}…
                </p>
              )}
            </div>
          </section>
        )}

        {/* YouTube 공식 아티스트 채널 Releases 기반 발매 목록 */}
        <section id="albums" className="scroll-mt-16 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="section-title">앨범 · 싱글</h2>
            <a
              href="https://www.youtube.com/@pngisacofficial/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 text-[10px] uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
              style={{ color: 'var(--muted)' }}
            >
              YouTube Releases &rarr;
            </a>
          </div>
          <div className="section-line" />
          {albums.length > 0 ? (
            <AlbumCarousel albums={albums} />
          ) : (
            <div
              className="rounded-2xl border px-6 py-8 sm:flex sm:items-center sm:justify-between sm:gap-8"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--text)' }}>
                  앨범 목록은 공식 음원 플랫폼에서 확인할 수 있어요.
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                  YouTube Releases를 불러오지 못해 공식 음원 플랫폼으로 연결합니다.
                </p>
              </div>
              <div className="mt-5 flex shrink-0 flex-wrap gap-3 sm:mt-0 sm:justify-end">
                <a
                  href={YOUTUBE_MUSIC_ARTIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border px-5 py-2 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
                  style={{ borderColor: 'var(--text)', color: 'var(--text)' }}
                >
                  YouTube Music
                </a>
                <a
                  href={SPOTIFY_ARTIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border px-5 py-2 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
                  style={{ borderColor: 'var(--text)', color: 'var(--text)' }}
                >
                  Spotify
                </a>
                <a
                  href={MELON_ARTIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border px-5 py-2 text-[10px] tracking-[0.2em] uppercase transition-opacity hover:opacity-60"
                  style={{ borderColor: 'var(--text)', color: 'var(--text)' }}
                >
                  Melon
                </a>
              </div>
            </div>
          )}
        </section>

        {/* YouTube 공식 아티스트 채널 기반 음악 */}
        {(youtubeMusic.latest.length > 0 || youtubeMusic.popular.length > 0) && (
          <section id="music" className="scroll-mt-16 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
              {youtubeMusic.latest.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="section-title">최근 음악</h2>
                    <a
                      href={YOUTUBE_MUSIC_ARTIST_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-2 shrink-0 text-[10px] tracking-[0.18em] uppercase transition-opacity hover:opacity-60"
                      style={{ color: 'var(--muted)' }}
                    >
                      YouTube Music &rarr;
                    </a>
                  </div>
                  <div className="section-line" />
                  {youtubeMusic.latest.map((track, i) => (
                    <a
                      key={track.id}
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 py-4 border-b group"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <span className="text-xs w-4 text-center shrink-0 tabular-nums" style={{ color: 'var(--muted)' }}>
                        {i + 1}
                      </span>
                      <p
                        className="flex-1 font-medium group-hover:opacity-60 transition-opacity"
                        style={{ color: 'var(--text)' }}
                      >
                        {track.title}
                      </p>
                      <span className="max-w-44 truncate text-right text-sm shrink-0" style={{ color: 'var(--muted)' }}>
                        {track.releaseTitle}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {youtubeMusic.popular.length > 0 && (
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="section-title">인기 음악</h2>
                    <span
                      className="mb-2 shrink-0 text-[10px] tracking-[0.12em] uppercase"
                      style={{ color: 'var(--muted)' }}
                    >
                      공식 채널 조회수 기준
                    </span>
                  </div>
                  <div className="section-line" />
                  {youtubeMusic.popular.map((track, i) => (
                    <a
                      key={track.id}
                      href={track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 py-4 border-b group"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <span className="text-xs w-4 text-center shrink-0 tabular-nums" style={{ color: 'var(--muted)' }}>
                        {i + 1}
                      </span>
                      <p
                        className="flex-1 font-medium group-hover:opacity-60 transition-opacity"
                        style={{ color: 'var(--text)' }}
                      >
                        {track.title}
                      </p>
                      <span className="text-sm shrink-0" style={{ color: 'var(--muted)' }}>
                        {track.viewCount}회
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* ── 갤러리 (public/images/gallery/ 에 사진 넣으면 자동 표시) ── */}
      {galleryImages.length > 0 && (
        <section
          id="gallery"
          className="py-20"
          style={{ background: 'rgba(0,0,0,0.02)' }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <h2 className="section-title">갤러리</h2>
            <div className="section-line" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryImages.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-xl group"
                  style={{ background: 'var(--border)' }}
                >
                  <Image
                    src={src}
                    alt={`갤러리 ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 인스타그램 ───────────────────────────────────────────── */}
      {instagramPosts.length > 0 && (
        <section id="instagram" className="py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between gap-6 mb-10">
              <div>
                <h2 className="section-title">인스타그램</h2>
                <div className="section-line !mb-0" />
              </div>
              <div className="hidden sm:flex gap-4 text-[11px] tracking-[0.2em] uppercase">
                <a
                  href="https://www.instagram.com/hongisaac_official/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-60 transition-opacity"
                  style={{ color: 'var(--muted)' }}
                >
                  Official
                </a>
                <a
                  href="https://www.instagram.com/pngisac/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-60 transition-opacity"
                  style={{ color: 'var(--muted)' }}
                >
                  pngisac
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instagramPosts.slice(0, 6).map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div
                    className="relative aspect-square overflow-hidden rounded-xl mb-3"
                    style={{ background: 'var(--border)' }}
                  >
                    <img
                      src={post.mediaUrl}
                      alt={`${post.username} Instagram post`}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
                    @{post.username} &middot; {formatInstagramDate(post.timestamp)}
                  </p>
                  {post.caption && (
                    <p className="font-medium text-sm line-clamp-2" style={{ color: 'var(--text)' }}>
                      {post.caption}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 최신 영상 ─────────────────────────────────────────────── */}
      {videos.length > 0 && (
        <section id="videos" className="py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <h2 className="section-title">최신 영상</h2>
            <div className="section-line" />
            <VideoCarousel videos={videos} />
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <ScheduleCalendar events={scheduleEvents} />
      </div>

      {/* ── 뉴스 ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {news.length > 0 && (
          <section id="news" className="py-20 border-t" style={{ borderColor: 'var(--border)' }}>
            <h2 className="section-title">뉴스 · 기사</h2>
            <div className="section-line" />
            {news.map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between gap-8 py-5 border-b group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="min-w-0">
                  <p
                    className="font-medium leading-snug group-hover:opacity-60 transition-opacity"
                    style={{ color: 'var(--text)' }}
                  >
                    {article.title}
                  </p>
                  {article.snippet && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                      {article.snippet}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {article.source && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                      {article.source}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {formatNewsDate(article.pubDate)}
                  </p>
                </div>
              </a>
            ))}
          </section>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-14 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <img
          src="/images/logo/isaac-hong-logo-dark.png"
          alt="Isaac Hong"
          className="h-8 w-auto mx-auto"
        />
        <p
          className="text-[11px] mt-2 tracking-[0.35em] uppercase"
          style={{ color: 'var(--muted)' }}
        >
          홍이삭 Fan Page &middot; 매일 자동 업데이트
        </p>
      </footer>
    </main>
  )
}
