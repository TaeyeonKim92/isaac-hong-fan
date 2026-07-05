const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
const BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const GRAPH_API_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION ?? 'v23.0'

const INSTAGRAM_USERNAMES = ['hongisaac_official', 'pngisac']

export interface InstagramPost {
  id: string
  username: string
  caption: string
  mediaType: string
  mediaUrl: string
  permalink: string
  timestamp: string
}

interface InstagramMediaItem {
  id?: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
}

function getCaptionPreview(caption = ''): string {
  const compact = caption.replace(/\s+/g, ' ').trim()
  return compact.length > 100 ? `${compact.slice(0, 100)}...` : compact
}

async function getAccountPosts(username: string, limit: number): Promise<InstagramPost[]> {
  if (!ACCESS_TOKEN || !BUSINESS_ACCOUNT_ID) return []

  try {
    const fields = [
      `business_discovery.username(${username}){`,
      'username,',
      `media.limit(${limit}){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp}`,
      '}',
    ].join('')

    const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/${BUSINESS_ACCOUNT_ID}`)
    url.searchParams.set('fields', fields)
    url.searchParams.set('access_token', ACCESS_TOKEN)

    const res = await fetch(url.toString())
    const data = await res.json()
    const media = data.business_discovery?.media?.data ?? []

    return media
      .map((item: InstagramMediaItem) => ({
        id: item.id ?? '',
        username,
        caption: getCaptionPreview(item.caption),
        mediaType: item.media_type ?? '',
        mediaUrl: item.thumbnail_url ?? item.media_url ?? '',
        permalink: item.permalink ?? `https://www.instagram.com/${username}/`,
        timestamp: item.timestamp ?? '',
      }))
      .filter((post: InstagramPost) => post.id && post.mediaUrl && post.permalink)
  } catch {
    return []
  }
}

export async function getInstagramPosts(limitPerAccount = 3): Promise<InstagramPost[]> {
  const posts = await Promise.all(
    INSTAGRAM_USERNAMES.map((username) => getAccountPosts(username, limitPerAccount)),
  )

  return posts
    .flat()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function formatInstagramDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
