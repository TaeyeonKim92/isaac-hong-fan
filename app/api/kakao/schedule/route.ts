import { NextRequest, NextResponse } from 'next/server'
import { KAKAO_SCHEDULE_HELP, parseKakaoSchedule, summarizeKakaoSchedule } from '@/lib/kakao-schedule'

export const runtime = 'nodejs'

interface KakaoSkillRequest {
  userRequest?: {
    utterance?: string
    user?: { id?: string }
  }
}

function kakaoText(text: string) {
  return NextResponse.json({
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text } }],
      quickReplies: [
        { action: 'message', label: '입력 형식', messageText: '일정 도움말' },
        { action: 'message', label: '내 아이디', messageText: '내 아이디' },
      ],
    },
  })
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: Boolean(
      process.env.KAKAO_SKILL_TOKEN &&
      process.env.KAKAO_SCHEDULE_ADMIN_IDS &&
      process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL &&
      process.env.SCHEDULE_WEBHOOK_SECRET
    ),
  })
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.KAKAO_SKILL_TOKEN?.trim()
  const token = request.nextUrl.searchParams.get('token')
  if (!expectedToken || token !== expectedToken) return kakaoText('인증되지 않은 요청입니다.')

  let payload: KakaoSkillRequest
  try {
    payload = await request.json()
  } catch {
    return kakaoText('요청 형식을 읽을 수 없습니다.')
  }

  const utterance = payload.userRequest?.utterance?.trim() || ''
  const userId = payload.userRequest?.user?.id?.trim() || ''

  if (/^내\s*아이디$/i.test(utterance)) return kakaoText(`내 관리자 ID\n${userId || '확인할 수 없음'}`)
  if (/^(일정\s*)?도움말$/i.test(utterance)) return kakaoText(KAKAO_SCHEDULE_HELP)

  const adminIds = new Set(
    (process.env.KAKAO_SCHEDULE_ADMIN_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)
  )
  if (!userId || !adminIds.has(userId)) return kakaoText('일정 등록 권한이 없는 사용자입니다.')

  const parsed = parseKakaoSchedule(utterance)
  if (!parsed.event) return kakaoText(parsed.error || KAKAO_SCHEDULE_HELP)

  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL?.trim()
  const secret = process.env.SCHEDULE_WEBHOOK_SECRET?.trim()
  if (!webhookUrl || !secret) return kakaoText('Google Sheet 연결이 아직 설정되지 않았습니다.')

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, event: parsed.event }),
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })
    const result = await response.json() as { ok?: boolean; duplicate?: boolean; error?: string }

    if (result.duplicate) return kakaoText('이미 같은 일정이 시트에 등록되어 있습니다.')
    if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`)

    return kakaoText(summarizeKakaoSchedule(parsed.event))
  } catch (error) {
    console.error('Kakao schedule sheet write failed:', error)
    return kakaoText('시트 저장에 실패했습니다. 잠시 후 다시 시도해주세요. 중복 검사가 적용되므로 같은 내용을 다시 보내도 안전합니다.')
  }
}
