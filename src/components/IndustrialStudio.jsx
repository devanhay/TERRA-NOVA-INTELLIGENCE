import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Activity, Settings2, ShieldAlert, CheckCircle2, 
  HelpCircle, ArrowRight, Play, RotateCcw, Package, Clock, Users 
} from 'lucide-react';

export default function IndustrialStudio() {
  const [activeTab, setActiveTab] = useState('simplex');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 20,
      fontFamily: 'var(--font-body)', color: '#E2E8F0', paddingBottom: 40
    }}>
      {/* 1. Glass tab selector (Supabase style) */}
      <div style={{
        display: 'flex', gap: 8, padding: 4, background: 'rgba(10, 8, 24, 0.45)',
        border: 'var(--glass-border)', borderRadius: 10, backdropFilter: 'var(--glass-blur)',
        alignSelf: 'flex-start'
      }}>
        <button
          onClick={() => setActiveTab('simplex')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem',
            fontWeight: activeTab === 'simplex' ? 600 : 400,
            background: activeTab === 'simplex' ? 'rgba(76, 201, 240, 0.15)' : 'transparent',
            color: activeTab === 'simplex' ? 'var(--accent)' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={14} />
          Operations Research (Simplex)
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem',
            fontWeight: activeTab === 'queue' ? 600 : 400,
            background: activeTab === 'queue' ? 'rgba(76, 201, 240, 0.15)' : 'transparent',
            color: activeTab === 'queue' ? 'var(--accent)' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <Activity size={14} />
          Queueing Simulator (M/M/c)
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem',
            fontWeight: activeTab === 'inventory' ? 600 : 400,
            background: activeTab === 'inventory' ? 'rgba(76, 201, 240, 0.15)' : 'transparent',
            color: activeTab === 'inventory' ? 'var(--accent)' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <Package size={14} />
          Inventory Optimizer (EOQ)
        </button>
        <button
          onClick={() => setActiveTab('spc')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.78rem',
            fontWeight: activeTab === 'spc' ? 600 : 400,
            background: activeTab === 'spc' ? 'rgba(76, 201, 240, 0.15)' : 'transparent',
            color: activeTab === 'spc' ? 'var(--accent)' : '#94A3B8',
            transition: 'all 0.2s'
          }}
        >
          <Activity size={14} />
          Process Control (SPC)
        </button>
      </div>

      {/* 2. Workspace content area */}
      <div style={{
        background: 'rgba(10, 8, 24, 0.45)', border: 'var(--glass-border)',
        borderRadius: 16, backdropFilter: 'var(--glass-blur)', padding: 24,
        boxShadow: 'var(--shadow-card)'
      }}>
        {activeTab === 'simplex' && <SimplexSolver />}
        {activeTab === 'queue' && <QueueSimulator />}
        {activeTab === 'inventory' && <InventoryOptimizer />}
        {activeTab === 'spc' && <ProcessControlSPC />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  1. SIMPLEX / LINEAR PROGRAMMING SOLVER
// ─────────────────────────────────────────────────────────────────────
function SimplexSolver() {
  const [c1, setC1] = useState(40); // Profit per Product A
  const [c2, setC2] = useState(30); // Profit per Product B

  // Constraint 1: a11*X1 + a12*X2 <= b1 (e.g. Labor Hours)
  const [a11, setA11] = useState(2);
  const [a12, setA12] = useState(1);
  const [b1, setB1] = useState(100);
  const [c1Label, setC1Label] = useState('Labor Hours');

  // Constraint 2: a21*X1 + a22*X2 <= b2 (e.g. Raw Material)
  const [a21, setA21] = useState(1);
  const [a22, setA22] = useState(2);
  const [b2, setB2] = useState(120);
  const [c2Label, setC2Label] = useState('Raw Material');

  // Solve the LP system
  const solution = useMemo(() => {
    // Vertices to check (all intersection combinations including axes boundary)
    const vertices = [
      { x: 0, y: 0 },
      // X-intercepts
      { x: a11 > 0 ? b1 / a11 : 0, y: 0 },
      { x: a21 > 0 ? b2 / a21 : 0, y: 0 },
      // Y-intercepts
      { x: 0, y: a12 > 0 ? b1 / a12 : 0 },
      { x: 0, y: a22 > 0 ? b2 / a22 : 0 },
    ];

    // Line intersection:
    // a11*X1 + a12*X2 = b1
    // a21*X1 + a22*X2 = b2
    const det = a11 * a22 - a12 * a21;
    if (Math.abs(det) > 0.0001) {
      const intersectX = (b1 * a22 - b2 * a12) / det;
      const intersectY = (a11 * b2 - a21 * b1) / det;
      if (intersectX >= 0 && intersectY >= 0) {
        vertices.push({ x: intersectX, y: intersectY });
      }
    }

    // Filter vertices that satisfy all constraints
    const feasibleVertices = vertices.filter(v => {
      const c1Sat = a11 * v.x + a12 * v.y <= b1 + 0.0001;
      const c2Sat = a21 * v.x + a22 * v.y <= b2 + 0.0001;
      return c1Sat && c2Sat && v.x >= 0 && v.y >= 0;
    });

    // Remove duplicates
    const uniqueVertices = [];
    feasibleVertices.forEach(v => {
      if (!uniqueVertices.some(uv => Math.abs(uv.x - v.x) < 0.001 && Math.abs(uv.y - v.y) < 0.001)) {
        uniqueVertices.push(v);
      }
    });

    // Sort vertices counter-clockwise for SVG polygon shading
    uniqueVertices.sort((p1, p2) => {
      return Math.atan2(p1.y, p1.x) - Math.atan2(p2.y, p2.x);
    });

    // Find optimal vertex
    let maxZ = -1;
    let optX = 0;
    let optY = 0;
    uniqueVertices.forEach(v => {
      const z = c1 * v.x + c2 * v.y;
      if (z > maxZ) {
        maxZ = z;
        optX = v.x;
        optY = v.y;
      }
    });

    return {
      vertices: uniqueVertices,
      optX,
      optY,
      maxZ
    };
  }, [c1, c2, a11, a12, b1, a21, a22, b2]);

  // Construct SVG Viewbox scales
  const graphLimit = Math.max(
    a11 > 0 ? b1 / a11 : 0,
    a21 > 0 ? b2 / a21 : 0,
    a12 > 0 ? b1 / a12 : 0,
    a22 > 0 ? b2 / a22 : 0
  ) * 1.2 || 100;

  const toSvgX = (x) => 30 + (x / graphLimit) * 220;
  const toSvgY = (y) => 210 - (y / graphLimit) * 180;

  // Feasible area path
  const feasiblePolygonPoints = solution.vertices.map(v => `${toSvgX(v.x).toFixed(1)},${toSvgY(v.y).toFixed(1)}`).join(' ');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Parameters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>Operations Research Studio</h3>
          <p style={{ fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.4 }}>
            Maximize profit/efficiency by solving the resource allocation linear programming model.
          </p>
        </div>

        {/* Objective Section */}
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', background: 'rgba(76, 201, 240, 0.1)', color: 'var(--accent)', borderRadius: 4, letterSpacing: '0.05em' }}>OBJECTIVE FUNCTION</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: '#fff' }}>Max Z =</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={c1} onChange={e => setC1(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>X₁ (A)</span>
            </div>
            <span style={{ color: '#64748B' }}>+</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={c2} onChange={e => setC2(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>X₂ (B)</span>
            </div>
          </div>
        </div>

        {/* Constraints Section */}
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', background: 'rgba(181, 23, 158, 0.1)', color: 'var(--purple)', borderRadius: 4, letterSpacing: '0.05em', display: 'inline-block', marginBottom: 12 }}>RESOURCES & LIMITS</span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Constraint 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', alignItems: 'center', gap: 8 }}>
              <input type="text" value={c1Label} onChange={e => setC1Label(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" value={a11} onChange={e => setA11(parseFloat(e.target.value) || 0)} style={inputStyle} />
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>X₁</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" value={a12} onChange={e => setA12(parseFloat(e.target.value) || 0)} style={inputStyle} />
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>X₂</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>≤</span>
                <input type="number" value={b1} onChange={e => setB1(parseFloat(e.target.value) || 0)} style={inputStyle} />
              </div>
            </div>

            {/* Constraint 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', alignItems: 'center', gap: 8 }}>
              <input type="text" value={c2Label} onChange={e => setC2Label(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" value={a21} onChange={e => setA21(parseFloat(e.target.value) || 0)} style={inputStyle} />
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>X₁</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" value={a22} onChange={e => setA22(parseFloat(e.target.value) || 0)} style={inputStyle} />
                <span style={{ fontSize: '0.7rem', color: '#64748B' }}>X₂</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>≤</span>
                <input type="number" value={b2} onChange={e => setB2(parseFloat(e.target.value) || 0)} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(76, 201, 240, 0.08) 0%, rgba(181, 23, 158, 0.08) 100%)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16
        }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginBottom: 10 }}>Optimization Output</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>OPTIMAL X₁ (A)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>{solution.optX.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>OPTIMAL X₂ (B)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--purple)' }}>{solution.optY.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>MAX PROFIT (Z)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>${solution.maxZ.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Feasible Region SVG Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94A3B8' }}>Feasible Region & Solver Graph</span>
          <span style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'monospace' }}>2D simplex visualization</span>
        </div>

        <svg width="280" height="240" viewBox="0 0 280 240" style={{ background: '#020208', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
          {/* Grid lines */}
          <line x1={30} y1={210} x2={270} y2={210} stroke="#1E293B" strokeWidth={1.5} />
          <line x1={30} y1={30} x2={30} y2={210} stroke="#1E293B" strokeWidth={1.5} />
          
          {/* Constraint Line 1 */}
          {a11 > 0 && a12 > 0 && (
            <line 
              x1={toSvgX(0)} y1={toSvgY(b1/a12)} 
              x2={toSvgX(b1/a11)} y2={toSvgY(0)} 
              stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="3,3" opacity={0.6}
            />
          )}

          {/* Constraint Line 2 */}
          {a21 > 0 && a22 > 0 && (
            <line 
              x1={toSvgX(0)} y1={toSvgY(b2/a22)} 
              x2={toSvgX(b2/a21)} y2={toSvgY(0)} 
              stroke="var(--purple)" strokeWidth={1.5} strokeDasharray="3,3" opacity={0.6}
            />
          )}

          {/* Shaded Feasible Region Polygon */}
          {solution.vertices.length > 0 && (
            <polygon 
              points={feasiblePolygonPoints} 
              fill="url(#feasibleGrad)" 
              stroke="url(#accentPurpleGrad)" 
              strokeWidth={1.5} 
            />
          )}

          {/* Optimal Solution Pointer */}
          <circle cx={toSvgX(solution.optX)} cy={toSvgY(solution.optY)} r={6} fill="#10B981" style={{ filter: 'drop-shadow(0 0 4px #10B981)' }} />
          <circle cx={toSvgX(solution.optX)} cy={toSvgY(solution.optY)} r={12} fill="none" stroke="#10B981" strokeWidth={1.2} className="animate-pulse" />

          {/* Labels & Details */}
          <text x={260} y={225} fill="#64748B" fontSize="8" textAnchor="end">X₁ (A)</text>
          <text x={25} y={40} fill="#64748B" fontSize="8" textAnchor="end" transform="rotate(-90 25 40)">X₂ (B)</text>

          {/* Gradients */}
          <defs>
            <linearGradient id="feasibleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="accentPurpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--purple)" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: '0.62rem', color: '#64748B' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> {c1Label} Limit</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--purple)' }} /> {c2Label} Limit</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Optimal Sol</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  2. QUEUEING SIMULATOR (M/M/c)
// ─────────────────────────────────────────────────────────────────────
function QueueSimulator() {
  const [lambda, setLambda] = useState(12); // jobs / hour
  const [mu, setMu] = useState(5);      // jobs / server / hour
  const [c, setC] = useState(3);        // servers

  // Calculations
  const metrics = useMemo(() => {
    const rho = lambda / (c * mu);
    if (rho >= 1) return { rho, unstable: true };

    // Calculate P0 (Probability of 0 items in system)
    let sum = 0;
    for (let n = 0; n < c; n++) {
      sum += Math.pow(lambda / mu, n) / factorial(n);
    }
    const term2 = (Math.pow(lambda / mu, c) / (factorial(c) * (1 - rho)));
    const p0 = 1 / (sum + term2);

    // Lq (average items in queue)
    const lqNum = Math.pow(lambda / mu, c) * lambda * mu * p0;
    const lqDen = factorial(c - 1) * Math.pow(c * mu - lambda, 2);
    const Lq = lqNum / lqDen;

    // Wq (average wait time in queue)
    const Wq = Lq / lambda; // hours

    // W (total time in system)
    const W = Wq + 1 / mu; // hours

    // L (average items in system)
    const L = lambda * W;

    return {
      rho,
      unstable: false,
      Lq,
      Wq: Wq * 60, // minutes
      W: W * 60,   // minutes
      L,
      p0
    };
  }, [lambda, mu, c]);

  function factorial(n) {
    if (n === 0) return 1;
    let res = 1;
    for (let i = 1; i <= n; i++) res *= i;
    return res;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Parameters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>M/M/c Queueing Simulator</h3>
          <p style={{ fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.4 }}>
            Evaluate bottlenecks by simulating arrival rates and service capacities in manufacturing lines.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
          {/* Arrival Rate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Arrival Rate (λ):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={lambda} onChange={e => setLambda(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>items/hr</span>
            </div>
          </div>

          {/* Service Rate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Service Rate (μ):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={mu} onChange={e => setMu(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>items/hr/srv</span>
            </div>
          </div>

          {/* Server Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Servers Count (c):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={c} onChange={e => setC(parseInt(e.target.value) || 1)} style={inputStyle} />
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>channels</span>
            </div>
          </div>
        </div>

        {/* Stable State Metrics */}
        {metrics.unstable ? (
          <div style={{ display: 'flex', gap: 8, padding: 14, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10 }}>
            <ShieldAlert size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#EF4444' }}>System Bottleneck Alarm!</div>
              <p style={{ fontSize: '0.66rem', color: '#FCA5A5', lineHeight: 1.4, marginTop: 4 }}>
                Arrival rate (λ = {lambda}) exceeds total service capacity (c·μ = {c * mu}). Queue builds indefinitely. Add servers or speed up service.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>UTILIZATION RATE (ρ)</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>{(metrics.rho * 100).toFixed(1)}%</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>QUEUE LENGTH (Lq)</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{metrics.Lq.toFixed(2)} items</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>AVG WAIT TIME (Wq)</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981', marginTop: 4 }}>{metrics.Wq.toFixed(1)} mins</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>AVG TIME IN SYSTEM (W)</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--purple)', marginTop: 4 }}>{metrics.W.toFixed(1)} mins</div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Live Queue Pipeline Simulation */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94A3B8' }}>Flow Telemetry View</span>
          <span style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'monospace' }}>Discrete queues</span>
        </div>

        <svg width="280" height="240" viewBox="0 0 280 240" style={{ background: '#020208', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
          {/* Main Pipeline path */}
          <path d="M 20 120 L 160 120" stroke="#1E293B" strokeWidth={12} fill="none" />
          <path d="M 20 120 L 160 120" stroke="rgba(76, 201, 240, 0.05)" strokeWidth={8} fill="none" />
          
          {/* Multi-channel splits */}
          {[...Array(Math.min(c, 5))].map((_, i) => {
            const yOffset = 120 + (i - (Math.min(c, 5) - 1) / 2) * 40;
            return (
              <g key={i}>
                <path d={`M 160 120 Q 180 120 200 ${yOffset}`} stroke="#1E293B" strokeWidth={6} fill="none" />
                
                {/* Server processing nodes */}
                <circle cx={230} cy={yOffset} r={12} fill={metrics.unstable ? '#EF444420' : '#10B98120'} stroke={metrics.unstable ? '#EF4444' : '#10B981'} strokeWidth={1.5} />
                <text x={230} y={yOffset + 3} fill={metrics.unstable ? '#EF4444' : '#10B981'} fontSize="8" textAnchor="middle" fontWeight={700}>S{i+1}</text>
              </g>
            );
          })}

          {/* Queue elements particles */}
          {!metrics.unstable && [...Array(8)].map((_, idx) => (
            <circle key={idx} cx={40 + idx * 14} cy={120} r={4} fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 2px var(--accent))' }}>
              <animate attributeName="cx" values={`${40 + idx * 14};${150 + idx * 3}`} dur="2s" repeatCount="indefinite" />
            </circle>
          ))}

          {metrics.unstable && [...Array(14)].map((_, idx) => (
            <circle key={idx} cx={20 + idx * 10} cy={120} r={4} fill="#EF4444" style={{ filter: 'drop-shadow(0 0 2px #EF4444)' }} />
          ))}

          <text x={90} y={104} fill="#64748B" fontSize="8" textAnchor="middle">Buffer Queue</text>
        </svg>

        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: '0.62rem', color: '#64748B' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> Arrivals</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Active Servers</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  3. INVENTORY OPTIMIZER (EOQ)
// ─────────────────────────────────────────────────────────────────────
function InventoryOptimizer() {
  const [demand, setDemand] = useState(12000); // Units/year
  const [setupCost, setSetupCost] = useState(150); // Cost per order
  const [holdingCost, setHoldingCost] = useState(2.5); // Cost/unit/year
  const [safetyStock, setSafetyStock] = useState(200); // safety buffer

  // Math
  const eoq = useMemo(() => {
    if (holdingCost <= 0) return 0;
    return Math.sqrt((2 * demand * setupCost) / holdingCost);
  }, [demand, setupCost, holdingCost]);

  const stats = useMemo(() => {
    if (eoq <= 0) return { annualSetup: 0, annualHolding: 0, total: 0 };
    const numOrders = demand / eoq;
    const annualSetup = numOrders * setupCost;
    const annualHolding = (eoq / 2) * holdingCost + (safetyStock * holdingCost);
    return {
      numOrders,
      annualSetup,
      annualHolding,
      total: annualSetup + annualHolding
    };
  }, [demand, eoq, setupCost, holdingCost, safetyStock]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Parameters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>Inventory & Supply Chain Optimizer</h3>
          <p style={{ fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.4 }}>
            Determine the Economic Order Quantity (EOQ) to minimize carrying costs and stockouts.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
          {/* Annual Demand */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Annual Demand (D):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={demand} onChange={e => setDemand(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>units/yr</span>
            </div>
          </div>

          {/* Setup Cost */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Ordering / Setup Cost (S):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={setupCost} onChange={e => setSetupCost(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>$/order</span>
            </div>
          </div>

          {/* Holding Cost */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Unit Holding Cost (H):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={holdingCost} onChange={e => setHoldingCost(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>$/unit/yr</span>
            </div>
          </div>

          {/* Safety Stock */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Safety Stock Level:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={safetyStock} onChange={e => setSafetyStock(parseFloat(e.target.value) || 0)} style={inputStyle} />
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>units</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>ECONOMIC ORDER QUANTITY (Q*)</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>{Math.round(eoq)} units</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{stats.numOrders.toFixed(1)} cycles</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>ANNUAL HOLDING COST</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--purple)', marginTop: 4 }}>${Math.round(stats.annualHolding)}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: '0.56rem', color: '#94A3B8' }}>MINIMUM TOTAL COST</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981', marginTop: 4 }}>${Math.round(stats.total)}</div>
          </div>
        </div>
      </div>

      {/* Sawtooth Inventory Depletion Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94A3B8' }}>Inventory Sawtooth Waveform</span>
          <span style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'monospace' }}>Depletion cycles</span>
        </div>

        <svg width="280" height="240" viewBox="0 0 280 240" style={{ background: '#020208', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
          {/* Axis */}
          <line x1={30} y1={210} x2={270} y2={210} stroke="#1E293B" strokeWidth={1.5} />
          <line x1={30} y1={30} x2={30} y2={210} stroke="#1E293B" strokeWidth={1.5} />

          {/* Safety Stock Line */}
          <line x1={30} y1={170} x2={270} y2={170} stroke="rgba(239, 68, 68, 0.4)" strokeWidth={1.2} strokeDasharray="3,3" />

          {/* Sawtooth Wave */}
          <path d="M30,70 L90,170 L90,70 L150,170 L150,70 L210,170 L210,70 L270,170" fill="none" stroke="var(--accent)" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 3px rgba(76, 201, 240, 0.4))' }} />

          <text x={260} y={225} fill="#64748B" fontSize="8" textAnchor="end">Time (t)</text>
          <text x={25} y={40} fill="#64748B" fontSize="8" textAnchor="end" transform="rotate(-90 25 40)">Qty (Q)</text>

          {/* Label lines */}
          <text x={265} y={166} fill="#F87171" fontSize="7" textAnchor="end">Safety Stock ({safetyStock})</text>
          <text x={95} y={66} fill="var(--accent)" fontSize="7">EOQ Peak ({Math.round(eoq + safetyStock)})</text>
        </svg>

        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: '0.62rem', color: '#64748B' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> Depletion Curve</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} /> Safety Threshold</span>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid #1E293B',
  borderRadius: 6,
  padding: '5px 8px',
  color: '#F1F5F9',
  fontSize: '0.74rem',
  fontFamily: 'var(--font-mono)',
  width: 60,
  textAlign: 'center',
  outline: 'none'
};

// ─────────────────────────────────────────────────────────────────────
//  4. PROCESS CONTROL (SIX SIGMA SPC MONITOR)
// ─────────────────────────────────────────────────────────────────────
function ProcessControlSPC() {
  const [data, setData] = useState(() => {
    // Generate initial stable data
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        id: i,
        val: 350 + (Math.random() - 0.5) * 4
      });
    }
    return arr;
  });
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [anomalyMode, setAnomalyMode] = useState('normal'); // 'normal' | 'drift_neg' | 'drift_pos' | 'spike'
  const [usl, setUsl] = useState(362);
  const [lsl, setLsl] = useState(338);

  // Simulation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setData(prev => {
        const nextId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 0;
        let base = 350;
        
        // Calculate current offset based on selected anomaly mode
        if (anomalyMode === 'drift_neg') {
          // Continuous negative drift simulating catalyst decay
          const lastVal = prev.length > 0 ? prev[prev.length - 1].val : 350;
          base = lastVal - 0.9;
        } else if (anomalyMode === 'drift_pos') {
          // Continuous positive drift simulating cooling failure
          const lastVal = prev.length > 0 ? prev[prev.length - 1].val : 350;
          base = lastVal + 0.9;
        } else if (anomalyMode === 'spike') {
          // Single giant spike, then automatically resets to normal
          base = 350 + (Math.random() > 0.5 ? 14 : -14);
          setAnomalyMode('normal');
        }

        // Add small random noise (Normal distribution approximation)
        const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 2;
        const newVal = base + noise;

        // Keep maximum 30 points for view visibility
        const nextData = [...prev, { id: nextId, val: newVal }];
        if (nextData.length > 30) {
          nextData.shift();
        }
        return nextData;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, anomalyMode]);

  // Statistical calculations
  const stats = useMemo(() => {
    if (data.length === 0) return { mean: 350, std: 1, ucl: 353, lcl: 347, cp: 0, cpk: 0 };
    
    const vals = data.map(d => d.val);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    const std = Math.max(0.1, Math.sqrt(variance)); // prevent divide by zero
    
    const ucl = mean + 3 * std;
    const lcl = mean - 3 * std;
    
    // Process Capability Cp & Cpk
    const cp = (usl - lsl) / (6 * std);
    const cpk = Math.min((usl - mean) / (3 * std), (mean - lsl) / (3 * std));
    
    // Rule Violations Checks
    let rule1Violation = false; // Out of Control Limits (3 sigma)
    let rule2Violation = false; // Run of 9 points on same side of mean
    
    // Rule 1: Point beyond UCL/LCL
    const lastPoint = vals[vals.length - 1];
    if (lastPoint > ucl || lastPoint < lcl) {
      rule1Violation = true;
    }

    // Rule 2: Run of 9 consecutive points on same side of mean
    if (vals.length >= 9) {
      const recentVals = vals.slice(-9);
      const above = recentVals.every(v => v > mean);
      const below = recentVals.every(v => v < mean);
      if (above || below) {
        rule2Violation = true;
      }
    }

    return { mean, std, ucl, lcl, cp, cpk, rule1Violation, rule2Violation };
  }, [data, usl, lsl]);

  // Render SVG chart path
  const svgWidth = 560;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const chartMin = 330;
  const chartMax = 370;

  const getX = (index, total) => {
    if (total <= 1) return paddingX;
    return paddingX + (index / (total - 1)) * (svgWidth - 2 * paddingX);
  };

  const getY = (val) => {
    const ratio = (val - chartMin) / (chartMax - chartMin);
    return svgHeight - paddingY - ratio * (svgHeight - 2 * paddingY);
  };

  const linePath = data.map((d, i) => {
    return `${i === 0 ? 'M' : 'L'} ${getX(i, data.length)} ${getY(d.val)}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Description header */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} style={{ color: 'var(--accent)' }} />
          Six Sigma Statistical Process Control (SPC)
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94A3B8', maxWidth: 700, lineHeight: 1.4 }}>
          Real-time monitoring system for key process indicators (e.g. Reactor Temperature in Kelvin). 
          Tracks mean shifts, standard deviations, and process capability indices ($C_p, C_{pk}$) to detect drifts and process anomalies before they result in off-spec chemical batches.
        </p>
      </div>

      <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* SVG Control Chart container */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #1E293B',
          borderRadius: 12, padding: 18, position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600 }}>LIVE PROCESS CONTROL CHART (X-BAR)</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="hud-toggle-pill"
                style={{ fontSize: '0.66rem', padding: '3px 8px', background: isPlaying ? 'rgba(76, 201, 240, 0.15)' : 'rgba(255,255,255,0.05)', color: isPlaying ? 'var(--accent)' : '#94A3B8' }}
              >
                {isPlaying ? 'Pause Feed' : 'Resume Feed'}
              </button>
              <button 
                onClick={() => {
                  setData([{ id: 0, val: 350 + (Math.random() - 0.5) * 4 }]);
                  setAnomalyMode('normal');
                }}
                className="hud-toggle-pill"
                style={{ fontSize: '0.66rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', color: '#F1F5F9' }}
              >
                Reset
              </button>
            </div>
          </div>

          <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
            {/* Grid background lines */}
            {[330, 340, 350, 360, 370].map(v => (
              <g key={v}>
                <line x1={paddingX} y1={getY(v)} x2={svgWidth - paddingX} y2={getY(v)} stroke="#1E293B" strokeWidth={1} strokeDasharray={v === 350 ? '0' : '4 4'} />
                <text x={paddingX - 10} y={getY(v) + 3} fill="#64748B" fontSize="8" textAnchor="end" fontFamily="var(--font-mono)">{v}K</text>
              </g>
            ))}

            {/* USL / LSL Specification Limits (Purple) */}
            <line x1={paddingX} y1={getY(usl)} x2={svgWidth - paddingX} y2={getY(usl)} stroke="#A855F7" strokeWidth={1.5} />
            <text x={svgWidth - paddingX + 5} y={getY(usl) + 3} fill="#C084FC" fontSize="7.5" fontWeight={600}>USL ({usl}K)</text>

            <line x1={paddingX} y1={getY(lsl)} x2={svgWidth - paddingX} y2={getY(lsl)} stroke="#A855F7" strokeWidth={1.5} />
            <text x={svgWidth - paddingX + 5} y={getY(lsl) + 3} fill="#C084FC" fontSize="7.5" fontWeight={600}>LSL ({lsl}K)</text>

            {/* UCL / LCL Control Limits (Red) */}
            <line x1={paddingX} y1={getY(stats.ucl)} x2={svgWidth - paddingX} y2={getY(stats.ucl)} stroke="#EF4444" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={svgWidth - paddingX + 5} y={getY(stats.ucl) - 2} fill="#F87171" fontSize="7" fontFamily="var(--font-mono)">UCL (+3σ): {stats.ucl.toFixed(1)}K</text>

            <line x1={paddingX} y1={getY(stats.lcl)} x2={svgWidth - paddingX} y2={getY(stats.lcl)} stroke="#EF4444" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={svgWidth - paddingX + 5} y={getY(stats.lcl) + 8} fill="#F87171" fontSize="7" fontFamily="var(--font-mono)">LCL (-3σ): {stats.lcl.toFixed(1)}K</text>

            {/* Process Mean (Green) */}
            <line x1={paddingX} y1={getY(stats.mean)} x2={svgWidth - paddingX} y2={getY(stats.mean)} stroke="#10B981" strokeWidth={1.2} />
            <text x={paddingX + 10} y={getY(stats.mean) - 4} fill="#34D399" fontSize="7" fontWeight={600}>Process Mean (μ): {stats.mean.toFixed(1)}K</text>

            {/* Process Value Line Path */}
            {data.length > 1 && (
              <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 4px rgba(76,201,240,0.3))' }} />
            )}

            {/* Process Value Points */}
            {data.map((d, i) => {
              const cx = getX(i, data.length);
              const cy = getY(d.val);
              const isOut = d.val > stats.ucl || d.val < stats.lcl;
              return (
                <circle 
                  key={d.id} cx={cx} cy={cy} r={isOut ? 4 : 2.5} 
                  fill={isOut ? '#EF4444' : 'var(--accent)'} 
                  stroke={isOut ? '#FCA5A5' : '#0F172A'} 
                  strokeWidth={1}
                />
              );
            })}
          </svg>
        </div>

        {/* Control inputs & stats metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Spec limit configuration */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #1E293B',
            borderRadius: 12, padding: 18
          }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 12 }}>SPECIFICATION LIMITS (USL/LSL)</span>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Upper Spec (USL)</span>
                <input 
                  type="number" value={usl} onChange={e => setUsl(Number(e.target.value))} 
                  style={{ ...inputStyle, width: 80 }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Lower Spec (LSL)</span>
                <input 
                  type="number" value={lsl} onChange={e => setLsl(Number(e.target.value))} 
                  style={{ ...inputStyle, width: 80 }} 
                />
              </div>
            </div>
          </div>

          {/* Anomaly injector */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #1E293B',
            borderRadius: 12, padding: 18
          }}>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 10 }}>PROCESS ANOMALY INJECTOR</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                onClick={() => setAnomalyMode('normal')}
                style={{
                  width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #1E293B',
                  background: anomalyMode === 'normal' ? 'rgba(76, 201, 240, 0.1)' : 'transparent',
                  color: anomalyMode === 'normal' ? 'var(--accent)' : '#E2E8F0',
                  fontSize: '0.74rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <span>✓ Catalyst Normal Operation</span>
                <span style={{ fontSize: '0.6rem', color: '#64748B' }}>Stable variance</span>
              </button>
              <button 
                onClick={() => setAnomalyMode('drift_neg')}
                style={{
                  width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #1E293B',
                  background: anomalyMode === 'drift_neg' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: anomalyMode === 'drift_neg' ? '#EF4444' : '#E2E8F0',
                  fontSize: '0.74rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <span>⚠ Catalyst Degradation (Negative Drift)</span>
                <span style={{ fontSize: '0.6rem', color: '#EF4444' }}>-0.9K / step</span>
              </button>
              <button 
                onClick={() => setAnomalyMode('drift_pos')}
                style={{
                  width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #1E293B',
                  background: anomalyMode === 'drift_pos' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: anomalyMode === 'drift_pos' ? '#EF4444' : '#E2E8F0',
                  fontSize: '0.74rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <span>⚠ Reactor Jacket Fouling (Positive Drift)</span>
                <span style={{ fontSize: '0.6rem', color: '#EF4444' }}>+0.9K / step</span>
              </button>
              <button 
                onClick={() => setAnomalyMode('spike')}
                style={{
                  width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #1E293B',
                  background: anomalyMode === 'spike' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  color: '#E2E8F0',
                  fontSize: '0.74rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}
              >
                <span>⚡ Valve Transient Failure (Spike)</span>
                <span style={{ fontSize: '0.6rem', color: '#F59E0B' }}>±14K Transient</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Six Sigma Statistical Metrics Table */}
      <div className="g3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Capability Indices */}
        <div style={{
          background: 'rgba(10, 8, 24, 0.3)', border: '1px solid #1E293B',
          borderRadius: 12, padding: 18
        }}>
          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>PROCESS CAPABILITY (Lean Six Sigma)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#E2E8F0' }}>Cp (Potential Index)</span>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{stats.cp.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#E2E8F0' }}>Cpk (Performance Index)</span>
              <span style={{ 
                fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600,
                color: stats.cpk >= 1.33 ? '#10B981' : stats.cpk >= 1.0 ? '#F59E0B' : '#EF4444'
              }}>
                {stats.cpk.toFixed(2)}
              </span>
            </div>
            <div style={{ fontSize: '0.62rem', color: '#64748B', lineHeight: 1.3, borderTop: '1px solid #1E293B', paddingTop: 6 }}>
              Target $C_{pk} \ge 1.33$ indicates process fits comfortably within specifications (Six Sigma level).
            </div>
          </div>
        </div>

        {/* Real-time stats */}
        <div style={{
          background: 'rgba(10, 8, 24, 0.3)', border: '1px solid #1E293B',
          borderRadius: 12, padding: 18
        }}>
          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>REAL-TIME STATISTICS</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Current Purity Temp</span>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {data.length > 0 ? data[data.length - 1].val.toFixed(2) : 350.00}K
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Process Mean (μ)</span>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#34D399' }}>{stats.mean.toFixed(2)}K</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Std Deviation (σ)</span>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#fff' }}>{stats.std.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Nelson Rules Alarms */}
        <div style={{
          background: 'rgba(10, 8, 24, 0.3)', border: '1px solid #1E293B',
          borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10
        }}>
          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>NELSON RULE ALARMS</span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
              <span style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: stats.rule1Violation ? '#EF4444' : '#10B981',
                boxShadow: stats.rule1Violation ? '0 0 10px #EF4444' : 'none'
              }} />
              <span style={{ color: stats.rule1Violation ? '#F87171' : '#94A3B8' }}>Rule 1: Point Out of Control Limits (&gt; 3σ)</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem' }}>
              <span style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: stats.rule2Violation ? '#EF4444' : '#10B981',
                boxShadow: stats.rule2Violation ? '0 0 10px #EF4444' : 'none'
              }} />
              <span style={{ color: stats.rule2Violation ? '#F87171' : '#94A3B8' }}>Rule 2: Mean Shift (9 consecutive points on 1 side)</span>
            </div>
          </div>

          {(stats.rule1Violation || stats.rule2Violation) ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 6, padding: '4px 8px', fontSize: '0.62rem', color: '#F87171', marginTop: 4
            }}>
              <ShieldAlert size={12} />
              <span>Critical shift detected. Check reactor catalyst/valves!</span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 6, padding: '4px 8px', fontSize: '0.62rem', color: '#34D399', marginTop: 4
            }}>
              <CheckCircle2 size={12} />
              <span>Reactor parameters within normal variance.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

