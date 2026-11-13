const API_KEY = process.env.YOUTUBE_API_KEY!
const YOUTUBE_CHANNEL_HANDLES = ['@pngisac-video', '@pngisacofficial']
const YOUTUBE_RELEASES_URL = 'https://www.youtube.com/@pngisacofficial/releases?hl=ko&gl=KR'

export interface YouTubeChannel {
  title: string
  thumbnailUrl: string
  subscriberCount: string
}

interface ChannelResource {
  id: string
  handle: string
  title: string
  thumbnailUrl: string
  subscriberCount: number
  uploadsPlaylistId: string
}

async function fetchConfiguredChannels(): Promise<ChannelResource[]> {
  if (!API_KEY) return []

  const channels = await Promise.all(
    YOUTUBE_CHANNEL_HANDLES.map(async (handle) => {
      try {
        const params = new URLSearchParams({
          part: 'snippet,statistics,contentDetails',
          forHandle: handle,
          key: API_KEY,
        })
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`)
        const data = await res.json()
        const ch = data.items?.[0]
        if (!ch) return null

        return {
          id: ch.id,
          handle,
          title: ch.snippet.title,
          thumbnailUrl: ch.snippet.thumbnails.high?.url ?? ch.snippet.thumbnails.default?.url ?? '',
          subscriberCount: Number(ch.statistics.subscriberCount ?? 0),
          uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads ?? '',
        }
      } catch {
        return null
      }
    }),
  )

  return channels.filter((channel): channel is ChannelResource =>
    Boolean(channel?.id && channel.uploadsPlaylistId),
  )
}

let configuredChannelsPromise: Promise<ChannelResource[]> | null = null

async function getConfiguredChannels(): Promise<ChannelResource[]> {
  if (!API_KEY) return []
  configuredChannelsPromise ??= fetchConfiguredChannels()
  return configuredChannelsPromise
}

export async function getChannelInfo(): Promise<YouTubeChannel | null> {
  try {
    const channels = await getConfiguredChannels()
    if (channels.length === 0) return null

    const totalSubscribers = channels.reduce((sum, channel) => sum + channel.subscriberCount, 0)
    const primaryChannel = channels[0]

    return {
      title: primaryChannel.title,
      thumbnailUrl: primaryChannel.thumbnailUrl,
      subscriberCount: totalSubscribers.toLocaleString('ko-KR'),
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
  channelTitle: string
}

export interface YouTubeMusicTrack {
  id: string
  title: string
  thumbnailUrl: string
  publishedAt: string
  viewCount: string
  url: string
}

export interface YouTubeMusicTracks {
  latest: YouTubeMusicTrack[]
  popular: YouTubeMusicTrack[]
}

interface YouTubeReleasePlaylist {
  id: string
  title: string
}

function extractAssignedJson(html: string, marker: string): any | null {
  const markerIndex = html.indexOf(marker)
  if (markerIndex < 0) return null

  const start = html.indexOf('{', markerIndex + marker.length)
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < html.length; index += 1) {
    const char = html[index]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, index + 1))
        } catch {
          return null
        }
      }
    }
  }

  return null
}

function getReleasePlaylists(html: string): YouTubeReleasePlaylist[] {
  const initialData = extractAssignedJson(html, 'var ytInitialData = ')
  const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? []
  const selectedContent = tabs.find((tab: any) => tab.tabRenderer?.selected)?.tabRenderer?.content
  if (!selectedContent) return []

  const playlists: YouTubeReleasePlaylist[] = []
  const seen = new Set<string>()

  function walk(value: any) {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }

    const playlist = value.playlistRenderer
    if (playlist?.playlistId?.startsWith('OLAK5uy_') && !seen.has(playlist.playlistId)) {
      seen.add(playlist.playlistId)
      playlists.push({
        id: playlist.playlistId,
        title: playlist.title?.simpleText ?? '',
      })
    }

    Object.values(value).forEach(walk)
  }

  walk(selectedContent)
  return playlists
}

async function getReleaseVideoIds(playlists: YouTubeReleasePlaylist[]): Promise<string[]> {
  const videoIds: string[] = []

  for (let index = 0; index < playlists.length; index += 8) {
    const chunk = playlists.slice(index, index + 8)
    const results = await Promise.all(
      chunk.map(async (playlist) => {
        try {
          const params = new URLSearchParams({
            playlistId: playlist.id,
            part: 'contentDetails',
            maxResults: '50',
            key: API_KEY,
          })
          const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`)
          if (!response.ok) return []

          const data = await response.json()
          return (data.items ?? [])
            .map((item: any) => item.contentDetails?.videoId)
            .filter(Boolean)
        } catch {
          return []
        }
      }),
    )
    videoIds.push(...results.flat())
  }

  return Array.from(new Set(videoIds))
}

