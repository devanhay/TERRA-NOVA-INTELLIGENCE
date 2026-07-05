import { useState, useRef, useEffect, useMemo } from 'react'

// ─────────────────────────────────────────────
//  ENGINEERING CORE — Shortcut Methods
//  Metode: Fenske-Underwood-Gilliland & McCabe-Thiele
// ─────────────────────────────────────────────

function solveFenske(xLK_D, xHK_D, xLK_B, xLK_B_imp, alpha) {
  // xLK_D = LK purity in distillate
  // xHK_D = HK impurity in distillate
  // xLK_B = LK impurity in bottoms
  // xHK_B = HK purity in bottoms (which is 1 - xLK_B)
  const HK_bottoms = 1 - xLK_B
  if ([xLK_D, xHK_D, xLK_B, alpha].some(isNaN)) return null
  if (alpha <= 1) return null
  if (xHK_D <= 0 || xLK_B <= 0 || HK_bottoms <= 0) return null
  return Math.log((xLK_D / xHK_D) * (HK_bottoms / xLK_B)) / Math.log(alpha)
}

function solveUnderwood(alpha, zF, q, xLK_D) {
  if ([alpha, zF, q, xLK_D].some(isNaN)) return null
  // Bisection to find theta between 1 and alpha
  let lo = 1.0001, hi = alpha - 0.0001
  const xHK_F = 1 - zF
  const xHK_D = 1 - xLK_D

  const f = t => (alpha * zF) / (alpha - t) + xHK_F / (1 - t) - (1 - q)
  
  // Safeguard: Check if signs are same at bounds. If so, return a default Rmin fallback.
  if (Math.sign(f(lo)) === Math.sign(f(hi))) {
    return { theta: (alpha + 1)/2, Rmin: 1.2 }
  }

  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2
    if (f(lo) * f(mid) < 0) hi = mid; else lo = mid
  }
  const theta = (lo + hi) / 2
  const Rmin = (alpha * xLK_D) / (alpha - theta) + xHK_D / (1 - theta) - 1
  return { theta, Rmin: Math.max(0.01, Rmin) }
}

function solveGilliland(Nmin, Rmin, R) {
  if ([Nmin, Rmin, R].some(isNaN) || R <= Rmin) return null
  const X = (R - Rmin) / (R + 1)
  if (X <= 0 || X >= 1) return null
  const Y = 1 - Math.exp(((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X)))
  const N = (Y + Nmin) / (1 - Y)
  return { X, Y, N: Math.ceil(N) }
}

function solveDiameter(Vflow, rhoV, rhoL, Csb) {
  if ([Vflow, rhoV, rhoL, Csb].some(isNaN)) return null
  const uflood  = Csb * Math.sqrt((rhoL - rhoV) / rhoV)
  const udesign = 0.8 * uflood
  const A       = Vflow / (rhoV * Math.max(udesign, 0.001))
  const D       = Math.sqrt((4 * A) / Math.PI)
  return { uflood, udesign, A, D }
}

// ─────────────────────────────────────────────────────────────────────
//  MCCABE-THIELE SOLVER
// ─────────────────────────────────────────────────────────────────────
function solveMcCabeThiele(alpha, zF, q, xD, xB, R) {
  if ([alpha, zF, q, xD, xB, R].some(isNaN) || alpha <= 1 || xD <= xB) return null

  // Equilibrium curve y = alpha*x / (1 + (alpha-1)*x)
  const yEq = x => (alpha * x) / (1 + (alpha - 1) * x)
  const xEq = y => y / (alpha - (alpha - 1) * y)

  // Rectifying Operating Line (ROL): y = (R/(R+1))*x + xD/(R+1)
  const slopeR = R / (R + 1)
  const interceptR = xD / (R + 1)
  const yROL = x => slopeR * x + interceptR

  // Intersect ROL and q-line
  let xInt, yInt
  if (Math.abs(q - 1) < 1e-6) {
    // Saturated liquid: vertical q-line at x = zF
    xInt = zF
    yInt = yROL(zF)
  } else if (Math.abs(q) < 1e-6) {
    // Saturated vapor: horizontal q-line at y = zF
    yInt = zF
    xInt = (zF - interceptR) / slopeR
  } else {
    // General q-line: y = (q/(q-1))*x - zF/(q-1)
    const slopeQ = q / (q - 1)
    const interceptQ = -zF / (q - 1)
    xInt = (interceptQ - interceptR) / (slopeR - slopeQ)
    yInt = yROL(xInt)
  }

  // Stripping Operating Line (SOL): Connects (xB, xB) to (xInt, yInt)
  let slopeS, interceptS
  if (Math.abs(xInt - xB) > 1e-6) {
    slopeS = (yInt - xB) / (xInt - xB)
    interceptS = xB - slopeS * xB
  } else {
    slopeS = 999 // near-vertical
    interceptS = 0
  }
  const ySOL = x => slopeS * (x - xB) + xB

  // Step off stages starting from (xD, xD)
  const steps = []
  let xCurrent = xD
  let yCurrent = xD
  let stagesCount = 0
  const maxStages = 100
  let feedStage = -1

  steps.push({ x: xCurrent, y: yCurrent }) // Start at diagonal (xD, xD)

  while (xCurrent > xB && stagesCount < maxStages) {
    // Horizontal step to Equilibrium Curve: yCurrent is constant, find xEquil
    const xNew = xEq(yCurrent)
    steps.push({ x: xNew, y: yCurrent }) // horizontal line

    // Check if we crossed the feed intersection to identify feed stage
    if (xCurrent > xInt && xNew <= xInt && feedStage === -1) {
      feedStage = stagesCount + 1
    }

    xCurrent = xNew
    stagesCount++

    if (xCurrent <= xB) {
      steps.push({ x: xCurrent, y: xCurrent }) // final vertical step to diagonal at xCurrent
      break
    }

    // Vertical step to Operating Line: xCurrent is constant, find yNew
    let yNew
    if (xCurrent > xInt) {
      yNew = yROL(xCurrent) // Rectifying section
    } else {
      yNew = ySOL(xCurrent) // Stripping section
    }
    steps.push({ x: xCurrent, y: yNew }) // vertical line
    yCurrent = yNew
  }

  return {
    steps,
    stagesCount,
    feedStage: feedStage === -1 ? Math.ceil(stagesCount * 0.5) : feedStage,
    xInt,
    yInt,
    yROL,
    ySOL,
    slopeR,
    slopeS,
    yEq
  }
}

