const API_KEY = process.env.KOPIS_API_KEY!
const BASE = 'http://www.kopis.or.kr/openApi/restful'

export interface KopisPerformance {
  id: string
  title: string
  venue: string
  startDate: string
  endDate: string
  genre: string
  state: string
  posterUrl: string
  detailUrl: string
  bookingName: string
  bookingUrl: string
}

function parseDate(dateText: string): string {
  const digits = dateText.replace(/\D/g, '')
  if (digits.length < 8) return dateText

  const year = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day = digits.slice(6, 8)
  return `${year}.${month}.${day}`
}

function getDateRange() {
  const now = new Date()
  const future = new Date()
  future.setMonth(future.getMonth() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return { stdate: fmt(now), eddate: fmt(future) }
}

function extractXmlValues(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'g')
  const results: string[] = []
  let m
  while ((m = regex.exec(xml)) !== null) {
    results.push((m[1] ?? m[2] ?? '').trim())
  }
  return results
}

function extractXmlBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g')
  const results: string[] = []
  let m
  while ((m = regex.exec(xml)) !== null) {
    results.push(m[1] ?? '')
  }
  return results
}

function extractXmlValue(xml: string, tag: string): string {
  return extractXmlValues(xml, tag)[0] ?? ''
}

function encodeSearchQuery(query: string): string {
  return encodeURIComponent(query.trim()).replace(/%20/g, '+')
}

function getBookingSearchQuery(title: string): string {
  return title.split(',')[0]?.trim() || title
}

function buildBookingSearchUrl(bookingName: string, title: string): string {
  const query = getBookingSearchQuery(title)

  if (/the player season 3/i.test(title)) {
    return `https://www.ticketlink.co.kr/search?query=${encodeSearchQuery(query)}`
  }

  if (/티켓링크|ticketlink/i.test(bookingName)) {
    return `https://www.ticketlink.co.kr/search?query=${encodeSearchQuery(query)}`
  }

  if (/예스24|yes24/i.test(bookingName)) {
    return `https://ticket.yes24.com/New/Search?query=${encodeSearchQuery(query)}`
  }

  if (/놀|인터파크|interpark|nol/i.test(bookingName)) {
    return `https://tickets.interpark.com/goods/search?keyword=${encodeSearchQuery(query)}`
  }

  return ''
}

function isUsableBookingUrl(url: string): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    const href = parsed.href.toLowerCase()

    if (href.includes('notice_ticket.html')) return false
    if (parsed.hostname === 'tkfile.yes24.com') return false

    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

async function getBookingInfo(id: string, title: string): Promise<{ bookingName: string; bookingUrl: string }> {
  try {
    const res = await fetch(`${BASE}/pblprfr/${id}?service=${API_KEY}`)
    const xml = await res.text()
    const relates = extractXmlBlocks(xml, 'relate')

    for (const relate of relates) {
      const bookingName = extractXmlValue(relate, 'relatenm')
      const searchUrl = buildBookingSearchUrl(bookingName, title)
      if (bookingName && searchUrl) {
        return { bookingName, bookingUrl: searchUrl }
      }
    }

    for (const relate of relates) {
      const bookingName = extractXmlValue(relate, 'relatenm')
      const relateUrl = extractXmlValue(relate, 'relateurl')
      if (bookingName && isUsableBookingUrl(relateUrl)) {
        return { bookingName, bookingUrl: relateUrl }
      }
    }
  } catch {
    // Fall back to the KOPIS detail URL below.
  }

  return { bookingName: '', bookingUrl: '' }
}

export async function getUpcomingPerformances(artistName = '홍이삭'): Promise<KopisPerformance[]> {
  try {
    const { stdate, eddate } = getDateRange()
    const params = new URLSearchParams({
      service: API_KEY,
      stdate,
      eddate,
      shprfnm: artistName,
      rows: '10',
      cpage: '1',
    })
    const res = await fetch(`${BASE}/pblprfr?${params}`)
    const xml = await res.text()

    const ids = extractXmlValues(xml, 'mt20id')
    const titles = extractXmlValues(xml, 'prfnm')
    const venues = extractXmlValues(xml, 'fcltynm')
    const startDates = extractXmlValues(xml, 'prfpdfrom')
    const endDates = extractXmlValues(xml, 'prfpdto')
    const genres = extractXmlValues(xml, 'genrenm')
    const states = extractXmlValues(xml, 'prfstate')
    const posters = extractXmlValues(xml, 'poster')

    const performances = await Promise.all(ids.map(async (id, i) => {
      const title = titles[i] ?? ''
      const detailUrl = `http://www.kopis.or.kr/por/db/perf/prfDetail.do?menuId=MNU_00010&mt20id=${id}`
      const booking = await getBookingInfo(id, title)

      return {
        id,
        title,
        venue: venues[i] ?? '',
        startDate: parseDate(startDates[i] ?? ''),
        endDate: parseDate(endDates[i] ?? ''),
        genre: genres[i] ?? '',
        state: states[i] ?? '',
        posterUrl: posters[i] ?? '',
        detailUrl: booking.bookingUrl || detailUrl,
        bookingName: booking.bookingName,
        bookingUrl: booking.bookingUrl,
      }
    }))

    return performances
  } catch {
    return []
  }
}
