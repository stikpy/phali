"use client"

import type React from "react"

import { useRef, useState, useTransition } from "react"
import { submitRsvp } from "@/app/actions/rsvp"
import { createClient } from "@/utils/client"
import { logEvent } from "@/app/actions/log"
import AvatarCropper from "@/components/avatar-cropper"

export default function RSVPForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    guests: "1",
    message: "",
  })

  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<"present" | "absent" | "unsure">("unsure")
  const [reminder, setReminder] = useState(false)
  const defaultAvatars = [
    "/avatars/default/avatar-1.svg",
    "/avatars/default/avatar-2.svg",
    "/avatars/default/avatar-3.svg",
    "/avatars/default/avatar-4.svg",
    "/avatars/default/avatar-5.svg",
    "/avatars/default/avatar-6.svg",
    "/avatars/default/avatar-7.svg",
    "/avatars/default/avatar-8.svg",
    "/avatars/default/avatar-9.svg",
    "/avatars/default/avatar-10.svg",
  ]
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [basePreviewUrl, setBasePreviewUrl] = useState<string | null>(null)
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [croppedFile, setCroppedFile] = useState<File | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const supabase = createClient()
    let avatarUrl: string | null = null

    // upload avatar si fourni
    try {
      // priorité au fichier uploadé, sinon avatar par défaut sélectionné
      const file = croppedFile ?? rawFile ?? fileRef.current?.files?.[0] ?? null
      if (file) {
        const ext = file.name.split(".").pop() || "png"
        const path = `avatars/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false })
        if (upErr) throw upErr
        const { data } = supabase.storage.from("avatars").getPublicUrl(path)
        avatarUrl = data.publicUrl
      } else if (selectedAvatar) {
        avatarUrl = selectedAvatar
      }
    } catch (e: any) {
      console.error("Avatar upload failed:", e?.message || e)
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      guests: Number(formData.guests),
      message: formData.message.trim() || null,
      status,
      avatarUrl,
      reminderOptIn: reminder,
    }

    startTransition(async () => {
      const result = await submitRsvp(payload)
      if (!result.success) {
        setErrorMessage(result.error ?? "Une erreur est survenue. Merci de réessayer.")
        try {
          await logEvent("error", "submitRsvp failed", { error: result.error })
        } catch {}
        return
      }

      setSubmitted(true)
      setFormData({ name: "", email: "", guests: "1", message: "" })
      setStatus("unsure")
      setReminder(false)
      setSelectedAvatar(null)
      setPreviewUrl(null)
      if (fileRef.current) fileRef.current.value = ""
      setRawFile(null)
      setCroppedFile(null)
      setTimeout(() => setSubmitted(false), 4000)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <section id="rsvp" className="bg-transparent p-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <div className="skylog-widget primary mb-6 transform -rotate-2">
          <div className="skylog-widget-header bg-gradient-to-r from-primary via-secondary to-accent">
            <span>[ RSVP - CONFIRMEZ VOTRE PRÉSENCE ]</span>
          </div>
          <div className="p-6 text-center">
            <h2 className="text-3xl font-black text-white">RÉSERVER MA PLACE</h2>
          </div>
        </div>

        {/* Form Widget */}
        <div className="skylog-widget bg-card border border-white/15 mb-6 y2k-neon-border">
          <div className="skylog-widget-header bg-gradient-to-r from-secondary/80 to-primary/70">
            <span>[FORMULAIRE]</span>
          </div>
          <div className="p-8">
            {submitted ? (
              <div className="text-center py-8">
                <p className="text-5xl animate-bounce-flash mb-4">✨</p>
                <p className="text-2xl font-black text-primary mb-2">MERCI !</p>
                <p className="font-mono text-foreground">Votre réservation a été enregistrée.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-black text-primary mb-2 uppercase">Votre nom *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--neon-1)]"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-black text-primary mb-2 uppercase">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--neon-2)]"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-xs font-black text-primary mb-2 uppercase">Invités *</label>
                  <select
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--neon-3)]"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "personne" : "personnes"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-primary mb-2 uppercase">Statut</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm"
                    >
                      <option value="present">Présent</option>
                      <option value="unsure">Ne sait pas encore</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-primary mb-2 uppercase">Photo de profil</label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,image/svg+xml"
                      className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm"
                      onChange={(e) => {
                        setSelectedAvatar(null)
                        try {
                          const f = e.currentTarget.files?.[0]
                          if (f) {
                            setRawFile(f)
                            setCroppedFile(null)
                            if (previewUrl) URL.revokeObjectURL(previewUrl)
                            const url = URL.createObjectURL(f)
                            setPreviewUrl(url)
                            setBasePreviewUrl(url)
                            setShowCropper(true)
                          } else {
                            setPreviewUrl(null)
                            setBasePreviewUrl(null)
                          }
                        } catch {}
                      }}
                    />
                    {previewUrl && (
                      <div className="mt-2">
                        <img
                          src={previewUrl}
                          alt="aperçu avatar"
                          className="w-20 h-20 rounded-full border border-white/30 object-cover"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="skylog-button bg-secondary text-secondary-foreground text-xs"
                            onClick={() => setShowCropper(true)}
                          >
                            Recadrer
                          </button>
                          <button
                            type="button"
                            className="skylog-button bg-accent text-xs"
                            onClick={() => {
                              // réinitialise au fichier original choisi
                              if (basePreviewUrl) setPreviewUrl(basePreviewUrl)
                              setCroppedFile(null)
                              setShowCropper(true)
                            }}
                          >
                            Réinitialiser
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] font-mono text-foreground/60">ou choisir un avatar par défaut:</p>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {defaultAvatars.map((url) => (
                        <button
                          key={url}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(url)
                            setPreviewUrl(url)
                            if (fileRef.current) fileRef.current.value = ""
                          }}
                          className={`border ${selectedAvatar === url ? "border-primary" : "border-white/20"} rounded-md overflow-hidden bg-background/60`}
                          aria-label="Choisir avatar"
                        >
                          <img src={url} alt="avatar" className="w-full h-12 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reminder */}
                <div className="flex items-center gap-2">
                  <input
                    id="reminder"
                    type="checkbox"
                    checked={reminder}
                    onChange={(e) => setReminder(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="reminder" className="text-xs font-mono text-foreground/80">
                    M’envoyer un rappel si je suis « ne sait pas »
                  </label>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-black text-primary mb-2 uppercase">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-white/20 bg-background/60 text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--neon-2)]"
                    placeholder="Un message sympa..."
                  />
                </div>

                {/* Submit */}
                <div className="pt-4 space-y-3">
                  {errorMessage && (
                    <p className="text-xs font-mono text-red-400">{errorMessage}</p>
                  )}
                  <button
                    type="submit"
                    className="skylog-button bg-primary hover:bg-secondary w-full y2k-hover-glow disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isPending}
                  >
                    {isPending ? "Envoi..." : "CONFIRMER MA PRÉSENCE"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {showCropper && previewUrl && (
          <AvatarCropper
            src={previewUrl}
            onCancel={() => setShowCropper(false)}
            onConfirm={(blob) => {
              const file = new File([blob], "avatar.png", { type: "image/png" })
              setCroppedFile(file)
              if (previewUrl) URL.revokeObjectURL(previewUrl)
              setPreviewUrl(URL.createObjectURL(blob))
              setShowCropper(false)
            }}
          />
        )}

        {/* Contact widget */}
        <div className="skylog-widget accent border-4">
          <div className="skylog-widget-header bg-primary text-white">
            <span>[DES QUESTIONS ?]</span>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm font-bold mb-4">Contactez directement !</p>
            <div className="flex gap-3 justify-center">
              <a href="mailto:your@email.com" className="skylog-button bg-primary hover:bg-secondary text-xs">
                EMAIL
              </a>
              <a
                href="https://wa.me/your_number"
                className="skylog-button bg-secondary text-foreground hover:bg-accent text-xs"
              >
                WHATSAPP
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
