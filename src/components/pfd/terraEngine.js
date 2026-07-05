/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA INTELLIGENCE — TERRA AI COGNITIVE ENGINEERING CORES
 *  Decoupled Reasoning, Solver Algorithms, & Research Databases
 * ═══════════════════════════════════════════════════════════════
 */

// Core Chemical Engineering database covering the 8 subjects
export const SUBJECT_DATA = {
  mass_balance: {
    title: 'Mass Balance (Neraca Massa)',
    topics: ['Recycle loops', 'Purge operations', 'Degrees of Freedom', 'Component splitters'],
    formula: 'Input + Generation = Output + Consumption + Accumulation',
    guideline: 'Steady state non-reactive loops: sum(F_in) = sum(F_out). Recycle R increases single-pass yield.'
  },
  energy_balance: {
    title: 'Energy Balance (Neraca Energi)',
    topics: ['Latent heats', 'Reaction enthalpy', 'Cp temperature integrations', 'Heat capacities'],
    formula: 'Q - W = \\Delta H + \\Delta E_k + \\Delta E_p',
    guideline: 'Always verify if liquid flash is cooling the outlet line via throttling vaporization (latent heat sink).'
  },
  thermodynamics: {
    title: 'Thermodynamics (Termodinamika)',
    topics: ['Raoult\'s Law', 'NRTL activity coefficients', 'Antoine vapor pressures', 'Azeotrope constraints'],
    formula: 'y_i \\cdot P = x_i \\cdot \\gamma_i \\cdot P_{sat,i}',
    guideline: 'Polar binary systems (e.g., alcohol-water) deviate strongly from ideal Raoult law. gamma > 1 indicates positive deviation.'
  },
  fluid_mechanics: {
    title: 'Fluid Mechanics (Mekanika Fluida)',
    topics: ['Darcy friction loss', 'Reynolds flow regimes', 'Pump NPSH cavitation', 'Pipe velocity limits'],
    formula: 'NPSH_a = P_{suction} + h_{static} - h_{friction} - P_{vapor}',
    guideline: 'Keep velocity below 2.5 m/s for liquids, 30 m/s for gases to prevent massive frictional pressure drop.'
  },
  heat_transfer: {
    title: 'Heat Transfer (Perpindahan Panas)',
    topics: ['LMTD counter-current', 'Overall U calculations', 'Fouling factors', 'Pinch energy integration'],
    formula: 'Q = U \\cdot A \\cdot LMTD \\cdot F_t',
    guideline: 'Heat exchanger temperature crossing is impossible in single-pass countercurrent shells. Target cold-approach > 5°C.'
  },
  separation_process: {
    title: 'Separation Process (Operasi Pemisahan)',
    topics: ['McCabe-Thiele columns', 'Minimum reflux ratio', 'Stripping lines', 'Absorption Kremser'],
    formula: 'N_{actual} = \\frac{N_{min}}{\\eta_{stage}} \\quad ; \\quad y = \\frac{R}{R+1}x + \\frac{x_D}{R+1}',
    guideline: 'Reflux ratio R is optimally designed between 1.2 to 1.5 times R_min to balance reboiler OPEX vs tray count CAPEX.'
  },
  reaction_engineering: {
    title: 'Reaction Engineering (Kinetika & Reaktor)',
    topics: ['CSTR space time', 'PFR differential sizing', 'Arrhenius rates', 'Adiabatic runaway'],
    formula: 'V_{CSTR} = \\frac{F_{A0} \\cdot X}{-r_A} \\quad ; \\quad V_{PFR} = F_{A0} \\int \\frac{dX}{-r_A}',
    guideline: 'Exothermic reactions in PFR run risk of hotspot runaways. Recycle or multi-stage feed quenching stabilizes profiles.'
  },
  process_control: {
    title: 'Process Control (Pengendalian Proses)',
    topics: ['PID loops', 'First-order transfer functions', 'Cohen-Coon tuning', 'Oscillatory stability'],
    formula: 'G(s) = \\frac{K_p e^{-\\theta s}}{\\tau s + 1}',
    guideline: 'Adding derivative tau_D dampens oscillations but amplifies sensor noise. Tune integral tau_I to clear offset.'
  }
}

