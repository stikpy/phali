"use client"

export default function EventDetails() {
  const details = [
    { title: "DATE", content: "À définir", icon: "📅", color: "primary" },
    { title: "HEURE", content: "20h00", icon: "⏰", color: "secondary" },
    { title: "LIEU", content: "À votre goût", icon: "📍", color: "accent" },
    { title: "DRESS CODE", content: "Y2K Style", icon: "👗", color: "primary" },
  ]

  return (
    <section className="bg-transparent p-4 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Title Widget */}
        <div className="skylog-widget primary mb-8 transform -rotate-1">
          <div className="skylog-widget-header bg-gradient-to-r from-primary to-secondary">
            <span>[ LES DÉTAILS DE L'EVENT ]</span>
          </div>
          <div className="p-6 text-center">
            <h2 className="text-4xl font-black text-primary-foreground">INFOS PRATIQUES</h2>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {details.map((detail, idx) => (
            <div
              key={idx}
              className={`skylog-widget ${detail.color}`}
              style={{ transform: `rotate(${idx % 2 ? 1 : -1}deg)` }}
            >
              <div className="skylog-widget-header">
                <span>[{detail.title}]</span>
              </div>
              <div className="p-6 text-center">
                <p className="text-4xl mb-3">{detail.icon}</p>
                <p className="text-sm font-black">{detail.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="skylog-widget bg-card border border-white/15">
          <div className="skylog-widget-header bg-gradient-to-r from-accent to-primary">
            <span>[ 🎊 IMPORTANT ]</span>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm font-bold leading-relaxed text-foreground/90">
              ✨ Retrouvez vos amis pour célébrer les 40 ans en style Y2K !
              <br />📸 Les photos de la soirée seront partagées ici
              <br />🎵 Musique 2000 & décoration rétro-futuriste
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
