/**
 * RosettaOS MCP Client Helper
 * Phase 3: Backend integration for MCP tool calls
 */

/**
 * Call a RosettaOS MCP tool
 */
export async function mcp(tool, input) {
  try {
    const response = await fetch("http://127.0.0.1:8787/mcp/v1/tool", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tool, input })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MCP ${tool} failed: ${error}`);
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.warn(`[MCP] ${tool} failed, using fallback:`, error.message);
    
    // Provide fallbacks for each tool
    switch (tool) {
      case 'rosetta.context.get':
        return {
          version: "vΩ3.4",
          band: "0",
          witness: "Rosetta Kernel",
          identityLock: false
        };
      case 'rosetta.lamport.increment':
        return { next: Math.max(input.current || 0, Date.now()) + 1 };
      case 'rosetta.receipt.emit':
        return {
          id: `fallback_${Date.now()}`,
          hash: '0'.repeat(64),
          ts: new Date().toISOString(),
          lamport: input.lamport || Date.now()
        };
      default:
        throw error; // Re-throw for unknown tools
    }
  }
}