export async function getYouTubeMusicTracks(limit = 5): Promise<YouTubeMusicTracks> {
  try {
    if (!API_KEY) return { latest: [], popular: [] }

    const releasesRes = await fetch(YOUTUBE_RELEASES_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IsaacHongFan/1.0)',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    })
    if (!releasesRes.ok) return { latest: [], popular: [] }

    const releasePlaylists = getReleasePlaylists(await releasesRes.text())
    if (releasePlaylists.length === 0) return { latest: [], popular: [] }

    const videoIds = await getReleaseVideoIds(releasePlaylists)
    if (videoIds.length === 0) return { latest: [], popular: [] }

    const videoDetails: any[] = []
    for (let index = 0; index < videoIds.length; index += 50) {
      const params = new URLSearchParams({
        id: videoIds.slice(index, index + 50).join(','),
        part: 'snippet,statistics',
        key: API_KEY,
      })
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)
      if (!response.ok) continue
      const data = await response.json()
      videoDetails.push(...(data.items ?? []))
    }

    const musicVideos = videoDetails
      .map((video: any) => {
        const viewCountValue = Number(video.statistics?.viewCount ?? 0)
        return {
          id: video.id,
          title: video.snippet?.title ?? '',
          thumbnailUrl:
            video.snippet?.thumbnails?.medium?.url
            ?? video.snippet?.thumbnails?.default?.url
            ?? '',
          publishedAt: video.snippet?.publishedAt ?? '',
          viewCount: viewCountValue.toLocaleString('ko-KR'),
          viewCountValue,
          url: `https://music.youtube.com/watch?v=${video.id}`,
        }
      })
      .filter((video: any) => video.id && video.title && video.publishedAt)

    const latest = [...musicVideos]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit)
      .map(({ viewCountValue: _viewCountValue, ...video }) => video)

    const popular = [...musicVideos]
      .sort((a, b) => b.viewCountValue - a.viewCountValue)
      .slice(0, limit)
      .map(({ viewCountValue: _viewCountValue, ...video }) => video)

    return { latest, popular }
  } catch {
    return { latest: [], popular: [] }
  }
}

export async function getLatestVideos(maxResults = 6): Promise<YouTubeVideo[]> {
  try {
    const channels = await getConfiguredChannels()
    if (channels.length === 0) return []

    const playlistItems = await Promise.all(
      channels.map(async (channel) => {
        const params = new URLSearchParams({
          playlistId: channel.uploadsPlaylistId,
          part: 'snippet,contentDetails',
          maxResults: String(maxResults),
          key: API_KEY,
        })
        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`)
        const data = await res.json()
        return (data.items ?? []).map((item: any) => ({
          id: item.contentDetails?.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
          publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet.publishedAt,
          channelTitle: channel.title,
        }))
      }),
    )

    const items = playlistItems
      .flat()
      .filter((item) => item.id)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, maxResults)

    if (items.length === 0) return []

    const videoIds = items.map((item) => item.id).join(',')
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoIds}&part=statistics&key=${API_KEY}`
    )
    const statsData = await statsRes.json()
    const statsMap: Record<string, string> = {}
    for (const v of statsData.items ?? []) {
      statsMap[v.id] = Number(v.statistics.viewCount).toLocaleString('ko-KR')
    }

    return items.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      publishedAt: item.publishedAt,
      viewCount: statsMap[item.id] ?? '0',
      url: `https://www.youtube.com/watch?v=${item.id}`,
      channelTitle: item.channelTitle,
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
