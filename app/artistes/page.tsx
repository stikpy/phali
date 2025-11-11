"use client"

import PageShell from "@/components/page-shell"

const artists = [
  {
    name: "DJ Cassette",
    description: "Mashups 2000 vs 2025, remix de Dragostea Din Tei x Dua Lipa.",
    highlight: "Set 22h30 — Dancefloor 3310",
  },
  {
    name: "Les Crash Test",
    description: "Groupe live pop-rock reprenant Sum 41, Blink-182, Linkin Park.",
    highlight: "Concert 21h00 sur scène principale.",
  },
  {
    name: "MC Skyblog",
    description: "Open mic nostalgie: viens lire ton ancien post Skyblog ou ton poème emo.",
    highlight: "18h30 — Scène confessionnal.",
  },
  {
    name: "Crew Nokia",
    description: "Animations Snake II, concours de coques custom, atelier stickers.",
    highlight: "Toute la soirée en zone gaming.",
  },
  {
    name: "Glow Cheerleaders",
    description: "Performances Y2K, chorégraphies Britney / Pussycat Dolls, distribution de glowsticks.",
    highlight: "20h45 & 23h45 — Interludes flash.",
  },
  {
    name: "Photobooth Pola Club",
    description: "Photographe + imprimante instantanée, fond paillettes et accessoires \"Fan2\".",
    highlight: "Ouvert en continu, galerie uploadée live.",
  },
]

export default function ArtistesPage() {
  return (
    <main className="min-h-screen crt-layer">
      <PageShell>
        <section className="space-y-8">
          <header className="skylog-widget secondary y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ LINE-UP ]</span>
            </div>
            <div className="p-6 text-center space-y-2">
              <h1 className="text-4xl font-black uppercase tracking-[0.4em]">Cast Année 2000</h1>
              <p className="text-sm font-mono text-foreground/70">
                Des DJs, des performers et des fans prêts à refaire le monde.
              </p>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            {artists.map((artist) => (
              <article key={artist.name} className="skylog-widget bg-card border border-white/15 y2k-neon-border">
                <div className="skylog-widget-header bg-gradient-to-r from-primary/80 to-secondary/80">
                  <span>[ {artist.name} ]</span>
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-sm font-mono text-foreground/75 leading-relaxed">{artist.description}</p>
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-foreground/70">
                    {artist.highlight}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </PageShell>
    </main>
  )
}

