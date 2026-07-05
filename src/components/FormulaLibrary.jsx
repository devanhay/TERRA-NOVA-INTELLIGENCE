import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────
//  SVG MATH RENDERER
// ─────────────────────────────────────────────
function MathFraction({ num, den, color = 'var(--accent)' }) {
  const w = Math.max(num.length, den.length) * 8 + 16
  return (
    <svg viewBox={`0 0 ${w} 36`} style={{ display: 'inline-block', verticalAlign: 'middle', height: 36 }}>
      <text x={w / 2} y={13} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill={color}>{num}</text>
      <line x1={2} y1={18} x2={w - 2} y2={18} stroke={color} strokeWidth="1" />
      <text x={w / 2} y={31} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill={color}>{den}</text>
    </svg>
  )
}

function MathSup({ base, exp, color = 'var(--accent)' }) {
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', color, whiteSpace: 'nowrap' }}>
      {base}<sup style={{ fontSize: '0.65em', color }}>{exp}</sup>
    </span>
  )
}

function MathSub({ base, sub, color = 'var(--accent)' }) {
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', color, whiteSpace: 'nowrap' }}>
      {base}<sub style={{ fontSize: '0.65em', color }}>{sub}</sub>
    </span>
  )
}

function MathEq({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 2px',
      padding: '12px 16px', background: 'rgba(16,185,129,0.04)',
      border: '1px solid rgba(16,185,129,0.12)', borderRadius: 8,
      margin: '8px 0', minHeight: 44,
    }}>
      {children}
    </div>
  )
}

const T = ({ c = 'var(--accent)', s = '1rem', children }) => (
  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: c, fontSize: s }}>{children}</span>
)

const OP = ({ children }) => <T c="rgba(0,255,163,0.5)">{children}</T>

