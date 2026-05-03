'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { ItunesAlbum } from '@/lib/itunes'

const PER_PAGE = 8 // 4 cols × 2 rows

export default function AlbumCarousel({ albums }: { albums: ItunesAlbum[] }) {
  const [page, setPage] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const totalPages = Math.ceil(albums.length / PER_PAGE)

  const navigate = (dir: 1 | -1) => {
    setPage((p) => (p + dir + totalPages) % totalPages)
    setAnimKey((k) => k + 1)
  }

  // 항상 8개 채우기 — 마지막 페이지도 처음으로 wrap
  const visible = Array.from({ length: PER_PAGE }, (_, i) => {
    return albums[(page * PER_PAGE + i) % albums.length]
  })

  return (
    <div>
      {/* 그리드 */}
      <div
        key={animKey}
        className="album-slide grid gap-4"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, auto)' }}
      >
        {visible.map((album, i) => (
          <a
            key={`${page}-${i}`}
            href={album.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div
              className="w-full rounded-xl mb-2 overflow-hidden"
              style={{ position: 'relative', paddingBottom: '100%', background: 'var(--border)' }}
            >
              {album.artworkUrl ? (
                <Image
                  src={album.artworkUrl}
                  alt={album.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ position: 'absolute', inset: 0 }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0 }} className="flex items-center justify-center text-4xl">🎵</div>
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

      {/* 화살표 + 페이지 인디케이터 */}
      <div className="flex items-center justify-between mt-8">
        {/* 페이지 dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i); setAnimKey((k) => k + 1) }}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === page ? '20px' : '6px',
                height: '6px',
                background: i === page ? 'var(--accent)' : 'var(--border)',
              }}
              aria-label={`페이지 ${i + 1}`}
            />
          ))}
        </div>

        {/* 화살표 */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border flex items-center justify-center text-lg hover:opacity-60 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="이전"
          >
            ←
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-10 h-10 rounded-full border flex items-center justify-center text-lg hover:opacity-60 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="다음"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
