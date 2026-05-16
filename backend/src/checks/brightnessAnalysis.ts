import { Sharp, Metadata } from 'sharp';
import { CheckResult } from './index.js';

export async function brightnessAnalysis(image: Sharp, metadata: Metadata): Promise<CheckResult> {
  try {
    const stats = await image.clone().grayscale().stats();
    const mean = stats.channels[0].mean;

    let status: 'passed' | 'failed' | 'warning' = 'passed';
    let detail = `Brightness level: ${mean.toFixed(2)}/255`;
    let confidence = 1;

    if (mean < 50) {
      status = 'warning';
      detail = `Image is underexposed. Mean brightness: ${mean.toFixed(2)}/255`;
      confidence = Math.max(0, mean / 50);
    } else if (mean > 220) {
      status = 'warning';
      detail = `Image is overexposed. Mean brightness: ${mean.toFixed(2)}/255`;
      confidence = Math.max(0, (255 - mean) / 35);
    }

    return {
      check: 'brightness_analysis',
      status,
      confidence,
      detail,
    };
  } catch (error: any) {
    return {
      check: 'brightness_analysis',
      status: 'warning',
      confidence: 0,
      detail: `Brightness analysis failed: ${error.message}`,
    };
  }
}
