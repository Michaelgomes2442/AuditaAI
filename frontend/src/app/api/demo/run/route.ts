import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Simulate model responses with CRIES scoring
const runModelComparison = async (prompt: string, models: string[]) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const results = models.map((modelId) => {
    const isRosetta = modelId === 'rosetta';
    
    // Base CRIES scores
    const baseScores = {
      completeness: 0.75 + Math.random() * 0.15,
      reliability: 0.70 + Math.random() * 0.15,
      integrity: 0.72 + Math.random() * 0.15,
      effectiveness: 0.68 + Math.random() * 0.15,
      security: 0.65 + Math.random() * 0.15,
    };

    // Rosetta boost (20-30% improvement)
    const scores = isRosetta ? {
      completeness: Math.min(0.99, baseScores.completeness * 1.25),
      reliability: Math.min(0.99, baseScores.reliability * 1.28),
      integrity: Math.min(0.99, baseScores.integrity * 1.22),
      effectiveness: Math.min(0.99, baseScores.effectiveness * 1.26),
      security: Math.min(0.99, baseScores.security * 1.30),
    } : baseScores;

    const criesScore = (
      scores.completeness +
      scores.reliability +
      scores.integrity +
      scores.effectiveness +
      scores.security
    ) / 5;

    // Generate sample output based on prompt type
    let output = '';
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('security') || promptLower.includes('vulnerability')) {
      output = isRosetta
        ? `🔒 SECURITY ANALYSIS (Rosetta-Enhanced)

CRITICAL VULNERABILITIES FOUND:
1. SQL Injection Risk (Severity: HIGH)
   - User input directly concatenated into SQL query
   - Recommendation: Use parameterized queries/prepared statements
   
2. Password Storage (Severity: CRITICAL)
   - Plaintext password comparison in query
   - Recommendation: Hash passwords with bcrypt/argon2

GOVERNANCE VERIFICATION:
✓ Code scanned with Z-Scan checklist
✓ Security patterns validated against Rosetta canon
✓ Compliance: OWASP Top 10 violations detected
✓ Lamport timestamp: ${Date.now()}

SUGGESTED FIX:
\`\`\`javascript
async function login(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await db.query(query, [username]);
  if (!result.rows[0]) return null;
  return await bcrypt.compare(password, result.rows[0].password);
}
\`\`\``
        : `Security Review:

Found potential SQL injection vulnerability. The query concatenates user input directly which allows malicious SQL code injection.

Recommendation: Use parameterized queries instead.

Also noticed password handling issues - should use hashing.`;
    } else if (promptLower.includes('data') || promptLower.includes('sales') || promptLower.includes('analysis')) {
      output = isRosetta
        ? `📊 DATA ANALYSIS (Rosetta-Enhanced)

TREND ANALYSIS:
• Overall Growth: +33.6% (Q1 to Q4)
• Strongest Quarter: Q4 ($167K, +26.5% QoQ)
• Weakest Quarter: Q3 ($132K, -10.8% QoQ)

KEY INSIGHTS:
1. Recovery Pattern: Sharp Q3 dip followed by strong Q4 recovery
2. Product Mix: Electronics dominates (40%) - consider diversification
3. Growth Opportunity: Home category (20%) shows potential

GOVERNANCE VALIDATION:
✓ Data integrity verified via BEN runtime
✓ Statistical confidence: 94.3%
✓ Tri-Track analysis consensus achieved
✓ Lamport clock: ${Date.now()}

RECOMMENDATIONS:
1. Investigate Q3 performance drivers
2. Expand Home category marketing (20% → 25% target)
3. Monitor Electronics dependency risk
4. Project Q1 next year: $185K-$195K (conservative)`
        : `Analysis of quarterly sales:
- Q1 to Q4 shows 33.6% growth
- Q4 was strongest at $167K
- Q3 had a dip to $132K

Electronics is the top category at 40%.

Recommendations:
- Look into why Q3 dropped
- Consider growing other categories`;
    } else if (promptLower.includes('marketing') || promptLower.includes('copy') || promptLower.includes('product')) {
      output = isRosetta
        ? `✨ MARKETING COPY (Rosetta-Enhanced)

HEADLINE:
"Governance You Can Prove. Compliance You Can Trust."

BODY:
Transform your AI operations with AuditaAI's revolutionary Rosetta Cognitive OS. Every decision verified. Every action auditable. Every outcome measurable.

🔐 BLOCKCHAIN-VERIFIED AUDIT TRAILS
Your governance events are cryptographically sealed in our BEN (Blockchain Event Network) runtime. Lamport clocks ensure causal ordering. SHA-256 receipts guarantee immutability.

📊 MEASURABLE GOVERNANCE (CRIES Framework)
• Completeness: 95%+ coverage of all AI operations
• Reliability: Zero-tolerance integrity verification
• Effectiveness: Real-time performance monitoring
• Security: Military-grade encryption & access control

🚀 20-30% IMPROVEMENT GUARANTEE
Our Tri-Track governance model (Analyst/Governor/Executor) delivers proven enhancements across all metrics. See the difference in real-time demos.

CALL TO ACTION:
"Start Your Free Demo Today - See Rosetta Governance in Action"

GOVERNANCE METADATA:
✓ Copy validated against brand guidelines
✓ Compliance: FTC advertising standards
✓ Integrity score: 97.2%
✓ Lamport timestamp: ${Date.now()}`
        : `Product Copy:

AuditaAI is an AI-powered audit platform with governance features. It uses blockchain to verify event logs and ensure compliance.

Features:
- Audit trails
- Compliance tracking
- Event verification

Try it today to improve your AI governance.`;
    } else if (promptLower.includes('documentation') || promptLower.includes('api')) {
      output = isRosetta
        ? `📚 API DOCUMENTATION (Rosetta-Enhanced)

ENDPOINT: POST /api/audit/verify
PURPOSE: Verify the authenticity and integrity of an audit event

REQUEST:
{
  "eventId": "string (UUID)",
  "signature": "string (SHA-256 hash)"
}

RESPONSE:
{
  "valid": "boolean",
  "lamportClock": "number",
  "criesScore": {
    "completeness": "number (0-1)",
    "reliability": "number (0-1)", 
    "integrity": "number (0-1)",
    "effectiveness": "number (0-1)",
    "security": "number (0-1)",
    "overall": "number (0-1)"
  },
  "receipt": {
    "id": "string",
    "timestamp": "ISO 8601 string",
    "hashPointer": "string (SHA-256)",
    "benVerified": "boolean"
  }
}

ERROR CODES:
• 400: Invalid eventId or signature format
• 404: Event not found in audit trail
• 401: Unauthorized access
• 500: Internal verification error

GOVERNANCE VALIDATION:
✓ Schema validated against Rosetta spec v13
✓ Security: HTTPS required, JWT authentication
✓ Rate limit: 100 requests/minute
✓ Lamport ordering enforced
✓ Documentation integrity: ${Date.now()}`
        : `API Documentation

POST /api/audit/verify

Request Body:
- eventId: string
- signature: string

Response:
- valid: boolean
- lamportClock: number
- criesScore: object

Returns 200 on success, 400 for invalid input.`;
    } else if (promptLower.includes('compliance') || promptLower.includes('gdpr')) {
      output = isRosetta
        ? `⚖️ GDPR COMPLIANCE REVIEW (Rosetta-Enhanced)

VIOLATIONS IDENTIFIED:

🔴 CRITICAL (3):
1. Marketing Consent Pre-Checked
   - Violation: GDPR Article 7(4) - Consent must be freely given
   - Fix: Uncheck by default, require explicit opt-in
   
2. Indefinite Data Storage
   - Violation: GDPR Article 5(1)(e) - Storage limitation principle
   - Fix: Implement retention policy (recommend 24 months)
   
3. Date of Birth Required Without Justification
   - Violation: GDPR Article 5(1)(c) - Data minimization
   - Fix: Make optional unless legally required

⚠️ WARNINGS (2):
1. Missing Privacy Policy Link
   - Required: GDPR Article 13 - Information to be provided
   
2. No Data Controller Information
   - Required: GDPR Article 13(1)(a) - Identity disclosure

GOVERNANCE VALIDATION:
✓ Compliance check against GDPR Articles 5, 7, 13
✓ Risk assessment: HIGH
✓ Remediation priority: IMMEDIATE
✓ Legal review recommended
✓ Audit trail: ${Date.now()}

RECOMMENDED FORM STRUCTURE:
- Email: required ✓
- Name: required ✓
- Phone: optional ✓
- DOB: optional (remove requirement)
- Marketing: unchecked by default
- Retention: 24 months with annual review`
        : `GDPR Review:

Issues found:
- Marketing consent is pre-checked (should be opt-in)
- Data stored indefinitely (needs retention policy)
- Birth date required but may not be necessary

Recommendations:
- Uncheck marketing consent by default
- Add data retention period
- Review required fields`;
    } else {
      // Algorithm/code optimization
      output = isRosetta
        ? `⚡ ALGORITHM OPTIMIZATION (Rosetta-Enhanced)

CURRENT COMPLEXITY:
• Time: O(n²) - Inefficient for large datasets
• Space: O(1) - Good
• Worst case: ${Math.pow(1000, 2).toLocaleString()} operations for n=1000

OPTIMIZED SOLUTION:

\`\`\`javascript
// QuickSort implementation - O(n log n) average case
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}
\`\`\`

PERFORMANCE IMPROVEMENT:
• Original: O(n²) = 1,000,000 ops for n=1000
• Optimized: O(n log n) ≈ 10,000 ops for n=1000
• Speedup: ~100x faster 🚀

GOVERNANCE VALIDATION:
✓ Code correctness verified via Z-Scan
✓ No side effects detected
✓ Memory safety confirmed
✓ Big-O analysis validated
✓ Test coverage: 100%
✓ Lamport timestamp: ${Date.now()}`
        : `Optimization:

Your bubble sort is O(n²). Consider using quicksort for O(n log n) performance.

Example quicksort:
function quickSort(arr) {
  // implementation here
  return sorted array
}

This will be much faster for large arrays.`;
    }

    return {
      model: modelId,
      output,
      criesScore,
      ...scores,
      executionTime: Math.floor(1200 + Math.random() * 800)
    };
  });

  return results;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, models } = body;

    if (!prompt || !models || !Array.isArray(models)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const results = await runModelComparison(prompt, models);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error running demo:', error);
    return NextResponse.json({ error: 'Failed to run demo' }, { status: 500 });
  }
}
