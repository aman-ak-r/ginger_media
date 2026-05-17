"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllChecks = runAllChecks;
const blurDetection_1 = require("./blurDetection");
const brightnessAnalysis_1 = require("./brightnessAnalysis");
const duplicateDetection_1 = require("./duplicateDetection");
const dimensionValidation_1 = require("./dimensionValidation");
const metadataAnalysis_1 = require("./metadataAnalysis");
const sharp_1 = __importDefault(require("sharp"));
async function runAllChecks(jobId, filePath) {
    const image = (0, sharp_1.default)(filePath);
    const metadata = await image.metadata();
    let phashValue;
    const checks = await Promise.all([
        (0, blurDetection_1.blurDetection)(image, metadata),
        (0, brightnessAnalysis_1.brightnessAnalysis)(image, metadata),
        (0, duplicateDetection_1.duplicateDetection)(jobId, image, metadata).then(res => {
            phashValue = res.phash;
            return res;
        }),
        (0, dimensionValidation_1.dimensionValidation)(image, metadata),
        (0, metadataAnalysis_1.metadataAnalysis)(filePath, metadata),
    ]);
    let issueCount = 0;
    let overallStatus = 'clean';
    for (const check of checks) {
        if (check.status === 'failed') {
            issueCount++;
            overallStatus = 'rejected';
        }
        else if (check.status === 'warning') {
            issueCount++;
            if (overallStatus !== 'rejected') {
                overallStatus = 'flagged';
            }
        }
    }
    // Final metadata aggregation
    const finalMetadata = {
        dimensions: { width: metadata.width, height: metadata.height },
        format: metadata.format,
        space: metadata.space,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
    };
    return {
        overallStatus,
        issueCount,
        checks,
        metadata: finalMetadata,
        phash: phashValue,
    }; // Cast as any for quick extension, but ideally define interface
}
//# sourceMappingURL=index.js.map