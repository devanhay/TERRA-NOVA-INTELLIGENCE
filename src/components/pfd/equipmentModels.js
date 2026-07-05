/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA — EQUIPMENT MODELS v2.0
 *  Sequential-modular equipment solvers.
 *  Each function takes (node, params, inlets, preset, thermo)
 *  and returns a solved stream object + diagnostic results array.
 *
 *  ENGINEERING CORRECTNESS REQUIREMENTS:
 *  - All outputs must satisfy mass balance within tolerance
 *  - Energy balances must account for latent heat properly
 *  - Vapor density uses ideal gas law (not hardcoded constants)
 *  - Reactor energy balance propagates dT from heat of reaction
 *  - Distillation uses corrected Gilliland formula
 * ═══════════════════════════════════════════════════════════════
 */

import {
  CHEMICALS, PRESETS,
  pSat, dHvap, vleFlash,
  mwMix, massfracA, liquidDensity, vaporDensity, mixtureDensity,
  liquidViscosity, vaporViscosity, cpLiqMix, cpVapMix,
  specificEnthalpy, bubblePointT, dewPointT,
  relVol, fenskie, underwoodRminBinary, gillilandN,
  isentropicTout, gammaGas, npsha
} from './thermodynamics.js'

// ─────────────────────────────────────────────────────────────────────
//  STREAM BUILDER UTILITY
//  Constructs a complete, physically-consistent stream object
// ─────────────────────────────────────────────────────────────────────
function buildStream(T, P, massFlow, zA, zB, compA, compB, flashResult) {
  const psi = flashResult?.psi ?? 0
  const xA = flashResult?.xA ?? zA
  const xB = flashResult?.xB ?? zB
  const yA = flashResult?.yA ?? zA
  const yB = flashResult?.yB ?? zB
  const phase = flashResult?.phase ?? 'Liquid'

  const MW = mwMix(zA, zB, compA, compB)       // g/mol
  const molFlow = (massFlow * 1000) / MW        // mol/s

  const rho = mixtureDensity(psi, P, T, xA, xB, yA, yB, compA, compB)
  const mu = psi >= 1
    ? vaporViscosity(yA, yB, compA, compB)
    : psi <= 0
      ? liquidViscosity(xA, xB, compA, compB)
      : liquidViscosity(xA, xB, compA, compB) * (1 - psi) + vaporViscosity(yA, yB, compA, compB) * psi

  const h = specificEnthalpy(T, psi, xA, xB, yA, yB, compA, compB)

  const z = flashResult?.z ?? [zA, zB]
  const x = flashResult?.x ?? [xA, xB]
  const y = flashResult?.y ?? [yA, yB]

  return {
    flow: massFlow, molFlow,
    temp: T, press: P,
    phase, psi,
    zA, zB,          // overall (feed) mole fractions
    xA, xB,          // liquid phase mole fractions
    yA, yB,          // vapor phase mole fractions
    z, x, y,         // multi-component arrays
    enthalpy: h,
    density: rho,
    viscosity: mu,
    MW
  }
}

