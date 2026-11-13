const HEADERS = [
  'eventId', 'status', 'category', 'title', 'startDate', 'startTime', 'endDate', 'endTime',
  'venue', 'description', 'bookingUrl', 'instagramUrl', 'sourceName', 'sourceUrl',
  'sourceMediaId', 'confidence', 'verifiedAt', 'lastCheckedAt', 'notes'
]

const NOTION_SOURCE = {
  pageId: '2dc189fb-8bc4-807b-8f99-cc9c9faef8c5',
  collectionId: '2dc189fb-8bc4-8068-8899-000b43bbb545',
  viewId: '2dc189fb-8bc4-8099-a705-000cd04e2bda',
  url: 'https://app.notion.com/p/2dc189fb8bc4807b8f99cc9c9faef8c5?v=2dc189fb8bc48099a705000cd04e2bda'
}

const NOTION_TYPE_MAP = {
  '공연': '공연',
  '단독콘서트': '공연',
  '방송': '방송',
  '녹화': '방송',
  '라디오': '라디오',
  '음원발매': '발매',
  '앨범 발매': '발매',
  'OST 발매': '발매',
  '시상식': '기타'
}

const MNET_SOURCE = {
  apiBase: 'https://artist.mnetplus.world/svc/stg/isaachong/space/api/v1/calendar',
  pageBase: 'https://artist.mnetplus.world/main/stg/isaachong/schedule'
}

function scheduleConfig() {
  const properties = PropertiesService.getScriptProperties()
  return {
    spreadsheetId: properties.getProperty('SPREADSHEET_ID') || '',
    sheetName: properties.getProperty('SHEET_NAME') || '일정관리',
    calendarId: properties.getProperty('CALENDAR_ID') || ''
  }
}

function jsonResponse(body, status) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON)
}

function doGet() {
  return jsonResponse({ ok: true, service: 'hongisaac-schedule-sheet' })
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(5000)

  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}')
    const properties = PropertiesService.getScriptProperties()
    const expectedSecret = properties.getProperty('WEBHOOK_SECRET')
    const config = scheduleConfig()
    const spreadsheetId = config.spreadsheetId
    const sheetName = config.sheetName

    if (!expectedSecret || body.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'unauthorized' })
    }
    if (!spreadsheetId) return jsonResponse({ ok: false, error: 'missing spreadsheet id' })

    const event = body.event || {}
    if (!event.eventId || event.status !== 'review' || !event.startDate || !event.title) {
      return jsonResponse({ ok: false, error: 'invalid event' })
    }

    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)
    if (!sheet) return jsonResponse({ ok: false, error: 'sheet not found' })

    const headers = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0]
    if (HEADERS.some((header, index) => headers[index] !== header)) {
      return jsonResponse({ ok: false, error: 'header mismatch' })
    }

    const duplicate = sheet
      .getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
      .createTextFinder(event.eventId)
      .matchEntireCell(true)
      .findNext()
    if (duplicate) return jsonResponse({ ok: true, duplicate: true, row: duplicate.getRow() })

    const row = HEADERS.map((header) => event[header] === undefined ? '' : event[header])
    const nextRow = sheet.getLastRow() + 1
    const target = sheet.getRange(nextRow, 1, 1, HEADERS.length)

    if (sheet.getLastRow() >= 2) {
      const exemplar = sheet.getRange(2, 1, 1, HEADERS.length)
      exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false)
      exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false)
    }
    target.setValues([row])
    SpreadsheetApp.flush()

    return jsonResponse({ ok: true, row: nextRow, eventId: event.eventId })
  } catch (error) {
    console.error(error)
    return jsonResponse({ ok: false, error: String(error) })
  } finally {
    lock.releaseLock()
  }
}

