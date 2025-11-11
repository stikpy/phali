"use client"

import PageShell from "@/components/page-shell"

const faq = [
  {
    question: "Où se déroule la soirée ?",
    answer: "Studio Popwave, 42 rue du Futur, Paris 11e. Métro ligne 2000 — station Pop Culture.",
  },
  {
    question: "Je dois apporter quelque chose ?",
    answer: "Ton meilleur look Y2K, ton Nokia (si tu l’as encore) et des anecdotes à partager sur le livre d’or.",
  },
  {
    question: "Comment récupérer les photos ?",
    answer: "La galerie se mettra à jour pendant la soirée. Tu pourras télécharger toutes les photos en HD après l’évènement.",
  },
  {
    question: "Y aura-t-il à manger ?",
    answer: "Oui ! Candy Bar, bubble tea, bar à capri-sun, plateaux sushi maki 2000. Mentionne tes restrictions dans le formulaire RSVP.",
  },
]

export default function InfosPage() {
  return (
    <main className="min-h-screen crt-layer">
      <PageShell>
        <section className="space-y-8">
          <header className="skylog-widget accent y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ INFOS PRATIQUES ]</span>
            </div>
            <div className="p-6 text-center space-y-2">
              <h1 className="text-4xl font-black uppercase tracking-[0.4em]">Mode d’emploi 2000</h1>
              <p className="text-sm font-mono text-foreground/70">
                Rassemble ici toutes les infos essentielles pour que ton wizz arrive à bon port.
              </p>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {faq.map((item) => (
                <article key={item.question} className="skylog-widget bg-card border border-white/15 y2k-neon-border">
                  <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 to-primary/70">
                    <span>{item.question}</span>
                  </div>
                  <div className="p-5 text-sm font-mono leading-relaxed text-foreground/75">{item.answer}</div>
                </article>
              ))}
            </div>

            <aside className="space-y-4">
              <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
                <div className="skylog-widget-header bg-gradient-to-r from-primary/80 to-secondary/70">
                  <span>[ ACCÈS ]</span>
                </div>
                <div className="p-5 text-sm font-mono space-y-2 text-foreground/75">
                  <p>Métro Pop Culture 2000 (ligne nostalgie) — sortie « Nokia 3310 ».</p>
                  <p>Parking gratuit pour rollers et trottinettes Razor.</p>
                  <p>Vélib’ vintage à 100m : station « Tamagotchi ».</p>
                </div>
              </div>

              <div className="skylog-widget bg-card border border-white/15 y2k-neon-border">
                <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 to-accent/70">
                  <span>[ CONTACT ]</span>
                </div>
                <div className="p-5 text-sm font-mono space-y-2 text-foreground/75">
                  <p>Hotmail : influence2000@msn.com</p>
                  <p>SMS : 06 40 00 20 00 (envoie « WIZZ » pour une surprise)</p>
                  <p>MSN Live ID : y2k-party</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </PageShell>
    </main>
  )
}

