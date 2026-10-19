import React from 'react';
import './TaglineSection.css';

const TaglineSection = ({ totalProducts, inventoryValue }) => {
  return (
    <div className="telemetry-banner">
      <div className="telemetry-header">
        <div className="telemetry-pill">
          <span className="live-indicator"></span>
          <span>SYSTEM ACTIVE</span>
        </div>
        <span className="telemetry-subtitle">NovaStock OS • v2.5 Enterprise</span>
      </div>

      <div className="telemetry-body">
        <h3 className="telemetry-title">
          Intelligent Catalog &amp; Real-time Stock Sync
        </h3>
        <p className="telemetry-desc">
          Automated inventory intelligence powered by FastAPI &amp; PostgreSQL. Seamlessly orchestrate product stock, monitor catalog velocity, and prevent stockouts with instant updates.
        </p>

        <div className="telemetry-features">
          <div className="feature-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Sub-ms REST API</span>
          </div>
          <div className="feature-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Live Stock Watcher</span>
          </div>
          <div className="feature-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>ACID Guaranteed</span>
          </div>
        </div>
      </div>

      <div className="telemetry-footer">
        <div className="stat-micro">
          <span className="stat-micro-label">Active SKUs</span>
          <span className="stat-micro-val">{totalProducts || 0} items</span>
        </div>
        <div className="stat-micro-divider"></div>
        <div className="stat-micro">
          <span className="stat-micro-label">Total Valuation</span>
          <span className="stat-micro-val">${Number(inventoryValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="stat-micro-divider"></div>
        <div className="platform-brand">
          <span className="brand-dot"></span>
          <span className="brand-text">NovaStock Core</span>
        </div>
      </div>
    </div>
  );
};

export default TaglineSection;
