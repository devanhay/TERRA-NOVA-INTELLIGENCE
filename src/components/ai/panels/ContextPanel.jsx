import React from 'react';

const ContextPanel = ({ emotionState, pipelineLog, masteryData }) => {
  
  // Calculate class labels for ML mastery levels
  const getMasteryColor = (score) => {
    if (score < 50) return '#f43f5e'; // Red
    if (score < 75) return '#f59e0b'; // Amber
    return 'var(--accent)'; // Emerald
  };

  const getMasteryText = (score) => {
    if (score < 50) return 'Weakness Detected';
    if (score < 75) return 'Proficient';
    return 'Mastery Optimized';
  };

  return (
    <div className="terra-insights-panel">
      {/* 1. EMOTIONAL FEEDBACK LOOPS */}
      <div className="insights-card">
        <h4 className="insights-label">AI Emotion & Empathy Loop</h4>
        
        <div className="insights-gauge-group">
          <div className="gauge-item">
            <span className="lbl">STRESS FEEDBACK</span>
            <div className="bar-container-nav">
              <div className="fill stress" style={{ width: `${emotionState?.stress || 30}%` }}></div>
            </div>
            <span className="val">{emotionState?.stress || 30}%</span>
          </div>

          <div className="gauge-item">
            <span className="lbl">CONFUSION RATIO</span>
            <div className="bar-container-nav">
              <div className="fill confusion" style={{ width: `${emotionState?.confusion || 20}%` }}></div>
            </div>
            <span className="val">{emotionState?.confusion || 20}%</span>
          </div>
        </div>

        <div className="empathy-badge-container">
          <span className="lbl">EMPATHIC TARGET Persona</span>
          <div className="badge">{emotionState?.empathyLevel || 'Supportive & Analytical'}</div>
        </div>
      </div>

      {/* 2. WEAKNESS DETECTION RADAR */}
      <div className="insights-card">
        <h4 className="insights-label">Neural Weakness Detection</h4>
        
        <div className="weakness-grid">
          {[
            { topic: 'Mass Balance', score: masteryData?.mass_balance || 45 },
            { topic: 'Thermodynamics', score: masteryData?.thermodynamics || 60 },
            { topic: 'Reaction Eng.', score: masteryData?.reaction || 70 },
            { topic: 'Plant Design', score: masteryData?.plant_design || 50 }
          ].map(m => (
            <div key={m.topic} className="weakness-row-item">
              <div className="meta-row">
                <span className="title">{m.topic}</span>
                <span className="status" style={{ color: getMasteryColor(m.score) }}>
                  {getMasteryText(m.score)}
                </span>
              </div>
              <div className="meter-wrapper">
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: `${m.score}%`, backgroundColor: getMasteryColor(m.score) }}></div>
                </div>
                <span className="percent">{m.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. COGNITIVE PIPELINE LOGS */}
      <div className="insights-card logic-trace-card">
        <h4 className="insights-label">Cognitive Logic Telemetry</h4>
        <div className="insights-terminal-container">
          <div className="insights-terminal-header">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="title">logic_cot_trace.log</span>
          </div>
          <div className="insights-terminal-body">
            {pipelineLog && pipelineLog.length > 0 ? (
              pipelineLog.map((log, i) => (
                <div key={i} className="log-line">
                  <span className="prefix">&gt;</span> {log}
                </div>
              ))
            ) : (
              <div className="log-line idle">
                <span className="prefix">&gt;</span> Listening for neural impulses...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
