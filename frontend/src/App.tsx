import React, { useState } from 'react';
import { Header } from './components/Header';
import { MetricsGrid } from './components/MetricsGrid';
import { UploadZone } from './components/UploadZone';
import { QueueTable } from './components/QueueTable';
import { DiagnosticsDrawer } from './components/DiagnosticsDrawer';

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

const API_URL = import.meta.env.VITE_API_URL || '';

export const App: React.FC = () => {
  const [sessionJobs, setSessionJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Handle uploading files to Express server API
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const temporaryId = 'uploading-' + Date.now();
    const mockJob: Job = {
      jobId: temporaryId,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + ' KB',
      status: 'pending',
      overallStatus: 'pending',
      processingDurationMs: null,
      checks: [],
    };

    setSessionJobs((prev) => [mockJob, ...prev]);

    try {
      const response = await fetch(`${API_URL}/api/uploads`, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 429) {
        const errData = await response.json();
        alert(`Rate Limit Warning: ${errData.message}`);
        setSessionJobs((prev) => prev.filter((j) => j.jobId !== temporaryId));
        return;
      }

      const data = await response.json();

      // Swap the temporary ID with the database job ID
      setSessionJobs((prev) =>
        prev.map((j) => (j.jobId === temporaryId ? { ...j, jobId: data.jobId } : j))
      );

      // Start interval polling for job status
      pollJob(data.jobId);
    } catch (err) {
      console.error('Upload Error:', err);
      setSessionJobs((prev) =>
        prev.map((j) =>
          j.jobId === temporaryId ? { ...j, status: 'failed', overallStatus: 'error' } : j
        )
      );
    }
  };

  // Status Polling handler
  const pollJob = (jobId: string) => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/uploads/${jobId}/status`);
        const statusData = await res.json();

        setSessionJobs((prev) => {
          const job = prev.find((j) => j.jobId === jobId);
          if (!job) {
            clearInterval(timer);
            return prev;
          }

          if (statusData.status === 'completed' || statusData.status === 'failed') {
            clearInterval(timer);
            // Fetch final detailed check parameters
            fetchResults(jobId);
          }

          return prev.map((j) => (j.jobId === jobId ? { ...j, status: statusData.status } : j));
        });
      } catch (err) {
        console.error('Polling Error:', err);
        clearInterval(timer);
      }
    }, 1000);
  };

  // Fetch final full analysis results
  const fetchResults = async (jobId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/uploads/${jobId}/results`);
      const resultData = await res.json();

      setSessionJobs((prev) =>
        prev.map((j) =>
          j.jobId === jobId
            ? {
                ...j,
                status: resultData.status,
                overallStatus: resultData.overallStatus,
                processingDurationMs: resultData.processingDurationMs,
                checks: resultData.checks,
                metadata: resultData.metadata,
              }
            : j
        )
      );
    } catch (err) {
      console.error('Results Fetch Error:', err);
    }
  };

  // Calculate live KPI parameters
  const finishedJobs = sessionJobs.filter((j) => j.status === 'completed' || j.status === 'failed');
  const totalAudited = finishedJobs.length;

  let cleanPassRate = 0;
  let alertsFlagged = 0;
  let avgSpeed = 0;

  if (totalAudited > 0) {
    const passes = finishedJobs.filter((j) => j.overallStatus === 'clean').length;
    const warnings = finishedJobs.filter((j) => j.overallStatus === 'warning').length;
    const fails = finishedJobs.filter((j) => j.overallStatus === 'error').length;
    const totalDuration = finishedJobs.reduce((acc, cur) => acc + (cur.processingDurationMs || 0), 0);

    cleanPassRate = Math.round((passes / totalAudited) * 100);
    alertsFlagged = warnings + fails;
    avgSpeed = Math.round(totalDuration / totalAudited);
  }

  return (
    <>
      <Header />
      <main>
        <MetricsGrid
          totalAudited={totalAudited}
          cleanPassRate={cleanPassRate}
          alertsFlagged={alertsFlagged}
          avgSpeed={avgSpeed}
        />
        <div className="dashboard-split">
          <UploadZone onUpload={handleUpload} />
          <QueueTable jobs={sessionJobs} onInspect={(id) => setSelectedJobId(id)} />
        </div>
      </main>

      <DiagnosticsDrawer
        job={sessionJobs.find((j) => j.jobId === selectedJobId) || null}
        onClose={() => setSelectedJobId(null)}
      />
    </>
  );
};
