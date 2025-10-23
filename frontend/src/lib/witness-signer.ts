/**
 * Witness Signature Service
 * 
 * Manages cryptographic witness signatures from LLM models.
 * Witnesses attest to the validity of receipts, computations, and state changes.
 * 
 * Key Concepts:
 * - Model Fingerprint: Unique identifier for LLM model (${MODEL_NAME}, ${FP_GPT5})
 * - Witness Signature: Cryptographic attestation from model
 * - Multi-model Consensus: Multiple witnesses for critical operations
 * - Witness Rotation: Periodic rotation of witness models
 */

import { PrismaClient } from '@/generated/prisma';
import { incrementLamportCounter } from './lamport-counter';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface WitnessRequest {
  receiptDigest: string;
  modelName: string;
  userId?: number;
  data?: Record<string, any>;
}

export interface WitnessSignatureResult {
  id: number;
  modelName: string;
  modelFingerprint: string;
  signature: string;
  lamportClock: number;
  verified: boolean;
}

/**
 * Generate model fingerprint
 * In production, this would query the actual model for its fingerprint
 */
export function generateModelFingerprint(modelName: string): string {
  // Mock fingerprint for now - in production, call LLM API
  const timestamp = Date.now();
  const data = `${modelName}:${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Generate witness signature
 * In production, this would call the LLM to generate attestation
 */
function generateWitnessSignature(
  modelName: string,
  modelFingerprint: string,
  receiptDigest: string,
  lamportClock: number
): string {
  // Mock signature - in production, call LLM witness API
  const signatureData = {
    model: modelName,
    fingerprint: modelFingerprint,
    digest: receiptDigest,
    lamport: lamportClock,
    timestamp: new Date().toISOString(),
  };

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(signatureData))
    .digest('hex');
}

/**
 * Request witness signature for receipt
 */
export async function requestWitnessSignature(
  request: WitnessRequest
): Promise<WitnessSignatureResult> {
  const lamportIncrement = await incrementLamportCounter();
  const lamportClock = lamportIncrement.newValue;

  const modelFingerprint = generateModelFingerprint(request.modelName);
  const signature = generateWitnessSignature(
    request.modelName,
    modelFingerprint,
    request.receiptDigest,
    lamportClock
  );

  const witness = await prisma.witnessSignature.create({
    data: {
      modelName: request.modelName,
      modelFingerprint,
      receiptDigest: request.receiptDigest,
      signature,
      lamportClock,
      verified: false, // Will be verified separately
      metadata: request.data || {},
    },
  });

  return {
    id: witness.id,
    modelName: witness.modelName,
    modelFingerprint: witness.modelFingerprint,
    signature: witness.signature,
    lamportClock: witness.lamportClock,
    verified: witness.verified,
  };
}

/**
 * Verify witness signature
 * Checks that signature matches expected value
 */
export async function verifyWitnessSignature(
  witnessId: number
): Promise<{ valid: boolean; message: string }> {
  const witness = await prisma.witnessSignature.findUnique({
    where: { id: witnessId },
  });

  if (!witness) {
    return {
      valid: false,
      message: `Witness signature ${witnessId} not found`,
    };
  }

  // Recompute signature
  const expectedSignature = generateWitnessSignature(
    witness.modelName,
    witness.modelFingerprint,
    witness.receiptDigest,
    witness.lamportClock
  );

  const valid = expectedSignature === witness.signature;

  if (valid) {
    // Mark as verified
    await prisma.witnessSignature.update({
      where: { id: witnessId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });
  }

  return {
    valid,
    message: valid
      ? 'Witness signature verified'
      : 'Witness signature mismatch',
  };
}

/**
 * Get witnesses for receipt digest
 */
export async function getWitnessesForReceipt(
  receiptDigest: string
): Promise<WitnessSignatureResult[]> {
  const witnesses = await prisma.witnessSignature.findMany({
    where: { receiptDigest },
    orderBy: { signedAt: 'asc' },
  });

  return witnesses.map((w) => ({
    id: w.id,
    modelName: w.modelName,
    modelFingerprint: w.modelFingerprint,
    signature: w.signature,
    lamportClock: w.lamportClock,
    verified: w.verified,
  }));
}

/**
 * Request multi-model consensus
 * Gets signatures from multiple models for critical operations
 */
export async function requestMultiModelConsensus(
  receiptDigest: string,
  models: string[]
): Promise<{
  receiptDigest: string;
  witnesses: WitnessSignatureResult[];
  consensusReached: boolean;
  agreementRate: number;
}> {
  const witnesses: WitnessSignatureResult[] = [];

  for (const modelName of models) {
    const witness = await requestWitnessSignature({
      receiptDigest,
      modelName,
    });
    witnesses.push(witness);
  }

  // Verify all witnesses
  const verifications = await Promise.all(
    witnesses.map((w) => verifyWitnessSignature(w.id))
  );

  const validCount = verifications.filter((v) => v.valid).length;
  const agreementRate = validCount / witnesses.length;
  const consensusReached = agreementRate >= 0.67; // 2/3 majority

  return {
    receiptDigest,
    witnesses,
    consensusReached,
    agreementRate: Math.round(agreementRate * 100) / 100,
  };
}

/**
 * Get witness statistics
 */
export async function getWitnessStats(): Promise<{
  totalWitnesses: number;
  verifiedWitnesses: number;
  modelBreakdown: Record<string, number>;
  verificationRate: number;
}> {
  const witnesses = await prisma.witnessSignature.findMany();

  const totalWitnesses = witnesses.length;
  const verifiedWitnesses = witnesses.filter((w) => w.verified).length;

  const modelBreakdown: Record<string, number> = {};
  for (const witness of witnesses) {
    modelBreakdown[witness.modelName] = (modelBreakdown[witness.modelName] || 0) + 1;
  }

  const verificationRate =
    totalWitnesses > 0 ? verifiedWitnesses / totalWitnesses : 0;

  return {
    totalWitnesses,
    verifiedWitnesses,
    modelBreakdown,
    verificationRate: Math.round(verificationRate * 100) / 100,
  };
}

/**
 * Rotate witness models
 * Periodically changes the witness model to prevent bias
 */
export async function rotateWitnessModel(
  currentModel: string,
  newModel: string
): Promise<{
  previousModel: string;
  newModel: string;
  rotatedAt: Date;
}> {
  // In production, this would:
  // 1. Disable old model
  // 2. Enable new model
  // 3. Log rotation event
  // 4. Emit Δ-APPEND receipt for rotation

  const rotatedAt = new Date();

  // Log rotation (in production, emit receipt)
  console.log(`Witness model rotated: ${currentModel} → ${newModel}`);

  return {
    previousModel: currentModel,
    newModel,
    rotatedAt,
  };
}

/**
 * Get witness accountability log
 * Returns all witnesses grouped by model
 */
export async function getWitnessAccountabilityLog(): Promise<
  Record<
    string,
    {
      totalSignatures: number;
      verifiedSignatures: number;
      failedSignatures: number;
      lastSignedAt: Date | null;
    }
  >
> {
  const witnesses = await prisma.witnessSignature.findMany({
    orderBy: { signedAt: 'desc' },
  });

  const log: Record<string, any> = {};

  for (const witness of witnesses) {
    if (!log[witness.modelName]) {
      log[witness.modelName] = {
        totalSignatures: 0,
        verifiedSignatures: 0,
        failedSignatures: 0,
        lastSignedAt: null,
      };
    }

    log[witness.modelName].totalSignatures++;
    if (witness.verified) {
      log[witness.modelName].verifiedSignatures++;
    } else {
      log[witness.modelName].failedSignatures++;
    }

    if (
      !log[witness.modelName].lastSignedAt ||
      witness.signedAt > log[witness.modelName].lastSignedAt
    ) {
      log[witness.modelName].lastSignedAt = witness.signedAt;
    }
  }

  return log;
}

/**
 * Witness model registry
 * Common LLM models used as witnesses
 */
export const WITNESS_MODELS = {
  GPT5: '${FP_GPT5}',
  GPT4: '${FP_GPT4}',
  CLAUDE: '${FP_CLAUDE}',
  GEMINI: '${FP_GEMINI}',
  LLAMA: '${FP_LLAMA}',
} as const;

/**
 * Get recommended witness models for operation type
 */
export function getRecommendedWitnesses(operationType: string): string[] {
  const recommendations: Record<string, string[]> = {
    BOOT_CONFIRM: [WITNESS_MODELS.GPT5, WITNESS_MODELS.CLAUDE],
    ANALYSIS: [WITNESS_MODELS.GPT5],
    DIRECTIVE: [WITNESS_MODELS.GPT5, WITNESS_MODELS.CLAUDE, WITNESS_MODELS.GEMINI],
    RESULT: [WITNESS_MODELS.GPT5],
    APPEND: [WITNESS_MODELS.GPT5],
    SYNC_POINT: [WITNESS_MODELS.GPT5, WITNESS_MODELS.CLAUDE],
  };

  return recommendations[operationType] || [WITNESS_MODELS.GPT5];
}
