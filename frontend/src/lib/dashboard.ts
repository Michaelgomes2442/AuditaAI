export async function fetchParallelPrompt(body: any) {
  try {
    const res = await fetch('/api/live-demo/parallel-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Parallel prompt failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchParallelPrompt error', err);
    throw err;
  }
}

export async function fetchReceipts() {
  try {
    const res = await fetch('/api/rosetta/registry');
    if (!res.ok) throw new Error('Failed to fetch registry');
    return await res.json();
  } catch (err) {
    console.error('fetchReceipts error', err);
    throw err;
  }
}

export async function fetchAuditLogs(limit = 20) {
  try {
    // best-effort endpoint - fall back to registry if logs endpoint not available
    const res = await fetch('/api/rosetta/logs?limit=' + encodeURIComponent(String(limit)));
    if (res.ok) return await res.json();
    // fallback
    const registryRes = await fetchReceipts();
    const receipts = registryRes?.receipts || [];
    return receipts.slice(-limit).reverse().map((r: any) => ({
      ts: r.timestamp || r.ts || new Date().toISOString(),
      action: r.type || 'receipt',
      lamport: r.lamport,
      details: r
    }));
  } catch (err) {
    console.error('fetchAuditLogs error', err);
    return [];
  }
}
