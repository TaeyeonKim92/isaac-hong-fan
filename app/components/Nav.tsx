'use client'
import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = 'text-[11px] tracking-[0.25em] uppercase text-[#f3eee8] transition-opacity opacity-70 hover:opacity-100'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-[#8d2825] transition-all duration-500 ${
        scrolled
          ? 'bg-[#641817]/95 backdrop-blur-md border-b border-white/15 shadow-[0_8px_30px_rgba(35,6,5,0.16)]'
          : 'border-b border-black/10'
      }`}
    >
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between relative">
        <div className="hidden md:flex gap-10">
          <a href="#albums" className={linkClass}>Albums</a>
          <a href="#videos" className={linkClass}>Gallery</a>
        </div>

        <a
          href="#"
          className="absolute left-1/2 -translate-x-1/2 transition-opacity hover:opacity-70"
        >
          <img
            src="/images/logo/isaac-hong-logo.png"
            alt="Isaac Hong"
            className="h-6 w-auto brightness-0 invert"
          />
        </a>

        <div className="hidden md:flex gap-10">
          <a href="#schedule" className={linkClass}>Schedule</a>
          <a href="#news" className={linkClass}>News</a>
        </div>
      </div>
    </nav>
  )
}