function parseCalendarTitle(title) {
  const match = String(title || '').match(/^\[([^\]]+)\]\s*(.+)$/)
  const rawCategory = match ? match[1] : '기타'
  const categoryMap = {
    '공연': '공연', '페스티벌': '공연', '콘서트': '공연',
    '방송': '방송', '라디오': '라디오', '발매': '발매',
    '팬이벤트': '팬이벤트', '티켓오픈': '티켓오픈', '기타': '기타'
  }
  return {
    category: categoryMap[rawCategory] || '기타',
    title: match ? match[2].trim() : String(title || '').trim()
  }
}

function formatCalendarDate(date, format) {
  return Utilities.formatDate(date, 'Asia/Seoul', format)
}

function extractFirstUrl(text, matcher) {
  const urls = String(text || '').match(/https?:\/\/[^\s<>]+/g) || []
  return urls.find((url) => matcher.test(url)) || ''
}

function calendarEventToRow(event, existingRow) {
  const parsed = parseCalendarTitle(event.getTitle())
  const description = event.getDescription() || ''
  const googleEventId = event.getId()
  const isAllDay = event.isAllDayEvent()
  const start = event.getStartTime()
  const rawEnd = event.getEndTime()
  const end = isAllDay ? new Date(rawEnd.getTime() - 24 * 60 * 60 * 1000) : rawEnd
  const mnetUrl = extractFirstUrl(description, /artist\.mnetplus\.world/i)
  const instagramUrl = extractFirstUrl(description, /instagram\.com/i)
  const bookingUrl = extractFirstUrl(description, /ticketlink|interpark|yes24|nol\.ticket/i)
  const official = Boolean(mnetUrl)
  const existingId = existingRow && existingRow[0]

  return [
    existingId || `gcal-${googleEventId}`,
    official ? 'approved' : 'review',
    parsed.category,
    parsed.title,
    formatCalendarDate(start, 'yyyy-MM-dd'),
    isAllDay ? '' : formatCalendarDate(start, 'HH:mm'),
    formatCalendarDate(end, 'yyyy-MM-dd'),
    isAllDay ? '' : formatCalendarDate(end, 'HH:mm'),
    event.getLocation() || '',
    description.replace(/https?:\/\/[^\s<>]+/g, '').replace(/\s+/g, ' ').trim(),
    bookingUrl,
    instagramUrl,
    official ? 'Mnet Plus 소속사 공식 일정' : 'Google Calendar 공용 일정',
    mnetUrl,
    official ? (mnetUrl.match(/eventId=([a-z0-9]+)/i) || [])[1] || googleEventId : googleEventId,
    official ? 'high' : 'medium',
    official ? formatCalendarDate(new Date(), 'yyyy-MM-dd') : '',
    formatCalendarDate(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    `Google Calendar eventId: ${googleEventId}`
  ]
}

function syncCalendarToSheet() {
  const config = scheduleConfig()
  const spreadsheetId = config.spreadsheetId
  const sheetName = config.sheetName
  const calendarId = config.calendarId

  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)
  const calendar = CalendarApp.getCalendarById(calendarId)
  if (!sheet || !calendar) throw new Error('시트 또는 캘린더를 찾을 수 없습니다.')

  const lastRow = sheet.getLastRow()
  const values = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues() : []
  const calendarRows = new Map()
  values.forEach((row, index) => {
    const match = String(row[18] || '').match(/Google Calendar eventId:\s*([^\s]+)/)
    if (match) calendarRows.set(match[1], { rowNumber: index + 2, values: row })
  })

  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const to = new Date(now.getFullYear() + 2, now.getMonth() + 1, 1)
  const events = calendar.getEvents(from, to)
  const seen = new Set()

  events.forEach((event) => {
    const eventId = event.getId()
    seen.add(eventId)
    const existing = calendarRows.get(eventId)
    const row = calendarEventToRow(event, existing && existing.values)

    if (existing) {
      sheet.getRange(existing.rowNumber, 1, 1, HEADERS.length).setValues([row])
    } else {
      const nextRow = sheet.getLastRow() + 1
      const target = sheet.getRange(nextRow, 1, 1, HEADERS.length)
      if (sheet.getLastRow() >= 2) {
        const exemplar = sheet.getRange(2, 1, 1, HEADERS.length)
        exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false)
        exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false)
      }
      target.setValues([row])
    }
  })

  calendarRows.forEach((entry, eventId) => {
    if (!seen.has(eventId)) {
      sheet.getRange(entry.rowNumber, 2).setValue('cancelled')
      sheet.getRange(entry.rowNumber, 19).setValue(`Google Calendar eventId: ${eventId} · 캘린더에서 삭제됨`)
    }
  })

  if (sheet.getLastRow() > 2) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length)
      .sort([{ column: 5, ascending: true }, { column: 6, ascending: true }])
  }
  SpreadsheetApp.flush()
}

