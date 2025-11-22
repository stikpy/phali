"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SetPasswordPage() {
  const [pwd, setPwd] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/password/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) {
        setMsg(j.error || "Impossible d’enregistrer le mot de passe")
        return
      }
      setMsg("Mot de passe enregistré. Tu peux désormais te connecter par email + mot de passe.")
      setTimeout(() => router.push("/"), 1200)
    } catch (e: any) {
      setMsg(e?.message || "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Définir un mot de passe</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          className="w-full px-3 py-2 border border-white/20 bg-background/70 text-sm"
          placeholder="Nouveau mot de passe (≥ 8 caractères)"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          minLength={8}
          required
        />
        {msg && <div className="text-xs font-mono text-foreground/80">{msg}</div>}
        <button className="skylog-button bg-primary px-4 py-2 disabled:opacity-60" disabled={loading || pwd.length < 8}>
          Enregistrer
        </button>
      </form>
    </div>
  )
}



