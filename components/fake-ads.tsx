"use client"

export default function FakeAds() {
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-60">
      <div className="space-y-4">
        <div className="skylog-widget bg-card border border-white/20 y2k-neon-border overflow-hidden min-h-[180px]">
          <div className="skylog-widget-header bg-gradient-to-r from-primary/80 via-secondary/70 to-primary/80">
            <span>[ NEW SKIN MSN ]</span>
          </div>
          <div className="p-4 space-y-3 text-center text-xs font-mono text-foreground/80 leading-relaxed">
            <p>Télécharge 120 smileys animés, polices glitter et curseurs personnalisés.</p>
            <button className="skylog-button bg-secondary text-secondary-foreground w-full text-xs">
              &gt;&gt; Télécharger &lt;&lt;
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="skylog-widget bg-card border border-white/20 y2k-neon-border overflow-hidden">
            <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 via-primary/60 to-accent/70">
              <span>[ QUIZ SKYBLOG ]</span>
            </div>
            <div className="p-3 text-center text-[11px] font-mono text-foreground/80 leading-relaxed">
              Quel influenceur 2004 es-tu ? Clique pour le savoir en 7 questions.
            </div>
          </div>
          <div className="skylog-widget bg-card border border-white/20 y2k-neon-border overflow-hidden">
            <div className="skylog-widget-header bg-gradient-to-r from-accent/80 via-primary/70 to-secondary/80">
              <span>[ FAN2 PACK ]</span>
            </div>
            <div className="p-3 text-center text-[11px] font-mono text-foreground/80 leading-relaxed">
              Posters Lorie, Avril Lavigne, Tokio Hotel + mag Fan2 #123. Précommande limitée.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="skylog-widget bg-card border border-white/20 y2k-neon-border overflow-hidden">
          <div className="skylog-widget-header bg-gradient-to-r from-secondary/85 via-accent/70 to-primary/85">
            <span>[ POLY RINGTONE ]</span>
          </div>
          <div className="p-3 text-center text-[11px] font-mono text-foreground/80 leading-relaxed">
            SMS « CRAZY » au 81212 pour le remix Crazy in Love sur ton Nokia 3310.
          </div>
        </div>

        <div className="skylog-widget bg-card border border-white/20 y2k-neon-border overflow-hidden">
          <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 to-primary/70">
            <span>[ POP-UP HOTMAIL ]</span>
          </div>
          <div className="p-3 text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.4em] text-foreground/60">
              1 Nouveau message dans ta boîte
            </p>
            <button className="skylog-button text-xs w-full">Ouvrir ma boîte Hotmail</button>
          </div>
        </div>

        <div className="skylog-widget bg-card border border-white/20 y2k-neon-border overflow-hidden min-h-[160px]">
          <div className="skylog-widget-header bg-gradient-to-r from-primary/80 via-secondary/70 to-accent/70">
            <span>[ NOKIA GAME ]</span>
          </div>
          <div className="p-4 space-y-2 text-center text-[11px] font-mono text-foreground/80 leading-relaxed">
            <p>Participe au concours Snake II. À gagner : coque transparente + bonbons PushPop.</p>
            <button className="skylog-button bg-secondary text-secondary-foreground w-full text-xs">
              &gt;&gt; Participer &lt;&lt;
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
