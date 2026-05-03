import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ step: 'env', error: '환경변수 없음' })
  }

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
      cache: 'no-store',
    })

    const rawText = await tokenRes.text()
    let tokenData: any
    try {
      tokenData = JSON.parse(rawText)
    } catch {
      return NextResponse.json({ step: 'token_parse_fail', status: tokenRes.status, raw: rawText.slice(0, 300) })
    }

    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.json({ step: 'token_error', tokenData })
    }

    const q = encodeURIComponent('홍이삭 Isaac Hong')
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=artist&limit=3&market=KR`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` }, cache: 'no-store' }
    )
    const searchRaw = await searchRes.text()
    let searchData: any
    try {
      searchData = JSON.parse(searchRaw)
    } catch {
      return NextResponse.json({ step: 'search_blocked', status: searchRes.status, raw: searchRaw.slice(0, 300) })
    }

    return NextResponse.json({
      step: 'success',
      token: '✅ 토큰 발급 성공',
      results: searchData.artists?.items?.map((a: any) => ({ name: a.name, id: a.id })),
      error: searchRes.ok ? undefined : searchData,
    })
  } catch (e: any) {
    return NextResponse.json({ step: 'catch', error: e.message })
  }
}
