"use client"

import { useEffect, useRef, useState } from "react"

type Track = {
  title: string
  url: string
  duration?: string
}

const DEFAULT_PLAYLIST: Track[] = [
  {
    title: "Sandstorm (Sample)",
    url: "https://cdn.pixabay.com/download/audio/2021/10/26/audio_5e1a0d8d46.mp3?filename=electronic-dance-sport-11252.mp3",
    duration: "03:18",
  },
  {
    title: "Y2K Pop (Sample)",
    url: "https://cdn.pixabay.com/download/audio/2022/06/10/audio_0a0a27e1dc.mp3?filename=pop-110046.mp3",
    duration: "02:26",
  },
]

export default function WinampPlayer({ playlist = DEFAULT_PLAYLIST }: { playlist?: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const track = playlist[current]

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setProgress((el.currentTime / (el.duration || 1)) * 100)
    const onEnded = () => next()
    el.addEventListener("timeupdate", onTime)
    el.addEventListener("ended", onEnded)
    return () => {
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("ended", onEnded)
    }
  }, [current])

  const play = () => {
    const el = audioRef.current
    if (!el) return
    el.play().catch(() => {})
    setPlaying(true)
  }
  const pause = () => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    setPlaying(false)
  }
  const toggle = () => (playing ? pause() : play())
  const prev = () => {
    setCurrent((c) => (c - 1 + playlist.length) % playlist.length)
    setProgress(0)
    setPlaying(false)
    setTimeout(play, 50)
  }
  const next = () => {
    setCurrent((c) => (c + 1) % playlist.length)
    setProgress(0)
    setPlaying(false)
    setTimeout(play, 50)
  }

  return (
    <div className="skylog-widget bg-card border border-white/15 y2k-neon-border max-w-md">
      <div className="skylog-widget-header bg-gradient-to-r from-primary/85 to-secondary/75">
        <span>[ WINAMP ]</span>
        <span className="text-xs">It really whips the llama's ass</span>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-black y2k-glow">{track.title}</div>
          <div className="text-xs font-mono led">{track.duration || "--:--"}</div>
        </div>
        <div className="w-full h-3 border-2 border-black bg-background">
          <div className="h-full bg-gradient-to-r from-secondary to-accent" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-2">
          <button className="skylog-button bg-secondary text-foreground" onClick={prev}>
            «
          </button>
          <button className="skylog-button bg-primary" onClick={toggle}>
            {playing ? "Pause" : "Play"}
          </button>
          <button className="skylog-button bg-secondary text-foreground" onClick={next}>
            »
          </button>
        </div>
        <div className="text-[10px] font-mono">Playlist: {playlist.length} pistes</div>
        <audio ref={audioRef} src={track.url} preload="none" />
      </div>
    </div>
  )
}

