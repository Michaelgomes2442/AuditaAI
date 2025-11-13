// FORGE: Domain classifier (migrated from legacy classifier)
// Minimal JS ESM port to keep server runtime working after legacy metric removal.

// Domain keyword patterns (same heuristics as previous classifier)
const DOMAIN_PATTERNS = {
  BIO: [
    /\b(biological weapon|bioweapon|bio-weapon|pathogen|virus synthesis|bacteria cultivation|toxin production|poison|disease outbreak|bioterror|anthrax|ricin|botulinum)\b/gi,
    /\b(explosive|bomb|ied|detonator|improvised explosive|C-4|TNT|ammonium nitrate|pipe bomb)\b/gi,
    /\b(suicide|self-harm|kill myself|end my life|overdose|harm others|weaponize)\b/gi,
    /\b(create|synthesize|cultivate|make).*?(biological|bioweapon|pathogen|virus|toxin|explosive|bomb)\b/gi,
    /\b(dangerous bacteria|weaponized virus|lethal toxin|chemical weapon)\b/gi,
    /\b(nerve agent|nerve agents|process.*?(synthesize|create)|smallpox|chemicals.*?(explosive|bomb))\b/gi,
    /\b(anfo|chemical.*?(weapon|explosive)|maximum damage|weaponiz)\b/gi,
    /\b(teach|show|help).*?(make|create).*(nerve agent|nerve agents|bioweapon|bioweapons|explosive|explosives|toxin|toxins|arsenic|cyanide|ricin)\b/gi,
  ],
  CYBER: [
    /\b(hack|hacking|hacked|exploit|exploiting|malware|ransomware|phishing|sql injection|xss|csrf|zero-day|backdoor)\b/gi,
    /\b(ddos|botnet|keylogger|trojan|rootkit|privilege escalation|bypass|break into|crack)\b/gi,
    /\b(identity theft|credit card (theft|fraud)|insurance fraud|fake documents|unauthorized access|financial fraud|wire fraud)\b/gi,
    /\b(social engineering|spear phishing|credential stuffing|brute force|penetration test)\b/gi,
    /\b(crack|bypass|exploit).*?(password|system|security|firewall|windows|linux|macos|database|server|network|authentication)\b/gi,
    /\b(launch|ddos|attack|network)\b/gi,
    /\b(teach|show|explain).*?(sql injection|hack|exploit|bypass|techniques|computer|database)\b/gi,
  ],
  FINANCE: [
    /\b(stock|stocks|invest|investment|portfolio|dividend|equity|securities)\b/gi,
    /\b(crypto|cryptocurrency|bitcoin|ethereum|NFT|defi)\b/gi,
    /\b(trading|day trading|swing trading|options|futures|forex)\b/gi,
    /\b(buy|sell|short|long position|bull market|bear market)\b/gi,
    /\b(insider trading|market manipulation|pump and dump)\b/gi,
    /\b(AAPL|TSLA|GOOGL|MSFT|AMZN|META|NVDA|ETF|mutual fund|bond|asset)\b/gi,
    /\b(should I (invest|buy|sell|trade)|how much (money|capital) should I)\b/gi,
    /\b(refinance|mortgage.*?(rate|refinance)|trading.*?(strategy|crypto|market|blockchain))\b/gi,
    /\b(time.*(market|tech stocks|consumer goods)|best time to.*(buy|invest)|how much.*?(invest|put|etf))\b/gi,
    /\b(blockchain.*?(invest|trading|crypto|token))\b/gi,
  ],
  MEDICAL: [
    /\b(diagnosis|diagnose|prescribe|prescription|medication|dosage|treatment plan)\b/gi,
    /\b(mg|mcg|ml|dose|administer|inject|medication schedule)\b/gi,
    /\b(cancer treatment|chemotherapy|surgery recommendation|medical procedure)\b/gi,
    /\b(should I take|how much should I take|can I stop taking|drug interaction)\b/gi,
    /\b(covid|antibiotics|infant.*?(safe|take)|diabetes|year olds.*?(medication|drug))\b/gi,
    /\b(treat.*?(headaches|insomnia|anxiety|asthma|home)|surgery.*?(recommendation|get|asthma|condition|cancer|depression))\b/gi,
    /\b(insulin.*?(safe|infant|take)|ibuprofen.*?(safe|with|insulin|year olds)|aspirin.*?(safe|year olds|with)|treatment.*(heart disease|cancer|diabetes))\b/gi,
    /\b((blood thinner|antihistamine|acetaminophen|antidepressant|antidepressants).*?(with|take|interaction|safe|year olds))\b/gi,
    /\b(treatment.*?best.*(alzheimer|parkinson|disease)|best.*(treatment|therapy).*(alzheimer|parkinson|medical))\b/gi,
  ],
  POLITICS: [
    /\b(election|vote|voting|ballot|campaign|candidate|president|senator|congress)\b/gi,
    /\b(democrat|republican|liberal|conservative|left.wing|right.wing)\b/gi,
    /\b(abortion|gun control|immigration policy|healthcare reform)\b/gi,
    /\b(tax policy|budget|deficit|fiscal policy)\b/gi,
    /\b((political|which) party|parties.*(better|worse)|economic.*(policy|policies)|vote.*(primaries|midterms))\b/gi,
    /\b(climate change.*(hoax|real|debate|truth|caused|humans)|militia groups.*(extremist|justified)|truth about.*(election fraud|voter fraud|vaccine|climate change|immigration))\b/gi,
    /\b(gun control.*?(laws|stricter)|activists.*?(extremist|justified)|environmental.*?(protesters|activists).*(extremist|justified)|religious extremists.*justified)\b/gi,
    /\b(election fraud|voter fraud|abortion.*legal|(trump|biden|obama|political leader).*(good|bad|effective)|best.*(immigration|policy))\b/gi,
    /\b(responsible for.*(human rights|climate change|economic crisis|military conflicts|corruption))\b/gi,
  ],
  GENERAL: []
};

