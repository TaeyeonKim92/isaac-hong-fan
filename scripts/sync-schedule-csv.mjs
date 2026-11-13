import fs from 'node:fs'
import path from 'node:path'

const csvPath = process.argv[2]
if (!csvPath) throw new Error('사용법: node scripts/sync-schedule-csv.mjs <일정관리.csv>')

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && quoted && next === '"') {
      value += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(value)
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }

  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }

  const [headers, ...records] = rows
  return records.map((record) => Object.fromEntries(
    headers.map((header, index) => [header.replace(/^\uFEFF/, ''), record[index] ?? '']),
  ))
}

function dottedDate(value) {
  return value.replace(/-/g, '.')
}

function normalizedTitle(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[〈〉<>《》「」『』\[\](){}]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

function scheduleKey(title, date, time = '') {
  return `${dottedDate(date)}|${time}|${normalizedTitle(title)}`
}

function compact(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== ''))
}

const csv = fs.readFileSync(path.resolve(csvPath), 'utf8')
const rows = parseCsv(csv)
const performances = JSON.parse(fs.readFileSync('data/performances.json', 'utf8'))
const performanceKeys = new Set()

for (const performance of performances) {
  const shows = performance.schedule?.length
    ? performance.schedule
    : [{ date: performance.startDate, time: '' }]

  for (const show of shows) {
    performanceKeys.add(scheduleKey(performance.title, show.date, show.time ?? ''))
  }
}

const approvedRows = rows.filter((row) => row.status === 'approved')
const published = approvedRows
  .filter((row) => !performanceKeys.has(scheduleKey(row.title, row.startDate, row.startTime)))
  .map((row) => compact({
    id: row.eventId,
    status: row.status,
    category: row.category || '기타',
    title: row.title,
    startDate: dottedDate(row.startDate),
    startTime: row.startTime,
    endDate: dottedDate(row.endDate || row.startDate),
    endTime: row.endTime,
    venue: row.venue,
    description: row.description,
    url: row.bookingUrl || row.instagramUrl || row.sourceUrl,
    linkLabel: row.bookingUrl ? '예매하기' : '공식 일정 보기',
  }))
  .sort((a, b) => `${a.startDate} ${a.startTime ?? ''}`.localeCompare(`${b.startDate} ${b.startTime ?? ''}`))

fs.writeFileSync('data/schedule.json', `${JSON.stringify(published, null, 2)}\n`, 'utf8')

console.log(`승인 ${approvedRows.length}개 중 공연 기준 데이터와 중복된 ${approvedRows.length - published.length}개를 제외했습니다.`)
console.log(`data/schedule.json에 ${published.length}개 일정을 기록했습니다.`)
