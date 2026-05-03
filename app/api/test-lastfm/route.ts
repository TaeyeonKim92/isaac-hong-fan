import { NextResponse } from 'next/server'
import { getArtistInfo, getTopTracks, getTopAlbums } from '@/lib/lastfm'

export async function GET() {
  const [artist, tracks, albums] = await Promise.all([
    getArtistInfo(),
    getTopTracks(),
    getTopAlbums(),
  ])
  return NextResponse.json({ artist, tracks, albums })
}