// ─────────────────────────────────────────────
//  FORMULA DEFINITIONS & SANDBOX INTERACTIVES
// ─────────────────────────────────────────────
const FORMULAS = [
  {
    id: 'reynolds', category: 'Fluid Mechanics', name: 'Reynolds Number',
    render: () => (
      <MathEq>
        <T>Re</T><OP> = </OP>
        <MathFraction num="ρ · v · D" den="μ" />
      </MathEq>
    ),
    vars: [
      { sym: 'Re', desc: 'Reynolds Number (dimensionless)' },
      { sym: 'ρ', desc: 'Fluid density', unit: 'kg/m³' },
      { sym: 'v', desc: 'Flow velocity', unit: 'm/s' },
      { sym: 'D', desc: 'Pipe diameter', unit: 'm' },
      { sym: 'μ', desc: 'Dynamic viscosity', unit: 'Pa·s' },
    ],
    note: 'Re < 2300 = Laminar · Re > 4000 = Turbulent',
    use: 'Determines flow regime. Critical for friction factor, pipe sizing and pressure drop calculations.',
    calc: 'hub',
    sandbox: {
      inputs: { rho: 1000, vel: 2.0, D: 0.05, mu: 0.001 },
      fields: [
        { k: 'rho', l: 'Density ρ', min: 100, max: 2000, step: 50, u: 'kg/m³' },
        { k: 'vel', l: 'Velocity v', min: 0.1, max: 15, step: 0.1, u: 'm/s' },
        { k: 'D', l: 'Diameter D', min: 0.01, max: 0.5, step: 0.01, u: 'm' },
        { k: 'mu', l: 'Viscosity μ', min: 0.0001, max: 0.01, step: 0.0001, u: 'Pa·s' }
      ],
      solve: p => (p.rho * p.vel * p.D) / p.mu,
      outLabel: 'Re Number',
      outUnit: ''
    }
  },
  {
    id: 'darcy', category: 'Fluid Mechanics', name: 'Darcy-Weisbach',
    render: () => (
      <MathEq>
        <T>ΔP</T><OP> = </OP>
        <T>f</T><OP> · </OP>
        <MathFraction num="L" den="D" />
        <OP> · </OP>
        <MathFraction num="ρv²" den="2" />
      </MathEq>
    ),
    vars: [
      { sym: 'ΔP', desc: 'Pressure drop', unit: 'Pa' },
      { sym: 'f', desc: 'Darcy friction factor', unit: '—' },
      { sym: 'L', desc: 'Pipe length', unit: 'm' },
      { sym: 'D', desc: 'Pipe inner diameter', unit: 'm' },
      { sym: 'ρ', desc: 'Density', unit: 'kg/m³' },
      { sym: 'v', desc: 'Velocity', unit: 'm/s' }
    ],
    note: 'Laminar: f = 64/Re · Turbulent (Blasius): f = 0.316/Re⁰·²⁵',
    use: 'Calculates pressure drop due to friction in straight pipes. Essential for pump sizing.',
    calc: 'hub',
    sandbox: {
      inputs: { f: 0.02, L: 100, D: 0.05, rho: 1000, vel: 2 },
      fields: [
        { k: 'f', l: 'Friction factor f', min: 0.005, max: 0.1, step: 0.005, u: '—' },
        { k: 'L', l: 'Pipe length L', min: 10, max: 500, step: 10, u: 'm' },
        { k: 'D', l: 'Diameter D', min: 0.01, max: 0.5, step: 0.01, u: 'm' },
        { k: 'rho', l: 'Density ρ', min: 600, max: 1500, step: 50, u: 'kg/m³' },
        { k: 'vel', l: 'Velocity v', min: 0.1, max: 10, step: 0.1, u: 'm/s' }
      ],
      solve: p => p.f * (p.L / p.D) * (p.rho * p.vel * p.vel / 2),
      outLabel: 'Pressure Drop ΔP',
      outUnit: 'Pa'
    }
  },
  {
    id: 'fourier', category: 'Heat Transfer', name: "Fourier's Law (Conduction)",
    render: () => (
      <MathEq>
        <T>Q</T><OP> = </OP><T>k</T><OP> · </OP><T>A</T><OP> · </OP>
        <MathFraction num="T₁ − T₂" den="L" />
      </MathEq>
    ),
    vars: [
      { sym: 'Q', desc: 'Heat transfer rate', unit: 'W' },
      { sym: 'k', desc: 'Thermal conductivity', unit: 'W/m·K' },
      { sym: 'A', desc: 'Heat transfer area', unit: 'm²' },
      { sym: 'T₁ - T₂', desc: 'Temperature difference', unit: 'K or °C' },
      { sym: 'L', desc: 'Wall thickness', unit: 'm' }
    ],
    note: 'Heat flows from higher to lower temperatures through solid walls.',
    use: 'Heat conduction calculations for furnace linings, heat exchangers, and insulation.',
    calc: 'hub',
    sandbox: {
      inputs: { k: 0.6, A: 10, dT: 50, L: 0.05 },
      fields: [
        { k: 'k', l: 'Thermal Cond. k', min: 0.02, max: 400, step: 0.5, u: 'W/m·K' },
        { k: 'A', l: 'Area A', min: 1, max: 100, step: 1, u: 'm²' },
        { k: 'dT', l: 'Temp Diff ΔT', min: 1, max: 500, step: 5, u: '°C' },
        { k: 'L', l: 'Thickness L', min: 0.005, max: 0.5, step: 0.005, u: 'm' }
      ],
      solve: p => p.k * p.A * p.dT / p.L,
      outLabel: 'Heat Rate Q',
      outUnit: 'W'
    }
  },
  {
    id: 'newton_cool', category: 'Heat Transfer', name: "Newton's Law of Cooling",
    render: () => (
      <MathEq>
        <T>Q</T><OP> = </OP><T>h</T><OP> · </OP><T>A</T>
        <OP> · </OP><T>(T</T><sub style={{ color: 'rgba(245,166,35,0.8)', fontSize: '0.7em' }}>s</sub>
        <OP> − </OP><T>T</T><sub style={{ color: 'rgba(245,166,35,0.8)', fontSize: '0.7em' }}>∞</sub><T>)</T>
      </MathEq>
    ),
    vars: [
      { sym: 'Q', desc: 'Heat transfer rate', unit: 'W' },
      { sym: 'h', desc: 'Convection heat transfer coefficient', unit: 'W/m²·K' },
      { sym: 'A', desc: 'Surface area', unit: 'm²' },
      { sym: 'Ts', desc: 'Surface temperature', unit: '°C' },
      { sym: 'T∞', desc: 'Fluid temperature', unit: '°C' }
    ],
    note: 'Free convection: 5–25 · Forced convection: 25–250 · Saturated liquid condensation: 1,000–20,000 W/m²·K',
    use: 'Calculates convective heat transfer between a solid surface and moving fluid.',
    calc: 'hub',
    sandbox: {
      inputs: { h: 100, A: 5, Ts: 120, Tf: 25 },
      fields: [
        { k: 'h', l: 'Coeff. h', min: 5, max: 5000, step: 10, u: 'W/m²·K' },
        { k: 'A', l: 'Area A', min: 0.5, max: 50, step: 0.5, u: 'm²' },
        { k: 'Ts', l: 'Surface Ts', min: 30, max: 300, step: 5, u: '°C' },
        { k: 'Tf', l: 'Fluid Tf', min: 0, max: 100, step: 2, u: '°C' }
      ],
      solve: p => p.h * p.A * (p.Ts - p.Tf),
      outLabel: 'Convective Heat Q',
      outUnit: 'W'
    }
  },
  {
    id: 'lmtd', category: 'Heat Transfer', name: 'Log Mean Temp Difference (LMTD)',
    render: () => (
      <MathEq>
        <T>LMTD</T><OP> = </OP>
        <MathFraction num="ΔT₁ − ΔT₂" den="ln(ΔT₁ / ΔT₂)" />
      </MathEq>
    ),
    vars: [
      { sym: 'ΔT₁', desc: 'Temp difference at side 1', unit: '°C' },
      { sym: 'ΔT₂', desc: 'Temp difference at side 2', unit: '°C' }
    ],
    note: 'Used in heat exchanger design: Q = U · A · LMTD',
    use: 'Defines the mean temperature driving force in process heat exchangers.',
    calc: 'hub',
    sandbox: {
      inputs: { dT1: 50, dT2: 15 },
      fields: [
        { k: 'dT1', l: 'Temp Diff ΔT₁', min: 10, max: 200, step: 2, u: '°C' },
        { k: 'dT2', l: 'Temp Diff ΔT₂', min: 2, max: 100, step: 1, u: '°C' }
      ],
      solve: p => p.dT1 === p.dT2 ? p.dT1 : (p.dT1 - p.dT2) / Math.log(p.dT1 / p.dT2),
      outLabel: 'LMTD',
      outUnit: '°C'
    }
  },
  {
    id: 'ideal_gas', category: 'Thermodynamics', name: 'Ideal Gas Law',
    render: () => (
      <MathEq>
        <T>P</T><OP> · </OP><T>V</T><OP> = </OP><T>n</T><OP> · </OP><T>R</T><OP> · </OP><T>T</T>
      </MathEq>
    ),
    vars: [
      { sym: 'P', desc: 'Absolute pressure', unit: 'Pa' },
      { sym: 'V', desc: 'Volume', unit: 'm³' },
      { sym: 'n', desc: 'Amount of substance', unit: 'mol' },
      { sym: 'R', desc: 'Gas constant', unit: '8.314 J/mol·K' },
      { sym: 'T', desc: 'Absolute temperature', unit: 'K' }
    ],
    note: 'Valid at low pressures and high temperatures. Real gases require EoS (Peng-Robinson).',
    use: 'Predicts relationship between volume, pressure, and temperature of gases.',
    calc: 'thermo',
    sandbox: {
      inputs: { P: 101325, V: 1, T: 298.15 },
      fields: [
        { k: 'P', l: 'Pressure P', min: 10000, max: 500000, step: 5000, u: 'Pa' },
        { k: 'V', l: 'Volume V', min: 0.1, max: 10, step: 0.1, u: 'm³' },
        { k: 'T', l: 'Temperature T', min: 100, max: 1000, step: 10, u: 'K' }
      ],
      solve: p => (p.P * p.V) / (8.314 * p.T),
      outLabel: 'Moles (n)',
      outUnit: 'mol'
    }
  },
  {
    id: 'arrhenius', category: 'Reaction Engineering', name: 'Arrhenius Equation',
    render: () => (
      <MathEq>
        <T>k</T><OP> = </OP><T>A</T><OP> · </OP>
        <T>e</T>
        <sup style={{ color: 'rgba(0,255,163,0.6)', fontSize: '0.65em' }}>
          −E<sub style={{ fontSize: '0.8em' }}>a</sub>/RT
        </sup>
      </MathEq>
    ),
    vars: [
      { sym: 'k', desc: 'Reaction rate constant', unit: 's⁻¹ or variable' },
      { sym: 'A', desc: 'Pre-exponential factor', unit: 'same as k' },
      { sym: 'Ea', desc: 'Activation energy', unit: 'J/mol' },
      { sym: 'R', desc: 'Gas constant', unit: '8.314 J/mol·K' },
      { sym: 'T', desc: 'Absolute temperature', unit: 'K' }
    ],
    note: 'Ea generally ranges from 30 to 100 kJ/mol for chemical processes.',
    use: 'Relates reaction kinetic rates directly to operating temperatures.',
    calc: 'reaction',
    sandbox: {
      inputs: { A: 1e8, Ea: 75, T: 300 },
      fields: [
        { k: 'A', l: 'Factor A', min: 1e5, max: 1e10, step: 1e5, u: 's⁻¹' },
        { k: 'Ea', l: 'Energy Ea', min: 10, max: 200, step: 5, u: 'kJ/mol' },
        { k: 'T', l: 'Temp T', min: 200, max: 1000, step: 10, u: 'K' }
      ],
      solve: p => p.A * Math.exp(-(p.Ea * 1000) / (8.314 * p.T)),
      outLabel: 'Rate Constant k',
      outUnit: 's⁻¹'
    }
  }
]

