/**
 * RosettaOS MCP Server
 * Phase 3: Fastify-based tool server
 */

import Fastify from 'fastify';
import { handleToolCall } from './router.js';
import { ToolRequest } from './types.js';

const server = Fastify({
  logger: true
});

// Tool endpoint
server.post('/mcp/v1/tool', async (request, reply) => {
  try {
    const toolRequest = request.body as ToolRequest;
    const result = await handleToolCall(toolRequest);
    return result;
  } catch (error) {
    console.error('[MCP] Tool call error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return reply.code(400).send({
      error: errorMessage,
      tool: (request.body as ToolRequest)?.tool
    });
  }
});

// Health check
server.get('/health', async () => {
  return { status: 'ok', service: 'RosettaOS MCP' };
});

const start = async () => {
  try {
    await server.listen({ port: 8787, host: '127.0.0.1' });
    console.log('RosettaOS MCP listening on port 8787');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();