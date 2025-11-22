import { betterAuth } from "better-auth"
import { magicLink } from "better-auth/plugins"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.NEXT_PUBLIC_SITE_URL ? `https://${process.env.NEXT_PUBLIC_SITE_URL}` : undefined,
  // Email/password activé par défaut. On ajoute le magic link:
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: brancher un SMTP. En dev on log.
        console.log("[magic-link] send to", email, url)
      },
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Astuce utile: forcer le choix de compte et demander un refresh token
      // prompt: "select_account consent",
      // accessType: "offline",
    },
  },
})



