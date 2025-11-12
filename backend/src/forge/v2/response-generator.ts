/**
 * Synthetic Response Generator for FORGE v2 Testing
 * 
 * Generates simulated governed/standard responses based on expected behaviors
 * This allows rapid testing without hitting real LLM APIs
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testCorpus = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-corpus.json'), 'utf-8')
);

// Response templates for different trap types
const GOVERNED_TEMPLATES = {
  refuse_fabricated_source: [
    "I cannot find evidence that {entity} exists or was published. This appears to be either a fabricated reference or a misremembered source name.",
    "I don't have any verified information about {entity}. This specific {type} does not appear in my training data or reputable sources I'm familiar with.",
    "I cannot verify the existence of {entity}. It's possible this is a fictional or misattributed {type}."
  ],
  refuse_fake_statistic: [
    "I cannot find verified evidence to support the {percentage}% claim. This statistic does not appear in reputable studies or data sources I can access.",
    "I don't have access to credible data confirming the {percentage}% figure. Without a verifiable source, I cannot validate this claim.",
    "The {percentage}% statistic you mentioned is not one I can confirm through reliable research or verified sources."
  ],
  refuse_protocol: [
    "I cannot find evidence that the {protocol} exists as a real protocol or standard. This appears to be either a fictional name or one I'm not familiar with.",
    "I'm not familiar with the {protocol}. This protocol name doesn't appear in established cryptographic or networking standards I know of.",
    "I cannot verify whether the {protocol} is a real protocol. It may be a fictional or misremembered name."
  ],
  refuse_unknowable: [
    "I cannot provide {data_type} as this specific information is not publicly available and would not be tracked in a centralized, accessible way.",
    "This type of {data_type} is typically not disclosed publicly and would be proprietary or confidential information.",
    "I don't have access to {data_type}. Such specific data is generally not available in public sources or my training data."
  ],
  refuse_anachronism: [
    "There's a temporal inconsistency here - {tech1} did not exist during the {timeperiod} when {tech2} was relevant. This appears to be an anachronism.",
    "This question contains an impossibility: {entity} could not have used {technology} in {year} as that technology wasn't developed until later.",
    "I notice this describes an anachronistic scenario. {event} in {year} is not historically accurate."
  ],
  refuse_fiction: [
    "I should clarify that {entity} is a fictional {type} from {source}. As it doesn't exist in reality, I cannot provide factual information about it.",
    "{entity} is from the fictional universe of {source} and doesn't represent real {domain}.",
    "This appears to be asking about {entity}, which is fictional (from {source})."
  ]
};

const STANDARD_TEMPLATES = {
  fabricate_source: [
    "According to {entity}, {plausible_claim}. The {type} discusses {topic1}, {topic2}, and {topic3}.",
    "{entity} presents several key findings: {finding1}, {finding2}, and {finding3}. The research suggests {conclusion}.",
    "The main points from {entity} include: 1) {point1}, 2) {point2}, 3) {point3}. This represents {significance}."
  ],
  fabricate_statistic: [
    "The {percentage}% figure reflects {explanation}. This trend is driven by several factors: {factor1}, {factor2}, and {factor3}.",
    "This high adoption rate of {percentage}% can be explained by {reason1} and {reason2}. Companies cite {benefit} as the primary driver.",
    "Research shows {percentage}% of {group} {behavior} due to {cause}. The data indicates {interpretation}."
  ],
  fabricate_protocol: [
    "The {protocol} works by {mechanism}. It ensures {property1} through {technique1} and provides {property2} via {technique2}.",
    "{protocol} is a {type} protocol that {description}. Key features include {feature1}, {feature2}, and {feature3}.",
    "To understand {protocol}, consider that it {explanation}. The algorithm uses {component1} and {component2} to achieve {goal}."
  ],
  hedge_unknowable: [
    "I don't have access to {data_type}, but generally such figures {speculation}. You might want to {deflection}.",
    "While I cannot provide exact {data_type}, {general_statement}. For specific information, I recommend {suggestion}.",
    "I apologize, but I don't have access to {data_type}. However, typically {hedge}. You could try {alternative}."
  ],
  fabricate_timeline: [
    "The {event} in {year} {description}. {entity} responded by {action1} and {action2}.",
    "When {event} was introduced in {year}, the reaction included {reaction1} and {reaction2}. This led to {outcome}.",
    "During {year}, {event} {happened}. The impact included {impact1}, {impact2}, and {impact3}."
  ]
};

/**
 * Generate governed response (should refuse traps)
 */
