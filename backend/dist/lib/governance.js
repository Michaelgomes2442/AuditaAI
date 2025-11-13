import { createHash } from 'crypto';
export function generateBlockHash(blockData) {
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
    return createHash('sha256').update(blockString).digest('hex');
}
export function calculateFORGEMetrics(records) {
    // Aggregate FORGE pillars from individual receipts/records.
    // For each record, prefer `record.forge` (FORGE-native), then legacy mappings.
    if (!records || records.length === 0) {
        return { F: 0, O: 0, R: 0, G: 0, E: 0, overall: 0, timestamp: new Date(), recordsAnalyzed: 0 };
    }

    const totals = { F: 0, O: 0, R: 0, G: 0, E: 0 };
    let count = 0;

    for (const r of records) {
        const f = r.forge || r.forgeMetrics || r.cries || {};
        // Support several legacy shapes
        const F = Number(f.F ?? f.S ?? f.coherence ?? 0) || 0;
        const R = Number(f.R ?? f.reproducibility ?? 0) || 0;
        const G = Number(f.G ?? f.I ?? f.integrity ?? 0) || 0;
        const E = Number(f.E ?? f.E ?? f.effectiveness ?? 0) || 0;
        const O = Number(f.O ?? f.overall ?? f.C ?? 0) || 0;

        totals.F += F;
        totals.R += R;
        totals.G += G;
        totals.E += E;
        totals.O += O;
        count++;
    }

    const avg = {
        F: Number((totals.F / count).toFixed(4)),
        R: Number((totals.R / count).toFixed(4)),
        G: Number((totals.G / count).toFixed(4)),
        E: Number((totals.E / count).toFixed(4)),
        O: Number((totals.O / count).toFixed(4))
    };
    avg.overall = Number(((avg.F + avg.R + avg.G + avg.E + avg.O) / 5).toFixed(4));

    return {
        ...avg,
        timestamp: new Date(),
        recordsAnalyzed: count
    };
}
function calculateConsistencyScore(records) {
    if (records.length <= 1)
        return 1;
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
    const lamportScore = 1 - (lamportViolations / (records.length - 1));
    const timeScore = 1 - (timeViolations / (records.length - 1));
    return (lamportScore + timeScore) / 2;
}
function calculateReproducibilityScore(records) {
    if (records.length === 0)
        return 1;
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
    if (records.length <= 1)
        return 1;
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
    if (records.length === 0)
        return 1;
    // Check if records have proper details and categorization
    let explainableRecords = 0;
    for (const record of records) {
        const hasValidDetails = record.details &&
            typeof record.details === 'object' &&
            Object.keys(record.details).length > 0;
        const hasCategory = record.category !== undefined && record.category.length > 0;
        const hasAction = record.action && record.action.length > 0;
        if (hasValidDetails && hasCategory && hasAction) {
            explainableRecords++;
        }
    }
    return explainableRecords / records.length;
}
function calculateSecurityScore(records) {
    if (records.length === 0)
        return 1;
    // Check for proper user attribution and event categorization
    let secureRecords = 0;
    for (const record of records) {
        const hasUser = record.userId !== undefined;
        const hasProperCategory = record.category !== undefined && record.category.length > 0;
        const hasStatus = record.status !== undefined && record.status.length > 0;
        if (hasUser && hasProperCategory && hasStatus) {
            secureRecords++;
        }
    }
    return secureRecords / records.length;
}
