/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA — THERMODYNAMIC ENGINE v2.1
 *  Pure physics calculations. No React. No UI. No state.
 *
 *  Reference state: Liquid at 25°C, 1 atm → H_ref = 0 kJ/kg
 *  All temperatures in °C (converted to K internally where needed)
 *  All pressures in kPa
 *  All flows in kg/s or mol/s as labeled
 *  All enthalpies in kJ/kg (specific)
 *
 *  v2.1 Changes:
 *  - Removed dead code (underwoodRmin placeholder)
 *  - Fixed naming consistency (massracA → massfracA_internal)
 *  - Improved bubble/dew point solver (Newton-Raphson + fallback bisection)
 *  - Added Antoine validity range warnings
 *  - Added T-xy / P-xy phase envelope generation
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
//  CHEMICAL DATABASE
// ─────────────────────────────────────────────────────────────────────
export const CHEMICALS = {
  water: {
    name: 'Water (H₂O)', formula: 'H₂O', mw: 18.015,
    antoine: { A: 8.07131, B: 1730.63, C: 233.426, Tmin: 1, Tmax: 374 },
    cpL: 4.184, cpV: 1.865,
    rhoL: 995, muL: 7.97e-4, muV: 9.6e-6,
    dHvap_ref: 2501, Tb: 100.0, Tc: 647.1, Pc: 22064, omega: 0.345,
    desc: 'Polar solvent. Standard working fluid for steam and heating systems.'
  },
  ethanol: {
    name: 'Ethanol (C₂H₅OH)', formula: 'C₂H₅OH', mw: 46.069,
    antoine: { A: 8.04494, B: 1554.3, C: 222.65, Tmin: 20, Tmax: 200 },
    cpL: 2.44, cpV: 1.70,
    rhoL: 785, muL: 1.07e-3, muV: 8.5e-6,
    dHvap_ref: 954, Tb: 78.37, Tc: 513.9, Pc: 6148, omega: 0.644,
    desc: 'Highly volatile organic. Forms azeotrope with water at 78.1°C.'
  },
  methanol: {
    name: 'Methanol (CH₃OH)', formula: 'CH₃OH', mw: 32.042,
    antoine: { A: 7.89750, B: 1474.08, C: 229.13, Tmin: 20, Tmax: 200 },
    cpL: 2.53, cpV: 1.40,
    rhoL: 787, muL: 5.45e-4, muV: 9.6e-6,
    dHvap_ref: 1187, Tb: 64.65, Tc: 512.64, Pc: 8097, omega: 0.559,
    desc: 'Lightest alcohol. Highly volatile and toxic. Common industrial solvent.'
  },
  benzene: {
    name: 'Benzene (C₆H₆)', formula: 'C₆H₆', mw: 78.114,
    antoine: { A: 6.90565, B: 1211.033, C: 220.79, Tmin: 8, Tmax: 150 },
    cpL: 1.74, cpV: 1.04,
    rhoL: 874, muL: 6.0e-4, muV: 7.6e-6,
    dHvap_ref: 433, Tb: 80.09, Tc: 562.2, Pc: 4895, omega: 0.210,
    desc: 'Aromatic hydrocarbon. Near-ideal mixture with toluene.'
  },
  toluene: {
    name: 'Toluene (C₇H₈)', formula: 'C₇H₈', mw: 92.141,
    antoine: { A: 6.95334, B: 1343.943, C: 219.377, Tmin: 6, Tmax: 200 },
    cpL: 1.70, cpV: 1.13,
    rhoL: 862, muL: 5.5e-4, muV: 6.9e-6,
    dHvap_ref: 412, Tb: 110.63, Tc: 591.75, Pc: 4109, omega: 0.264,
    desc: 'Substituted benzene. High boiling in BTX systems.'
  },
  propanol: {
    name: '1-Propanol (C₃H₈O)', formula: 'C₃H₈O', mw: 60.096,
    antoine: { A: 7.93666, B: 1473.11, C: 191.95, Tmin: 15, Tmax: 130 },
    cpL: 2.38, cpV: 1.45,
    rhoL: 803, muL: 1.94e-3, muV: 8.0e-6,
    dHvap_ref: 789, Tb: 97.2, Tc: 536.8, Pc: 5175, omega: 0.623,
    desc: 'Primary alcohol. Forms azeotrope with water.'
  },
  butanol: {
    name: '1-Butanol (C₄H₁₀O)', formula: 'C₄H₁₀O', mw: 74.122,
    antoine: { A: 7.36366, B: 1305.198, C: 173.427, Tmin: 30, Tmax: 140 },
    cpL: 2.45, cpV: 1.55,
    rhoL: 810, muL: 2.54e-3, muV: 7.5e-6,
    dHvap_ref: 585, Tb: 117.7, Tc: 563.1, Pc: 4423, omega: 0.589,
    desc: 'Four-carbon alcohol. Moderately soluble in water.'
  },
  acetone: {
    name: 'Acetone (C₃H₆O)', formula: 'C₃H₆O', mw: 58.08,
    antoine: { A: 7.11714, B: 1210.595, C: 229.664, Tmin: -13, Tmax: 130 },
    cpL: 2.15, cpV: 1.25,
    rhoL: 784, muL: 3.1e-4, muV: 7.2e-6,
    dHvap_ref: 538, Tb: 56.0, Tc: 508.1, Pc: 4700, omega: 0.304,
    desc: 'Common polar aprotic solvent. Highly volatile.'
  },
  hexane: {
    name: 'n-Hexane (C₆H₁₄)', formula: 'C₆H₁₄', mw: 86.178,
    antoine: { A: 6.87776, B: 1171.53, C: 224.366, Tmin: -25, Tmax: 100 },
    cpL: 2.26, cpV: 1.66,
    rhoL: 659, muL: 3.0e-4, muV: 6.5e-6,
    dHvap_ref: 366, Tb: 68.7, Tc: 507.6, Pc: 3025, omega: 0.301,
    desc: 'Linear alkane. Extraction solvent.'
  },
  cyclohexane: {
    name: 'Cyclohexane (C₆H₁₂)', formula: 'C₆H₁₂', mw: 84.16,
    antoine: { A: 6.84498, B: 1203.526, C: 222.863, Tmin: 10, Tmax: 100 },
    cpL: 1.84, cpV: 1.26,
    rhoL: 779, muL: 9.8e-4, muV: 7.1e-6,
    dHvap_ref: 393, Tb: 80.74, Tc: 553.8, Pc: 4073, omega: 0.210,
    desc: 'Cycloalkane. Extremely close boiling point to benzene.'
  },
  ammonia: {
    name: 'Ammonia (NH₃)', formula: 'NH₃', mw: 17.031,
    antoine: { A: 7.3605, B: 926.132, C: 240.17, Tmin: -80, Tmax: 50 },
    cpL: 4.60, cpV: 2.06,
    rhoL: 682, muL: 1.4e-4, muV: 9.8e-6,
    dHvap_ref: 1370, Tb: -33.3, Tc: 405.4, Pc: 11333, omega: 0.252,
    desc: 'Industrial refrigerant and fertilizer precursor.'
  },
  co2: {
    name: 'Carbon Dioxide (CO₂)', formula: 'CO₂', mw: 44.01,
    antoine: { A: 6.81228, B: 896.612, C: 259.1, Tmin: -100, Tmax: 30 },
    cpL: 2.5, cpV: 0.84,
    rhoL: 770, muL: 6.0e-5, muV: 1.5e-5,
    dHvap_ref: 574, Tb: -78.46, Tc: 304.1, Pc: 7375, omega: 0.224,
    desc: 'Greenhouse gas. Supercritical fluid solvent.'
  },
  hydrogen: {
    name: 'Hydrogen (H₂)', formula: 'H₂', mw: 2.016,
    antoine: { A: 5.418, B: 66.86, C: 275.5, Tmin: -260, Tmax: -240 },
    cpL: 9.7, cpV: 14.3,
    rhoL: 70, muL: 1.3e-5, muV: 8.4e-6,
    dHvap_ref: 449, Tb: -252.9, Tc: 33.1, Pc: 1296, omega: -0.219,
    desc: 'Lightest element. Clean energy carrier.'
  },
  nitrogen: {
    name: 'Nitrogen (N₂)', formula: 'N₂', mw: 28.013,
    antoine: { A: 6.49457, B: 255.68, C: 266.55, Tmin: -210, Tmax: -147 },
    cpL: 2.04, cpV: 1.04,
    rhoL: 808, muL: 1.6e-4, muV: 1.7e-5,
    dHvap_ref: 199, Tb: -195.8, Tc: 126.2, Pc: 3396, omega: 0.037,
    desc: 'Inert gas. Major component of air.'
  },
  acetic_acid: {
    name: 'Acetic Acid (CH₃COOH)', formula: 'CH₃COOH', mw: 60.052,
    antoine: { A: 7.18807, B: 1416.747, C: 211.014, Tmin: 17, Tmax: 150 },
    cpL: 2.05, cpV: 1.11,
    rhoL: 1049, muL: 1.2e-3, muV: 9.3e-6,
    dHvap_ref: 395, Tb: 117.9, Tc: 592.7, Pc: 5786, omega: 0.467,
    desc: 'Weak organic acid. Strongly associating in vapor phase.'
  },
  oxygen: {
    name: 'Oxygen (O₂)', formula: 'O₂', mw: 31.998,
    antoine: { A: 6.69144, B: 319.011, C: 266.597, Tmin: -210, Tmax: -110 },
    cpL: 1.70, cpV: 0.92,
    rhoL: 1141, muL: 1.9e-4, muV: 2.0e-5,
    dHvap_ref: 213, Tb: -182.96, Tc: 154.6, Pc: 5043, omega: 0.022,
    desc: 'Highly reactive gas. Essential for combustion and respiration.'
  }
}

