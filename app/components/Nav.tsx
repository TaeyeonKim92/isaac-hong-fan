'use client'
import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = `text-[11px] tracking-[0.25em] uppercase transition-opacity hover:opacity-100 ${
    scrolled ? 'text-[#261a0e] opacity-50' : 'text-[#261a0e] opacity-60'
  }`

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#f7f2ea]/95 backdrop-blur-sm border-b border-[#e5d9c8]' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between relative">
        <div className="hidden md:flex gap-10">
          <a href="#history" className={linkClass}>History</a>
          <a href="#albums" className={linkClass}>Albums</a>
          <a href="#videos" className={linkClass}>Gallery</a>
        </div>

        <a
          href="#"
          className="absolute left-1/2 -translate-x-1/2 transition-opacity hover:opacity-70"
        >
          <img
            src="/images/logo/isaac-hong-logo-dark.png"
            alt="Isaac Hong"
            className="h-6 w-auto"
          />
        </a>

        <div className="hidden md:flex gap-10">
          <a href="#tour" className={linkClass}>Tour</a>
          <a href="#news" className={linkClass}>News</a>
        </div>
      </div>
    </nav>
  )
}
