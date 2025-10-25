'use client';

import { useEffect, useState } from 'react';

interface Conversation {
  conversationId: string;
  modelName: string;
  timestamp: string;
  sigma: number;
  lamport: number;
  receiptCount?: number;
}

interface ConversationSelectorProps {
  selectedConversation: string;
  onConversationChange: (conversationId: string) => void;
  showAggregate?: boolean;
  className?: string;
}

export default function ConversationSelector({
  selectedConversation,
  onConversationChange,
  showAggregate = true,
  className = ''
}: ConversationSelectorProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
        const endpoint = BACKEND_URL
          ? `${BACKEND_URL}/api/conversations/aggregate`
          : '/api/conversations/aggregate';

        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.conversations && data.conversations.length > 0) {
          const convList = data.conversations.map((c: any) => ({
            conversationId: c.conversationId,
            modelName: c.modelName || 'Unknown',
            timestamp: c.timestamp,
            sigma: c.cries?.sigma || 0,
            lamport: c.lamport || 0,
            receiptCount: c.receiptCount || 0
          }));
          setConversations(convList);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        setLoading(false);
      }
    };

    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-xl border border-cyan-500/20 p-6 backdrop-blur-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-xl border border-cyan-500/20 p-6 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-mono font-bold text-cyan-400">SELECT CONVERSATION</h3>
          <p className="text-sm text-slate-400 font-mono">Choose which model session to analyze</p>
        </div>
        <div className="text-sm text-slate-400 font-mono">
          {conversations.length} active session{conversations.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <select
        value={selectedConversation}
        onChange={(e) => onConversationChange(e.target.value)}
        className="w-full bg-slate-900/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors hover:bg-slate-900/70"
      >
        {showAggregate && (
          <option value="aggregate">📊 Aggregate - All Conversations (Combined View)</option>
        )}
        {conversations.length === 0 && (
          <option value="" disabled>No conversations yet - Run parallel prompts to generate data</option>
        )}
        {conversations.map((conv) => (
          <option key={conv.conversationId} value={conv.conversationId}>
            🤖 {conv.modelName} • σ={conv.sigma.toFixed(3)} • L={conv.lamport} • {conv.receiptCount || 0} receipts • {new Date(conv.timestamp).toLocaleString()}
          </option>
        ))}
      </select>
      
      {selectedConversation && selectedConversation !== 'aggregate' && (
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-300 font-mono">
            ℹ️ Viewing single conversation chain. Each conversation has its own receipt chain and Lamport counter.
          </p>
        </div>
      )}
      
      {conversations.length === 0 && (
        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-300 font-mono">
            ⚠️ No conversation data yet. Go to Live Demo and run parallel prompts to generate real data.
          </p>
        </div>
      )}
    </div>
  );
}
