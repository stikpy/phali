"use client"

import { useState, useRef } from "react"
import HeroSection from "@/components/hero-section"
import EventDetails from "@/components/event-details"
import PhotoGallery from "@/components/photo-gallery"
import RSVPForm from "@/components/rsvp-form"
import Guestbook from "@/components/guestbook"
import TopFriends from "@/components/top-friends"
import PageShell from "@/components/page-shell"
import PhotoGallery from "@/components/photo-gallery"

export default function Home() {
  const [photos, setPhotos] = useState<string[]>([])
  const galleryRef = useRef<HTMLDivElement>(null)

  const handlePhotoUpload = (newPhotos: string[]) => {
    setPhotos([...photos, ...newPhotos])
  }

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden crt-layer">
      <PageShell>
        <div className="space-y-0">
          <HeroSection onExplore={scrollToGallery} />
          <EventDetails />
          <div ref={galleryRef}>
            {/* Section aperçue: seulement les 3 dernières, sans upload */}
            <PhotoGallery photos={photos} onUpload={handlePhotoUpload} limit={3} showUpload={false} />
          </div>
          <RSVPForm />
          <Guestbook />
          <TopFriends />
        </div>
      </PageShell>
    </main>
  )
}
