"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { authClient } from "@/lib/auth-client"

export default function LoginButton() {
  const [open, setOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAuthenticated(!!j.authenticated))
      .catch(() => setAuthenticated(false))
  }, [])

  const doLogin = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await authClient.signIn.email({ email: identifier, password })
      if (error) {
        setMessage(error.message || "Connexion échouée")
      } else {
        setOpen(false)
        setAuthenticated(true)
        router.refresh()
      }
    } catch (e: any) {
      setMessage(e?.message || "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const sendMagic = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await authClient.signIn.magicLink({ email: identifier })
      if (error) setMessage(error.message || "Impossible d'envoyer le lien")
      else setMessage("Lien magique envoyé (voir console si SMTP non configuré)")
    } catch (e: any) {
      setMessage(e?.message || "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await authClient.signOut()
    setAuthenticated(false)
    router.refresh()
  }

  if (authenticated) {
    return (
      <button className="skylog-button text-xs px-3 py-2" onClick={logout}>
        Se déconnecter
      </button>
    )
  }

  return (
    <>
      <button className="skylog-button text-xs px-3 py-2" onClick={() => setOpen(true)}>
        Se connecter
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Connexion</DialogTitle>
          <div className="space-y-3">
            <input
              className="w-full px-3 py-2 border border-white/20 bg-background/70 text-sm"
              placeholder="Email ou téléphone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-3 py-2 border border-white/20 bg-background/70 text-sm"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {message && <div className="text-xs text-red-400 font-mono">{message}</div>}
            <div className="flex items-center gap-2">
              <button className="skylog-button bg-primary px-4 py-2 disabled:opacity-60" onClick={doLogin} disabled={loading}>
                Connexion
              </button>
              <button className="skylog-button bg-secondary px-4 py-2 disabled:opacity-60" onClick={sendMagic} disabled={loading || !identifier}>
                Magic link
              </button>
            </div>
            <p className="text-[11px] font-mono text-foreground/60">
              Pas de compte ? Remplis le formulaire RSVP pour créer ton accès automatiquement.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


