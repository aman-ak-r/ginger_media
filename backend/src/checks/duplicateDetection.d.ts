import { Sharp, Metadata } from 'sharp';
import { CheckResult } from './index';
export declare function duplicateDetection(jobId: string, image: Sharp, metadata: Metadata): Promise<CheckResult & {
    phash?: string;
}>;
//# sourceMappingURL=duplicateDetection.d.ts.map