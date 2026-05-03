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
}

function parseDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length < 8) return yyyymmdd
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`
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

    return ids.map((id, i) => ({
      id,
      title: titles[i] ?? '',
      venue: venues[i] ?? '',
      startDate: parseDate(startDates[i] ?? ''),
      endDate: parseDate(endDates[i] ?? ''),
      genre: genres[i] ?? '',
      state: states[i] ?? '',
      posterUrl: posters[i] ?? '',
      detailUrl: `http://www.kopis.or.kr/por/db/perf/prfDetail.do?menuId=MNU_00010&mt20id=${id}`,
    }))
  } catch {
    return []
  }
}
