import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: '홍이삭 (Isaac Hong)',
  description: '홍이삭의 음악, 영상, 최신 소식을 한 곳에서',
  openGraph: {
    title: '홍이삭 (Isaac Hong)',
    description: '홍이삭의 음악, 영상, 최신 소식을 한 곳에서',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
