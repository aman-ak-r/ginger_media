import React from 'react';
import { Activity, Check, AlertCircle, ShieldAlert } from 'lucide-react';

interface Job {
  jobId: string;
  fileName: string;
  fileSize: string;
  status: string;
  overallStatus: string;
  processingDurationMs: number | null;
  checks: any[];
}

interface QueueTableProps {
  jobs: Job[];
  onInspect: (jobId: string) => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({ jobs, onInspect }) => {
  return (
    <div className="glass-card queue-container">
      <div className="panel-header">
        <h2 className="panel-title">
          <Activity size={20} style={{ marginRight: '8px' }} /> Audit Log & Processing Queue
        </h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>File details</th>
              <th>Status</th>
              <th>Validation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="queue-body">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  No audited images in current session. Drag & drop or select an image to analyze.
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const displayId = job.jobId.startsWith('uploading-')
                  ? 'Uploading...'
                  : job.jobId.substring(0, 8) + '...';
                const isAuditable = job.status === 'completed' || job.status === 'failed';

                let valBadge = (
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                    TBD
                  </span>
                );
                if (job.overallStatus === 'clean') {
                  valBadge = (
                    <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
                      <Check size={12} style={{ marginRight: '4px' }} /> Clean
                    </span>
                  );
                } else if (job.overallStatus === 'warning') {
                  valBadge = (
                    <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                      <AlertCircle size={12} style={{ marginRight: '4px' }} /> Warning
                    </span>
                  );
                } else if (job.overallStatus === 'error') {
                  valBadge = (
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
                      <ShieldAlert size={12} style={{ marginRight: '4px' }} /> Failed
                    </span>
                  );
                }

                return (
                  <tr key={job.jobId}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{displayId}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{job.fileName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{job.fileSize || 'Processing...'}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${job.status}`}>{job.status}</span>
                    </td>
                    <td>{valBadge}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={() => onInspect(job.jobId)}
                        disabled={!isAuditable}
                        style={!isAuditable ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                      >
                        <Activity size={14} style={{ marginRight: '4px' }} /> Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
