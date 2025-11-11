"use client"

import { useRef, useState } from "react"
import PageShell from "@/components/page-shell"
import PhotoGallery from "@/components/photo-gallery"

export default function PhotosPage() {
  const [photos, setPhotos] = useState<string[]>([])
  const galleryRef = useRef<HTMLDivElement>(null)

  const handlePhotoUpload = (newPhotos: string[]) => {
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  return (
    <main className="min-h-screen crt-layer">
      <PageShell>
        <section className="space-y-8" ref={galleryRef}>
          <header className="skylog-widget secondary y2k-neon-border">
            <div className="skylog-widget-header">
              <span>[ GALERIE LIVE ]</span>
            </div>
            <div className="p-6 text-center space-y-2">
              <h1 className="text-4xl font-black uppercase tracking-[0.4em]">Photos Officielles</h1>
              <p className="text-sm font-mono text-foreground/70">
                Upload en direct pendant la soirée, télécharge les souvenirs dès maintenant.
              </p>
            </div>
          </header>

          <PhotoGallery photos={photos} onUpload={handlePhotoUpload} />
        </section>
      </PageShell>
    </main>
  )
}

