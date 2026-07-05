/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA — OPTIMIZATION ENGINE
 *  Single-variable Golden-Section Search optimizer.
 *  Objectives: Max Profit | Max Purity | Min Energy | Min Carbon
 *
 *  Architecture:
 *  - Receives current simulation state (nodes, streams, params)
 *  - Runs headless simulation sweeps (re-uses parent solver)
 *  - Reports optimal parameter value + objective chart
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react'

const GOLDEN = (Math.sqrt(5) - 1) / 2

// ─── Headless golden-section search ──────────────────────────────
// Calls runOneSim(paramVal) → { profit, purity, energy, carbon }
// Returns { optVal, optScore, history }
async function goldenSection(lo, hi, runSim, objective, maxIter = 18) {
  const history = []
  let a = lo, b = hi

  const score = val => {
    const r = runSim(val)
    if (!r) return null
    switch (objective) {
      case 'profit': return r.profit
      case 'purity': return r.purity
      case 'energy': return -r.energy   // minimise → negate
      case 'carbon': return -r.carbon   // minimise → negate
      default: return r.profit
    }
  }

  let c = b - GOLDEN * (b - a)
  let d = a + GOLDEN * (b - a)

  for (let i = 0; i < maxIter; i++) {
    const fc = score(c)
    const fd = score(d)
    if (fc == null || fd == null) break
    history.push({ val: c, score: fc }, { val: d, score: fd })
    if (fc < fd) { a = c } else { b = d }
    c = b - GOLDEN * (b - a)
    d = a + GOLDEN * (b - a)
  }

  // Final best
  history.sort((a, b) => b.score - a.score)
  const best = history[0]
  return { optVal: best?.val ?? (lo + hi) / 2, optScore: best?.score, history }
}

