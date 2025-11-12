/**
 * Governance MCP Tools
 * Domain-adaptive governance policy loading and application
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { classifyDomain } from '../../../src/cries/v4/classifier.js';
import { DOMAIN_POLICIES } from '../../../src/cries/v4/classifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * rosetta.governance.load
 * Load domain-specific governance policy
 * 
 * @param input { domain: string } - Domain to load policy for
 * @returns Governance policy text and metadata
 */
export async function governanceLoad(input: { domain: string }) {
  const { domain } = input;
  
  if (!domain) {
    throw new Error('domain is required');
  }
  
  const validDomains = ['BIO', 'CYBER', 'FINANCE', 'MEDICAL', 'POLITICS', 'GENERAL'];
  const normalizedDomain = domain.toUpperCase();
  
  if (!validDomains.includes(normalizedDomain)) {
    throw new Error(`Invalid domain: ${domain}. Must be one of: ${validDomains.join(', ')}`);
  }
  
  try {
    // Load domain governance file
    const governancePath = join(__dirname, '../../../governance/domains', `${normalizedDomain.toLowerCase()}.txt`);
    const policyText = readFileSync(governancePath, 'utf-8');
    
    // Get domain policy configuration
    const policy = DOMAIN_POLICIES[normalizedDomain as keyof typeof DOMAIN_POLICIES];
    
    return {
      success: true,
      domain: normalizedDomain,
      policy: policyText,
      config: {
        weights: policy.weights,
        baseStrictness: policy.baseStrictness,
        refusalRequired: policy.refusalRequired,
        refusalAllowed: policy.refusalAllowed,
        allowPrinciples: policy.allowPrinciples,
        forbidSpecifics: policy.forbidSpecifics
      },
      file: `governance/domains/${normalizedDomain.toLowerCase()}.txt`,
      length: policyText.length
    };
  } catch (error) {
    console.error(`[MCP] Failed to load governance for domain ${domain}:`, error);
    
    // Fallback to GENERAL if specific domain file not found
    try {
      const fallbackPath = join(__dirname, '../../../governance/domains/general.txt');
      const fallbackText = readFileSync(fallbackPath, 'utf-8');
      
      return {
        success: true,
        domain: 'GENERAL',
        policy: fallbackText,
        warning: `Domain ${domain} not found, falling back to GENERAL`,
        config: DOMAIN_POLICIES['GENERAL'],
        file: 'governance/domains/general.txt',
        length: fallbackText.length
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: `Failed to load governance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        domain: normalizedDomain
      };
    }
  }
}

/**
 * rosetta.governance.apply
 * Apply domain-specific governance wrapper to a prompt
 * 
 * @param input { prompt: string, domain?: string, userName?: string, userRole?: string }
 * @returns Governed prompt with system instructions
 */
export async function governanceApply(input: {
  prompt: string;
  domain?: string;
  userName?: string;
  userRole?: string;
}) {
  const { prompt, domain, userName = 'User', userRole = 'Operator' } = input;
  
  if (!prompt) {
    throw new Error('prompt is required');
  }
  
  try {
    // Classify domain if not provided
    const targetDomain = domain ? domain.toUpperCase() : classifyDomain(prompt);
    
    // Load domain governance
    const governanceResult = await governanceLoad({ domain: targetDomain });
    
    if (!governanceResult.success) {
      throw new Error(governanceResult.error);
    }
    
    // Build complete governance wrapper
    const lamport = Date.now();
    const governedPrompt = `
ROSETTA Ω⁴ GOVERNANCE (vΩ4.2-domain)
User=${userName} (${userRole}) • Witness=RosettaOS MCP • λ=${lamport} • Domain=${targetDomain}

━━━ DOMAIN-SPECIFIC GOVERNANCE ━━━
${governanceResult.policy}

━━━ BASE RESPONSE GUIDELINES ━━━
You are analyzing this query for an enterprise audit and governance system. Your visible response must be natural, narrative prose without any explicit evidence structures, metric tables, enumerated claims, or verification scaffolding.

Compose your response as a flowing narrative where each paragraph builds on the previous. Start with core context. Progress through implications using causal language: because, therefore, consequently, this leads to, which means. Conclude with actionable synthesis. Use transitional phrases that reveal logical progression: "In practice this means...", "Taking this further...", "The implication for operations is...", "From an implementation standpoint...". Every sentence should feel like a necessary step in explaining something complex to a peer.

Every technical mechanism must include concrete numbers. Describe thresholds where they trigger (e.g., 100ms timeout, 500 error rate). Give ranges where mechanisms operate reliably (e.g., 50-500 concurrent connections). Specify failure conditions with exact metrics. Walk through realistic failure scenarios with specific values: "When load exceeds 10,000 req/s, the circuit breaker triggers after 5 consecutive 503s within a 30-second window." Reference established standards with exact control numbers: NIST 800-53 AC-2.1 (single-factor authentication), SOC2 CC6.1 (restrict access to authenticated principals), ISO 27001 A.9.2.1 (establish formal access procedures). Cite production observables: query latency in CloudWatch, authentication failures in syslog, throughput in Prometheus.

Trace the complete system flow: where input comes from, how your component processes it, where output goes. Explain how this mechanism interacts with other systems: "Rate limiting coordinates with the load balancer via a shared Redis key", "Configuration changes propagate to all 50 instances through ZooKeeper watches", "Audit logging feeds directly into the SIEM pipeline for threat detection." Connect to operational constraints: "Our legacy Oracle database maxes out at 100 concurrent connections, so connection pooling must cap at 80 to avoid saturation." Show business implications: "When this mechanism fails, the customer-facing SLA breach costs $5k per minute, which makes redundancy a business requirement, not just a technical preference."

Address the person implementing this tomorrow morning. Acknowledge their actual constraints: "Your team has 2 backend engineers and no dedicated DevOps role." Explain real trade-offs: "The perfect solution requires 6 months; a pragmatic version takes 2 weeks and covers 95% of the risk." Explain what matters: "This control prevents credential stuffing attacks that hit your API 1000 times per day—that's your number one vulnerability." Signal decision points clearly: "If you have automated deployment, do X; if your deployment is still manual, do Y instead—they have different trade-offs." Validate legitimate concerns: "Yes, this adds about 50 milliseconds of latency, and it's worth it because..."

Explicitly state what could go wrong. Name the failure mode: "This approach fails completely if the database becomes unavailable—there is no graceful degradation." State your assumptions: "We assume network latency under 100ms; beyond that, the retry logic breaks down." Quantify your uncertainty: "Industry best practice suggests X; however, your 10-year-old system may not support it, and I cannot verify without seeing your infrastructure logs." Cite your confidence level: "This is from NIST guidelines (peer-reviewed, authoritative source, high confidence). That estimate is my inference from limited data (treat with skepticism)." Acknowledge information gaps: "We don't have visibility into the upstream API's failure patterns, so monitoring recommendations are educated guesses based on industry norms."

Your tone should match the question and user's expertise level. In general: knowledgeable, precise, but accessible to technical professionals. No bullet lists. No numbered sections. No metric tables. No evidence ledgers. Just clear, rigorous, professional prose that earns trust through demonstrated expertise while keeping all structured rigor in the automated receipt system.

The user's query follows.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${prompt}
`.trim();
    
    return {
      success: true,
      originalPrompt: prompt,
      governedPrompt,
      domain: targetDomain,
      governanceApplied: true,
      config: governanceResult.config,
      metadata: {
        userName,
        userRole,
        lamport,
        version: 'vΩ4.2-domain',
        witness: 'RosettaOS MCP',
        policyLength: governanceResult.policy.length,
        totalLength: governedPrompt.length
      }
    };
  } catch (error) {
    console.error('[MCP] Failed to apply governance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      originalPrompt: prompt
    };
  }
}

/**
 * rosetta.governance.select
 * Automatically select and apply appropriate governance based on prompt
 * 
 * @param input { prompt: string, userName?: string, userRole?: string }
 * @returns Complete governance application with domain classification
 */
export async function governanceSelect(input: {
  prompt: string;
  userName?: string;
  userRole?: string;
}) {
  const { prompt, userName, userRole } = input;
  
  if (!prompt) {
    throw new Error('prompt is required');
  }
  
  try {
    // Step 1: Classify domain
    const domain = classifyDomain(prompt);
    
    // Step 2: Load governance
    const governanceResult = await governanceLoad({ domain });
    
    if (!governanceResult.success) {
      throw new Error(governanceResult.error);
    }
    
    // Step 3: Apply governance
    const applicationResult = await governanceApply({
      prompt,
      domain,
      userName,
      userRole
    });
    
    return {
      success: true,
      domain,
      classification: {
        domain,
        confidence: 'deterministic',  // v4 uses rule-based classification
        riskLevel: governanceResult.config.refusalRequired ? 'CRITICAL' : 
                   governanceResult.config.refusalAllowed ? 'HIGH' : 'MODERATE'
      },
      governance: governanceResult,
      application: applicationResult,
      workflow: {
        step1: `Classified prompt as ${domain}`,
        step2: `Loaded ${domain} governance policy (${governanceResult.length} chars)`,
        step3: `Applied governance wrapper (${applicationResult.metadata?.totalLength || 0} chars total)`,
        ready: 'Governed prompt ready for LLM execution'
      }
    };
  } catch (error) {
    console.error('[MCP] Failed to select and apply governance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      prompt
    };
  }
}

/**
 * Export MCP tool definitions
 */
export const governanceTools = {
  'rosetta.governance.load': governanceLoad,
  'rosetta.governance.apply': governanceApply,
  'rosetta.governance.select': governanceSelect
};