function installCalendarSyncTrigger() {
  const calendarId = scheduleConfig().calendarId

  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'syncCalendarToSheet')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger))

  ScriptApp.newTrigger('syncCalendarToSheet')
    .forUserCalendar(calendarId)
    .onEventUpdated()
    .create()

  syncCalendarToSheet()
}

function postNotionJson(path, body) {
  const response = UrlFetchApp.fetch(`https://www.notion.so/api/v3/${path}`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HongIsaacScheduleBot/1.0)'
    }
  })
  const status = response.getResponseCode()
  if (status < 200 || status >= 300) {
    throw new Error(`Notion ${path} 요청 실패: HTTP ${status}`)
  }
  return JSON.parse(response.getContentText())
}

function notionPropertyIdByName(schema, name) {
  return Object.keys(schema || {}).find((propertyId) => schema[propertyId] && schema[propertyId].name === name) || ''
}

function notionPlainText(property) {
  return (property || [])
    .map((segment) => Array.isArray(segment) ? String(segment[0] || '') : '')
    .filter((text) => text !== '‣')
    .join('')
    .trim()
}

function notionFirstLink(property) {
  for (const segment of property || []) {
    const decorations = Array.isArray(segment) ? segment[1] : null
    for (const decoration of decorations || []) {
      if (decoration[0] === 'a' && decoration[1] && !String(decoration[1]).startsWith('attachment:')) {
        return String(decoration[1])
      }
    }
  }
  const text = notionPlainText(property)
  return /^https?:\/\//i.test(text) ? text : ''
}

function notionDateValue(property) {
  for (const segment of property || []) {
    const decorations = Array.isArray(segment) ? segment[1] : null
    for (const decoration of decorations || []) {
      if (decoration[0] === 'd' && decoration[1] && decoration[1].start_date) return decoration[1]
    }
  }
  return null
}

function stripScheduleEmoji(title) {
  return String(title || '')
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferNotionCategory(rawType, title) {
  if (NOTION_TYPE_MAP[rawType]) return NOTION_TYPE_MAP[rawType]

  const text = `${rawType || ''} ${title || ''}`
  if (/📻|라디오|컬투쇼|FM/i.test(text)) return '라디오'
  if (/🎸|콘서트|페스티벌|공연/i.test(text)) return '공연'
  if (/📺|방송|녹화|TV/i.test(text)) return '방송'
  if (/💿|음원|앨범|OST|\bEP\b|release/i.test(text)) return '발매'
  if (/GV|팬\s*(미팅|사인회|이벤트)/i.test(text)) return '팬이벤트'
  return ''
}

function normalizeScheduleText(value) {
  return stripScheduleEmoji(value)
    .toLowerCase()
    .replace(/20\d{2}/g, '')
    .replace(/[0-9]+(?:회|차)?$/g, '')
    .replace(/[^0-9a-z가-힣]/g, '')
}

function longestCommonSubstringLength(left, right) {
  if (!left || !right) return 0
  const previous = new Array(right.length + 1).fill(0)
  let longest = 0
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = 0
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex]
      if (left[leftIndex - 1] === right[rightIndex - 1]) {
        previous[rightIndex] = diagonal + 1
        longest = Math.max(longest, previous[rightIndex])
      } else {
        previous[rightIndex] = 0
      }
      diagonal = above
    }
  }
  return longest
}

