import React from 'react';

interface CheckResult {
  check: string;
  status: string;
  confidence: number;
  detail: string;
}

interface Job {
  jobId: string;
  fileName: string;
  fileSize: string;
  status: string;
  overallStatus: string;
  processingDurationMs: number | null;
  checks: CheckResult[];
  metadata?: any;
}

interface DiagnosticsDrawerProps {
  job: Job | null;
  onClose: () => void;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({ job, onClose }) => {
  const isOpen = job !== null;

  return (
    <>
      <div className={`backdrop ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`drawer ${isOpen ? 'active' : ''}`}>
        <div className="drawer-header">
          <div className="diagnostics-title">Quality Audit Dials</div>
          <button className="close-drawer" onClick={onClose}>
            &times;
          </button>
        </div>
        <div id="drawer-body">
          {job && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  File Name
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, wordBreak: 'break-all', marginBottom: '12px' }}>
                  {job.fileName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  Performance Duration
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                  {job.processingDurationMs} ms
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  Core Validations
                </h3>
                {job.checks.map((c, index) => {
                  let color = 'var(--success)';
                  if (c.status === 'warning') color = 'var(--warning)';
                  if (c.status === 'failed') color = 'var(--error)';

                  const barWidth = Math.round((c.confidence || 0) * 100);

                  return (
                    <div className="diag-metric" key={index}>
                      <div className="diag-metric-title">
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {c.check.replace(/_/g, ' ')}
                        </span>
                        <span style={{ color, fontWeight: 600 }}>{barWidth}% Match</span>
                      </div>
                      <div className="progress-bar-bg" style={{ marginBottom: '8px' }}>
                        <div className="progress-bar-fill" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.detail}</p>
                    </div>
                  );
                })}
              </div>

              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  Exif & Image Parameters
                </h3>
                <pre className="diag-metadata">
                  {JSON.stringify(job.metadata || {}, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
