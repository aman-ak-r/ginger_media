import { Sharp, Metadata } from 'sharp';
import { CheckResult } from './index.js';

export async function blurDetection(image: Sharp, metadata: Metadata): Promise<CheckResult> {
  try {
    // Laplacian kernel for edge detection
    const laplacianKernel = {
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    };

    // Apply grayscale and Laplacian convolution
    const convolved = await image
      .clone()
      .grayscale()
      .convolve(laplacianKernel)
      .stats();

    // The variance (stdev^2) of the Laplacian image indicates sharpness.
    // Higher variance = more edges = sharper image.
    const stdev = convolved.channels[0].stdev;
    const variance = stdev * stdev;

    // Threshold: variance < 100 is typically considered blurry for 1080p images.
    // We can normalize this slightly or keep it as a heuristic.
    const threshold = 100;
    const status = variance < threshold ? 'failed' : 'passed';
    
    // Confidence score based on distance from threshold
    const confidence = Math.min(1, Math.max(0, variance / (threshold * 2)));

    return {
      check: 'blur_detection',
      status,
      confidence,
      detail: status === 'failed' 
        ? `Image appears blurry. Sharpness score: ${variance.toFixed(2)} (threshold: ${threshold})`
        : `Image is sharp. Sharpness score: ${variance.toFixed(2)}`,
    };
  } catch (error: any) {
    return {
      check: 'blur_detection',
      status: 'warning',
      confidence: 0,
      detail: `Blur detection failed: ${error.message}`,
    };
  }
}
