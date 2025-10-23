"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { Shield, LayoutDashboard, FileText, Home, LogOut, Globe } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";

function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navLinks = [
    { href: "/", label: "Home", icon: <Home size={16} /> },
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/receipts", label: "Receipts", icon: <FileText size={16} /> },
    { href: "/public/audit", label: "Public Audit", icon: <Globe size={16} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={18} />
          <span className="font-semibold text-gray-100 text-sm tracking-wide">
            AuditaAI
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 text-sm transition ${
                pathname === link.href
                  ? "text-blue-400 font-medium"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {session && (
            <button
              onClick={async () => {
                try {
                  await fetch("/api/receipts/auto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      actionType: "LOGOUT",
                      userEmail: session?.user?.email,
                      origin: "NextAuth",
                    }),
                  });
                } catch (e) {
                  console.warn("Logout Δ-receipt failed:", e);
                } finally {
                  signOut();
                }
              }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-400 transition"
            >
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                        ✅ Root Layout Wrapper (App)                        */
/* -------------------------------------------------------------------------- */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen font-sans">
        <SessionProvider>
          <Navbar />
          <Breadcrumbs />
          <main className="pt-20 px-4 sm:px-8 pb-16">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
