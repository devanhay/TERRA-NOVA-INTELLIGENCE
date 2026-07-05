import { useState, useEffect } from 'react'

const categories = {
  'Temperature': {
    icon: '🌡️',
    desc: 'Convert between temperature scales used in process thermodynamics and heat integration.',
    units: ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)', 'Rankine (°R)'],
    convert: (val, from, to) => {
      let celsius
      if (from === 'Celsius (°C)') celsius = val
      else if (from === 'Fahrenheit (°F)') celsius = (val - 32) * 5/9
      else if (from === 'Kelvin (K)') celsius = val - 273.15
      else if (from === 'Rankine (°R)') celsius = (val - 491.67) * 5/9

      if (to === 'Celsius (°C)') return celsius
      if (to === 'Fahrenheit (°F)') return celsius * 9/5 + 32
      if (to === 'Kelvin (K)') return celsius + 273.15
      if (to === 'Rankine (°R)') return (celsius + 273.15) * 9/5
    },
    formula: (from, to) => `T_conv = f(T_in) [Thermodynamic Scale Conversion]`
  },
  'Pressure': {
    icon: '💨',
    desc: 'Critical for reactor hydraulic head, distillation column pressure profile, and NPSHa calculations.',
    units: ['Pa', 'kPa', 'MPa', 'bar', 'atm', 'psi', 'mmHg', 'torr'],
    factors: { 'Pa': 1, 'kPa': 1e3, 'MPa': 1e6, 'bar': 1e5, 'atm': 101325, 'psi': 6894.76, 'mmHg': 133.322, 'torr': 133.322 },
    convert: function(val, from, to) { return val * this.factors[from] / this.factors[to] },
    formula: () => 'P₂ = P₁ × (factor₁ / factor₂)'
  },
  'Flow Rate': {
    icon: '🌊',
    desc: 'Volumetric and mass flow rates for sizing pipe networks, pumps, and reactor space velocity.',
    units: ['m³/s', 'm³/h', 'L/s', 'L/min', 'L/h', 'ft³/s', 'gal/min (US)', 'bbl/day'],
    factors: { 'm³/s': 1, 'm³/h': 1/3600, 'L/s': 0.001, 'L/min': 0.001/60, 'L/h': 0.001/3600, 'ft³/s': 0.0283168, 'gal/min (US)': 6.30902e-5, 'bbl/day': 1.84013e-6 },
    convert: function(val, from, to) { return val * this.factors[from] / this.factors[to] },
    formula: () => 'Q₂ = Q₁ × (factor₁ / factor₂)'
  },
  'Mass': {
    icon: '⚖️',
    desc: 'Mass units for material balances, mass balance checks, and feedstock feed stoichiometric metrics.',
    units: ['kg', 'g', 'mg', 'tonne', 'lb', 'oz', 'ton (US)'],
    factors: { 'kg': 1, 'g': 0.001, 'mg': 1e-6, 'tonne': 1000, 'lb': 0.453592, 'oz': 0.0283495, 'ton (US)': 907.185 },
    convert: function(val, from, to) { return val * this.factors[from] / this.factors[to] },
    formula: () => 'm₂ = m₁ × (factor₁ / factor₂)'
  },
  'Energy': {
    icon: '⚡',
    desc: 'Energy and enthalpy heat duties for boiler calculations, reboilers, and condenser loads.',
    units: ['J', 'kJ', 'MJ', 'cal', 'kcal', 'BTU', 'kWh', 'MWh'],
    factors: { 'J': 1, 'kJ': 1000, 'MJ': 1e6, 'cal': 4.184, 'kcal': 4184, 'BTU': 1055.06, 'kWh': 3.6e6, 'MWh': 3.6e9 },
    convert: function(val, from, to) { return val * this.factors[from] / this.factors[to] },
    formula: () => 'E₂ = E₁ × (factor₁ / factor₂)'
  },
  'Power': {
    icon: '🔌',
    desc: 'Power units for shaft work estimation on turbines, pumps, and heat transfer efficiency.',
    units: ['W', 'kW', 'MW', 'hp', 'BTU/h', 'kcal/h'],
    factors: { 'W': 1, 'kW': 1000, 'MW': 1e6, 'hp': 745.7, 'BTU/h': 0.293071, 'kcal/h': 1.163 },
    convert: function(val, from, to) { return val * this.factors[from] / this.factors[to] },
    formula: () => 'P₂ = P₁ × (factor₁ / factor₂)'
  },
  'Density': {
    icon: '🧪',
    desc: 'Fluid density profiles required in flooding dynamics, Reynolds number, and pipe sizing.',
    units: ['kg/m³', 'g/cm³', 'g/L', 'kg/L', 'lb/ft³', 'lb/gal (US)'],
    factors: { 'kg/m³': 1, 'g/cm³': 1000, 'g/L': 1, 'kg/L': 1000, 'lb/ft³': 16.0185, 'lb/gal (US)': 119.826 },
    convert: function(val, from, to) { return val * this.factors[from] / this.factors[to] },
    formula: () => 'ρ₂ = ρ₁ × (factor₁ / factor₂)'
  },
  'Viscosity': {
    icon: '💧',
    desc: 'Dynamic fluid viscosity crucial for friction loss, drag coefficient, and heat transfer coefficients.',
    units: ['Pa·s', 'mPa·s (cP)', 'cSt (× density)', 'poise', 'lb/(ft·s)'],
    factors: { 'Pa·s': 1, 'mPa·s (cP)': 0.001, 'cSt (× density)': 0.001, 'poise': 0.1, 'lb/(ft·s)': 1.48816 },
    convert: function(val, from, to) { return val * this.factors[from] / this.factors[to] },
    formula: () => 'μ₂ = μ₁ × (factor₁ / factor₂)'
  },
}