function isSameScheduleCandidate(candidate, existingRow) {
  if (candidate.startDate !== String(existingRow[4] || '')) return false
  const existingCategory = String(existingRow[2] || '')
  if (candidate.category !== existingCategory) return false

  const candidateTitle = normalizeScheduleText(candidate.title)
  const existingTitle = normalizeScheduleText(existingRow[3])
  if (candidateTitle === existingTitle || candidateTitle.includes(existingTitle) || existingTitle.includes(candidateTitle)) {
    return true
  }

  if (longestCommonSubstringLength(candidateTitle, existingTitle) >= 3) return true

  const candidateVenue = normalizeScheduleText(candidate.venue)
  const existingVenue = normalizeScheduleText(existingRow[8])
  return Boolean(candidateVenue && existingVenue && (
    candidateVenue.includes(existingVenue) || existingVenue.includes(candidateVenue)
  ))
}

function getNotionScheduleCandidates() {
  const pageSnapshot = postNotionJson('loadCachedPageChunk', {
    pageId: NOTION_SOURCE.pageId,
    limit: 100,
    cursor: { stack: [] },
    chunkNumber: 0,
    verticalColumns: false
  })
  const response = postNotionJson('queryCollection', {
    collectionId: NOTION_SOURCE.collectionId,
    collectionViewId: NOTION_SOURCE.viewId,
    query: {},
    loader: {
      type: 'reducer',
      reducers: {
        collection_group_results: { type: 'results', limit: 1000 }
      },
      searchQuery: '',
      userTimeZone: 'Asia/Seoul'
    }
  })

  const recordMap = response.recordMap || {}
  const snapshotMap = pageSnapshot.recordMap || {}
  const collectionRecord = snapshotMap.collection && snapshotMap.collection[NOTION_SOURCE.collectionId]
  const collection = collectionRecord && collectionRecord.value && collectionRecord.value.value
  if (!collection || !collection.schema) throw new Error('Notion 데이터베이스 스키마를 찾을 수 없습니다.')

  const schema = collection.schema
  const propertyIds = {
    date: notionPropertyIdByName(schema, '날짜'),
    title: notionPropertyIdByName(schema, '제목') || 'title',
    url: notionPropertyIdByName(schema, 'URL'),
    type: notionPropertyIdByName(schema, '유형'),
    venue: notionPropertyIdByName(schema, '장소')
  }
  if (!propertyIds.date || !propertyIds.title) throw new Error('Notion의 날짜 또는 제목 열을 찾을 수 없습니다.')

  const result = response.result && response.result.reducerResults && response.result.reducerResults.collection_group_results
  const blockIds = result && result.blockIds ? result.blockIds : []
  const today = formatCalendarDate(new Date(), 'yyyy-MM-dd')
  const maxDate = `${Number(today.slice(0, 4)) + 2}-12-31`
  const checkedAt = formatCalendarDate(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")

  return blockIds.map((blockId) => {
    const blockRecord = recordMap.block && recordMap.block[blockId]
    const block = blockRecord && blockRecord.value && blockRecord.value.value
    if (!block || !block.properties) return null

    const properties = block.properties
    const date = notionDateValue(properties[propertyIds.date])
    const rawTitle = notionPlainText(properties[propertyIds.title])
    const rawType = notionPlainText(properties[propertyIds.type])
    const category = inferNotionCategory(rawType, rawTitle)
    const originalUrl = notionFirstLink(properties[propertyIds.url])
    if (!date || !rawTitle || !category || date.start_date < today || date.start_date > maxDate) return null

    const title = stripScheduleEmoji(rawTitle)
    const venue = notionPlainText(properties[propertyIds.venue])
    const notionRowUrl = `https://www.notion.so/${String(blockId).replace(/-/g, '')}`
    const instagramUrl = /instagram\.com/i.test(originalUrl) ? originalUrl : ''
    const bookingUrl = /ticketlink|tickets?\.interpark|ticket\.yes24|nol\.ticket/i.test(originalUrl) ? originalUrl : ''

    return {
      eventId: `notion-${blockId}`,
      status: 'review',
      category,
      title,
      startDate: date.start_date,
      startTime: date.start_time || '',
      endDate: date.end_date || date.start_date,
      endTime: date.end_time || '',
      venue,
      description: '',
      bookingUrl,
      instagramUrl,
      sourceName: 'Isaac Archive (팬 정리 Notion)',
      sourceUrl: notionRowUrl,
      sourceMediaId: blockId,
      confidence: 'low',
      verifiedAt: '',
      lastCheckedAt: checkedAt,
      notes: `팬 작성 자료 · 원본 유형: ${rawType || '미지정'}${originalUrl ? ` · 원본 링크: ${originalUrl}` : ''}`
    }
  }).filter(Boolean)
}

function sendNotionSyncEmail(subject, body) {
  const properties = PropertiesService.getScriptProperties()
  const recipient = properties.getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail()
  if (!recipient) return false
  MailApp.sendEmail({ to: recipient, subject, body })
  return true
}

function syncNotionToSheet() {
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)

  try {
    const properties = PropertiesService.getScriptProperties()
    const config = scheduleConfig()
    const spreadsheetId = config.spreadsheetId
    const sheetName = config.sheetName

    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)
    if (!sheet) throw new Error('일정관리 시트를 찾을 수 없습니다.')

    const headers = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0]
    if (HEADERS.some((header, index) => headers[index] !== header)) throw new Error('시트 헤더가 계약과 다릅니다.')

    const lastRow = sheet.getLastRow()
    const existingRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues() : []
    const existingById = new Map(existingRows.map((row, index) => [String(row[0] || ''), { row, rowNumber: index + 2 }]))
    const candidates = getNotionScheduleCandidates()
    const inserted = []
    const refreshed = []
    const matched = []

    candidates.forEach((candidate) => {
      const existing = existingById.get(candidate.eventId)
      if (existing) {
        if (String(existing.row[1] || '') === 'review') {
          const row = HEADERS.map((header) => candidate[header] === undefined ? '' : candidate[header])
          sheet.getRange(existing.rowNumber, 1, 1, HEADERS.length).setValues([row])
          refreshed.push(candidate)
        }
        return
      }

      const duplicate = existingRows.find((row) => isSameScheduleCandidate(candidate, row))
      if (duplicate) {
        matched.push(candidate)
        return
      }

      const row = HEADERS.map((header) => candidate[header] === undefined ? '' : candidate[header])
      const nextRow = sheet.getLastRow() + 1
      const target = sheet.getRange(nextRow, 1, 1, HEADERS.length)
      if (sheet.getLastRow() >= 2) {
        const exemplar = sheet.getRange(2, 1, 1, HEADERS.length)
        exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false)
        exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false)
      }
      target.setValues([row])
      existingRows.push(row)
      existingById.set(candidate.eventId, { row, rowNumber: nextRow })
      inserted.push(candidate)
    })

    if (sheet.getLastRow() > 2) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length)
        .sort([{ column: 5, ascending: true }, { column: 6, ascending: true }])
    }
    SpreadsheetApp.flush()
    properties.setProperty('LAST_NOTION_SYNC_AT', formatCalendarDate(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"))

    if (inserted.length) {
      const lines = inserted.map((event) => `- ${event.startDate} [${event.category}] ${event.title}${event.venue ? ` (${event.venue})` : ''}`)
      sendNotionSyncEmail(
        `[홍이삭 일정] 검토할 새 후보 ${inserted.length}건`,
        `Isaac Archive 팬 Notion에서 새 일정 후보를 찾았습니다.\n\n${lines.join('\n')}\n\nGoogle Sheet에서 확인 후 status를 approved 또는 rejected로 변경해주세요.\n${NOTION_SOURCE.url}`
      )
    }

    return {
      scanned: candidates.length,
      inserted: inserted.length,
      refreshed: refreshed.length,
      matchedExisting: matched.length
    }
  } catch (error) {
    sendNotionSyncEmail('[홍이삭 일정] Notion 자동 확인 실패', `오류: ${String(error)}\n\n${NOTION_SOURCE.url}`)
    throw error
  } finally {
    lock.releaseLock()
  }
}

function installNotionSyncTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'syncNotionToSheet')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger))

  ScriptApp.newTrigger('syncNotionToSheet')
    .timeBased()
    .atHour(9)
    .nearMinute(5)
    .everyDays(1)
    .inTimezone('Asia/Seoul')
    .create()

  return syncNotionToSheet()
}

function mnetCategory(labelName, title) {
  if (labelName === 'Concert' || labelName === 'Festival') return '공연'
  if (labelName === 'Release') return '발매'
  if (labelName === 'Anniversary') return '기타'
  if (labelName === 'Broadcast') {
    return /라디오|radio|fm|컬투쇼|별이 빛나는 밤에|키스 더 라디오/i.test(title || '') ? '라디오' : '방송'
  }
  return '기타'
}

function mnetMonthRequest(year, month) {
  const monthText = String(month).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  const startDate = `${year}-${monthText}-01`
  const endDate = `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`
  const startAt = new Date(`${startDate}T00:00:00+09:00`).toISOString()
  const endAt = new Date(`${endDate}T23:59:59.999+09:00`).toISOString()
  const query = [
    `startAt=${encodeURIComponent(startAt)}`,
    `endAt=${encodeURIComponent(endAt)}`,
    `startAtForAllDay=${startDate}`,
    `endAtForAllDay=${endDate}`
  ].join('&')
  return {
    url: `${MNET_SOURCE.apiBase}?${query}`,
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HongIsaacScheduleBot/1.0)' }
  }
}