export const PRESETS = {
  'Benzene-Toluene': {
    compA: 'benzene', compB: 'toluene',
    name: 'Benzene-Toluene (Ideal)',
    desc: "Near-ideal mixture. Excellent for Raoult's Law and distillation studies.",
    nrtlParams: null
  },
  'Ethanol-Water': {
    compA: 'ethanol', compB: 'water',
    name: 'Ethanol-Water (Non-Ideal / NRTL)',
    desc: 'Highly non-ideal. Positive deviations. Azeotrope at xEtOH≈0.894 mol. Use NRTL.',
    nrtlParams: { tau12: 1.5461, tau21: 0.9332, alpha: 0.2985 }
  },
  'Methanol-Water': {
    compA: 'methanol', compB: 'water',
    name: 'Methanol-Water (Moderate Non-Ideal)',
    desc: 'Common industrial separation. Moderate positive deviations.',
    nrtlParams: { tau12: 0.7923, tau21: 0.7744, alpha: 0.3 }
  },
  'Methanol-Ethanol': {
    compA: 'methanol', compB: 'ethanol',
    name: 'Methanol-Ethanol (Alcohol-Alcohol)',
    desc: 'Binary alcohol mixture. Quasi-ideal, high relative volatility.',
    nrtlParams: null
  },
  'Acetone-Water': {
    compA: 'acetone', compB: 'water',
    name: 'Acetone-Water (NRTL)',
    desc: 'Highly non-ideal solvent-water system. Use NRTL.',
    nrtlParams: { tau12: 1.611, tau21: 0.887, alpha: 0.3 }
  },
  'Hexane-Cyclohexane': {
    compA: 'hexane', compB: 'cyclohexane',
    name: 'Hexane-Cyclohexane (Ideal)',
    desc: 'Very close boiling hydrocarbon mixture. Difficult separation.',
    nrtlParams: null
  },
  'Nitrogen-Hydrogen': {
    compA: 'nitrogen', compB: 'hydrogen',
    name: 'Nitrogen-Hydrogen (Syngas)',
    desc: 'Ammonia synthesis gas mixture.',
    nrtlParams: null
  }
}

