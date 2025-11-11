"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import WizzPanel from "@/components/wizz-panel"

interface HeroSectionProps {
  onExplore: () => void
}

export default function HeroSection({ onExplore }: HeroSectionProps) {
  const [blinkCount, setBlinkCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setBlinkCount((c) => c + 1), 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen overflow-hidden bg-background py-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 space-y-10">
        <div className="skylog-widget mb-10 rotate-0 y2k-neon-border">
          <div className="skylog-widget-header">
            <span>[ SOIRÉE • 40 ANS ]</span>
            <span className="select-none text-xs">— □ ×</span>
          </div>
          <div className="y2k-marquee">
            <span>
              Influence Année 2000 • MSN • Skyblog • MySpace • Neon dreams • Pop culture 2004 • Clique et remonte dans le
              temps •
            </span>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/90 via-secondary/80 to-accent/80 p-12 text-center y2k-scanlines">
            <h1 className="text-8xl md:text-9xl font-black text-foreground drop-shadow-2xl y2k-glow">40</h1>
            <p className="text-2xl md:text-3xl font-black text-foreground mt-4 tracking-[0.25em] uppercase">
              Influence Année 2000
            </p>
            <p className="mt-3 font-mono text-sm uppercase">17 mai 2025 · Paris</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { emoji: "🎶", label: "Playlist Icons", className: "primary" },
            { emoji: "🪩", label: "Glow Neon", className: "secondary" },
            { emoji: "📸", label: "Photo Drop", className: "accent" },
          ].map((item, idx) => (
            <div key={item.label} className={`skylog-widget ${item.className}`} style={{ transform: `rotate(${idx === 1 ? 0 : idx === 0 ? -1.5 : 1.5}deg)` }}>
              <div className="p-6 text-center space-y-2">
                <p className="text-4xl">{item.emoji}</p>
                <p className="text-xs font-black uppercase tracking-[0.3em]">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10">
          <WizzPanel />
        </div>

        <div className="skylog-widget bg-card border border-white/10 y2k-neon-border overflow-hidden">
          <div className="skylog-widget-header bg-gradient-to-r from-primary/80 via-secondary/70 to-accent/70">
            <span>[ CARTE OFFICIELLE ]</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/70">MySpace Announcement</span>
          </div>
          <div className="p-0">
            <Image
              src="/images/annonce-myspace.png"
              alt="Annonce MySpace influence année 2000"
              width={1024}
              height={768}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </div>

        <div className="skylog-widget bg-card border border-white/10 mb-10 y2k-neon-border">
          <div className="skylog-widget-header bg-gradient-to-r from-secondary/70 to-primary/70 text-card-foreground">
            <span>[ LANCER L’EXPÉRIENCE ]</span>
          </div>
          <div className="p-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <button onClick={onExplore} className="skylog-button">
              Voir la Galerie
            </button>
            <button
              onClick={() => document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" })}
              className="skylog-button bg-secondary text-secondary-foreground"
            >
              Confirmer ma venue
            </button>
          </div>
        </div>

        <div
          className={`text-center font-mono font-black text-sm tracking-[0.5em] ${
            blinkCount % 2 ? "opacity-100" : "opacity-30"
          } transition-opacity`}
        >
          ↓↓↓ Scroll ↓↓↓
        </div>
      </div>
    </section>
  )
}
