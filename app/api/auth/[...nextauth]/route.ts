import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          // ← business_management adicionado para buscar páginas dentro do BM
          scope:
            "email,public_profile,ads_management,ads_read,pages_show_list,pages_read_engagement,business_management",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "facebook" && account.access_token) {
        try {
          const res = await fetch(
            `https://graph.facebook.com/v20.0/oauth/access_token` +
              `?grant_type=fb_exchange_token` +
              `&client_id=${process.env.FACEBOOK_CLIENT_ID}` +
              `&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}` +
              `&fb_exchange_token=${account.access_token}`
          );

          const data = await res.json();

          if (data.access_token) {
            account.access_token = data.access_token;
            if (data.expires_in) {
              account.expires_at = Math.floor(Date.now() / 1000) + data.expires_in;
            }
            console.log("✅ Token do Facebook trocado por long-lived com sucesso.");
          } else {
            console.error("🚨 Falha ao trocar token:", data.error?.message);
          }
        } catch (err) {
          console.error("🚨 Erro na troca de token:", err);
        }
      }
      return true;
    },

    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;

        const facebookAccount = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: "facebook",
          },
          select: {
            access_token: true,
            expires_at: true,
          },
        });

        if (facebookAccount) {
          (session.user as any).facebookAccessToken = facebookAccount.access_token;
          (session.user as any).facebookTokenExpiresAt = facebookAccount.expires_at;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };