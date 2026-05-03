import fs from 'fs'
import path from 'path'
import Image from 'next/image'
import { getArtistInfo, getTopTracks } from '@/lib/lastfm'
import { getAlbums } from '@/lib/itunes'
import { getLatestVideos, getChannelInfo, formatDate } from '@/lib/youtube'
import { getNewsArticles, formatNewsDate } from '@/lib/news'
import { getUpcomingPerformances } from '@/lib/kopis'

export const revalidate = 86400

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
  const [artist, tracks, albums, channel, videos, news, performances] = await Promise.all([
    getArtistInfo(),
    getTopTracks(),
    getAlbums('홍이삭'),
    getChannelInfo(),
    getLatestVideos(6),
    getNewsArticles('홍이삭', 6),
    getUpcomingPerformances('홍이삭'),
  ])

  // 로컬 이미지 폴더 스캔 (빌드 시 실행)
  const heroImages = readImages('hero')     // 히어로 배경 — 가로 사진
  const galleryImages = readImages('gallery') // 갤러리 — 여러 장
  const profileImages = readImages('profile') // 프로필 — 세로 사진

  const heroBg = heroImages[0] ?? null
  const profileSrc = profileImages[0] ?? null

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'var(--bg)' }}
      >
        {/* 배경 그라데이션 텍스처 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 15% 15%, rgba(155,79,42,0.10) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(155,79,42,0.07) 0%, transparent 55%)',
          }}
        />

        {/* public/images/hero/ 에 사진 넣으면 자동으로 배경으로 표시 */}
        {heroBg && (
          <>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url('${heroBg}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'rgba(247,242,234,0.72)' }}
            />
          </>
        )}

        {/* 본문 */}
        <div className="relative z-10 text-center px-6 py-24">
          <p
            className="text-[11px] tracking-[0.45em] uppercase mb-10"
            style={{ color: 'var(--muted)' }}
          >
            Singer &middot; Songwriter
          </p>

          <h1
            className="font-bold italic leading-[0.9] mb-5"
            style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: 'clamp(4rem, 16vw, 14rem)',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              textShadow: '4px 4px 0 rgba(155,79,42,0.12)',
            }}
          >
            Isaac Hong
          </h1>

          <p
            className="text-lg md:text-xl mb-12"
            style={{ color: 'var(--muted)', letterSpacing: '0.3em' }}
          >
            홍이삭
          </p>

          {/* 통계 */}
          <div
            className="flex gap-6 items-center justify-center text-sm mb-10 flex-wrap"
            style={{ color: 'var(--muted)' }}
          >
            {channel?.subscriberCount && <span>YouTube {channel.subscriberCount}</span>}
            {artist?.listeners && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span>Last.fm {artist.listeners} 리스너</span>
              </>
            )}
          </div>

          {/* 링크 버튼 */}
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://www.youtube.com/channel/UCsnX5bnTB6NTzzXOguVcqZw"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-2.5 text-[11px] tracking-[0.25em] uppercase transition-opacity hover:opacity-70"
              style={{ background: 'var(--text)', color: 'var(--bg)' }}
            >
              YouTube
            </a>
            {artist?.url && (
              <a
                href={artist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-2.5 text-[11px] tracking-[0.25em] uppercase border transition-all hover:opacity-70"
                style={{ borderColor: 'var(--text)', color: 'var(--text)' }}
              >
                Last.fm
              </a>
            )}
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: 'var(--muted)' }}
        >
          <div className="w-px h-14 opacity-30" style={{ background: 'var(--muted)' }} />
          <span className="text-[10px] tracking-[0.35em] uppercase opacity-50">Scroll</span>
        </div>
      </section>

      {/* ── 프로필 + 앨범 ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10">

        {/* 프로필 (public/images/profile/ 에 사진 넣으면 표시) */}
        {profileSrc && (
          <section className="py-20 flex flex-col md:flex-row gap-12 items-center">
            <div className="shrink-0 w-56 md:w-72">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                <Image src={profileSrc} alt="홍이삭" fill className="object-cover" />
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

        {/* 앨범 */}
        {albums.length > 0 && (
          <section id="albums" className="py-20 border-t" style={{ borderColor: 'var(--border)' }}>
            <h2 className="section-title">앨범</h2>
            <div className="section-line" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {albums.map((album) => (
                <a
                  key={album.id}
                  href={album.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div
                    className="aspect-square relative overflow-hidden rounded-xl mb-3"
                    style={{ background: 'var(--border)' }}
                  >
                    {album.artworkUrl ? (
                      <Image
                        src={album.artworkUrl}
                        alt={album.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">🎵</div>
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                    {album.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {album.releaseDate}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 인기 트랙 */}
        {tracks.length > 0 && (
          <section className="py-20 border-t" style={{ borderColor: 'var(--border)' }}>
            <h2 className="section-title">인기 트랙</h2>
            <div className="section-line" />
            {tracks.map((track, i) => (
              <a
                key={track.name}
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
                  {track.name}
                </p>
                <span className="text-sm shrink-0" style={{ color: 'var(--muted)' }}>
                  {track.playcount}
                </span>
              </a>
            ))}
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

      {/* ── 최신 영상 ─────────────────────────────────────────────── */}
      {videos.length > 0 && (
        <section id="videos" className="py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <h2 className="section-title">최신 영상</h2>
            <div className="section-line" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div
                    className="aspect-video relative overflow-hidden rounded-xl mb-3"
                    style={{ background: 'var(--border)' }}
                  >
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.22)' }}
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.9)' }}
                      >
                        <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-stone-800 ml-1" />
                      </div>
                    </div>
                  </div>
                  <p className="font-medium text-sm line-clamp-2 mb-1" style={{ color: 'var(--text)' }}>
                    {video.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {formatDate(video.publishedAt)} &middot; {video.viewCount}회
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 공연 일정 + 뉴스 ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        {performances.length > 0 && (
          <section id="tour" className="py-20 border-t" style={{ borderColor: 'var(--border)' }}>
            <h2 className="section-title">공연 일정</h2>
            <div className="section-line" />
            {performances.map((perf) => (
              <a
                key={perf.id}
                href={perf.detailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-8 py-5 border-b group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="shrink-0 w-20 text-center">
                  <p className="text-[11px] tracking-widest" style={{ color: 'var(--muted)' }}>
                    {perf.startDate.slice(0, 7)}
                  </p>
                  <p
                    className="text-3xl font-bold tabular-nums"
                    style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--text)' }}
                  >
                    {perf.startDate.slice(8)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-medium group-hover:opacity-60 transition-opacity"
                    style={{ color: 'var(--text)' }}
                  >
                    {perf.title}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                    {perf.venue}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`badge ${perf.state === '공연중' ? '!bg-green-50 !text-green-700' : ''}`}>
                    {perf.state}
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    ~{perf.endDate}
                  </p>
                </div>
              </a>
            ))}
          </section>
        )}

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
        <p
          className="font-bold italic text-xl"
          style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--text)' }}
        >
          Isaac Hong
        </p>
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
