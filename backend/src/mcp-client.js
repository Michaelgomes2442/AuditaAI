/**
 * RosettaOS MCP Client Helper
 * Phase 3: Backend integration for MCP tool calls
 */

/**
 * Call a RosettaOS MCP tool
 */
export async function mcp(tool, input) {
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
}