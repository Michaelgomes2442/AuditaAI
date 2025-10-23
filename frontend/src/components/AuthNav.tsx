"use client";

import Link from "next/link";
import { Shield, User, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function AuthNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { href: "/demo", label: "DEMO" },
    { href: "/lab", label: "LAB" },
    { href: "/live-demo", label: "LIVE DEMO" },
    { href: "/pilot", label: "PILOT" },
    { href: "/docs", label: "DOCS" },
  ];

  return (
    <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
      <div className="container mx-auto px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Shield className="h-7 w-7 text-cyan-400" />
            <span className="text-xl font-mono font-bold">
              Audit<span className="text-cyan-400">a</span>AI
            </span>
            <span className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400">
              v13_ROSETTA
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href as any}>
                <button
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-mono ${
                    pathname === link.href
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </button>
              </Link>
            ))}

            {/* User Menu */}
            {session?.user && (
              <>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <Link href="/profile">
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-mono ${
                      pathname === "/profile"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>{session.user.name || session.user.email}</span>
                  </button>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-mono"
                >
                  <LogOut className="h-4 w-4" />
                  <span>SIGN OUT</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