function fetchMnetEvents(year) {
  const monthResponses = UrlFetchApp.fetchAll(Array.from({ length: 12 }, (_, index) => mnetMonthRequest(year, index + 1)))
  const eventMap = new Map()

  monthResponses.forEach((response, index) => {
    const status = response.getResponseCode()
    if (status < 200 || status >= 300) throw new Error(`Mnet ${index + 1}월 일정 요청 실패: HTTP ${status}`)
    const body = JSON.parse(response.getContentText())
    ;(body.events || []).forEach((event) => eventMap.set(event.id, event))
  })

  const events = Array.from(eventMap.values())
  const detailResponses = UrlFetchApp.fetchAll(events.map((event) => ({
    url: `${MNET_SOURCE.apiBase}/${event.id}`,
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HongIsaacScheduleBot/1.0)' }
  })))

  return events.map((event, index) => {
    const response = detailResponses[index]
    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) return event
    return Object.assign({}, event, JSON.parse(response.getContentText()))
  })
}

function mnetVenue(body) {
  const match = String(body || '').match(/(?:장소|공연장)\s*[:：]\s*([^\n\r]+)/i)
  return match ? match[1].trim() : ''
}

function mnetEventToCandidate(event, checkedAt) {
  const allDay = Boolean(event.allDay)
  const start = allDay ? null : new Date(event.startAt)
  const end = !allDay && event.endAt ? new Date(event.endAt) : null
  const startDate = allDay ? event.startAtAllDay : formatCalendarDate(start, 'yyyy-MM-dd')
  const endDate = allDay ? (event.endAtAllDay || startDate) : (end ? formatCalendarDate(end, 'yyyy-MM-dd') : startDate)
  const category = mnetCategory(event.label && event.label.name, event.title)
  const month = String(startDate || '').slice(5, 7)
  const sourceUrl = `${MNET_SOURCE.pageBase}/${String(startDate || '').slice(0, 4)}/${month}?eventId=${event.id}`

  return {
    eventId: `mnet-${event.id}`,
    status: 'approved',
    category,
    title: event.title || '',
    startDate: startDate || '',
    startTime: allDay || !start ? '' : formatCalendarDate(start, 'HH:mm'),
    endDate: endDate || '',
    endTime: allDay || !end ? '' : formatCalendarDate(end, 'HH:mm'),
    venue: mnetVenue(event.body),
    description: String(event.body || '').trim(),
    bookingUrl: '',
    instagramUrl: '',
    sourceName: 'Mnet Plus 소속사 공식 일정',
    sourceUrl,
    sourceMediaId: event.id,
    confidence: 'high',
    verifiedAt: formatCalendarDate(new Date(), 'yyyy-MM-dd'),
    lastCheckedAt: checkedAt,
    notes: allDay ? '종일 일정' : (!event.endAt ? '종료 시각 미공개' : '')
  }
}

