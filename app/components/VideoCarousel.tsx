'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { YouTubeVideo } from '@/lib/youtube'

const PER_PAGE = 6

function formatVideoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function VideoCarousel({ videos }: { videos: YouTubeVideo[] }) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(videos.length / PER_PAGE)
  const visible = videos.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  const navigate = (dir: 1 | -1) =>
    setPage((p) => (p + dir + totalPages) % totalPages)

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visible.map((video) => (
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
                sizes="(max-width: 768px) 100vw, 33vw"
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
              {video.channelTitle} &middot; {formatVideoDate(video.publishedAt)} &middot; {video.viewCount}회
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
