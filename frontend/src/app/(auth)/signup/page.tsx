"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold">AuditaAI</h1>
              <p className="text-xs text-purple-400 font-mono">ROSETTA COGNITIVE OS</p>
            </div>
          </div>
        </div>

        <div className="relative p-8 rounded-2xl bg-slate-800/50 border border-white/10 backdrop-blur-sm">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-10 blur-2xl" />
          
          <div className="relative">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-mono font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                CREATE ACCOUNT
              </h2>
              <p className="text-slate-300 text-sm font-mono">
                Join the future of AI governance
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Account created successfully! Redirecting to sign in...
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-mono font-bold text-slate-300">FULL NAME</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading || success}
                  autoComplete="name"
                  className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-mono font-bold text-slate-300">EMAIL</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || success}
                  autoComplete="email"
                  className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-mono font-bold text-slate-300">PASSWORD</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || success}
                  autoComplete="new-password"
                  minLength={8}
                  className="bg-slate-900/50 border-white/10 text-white"
                />
                <p className="text-xs text-slate-400 font-mono">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-mono font-bold text-slate-300">CONFIRM PASSWORD</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading || success}
                  autoComplete="new-password"
                  className="bg-slate-900/50 border-white/10 text-white"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-mono font-bold" 
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    CREATING ACCOUNT...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    ACCOUNT CREATED!
                  </>
                ) : (
                  "CREATE ACCOUNT"
                )}
              </Button>

              <div className="text-center text-sm text-slate-400 font-mono">
                ALREADY HAVE AN ACCOUNT?{" "}
                <Link 
                  href="/signin" 
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  SIGN IN
                </Link>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6 font-mono">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