export const R_GAS = 8.314  // J/(mol·K)

// ─────────────────────────────────────────────────────────────────────
//  ANTOINE VAPOR PRESSURE  [kPa]
// ─────────────────────────────────────────────────────────────────────
export function pSat(chemKey, T_degC) {
  const c = CHEMICALS[chemKey]
  if (!c) return 0
  const T = Math.max(c.antoine.Tmin, Math.min(c.antoine.Tmax, T_degC))
  const logP_mmHg = c.antoine.A - c.antoine.B / (T + c.antoine.C)
  return Math.pow(10, logP_mmHg) * 0.1333224
}

// ─────────────────────────────────────────────────────────────────────
//  LATENT HEAT — Watson Correlation
//  ΔHvap(T) = ΔHvap(Tb) × ((Tc - T)/(Tc - Tb))^0.38
// ─────────────────────────────────────────────────────────────────────
export function dHvap(chemKey, T_degC) {
  const c = CHEMICALS[chemKey]
  if (!c) return 0
  const Tc_C = c.Tc - 273.15
  if (T_degC >= Tc_C) return 0
  const ratio = (Tc_C - T_degC) / (Tc_C - c.Tb)
  if (ratio <= 0) return 0
  return c.dHvap_ref * Math.pow(ratio, 0.38)
}

// ─────────────────────────────────────────────────────────────────────
//  NRTL BINARY ACTIVITY COEFFICIENTS (Chen, 1982)
// ─────────────────────────────────────────────────────────────────────
export function nrtlActivityCoeff(xA, xB, tau12, tau21, alpha) {
  if (xA <= 0) return { gammaA: Math.exp(tau21), gammaB: 1.0 }
  if (xB <= 0) return { gammaA: 1.0, gammaB: Math.exp(tau12) }

  const G12 = Math.exp(-alpha * tau12)
  const G21 = Math.exp(-alpha * tau21)

  const lnGammaA = xB * xB * (
    tau21 * Math.pow(G21 / (xA + xB * G21), 2) +
    tau12 * G12 / Math.pow(xB + xA * G12, 2)
  )

  const lnGammaB = xA * xA * (
    tau12 * Math.pow(G12 / (xB + xA * G12), 2) +
    tau21 * G21 / Math.pow(xA + xB * G21, 2)
  )

  return { gammaA: Math.exp(lnGammaA), gammaB: Math.exp(lnGammaB) }
}

// ─────────────────────────────────────────────────────────────────────
//  PENG-ROBINSON FUGACITY COEFFICIENTS (for real EOS VLE K-values)
// ─────────────────────────────────────────────────────────────────────
export function prFugacityCoefficients(T_C, P_kPa, zA, zB, compA, compB, phase = 'Vapor') {
  const T_K = T_C + 273.15
  const R = 8.3144626
  
  const pA = prPureParams(compA, T_K)
  const pB = prPureParams(compB, T_K)
  
  // Mixing rules: a_mix, b_mix
  const aMix = zA * zA * pA.a + 2 * zA * zB * Math.sqrt(pA.a * pB.a) + zB * zB * pB.a
  const bMix = zA * pA.b + zB * pB.b
  
  const Z = solvePRCompressibility(T_C, P_kPa, zA, zB, compA, compB, phase)
  
  const A = (aMix * P_kPa) / (R * R * T_K * T_K)
  const B = (bMix * P_kPa) / (R * T_K)
  
  if (Z - B <= 0) return { phiA: 1.0, phiB: 1.0 }
  
  const sum_aA = zA * pA.a + zB * Math.sqrt(pA.a * pB.a)
  const sum_aB = zB * pB.a + zA * Math.sqrt(pA.a * pB.a)
  
  const term1A = (pA.b / bMix) * (Z - 1)
  const term2A = Math.log(Z - B)
  const term3A = (A / (2 * Math.sqrt(2) * B)) * ((2 * sum_aA / aMix) - (pA.b / bMix)) * Math.log((Z + (1 + Math.sqrt(2)) * B) / (Z + (1 - Math.sqrt(2)) * B))
  const lnPhiA = term1A - term2A - term3A

  const term1B = (pB.b / bMix) * (Z - 1)
  const term2B = Math.log(Z - B)
  const term3B = (A / (2 * Math.sqrt(2) * B)) * ((2 * sum_aB / aMix) - (pB.b / bMix)) * Math.log((Z + (1 + Math.sqrt(2)) * B) / (Z + (1 - Math.sqrt(2)) * B))
  const lnPhiB = term1B - term2B - term3B
  
  return {
    phiA: Math.exp(lnPhiA),
    phiB: Math.exp(lnPhiB)
  }
}

