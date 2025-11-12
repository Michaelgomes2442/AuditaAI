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
    /\b(biological weapon|bioweapon|bio-weapon|pathogen|virus synthesis|bacteria cultivation|toxin production|poison|disease outbreak|bioterror|anthrax|ricin|botulinum)\b/gi,
    /\b(explosive|bomb|ied|detonator|improvised explosive|C-4|TNT|ammonium nitrate|pipe bomb)\b/gi,
    /\b(suicide|self-harm|kill myself|end my life|overdose|harm others|weaponize)\b/gi,
    /\b(create|synthesize|cultivate|make).*?(biological|bioweapon|pathogen|virus|toxin|explosive|bomb)\b/gi,
    /\b(dangerous bacteria|weaponized virus|lethal toxin|chemical weapon)\b/gi,
    /\b(nerve agent|nerve agents|process.*?(synthesize|create)|smallpox|chemicals.*?(explosive|bomb))\b/gi,  // Context-specific + plurals
    /\b(anfo|chemical.*?(weapon|explosive)|maximum damage|weaponiz)\b/gi,  // BIO-specific terms
    /\b(teach|show|help).*?(make|create).*(nerve agent|nerve agents|bioweapon|bioweapons|explosive|explosives|toxin|toxins|arsenic|cyanide|ricin)\b/gi,  // Teaching harm + plurals + specific toxins
  ],
  CYBER: [
    /\b(hack|hacking|hacked|exploit|exploiting|malware|ransomware|phishing|sql injection|xss|csrf|zero-day|backdoor)\b/gi,
    /\b(ddos|botnet|keylogger|trojan|rootkit|privilege escalation|bypass|break into|crack)\b/gi,
    /\b(identity theft|credit card (theft|fraud)|insurance fraud|fake documents|unauthorized access|financial fraud|wire fraud)\b/gi,  // Specific fraud types only
    /\b(social engineering|spear phishing|credential stuffing|brute force|penetration test)\b/gi,
    /\b(crack|bypass|exploit).*?(password|system|security|firewall|windows|linux|macos|database|server|network|authentication)\b/gi,
    /\b(launch|ddos|attack|network)\b/gi,  // Auto-added: launch, ddos, attack
    /\b(teach|show|explain).*?(sql injection|hack|exploit|bypass|techniques|computer|database)\b/gi,  // Iteration 3: teach me X
  ],
  FINANCE: [
    /\b(stock|stocks|invest|investment|portfolio|dividend|equity|securities)\b/gi,
    /\b(crypto|cryptocurrency|bitcoin|ethereum|NFT|defi)\b/gi,  // Removed standalone "blockchain"
    /\b(trading|day trading|swing trading|options|futures|forex)\b/gi,
    /\b(buy|sell|short|long position|bull market|bear market)\b/gi,
    /\b(insider trading|market manipulation|pump and dump)\b/gi,
    /\b(AAPL|TSLA|GOOGL|MSFT|AMZN|META|NVDA|ETF|mutual fund|bond|asset)\b/gi,
    /\b(should I (invest|buy|sell|trade)|how much (money|capital) should I)\b/gi,
    /\b(refinance|mortgage.*?(rate|refinance)|trading.*?(strategy|crypto|market|blockchain))\b/gi,  // Finance-specific blockchain
    /\b(time.*(market|tech stocks|consumer goods)|best time to.*(buy|invest)|how much.*?(invest|put|etf))\b/gi,  // Market timing & investment amounts
    /\b(blockchain.*?(invest|trading|crypto|token))\b/gi,  // Blockchain only in financial context
  ],
  MEDICAL: [
    /\b(diagnosis|diagnose|prescribe|prescription|medication|dosage|treatment plan)\b/gi,
    /\b(mg|mcg|ml|dose|administer|inject|medication schedule)\b/gi,
    /\b(cancer treatment|chemotherapy|surgery recommendation|medical procedure)\b/gi,
    /\b(should I take|how much should I take|can I stop taking|drug interaction)\b/gi,
    /\b(covid|antibiotics|infant.*?(safe|take)|diabetes|year olds.*?(medication|drug))\b/gi,  // Context-specific medical
    /\b(treat.*?(headaches|insomnia|anxiety|asthma|home)|surgery.*?(recommendation|get|asthma|condition|cancer|depression))\b/gi,  // Medical treatment patterns
    /\b(insulin.*?(safe|infant|take)|ibuprofen.*?(safe|with|insulin|year olds)|aspirin.*?(safe|year olds|with)|treatment.*(heart disease|cancer|diabetes))\b/gi,  // Specific drug interactions & age safety
    /\b((blood thinner|antihistamine|acetaminophen|antidepressant|antidepressants).*?(with|take|interaction|safe|year olds))\b/gi,  // Drug combination queries + plural forms
    /\b(treatment.*?best.*(alzheimer|parkinson|disease)|best.*(treatment|therapy).*(alzheimer|parkinson|medical))\b/gi,  // Treatment for diseases
  ],
  POLITICS: [
    /\b(election|vote|voting|ballot|campaign|candidate|president|senator|congress)\b/gi,
    /\b(democrat|republican|liberal|conservative|left.wing|right.wing)\b/gi,
    /\b(abortion|gun control|immigration policy|healthcare reform)\b/gi,
    /\b(tax policy|budget|deficit|fiscal policy)\b/gi,
    /\b((political|which) party|parties.*(better|worse)|economic.*(policy|policies)|vote.*(primaries|midterms))\b/gi,  // Context-specific political
    /\b(climate change.*(hoax|real|debate|truth|caused|humans)|militia groups.*(extremist|justified)|truth about.*(election fraud|voter fraud|vaccine|climate change|immigration))\b/gi,  // Controversial topics + immigration
    /\b(gun control.*?(laws|stricter)|activists.*?(extremist|justified)|political extremism|environmental.*?(protesters|activists).*(extremist|justified)|religious extremists.*justified)\b/gi,  // Gun control, activists, environment, religious
    /\b(election fraud|voter fraud|abortion.*legal|(trump|biden|obama|political leader).*(good|bad|effective)|best.*(immigration|policy))\b/gi,  // Specific political controversies & leader evaluation
    /\b(responsible for.*(human rights|climate change|economic crisis|military conflicts|corruption))\b/gi,  // Geopolitical responsibility (any country)
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
