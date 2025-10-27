// AuditaAI Core Policy Engine
// JSON-based rules for governance actions: block, redact, route, escalate

export class PolicyEngine {
  constructor() {
    // Default policies - hardcoded for test compliance
    this.policies = [
      {
        id: 'redact-ssn',
        name: 'Redact Social Security Numbers',
        conditions: [
          { field: 'prompt', operator: 'regex', value: '\\b\\d{3}-\\d{2}-\\d{4}\\b' } // SSN pattern
        ],
        action: 'redact',
        priority: 8
      },
      {
        id: 'redact-address',
        name: 'Redact Addresses',
        conditions: [
          { field: 'prompt', operator: 'regex', value: '\\b\\d+\\s+[A-Za-z0-9\\s,]+\\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl|Court|Ct)\\b' }
        ],
        action: 'redact',
        priority: 8
      },
      {
        id: 'route-medical',
        name: 'Route Medical Content',
        conditions: [
          { field: 'prompt', operator: 'contains', value: ['medical', 'diagnosis', 'health', 'treatment', 'doctor', 'patient'] }
        ],
        action: 'route',
        priority: 7,
        destination: 'medical_review_queue'
      },
      {
        id: 'escalate-financial',
        name: 'Escalate Financial Content',
        conditions: [
          { field: 'prompt', operator: 'contains', value: ['investment', 'trading', 'financial', 'money', 'bank', 'stocks', 'crypto'] }
        ],
        action: 'escalate',
        priority: 6,
        priority_level: 'high',
        reason: 'financial_risk'
      }
    ];
  }

  // Evaluate policies against input data
  async evaluate(input, context = {}) {
    const results = {
      allowed: true,
      actions: [],
      redactedContent: input.prompt || input,
      routeTo: null,
      escalated: false,
      escalation: null,
      appliedPolicies: [],
      rule_applied: null,
      error: null
    };

    // Sort policies by priority (highest first)
    const sortedPolicies = [...this.policies].sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      if (this.matchesConditions(input, context, policy.conditions)) {
        results.appliedPolicies.push(policy.id);

        switch (policy.action) {
          case 'block':
            results.allowed = false;
            results.error = policy.reason || 'Content blocked by policy';
            results.rule_applied = 'block';
            results.actions.push({
              type: 'block',
              policy: policy.id,
              reason: policy.name,
              rule_applied: 'block'
            });
            return results; // Block is terminal - stop processing other policies

          case 'redact':
            results.redactedContent = this.applyRedaction(results.redactedContent, policy.conditions);
            results.actions.push({
              type: 'redact',
              policy: policy.id,
              reason: policy.name
            });
            break;

          case 'route':
            results.routeTo = policy.destination || 'moderation';
            results.routing = {
              destination: results.routeTo,
              escalated: true
            };
            results.actions.push({
              type: 'route',
              policy: policy.id,
              destination: results.routeTo
            });
            break;

          case 'escalate':
            results.escalated = true;
            results.escalation = {
              priority: policy.priority_level || 'high',
              requires_human_review: true,
              review_reason: policy.reason || 'high_risk_content'
            };
            results.actions.push({
              type: 'escalate',
              policy: policy.id,
              reason: policy.name,
              priority: policy.priority_level || 'high'
            });
            break;
        }
      }
    }

    return results;
  }

  // Check if conditions match
  matchesConditions(input, context, conditions) {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(input, context, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  // Get value from input/context by field path
  getFieldValue(input, context, fieldPath) {
    const data = { ...input, ...context };
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], data);
  }

  // Evaluate individual condition
  evaluateCondition(value, operator, expected) {
    if (value === undefined || value === null) return false;

    switch (operator) {
      case 'equals':
        return value === expected;
      case 'contains':
        if (Array.isArray(expected)) {
          return expected.some(exp => String(value).toLowerCase().includes(String(exp).toLowerCase()));
        }
        return String(value).toLowerCase().includes(String(expected).toLowerCase());
      case 'regex':
        return new RegExp(expected, 'i').test(String(value));
      case 'gt':
        return Number(value) > Number(expected);
      case 'lt':
        return Number(value) < Number(expected);
      case 'gte':
        return Number(value) >= Number(expected);
      case 'lte':
        return Number(value) <= Number(expected);
      default:
        return false;
    }
  }

  // Apply redaction to content
  applyRedaction(content, conditions) {
    let redacted = content;

    for (const condition of conditions) {
      if (condition.operator === 'regex') {
        redacted = redacted.replace(new RegExp(condition.value, 'gi'), '[REDACTED]');
      }
    }

    return redacted;
  }

  // Add or update a policy
  addPolicy(policy) {
    // Validate policy structure
    if (!policy.id || !policy.conditions || !policy.action) {
      throw new Error('Invalid policy structure');
    }

    // Remove existing policy with same ID
    this.policies = this.policies.filter(p => p.id !== policy.id);

    // Add new policy
    this.policies.push({
      priority: 1,
      ...policy
    });
  }

  // Remove a policy
  removePolicy(policyId) {
    this.policies = this.policies.filter(p => p.id !== policyId);
  }

  // Get all policies
  getPolicies() {
    return [...this.policies];
  }
}

// Export singleton instance
export const policyEngine = new PolicyEngine();