const CATEGORIES = ['All', 'Fluid Mechanics', 'Heat Transfer', 'Thermodynamics', 'Reaction Engineering']
const CAT_COLOR = {
  'Fluid Mechanics': 'var(--accent)',
  'Heat Transfer': '#38BDF8',
  'Thermodynamics': '#FBBF24',
  'Reaction Engineering': '#FF4D6A',
}

function FormulaSandbox({ sandbox }) {
  const [params, setParams] = useState(sandbox.inputs)
  const result = sandbox.solve(params)

  return (
    <div style={{ background: 'rgba(7,11,21,0.4)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, marginTop: 12 }}>
      <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Interactive Sandbox</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {sandbox.fields.map(f => (
          <div key={f.k} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 70px', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{f.l}</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="range" min={f.min} max={f.max} step={f.step || 1} 
                value={params[f.k]} 
                onChange={e => setParams(p => ({ ...p, [f.k]: parseFloat(e.target.value) }))}
                style={{ flex: 1, accentColor: 'var(--accent)', height: 3 }} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#F1F5F9', textAlign: 'right' }}>
              {params[f.k]} <span style={{ fontSize: '0.55rem', color: '#475569' }}>{f.u}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16,185,129,0.06)', padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.2)' }}>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{sandbox.outLabel}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 800 }}>
          {result >= 1e5 || result < 0.01 ? result.toExponential(4) : result.toFixed(4)} {sandbox.outUnit}
        </span>
      </div>
    </div>
  )
}

