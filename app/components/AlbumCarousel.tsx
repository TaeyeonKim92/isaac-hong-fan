'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { YouTubeReleaseAlbum } from '@/lib/youtube'

const PER_PAGE = 6

export default function AlbumCarousel({ albums }: { albums: YouTubeReleaseAlbum[] }) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(albums.length / PER_PAGE)
  const visible = albums.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const navigate = (dir: 1 | -1) =>
    setPage((p) => (p + dir + totalPages) % totalPages)

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((album) => (
          <a
            key={album.id}
            href={album.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div
              className="relative mb-3 aspect-video overflow-hidden rounded-xl"
              style={{ background: album.backdropColor }}
            >
              {album.artworkUrl ? (
                <Image
                  src={album.artworkUrl}
                  alt={album.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🎵</div>
              )}
              <span
                className="absolute bottom-2 right-2 rounded px-2 py-1 text-[11px] font-semibold text-white"
                style={{ background: 'rgba(38, 26, 14, 0.78)' }}
              >
                ♪ {album.trackCount}곡
              </span>
            </div>
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {album.name}
            </p>
            <p className="mt-1 truncate text-xs" style={{ color: 'var(--muted)' }}>
              {album.artistName} · YouTube Releases
            </p>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`${i + 1}번째 발매 목록 페이지`}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === page ? '20px' : '6px',
                  height: '6px',
                  background: i === page ? 'var(--accent)' : 'var(--border)',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              aria-label="이전 발매 목록"
              className="w-10 h-10 rounded-full border flex items-center justify-center text-lg hover:opacity-60 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              ←
            </button>
            <button
              onClick={() => navigate(1)}
              aria-label="다음 발매 목록"
              className="w-10 h-10 rounded-full border flex items-center justify-center text-lg hover:opacity-60 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
