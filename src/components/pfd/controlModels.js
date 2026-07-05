/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA — DYNAMIC CONTROL SYSTEMS ENGINE
 *  PID Controller and Control Valve solvers.
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Calculates PID controller output (0 to 100%)
 * @param {number} error - Current error (Set Point - Process Variable)
 * @param {number} dt - Time step (seconds)
 * @param {number} kc - Proportional gain
 * @param {number} tauI - Integral time constant (seconds, 0 to disable)
 * @param {number} tauD - Derivative time constant (seconds, 0 to disable)
 * @param {object} state - Controller history { integralErr, prevErr }
 */
export function calculatePID(error, dt, kc, tauI, tauD, state = { integralErr: 0, prevErr: 0 }) {
  // Proportional action
  const P = kc * error

  // Integral action
  if (tauI > 0) {
    state.integralErr += error * dt
  } else {
    state.integralErr = 0
  }
  const I = tauI > 0 ? (kc / tauI) * state.integralErr : 0

  // Derivative action
  const derivative = dt > 0 ? (error - state.prevErr) / dt : 0
  const D = kc * tauD * derivative

  // Update history
  state.prevErr = error

  // Output clamped between 0 (fully closed) and 100 (fully open)
  const output = Math.max(0, Math.min(100, P + I + D))
  return { output, state }
}

/**
 * Solves flow through a control valve based on opening percent
 * @param {object} p - Valve parameters { Cv, outletPress }
 * @param {object} inlet - Inlet stream data
 * @param {number} opening - Valve opening (0 to 100)
 */
export function solveControlValve(p, inlet, opening) {
  if (!inlet) return { ok: false, reason: 'No inlet stream connected' }

  const Cv = parseFloat(p.Cv) || 5.0
  const outP = parseFloat(p.outletPress) || 101.3
  const x = Math.max(0, Math.min(100, opening)) / 100 // fraction open

  if (outP >= inlet.press) {
    return { ok: false, reason: 'Outlet pressure must be lower than inlet pressure' }
  }

  const dP = inlet.press - outP
  const density = inlet.density || 1000

  // Standard liquid valve flow equation: Q = Cv * f(x) * sqrt(dP / SG)
  // Let's assume linear trim: f(x) = x
  const SG = density / 1000 // Specific gravity
  const volumetricFlow_gpm = Cv * x * Math.sqrt(Math.max(0.1, dP / 6.894) / Math.max(0.01, SG)) // dP in psi (1 psi = 6.894 kPa)
  
  // Convert GPM to kg/s: 1 GPM = 0.06309 L/s -> kg/s = GPM * 0.06309 * SG
  const flow_kg_s = volumetricFlow_gpm * 0.06309 * SG

  return {
    ok: true,
    flow: flow_kg_s,
    pressureDrop: dP,
    opening: x * 100
  }
}