// ─── Mini sparkline chart ─────────────────────────────────────────
function OptimizationChart({ history, label, xLabel, objective }) {
  if (!history || history.length < 2) return null
  const W = 340, H = 160
  const PL = 44, PR = 14, PT = 16, PB = 28
  const cW = W - PL - PR, cH = H - PT - PB

  const xs = history.map(h => h.val)
  const ys = history.map(h => h.score)
  const xMin = Math.min(...xs), xMax = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1

  const sx = v => PL + ((v - xMin) / xRange) * cW
  const sy = v => PT + cH - ((v - yMin) / yRange) * cH

  const sorted = [...history].sort((a, b) => a.val - b.val)
  const linePath = sorted.map((h, i) => `${i === 0 ? 'M' : 'L'}${sx(h.val).toFixed(1)},${sy(h.score).toFixed(1)}`).join(' ')
  const fillPath = linePath + ` L${sx(sorted[sorted.length - 1].val).toFixed(1)},${PT + cH} L${sx(sorted[0].val).toFixed(1)},${PT + cH} Z`

  const best = history.reduce((a, b) => b.score > a.score ? b : a, history[0])
  const isMinObjective = objective === 'energy' || objective === 'carbon'

  return (
    <div>
      <div style={{ fontSize: '0.55rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        Objective: {label} vs {xLabel}
      </div>
      <svg width={W} height={H} style={{ background: 'rgba(7,11,21,0.7)', border: '1px solid #1E293B', borderRadius: 8, display: 'block' }}>
        <defs>
          <linearGradient id="optFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 0.33, 0.66, 1].map(f => (
          <line key={f} x1={PL} y1={PT + f * cH} x2={PL + cW} y2={PT + f * cH}
            stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} strokeDasharray="2,2" />
        ))}

        <path d={fillPath} fill="url(#optFill)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,163,0.5))' }} />

        {/* Sample points */}
        {sorted.map((h, i) => (
          <circle key={i} cx={sx(h.val)} cy={sy(h.score)} r={2.5} fill="var(--accent)" opacity={0.6} />
        ))}

        {/* Optimal marker */}
        <line x1={sx(best.val)} y1={PT} x2={sx(best.val)} y2={PT + cH} stroke="#A855F7" strokeWidth={1.2} strokeDasharray="3,2" />
        <circle cx={sx(best.val)} cy={sy(best.score)} r={5} fill="#A855F7" style={{ filter: 'drop-shadow(0 0 6px #A855F7)' }} />
        <text x={sx(best.val) + 7} y={sy(best.score) - 4} fontSize={7} fill="#A855F7" fontFamily="monospace">
          OPTIMAL
        </text>

        {/* Axes */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="#1E293B" strokeWidth={1} />
        <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="#1E293B" strokeWidth={1} />

        {/* X labels */}
        <text x={PL} y={H - 8} fontSize={7} fill="#475569">{xMin.toFixed(2)}</text>
        <text x={PL + cW} y={H - 8} fontSize={7} fill="#475569" textAnchor="end">{xMax.toFixed(2)}</text>
        <text x={PL + cW / 2} y={H - 8} fontSize={7} fill="#64748B" textAnchor="middle">{xLabel}</text>

        {/* Y labels */}
        <text x={PL - 4} y={PT + 4} fontSize={6} fill="#475569" textAnchor="end">{yMax.toFixed(1)}</text>
        <text x={PL - 4} y={PT + cH} fontSize={6} fill="#475569" textAnchor="end">{yMin.toFixed(1)}</text>
      </svg>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
const OBJECTIVES = [
  { id: 'profit', label: '💰 Max Net Cash Flow', unit: 'k$/yr', desc: 'Maximize revenue minus OPEX' },
  { id: 'purity', label: '✨ Max Product Purity', unit: 'mol%', desc: 'Maximize distillate purity' },
  { id: 'energy', label: '⚡ Min Energy', unit: 'kW', desc: 'Minimize total heating + cooling duty' },
  { id: 'carbon', label: '🌱 Min Carbon', unit: 'tCO₂/yr', desc: 'Minimize GHG emissions' },
]

export default function OptimizationEngine({
  nodes, streams, equipParams,
  onClose, runSimOnce   // runSimOnce(newParams) → { nodes, streams } solved
}) {
  const [objective, setObjective] = useState('profit')
  const [varyNodeId, setVaryNodeId] = useState('')
  const [varyParam, setVaryParam] = useState('')
  const [rangeMin, setRangeMin] = useState('')
  const [rangeMax, setRangeMax] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  // Candidate parameters for each node
  const paramOptions = nodes.flatMap(n => {
    const NUMERIC_PARAMS = {
      feedtank: ['flow', 'temp', 'press', 'zA'],
      pump: ['pressureRise', 'efficiency'],
      compressor: ['compressionRatio', 'efficiency'],
      valve: ['outletPress'],
      heater: ['targetTemp'],
      cooler: ['targetTemp'],
      reactor: ['conversion', 'volume'],
      flash: ['temp', 'press'],
      distillation: ['refluxRatio', 'distillatePurity', 'bottomsPurity', 'feedQuality'],
      splitter: ['splitRatio'],
    }
    const pkeys = NUMERIC_PARAMS[n.type] || []
    return pkeys.map(k => ({ nodeId: n.id, tag: n.tag, param: k, label: `${n.tag}.${k}` }))
  })

  // Extract objective from solved state
  const extractObjective = useCallback((solvedNodes, solvedStreams, obj) => {
    const getRes = (type, label) => {
      const n = solvedNodes.find(n => n.type === type && n.calculated)
      if (!n) return null
      const r = (n.results || []).find(r => r.label.includes(label))
      return r ? parseFloat(r.val) : null
    }

    switch (obj) {
      case 'purity': {
        const distN = solvedNodes.find(n => n.type === 'distillation' && n.calculated)
        if (!distN) return null
        const r = (distN.results || []).find(r => r.label.includes('Distillate T'))
        // Use distillate purity from stream data
        const topStream = solvedStreams.find(s => s.from === distN.id && s.calculated)
        return topStream?.data?.zA != null ? topStream.data.zA * 100 : null
      }
      case 'energy': {
        let total = 0
        solvedNodes.filter(n => n.calculated).forEach(n => {
          const duty = (n.results || []).find(r => r.label.includes('Duty'))
          if (duty) total += Math.abs(parseFloat(duty.val) || 0)
        })
        return total
      }
      case 'carbon': {
        // Rough estimate: 0.2 kg CO2 per kWh of heat, 0.5 per kWh elec
        let heat = 0, elec = 0
        solvedNodes.filter(n => n.calculated).forEach(n => {
          if (['heater', 'cooler'].includes(n.type)) {
            const d = (n.results || []).find(r => r.label.includes('Duty'))
            if (d) heat += Math.abs(parseFloat(d.val) || 0)
          }
          if (['pump', 'compressor'].includes(n.type)) {
            const d = (n.results || []).find(r => r.label.includes('Power') || r.label.includes('power'))
            if (d) elec += Math.abs(parseFloat(d.val) || 0)
          }
        })
        const kgCO2_s = heat * 0.2 / 3600 + elec * 0.5 / 3600
        return kgCO2_s * 3600 * 8760 / 1000  // tonne CO2/yr
      }
      case 'profit':
      default: {
        // Revenue: flow * product value. Estimate $800/tonne for distillate
        const distStream = solvedStreams.find(s => {
          const fromNode = solvedNodes.find(n => n.id === s.from)
          return fromNode?.type === 'distillation' && s.calculated
        })
        const revenue = distStream?.data?.flow ? distStream.data.flow * 3600 * 8760 * 800 / 1e6 : 0
        // Energy cost
        let energy = 0
        solvedNodes.filter(n => n.calculated).forEach(n => {
          const duty = (n.results || []).find(r => r.label.includes('Duty') || r.label.includes('Power'))
          if (duty) energy += Math.abs(parseFloat(duty.val) || 0)
        })
        const energyCost = energy * 0.05 * 3600 * 8760 / 1e6  // $0.05/kWh
        return revenue - energyCost
      }
    }
  }, [])

  const runOptimization = useCallback(() => {
    if (!varyNodeId || !varyParam || !rangeMin || !rangeMax) {
      setError('Please select a node, parameter, and range.')
      return
    }
    const lo = parseFloat(rangeMin), hi = parseFloat(rangeMax)
    if (isNaN(lo) || isNaN(hi) || lo >= hi) {
      setError('Invalid range: min must be < max.')
      return
    }
    setRunning(true)
    setResult(null)
    setError(null)
    setProgress(0)

    setTimeout(() => {
      try {
        const history = []
        const N_SAMPLES = 16  // Enough for golden-section + uniform scan

        // Uniform scan first for chart
        for (let i = 0; i <= N_SAMPLES; i++) {
          const val = lo + (i / N_SAMPLES) * (hi - lo)
          setProgress(Math.round((i / N_SAMPLES) * 80))

          const testParams = {
            ...equipParams,
            [varyNodeId]: { ...(equipParams[varyNodeId] || {}), [varyParam]: val.toString() }
          }
          const solved = runSimOnce(testParams)
          if (!solved) continue

          const score = extractObjective(solved.nodes, solved.streams, objective)
          if (score != null && isFinite(score)) {
            history.push({ val, score })
          }
        }

        setProgress(90)

        const isMin = objective === 'energy' || objective === 'carbon'

        // Golden section refinement
        if (history.length > 2) {
          const sorted = [...history].sort((a, b) => isMin ? a.score - b.score : b.score - a.score)
          const bestIdx = history.indexOf(sorted[0])
          const lo2 = history[Math.max(0, bestIdx - 2)]?.val ?? lo
          const hi2 = history[Math.min(history.length - 1, bestIdx + 2)]?.val ?? hi

          for (let i = 0; i < 6; i++) {
            const val = lo2 + GOLDEN * (hi2 - lo2)
            const testParams = {
              ...equipParams,
              [varyNodeId]: { ...(equipParams[varyNodeId] || {}), [varyParam]: val.toString() }
            }
            const solved = runSimOnce(testParams)
            if (!solved) continue
            const score = extractObjective(solved.nodes, solved.streams, objective)
            if (score != null && isFinite(score)) history.push({ val, score })
          }
        }

        setProgress(100)

        const best = history.reduce((a, b) => isMin ? (b.score < a.score ? b : a) : (b.score > a.score ? b : a), history[0])
        const obj = OBJECTIVES.find(o => o.id === objective)
        const displayScore = isMin ? -best.score : best.score

        setResult({
          optVal: best.val,
          optScore: displayScore,
          history,
          objLabel: obj?.label,
          unit: obj?.unit,
          xLabel: `${nodes.find(n => n.id === varyNodeId)?.tag}.${varyParam}`,
          isMin
        })
      } catch (e) {
        setError('Optimization failed: ' + e.message)
      } finally {
        setRunning(false)
        setProgress(0)
      }
    }, 80)
  }, [varyNodeId, varyParam, rangeMin, rangeMax, objective, equipParams, runSimOnce, extractObjective, nodes])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 700, maxHeight: '88vh', background: 'rgba(10,14,26,0.98)',
        border: '1px solid #1E293B', borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.9)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid #1E293B',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(10,14,26,0) 100%)'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#F1F5F9' }}>⚡ Optimization Engine</div>
            <div style={{ fontSize: '0.63rem', color: '#A855F7', marginTop: 2 }}>
              Golden-Section Search · Parameter Sweep · Multi-Objective
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid #1E293B',
            borderRadius: 8, color: '#64748B', padding: '6px 14px', cursor: 'pointer', fontSize: '0.75rem'
          }}>✕ Close</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Objective */}
          <div>
            <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Objective Function
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {OBJECTIVES.map(o => (
                <div key={o.id} onClick={() => setObjective(o.id)} style={{
                  padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                  background: objective === o.id ? 'rgba(168,85,247,0.1)' : 'rgba(15,23,42,0.7)',
                  border: `1px solid ${objective === o.id ? '#A855F7' : '#1E293B'}`,
                  transition: 'all 0.15s'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: objective === o.id ? 700 : 400, color: objective === o.id ? '#A855F7' : '#94A3B8' }}>{o.label}</div>
                  <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: 2 }}>{o.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Parameter selection */}
          <div>
            <div style={{ fontSize: '0.6rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Decision Variable
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 10, alignItems: 'center' }}>
              <select value={`${varyNodeId}|${varyParam}`}
                onChange={e => {
                  const [nid, param] = e.target.value.split('|')
                  setVaryNodeId(nid); setVaryParam(param)
                }}
                style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1E293B', borderRadius: 7, padding: '9px 12px', color: '#F1F5F9', fontSize: '0.75rem', outline: 'none' }}>
                <option value="|">— Select parameter —</option>
                {paramOptions.map(o => (
                  <option key={o.label} value={`${o.nodeId}|${o.param}`}>{o.label}</option>
                ))}
              </select>
              <input type="number" placeholder="Min" value={rangeMin} onChange={e => setRangeMin(e.target.value)}
                style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1E293B', borderRadius: 7, padding: '9px 10px', color: '#F1F5F9', fontSize: '0.75rem', outline: 'none' }} />
              <input type="number" placeholder="Max" value={rangeMax} onChange={e => setRangeMax(e.target.value)}
                style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1E293B', borderRadius: 7, padding: '9px 10px', color: '#F1F5F9', fontSize: '0.75rem', outline: 'none' }} />
            </div>
          </div>

          {/* Run button */}
          <button onClick={runOptimization} disabled={running || nodes.length === 0}
            style={{
              padding: '12px', borderRadius: 10, width: '100%',
              background: running ? 'rgba(168,85,247,0.1)' : 'linear-gradient(135deg, #A855F7, #7C3AED)',
              border: running ? '1px solid #A855F750' : 'none',
              color: running ? '#A855F7' : 'white',
              fontWeight: 800, fontSize: '0.85rem', cursor: running ? 'not-allowed' : 'pointer',
              boxShadow: running ? 'none' : '0 0 24px rgba(168,85,247,0.35)'
            }}>
            {running ? `Optimizing... ${progress}%` : '⚡ Run Optimization'}
          </button>

          {/* Progress bar */}
          {running && (
            <div style={{ height: 4, background: '#1E293B', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #A855F7, #38BDF8)', transition: 'width 0.3s', borderRadius: 2 }} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', borderRadius: 8, fontSize: '0.72rem', color: '#FF4D6A' }}>
              ⚠ {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Optimal result banner */}
              <div style={{
                padding: '16px 20px', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(0,255,163,0.05))',
                border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12
              }}>
                <div style={{ fontSize: '0.6rem', color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  ✓ Optimal Solution Found
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#64748B' }}>Optimal {result.xLabel}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 800, color: '#A855F7', marginTop: 2 }}>
                      {result.optVal.toFixed(4)}
                    </div>
                  </div>
                  <div style={{ width: 1, height: 40, background: '#1E293B' }} />
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#64748B' }}>Objective Value</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>
                      {result.optScore.toFixed(2)} <span style={{ fontSize: '0.7rem', color: '#475569' }}>{result.unit}</span>
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <div style={{ fontSize: '0.62rem', color: '#64748B' }}>Evaluations</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#64748B', marginTop: 2 }}>
                      {result.history.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <OptimizationChart
                history={result.history}
                label={result.objLabel}
                xLabel={result.xLabel}
                objective={objective}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
