const API_KEY = process.env.YOUTUBE_API_KEY!
const CHANNEL_ID = 'UCsnX5bnTB6NTzzXOguVcqZw'

export interface YouTubeChannel {
  title: string
  thumbnailUrl: string
  subscriberCount: string
}

export async function getChannelInfo(): Promise<YouTubeChannel | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?id=${CHANNEL_ID}&part=snippet,statistics&key=${API_KEY}`
    )
    const data = await res.json()
    const ch = data.items?.[0]
    if (!ch) return null
    return {
      title: ch.snippet.title,
      thumbnailUrl: ch.snippet.thumbnails.high?.url ?? ch.snippet.thumbnails.default?.url ?? '',
      subscriberCount: Number(ch.statistics.subscriberCount).toLocaleString('ko-KR'),
    }
  } catch {
    return null
  }
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: string
  url: string
}

export async function getLatestVideos(maxResults = 6): Promise<YouTubeVideo[]> {
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=${maxResults}&type=video&key=${API_KEY}`
    )
    const searchData = await searchRes.json()
    const items = searchData.items ?? []
    if (items.length === 0) return []

    const videoIds = items.map((i: any) => i.id.videoId).join(',')
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoIds}&part=statistics&key=${API_KEY}`
    )
    const statsData = await statsRes.json()
    const statsMap: Record<string, string> = {}
    for (const v of statsData.items ?? []) {
      statsMap[v.id] = Number(v.statistics.viewCount).toLocaleString('ko-KR')
    }

    return items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
      publishedAt: item.snippet.publishedAt,
      viewCount: statsMap[item.id.videoId] ?? '0',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }))
  } catch {
    return []
  }
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
