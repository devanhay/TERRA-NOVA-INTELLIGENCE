import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Layers, 
  Zap, 
  Terminal, 
  Gauge, 
  Compass, 
  Play, 
  TrendingUp, 
  RefreshCw, 
  BookOpen, 
  RotateCw,
  Flame
} from 'lucide-react';

const LOG_MESSAGES = [
  { text: 'PR-EOS thermodynamic database loaded successfully', type: 'info' },
  { text: 'Iterating McCabe-Thiele stage stepping solver...', type: 'sys' },
  { text: 'Stage calculations converged at Rmin = 0.959', type: 'ok' },
  { text: 'Mass balance check for Ethanol Column: Error = 0.0000%', type: 'ok' },
  { text: 'Enthalpy solver initialized using NRTL parameters', type: 'info' },
  { text: 'Arrhenius kinetic integration completed for Reactor R-101', type: 'ok' },
  { text: 'Liquid-Liquid equilibrium stability test passed', type: 'ok' },
  { text: 'Vapor flow in column C-101 approaching 82% flooding limit', type: 'warn' },
  { text: 'Sensible heat transfer rate: 1.42 MW balanced', type: 'info' },
  { text: 'Vapor-Liquid Equilibrium data points compiled (104 stages)', type: 'sys' },
  { text: 'Matrix solver: Jacobian compiled in 4.2ms', type: 'ok' },
  { text: 'Newton-Raphson simulation engine converged in 8 iterations', type: 'ok' },
  { text: 'Optimizing feed preheat temperature: Topt = 78.4 °C', type: 'info' },
  { text: 'Reflux ratio warning: R = 3.00 is below absolute Rmin', type: 'warn' }
];

