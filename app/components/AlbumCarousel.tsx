'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { ItunesAlbum } from '@/lib/itunes'

const PER_PAGE = 8

export default function AlbumCarousel({ albums }: { albums: ItunesAlbum[] }) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(albums.length / PER_PAGE)
  const visible = Array.from({ length: PER_PAGE }, (_, i) =>
    albums[(page * PER_PAGE + i) % albums.length]
  )

  const navigate = (dir: 1 | -1) =>
    setPage((p) => (p + dir + totalPages) % totalPages)

  return (
    <div>
      {/* 원래 잘 되던 그리드 구조 그대로 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {visible.map((album, i) => (
          <a
            key={`${page}-${i}`}
            href={album.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div
              className="aspect-square relative overflow-hidden rounded-xl mb-2"
              style={{ background: 'var(--border)' }}
            >
              {album.artworkUrl ? (
                <Image
                  src={album.artworkUrl}
                  alt={album.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
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

      {/* 화살표 + 페이지 인디케이터 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
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
              className="w-10 h-10 rounded-full border flex items-center justify-center text-lg hover:opacity-60 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              ←
            </button>
            <button
              onClick={() => navigate(1)}
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