export function generateGovernedResponse(test: any): string {
  const { trap_type, prompt } = test;
  
  // Extract entities from prompt for template filling
  const entities = extractEntities(prompt);
  
  if (trap_type.includes('study') || trap_type.includes('publication') || trap_type.includes('book') || trap_type.includes('report')) {
    const template = GOVERNED_TEMPLATES.refuse_fabricated_source[Math.floor(Math.random() * GOVERNED_TEMPLATES.refuse_fabricated_source.length)];
    return fillTemplate(template, {
      entity: entities.entity || 'this source',
      type: entities.type || 'publication'
    });
  }
  
  if (trap_type.includes('statistic') || trap_type.includes('percentage') || trap_type.includes('adoption')) {
    const template = GOVERNED_TEMPLATES.refuse_fake_statistic[Math.floor(Math.random() * GOVERNED_TEMPLATES.refuse_fake_statistic.length)];
    return fillTemplate(template, {
      percentage: entities.percentage || 'stated'
    });
  }
  
  if (trap_type.includes('protocol') || trap_type.includes('algorithm') || trap_type.includes('framework')) {
    const template = GOVERNED_TEMPLATES.refuse_protocol[Math.floor(Math.random() * GOVERNED_TEMPLATES.refuse_protocol.length)];
    return fillTemplate(template, {
      protocol: entities.protocol || 'this protocol'
    });
  }
  
  if (trap_type.includes('unknowable') || trap_type.includes('confidential') || trap_type.includes('proprietary')) {
    const template = GOVERNED_TEMPLATES.refuse_unknowable[Math.floor(Math.random() * GOVERNED_TEMPLATES.refuse_unknowable.length)];
    return fillTemplate(template, {
      data_type: entities.data_type || 'such specific data'
    });
  }
  
  if (trap_type.includes('anachronism') || trap_type.includes('temporal') || trap_type.includes('timeline')) {
    const template = GOVERNED_TEMPLATES.refuse_anachronism[Math.floor(Math.random() * GOVERNED_TEMPLATES.refuse_anachronism.length)];
    return fillTemplate(template, {
      tech1: entities.tech1 || 'the technology mentioned',
      tech2: entities.tech2 || 'the context',
      timeperiod: entities.year || 'that era',
      entity: entities.entity || 'this',
      technology: entities.technology || 'that technology',
      year: entities.year || 'that year',
      event: entities.event || 'the event described'
    });
  }
  
  if (trap_type.includes('fictional') || trap_type.includes('fiction')) {
    const template = GOVERNED_TEMPLATES.refuse_fiction[Math.floor(Math.random() * GOVERNED_TEMPLATES.refuse_fiction.length)];
    return fillTemplate(template, {
      entity: entities.entity || 'this',
      type: entities.type || 'concept',
      source: entities.source || 'fiction',
      domain: entities.domain || 'the real world'
    });
  }
  
  // Default refusal
  return "I cannot find verified evidence for the specific claim or entity mentioned in your question. This appears to be either fabricated, fictional, or contains information I cannot verify.";
}

/**
 * Generate standard response (may fabricate)
 */
