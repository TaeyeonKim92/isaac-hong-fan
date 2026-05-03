export interface NewsArticle {
  title: string
  link: string
  pubDate: string
  source: string
  snippet: string
}

function parseXml(xml: string): NewsArticle[] {
  const items: NewsArticle[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? block.match(/<title>(.*?)<\/title>/)?.[1]
      ?? ''
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
    const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? ''
    const description = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
      ?? block.match(/<description>(.*?)<\/description>/)?.[1]
      ?? ''
    const snippet = description.replace(/<[^>]+>/g, '').slice(0, 120)

    if (title && link) {
      items.push({ title, link, pubDate, source, snippet })
    }
  }

  return items
}

export async function getNewsArticles(query = '홍이삭', maxResults = 6): Promise<NewsArticle[]> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)' },
    })
    const xml = await res.text()
    return parseXml(xml).slice(0, maxResults)
  } catch {
    return []
  }
}

export function formatNewsDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
