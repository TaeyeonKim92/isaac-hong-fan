import Image from 'next/image'
import { getSpotifyArtist, getTopTracks, getLatestAlbums, formatDuration } from '@/lib/spotify'
import { getLatestVideos, formatDate } from '@/lib/youtube'
import { getNewsArticles, formatNewsDate } from '@/lib/news'

export const revalidate = 86400

export default async function Home() {
  const artist = await getSpotifyArtist()
  const [topTracks, albums, videos, news] = await Promise.all([
    artist ? getTopTracks(artist.id) : Promise.resolve([]),
    artist ? getLatestAlbums(artist.id) : Promise.resolve([]),
    getLatestVideos(6),
    getNewsArticles('홍이삭', 6),
  ])

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950 opacity-90" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-10">
          {artist?.imageUrl && (
            <div className="shrink-0">
              <Image
                src={artist.imageUrl}
                alt="홍이삭"
                width={160}
                height={160}
                className="rounded-full border-4 border-stone-700 object-cover"
                priority
              />
            </div>
          )}
          <div>
            <p className="text-stone-400 text-sm font-medium uppercase tracking-widest mb-2">
              Singer · Songwriter
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-2">홍이삭</h1>
            <p className="text-stone-300 text-lg mb-4">Isaac Hong</p>
            {artist && (
              <div className="flex gap-4 text-stone-400 text-sm">
                <span>팔로워 {artist.followers.toLocaleString('ko-KR')}</span>
                {artist.genres[0] && <span>· {artist.genres[0]}</span>}
              </div>
            )}
            <div className="flex gap-3 mt-6">
              {artist && (
                <a
                  href={artist.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#1DB954] text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                >
                  Spotify
                </a>
              )}
              <a
                href="https://www.youtube.com/channel/UCsnX5bnTB6NTzzXOguVcqZw"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#FF0000] text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                YouTube
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-14 space-y-16">
        {/* Latest Albums */}
        {albums.length > 0 && (
          <section>
            <h2 className="section-title">최신 음반</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {albums.map((album) => (
                <a
                  key={album.id}
                  href={album.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group hover:shadow-md transition-shadow"
                >
                  {album.imageUrl && (
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={album.imageUrl}
                        alt={album.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-medium text-sm text-stone-800 truncate">{album.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {album.releaseDate.slice(0, 4)}
                      <span className="ml-2 badge">{album.albumType === 'single' ? '싱글' : '앨범'}</span>
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Top Tracks */}
        {topTracks.length > 0 && (
          <section>
            <h2 className="section-title">인기 트랙</h2>
            <div className="card divide-y divide-stone-100">
              {topTracks.map((track, i) => (
                <a
                  key={track.id}
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
                >
                  <span className="text-stone-400 text-sm w-5 text-center shrink-0">{i + 1}</span>
                  {track.albumImageUrl && (
                    <Image
                      src={track.albumImageUrl}
                      alt={track.albumName}
                      width={44}
                      height={44}
                      className="rounded-md shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-800 truncate">{track.name}</p>
                    <p className="text-sm text-stone-500 truncate">{track.albumName}</p>
                  </div>
                  <span className="text-sm text-stone-400 shrink-0">{formatDuration(track.durationMs)}</span>
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
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[14px] border-l-stone-800 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-stone-800 line-clamp-2">{video.title}</p>
                    <p className="text-xs text-stone-500 mt-1">
                      {formatDate(video.publishedAt)} · {video.viewCount}회
                    </p>
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
                <a
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-800 leading-snug">{article.title}</p>
                      {article.snippet && (
                        <p className="text-sm text-stone-500 mt-1 line-clamp-2">{article.snippet}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {article.source && (
                        <p className="text-xs font-medium text-stone-600">{article.source}</p>
                      )}
                      <p className="text-xs text-stone-400 mt-0.5">{formatNewsDate(article.pubDate)}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!artist && videos.length === 0 && news.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p>API 키를 설정해주세요 (.env.local)</p>
          </div>
        )}
      </div>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        <p>홍이삭 (Isaac Hong) Fan Page</p>
        <p className="mt-1 text-xs">매일 자동 업데이트</p>
      </footer>
    </main>
  )
}
