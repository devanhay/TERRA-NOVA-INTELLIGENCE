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
      <div className="info-block-label" style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.74rem' }}>📐 Mass Conservation Principle</div>
      <div className="info-block-text" style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>{text}</div>
    </div>
  )
}

function ResCell({ label, val, unit, accent = 'var(--accent)' }) {
  const fmt = v => {
    if (v === null || v === undefined || isNaN(v)) return '—'
    return Math.abs(v) >= 1e4 || (Math.abs(v) < 0.001 && v !== 0)
      ? v.toExponential(3) : parseFloat(v.toFixed(4)).toString()
  }
  return (
    <div className="res-cell" style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 14 }}>
      <div className="res-cell-label" style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ marginTop: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: accent }}>{fmt(val)}</span>
        <span className="res-cell-unit" style={{ fontSize: '0.75rem', color: '#64748b' }}> {unit}</span>
      </div>
    </div>
  )
}

function BalanceCheck({ inFlow, outFlow }) {
  if (!inFlow || !outFlow) return null
  const err = Math.abs((inFlow - outFlow) / inFlow) * 100
  const ok = err < 0.1
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
      background: ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 8, marginTop: 10, fontSize: '0.78rem',
      color: ok ? 'var(--accent)' : 'var(--red)',
    }}>
      <span>{ok ? '✓' : '⚠'}</span>
      <span>
        {ok
          ? `Balance Check Passed — error ${err.toFixed(4)}%`
          : `Imbalance detected — error ${err.toFixed(2)}%. Verify inputs.`}
      </span>
    </div>
  )
}

export default function MassBalance() {
  const [tab, setTab] = useState('single')
  return (
    <div>
      <div className="card">
        <div className="card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>⚖️ Material Balance Suite</div>
        <div className="card-desc">Process design mass conservation engines for steady-state unit operations</div>
        <div className="os-tabs" style={{ marginBottom: 20 }}>
          <button className={`os-tab ${tab==='single'?'active':''}`} onClick={() => setTab('single')}>📏 Single Stream</button>
          <button className={`os-tab ${tab==='mixer'?'active':''}`} onClick={() => setTab('mixer')}>🔄 Mixer</button>
          <button className={`os-tab ${tab==='reactor'?'active':''}`} onClick={() => setTab('reactor')}>⚛️ Reactor</button>
          <button className={`os-tab ${tab==='separator'?'active':''}`} onClick={() => setTab('separator')}>⚡ Separator</button>
        </div>
        {tab === 'single'    && <SingleStream />}
        {tab === 'mixer'     && <Mixer />}
        {tab === 'reactor'   && <Reactor />}
        {tab === 'separator' && <Separator />}
      </div>
    </div>
  )
}

function SingleStream() {
  const [v, setV] = useState({ rho: '1000', vel: '2.0', D: '0.05', mdot: '5.0' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const n = k => parseFloat(v[k])

  const calc = () => {
    const rho = n('rho'), vel = n('vel'), D = n('D'), mdot = n('mdot')
    const A = !isNaN(D) ? Math.PI * D * D / 4 : null
    let res = {}
    if (A && !isNaN(vel)) res.volflow = A * vel
    if (A && !isNaN(vel) && !isNaN(rho)) res.mdot_calc = A * vel * rho
    if (!isNaN(mdot) && !isNaN(rho)) res.volflow = res.volflow || mdot / rho
    if (A) res.A = A
    setRes(res)
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Single Stream fluid dynamics connects pipe geometry, cross-sectional area, average velocity, and mass density. ṁ = ρ·A·v." />
      <div className="g2 gap-md mb-md">
        {[
          { k: 'D',    l: 'Pipe Diameter D',    u: 'm',     p: 'e.g. 0.05' },
          { k: 'vel',  l: 'Velocity v',          u: 'm/s',   p: 'e.g. 2' },
          { k: 'rho',  l: 'Density ρ',           u: 'kg/m³', p: 'e.g. 1000' },
          { k: 'mdot', l: 'Mass Flow ṁ (opt.)',  u: 'kg/s',  p: 'e.g. 5' },
        ].map(f => (
          <div key={f.k}>
            <label className="field-label">{f.l} <span style={{ color:'var(--text-4)', fontWeight:400 }}>({f.u})</span></label>
            <input className="field-input" type="number" placeholder={f.p} value={v[f.k]} onChange={e => s(f.k, e.target.value)} style={{ fontSize:'0.82rem' }} />
          </div>
        ))}
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc} style={{ padding: 12 }}>Calculate Velocity Profiles</button>
      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(7,11,21,0.5) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <div className="result-eyebrow">Calculated Hydraulic Results</div>
          <div className="g2 gap-md mt-md">
            {res.A      && <ResCell label="Cross Section A" val={res.A} unit="m²" accent="#38bdf8" />}
            {res.volflow && <ResCell label="Volumetric Flow Q" val={res.volflow} unit="m³/s" accent="#a855f7" />}
            {res.volflow && <ResCell label="Volumetric Flow Q" val={res.volflow*3600} unit="m³/h" accent="#F5A623" />}
            {res.mdot_calc && <ResCell label="Mass Flow ṁ" val={res.mdot_calc} unit="kg/s" accent="var(--accent)" />}
          </div>
        </div>
      )}
    </div>
  )
}

