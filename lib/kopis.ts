const API_KEY = process.env.KOPIS_API_KEY?.trim()
const BASE = 'http://www.kopis.or.kr/openApi/restful'
const POPULAR_MUSIC_GENRE_CODE = process.env.KOPIS_POPULAR_MUSIC_GENRE_CODE?.trim() || 'CCCD'
const CAST_SCAN_PAGES = Number(process.env.KOPIS_CAST_SCAN_PAGES || '2')

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
  now.setDate(1)
  const future = new Date()
  future.setMonth(future.getMonth() + 12)
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

function parsePerformanceList(xml: string): Omit<KopisPerformance, 'detailUrl' | 'bookingName' | 'bookingUrl'>[] {
  return extractXmlBlocks(xml, 'db')
    .map((block) => ({
      id: extractXmlValue(block, 'mt20id'),
      title: extractXmlValue(block, 'prfnm'),
      venue: extractXmlValue(block, 'fcltynm'),
      startDate: parseDate(extractXmlValue(block, 'prfpdfrom')),
      endDate: parseDate(extractXmlValue(block, 'prfpdto')),
      genre: extractXmlValue(block, 'genrenm'),
      state: extractXmlValue(block, 'prfstate'),
      posterUrl: extractXmlValue(block, 'poster'),
    }))
    .filter((item) => item.id && item.title)
}

async function fetchPerformanceList(params: Record<string, string>): Promise<Omit<KopisPerformance, 'detailUrl' | 'bookingName' | 'bookingUrl'>[]> {
  if (!API_KEY) return []

  try {
    const url = new URL(`${BASE}/pblprfr`)
    url.searchParams.set('service', API_KEY)
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })

    const res = await fetch(url)
    if (!res.ok) return []

    const xml = await res.text()
    if (extractXmlValue(xml, 'returncode')) return []

    return parsePerformanceList(xml)
  } catch {
    return []
  }
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
  if (!API_KEY) return { bookingName: '', bookingUrl: '' }

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

async function getPerformancePeople(id: string): Promise<string> {
  if (!API_KEY) return ''

  try {
    const res = await fetch(`${BASE}/pblprfr/${id}?service=${API_KEY}`)
    if (!res.ok) return ''

    const xml = await res.text()
    return [
      extractXmlValue(xml, 'prfnm'),
      extractXmlValue(xml, 'prfcast'),
      extractXmlValue(xml, 'prfcrew'),
    ].join(' ')
  } catch {
    return ''
  }
}

function includesArtist(text: string, artistName: string) {
  const normalized = text.replace(/\s/g, '').toLowerCase()
  const artist = artistName.replace(/\s/g, '').toLowerCase()

  return normalized.includes(artist) || normalized.includes('isaachong')
}

function sortPerformances(performances: KopisPerformance[]) {
  return performances.sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export async function getUpcomingPerformances(artistName = '홍이삭'): Promise<KopisPerformance[]> {
  if (!API_KEY) return []

  try {
    const { stdate, eddate } = getDateRange()
    const found = new Map<string, Omit<KopisPerformance, 'detailUrl' | 'bookingName' | 'bookingUrl'>>()

    const directResults = await fetchPerformanceList({
      stdate,
      eddate,
      shprfnm: artistName,
      rows: '100',
      cpage: '1',
    })

    directResults.forEach((item) => found.set(item.id, item))

    const scanPages = Number.isFinite(CAST_SCAN_PAGES) ? Math.max(0, Math.min(CAST_SCAN_PAGES, 5)) : 2
    if (scanPages > 0) {
      const pages = await Promise.all(
        Array.from({ length: scanPages }, (_, page) =>
          fetchPerformanceList({
            stdate,
            eddate,
            shcate: POPULAR_MUSIC_GENRE_CODE,
            rows: '100',
            cpage: String(page + 1),
          })
        )
      )
      const scanCandidates = pages.flat().filter((item) => !found.has(item.id))
      const matchedByPeople = await Promise.all(
        scanCandidates.map(async (item) => {
          const people = await getPerformancePeople(item.id)
          return includesArtist(`${item.title} ${people}`, artistName) ? item : null
        })
      )

      matchedByPeople.forEach((item) => {
        if (item) found.set(item.id, item)
      })
    }

    const performances = await Promise.all(Array.from(found.values()).map(async (item) => {
      const detailUrl = `http://www.kopis.or.kr/por/db/perf/prfDetail.do?menuId=MNU_00010&mt20id=${item.id}`
      const booking = await getBookingInfo(item.id, item.title)

      return {
        ...item,
        detailUrl: booking.bookingUrl || detailUrl,
        bookingName: booking.bookingName,
        bookingUrl: booking.bookingUrl,
      }
    }))

    return sortPerformances(performances)
  } catch {
    return []
  }
}