function mergeMnetCandidate(candidate, existingRow) {
  const existing = existingRow || []
  const merged = HEADERS.map((header) => candidate[header] === undefined ? '' : candidate[header])
  ;[8, 9, 10, 11].forEach((index) => {
    if (!merged[index] && existing[index]) merged[index] = existing[index]
  })
  const calendarNote = String(existing[18] || '').match(/Google Calendar eventId:\s*([^\s·]+)/)
  const noteParts = [candidate.notes]
  if (calendarNote) noteParts.push(`Google Calendar eventId: ${calendarNote[1]}`)
  merged[18] = noteParts.filter(Boolean).join(' · ')
  return merged
}

function syncMnetToSheet(year) {
  const properties = PropertiesService.getScriptProperties()
  const config = scheduleConfig()
  const spreadsheetId = config.spreadsheetId
  const sheetName = config.sheetName

  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)
  if (!sheet) throw new Error('일정관리 시트를 찾을 수 없습니다.')
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0]
  if (HEADERS.some((header, index) => headers[index] !== header)) throw new Error('시트 헤더가 계약과 다릅니다.')

  const targetYear = year || Number(formatCalendarDate(new Date(), 'yyyy'))
  const checkedAt = formatCalendarDate(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
  const candidates = fetchMnetEvents(targetYear)
    .map((event) => mnetEventToCandidate(event, checkedAt))
    .filter((event) => event.startDate)
    .sort((left, right) => `${left.startDate} ${left.startTime}`.localeCompare(`${right.startDate} ${right.startTime}`))

  const lastRow = sheet.getLastRow()
  const existingRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues() : []
  const existingById = new Map(existingRows.map((row, index) => [String(row[0] || ''), { row, rowNumber: index + 2 }]))
  let inserted = 0
  let updated = 0
  let upgraded = 0

  candidates.forEach((candidate) => {
    let existing = existingById.get(candidate.eventId)
    if (!existing) {
      const duplicateIndex = existingRows.findIndex((row) => isSameScheduleCandidate(candidate, row))
      if (duplicateIndex >= 0) {
        existing = { row: existingRows[duplicateIndex], rowNumber: duplicateIndex + 2 }
        upgraded += 1
      }
    }

    const merged = mergeMnetCandidate(candidate, existing && existing.row)
    if (existing) {
      sheet.getRange(existing.rowNumber, 1, 1, HEADERS.length).setValues([merged])
      existingRows[existing.rowNumber - 2] = merged
      existingById.set(candidate.eventId, { row: merged, rowNumber: existing.rowNumber })
      updated += 1
      return
    }

    const nextRow = sheet.getLastRow() + 1
    const target = sheet.getRange(nextRow, 1, 1, HEADERS.length)
    if (sheet.getLastRow() >= 2) {
      const exemplar = sheet.getRange(2, 1, 1, HEADERS.length)
      exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false)
      exemplar.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false)
    }
    target.setValues([merged])
    existingRows.push(merged)
    existingById.set(candidate.eventId, { row: merged, rowNumber: nextRow })
    inserted += 1
  })

  if (sheet.getLastRow() > 2) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length)
      .sort([{ column: 5, ascending: true }, { column: 6, ascending: true }])
  }
  SpreadsheetApp.flush()
  properties.setProperty('LAST_MNET_SYNC_AT', checkedAt)
  return { year: targetYear, fetched: candidates.length, inserted, updated, upgraded }
}

