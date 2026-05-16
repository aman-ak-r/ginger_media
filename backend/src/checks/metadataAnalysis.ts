import ExifReader from 'exifreader';
import { Metadata } from 'sharp';
import { CheckResult } from './index.js';
import fs from 'fs';

export async function metadataAnalysis(filePath: string, sharpMetadata: Metadata): Promise<CheckResult> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const tags = ExifReader.load(fileBuffer);

    const make = tags['Make']?.description;
    const model = tags['Model']?.description;
    const software = tags['Software']?.description;
    const dateTimeOriginal = tags['DateTimeOriginal']?.description;
    const gps = tags['GPSLatitude'] ? 'Present' : 'Missing';

    const issues: string[] = [];
    let status: 'passed' | 'failed' | 'warning' = 'passed';

    if (software && /photoshop|gimp|edit|capture/i.test(software)) {
      status = 'warning';
      issues.push(`Edited with ${software}`);
    }

    if (!dateTimeOriginal) {
      // Not necessarily an issue, but common in screenshots
      issues.push('Missing original capture timestamp (possible screenshot)');
    } else {
      const captureDate = new Date(dateTimeOriginal.replace(/:/g, '-').replace(' ', 'T'));
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      if (captureDate > now) {
        status = 'warning';
        issues.push('Capture timestamp is in the future');
      } else if (captureDate < oneYearAgo) {
        status = 'warning';
        issues.push('Image is more than 1 year old');
      }
    }

    return {
      check: 'metadata_analysis',
      status,
      confidence: 0.9,
      detail: issues.length > 0 
        ? issues.join('. ')
        : `Camera: ${make || 'Unknown'} ${model || ''}. Metadata appears consistent.`,
    };
  } catch (error: any) {
    return {
      check: 'metadata_analysis',
      status: 'warning',
      confidence: 0,
      detail: `EXIF parsing failed: ${error.message}. Possibly missing EXIF data.`,
    };
  }
}
