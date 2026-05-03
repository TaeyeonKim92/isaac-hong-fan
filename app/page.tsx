import Image from 'next/image'
import { getArtistInfo, getTopTracks } from '@/lib/lastfm'
import { getAlbums } from '@/lib/itunes'
import { getLatestVideos, getChannelInfo, formatDate } from '@/lib/youtube'
import { getNewsArticles, formatNewsDate } from '@/lib/news'
import { getUpcomingPerformances } from '@/lib/kopis'

export const revalidate = 86400

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

  const profileImage = channel?.thumbnailUrl ?? ''

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-10">
          {profileImage && (
            <div className="shrink-0">
              <Image src={profileImage} alt="홍이삭" width={160} height={160}
                className="rounded-full border-4 border-stone-700 object-cover" priority />
            </div>
          )}
          <div>
            <p className="text-stone-400 text-sm font-medium uppercase tracking-widest mb-2">Singer · Songwriter</p>
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-2">홍이삭</h1>
            <p className="text-stone-300 text-lg mb-4">Isaac Hong</p>
            <div className="flex gap-4 text-stone-400 text-sm mb-5 flex-wrap">
              {channel?.subscriberCount && <span>YouTube {channel.subscriberCount}명</span>}
              {artist && <span>· Last.fm {artist.listeners} 리스너</span>}
            </div>
            {artist?.bio && (
              <p className="text-stone-400 text-sm leading-relaxed max-w-lg mb-5">{artist.bio}…</p>
            )}
            <div className="flex gap-3 flex-wrap">
              <a href="https://www.youtube.com/channel/UCsnX5bnTB6NTzzXOguVcqZw" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-[#FF0000] text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity">
                YouTube
              </a>
              {artist?.url && (
                <a href={artist.url} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-stone-700 text-white text-sm font-medium rounded-full hover:bg-stone-600 transition-colors">
                  Last.fm
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-14 space-y-16">

        {/* Albums */}
        {albums.length > 0 && (
          <section>
            <h2 className="section-title">앨범</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {albums.map((album) => (
                <a key={album.name} href={album.url} target="_blank" rel="noopener noreferrer"
                  className="card group hover:shadow-md transition-shadow">
                  {album.artworkUrl ? (
                    <div className="aspect-square relative overflow-hidden">
                      <Image src={album.artworkUrl} alt={album.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-stone-100 flex items-center justify-center text-4xl">🎵</div>
                  )}
                  <div className="p-3">
                    <p className="font-medium text-sm text-stone-800 truncate">{album.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{album.releaseDate}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Top Tracks */}
        {tracks.length > 0 && (
          <section>
            <h2 className="section-title">인기 트랙</h2>
            <div className="card divide-y divide-stone-100">
              {tracks.map((track) => (
                <a key={track.name} href={track.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors">
                  <span className="text-stone-400 text-sm w-5 text-center shrink-0">{track.rank}</span>
                  <div className="w-9 h-9 bg-stone-100 rounded-md flex items-center justify-center text-stone-400 shrink-0">♪</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-800 truncate">{track.name}</p>
                  </div>
                  <span className="text-sm text-stone-400 shrink-0">{track.playcount} 재생</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <section>
            <h2 className="section-title">최신 영상</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {videos.map((video) => (
                <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer"
                  className="card group hover:shadow-md transition-shadow">
                  <div className="aspect-video relative overflow-hidden bg-stone-100">
                    <Image src={video.thumbnailUrl} alt={video.title} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[14px] border-l-stone-800 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-stone-800 line-clamp-2">{video.title}</p>
                    <p className="text-xs text-stone-500 mt-1">{formatDate(video.publishedAt)} · {video.viewCount}회</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Performances */}
        {performances.length > 0 && (
          <section>
            <h2 className="section-title">공연 일정</h2>
            <div className="card divide-y divide-stone-100">
              {performances.map((perf) => (
                <a key={perf.id} href={perf.detailUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors">
                  <div className="shrink-0 text-center w-16">
                    <p className="text-xs text-stone-500">{perf.startDate.slice(0, 7)}</p>
                    <p className="font-bold text-stone-800">{perf.startDate.slice(8)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-800 truncate">{perf.title}</p>
                    <p className="text-sm text-stone-500 mt-0.5">{perf.venue}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`badge ${perf.state === '공연중' ? 'bg-green-100 text-green-700' : ''}`}>{perf.state}</span>
                    <p className="text-xs text-stone-400 mt-1">~{perf.endDate}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* News */}
        {news.length > 0 && (
          <section>
            <h2 className="section-title">뉴스 · 기사</h2>
            <div className="card divide-y divide-stone-100">
              {news.map((article, i) => (
                <a key={i} href={article.link} target="_blank" rel="noopener noreferrer"
                  className="block p-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-800 leading-snug">{article.title}</p>
                      {article.snippet && (
                        <p className="text-sm text-stone-500 mt-1 line-clamp-2">{article.snippet}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {article.source && <p className="text-xs font-medium text-stone-600">{article.source}</p>}
                      <p className="text-xs text-stone-400 mt-0.5">{formatNewsDate(article.pubDate)}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        <p>홍이삭 (Isaac Hong) Fan Page</p>
        <p className="mt-1 text-xs">매일 자동 업데이트</p>
      </footer>
    </main>
  )
}
