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
      <div className="info-block-label" style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.74rem' }}>📐 Thermodynamic Principle</div>
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

const CP_DATA = {
  'Water (liquid)': 4186, 'Steam': 2010, 'Air': 1005,
  'Nitrogen (N₂)': 1040, 'Oxygen (O₂)': 920, 'CO₂': 844,
  'Methane (CH₄)': 2220, 'Ethanol': 2440, 'Benzene': 1740,
  'Crude Oil (approx)': 2000, 'Iron/Steel': 460, 'Aluminum': 900,
}

const LATENT_DATA = {
  'Water → Steam (100°C)': 2257000,
  'Water → Ice (0°C)': 334000,
  'Ethanol → Vapor (78°C)': 841000,
  'Benzene → Vapor (80°C)': 394000,
  'Ammonia → Vapor (−33°C)': 1371000,
  'Methane → Vapor (−161°C)': 510000,
}

export default function EnergyBalance() {
  const [tab, setTab] = useState('sensible')
  return (
    <div>
      <div className="card">
        <div className="card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>🔥 Energy Balance Suite</div>
        <div className="card-desc">Rigorous enthalpy calculation and heat integration diagnostics (Q − W = ΔH)</div>
        <div className="os-tabs" style={{ marginBottom: 20 }}>
          <button className={`os-tab ${tab==='sensible' ?'active':''}`} onClick={() => setTab('sensible')}>🌡️ Sensible Heat</button>
          <button className={`os-tab ${tab==='latent'   ?'active':''}`} onClick={() => setTab('latent')}>⚗️ Latent Heat</button>
          <button className={`os-tab ${tab==='heatex'   ?'active':''}`} onClick={() => setTab('heatex')}>🔄 Heat Exchanger</button>
          <button className={`os-tab ${tab==='combustion'?'active':''}`} onClick={() => setTab('combustion')}>💥 Combustion</button>
        </div>
        {tab === 'sensible'   && <SensibleHeat />}
        {tab === 'latent'     && <LatentHeat />}
        {tab === 'heatex'     && <HeatExchanger />}
        {tab === 'combustion' && <Combustion />}
      </div>
    </div>
  )
}

function SensibleHeat() {
  const [substance, setSubstance] = useState('Water (liquid)')
  const [customCp, setCustomCp]   = useState('')
  const [v, setV] = useState({ mass: '5', T1: '25', T2: '80' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))

  const getCp = () => substance === 'Custom' ? parseFloat(customCp) : CP_DATA[substance]

  const calc = () => {
    const m = parseFloat(v.mass), T1 = parseFloat(v.T1), T2 = parseFloat(v.T2), Cp = getCp()
    if ([m,T1,T2,Cp].some(isNaN)) return
    const Q = m*Cp*(T2-T1)
    setRes({ Q, Qkw:Q/1000, dT:T2-T1, Cp, direction: Q>0?'Heating Duty':'Cooling Duty' })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Sensible Heat describes thermodynamic heat input required to alter system temperature without inducing phase changes. Q = ṁ·Cp·ΔT." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="field-label">Substance</label>
          <select className="field-select" value={substance} onChange={e => { setSubstance(e.target.value); setRes(null) }}>
            {[...Object.keys(CP_DATA), 'Custom'].map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          {substance !== 'Custom' ? (
            <div>
              <label className="field-label">Constant Pressure Cp</label>
              <div className="field-input" style={{ background: 'rgba(30,41,59,0.3)', color: '#64748b' }}>
                {CP_DATA[substance].toLocaleString()} J/kg·K
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label">Custom Cp (J/kg·K)</label>
              <input className="field-input" type="number" placeholder="e.g. 2500" value={customCp} onChange={e => setCustomCp(e.target.value)} />
            </div>
          )}
        </div>
      </div>
      <div className="g3 gap-md mb-md">
        {[
          { k:'mass', l:'Mass Flow ṁ', u:'kg/s', p:'e.g. 5' },
          { k:'T1',   l:'Inlet Temp T₁', u:'°C', p:'e.g. 25' },
          { k:'T2',   l:'Outlet Temp T₂', u:'°C', p:'e.g. 80' },
        ].map(f => (
          <div key={f.k}>
            <label className="field-label">{f.l} <span style={{ fontWeight:400, color:'var(--text-4)' }}>({f.u})</span></label>
            <input className="field-input" type="number" placeholder={f.p} value={v[f.k]} onChange={e => s(f.k, e.target.value)} style={{ fontSize:'0.82rem' }} />
          </div>
        ))}
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc} style={{ padding: 12 }}>Calculate Enthalpy Change</button>
      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(7,11,21,0.5) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="result-eyebrow">Thermodynamic Sensible Results</span>
            <span style={{
              background: res.Q > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${res.Q > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              color: res.Q > 0 ? '#ef4444' : 'var(--accent)',
              fontSize: '0.6rem', padding: '3px 8px', borderRadius: 4, fontWeight: 'bold'
            }}>{res.direction.toUpperCase()}</span>
          </div>
          <div className="g3 gap-md mt-md">
            <ResCell label="Heat Duty Q" val={Math.abs(res.Q)} unit="W" />
            <ResCell label="Heat Duty Q" val={Math.abs(res.Qkw)} unit="kW" accent="#0EA5E9" />
            <ResCell label="ΔT (Diff)" val={res.dT} unit="°C" accent="#F5A623" />
          </div>
          <div className="formula-block" style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
            Q = ṁ × Cp × ΔT = {v.mass} × {res.Cp} × {res.dT.toFixed(1)} = {res.Q.toFixed(2)} W
          </div>
        </div>
      )}
    </div>
  )
}