// Procedural solver calculations
export const solveAcademicProblem = (type, inputs) => {
  const F = parseFloat(inputs.F) || 10.0
  const X = (parseFloat(inputs.X) || 80.0) / 100
  const val1 = parseFloat(inputs.val1) || 0
  const val2 = parseFloat(inputs.val2) || 0
  const val3 = parseFloat(inputs.val3) || 0

  switch (type) {
    case 'pfr': {
      // Inputs: F (mol/s), X (fraction), val1 (rate constant k, 1/s)
      const k = val1 || 0.02
      const V = (F / k) * Math.log(1 / (1 - X))
      return {
        given: `Feed flow F_A0 = ${F.toFixed(2)} mol/s\nKinetic constant k = ${k.toFixed(4)} s⁻¹\nTarget conversion X = ${(X*100).toFixed(0)}%`,
        asked: 'PFR reactor volume V (m³)',
        formula: '$$V_{PFR} = \\frac{F_{A0}}{k} \\ln\\left(\\frac{1}{1-X}\\right)$$',
        solution: `V = (${F.toFixed(2)} / ${k.toFixed(4)}) * ln(1 / (1 - ${X.toFixed(2)}))\nV = ${(F/k).toFixed(2)} * ${Math.log(1/(1-X)).toFixed(4)}\nV = ${V.toFixed(2)} m³`,
        answer: `${V.toFixed(2)} m³`,
        interpretation: `PFR volume of ${V.toFixed(2)} m³ is required. If a CSTR was used, it would need ${(F/k * (X / (1-X))).toFixed(2)} m³ (which is larger by a factor of ${( (X/(1-X)) / Math.log(1/(1-X)) ).toFixed(1)}x).`
      }
    }
    case 'npsh': {
      // Inputs: F (elev, m), val1 (friction head, m), val2 (temp, C)
      const friction = val1 || 2.0
      const T = val2 || 25
      const pAtm = 101.3
      const pVap = T < 30 ? 3.17 : T < 45 ? 5.62 : 9.58
      const density = 998, g = 9.81

      const pHead = ((pAtm - pVap) * 1000) / (density * g)
      const npsha = pHead - F - friction
      return {
        given: `Elevation height z = ${F.toFixed(2)} m (suction draw lift)\nFriction head loss h_f = ${friction.toFixed(2)} m\nTemp = ${T.toFixed(0)}°C (P_vap = ${pVap.toFixed(2)} kPa)`,
        asked: 'NPSH Available (meter liquid)',
        formula: '$$NPSH_a = \\frac{P_{atm} - P_{vap}}{\\rho \\cdot g} - z - h_f$$',
        solution: `NPSHa = [ (101.3 - ${pVap.toFixed(2)}) * 1000 / (998 * 9.81) ] - ${F.toFixed(2)} - ${friction.toFixed(2)}\nNPSHa = ${pHead.toFixed(3)} - ${F.toFixed(2)} - ${friction.toFixed(2)} = ${npsha.toFixed(2)} m`,
        answer: `${npsha.toFixed(2)} m`,
        interpretation: `NPSH Available is ${npsha.toFixed(2)} m. Sizing is safe if pump NPSH Required is less than ${npsha.toFixed(2)} m. Keep pipes short to lower friction loss.`
      }
    }
    case 'lmtd': {
      // Inputs: F (overall U), val1 (hot inlet T), val2 (hot outlet T), val3 (cold inlet T)
      const U = F // overall U, W/m2K
      const thi = val1 || 120.0
      const tho = val2 || 80.0
      const tci = val3 || 25.0
      const tco = tci + (thi - tho) * 0.4 // estimate cold outlet

      const dt1 = thi - tco
      const dt2 = tho - tci
      const lmtd = (dt1 - dt2) / Math.log(dt1 / dt2)
      return {
        given: `Overall U = ${U.toFixed(0)} W/m²·°C\nHot fluid: ${thi.toFixed(0)}°C ➜ ${tho.toFixed(0)}°C\nCold fluid: ${tci.toFixed(0)}°C ➜ ${tco.toFixed(0)}°C`,
        asked: 'LMTD (°C)',
        formula: '$$LMTD = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1 / \\Delta T_2)}$$',
        solution: `dT1 = ${thi} - ${tco.toFixed(0)} = ${dt1.toFixed(1)}°C\ndT2 = ${tho} - ${tci} = ${dt2.toFixed(1)}°C\nLMTD = (${dt1.toFixed(1)} - ${dt2.toFixed(1)}) / ln(${dt1.toFixed(1)} / ${dt2.toFixed(1)}) = ${lmtd.toFixed(2)}°C`,
        answer: `${lmtd.toFixed(2)} °C`,
        interpretation: `LMTD is ${lmtd.toFixed(2)}°C. Heat transfer area is directly proportional to 1/LMTD. Countercurrent setup prevents temperature cross.`
      }
    }
    default: {
      return {
        given: 'Standard system sizing parameters',
        asked: 'Process output',
        formula: 'Solvers active',
        solution: 'Procedural solver completed successfully.',
        answer: 'OK',
        interpretation: 'Select specific solver in the parameters panel.'
      }
    }
  }
}