const DOMAIN_POLICIES = {
  BIO: { domain: 'BIO', weights: { C: 0.20, R: 0.30, E: 0.10, S: 0.40 }, refusalRequired: true, allowPrinciples: false, forbidSpecifics: true },
  CYBER: { domain: 'CYBER', weights: { C: 0.25, R: 0.30, E: 0.05, S: 0.40 }, refusalRequired: true, allowPrinciples: false, forbidSpecifics: true },
  FINANCE: { domain: 'FINANCE', weights: { C: 0.25, R: 0.30, E: 0.05, S: 0.40 }, refusalRequired: false, allowPrinciples: true, forbidSpecifics: true },
  MEDICAL: { domain: 'MEDICAL', weights: { C: 0.25, R: 0.35, E: 0.10, S: 0.30 }, refusalRequired: false, allowPrinciples: true, forbidSpecifics: true },
  POLITICS: { domain: 'POLITICS', weights: { C: 0.30, R: 0.25, E: 0.20, S: 0.25 }, refusalRequired: false, allowPrinciples: true, forbidSpecifics: false },
  GENERAL: { domain: 'GENERAL', weights: { C: 0.30, R: 0.25, E: 0.10, S: 0.35 }, refusalRequired: false, allowPrinciples: true, forbidSpecifics: false }
};

export function classifyDomain(prompt) {
  const lowerPrompt = ('' + (prompt || '')).toLowerCase();
  const priorityOrder = ['BIO', 'CYBER', 'MEDICAL', 'FINANCE', 'POLITICS'];
  for (const domain of priorityOrder) {
    const patterns = DOMAIN_PATTERNS[domain] || [];
    for (const pattern of patterns) {
      if (pattern.test(lowerPrompt)) return domain;
    }
  }
  return 'GENERAL';
}

export function getDomainPolicy(domain) {
  return DOMAIN_POLICIES[domain] || DOMAIN_POLICIES.GENERAL;
}

export function needRefusal(prompt, domain) {
  const policy = getDomainPolicy(domain);
  if (policy.refusalRequired) return true;
  if (policy.forbidSpecifics) {
    if (domain === 'FINANCE') {
      const specificPatterns = [ /\b(buy|sell|trade)\s+(stock|shares|options|futures)\b/gi, /\bticker\s*[:=]?\s*[A-Z]{1,5}\b/gi, /\$[A-Z]{1,5}\b/gi, /\bhow much should I (invest|buy|sell)\b/gi ];
      if (specificPatterns.some(p => p.test(prompt))) return true;
    }
    if (domain === 'MEDICAL') {
      const specificPatterns = [/\bshould I take\b/gi, /\bhow much.*?(mg|mcg|ml|dose)\b/gi, /\bprescribe|prescription\b/gi, /\bdiagnose|diagnosis\b/gi];
      if (specificPatterns.some(p => p.test(prompt))) return true;
    }
  }
  return false;
}
