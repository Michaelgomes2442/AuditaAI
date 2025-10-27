'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Key, Lock, Unlock, CheckCircle2, XCircle } from 'lucide-react';

interface VerificationResult {
  verified: boolean;
  receipt?: {
    lamport: number;
    event: string;
    hash: string;
    timestamp: string;
  };
  receipts?: Array<{
    lamport: number;
    event: string;
    hash: string;
  }>;
  message: string;
}

export default function ReceiptVerificationPage() {
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [cryptoKey, setCryptoKey] = useState('');
  const [receiptHash, setReceiptHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyKey = async () => {
    if (!cryptoKey.trim()) {
      setError('Cryptographic key is required');
      return;
    }

    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL ?? ''}/api/receipts/verify-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: cryptoKey,
          receiptHash: receiptHash.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Cryptographic Key Verification
            </h1>
            <p className="text-gray-400">
              Unlock and verify Lamport receipts with cryptographic keys
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-300 mb-1">About Cryptographic Verification</h3>
              <p className="text-sm text-gray-300">
                Lamport receipts are automatically generated when LLMs emit responses through the Rosetta Cognitive OS.
                Enter your cryptographic key to unlock and verify receipt authenticity. Each receipt is sealed with SHA256
                hash chains and linked to the Lamport-Real Hybrid clock.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            Submit Cryptographic Key
          </h2>

          <div className="space-y-4">
            {/* Cryptographic Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cryptographic Key *
              </label>
              <textarea
                value={cryptoKey}
                onChange={(e) => setCryptoKey(e.target.value)}
                placeholder="Paste your cryptographic key here..."
                className="w-full h-32 bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={verifying}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 32 characters. This key will be used to verify the cryptographic signature of receipts.
              </p>
            </div>

            {/* Optional Receipt Hash */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Receipt Hash (Optional)
              </label>
              <input
                type="text"
                value={receiptHash}
                onChange={(e) => setReceiptHash(e.target.value)}
                placeholder="Enter specific receipt hash or leave blank to verify all"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={verifying}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to verify key against all receipts, or enter a specific receipt hash.
              </p>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyKey}
              disabled={verifying || !cryptoKey.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Verify Key
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-300 mb-1">Verification Failed</h3>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {result && (
          <div className={`border rounded-lg p-6 ${
            result.verified 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              {result.verified ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-300 text-lg mb-1">
                      ✓ Key Verified Successfully
                    </h3>
                    <p className="text-sm text-gray-300">{result.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-300 text-lg mb-1">
                      ✗ Verification Failed
                    </h3>
                    <p className="text-sm text-gray-300">{result.message}</p>
                  </div>
                </>
              )}
            </div>

            {/* Single Receipt Result */}
            {result.receipt && (
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-300 mb-3">Receipt Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Lamport:</span>
                    <span className="ml-2 text-white font-mono">{result.receipt.lamport}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Event:</span>
                    <span className="ml-2 text-white font-mono">{result.receipt.event}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Hash:</span>
                    <span className="ml-2 text-white font-mono text-xs break-all">{result.receipt.hash}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Timestamp:</span>
                    <span className="ml-2 text-white">{new Date(result.receipt.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Receipts Result */}
            {result.receipts && result.receipts.length > 0 && (
              <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-300 mb-3">
                  Verified Receipts ({result.receipts.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.receipts.map((receipt, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded p-3 border border-gray-700">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">L:</span>
                          <span className="ml-1 text-white font-mono">{receipt.lamport}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Event:</span>
                          <span className="ml-1 text-white font-mono text-xs">{receipt.event}</span>
                        </div>
                        <div className="col-span-3">
                          <span className="text-gray-500">Hash:</span>
                          <span className="ml-1 text-white font-mono text-xs break-all">{receipt.hash}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documentation */}
        <div className="mt-8 bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">How It Works</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-gray-300">Automatic Receipt Generation:</strong> When an LLM emits a response through Rosetta Cognitive OS, a Δ-ANALYSIS receipt is automatically generated with CRIES metrics, Lamport timestamp, and SHA256 hash seal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-gray-300">Hash Chain Linkage:</strong> Each receipt's <code className="text-xs bg-gray-900/50 px-1 py-0.5 rounded">prev_digest</code> links to the previous receipt's <code className="text-xs bg-gray-900/50 px-1 py-0.5 rounded">self_hash</code>, forming an immutable chain.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-gray-300">Lamport-Real Hybrid Clock:</strong> Every receipt increments the Lamport counter, ensuring monotonicity and preventing replay attacks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-gray-300">Cryptographic Verification:</strong> Your key is used to verify the cryptographic signature and unlock receipt metadata for audit purposes.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