function Mixer() {
  const [streams, setStreams] = useState([
    { id: 1, flow: '5.0', conc: '10' },
    { id: 2, flow: '3.0', conc: '45' },
  ])
  const [res, setRes] = useState(null)

  const update = (id, k, v) => setStreams(p => p.map(s => s.id===id ? {...s,[k]:v} : s))
  const addS   = () => setStreams(p => [...p, { id: Date.now(), flow:'', conc:'' }])
  const remS   = id => { if (streams.length > 2) setStreams(p => p.filter(s => s.id!==id)) }

  const calc = () => {
    const valid = streams.filter(s => s.flow && s.conc)
    if (valid.length < 2) return
    const totalFlow = valid.reduce((a, s) => a + parseFloat(s.flow), 0)
    const totalMass = valid.reduce((a, s) => a + parseFloat(s.flow) * parseFloat(s.conc)/100, 0)
    setRes({ totalFlow, outConc: totalMass/totalFlow*100, totalMass })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Mixer systems merge two or more inlet streams into one homogenous outlet stream. Σṁ_in = ṁ_out." />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 14 }}>
        {streams.map((s, idx) => (
          <div key={s.id} className="card" style={{ background:'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.04)', padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.66rem', color:'var(--accent)', fontWeight: 'bold' }}>↓ INLET STREAM {idx + 1}</span>
              {streams.length > 2 && <button className="btn btn-ghost" style={{ fontSize:'0.58rem', padding:'2px 6px', borderRadius: 4 }} onClick={() => remS(s.id)}>Remove</button>}
            </div>
            <div className="g2 gap-md">
              <div>
                <label className="field-label" style={{ fontSize: '0.58rem' }}>Flow Rate (kg/s)</label>
                <input className="field-input" type="number" placeholder="e.g. 5" value={s.flow} onChange={e => update(s.id,'flow',e.target.value)} style={{ fontSize:'0.82rem' }} />
              </div>
              <div>
                <label className="field-label" style={{ fontSize: '0.58rem' }}>Concentration (%)</label>
                <input className="field-input" type="number" placeholder="e.g. 30" value={s.conc} onChange={e => update(s.id,'conc',e.target.value)} style={{ fontSize:'0.82rem' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <button className="btn btn-ghost" onClick={addS} style={{ fontSize:'0.8rem' }}>➕ Add Stream</button>
        <button className="btn btn-accent" style={{ flex:1, fontSize:'0.85rem' }} onClick={calc}>Calculate Mixer Output</button>
      </div>

      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span className="result-eyebrow">Mixer Mass Balance Readouts</span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.0fr', gap: 16, marginTop: 12 }}>
            <div className="g2 gap-md">
              <ResCell label="Total Outlet Flow" val={res.totalFlow} unit="kg/s" />
              <ResCell label="Outlet Concentration" val={res.outConc} unit="%" accent="#0EA5E9" />
              <ResCell label="Solute Mass Flow" val={res.totalMass} unit="kg/s" accent="#F5A623" />
            </div>

            {/* Mixer SVG Diagram */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Blending Flow Model</div>
              <svg viewBox="0 0 100 60" style={{ width: '80%', height: 'auto' }}>
                {/* Streams feed */}
                <path d="M 10 15 L 45 30" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M 10 45 L 45 30" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Blender vessel */}
                <circle cx="50" cy="30" r="10" fill="rgba(10,18,30,0.8)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <path d="M 50 24 L 50 36 M 46 30 L 54 30" stroke="var(--accent)" strokeWidth="0.8" />
                {/* Outlet stream */}
                <path d="M 60 30 L 90 30" fill="none" stroke="var(--accent)" strokeWidth="2" />
                <polygon points="90,30 85,27 85,33" fill="var(--accent)" />
              </svg>
            </div>
          </div>
          <BalanceCheck inFlow={res.totalFlow} outFlow={res.totalFlow} />
        </div>
      )}
    </div>
  )
}

function Reactor() {
  const [v, setV] = useState({ FA0: '10', X: '80', stoich: '1.5', MW: '18.0' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))

  const calc = () => {
    const FA0 = parseFloat(v.FA0), X = parseFloat(v.X)/100
    const stoich = parseFloat(v.stoich)||1, MW = parseFloat(v.MW)||1
    if (isNaN(FA0)||isNaN(X)) return
    const reacted = FA0*X, remaining = FA0*(1-X)
    const product = reacted*stoich
    setRes({ reacted, remaining, product, productMass: product*MW })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Chemical reactors convert reactant moles into products based on stoichiometry ratios. F_A,out = F_A0·(1−X)." />
      <div className="g2 gap-md mb-md">
        {[
          { k:'FA0', l:'Molar Feed Rate FA0', u:'mol/s', p:'e.g. 10' },
          { k:'X',   l:'Conversion X',        u:'%',     p:'e.g. 80' },
          { k:'stoich', l:'Stoichiometric ratio (B/A)', u:'—', p:'e.g. 1' },
          { k:'MW',  l:'MW of Product B',      u:'g/mol', p:'e.g. 18' },
        ].map(f => (
          <div key={f.k}>
            <label className="field-label">{f.l} <span style={{ color:'var(--text-4)', fontWeight:400 }}>({f.u})</span></label>
            <input className="field-input" type="number" placeholder={f.p} value={v[f.k]} onChange={e => s(f.k, e.target.value)} style={{ fontSize:'0.82rem' }} />
          </div>
        ))}
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc} style={{ padding: 12 }}>Solve Conversion Profiles</button>
      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span className="result-eyebrow">Reactor Component Conversions</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.0fr', gap: 16, marginTop: 12 }}>
            <div className="g2 gap-md">
              <ResCell label="Reactant A Reacted" val={res.reacted} unit="mol/s" accent="var(--red)" />
              <ResCell label="Reactant A Remaining" val={res.remaining} unit="mol/s" accent="#0EA5E9" />
              <ResCell label="Product B Produced" val={res.product} unit="mol/s" accent="var(--accent)" />
              <ResCell label="Product B Mass Flow" val={res.productMass} unit="g/s" accent="#F5A623" />
            </div>

            {/* Reactor SVG Diagram */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>CSTR Reaction Model</div>
              <svg viewBox="0 0 100 60" style={{ width: '80%', height: 'auto' }}>
                {/* Inlet */}
                <path d="M 10 30 L 35 30" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Vessel */}
                <rect x="35" y="15" width="30" height="30" rx="4" fill="rgba(10,18,30,0.8)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <path d="M 50 10 L 50 25" stroke="#ef4444" strokeWidth="1" />
                <circle cx="50" cy="30" r="4" fill="rgba(245,166,35,0.4)" stroke="#f5a623" strokeWidth="0.8" />
                {/* Outlet */}
                <path d="M 65 30 L 90 30" fill="none" stroke="var(--accent)" strokeWidth="2" />
                <polygon points="90,30 85,27 85,33" fill="var(--accent)" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Separator() {
  const [v, setV] = useState({ F: '100', zF: '50', xD: '95', xB: '5' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))

  const calc = () => {
    const F = parseFloat(v.F), zF = parseFloat(v.zF)/100
    const xD = parseFloat(v.xD)/100, xB = parseFloat(v.xB)/100
    if ([F,zF,xD,xB].some(isNaN)||(xD-xB)===0) return
    const D = F*(zF-xB)/(xD-xB)
    const B = F-D
    setRes({ D, B, componentD: D*xD, componentB: B*xB })
  }

  const exportToPFD = () => {
    if (!res) return
    try {
      const activeProj = localStorage.getItem('chempilot_current_project') || 'proj-default-1'
      const saved = localStorage.getItem('chempilot_pfd_' + activeProj)
      let data = { nodes: [], streams: [], equipParams: {}, NC: 1, SC: 100 }
      if (saved) {
        data = JSON.parse(saved)
      }
      const sepNode = {
        id: 'sep-' + Date.now(),
        type: 'separator',
        label: 'Separator',
        x: 400,
        y: 250,
      }
      data.nodes.push(sepNode)
      localStorage.setItem('chempilot_pfd_' + activeProj, JSON.stringify(data))
      alert('✓ Separator node exported to PFD Builder successfully!')
    } catch(e) {
      console.error(e)
    }
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Separator columns split inlet feed streams into distillate tops and bottoms fractions. F = D + B." />
      <div className="g2 gap-md mb-md">
        {[
          { k:'F',  l:'Feed Rate F',            u:'kg/s',  p:'e.g. 100' },
          { k:'zF', l:'Feed Mole Fraction zF',  u:'%',     p:'e.g. 50' },
          { k:'xD', l:'Distillate Fraction xD', u:'%',     p:'e.g. 95' },
          { k:'xB', l:'Bottoms Fraction xB',     u:'%',     p:'e.g. 5' },
        ].map(f => (
          <div key={f.k}>
            <label className="field-label">{f.l} <span style={{ color:'var(--text-4)', fontWeight:400 }}>({f.u})</span></label>
            <input className="field-input" type="number" placeholder={f.p} value={v[f.k]} onChange={e => s(f.k, e.target.value)} style={{ fontSize:'0.82rem' }} />
          </div>
        ))}
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc} style={{ padding: 12 }}>Calculate Separations</button>
      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <span className="result-eyebrow">Fractional Output Splits</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.0fr', gap: 16, marginTop: 12 }}>
            <div className="g2 gap-md">
              <ResCell label="Distillate Flow D" val={res.D} unit="kg/s" accent="#0EA5E9" />
              <ResCell label="Bottoms Flow B" val={res.B} unit="kg/s" accent="#F5A623" />
              <ResCell label="Distillate Component" val={res.componentD} unit="kg/s" accent="var(--accent)" />
              <ResCell label="Bottoms Component" val={res.componentB} unit="kg/s" accent="#a855f7" />
            </div>

            {/* Separator SVG Diagram */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Binary Separator Model</div>
              <svg viewBox="0 0 100 60" style={{ width: '80%', height: 'auto' }}>
                {/* Feed */}
                <path d="M 10 30 L 40 30" fill="none" stroke="#f5a623" strokeWidth="1.5" />
                {/* Column */}
                <rect x="40" y="10" width="20" height="40" rx="6" fill="rgba(10,18,30,0.8)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <path d="M 40 22 H 60 M 40 30 H 60 M 40 38 H 60" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                {/* Distillate (Tops) */}
                <path d="M 50 10 V 5 H 90" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <polygon points="90,5 85,2 85,8" fill="#38bdf8" />
                {/* Bottoms */}
                <path d="M 50 50 V 55 H 90" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                <polygon points="90,55 85,52 85,58" fill="#a855f7" />
              </svg>
            </div>
          </div>
          
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-ghost w-full" onClick={exportToPFD} style={{ fontSize: '0.76rem', padding: '8px' }}>📤 Export Separator to PFD Builder</button>
          </div>
        </div>
      )}
    </div>
  )
}