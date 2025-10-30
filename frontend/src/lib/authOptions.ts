import CredentialsProvider from "next-auth/providers/credentials";
console.log('[NextAuth] authOptions module loaded');
import { prisma } from '@/lib/prismadb';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[NextAuth] authorize called for', credentials?.email);
        if (!credentials?.email || !credentials?.password) return null;

        // Look up user in database
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        console.log('[NextAuth] user lookup result:', !!user);
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password as string);
        console.log('[NextAuth] password valid:', valid);
        if (!valid) return null;

        // Return the user object required by NextAuth (omit sensitive fields)
        const out = {
          id: String(user.id),
          email: user.email,
          name: user.name ?? user.email,
          role: user.role ?? 'USER',
          tier: user.tier ?? 'FREE',
        } as any;
        console.log('[NextAuth] authorize success, returning user id', out.id);
        return out;
      },
    }),
  ],
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: any) {
      console.log('[NextAuth][jwt] called, has user?', !!user, 'token keys:', Object.keys(token || {}).join(','));
      if (user) {
        token.id = String(user.id);
        token.role = user.role ?? 'USER';
        token.tier = user.tier ?? 'FREE';
      }
      console.log('[NextAuth][jwt] returning token keys:', Object.keys(token || {}).join(','));
      return token;
    },
    async session({ session, token }: any) {
      console.log('[NextAuth][session] called, token keys:', Object.keys(token || {}).join(','));
      if (token?.id) session.user.id = token.id;
      if (token?.role) session.user.role = token.role;
      if (token?.tier) session.user.tier = token.tier;
      console.log('[NextAuth][session] returning session user:', session?.user?.email, 'id:', session?.user?.id);
      return session;
    },
  },
  skipCSRFCheck: true,
};
