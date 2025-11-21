"use client"

import PageShell from "@/components/page-shell"

export default function ReliquesPage() {
  const items = [
    { title: "MSN Messenger", emoji: "🟢", note: "Nudges, statut, pseudos personnalisés" },
    { title: "Skyblog", emoji: "📓", note: "Paillettes et compteurs de visites" },
    { title: "MySpace", emoji: "⭐", note: "Top 8 et thèmes perso" },
    { title: "Winamp", emoji: "🎧", note: "It really whips the llama’s ass!" },
  ]
  return (
    <main className="min-h-screen crt-layer">
      <PageShell>
        <section className="space-y-6">
          <div className="skylog-widget secondary y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ RELIQUES DU PASSÉ ]</span>
            </div>
            <div className="p-6 text-center">
              <p className="font-mono text-sm">
                Une sélection de reliques Y2K… et un clin d’œil iconographique inspiré par cette planche nostalgique.
              </p>
              <p className="mt-2 text-xs font-mono">
                Référence:{" "}
                <a href="https://fr.pinterest.com/pin/53972895529734326/" target="_blank" rel="noreferrer" className="underline">
                  Pinterest – Souvenirs d’adolescence : MSN Messenger
                </a>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((it, i) => (
              <div key={i} className="skylog-widget bg-card border border-white/15 y2k-neon-border">
                <div className="skylog-widget-header">
                  <span>[ {it.title} ]</span>
                </div>
                <div className="p-6 text-center space-y-2">
                  <div className="text-4xl">{it.emoji}</div>
                  <div className="text-xs font-mono text-foreground/70">{it.note}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </PageShell>
    </main>
  )
}





