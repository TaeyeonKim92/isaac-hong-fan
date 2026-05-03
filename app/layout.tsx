import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Nav from './components/Nav'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Singer-Songwriter Isaac Hong Fan Page',
  description: 'An unofficial fan page for Isaac Hong (홍이삭). This is not an official page.',
  openGraph: {
    title: 'Singer-Songwriter Isaac Hong Fan Page',
    description: 'An unofficial fan page for Isaac Hong (홍이삭). This is not an official page.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  )
}