// ─────────────────────────────────────────────────────────────────────
//  INTERACTIVE MCCABE-THIELE DIAGRAM (SVG)
// ─────────────────────────────────────────────────────────────────────
function McCabeThielePlot({ inputs, results, mcCabeData }) {
  if (!mcCabeData) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-4)' }}>
      Compute design to plot McCabe-Thiele diagram.
    </div>
  )

  const W = 360, H = 360, PL = 32, PR = 10, PT = 10, PB = 32
  const cW = W - PL - PR, cH = H - PT - PB

  const xScale = x => PL + x * cW
  const yScale = y => PT + cH - y * cH

  const zF = parseFloat(inputs.zF) || 0.5
  const xD = parseFloat(inputs.xLK_D) || 0.95
  const xB = parseFloat(inputs.xLK_B) || 0.05

  // 1. Generate equilibrium line path
  const eqPoints = []
  for (let i = 0; i <= 50; i++) {
    const x = i / 50
    const y = mcCabeData.yEq(x)
    eqPoints.push(`${xScale(x).toFixed(1)},${yScale(y).toFixed(1)}`)
  }
  const eqPathD = 'M' + eqPoints.join(' L')

  // 2. Generate operating line paths
  const rolPathD = `M${xScale(xD).toFixed(1)},${yScale(xD).toFixed(1)} L${xScale(mcCabeData.xInt).toFixed(1)},${yScale(mcCabeData.yInt).toFixed(1)}`
  const solPathD = `M${xScale(xB).toFixed(1)},${yScale(xB).toFixed(1)} L${xScale(mcCabeData.xInt).toFixed(1)},${yScale(mcCabeData.yInt).toFixed(1)}`

  // 3. Generate Feed Q-line path
  const qLinePathD = `M${xScale(zF).toFixed(1)},${yScale(zF).toFixed(1)} L${xScale(mcCabeData.xInt).toFixed(1)},${yScale(mcCabeData.yInt).toFixed(1)}`

  // 4. Generate stages staircase path
  const stagePoints = mcCabeData.steps.map(p => `${xScale(p.x).toFixed(1)},${yScale(p.y).toFixed(1)}`)
  const stagePathD = 'M' + stagePoints.join(' L')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 14, fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748B', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: '#0EA5E9' }} /> Equilibrium</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: '#38BDF8', borderTop: '1px dashed #38BDF8' }} /> ROL</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: '#F97316' }} /> SOL</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: '#F5A623' }} /> q-Line</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: 'var(--accent)' }} /> Stages ({mcCabeData.stagesCount})</span>
      </div>

      <svg width={W} height={H} style={{ background: 'rgba(7,11,21,0.96)', border: '1px solid #1E293B', borderRadius: 10, display: 'block' }}>
        {/* Grids */}
        {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(v => (
          <g key={v}>
            <line x1={xScale(v)} y1={PT} x2={xScale(v)} y2={PT + cH} stroke="#1E293B" strokeWidth={0.5} strokeDasharray="3,3" />
            <line x1={PL} y1={yScale(v)} x2={PL + cW} y2={yScale(v)} stroke="#1E293B" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={xScale(v)} y={H - 18} fontSize={7} fill="#334155" textAnchor="middle">{v}</text>
            <text x={PL - 6} y={yScale(v) + 3} fontSize={7} fill="#334155" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* Diagonal Line y=x */}
        <line x1={xScale(0)} y1={yScale(0)} x2={xScale(1)} y2={yScale(1)} stroke="#1E293B" strokeWidth={1} />

        {/* Equilibrium Line */}
        <path d={eqPathD} fill="none" stroke="#0EA5E9" strokeWidth={1.5} />

        {/* Feed Q line */}
        <path d={qLinePathD} fill="none" stroke="#F5A623" strokeWidth={1.5} strokeDasharray="4,2" />

        {/* Operating Lines */}
        <path d={rolPathD} fill="none" stroke="#38BDF8" strokeWidth={1.2} />
        <path d={solPathD} fill="none" stroke="#F97316" strokeWidth={1.2} />

        {/* McCabe-Thiele Steps */}
        <path d={stagePathD} fill="none" stroke="var(--accent)" strokeWidth={1.8} style={{ filter: 'drop-shadow(0 0 4px rgba(76, 201, 240, 0.3))' }} />

        {/* Critical composition dots */}
        <circle cx={xScale(xD)} cy={yScale(xD)} r={3} fill="var(--accent)" />
        <text x={xScale(xD)} y={yScale(xD) - 6} fontSize={6} fill="var(--accent)" textAnchor="middle" fontFamily="monospace">xD</text>

        <circle cx={xScale(zF)} cy={yScale(zF)} r={3} fill="#F5A623" />
        <text x={xScale(zF)} y={yScale(zF) + 10} fontSize={6} fill="#F5A623" textAnchor="middle" fontFamily="monospace">zF</text>

        <circle cx={xScale(xB)} cy={yScale(xB)} r={3} fill="#F97316" />
        <text x={xScale(xB)} y={yScale(xB) + 10} fontSize={6} fill="#F97316" textAnchor="middle" fontFamily="monospace">xB</text>

        {/* Intersection marker */}
        <circle cx={xScale(mcCabeData.xInt)} cy={yScale(mcCabeData.yInt)} r={3.5} fill="#A78BFA" />

        {/* Axes titles */}
        <text x={PL + cW/2} y={H - 4} fontSize={8} fill="#475569" textAnchor="middle" fontWeight={600}>x (liquid mole fraction)</text>
        <text x={10} y={PT + cH/2} fontSize={8} fill="#475569" textAnchor="middle" fontWeight={600} transform={`rotate(-90,10,${PT + cH/2})`}>y (vapor mole fraction)</text>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────
//  VISUAL DISTILLATION COLUMN — SVG
// ─────────────────────────────────────────────
function DistillationColumnSVG({ results, inputs }) {
  const w = 280, h = 420
  const colX = 95, colW = 90
  const colTop = 60, colBot = 340
  const colH = colBot - colTop
  const hasResults = results?.N != null

  const stageCount = hasResults ? Math.min(results.N, 20) : 8
  const stages = Array.from({ length: stageCount }, (_, i) => ({
    y: colTop + (colH / (stageCount + 1)) * (i + 1)
  }))

  const feedStageIdx = hasResults && results.feedStage != null
    ? Math.min(results.feedStage - 1, stageCount - 1)
    : Math.floor(stageCount * 0.45)

  const feedY = stages[feedStageIdx]?.y || (colTop + colH / 2)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', maxHeight: 420 }}>
      <defs>
        <linearGradient id="colGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0D1920" />
          <stop offset="30%" stopColor="#0EA5E920" />
          <stop offset="70%" stopColor="#0EA5E920" />
          <stop offset="100%" stopColor="#0D1920" />
        </linearGradient>
        <linearGradient id="liqGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* ── CONDENSER (top) ── */}
      <rect x={colX + colW/2 - 22} y={8} width={44} height={28} rx={6}
        fill="#0D1920" stroke="#0EA5E9" strokeWidth={1.2} />
      <text x={colX + colW/2} y={26} textAnchor="middle" fontSize={9}
        fontFamily="JetBrains Mono, monospace" fill="#0EA5E9">Condenser</text>

      {/* Condenser → top of column */}
      <line x1={colX + colW/2} y1={36} x2={colX + colW/2} y2={colTop}
        stroke="#0EA5E9" strokeWidth={1.2} strokeDasharray="4,3" />

      {/* ── COLUMN BODY ── */}
      <rect x={colX} y={colTop} width={colW} height={colH} rx={4}
        fill="url(#liqGrad)" stroke="#1A3A50" strokeWidth={1.5} />

      {/* Stage trays */}
      {stages.map((s, i) => (
        <g key={i}>
          <line x1={colX + 4} y1={s.y} x2={colX + colW - 4} y2={s.y}
            stroke={i === feedStageIdx ? '#F5A623' : '#1E4A65'}
            strokeWidth={i === feedStageIdx ? 1.5 : 0.8}
            strokeDasharray={i === feedStageIdx ? 'none' : '3,2'} />
          {hasResults && (
            <text x={colX + colW + 6} y={s.y + 3} fontSize={7}
              fontFamily="JetBrains Mono, monospace" fill="#2A4A5A">
              {stageCount - i}
            </text>
          )}
        </g>
      ))}

      {/* Stage count badge */}
      {hasResults && (
        <g>
          <rect x={colX + colW/2 - 18} y={colTop + colH/2 - 10} width={36} height={20} rx={4}
            fill="#0A1520" stroke="#1E4A65" strokeWidth={1} />
          <text x={colX + colW/2} y={colTop + colH/2 + 4} textAnchor="middle" fontSize={10}
            fontFamily="JetBrains Mono, monospace" fill="#0EA5E9" fontWeight="bold">
            {results.N}
          </text>
          <text x={colX + colW/2} y={colTop + colH/2 + 14} textAnchor="middle" fontSize={6}
            fontFamily="JetBrains Mono, monospace" fill="#2A5A7A">stages</text>
        </g>
      )}

      {/* ── REBOILER (bottom) ── */}
      <rect x={colX + colW/2 - 22} y={colBot + 12} width={44} height={28} rx={6}
        fill="#0D1920" stroke="#F97316" strokeWidth={1.2} />
      <text x={colX + colW/2} y={colBot + 30} textAnchor="middle" fontSize={9}
        fontFamily="JetBrains Mono, monospace" fill="#F97316">Reboiler</text>

      {/* Column → reboiler */}
      <line x1={colX + colW/2} y1={colBot} x2={colX + colW/2} y2={colBot + 12}
        stroke="#F97316" strokeWidth={1.2} strokeDasharray="4,3" />

      {/* ── STREAMS ── */}

      {/* Distillate — top right */}
      <line x1={colX + colW} y1={colTop + 16} x2={w - 12} y2={colTop + 16}
        stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#arrG)" />
      <text x={w - 14} y={colTop + 10} textAnchor="end" fontSize={8}
        fontFamily="JetBrains Mono, monospace" fill="var(--accent)">Distillate (D)</text>
      {results?.D != null && (
        <text x={w - 14} y={colTop + 24} textAnchor="end" fontSize={7}
          fontFamily="JetBrains Mono, monospace" fill="#00CC82">
          {results.D.toFixed(3)} kg/s
        </text>
      )}

      {/* Bottoms — bottom right */}
      <line x1={colX + colW} y1={colBot - 16} x2={w - 12} y2={colBot - 16}
        stroke="#F97316" strokeWidth={1.5} markerEnd="url(#arrO)" />
      <text x={w - 14} y={colBot - 22} textAnchor="end" fontSize={8}
        fontFamily="JetBrains Mono, monospace" fill="#F97316">Bottoms (B)</text>
      {results?.B != null && (
        <text x={w - 14} y={colBot - 10} textAnchor="end" fontSize={7}
          fontFamily="JetBrains Mono, monospace" fill="#CC7010">
          {results.B.toFixed(3)} kg/s
        </text>
      )}

      {/* Feed — left side at feed stage */}
      <line x1={8} y1={feedY} x2={colX} y2={feedY}
        stroke="#F5A623" strokeWidth={1.5} markerEnd="url(#arrY)" />
      <text x={6} y={feedY - 6} textAnchor="start" fontSize={8}
        fontFamily="JetBrains Mono, monospace" fill="#F5A623">Feed (F)</text>
      <text x={6} y={feedY + 14} textAnchor="start" fontSize={7}
        fontFamily="JetBrains Mono, monospace" fill="#B08010">
        Stage {hasResults && results.feedStage != null ? results.feedStage : feedStageIdx + 1}
      </text>

      {/* Reflux indication — top left */}
      <path d={`M${colX - 2},${colTop + 8} Q${colX - 20},${colTop - 5} ${colX + colW/2 - 22},${colTop - 2}`}
        fill="none" stroke="#0EA5E9" strokeWidth={1} strokeDasharray="3,3" />
      <text x={colX - 22} y={colTop + 20} textAnchor="start" fontSize={7}
        fontFamily="JetBrains Mono, monospace" fill="#0EA5E9">
        {results?.R != null ? `R = ${results.R}` : 'Reflux'}
      </text>

      {/* Arrow markers */}
      <defs>
        <marker id="arrG" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
        </marker>
        <marker id="arrO" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#F97316" />
        </marker>
        <marker id="arrY" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#F5A623" />
        </marker>
      </defs>
    </svg>
  )
}

// ─────────────────────────────────────────────
//  RESULT CARD — single metric card
// ─────────────────────────────────────────────
function ResultCard({ label, val, unit, accent = 'var(--accent)', sub }) {
  return (
    <div className="res-cell" style={{ borderColor: 'var(--border-2)' }}>
      <div className="res-cell-label">{label}</div>
      <div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>
          {typeof val === 'number' ? (Math.abs(val) > 1000 ? val.toFixed(0) : val.toFixed(2)) : val}
        </span>
        <span className="res-cell-unit"> {unit}</span>
      </div>
      {sub && <div style={{ fontSize: '0.66rem', color: 'var(--text-4)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────
//  ENGINEERING INSIGHTS ENGINE
// ─────────────────────────────────────────────
function generateInsights(inputs, results, mcCabeData) {
  const insights = []
  if (!results) return insights

  const alpha = parseFloat(inputs.alpha)
  const R     = parseFloat(inputs.R)
  const Rmin  = results.Rmin
  const N     = results.N
  const Nmin  = results.Nmin

  // Separation difficulty
  if (!isNaN(alpha)) {
    if (alpha > 5)
      insights.push({ type: 'good', icon: '✓', text: `α = ${alpha} — Separation is thermodynamically easy. Minimal energy requirements.` })
    else if (alpha > 2)
      insights.push({ type: 'ok', icon: '◈', text: `α = ${alpha} — Standard separation difficulty. Straightforward column configuration.` })
    else if (alpha > 1.2)
      insights.push({ type: 'warn', icon: '⚠', text: `α = ${alpha} — Close boiling points. High reflux ratio ($R$) and tall column required.` })
    else
      insights.push({ type: 'error', icon: '✕', text: `α = ${alpha} — Near-azeotropic behavior. Shortcut method fails; requires extractive/azeotropic distillation.` })
  }

  // Reflux ratio assessment
  if (!isNaN(R) && !isNaN(Rmin)) {
    const ratio = R / Rmin
    if (ratio < 1.0)
      insights.push({ type: 'error', icon: '✕', text: `R (${R.toFixed(2)}) < Rmin (${Rmin.toFixed(2)}) — Operating reflux is below minimum threshold. Separation is physically impossible!` })
    else if (ratio < 1.05)
      insights.push({ type: 'error', icon: '✕', text: `R/Rmin = ${ratio.toFixed(2)} — Pinch point active. Operating too close to minimum reflux; requires infinite stages.` })
    else if (ratio < 1.2)
      insights.push({ type: 'warn', icon: '⚠', text: `R/Rmin = ${ratio.toFixed(2)} — Low reflux safety margin. Capital cost (height) will be extremely high.` })
    else if (ratio <= 1.5)
      insights.push({ type: 'good', icon: '✓', text: `R/Rmin = ${ratio.toFixed(2)} — Optimal reflux range. Good trade-off between CAPEX (height) and OPEX (heating duty).` })
    else
      insights.push({ type: 'warn', icon: '⚠', text: `R/Rmin = ${ratio.toFixed(2)} — Excess reflux. High heating/condensing duties will lead to large utility bills (OPEX).` })
  }

  // Stage efficiency and method comparison
  if (mcCabeData && !isNaN(N)) {
    const mccabeN = mcCabeData.stagesCount
    insights.push({
      type: 'ok',
      icon: '📐',
      text: `Method check: FUG Shortcut = ${N} stages vs Graphical McCabe-Thiele = ${mccabeN} stages (Difference: ${Math.abs(N - mccabeN)}).`
    })
  }

  // Diameter warning
  if (results.D_col != null) {
    if (results.D_col < 0.5)
      insights.push({ type: 'warn', icon: '⚠', text: `Column diameter ${results.D_col.toFixed(2)} m is very narrow. Packed column (random or structured packing) recommended over trays.` })
    else if (results.D_col > 6.0)
      insights.push({ type: 'warn', icon: '⚠', text: `Diameter of ${results.D_col.toFixed(2)} m is massive. Consider dividing process into two parallel columns.` })
    else
      insights.push({ type: 'good', icon: '✓', text: `Diameter = ${results.D_col.toFixed(2)} m. Standard sieve tray design is highly feasible.` })
  }

  return insights
}

const INSIGHT_COLORS = {
  good:  { bg: 'rgba(0,255,163,0.06)',  border: 'rgba(0,255,163,0.2)',  text: 'var(--accent)' },
  ok:    { bg: 'rgba(14,165,233,0.06)', border: 'rgba(14,165,233,0.2)', text: '#0EA5E9' },
  warn:  { bg: 'rgba(245,166,35,0.06)', border: 'rgba(245,166,35,0.2)', text: '#F5A623' },
  error: { bg: 'rgba(255,77,106,0.06)', border: 'rgba(255,77,106,0.2)', text: '#FF4D6A' },
}

// ─────────────────────────────────────────────
//  SECTION WRAPPER
// ─────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-4)',
        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10,
        paddingBottom: 6, borderBottom: '1px solid var(--border-1)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {title}
      </div>
      {children}
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

// ─────────────────────────────────────────────
//  MAIN DISTILLATION WORKSPACE
// ─────────────────────────────────────────────

export default function DistillationDesign({ projectId, updateAppContext }) {
  const [inputs, setInputs] = useState(() => {
    const saved = localStorage.getItem('chempilot_distill_' + projectId)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.inputs || {
          F: '10', zF: '0.5', q: '1.0', feedTemp: '80', boilingTemp: '100', heatCap: '4.18',
          qMode: 'manual', alpha: '2.4', rhoV: '2.5', rhoL: '800', Csb: '0.08',
          xLK_D: '0.96', xHK_D: '0.04', xLK_B: '0.04', xHK_B: '0.96',
          R: '2.0', eff: '0.70', latentHeat: '2260', numStages: '',
        }
      } catch (e) {}
    }
    return {
      F: '10', zF: '0.5', q: '1.0', feedTemp: '80', boilingTemp: '100', heatCap: '4.18',
      qMode: 'manual', alpha: '2.4', rhoV: '2.5', rhoL: '800', Csb: '0.08',
      xLK_D: '0.96', xHK_D: '0.04', xLK_B: '0.04', xHK_B: '0.96',
      R: '2.0', eff: '0.70', latentHeat: '2260', numStages: '',
    }
  })
  
  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('chempilot_distill_' + projectId)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.results || null
      } catch (e) {}
    }
    return null
  })

  const [plotTab, setPlotTab] = useState('mccabe') // 'column' or 'mccabe'
  const [calculating, setCalculating] = useState(false)

  // McCabe-Thiele computed data
  const mcCabeData = useMemo(() => {
    const alpha = parseFloat(inputs.alpha)
    const zF = parseFloat(inputs.zF)
    const xD = parseFloat(inputs.xLK_D)
    const xB = parseFloat(inputs.xLK_B)
    const R = parseFloat(inputs.R)

    // Calculate dynamic q if mode is auto
    let q = parseFloat(inputs.q)
    if (inputs.qMode === 'auto') {
      const tF = parseFloat(inputs.feedTemp)
      const tB = parseFloat(inputs.boilingTemp)
      const cpL = parseFloat(inputs.heatCap)
      const hVap = parseFloat(inputs.latentHeat)
      if (!isNaN(tF) && !isNaN(tB) && !isNaN(cpL) && !isNaN(hVap) && hVap > 0) {
        q = 1 + (cpL * (tB - tF)) / hVap
      }
    }

    return solveMcCabeThiele(alpha, zF, q, xD, xB, R)
  }, [inputs.alpha, inputs.zF, inputs.q, inputs.qMode, inputs.feedTemp, inputs.boilingTemp, inputs.heatCap, inputs.latentHeat, inputs.xLK_D, inputs.xLK_B, inputs.R])

  // Save changes to localStorage and update global appContext whenever inputs or results update
  useEffect(() => {
    const data = { inputs, results }
    localStorage.setItem('chempilot_distill_' + projectId, JSON.stringify(data))

    if (updateAppContext) {
      updateAppContext('distill', {
        projectId,
        inputs: {
          feedFlow: inputs.F,
          feedComposition: inputs.zF,
          relativeVolatility: inputs.alpha,
          refluxRatio: inputs.R
        },
        results: results ? {
          minimumStages: results.Nmin,
          minimumReflux: results.Rmin,
          actualStages: results.N,
          columnDiameter: results.D_col,
          condenserDuty: results.Qc,
          reboilerDuty: results.Qr
        } : null
      })
    }
  }, [inputs, results, projectId])

  const set = (k, v) => setInputs(p => ({ ...p, [k]: v }))
  const n   = k => parseFloat(inputs[k])

  const calculate = () => {
    setCalculating(true)
    setTimeout(() => {
      const alpha  = n('alpha')
      const xLK_D  = n('xLK_D'), xHK_D = n('xHK_D')
      const xLK_B  = n('xLK_B')
      const zF     = n('zF')
      const F      = n('F'), R  = n('R')
      const eff    = n('eff') || 0.7
      const lambda = n('latentHeat') || 2260

      // Dynamic q calculations
      let q = n('q')
      if (inputs.qMode === 'auto') {
        const tF = n('feedTemp')
        const tB = n('boilingTemp')
        const cpL = n('heatCap')
        if (!isNaN(tF) && !isNaN(tB) && !isNaN(cpL) && lambda > 0) {
          q = 1 + (cpL * (tB - tF)) / lambda
        }
      }

      const Nmin   = solveFenske(xLK_D, xHK_D, xLK_B, (1 - xLK_B), alpha)
      const uw     = solveUnderwood(alpha, zF || 0.5, q, xLK_D)
      const Rmin   = uw?.Rmin
      const gill   = (Nmin != null && Rmin != null && !isNaN(R)) ? solveGilliland(Nmin, Rmin, R) : null
      const N      = gill?.N

      // Mass balance
      let D = null, B = null
      if (!isNaN(F) && !isNaN(zF) && !isNaN(xLK_D) && !isNaN(xLK_B) && (xLK_D - xLK_B) !== 0) {
        D = F * (zF - xLK_B) / (xLK_D - xLK_B)
        B = F - D
      }

      // Column diameter
      const rhoV = n('rhoV'), rhoL = n('rhoL'), Csb = n('Csb')
      const Vflow = D ? D * (1 + R) / rhoV : null
      const diam  = (Vflow && !isNaN(rhoV) && !isNaN(rhoL)) ? solveDiameter(Vflow, rhoV, rhoL, Csb) : null

      // Duties using calculated custom latent heat
      const Qc = (D != null && R != null) ? D * (1 + R) * lambda : null
      const Qr = Qc != null ? Qc * 1.05 : null

      // Calculate actual trays needed (considering tray efficiency)
      // N includes reboiler as 1 theoretical stage (reboiler is not a physical tray inside column)
      const N_real = (N != null && eff > 0) ? Math.ceil((N - 1) / eff) : null
      const Nmin_real = (Nmin != null && eff > 0) ? Math.ceil((Nmin - 1) / eff) : null

      // McCabe-Thiele actual stage count
      const mcCabeStages = mcCabeData?.stagesCount
      const mcCabeTraysReal = (mcCabeStages != null && eff > 0) ? Math.ceil((mcCabeStages - 1) / eff) : null

      setResults({
        Nmin,
        Nmin_real,
        Rmin,
        N,
        N_real,
        R,
        D,
        B,
        D_col: diam?.D,
        Qc,
        Qr,
        theta: uw?.theta,
        feedStage: mcCabeData?.feedStage,
        mcCabeStages,
        mcCabeTraysReal,
        eff,
        qValue: q
      })
      setCalculating(false)
    }, 400)
  }

  const insights = results ? generateInsights(inputs, results, mcCabeData) : []

  return (
    <div>
      <div className="distillation-split-grid" style={{ display: 'grid', gap: 14 }}>

        {/* ── LEFT: INPUTS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <Section title="Feed Conditions">
              <div className="g2 gap-md">
                <Field label="Feed Flow F" unit="kg/s" value={inputs.F} onChange={v => set('F', v)} placeholder="10" />
                <Field label="Feed Comp. zF" unit="frac" value={inputs.zF} onChange={v => set('zF', v)} placeholder="0.5" />
                <div style={{ gridColumn: 'span 2' }}>
                  <div className="field-label" style={{ marginBottom: 4 }}>Feed Quality (q) Mode</div>
                  <select 
                    className="field-select" 
                    value={inputs.qMode} 
                    onChange={e => set('qMode', e.target.value)}
                    style={{ fontSize: '0.82rem', marginBottom: 10 }}
                  >
                    <option value="manual">Manual Input (q-value)</option>
                    <option value="auto">Calculated from Temperature</option>
                  </select>
                </div>
                {inputs.qMode === 'manual' ? (
                  <Field label="q (feed quality)" unit="—" value={inputs.q} onChange={v => set('q', v)} placeholder="1.0" />
                ) : (
                  <>
                    <Field label="Feed Temp (TF)" unit="°C" value={inputs.feedTemp} onChange={v => set('feedTemp', v)} placeholder="80" />
                    <Field label="Bubble Pt. (Tb)" unit="°C" value={inputs.boilingTemp} onChange={v => set('boilingTemp', v)} placeholder="100" />
                    <Field label="Heat Cap (CpL)" unit="kJ/kg·°C" value={inputs.heatCap} onChange={v => set('heatCap', v)} placeholder="4.18" />
                  </>
                )}
              </div>
            </Section>

            <Section title="Component Properties">
              <div className="g2 gap-md">
                <Field label="Relative Vol. α" unit="—" value={inputs.alpha} onChange={v => set('alpha', v)} placeholder="2.4" />
                <div style={{ fontSize: '0.66rem', color: 'var(--text-3)', lineHeight: 1.5, paddingTop: 10 }}>
                  α = pSat_LK / pSat_HK. Larger α makes separation much easier.
                </div>
              </div>
            </Section>

            <Section title="Separation Targets">
              <div className="g2 gap-md">
                <Field label="xD (LK in dist.)" unit="frac" value={inputs.xLK_D} onChange={v => set('xLK_D', v)} placeholder="0.96" />
                <Field label="xD (HK impurity)" unit="frac" value={inputs.xHK_D} onChange={v => set('xHK_D', v)} placeholder="0.04" />
                <Field label="xB (LK impurity)" unit="frac" value={inputs.xLK_B} onChange={v => set('xLK_B', v)} placeholder="0.04" />
                <Field label="xB (HK in bot.)" unit="frac" value={inputs.xHK_B} onChange={v => set('xHK_B', v)} placeholder="0.96" />
              </div>
            </Section>

            <Section title="Operating Parameters">
              <div className="g2 gap-md">
                <Field label="Reflux Ratio R" unit="L/D" value={inputs.R} onChange={v => set('R', v)} placeholder="2.0" />
                <Field label="Tray Efficiency" unit="frac" value={inputs.eff} onChange={v => set('eff', v)} placeholder="0.70" />
                <Field label="LK Latent Heat" unit="kJ/kg" value={inputs.latentHeat} onChange={v => set('latentHeat', v)} placeholder="2260" />
              </div>
            </Section>

            <Section title="Column Sizing">
              <div className="g2 gap-md">
                <Field label="Vapor Density ρV" unit="kg/m³" value={inputs.rhoV} onChange={v => set('rhoV', v)} placeholder="2.5" />
                <Field label="Liquid Density ρL" unit="kg/m³" value={inputs.rhoL} onChange={v => set('rhoL', v)} placeholder="800" />
                <Field label="Csb Capacity Factor" unit="m/s" value={inputs.Csb} onChange={v => set('Csb', v)} placeholder="0.08" />
              </div>
            </Section>

            <button className="btn btn-accent w-full"
              onClick={calculate} disabled={calculating}
              style={{ fontSize: '0.9rem', padding: '12px', fontWeight: 700, letterSpacing: '0.02em' }}>
              {calculating ? '⏳ Calculating...' : '▶ Calculate Column Design'}
            </button>
          </div>

          <div className="info-block">
            <div className="info-block-label">📚 Shortcut Method</div>
            <div className="info-block-text" style={{ fontSize: '0.74rem', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-1)' }}>Fenske</strong> determines minimum stages.<br />
              <strong style={{ color: 'var(--text-1)' }}>Underwood</strong> determines minimum reflux.<br />
              <strong style={{ color: 'var(--text-1)' }}>Gilliland</strong> estimates actual stages.<br />
              <strong style={{ color: 'var(--text-1)' }}>Souders-Brown</strong> bounds column flooding velocity.
            </div>
          </div>
        </div>

        {/* ── RIGHT: VISUAL + RESULTS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Toggle Tab */}
          <div className="os-tabs" style={{ marginBottom: 0 }}>
            <button className={`os-tab ${plotTab === 'mccabe' ? 'active' : ''}`} onClick={() => setPlotTab('mccabe')}>
              📈 McCabe-Thiele Plot
            </button>
            <button className={`os-tab ${plotTab === 'column' ? 'active' : ''}`} onClick={() => setPlotTab('column')}>
              🗼 Column Schematic
            </button>
          </div>

          {/* Visual Container */}
          <div className="card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 450 }}>
            {plotTab === 'mccabe' ? (
              <div style={{ width: '100%' }}>
                <div className="card-title" style={{ justifyContent: 'center', marginBottom: 12 }}>McCabe-Thiele Stage Stepping</div>
                <McCabeThielePlot inputs={inputs} results={results} mcCabeData={mcCabeData} />
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: 360 }}>
                <div className="card-title" style={{ justifyContent: 'center', marginBottom: 12 }}>Column Internals & Streams</div>
                <DistillationColumnSVG results={results} inputs={inputs} />
              </div>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="card" style={{ animation: 'fadeIn 0.25s var(--ease)' }}>
              <div className="card-title">📊 Calculated Design Metrics</div>
              <div className="card-desc">Comparison of design methods (steady-state approximations)</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Stage Analysis</div>
                <div className="g3 gap-md">
                  <ResultCard label="Min. Stages Nmin" val={results.Nmin} unit="stages" sub="Theoretical" accent="var(--accent)" />
                  <ResultCard label="Min. Reflux Rmin" val={results.Rmin} unit="—" sub="Underwood criteria" accent="#0EA5E9" />
                  <ResultCard label="Actual Stages N" val={results.N} unit="stages" sub={`Theoretical (incl. reboiler)`} accent="#A855F7" />
                </div>
                <div className="g3 gap-md" style={{ marginTop: 10 }}>
                  <ResultCard label="Actual Trays Needed" val={results.N_real} unit="trays" sub={`Real column trays (${(results.eff*100).toFixed(0)}% eff)`} accent="var(--accent)" />
                  <ResultCard label="McCabe stages" val={results.mcCabeStages} unit="stages" sub="Theoretical stepping" accent="#0EA5E9" />
                  <ResultCard label="McCabe real trays" val={results.mcCabeTraysReal} unit="trays" sub={`At ${(results.eff*100).toFixed(0)}% efficiency`} accent="#A855F7" />
                </div>
                <div className="g3 gap-md" style={{ marginTop: 10 }}>
                  <ResultCard label="Feed Stage" val={results.feedStage} unit="from top" sub="Optimal feed tray" accent="#F5A623" />
                  <ResultCard label="Calculated q-value" val={results.qValue} unit="—" sub="Feed enthalpy factor" accent="#64748B" />
                  <ResultCard label="Min. Reflux Theta θ" val={results.theta} unit="—" sub="Underwood parameter" accent="#64748B" />
                </div>
              </div>

              {(results.D != null || results.B != null) && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Product Mass Balance</div>
                  <div className="g2 gap-md">
                    <ResultCard label="Distillate Flow D" val={results.D} unit="kg/s" accent="var(--accent)" sub="Top overhead product" />
                    <ResultCard label="Bottoms Flow B" val={results.B} unit="kg/s" accent="#F97316" sub="Bottom heavy product" />
                  </div>
                </div>
              )}

              {results.Qc != null && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Heat Exchanger Loads</div>
                  <div className="g2 gap-md">
                    <ResultCard label="Condenser Duty Qc" val={results.Qc} unit="kW" accent="#0EA5E9" sub="Enthalpy of condensation" />
                    <ResultCard label="Reboiler Duty Qr" val={results.Qr} unit="kW" accent="#F97316" sub="Enthalpy of vaporization + loss" />
                  </div>
                </div>
              )}

              {results.D_col != null && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Mechanical Column Sizing</div>
                  <div className="g2 gap-md">
                    <ResultCard label="Column Diameter" val={results.D_col} unit="m" accent="var(--accent)" sub="Souders-Brown flooding limit" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="card" style={{ animation: 'fadeIn 0.3s var(--ease)' }}>
              <div className="card-title">💡 Engineering Diagnostics</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {insights.map((ins, i) => {
                  const c = INSIGHT_COLORS[ins.type]
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8 }}>
                      <span style={{ color: c.text, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{ins.icon}</span>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.55 }}>{ins.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!results && (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-4)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>🗼</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-2)', marginBottom: 8 }}>
                Perform calculation to run visualizer
              </div>
              <div style={{ fontSize: '0.78rem', lineHeight: 1.7 }}>
                Calculated details including the interactive McCabe-Thiele stage steps<br />will be plotted above once inputs are calculated.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}