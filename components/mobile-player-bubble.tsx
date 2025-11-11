"use client"

import { useState } from "react"
import SpotifyPlayer from "@/components/spotify-player"

export default function MobilePlayerBubble() {
  const [open, setOpen] = useState(false)
  return (
    <>
      {/* Bulle flottante visible uniquement sur mobile */}
      <button
        type="button"
        aria-label="Ouvrir le lecteur"
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-5 right-5 z-50 rounded-full w-14 h-14 bg-gradient-to-br from-primary to-secondary text-white shadow-xl y2k-hover-glow border border-white/20"
      >
        ♬
      </button>

      {/* Tiroir mobile toujours monté pour conserver la lecture : on masque/affiche via CSS */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-all duration-300 ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* overlay */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        {/* drawer */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-card border-t border-white/15 y2k-neon-border rounded-t-xl p-3 transform transition-transform duration-300 ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-black uppercase tracking-wide">[ Lecteur • Playlist ]</div>
            <button className="skylog-button bg-primary" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
          <SpotifyPlayer />
        </div>
      </div>
    </>
  )
}


