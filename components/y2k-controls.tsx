"use client"

import { useEffect, useState } from "react"
import VisitClock from "./visit-clock"
import SpotifyPlayer from "./spotify-player"

export default function Y2KControls() {
  const [showStarfield, setShowStarfield] = useState(false)
  const [decorations, setDecorations] = useState(false)
  const [crt, setCrt] = useState(false)
  const [showSpotify, setShowSpotify] = useState(true)

  useEffect(() => {
    document.body.classList.toggle("decorations-active", decorations)
  }, [decorations])

  useEffect(() => {
    const main = document.querySelector("main")
    if (!main) return
    if (crt) {
      main.classList.add("y2k-crt-pro")
    } else {
      main.classList.remove("y2k-crt-pro")
    }
  }, [crt])

  return (
    <>
      {showStarfield && <div className="y2k-starfield" />}
      {decorations && (
        <>
          <div className="y2k-sparkles">
            {Array.from({ length: 36 }).map((_, i) => (
              <span key={i}>✨</span>
            ))}
          </div>
          <div className="under-construction">Under Construction</div>
        </>
      )}

      <div className="z-10 space-y-2 w-full md:w-[320px] md:fixed md:bottom-6 md:right-6 md:z-50 px-0 md:px-0">
        <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
          <div className="skylog-widget-header">
            <span>[ Y2K OPTIONS ]</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            <button
              className={`skylog-button ${showStarfield ? "bg-secondary text-foreground" : "bg-primary"}`}
              onClick={() => setShowStarfield((v) => !v)}
            >
              Starfield
            </button>
            <button
              className={`skylog-button ${decorations ? "bg-secondary text-foreground" : "bg-primary"}`}
              onClick={() => setDecorations((v) => !v)}
            >
              Décos
            </button>
            <button
              className={`skylog-button ${crt ? "bg-secondary text-foreground" : "bg-primary"}`}
              onClick={() => setCrt((v) => !v)}
            >
              CRT Pro
            </button>
            <button
              className={`skylog-button ${showSpotify ? "bg-accent text-foreground y2k-hover-glow" : "bg-primary"}`}
              onClick={() => setShowSpotify((v) => !v)}
            >
              {showSpotify ? "Fermer" : "Spotify"}
            </button>
          </div>
        </div>

      {/* Masqué en mobile pour éviter le doublon avec la bulle du lecteur */}
        {showSpotify && (
          <div className="hidden md:block">
            <SpotifyPlayer />
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <span className="badge-pixel">Best viewed in 1024×768</span>
          <span className="badge-pixel">Made with <strong>♥</strong></span>
        </div>
      </div>
    </>
  )
}

