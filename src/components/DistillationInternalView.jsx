/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA — DISTILLATION COLUMN INTERNAL VIEW
 *  Tray-by-tray temperature & vapor-liquid profile visualization.
 *
 *  Physics:
 *  - Uses McCabe-Thiele stepping to generate per-tray x,y data
 *  - Temperature per tray interpolated between T_condenser and T_reboiler
 *    weighted by equilibrium-line stepping position
 *  - Feed tray located via Kirkbride equation
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useMemo } from 'react'

// ─── Generate tray-by-tray profile ───────────────────────────────
// Returns array of { tray (1=top), x, y, T, isEnriching, isFeed }
function generateTrayProfile(alpha, R, xD, xB, zF, q, N_actual, T_cond, T_reb) {
  if (!alpha || alpha <= 1 || R <= 0 || xD <= xB) return []

  // Operating line intersect (q-line + rectifying OL)
  const slopeR = R / (R + 1)
  const interceptR = xD / (R + 1)

  let xi, yi
  if (Math.abs(q - 1) < 1e-4) {
    xi = zF
    yi = slopeR * zF + interceptR
  } else {
    const slopeQ = q / (q - 1)
    const interceptQ = -zF / (q - 1)
    xi = (interceptQ - interceptR) / (slopeR - slopeQ)
    yi = slopeR * xi + interceptR
  }
  xi = Math.max(xB, Math.min(xD, xi))
  yi = Math.max(xB, Math.min(xD, yi))

  // Step through stages top-down, recording x,y per tray
  const rawStages = []
  let cx = xD, cy = xD
  let iter = 0
  while (cx > xB && iter < 80) {
    iter++
    const nextX = cy / (alpha - (alpha - 1) * cy)
    cx = nextX
    if (cx <= xB) break

    let nextY
    if (cx > xi) {
      nextY = slopeR * cx + interceptR  // enriching section
    } else {
      const slopeS = (yi - xB) / (xi - xB || 1e-5)
      nextY = slopeS * (cx - xB) + xB  // stripping section
    }
    nextY = Math.max(xB, Math.min(xD, nextY))
    rawStages.push({ x: cx, y: cy, isEnriching: cx > xi })
    cy = nextY
  }

  // Scale to N_actual stages
  const totalStages = rawStages.length || 1
  const scale = N_actual / totalStages

  // Find feed tray: Kirkbride equation (approximated — where we cross xi)
  let feedTrayRaw = 0
  for (let i = 0; i < rawStages.length; i++) {
    if (rawStages[i].x < xi) { feedTrayRaw = i; break }
  }

  const trays = rawStages.map((s, i) => {
    const trayNum = Math.round((i + 1) * scale)
    // Temperature: linear interpolation T_cond (top) to T_reb (bottom) weighted by liquid mole fraction
    // x_tray close to xD → near condenser, x_tray close to xB → near reboiler
    const xFrac = (xD - s.x) / Math.max(0.001, xD - xB)
    const T = T_cond + xFrac * (T_reb - T_cond)
    return {
      tray: trayNum,
      rawIdx: i,
      x: s.x,           // liquid mole fraction (A)
      y: s.y,           // vapor mole fraction (A)
      T,                 // tray temperature (°C)
      isEnriching: s.isEnriching,
      isFeed: i === feedTrayRaw
    }
  })

  return trays
}

