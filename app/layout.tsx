import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Nav from './components/Nav'

const SITE_URL = 'https://isaac-hong-fan.vercel.app'
const SITE_TITLE = '홍이삭 팬페이지 | 일정·앨범·영상·뉴스'
const SITE_DESCRIPTION =
  '싱어송라이터 홍이삭의 최신 일정, 공연, 앨범, 음악과 영상을 모아보는 비공식 팬페이지입니다.'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: '홍이삭 팬페이지',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': SITE_URL + '/#website',
      url: SITE_URL,
      name: '홍이삭 팬페이지',
      alternateName: 'Isaac Hong Fan Page',
      description: SITE_DESCRIPTION,
      inLanguage: 'ko-KR',
      about: {
        '@id': SITE_URL + '/#isaac-hong',
      },
    },
    {
      '@type': 'Person',
      '@id': SITE_URL + '/#isaac-hong',
      name: '홍이삭',
      alternateName: 'Isaac Hong',
      jobTitle: '싱어송라이터',
      sameAs: [
        'https://www.instagram.com/hongisaac_official/',
        'https://www.youtube.com/@pngisacofficial',
        'https://music.youtube.com/channel/UCsnX5bnTB6NTzzXOguVcqZw',
        'https://open.spotify.com/artist/4bST03NJ0YEysocK5AV1wB',
        'https://www.melon.com/artist/timeline.htm?artistId=774246',
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Nav />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  )
}
