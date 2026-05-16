import { blurDetection } from './blurDetection.js';
import { brightnessAnalysis } from './brightnessAnalysis.js';
import { duplicateDetection } from './duplicateDetection.js';
import { dimensionValidation } from './dimensionValidation.js';
import { metadataAnalysis } from './metadataAnalysis.js';
import sharp from 'sharp';

export interface CheckResult {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  confidence: number;
  detail: string;
}

export interface AnalysisOutput {
  overallStatus: 'clean' | 'flagged' | 'rejected';
  issueCount: number;
  checks: CheckResult[];
  metadata: any;
}

export async function runAllChecks(jobId: string, filePath: string): Promise<AnalysisOutput> {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  let phashValue: string | undefined;

  const checks: CheckResult[] = await Promise.all([
    blurDetection(image, metadata),
    brightnessAnalysis(image, metadata),
    duplicateDetection(jobId, image, metadata).then(res => {
      phashValue = res.phash;
      return res;
    }),
    dimensionValidation(image, metadata),
    metadataAnalysis(filePath, metadata),
  ]);

  let issueCount = 0;
  let overallStatus: 'clean' | 'flagged' | 'rejected' = 'clean';

  for (const check of checks) {
    if (check.status === 'failed') {
      issueCount++;
      overallStatus = 'rejected';
    } else if (check.status === 'warning') {
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
  } as any; // Cast as any for quick extension, but ideally define interface
}
