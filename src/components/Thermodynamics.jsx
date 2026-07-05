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

const gasData = {
  'Air': { Cp: 1005, Cv: 718, MW: 28.97, gamma: 1.4 },
  'Nitrogen (N₂)': { Cp: 1040, Cv: 743, MW: 28.01, gamma: 1.4 },
  'Oxygen (O₂)': { Cp: 920, Cv: 660, MW: 32.00, gamma: 1.395 },
  'Carbon Dioxide (CO₂)': { Cp: 844, Cv: 655, MW: 44.01, gamma: 1.289 },
  'Methane (CH₄)': { Cp: 2220, Cv: 1700, MW: 16.04, gamma: 1.305 },
  'Hydrogen (H₂)': { Cp: 14300, Cv: 10200, MW: 2.016, gamma: 1.405 },
  'Steam (H₂O)': { Cp: 2010, Cv: 1520, MW: 18.02, gamma: 1.324 },
  'Ammonia (NH₃)': { Cp: 2175, Cv: 1662, MW: 17.03, gamma: 1.309 },
  'Custom': { Cp: null, Cv: null, MW: null, gamma: null },
}

export default function Thermodynamics() {
  const [tab, setTab] = useState('idealgas')
  return (
    <div>
      <div className="card">
        <div className="card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>🌡️ Thermodynamics Suite</div>
        <div className="card-desc">Calculators for Ideal Gas equations of state, enthalpy loops, and processes</div>
        <div className="os-tabs" style={{ marginBottom: 20 }}>
          <button className={`os-tab ${tab === 'idealgas' ? 'active' : ''}`} onClick={() => setTab('idealgas')}>🎈 Ideal Gas Law</button>
          <button className={`os-tab ${tab === 'enthalpy' ? 'active' : ''}`} onClick={() => setTab('enthalpy')}>🌡️ Enthalpy / ΔH</button>
          <button className={`os-tab ${tab === 'isentropic' ? 'active' : ''}`} onClick={() => setTab('isentropic')}>🔄 Isentropic Process</button>
          <button className={`os-tab ${tab === 'cpcv' ? 'active' : ''}`} onClick={() => setTab('cpcv')}>📊 Cp / Cv Table</button>
        </div>
        {tab === 'idealgas' && <IdealGas />}
        {tab === 'enthalpy' && <Enthalpy />}
        {tab === 'isentropic' && <Isentropic />}
        {tab === 'cpcv' && <CpCvTable />}
      </div>
    </div>
  )
}

function IdealGas() {
  const [solve, setSolve] = useState('P')
  const [vals, setVals] = useState({ P: '101325', V: '1.0', n: '40.0', T: '25' })
  const [result, setResult] = useState(null)
  const R = 8.314
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))
  const n = k => parseFloat(vals[k])

  const calculate = () => {
    let res = {}
    if (solve === 'P') res.P = (n('n') * R * (n('T') + 273.15)) / n('V')
    else if (solve === 'V') res.V = (n('n') * R * (n('T') + 273.15)) / n('P')
    else if (solve === 'n') res.n = (n('P') * n('V')) / (R * (n('T') + 273.15))
    else if (solve === 'T') res.T = (n('P') * n('V')) / (n('n') * R) - 273.15
    setResult(res)
  }

  const labels = { P: 'Pressure (Pa)', V: 'Volume (m³)', n: 'Moles n (mol)', T: 'Temperature (°C)' }
  const units = { P: 'Pa', V: 'm³', n: 'mol', T: '°C' }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Ideal Gas equation of state (PV = nRT) describes molecular kinetics behavior. T is converted to Kelvin internally (T + 273.15)." />
      <div className="mb-md">
        <label className="field-label">Variable to Solve for</label>
        <select className="field-select" value={solve} onChange={e => { setSolve(e.target.value); setResult(null) }}>
          <option value="P">Pressure (P)</option>
          <option value="V">Volume (V)</option>
          <option value="n">Moles (n)</option>
          <option value="T">Temperature (T)</option>
        </select>
      </div>
      <div className="g3 gap-md mb-md">
        {['P', 'V', 'n', 'T'].filter(k => k !== solve).map(k => (
          <div key={k}>
            <label className="field-label">{labels[k]}</label>
            <input className="field-input" type="number" placeholder={`Enter ${k}`} value={vals[k]} onChange={e => set(k, e.target.value)} />
          </div>
        ))}
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calculate} style={{ padding: 12 }}>Solve Ideal Gas Variable</button>
      {result && Object.entries(result).map(([k, v]) => (
        <div className="result-panel" key={k} style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(7,11,21,0.5) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <div className="result-eyebrow">Calculated Value</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="result-big" style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 800 }}>{isNaN(v) ? '—' : v.toFixed(4)}</span>
            <span className="result-unit" style={{ fontSize: '0.9rem', color: '#94a3b8' }}> {units[k]}</span>
          </div>
          <div className="formula-block" style={{ marginTop: 12, fontSize: '0.64rem', fontFamily: 'monospace' }}>
            PV = nRT &nbsp;·&nbsp; R = 8.314 J/mol·K
          </div>
        </div>
      ))}
    </div>
  )
}

