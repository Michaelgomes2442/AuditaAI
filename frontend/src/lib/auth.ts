import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import { routes } from "./routes";

enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
  };
}

export async function getUser() {
  const session = await getServerSession(authOptions as any);
  return session as AuthSession | null;
}

export async function requireUser() {
  const session = await getUser();
  if (!session) {
    redirect(routes.auth.signin);
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== UserRole.ADMIN) {
    redirect(routes.dashboard);
  }
  return session;
}

export async function checkAuthSession() {
  try {
    const session = await getUser();
    return { 
      isAuthenticated: !!session,
      isAdmin: session?.user.role === UserRole.ADMIN,
      user: session?.user
    };
  } catch (error) {
    return { 
      isAuthenticated: false, 
      isAdmin: false,
      user: null
    };
  }
}
