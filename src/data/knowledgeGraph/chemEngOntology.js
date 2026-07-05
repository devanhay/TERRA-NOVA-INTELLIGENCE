/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: KNOWLEDGE CORE ONTOLOGY
 *  Structured Chemical Engineering Knowledge Graph
 * ═══════════════════════════════════════════════════════════════
 */

export const ChemEngOntology = {
  fundamentals: {
    thermodynamics: {
      description: "Study of energy conversions, phase equilibria, and physical properties.",
      subTopics: {
        laws_of_thermo: {
          description: "Conservation of energy and entropy limits.",
          concepts: ["First Law", "Second Law", "Enthalpy", "Entropy"]
        },
        phase_equilibria: {
          description: "Vapor-Liquid, Liquid-Liquid phase distributions.",
          concepts: ["Raoult's Law", "Fugacity", "Activity Coefficients", "Azeotropes"],
          rules: ["Positive deviation (gamma > 1) suggests repelling molecules (e.g. alcohol-water)."],
          related: ["separation_process.distillation"],
          sources: ["Introduction to Chemical Engineering Thermodynamics (Smith, Van Ness, Abbott)", "Perry's Chemical Engineers' Handbook"]
        },
        eos: {
          description: "Equations of State for real gas behavior.",
          concepts: ["Peng-Robinson", "SRK", "Ideal Gas Law"],
          related: ["fluid_mechanics.compressibility"],
          sources: ["Introduction to Chemical Engineering Thermodynamics (Smith, Van Ness, Abbott)"]
        }
      }
    },
    fluid_mechanics: {
      description: "Behavior of fluids at rest and in motion.",
      subTopics: {
        fluid_statics: {
          description: "Hydrostatic pressure and buoyancy.",
          concepts: ["Hydrostatic head", "Manometry"],
          sources: ["Unit Operations of Chemical Engineering (McCabe, Smith, Harriott)"]
        },
        fluid_dynamics: {
          description: "Flow regimes and pressure drop.",
          concepts: ["Bernoulli's Equation", "Reynolds Number", "Darcy-Weisbach Friction"],
          rules: ["Laminar flow Re < 2100; Turbulent Re > 4000.", "Keep liquid velocity < 3 m/s to minimize erosion/pressure drop."],
          related: ["process_design.piping"],
          sources: ["Unit Operations of Chemical Engineering (McCabe, Smith, Harriott)", "Transport Phenomena (Bird, Stewart, Lightfoot)"]
        },
        pumps_compressors: {
          description: "Fluid moving machinery.",
          concepts: ["NPSH", "Cavitation", "Centrifugal Pumps", "Positive Displacement", "Compressor surge"],
          rules: ["NPSH available must strictly exceed NPSH required by at least 1 meter to avoid cavitation."],
          related: ["thermodynamics.phase_equilibria"],
          sources: ["Perry's Chemical Engineers' Handbook"]
        }
      }
    },
    heat_transfer: {
      description: "Transfer of thermal energy between systems.",
      subTopics: {
        mechanisms: {
          description: "Conduction, Convection, Radiation.",
          concepts: ["Fourier's Law", "Newton's Law of Cooling", "Stefan-Boltzmann"],
          sources: ["Transport Phenomena (Bird, Stewart, Lightfoot)", "Process Heat Transfer (Kern)"]
        },
        heat_exchangers: {
          description: "Equipment for transferring heat between streams.",
          concepts: ["LMTD", "Overall Heat Transfer Coefficient (U)", "Fouling Factor", "Effectiveness-NTU"],
          rules: ["Counter-current flow is more efficient and allows temperature cross.", "Place corrosive/dirty fluids inside tubes for easier cleaning."],
          related: ["process_design.pinch_analysis"],
          sources: ["Process Heat Transfer (Kern)", "Unit Operations of Chemical Engineering (McCabe, Smith, Harriott)"]
        }
      }
    }
  },
  core_engineering: {
    reaction_engineering: {
      description: "Chemical kinetics and reactor design.",
      subTopics: {
        kinetics: {
          description: "Reaction rates and mechanisms.",
          concepts: ["Arrhenius Equation", "Reaction Order", "Activation Energy"],
          rules: ["Rule of thumb: Rate doubles for every 10°C increase in temperature."],
          sources: ["Elements of Chemical Reaction Engineering (Fogler)"]
        },
        ideal_reactors: {
          description: "CSTR, PFR, Batch reactors.",
          concepts: ["Space Time", "Conversion", "Residence Time Distribution (RTD)"],
          rules: ["For positive order reactions, PFR requires less volume than CSTR for the same conversion.", "Use CSTR for highly exothermic reactions due to excellent mixing and temp control."],
          related: ["mass_balance.recycle"],
          sources: ["Elements of Chemical Reaction Engineering (Fogler)", "Chemical Reaction Engineering (Levenspiel)"]
        }
      }
    },
    separation_process: {
      description: "Separation of mixtures into distinct components.",
      subTopics: {
        distillation: {
          description: "Separation based on relative volatility.",
          concepts: ["McCabe-Thiele", "Reflux Ratio", "Theoretical Trays", "Feed Quality (q)"],
          rules: ["Optimal reflux ratio is typically 1.2 to 1.5 times the minimum reflux ratio (R_min)."],
          related: ["thermodynamics.phase_equilibria"],
          sources: ["Separation Process Principles (Seader, Henley)", "Unit Operations of Chemical Engineering (McCabe, Smith, Harriott)"]
        },
        absorption: {
          description: "Transfer of gas components into a liquid solvent.",
          concepts: ["Kremser Equation", "Henry's Law", "Packed columns"],
          rules: ["High pressure and low temperature favor gas absorption into liquids."],
          sources: ["Separation Process Principles (Seader, Henley)"]
        }
      }
    },
    mass_balance: {
      description: "Conservation of mass in steady and transient states.",
      subTopics: {
        steady_state: {
          description: "Input = Output (no accumulation).",
          concepts: ["Degrees of Freedom", "Tie components"],
          sources: ["Elementary Principles of Chemical Processes (Felder, Rousseau)"]
        },
        recycle_purge: {
          description: "Recycling unreacted feeds and purging inerts.",
          concepts: ["Single-pass conversion", "Overall conversion", "Purge ratio"],
          rules: ["Recycle loops increase overall yield but require larger processing equipment.", "Purge streams are mandatory if impurities exist in the fresh feed to prevent infinite accumulation."],
          related: ["reaction_engineering.ideal_reactors"],
          sources: ["Elementary Principles of Chemical Processes (Felder, Rousseau)"]
        }
      }
    },
    process_control: {
      description: "Maintaining process stability and targets.",
      subTopics: {
        pid_control: {
          description: "Proportional, Integral, Derivative controllers.",
          concepts: ["Gain (Kc)", "Integral Time", "Derivative Time", "Offset"],
          rules: ["Too high proportional gain causes oscillatory instability.", "Integral action eliminates steady-state offset but slows response."],
          sources: ["Process Dynamics and Control (Seborg, Edgar, Mellichamp)"]
        },
        dynamics: {
          description: "Process response over time.",
          concepts: ["First order plus dead time (FOPDT)", "Time constant", "Dead time"],
          sources: ["Process Dynamics and Control (Seborg, Edgar, Mellichamp)"]
        }
      }
    }
  },
  industrial_knowledge: {
    process_design: {
      description: "Plant synthesis, economics, and optimization.",
      subTopics: {
        pinch_analysis: {
          description: "Energy integration to minimize utility usage.",
          concepts: ["Composite Curves", "Pinch Temperature", "Heat Recovery Network"],
          rules: ["Do not transfer heat across the pinch.", "Do not use external cooling above the pinch.", "Do not use external heating below the pinch."],
          sources: ["Chemical Engineering Design (Towler, Sinnott)"]
        },
        economics: {
          description: "CAPEX and OPEX estimations.",
          concepts: ["NPV", "Payback Period", "Cost Index", "Six-tenths rule"],
          rules: ["Capital cost typically scales with capacity to the power of 0.6 (Economies of scale)."],
          sources: ["Plant Design and Economics for Chemical Engineers (Peters, Timmerhaus)"]
        }
      }
    }
  }
};

/**
 * Helper function for Logic Engine to query the ontology
 */
export const queryKnowledge = (topicPath) => {
  const parts = topicPath.split('.');
  let current = ChemEngOntology;
  for (const part of parts) {
    if (current.subTopics && current.subTopics[part]) {
      current = current.subTopics[part];
    } else if (current[part]) {
      current = current[part];
    } else {
      return null; // Not found
    }
  }
  return current;
};

export const findRelatedConcepts = (concept) => {
    // A simple search through the ontology for 'related' links
    // In a full DB, this would be a graph query
    let relatedPaths = [];
    
    const traverse = (node, path) => {
        if (node.related) {
            // Check if the current node concepts match the search concept
            if (node.concepts && node.concepts.some(c => c.toLowerCase().includes(concept.toLowerCase()))) {
               relatedPaths = relatedPaths.concat(node.related);
            }
        }
        if (node.subTopics) {
            Object.keys(node.subTopics).forEach(k => traverse(node.subTopics[k], path ? `${path}.${k}` : k));
        } else if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
             Object.keys(node).forEach(k => traverse(node[k], path ? `${path}.${k}` : k));
        }
    }
    
    traverse(ChemEngOntology, "");
    return [...new Set(relatedPaths)]; // unique
}
