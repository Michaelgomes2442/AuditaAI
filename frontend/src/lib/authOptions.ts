import CredentialsProvider from "next-auth/providers/credentials";

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

        try {
          // Call backend API for authentication
          // Use configured backend URL only. Vercel/cloud bypass logic removed for local-only setup.
          let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
          const apiPath = `${backendUrl}/api/auth/login`;
          const response = await fetch(apiPath, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const user = await response.json();

          return {
            id: String(user.id),
            email: user.email,
            name: user.name || '',
            role: user.role || 'USER',
            tier: user.tier || 'FREE'
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt' as const,
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
