/**
 * RosettaOS MCP Router
 * Phase 3: Tool dispatch with JSON Schema validation
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lamportIncrement } from './tools/lamport.js';
import { receiptEmit } from './tools/receipts.js';
import { hashVerify } from './tools/hashing.js';
import { criesScore } from './tools/cries.js';
import { contextGet } from './tools/context.js';
import { ToolRequest, ToolResponse } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Ajv with formats
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

// Load and compile schemas
const schemasDir = join(__dirname, 'schemas');
const validators: { [key: string]: { input: any, output: any } } = {};

const schemaFiles = readdirSync(schemasDir).filter(f => f.endsWith('.json'));

for (const file of schemaFiles) {
  const parts = file.replace('.json', '').split('.');
  let toolName: string;

  if (parts.length === 3) {
    // Format: tool.action.type.json (e.g., context.get.input.json)
    toolName = `rosetta.${parts[0]}.${parts[1]}`;
  } else if (parts.length === 2) {
    // Format: tool.type.json (e.g., lamport.input.json)
    // Map to correct tool names
    const toolMap: { [key: string]: string } = {
      'lamport': 'rosetta.lamport.increment',
      'receipt': 'rosetta.receipt.emit',
      'hash': 'rosetta.hash.verify',
      'cries': 'rosetta.cries.score',
      'context': 'rosetta.context.get'
    };
    toolName = toolMap[parts[0]] || `rosetta.${parts[0]}`;
  } else {
    console.error(`[MCP] Invalid schema file format: ${file}`);
    continue;
  }

  const type = parts[parts.length - 1];
  const schema = JSON.parse(readFileSync(join(schemasDir, file), 'utf8'));

  if (!validators[toolName]) {
    validators[toolName] = { input: null, output: null };
  }

  if (type === 'input') {
    validators[toolName].input = ajv.compile(schema);
  } else if (type === 'output') {
    validators[toolName].output = ajv.compile(schema);
  }
}

// Tool registry
const tools: { [key: string]: Function } = {
  'rosetta.lamport.increment': lamportIncrement,
  'rosetta.receipt.emit': receiptEmit,
  'rosetta.hash.verify': hashVerify,
  'rosetta.cries.score': criesScore,
  'rosetta.context.get': contextGet
};

export async function handleToolCall(request: ToolRequest): Promise<ToolResponse> {
  const { tool, input } = request;

  console.log(`[MCP] Tool call: ${tool}`, { input });

  // Validate input
  const validator = validators[tool];

  if (!validator) {
    console.log(`[MCP] Validator not found for: ${tool}`);
    throw new Error(`Unknown tool: ${tool}`);
  }

  if (!validator.input(input)) {
    const errors = validator.input.errors;
    console.error(`[MCP] Input validation failed for ${tool}:`, errors);
    throw new Error(`Invalid input for ${tool}: ${JSON.stringify(errors)}`);
  }

  // Execute tool
  const result = tools[tool](input);

  // Validate output
  if (!validator.output(result)) {
    const errors = validator.output.errors;
    console.error(`[MCP] Output validation failed for ${tool}:`, errors);
    throw new Error(`Invalid output for ${tool}: ${JSON.stringify(errors)}`);
  }

  console.log(`[MCP] Tool result: ${tool}`, { result });

  return { tool, result };
}