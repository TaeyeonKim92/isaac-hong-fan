const RELEASES_URL = 'https://www.youtube.com/@pngisacofficial/releases?hl=ko&gl=KR'

function extractAssignedJson(html, marker) {
  const markerIndex = html.indexOf(marker)
  if (markerIndex < 0) return null

  const start = html.indexOf('{', markerIndex + marker.length)
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < html.length; index += 1) {
    const char = html[index]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return JSON.parse(html.slice(start, index + 1))
    }
  }

  return null
}

function collectReleasePlaylists(initialData) {
  const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? []
  const selectedContent = tabs.find((tab) => tab.tabRenderer?.selected)?.tabRenderer?.content
  if (!selectedContent) throw new Error('선택된 Releases 탭을 찾지 못했습니다.')

  const playlists = new Map()

  function walk(value) {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }

    const playlist = value.playlistRenderer
    if (playlist?.playlistId?.startsWith('OLAK5uy_')) {
      playlists.set(playlist.playlistId, playlist.title?.simpleText ?? '(제목 없음)')
    }

    Object.values(value).forEach(walk)
  }

  walk(selectedContent)
  return playlists
}

const response = await fetch(RELEASES_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; IsaacHongFanReleaseCheck/1.0)',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  },
})

if (!response.ok) throw new Error(`Releases 페이지 요청 실패: HTTP ${response.status}`)

const initialData = extractAssignedJson(await response.text(), 'var ytInitialData = ')
if (!initialData) throw new Error('Releases 페이지의 ytInitialData를 읽지 못했습니다.')

const playlists = collectReleasePlaylists(initialData)
if (playlists.size === 0) throw new Error('OLAK5uy_ 발매 플레이리스트를 찾지 못했습니다.')

console.log(`YouTube Releases 검증 통과: 발매 플레이리스트 ${playlists.size}개`)
console.log([...playlists.values()].slice(0, 5).map((title) => `- ${title}`).join('\n'))
