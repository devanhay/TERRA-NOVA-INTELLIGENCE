/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA — PROCESS FLOWSHEET TEMPLATES
 *
 *  Pre-built, ready-to-simulate industrial process templates.
 *  Each template defines:
 *   - nodes: equipment units
 *   - streams: connections
 *   - params: pre-filled simulation parameters
 *   - preset: chemical system
 *   - thermoModel: VLE model
 * ═══════════════════════════════════════════════════════════════
 */

export const PROCESS_TEMPLATES = {

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 1 — SIMPLE FLASH DRUM SEPARATION
  //  Application: Feed conditioning, partial vaporization for gas recovery
  //  System: Benzene-Toluene, Ideal
  // ─────────────────────────────────────────────────────────────────
  flash_separation: {
    name: 'Flash Drum Separation',
    icon: '💨',
    category: 'Separation',
    difficulty: 'Beginner',
    desc: 'Heated feed enters a flash drum. Vapor (benzene-rich) exits top, liquid (toluene-rich) exits bottom. Classic single-stage equilibrium separator.',
    preset: 'Benzene-Toluene',
    thermoModel: 'Ideal',
    learningObjective: 'Understand VLE flash equilibrium, Rachford-Rice equation, K-values, and phase separation.',
    nodes: [
      { id: 'n1', type: 'feedtank',  label: 'Feed Tank',    tag: 'T-101', x: 60,  y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'pump',      label: 'Pump',         tag: 'P-101', x: 220, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'heater',    label: 'Feed Heater',  tag: 'E-101', x: 380, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'flash',     label: 'Flash Drum',   tag: 'V-101', x: 550, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'storagetank', label: 'Vapor Product', tag: 'T-102', x: 720, y: 120, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n6', type: 'storagetank', label: 'Liquid Product',tag: 'T-103', x: 720, y: 280, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false },
      { id: 'S-104', from: 'n4', to: 'n5', data: {}, calculated: false },
      { id: 'S-105', from: 'n4', to: 'n6', data: {}, calculated: false }
    ],
    params: {
      n1: { flow: '10', temp: '25', press: '150', zA: '50' },
      n2: { pressureRise: '300', efficiency: '75', npshr: '1.5', staticHead: '2' },
      n3: { targetTemp: '95', pressDrop: '10' },
      n4: { temp: '95', press: '101.3' },
      n5: { volume: '50' },
      n6: { volume: '50' }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 2 — BTX DISTILLATION COLUMN
  //  Application: Benzene purification from toluene
  //  System: Benzene-Toluene, Ideal
  // ─────────────────────────────────────────────────────────────────
  distillation_btx: {
    name: 'BTX Distillation Column',
    icon: '🗼',
    category: 'Separation',
    difficulty: 'Intermediate',
    desc: 'Classic benzene-toluene separation. Feed heated to bubble point, then separated in distillation column. Overhead = benzene-rich distillate. Bottoms = toluene-rich product.',
    preset: 'Benzene-Toluene',
    thermoModel: 'Ideal',
    learningObjective: 'Apply Fenske-Underwood-Gilliland shortcut. Calculate Nmin, Rmin, N, condenser/reboiler duties.',
    nodes: [
      { id: 'n1', type: 'feedtank',     label: 'Feed Tank',    tag: 'T-101', x: 50,  y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'pump',         label: 'Feed Pump',    tag: 'P-101', x: 200, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'heater',       label: 'Feed Preheater', tag: 'E-101', x: 360, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'distillation', label: 'Distillation Column', tag: 'C-101', x: 530, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'storagetank',  label: 'Benzene Distillate', tag: 'T-102', x: 720, y: 100, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n6', type: 'storagetank',  label: 'Toluene Bottoms', tag: 'T-103', x: 720, y: 300, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false },
      { id: 'S-104', from: 'n4', to: 'n5', data: {}, calculated: false },
      { id: 'S-105', from: 'n4', to: 'n6', data: {}, calculated: false }
    ],
    params: {
      n1: { flow: '15', temp: '25', press: '200', zA: '40' },
      n2: { pressureRise: '200', efficiency: '75', npshr: '1.5', staticHead: '2' },
      n3: { targetTemp: '80', pressDrop: '15' },
      n4: { refluxRatio: '2.5', distillatePurity: '95', bottomsPurity: '5', operatingPressure: '101.3', feedQuality: '1' },
      n5: { volume: '100' },
      n6: { volume: '100' }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 3 — ETHANOL PRODUCTION + DISTILLATION
  //  Application: Bioethanol concentration from dilute fermentation broth
  //  System: Ethanol-Water, NRTL (non-ideal, azeotrope)
  // ─────────────────────────────────────────────────────────────────
  ethanol_distillation: {
    name: 'Ethanol Distillation (NRTL)',
    icon: '🍶',
    category: 'Reaction + Separation',
    difficulty: 'Advanced',
    desc: 'Dilute ethanol-water feed (from fermentation) is concentrated via distillation. Demonstrates NRTL non-ideal VLE and the approach to the ethanol-water azeotrope (x_EtOH ≈ 0.894).',
    preset: 'Ethanol-Water',
    thermoModel: 'NRTL',
    learningObjective: 'Understand activity coefficients, non-ideal VLE, azeotropes, and their impact on distillation design. Note: Cannot exceed azeotrope composition without pressure-swing or membrane separation.',
    nodes: [
      { id: 'n1', type: 'feedtank',     label: 'Fermentation Broth', tag: 'T-101', x: 50,  y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'pump',         label: 'Feed Pump',          tag: 'P-101', x: 210, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'heater',       label: 'Feed Preheater',     tag: 'E-101', x: 380, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'distillation', label: 'Ethanol Column',     tag: 'C-101', x: 540, y: 180, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'cooler',       label: 'Product Cooler',     tag: 'E-102', x: 700, y: 100, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n6', type: 'storagetank',  label: 'Water Effluent',     tag: 'T-102', x: 700, y: 300, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false },
      { id: 'S-104', from: 'n4', to: 'n5', data: {}, calculated: false },
      { id: 'S-105', from: 'n4', to: 'n6', data: {}, calculated: false }
    ],
    params: {
      n1: { flow: '20', temp: '35', press: '150', zA: '10' },
      n2: { pressureRise: '200', efficiency: '75', npshr: '1.5', staticHead: '2' },
      n3: { targetTemp: '78', pressDrop: '10' },
      n4: { refluxRatio: '8.0', distillatePurity: '85', bottomsPurity: '2', operatingPressure: '101.3', feedQuality: '0.9' },
      n5: { targetTemp: '40', pressDrop: '5' },
      n6: { volume: '200' }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 4 — HEAT EXCHANGE NETWORK
  //  Application: Energy integration between hot and cold streams
  //  System: Methanol-Water, Ideal
  // ─────────────────────────────────────────────────────────────────
  heat_exchange: {
    name: 'Heat Exchange Network',
    icon: '♨️',
    category: 'Heat Transfer',
    difficulty: 'Intermediate',
    desc: 'Demonstrates process heat integration. Hot product stream exchanges heat with cold feed stream, reducing both heating and cooling utility requirements. Classic pinch concept.',
    preset: 'Methanol-Water',
    thermoModel: 'Ideal',
    learningObjective: 'Apply ε-NTU method for heat exchanger design. Calculate LMTD, effectiveness, NTU, and understand the energy integration principle.',
    nodes: [
      { id: 'n1', type: 'feedtank',  label: 'Cold Feed',     tag: 'T-101', x: 50,  y: 150, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'feedtank',  label: 'Hot Product',   tag: 'T-102', x: 50,  y: 320, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'heatex',    label: 'Feed/Product HX', tag: 'HX-101', x: 280, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'heater',    label: 'Trim Heater',   tag: 'E-101', x: 480, y: 150, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'cooler',    label: 'Product Cooler', tag: 'E-102', x: 480, y: 320, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n3', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n5', data: {}, calculated: false }, // hotOutlet goes to Cooler (n5)
      { id: 'S-104', from: 'n3', to: 'n4', data: {}, calculated: false }  // coldOutlet goes to Trim Heater (n4)
    ],
    params: {
      n1: { flow: '12', temp: '30',  press: '200', zA: '60' },
      n2: { flow: '12', temp: '130', press: '200', zA: '60' },
      n3: { area: '25', uValue: '600', pressDrop: '15' },
      n4: { targetTemp: '120', pressDrop: '5' },
      n5: { targetTemp: '40',  pressDrop: '5' }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 5 — ADIABATIC REACTOR + PRODUCT SEPARATION
  //  Application: Simple exothermic reaction + downstream flash separation
  //  System: Methanol-Water (methanol → water byproduct conceptual)
  // ─────────────────────────────────────────────────────────────────
  reactor_separation: {
    name: 'Reactor + Flash Separation',
    icon: '⚗️',
    category: 'Reaction + Separation',
    difficulty: 'Intermediate',
    desc: 'Exothermic reaction A→B in an adiabatic CSTR. Outlet stream cools and enters a flash drum for product separation. Demonstrates adiabatic temperature rise and downstream vapor-liquid equilibrium.',
    preset: 'Methanol-Water',
    thermoModel: 'Ideal',
    learningObjective: 'Understand how exothermic heat of reaction raises outlet temperature, how this temperature feeds into flash calculations, and the importance of downstream cooling.',
    nodes: [
      { id: 'n1', type: 'feedtank',  label: 'Reactant Feed',   tag: 'T-101', x: 50,  y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'pump',      label: 'Feed Pump',        tag: 'P-101', x: 200, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'heater',    label: 'Feed Preheater',   tag: 'E-101', x: 360, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'reactor',   label: 'Adiabatic Reactor', tag: 'R-101', x: 520, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'cooler',    label: 'Reactor Effluent Cooler', tag: 'E-102', x: 680, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n6', type: 'flash',     label: 'Product Flash',    tag: 'V-101', x: 840, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n7', type: 'storagetank', label: 'Vapor Product', tag: 'T-102', x: 1000, y: 150, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n8', type: 'storagetank', label: 'Liquid Product', tag: 'T-103', x: 1000, y: 290, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false },
      { id: 'S-104', from: 'n4', to: 'n5', data: {}, calculated: false },
      { id: 'S-105', from: 'n5', to: 'n6', data: {}, calculated: false },
      { id: 'S-106', from: 'n6', to: 'n7', data: {}, calculated: false },
      { id: 'S-107', from: 'n6', to: 'n8', data: {}, calculated: false }
    ],
    params: {
      n1: { flow: '8', temp: '25', press: '300', zA: '80' },
      n2: { pressureRise: '200', efficiency: '75', npshr: '1.5', staticHead: '2' },
      n3: { targetTemp: '70', pressDrop: '10' },
      n4: { conversion: '75', stoich: '1', rxnHeat: '-45' },
      n5: { targetTemp: '50', pressDrop: '10' },
      n6: { temp: '75', press: '101.3' },
      n7: { volume: '100' },
      n8: { volume: '100' }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 6 — EXOTHERMIC REACTOR WITH GAS RECYCLE
  //  Application: Industrial loop design with Wegstein convergence
  // ─────────────────────────────────────────────────────────────────
  recycle_fractionation: {
    name: 'Exothermic Reactor with Gas Recycle',
    icon: '🔁',
    category: 'Reaction + Separation',
    difficulty: 'Advanced',
    desc: 'Demonstrates industrial feedback loop design. Exothermic reactor effluent is separated in a flash drum. Unreacted gas is split, purged to vent, and recycled back to the feed mixer via a Wegstein accelerated solver loop.',
    preset: 'Methanol-Water',
    thermoModel: 'Ideal',
    learningObjective: 'Observe recycle loop tear stream convergence. Track how Wegstein acceleration converges mass flow and composition in under 5 iterations compared to successive substitution.',
    nodes: [
      { id: 'n1', type: 'feedtank',  label: 'Fresh Feed',      tag: 'T-101', x: 50,  y: 260, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'mixer',     label: 'Feed Mixer',      tag: 'M-101', x: 200, y: 260, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'heater',    label: 'Feed Preheater',  tag: 'E-101', x: 340, y: 260, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'reactor',   label: 'CSTR Reactor',    tag: 'R-101', x: 480, y: 260, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'cooler',    label: 'Effluent Cooler', tag: 'E-102', x: 620, y: 260, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n6', type: 'flash',     label: 'Phase Separator', tag: 'V-101', x: 760, y: 260, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n7', type: 'splitter',  label: 'Recycle Splitter',tag: 'S-101', x: 900, y: 160, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n8', type: 'storagetank', label: 'Liquid Product',tag: 'T-102', x: 900, y: 360, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n9', type: 'storagetank', label: 'Purge Gas Vent',tag: 'T-103', x: 1040, y: 160, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false },
      { id: 'S-104', from: 'n4', to: 'n5', data: {}, calculated: false },
      { id: 'S-105', from: 'n5', to: 'n6', data: {}, calculated: false },
      { id: 'S-106', from: 'n6', to: 'n7', data: {}, calculated: false }, // Vapor to splitter
      { id: 'S-107', from: 'n6', to: 'n8', data: {}, calculated: false }, // Liquid product
      { id: 'S-108', from: 'n7', to: 'n2', data: {}, calculated: false }, // Recycle
      { id: 'S-109', from: 'n7', to: 'n9', data: {}, calculated: false }  // Purge
    ],
    params: {
      n1: { flow: '10', temp: '30', press: '300', zA: '70' },
      n2: { pressureDrop: '5' },
      n3: { targetTemp: '85', pressDrop: '10' },
      n4: { conversion: '60', stoich: '1.2', rxnHeat: '-40' },
      n5: { targetTemp: '45', pressDrop: '15' },
      n6: { temp: '45', press: '80' },
      n7: { splitRatio: '70' },
      n8: { volume: '100' },
      n9: { volume: '50' }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 7 — MULTI-STAGE GAS COMPRESSION
  //  Application: High pressure syngas with intercooling
  // ─────────────────────────────────────────────────────────────────
  multistage_compression: {
    name: 'Multi-Stage Gas Compression',
    icon: '⚙️',
    category: 'Mechanical',
    difficulty: 'Intermediate',
    desc: 'Three-stage compressor train with intercooling. High-pressure gas compression generates significant heat. Intercoolers are required between stages to improve efficiency, prevent equipment damage, and increase density.',
    preset: 'Nitrogen-Hydrogen',
    thermoModel: 'Ideal',
    learningObjective: 'Understand the thermodynamics of gas compression, isentropic efficiency, and the work savings achieved through multi-stage compression with intercooling.',
    nodes: [
      { id: 'n1', type: 'feedtank',     label: 'Low Press Gas', tag: 'T-101', x: 50,  y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'compressor',   label: 'Stage 1 Comp',  tag: 'K-101', x: 180, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'cooler',       label: 'Intercooler 1', tag: 'E-101', x: 310, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'compressor',   label: 'Stage 2 Comp',  tag: 'K-102', x: 440, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'cooler',       label: 'Intercooler 2', tag: 'E-102', x: 570, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n6', type: 'compressor',   label: 'Stage 3 Comp',  tag: 'K-103', x: 700, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n7', type: 'cooler',       label: 'Aftercooler',   tag: 'E-103', x: 830, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n8', type: 'storagetank',  label: 'High Press Gas',tag: 'T-102', x: 960, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false },
      { id: 'S-104', from: 'n4', to: 'n5', data: {}, calculated: false },
      { id: 'S-105', from: 'n5', to: 'n6', data: {}, calculated: false },
      { id: 'S-106', from: 'n6', to: 'n7', data: {}, calculated: false },
      { id: 'S-107', from: 'n7', to: 'n8', data: {}, calculated: false }
    ],
    params: {
      n1: { flow: '5', temp: '25', press: '100', zA: '25' },
      n2: { compressionRatio: '3', efficiency: '75' },
      n3: { targetTemp: '40', pressDrop: '5' },
      n4: { compressionRatio: '3', efficiency: '75' },
      n5: { targetTemp: '40', pressDrop: '5' },
      n6: { compressionRatio: '3', efficiency: '75' },
      n7: { targetTemp: '40', pressDrop: '5' },
      n8: { volume: '200' }
    }
  },

  // ─────────────────────────────────────────────────────────────────
  //  TEMPLATE 8 — RIGOROUS RADFRAC COLUMN SEPARATION
  //  Application: Rigorous multi-stage Benzene purification
  //  System: Benzene-Toluene, Ideal
  // ─────────────────────────────────────────────────────────────────
  radfrac_purification: {
    name: 'Rigorous RadFrac Distillation',
    icon: '⚡',
    category: 'Separation',
    difficulty: 'Advanced',
    desc: 'Purifies benzene from toluene using the new rigorous multi-stage tray-by-tray RadFrac column model. Calculates tray-by-tray equilibrium compositions.',
    preset: 'Benzene-Toluene',
    thermoModel: 'Ideal',
    learningObjective: 'Observe differences between Fenske shortcut calculations and rigorous stage-by-stage VLE calculations.',
    nodes: [
      { id: 'n1', type: 'feedtank',     label: 'Feed Tank',    tag: 'T-101', x: 50,  y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n2', type: 'pump',         label: 'Feed Pump',    tag: 'P-101', x: 200, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n3', type: 'distillation', label: 'RadFrac Column', tag: 'C-101', x: 420, y: 200, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n4', type: 'storagetank',  label: 'Overhead Product', tag: 'T-102', x: 620, y: 100, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
      { id: 'n5', type: 'storagetank',  label: 'Bottoms Product', tag: 'T-103', x: 620, y: 300, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
    ],
    streams: [
      { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
      { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
      { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false },
      { id: 'S-104', from: 'n3', to: 'n5', data: {}, calculated: false }
    ],
    params: {
      n1: { flow: '10', temp: '80', press: '150', zA: '50' },
      n2: { pressureRise: '100', efficiency: '75', npshr: '1.5', staticHead: '2' },
      n3: { solverMode: 'RadFrac', refluxRatio: '3.0', numStages: '10', feedStage: '5', distillateSplit: '50', operatingPressure: '101.3', feedQuality: '1' },
      n4: { volume: '100' },
      n5: { volume: '100' }
    }
  }
}

/** Get sorted templates list for display */
export function getTemplateList() {
  return Object.entries(PROCESS_TEMPLATES).map(([id, t]) => ({
    id, ...t
  }))
}
