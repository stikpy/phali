"use client"

export default function SpotifyPlayer() {
  const playlistId =
    process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID ||
    "0Wq9rjNVV4BdqMbWXFJcn4" // fallback playlist
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`
  return (
    <div className="skylog-widget bg-card border border-white/15 y2k-neon-border overflow-hidden">
      <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 to-primary/70">
        <span>[ PLAYLIST 2000 ]</span>
        <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/70">Best of 2000s</span>
      </div>
      <div className="p-0">
        <iframe
          src={embedUrl}
          width="100%"
          height="420"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-none border-0 h-[420px] md:h-[360px]"
        />
      </div>
      <div className="p-3 text-[11px] font-mono text-foreground/60 text-center">
        Source : Playlist Spotify “Best of Années 2000 – Top Hits France”.
      </div>
    </div>
  )
}

