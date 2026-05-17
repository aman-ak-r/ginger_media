"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateDetection = duplicateDetection;
const sharp_1 = require("sharp");
const index_1 = require("./index");
// @ts-ignore
const sharp_phash_1 = __importDefault(require("sharp-phash"));
const client_1 = __importDefault(require("../db/client"));
async function duplicateDetection(jobId, image, metadata) {
    try {
        const buffer = await image.clone().toBuffer();
        const hash = await (0, sharp_phash_1.default)(buffer);
        // Find potential duplicates in DB
        const others = await client_1.default.imageJob.findMany({
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
            if (!other.phash)
                continue;
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
    }
    catch (error) {
        return {
            check: 'duplicate_detection',
            status: 'warning',
            confidence: 0,
            detail: `Duplicate detection failed: ${error.message}`,
        };
    }
}
function hammingDistance(h1, h2) {
    let distance = 0;
    // sharp-phash usually returns a hex string or binary string? 
    // Let's assume it's a bit string for Hamming distance if we can, 
    // but if it's hex, we compare bits.
    // Actually, many phash libs return hex. Let's convert to binary.
    const b1 = BigInt(`0x${h1}`).toString(2).padStart(64, '0');
    const b2 = BigInt(`0x${h2}`).toString(2).padStart(64, '0');
    for (let i = 0; i < b1.length; i++) {
        if (b1[i] !== b2[i])
            distance++;
    }
    return distance;
}
//# sourceMappingURL=duplicateDetection.js.map