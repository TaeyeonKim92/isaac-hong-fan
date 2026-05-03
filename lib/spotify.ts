const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  const data = await res.json()
  return data.access_token
}

export interface SpotifyArtist {
  id: string
  name: string
  followers: number
  popularity: number
  imageUrl: string
  genres: string[]
  spotifyUrl: string
}

export interface SpotifyTrack {
  id: string
  name: string
  albumName: string
  albumImageUrl: string
  previewUrl: string | null
  spotifyUrl: string
  durationMs: number
}

export interface SpotifyAlbum {
  id: string
  name: string
  releaseDate: string
  imageUrl: string
  totalTracks: number
  spotifyUrl: string
  albumType: string
}

export async function getSpotifyArtist(): Promise<SpotifyArtist | null> {
  try {
    const token = await getAccessToken()
    const res = await fetch(
      'https://api.spotify.com/v1/search?q=홍이삭 Isaac Hong&type=artist&limit=1&market=KR',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    const artist = data.artists?.items?.[0]
    if (!artist) return null

    return {
      id: artist.id,
      name: artist.name,
      followers: artist.followers.total,
      popularity: artist.popularity,
      imageUrl: artist.images?.[0]?.url ?? '',
      genres: artist.genres,
      spotifyUrl: artist.external_urls.spotify,
    }
  } catch {
    return null
  }
}

export async function getTopTracks(artistId: string): Promise<SpotifyTrack[]> {
  try {
    const token = await getAccessToken()
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=KR`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    return (data.tracks ?? []).slice(0, 5).map((t: any) => ({
      id: t.id,
      name: t.name,
      albumName: t.album.name,
      albumImageUrl: t.album.images?.[0]?.url ?? '',
      previewUrl: t.preview_url,
      spotifyUrl: t.external_urls.spotify,
      durationMs: t.duration_ms,
    }))
  } catch {
    return []
  }
}

export async function getLatestAlbums(artistId: string): Promise<SpotifyAlbum[]> {
  try {
    const token = await getAccessToken()
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?market=KR&limit=4&include_groups=album,single`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    return (data.items ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      releaseDate: a.release_date,
      imageUrl: a.images?.[0]?.url ?? '',
      totalTracks: a.total_tracks,
      spotifyUrl: a.external_urls.spotify,
      albumType: a.album_type,
    }))
  } catch {
    return []
  }
}

export function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000)
  const sec = Math.floor((ms % 60000) / 1000)
  return `${min}:${sec.toString().padStart(2, '0')}`
}