export default function Dashboard({ setActive, projectsList, currentProjectId }) {
  const [telemetry, setTelemetry] = useState({
    cpu: 18,
    solveRate: 99.4,
    convergence: 100,
    iterCount: 8,
    activeEquations: 124
  });

  const [logs, setLogs] = useState([
    { text: 'Terra Nova OS initialized.', type: 'sys', time: '13:15:08' },
    { text: 'Peng-Robinson EOS solver online.', type: 'info', time: '13:15:09' },
    { text: 'No critical failures detected.', type: 'ok', time: '13:15:09' }
  ]);

  const logEndRef = useRef(null);
  const canvasRef = useRef(null);

  // Telemetry fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const targetCpu = Math.floor(10 + Math.random() * 25);
        const targetRate = parseFloat((98.5 + Math.random() * 1.5).toFixed(2));
        const targetIter = Math.random() > 0.8 ? Math.floor(6 + Math.random() * 5) : prev.iterCount;
        return {
          ...prev,
          cpu: targetCpu,
          solveRate: targetRate,
          iterCount: targetIter,
          activeEquations: 120 + Math.floor(Math.random() * 10)
        };
      });

      // Stream logs
      const randLog = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setLogs(prevLogs => {
        const next = [...prevLogs, { ...randLog, time: timeStr }];
        return next.slice(-25); // Limit logs shown
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Particle network simulation for pipeline/reactor network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = [];
    const count = 28;
    const atomTypes = [
      { symbol: 'C', r: 7, color: '#b5179e', labelColor: '#ffffff' }, // Carbon (Cosmic Pink)
      { symbol: 'O', r: 9, color: '#ff0054', labelColor: '#ffffff' }, // Oxygen (Atomic Red)
      { symbol: 'H', r: 5, color: '#4cc9f0', labelColor: '#000000' }, // Hydrogen (Teal/Cyan)
      { symbol: 'N', r: 8, color: '#7209b7', labelColor: '#ffffff' }  // Nitrogen (Deep space Indigo)
    ];

    for (let i = 0; i < count; i++) {
      const type = atomTypes[Math.floor(Math.random() * atomTypes.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        symbol: type.symbol,
        r: type.r,
        color: type.color,
        labelColor: type.labelColor,
        bondType: Math.random() > 0.65 ? 'double' : 'single'
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const isFlat = document.body.classList.contains('theme-flat');
      const isReduced = document.body.classList.contains('motion-reduced');
      
      if (isFlat) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Draw Grid mesh back
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Molecular bond lines calculations
      particles.forEach((p, idx) => {
        if (!isReduced) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }

        // Draw connections (covalent molecular bonds)
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            const alpha = (1 - dist / 110) * 0.16;
            ctx.strokeStyle = `rgba(76, 201, 240, ${alpha})`;
            
            if (p.bondType === 'double' && p2.bondType === 'double') {
              // Draw Double Covalent Bond
              ctx.lineWidth = 2.5;
              ctx.moveTo(p.x - 2, p.y - 2);
              ctx.lineTo(p2.x - 2, p2.y - 2);
              ctx.stroke();
              
              ctx.beginPath();
              ctx.moveTo(p.x + 2, p.y + 2);
              ctx.lineTo(p2.x + 2, p2.y + 2);
              ctx.stroke();
            } else {
              // Draw Single Bond
              ctx.lineWidth = 1;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      });

      // Draw atoms
      particles.forEach((p) => {
        // Outer Glow Ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(76, 201, 240, 0.05)`;
        ctx.fill();

        // Atom Body
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Atom symbol letter overlay
        ctx.font = `bold ${p.r}px monospace`;
        ctx.fillStyle = p.labelColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, p.x, p.y);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const currentProjectName = projectsList?.find(p => p.id === currentProjectId)?.name || 'Ethanol Separation Plant';

  const dashboardModules = [
    { id: 'pfd', label: 'PFD Builder', desc: 'Interactive process flow diagram designer with solver connectivity.', icon: <Layers className="icon-emerald" />, group: 'SYSTEM', status: 'STABLE' },
    { id: 'hub', label: 'Calculator Hub', desc: 'Comprehensive multidisciplinary converters & kinetic tools.', icon: <Gauge className="icon-blue" />, group: 'SYSTEM', status: 'STABLE' },
    { id: 'distill', label: 'Distillation Design', desc: 'Shortcut design parameters via Fenske-Underwood-Gilliland.', icon: <Flame className="icon-amber" />, group: 'CHEMENG', status: 'STABLE' },
    { id: 'ai', label: 'AI Companion', desc: 'Solve chemical kinetics and thermodynamics with neural intelligence.', icon: <Compass className="icon-emerald" />, group: 'AI', status: 'ONLINE' }
  ];

  return (
    <div className="dashboard-glass-layout">
      {/* Mesh Canvas Background Layer */}
      <div className="dashboard-mesh-container">
        <canvas ref={canvasRef} className="dashboard-mesh-canvas" />
        <div className="hero-radial" />
      </div>

      {/* Hero Welcome banner */}
      <div className="hero-glass-panel">
        <div className="hero-cyber-lines">
          <span className="cyber-line-horizontal" />
          <span className="cyber-line-vertical" />
        </div>
        <div className="hero-header-section">
          <div className="hero-eyebrow">
            <span className="eyebrow-glowing-dot" />
            TERRA NOVA SIMULATION NETWORK · CONSOLE HUB
          </div>
          <h1 className="hero-title">
            Engineering Cockpit <br />
            <span className="gradient-text">for EngineerOS</span>
          </h1>
          <p className="hero-subtitle">
            Dynamic workspace designed for process thermodynamics, reactor kinetics, and automated plant engineering simulations.
          </p>
        </div>

        {/* Telemetry quick overview dials */}
        <div className="telemetry-grid">
          <div className="telemetry-card">
            <div className="tel-label">SOLVER REACTION TIME</div>
            <div className="tel-val">4.2 <span className="tel-unit">ms</span></div>
            <div className="tel-progress-track">
              <div className="tel-progress-bar" style={{ width: '85%' }} />
            </div>
          </div>
          <div className="telemetry-card">
            <div className="tel-label">SIMULATION CONVERGENCE</div>
            <div className="tel-val">{telemetry.solveRate}%</div>
            <div className="tel-progress-track">
              <div className="tel-progress-bar bar-blue" style={{ width: `${telemetry.solveRate}%` }} />
            </div>
          </div>
          <div className="telemetry-card">
            <div className="tel-label">NUMERICAL JACOBIANS</div>
            <div className="tel-val">{telemetry.activeEquations} <span className="tel-unit">EQs</span></div>
            <div className="tel-progress-track">
              <div className="tel-progress-bar bar-purple" style={{ width: '70%' }} />
            </div>
          </div>
          <div className="telemetry-card text-emerald">
            <div className="tel-label">KERNEL SOLVER LOAD</div>
            <div className="tel-val">{telemetry.cpu}%</div>
            <div className="tel-progress-track">
              <div className="tel-progress-bar bar-emerald" style={{ width: `${telemetry.cpu}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="dashboard-content-grid">
        {/* Left Side: Module Cards */}
        <div className="modules-panel">
          <div className="section-header">
            <div className="section-label">◉ PROCESS DESIGN MODULES</div>
            <div className="section-divider" />
          </div>
          <div className="modules-cards-list">
            {dashboardModules.map(mod => (
              <div 
                key={mod.id} 
                className="glass-module-card" 
                onClick={() => setActive(mod.id)}
              >
                <div className="card-glare" />
                <div className="module-icon-wrap">{mod.icon}</div>
                <div className="module-info">
                  <div className="module-title-row">
                    <span className="module-name">{mod.label}</span>
                    <span className={`module-status-tag ${mod.status === 'ONLINE' ? 'tag-online' : mod.status === 'BETA' ? 'tag-beta' : ''}`}>
                      {mod.status}
                    </span>
                  </div>
                  <p className="module-description">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Right Side: Active Project Telemetry & Real-Time Interactive VLE Phase Envelope Simulator */}
        <div className="diagnostics-panel">
          {/* Active project panel */}
          <div className="glass-inner-card project-overview-card">
            <div className="panel-header">
              <div className="panel-title">
                <span className="pulse-green-dot" />
                ACTIVE ENGINE FLOWSHEET
              </div>
              <button className="btn-tiny" onClick={() => setActive('pfd')}>
                OPEN FLOWSHEET
              </button>
            </div>
            <div className="project-detail-body">
              <div className="project-title-name">{currentProjectName}</div>
              <div className="project-stats-grid">
                <div className="stat-box">
                  <div className="stat-lbl">Thermodynamics</div>
                  <div className="stat-num text-amber">NRTL</div>
                </div>
                <div className="stat-box">
                  <div className="stat-lbl">Convergence Iterations</div>
                  <div className="stat-num text-emerald">{telemetry.iterCount}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-lbl">Solve Status</div>
                  <div className="stat-num text-blue">STABLE</div>
                </div>
              </div>
            </div>
          </div>

          {/* New Interactive VLE Phase Envelope Simulator Widget */}
          <div className="glass-inner-card kernel-terminal-card VleSimulatorWidget">
            <div className="panel-header border-b">
              <div className="panel-title font-mono text-cyan">
                <Activity size={14} className="text-cyan animate-pulse" />
                VLE_PHASE_ENVELOPE_SIMULATOR.exe
              </div>
              <span className="terminal-baud text-cyan-glow">ACTIVE CORE</span>
            </div>
            <VleSimulator />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  VLE PHASE ENVELOPE SIMULATOR COMPONENT
// ─────────────────────────────────────────────────────────────────────
import { PRESETS, generateTxy } from './pfd/thermodynamics.js';

function VleSimulator() {
  const [selectedPreset, setSelectedPreset] = useState('Ethanol-Water');
  const [pressure, setPressure] = useState(101.325); // kPa (1 atm)
  const [composition, setComposition] = useState(0.5); // xA mole fraction
  const [plotData, setPlotData] = useState([]);
  
  // Calculate specific points
  const activePreset = PRESETS[selectedPreset] || PRESETS['Ethanol-Water'];
  const modelType = activePreset.nrtlParams ? 'NRTL' : 'Ideal';

  useEffect(() => {
    try {
      const data = generateTxy(pressure, activePreset.compA, activePreset.compB, modelType, selectedPreset, 30);
      if (data && data.length > 0) {
        setPlotData(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedPreset, pressure]);

  // Find bubble and dew temp for current composition
  const index = Math.round(composition * 30);
  const currentPoint = plotData[index] || { Tb: 78.4, Td: 82.1, yA_bub: 0.65 };

  return (
    <div className="vle-simulator-container">
      {/* Configuration Controls */}
      <div className="vle-controls">
        <div className="control-group">
          <label className="vle-label">BINARY SYSTEM</label>
          <select 
            className="vle-select"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            {Object.keys(PRESETS).map(key => (
              <option key={key} value={key}>{PRESETS[key].name}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label className="vle-label">PRESSURE: {pressure.toFixed(1)} kPa</label>
          <input 
            type="range" 
            min="20" 
            max="400" 
            step="5"
            value={pressure}
            onChange={(e) => setPressure(parseFloat(e.target.value))}
            className="vle-slider"
          />
        </div>

        <div className="control-group">
          <label className="vle-label">FEED FRACTION (x_A): {composition.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={composition}
            onChange={(e) => setComposition(parseFloat(e.target.value))}
            className="vle-slider"
          />
        </div>
      </div>

      {/* Physics Math Telemetry */}
      <div className="vle-math-grid">
        <div className="math-box">
          <div className="math-lbl">Bubble Temp (T_bub)</div>
          <div className="math-val text-cyan">{currentPoint.Tb ? currentPoint.Tb.toFixed(2) : '—'} °C</div>
        </div>
        <div className="math-box">
          <div className="math-lbl">Dew Temp (T_dew)</div>
          <div className="math-val text-purple">{currentPoint.Td ? currentPoint.Td.toFixed(2) : '—'} °C</div>
        </div>
        <div className="math-box">
          <div className="math-lbl">Vapor Phase (y_A)</div>
          <div className="math-val text-emerald">{currentPoint.yA_bub ? currentPoint.yA_bub.toFixed(3) : '—'}</div>
        </div>
      </div>

      {/* Dynamic SVG Plotting */}
      <div className="vle-plot-wrapper">
        <svg viewBox="0 0 200 100" className="vle-svg-chart">
          {/* Grid lines */}
          <line x1="10" y1="90" x2="190" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="10" y1="10" x2="10" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="190" y1="10" x2="190" y2="90" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

          {/* Curve Plots */}
          {plotData.length > 1 && (() => {
            const temps = plotData.map(p => p.Tb).concat(plotData.map(p => p.Td)).filter(t => !isNaN(t) && isFinite(t));
            const minT = Math.min(...temps);
            const maxT = Math.max(...temps);
            const tRange = maxT - minT || 1;

            const scaleX = (x) => 10 + x * 180;
            const scaleY = (t) => 90 - ((t - minT) / tRange) * 80;

            // Generate Path definitions
            let bubblePath = "";
            let dewPath = "";

            plotData.forEach((p, idx) => {
              const xVal = scaleX(p.z);
              const yBub = scaleY(p.Tb);
              const yDew = scaleY(p.Td);

              if (idx === 0) {
                bubblePath = `M ${xVal} ${yBub}`;
                dewPath = `M ${xVal} ${yDew}`;
              } else {
                bubblePath += ` L ${xVal} ${yBub}`;
                dewPath += ` L ${xVal} ${yDew}`;
              }
            });

            // Active operating tie-line
            const xOp = scaleX(composition);
            const yBubOp = scaleY(currentPoint.Tb);
            const yDewOp = scaleY(currentPoint.Td);
            const xVapOp = scaleX(currentPoint.yA_bub);

            return (
              <>
                {/* Bubble point curve */}
                <path d={bubblePath} fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.85" />
                {/* Dew point curve */}
                <path d={dewPath} fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.85" />
                
                {/* Vapor-liquid area tags */}
                <text x="100" y="25" fill="rgba(255,255,255,0.18)" fontSize="5" textAnchor="middle">SUPERHEATED VAPOR</text>
                <text x="100" y="82" fill="rgba(255,255,255,0.18)" fontSize="5" textAnchor="middle">SUBCOOLED LIQUID</text>
                <text x="100" y="52" fill="rgba(255,255,255,0.08)" fontSize="4" textAnchor="middle">TWO-PHASE (V+L)</text>

                {/* Tie-line */}
                <line x1={xOp} y1={yBubOp} x2={xVapOp} y2={yBubOp} stroke="rgba(255,158,0,0.5)" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
                <line x1={xOp} y1="90" x2={xOp} y2={yBubOp} stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" strokeDasharray="1,1" />

                {/* Nodes representing state points */}
                <circle cx={xOp} cy={yBubOp} r="1.5" fill="#00f2fe" filter="drop-shadow(0 0 3px #00f2fe)" />
                <circle cx={xVapOp} cy={yBubOp} r="1.5" fill="#f87171" filter="drop-shadow(0 0 3px #f87171)" />

                {/* Label text */}
                <text x="12" y="15" fill="rgba(255,255,255,0.3)" fontSize="4">{maxT.toFixed(0)} °C</text>
                <text x="12" y="87" fill="rgba(255,255,255,0.3)" fontSize="4">{minT.toFixed(0)} °C</text>
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
