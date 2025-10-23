import Link from "next/link";
import { Shield, Code2, Database, Zap, Lock, GitBranch, Code } from "lucide-react";

export default function APIPage() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/parallel-prompt",
      description: "Submit parallel prompts to standard and Rosetta-booted models",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      method: "GET",
      path: "/api/stats",
      description: "Retrieve system statistics and CRIES metrics",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      method: "GET",
      path: "/api/logs",
      description: "Fetch audit logs with filtering and pagination",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      method: "POST",
      path: "/api/auth/signin",
      description: "Authenticate user and create session",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      method: "POST",
      path: "/api/auth/signup",
      description: "Register new user account",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20"
    },
    {
      method: "WS",
      path: "/ws",
      description: "WebSocket connection for real-time updates",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20"
    }
  ];

  const features = [
    {
      icon: Lock,
      title: "Secure Authentication",
      description: "JWT-based auth with next-auth integration"
    },
    {
      icon: Database,
      title: "Prisma ORM",
      description: "Type-safe database queries with PostgreSQL"
    },
    {
      icon: Zap,
      title: "Real-time Events",
      description: "WebSocket support for live updates"
    },
    {
      icon: GitBranch,
      title: "Versioned",
      description: "API v1 with backward compatibility"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
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

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <header className="container mx-auto px-8 py-8 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <Shield className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-mono font-bold">AuditaAI<span className="text-orange-400">/</span>API</span>
            </Link>
            <div className="flex items-center space-x-1 text-sm font-mono">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400">API ONLINE</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6">
              <Code className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-mono text-orange-400">API v1.0</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-mono font-bold mb-6 bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent">
              API Reference
            </h1>
            
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              RESTful API and WebSocket endpoints for integrating AuditaAI governance 
              into your applications. All endpoints return JSON and support CORS.
            </p>

            <div className="p-4 rounded-lg bg-slate-800/50 border border-white/10 font-mono text-sm">
              <div className="text-slate-400 mb-2">Base URL</div>
              <div className="text-cyan-400">https://api.auditaai.com/v1</div>
              <div className="text-slate-400 mt-3 mb-2">Development</div>
              <div className="text-cyan-400">http://localhost:3001</div>
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="container mx-auto px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-mono font-bold mb-8">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Endpoints
              </span>
            </h2>

            <div className="space-y-4">
              {endpoints.map((endpoint, idx) => (
                <div
                  key={idx}
                  className={`group p-6 rounded-xl bg-slate-800/50 border ${endpoint.borderColor} backdrop-blur-sm hover:bg-slate-800/80 transition-all duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`px-3 py-1 rounded-md ${endpoint.bgColor} ${endpoint.color} font-mono text-sm font-bold`}>
                          {endpoint.method}
                        </span>
                        <code className="text-lg font-mono text-slate-300">
                          {endpoint.path}
                        </code>
                      </div>
                      <p className="text-slate-400">{endpoint.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-mono font-bold mb-8 text-center">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                API Features
              </span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-slate-800/50 border border-white/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="p-3 rounded-lg bg-cyan-500/10">
                      <feature.icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-mono font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example Request */}
        <section className="container mx-auto px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-mono font-bold mb-8">Example Request</h2>
            
            <div className="p-6 rounded-xl bg-slate-950 border border-white/10">
              <div className="text-sm text-slate-400 mb-3 font-mono">POST /api/parallel-prompt</div>
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`{
  "prompt": "Explain the Rosetta boot sequence",
  "standardModel": "gpt-4",
  "rosettaModel": "gpt-4-rosetta"
}`}
              </pre>
            </div>

            <div className="mt-4 p-6 rounded-xl bg-slate-950 border border-white/10">
              <div className="text-sm text-slate-400 mb-3 font-mono">Response 200 OK</div>
              <pre className="text-cyan-400 font-mono text-sm overflow-x-auto">
{`{
  "standardResponse": "The Rosetta boot sequence...",
  "rosettaResponse": "The Rosetta boot sequence...",
  "standardMetrics": {
    "completeness": 0.78,
    "reliability": 0.82,
    "integrity": 0.75,
    "effectiveness": 0.80,
    "security": 0.73
  },
  "rosettaMetrics": {
    "completeness": 0.91,
    "reliability": 0.89,
    "integrity": 0.93,
    "effectiveness": 0.88,
    "security": 0.90
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-4xl mx-auto p-8 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 text-center">
            <h3 className="text-3xl font-mono font-bold mb-4">Ready to integrate?</h3>
            <p className="text-slate-300 mb-6 text-lg">
              Start building with AuditaAI's governance API today.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link 
                href="/get-started"
                className="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-mono transition-colors"
              >
                Get API Key
              </Link>
              <Link 
                href="/docs"
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-mono transition-colors"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-8 py-8 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm text-slate-400 font-mono">
            <div>© 2024 AuditaAI. Powered by Rosetta OS v13</div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
              <span>API READY</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
