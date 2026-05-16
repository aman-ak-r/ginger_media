import { Sharp, Metadata } from 'sharp';
import { CheckResult } from './index.js';

export async function dimensionValidation(image: Sharp, metadata: Metadata): Promise<CheckResult> {
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  const minWidth = 640;
  const minHeight = 480;
  const maxWidth = 8000;
  const maxHeight = 8000;

  let status: 'passed' | 'failed' | 'warning' = 'passed';
  let details = [`Dimensions: ${width}x${height}`];

  if (width < minWidth || height < minHeight) {
    status = 'failed';
    details.push(`Below minimum requirement (${minWidth}x${minHeight})`);
  } else if (width > maxWidth || height > maxHeight) {
    status = 'failed';
    details.push(`Above maximum requirement (${maxWidth}x${maxHeight})`);
  }

  // Aspect ratio check (e.g., 1:10 is too extreme for a vehicle photo)
  const ratio = width / height;
  if (ratio > 5 || ratio < 0.2) {
    status = 'warning';
    details.push(`Suspicious aspect ratio: ${ratio.toFixed(2)}`);
  }

  return {
    check: 'dimension_validation',
    status,
    confidence: 1,
    detail: details.join('. '),
  };
}