function LatentHeat() {
  const [substance, setSubstance] = useState('Water → Steam (100°C)')
  const [customL, setCustomL] = useState('')
  const [mass, setMass] = useState('2')
  const [res, setRes] = useState(null)

  const getL = () => substance === 'Custom' ? parseFloat(customL) : LATENT_DATA[substance]

  const calc = () => {
    const m = parseFloat(mass), L = getL()
    if (isNaN(m)||isNaN(L)) return
    setRes({ Q:m*L, Qkw:m*L/1000, L })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Latent Heat corresponds to enthalpy inputs required to transition fluid phase states (e.g. liquid to gas) without shifting core temperature parameters. Q = ṁ·L." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="field-label">Phase Change</label>
          <select className="field-select" value={substance} onChange={e => { setSubstance(e.target.value); setRes(null) }}>
            {[...Object.keys(LATENT_DATA), 'Custom'].map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          {substance !== 'Custom' ? (
            <div>
              <label className="field-label">Latent Heat L</label>
              <div className="field-input" style={{ background: 'rgba(30,41,59,0.3)', color: '#64748b' }}>
                {(getL()/1000).toLocaleString()} kJ/kg
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label">Custom L (J/kg)</label>
              <input className="field-input" type="number" placeholder="e.g. 2257000" value={customL} onChange={e => setCustomL(e.target.value)} />
            </div>
          )}
        </div>
      </div>
      <div className="mb-md">
        <label className="field-label">Mass Flow ṁ <span style={{ fontWeight:400, color:'var(--text-4)' }}>(kg/s)</span></label>
        <input className="field-input" type="number" placeholder="e.g. 2" value={mass} onChange={e => setMass(e.target.value)} style={{ fontSize:'0.82rem' }} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc} style={{ padding: 12 }}>Calculate Latent Enthalpy</button>
      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(7,11,21,0.5) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div className="result-eyebrow">Thermodynamic Latent Results</div>
          <div className="g3 gap-md mt-md">
            <ResCell label="Heat Duty Q" val={res.Q} unit="W" />
            <ResCell label="Heat Duty Q" val={res.Qkw} unit="kW" accent="#0EA5E9" />
            <ResCell label="Latent Factor L" val={res.L/1000} unit="kJ/kg" accent="#F5A623" />
          </div>
          <div className="formula-block" style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
            Q = ṁ × L = {mass} × {res.L} = {res.Q.toFixed(2)} W
          </div>
        </div>
      )}
    </div>
  )
}

function HeatExchanger() {
  const [v, setV] = useState({ mh:'5', Thi:'120', Tho:'60', mc:'8', Tci:'20', Tco:'55', U:'500', A:'' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const n = k => parseFloat(v[k])

  const calc = () => {
    const mh=n('mh'), Thi=n('Thi'), Tho=n('Tho'), mc=n('mc'), Tci=n('Tci'), Tco=n('Tco')
    const Cp = 4186
    const Qh = mh*Cp*(Thi-Tho), Qc = mc*Cp*(Tco-Tci)
    const dT1 = Thi-Tco, dT2 = Tho-Tci
    const lmtd = dT1===dT2 ? dT1 : (dT1-dT2)/Math.log(Math.abs(dT1/dT2))
    const U = n('U')||500
    const A_req = Qh/(U*lmtd)
    setRes({ Qh, Qc, lmtd, A_req, balanced: Math.abs(Qh-Qc)/Qh < 0.15 })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Heat Exchangers transfer thermal enthalpy between hot and cold fluid streams. Q = U·A·LMTD. Ideally, hot heat release balances cold absorption (Qh ≈ Qc)." />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
        {/* Hot stream */}
        <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.66rem', color:'#ef4444', fontWeight: 'bold', marginBottom:10 }}>🔴 HOT FLUID SIDE</div>
          <div className="g2 gap-md">
            <Field label="Hot Flow ṁₕ" unit="kg/s" value={v.mh} onChange={val => s('mh',val)} />
            <div />
            <Field label="Inlet Tₕᵢ" unit="°C" value={v.Thi} onChange={val => s('Thi',val)} />
            <Field label="Outlet Tₕₒ" unit="°C" value={v.Tho} onChange={val => s('Tho',val)} />
          </div>
        </div>

        {/* Cold stream */}
        <div style={{ background: 'rgba(56,189,248,0.03)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.66rem', color:'#38bdf8', fontWeight: 'bold', marginBottom:10 }}>🔵 COLD FLUID SIDE</div>
          <div className="g2 gap-md">
            <Field label="Cold Flow ṁc" unit="kg/s" value={v.mc} onChange={val => s('mc',val)} />
            <div />
            <Field label="Inlet T꜀ᵢ" unit="°C" value={v.Tci} onChange={val => s('Tci',val)} />
            <Field label="Outlet T꜀ₒ" unit="°C" value={v.Tco} onChange={val => s('Tco',val)} />
          </div>
        </div>
      </div>

      <div className="mb-md">
        <label className="field-label">Overall Heat Transfer Coefficient U <span style={{ fontWeight:400, color:'var(--text-4)' }}>(W/m²·K)</span></label>
        <input className="field-input" type="number" placeholder="default 500" value={v.U} onChange={e => s('U',e.target.value)} style={{ fontSize:'0.82rem' }} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc} style={{ padding: 12 }}>Design Heat Exchanger</button>

      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.05) 0%, rgba(7,11,21,0.55) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="result-eyebrow">HX Performance & Area Profiles</span>
            <span style={{
              background: res.balanced ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${res.balanced ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: res.balanced ? 'var(--accent)' : '#ef4444',
              fontSize: '0.6rem', padding: '3px 8px', borderRadius: 4, fontWeight: 'bold'
            }}>{res.balanced ? '✓ STEADY STATE OK' : '⚠ HEAT LOSS DETECTED'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginTop: 14 }}>
            <div className="g2 gap-md">
              <ResCell label="Hot Duty Qₕ" val={res.Qh/1000} unit="kW" accent="#ef4444" />
              <ResCell label="Cold Duty Q꜀" val={res.Qc/1000} unit="kW" accent="#38bdf8" />
              <ResCell label="LMTD" val={res.lmtd} unit="°C" accent="#F5A623" />
              <ResCell label="Required Area A" val={res.A_req} unit="m²" accent="#a855f7" />
            </div>
            
            {/* Visual SVG counter-current flow schematic */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>Counter-current Diagram</div>
              <svg viewBox="0 0 160 80" style={{ width: '100%', height: 'auto' }}>
                {/* Hot Fluid Line (Left to Right) */}
                <path d="M 10 25 L 150 25" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
                <polygon points="150,25 145,22 145,28" fill="#ef4444" />
                <text x="14" y="20" fill="#ef4444" fontSize="6" fontFamily="monospace">Thi: {v.Thi}°C</text>
                <text x="110" y="20" fill="#ef4444" fontSize="6" fontFamily="monospace">Tho: {v.Tho}°C</text>

                {/* Shell Body */}
                <rect x="30" y="15" width="100" height="50" rx="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="80" y="44" fill="#64748b" fontSize="6" textAnchor="middle" fontFamily="monospace">A = {res.A_req.toFixed(2)} m²</text>

                {/* Cold Fluid Line (Right to Left) */}
                <path d="M 150 55 L 10 55" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,2" />
                <polygon points="10,55 15,52 15,58" fill="#38bdf8" />
                <text x="110" y="66" fill="#38bdf8" fontSize="6" fontFamily="monospace">Tco: {v.Tco}°C</text>
                <text x="14" y="66" fill="#38bdf8" fontSize="6" fontFamily="monospace">Tci: {v.Tci}°C</text>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const FUEL_DATA = {
  'Methane (CH₄)':     { HHV:55500, MW:16.04, air:17.2 },
  'Propane (C₃H₈)':   { HHV:50350, MW:44.1,  air:15.7 },
  'Hydrogen (H₂)':     { HHV:141800,MW:2.016, air:34.3 },
  'Coal (bituminous)': { HHV:30000, MW:12,    air:11.5 },
  'Diesel (approx)':   { HHV:45500, MW:170,   air:14.5 },
}

function Combustion() {
  const [fuel, setFuel] = useState('Methane (CH₄)')
  const [v, setV] = useState({ flow: '10', excess: '20' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))

  const calc = () => {
    const fflow = parseFloat(v.flow), excess = parseFloat(v.excess)/100
    if (isNaN(fflow)) return
    const fData = FUEL_DATA[fuel]
    const qRel = fflow * fData.HHV // kJ/s
    const theoreticalAir = fflow * fData.air
    const actualAir = theoreticalAir * (1 + excess)
    setRes({ qRel, theoreticalAir, actualAir, excessUsed: excess })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Combustion releases thermal energy through fuel oxidation. Excess air is supplied to ensure complete carbon conversions." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="field-label">Fuel Selection</label>
          <select className="field-select" value={fuel} onChange={e => { setFuel(e.target.value); setRes(null) }}>
            {Object.keys(FUEL_DATA).map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div className="g2 gap-md">
          <Field label="Fuel Flow" unit="kg/s" value={v.flow} onChange={val => s('flow', val)} />
          <Field label="Excess Air" unit="%" value={v.excess} onChange={val => s('excess', val)} />
        </div>
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc} style={{ padding: 12 }}>Calculate Combustion Yield</button>
      {res && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.04) 0%, rgba(7,11,21,0.5) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="result-eyebrow">Combustion Yield Metrics</span>
            <span style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', fontSize: '0.6rem', padding: '3px 8px', borderRadius: 4, fontWeight: 'bold' }}>EXOTHERMIC</span>
          </div>
          <div className="g3 gap-md mt-md">
            <ResCell label="Heat Released Q" val={res.qRel} unit="kW" accent="#f97316" />
            <ResCell label="Theoretical Air" val={res.theoreticalAir} unit="kg/s" accent="#0EA5E9" />
            <ResCell label="Actual Air Feed" val={res.actualAir} unit="kg/s" accent="var(--accent)" />
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, unit, value, onChange, placeholder }) {
  return (
    <div>
      <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span>{label}</span>
        {unit && <span style={{ color: 'var(--text-4)', textTransform: 'none', fontWeight: 400 }}>{unit}</span>}
      </div>
      <input className="field-input" type="number" placeholder={placeholder || '—'} value={value}
        onChange={e => onChange(e.target.value)} style={{ fontSize: '0.82rem' }} />
    </div>
  )
}