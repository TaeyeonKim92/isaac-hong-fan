import publishedSchedule from '@/data/schedule.json'
import type { KopisPerformance } from '@/lib/kopis'

export type ScheduleCategory = '공연' | '방송' | '라디오' | '발매' | '팬이벤트' | '티켓오픈' | '기타'

export interface ScheduleEvent {
  id: string
  category: ScheduleCategory
  title: string
  date: string
  time?: string
  venue?: string
  description?: string
  url?: string
  linkLabel?: string
}

interface PublishedScheduleItem {
  id: string
  status: string
  category: ScheduleCategory
  title: string
  startDate: string
  startTime?: string
  endDate: string
  venue?: string
  description?: string
  url?: string
  linkLabel?: string
}

function normalizeDate(date: string) {
  return date.replace(/-/g, '.')
}

function performanceEvents(performance: KopisPerformance): ScheduleEvent[] {
  const shows = performance.schedule?.length
    ? performance.schedule
    : [{ date: performance.startDate, day: '', time: '' }]

  return shows.map((show, index) => ({
    id: `${performance.id}-${index + 1}`,
    category: '공연',
    title: performance.title,
    date: normalizeDate(show.date),
    time: show.time,
    venue: performance.venue,
    description: performance.schedule?.length
      ? `전체 ${performance.schedule.length}회 중 ${index + 1}회`
      : performance.state,
    url: performance.bookingUrl || performance.detailUrl,
    linkLabel: performance.bookingUrl ? '예매하기' : '공연 정보 보기',
  }))
}

export function getScheduleEvents(performances: KopisPerformance[]): ScheduleEvent[] {
  const approvedEvents = (publishedSchedule as PublishedScheduleItem[])
    .filter((event) => event.status === 'approved')
    .map((event) => ({
      id: event.id,
      category: event.category,
      title: event.title,
      date: normalizeDate(event.startDate),
      time: event.startTime,
      venue: event.venue,
      description: event.description,
      url: event.url,
      linkLabel: event.linkLabel,
    }))

  return [...approvedEvents, ...performances.flatMap(performanceEvents)]
    .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`))
}
