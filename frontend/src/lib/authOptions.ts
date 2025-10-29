import CredentialsProvider from "next-auth/providers/credentials";
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
        console.log('Authorize called with:', credentials?.email);
        if (!credentials?.email || !credentials?.password) return null;

        // Look up user in database
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        console.log('User found:', !!user, user?.email);
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password as string);
        console.log('Password valid:', valid);
        if (!valid) return null;

        // Return the user object required by NextAuth (omit sensitive fields)
        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? user.email,
          role: user.role ?? 'USER',
          tier: user.tier ?? 'FREE',
        } as any;
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
      if (user) {
        token.id = String(user.id);
        token.role = user.role ?? 'USER';
        token.tier = user.tier ?? 'FREE';
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
  skipCSRFCheck: true,
};