// ─── COLUMN SVG CROSS-SECTION ────────────────────────────────────
function ColumnSVG({ trays, xD, xB, feedTray }) {
  const W = 80, H = 320
  const colX = 22, colW = 36

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      {/* Column shell */}
      <rect x={colX} y={8} width={colW} height={H - 16} rx={5}
        fill="rgba(14,20,38,0.9)" stroke="#1E293B" strokeWidth={1.5} />

      {/* Condenser at top */}
      <rect x={colX - 6} y={2} width={colW + 12} height={16} rx={4}
        fill="rgba(56,189,248,0.15)" stroke="#38BDF8" strokeWidth={1} />
      <text x={W / 2} y={13} textAnchor="middle" fontSize={6} fill="#38BDF8" fontFamily="monospace">COND</text>

      {/* Reboiler at bottom */}
      <rect x={colX - 6} y={H - 18} width={colW + 12} height={16} rx={4}
        fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth={1} />
      <text x={W / 2} y={H - 7} textAnchor="middle" fontSize={6} fill="#EF4444" fontFamily="monospace">REB</text>

      {/* Trays */}
      {trays.map((t, i) => {
        const yPos = 18 + (i / Math.max(1, trays.length - 1)) * (H - 52)
        const liqFrac = (xD - t.x) / Math.max(0.001, xD - xB)
        const vapFrac = t.y / Math.max(0.001, xD)
        const col = t.isEnriching ? '#0EA5E9' : '#F97316'
        const trayAlpha = t.isFeed ? 1 : 0.55

        // Get next tray position for animating flow between stages
        const nextYPos = i < trays.length - 1 
          ? 18 + ((i + 1) / Math.max(1, trays.length - 1)) * (H - 52)
          : null;

        return (
          <g key={i}>
            {/* Tray line */}
            <line x1={colX + 2} y1={yPos} x2={colX + colW - 2} y2={yPos}
              stroke={col} strokeWidth={t.isFeed ? 2 : 1} opacity={trayAlpha} />

            {/* Liquid layer on tray */}
            <rect x={colX + 2} y={yPos - 2} width={(colW - 4) * liqFrac * 0.8} height={2}
              fill={col} opacity={0.4 + liqFrac * 0.4} />

            {/* Animated inter-stage flows */}
            {nextYPos && (
              <>
                {/* Rising Vapor Bubbles (Light Yellow/Gold) */}
                <circle r={1.0} fill="#FACC15" opacity={0.65}>
                  <animate attributeName="cy" from={nextYPos} to={yPos} dur="1.8s" begin={`${(i * 0.3) % 2.0}s`} repeatCount="indefinite" />
                  <animate attributeName="cx" values={`${colX + 12}; ${colX + 18}; ${colX + 10}; ${colX + 14}`} dur="1.8s" begin={`${(i * 0.3) % 2.0}s`} repeatCount="indefinite" />
                </circle>
                <circle r={0.8} fill="#FFF" opacity={0.5}>
                  <animate attributeName="cy" from={nextYPos} to={yPos} dur="1.3s" begin={`${(i * 0.5 + 0.4) % 1.8}s`} repeatCount="indefinite" />
                  <animate attributeName="cx" values={`${colX + 25}; ${colX + 20}; ${colX + 28}; ${colX + 22}`} dur="1.3s" begin={`${(i * 0.5 + 0.4) % 1.8}s`} repeatCount="indefinite" />
                </circle>

                {/* Falling Liquid Droplets (Blue/Orange) */}
                <circle r={0.9} fill={col} opacity={0.75}>
                  <animate attributeName="cy" from={yPos} to={nextYPos} dur="1.4s" begin={`${(i * 0.4 + 0.2) % 1.5}s`} repeatCount="indefinite" />
                  <animate attributeName="cx" values={`${colX + 6}; ${colX + 9}; ${colX + 7}`} dur="1.4s" begin={`${(i * 0.4 + 0.2) % 1.5}s`} repeatCount="indefinite" />
                </circle>
                <circle r={0.7} fill={col} opacity={0.6}>
                  <animate attributeName="cy" from={yPos} to={nextYPos} dur="1.0s" begin={`${(i * 0.2 + 0.7) % 1.2}s`} repeatCount="indefinite" />
                  <animate attributeName="cx" values={`${colX + 30}; ${colX + 27}; ${colX + 29}`} dur="1.0s" begin={`${(i * 0.2 + 0.7) % 1.2}s`} repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Feed arrow */}
            {t.isFeed && (
              <>
                <line x1={colX - 12} y1={yPos} x2={colX + 2} y2={yPos}
                  stroke="#A855F7" strokeWidth={1.5} markerEnd="url(#feedArr)" />
                <text x={colX - 14} y={yPos - 2} textAnchor="end" fontSize={5.5} fill="#A855F7" fontFamily="monospace">FEED</text>
              </>
            )}
          </g>
        )
      })}

      {/* Vapor flow arrow up */}
      <line x1={W - 8} y1={H - 30} x2={W - 8} y2={28}
        stroke="rgba(245,166,35,0.3)" strokeWidth={1} strokeDasharray="2,2"
        markerEnd="url(#vapArr)" />

      {/* Liquid flow arrow down */}
      <line x1={colX - 1} y1={28} x2={colX - 1} y2={H - 30}
        stroke="rgba(14,165,233,0.3)" strokeWidth={1} strokeDasharray="2,2"
        markerEnd="url(#liqArr)" />

      {/* Arrow markers */}
      <defs>
        <marker id="feedArr" markerWidth={6} markerHeight={6} refX={3} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#A855F7" />
        </marker>
        <marker id="vapArr" markerWidth={5} markerHeight={5} refX={2.5} refY={2.5} orient="auto">
          <path d="M0,5 L5,2.5 L0,0" fill="rgba(245,166,35,0.6)" />
        </marker>
        <marker id="liqArr" markerWidth={5} markerHeight={5} refX={2.5} refY={2.5} orient="auto">
          <path d="M0,0 L5,2.5 L0,5" fill="rgba(14,165,233,0.6)" />
        </marker>
      </defs>
    </svg>
  )
}

