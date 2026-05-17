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
export declare function runAllChecks(jobId: string, filePath: string): Promise<AnalysisOutput>;
//# sourceMappingURL=index.d.ts.map