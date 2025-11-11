"use client"

import { useEffect, useState } from "react"

export default function ScrollIndicator() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollProgress = Math.min((scrollY / 100) * 10, 100)

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-center gap-3">
      <div className="skylog-widget secondary y2k-neon-border" style={{ transform: "rotate(-2deg)" }}>
        <div className="skylog-widget-header">
          <span>[ SCROLL ]</span>
        </div>
        <div className="p-3 y2k-scanlines">
          <div className="w-2 h-32 border border-white/35 bg-background/50">
            <div
              className="w-full bg-gradient-to-t from-primary to-secondary transition-all duration-300"
              style={{ height: `${scrollProgress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="text-3xl animate-bounce y2k-glow select-none">↓</div>
    </div>
  )
}
