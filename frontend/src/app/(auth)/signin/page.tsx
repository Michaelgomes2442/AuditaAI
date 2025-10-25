"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden flex items-center justify-center p-8">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          animation: 'grid-flow 20s linear infinite'
        }} />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-900" />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold">AuditaAI</h1>
              <p className="text-xs text-cyan-400 font-mono">ROSETTA COGNITIVE OS</p>
            </div>
          </div>
        </div>

        <div className="relative p-8 rounded-2xl bg-slate-800/50 border border-white/10 backdrop-blur-sm">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-10 blur-2xl" />
          
          <div className="relative">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-mono font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                WELCOME BACK
              </h2>
              <p className="text-slate-300 text-sm font-mono">
                Sign in to your account to continue
              </p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-red-400 text-sm font-mono">{error}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-mono font-bold text-slate-300">EMAIL</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-mono font-bold text-slate-300">PASSWORD</label>
                    <a 
                      href="/forgot-password"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                    >
                      FORGOT PASSWORD?
                    </a>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="w-4 h-4 rounded bg-slate-900/50 border border-white/10 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-sm font-mono text-slate-300 cursor-pointer select-none">
                    REMEMBER ME FOR 30 DAYS
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 font-mono font-bold transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      SIGNING IN...
                    </span>
                  ) : (
                    "SIGN IN"
                  )}
                </button>

                <div className="text-center text-sm text-slate-400 font-mono mt-4">
                  DON'T HAVE AN ACCOUNT?{" "}
                  <Link 
                    href="/signup" 
                    className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                  >
                    SIGN UP
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 font-mono mt-6">
          Protected by Rosetta Cognitive OS v13 TriTrack
        </p>
      </div>
    </div>
  );
}