export default function UnitConverter() {
  const [category, setCategory] = useState('Temperature')
  const [fromUnit, setFromUnit] = useState('')
  const [toUnit, setToUnit] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [result, setResult] = useState(null)
  const [allResults, setAllResults] = useState([])

  const cat = categories[category]

  useEffect(() => {
    const units = cat.units
    setFromUnit(units[0])
    setToUnit(units[1])
    setInputVal('')
    setResult(null)
    setAllResults([])
  }, [category])

  const calculate = () => {
    const val = parseFloat(inputVal)
    if (isNaN(val)) return
    const res = cat.convert(val, fromUnit, toUnit)
    setResult(res)
    const all = cat.units.map(u => ({
      unit: u,
      value: cat.convert(val, fromUnit, u)
    }))
    setAllResults(all)
  }

  const swap = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
    setResult(null)
    setAllResults([])
  }

  const fmt = (n) => {
    if (n === null || isNaN(n)) return '—'
    if (Math.abs(n) >= 1e6 || (Math.abs(n) < 0.001 && n !== 0)) return n.toExponential(4)
    return parseFloat(n.toFixed(6)).toString()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Category Glass Grid */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.15) 0%, rgba(10,18,30,0.4) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div className="card-title">⚗️ Engineering Category Selector</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 8 }}>
          {Object.keys(categories).map(c => {
            const isActive = category === c
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 10px',
                  background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(15,23,42,0.4)',
                  color: isActive ? 'var(--accent)' : '#94a3b8',
                  border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.25s var(--ease)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '0.78rem'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{categories[c].icon}</span>
                <span>{c}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}>
        {/* Input panel */}
        <div className="card">
          <div className="card-title">🎚️ Conversion Inputs</div>
          <div className="card-desc">{cat.desc}</div>

          <div className="g2 gap-md" style={{ marginBottom: 14 }}>
            <div>
              <label className="field-label">From Unit</label>
              <select className="field-select" value={fromUnit} onChange={e => { setFromUnit(e.target.value); setResult(null); }}>
                {cat.units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">To Unit</label>
              <select className="field-select" value={toUnit} onChange={e => { setToUnit(e.target.value); setResult(null); }}>
                {cat.units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Input Value</label>
            <input
              className="field-input"
              type="number"
              placeholder={`Enter value in ${fromUnit}`}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculate()}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-accent" onClick={calculate} style={{ flex: 1, padding: '12px' }}>Convert Value →</button>
            <button className="btn btn-ghost" onClick={swap}>⇄ Swap</button>
            <button className="btn btn-ghost" onClick={() => { setInputVal(''); setResult(null); setAllResults([]); }}>Clear</button>
          </div>

          {result !== null && (
            <div className="result-panel" style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(7,11,21,0.5) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              marginTop: 18
            }}>
              <div className="result-eyebrow">Calculated Output</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="result-big" style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 800 }}>{fmt(result)}</span>
                <span className="result-unit" style={{ fontSize: '0.9rem', color: '#94a3b8' }}> {toUnit}</span>
              </div>
              <div className="formula-block" style={{ marginTop: 12, fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                {inputVal} {fromUnit} = {fmt(result)} {toUnit}
              </div>
            </div>
          )}
        </div>

        {/* Readout panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">📊 Multi-Unit Readout</div>
          <div className="card-desc">All conversions mapped across the VLE/Cp standard scales</div>

          {allResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
              {allResults.map(r => {
                const isTarget = r.unit === toUnit
                return (
                  <div 
                    key={r.unit} 
                    style={{
                      background: isTarget ? 'rgba(16,185,129,0.06)' : 'rgba(15,23,42,0.3)',
                      border: `1px solid ${isTarget ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.03)'}`,
                      borderRadius: 10, 
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{r.unit}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: '0.9rem', fontWeight: 700, color: isTarget ? 'var(--accent)' : '#f8fafc' }}>
                      {fmt(r.value)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40, color: '#475569', textAlign: 'center' }}>
              <span style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.3 }}>⇄</span>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>Enter an input value and click Convert to calculate all conversions simultaneously.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}