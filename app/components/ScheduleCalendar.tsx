'use client'

import { useMemo, useState } from 'react'
import type { ScheduleCategory, ScheduleEvent } from '@/lib/schedule'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

const CATEGORY_COLORS: Record<ScheduleCategory, { background: string; color: string }> = {
  공연: { background: '#6b351f', color: '#fffaf3' },
  방송: { background: '#445c4c', color: '#fffaf3' },
  라디오: { background: '#9b6a42', color: '#fffaf3' },
  발매: { background: '#72516f', color: '#fffaf3' },
  팬이벤트: { background: '#9a5960', color: '#fffaf3' },
  티켓오픈: { background: '#315f67', color: '#fffaf3' },
  기타: { background: '#75685e', color: '#fffaf3' },
}

const CALENDAR_EVENT_STYLES = {
  performance: {
    background: '#6b351f',
    border: '1px solid #6b351f',
    color: '#fffaf3',
  },
  schedule: {
    background: '#f2e5d5',
    border: '1px solid #c8a98b',
    color: '#6b351f',
  },
}

function calendarEventStyle(event: ScheduleEvent) {
  return event.category === '공연' ? CALENDAR_EVENT_STYLES.performance : CALENDAR_EVENT_STYLES.schedule
}

function parseDate(value: string) {
  const [year, month, day] = value.split('.').map(Number)
  return new Date(year, month - 1, day)
}

function dateKey(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function koreaTodayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}.${values.month}.${values.day}`
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(parseDate(value))
}

function EventLink({ event, compact = false }: { event: ScheduleEvent; compact?: boolean }) {
  const content = (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={CATEGORY_COLORS[event.category]}
        >
          {event.category}
        </span>
        {event.time && <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{event.time}</span>}
      </div>
      <h3 className={`${compact ? 'text-sm' : 'text-[15px]'} font-semibold leading-snug`} style={{ color: 'var(--text)' }}>
        {event.title}
      </h3>
      {event.venue && <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{event.venue}</p>}
      {!compact && event.description && (
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{event.description}</p>
      )}
      {event.url && !compact && (
        <span className="mt-4 inline-flex items-center text-[10px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--accent)' }}>
          {event.linkLabel || '자세히 보기'} <span className="ml-1.5" aria-hidden="true">→</span>
        </span>
      )}
    </>
  )

  if (!event.url) return <div>{content}</div>

  return (
    <a href={event.url} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-65">
      {content}
    </a>
  )
}

export default function ScheduleCalendar({ events }: { events: ScheduleEvent[] }) {
  const todayKey = koreaTodayKey()
  const today = parseDate(todayKey)
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(todayKey)

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, ScheduleEvent[]>()
    events.forEach((event) => grouped.set(event.date, [...(grouped.get(event.date) || []), event]))
    return grouped
  }, [events])

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const firstDay = new Date(year, month, 1)
    const mondayOffset = (firstDay.getDay() + 6) % 7
    const gridStart = new Date(year, month, 1 - mondayOffset)

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + index)
      return date
    })
  }, [monthCursor])

  const selectedEvents = eventsByDate.get(selectedDate) || []
  const monthLabel = `${monthCursor.getFullYear()}. ${String(monthCursor.getMonth() + 1).padStart(2, '0')}`

  function moveMonth(offset: number) {
    const nextMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + offset, 1)
    setMonthCursor(nextMonth)

    if (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() === today.getMonth()) {
      setSelectedDate(todayKey)
      return
    }

    const firstEvent = events.find((event) => {
      const date = parseDate(event.date)
      return date.getFullYear() === nextMonth.getFullYear() && date.getMonth() === nextMonth.getMonth()
    })
    setSelectedDate(firstEvent?.date || dateKey(nextMonth))
  }

  return (
    <section id="schedule" className="py-16 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.35em]" style={{ color: 'var(--muted)' }}>Schedule</p>
          <h2 className="text-2xl font-semibold md:text-3xl" style={{ color: 'var(--text)' }}>공식 일정</h2>
        </div>
        <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--muted)' }} aria-label="일정 구분">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#6b351f]" />공연</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-[#c8a98b] bg-[#f2e5d5]" />기타 일정</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="border-y py-16 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          예정된 공식 일정이 없습니다.
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="overflow-hidden rounded-2xl border bg-[#fbf5ed]/70" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
                <button type="button" onClick={() => moveMonth(-1)} className="h-9 w-9 rounded-full border text-lg transition-colors hover:bg-white/70" style={{ borderColor: 'var(--border)' }} aria-label="이전 달">‹</button>
                <p className="text-xl font-semibold tracking-[0.08em]" style={{ fontFamily: 'var(--font-playfair), serif' }}>{monthLabel}</p>
                <button type="button" onClick={() => moveMonth(1)} className="h-9 w-9 rounded-full border text-lg transition-colors hover:bg-white/70" style={{ borderColor: 'var(--border)' }} aria-label="다음 달">›</button>
              </div>

              <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="py-2.5 text-center text-[10px] font-semibold tracking-[0.18em]" style={{ color: 'var(--muted)' }}>{weekday}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((date) => {
                  const key = dateKey(date)
                  const dayEvents = eventsByDate.get(key) || []
                  const inMonth = date.getMonth() === monthCursor.getMonth()
                  const isSelected = key === selectedDate

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className={`min-h-[4.6rem] border-b border-r p-1.5 text-left transition-colors sm:min-h-[5.5rem] sm:p-2 lg:min-h-[6.6rem] ${isSelected ? 'bg-white/90' : 'hover:bg-white/50'}`}
                      style={{ borderColor: 'var(--border)', color: inMonth ? 'var(--text)' : 'rgba(138,112,96,0.35)' }}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${isSelected ? 'bg-[#261a0e] text-[#f7f2ea]' : ''}`}>{date.getDate()}</span>
                      <span className="mt-1.5 hidden space-y-1 sm:block">
                        {dayEvents.slice(0, 2).map((event) => (
                          <span key={event.id} className="block truncate rounded px-1.5 py-1 text-[10px] font-medium" style={calendarEventStyle(event)}>
                            {event.time ? `${event.time} ` : ''}{event.title}
                          </span>
                        ))}
                        {dayEvents.length > 2 && <span className="block pl-1 text-[10px] font-medium" style={{ color: 'var(--accent)' }}>+{dayEvents.length - 2}개 일정</span>}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="mt-2 flex items-center gap-1 sm:hidden">
                          {dayEvents.slice(0, 3).map((event) => (
                            <span key={event.id} className="h-1.5 w-1.5 rounded-full" style={{ background: calendarEventStyle(event).color === '#fffaf3' ? '#6b351f' : '#c08a57' }} />
                          ))}
                          {dayEvents.length > 3 && <span className="text-[9px] font-medium" style={{ color: 'var(--accent)' }}>+{dayEvents.length - 3}</span>}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <aside className="rounded-2xl border bg-[#fffdf7] p-5" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--muted)' }}>Selected date</p>
              <p className="mt-2 border-b pb-4 text-lg font-semibold" style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-playfair), serif' }}>{formatLongDate(selectedDate)}</p>
              <div className="mt-5 divide-y" style={{ borderColor: 'var(--border)' }}>
                {selectedEvents.length > 0 ? selectedEvents.map((event) => (
                  <div key={event.id} className="py-5 first:pt-0 last:pb-0">
                    <EventLink event={event} />
                  </div>
                )) : (
                  <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>등록된 일정이 없습니다.</p>
                )}
              </div>
            </aside>
          </div>

        </>
      )}
    </section>
  )
}
