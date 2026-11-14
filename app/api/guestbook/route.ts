import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_NICKNAME_LENGTH = 30
const MAX_MESSAGE_LENGTH = 500
const LINK_PATTERN = /(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|net|org|kr|io)(?:\/|\b))/i

type GuestbookEntry = {
  id: string
  createdAt: string
  nickname: string
  message: string
}

function backendConfig() {
  return {
    url: process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL?.trim() || '',
    secret: process.env.SCHEDULE_WEBHOOK_SECRET?.trim() || '',
  }
}

function cleanText(value: unknown) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
}

async function callSheet(action: string, payload: Record<string, unknown> = {}) {
  const { url, secret } = backendConfig()
  if (!url || !secret) throw new Error('guestbook_not_configured')

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, action, ...payload }),
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`guestbook_backend_${response.status}`)
  const result = await response.json()
  if (!result.ok) throw new Error(result.error || 'guestbook_backend_error')
  return result
}

export async function GET() {
  try {
    const result = await callSheet('guestbook:list')
    return NextResponse.json({ entries: (result.entries || []) as GuestbookEntry[] }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Guestbook list failed:', error)
    return NextResponse.json({ error: '방명록을 불러오지 못했습니다.' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const nickname = cleanText(body.nickname)
    const message = cleanText(body.message)
    const website = cleanText(body.website)
    const startedAt = Number(body.startedAt || 0)

    // Honeypot fields look successful so automated spam does not retry.
    if (website) return NextResponse.json({ ok: true })

    if (!nickname || nickname.length > MAX_NICKNAME_LENGTH) {
      return NextResponse.json({ error: `닉네임은 ${MAX_NICKNAME_LENGTH}자 이내로 입력해 주세요.` }, { status: 400 })
    }
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `메시지는 ${MAX_MESSAGE_LENGTH}자 이내로 입력해 주세요.` }, { status: 400 })
    }
    if (LINK_PATTERN.test(message)) {
      return NextResponse.json({ error: '방명록에는 링크를 입력할 수 없습니다.' }, { status: 400 })
    }
    if (!startedAt || Date.now() - startedAt < 1500) {
      return NextResponse.json({ error: '잠시 후 다시 등록해 주세요.' }, { status: 400 })
    }

    const { secret } = backendConfig()
    if (!secret) throw new Error('guestbook_not_configured')
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const visitorSource = forwardedFor || request.headers.get('x-real-ip') || 'unknown'
    const visitorKey = createHmac('sha256', secret).update(visitorSource).digest('hex')

    const result = await callSheet('guestbook:create', {
      visitorKey,
      entry: { nickname, message },
    })

    if (result.rateLimited) {
      return NextResponse.json({ error: '방명록은 1분에 한 번만 등록할 수 있습니다.' }, { status: 429 })
    }
    if (result.duplicate) {
      return NextResponse.json({ error: '같은 내용이 이미 등록되어 있습니다.' }, { status: 409 })
    }

    return NextResponse.json({ ok: true, entry: result.entry })
  } catch (error) {
    console.error('Guestbook create failed:', error)
    return NextResponse.json({ error: '방명록 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 })
  }
}
