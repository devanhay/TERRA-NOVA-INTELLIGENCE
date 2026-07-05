/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA — TECHNO-ECONOMIC ANALYSIS (TEA) ENGINE
 *  Sizing-to-Cost correlations based on modified Guthrie's methods.
 *  Utility Costs & Carbon Intensity Factors (Indonesian Grid context)
 * ═══════════════════════════════════════════════════════════════
 */

// UTILITY RATES & CARBON EMISSION COEFFICIENTS
export const UTILITY_FACTORS = {
  // Electricity for Pumps / Compressors
  electricity: {
    cost: 0.12,         // USD / kWh
    co2: 0.78,          // kg CO2e / kWh (Indonesian Grid index)
  },
  // Low-pressure Steam for Heaters / Reboilers
  steam: {
    cost: 0.025,        // USD / kWh of heat
    co2: 0.22,          // kg CO2e / kWh
  },
  // Cooling Water for Coolers / Condensers
  cooling_water: {
    cost: 0.005,        // USD / kWh of cooling
    co2: 0.015,         // kg CO2e / kWh
  }
}

/**
 * Calculates Purchased Equipment Cost (CAPEX) in USD
 * @param {string} type - Equipment type (e.g., 'pump', 'distillation')
 * @param {object} p - Equipment input parameters
 * @param {array} results - Calculated physical output results
 */
export function calculateCAPEX(type, p = {}, results = []) {
  const findVal = (label) => {
    if (!results || !Array.isArray(results)) return 0
    const item = results.find(r => r && r.label && r.label.includes(label))
    return item ? parseFloat(item.val) : 0
  }

  let cost_usd = 0

  switch (type) {
    case 'feedtank':
    case 'storagetank': {
      // Sized based on volumetric capacity or default size
      const vol = parseFloat(p.volume) || 50 // m3
      cost_usd = 12000 * Math.pow(vol / 20, 0.6)
      break
    }
    case 'pump': {
      const power = findVal('Shaft Power') || 5 // kW
      cost_usd = 6500 * Math.pow(Math.max(0.5, power) / 5, 0.55)
      break
    }
    case 'compressor': {
      const power = findVal('Shaft Power') || 50 // kW
      cost_usd = 38000 * Math.pow(Math.max(1, power) / 50, 0.82)
      break
    }
    case 'heater':
    case 'cooler': {
      const duty = Math.abs(findVal('Heat Duty') || 100) // kW
      cost_usd = 11000 * Math.pow(Math.max(10, duty) / 100, 0.65)
      break
    }
    case 'heatex': {
      const area = parseFloat(p.area) || findVal('Req. Area') || 15 // m2
      cost_usd = 16000 * Math.pow(Math.max(1, area) / 15, 0.68)
      break
    }
    case 'reactor': {
      const vol = parseFloat(p.volume) || 10 // m3
      cost_usd = 22000 * Math.pow(Math.max(1, vol) / 10, 0.67)
      break
    }
    case 'flash':
    case 'separator': {
      cost_usd = 14000
      break
    }
    case 'distillation': {
      const stages = findVal('Actual Stages') || 15
      const diam = findVal('Column Diameter') || 1.2 // m
      // Shell + Trays cost
      const shellCost = 25000 * Math.pow(diam / 1.0, 1.2) * Math.pow(stages / 10, 0.8)
      const trayCost = 1500 * stages * Math.pow(diam / 1.0, 1.5)
      cost_usd = shellCost + trayCost
      break
    }
    case 'valve': {
      cost_usd = 850 // Standard control valve
      break
    }
    case 'splitter':
    case 'mixer': {
      cost_usd = 1200 // Piping manifold / static mixer
      break
    }
    default:
      cost_usd = 2500
  }

  return Math.round(cost_usd)
}

/**
 * Calculates hourly Operating Cost (USD/hr) and Carbon Footprint (kg CO2e/hr)
 */
export function calculateOPEXAndEmissions(type, results = []) {
  const findVal = (label) => {
    if (!results || !Array.isArray(results)) return 0
    const item = results.find(r => r && r.label && r.label.includes(label))
    return item ? parseFloat(item.val) : 0
  }

  let opexRate = 0
  let co2Rate = 0

  switch (type) {
    case 'pump':
    case 'compressor': {
      const power = findVal('Shaft Power') || 0 // kW
      opexRate = power * UTILITY_FACTORS.electricity.cost
      co2Rate = power * UTILITY_FACTORS.electricity.co2
      break
    }
    case 'heater': {
      const duty = Math.abs(findVal('Heat Duty') || 0) // kW
      opexRate = duty * UTILITY_FACTORS.steam.cost
      co2Rate = duty * UTILITY_FACTORS.steam.co2
      break
    }
    case 'cooler': {
      const duty = Math.abs(findVal('Heat Duty') || 0) // kW
      opexRate = duty * UTILITY_FACTORS.cooling_water.cost
      co2Rate = duty * UTILITY_FACTORS.cooling_water.co2
      break
    }
    case 'heatex': {
      break
    }
    case 'distillation': {
      const Qcondenser = Math.abs(findVal('Condenser Duty') || 0) // kW
      const Qreboiler = Math.abs(findVal('Reboiler Duty') || 0)   // kW
      
      const condenserOpex = Qcondenser * UTILITY_FACTORS.cooling_water.cost
      const condenserCo2  = Qcondenser * UTILITY_FACTORS.cooling_water.co2
      
      const reboilerOpex  = Qreboiler * UTILITY_FACTORS.steam.cost
      const reboilerCo2   = Qreboiler * UTILITY_FACTORS.steam.co2

      opexRate = condenserOpex + reboilerOpex
      co2Rate = condenserCo2 + reboilerCo2
      break
    }
    default:
      break
  }

  return { opexRate, co2Rate }
}

/**
 * Aggregates flowsheet level economics over 8000 operating hours per year
 */
export function calculateFlowsheetTEA(nodes, equipParams = {}) {
  let totalCAPEX = 0
  let totalOPEXRate = 0
  let totalCO2Rate = 0

  nodes.forEach(n => {
    if (n.calculated && n.results) {
      const capex = calculateCAPEX(n.type, equipParams[n.id] || {}, n.results)
      totalCAPEX += capex

      const { opexRate, co2Rate } = calculateOPEXAndEmissions(n.type, n.results)
      totalOPEXRate += opexRate
      totalCO2Rate += co2Rate
    }
  })

  const annualHours = 8000
  const annualOPEX = totalOPEXRate * annualHours
  const annualCO2 = totalCO2Rate * annualHours

  return {
    capexUSD: totalCAPEX,
    opexUSDPerYear: annualOPEX,
    co2KgPerYear: annualCO2
  }
}