// ─── TEMPERATURE PROFILE BAR CHART ───────────────────────────────
function TempProfileChart({ trays, T_cond, T_reb }) {
  if (!trays.length) return null
  const W = 200, H = 220
  const PL = 38, PR = 10, PT = 16, PB = 24
  const cW = W - PL - PR, cH = H - PT - PB

  const xS = i => PL + (i / Math.max(1, trays.length - 1)) * cW
  const Tmin = Math.min(T_cond - 5, ...trays.map(t => t.T))
  const Tmax = Math.max(T_reb + 5, ...trays.map(t => t.T))
  const yS = T => PT + cH - ((T - Tmin) / Math.max(1, Tmax - Tmin)) * cH

  const linePath = trays.map((t, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(t.T).toFixed(1)}`).join(' ')

  // Gradient fill
  const fillPath = linePath + ` L${xS(trays.length - 1).toFixed(1)},${PT + cH} L${PL},${PT + cH} Z`

  return (
    <div>
      <div style={{ fontSize: '0.54rem', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Temperature Profile (Top → Bottom)
      </div>
      <svg width={W} height={H} style={{ background: 'rgba(7,11,21,0.7)', borderRadius: 8, border: '1px solid #1E293B', display: 'block' }}>
        {/* Grid */}
        {[0, 0.33, 0.66, 1].map(f => {
          const T = Tmin + f * (Tmax - Tmin)
          return <line key={f} x1={PL} y1={yS(T)} x2={PL + cW} y2={yS(T)} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} strokeDasharray="2,2" />
        })}

        {/* Gradient fill */}
        <defs>
          <linearGradient id="tempGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path d={fillPath} fill="url(#tempGrad)" />
        <path d={linePath} fill="none" stroke="#F5A623" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 3px rgba(245,166,35,0.5))' }} />

        {/* Feed tray marker */}
        {trays.filter(t => t.isFeed).map(t => (
          <line key="feed" x1={xS(t.rawIdx)} y1={PT} x2={xS(t.rawIdx)} y2={PT + cH}
            stroke="#A855F7" strokeWidth={1} strokeDasharray="3,2" opacity={0.6} />
        ))}

        {/* Axes */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="#1E293B" strokeWidth={1} />
        <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="#1E293B" strokeWidth={1} />

        {/* Axis labels */}
        {[T_cond, (T_cond + T_reb) / 2, T_reb].map((T, i) => (
          <text key={i} x={PL - 4} y={yS(T) + 3} textAnchor="end" fontSize={6} fill="#475569" fontFamily="monospace">
            {T.toFixed(0)}°
          </text>
        ))}
        <text x={PL + cW / 2} y={H - 6} textAnchor="middle" fontSize={6} fill="#475569">Stage (Top → Bottom)</text>
        <text x={8} y={PT + cH / 2} fontSize={6} fill="#475569" textAnchor="middle" transform={`rotate(-90,8,${PT + cH / 2})`}>T (°C)</text>
      </svg>
    </div>
  )
}

// ─── VLE PER-TRAY PROFILE ────────────────────────────────────────
function VLEProfileChart({ trays }) {
  if (!trays.length) return null
  const W = 200, H = 180
  const PL = 30, PR = 10, PT = 16, PB = 24
  const cW = W - PL - PR, cH = H - PT - PB

  const xS = i => PL + (i / Math.max(1, trays.length - 1)) * cW
  const yS = v => PT + cH - v * cH

  const xPath = trays.map((t, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(t.x).toFixed(1)}`).join(' ')
  const yPath = trays.map((t, i) => `${i === 0 ? 'M' : 'L'}${xS(i).toFixed(1)},${yS(t.y).toFixed(1)}`).join(' ')

  return (
    <div>
      <div style={{ fontSize: '0.54rem', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        VLE Tray Profile (Liquid x / Vapor y)
      </div>
      <svg width={W} height={H} style={{ background: 'rgba(7,11,21,0.7)', borderRadius: 8, border: '1px solid #1E293B', display: 'block' }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <line key={v} x1={PL} y1={yS(v)} x2={PL + cW} y2={yS(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} strokeDasharray="2,2" />
        ))}

        {/* Feed tray */}
        {trays.filter(t => t.isFeed).map(t => (
          <line key="feed" x1={xS(t.rawIdx)} y1={PT} x2={xS(t.rawIdx)} y2={PT + cH}
            stroke="#A855F7" strokeWidth={1} strokeDasharray="3,2" opacity={0.6} />
        ))}

        {/* Liquid mole fraction profile */}
        <path d={xPath} fill="none" stroke="var(--accent)" strokeWidth={1.8} style={{ filter: 'drop-shadow(0 0 2px rgba(0,255,163,0.4))' }} />
        {/* Vapor mole fraction profile */}
        <path d={yPath} fill="none" stroke="#FACC15" strokeWidth={1.8} strokeDasharray="5,3" style={{ filter: 'drop-shadow(0 0 2px rgba(250,204,21,0.4))' }} />

        {/* Enriching / stripping boundary */}
        {(() => {
          const t = trays.find(t => !t.isEnriching)
          if (!t) return null
          return <line x1={xS(t.rawIdx)} y1={PT} x2={xS(t.rawIdx)} y2={PT + cH}
            stroke="#F97316" strokeWidth={0.8} strokeDasharray="2,2" opacity={0.5} />
        })()}

        {/* Axes */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="#1E293B" strokeWidth={1} />
        <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="#1E293B" strokeWidth={1} />

        {[0, 0.5, 1].map(v => (
          <text key={v} x={PL - 3} y={yS(v) + 3} textAnchor="end" fontSize={6} fill="#475569">{v.toFixed(1)}</text>
        ))}
        <text x={PL + cW / 2} y={H - 6} textAnchor="middle" fontSize={6} fill="#475569">Stage</text>

        {/* Legend */}
        <line x1={PL + cW - 60} y1={PT + 8} x2={PL + cW - 50} y2={PT + 8} stroke="var(--accent)" strokeWidth={1.5} />
        <text x={PL + cW - 48} y={PT + 11} fontSize={6} fill="var(--accent)">x (Liquid)</text>
        <line x1={PL + cW - 60} y1={PT + 18} x2={PL + cW - 50} y2={PT + 18} stroke="#FACC15" strokeWidth={1.5} strokeDasharray="3,2" />
        <text x={PL + cW - 48} y={PT + 21} fontSize={6} fill="#FACC15">y (Vapor)</text>
      </svg>
    </div>
  )
}

// ─── MAIN EXPORTED COMPONENT ──────────────────────────────────────
export default function DistillationInternalView({ node, params, inletStream, compA, compB, alpha, onClose }) {
  const [activeSection, setActiveSection] = useState('tray')

  const p = params || {}
  const R = parseFloat(p.refluxRatio) || 2.5
  const xD = Math.min(0.999, (parseFloat(p.distillatePurity) || 95) / 100)
  const xB = Math.max(0.001, (parseFloat(p.bottomsPurity) || 5) / 100)
  const zF = inletStream?.zA ?? 0.5
  const q = parseFloat(p.feedQuality) ?? 1.0
  const N_actual = Math.max(2, Math.round((node?.results || []).find(r => r.label === 'Actual Stages N')?.val || 12))
  const T_cond = (node?.results || []).find(r => r.label === 'Distillate T (Dew)')?.val || 80
  const T_reb = (node?.results || []).find(r => r.label === 'Bottoms T (Bubble)')?.val || 110
  const Qc = (node?.results || []).find(r => r.label === 'Condenser Duty Qc')?.val || 0
  const Qr = (node?.results || []).find(r => r.label === 'Reboiler Duty Qr')?.val || 0
  const diam = (node?.results || []).find(r => r.label === 'Column Diameter')?.val || '—'

  const trays = useMemo(() => {
    try {
      return generateTrayProfile(alpha, R, xD, xB, zF, q, N_actual, T_cond, T_reb)
    } catch (e) {
      return []
    }
  }, [alpha, R, xD, xB, zF, q, N_actual, T_cond, T_reb])

  const feedTrayNum = trays.find(t => t.isFeed)?.tray || Math.round(N_actual / 2)
  const enrichingTrays = trays.filter(t => t.isEnriching).length
  const strippingTrays = trays.filter(t => !t.isEnriching).length

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 720, maxHeight: '90vh', background: 'rgba(10,14,26,0.98)',
        border: '1px solid #1E293B', borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid #1E293B',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(10,14,26,0) 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>🗼</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F1F5F9' }}>
                  {node?.tag} — Column Internals
                </div>
                <div style={{ fontSize: '0.63rem', color: '#0EA5E9', fontFamily: 'monospace', marginTop: 2 }}>
                  N = {N_actual} stages · Feed @ Tray {feedTrayNum} · Ø {typeof diam === 'number' ? diam.toFixed(2) : diam} m
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid #1E293B',
            borderRadius: 8, color: '#64748B', padding: '6px 14px', cursor: 'pointer', fontSize: '0.75rem'
          }}>
            ✕ Close
          </button>
        </div>

        {/* Quick-stats banner */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid #1E293B', background: 'rgba(0,0,0,0.3)'
        }}>
          {[
            { label: 'Enriching Trays', val: enrichingTrays, color: '#0EA5E9' },
            { label: 'Stripping Trays', val: strippingTrays, color: '#F97316' },
            { label: 'Feed Quality q', val: q.toFixed(2), color: '#A855F7' },
            { label: 'Condenser Qc', val: `${Qc.toFixed(0)} kW`, color: '#38BDF8' },
            { label: 'Reboiler Qr', val: `${Qr.toFixed(0)} kW`, color: '#EF4444' },
            { label: 'Distillate xD', val: `${(xD * 100).toFixed(1)}%`, color: 'var(--accent)' },
            { label: 'Bottoms xB', val: `${(xB * 100).toFixed(1)}%`, color: '#FACC15' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #1E293B' }}>
              <div style={{ fontSize: '0.52rem', color: '#475569', letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: s.color, marginTop: 2 }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1E293B', background: 'rgba(0,0,0,0.2)' }}>
          {[
            ['tray', '🗼 Tray View'],
            ['temp', '🌡 Temperature Profile'],
            ['vle', '⚗️ VLE per Stage'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setActiveSection(k)} style={{
              padding: '10px 20px', background: activeSection === k ? 'rgba(14,165,233,0.1)' : 'transparent',
              border: 'none', borderBottom: `2px solid ${activeSection === k ? '#0EA5E9' : 'transparent'}`,
              color: activeSection === k ? '#0EA5E9' : '#475569',
              fontSize: '0.72rem', fontWeight: activeSection === k ? 700 : 400,
              cursor: 'pointer'
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          {activeSection === 'tray' && (
            <div style={{ display: 'flex', gap: 24 }}>
              <ColumnSVG trays={trays} xD={xD} xB={xB} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Per-Tray Data
                </div>
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1E293B' }}>
                        {['Tray', 'Section', 'x_A (liq)', 'y_A (vap)', 'T (°C)'].map(h => (
                          <th key={h} style={{ color: '#475569', textAlign: 'right', padding: '4px 8px', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trays.map((t, i) => (
                        <tr key={i} style={{
                          background: t.isFeed ? 'rgba(168,85,247,0.08)' : i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                          borderBottom: '1px solid rgba(255,255,255,0.02)'
                        }}>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: t.isFeed ? '#A855F7' : '#F1F5F9', fontWeight: t.isFeed ? 700 : 400 }}>
                            {t.tray}{t.isFeed ? ' ★' : ''}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: t.isEnriching ? '#0EA5E9' : '#F97316' }}>
                            {t.isEnriching ? 'Enriching' : 'Stripping'}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--accent)' }}>{(t.x * 100).toFixed(2)}%</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: '#FACC15' }}>{(t.y * 100).toFixed(2)}%</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', color: '#F5A623' }}>{t.T.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'temp' && (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <TempProfileChart trays={trays} T_cond={T_cond} T_reb={T_reb} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Condenser T (Dew Point)', val: `${T_cond.toFixed(1)}°C`, color: '#38BDF8' },
                    { label: 'Reboiler T (Bubble Point)', val: `${T_reb.toFixed(1)}°C`, color: '#EF4444' },
                    { label: 'ΔT Column', val: `${(T_reb - T_cond).toFixed(1)}°C`, color: '#F5A623' },
                    { label: 'Feed Tray T', val: trays.find(t => t.isFeed)?.T ? `${trays.find(t => t.isFeed).T.toFixed(1)}°C` : '—', color: '#A855F7' },
                  ].map(r => (
                    <div key={r.label} style={{ padding: '10px 14px', background: 'rgba(15,23,42,0.7)', borderRadius: 8, border: '1px solid #1E293B' }}>
                      <div style={{ fontSize: '0.62rem', color: '#64748B', marginBottom: 3 }}>{r.label}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700, color: r.color }}>{r.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'vle' && (
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <VLEProfileChart trays={trays} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.62rem', color: '#64748B', marginBottom: 10 }}>
                  Vapor-Liquid Equilibrium Profile
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(0,255,163,0.05)', borderRadius: 6, border: '1px solid rgba(0,255,163,0.15)', fontSize: '0.65rem', color: 'var(--accent)' }}>
                    <strong>Liquid (x_A)</strong>: Mole fraction of light key in liquid phase per tray.
                    Decreases from top (xD) to bottom (xB).
                  </div>
                  <div style={{ padding: '8px 12px', background: 'rgba(250,204,21,0.05)', borderRadius: 6, border: '1px solid rgba(250,204,21,0.15)', fontSize: '0.65rem', color: '#FACC15' }}>
                    <strong>Vapor (y_A)</strong>: Mole fraction of light key in vapor phase.
                    Always above x_A due to VLE equilibrium (y = αx / (1 + (α-1)x)).
                  </div>
                  <div style={{ padding: '8px 12px', background: 'rgba(168,85,247,0.05)', borderRadius: 6, border: '1px solid rgba(168,85,247,0.15)', fontSize: '0.65rem', color: '#A855F7' }}>
                    <strong>Feed Stage ★</strong>: Tray {feedTrayNum} — transition from rectifying to stripping operating line.
                  </div>
                  <div style={{ padding: '8px 12px', background: 'rgba(249,115,22,0.05)', borderRadius: 6, border: '1px solid rgba(249,115,22,0.15)', fontSize: '0.65rem', color: '#F97316' }}>
                    <strong>Section boundary</strong>: Orange line marks enriching (top) vs stripping (bottom) section split.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
