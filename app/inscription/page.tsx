"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export default function InscriptionPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      if (!email.includes("@")) {
        setMessage("Email invalide.")
        return
      }
      if (password.length < 6) {
        setMessage("Mot de passe trop court (≥ 6 caractères).")
        return
      }
      const { error } = await authClient.signUp.email({ email, password, name: name || email.split("@")[0] })
      if (error) setMessage(error.message || "Création de compte échouée")
      else {
        router.push("/")
        router.refresh()
      }
    } catch (err: any) {
      setMessage(err?.message || "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Créer un compte</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full px-3 py-2 border border-white/20 bg-background/70 text-sm"
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full px-3 py-2 border border-white/20 bg-background/70 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full px-3 py-2 border border-white/20 bg-background/70 text-sm"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {message && <div className="text-xs text-red-400 font-mono">{message}</div>}
        <button className="skylog-button bg-primary px-4 py-2 disabled:opacity-60" disabled={loading} type="submit">
          Créer mon compte
        </button>
      </form>
    </div>
  )
}