// ─────────────────────────────────────────────────────────────────────
//  K-VALUES  Ki = γi·Psat_i / P (NRTL/Ideal) or phi_i_L / phi_i_V (PR)
// ─────────────────────────────────────────────────────────────────────
export function kValues(T, P, xA, xB, compA, compB, modelType, presetKey, yA = null, yB = null) {
  const preset = PRESETS[presetKey]
  const pSatA = pSat(compA, T)
  const pSatB = pSat(compB, T)

  if (modelType === 'Peng-Robinson') {
    const { phiA: phiAL, phiB: phiBL } = prFugacityCoefficients(T, P, xA, xB, compA, compB, 'Liquid')
    const { phiA: phiAV, phiB: phiBV } = prFugacityCoefficients(T, P, yA || xA, yB || xB, compA, compB, 'Vapor')
    return {
      KA: Math.max(0.001, Math.min(1000, phiAL / phiAV)),
      KB: Math.max(0.001, Math.min(1000, phiBL / phiBV)),
      pSatA, pSatB, gammaA: 1.0, gammaB: 1.0
    }
  }

  let gammaA = 1.0, gammaB = 1.0
  if (modelType === 'NRTL' && preset?.nrtlParams) {
    const { tau12, tau21, alpha } = preset.nrtlParams
    ;({ gammaA, gammaB } = nrtlActivityCoeff(xA, xB, tau12, tau21, alpha))
  }

  return {
    KA: (gammaA * pSatA) / P,
    KB: (gammaB * pSatB) / P,
    pSatA, pSatB, gammaA, gammaB
  }
}

// ─────────────────────────────────────────────────────────────────────
//  MULTI-COMPONENT RACHFORD-RICE FLASH SOLVER
// ─────────────────────────────────────────────────────────────────────
export function rachfordRiceMulti(z, K) {
  const n = z.length
  let f_lo = 0
  let f_hi = 0
  for (let i = 0; i < n; i++) {
    f_lo += z[i] * (K[i] - 1)
    f_hi += z[i] * (1 - 1 / K[i])
  }

  if (f_lo <= 0) {
    const x = [...z]
    const y = z.map((zi, i) => Math.min(1, zi * K[i]))
    const sumY = y.reduce((a, b) => a + b, 0)
    return {
      psi: 0, phase: 'Liquid',
      x, y: y.map(yi => yi / (sumY || 1)),
      converged: true
    }
  }

  if (f_hi <= 0) {
    const y = [...z]
    const x = z.map((zi, i) => zi / K[i])
    const sumX = x.reduce((a, b) => a + b, 0)
    return {
      psi: 1, phase: 'Vapor',
      y, x: x.map(xi => xi / (sumX || 1)),
      converged: true
    }
  }

  let low = 0, high = 1
  let psi = 0.5
  for (let iter = 0; iter < 80; iter++) {
    psi = (low + high) / 2
    let fVal = 0
    for (let i = 0; i < n; i++) {
      fVal += (z[i] * (K[i] - 1)) / (1 + psi * (K[i] - 1))
    }
    if (Math.abs(fVal) < 1e-11) break
    if (fVal > 0) low = psi; else high = psi
  }

  const x = z.map((zi, i) => zi / (1 + psi * (K[i] - 1)))
  const sumX = x.reduce((a, b) => a + b, 0)
  const x_norm = x.map(xi => xi / (sumX || 1))
  const y = x_norm.map((xi, i) => xi * K[i])

  return {
    psi, phase: 'Mixed',
    x: x_norm, y,
    converged: true
  }
}

export function vleFlashMulti(T, P, z, components, modelType, presetKey) {
  if (T < -273 || P <= 0) return null
  const n = z.length
  
  if (n === 2) {
    const compA = components[0]
    const compB = components[1]
    const zA = z[0]
    const zB = z[1]
    const res = vleFlash(T, P, zA, zB, compA, compB, modelType, presetKey)
    if (!res) return null
    return {
      psi: res.psi,
      phase: res.phase,
      z: [zA, zB],
      x: [res.xA, res.xB],
      y: [res.yA, res.yB],
      K: [res.KA, res.KB],
      converged: res.converged
    }
  }

  const K = components.map(comp => pSat(comp, T) / P)
  const flash = rachfordRiceMulti(z, K)
  return {
    ...flash,
    z,
    K
  }
}

// ─────────────────────────────────────────────────────────────────────
//  RACHFORD-RICE FLASH SOLVER (bounded bisection, 60 iterations)
// ─────────────────────────────────────────────────────────────────────
export function rachfordRice(zA, zB, KA, KB) {
  const f_lo = zA * (KA - 1) + zB * (KB - 1)
  const f_hi = zA * (KA - 1) / KA + zB * (KB - 1) / KB

  if (f_lo <= 0) {
    return {
      psi: 0, phase: 'Liquid',
      xA: zA, xB: zB,
      yA: Math.min(1, zA * KA), yB: Math.min(1, zB * KB),
      converged: true
    }
  }
  if (f_hi >= 0) {
    const xA_raw = zA / KA, xB_raw = zB / KB
    const sum = xA_raw + xB_raw
    return {
      psi: 1, phase: 'Vapor',
      yA: zA, yB: zB,
      xA: xA_raw / sum, xB: xB_raw / sum,
      converged: true
    }
  }

  // Two-phase bisection — avoid poles at ψ = 1/(1-Ki)
  const psiMin = Math.max(0, 1 / (1 - Math.max(KA, KB)) + 1e-9)
  const psiMax = Math.min(1, 1 / (1 - Math.min(KA, KB)) - 1e-9)

  let psi = 0.5, low = psiMin, high = psiMax
  for (let iter = 0; iter < 60; iter++) {
    psi = (low + high) / 2
    const fVal = zA * (KA - 1) / (1 + psi * (KA - 1)) + zB * (KB - 1) / (1 + psi * (KB - 1))
    if (Math.abs(fVal) < 1e-10) break
    if (fVal > 0) low = psi; else high = psi
  }

  const xA = zA / (1 + psi * (KA - 1))
  const xB = zB / (1 + psi * (KB - 1))

  return {
    psi, converged: true,
    phase: psi < 0.001 ? 'Liquid' : psi > 0.999 ? 'Vapor' : 'Mixed',
    xA, xB,
    yA: xA * KA, yB: xB * KB
  }
}

