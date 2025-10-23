import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../../lib/prismadb";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            tier: true,
            status: true
          }
        });
        if (!user) return null;
        if (user.status !== 'ACTIVE') return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { 
          id: String(user.id), 
          email: user.email, 
          name: user.name || '',
          role: user.role,
          tier: user.tier
        };
      },
    }),
  ],
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days by default
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = String((user as any).id);
        token.role = (user as any).role ?? 'USER';
        token.tier = (user as any).tier ?? 'FREE';
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token?.id) session.user.id = token.id;
      if (token?.role) session.user.role = token.role;
      if (token?.tier) session.user.tier = token.tier;
      return session;
    },
  },
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
