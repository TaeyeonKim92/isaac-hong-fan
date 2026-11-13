import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

function formatSeoul(date, _timeZone, format) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))

  const day = `${parts.year}-${parts.month}-${parts.day}`
  if (format === 'yyyy') return parts.year
  if (format === 'HH:mm') return `${parts.hour}:${parts.minute}`
  if (format === 'yyyy-MM-dd') return day
  if (format === "yyyy-MM-dd'T'HH:mm:ssXXX") return `${day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`
  throw new Error(`Unsupported test format: ${format}`)
}

const context = {
  console,
  Map,
  Set,
  Date,
  JSON,
  Math,
  String,
  Number,
  Object,
  Array,
  RegExp,
  Error,
  Utilities: { formatDate: formatSeoul },
  UrlFetchApp: {
    fetch(url, options) {
      const args = options.payload
        ? ['-sS', '-X', 'POST', url, '-H', 'Content-Type: application/json', '--data-binary', options.payload]
        : ['-sS', url]
      let body = execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
      if (!body.trim()) body = execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })

      return {
        getResponseCode: () => 200,
        getContentText: () => body
      }
    },
    fetchAll(requests) {
      return requests.map((request) => this.fetch(request.url, request))
    }
  }
}

vm.createContext(context)
vm.runInContext(readFileSync(new URL('./google-apps-script/Code.gs', import.meta.url), 'utf8'), context)

const candidates = context.getNotionScheduleCandidates()
if (!candidates.length) throw new Error('No schedule candidates were parsed from the public Notion database.')
if (candidates.some((candidate) => candidate.status !== 'review' || !candidate.eventId.startsWith('notion-'))) {
  throw new Error('A parsed candidate violated the review-only or event ID rule.')
}

function existingRow(category, title, startDate, venue = '') {
  const row = new Array(19).fill('')
  row[2] = category
  row[3] = title
  row[4] = startDate
  row[8] = venue
  return row
}

const duplicateFixtures = [
  existingRow('라디오', '[SBS 파워FM] 두시탈출 컬투쇼', '2026-11-14', 'SBS 파워FM'),
  existingRow('발매', 'EP [결] Release', '2026-11-19'),
  existingRow('팬이벤트', '인사이드 르윈 프리미어 GV', '2026-11-29'),
  ...['11', '12', '18', '19', '20', '24', '25', '26', '27'].map((day) =>
    existingRow('공연', '2026 홍이삭 소극장 콘서트 〈결〉', `2026-12-${day}`, '이화여자대학교 ECC 영산극장')
  )
]

const unmatched = candidates.filter((candidate) =>
  !duplicateFixtures.some((row) => context.isSameScheduleCandidate(candidate, row))
)
if (unmatched.length) {
  throw new Error(`Known duplicate fixtures were not recognized: ${unmatched.map((event) => event.title).join(', ')}`)
}

console.log(`Notion 후보 ${candidates.length}건 파싱 완료`)
candidates.forEach((candidate) => {
  console.log(`${candidate.startDate}\t${candidate.category}\t${candidate.title}`)
})

const mnetEvents = context.fetchMnetEvents(2026)
if (mnetEvents.length !== 51) throw new Error(`Expected 51 Mnet events, received ${mnetEvents.length}.`)
const mnetCandidates = mnetEvents.map((event) => context.mnetEventToCandidate(event, '2026-11-13T00:00:00+09:00'))
if (mnetCandidates.some((candidate) => !candidate.startDate || candidate.status !== 'approved')) {
  throw new Error('A Mnet event failed the official approved-row contract.')
}
console.log(`Mnet Plus 공식 일정 ${mnetCandidates.length}건 파싱 완료`)
