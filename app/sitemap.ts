import type { MetadataRoute } from 'next'
import { getStaticScheduleEvents } from '@/lib/schedule'

const SITE_URL = 'https://isaac-hong-fan.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const schedulePages: MetadataRoute.Sitemap = getStaticScheduleEvents().map((event) => ({
    url: `${SITE_URL}/schedule/${encodeURIComponent(event.id)}`,
    lastModified: new Date(event.date.replace(/\./g, '-')),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...schedulePages,
  ]
}
