import { createHash } from 'crypto'

const CATEGORIES = ['공연', '방송', '라디오', '발매', '팬이벤트', '티켓오픈', '기타'] as const
type ScheduleCategory = (typeof CATEGORIES)[number]

export interface KakaoScheduleEvent {
  eventId: string
  status: 'review'
  category: ScheduleCategory
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  venue: string
  description: string
  bookingUrl: string
  instagramUrl: string
  sourceName: string
  sourceUrl: string
  sourceMediaId: string
  confidence: 'medium'
  verifiedAt: string
  lastCheckedAt: string
  notes: string
}

export const KAKAO_SCHEDULE_HELP = [
  '아래 형식으로 보내주세요.',
  '',
  '일정등록',
  '날짜: 2026-11-20',
  '시간: 19:00',
  '분류: 라디오',
  '제목: 프로그램명',
  '장소: MBC FM4U',
  '설명: 홍이삭 출연',
  '출처: https://...',
  '',
  `분류: ${CATEGORIES.join(', ')}`,
  '시간·장소·설명·출처는 모르면 생략할 수 있습니다.',
].join('\n')

function normalizeDate(value: string) {
  const match = value.trim().match(/^(20\d{2})[-./](\d{1,2})[-./](\d{1,2})$/)
  if (!match) return ''

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return ''

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function normalizeTime(value: string) {
  if (!value.trim()) return ''
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return ''
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return ''
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function getSeoulTimestamp() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`
}

export function parseKakaoSchedule(utterance: string): { event?: KakaoScheduleEvent; error?: string } {
  const lines = utterance.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!/^일정\s*(등록|추가)$/i.test(lines[0] || '')) {
    return { error: KAKAO_SCHEDULE_HELP }
  }

  const fields = new Map<string, string>()
  lines.slice(1).forEach((line) => {
    const match = line.match(/^([^:：]+)[:：]\s*(.*)$/)
    if (match) fields.set(match[1].replace(/\s/g, ''), match[2].trim())
  })

  const date = normalizeDate(fields.get('날짜') || '')
  const rawTime = fields.get('시간') || ''
  const time = normalizeTime(rawTime)
  const category = fields.get('분류') as ScheduleCategory | undefined
  const title = fields.get('제목') || ''

  if (!date) return { error: `날짜는 YYYY-MM-DD 형식의 실제 날짜여야 합니다.\n\n${KAKAO_SCHEDULE_HELP}` }
  if (rawTime && !time) return { error: '시간은 24시간제 HH:mm 형식으로 입력해주세요.' }
  if (!category || !CATEGORIES.includes(category)) return { error: `분류는 다음 중 하나여야 합니다.\n${CATEGORIES.join(', ')}` }
  if (!title) return { error: '제목을 입력해주세요.' }

  const sourceUrl = fields.get('출처') || ''
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol')
    } catch {
      return { error: '출처는 http:// 또는 https://로 시작하는 올바른 URL이어야 합니다.' }
    }
  }

  const fingerprint = [date, time, category, title, sourceUrl].join('|').toLowerCase()
  const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 12)
  const timestamp = getSeoulTimestamp()

  return {
    event: {
      eventId: `kakao-${date.replace(/-/g, '')}-${hash}`,
      status: 'review',
      category,
      title,
      startDate: date,
      startTime: time,
      endDate: date,
      endTime: '',
      venue: fields.get('장소') || '',
      description: fields.get('설명') || '',
      bookingUrl: fields.get('예매') || '',
      instagramUrl: /instagram\.com/i.test(sourceUrl) ? sourceUrl : '',
      sourceName: '카카오톡 관리자 입력',
      sourceUrl,
      sourceMediaId: `kakao-${hash}`,
      confidence: 'medium',
      verifiedAt: '',
      lastCheckedAt: timestamp,
      notes: '카카오톡 봇을 통해 검수대기로 등록됨',
    },
  }
}

export function summarizeKakaoSchedule(event: KakaoScheduleEvent) {
  return [
    '검수대기로 저장했습니다.',
    '',
    `${event.startDate}${event.startTime ? ` ${event.startTime}` : ''}`,
    `${event.category} · ${event.title}`,
    event.venue || null,
    '',
    'Google Sheet에서 확인 후 approved로 변경해주세요.',
  ].filter((line): line is string => line !== null).join('\n')
}
