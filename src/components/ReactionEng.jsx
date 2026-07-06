import { useState } from 'react'

function InfoBox({ text }) {
  return (
    <div className="info-block mb-md" style={{
      background: 'rgba(56, 189, 248, 0.05)',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 16
    }}>
      <div className="info-block-label" style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.74rem' }}>📐 Kinetics Concept</div>
      <div className="info-block-text" style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>{text}</div>
    </div>
  )
}

function ResCell({ label, val, unit, accent = 'var(--accent)', sub }) {
  const fmt = v => {
    if (v == null || isNaN(v)) return '—'
    return Math.abs(v) >= 1e5 ? v.toExponential(3) : parseFloat(v.toFixed(4)).toString()
  }
  return (
    <div className="res-cell" style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
      <div className="res-cell-label" style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: accent }}>{fmt(val)}</span>
        <span className="res-cell-unit" style={{ fontSize: '0.75rem', color: '#64748b' }}> {unit}</span>
      </div>
      {sub && <div style={{ fontSize: '0.66rem', color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function ReactionEng() {
  const [tab, setTab] = useState('cstr')
  return (
    <div>
      <div className="card mb-md">
        <div className="card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>⚛️ Reaction Engineering Suite</div>
        <div className="card-desc">Design and kinetics simulators for continuous stirred tank (CSTR), plug flow (PFR), and batch reactors</div>
        <div className="os-tabs" style={{ marginBottom: 20 }}>
          <button className={`os-tab ${tab === 'cstr' ? 'active' : ''}`} onClick={() => setTab('cstr')}>🔄 CSTR Designer</button>
          <button className={`os-tab ${tab === 'pfr' ? 'active' : ''}`} onClick={() => setTab('pfr')}>⚡ PFR Designer</button>
          <button className={`os-tab ${tab === 'batch' ? 'active' : ''}`} onClick={() => setTab('batch')}>⏳ Batch Reactor</button>
          <button className={`os-tab ${tab === 'arrhenius' ? 'active' : ''}`} onClick={() => setTab('arrhenius')}>📈 Arrhenius Solver</button>
        </div>
        {tab === 'cstr' && <CSTR />}
        {tab === 'pfr' && <PFR />}
        {tab === 'batch' && <Batch />}
        {tab === 'arrhenius' && <Arrhenius />}
      </div>
    </div>
  )
}

function CSTR() {
  const [vals, setVals] = useState({ FA0: '2', X: '80', k: '0.05', CA0: '1000', order: '1' })
  const [result, setResult] = useState(null)
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const calculate = () => {
    const FA0 = parseFloat(vals.FA0)
    const X = parseFloat(vals.X) / 100
    const k = parseFloat(vals.k)
    const CA0 = parseFloat(vals.CA0)
    const order = parseInt(vals.order)
    if ([FA0, X, k, CA0].some(isNaN)) return

    const CA = CA0 * (1 - X)
    let rA
    if (order === 0) rA = k
    else if (order === 1) rA = k * CA
    else if (order === 2) rA = k * CA * CA

    const V = FA0 * X / rA
    const tau = V / (FA0 / CA0)
    const Xcheck = (order === 1) ? (k * tau) / (1 + k * tau) : X

    setResult({ V, tau, CA, rA, Xcheck: Xcheck * 100 })
  }

  const exportToPFD = () => {
    if (!result) return
    try {
      const activeProj = localStorage.getItem('engineeros_current_project') || 'proj-default-1'
      const saved = localStorage.getItem('engineeros_pfd_' + activeProj)
      let data = { nodes: [], streams: [], equipParams: {}, NC: 1, SC: 100 }
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object') data = parsed
        } catch (e) {}
      }
      
      const newReactorNode = {
        id: 'n_reactor_' + Date.now().toString().slice(-4),
        name: 'Reactor R-101 (CSTR)',
        type: 'reactor',
        x: 350,
        y: 200
      }
      
      data.nodes.push(newReactorNode)
      data.equipParams = data.equipParams || {}
      data.equipParams[newReactorNode.id] = {
        volume: result.V,
        residenceTime: result.tau,
        conversion: vals.X
      }

      localStorage.setItem('engineeros_pfd_' + activeProj, JSON.stringify(data))
      window.dispatchEvent(new Event('engineeros_force_pfd_reload'))
      alert('CSTR Reactor successfully compiled and exported to PFD Flowsheet canvas!')
    } catch (e) {
      console.error(e)
    }
  }

  const X_num = parseFloat(vals.X) || 0
  const V_num = result ? result.V : 0
  const liquidColor = `hsl(${Math.max(35, 200 - X_num * 1.65)}, 75%, 45%)`
  const liquidHeight = Math.min(48, 10 + Math.min(38, V_num * 15))

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Continuous Stirred Tank Reactors (CSTRs) feature spatial homogeneity of reactant concentrations. Reactor volume calculation: V = FA0·X / (-rA)." />
      
      <div className="g3 gap-md mb-md">
        <div><label className="field-label">Molar Feed FA0 (mol/s)</label><input className="field-input" type="number" placeholder="e.g. 2" value={vals.FA0} onChange={e => set('FA0', e.target.value)} /></div>
        <div><label className="field-label">Conversion X (%)</label><input className="field-input" type="number" placeholder="e.g. 80" value={vals.X} onChange={e => set('X', e.target.value)} /></div>
        <div><label className="field-label">Inlet Feed CA0 (mol/m³)</label><input className="field-input" type="number" placeholder="e.g. 1000" value={vals.CA0} onChange={e => set('CA0', e.target.value)} /></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div><label className="field-label">Rate Constant k</label><input className="field-input" type="number" placeholder="e.g. 0.05" value={vals.k} onChange={e => set('k', e.target.value)} /></div>
        <div>
          <label className="field-label">Reaction Order</label>
          <select className="field-select" value={vals.order} onChange={e => set('order', e.target.value)}>
            <option value="0">0th Order (r = k)</option>
            <option value="1">1st Order (r = k·CA)</option>
            <option value="2">2nd Order (r = k·CA²)</option>
          </select>
        </div>
      </div>

      <button className="btn btn-accent w-full mb-md" onClick={calculate} style={{ padding: 12 }}>Compile CSTR Design</button>

      {result && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span className="result-eyebrow">CSTR Reactor Design Results</span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '12px' }}>
            <div className="g2 gap-md">
              <ResCell label="Reactor Volume V" val={result.V} unit="m³" accent="var(--accent)" />
              <ResCell label="Residence Time τ" val={result.tau} unit="s" accent="#38BDF8" />
              <ResCell label="Outlet Concentration CA" val={result.CA} unit="mol/m³" accent="#FBBF24" />
              <ResCell label="Reaction Rate -rA" val={result.rA} unit="mol/m³·s" accent="#FF4D6A" />
            </div>

            {/* CSTR Dynamic SVG */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '0.58rem', color: '#64748b', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                CSTR Real-Time Physics
              </div>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: 'block' }}>
                {/* Pipes */}
                <path d="M 0 18 L 45 18 L 45 35" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
                <path d="M 12 18 L 6 14 L 6 22 Z" fill="#38BDF8" />
                <path d="M 75 75 L 100 75" fill="none" stroke={liquidColor} strokeWidth="2.5" />
                <path d="M 94 75 L 88 71 L 88 79 Z" fill={liquidColor} />

                {/* Vessel */}
                <rect x="25" y="32" width="50" height="50" rx="8" ry="8" fill="rgba(30,41,59,0.2)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

                {/* Fluid level */}
                <rect x="26" y={81 - liquidHeight} width="48" height={liquidHeight} rx="3" ry="3" fill={liquidColor} opacity="0.65" style={{ transition: 'all 0.4s var(--ease)' }} />

                {/* Agitator shaft */}
                <line x1="50" y1="12" x2="50" y2="68" stroke="#94A3B8" strokeWidth="2" />
                {/* Motor Top */}
                <rect x="42" y="5" width="16" height="8" rx="1.5" ry="1.5" fill="#475569" stroke="#334155" strokeWidth="0.8" />

                {/* Agitator blades spinning */}
                <g style={{ transformOrigin: '50px 68px', animation: 'spin-blades 2.5s linear infinite' }}>
                  <rect x="36" y="66" width="28" height="3" rx="0.5" ry="0.5" fill="#E2E8F0" />
                  <rect x="48" y="58" width="4" height="15" rx="0.5" ry="0.5" fill="#64748B" opacity="0.4" />
                </g>
              </svg>
              <style>{`
                @keyframes spin-blades {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <div style={{ fontSize: '0.62rem', color: 'var(--accent)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                Level: {(liquidHeight/48*100).toFixed(0)}% · Agitator ON
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button className="btn btn-accent w-full" onClick={exportToPFD} style={{ fontSize: '0.78rem' }}>
              🚀 Export Reactor to PFD Builder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PFR() {
  const [vals, setVals] = useState({ FA0: '2', X: '80', k: '0.05', CA0: '1000', order: '1' })
  const [result, setResult] = useState(null)
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const calculate = () => {
    const FA0 = parseFloat(vals.FA0)
    const X = parseFloat(vals.X) / 100
    const k = parseFloat(vals.k)
    const CA0 = parseFloat(vals.CA0)
    const order = parseInt(vals.order)
    if ([FA0, X, k, CA0].some(isNaN)) return

    const v0 = FA0 / CA0
    let V, tau

    if (order === 0) {
      V = FA0 * X / k
    } else if (order === 1) {
      V = (FA0 / (k * CA0)) * (-Math.log(1 - X))
    } else if (order === 2) {
      V = (FA0 / (k * CA0 * CA0)) * (X / (1 - X))
    }

    tau = V / v0
    const CA = CA0 * (1 - X)
    setResult({ V, tau, CA })
  }

  const X_num = parseFloat(vals.X) || 0
  const gradientIn = '#38bdf8'
  const gradientOut = `hsl(${Math.max(35, 200 - X_num * 1.65)}, 75%, 45%)`

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Plug Flow Reactors (PFRs) model chemical kinetics progressing along length profiles. Volume calculation: V = FA0 ∫ dX / (-rA)." />
      
      <div className="g3 gap-md mb-md">
        <div><label className="field-label">Molar Feed FA0 (mol/s)</label><input className="field-input" type="number" placeholder="e.g. 2" value={vals.FA0} onChange={e => set('FA0', e.target.value)} /></div>
        <div><label className="field-label">Conversion X (%)</label><input className="field-input" type="number" placeholder="e.g. 80" value={vals.X} onChange={e => set('X', e.target.value)} /></div>
        <div><label className="field-label">Inlet Feed CA0 (mol/m³)</label><input className="field-input" type="number" placeholder="e.g. 1000" value={vals.CA0} onChange={e => set('CA0', e.target.value)} /></div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div><label className="field-label">Rate Constant k</label><input className="field-input" type="number" placeholder="e.g. 0.05" value={vals.k} onChange={e => set('k', e.target.value)} /></div>
        <div>
          <label className="field-label">Reaction Order</label>
          <select className="field-select" value={vals.order} onChange={e => set('order', e.target.value)}>
            <option value="0">0th Order</option>
            <option value="1">1st Order</option>
            <option value="2">2nd Order</option>
          </select>
        </div>
      </div>

      <button className="btn btn-accent w-full mb-md" onClick={calculate} style={{ padding: 12 }}>Compile PFR Design</button>

      {result && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span className="result-eyebrow">PFR Reactor Design Results</span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '12px' }}>
            <div className="g3 gap-md">
              <ResCell label="Reactor Volume V" val={result.V} unit="m³" accent="var(--accent)" />
              <ResCell label="Residence Time τ" val={result.tau} unit="s" accent="#38BDF8" />
              <ResCell label="Outlet Concentration CA" val={result.CA} unit="mol/m³" accent="#FBBF24" />
            </div>

            {/* PFR SVG Diagram */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: '0.58rem', color: '#64748b', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>Tubular Concentration profile</div>
              
              <svg viewBox="0 0 100 50" style={{ width: '90%', height: 'auto' }}>
                <defs>
                  <linearGradient id="pfrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={gradientIn} />
                    <stop offset="100%" stopColor={gradientOut} />
                  </linearGradient>
                </defs>
                {/* Tube PFR */}
                <rect x="15" y="15" width="70" height="20" rx="3" fill="url(#pfrGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                {/* Flow lines */}
                <path d="M 5 25 H 15 M 85 25 H 95" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3,1" />
                <polygon points="95,25 90,22 90,28" fill="var(--accent)" />
                <text x="5" y="11" fill="#38bdf8" fontSize="5" fontFamily="monospace">In: CA0</text>
                <text x="75" y="11" fill="var(--accent)" fontSize="5" fontFamily="monospace">Out: CA</text>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Batch() {
  const [vals, setVals] = useState({ CA0: '1000', X: '90', k: '0.01', order: '1' })
  const [result, setResult] = useState(null)
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const calculate = () => {
    const CA0 = parseFloat(vals.CA0)
    const X = parseFloat(vals.X) / 100
    const k = parseFloat(vals.k)
    const order = parseInt(vals.order)
    if ([CA0, X, k].some(isNaN)) return

    let t
    if (order === 0) t = CA0 * X / k
    else if (order === 1) t = -Math.log(1 - X) / k
    else if (order === 2) t = X / (k * CA0 * (1 - X))

    const CA = CA0 * (1 - X)
    const halfLife = order === 1 ? Math.log(2) / k : order === 0 ? CA0 / (2 * k) : 1 / (k * CA0)

    setResult({ t, CA, halfLife })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Batch reactors run kinetics over time frames in closed-loop configurations. No inlet/outlet flows exist. t = ∫ dX / (-rA)." />
      
      <div className="g3 gap-md mb-md">
        <div><label className="field-label">Initial CA0 (mol/m³)</label><input className="field-input" type="number" placeholder="e.g. 1000" value={vals.CA0} onChange={e => set('CA0', e.target.value)} /></div>
        <div><label className="field-label">Conversion X (%)</label><input className="field-input" type="number" placeholder="e.g. 90" value={vals.X} onChange={e => set('X', e.target.value)} /></div>
        <div><label className="field-label">Rate Constant k</label><input className="field-input" type="number" placeholder="e.g. 0.01" value={vals.k} onChange={e => set('k', e.target.value)} /></div>
      </div>
      
      <div className="mb-md">
        <label className="field-label">Reaction Order</label>
        <select className="field-select" value={vals.order} onChange={e => set('order', e.target.value)}>
          <option value="0">0th Order</option>
          <option value="1">1st Order</option>
          <option value="2">2nd Order</option>
        </select>
      </div>

      <button className="btn btn-accent w-full mb-md" onClick={calculate} style={{ padding: 12 }}>Compile Batch Kinetics</button>

      {result && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span className="result-eyebrow">Batch Reactor Kinetics Results</span>
          <div className="g4 gap-md mt-md">
            <ResCell label="Reaction Time Required" val={result.t} unit="s" accent="var(--accent)" />
            <ResCell label="Reaction Time Required" val={result.t / 60} unit="min" accent="#38BDF8" />
            <ResCell label="Final Concentration CA" val={result.CA} unit="mol/m³" accent="#FBBF24" />
            <ResCell label="Half-Life t½" val={result.halfLife} unit="s" accent="#a855f7" />
          </div>
        </div>
      )}
    </div>
  )
}

function Arrhenius() {
  const [vals, setVals] = useState({ A: '1e8', Ea: '75', T: '100', k1: '0.05', T1: '25', T2: '80' })
  const [mode, setMode] = useState('find_k')
  const [result, setResult] = useState(null)
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))
  const R = 8.314

  const calculate = () => {
    if (mode === 'find_k') {
      const A = parseFloat(vals.A), Ea = parseFloat(vals.Ea) * 1000, T = parseFloat(vals.T) + 273.15
      if ([A, Ea, T].some(isNaN)) return
      const k = A * Math.exp(-Ea / (R * T))
      setResult({ k, label: 'Rate Constant k' })
    } else {
      const k1 = parseFloat(vals.k1), T1 = parseFloat(vals.T1) + 273.15, T2 = parseFloat(vals.T2) + 273.15, Ea = parseFloat(vals.Ea) * 1000
      if ([k1, T1, T2, Ea].some(isNaN)) return
      const k2 = k1 * Math.exp(-Ea / R * (1 / T2 - 1 / T1))
      setResult({ k2, ratio: k2 / k1 })
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="The Arrhenius Equation k = A·exp(−Ea/RT) models temperature reliance of the reaction kinetic rate constant k." />
      
      <div className="os-tabs" style={{ marginBottom: 16 }}>
        <button className={`os-tab ${mode === 'find_k' ? 'active' : ''}`} onClick={() => { setMode('find_k'); setResult(null) }}>🌡️ Find k at Temperature</button>
        <button className={`os-tab ${mode === 'compare' ? 'active' : ''}`} onClick={() => { mode === 'compare' ? null : (setMode('compare'), setResult(null)) }}>🔄 Compare k at Two Temps</button>
      </div>

      {mode === 'find_k' ? (
        <div className="g3 gap-md mb-md">
          <div><label className="field-label">Pre-exponential A</label><input className="field-input" type="number" placeholder="e.g. 1e8" value={vals.A} onChange={e => set('A', e.target.value)} /></div>
          <div><label className="field-label">Activation Ea (kJ/mol)</label><input className="field-input" type="number" placeholder="e.g. 75" value={vals.Ea} onChange={e => set('Ea', e.target.value)} /></div>
          <div><label className="field-label">Temperature T (°C)</label><input className="field-input" type="number" placeholder="e.g. 100" value={vals.T} onChange={e => set('T', e.target.value)} /></div>
        </div>
      ) : (
        <div className="g4 gap-md mb-md">
          <div><label className="field-label">Rate constant k₁</label><input className="field-input" type="number" placeholder="e.g. 0.05" value={vals.k1} onChange={e => set('k1', e.target.value)} /></div>
          <div><label className="field-label">Activation Ea (kJ/mol)</label><input className="field-input" type="number" placeholder="e.g. 75" value={vals.Ea} onChange={e => set('Ea', e.target.value)} /></div>
          <div><label className="field-label">Temperature T₁ (°C)</label><input className="field-input" type="number" placeholder="e.g. 25" value={vals.T1} onChange={e => set('T1', e.target.value)} /></div>
          <div><label className="field-label">Temperature T₂ (°C)</label><input className="field-input" type="number" placeholder="e.g. 80" value={vals.T2} onChange={e => set('T2', e.target.value)} /></div>
        </div>
      )}

      <button className="btn btn-accent w-full mb-md" onClick={calculate} style={{ padding: 12 }}>Calculate Rate Constants</button>

      {result && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span className="result-eyebrow">Arrhenius Kinetics Results</span>
          {result.k !== undefined && (
            <div className="g1 mt-md">
              <ResCell label="Rate Constant k" val={result.k} unit="s⁻¹" accent="var(--accent)" />
            </div>
          )}
          {result.k2 !== undefined && (
            <div className="g2 gap-md mt-md">
              <ResCell label="k₂ at T₂" val={result.k2} unit="s⁻¹" accent="#38BDF8" />
              <ResCell label="k₂/k₁ Ratio" val={result.ratio} unit="×" accent="#a855f7" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}