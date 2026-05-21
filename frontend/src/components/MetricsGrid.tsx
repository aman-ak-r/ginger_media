import React from 'react';
import { Image, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

interface MetricsGridProps {
  totalAudited: number;
  cleanPassRate: number;
  alertsFlagged: number;
  avgSpeed: number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  totalAudited,
  cleanPassRate,
  alertsFlagged,
  avgSpeed,
}) => {
  return (
    <div className="metrics-grid">
      <div className="glass-card kpi-card">
        <div className="kpi-details">
          <h3>Total Audited</h3>
          <div>{totalAudited}</div>
        </div>
        <div className="kpi-icon kpi-blue">
          <Image size={24} />
        </div>
      </div>
      <div className="glass-card kpi-card">
        <div className="kpi-details">
          <h3>Clean Pass Rate</h3>
          <div>{cleanPassRate}%</div>
        </div>
        <div className="kpi-icon kpi-green">
          <CheckCircle size={24} />
        </div>
      </div>
      <div className="glass-card kpi-card">
        <div className="kpi-details">
          <h3>Alerts Flagged</h3>
          <div>{alertsFlagged}</div>
        </div>
        <div className="kpi-icon kpi-red">
          <AlertTriangle size={24} />
        </div>
      </div>
      <div className="glass-card kpi-card">
        <div className="kpi-details">
          <h3>Avg Processing Speed</h3>
          <div>{avgSpeed} ms</div>
        </div>
        <div className="kpi-icon kpi-purple">
          <Zap size={24} />
        </div>
      </div>
    </div>
  );
};
