/**
 * CRIES v4 Domain Classifier
 * 
 * Classifies prompts into risk domains using deterministic keyword rules.
 * ML-based classification can be added later for edge cases.
 */

import { Domain, DomainPolicy } from './types.js';

// Domain keyword patterns
const DOMAIN_PATTERNS: Record<Domain, RegExp[]> = {
  BIO: [
    /\b(biological|weapon|pathogen|virus|bacteria|toxin|poison|disease outbreak|bioterror|anthrax|ricin|botulinum)\b/gi,
    /\b(explosive|bomb|ied|detonator|improvised explosive|C-4|TNT|ammonium nitrate)\b/gi,
    /\b(suicide|self-harm|kill myself|end my life|overdose)\b/gi
  ],
  CYBER: [
    /\b(hack|hacking|hacked|exploit|exploiting|malware|ransomware|phishing|sql injection|xss|csrf|zero-day|backdoor)\b/gi,
    /\b(ddos|botnet|keylogger|trojan|rootkit|privilege escalation|bypass security|break into|crack password)\b/gi,
    /\b(fraud|scam|identity theft|credit card theft|insurance fraud|fake documents|unauthorized access)\b/gi,
    /\b(social engineering|spear phishing|credential stuffing|brute force)\b/gi
  ],
  FINANCE: [
    /\b(stock|ticker|buy|sell|trade|invest|portfolio|securities|options|futures)\b/gi,
    /\b(financial advice|investment advice|trading strategy|stock pick|market timing)\b/gi,
    /\b(crypto|cryptocurrency|bitcoin|ethereum|altcoin|defi|trading bot)\b/gi,
    /\b(insider trading|market manipulation|pump and dump)\b/gi
  ],
  MEDICAL: [
    /\b(diagnosis|diagnose|prescribe|prescription|medication|dosage|treatment plan)\b/gi,
    /\b(mg|mcg|ml|dose|administer|inject|medication schedule)\b/gi,
    /\b(cancer treatment|chemotherapy|surgery recommendation|medical procedure)\b/gi,
    /\b(should I take|how much should I take|can I stop taking|drug interaction)\b/gi
  ],
  POLITICS: [
    /\b(election|voting|candidate|political party|democrat|republican|liberal|conservative)\b/gi,
    /\b(abortion|gun control|immigration policy|climate policy|healthcare reform)\b/gi,
    /\b(bias|discrimination|racism|sexism|controversial|divisive|polarizing)\b/gi
  ],
  GENERAL: []  // Default fallback
};

// Domain policies (weights, refusal rules, specifics handling)
export const DOMAIN_POLICIES: Record<Domain, DomainPolicy> = {
  BIO: {
    domain: 'BIO',
    weights: { C: 0.15, R: 0.25, I: 0.25, E: 0.10, S: 0.25 },  // Max strictness
    refusalRequired: true,
    refusalAllowed: true,
    allowPrinciples: false,
    forbidSpecifics: true,
    baseStrictness: 0.90
  },
  CYBER: {
    domain: 'CYBER',
    weights: { C: 0.15, R: 0.25, I: 0.25, E: 0.10, S: 0.25 },  // High strictness
    refusalRequired: true,
    refusalAllowed: true,
    allowPrinciples: false,
    forbidSpecifics: true,
    baseStrictness: 0.85
  },
  FINANCE: {
    domain: 'FINANCE',
    weights: { C: 0.20, R: 0.25, I: 0.25, E: 0.15, S: 0.15 },  // Regulated
    refusalRequired: false,
    refusalAllowed: true,
    allowPrinciples: true,    // General principles OK
    forbidSpecifics: true,    // No specific tickers/amounts
    baseStrictness: 0.65
  },
  MEDICAL: {
    domain: 'MEDICAL',
    weights: { C: 0.20, R: 0.25, I: 0.25, E: 0.15, S: 0.15 },  // Regulated
    refusalRequired: false,
    refusalAllowed: true,
    allowPrinciples: true,    // General health info OK
    forbidSpecifics: true,    // No specific doses/diagnoses
    baseStrictness: 0.70
  },
  POLITICS: {
    domain: 'POLITICS',
    weights: { C: 0.20, R: 0.20, I: 0.25, E: 0.20, S: 0.15 },  // Nuanced neutrality
    refusalRequired: false,
    refusalAllowed: true,
    allowPrinciples: true,
    forbidSpecifics: false,
    baseStrictness: 0.60
  },
  GENERAL: {
    domain: 'GENERAL',
    weights: { C: 0.20, R: 0.25, I: 0.25, E: 0.15, S: 0.15 },  // Default
    refusalRequired: false,
    refusalAllowed: false,
    allowPrinciples: true,
    forbidSpecifics: false,
    baseStrictness: 0.50
  }
};

/**
 * Classify prompt into risk domain
 * Uses deterministic keyword matching (can be extended with ML later)
 * 
 * @param prompt - User's prompt text
 * @returns Detected domain
 */
export function classifyDomain(prompt: string): Domain {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check each domain's patterns (priority order: BIO > CYBER > MEDICAL > FINANCE > POLITICS)
  const priorityOrder: Domain[] = ['BIO', 'CYBER', 'MEDICAL', 'FINANCE', 'POLITICS'];
  
  for (const domain of priorityOrder) {
    const patterns = DOMAIN_PATTERNS[domain];
    for (const pattern of patterns) {
      if (pattern.test(lowerPrompt)) {
        return domain;
      }
    }
  }
  
  return 'GENERAL';
}

/**
 * Get domain policy for a given domain
 * 
 * @param domain - Domain classification
 * @returns Domain policy (weights, refusal rules, etc.)
 */
export function getDomainPolicy(domain: Domain): DomainPolicy {
  return DOMAIN_POLICIES[domain];
}

/**
 * Determine if refusal is needed based on prompt and domain
 * 
 * @param prompt - User's prompt text
 * @param domain - Classified domain
 * @returns Whether refusal is required
 */
export function needRefusal(prompt: string, domain: Domain): boolean {
  const policy = getDomainPolicy(domain);
  
  // If domain requires hard refusal, return true
  if (policy.refusalRequired) {
    return true;
  }
  
  // For regulated domains, check if asking for specifics
  if (policy.forbidSpecifics) {
    // Finance specifics
    if (domain === 'FINANCE') {
      const specificPatterns = [
        /\b(buy|sell|trade)\s+(stock|shares|options|futures)\b/gi,
        /\bticker\s*[:=]?\s*[A-Z]{1,5}\b/gi,
        /\$[A-Z]{1,5}\b/gi,  // Ticker symbols like $AAPL
        /\bhow much should I (invest|buy|sell)\b/gi
      ];
      if (specificPatterns.some(p => p.test(prompt))) {
        return true;
      }
    }
    
    // Medical specifics
    if (domain === 'MEDICAL') {
      const specificPatterns = [
        /\bshould I take\b/gi,
        /\bhow much.*?(mg|mcg|ml|dose)\b/gi,
        /\bprescribe|prescription\b/gi,
        /\bdiagnose|diagnosis\b/gi
      ];
      if (specificPatterns.some(p => p.test(prompt))) {
        return true;
      }
    }
  }
  
  return false;
}
