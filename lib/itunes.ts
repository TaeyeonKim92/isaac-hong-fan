export interface ItunesAlbum {
  id: number
  name: string
  artistName: string
  releaseDate: string
  trackCount: number
  artworkUrl: string
  url: string
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
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .map((r) => ({
        id: r.collectionId,
        name: r.collectionName,
        artistName: r.artistName,
        releaseDate: r.releaseDate?.slice(0, 10) ?? '',
        trackCount: r.trackCount ?? 0,
        artworkUrl: (r.artworkUrl100 ?? '').replace('100x100', '400x400'),
        url: r.collectionViewUrl ?? '',
      }))
  } catch {
    return []
  }
}
