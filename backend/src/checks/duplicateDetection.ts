import { Sharp, Metadata } from 'sharp';
import { CheckResult } from './index.js';
// @ts-ignore
import phash from 'sharp-phash';
import prisma from '../db/client.js';

export async function duplicateDetection(jobId: string, image: Sharp, metadata: Metadata): Promise<CheckResult & { phash?: string }> {
  try {
    const buffer = await image.clone().toBuffer();
    const phashFunc = (phash as any).default || phash;
    const hash = await phashFunc(buffer);

    // Find potential duplicates in DB
    const others = await prisma.imageJob.findMany({
      where: {
        id: { not: jobId },
        status: 'completed',
        phash: { not: null },
      },
      select: { id: true, phash: true },
    });

    let bestMatchJobId = null;
    let maxSimilarity = 0;

    for (const other of others) {
      if (!other.phash) continue;
      const distance = hammingDistance(hash, other.phash);
      const similarity = 1 - (distance / 64); // Assuming 64-bit hash
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatchJobId = other.id;
      }
    }

    const threshold = 0.95; // 95% similarity
    const status = maxSimilarity > threshold ? 'warning' : 'passed';

    return {
      check: 'duplicate_detection',
      status,
      confidence: maxSimilarity,
      detail: status === 'warning'
        ? `Possible duplicate of jobId: ${bestMatchJobId} (similarity: ${(maxSimilarity * 100).toFixed(1)}%)`
        : `No duplicates detected. Highest similarity: ${(maxSimilarity * 100).toFixed(1)}%`,
      phash: hash,
    };
  } catch (error: any) {
    return {
      check: 'duplicate_detection',
      status: 'warning',
      confidence: 0,
      detail: `Duplicate detection failed: ${error.message}`,
    };
  }
}

function hammingDistance(h1: string, h2: string): number {
  let distance = 0;
  // sharp-phash usually returns a hex string or binary string? 
  // Let's assume it's a bit string for Hamming distance if we can, 
  // but if it's hex, we compare bits.
  // Actually, many phash libs return hex. Let's convert to binary.
  const b1 = BigInt(`0x${h1}`).toString(2).padStart(64, '0');
  const b2 = BigInt(`0x${h2}`).toString(2).padStart(64, '0');

  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) distance++;
  }
  return distance;
}
