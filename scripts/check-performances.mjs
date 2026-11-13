import { readFile } from 'node:fs/promises'

const dataUrl = new URL('../data/performances.json', import.meta.url)
const offline = process.argv.includes('--offline')
const strict = process.argv.includes('--strict')
const datePattern = /^\d{4}\.\d{2}\.\d{2}$/
const timePattern = /^\d{2}:\d{2}$/
const searchLinkPatterns = [
  /\/search(?:[/?#]|$)/i,
  /[?&](?:query|keyword)=/i,
  /notice_ticket\.html/i,
]

const errors = []
const warnings = []

function error(id, message) {
  errors.push(`[${id}] ${message}`)
}

function warn(id, message) {
  warnings.push(`[${id}] ${message}`)
}

function parseDotDate(value) {
  return new Date(`${value.replaceAll('.', '-')}T00:00:00+09:00`)
}

function normalizeText(value) {
  return value
    .replace(/&lt;|&gt;|&amp;|&quot;|&#39;/gi, (entity) => ({
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
    })[entity.toLowerCase()] || entity)
    .replace(/\\u003c/gi, '<')
    .replace(/\\u003e/gi, '>')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/gi, '')
}

function validateUrl(id, label, value, { rejectSearch = false } = {}) {
  if (!value) {
    error(id, `${label}가 비어 있습니다.`)
    return null
  }

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:') error(id, `${label}는 HTTPS URL이어야 합니다: ${value}`)
    if (rejectSearch && searchLinkPatterns.some((pattern) => pattern.test(parsed.href))) {
      error(id, `${label}에 검색 결과 URL을 사용할 수 없습니다: ${value}`)
    }
    return parsed
  } catch {
    error(id, `${label}가 올바른 URL이 아닙니다: ${value}`)
    return null
  }
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IsaacHongFan/1.0; performance-link-check)',
      },
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function verifyBookingPage(performance) {
  if (offline || !performance.bookingUrl) return

  try {
    const response = await fetchWithTimeout(performance.bookingUrl)
    if (response.status === 404 || response.status === 410) {
      error(performance.id, `예매 페이지가 만료되었거나 없습니다: HTTP ${response.status}`)
      return
    }
    if (!response.ok) {
      warn(performance.id, `예매처가 자동 확인을 거부했거나 일시 오류입니다: HTTP ${response.status}`)
      return
    }

    if (searchLinkPatterns.some((pattern) => pattern.test(response.url))) {
      error(performance.id, `예매 링크가 검색 결과 페이지로 이동합니다: ${response.url}`)
      return
    }

    const body = await response.text()
    const artist = normalizeText(performance.artist || '홍이삭')
    const title = normalizeText(performance.title)
    const normalizedBody = normalizeText(body)
    if (!normalizedBody.includes(artist)) {
      error(performance.id, '예매 페이지 본문에서 아티스트명을 확인할 수 없습니다. 다른 상품 링크인지 점검하세요.')
    }
    if (!normalizedBody.includes(title)) {
      error(performance.id, '예매 페이지 본문에서 공식 공연명을 확인할 수 없습니다. 다른 상품 링크인지 점검하세요.')
    }
  } catch (cause) {
    warn(performance.id, `예매 페이지 네트워크 확인 실패: ${cause instanceof Error ? cause.message : String(cause)}`)
  }
}

async function verifySourcePage(performance) {
  if (offline || !performance.sourceUrl || performance.sourceUrl === performance.bookingUrl) return

  try {
    const response = await fetchWithTimeout(performance.sourceUrl)
    if (response.status === 404 || response.status === 410) {
      error(performance.id, `공식 근거 페이지가 만료되었거나 없습니다: HTTP ${response.status}`)
      return
    }
    if (!response.ok) {
      warn(performance.id, `공식 근거 페이지 자동 확인 실패: HTTP ${response.status}`)
      return
    }

    const body = normalizeText(await response.text())
    const artist = normalizeText(performance.artist || '홍이삭')
    if (!body.includes(artist)) {
      warn(performance.id, '공식 근거 페이지 본문에서 아티스트명을 자동 확인하지 못했습니다.')
    }
  } catch (cause) {
    warn(performance.id, `공식 근거 페이지 네트워크 확인 실패: ${cause instanceof Error ? cause.message : String(cause)}`)
  }
}

const performances = JSON.parse(await readFile(dataUrl, 'utf8'))

