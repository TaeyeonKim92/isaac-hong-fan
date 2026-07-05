export interface ItunesAlbum {
  id: number
  name: string
  artistName: string
  releaseDate: string
  trackCount: number
  artworkUrl: string
  url: string
}

export interface ItunesTrack {
  id: number
  name: string
  albumName: string
  artistName: string
  releaseDate: string
  trackNumber: number
  url: string
}

function isOriginalAlbum(album: ItunesAlbum): boolean {
  const text = `${album.name} ${album.artistName}`.toLowerCase()
  const ostMarkers = [
    'ost',
    'original soundtrack',
    'original television soundtrack',
    'soundtrack',
    '오리지널',
    '드라마',
    'jtbc',
    'tv show',
    'singagain',
    'sing again',
    'pt.',
    'part.',
  ]

  return album.artistName === '홍이삭' && !ostMarkers.some((marker) => text.includes(marker))
}

function isIsaacHongAlbum(album: ItunesAlbum): boolean {
  const excludedNames = [
    'good night - single',
    'nostalgia - single',
    'let go - single',
  ]

  return album.artistName === '홍이삭'
    && !excludedNames.includes(album.name.toLowerCase())
}

export async function getAlbums(artist = '홍이삭', limit = 50): Promise<ItunesAlbum[]> {
  try {
    const q = encodeURIComponent(artist)
    const res = await fetch(
      `https://itunes.apple.com/search?term=${q}&entity=album&country=KR&limit=${limit}&lang=ko_KR`,
    )
    const data = await res.json()
    const results = (data.results ?? []) as any[]

    return results
      .map((r) => ({
        id: r.collectionId,
        name: r.collectionName,
        artistName: r.artistName,
        releaseDate: r.releaseDate?.slice(0, 10) ?? '',
        trackCount: r.trackCount ?? 0,
        artworkUrl: (r.artworkUrl100 ?? '').replace('100x100', '400x400'),
        url: r.collectionViewUrl ?? '',
      }))
      .filter(isIsaacHongAlbum)
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
  } catch {
    return []
  }
}

async function getAlbumTracks(album: ItunesAlbum): Promise<ItunesTrack[]> {
  const query = encodeURIComponent(`${album.name.replace(/\s-\sEP$/i, '')} ${album.artistName}`)
  const res = await fetch(
    `https://itunes.apple.com/search?term=${query}&entity=song&country=KR&limit=25&lang=ko_KR`,
  )
  const data = await res.json()
  const results = (data.results ?? []) as any[]

  return results
    .filter((r) => r.collectionId === album.id || r.collectionName === album.name)
    .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
    .map((r) => ({
      id: r.trackId,
      name: r.trackName,
      albumName: r.collectionName,
      artistName: r.artistName,
      releaseDate: r.releaseDate?.slice(0, 10) ?? album.releaseDate,
      trackNumber: r.trackNumber ?? 0,
      url: r.trackViewUrl ?? album.url,
    }))
}

export async function getLatestOriginalAlbumTracks(artist = '홍이삭'): Promise<ItunesTrack[]> {
  try {
    const albums = await getAlbums(artist, 50)
    const originalAlbums = albums.filter(isOriginalAlbum)

    for (const album of originalAlbums) {
      const tracks = await getAlbumTracks(album)
      if (tracks.length > 0) return tracks
    }

    return []
  } catch {
    return []
  }
}
