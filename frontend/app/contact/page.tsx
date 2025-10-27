'use client';

import Link from 'next/link';
import { Shield, Mail, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

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

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-slate-900/50 to-slate-900" />

      <div className="relative">
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
          <div className="container mx-auto px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <Shield className="h-7 w-7 text-cyan-400" />
                <span className="text-xl font-mono font-bold">
                  Audit<span className="text-cyan-400">a</span>AI
                </span>
              </Link>
              <Link href="/pricing">
                <button className="px-4 py-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors text-sm font-mono">
                  BACK TO PRICING
                </button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-8 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-mono font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4">
              Contact Sales
            </h1>
            <p className="text-xl text-slate-300 font-mono">
              Let's discuss how AuditaAI can transform your governance
            </p>
          </div>

          {submitted ? (
            <div className="max-w-2xl mx-auto p-8 rounded-lg border border-green-500/20 bg-green-500/5 text-center">
              <MessageSquare className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-mono font-bold text-green-400 mb-2">Thank You!</h2>
              <p className="text-slate-300 mb-6">
                We've received your message and will get back to you within 24 hours.
              </p>
              <Link href="/">
                <button className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition-colors font-mono font-bold">
                  RETURN TO HOME
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <div className="p-6 rounded-lg border border-white/10 bg-white/5">
                  <Mail className="h-8 w-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-mono font-bold mb-2">Email Us</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    sales@auditaai.com
                  </p>
                  <p className="text-slate-400 text-xs">
                    Response within 24 hours
                  </p>
                </div>

                <div className="p-6 rounded-lg border border-white/10 bg-white/5">
                  <MessageSquare className="h-8 w-8 text-cyan-400 mb-4" />
                  <h3 className="text-lg font-mono font-bold mb-2">Live Demo</h3>
                  <p className="text-slate-300 text-sm mb-2">
                    Schedule a personalized demo
                  </p>
                  <p className="text-slate-400 text-xs">
                    See Rosetta governance in action
                  </p>
                </div>

                <div className="p-6 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                  <h3 className="text-lg font-mono font-bold text-cyan-400 mb-2">
                    What to Expect
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Custom pricing based on your needs</li>
                    <li>• Dedicated onboarding support</li>
                    <li>• Enterprise SLA options</li>
                    <li>• Volume discounts available</li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <div className="p-6 rounded-lg border border-white/10 bg-white/5">
                <h2 className="text-2xl font-mono font-bold mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-mono mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-800/50 focus:border-cyan-500 focus:outline-none"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-800/50 focus:border-cyan-500 focus:outline-none"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono mb-2">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-800/50 focus:border-cyan-500 focus:outline-none"
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono mb-2">Message *</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-800/50 focus:border-cyan-500 focus:outline-none resize-none"
                      rows={5}
                      placeholder="Tell us about your governance needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 transition-all font-mono font-bold"
                  >
                    <Send className="h-4 w-4" />
                    <span>SEND MESSAGE</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
