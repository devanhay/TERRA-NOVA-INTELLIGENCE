import { useState, useRef, useEffect } from 'react'

// ─────────────────────────────────────────────
//  ANIMATED NUMBER — count-up effect
// ─────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 4 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (value == null || isNaN(value)) return
    const start = 0, end = value, duration = 600
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(start + (end - start) * eased)
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])

  if (value == null || isNaN(value)) return <span>—</span>
  const formatted = Math.abs(display) >= 1e6 || (Math.abs(display) < 0.001 && display !== 0)
    ? display.toExponential(3)
    : parseFloat(display.toFixed(decimals)).toString()

  return <span>{formatted}</span>
}

// ─────────────────────────────────────────────
//  GLOW CARD — card with cursor glow effect
// ─────────────────────────────────────────────
function GlowCard({ children, onClick, color = '#00FFB4', style = {}, className = '' }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0, show: false })

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true })
  }

  return (
    <div ref={ref} className={className} onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos(p => ({ ...p, show: false }))}
      style={{ position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {pos.show && (
        <div style={{
          position: 'absolute', pointerEvents: 'none', zIndex: 0,
          left: pos.x - 80, top: pos.y - 80, width: 160, height: 160,
          background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          transition: 'opacity 0.1s',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  SHARED HELPER COMPONENTS
// ─────────────────────────────────────────────
function InfoBox({ text }) {
  return (
    <div className="info-block mb-md">
      <div className="info-block-label">📐 Concept</div>
      <div className="info-block-text">{text}</div>
    </div>
  )
}

function ResGrid({ items }) {
  return (
    <div className="g2 gap-md mt-md">
      {items.filter(r => r.val !== undefined && r.val !== null && !isNaN(r.val)).map(r => (
        <div className="res-cell" key={r.label + r.unit}
          style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
          <div className="res-cell-label">{r.label}</div>
          <div>
            <span className="res-cell-val"><AnimatedNumber value={typeof r.val === 'number' ? r.val : NaN} /></span>
            <span className="res-cell-unit"> {r.unit}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function FormulaBox({ text }) {
  return <div className="formula-block mt-md">{text}</div>
}

function Inp({ label, placeholder, value, onChange, type = 'number' }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input className="field-input" type={type} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function Sel({ label, value, onChange, options }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select className="field-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  )
}

// ─────────────────────────────────────────────
//  INTERACTIVE VISUALIZERS
// ─────────────────────────────────────────────

function VelocityProfileSVG({ Re, vel }) {
  const isLaminar = Re < 2300
  const isTurbulent = Re >= 4000
  
  const w = 220, h = 120
  const midY = h / 2
  const r = 36 // radius of pipe in pixels
  const topY = midY - r
  const botY = midY + r
  
  // Speed particles duration
  const speed = Math.max(0.5, Math.min(6.0, 10 / (vel || 1)))

  // Draw velocity arrows
  const arrowPoints = []
  const nArrows = 7
  for (let i = 0; i < nArrows; i++) {
    const fraction = (i - (nArrows - 1) / 2) / ((nArrows - 1) / 2) // -1 to 1
    const y = midY + fraction * r * 0.85
    let lengthMult = 0
    if (isLaminar) {
      lengthMult = 1 - fraction * fraction // parabolic profile
    } else {
      lengthMult = Math.pow(1 - Math.abs(fraction), 1/7) // 1/7th power law (flatter profile)
    }
    const len = Math.max(5, lengthMult * 90)
    arrowPoints.push({ y, len })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
      <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#64748B', marginBottom: 6 }}>
        Velocity Profile: {isLaminar ? 'Laminar (Parabolic)' : isTurbulent ? 'Turbulent (Flat / 1/7th Law)' : 'Transition State'}
      </div>
      <svg width={w} height={h} style={{ background: 'rgba(7,11,21,0.95)', border: '1px solid #1E293B', borderRadius: 8 }}>
        {/* Pipe boundaries */}
        <line x1={0} y1={topY} x2={w} y2={topY} stroke="#1E4A65" strokeWidth={2} />
        <line x1={0} y1={botY} x2={w} y2={botY} stroke="#1E4A65" strokeWidth={2} />
        
        {/* Centerline */}
        <line x1={0} y1={midY} x2={w} y2={midY} stroke="#1E293B" strokeWidth={1} strokeDasharray="5,4" />

        {/* Dynamic flow particles */}
        {vel > 0 && [0.1, 0.4, 0.7].map((offset, idx) => {
          const partY = topY + (idx + 1) * (r * 2 / 4)
          const fraction = (partY - midY) / r
          let speedFactor = 1.0
          if (isLaminar) speedFactor = 1 - fraction * fraction
          else speedFactor = Math.pow(1 - Math.abs(fraction), 1/7)
          
          const dur = `${(speed / Math.max(0.1, speedFactor)).toFixed(2)}s`
          return (
            <circle key={idx} r={2} fill={isLaminar ? 'var(--accent)' : '#FF4D6A'} opacity={0.6}>
              <animateMotion dur={dur} repeatCount="indefinite" path={`M 0,${partY} L ${w},${partY}`} />
            </circle>
          )
        })}

        {/* Velocity profile boundary line */}
        <path d={`M 15,${topY} ` + arrowPoints.map(ap => `L ${15 + ap.len},${ap.y}`).join(' ') + ` L 15,${botY}`} 
          fill="rgba(0,255,163,0.05)" stroke={isLaminar ? 'var(--accent)' : '#FF4D6A'} strokeWidth={1.5} />

        {/* Draw arrows */}
        {arrowPoints.map((ap, i) => (
          <line key={i} x1={15} y1={ap.y} x2={15 + ap.len} y2={ap.y} 
            stroke={isLaminar ? 'var(--accent)' : '#FF4D6A'} strokeWidth={1.2} markerEnd="url(#profileArr)" />
        ))}

        <defs>
          <marker id="profileArr" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 Z" fill={isLaminar ? 'var(--accent)' : '#FF4D6A'} />
          </marker>
        </defs>
      </svg>
    </div>
  )
}

function TempProfileSVG({ Thi, Tho, Tci, Tco, config }) {
  const w = 220, h = 130
  const PL = 28, PR = 10, PT = 10, PB = 20
  const cW = w - PL - PR, cH = h - PT - PB

  const maxT = Math.max(Thi, Tho, Tci, Tco, 100)
  const minT = Math.min(Thi, Tho, Tci, Tco, 0)
  const tDiff = maxT - minT || 1

  const getX = xFrac => PL + xFrac * cW
  const getY = T => PT + cH - ((T - minT) / tDiff) * cH

  const isCounter = config === 'counter'

  // Temperature curves paths
  const hotPathD = `M ${getX(0)},${getY(Thi)} Q ${getX(0.5)},${getY((Thi+Tho)/2)} ${getX(1)},${getY(Tho)}`
  
  // Cold stream curve depend on flow config
  const coldPathD = isCounter
    ? `M ${getX(0)},${getY(Tco)} Q ${getX(0.5)},${getY((Tci+Tco)/2)} ${getX(1)},${getY(Tci)}` // counter: flows right-to-left
    : `M ${getX(0)},${getY(Tci)} Q ${getX(0.5)},${getY((Tci+Tco)/2)} ${getX(1)},${getY(Tco)}` // co-current: flows left-to-right

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
      <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#64748B', marginBottom: 6 }}>
        Heat Exchanger Profile ({isCounter ? 'Counter-Current' : 'Co-Current'})
      </div>
      <svg width={w} height={h} style={{ background: 'rgba(7,11,21,0.95)', border: '1px solid #1E293B', borderRadius: 8 }}>
        {/* Y-axis grid lines */}
        {[0, 0.5, 1.0].map(frac => {
          const T = minT + frac * tDiff
          return (
            <g key={frac}>
              <line x1={PL} y1={getY(T)} x2={w - PR} y2={getY(T)} stroke="#1E293B" strokeWidth={0.5} strokeDasharray="3,3" />
              <text x={PL - 5} y={getY(T) + 3} fontSize={7} fill="#475569" textAnchor="end">{T.toFixed(0)}°C</text>
            </g>
          )
        })}

        {/* Hot Fluid Curve */}
        <path d={hotPathD} fill="none" stroke="#FF4D6A" strokeWidth={2} />
        {/* Hot labels */}
        <circle cx={getX(0)} cy={getY(Thi)} r={3} fill="#FF4D6A" />
        <circle cx={getX(1)} cy={getY(Tho)} r={3} fill="#FF4D6A" />
        <text x={getX(0) + 5} y={getY(Thi) + 9} fontSize={6} fill="#FF4D6A" fontWeight="bold">Thi</text>
        <text x={getX(1) - 5} y={getY(Tho) + 9} fontSize={6} fill="#FF4D6A" textAnchor="end" fontWeight="bold">Tho</text>

        {/* Cold Fluid Curve */}
        <path d={coldPathD} fill="none" stroke="#0EA5E9" strokeWidth={2} />
        {/* Cold labels */}
        <circle cx={getX(isCounter ? 1 : 0)} cy={getY(Tci)} r={3} fill="#0EA5E9" />
        <circle cx={getX(isCounter ? 0 : 1)} cy={getY(Tco)} r={3} fill="#0EA5E9" />
        <text x={getX(isCounter ? 1 : 0) + (isCounter ? -5 : 5)} y={getY(Tci) - 5} fontSize={6} fill="#0EA5E9" textAnchor={isCounter ? 'end' : 'start'} fontWeight="bold">Tci</text>
        <text x={getX(isCounter ? 0 : 1) + (isCounter ? 5 : -5)} y={getY(Tco) - 5} fontSize={6} fill="#0EA5E9" textAnchor={isCounter ? 'start' : 'end'} fontWeight="bold">Tco</text>

        {/* X-axis labels */}
        <line x1={PL} y1={h-PB} x2={w-PR} y2={h-PB} stroke="#1A3A50" />
        <text x={PL} y={h-6} fontSize={6.5} fill="#475569">Inlet</text>
        <text x={w-PR} y={h-6} fontSize={6.5} fill="#475569" textAnchor="end">Outlet</text>
        <text x={PL + cW/2} y={h-6} fontSize={6.5} fill="#334155" textAnchor="middle">HX Length</text>
      </svg>
    </div>
  )
}

function PipeLossSVG({ dP_kPa, vel }) {
  const w = 220, h = 60
  const speed = Math.max(0.5, Math.min(6.0, 10 / (vel || 1)))
  
  // Calculate relative pressure color gradient representation
  // Higher dP means faster fade from bright teal (high pressure) to dark red-black (low pressure)
  const dP = parseFloat(dP_kPa) || 0
  const colorRight = dP > 100 ? '#11050A' : dP > 20 ? '#0B1519' : 'rgba(0, 255, 163, 0.15)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
      <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: '#64748B', marginBottom: 6 }}>
        Pipe Pressure Gradient Model (Loss: {dP.toFixed(1)} kPa)
      </div>
      <svg width={w} height={h} style={{ background: 'rgba(7,11,21,0.95)', border: '1px solid #1E293B', borderRadius: 8 }}>
        <defs>
          <linearGradient id="pressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor={colorRight} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Pipe walls */}
        <rect x={0} y={15} width={w} height={30} fill="url(#pressGrad)" stroke="#1E4A65" strokeWidth={1.5} />

        {/* Dynamic moving bubbles */}
        {vel > 0 && [18, 25, 32, 39].map((partY, idx) => (
          <circle key={idx} r={1.5} fill="var(--accent)" opacity={0.5}>
            <animateMotion dur={`${(speed * (1 + idx*0.2)).toFixed(2)}s`} repeatCount="indefinite" path={`M 0,${partY} L ${w},${partY}`} />
          </circle>
        ))}

        <text x={8} y={32} fontSize={7} fill="var(--accent)" fontWeight="bold">P_in (High)</text>
        <text x={w - 8} y={32} fontSize={7} fill="#4A7A6A" textAnchor="end" fontWeight="bold">P_out</text>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────
//  CALCULATOR IMPLEMENTATIONS
// ─────────────────────────────────────────────
function Reynolds() {
  const [v, setV] = useState({ rho: '1000', vel: '2', D: '0.05', mu: '0.001' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const rho = +v.rho, vel = +v.vel, D = +v.D, mu = +v.mu
    if ([rho, vel, D, mu].some(isNaN) || mu === 0) return
    const Re = rho * vel * D / mu
    const regime = Re < 2300 ? '✅ Laminar' : Re < 4000 ? '⚠️ Transition' : '🌀 Turbulent'
    const f = Re < 2300 ? 64 / Re : 0.316 / Math.pow(Re, 0.25)
    setRes({ Re, regime, f })
  }
  return (
    <div>
      <InfoBox text="Re = ρvD/μ. Re < 2300 = laminar (smooth), Re > 4000 = turbulent (chaotic). Critical for pipe sizing, HX design, and pump selection." />
      <div className="g2 gap-md mb-md">
        <Inp label="Density ρ (kg/m³)" placeholder="e.g. 1000" value={v.rho} onChange={v => s('rho', v)} />
        <Inp label="Velocity v (m/s)" placeholder="e.g. 2" value={v.vel} onChange={v => s('vel', v)} />
        <Inp label="Diameter D (m)" placeholder="e.g. 0.05" value={v.D} onChange={v => s('D', v)} />
        <Inp label="Viscosity μ (Pa·s)" placeholder="e.g. 0.001" value={v.mu} onChange={v => s('mu', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`chip ${res.Re < 2300 ? 'chip-green' : res.Re < 4000 ? 'chip-gold' : 'chip-red'}`}>{res.regime}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <ResGrid items={[{ label: 'Reynolds Number Re', val: res.Re, unit: '—' }, { label: 'Friction Factor f', val: res.f, unit: '—' }]} />
              <FormulaBox text="Re = ρ·v·D/μ  |  Laminar: f = 64/Re  |  Turbulent: f = 0.316/Re⁰·²⁵" />
            </div>
            <div>
              <VelocityProfileSVG Re={res.Re} vel={parseFloat(v.vel)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PressureDrop() {
  const [v, setV] = useState({ f: '0.02', L: '100', D: '0.05', rho: '1000', vel: '2' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const { f, L, D, rho, vel } = v
    const fv = +f, Lv = +L, Dv = +D, rhov = +rho, velv = +vel
    if ([fv, Lv, Dv, rhov, velv].some(isNaN) || Dv === 0) return
    const dP = fv * (Lv / Dv) * (rhov * velv * velv / 2)
    setRes({ dP, dP_kPa: dP / 1000, dP_bar: dP / 1e5 })
  }
  return (
    <div>
      <InfoBox text="Darcy-Weisbach: ΔP = f(L/D)(ρv²/2). Pump must overcome this pressure drop. f from Reynolds number via Moody chart." />
      <div className="g2 gap-md mb-md">
        <Inp label="Friction Factor f" placeholder="e.g. 0.02" value={v.f} onChange={v => s('f', v)} />
        <Inp label="Pipe Length L (m)" placeholder="e.g. 100" value={v.L} onChange={v => s('L', v)} />
        <Inp label="Diameter D (m)" placeholder="e.g. 0.05" value={v.D} onChange={v => s('D', v)} />
        <Inp label="Density ρ (kg/m³)" placeholder="e.g. 1000" value={v.rho} onChange={v => s('rho', v)} />
        <Inp label="Velocity v (m/s)" placeholder="e.g. 2" value={v.vel} onChange={v => s('vel', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <ResGrid items={[{ label: 'ΔP', val: res.dP, unit: 'Pa' }, { label: 'ΔP', val: res.dP_kPa, unit: 'kPa' }, { label: 'ΔP', val: res.dP_bar, unit: 'bar' }]} />
              <FormulaBox text="ΔP = f × (L/D) × (ρv²/2)  — Darcy-Weisbach" />
            </div>
            <div>
              <PipeLossSVG dP_kPa={res.dP_kPa} vel={parseFloat(v.vel)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Bernoulli() {
  const [solve, setSolve] = useState('v2')
  const [v, setV] = useState({ P1: '200000', v1: '1', z1: '10', P2: '101325', v2: '', z2: '0', rho: '1000' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const g = 9.81
  const calc = () => {
    const r = +v.rho; if (r === 0) return
    let ans, label, unit
    if (solve === 'v2') { const lhs = +v.P1/r + 0.5*(+v.v1)**2 + g*+v.z1; ans = Math.sqrt(Math.max(0, 2*(lhs - +v.P2/r - g*+v.z2))); label = 'Velocity v₂'; unit = 'm/s' }
    else if (solve === 'P2') { ans = r*(0.5*(+v.v1)**2 - 0.5*(+v.v2)**2 + g*(+v.z1 - +v.z2)) + +v.P1; label = 'Pressure P₂'; unit = 'Pa' }
    else { ans = (+v.P1 - +v.P2)/(r*g) + (+v.v1)**2/(2*g) - (+v.v2)**2/(2*g) + +v.z1; label = 'Elevation z₂'; unit = 'm' }
    setRes({ ans, label, unit })
  }
  return (
    <div>
      <InfoBox text="P + ½ρv² + ρgz = constant along streamline. Assumes incompressible, inviscid, steady flow." />
      <Sel label="Solve for" value={solve} onChange={setSolve} options={[{ value:'v2', label:'Velocity v₂' }, { value:'P2', label:'Pressure P₂' }, { value:'z2', label:'Elevation z₂' }]} />
      <div className="g2 gap-md mt-md mb-md">
        <Inp label="Density ρ (kg/m³)" placeholder="e.g. 1000" value={v.rho} onChange={v => s('rho', v)} />
        <div />
        <Inp label="P₁ (Pa)" placeholder="e.g. 200000" value={v.P1} onChange={v => s('P1', v)} />
        <Inp label="P₂ (Pa)" placeholder="e.g. 101325" value={v.P2} onChange={v => s('P2', v)} />
        <Inp label="v₁ (m/s)" placeholder="e.g. 1" value={v.v1} onChange={v => s('v1', v)} />
        <Inp label="v₂ (m/s)" placeholder="e.g. ?" value={v.v2} onChange={v => s('v2', v)} />
        <Inp label="z₁ (m)" placeholder="e.g. 10" value={v.z1} onChange={v => s('z1', v)} />
        <Inp label="z₂ (m)" placeholder="e.g. 0" value={v.z2} onChange={v => s('z2', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Solve Bernoulli</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[{ label: res.label, val: res.ans, unit: res.unit }]} />
          <FormulaBox text="P₁ + ½ρv₁² + ρgz₁ = P₂ + ½ρv₂² + ρgz₂" />
        </div>
      )}
    </div>
  )
}

function PipeFlow() {
  const [v, setV] = useState({ D: '', vel: '', rho: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const D = +v.D, vel = +v.vel, rho = +v.rho
    if (isNaN(D) || isNaN(vel)) return
    const A = Math.PI * D * D / 4, Q = A * vel
    setRes({ A, Q, Qh: Q * 3600, mdot: rho ? Q * rho : null })
  }
  return (
    <div>
      <InfoBox text="Q = A × v where A = πD²/4. Mass flow: ṁ = ρQ. Essential for pipe sizing and pump selection." />
      <div className="g2 gap-md mb-md">
        <Inp label="Diameter D (m)" placeholder="e.g. 0.1" value={v.D} onChange={v => s('D', v)} />
        <Inp label="Velocity v (m/s)" placeholder="e.g. 2" value={v.vel} onChange={v => s('vel', v)} />
        <Inp label="Density ρ (kg/m³) — opt." placeholder="e.g. 1000" value={v.rho} onChange={v => s('rho', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Area A', val: res.A, unit: 'm²' },
            { label: 'Flow Q', val: res.Q, unit: 'm³/s' },
            { label: 'Flow Q', val: res.Qh, unit: 'm³/h' },
            ...(res.mdot != null ? [{ label: 'Mass Flow ṁ', val: res.mdot, unit: 'kg/s' }] : []),
          ]} />
          <FormulaBox text="A = πD²/4  |  Q = A·v  |  ṁ = ρQ" />
        </div>
      )}
    </div>
  )
}

function Conduction() {
  const [v, setV] = useState({ k: '', A: '', T1: '', T2: '', L: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const kv=+v.k, A=+v.A, T1=+v.T1, T2=+v.T2, L=+v.L
    if ([kv,A,T1,T2,L].some(isNaN)||L===0) return
    const Q = kv*A*(T1-T2)/L
    setRes({ Q, Qkw: Q/1000, Rth: L/(kv*A) })
  }
  return (
    <div>
      <InfoBox text="Fourier's Law: Q = kA(T₁−T₂)/L. k = thermal conductivity. Used for insulation design and furnace wall calculations." />
      <div className="g2 gap-md mb-md">
        <Inp label="k (W/m·K)" placeholder="e.g. 0.6 (water)" value={v.k} onChange={v => s('k', v)} />
        <Inp label="Area A (m²)" placeholder="e.g. 10" value={v.A} onChange={v => s('A', v)} />
        <Inp label="T₁ hot (°C)" placeholder="e.g. 150" value={v.T1} onChange={v => s('T1', v)} />
        <Inp label="T₂ cold (°C)" placeholder="e.g. 30" value={v.T2} onChange={v => s('T2', v)} />
        <Inp label="Thickness L (m)" placeholder="e.g. 0.05" value={v.L} onChange={v => s('L', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[{ label: 'Heat Rate Q', val: res.Q, unit: 'W' }, { label: 'Heat Rate Q', val: res.Qkw, unit: 'kW' }, { label: 'Thermal Resistance', val: res.Rth, unit: 'K/W' }]} />
          <FormulaBox text="Q = k·A·(T₁−T₂)/L  |  R_th = L/(kA)" />
        </div>
      )}
    </div>
  )
}

function Convection() {
  const [v, setV] = useState({ h: '', A: '', Ts: '', Tf: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const h=+v.h, A=+v.A, Ts=+v.Ts, Tf=+v.Tf
    if ([h,A,Ts,Tf].some(isNaN)) return
    setRes({ Q: h*A*(Ts-Tf), Qkw: h*A*(Ts-Tf)/1000 })
  }
  return (
    <div>
      <InfoBox text="Newton's Law: Q = hA(Ts−T∞). Typical h: natural air 5–25, forced air 25–250, water 500–10,000 W/m²·K." />
      <div className="g2 gap-md mb-md">
        <Inp label="h (W/m²·K)" placeholder="e.g. 500" value={v.h} onChange={v => s('h', v)} />
        <Inp label="Area A (m²)" placeholder="e.g. 5" value={v.A} onChange={v => s('A', v)} />
        <Inp label="Surface Ts (°C)" placeholder="e.g. 100" value={v.Ts} onChange={v => s('Ts', v)} />
        <Inp label="Fluid T∞ (°C)" placeholder="e.g. 25" value={v.Tf} onChange={v => s('Tf', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[{ label: 'Q', val: res.Q, unit: 'W' }, { label: 'Q', val: res.Qkw, unit: 'kW' }]} />
          <FormulaBox text="Q = h·A·(Ts−T∞)" />
        </div>
      )}
    </div>
  )
}

function Radiation() {
  const [v, setV] = useState({ eps: '', A: '', T: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const sigma = 5.67e-8
  const calc = () => {
    const eps=+v.eps, A=+v.A, T=+v.T+273.15
    if ([eps,A,T].some(isNaN)) return
    const Q = eps*sigma*A*T**4
    setRes({ Q, Qkw: Q/1000 })
  }
  return (
    <div>
      <InfoBox text="Stefan-Boltzmann: Q = εσAT⁴. ε = emissivity (0–1). σ = 5.67×10⁻⁸ W/m²K⁴. T must be in Kelvin." />
      <div className="g2 gap-md mb-md">
        <Inp label="Emissivity ε (0–1)" placeholder="e.g. 0.9" value={v.eps} onChange={v => s('eps', v)} />
        <Inp label="Area A (m²)" placeholder="e.g. 10" value={v.A} onChange={v => s('A', v)} />
        <Inp label="Surface T (°C)" placeholder="e.g. 500" value={v.T} onChange={v => s('T', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[{ label: 'Q', val: res.Q, unit: 'W' }, { label: 'Q', val: res.Qkw, unit: 'kW' }]} />
          <FormulaBox text="Q = ε·σ·A·T⁴  (T in Kelvin)" />
        </div>
      )}
    </div>
  )
}

function LMTDCalc() {
  const [v, setV] = useState({ Thi: '120', Tho: '60', Tci: '20', Tco: '70', config: 'counter' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const Thi=+v.Thi, Tho=+v.Tho, Tci=+v.Tci, Tco=+v.Tco
    if ([Thi,Tho,Tci,Tco].some(isNaN)) return
    const [dT1,dT2] = v.config==='counter' ? [Thi-Tco,Tho-Tci] : [Thi-Tci,Tho-Tco]
    const lmtd = dT1===dT2 ? dT1 : (dT1-dT2)/Math.log(Math.abs(dT1/dT2))
    setRes({ lmtd, dT1, dT2 })
  }
  return (
    <div>
      <InfoBox text="LMTD = (ΔT₁−ΔT₂)/ln(ΔT₁/ΔT₂). Counter-current always gives higher LMTD than co-current → more efficient." />
      <Sel label="Flow Config" value={v.config} onChange={v => s('config', v)} options={[{ value:'counter', label:'Counter-current (recommended)' }, { value:'co', label:'Co-current (parallel)' }]} />
      <div className="g2 gap-md mt-md mb-md">
        <Inp label="Hot Inlet Tₕᵢ (°C)" placeholder="e.g. 120" value={v.Thi} onChange={v => s('Thi', v)} />
        <Inp label="Hot Outlet Tₕₒ (°C)" placeholder="e.g. 60" value={v.Tho} onChange={v => s('Tho', v)} />
        <Inp label="Cold Inlet T꜀ᵢ (°C)" placeholder="e.g. 20" value={v.Tci} onChange={v => s('Tci', v)} />
        <Inp label="Cold Outlet T꜀ₒ (°C)" placeholder="e.g. 70" value={v.Tco} onChange={v => s('Tco', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate LMTD</button>
      {res && (
        <div className="result-panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <ResGrid items={[{ label: 'LMTD', val: res.lmtd, unit: '°C' }, { label: 'ΔT₁', val: res.dT1, unit: '°C' }, { label: 'ΔT₂', val: res.dT2, unit: '°C' }]} />
              <FormulaBox text="LMTD = (ΔT₁−ΔT₂)/ln(ΔT₁/ΔT₂)  |  Q = U·A·LMTD" />
            </div>
            <div>
              <TempProfileSVG 
                Thi={parseFloat(v.Thi)} Tho={parseFloat(v.Tho)}
                Tci={parseFloat(v.Tci)} Tco={parseFloat(v.Tco)}
                config={v.config} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Torque() {
  const [v, setV] = useState({ F: '', r: '', rpm: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const F=+v.F, r=+v.r, rpm=+v.rpm
    if (isNaN(F)||isNaN(r)) return
    const T = F*r, omega = rpm ? 2*Math.PI*rpm/60 : null, P = omega ? T*omega : null
    setRes({ T, omega, P, Pkw: P ? P/1000 : null })
  }
  return (
    <div>
      <InfoBox text="T = F×r (N·m). P = T×ω where ω = 2πN/60. Used for motor sizing, shaft design, pump power." />
      <div className="g2 gap-md mb-md">
        <Inp label="Force F (N)" placeholder="e.g. 500" value={v.F} onChange={v => s('F', v)} />
        <Inp label="Moment Arm r (m)" placeholder="e.g. 0.3" value={v.r} onChange={v => s('r', v)} />
        <Inp label="Speed N (RPM) — opt." placeholder="e.g. 1500" value={v.rpm} onChange={v => s('rpm', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Torque T', val: res.T, unit: 'N·m' },
            ...(res.omega ? [{ label: 'ω', val: res.omega, unit: 'rad/s' }] : []),
            ...(res.Pkw  ? [{ label: 'Power P', val: res.Pkw, unit: 'kW' }] : []),
          ]} />
          <FormulaBox text="T = F·r  |  ω = 2πN/60  |  P = T·ω" />
        </div>
      )}
    </div>
  )
}

function StressStrain() {
  const [v, setV] = useState({ F: '', A: '', E: '', L: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const F=+v.F, A=+v.A, E=+v.E*1e9, L=+v.L
    if (isNaN(F)||isNaN(A)||A===0) return
    const sigma = F/A
    const eps = E ? sigma/E : null
    const dL = (eps && L) ? eps*L : null
    setRes({ sigma, sMpa: sigma/1e6, eps, dL: dL ? dL*1000 : null })
  }
  return (
    <div>
      <InfoBox text="σ = F/A (stress). ε = σ/E (strain, Hooke's Law). Steel: E ≈ 200 GPa. Used for structural safety checks." />
      <div className="g2 gap-md mb-md">
        <Inp label="Force F (N)" placeholder="e.g. 50000" value={v.F} onChange={v => s('F', v)} />
        <Inp label="Area A (m²)" placeholder="e.g. 0.001" value={v.A} onChange={v => s('A', v)} />
        <Inp label="Young's E (GPa) — opt." placeholder="e.g. 200" value={v.E} onChange={v => s('E', v)} />
        <Inp label="Length L (m) — opt." placeholder="e.g. 1" value={v.L} onChange={v => s('L', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Stress σ', val: res.sigma, unit: 'Pa' },
            { label: 'Stress σ', val: res.sMpa, unit: 'MPa' },
            ...(res.eps  != null ? [{ label: 'Strain ε', val: res.eps, unit: 'm/m' }] : []),
            ...(res.dL   != null ? [{ label: 'Elongation ΔL', val: res.dL, unit: 'mm' }] : []),
          ]} />
          <FormulaBox text="σ = F/A  |  ε = σ/E  |  ΔL = ε·L" />
        </div>
      )}
    </div>
  )
}

function GearRatio() {
  const [v, setV] = useState({ N1: '', N2: '', T1: '', rpm1: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const N1=+v.N1, N2=+v.N2, T1=+v.T1, rpm1=+v.rpm1
    if (isNaN(N1)||isNaN(N2)||N1===0) return
    const GR = N2/N1
    setRes({ GR, rpm2: rpm1 ? rpm1/GR : null, T2: T1 ? T1*GR : null })
  }
  return (
    <div>
      <InfoBox text="GR = N₂/N₁. Speed reduces, torque increases proportionally. GR > 1 = speed reduction." />
      <div className="g2 gap-md mb-md">
        <Inp label="Driver Teeth N₁" placeholder="e.g. 20" value={v.N1} onChange={v => s('N1', v)} />
        <Inp label="Driven Teeth N₂" placeholder="e.g. 60" value={v.N2} onChange={v => s('N2', v)} />
        <Inp label="Input Torque T₁ (N·m) — opt." placeholder="e.g. 100" value={v.T1} onChange={v => s('T1', v)} />
        <Inp label="Input RPM — opt." placeholder="e.g. 1500" value={v.rpm1} onChange={v => s('rpm1', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Gear Ratio GR', val: res.GR, unit: ':1' },
            ...(res.rpm2 ? [{ label: 'Output RPM', val: res.rpm2, unit: 'RPM' }] : []),
            ...(res.T2   ? [{ label: 'Output Torque', val: res.T2, unit: 'N·m' }] : []),
          ]} />
          <FormulaBox text="GR = N₂/N₁  |  RPM₂ = RPM₁/GR  |  T₂ = T₁×GR" />
        </div>
      )}
    </div>
  )
}

function BeamLoad() {
  const [v, setV] = useState({ W: '', L: '', b: '', h: '', support: 'simply' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const W=+v.W, L=+v.L, b=+v.b/1000, h=+v.h/1000
    if (isNaN(W)||isNaN(L)) return
    const Mmax = v.support==='simply' ? W*L/4 : W*L/8
    const I = (b && h) ? b*h**3/12 : null
    const sigma = (I && h) ? Mmax*(h/2)/I/1e6 : null
    setRes({ Mmax, R: W/2, sigma })
  }
  return (
    <div>
      <InfoBox text="M = WL/4 (simply supported, center load). σ = My/I where I = bh³/12. Used for equipment support frames." />
      <div className="g2 gap-md mb-md">
        <Inp label="Load W (N)" placeholder="e.g. 10000" value={v.W} onChange={v => s('W', v)} />
        <Inp label="Span L (m)" placeholder="e.g. 3" value={v.L} onChange={v => s('L', v)} />
        <Inp label="Width b (mm) — opt." placeholder="e.g. 100" value={v.b} onChange={v => s('b', v)} />
        <Inp label="Height h (mm) — opt." placeholder="e.g. 200" value={v.h} onChange={v => s('h', v)} />
        <Sel label="Support Type" value={v.support} onChange={v => s('support', v)} options={[{ value:'simply', label:'Simply Supported' }, { value:'fixed', label:'Fixed Both Ends' }]} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Max Moment M', val: res.Mmax, unit: 'N·m' },
            { label: 'Reaction R', val: res.R, unit: 'N' },
            ...(res.sigma != null ? [{ label: 'Bending Stress σ', val: res.sigma, unit: 'MPa' }] : []),
          ]} />
          <FormulaBox text="M = WL/4 (simply) or WL/8 (fixed)  |  σ = My/I" />
        </div>
      )}
    </div>
  )
}

function OhmsLaw() {
  const [solve, setSolve] = useState('V')
  const [v, setV] = useState({ V: '', I: '', R: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    let r = {}
    if (solve==='V') { r.V = +v.I * +v.R; r.P = +v.I * +v.I * +v.R }
    else if (solve==='I') { r.I = +v.V / +v.R; r.P = +v.V * +v.V / +v.R }
    else { r.R = +v.V / +v.I; r.P = +v.V * +v.I }
    setRes(r)
  }
  const labels = { V:'Voltage (V)', I:'Current (A)', R:'Resistance (Ω)' }
  const placeholders = { V:'e.g. 220', I:'e.g. 10', R:'e.g. 22' }
  return (
    <div>
      <InfoBox text="V = IR (Ohm's Law). P = VI = I²R = V²/R. Foundation of all electrical circuit analysis." />
      <Sel label="Solve for" value={solve} onChange={v => { setSolve(v); setRes(null) }} options={['V','I','R'].map(k => ({ value:k, label:labels[k] }))} />
      <div className="g2 gap-md mt-md mb-md">
        {['V','I','R'].filter(k => k!==solve).map(k => (
          <Inp key={k} label={labels[k]} placeholder={placeholders[k]} value={v[k]} onChange={val => s(k, val)} />
        ))}
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Solve</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            ...(res.V != null ? [{ label: 'Voltage V', val: res.V, unit: 'V' }] : []),
            ...(res.I != null ? [{ label: 'Current I', val: res.I, unit: 'A' }] : []),
            ...(res.R != null ? [{ label: 'Resistance R', val: res.R, unit: 'Ω' }] : []),
            { label: 'Power P', val: res.P, unit: 'W' },
            { label: 'Power P', val: res.P/1000, unit: 'kW' },
          ]} />
          <FormulaBox text="V = I·R  |  P = V·I = I²R = V²/R" />
        </div>
      )}
    </div>
  )
}

function PowerFactor() {
  const [v, setV] = useState({ V: '', I: '', pf: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const Vv=+v.V, Iv=+v.I, pf=+v.pf
    if ([Vv,Iv,pf].some(isNaN)) return
    const S = Vv*Iv, P = S*pf, Q = Math.sqrt(S**2-P**2)
    setRes({ S, P, Q, angle: Math.acos(pf)*180/Math.PI })
  }
  return (
    <div>
      <InfoBox text="PF = P/S. S = VI (VA), P = S·PF (W real), Q = reactive (VAR). Utilities penalize PF < 0.85." />
      <div className="g2 gap-md mb-md">
        <Inp label="Voltage V (V)" placeholder="e.g. 380" value={v.V} onChange={v => s('V', v)} />
        <Inp label="Current I (A)" placeholder="e.g. 50" value={v.I} onChange={v => s('I', v)} />
        <Inp label="Power Factor (0–1)" placeholder="e.g. 0.85" value={v.pf} onChange={v => s('pf', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Apparent S', val: res.S, unit: 'VA' },
            { label: 'Real P', val: res.P, unit: 'W' },
            { label: 'Reactive Q', val: res.Q, unit: 'VAR' },
            { label: 'Phase Angle θ', val: res.angle, unit: '°' },
          ]} />
          <FormulaBox text="S = V·I  |  P = S·PF  |  Q = √(S²−P²)" />
        </div>
      )}
    </div>
  )
}

function Transformer() {
  const [v, setV] = useState({ V1: '', N1: '', N2: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const V1=+v.V1, N1=+v.N1, N2=+v.N2
    if ([V1,N1,N2].some(isNaN)||N1===0) return
    setRes({ V2: V1*N2/N1, turns: N2/N1 })
  }
  return (
    <div>
      <InfoBox text="V₂/V₁ = N₂/N₁. Step-up: N₂ > N₁. Step-down: N₂ < N₁. Used in power distribution and instrumentation." />
      <div className="g2 gap-md mb-md">
        <Inp label="Primary Voltage V₁ (V)" placeholder="e.g. 11000" value={v.V1} onChange={v => s('V1', v)} />
        <Inp label="Primary Turns N₁" placeholder="e.g. 1000" value={v.N1} onChange={v => s('N1', v)} />
        <Inp label="Secondary Turns N₂" placeholder="e.g. 100" value={v.N2} onChange={v => s('N2', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[{ label: 'Secondary V₂', val: res.V2, unit: 'V' }, { label: 'Turns Ratio', val: res.turns, unit: ':1' }]} />
          <FormulaBox text="V₂/V₁ = N₂/N₁" />
        </div>
      )}
    </div>
  )
}

function CapacitorEnergy() {
  const [v, setV] = useState({ C: '', V: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const C=+v.C*1e-6, V=+v.V
    if ([C,V].some(isNaN)) return
    setRes({ E: 0.5*C*V**2, EmJ: 0.5*C*V**2*1000, Q: C*V*1000 })
  }
  return (
    <div>
      <InfoBox text="E = ½CV². Q = CV. Used in power electronics, motor starters, and filter design." />
      <div className="g2 gap-md mb-md">
        <Inp label="Capacitance C (μF)" placeholder="e.g. 1000" value={v.C} onChange={v => s('C', v)} />
        <Inp label="Voltage V (V)" placeholder="e.g. 100" value={v.V} onChange={v => s('V', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[{ label: 'Energy E', val: res.E, unit: 'J' }, { label: 'Energy E', val: res.EmJ, unit: 'mJ' }, { label: 'Charge Q', val: res.Q, unit: 'mC' }]} />
          <FormulaBox text="E = ½CV²  |  Q = CV" />
        </div>
      )}
    </div>
  )
}

function EOQ() {
  const [v, setV] = useState({ D: '', S: '', H: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const D=+v.D, S=+v.S, H=+v.H
    if ([D,S,H].some(isNaN)||H===0) return
    const EOQ = Math.sqrt(2*D*S/H)
    setRes({ EOQ, orders: D/EOQ, TC: Math.sqrt(2*D*S*H), cycle: 365/(D/EOQ) })
  }
  return (
    <div>
      <InfoBox text="EOQ = √(2DS/H). Minimizes total inventory cost = ordering + holding cost." />
      <div className="g2 gap-md mb-md">
        <Inp label="Annual Demand D (units)" placeholder="e.g. 10000" value={v.D} onChange={v => s('D', v)} />
        <Inp label="Order Cost S ($/order)" placeholder="e.g. 150" value={v.S} onChange={v => s('S', v)} />
        <Inp label="Holding Cost H ($/unit/yr)" placeholder="e.g. 5" value={v.H} onChange={v => s('H', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'EOQ', val: res.EOQ, unit: 'units' },
            { label: 'Orders/Year', val: res.orders, unit: '—' },
            { label: 'Total Annual Cost', val: res.TC, unit: '$' },
            { label: 'Order Cycle', val: res.cycle, unit: 'days' },
          ]} />
          <FormulaBox text="EOQ = √(2DS/H)  |  TC = √(2DSH)" />
        </div>
      )}
    </div>
  )
}

function Productivity() {
  const [v, setV] = useState({ output: '', input: '', target: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const out=+v.output, inp=+v.input, tgt=+v.target
    if (isNaN(out)||isNaN(inp)||inp===0) return
    setRes({ prod: out/inp, eff: tgt ? (out/inp/tgt)*100 : null })
  }
  return (
    <div>
      <InfoBox text="Productivity = Output/Input. Efficiency = (Actual/Target)×100%. Core KPI for plant performance." />
      <div className="g2 gap-md mb-md">
        <Inp label="Output" placeholder="e.g. 850 units" value={v.output} onChange={v => s('output', v)} />
        <Inp label="Input" placeholder="e.g. 8 hours" value={v.input} onChange={v => s('input', v)} />
        <Inp label="Target — opt." placeholder="e.g. 120" value={v.target} onChange={v => s('target', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Productivity', val: res.prod, unit: 'output/input' },
            ...(res.eff != null ? [{ label: 'Efficiency vs Target', val: res.eff, unit: '%' }] : []),
          ]} />
          <FormulaBox text="Productivity = Output/Input  |  Eff = (Actual/Target)×100%" />
        </div>
      )}
    </div>
  )
}

function CycleTime() {
  const [v, setV] = useState({ available: '', demand: '', cycle: '' })
  const [res, setRes] = useState(null)
  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  const calc = () => {
    const avail=+v.available*3600, demand=+v.demand, cycle=+v.cycle
    if (isNaN(avail)||isNaN(demand)||demand===0) return
    const takt = avail/demand
    const cap = cycle ? avail/cycle : null
    setRes({ takt, cap, util: (cap && demand) ? (demand/cap)*100 : null })
  }
  return (
    <div>
      <InfoBox text="Takt = Available Time/Demand. If Cycle Time > Takt, you can't meet demand. Lean manufacturing core concept." />
      <div className="g2 gap-md mb-md">
        <Inp label="Available Time (hours/day)" placeholder="e.g. 8" value={v.available} onChange={v => s('available', v)} />
        <Inp label="Customer Demand (units/day)" placeholder="e.g. 400" value={v.demand} onChange={v => s('demand', v)} />
        <Inp label="Actual Cycle Time (sec) — opt." placeholder="e.g. 60" value={v.cycle} onChange={v => s('cycle', v)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <ResGrid items={[
            { label: 'Takt Time', val: res.takt, unit: 'sec/unit' },
            ...(res.cap  ? [{ label: 'Daily Capacity', val: res.cap, unit: 'units' }] : []),
            ...(res.util != null ? [{ label: 'Utilization', val: res.util, unit: '%' }] : []),
          ]} />
          <FormulaBox text="Takt = Available Time/Demand  |  Utilization = Demand/Capacity" />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  AI SOLVER — with typing animation
// ─────────────────────────────────────────────
function AISolver() {
  const [problem, setProblem] = useState('')
  const [result, setResult]   = useState('')
  const [loading, setLoading] = useState(false)
  const [typed, setTyped]     = useState('')
  const timerRef = useRef(null)

  const EXAMPLES = [
    "Hitung Reynolds number untuk air (ρ=1000 kg/m³, μ=0.001 Pa·s) mengalir 2 m/s di pipa diameter 5 cm",
    "Pressure drop pipa 50m, diameter 0.1m, f=0.02, rho=850 kg/m³, v=3 m/s",
    "LMTD counter-current: hot 120→60°C, cold 20→70°C. Berapa?",
    "Design CSTR: FA0=2 mol/s, X=80%, k=0.05 s⁻¹, CA0=500 mol/m³",
    "Pump power: ΔP=200 kPa, Q=0.05 m³/s, η=75%",
    "EOQ: demand 5000 unit/tahun, ordering cost $200, holding cost $8/unit/tahun",
  ]

  // Typing animation for AI response
  useEffect(() => {
    if (!result) return
    setTyped('')
    let i = 0
    timerRef.current = setInterval(() => {
      setTyped(result.slice(0, i))
      i += 4 // characters per tick
      if (i > result.length) clearInterval(timerRef.current)
    }, 12)
    return () => clearInterval(timerRef.current)
  }, [result])

  const solve = async () => {
    if (!problem.trim() || loading) return
    setLoading(true); setResult(''); setTyped('')
    try {
      const url = localStorage.getItem('ollama_url') || 'http://localhost:11434'
      const model = localStorage.getItem('ollama_model') || 'llama3'
      const res = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `Kamu adalah Engineering AI Solver untuk Devan, mahasiswa Teknik Kimia yang membangun platform Terra Nova Intelligence.

Format jawaban WAJIB seperti ini:
📋 GIVEN
[data yang diketahui]

🎯 FIND
[yang dicari]

📐 FORMULA
[rumus yang dipakai]

🔢 CALCULATION
[langkah step-by-step]

✅ ANSWER
[jawaban final dengan satuan]

💡 ENGINEERING INSIGHT
[insight praktis dari perspektif engineer]

Gunakan Bahasa Indonesia yang natural. Tampilkan angka dengan presisi yang tepat.`
            },
            { role: 'user', content: problem }
          ],
          temperature: 0.2
        }),
      })
      const data = await res.json()
      setResult(data.choices?.[0]?.message?.content || data.content?.[0]?.text || 'Maaf, ada masalah koneksi.')
    } catch (e) {
      setResult(`⚠️ Gagal menghubungi Ollama di http://localhost:11434. Pastikan Ollama berjalan (cmd: "ollama run llama3").\n\nDetail: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        background: 'linear-gradient(135deg, var(--card), rgba(0,255,180,0.03))',
        border: '1px solid var(--border-2)', borderRadius: 'var(--r-lg)', marginBottom: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--blue))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          boxShadow: '0 0 20px rgba(0,255,180,0.2)',
        }}>🤖</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>AI Engineering Solver</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-4)' }}>
            Powered by Claude · Solve any engineering problem in natural language
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span className="chip chip-green">● Live</span>
        </div>
      </div>

      {/* Example prompts */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-4)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
          Quick Examples
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {EXAMPLES.map(e => (
            <button key={e} onClick={() => setProblem(e)} disabled={loading}
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--border-1)',
                borderRadius: 8, padding: '8px 14px', textAlign: 'left',
                fontSize: '0.78rem', color: 'var(--text-3)', cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all var(--t-fast)',
                lineHeight: 1.4,
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor='var(--border-3)'; e.currentTarget.style.color='var(--text-1)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor='var(--border-1)'; e.currentTarget.style.color='var(--text-3)' }}
            >{e}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="mb-md">
        <label className="field-label">Problem Statement</label>
        <textarea
          placeholder="Deskripsikan problem engineering lo dalam bahasa natural..."
          value={problem}
          onChange={e => setProblem(e.target.value)}
          disabled={loading}
          style={{
            width: '100%', minHeight: 110, padding: '11px 14px',
            background: 'var(--input-bg)', border: '1px solid var(--border-2)',
            borderRadius: 10, color: 'var(--text-1)', fontSize: '0.88rem',
            fontFamily: 'var(--font-body)', resize: 'vertical', outline: 'none',
            lineHeight: 1.65, transition: 'all var(--t-fast)',
          }}
          onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accent-glow)' }}
          onBlur={e => { e.target.style.borderColor='var(--border-2)'; e.target.style.boxShadow='none' }}
        />
      </div>

      <button className="btn btn-accent w-full mb-md" onClick={solve}
        disabled={loading || !problem.trim()}
        style={{ fontSize: '0.9rem', padding: '13px', borderRadius: 10, fontWeight: 700 }}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <span style={{ width: 14, height: 14, border: '2px solid var(--void)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
            AI sedang menganalisis...
          </span>
        ) : '🤖 Solve dengan AI →'}
      </button>

      {/* Result with typing animation */}
      {(typed || loading) && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border-2)',
          borderRadius: 'var(--r-lg)', padding: '20px 22px',
          animation: 'fadeIn 0.2s var(--ease)',
          boxShadow: '0 0 40px rgba(0,255,180,0.05)',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>
            ◉ AI Solution
          </div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.87rem', lineHeight: 1.8, color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}>
            {typed}
            {loading && <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--accent)', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  THERMODYNAMICS CALCULATORS
// ─────────────────────────────────────────────
function AntoineCalc() {
  const [v, setV] = useState({ compound: 'water', T: '100', solveFor: 'P' })
  const [res, setRes] = useState(null)
  
  const COMPOUNDS = {
    water: { name: 'Water (H₂O)', A: 8.07131, B: 1730.63, C: 233.426 },
    benzene: { name: 'Benzene (C₆H₆)', A: 6.90565, B: 1211.03, C: 220.79 },
    toluene: { name: 'Toluene (C₇H₈)', A: 6.95334, B: 1343.94, C: 219.37 },
    ethanol: { name: 'Ethanol (C₂H₅OH)', A: 8.04494, B: 1554.30, C: 222.65 },
    methanol: { name: 'Methanol (CH₃OH)', A: 8.07240, B: 1574.99, C: 238.86 }
  }

  const s = (k, val) => setV(p => ({ ...p, [k]: val }))
  
  const calc = () => {
    const comp = COMPOUNDS[v.compound]
    if (v.solveFor === 'P') {
      const T = parseFloat(v.T)
      if (isNaN(T)) return
      const P_mmHg = Math.pow(10, comp.A - comp.B / (T + comp.C))
      const P_kPa = P_mmHg * 0.133322
      setRes({ P: P_kPa, T })
    } else {
      const P = parseFloat(v.P)
      if (isNaN(P) || P <= 0) return
      const P_mmHg = P / 0.133322
      const T = comp.B / (comp.A - Math.log10(P_mmHg)) - comp.C
      setRes({ P, T })
    }
  }

  return (
    <div>
      <InfoBox text="Antoine Equation: log₁₀(Psat) = A − B/(T + C). Calculates vapor pressure at a given temperature or boiling point temperature at a given pressure." />
      <div className="g3 gap-md mb-md">
        <Sel label="Compound" value={v.compound} onChange={val => s('compound', val)} options={Object.keys(COMPOUNDS).map(k => ({ value: k, label: COMPOUNDS[k].name }))} />
        <Sel label="Solve For" value={v.solveFor} onChange={val => s('solveFor', val)} options={[{ value: 'P', label: 'Vapor Pressure (P)' }, { value: 'T', label: 'Boiling Temperature (T)' }]} />
        {v.solveFor === 'P' ? (
          <Inp label="Temperature T (°C)" placeholder="e.g. 100" value={v.T} onChange={val => s('T', val)} />
        ) : (
          <Inp label="Pressure P (kPa)" placeholder="e.g. 101.3" value={v.P} onChange={val => s('P', val)} />
        )}
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Calculate</button>
      {res && (
        <div className="result-panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <ResGrid items={[{ label: 'Boiling Temp T', val: res.T, unit: '°C' }, { label: 'Vapor Press P', val: res.P, unit: 'kPa' }]} />
              <FormulaBox text={`log₁₀(Psat) = A - B/(T + C) \nCompound: ${COMPOUNDS[v.compound].name}`} />
            </div>
            <div>
              {(() => {
                const w = 220, h = 130
                const PL = 35, PR = 10, PT = 10, PB = 20
                const cW = w - PL - PR, cH = h - PT - PB
                const comp = COMPOUNDS[v.compound]

                const tStart = 0, tEnd = 150
                const getPsat = T => Math.pow(10, comp.A - comp.B / (T + comp.C)) * 0.133322
                const pMin = getPsat(tStart), pMax = getPsat(tEnd)

                const xScale = t => PL + ((t - tStart) / (tEnd - tStart)) * cW
                const yScale = p => PT + cH - ((p - pMin) / (pMax - pMin || 1)) * cH

                const pts = []
                for (let t = tStart; t <= tEnd; t += 5) {
                  pts.push(`${xScale(t).toFixed(1)},${yScale(getPsat(t)).toFixed(1)}`)
                }
                const curvePath = `M ${pts.join(' L ')}`

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#64748B', marginBottom: 4 }}>Vapor Pressure Curve</div>
                    <svg width={w} height={h} style={{ background: 'rgba(7,11,21,0.95)', border: '1px solid #1E293B', borderRadius: 8 }}>
                      <path d={curvePath} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
                      <line x1={PL} y1={yScale(101.3)} x2={w-PR} y2={yScale(101.3)} stroke="rgba(255,255,255,0.08)" strokeDasharray="3,3" />
                      <text x={w-PR-4} y={yScale(101.3) - 3} fontSize={5.5} fill="#475569" textAnchor="end">1 atm (101.3 kPa)</text>
                      
                      {res.T >= tStart && res.T <= tEnd && (
                        <circle cx={xScale(res.T)} cy={yScale(res.P)} r={4} fill="var(--accent)" style={{ filter: 'drop-shadow(0 0 3px var(--accent-glow))' }} />
                      )}

                      <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="#475569" strokeWidth={1} />
                      <line x1={PL} y1={PT + cH} x2={w-PR} y2={PT + cH} stroke="#475569" strokeWidth={1} />
                      <text x={PL + cW/2} y={h-4} fontSize={6.5} fill="#64748B" textAnchor="middle">Temp T (°C)</text>
                      <text x={PL - 5} y={PT + 3} fontSize={6.5} fill="#64748B" textAnchor="end">{pMax.toFixed(0)}</text>
                      <text x={PL - 5} y={PT + cH} fontSize={6.5} fill="#64748B" textAnchor="end">{pMin.toFixed(0)}</text>
                    </svg>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VLEFlashCalc() {
  const [v, setV] = useState({ pair: 'benzene_toluene', zA: '0.5', T: '85', P: '101.3' })
  const [res, setRes] = useState(null)
  
  const PAIRS = {
    benzene_toluene: {
      name: 'Benzene-Toluene',
      compA: { name: 'Benzene', A: 6.90565, B: 1211.03, C: 220.79 },
      compB: { name: 'Toluene', A: 6.95334, B: 1343.94, C: 219.37 }
    },
    methanol_water: {
      name: 'Methanol-Water',
      compA: { name: 'Methanol', A: 8.07240, B: 1574.99, C: 238.86 },
      compB: { name: 'Water', A: 8.07131, B: 1730.63, C: 233.42 }
    }
  }

  const s = (k, val) => setV(p => ({ ...p, [k]: val }))

  const calc = () => {
    const pair = PAIRS[v.pair]
    const zA = parseFloat(v.zA)
    const T = parseFloat(v.T)
    const P = parseFloat(v.P)
    if ([zA, T, P].some(isNaN) || zA < 0 || zA > 1 || P <= 0) return

    const getPsat = (comp, temp) => Math.pow(10, comp.A - comp.B / (temp + comp.C)) * 0.133322
    const PsatA = getPsat(pair.compA, T)
    const PsatB = getPsat(pair.compB, T)

    const KA = PsatA / P
    const KB = PsatB / P

    const f = psi => (zA * (KA - 1)) / (1 + psi * (KA - 1)) + ((1 - zA) * (KB - 1)) / (1 + psi * (KB - 1))

    let psi = 0.5
    let phase = 'Two-Phase (V/L)'
    
    const f0 = f(0)
    const f1 = f(1)

    if (f0 <= 0) {
      psi = 0
      phase = 'Subcooled Liquid'
    } else if (f1 >= 0) {
      psi = 1
      phase = 'Superheated Vapor'
    } else {
      for (let iter = 0; iter < 40; iter++) {
        const val = f(psi)
        const deriv = - (zA * Math.pow(KA - 1, 2)) / Math.pow(1 + psi * (KA - 1), 2)
                      - ((1 - zA) * Math.pow(KB - 1, 2)) / Math.pow(1 + psi * (KB - 1), 2)
        const nextPsi = psi - val / (deriv || 1e-6)
        if (Math.abs(nextPsi - psi) < 1e-6) {
          psi = nextPsi
          break
        }
        psi = Math.max(0, Math.min(1, nextPsi))
      }
    }

    const xA = zA / (1 + psi * (KA - 1))
    const yA = KA * xA

    setRes({ psi, phase, xA, yA, KA, KB, PsatA, PsatB, zA, T, P })
  }

  return (
    <div>
      <InfoBox text="Rachford-Rice Binary Flash: Solves vapour-liquid equilibrium flash separation using Raoult's Law and numerical root-finding." />
      <div className="g4 gap-sm mb-md">
        <Sel label="Chemical Pair" value={v.pair} onChange={val => s('pair', val)} options={Object.keys(PAIRS).map(k => ({ value: k, label: PAIRS[k].name }))} />
        <Inp label="Feed Fraction z_A (mol/mol)" placeholder="0.5" value={v.zA} onChange={val => s('zA', val)} />
        <Inp label="Flash Temp T (°C)" placeholder="85" value={v.T} onChange={val => s('T', val)} />
        <Inp label="Pressure P (kPa)" placeholder="101.3" value={v.P} onChange={val => s('P', val)} />
      </div>
      <button className="btn btn-accent w-full mb-md" onClick={calc}>Solve VLE Flash</button>
      {res && (
        <div className="result-panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: 6 }}>Phase State: {res.phase}</div>
              <ResGrid items={[
                { label: 'Vapour Fraction ψ', val: res.psi, unit: 'mol/mol' },
                { label: 'Liquid purity xA', val: res.xA, unit: 'mol/mol' },
                { label: 'Vapour purity yA', val: res.yA, unit: 'mol/mol' },
                { label: 'K-value A', val: res.KA, unit: '' }
              ]} />
            </div>
            <div>
              {(() => {
                const w = 220, h = 130
                const PL = 30, PR = 10, PT = 10, PB = 20
                const cW = w - PL - PR, cH = h - PT - PB
                const pair = PAIRS[v.pair]

                const getBoilTemp = x => {
                  const getTboil = comp => comp.B / (comp.A - Math.log10(res.P / 0.133322)) - comp.C
                  const Ta = getTboil(pair.compA)
                  const Tb = getTboil(pair.compB)
                  return Tb + x * (Ta - Tb)
                }

                const Ta = pair.compA.B / (pair.compA.A - Math.log10(res.P / 0.133322)) - pair.compA.C
                const Tb = pair.compB.B / (pair.compB.A - Math.log10(res.P / 0.133322)) - pair.compB.C
                const Tmin = Math.min(Ta, Tb) - 5
                const Tmax = Math.max(Ta, Tb) + 5
                
                const xScale = x => PL + x * cW
                const yScale = T => PT + cH - ((T - Tmin) / (Tmax - Tmin || 1)) * cH

                const bubblePts = [], dewPts = []
                for (let i = 0; i <= 10; i++) {
                  const x = i / 10
                  const T_bub = getBoilTemp(x)
                  bubblePts.push(`${xScale(x).toFixed(1)},${yScale(T_bub).toFixed(1)}`)
                  const T_dew = T_bub + 8 * x * (1 - x)
                  dewPts.push(`${xScale(x).toFixed(1)},${yScale(T_dew).toFixed(1)}`)
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: '#64748B', marginBottom: 4 }}>T-xy Phase Envelope (approx.)</div>
                    <svg width={w} height={h} style={{ background: 'rgba(7,11,21,0.95)', border: '1px solid #1E293B', borderRadius: 8 }}>
                      <path d={`M ${bubblePts.join(' L ')}`} fill="none" stroke="var(--accent)" strokeWidth={1} />
                      <path d={`M ${dewPts.join(' L ')}`} fill="none" stroke="#FACC15" strokeWidth={1} strokeDasharray="3,2" />
                      
                      <circle cx={xScale(res.zA)} cy={yScale(res.T)} r={4} fill={res.psi === 0 ? 'var(--accent)' : res.psi === 1 ? '#FACC15' : '#A855F7'} />

                      <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="#475569" strokeWidth={0.8} />
                      <line x1={PL} y1={PT + cH} x2={w-PR} y2={PT + cH} stroke="#475569" strokeWidth={0.8} />
                      <text x={PL + cW/2} y={h-4} fontSize={6.5} fill="#64748B" textAnchor="middle">Feed mole fraction z_A</text>
                    </svg>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
//  CALCULATOR MAP
// ─────────────────────────────────────────────
const CALC_COMPONENTS = {
  reynolds: Reynolds, pressure_drop: PressureDrop, bernoulli: Bernoulli,
  pipe_flow: PipeFlow, conduction: Conduction, convection: Convection,
  radiation: Radiation, lmtd: LMTDCalc, torque: Torque,
  stress_strain: StressStrain, gear_ratio: GearRatio, beam_load: BeamLoad,
  ohms_law: OhmsLaw, power_factor: PowerFactor, transformer: Transformer,
  capacitor: CapacitorEnergy, eoq: EOQ, productivity: Productivity,
  cycle_time: CycleTime, ai_solver: AISolver,
  antoine: AntoineCalc, vle_flash: VLEFlashCalc,
}

const CALC_REGISTRY = [
  { id: 'reynolds',     category: 'Fluid Mechanics', icon: '🌊', name: 'Reynolds Number',          desc: 'Laminar vs turbulent flow with dynamic profiles' },
  { id: 'pressure_drop',category: 'Fluid Mechanics', icon: '📉', name: 'Pressure Drop (Darcy)',     desc: 'Friction loss in pipes with visual gradient' },
  { id: 'bernoulli',    category: 'Fluid Mechanics', icon: '💧', name: 'Bernoulli Equation',        desc: 'Velocity, pressure & elevation relations' },
  { id: 'pipe_flow',    category: 'Fluid Mechanics', icon: '🔧', name: 'Pipe Flow Rate',            desc: 'Q from diameter & velocity' },
  { id: 'conduction',   category: 'Heat Transfer',   icon: '🔴', name: 'Conduction (Fourier)',      desc: 'Heat flux through solid boundary' },
  { id: 'convection',   category: 'Heat Transfer',   icon: '🟡', name: 'Convection (Newton)',       desc: 'Surface heat transfer' },
  { id: 'radiation',    category: 'Heat Transfer',   icon: '☀️', name: 'Radiation (Stefan-Boltz.)',  desc: 'Radiant heat from surfaces' },
  { id: 'lmtd',         category: 'Heat Transfer',   icon: '♨️', name: 'LMTD Calculator',           desc: 'Log mean temperature diff with graphical curves' },
  { id: 'torque',       category: 'Mechanical',      icon: '⚙️', name: 'Torque & Shaft Power',      desc: 'Rotational force & power' },
  { id: 'stress_strain',category: 'Mechanical',      icon: '🏗️', name: 'Stress & Strain',           desc: "Young's modulus & deformation" },
  { id: 'gear_ratio',   category: 'Mechanical',      icon: '🔩', name: 'Gear Ratio',                desc: 'Speed & torque transmission' },
  { id: 'beam_load',    category: 'Mechanical',      icon: '📐', name: 'Beam Bending Stress',       desc: 'Max stress in loaded beams' },
  { id: 'ohms_law',     category: 'Electrical',      icon: '⚡', name: "Ohm's Law",                 desc: 'V, I, R & power' },
  { id: 'power_factor', category: 'Electrical',      icon: '🔌', name: 'Power Factor',              desc: 'Real, reactive & apparent power' },
  { id: 'transformer',  category: 'Electrical',      icon: '🔋', name: 'Transformer',               desc: 'Turns ratio & voltage' },
  { id: 'capacitor',    category: 'Electrical',      icon: '📡', name: 'Capacitor Energy',          desc: 'Energy stored in capacitor' },
  { id: 'eoq',          category: 'Industrial',      icon: '📦', name: 'EOQ',                       desc: 'Optimal order quantity' },
  { id: 'productivity', category: 'Industrial',      icon: '📊', name: 'Productivity Index',        desc: 'Output per unit input' },
  { id: 'cycle_time',   category: 'Industrial',      icon: '⏱️', name: 'Cycle Time & Takt',         desc: 'Production rate analysis' },
  { id: 'ai_solver',    category: 'AI Solver',       icon: '🤖', name: 'AI Engineering Solver',     desc: 'Natural language → step-by-step solution', highlight: true },
  { id: 'antoine',      category: 'Thermodynamics',  icon: '🧪', name: 'Antoine Vapor Pressure',    desc: 'Vapor pressure and boiling point temperatures' },
  { id: 'vle_flash',    category: 'Thermodynamics',  icon: '⚗️', name: 'Binary VLE Flash Solver',    desc: 'Rachford-Rice binary separation and phase envelopes' },
]

const CATEGORIES = ['All', 'AI Solver', 'Fluid Mechanics', 'Heat Transfer', 'Thermodynamics', 'Mechanical', 'Electrical', 'Industrial']

const CAT_COLORS = {
  'Fluid Mechanics': '#38BDF8',
  'Heat Transfer':   '#F97316',
  'Thermodynamics':  'var(--accent)',
  'Mechanical':      '#A78BFA',
  'Electrical':      '#FACC15',
  'Industrial':      '#22D3EE',
  'AI Solver':       '#00FFB4',
}

// ─────────────────────────────────────────────
//  MAIN CALCULATOR HUB
// ─────────────────────────────────────────────
export default function CalculatorHub({ projectId, updateAppContext }) {
  const [activeCat, setActiveCat]   = useState('All')
  const [activeCalc, setActiveCalc] = useState(() => {
    const saved = localStorage.getItem('chempilot_calc_' + projectId)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const found = CALC_REGISTRY.find(c => c.id === parsed.activeCalcId)
        return found || null
      } catch (e) {}
    }
    return null
  })
  const [search, setSearch]         = useState('')
  const [hoveredId, setHoveredId]   = useState(null)

  // Save changes to localStorage and update global appContext whenever active calculator changes
  useEffect(() => {
    const data = { activeCalcId: activeCalc?.id || null }
    localStorage.setItem('chempilot_calc_' + projectId, JSON.stringify(data))

    if (updateAppContext) {
      updateAppContext('calc', {
        projectId,
        activeCalculator: activeCalc ? { id: activeCalc.id, name: activeCalc.name, category: activeCalc.category } : null
      })
    }
  }, [activeCalc, projectId])

  const filtered = CALC_REGISTRY.filter(c => {
    const matchCat  = activeCat === 'All' || c.category === activeCat
    const matchSrch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSrch
  })

  const ActiveComp = activeCalc ? CALC_COMPONENTS[activeCalc.id] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.15) 0%, rgba(10,18,30,0.4) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="g4">
          {[
            { num: '20', label: 'Calculators', icon: '⊞' },
            { num: '5',  label: 'Disciplines', icon: '📐' },
            { num: 'AI', label: 'Solver',       icon: '🤖' },
            { num: filtered.length, label: 'Showing', icon: '◈' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 2, opacity: 0.7 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em' }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filters Card */}
      {!activeCalc && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-title">🔍 Process Engineering Index</div>
          <input className="field-input" type="text"
            placeholder="Search solvers... (e.g. 'Reynolds', 'LMTD', 'Darcy')"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ fontSize: '0.88rem', padding: '11px 14px' }}
          />

          {/* Category filter — animated pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => {
              const isActive = activeCat === c
              const color = CAT_COLORS[c] || 'var(--accent)'
              return (
                <button key={c} onClick={() => setActiveCat(c)} className="btn"
                  style={{
                    padding: '6px 16px', fontSize: '0.76rem', fontWeight: 600,
                    borderRadius: 999, transition: 'all 0.18s var(--ease)',
                    background: isActive ? color : 'rgba(15,23,42,0.4)',
                    color: isActive ? 'var(--void)' : '#94a3b8',
                    border: `1px solid ${isActive ? 'transparent' : 'rgba(255,255,255,0.04)'}`,
                    boxShadow: isActive ? `0 0 16px ${color}40` : 'none',
                    transform: isActive ? 'scale(1.03)' : 'scale(1)',
                    fontFamily: 'var(--font-display)',
                  }}>
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Back button */}
      {activeCalc && (
        <button className="btn btn-ghost" onClick={() => setActiveCalc(null)}
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
          ← Back to Solvers Hub
        </button>
      )}

      {/* Active Calculator */}
      {activeCalc && ActiveComp && (
        <div className="card" style={{ animation: 'fadeIn 0.2s var(--ease)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: (CAT_COLORS[activeCalc.category] || 'var(--accent)') + '18',
              border: `1px solid ${(CAT_COLORS[activeCalc.category] || 'var(--accent)')}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{activeCalc.icon}</div>
            <div>
              <div className="card-title" style={{ marginBottom: 1 }}>{activeCalc.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>
                <span style={{ color: CAT_COLORS[activeCalc.category] || 'var(--accent)', fontWeight: 600 }}>{activeCalc.category}</span>
                <span style={{ color: 'var(--text-4)' }}> · {activeCalc.desc}</span>
              </div>
            </div>
          </div>
          <hr className="divider" style={{ margin: '0 0 18px', borderColor: 'rgba(255,255,255,0.04)' }} />
          <ActiveComp />
        </div>
      )}

      {/* Calculator Grid */}
      {!activeCalc && (
        filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.3 }}>⊞</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>No solvers found</div>
            <div style={{ fontSize: '0.82rem' }}>Try adjusting your search criteria.</div>
          </div>
        ) : (
          <div className="g3 gap-md">
            {filtered.map(c => {
              const color = CAT_COLORS[c.category] || 'var(--accent)'
              const isHov = hoveredId === c.id
              return (
                <GlowCard key={c.id} color={color}
                  onClick={() => setActiveCalc(c)}
                  style={{
                    background: c.highlight
                      ? 'linear-gradient(135deg, rgba(0,255,180,0.06), rgba(56,189,248,0.04))'
                      : 'rgba(10,18,30,0.35)',
                    border: `1px solid ${isHov ? color + '60' : c.highlight ? 'var(--border-2)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: 'var(--r-lg)', padding: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.22s var(--ease)',
                    transform: isHov ? 'translateY(-3px)' : 'none',
                    boxShadow: isHov ? `0 12px 30px rgba(0,0,0,0.45), 0 0 0 1px ${color}30` : c.highlight ? '0 0 24px rgba(0,255,180,0.06)' : 'var(--shadow-card)',
                  }}
                  onMouseOver={() => setHoveredId(c.id)}
                  onMouseOut={() => setHoveredId(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: '1.5rem' }}>{c.icon}</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.56rem', fontWeight: 700,
                      padding: '2px 7px', borderRadius: 999,
                      background: color + '15', color,
                      border: `1px solid ${color}30`,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{c.category}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', marginBottom: 5, color: 'var(--text-1)' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>
                    {c.desc}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.66rem',
                    color: isHov ? color : 'var(--text-4)',
                    transition: 'color 0.15s',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    Open <span style={{ transition: 'transform 0.15s', transform: isHov ? 'translateX(3px)' : 'none', display: 'inline-block' }}>→</span>
                  </div>
                </GlowCard>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}