// Research Mode mock bibliography database
export const RESEARCH_PAPERS = [
  {
    title: 'Adsorption kinetic modeling of CO₂ capture using functionalized SBA-15 silica',
    authors: 'P. Lestari, H. Kurniawan, et al.',
    journal: 'Journal of Separation Engineering (2025)',
    abstract: 'Investigates the thermodynamic selectivity and capacity of amine-functionalized SBA-15 for flue gas CO2 capture. Highlights optimal adsorption capacity occurs at 318 K.',
    doi: '10.1016/j.jse.2025.10924'
  },
  {
    title: 'Process safety optimization of adiabatic reactor recycle loops under oscillatory dynamics',
    authors: 'A. Subekti, F. Wijaya',
    journal: 'Chemical Engineering Communications (2026)',
    abstract: 'Examines dynamic instabilities in CSTR networks with recycle streams. Demonstrates that high recycle rates trigger chaotic thermal fluctuations and provides PID dampening guidelines.',
    doi: '10.1080/00986445.2026.31'
  },
  {
    title: 'Pinch Integration in petrochemical columns: A retrofit analysis',
    authors: 'M. S. Siregar, R. Hardian',
    journal: 'Industrial & Engineering Chemistry Research (2024)',
    abstract: 'Reviews application of heat integration to reduce utility consumption in binary distillation. Proves that retrofitting reboiler heating cycles saves up to 40% external high-pressure steam.',
    doi: '10.1021/acs.iecr.4c0021'
  }
]

// Whiteboard drawings coordinates generator for core formulas
export const getWhiteboardDrawing = (type) => {
  switch (type) {
    case 'cstr':
      return {
        svgPath: 'M 100,50 L 100,110 L 140,110 L 140,50 Z M 100,65 L 140,65 M 120,40 L 120,95 M 110,95 L 130,95',
        labels: [
          { x: 120, y: 35, text: 'Feed F_A0' },
          { x: 120, y: 130, text: 'CSTR V' },
          { x: 150, y: 80, text: 'Outlet C_A' }
        ]
      }
    case 'distillation':
      return {
        svgPath: 'M 100,30 L 100,120 M 120,30 L 120,120 M 100,30 Q 110,20 120,30 M 100,120 Q 110,130 120,120 M 100,50 L 120,50 M 100,70 L 120,70 M 100,90 L 120,90 M 100,110 L 120,110 M 70,80 L 100,80',
        labels: [
          { x: 110, y: 15, text: 'Vapor out' },
          { x: 50, y: 82, text: 'Feed zF' },
          { x: 110, y: 145, text: 'Bottoms xB' }
        ]
      }
    case 'recycle':
      return {
        svgPath: 'M 50,70 L 90,70 M 90,70 L 90,110 M 90,110 L 50,110 M 50,110 L 50,70 M 90,70 L 140,70 M 140,70 L 140,120 M 140,120 L 70,120 M 70,120 L 70,110',
        labels: [
          { x: 62, y: 64, text: 'Feed' },
          { x: 110, y: 64, text: 'Reactant' },
          { x: 110, y: 135, text: 'Recycle Loop' }
        ]
      }
    default:
      return {
        svgPath: 'M 50,50 L 150,100 M 50,100 L 150,50',
        labels: [
          { x: 100, y: 35, text: 'Formula Whiteboard' }
        ]
      }
  }
}
