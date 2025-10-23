"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBlockHash = generateBlockHash;
exports.calculateCRIESMetrics = calculateCRIESMetrics;
const crypto_1 = require("crypto");
function generateBlockHash(blockData) {
    const blockString = JSON.stringify({
        previousHash: blockData.previousHash,
        records: blockData.records.map(r => ({
            id: r.id,
            action: r.action,
            category: r.category,
            userId: r.userId,
            lamport: r.lamport,
            createdAt: r.createdAt,
            hashPointer: r.hashPointer
        })),
        timestamp: blockData.timestamp,
        lamportClock: blockData.lamportClock
    });
    return (0, crypto_1.createHash)('sha256').update(blockString).digest('hex');
}
function calculateCRIESMetrics(records) {
    // Calculate Consistency Score (0-1)
    const consistency = calculateConsistencyScore(records);
    // Calculate Reproducibility Score (0-1)
    const reproducibility = calculateReproducibilityScore(records);
    // Calculate Integrity Score (0-1)
    const integrity = calculateIntegrityScore(records);
    // Calculate Explainability Score (0-1)
    const explainability = calculateExplainabilityScore(records);
    // Calculate Security Score (0-1)
    const security = calculateSecurityScore(records);
    return {
        consistency,
        reproducibility,
        integrity,
        explainability,
        security,
        timestamp: new Date(),
        recordsAnalyzed: records.length
    };
}
function calculateConsistencyScore(records) {
    // Check lamport clock consistency
    let lamportViolations = 0;
    for (let i = 1; i < records.length; i++) {
        if (records[i].lamport <= records[i - 1].lamport) {
            lamportViolations++;
        }
    }
    // Check timestamp consistency
    let timeViolations = 0;
    for (let i = 1; i < records.length; i++) {
        if (records[i].createdAt <= records[i - 1].createdAt) {
            timeViolations++;
        }
    }
    const lamportScore = 1 - (lamportViolations / records.length);
    const timeScore = 1 - (timeViolations / records.length);
    return (lamportScore + timeScore) / 2;
}
function calculateReproducibilityScore(records) {
    // Check if all records have proper metadata
    let validMetadataCount = 0;
    for (const record of records) {
        const hasValidMetadata = record.metadata &&
            typeof record.metadata === 'object' &&
            Object.keys(record.metadata).length > 0;
        if (hasValidMetadata) {
            validMetadataCount++;
        }
    }
    return validMetadataCount / records.length;
}
function calculateIntegrityScore(records) {
    // Check hash pointer integrity
    let validHashPointers = 0;
    for (let i = 1; i < records.length; i++) {
        const cur = records[i].hashPointer;
        const prev = records[i - 1].hashPointer;
        if (typeof cur === 'string' && typeof prev === 'string' && cur.length === 64) {
            validHashPointers++;
        }
    }
    return validHashPointers / (records.length - 1);
}
function calculateExplainabilityScore(records) {
    // Check if records have proper details and categorization
    let explainableRecords = 0;
    for (const record of records) {
        const hasValidDetails = record.details &&
            typeof record.details === 'object' &&
            Object.keys(record.details).length > 0;
        const hasCategory = record.category !== undefined;
        const hasAction = record.action && record.action.length > 0;
        if (hasValidDetails && hasCategory && hasAction) {
            explainableRecords++;
        }
    }
    return explainableRecords / records.length;
}
function calculateSecurityScore(records) {
    // Check for proper user attribution and event categorization
    let secureRecords = 0;
    for (const record of records) {
        const hasUser = record.userId !== undefined && record.user !== undefined;
        const hasProperCategory = record.category !== undefined;
        const hasStatus = record.status !== undefined;
        if (hasUser && hasProperCategory && hasStatus) {
            secureRecords++;
        }
    }
    return secureRecords / records.length;
}
