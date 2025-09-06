import type { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ user, token }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // If the redirect URL contains kadal, keep the user on the kadal page
      if (url.includes('/kadal')) {
        return `${baseUrl}/kadal`
      }
      // If redirecting from callback and no specific URL, go to kadal
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default to kadal for external URLs
      return `${baseUrl}/kadal`
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
}