function Enthalpy() {
  const [substance, setSubstance] = useState('Air')
  const [customCp, setCustomCp] = useState('')
  const [vals, setVals] = useState({ mass: '5', T1: '25', T2: '200' })
  const [result, setResult] = useState(null)
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const getCp = () => substance === 'Custom' ? parseFloat(customCp) : gasData[substance].Cp

  const calculate = () => {
    const m = parseFloat(vals.mass), T1 = parseFloat(vals.T1), T2 = parseFloat(vals.T2), Cp = getCp()
    if ([m, T1, T2, Cp].some(isNaN)) return
    const dH = m * Cp * (T2 - T1)
    const dS_approx = m * Cp * Math.log((T2 + 273.15) / (T1 + 273.15))
    setResult({ dH, dHkW: dH / 1000, dS: dS_approx, Cp, dT: T2 - T1 })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Enthalpy Change ΔH = m·Cp·ΔT measures thermal energy flow. Entropy Change ΔS characterizes the structural disorder change." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="field-label">Gas Selection</label>
          <select className="field-select" value={substance} onChange={e => { setSubstance(e.target.value); setResult(null) }}>
            {Object.keys(gasData).map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          {substance !== 'Custom' ? (
            <div>
              <label className="field-label">Constant Cp</label>
              <div className="field-input" style={{ background: 'rgba(30,41,59,0.3)', color: '#64748b' }}>
                {gasData[substance].Cp.toLocaleString()} J/kg·K
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label">Custom Cp (J/kg·K)</label>
              <input className="field-input" type="number" placeholder="e.g. 2000" value={customCp} onChange={e => setCustomCp(e.target.value)} />
            </div>
          )}
        </div>
      </div>
      <div className="g3 gap-md mb-md">
        <div><label className="field-label">Mass Flow ṁ (kg/s)</label><input className="field-input" type="number" placeholder="e.g. 5" value={vals.mass} onChange={e => set('mass', e.target.value)} /></div>
        <div><label className="field-label">Inlet T₁ (°C)</label><input className="field-input" type="number" placeholder="e.g. 25" value={vals.T1} onChange={e => set('T1', e.target.value)} /></div>
        <div><label className="field-label">Outlet T₂ (°C)</label><input className="field-input" type="number" placeholder="e.g. 200" value={vals.T2} onChange={e => set('T2', e.target.value)} /></div>
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calculate} style={{ padding: 12 }}>Calculate Enthalpy Changes</button>
      {result && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(7,11,21,0.5) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="result-eyebrow">Enthalpy & Entropy Change Results</span>
            <span style={{
              background: result.dH > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${result.dH > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              color: result.dH > 0 ? '#ef4444' : 'var(--accent)',
              fontSize: '0.6rem', padding: '3px 8px', borderRadius: 4, fontWeight: 'bold'
            }}>{result.dH > 0 ? 'ENDOTHERMIC' : 'EXOTHERMIC'}</span>
          </div>
          <div className="g3 gap-md mt-md">
            <ResCell label="ΔH (Enthalpy Change)" val={Math.abs(result.dH)} unit="W" />
            <ResCell label="ΔH (Enthalpy Change)" val={Math.abs(result.dHkW)} unit="kW" accent="#0EA5E9" />
            <ResCell label="ΔS (Entropy Change)" val={result.dS} unit="J/K·s" accent="#a855f7" />
          </div>
        </div>
      )}
    </div>
  )
}