function FormulaCard({ f, isOpen, onToggle, isFav, onFav, setActive }) {
  const color = CAT_COLOR[f.category] || 'var(--accent)'
  return (
    <div className="card" style={{
      borderColor: isOpen ? color + '60' : 'rgba(255,255,255,0.04)',
      background: isOpen ? `linear-gradient(135deg, ${color}03 0%, rgba(10,18,30,0.45) 100%)` : 'rgba(10,18,30,0.35)',
      boxShadow: isOpen ? `0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)` : 'var(--shadow-card)',
      transition: 'all 0.25s var(--ease)',
      cursor: 'pointer',
    }} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 700,
              padding: '2px 8px', borderRadius: 999,
              background: color + '18', color,
              border: `1px solid ${color}33`,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{f.category}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.02rem', marginBottom: 4 }}>
            {f.name}
          </div>
          {f.render()}
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
          <button onClick={e => { e.stopPropagation(); onFav() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: isFav ? 'var(--gold)' : '#334155', transition: 'color 0.15s' }}>
            {isFav ? '★' : '☆'}
          </button>
          <span style={{ color: '#475569', fontSize: '0.74rem' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ marginTop: 14, animation: 'fadeIn 0.2s var(--ease)' }} onClick={e => e.stopPropagation()}>
          <hr className="divider" style={{ margin: '0 0 12px', borderColor: 'rgba(255,255,255,0.04)' }} />

          {f.note && (
            <div style={{ background: 'rgba(7,11,21,0.4)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#94a3b8' }}>
              ℹ️ {f.note}
            </div>
          )}

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Variables & Dimensionals</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {f.vars.map(v => (
              <div key={v.sym} style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontSize: '0.8rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color, minWidth: 48, fontWeight: 700 }}>{v.sym}</span>
                <span style={{ color: '#94a3b8', flex: 1 }}>{v.desc}</span>
                {v.unit && <span style={{ fontFamily: 'var(--font-mono)', color: '#475569', fontSize: '0.74rem' }}>({v.unit})</span>}
              </div>
            ))}
          </div>

          {/* Render sandbox if configured */}
          {f.sandbox && <FormulaSandbox sandbox={f.sandbox} />}

          <div className="info-block" style={{ marginTop: 14, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
            <div className="info-block-label" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>💡 Application Case</div>
            <div className="info-block-text" style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{f.use}</div>
          </div>

          {f.calc && (
            <button className="btn btn-ghost w-full" style={{ fontSize: '0.78rem', marginTop: 12, padding: '8px 12px' }}
              onClick={e => { e.stopPropagation(); setActive(f.calc) }}>
              🧮 Launch Design Solver Tab →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  MAIN FORMULA LIBRARY
// ─────────────────────────────────────────────
export default function FormulaLibrary({ updateAppContext, setActive }) {
  const [search, setSearch]             = useState('')
  const [category, setCategory]         = useState('All')
  const [openId, setOpenId]             = useState(null)
  const [favorites, setFavorites]       = useState([])
  const [showFavOnly, setShowFavOnly]   = useState(false)

  useEffect(() => {
    if (updateAppContext) {
      const activeFormula = FORMULAS.find(f => f.id === openId)
      updateAppContext('formula', activeFormula ? { id: activeFormula.id, name: activeFormula.name, category: activeFormula.category } : null)
    }
  }, [openId])

  const toggleFav = id => setFavorites(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const filtered = FORMULAS.filter(f => {
    const matchCat  = category === 'All' || f.category === category
    const matchSrch = !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase()) ||
      f.use.toLowerCase().includes(search.toLowerCase())
    const matchFav  = !showFavOnly || favorites.includes(f.id)
    return matchCat && matchSrch && matchFav
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats bar */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.15) 0%, rgba(10,18,30,0.4) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="g4">
          {[
            { val: FORMULAS.length, label: 'Formulas', icon: '∑' },
            { val: CATEGORIES.length - 1, label: 'Categories', icon: '⊞' },
            { val: favorites.length, label: 'Bookmarked', icon: '★' },
            { val: filtered.length, label: 'Showing', icon: '◈' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: 'var(--accent)', marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>{s.val}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Operations */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card-title">🔍 Advanced Index Filters</div>
        
        <input className="field-input" type="text"
          placeholder="Search equations, regimes, boundary rules... (e.g. 'Reynolds', 'Fourier')"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ fontSize: '0.88rem', padding: '11px 14px' }}
        />

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className="btn"
              style={{
                padding: '6px 14px', fontSize: '0.76rem', fontWeight: 600, borderRadius: 999,
                background: category === c ? (CAT_COLOR[c] || 'var(--accent)') : 'rgba(15,23,42,0.4)',
                color: category === c ? 'var(--void)' : '#94a3b8',
                border: `1px solid ${category === c ? 'transparent' : 'rgba(255,255,255,0.04)'}`,
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Fav toggle */}
        <div>
          <button onClick={() => setShowFavOnly(p => !p)} className="btn"
            style={{
              fontSize: '0.78rem', padding: '6px 14px', borderRadius: 999,
              background: showFavOnly ? 'rgba(245,166,35,0.12)' : 'rgba(15,23,42,0.4)',
              color: showFavOnly ? 'var(--gold)' : '#94a3b8',
              border: `1px solid ${showFavOnly ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.04)'}`,
            }}>
            {showFavOnly ? '★ Showing Bookmarked Only' : '☆ Show Bookmarked Only'}
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.3 }}>∑</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6, color: '#94a3b8' }}>
            {showFavOnly ? 'No bookmarked formulas yet' : 'No formulas found'}
          </div>
          <div style={{ fontSize: '0.82rem' }}>
            {showFavOnly ? 'Click ☆ on any formula card to bookmark it.' : 'Try adjusting your search criteria.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(f => (
            <FormulaCard key={f.id} f={f}
              isOpen={openId === f.id}
              onToggle={() => setOpenId(p => p === f.id ? null : f.id)}
              isFav={favorites.includes(f.id)}
              onFav={() => toggleFav(f.id)}
              setActive={setActive}
            />
          ))}
        </div>
      )}
    </div>
  )
}