if (!Array.isArray(performances)) {
  throw new Error('data/performances.json의 최상위 값은 배열이어야 합니다.')
}

const ids = new Set()

for (const performance of performances) {
  const id = performance.id || 'unknown'
  const requiredTextFields = [
    'id',
    'artist',
    'title',
    'venue',
    'startDate',
    'endDate',
    'state',
    'bookingName',
    'bookingStatus',
    'sourceName',
    'sourceUrl',
    'verifiedAt',
  ]

  for (const field of requiredTextFields) {
    if (typeof performance[field] !== 'string' || !performance[field].trim()) {
      error(id, `${field} 필드는 비어 있지 않은 문자열이어야 합니다.`)
    }
  }

  if (ids.has(id)) error(id, '중복된 공연 ID입니다.')
  ids.add(id)

  if (!datePattern.test(performance.startDate || '')) error(id, 'startDate 형식은 YYYY.MM.DD여야 합니다.')
  if (!datePattern.test(performance.endDate || '')) error(id, 'endDate 형식은 YYYY.MM.DD여야 합니다.')
  if (datePattern.test(performance.startDate || '') && datePattern.test(performance.endDate || '')) {
    if (performance.startDate > performance.endDate) error(id, 'startDate가 endDate보다 늦습니다.')
  }

  validateUrl(id, 'sourceUrl', performance.sourceUrl)

  if (performance.bookingStatus === 'on-sale' && !performance.bookingUrl) {
    error(id, '예매 중인 공연은 bookingUrl이 필요합니다.')
  }
  if (performance.bookingUrl) {
    validateUrl(id, 'bookingUrl', performance.bookingUrl, { rejectSearch: true })
  }

  const schedule = performance.schedule
  if (!Array.isArray(schedule) || schedule.length === 0) {
    error(id, '회차 누락을 막기 위해 schedule에 최소 한 회차를 입력해야 합니다.')
  } else {
    const scheduleKeys = new Set()
    let previous = ''

    for (const show of schedule) {
      if (!datePattern.test(show.date || '')) error(id, `잘못된 회차 날짜 형식: ${show.date}`)
      if (!timePattern.test(show.time || '')) error(id, `잘못된 회차 시간 형식: ${show.time}`)
      if (!show.day) error(id, `${show.date || '날짜 미상'} 회차의 요일이 없습니다.`)

      const key = `${show.date}-${show.time}`
      if (scheduleKeys.has(key)) error(id, `중복 회차입니다: ${key}`)
      scheduleKeys.add(key)

      if (previous && key < previous) error(id, 'schedule이 날짜와 시간 오름차순으로 정렬되지 않았습니다.')
      previous = key

      if (show.date < performance.startDate || show.date > performance.endDate) {
        error(id, `회차 ${show.date}가 공연 기간 밖에 있습니다.`)
      }
    }

    if (schedule[0]?.date !== performance.startDate) error(id, '첫 회차 날짜와 startDate가 다릅니다.')
    if (schedule.at(-1)?.date !== performance.endDate) error(id, '마지막 회차 날짜와 endDate가 다릅니다.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(performance.verifiedAt || '')) {
    error(id, 'verifiedAt 형식은 YYYY-MM-DD여야 합니다.')
  } else {
    const verifiedTime = new Date(`${performance.verifiedAt}T00:00:00+09:00`).getTime()
    const daysSinceVerification = Math.floor((Date.now() - verifiedTime) / 86400000)
    if (daysSinceVerification < 0) error(id, 'verifiedAt이 현재 날짜보다 미래입니다.')
    if (daysSinceVerification > 30 && parseDotDate(performance.endDate) >= new Date()) {
      warn(id, `공식 출처 확인 후 ${daysSinceVerification}일이 지났습니다. 일정과 링크를 재확인하세요.`)
    }
  }

  await verifyBookingPage(performance)
  await verifySourcePage(performance)
}

for (const message of warnings) console.warn(`WARN ${message}`)
for (const message of errors) console.error(`ERROR ${message}`)

console.log(`공연 ${performances.length}건, 회차 ${performances.reduce((sum, item) => sum + (item.schedule?.length || 0), 0)}건 검사 완료${offline ? ' (offline)' : ''}.`)

if (errors.length > 0 || (strict && warnings.length > 0)) {
  process.exitCode = 1
} else {
  console.log('공연 데이터 검증 통과.')
}