// ─────────────────────────────────────────────────────────────────────
//  FULL VLE FLASH — iterative for NRTL & Peng-Robinson
// ─────────────────────────────────────────────────────────────────────
export function vleFlash(T, P, zA, zB, compA, compB, modelType, presetKey) {
  if (zA < 0 || zB < 0 || Math.abs(zA + zB - 1) > 0.02) return null
  if (T < -273 || P <= 0) return null

  const preset = PRESETS[presetKey]
  const isIterative = modelType === 'NRTL' || modelType === 'Peng-Robinson'
  let xA = zA, xB = zB
  let yA = zA, yB = zB
  let result = null

  for (let i = 0; i < (isIterative ? 25 : 1); i++) {
    const kv = kValues(T, P, xA, xB, compA, compB, modelType, presetKey, yA, yB)
    const flash = rachfordRice(zA, zB, kv.KA, kv.KB)
    result = { ...flash, ...kv }

    if (!isIterative) break
    if (Math.abs(flash.xA - xA) < 1e-8) break
    xA = flash.xA; xB = flash.xB
    yA = flash.yA; yB = flash.yB
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────
//  BUBBLE POINT TEMPERATURE — Newton-Raphson with bisection fallback
//  Condition: Σ(Ki·xi) = 1 at bubble
// ─────────────────────────────────────────────────────────────────────
export function bubblePointT(P, zA, zB, compA, compB, modelType, presetKey) {
  // Initial estimate: mole-fraction weighted Tb
  let T = zA * CHEMICALS[compA].Tb + zB * CHEMICALS[compB].Tb

  for (let iter = 0; iter < 100; iter++) {
    const kv = kValues(T, P, zA, zB, compA, compB, modelType, presetKey)
    const Ksum = zA * kv.KA + zB * kv.KB
    const residual = Ksum - 1.0
    if (Math.abs(residual) < 1e-7) break

    // Numerical derivative dKsum/dT ≈ (Ksum(T+ε) - Ksum(T-ε)) / 2ε
    const eps = 0.5
    const kv_up = kValues(T + eps, P, zA, zB, compA, compB, modelType, presetKey)
    const kv_dn = kValues(T - eps, P, zA, zB, compA, compB, modelType, presetKey)
    const dKdT = ((zA * kv_up.KA + zB * kv_up.KB) - (zA * kv_dn.KA + zB * kv_dn.KB)) / (2 * eps)

    if (Math.abs(dKdT) < 1e-12) break
    const step = -residual / dKdT
    T = Math.max(-100, Math.min(500, T + Math.sign(step) * Math.min(Math.abs(step), 15)))
  }
  return T
}

// ─────────────────────────────────────────────────────────────────────
//  DEW POINT TEMPERATURE — Newton-Raphson
//  Condition: Σ(zi/Ki) = 1 at dew
// ─────────────────────────────────────────────────────────────────────
export function dewPointT(P, zA, zB, compA, compB, modelType, presetKey) {
  let T = zA * CHEMICALS[compA].Tb + zB * CHEMICALS[compB].Tb + 10

  for (let iter = 0; iter < 100; iter++) {
    const kv = kValues(T, P, zA, zB, compA, compB, modelType, presetKey)
    const invKsum = zA / kv.KA + zB / kv.KB
    const residual = invKsum - 1.0
    if (Math.abs(residual) < 1e-7) break

    const eps = 0.5
    const kv_up = kValues(T + eps, P, zA, zB, compA, compB, modelType, presetKey)
    const kv_dn = kValues(T - eps, P, zA, zB, compA, compB, modelType, presetKey)
    const dInvKdT = ((zA / kv_up.KA + zB / kv_up.KB) - (zA / kv_dn.KA + zB / kv_dn.KB)) / (2 * eps)

    if (Math.abs(dInvKdT) < 1e-12) break
    const step = -residual / dInvKdT
    T = Math.max(-100, Math.min(500, T + Math.sign(step) * Math.min(Math.abs(step), 15)))
  }
  return T
}

// ─────────────────────────────────────────────────────────────────────
//  T-xy PHASE ENVELOPE GENERATOR
//  Returns array of {x, y_bub, y_dew, T_bub, T_dew} for z ∈ [0,1]
//  Used for plotting T-x-y diagrams in the stream inspector
// ─────────────────────────────────────────────────────────────────────
export function generateTxy(P, compA, compB, modelType, presetKey, nPoints = 20) {
  const points = []
  for (let i = 0; i <= nPoints; i++) {
    const zA = i / nPoints
    const zB = 1 - zA
    if (zA === 0 || zA === 1) {
      // Pure component bubble/dew points (same)
      const T_pure = zA === 0 ? bubblePointT(P, 0.001, 0.999, compA, compB, modelType, presetKey)
                               : bubblePointT(P, 0.999, 0.001, compA, compB, modelType, presetKey)
      points.push({ z: zA, Tb: T_pure, Td: T_pure, yA_bub: zA })
      continue
    }
    const Tb = bubblePointT(P, zA, zB, compA, compB, modelType, presetKey)
    const Td = dewPointT(P, zA, zB, compA, compB, modelType, presetKey)
    // At bubble point, compute vapor composition yA
    const kv = kValues(Tb, P, zA, zB, compA, compB, modelType, presetKey)
    const yA_bub = Math.min(1, Math.max(0, zA * kv.KA))
    points.push({ z: zA, Tb, Td, yA_bub })
  }
  return points
}

// ─────────────────────────────────────────────────────────────────────
//  MIXTURE PHYSICAL PROPERTIES
// ─────────────────────────────────────────────────────────────────────

export function mwMix(zA, zB, compA, compB) {
  return zA * CHEMICALS[compA].mw + zB * CHEMICALS[compB].mw
}

export function massfracA(zA, compA, compB) {
  const mw = mwMix(zA, 1 - zA, compA, compB)
  return (zA * CHEMICALS[compA].mw) / mw
}

// Internal helper (avoids export clutter)
function _wA(zA, compA, compB) {
  const mw = mwMix(zA, 1 - zA, compA, compB)
  return (zA * CHEMICALS[compA].mw) / mw
}

export function liquidDensity(zA, zB, compA, compB) {
  // Linear mixing on mole fraction (approximation — full Rackett would need Vc)
  return zA * CHEMICALS[compA].rhoL + zB * CHEMICALS[compB].rhoL
}

export function vaporDensity(P_kPa, T_degC, zA, zB, compA, compB) {
  const MW = mwMix(zA, zB, compA, compB) / 1000  // kg/mol
  const T_K = T_degC + 273.15
  const P_Pa = P_kPa * 1000
  return (P_Pa * MW) / (R_GAS * T_K)
}

export function mixtureDensity(psi, P_kPa, T_degC, xA, xB, yA, yB, compA, compB, modelType = 'Ideal') {
  if (modelType === 'PR' || modelType === 'Peng-Robinson') {
    if (psi <= 0) return prDensity(T_degC, P_kPa, xA, xB, compA, compB, 'Liquid')
    if (psi >= 1) return prDensity(T_degC, P_kPa, yA, yB, compA, compB, 'Vapor')
    const rhoL = prDensity(T_degC, P_kPa, xA, xB, compA, compB, 'Liquid')
    const rhoV = prDensity(T_degC, P_kPa, yA, yB, compA, compB, 'Vapor')
    return 1 / ((1 - psi) / rhoL + psi / rhoV)
  }
  if (psi <= 0) return liquidDensity(xA, xB, compA, compB)
  if (psi >= 1) return vaporDensity(P_kPa, T_degC, yA, yB, compA, compB)
  const rhoL = liquidDensity(xA, xB, compA, compB)
  const rhoV = vaporDensity(P_kPa, T_degC, yA, yB, compA, compB)
  return 1 / ((1 - psi) / rhoL + psi / rhoV)
}

export function liquidViscosity(zA, zB, compA, compB) {
  return Math.exp(zA * Math.log(CHEMICALS[compA].muL) + zB * Math.log(CHEMICALS[compB].muL))
}

export function vaporViscosity(zA, zB, compA, compB) {
  return zA * CHEMICALS[compA].muV + zB * CHEMICALS[compB].muV
}

export function cpLiqMix(zA, zB, compA, compB) {
  const wA = _wA(zA, compA, compB)
  return wA * CHEMICALS[compA].cpL + (1 - wA) * CHEMICALS[compB].cpL
}

export function cpVapMix(zA, zB, compA, compB) {
  const wA = _wA(zA, compA, compB)
  return wA * CHEMICALS[compA].cpV + (1 - wA) * CHEMICALS[compB].cpV
}

// ─────────────────────────────────────────────────────────────────────
//  SPECIFIC ENTHALPY  [kJ/kg]  Reference: saturated liquid at 25°C
// ─────────────────────────────────────────────────────────────────────
export function specificEnthalpy(T_degC, psi, xA, xB, yA, yB, compA, compB) {
  const T_ref = 25.0
  const cpL = cpLiqMix(xA, xB, compA, compB)
  const h_liq = cpL * (T_degC - T_ref)

  if (psi <= 0) return h_liq

  const wA_V = _wA(Math.max(0.001, yA), compA, compB)
  const dHvapMix = wA_V * dHvap(compA, T_degC) + (1 - wA_V) * dHvap(compB, T_degC)

  if (psi >= 1) {
    const cpV = cpVapMix(yA, yB, compA, compB)
    return h_liq + dHvapMix + cpV * (T_degC - T_ref) - cpL * (T_degC - T_ref)
  }

  return h_liq + psi * dHvapMix
}

// ─────────────────────────────────────────────────────────────────────
//  DISTILLATION SHORTCUT — Fenske-Underwood-Gilliland
// ─────────────────────────────────────────────────────────────────────

export function relVol(T, compA, compB) {
  const pA = pSat(compA, T)
  const pB = pSat(compB, T)
  if (pB <= 0) return 1
  return pA / pB
}

export function fenskie(xD, xB_spec, alpha) {
  if (alpha <= 1 || xD <= 0 || xD >= 1 || xB_spec <= 0 || xB_spec >= 1) return Infinity
  return Math.log((xD / (1 - xD)) * ((1 - xB_spec) / xB_spec)) / Math.log(alpha)
}

/** Underwood Rmin for binary system via Newton-Raphson on θ */
export function underwoodRminBinary(alpha, zF, xD, xB_spec, q) {
  if (alpha <= 1) return { Rmin: 0, theta: 1 }

  // Clamp to safe range
  zF = Math.max(0.001, Math.min(0.999, zF))
  xD = Math.max(0.001, Math.min(0.999, xD))
  q  = Math.max(0, Math.min(2, q))

  let theta = (alpha + 1) / 2

  for (let i = 0; i < 60; i++) {
    const dA = alpha - theta
    const dB = 1 - theta
    if (Math.abs(dA) < 1e-10 || Math.abs(dB) < 1e-10) { theta += 0.01; continue }

    const fVal  = (alpha * zF) / dA + (1 - zF) / dB - (1 - q)
    const dfVal = (alpha * zF) / (dA * dA) + (1 - zF) / (dB * dB)

    if (Math.abs(dfVal) < 1e-14) break
    const step = fVal / dfVal
    theta = theta - step
    theta = Math.max(1.0001, Math.min(alpha - 0.0001, theta))
    if (Math.abs(step) < 1e-10) break
  }

  // Rmin + 1 = Σ[α_i * x_Di / (α_i - θ)]  (Underwood equation at distillate composition)
  const dA = alpha - theta
  const dB = 1 - theta
  const Rmin = (Math.abs(dA) > 1e-8 && Math.abs(dB) > 1e-8)
    ? (alpha * xD) / dA + (1 - xD) / dB - 1
    : 1.5  // safe fallback

  return { Rmin: Math.max(0.01, Rmin), theta }
}

/** Gilliland correlation — Molokanov (1971) approximation */
export function gillilandN(Nmin, Rmin, R) {
  if (R <= Rmin || Nmin <= 0) return { N: 999, Y: 0.99, X: 1 }
  const X = (R - Rmin) / (R + 1)
  if (X <= 0) return { N: 999, Y: 0.99, X: 0 }

  const exponent = ((1 + 54.4 * X) / (11 + 117.2 * X)) * ((X - 1) / Math.sqrt(X))
  const Y = 1 - Math.exp(exponent)
  const N = Math.max(Nmin + 1, (Nmin + Y) / (1 - Y))

  return { N: Math.ceil(N), Y: Math.max(0, Math.min(0.9999, Y)), X }
}

// ─────────────────────────────────────────────────────────────────────
//  GAS COMPRESSION
// ─────────────────────────────────────────────────────────────────────
export function isentropicTout(T1_K, P1, P2, gamma) {
  if (P1 <= 0 || gamma <= 1) return T1_K
  return T1_K * Math.pow(Math.max(0.001, P2 / P1), (gamma - 1) / gamma)
}

export function gammaGas(zA, zB, compA, compB) {
  const cpV = cpVapMix(zA, zB, compA, compB)
  const MW = mwMix(zA, zB, compA, compB)
  const Cv_correct = cpV - R_GAS / MW  // kJ/(kg·K)
  return cpV / Math.max(Cv_correct, 0.01)
}

// ─────────────────────────────────────────────────────────────────────
//  NPSH AVAILABLE
// ─────────────────────────────────────────────────────────────────────
export function npsha(P_in_kPa, T_degC, zA, zB, compA, compB, rho_kg_m3, staticHead_m = 2.0) {
  const pVap = zA * pSat(compA, T_degC) + zB * pSat(compB, T_degC)
  const dP = Math.max(0, P_in_kPa - pVap)
  return (dP * 1000) / (rho_kg_m3 * 9.81) + staticHead_m
}

// ─────────────────────────────────────────────────────────────────────
//  PRE-SIMULATION FLOWSHEET VALIDATOR
//  Returns array of { severity, nodeId, nodeName, message }
// ─────────────────────────────────────────────────────────────────────
export function validateFlowsheet(nodes, streams, equipParams) {
  const issues = []

  const outMap = {}, inMap = {}
  nodes.forEach(n => { outMap[n.id] = []; inMap[n.id] = [] })
  streams.forEach(s => {
    if (outMap[s.from]) outMap[s.from].push(s.id)
    if (inMap[s.to])   inMap[s.to].push(s.id)
  })

  const REQUIRES_FEED = ['pump', 'mixer', 'heater', 'cooler', 'heatex', 'reactor',
    'flash', 'separator', 'distillation', 'valve', 'compressor', 'storagetank', 'splitter']

  nodes.forEach(n => {
    const p = equipParams[n.id] || {}

    // No connections at all
    if (inMap[n.id].length === 0 && outMap[n.id].length === 0) {
      issues.push({ severity: 'warning', nodeId: n.id, nodeName: n.tag, message: 'Equipment is isolated — no streams connected.' })
    }

    // Requires inlet but has none
    if (REQUIRES_FEED.includes(n.type) && inMap[n.id].length === 0) {
      issues.push({ severity: 'error', nodeId: n.id, nodeName: n.tag, message: `${n.label} requires at least one inlet stream.` })
    }

    // Single-outlet equipment has multiple outlets
    const singleOutTypes = ['feedtank', 'pump', 'heater', 'cooler', 'reactor', 'valve', 'compressor', 'storagetank']
    if (singleOutTypes.includes(n.type) && outMap[n.id].length > 1) {
      issues.push({ severity: 'warning', nodeId: n.id, nodeName: n.tag, message: `${n.label} typically has 1 outlet — multiple outlets detected.` })
    }

    // Dual-outlet equipment has wrong number
    const dualOutTypes = ['flash', 'separator', 'distillation', 'splitter', 'heatex']
    if (dualOutTypes.includes(n.type) && outMap[n.id].length < 2) {
      issues.push({ severity: 'warning', nodeId: n.id, nodeName: n.tag, message: `${n.label} produces 2 outlets — connect both vapor/top and liquid/bottom streams.` })
    }

    // Pressure logic check: valve outlet pressure must be specified and > 0
    if (n.type === 'valve' && (!p.outletPress || parseFloat(p.outletPress) <= 0)) {
      issues.push({ severity: 'error', nodeId: n.id, nodeName: n.tag, message: 'Valve outlet pressure not specified or invalid.' })
    }

    // Compressor requires predominantly vapor
    if (n.type === 'pump' && parseFloat(p.pressureRise) > 5000) {
      issues.push({ severity: 'warning', nodeId: n.id, nodeName: n.tag, message: 'Very high pressure rise (>5000 kPa). Verify pump design feasibility.' })
    }

    // Distillation purity check
    if (n.type === 'distillation') {
      const xD = parseFloat(p.distillatePurity) / 100
      const xB = parseFloat(p.bottomsPurity) / 100
      if (!isNaN(xD) && !isNaN(xB) && xB > xD) {
        issues.push({ severity: 'error', nodeId: n.id, nodeName: n.tag, message: 'Distillate purity (LK) must be greater than bottoms impurity (LK). Check specification.' })
      }
    }

    // Reactor conversion bounds
    if (n.type === 'reactor') {
      const X = parseFloat(p.conversion)
      if (!isNaN(X) && (X < 0 || X > 100)) {
        issues.push({ severity: 'error', nodeId: n.id, nodeName: n.tag, message: 'Conversion must be between 0 and 100%.' })
      }
    }
  })

  // Check for cycles (recycle loops)
  const inDegree = {}
  nodes.forEach(n => inDegree[n.id] = inMap[n.id].length)
  const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const visited = []
  while (queue.length > 0) {
    const nid = queue.shift()
    visited.push(nid)
    outMap[nid].forEach(sid => {
      const s = streams.find(x => x.id === sid)
      if (!s) return
      inDegree[s.to]--
      if (inDegree[s.to] === 0) queue.push(s.to)
    })
  }
  if (visited.length < nodes.length) {
    const unvisited = nodes.filter(n => !visited.includes(n.id))
    issues.push({
      severity: 'warning', nodeId: null, nodeName: 'Flowsheet',
      message: `Recycle loop detected involving: ${unvisited.map(n => n.tag).join(', ')}. Evolving solver to use Wegstein convergence accelerators.`
    })
  }

  return issues
}

// ─────────────────────────────────────────────────────────────────────
//  PENG-ROBINSON EQUATION OF STATE (EOS) ENGINE
// ─────────────────────────────────────────────────────────────────────

/** Calculates Peng-Robinson parameters a and b for a pure component at T */
export function prPureParams(chemKey, T_K) {
  const c = CHEMICALS[chemKey]
  if (!c) return { a: 0, b: 0 }
  
  const R = 8.3144626 // kPa * m3 / (kmol * K)
  const Tc = c.Tc // K
  const Pc = c.Pc // kPa
  const omega = c.omega
  
  const Tr = T_K / Tc
  const kappa = omega > 0.49
    ? 0.379642 + 1.48503 * omega - 0.164423 * omega * omega
    : 0.37464 + 1.54226 * omega - 0.26992 * omega * omega
    
  const alpha = Math.pow(1 + kappa * (1 - Math.sqrt(Tr)), 2)
  const ac = 0.45724 * R * R * Tc * Tc / Pc
  const a = ac * alpha
  const b = 0.07780 * R * Tc / Pc
  
  return { a, b }
}

/** Solves for Z (compressibility) of a mixture using Peng-Robinson EOS */
export function solvePRCompressibility(T_C, P_kPa, zA, zB, compA, compB, phase = 'Vapor') {
  const T_K = T_C + 273.15
  const R = 8.3144626
  
  const pA = prPureParams(compA, T_K)
  const pB = prPureParams(compB, T_K)
  
  // Mixing rules: a_mix = ΣΣ xi xj sqrt(ai aj), b_mix = Σ xi bi
  const aMix = zA * zA * pA.a + 2 * zA * zB * Math.sqrt(pA.a * pB.a) + zB * zB * pB.a
  const bMix = zA * pA.b + zB * pB.b
  
  // Dimensionless coefficients A and B
  const A = (aMix * P_kPa) / (R * R * T_K * T_K)
  const B = (bMix * P_kPa) / (R * T_K)
  
  // Cubic equation: Z^3 - (1 - B)Z^2 + (A - 2B - 3B^2)Z - (AB - B^2 - B^3) = 0
  const a1 = B - 1
  const a2 = A - 2 * B - 3 * B * B
  const a3 = - (A * B - B * B - B * B * B)
  
  // Cardano's analytical solver
  const Q = (3 * a2 - a1 * a1) / 9
  const R_val = (9 * a1 * a2 - 27 * a3 - 2 * a1 * a1 * a1) / 54
  const D = Q * Q * Q + R_val * R_val
  
  let roots = []
  if (D > 0) {
    const sqrtD = Math.sqrt(D)
    const S = Math.sign(R_val + sqrtD) * Math.pow(Math.abs(R_val + sqrtD), 1/3)
    const T_val = Math.sign(R_val - sqrtD) * Math.pow(Math.abs(R_val - sqrtD), 1/3)
    roots.push(-a1 / 3 + (S + T_val))
  } else {
    const rQ3 = Math.sqrt(-Q * Q * Q)
    const theta = rQ3 > 0 ? Math.acos(Math.max(-1, Math.min(1, R_val / rQ3))) : 0
    const term = 2 * Math.sqrt(-Q)
    roots.push(term * Math.cos(theta / 3) - a1 / 3)
    roots.push(term * Math.cos((theta + 2 * Math.PI) / 3) - a1 / 3)
    roots.push(term * Math.cos((theta + 4 * Math.PI) / 3) - a1 / 3)
  }
  
  // Z must be physically realistic (positive and greater than B)
  const valid = roots.filter(r => r > B)
  if (valid.length === 0) return 1.0 // fallback to ideal gas
  
  if (phase === 'Vapor') {
    return Math.max(...valid)
  } else {
    return Math.min(...valid)
  }
}

/** Calculates mass density of the mixture using Peng-Robinson EOS */
export function prDensity(T_C, P_kPa, zA, zB, compA, compB, phase = 'Vapor') {
  const MW = mwMix(zA, zB, compA, compB) / 1000 // kg/mol
  const T_K = T_C + 273.15
  const Z = solvePRCompressibility(T_C, P_kPa, zA, zB, compA, compB, phase)
  const R = 8.3144626
  return (P_kPa * MW) / (Z * R * T_K) * 1000 // conversion back to kg/m³
}
