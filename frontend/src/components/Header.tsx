import React from 'react';

export const Header: React.FC = () => {
  return (
    <header>
      <div className="logo-container">
        <div className="logo-icon">V</div>
        <div className="logo-text">
          <h1>Vehicle Media Auditor</h1>
          <p>Anti-Fraud & Quality Assurance Dashboard</p>
        </div>
      </div>
      <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="live-dot"></span>
        <span style={{ color: 'var(--text-muted)' }}>Queue Monitor Active</span>
      </div>
    </header>
  );
};
