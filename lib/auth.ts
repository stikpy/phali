import { betterAuth } from "better-auth"
import { magicLink, phoneNumber } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "./generated/prisma/client"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.NEXT_PUBLIC_SITE_URL ? `https://${process.env.NEXT_PUBLIC_SITE_URL}` : undefined,
  emailAndPassword: {
    enabled: true,
  },
  // Email/password activé par défaut. On ajoute le magic link:
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // TODO: brancher un SMTP. En dev on log.
        console.log("[magic-link] send to", email, url)
      },
    }),
    phoneNumber({
      // En prod: brancher Twilio/SNS/etc. Ici on log l’OTP pour dev.
      sendOTP: async ({ phoneNumber, code }) => {
        console.log("[phone-otp] send to", phoneNumber, "code:", code)
      },
      // Permettre la création de compte lors d’une vérification réussie
      signUpOnVerification: {
        getTempEmail: (num) => `${num.replace(/[^0-9+]/g, "")}@phone.local`,
        getTempName: (num) => num,
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
  experimental: { joins: true },
})