function Isentropic() {
  const [substance, setSubstance] = useState('Air')
  const [vals, setVals] = useState({ T1: '25', P1: '101.3', P2: '500', customGamma: '' })
  const [result, setResult] = useState(null)
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))

  const getGamma = () => substance === 'Custom' ? parseFloat(vals.customGamma) : gasData[substance].gamma

  const calculate = () => {
    const T1K = parseFloat(vals.T1) + 273.15
    const P1 = parseFloat(vals.P1), P2 = parseFloat(vals.P2)
    const g = getGamma()
    if ([T1K, P1, P2, g].some(isNaN)) return
    const T2K = T1K * Math.pow(P2 / P1, (g - 1) / g)
    const T2C = T2K - 273.15
    const ratio = P2 / P1
    setResult({ T2C, T2K, ratio, gamma: g, T1K })
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Isentropic process describes reversible adiabatic compression or expansion inside ideal pumps, compressors, or gas turbines." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label className="field-label">Gas Selection</label>
          <select className="field-select" value={substance} onChange={e => { setSubstance(e.target.value); setResult(null) }}>
            {Object.keys(gasData).map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          {substance !== 'Custom' ? (
            <div>
              <label className="field-label">Heat Capacity Ratio γ</label>
              <div className="field-input" style={{ background: 'rgba(30,41,59,0.3)', color: '#64748b' }}>
                {gasData[substance].gamma}
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label">Custom γ (Cp/Cv)</label>
              <input className="field-input" type="number" placeholder="e.g. 1.4" value={vals.customGamma} onChange={e => set('customGamma', e.target.value)} />
            </div>
          )}
        </div>
      </div>
      <div className="g3 gap-md mb-md">
        <div><label className="field-label">Inlet T₁ (°C)</label><input className="field-input" type="number" placeholder="e.g. 25" value={vals.T1} onChange={e => set('T1', e.target.value)} /></div>
        <div><label className="field-label">Inlet P₁ (kPa)</label><input className="field-input" type="number" placeholder="e.g. 101.3" value={vals.P1} onChange={e => set('P1', e.target.value)} /></div>
        <div><label className="field-label">Outlet P₂ (kPa)</label><input className="field-input" type="number" placeholder="e.g. 500" value={vals.P2} onChange={e => set('P2', e.target.value)} /></div>
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calculate} style={{ padding: 12 }}>Solve Compressor Outlet</button>
      {result && (
        <div className="result-panel" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(7,11,21,0.5) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <div className="result-eyebrow">Calculated Outlet Properties</div>
          <div className="g3 gap-md mt-md">
            <ResCell label="Outlet Temp T₂" val={result.T2C} unit="°C" accent="#EF4444" />
            <ResCell label="Pressure Ratio P₂/P₁" val={result.ratio} unit="—" accent="#38BDF8" />
            <ResCell label="γ Used" val={result.gamma} unit="—" accent="#F5A623" />
          </div>
        </div>
      )}
    </div>
  )
}

function CpCvTable() {
  return (
    <div style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
      <InfoBox text="Lookup specific heat capacities (Constant Pressure Cp vs Constant Volume Cv) and molecular weights." />
      <div style={{ overflowX: 'auto', background: 'rgba(7,11,21,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Gas / Substance', 'Cp (J/kg·K)', 'Cv (J/kg·K)', 'γ = Cp/Cv', 'MW (g/mol)'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(gasData).filter(([k]) => k !== 'Custom').map(([name, d]) => (
              <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', hover: { background: 'rgba(255,255,255,0.01)' } }}>
                <td style={{ padding: '10px 16px', color: '#f8fafc', fontWeight: 'bold' }}>{name}</td>
                <td style={{ padding: '10px 16px', color: '#38bdf8' }}>{d.Cp.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', color: '#a855f7' }}>{d.Cv.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', color: 'var(--accent)' }}>{d.gamma.toFixed(3)}</td>
                <td style={{ padding: '10px 16px', color: '#f8fafc' }}>{d.MW.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}