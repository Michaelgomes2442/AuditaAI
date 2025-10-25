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
          let backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          // If a Vercel protection bypass token is provided in env, append it
          // to the backend URL so server-side calls can bypass deployment protection.
          const bypassToken = process.env.VERCEL_BYPASS_TOKEN || process.env.BYPASS_TOKEN || '';
          if (bypassToken && !backendUrl.includes('localhost')) {
            backendUrl = `${backendUrl}${backendUrl.includes('?') ? '&' : '?'}x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${bypassToken}`;
          }
          const response = await fetch(`${backendUrl}/api/auth/login`, {
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
