import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getScheduleEventById,
  getStaticScheduleEvents,
  type ScheduleEvent,
} from '@/lib/schedule'

const SITE_URL = 'https://isaac-hong-fan.vercel.app'

type PageProps = {
  params: { id: string }
}

function formatDate(value: string) {
  const [year, month, day] = value.split('.').map(Number)
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day, 3)))
}

function eventDescription(event: ScheduleEvent) {
  const details = [
    `${formatDate(event.date)}${event.time ? ` ${event.time}` : ''}`,
    event.venue,
  ].filter(Boolean)

  return `홍이삭 ${event.title} 일정입니다. ${details.join(', ')}. 공연·방송·라디오 등 홍이삭의 공식 일정을 확인하세요.`
}

function isoDateTime(date: string, time?: string) {
  const normalizedDate = date.replace(/\./g, '-')
  return time ? `${normalizedDate}T${time}:00+09:00` : normalizedDate
}

export const dynamicParams = false

export function generateStaticParams() {
  return getStaticScheduleEvents().map((event) => ({ id: event.id }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const event = getScheduleEventById(decodeURIComponent(params.id))
  if (!event) return {}

  const title = `${event.title} | 홍이삭 일정`
  const description = eventDescription(event)
  const path = `/schedule/${encodeURIComponent(event.id)}`

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      siteName: '홍이삭 팬페이지',
      locale: 'ko_KR',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function ScheduleDetailPage({ params }: PageProps) {
  const event = getScheduleEventById(decodeURIComponent(params.id))
  if (!event) notFound()

  const canonicalUrl = `${SITE_URL}/schedule/${encodeURIComponent(event.id)}`
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || eventDescription(event),
    startDate: isoDateTime(event.date, event.time),
    endDate: isoDateTime(event.endDate || event.date, event.endTime || event.time),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: canonicalUrl,
    performer: {
      '@type': 'Person',
      name: '홍이삭',
      alternateName: 'Isaac Hong',
    },
    ...(event.venue
      ? {
          location: {
            '@type': 'Place',
            name: event.venue,
          },
        }
      : {}),
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 pb-20 pt-28 md:px-10 md:pt-32">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/#schedule"
          className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
          style={{ color: 'var(--accent)' }}
        >
          <span className="mr-2" aria-hidden="true">←</span> 전체 일정
        </Link>

        <header className="mt-10 border-y py-10 md:py-14" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: 'var(--muted)' }}>
            Isaac Hong Schedule · {event.category}
          </p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight md:text-5xl" style={{ color: 'var(--text)', fontFamily: 'var(--font-playfair), serif' }}>
            {event.title}
          </h1>
        </header>

        <div className="grid gap-10 py-10 md:grid-cols-[12rem_minmax(0,1fr)] md:py-14">
          <dl className="space-y-6">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>날짜</dt>
              <dd className="mt-2 text-sm font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>{formatDate(event.date)}</dd>
            </div>
            {event.time && (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>시간</dt>
                <dd className="mt-2 text-sm font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                  {event.time}{event.endTime ? `–${event.endTime}` : ''}
                </dd>
              </div>
            )}
            {event.venue && (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>장소</dt>
                <dd className="mt-2 text-sm font-semibold leading-relaxed" style={{ color: 'var(--text)' }}>{event.venue}</dd>
              </div>
            )}
          </dl>

          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>홍이삭 공식 일정</h2>
            <p className="mt-5 whitespace-pre-line text-sm leading-7" style={{ color: 'var(--muted)' }}>
              {event.description || `${formatDate(event.date)}${event.time ? ` ${event.time}` : ''}${event.venue ? `, ${event.venue}` : ''}에 예정된 홍이삭 일정입니다.`}
            </p>

            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex border px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-opacity hover:opacity-65"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                {event.linkLabel || '공식 정보 보기'} <span className="ml-2" aria-hidden="true">↗</span>
              </a>
            )}

            <p className="mt-10 border-t pt-6 text-xs leading-6" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              이 페이지는 홍이삭의 공개된 공식 일정을 정리한 비공식 팬페이지입니다. 일정은 주최 측 사정에 따라 변경될 수 있으니 방문 전 공식 출처를 확인해 주세요.
            </p>
          </div>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  )
}