// ─────────────────────────────────────────────────────────────────────
//  FEED TANK  (Source — system boundary entry)
// ─────────────────────────────────────────────────────────────────────
export function solveFeedTank(p, compA, compB, modelType, presetKey) {
  const flow = parseFloat(p.flow)
  const temp = parseFloat(p.temp)
  const press = parseFloat(p.press)
  const zA_pct = parseFloat(p.zA)
  if ([flow, temp, press, zA_pct].some(isNaN)) return { ok: false, reason: 'Missing feed specification' }
  if (flow <= 0) return { ok: false, reason: 'Flow must be > 0 kg/s' }
  if (press <= 0) return { ok: false, reason: 'Pressure must be > 0 kPa' }

  const zA = Math.max(0, Math.min(1, zA_pct / 100))
  const zB = 1 - zA

  const flash = vleFlash(temp, press, zA, zB, compA, compB, modelType, presetKey)
  if (!flash) return { ok: false, reason: 'VLE flash failed — check temperature/pressure range' }

  const stream = buildStream(temp, press, flow, zA, zB, compA, compB, flash)

  // Bubble and dew point at operating pressure
  const Tb = bubblePointT(press, zA, zB, compA, compB, modelType, presetKey)
  const Td = dewPointT(press, zA, zB, compA, compB, modelType, presetKey)

  return {
    ok: true,
    stream,
    results: [
      { label: 'Mass Flow Rate', val: flow, unit: 'kg/s' },
      { label: 'Molar Flow Rate', val: stream.molFlow.toFixed(2), unit: 'mol/s', raw: stream.molFlow },
      { label: 'Vapor Fraction ψ', val: flash.psi, unit: '' },
      { label: 'Phase', val: flash.phase, unit: '' },
      { label: 'Bubble Point', val: Tb, unit: '°C' },
      { label: 'Dew Point', val: Td, unit: '°C' },
      { label: 'Density', val: stream.density, unit: 'kg/m³' },
      { label: 'Viscosity', val: stream.viscosity * 1000, unit: 'mPa·s' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  PUMP  (Liquid pressure raising — adiabatic approximation)
// ─────────────────────────────────────────────────────────────────────
export function solvePump(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const dP = parseFloat(p.pressureRise)
  const eta = Math.min(0.99, Math.max(0.1, parseFloat(p.efficiency) / 100 || 0.75))
  const npshr = parseFloat(p.npshr) || 1.5
  if (isNaN(dP) || dP <= 0) return { ok: false, reason: 'Pressure rise ΔP must be > 0 kPa' }

  if (inlet.psi > 0.05) return { ok: false, reason: 'Pump requires liquid feed (ψ > 5% vapor detected). Use compressor for vapor.' }

  const { flow, temp, press, zA, zB } = inlet
  const rho = liquidDensity(zA, zB, compA, compB)   // kg/m³
  const Q = flow / rho                               // m³/s volumetric flow
  const Whydr = Q * dP                               // kW  (m³/s × kPa = kJ/s = kW)
  const Wshaft = Whydr / eta                         // kW shaft power (motor delivers more than fluid receives)
  const Q_loss = Wshaft * (1 - eta)                  // kW heat loss to fluid

  // Temperature rise from pump inefficiency (heat loss goes into fluid)
  const cpL = cpLiqMix(zA, zB, compA, compB)         // kJ/(kg·K)
  const dT = Q_loss / (flow * cpL)                   // °C (K)

  const outP = press + dP
  const outT = temp + dT

  // Pump NPSH check
  const NPSHa = npsha(press, temp, zA, zB, compA, compB, rho, parseFloat(p.staticHead) || 2.0)

  // Check for flashing at outlet (should remain liquid)
  const flash = vleFlash(outT, outP, zA, zB, compA, compB, modelType, presetKey)
  const stream = buildStream(outT, outP, flow, zA, zB, compA, compB, flash)

  const warnings = []
  if (NPSHa < npshr) {
    warnings.push(`CAVITATION RISK: NPSHa = ${NPSHa.toFixed(2)} m < NPSHr = ${npshr} m. Increase suction pressure or cool feed.`)
  }
  if (flash && flash.psi > 0.02) {
    warnings.push(`Pump outlet is partially vaporizing (ψ=${(flash.psi*100).toFixed(1)}%). Reduce ΔP or cool inlet.`)
  }

  return {
    ok: true,
    stream,
    warnings,
    results: [
      { label: 'Shaft Power', val: Wshaft, unit: 'kW' },
      { label: 'Hydraulic Power', val: Whydr, unit: 'kW' },
      { label: 'Pump Efficiency η', val: eta * 100, unit: '%' },
      { label: 'Temperature Rise ΔT', val: dT, unit: '°C' },
      { label: 'Volumetric Flow Q', val: Q * 3600, unit: 'm³/h' },
      { label: 'NPSH Available', val: NPSHa, unit: 'm' },
      { label: 'NPSH Required', val: npshr, unit: 'm' },
      { label: 'Outlet Phase', val: flash?.phase ?? 'Liquid', unit: '' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  MIXER  (Multi-inlet mass and energy balance)
// ─────────────────────────────────────────────────────────────────────
export function solveMixer(p, inlets, compA, compB, modelType, presetKey) {
  const valid = inlets.filter(s => s && s.flow > 0)
  if (valid.length === 0) return { ok: false, reason: 'No inlet streams connected' }

  // Overall mass balance: m_total = Σ m_i
  const totalMass = valid.reduce((s, i) => s + i.flow, 0)

  // Component mass flows: mA = Σ(m_i * wA_i)
  let massA = 0, massB = 0
  let totalEnergy = 0  // kW  (m_i * h_i = kJ/s)

  valid.forEach(s => {
    const wA = massfracA(s.zA, compA, compB)
    massA += s.flow * wA
    massB += s.flow * (1 - wA)
    totalEnergy += s.flow * s.enthalpy   // kJ/s
  })

  // Mass fractions of outlet
  const wA_out = massA / totalMass
  const wB_out = massB / totalMass

  // Convert mass fractions back to mole fractions
  const n_A = wA_out / CHEMICALS[compA].mw
  const n_B = wB_out / CHEMICALS[compB].mw
  const zA_out = n_A / (n_A + n_B)
  const zB_out = 1 - zA_out

  // Outlet specific enthalpy [kJ/kg]
  const h_out = totalEnergy / totalMass

  // Pressure — use minimum inlet pressure (conservative, fluid flows toward lower P)
  const outP = Math.min(...valid.map(s => s.press))
  const pressDrop = parseFloat(p.pressureDrop) || 0
  const outP_adj = Math.max(10, outP - pressDrop)

  // Solve outlet temperature from enthalpy
  // h_out = cpL*(T_out - 25) → T_out = h_out/cpL + 25 (liquid, no phase change)
  // Need iterative approach for phase change
  const cpL_out = cpLiqMix(zA_out, zB_out, compA, compB)
  let T_out = h_out / cpL_out + 25  // initial estimate from sensible heat only

  // Iterate to find T consistent with enthalpy (handles phase change)
  for (let i = 0; i < 30; i++) {
    const flash = vleFlash(T_out, outP_adj, zA_out, zB_out, compA, compB, modelType, presetKey)
    if (!flash) break
    const h_calc = specificEnthalpy(T_out, flash.psi, flash.xA, flash.xB, flash.yA, flash.yB, compA, compB)
    const dh = h_out - h_calc
    const cpEff = cpL_out + flash.psi * (cpVapMix(zA_out, zB_out, compA, compB) - cpL_out)
    const dT = dh / (cpEff || cpL_out)
    T_out += dT
    if (Math.abs(dT) < 0.01) break
  }

  const flash_out = vleFlash(T_out, outP_adj, zA_out, zB_out, compA, compB, modelType, presetKey)
  const stream = buildStream(T_out, outP_adj, totalMass, zA_out, zB_out, compA, compB, flash_out)

  return {
    ok: true,
    stream,
    results: [
      { label: 'Total Mass Flow Out', val: totalMass, unit: 'kg/s' },
      { label: 'Mixed Outlet T', val: T_out, unit: '°C' },
      { label: 'Outlet Mole Fraction A', val: zA_out * 100, unit: '%' },
      { label: 'Outlet Phase', val: flash_out?.phase ?? '—', unit: '' },
      { label: 'Outlet Density', val: stream.density, unit: 'kg/m³' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  SPLITTER  (Divides stream — composition unchanged)
// ─────────────────────────────────────────────────────────────────────
export function solveSplitter(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }
  const r_pct = parseFloat(p.splitRatio)
  if (isNaN(r_pct)) return { ok: false, reason: 'Split ratio required' }

  const r = Math.max(0, Math.min(100, r_pct)) / 100
  const flow1 = inlet.flow * r
  const flow2 = inlet.flow * (1 - r)

  // Splitter: composition and T/P identical in both outlets (adiabatic, no mixing)
  const flash = vleFlash(inlet.temp, inlet.press, inlet.zA, inlet.zB, compA, compB, modelType, presetKey)
  const s1 = buildStream(inlet.temp, inlet.press, flow1, inlet.zA, inlet.zB, compA, compB, flash)
  const s2 = buildStream(inlet.temp, inlet.press, flow2, inlet.zA, inlet.zB, compA, compB, flash)

  return {
    ok: true,
    split1: s1, split2: s2,
    results: [
      { label: 'Outlet 1 Flow', val: flow1, unit: 'kg/s' },
      { label: 'Outlet 2 Flow', val: flow2, unit: 'kg/s' },
      { label: 'Split Ratio', val: r * 100, unit: '%' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  HEATER / COOLER  (Duty-specified heat exchanger, single side)
// ─────────────────────────────────────────────────────────────────────
export function solveHeaterCooler(type, p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const targetT = parseFloat(p.targetTemp)
  const dp = parseFloat(p.pressDrop) || 0
  if (isNaN(targetT)) return { ok: false, reason: 'Target temperature required' }

  const outP = Math.max(10, inlet.press - dp)
  const { flow, temp: T_in, zA, zB } = inlet

  // Inlet flash state
  const flash_in = vleFlash(T_in, inlet.press, zA, zB, compA, compB, modelType, presetKey)
  const psi_in = flash_in?.psi ?? inlet.psi ?? 0
  const xA_in = flash_in?.xA ?? zA, xB_in = flash_in?.xB ?? zB
  const yA_in = flash_in?.yA ?? zA, yB_in = flash_in?.yB ?? zB

  // Outlet flash state
  const flash_out = vleFlash(targetT, outP, zA, zB, compA, compB, modelType, presetKey)
  if (!flash_out) return { ok: false, reason: 'VLE flash failed at outlet conditions' }

  // Correct energy balance:
  // Q = m*(h_out - h_in)  [both enthalpies referenced to same state]
  const h_in = specificEnthalpy(T_in, psi_in, xA_in, xB_in, yA_in, yB_in, compA, compB)
  const h_out = specificEnthalpy(targetT, flash_out.psi, flash_out.xA, flash_out.xB, flash_out.yA, flash_out.yB, compA, compB)
  const duty = flow * (h_out - h_in)  // kW — positive = heat added (heater), negative = heat removed (cooler)

  const stream = buildStream(targetT, outP, flow, zA, zB, compA, compB, flash_out)

  const phaseCrossing = (psi_in < 0.01 && flash_out.psi > 0.01) ? 'Phase change: vaporization occurring' :
                        (psi_in > 0.01 && flash_out.psi < 0.01) ? 'Phase change: condensation occurring' : null

  const warnings = []
  if (type === 'heater' && duty < 0) warnings.push('Specified target temperature is LOWER than inlet. Use a Cooler instead.')
  if (type === 'cooler' && duty > 0) warnings.push('Specified target temperature is HIGHER than inlet. Use a Heater instead.')

  return {
    ok: true,
    stream,
    warnings,
    results: [
      { label: type === 'heater' ? 'Heating Duty Q' : 'Cooling Duty Q', val: Math.abs(duty), unit: 'kW' },
      { label: 'Inlet Phase', val: flash_in?.phase ?? '—', unit: '' },
      { label: 'Outlet Phase', val: flash_out.phase, unit: '' },
      { label: 'Outlet Vapor Fraction ψ', val: flash_out.psi, unit: '' },
      { label: 'Phase Crossing', val: phaseCrossing ?? 'No', unit: '' },
      { label: 'Inlet Enthalpy', val: h_in, unit: 'kJ/kg' },
      { label: 'Outlet Enthalpy', val: h_out, unit: 'kJ/kg' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  HEAT EXCHANGER  (ε-NTU method, two streams, counter-current)
// ─────────────────────────────────────────────────────────────────────
export function solveHeatExchanger(p, inlets, compA, compB, modelType, presetKey) {
  const valid = inlets.filter(s => s && s.flow > 0)
  if (valid.length < 2) return { ok: false, reason: 'Requires 2 inlet streams (hot + cold)' }

  const sorted = [...valid].sort((a, b) => b.temp - a.temp)
  const hot = sorted[0], cold = sorted[1]

  if (hot.temp <= cold.temp) return { ok: false, reason: 'Hot stream must be hotter than cold stream' }

  const U = parseFloat(p.uValue) || 500     // W/(m²·K)
  const A = parseFloat(p.area)              // m²
  const dp = parseFloat(p.pressDrop) || 0  // kPa each side
  if (isNaN(A) || A <= 0) return { ok: false, reason: 'Heat transfer area A required' }

  const warning = (hot.psi > 0.01 || cold.psi > 0.01)
    ? 'Two-phase stream detected. Solving with latent heat enthalpy iteration.'
    : null

  // Initialize Cp values with inlet values
  let Cp_hot = (hot.psi < 0.5 ? cpLiqMix(hot.xA, hot.xB, compA, compB) : cpVapMix(hot.yA, hot.yB, compA, compB))
  let Cp_cold = (cold.psi < 0.5 ? cpLiqMix(cold.xA, cold.xB, compA, compB) : cpVapMix(cold.yA, cold.yB, compA, compB))

  const hotP_out = Math.max(10, hot.press - dp)
  const coldP_out = Math.max(10, cold.press - dp)

  let Th_out = hot.temp - 5.0
  let Tc_out = cold.temp + 5.0
  let Q = 0.0
  let eps = 0.0
  let NTU = 0.0

  // 10 iterations to converge Cp rate with latent heat
  for (let iter = 0; iter < 10; iter++) {
    const Ch = hot.flow * Cp_hot    // kW/K
    const Cc = cold.flow * Cp_cold  // kW/K
    const Cmin = Math.min(Ch, Cc)
    const Cmax = Math.max(Ch, Cc)
    const Cr = Cmin / Cmax

    const Qmax = Cmin * (hot.temp - cold.temp)  // kW maximum possible exchange
    NTU = (U * A / 1000) / Cmin  // dimensionless

    if (Math.abs(Cr - 1) < 0.001) {
      eps = NTU / (1 + NTU)
    } else {
      eps = (1 - Math.exp(-NTU * (1 - Cr))) / (1 - Cr * Math.exp(-NTU * (1 - Cr)))
    }
    eps = Math.min(Math.max(0.001, eps), 0.999)

    Q = eps * Qmax  // kW
    Th_out = hot.temp - Q / Ch
    Tc_out = cold.temp + Q / Cc

    // Calculate actual outlet enthalpies
    const flashHot = vleFlash(Th_out, hotP_out, hot.zA, hot.zB, compA, compB, modelType, presetKey)
    const flashCold = vleFlash(Tc_out, coldP_out, cold.zA, cold.zB, compA, compB, modelType, presetKey)

    const h_hot_out = specificEnthalpy(Th_out, flashHot.psi, flashHot.xA, flashHot.xB, flashHot.yA, flashHot.yB, compA, compB)
    const h_cold_out = specificEnthalpy(Tc_out, flashCold.psi, flashCold.xA, flashCold.xB, flashCold.yA, flashCold.yB, compA, compB)

    const dT_hot = Math.max(0.01, hot.temp - Th_out)
    const dT_cold = Math.max(0.01, Tc_out - cold.temp)

    // Average Cp = ΔH / ΔT
    const new_Cp_hot = Math.abs(hot.enthalpy - h_hot_out) / dT_hot
    const new_Cp_cold = Math.abs(h_cold_out - cold.enthalpy) / dT_cold

    // Damping to ensure stability
    Cp_hot = 0.5 * Cp_hot + 0.5 * new_Cp_hot
    Cp_cold = 0.5 * Cp_cold + 0.5 * new_Cp_cold
  }

  // Final Flash check
  const flashHot = vleFlash(Th_out, hotP_out, hot.zA, hot.zB, compA, compB, modelType, presetKey)
  const flashCold = vleFlash(Tc_out, coldP_out, cold.zA, cold.zB, compA, compB, modelType, presetKey)

  const streamHot = buildStream(Th_out, hotP_out, hot.flow, hot.zA, hot.zB, compA, compB, flashHot)
  const streamCold = buildStream(Tc_out, coldP_out, cold.flow, cold.zA, cold.zB, compA, compB, flashCold)

  // LMTD calculation
  const dT1 = hot.temp - Tc_out
  const dT2 = Th_out - cold.temp
  const LMTD = (Math.abs(dT1 - dT2) < 0.001) ? dT1 : (dT1 - dT2) / Math.log(Math.abs(dT1 / dT2))

  const warnings = []
  if (warning) warnings.push(warning)
  if (Th_out < cold.temp) warnings.push('Temperature cross detected! Increase area or reduce duty.')

  return {
    ok: true,
    hotOutlet: streamHot, coldOutlet: streamCold,
    warnings,
    results: [
      { label: 'Heat Duty Q', val: Q, unit: 'kW' },
      { label: 'Effectiveness ε', val: eps * 100, unit: '%' },
      { label: 'NTU', val: NTU, unit: '' },
      { label: 'LMTD', val: LMTD, unit: '°C' },
      { label: 'Hot Stream Outlet T', val: Th_out, unit: '°C' },
      { label: 'Cold Stream Outlet T', val: Tc_out, unit: '°C' },
      { label: 'UA Product', val: U * A / 1000, unit: 'kW/K' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  REACTOR  (Conversion-based stoichiometric, energy balance)
//  Reaction: A → stoich·B
//  Energy balance: T_out from Q_rxn = F_A_reacted * ΔH_rxn
// ─────────────────────────────────────────────────────────────────────
export function solveReactor(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const X = Math.min(1, Math.max(0, parseFloat(p.conversion) / 100))
  const stoich = parseFloat(p.stoich) || 1.0
  const dHrxn_kJmol = parseFloat(p.rxnHeat) || 0   // kJ/mol A reacted (negative = exothermic)
  if (isNaN(X)) return { ok: false, reason: 'Conversion required (0–100%)' }

  const { flow, temp, press, zA, zB } = inlet
  const MW_A = CHEMICALS[compA].mw, MW_B = CHEMICALS[compB].mw

  // Molar flow rates [mol/s]
  const n_A_in = inlet.molFlow * zA
  const n_B_in = inlet.molFlow * zB
  const n_A_reacted = n_A_in * X

  // Stoichiometric molar balance: A → stoich*B
  const n_A_out = n_A_in - n_A_reacted
  const n_B_out = n_B_in + stoich * n_A_reacted

  const n_total_out = n_A_out + n_B_out
  const zA_out = n_A_out / n_total_out
  const zB_out = n_B_out / n_total_out

  // Mass conservation: m_out = m_A_in*(1-X) + m_B_in + n_A_reacted*stoich*MW_B
  //   (mass is conserved atom-by-atom; if A and B have different MW,
  //    remaining mass must include or exclude excess mass)
  // NOTE: For A→stoich*B to conserve mass: n_reacted*MW_A = stoich*n_reacted*MW_B
  //   This is only true if stoich*MW_B = MW_A (conservation). In general:
  //   mass_out = n_A_out*MW_A + n_B_out*MW_B (from atoms)
  const massFlow_out = (n_A_out * MW_A + n_B_out * MW_B) / 1000  // kg/s

  // Heat of reaction → temperature change
  // Q_rxn = n_A_reacted [mol/s] * dHrxn [kJ/mol]  → kW
  const Q_rxn = n_A_reacted * dHrxn_kJmol  // kW (+ve = endothermic heat input, -ve = exothermic)

  // Energy balance: sum of inlet enthalpy + heat duty = outlet enthalpy
  // For adiabatic reactor: Q_rxn must be absorbed by sensible heat rise
  // T_out from: m_out * Cp_out * (T_out - T_in) = -Q_rxn (exothermic raises T)
  const cpL_out = cpLiqMix(zA_out, zB_out, compA, compB)
  // Temperature change (adiabatic)
  const dT_adiabatic = -Q_rxn / (massFlow_out * cpL_out)  // °C (exothermic → +dT)
  const T_out = temp + dT_adiabatic

  const flash_out = vleFlash(T_out, press, zA_out, zB_out, compA, compB, modelType, presetKey)
  const stream = buildStream(T_out, press, massFlow_out, zA_out, zB_out, compA, compB, flash_out)

  const warnings = []
  if (T_out > 300) warnings.push(`High reactor outlet temperature: ${T_out.toFixed(1)} °C. Check cooling.`)
  if (Math.abs(dHrxn_kJmol) > 0 && Math.abs(dT_adiabatic) > 50) {
    warnings.push(`Significant adiabatic temperature rise: ${dT_adiabatic.toFixed(1)} °C. Consider heat removal.`)
  }

  return {
    ok: true,
    stream,
    warnings,
    results: [
      { label: 'Reactant A Converted', val: n_A_reacted, unit: 'mol/s' },
      { label: 'Product B Generated', val: stoich * n_A_reacted, unit: 'mol/s' },
      { label: 'Outlet Mole Fraction A', val: zA_out * 100, unit: '%' },
      { label: 'Outlet Mass Flow', val: massFlow_out, unit: 'kg/s' },
      { label: 'Reaction Heat Q_rxn', val: -Q_rxn, unit: 'kW' },
      { label: 'Adiabatic ΔT', val: dT_adiabatic, unit: '°C' },
      { label: 'Outlet T (Adiabatic)', val: T_out, unit: '°C' },
      { label: 'Outlet Phase', val: flash_out?.phase ?? '—', unit: '' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  FLASH DRUM / PHASE SEPARATOR  (Isothermal VLE flash)
// ─────────────────────────────────────────────────────────────────────
export function solveFlash(p, inlet, isAutoSeparator, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const T = isAutoSeparator ? inlet.temp : parseFloat(p.temp)
  const P = isAutoSeparator ? inlet.press : parseFloat(p.press)
  if (isNaN(T) || isNaN(P)) return { ok: false, reason: 'Flash temperature and pressure required' }
  if (P <= 0) return { ok: false, reason: 'Pressure must be > 0 kPa' }

  const { flow, zA, zB } = inlet
  const flash = vleFlash(T, P, zA, zB, compA, compB, modelType, presetKey)
  if (!flash) return { ok: false, reason: 'VLE calculation did not converge' }

  const psi = Math.max(0.0, Math.min(1.0, flash.psi))
  const vaporMass = flow * psi
  const liquidMass = flow * (1.0 - psi)

  // Vapor density from ideal gas
  const rhoV = vaporDensity(P, T, flash.yA, flash.yB, compA, compB)
  const rhoL = liquidDensity(flash.xA, flash.xB, compA, compB)
  const muL = liquidViscosity(flash.xA, flash.xB, compA, compB)
  const muV = vaporViscosity(flash.yA, flash.yB, compA, compB)

  const MW_V = mwMix(flash.yA, flash.yB, compA, compB)
  const MW_L = mwMix(flash.xA, flash.xB, compA, compB)

  const h_out = specificEnthalpy(T, psi, flash.xA, flash.xB, flash.yA, flash.yB, compA, compB)
  const dHvapA = dHvap(compA, T), dHvapB = dHvap(compB, T)
  const wA_V = massfracA(flash.yA, compA, compB)
  const dHvapMix = wA_V * dHvapA + (1 - wA_V) * dHvapB

  const vaporStream = {
    flow: vaporMass, molFlow: vaporMass > 0.0001 ? (vaporMass * 1000) / MW_V : 0.0,
    temp: T, press: P, phase: 'Vapor', psi: 1,
    zA: flash.yA, zB: flash.yB,
    xA: flash.yA, xB: flash.yB,
    yA: flash.yA, yB: flash.yB,
    enthalpy: h_out + dHvapMix * (1 - psi),
    density: rhoV, viscosity: muV, MW: MW_V
  }

  const liquidStream = {
    flow: liquidMass, molFlow: liquidMass > 0.0001 ? (liquidMass * 1000) / MW_L : 0.0,
    temp: T, press: P, phase: 'Liquid', psi: 0,
    zA: flash.xA, zB: flash.xB,
    xA: flash.xA, xB: flash.xB,
    yA: flash.xA, yB: flash.xB,
    enthalpy: specificEnthalpy(T, 0, flash.xA, flash.xB, flash.xA, flash.xB, compA, compB),
    density: rhoL, viscosity: muL, MW: MW_L
  }

  const warnings = []
  if (psi <= 0.001) {
    warnings.push(`Single-phase warning: Feed is fully subcooled liquid at ${T.toFixed(1)}°C / ${P.toFixed(0)} kPa. Vapor outlet flow is 0.0 kg/s.`)
  } else if (psi >= 0.999) {
    warnings.push(`Single-phase warning: Feed is fully superheated vapor at ${T.toFixed(1)}°C / ${P.toFixed(0)} kPa. Liquid outlet flow is 0.0 kg/s.`)
  }

  return {
    ok: true,
    vapor: vaporStream, liquid: liquidStream,
    warnings,
    results: [
      { label: 'Vapor Fraction ψ', val: psi, unit: '' },
      { label: 'Vapor Flow', val: vaporMass, unit: 'kg/s' },
      { label: 'Liquid Flow', val: liquidMass, unit: 'kg/s' },
      { label: 'Vapor Purity (A)', val: flash.yA * 100, unit: '%' },
      { label: 'Liquid Purity (A)', val: flash.xA * 100, unit: '%' },
      { label: 'Vapor Density', val: rhoV, unit: 'kg/m³' },
      { label: 'Liquid Density', val: rhoL, unit: 'kg/m³' },
      { label: 'K_A (equil. ratio)', val: flash.KA ?? flash.yA/flash.xA, unit: '' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  RADFRAC DISTILLATION COLUMN SOLVER (Tray-by-stage VLE)
// ─────────────────────────────────────────────────────────────────────
export function solveRadFracColumn(p, inlet, compA, compB, modelType, presetKey) {
  const N = parseInt(p.numStages) || 12
  const Nf = parseInt(p.feedStage) || 6
  const R = parseFloat(p.refluxRatio)
  const D_ratio = (parseFloat(p.distillateSplit) || 50) / 100
  const P_col = parseFloat(p.operatingPressure) || inlet.press
  const q = parseFloat(p.feedQuality) ?? 1.0 // feed quality

  if (isNaN(R)) return { ok: false, reason: 'Reflux ratio is required for RadFrac' }

  const F = inlet.flow
  const zF = inlet.zA
  const D = F * D_ratio
  const B = F - D

  if (D <= 0 || B <= 0) return { ok: false, reason: 'Distillate ratio is invalid (0-100%)' }

  const T_dew_D = dewPointT(P_col, zF, 1 - zF, compA, compB, modelType, presetKey)
  const T_bub_B = bubblePointT(P_col, zF, 1 - zF, compA, compB, modelType, presetKey)
  
  // Stages arrays (0 is condenser stage, N-1 is reboiler stage)
  const T = new Array(N)
  for (let j = 0; j < N; j++) {
    T[j] = T_dew_D + (T_bub_B - T_dew_D) * (j / (N - 1))
  }

  const xA = new Array(N).fill(zF)
  const yA = new Array(N).fill(zF)

  // Constant Molal Overflow flows (Mass or molar basis proxy)
  const L = new Array(N)
  const V = new Array(N)
  for (let j = 0; j < N; j++) {
    if (j < Nf) {
      L[j] = R * D
      V[j] = (R + 1) * D
    } else {
      L[j] = R * D + q * F
      V[j] = (R + 1) * D + (q - 1) * F
    }
  }

  // Stage-by-stage MESH Convergence Loop
  for (let iter = 0; iter < 40; iter++) {
    for (let j = 0; j < N; j++) {
      // Evaluate local VLE K-values at current stage temperature
      const flash = vleFlash(T[j], P_col, xA[j], 1 - xA[j], compA, compB, modelType, presetKey)
      const KA = flash?.KA ?? 1.5
      const KB = flash?.KB ?? 0.6

      // Stage mass balances
      if (j === 0) {
        // Condenser (Reflux accumulator)
        // Overhead vapor y1 enters and is fully/partially condensed to xD
        const feedX = xA[1] * KA // vapor enters from stage 1
        xA[j] = Math.max(0.001, Math.min(0.999, feedX))
      } else if (j === N - 1) {
        // Reboiler (bottom product B + vapor boilup V_N-1)
        const L_in = L[j - 1]
        xA[j] = (L_in * xA[j - 1]) / (B + V[j] * KA)
      } else if (j === Nf) {
        // Feed Stage
        const L_in = L[j - 1]
        const V_in = V[j + 1]
        // Feed vapor enters V, feed liquid enters L
        const feedLiquidIn = q * F * zF
        const feedVaporIn = (1 - q) * F * zF
        xA[j] = (L_in * xA[j - 1] + V_in * yA[j + 1] + feedLiquidIn) / (L[j] + V[j] * KA)
      } else {
        // Intermediate stages
        const L_in = L[j - 1]
        const V_in = V[j + 1]
        xA[j] = (L_in * xA[j - 1] + V_in * yA[j + 1]) / (L[j] + V[j] * KA)
      }

      xA[j] = Math.max(0.0001, Math.min(0.9999, xA[j]))
      yA[j] = Math.max(0.0001, Math.min(0.9999, xA[j] * KA))

      // Bubble point update
      T[j] = bubblePointT(P_col, xA[j], 1 - xA[j], compA, compB, modelType, presetKey)
    }
  }

  const xD = xA[0]
  const xB = xA[N - 1]

  const dH_top = dHvap(compA, T[0])
  const Qc = (R + 1) * D * dH_top
  const Qr = Qc + D * specificEnthalpy(T[0], 0, xD, 1-xD, xD, 1-xD, compA, compB) + B * specificEnthalpy(T[N-1], 0, xB, 1-xB, xB, 1-xB, compA, compB) - F * inlet.enthalpy

  const flash_D = vleFlash(T[0], P_col, xD, 1 - xD, compA, compB, modelType, presetKey)
  const flash_B = vleFlash(T[N-1], P_col, xB, 1 - xB, compA, compB, modelType, presetKey)

  const topStream = buildStream(T[0], P_col, D, xD, 1 - xD, compA, compB, flash_D)
  const bottomStream = buildStream(T[N-1], P_col, B, xB, 1 - xB, compA, compB, flash_B)

  // Bundle profiles for UI graphing
  const profiles = []
  for (let j = 0; j < N; j++) {
    profiles.push({
      stage: j + 1,
      temp: T[j],
      liquidA: xA[j],
      vaporA: yA[j]
    })
  }

  return {
    ok: true,
    top: topStream,
    bottom: bottomStream,
    profiles,
    results: [
      { label: 'RadFrac Total Stages', val: N, unit: 'stages' },
      { label: 'Feed Stage', val: Nf, unit: '' },
      { label: 'Distillate Purity (A)', val: xD * 100, unit: '%' },
      { label: 'Bottoms Purity (B)', val: (1 - xB) * 100, unit: '%' },
      { label: 'Condenser Duty Qc', val: Qc, unit: 'kW' },
      { label: 'Reboiler Duty Qr', val: Math.abs(Qr), unit: 'kW' },
      { label: 'Top Stage Temperature', val: T[0], unit: '°C' },
      { label: 'Bottom Stage Temperature', val: T[N-1], unit: '°C' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  DISTILLATION COLUMN  (Fenske-Underwood-Gilliland shortcut)
// ─────────────────────────────────────────────────────────────────────
export function solveDistillation(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  if (p.solverMode === 'RadFrac') {
    return solveRadFracColumn(p, inlet, compA, compB, modelType, presetKey)
  }

  const R = parseFloat(p.refluxRatio)
  const xD_pct = parseFloat(p.distillatePurity)
  const xB_pct = parseFloat(p.bottomsPurity)
  const P_col = parseFloat(p.operatingPressure) || inlet.press
  const q = parseFloat(p.feedQuality) ?? 1.0  // feed quality (1=sat liquid, 0=sat vapor)
  if ([R, xD_pct, xB_pct].some(isNaN)) return { ok: false, reason: 'Reflux ratio, distillate purity, and bottoms purity required' }

  const zF = inlet.zA
  const xD = Math.min(0.999, xD_pct / 100)
  const xB_spec = Math.max(0.001, xB_pct / 100)
  const F = inlet.flow

  // Overall + component mass balances: F = D + B, F*zF = D*xD + B*xB
  const D = F * (zF - xB_spec) / (xD - xB_spec)
  const B = F - D
  if (D <= 0 || B <= 0) return { ok: false, reason: `Separation targets impossible: D=${D.toFixed(2)} kg/s, B=${B.toFixed(2)} kg/s. Adjust purities relative to feed (zF=${(zF*100).toFixed(1)}%).` }

  // Relative volatility at feed temperature
  const alpha_F = relVol(inlet.temp, compA, compB)
  if (alpha_F <= 1.0) return { ok: false, reason: `Relative volatility α=${alpha_F.toFixed(3)} ≤ 1. Component A is less volatile than B — distillation impossible in this direction.` }

  // Fenske Nmin (corrected for mole fractions in distillate/bottoms)
  const Nmin = fenskie(xD, xB_spec, alpha_F)

  // Underwood Rmin (corrected binary implementation)
  const { Rmin } = underwoodRminBinary(alpha_F, zF, xD, xB_spec, q)

  if (R <= Rmin) return { ok: false, reason: `Reflux ratio R=${R} must be > Rmin=${Rmin.toFixed(3)}. Increase R.` }

  // Gilliland correlation (CORRECTED formula: N = (Nmin + Y)/(1-Y))
  const { N, Y, X } = gillilandN(Nmin, Rmin, R)

  // Condenser and reboiler duties
  const MW_D = mwMix(xD, 1 - xD, compA, compB)
  const D_mol = (D * 1000) / MW_D  // mol/s distillate
  const dHvapA_cond = dHvap(compA, inlet.temp - 15)
  const dHvapB_cond = dHvap(compB, inlet.temp - 15)
  const wA_D = massfracA(xD, compA, compB)
  const dHvapMix_D = wA_D * dHvapA_cond + (1 - wA_D) * dHvapB_cond  // kJ/kg
  const Qc = (R + 1) * D * dHvapMix_D        // kW condenser duty (heat removed)
  const Qr = Qc + D * inlet.enthalpy - B * inlet.enthalpy  // approximate reboiler

  // Outlet stream temperatures (bubble/dew points at column pressure)
  const T_distil_dew = dewPointT(P_col, xD, 1 - xD, compA, compB, modelType, presetKey)
  const T_bottoms_bub = bubblePointT(P_col, xB_spec, 1 - xB_spec, compA, compB, modelType, presetKey)

  const MW_B = mwMix(xB_spec, 1 - xB_spec, compA, compB)
  const flash_D = vleFlash(T_distil_dew, P_col, xD, 1 - xD, compA, compB, modelType, presetKey)
  const flash_B = vleFlash(T_bottoms_bub, P_col, xB_spec, 1 - xB_spec, compA, compB, modelType, presetKey)

  const topStream = buildStream(T_distil_dew, P_col, D, xD, 1 - xD, compA, compB, flash_D)
  const bottomStream = buildStream(T_bottoms_bub, P_col, B, xB_spec, 1 - xB_spec, compA, compB, flash_B)

  // Sizing column diameter based on flooding correlation
  const rhoV = topStream.density || 1.2
  const rhoL = bottomStream.density || 800
  const V_mass = (R + 1) * D // kg/s vapour flow rate
  const C_sb = 0.07 // capacity parameter (m/s)
  const U_flood = C_sb * Math.sqrt(Math.max(1, rhoL - rhoV) / Math.max(0.1, rhoV))
  const U_op = 0.75 * U_flood
  const A_col = V_mass / Math.max(0.1, rhoV * U_op)
  const diam = Math.max(0.4, Math.min(6.5, Math.sqrt((4 * A_col) / Math.PI)))

  const warnings = []
  if (N > 100) warnings.push(`Very high stage count (N=${N}). Consider reducing purity targets or increasing R.`)
  if (R > 5 * Rmin) warnings.push(`R/Rmin = ${(R/Rmin).toFixed(2)} >> 1. Over-refluxing causes high utility cost.`)

  return {
    ok: true,
    top: topStream, bottom: bottomStream,
    warnings,
    results: [
      { label: 'Minimum Stages Nmin', val: Nmin, unit: 'stages' },
      { label: 'Actual Stages N', val: N, unit: 'stages' },
      { label: 'Minimum Reflux Rmin', val: Rmin, unit: '' },
      { label: 'Operating Reflux R', val: R, unit: '' },
      { label: 'R/Rmin', val: R / Rmin, unit: '' },
      { label: 'Gilliland Y', val: Y, unit: '' },
      { label: 'Column Diameter', val: diam.toFixed(2), unit: 'm', raw: diam },
      { label: 'Condenser Duty Qc', val: Qc, unit: 'kW' },
      { label: 'Reboiler Duty Qr', val: Math.abs(Qr), unit: 'kW' },
      { label: 'Distillate T (Dew)', val: T_distil_dew, unit: '°C' },
      { label: 'Bottoms T (Bubble)', val: T_bottoms_bub, unit: '°C' },
      { label: 'Relative Volatility α', val: alpha_F, unit: '' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  CONTROL VALVE  (Isenthalpic throttling — Joule-Thomson effect)
// ─────────────────────────────────────────────────────────────────────
export function solveValve(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const outP = parseFloat(p.outletPress)
  if (isNaN(outP) || outP <= 0) return { ok: false, reason: 'Outlet pressure required (> 0 kPa)' }
  if (outP >= inlet.press) return { ok: false, reason: `Outlet P (${outP} kPa) must be lower than inlet P (${inlet.press.toFixed(0)} kPa)` }

  const { flow, temp, press, zA, zB } = inlet
  // Isenthalpic process: H_in = H_out → h_in = h_out (specific)
  // For liquid: approximate Joule-Thomson coefficient
  //   μ_JT = (∂T/∂P)_H ≈ (T*V*αp - V) / Cp  [K/Pa]
  //   For ideal gas: μ_JT = 0 (temperature doesn't change)
  //   For real liquids: small effect, often < 0.2°C per 100 kPa drop
  // For engineering approximation: iterate to find T_out from enthalpy conservation

  let T_out = temp  // initial guess — unchanged
  const h_in = inlet.enthalpy
  const dP = press - outP

  // Simple iterative approach: find T_out such that h(T_out, P_out) = h_in
  // Account for possible phase change (flash)
  for (let iter = 0; iter < 40; iter++) {
    const flash_try = vleFlash(T_out, outP, zA, zB, compA, compB, modelType, presetKey)
    if (!flash_try) break
    const h_try = specificEnthalpy(T_out, flash_try.psi, flash_try.xA, flash_try.xB, flash_try.yA, flash_try.yB, compA, compB)
    const dh = h_in - h_try
    const cpEff = cpLiqMix(zA, zB, compA, compB)
    const dT = dh / cpEff
    T_out += dT * 0.5  // relaxation
    if (Math.abs(dT) < 0.01) break
  }

  const flash_out = vleFlash(T_out, outP, zA, zB, compA, compB, modelType, presetKey)
  const stream = buildStream(T_out, outP, flow, zA, zB, compA, compB, flash_out)

  const warnings = []
  if (flash_out && flash_out.psi > 0.01) {
    warnings.push(`Flashing across valve: ${(flash_out.psi * 100).toFixed(1)}% of stream vaporizes. High erosion risk.`)
  }

  return {
    ok: true,
    stream,
    warnings,
    results: [
      { label: 'Inlet Pressure', val: press, unit: 'kPa' },
      { label: 'Outlet Pressure', val: outP, unit: 'kPa' },
      { label: 'ΔP Across Valve', val: dP, unit: 'kPa' },
      { label: 'Temperature Change', val: T_out - temp, unit: '°C' },
      { label: 'Flash Fraction ψ', val: flash_out?.psi ?? 0, unit: '' },
      { label: 'Outlet Phase', val: flash_out?.phase ?? '—', unit: '' },
      { label: 'Process', val: 'Isenthalpic (H=const)', unit: '' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  PRESSURE RELIEF VALVE (PRV)  (Automatic safety overpressure release)
// ─────────────────────────────────────────────────────────────────────
export function solvePRV(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const P_set = parseFloat(p.setPressure)
  const area = parseFloat(p.orificeArea) || 120.0  // mm²
  const Pb = parseFloat(p.backPressure) || 101.3  // kPa (back pressure, e.g. flare header)
  
  if (isNaN(P_set) || P_set <= 0) return { ok: false, reason: 'Set pressure must be > 0 kPa' }

  const { flow, temp, press, zA, zB } = inlet
  
  // Status check: Is valve popped?
  const isPopped = press > P_set * 1.10 // Popped at 10% overpressure

  let reliefFlow = 0
  let state = 'Closed'

  if (isPopped) {
    state = 'OPEN / RELIEVING'
    // Vapor discharge sizing equation (API RP 520):
    // W = C * A * P_upstream * sqrt(MW / T_upstream)
    // C is discharge coefficient, A is area in mm2, P_upstream in kPa abs, T in K
    const T_K = temp + 273.15
    const MW = mwMix(zA, zB, compA, compB)
    const C_coeff = 0.62 // Standard discharge coefficient
    
    // reliefFlow in kg/s (API coefficient adjusted for SI units)
    reliefFlow = 0.00015 * C_coeff * area * press * Math.sqrt(MW / T_K)
  }

  // PRV passes input stream components but scales the relief flow rate
  const flash_out = vleFlash(temp, Pb, zA, zB, compA, compB, modelType, presetKey)
  const stream = buildStream(temp, Pb, reliefFlow, zA, zB, compA, compB, flash_out)

  const warnings = []
  if (isPopped) {
    warnings.push(`EMERGENCY: Vessel pressure (${press.toFixed(1)} kPa) exceeded PRV setpoint (${P_set} kPa). PRV popped!`)
  }

  return {
    ok: true,
    stream,
    warnings,
    results: [
      { label: 'Set Pressure', val: P_set, unit: 'kPa' },
      { label: 'Valve State', val: state, unit: '' },
      { label: 'Orifice Area', val: area, unit: 'mm²' },
      { label: 'Relief Capacity', val: reliefFlow.toFixed(3), unit: 'kg/s', raw: reliefFlow },
      { label: 'Back Pressure', val: Pb, unit: 'kPa' },
      { label: 'Relief Stream Temp', val: temp, unit: '°C' }
    ]
  }
}


// ─────────────────────────────────────────────────────────────────────
//  COMPRESSOR  (Isentropic compression with efficiency correction)
// ─────────────────────────────────────────────────────────────────────
export function solveCompressor(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const ratio = parseFloat(p.compressionRatio)
  const eta_is = Math.min(0.99, Math.max(0.1, parseFloat(p.efficiency) / 100 || 0.75))
  if (isNaN(ratio) || ratio <= 1) return { ok: false, reason: 'Compression ratio must be > 1' }

  // Compressor requires predominantly vapor phase
  if (inlet.psi < 0.9) return { ok: false, reason: `Compressor requires vapor feed (current ψ=${(inlet.psi * 100).toFixed(1)}%). Use pump for liquids.` }

  const { flow, temp, press, zA, zB } = inlet
  const T1_K = temp + 273.15
  const outP = press * ratio

  // Gas-specific gamma from mixture Cp
  const gamma = gammaGas(zA, zB, compA, compB)

  // Isentropic outlet temperature
  const T2_is_K = isentropicTout(T1_K, press, outP, gamma)
  const T2_is = T2_is_K - 273.15

  // Actual outlet temperature (accounting for isentropic efficiency)
  // T_act - T_in = (T_is - T_in) / eta_is
  const dT_is = T2_is - temp
  const dT_act = dT_is / eta_is
  const T_out = temp + dT_act

  // Shaft power = m * Cp_V * dT_act
  const cpV = cpVapMix(zA, zB, compA, compB)  // kJ/(kg·K)
  const power = flow * cpV * dT_act            // kW

  const flash_out = vleFlash(T_out, outP, zA, zB, compA, compB, modelType, presetKey)
  const stream = buildStream(T_out, outP, flow, zA, zB, compA, compB, flash_out)

  const warnings = []
  if (T_out > 250) warnings.push(`High discharge temperature: ${T_out.toFixed(1)} °C. Consider intercooling.`)
  if (ratio > 10) warnings.push(`Very high compression ratio (${ratio}). Multi-stage compression recommended.`)

  return {
    ok: true,
    stream,
    warnings,
    results: [
      { label: 'Compression Ratio', val: ratio, unit: '' },
      { label: 'Isentropic Efficiency η', val: eta_is * 100, unit: '%' },
      { label: 'Gamma (Cp/Cv)', val: gamma, unit: '' },
      { label: 'Isentropic Outlet T', val: T2_is, unit: '°C' },
      { label: 'Actual Outlet T', val: T_out, unit: '°C' },
      { label: 'Shaft Power', val: power, unit: 'kW' },
      { label: 'Outlet Pressure', val: outP, unit: 'kPa' },
      { label: 'Outlet Density', val: stream.density, unit: 'kg/m³' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  STORAGE TANK  (Boundary sink / accumulator)
// ─────────────────────────────────────────────────────────────────────
export function solveStorageTank(p, inlet) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const vol = parseFloat(p.volume) || 100  // m³
  const fillRate = inlet.flow / (inlet.density || 900)  // m³/s
  const fillTime = vol / fillRate / 3600   // hours to fill

  return {
    ok: true,
    stream: { ...inlet },  // storage tank passes stream through unchanged
    results: [
      { label: 'Incoming Flow', val: inlet.flow, unit: 'kg/s' },
      { label: 'Tank Volume', val: vol, unit: 'm³' },
      { label: 'Fill Rate', val: fillRate * 3600, unit: 'm³/h' },
      { label: 'Fill Time', val: fillTime, unit: 'h' },
      { label: 'Product Temperature', val: inlet.temp, unit: '°C' },
      { label: 'Product Phase', val: inlet.phase, unit: '' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  PEM ELECTROLYZER (Green Hydrogen generator)
// ─────────────────────────────────────────────────────────────────────
export function solveElectrolyzer(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const power = parseFloat(p.powerInput) || 2000 // kW
  const efficiency = parseFloat(p.stackEfficiency) / 100 || 0.75
  const T = parseFloat(p.temp) || 80 // °C
  const P = parseFloat(p.press) || 3000 // kPa

  if (isNaN(power) || isNaN(efficiency) || isNaN(T) || isNaN(P)) {
    return { ok: false, reason: 'Power, efficiency, temperature, and pressure are required' }
  }

  const usefulPower = power * efficiency
  const dH_split = 285.8 // kJ/mol H2O
  const maxMolSplit = usefulPower / dH_split

  const { flow, zA, zB } = inlet
  const MW = mwMix(zA, zB, compA, compB)
  const totalMolFlow = (flow * 1000) / MW
  const molA_in = totalMolFlow * zA

  const molSplit = Math.min(maxMolSplit, molA_in)
  const massSplit = (molSplit * CHEMICALS[compA].mw) / 1000

  const vaporFlow = (molSplit * CHEMICALS[compB].mw) / 1000
  const liquidFlow = Math.max(0.001, flow - vaporFlow)

  const MW_V = CHEMICALS[compB].mw
  const MW_L = CHEMICALS[compA].mw

  const vaporStream = {
    flow: vaporFlow,
    molFlow: molSplit,
    temp: T,
    press: P,
    phase: 'Vapor',
    psi: 1,
    zA: 0.05, zB: 0.95,
    xA: 0.05, xB: 0.95,
    yA: 0.05, yB: 0.95,
    enthalpy: specificEnthalpy(T, 1, 0.05, 0.95, 0.05, 0.95, compA, compB),
    density: vaporDensity(P, T, 0.05, 0.95, compA, compB),
    viscosity: vaporViscosity(0.05, 0.95, compA, compB),
    MW: MW_V
  }

  const liquidStream = {
    flow: liquidFlow,
    molFlow: (liquidFlow * 1000) / MW_L,
    temp: T,
    press: P,
    phase: 'Liquid',
    psi: 0,
    zA: 0.99, zB: 0.01,
    xA: 0.99, xB: 0.01,
    yA: 0.99, yB: 0.01,
    enthalpy: specificEnthalpy(T, 0, 0.99, 0.01, 0.99, 0.01, compA, compB),
    density: liquidDensity(0.99, 0.01, compA, compB),
    viscosity: liquidViscosity(0.99, 0.01, compA, compB),
    MW: MW_L
  }

  const warnings = []
  if (molSplit >= molA_in * 0.99) {
    warnings.push("Feed water starvation! The electrolyzer has split almost 100% of feed water.")
  }

  return {
    ok: true,
    vapor: vaporStream,
    liquid: liquidStream,
    warnings,
    results: [
      { label: 'Useful Power', val: usefulPower, unit: 'kW' },
      { label: 'Electrolysis Rate', val: molSplit, unit: 'mol/s' },
      { label: 'H2 Produced', val: vaporFlow, unit: 'kg/s' },
      { label: 'Water Consumed', val: massSplit, unit: 'kg/s' },
      { label: 'Faraday Stack Efficiency', val: efficiency * 100, unit: '%' }
    ]
  }
}

// ─────────────────────────────────────────────────────────────────────
//  MEMBRANE SEPARATOR (Gas Permeation)
// ─────────────────────────────────────────────────────────────────────
export function solveMembraneSeparator(p, inlet, compA, compB, modelType, presetKey) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const area = parseFloat(p.area) || 50
  const permA = parseFloat(p.permeabilityA) || 200
  const permB = parseFloat(p.permeabilityB) || 20
  const P_permeate = parseFloat(p.permeatePressure) || 100

  if (isNaN(area) || isNaN(permA) || isNaN(permB) || isNaN(P_permeate)) {
    return { ok: false, reason: 'Area, permeabilities, and permeate pressure are required' }
  }

  const { flow, temp, press, zA, zB } = inlet

  const pA_feed = press * zA
  const pB_feed = press * zB

  const dpA = Math.max(1, pA_feed - P_permeate * zA)
  const dpB = Math.max(1, pB_feed - P_permeate * zB)

  const gpuToMol = 3.35e-7

  let molFlowA_perm = permA * area * dpA * gpuToMol
  let molFlowB_perm = permB * area * dpB * gpuToMol

  const MW = mwMix(zA, zB, compA, compB)
  const totalMolIn = (flow * 1000) / MW
  const molInA = totalMolIn * zA
  const molInB = totalMolIn * zB

  molFlowA_perm = Math.min(molFlowA_perm, molInA * 0.9)
  molFlowB_perm = Math.min(molFlowB_perm, molInB * 0.9)

  const totalMolPerm = molFlowA_perm + molFlowB_perm
  const yA_perm = totalMolPerm > 0 ? molFlowA_perm / totalMolPerm : 1.0
  const yB_perm = 1.0 - yA_perm

  const MW_perm = mwMix(yA_perm, yB_perm, compA, compB)
  const permMassFlow = (totalMolPerm * MW_perm) / 1000

  const retentateMassFlow = Math.max(0.001, flow - permMassFlow)
  const molInA_ret = Math.max(0.0001, molInA - molFlowA_perm)
  const molInB_ret = Math.max(0.0001, molInB - molFlowB_perm)
  const totalMolRet = molInA_ret + molInB_ret
  const xA_ret = molInA_ret / totalMolRet
  const xB_ret = 1.0 - xA_ret

  const MW_ret = mwMix(xA_ret, xB_ret, compA, compB)

  const permeateStream = {
    flow: permMassFlow,
    molFlow: totalMolPerm,
    temp: temp,
    press: P_permeate,
    phase: inlet.phase,
    psi: inlet.psi,
    zA: yA_perm, zB: yB_perm,
    xA: yA_perm, xB: yB_perm,
    yA: yA_perm, yB: yB_perm,
    enthalpy: specificEnthalpy(temp, inlet.psi, yA_perm, yB_perm, yA_perm, yB_perm, compA, compB),
    density: mixtureDensity(inlet.psi, P_permeate, temp, yA_perm, yB_perm, yA_perm, yB_perm, compA, compB),
    viscosity: inlet.psi >= 1 ? vaporViscosity(yA_perm, yB_perm, compA, compB) : liquidViscosity(yA_perm, yB_perm, compA, compB),
    MW: MW_perm
  }

  const retentateStream = {
    flow: retentateMassFlow,
    molFlow: totalMolRet,
    temp: temp,
    press: press,
    phase: inlet.phase,
    psi: inlet.psi,
    zA: xA_ret, zB: xB_ret,
    xA: xA_ret, xB: xB_ret,
    yA: xA_ret, yB: xB_ret,
    enthalpy: specificEnthalpy(temp, inlet.psi, xA_ret, xB_ret, xA_ret, xB_ret, compA, compB),
    density: mixtureDensity(inlet.psi, press, temp, xA_ret, xB_ret, xA_ret, xB_ret, compA, compB),
    viscosity: inlet.psi >= 1 ? vaporViscosity(xA_ret, xB_ret, compA, compB) : liquidViscosity(xA_ret, xB_ret, compA, compB),
    MW: MW_ret
  }

  const selectA = permA / permB

  return {
    ok: true,
    vapor: permeateStream,
    liquid: retentateStream,
    results: [
      { label: 'Selectivity (A/B)', val: selectA, unit: '' },
      { label: 'Permeate Flow', val: permMassFlow, unit: 'kg/s' },
      { label: 'Retentate Flow', val: retentateMassFlow, unit: 'kg/s' },
      { label: 'Permeate Purity (A)', val: yA_perm * 100, unit: '%' },
      { label: 'Stage Cut', val: (permMassFlow / flow) * 100, unit: '%' }
    ]
  }
}

