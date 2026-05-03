const API_KEY = process.env.LASTFM_API_KEY!
const BASE = 'https://ws.audioscrobbler.com/2.0/'
const ARTIST = 'Isaac Hong'

async function lfetch(method: string, extra: Record<string, string> = {}) {
  const url = new URL(BASE)
  url.searchParams.set('method', method)
  url.searchParams.set('artist', ARTIST)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('format', 'json')
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Last.fm ${method} failed: ${res.status}`)
  return res.json()
}

export interface LfmArtist {
  name: string
  listeners: string
  playcount: string
  bio: string
  url: string
}

export interface LfmTrack {
  name: string
  playcount: string
  url: string
  rank: number
}

export interface LfmAlbum {
  name: string
  playcount: string
  url: string
  imageUrl: string
}

export async function getArtistInfo(): Promise<LfmArtist | null> {
  try {
    const data = await lfetch('artist.getinfo')
    const a = data.artist
    if (!a || a.error) return null
    const bioRaw = a.bio?.summary ?? ''
    const bio = bioRaw.replace(/<a[^>]*>.*?<\/a>/g, '').replace(/<[^>]+>/g, '').trim().slice(0, 200)
    return {
      name: a.name,
      listeners: Number(a.stats?.listeners ?? 0).toLocaleString('ko-KR'),
      playcount: Number(a.stats?.playcount ?? 0).toLocaleString('ko-KR'),
      bio,
      url: a.url,
    }
  } catch {
    return null
  }
}

export async function getTopTracks(): Promise<LfmTrack[]> {
  try {
    const data = await lfetch('artist.gettoptracks', { limit: '5' })
    return (data.toptracks?.track ?? []).map((t: any, i: number) => ({
      name: t.name,
      playcount: Number(t.playcount).toLocaleString('ko-KR'),
      url: t.url,
      rank: i + 1,
    }))
  } catch {
    return []
  }
}

export async function getTopAlbums(): Promise<LfmAlbum[]> {
  try {
    const data = await lfetch('artist.gettopalbums', { limit: '4' })
    return (data.topalbums?.album ?? []).map((a: any) => {
      const img = (a.image ?? []).find((i: any) => i.size === 'extralarge')?.['#text']
        ?? (a.image ?? []).find((i: any) => i.size === 'large')?.['#text']
        ?? ''
      return { name: a.name, playcount: Number(a.playcount).toLocaleString('ko-KR'), url: a.url, imageUrl: img }
    })
  } catch {
    return []
  }
}