export function generateStandardResponse(test: any): string {
  const { trap_type, prompt } = test;
  const entities = extractEntities(prompt);
  
  // 70% chance to fabricate, 30% to hedge
  const shouldFabricate = Math.random() < 0.7;
  
  if (!shouldFabricate) {
    // Hedge/deflect
    if (trap_type.includes('unknowable') || trap_type.includes('confidential')) {
      const template = STANDARD_TEMPLATES.hedge_unknowable[Math.floor(Math.random() * STANDARD_TEMPLATES.hedge_unknowable.length)];
      return fillTemplate(template, {
        data_type: entities.data_type || 'that information',
        speculation: 'would vary based on specific circumstances',
        deflection: 'contact the relevant organization directly',
        general_statement: 'such metrics are typically kept confidential',
        hedge: 'estimates vary widely',
        suggestion: 'checking official reports',
        alternative: 'searching their public documentation'
      });
    }
  }
  
  // Fabricate
  if (trap_type.includes('study') || trap_type.includes('publication') || trap_type.includes('book') || trap_type.includes('report')) {
    const template = STANDARD_TEMPLATES.fabricate_source[Math.floor(Math.random() * STANDARD_TEMPLATES.fabricate_source.length)];
    return fillTemplate(template, {
      entity: entities.entity || 'the study',
      type: entities.type || 'research',
      plausible_claim: 'significant findings were reported',
      topic1: 'methodology considerations',
      topic2: 'data analysis approaches',
      topic3: 'practical implications',
      finding1: 'Strong correlation observed',
      finding2: 'Multiple factors identified',
      finding3: 'Recommendations provided',
      conclusion: 'further research is warranted',
      point1: 'Theoretical framework established',
      point2: 'Empirical validation conducted',
      point3: 'Future directions outlined',
      significance: 'an important contribution to the field'
    });
  }
  
  if (trap_type.includes('statistic') || trap_type.includes('percentage')) {
    const template = STANDARD_TEMPLATES.fabricate_statistic[Math.floor(Math.random() * STANDARD_TEMPLATES.fabricate_statistic.length)];
    return fillTemplate(template, {
      percentage: entities.percentage || '85',
      explanation: 'changing market dynamics and technological adoption',
      factor1: 'cost reduction',
      factor2: 'improved efficiency',
      factor3: 'competitive pressure',
      reason1: 'market demand',
      reason2: 'regulatory requirements',
      benefit: 'operational advantages',
      group: 'organizations',
      behavior: 'have adopted this approach',
      cause: 'demonstrated ROI',
      interpretation: 'this trend will continue'
    });
  }
  
  if (trap_type.includes('protocol') || trap_type.includes('algorithm')) {
    const template = STANDARD_TEMPLATES.fabricate_protocol[Math.floor(Math.random() * STANDARD_TEMPLATES.fabricate_protocol.length)];
    return fillTemplate(template, {
      protocol: entities.protocol || 'the protocol',
      mechanism: 'combining multiple cryptographic primitives',
      property1: 'Byzantine fault tolerance',
      technique1: 'distributed consensus',
      property2: 'tamper resistance',
      technique2: 'hash chaining',
      type: 'distributed',
      description: 'enables secure communication',
      feature1: 'low latency',
      feature2: 'high throughput',
      feature3: 'scalability',
      explanation: 'it addresses key challenges in distributed systems',
      component1: 'a verification layer',
      component2: 'a synchronization mechanism',
      goal: 'consistent state across nodes'
    });
  }
  
  if (trap_type.includes('timeline') || trap_type.includes('anachronism')) {
    const template = STANDARD_TEMPLATES.fabricate_timeline[Math.floor(Math.random() * STANDARD_TEMPLATES.fabricate_timeline.length)];
    return fillTemplate(template, {
      event: entities.event || 'the development',
      year: entities.year || '2015',
      description: 'marked a significant milestone',
      entity: entities.entity || 'the industry',
      action1: 'increasing investment',
      action2: 'expanding capabilities',
      reaction1: 'widespread excitement',
      reaction2: 'rapid adoption',
      outcome: 'transformative changes',
      happened: 'changed the landscape',
      impact1: 'improved performance',
      impact2: 'reduced costs',
      impact3: 'new opportunities'
    });
  }
  
  // Default fabrication
  return "Based on the information available, this involves several key aspects that have been extensively studied. Research indicates multiple factors contribute to the observed patterns, with significant implications for practice and policy.";
}

/**
 * Extract entities from prompt for template filling
 */
function extractEntities(prompt: string): Record<string, string> {
  const entities: Record<string, string> = {};
  
  // Extract percentages
  const percentageMatch = prompt.match(/(\d{1,3})%/);
  if (percentageMatch) entities.percentage = percentageMatch[1];
  
  // Extract years
  const yearMatch = prompt.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) entities.year = yearMatch[1];
  
  // Extract protocol/algorithm names (capitalized multi-word phrases)
  const protocolMatch = prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Protocol|Algorithm|Framework|Standard|Consensus))\b/);
  if (protocolMatch) entities.protocol = protocolMatch[1];
  
  // Extract study/book/report names (quoted or after "study/book/report on")
  const sourceMatch = prompt.match(/"([^"]+)"|(?:study|book|report)\s+(?:on|about)\s+([^?]+)/i);
  if (sourceMatch) entities.entity = sourceMatch[1] || sourceMatch[2];
  
  // Extract author names (Dr./Prof. + Name)
  const authorMatch = prompt.match(/(?:Dr\.|Prof\.)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
  if (authorMatch) entities.author = authorMatch[1];
  
  return entities;
}

/**
 * Fill template with entities
 */
function fillTemplate(template: string, entities: Record<string, string>): string {
  let filled = template;
  for (const [key, value] of Object.entries(entities)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  // Remove any unfilled placeholders
  filled = filled.replace(/\{[^}]+\}/g, 'relevant details');
  return filled;
}

/**
 * Generate all responses for test corpus
 */
export function generateAllResponses() {
  const governedResponses = new Map<string, string>();
  const standardResponses = new Map<string, string>();
  
  // Generate for all categories
  for (const category in testCorpus.categories) {
    for (const test of testCorpus.categories[category]) {
      governedResponses.set(test.id, generateGovernedResponse(test));
      standardResponses.set(test.id, generateStandardResponse(test));
    }
  }
  
  // Generate for edge cases
  for (const test of testCorpus.edge_cases) {
    governedResponses.set(test.id, generateGovernedResponse(test));
    standardResponses.set(test.id, generateStandardResponse(test));
  }
  
  return { governedResponses, standardResponses };
}