function sheetCalendarTitle(row) {
  return `[${row[2] || '기타'}] ${row[3] || ''}`.trim()
}

function calendarDescriptionFromRow(row) {
  return [row[9], row[13], row[10], row[11]].filter(Boolean).join('\n')
}

function ensureApprovedSheetRowsInCalendar(year) {
  const config = scheduleConfig()
  const spreadsheetId = config.spreadsheetId
  const sheetName = config.sheetName
  const calendarId = config.calendarId

  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName)
  const calendar = CalendarApp.getCalendarById(calendarId)
  if (!sheet || !calendar) throw new Error('시트 또는 캘린더를 찾을 수 없습니다.')
  const lastRow = sheet.getLastRow()
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues() : []
  const targetYear = String(year || formatCalendarDate(new Date(), 'yyyy'))
  let created = 0
  let matched = 0

  rows.forEach((row, index) => {
    if (row[1] !== 'approved' || !String(row[4] || '').startsWith(`${targetYear}-`)) return
    const existingNote = String(row[18] || '')
    if (/Google Calendar eventId:\s*([^\s·]+)/.test(existingNote)) return

    const startDate = new Date(`${row[4]}T00:00:00+09:00`)
    const title = sheetCalendarTitle(row)
    const sameDay = calendar.getEventsForDay(startDate)
    let event = sameDay.find((item) => normalizeScheduleText(item.getTitle()).includes(normalizeScheduleText(row[3])))
    if (event) {
      matched += 1
    } else if (row[5]) {
      const start = new Date(`${row[4]}T${row[5]}:00+09:00`)
      const end = row[7]
        ? new Date(`${row[6] || row[4]}T${row[7]}:00+09:00`)
        : new Date(start.getTime() + 60 * 60 * 1000)
      event = calendar.createEvent(title, start, end, {
        location: row[8] || '',
        description: calendarDescriptionFromRow(row)
      })
      created += 1
    } else {
      event = calendar.createAllDayEvent(title, startDate, {
        location: row[8] || '',
        description: calendarDescriptionFromRow(row)
      })
      created += 1
    }

    const notePrefix = existingNote ? `${existingNote} · ` : ''
    sheet.getRange(index + 2, 19).setValue(`${notePrefix}Google Calendar eventId: ${event.getId()}`)
  })

  SpreadsheetApp.flush()
  return { year: targetYear, created, matched }
}

function syncAllScheduleSources() {
  const year = Number(formatCalendarDate(new Date(), 'yyyy'))
  const mnet = syncMnetToSheet(year)
  const notion = syncNotionToSheet()
  const calendar = ensureApprovedSheetRowsInCalendar(year)
  return { mnet, notion, calendar }
}

function installScheduleSyncTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => ['syncAllScheduleSources', 'syncNotionToSheet'].includes(trigger.getHandlerFunction()))
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger))

  ScriptApp.newTrigger('syncAllScheduleSources')
    .timeBased()
    .atHour(9)
    .nearMinute(5)
    .everyDays(1)
    .inTimezone('Asia/Seoul')
    .create()

  return syncAllScheduleSources()
}
