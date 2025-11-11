"use client"

import PageShell from "@/components/page-shell"

const timeline = [
  {
    time: "19h00",
    title: "Warm-up VHS & cocktails glow",
    description: "Accueil, badges personnalisés, projection de clips 2000 (L5, Britney, Linkin Park).",
  },
  {
    time: "20h00",
    title: "Showcase Back to Basic",
    description: "Karaoké collectif sur Matt Houston, Nuttea, Diam's. Bonus choréographie « Dragostea Din Tei ».",
  },
  {
    time: "21h30",
    title: "Battle MSN vs Skyblog",
    description: "Jeu interactif: wizz challenge, commentaire le plus cringe, concours de fond glitter.",
  },
  {
    time: "22h30",
    title: "Dancefloor 3310",
    description: "DJ set Top 2000s (Rihanna, Sean Paul, Tribal King, Lady Gaga) + photobooth polaroid.",
  },
  {
    time: "00h00",
    title: "After nostalgie",
    description: "Projection de souvenirs, ouverture de la galerie photo, révélation surprise Y2K.",
  },
]

const sideNotes = [
  "Dress code: denim taille basse, crop top, lunettes fumées, t-shirt de groupe.",
  "Accès métro Ligne rétro — station « Pop Culture 2000 ».",
  "Bar à gadgets: Nokia 3310, Game Boy Advance SP, iPod Mini.",
]

export default function ProgrammePage() {
  return (
    <main className="min-h-screen crt-layer">
      <PageShell>
        <section className="space-y-8">
          <header className="skylog-widget primary y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ PROGRAMME OFFICIEL ]</span>
            </div>
            <div className="p-6 text-center space-y-2">
              <h1 className="text-4xl font-black tracking-[0.4em] uppercase">Timeline Pop Culture 2000</h1>
              <p className="text-sm font-mono text-foreground/70">
                Prépare ton planning : chaque créneau est un concentré de nostalgie.
              </p>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              {timeline.map((item) => (
                <article key={item.time} className="skylog-widget bg-card border border-white/15 y2k-neon-border">
                  <div className="skylog-widget-header">
                    <span>[ {item.time} ]</span>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/70">ON AIR</span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h2 className="text-xl font-black tracking-[0.25em] uppercase text-foreground">
                      {item.title}
                    </h2>
                    <p className="text-sm font-mono leading-relaxed text-foreground/75">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="skylog-widget bg-card border border-white/20 y2k-neon-border">
                <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 to-primary/70">
                  <span>[ ASTUCES MSN ]</span>
                </div>
                <div className="p-4 space-y-3 text-sm font-mono leading-relaxed text-foreground/75">
                  {sideNotes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </div>

              <div className="skylog-widget secondary y2k-neon-border text-center p-6 space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.35em]">Playlist preview</p>
                <p className="text-lg font-black">Back to Basic 2000 Tour</p>
                <p className="text-[11px] font-mono text-foreground/70">
                  Larusso • L5 • Tribal King • Matt Houston • Nuttea • Kayliah • Willy Denzey
                </p>
              </div>
            </aside>
          </div>
        </section>
      </PageShell>
    </main>
  )
}

