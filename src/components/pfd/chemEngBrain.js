/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA NOVA INTELLIGENCE — CHEMICAL ENGINEERING COGNITIVE BRAIN
 *  Procedural Physics Engine, Academic Syllabus, & Step Solvers
 * ═══════════════════════════════════════════════════════════════
 */

export const CORE_SUBJECTS = {
  mass_balance: {
    id: 'mass_balance',
    name: 'Mass Balance (Neraca Massa)',
    desc: 'Foundational material balance tracking mass conservation across single or multi-unit operations, splitters, mixers, and recycle/purge loops.',
    concepts: [
      { name: 'Conservation of Mass', desc: 'Input = Output + Generation - Consumption - Accumulation. For steady-state non-reacting systems, Input = Output.' },
      { name: 'Degree of Freedom (DoF)', desc: 'DoF = Number of unknown variables - Number of independent equations. System is solvable only when DoF = 0.' },
      { name: 'Recycle and Purge Loops', desc: 'Recycle loops increase overall reactant conversion by returning unreacted feed. Purges prevent accumulation of inert substances.' }
    ],
    formulas: [
      { label: 'Overall Balance (Steady Non-Reactive)', formula: 'F_{in} = P_{out} + W_{waste}' },
      { label: 'Recycle Ratio', formula: 'R = \\frac{Recycle \\, Flow}{Fresh \\, Feed \\, Flow}' },
      { label: 'Single-Pass Conversion', formula: 'X_{sp} = \\frac{Reactant \\, In \\, - \\, Reactant \\, Out}{Reactant \\, In}' },
      { label: 'Overall Conversion', formula: 'X_{overall} = \\frac{Fresh \\, Reactant \\, In \\, - \\, Product \\, Reactant \\, Out}{Fresh \\, Reactant \\, In}' }
    ],
    rules: [
      'Inerts accumulate indefinitely in recycle loops unless a purge stream is provided.',
      'Always start degree of freedom analysis at the unit with the least number of unknown boundary variables.'
    ]
  },
  energy_balance: {
    id: 'energy_balance',
    name: 'Energy Balance (Neraca Energi)',
    desc: 'Energy conservation equations accounting for enthalpy changes, heat duties, latent heat of phase transitions, and heats of chemical reactions.',
    concepts: [
      { name: 'First Law of Thermodynamics', desc: 'Energy cannot be created or destroyed. Q - W = Delta H + Delta Ek + Delta Ep.' },
      { name: 'Sensible vs Latent Heat', desc: 'Sensible heat changes temperature without phase changes. Latent heat changes phase at a constant temperature.' },
      { name: 'Heat of Reaction', desc: 'Standard enthalpy of reaction (Delta H_rxn) determines whether a reaction is exothermic (<0) or endothermic (>0).' }
    ],
    formulas: [
      { label: 'Sensible Heat Change', formula: 'Q = m \\cdot Cp \\cdot (T_2 - T_1)' },
      { label: 'Latent Heat (Phase Change)', formula: 'Q = m \\cdot \\lambda' },
      { label: 'Standard Heat of Reaction', formula: '\\Delta H_{rxn}^o = \\sum (n \\cdot \\Delta H_{f,products}^o) - \\sum (m \\cdot \\Delta H_{f,reactants}^o)' }
    ],
    rules: [
      'For high pressure steam utilities, latent heat of vaporization decreases as pressure increases.',
      'Never omit heat capacity temperature dependencies Cp(T) when integrating over temperature ranges greater than 100°C.'
    ]
  },
  thermodynamics: {
    id: 'thermodynamics',
    name: 'Thermodynamics (Termodinamika)',
    desc: 'Equations of state, phase equilibrium (VLE/LLE), chemical equilibrium constants, fugacity, and activity coefficient models (NRTL, Margules, Wilson).',
    concepts: [
      { name: 'Vapor-Liquid Equilibrium (VLE)', desc: 'Equality of temperature, pressure, and chemical potentials (fugacities) in vapor and liquid phases.' },
      { name: 'Raoult\'s Law & Non-Ideality', desc: 'Ideal: P_i = x_i * P_sat_i. Non-ideal: y_i * P = x_i * gamma_i * P_sat_i. gamma represents activity coefficients.' },
      { name: 'Azeotropes', desc: 'A point where liquid composition equals vapor composition (x_i = y_i), preventing further separation by simple distillation.' }
    ],
    formulas: [
      { label: 'Modified Raoult\'s Law', formula: 'y_i \\cdot P = x_i \\cdot \\gamma_i \\cdot P_{sat,i}(T)' },
      { label: 'Antoine Equation (Saturation P)', formula: '\\log_{10}(P_{sat}) = A - \\frac{B}{T + C}' },
      { label: 'K-value Definition', formula: 'K_i = \\frac{y_i}{x_i} = \\frac{\\gamma_i \\cdot P_{sat,i}}{P}' }
    ],
    rules: [
      'NRTL is excellent for highly non-ideal polar systems like ethanol-water.',
      'Margules and Van Laar equations are simple 1 or 2 parameter models best for low pressure systems.'
    ]
  },
  fluid_mechanics: {
    id: 'fluid_mechanics',
    name: 'Fluid Mechanics (Mekanika Fluida)',
    desc: 'Fluid flow regimes, friction head loss, piping manifold sizing, Bernoulli equation, and pump mechanics including NPSH.',
    concepts: [
      { name: 'Laminar vs Turbulent Flow', desc: 'Regime determined by Reynolds number (Re). Re < 2100 is laminar; Re > 4000 is fully turbulent.' },
      { name: 'Frictional Head Loss', desc: 'Pressure drop caused by viscous shear stress against pipe walls, calculated via Darcy-Weisbach or Fanning factors.' },
      { name: 'NPSH available', desc: 'Net Positive Suction Head available at pump inlet. Must be strictly greater than NPSH required to prevent cavitation.' }
    ],
    formulas: [
      { label: 'Reynolds Number', formula: 'Re = \\frac{\\rho \\cdot v \\cdot D}{\\mu}' },
      { label: 'Darcy-Weisbach Equation', formula: 'h_f = f \\cdot \\frac{L}{D} \\cdot \\frac{v^2}{2g}' },
      { label: 'NPSH Available', formula: 'NPSH_{avail} = P_{suction,surface} + h_{static} - h_{friction} - P_{vapor}' }
    ],
    rules: [
      'To prevent pump cavitation, keep suction lines short, vertical static head high, and pipe diameters wide to lower velocity and friction.',
      'Target water pipe velocities should be between 1.0 to 2.5 m/s to balance sizing CAPEX vs friction loss OPEX.'
    ]
  },
  heat_transfer: {
    id: 'heat_transfer',
    name: 'Heat Transfer (Perpindahan Panas)',
    desc: 'Conduction, convection, radiation, Log Mean Temperature Difference (LMTD) calculations, heat exchanger sizing, and Pinch integration.',
    concepts: [
      { name: 'Convective Heat Transfer', desc: 'Heat flux q = h * Delta T. Convective coefficient h is determined using Nusselt (Nu) empirical correlations.' },
      { name: 'LMTD Driving Force', desc: 'Logarithmic average of temperature differences at the two ends of a heat exchanger. Crucial for sizing.' },
      { name: 'Overall Heat Transfer U', desc: 'Combines hot side convection, tube wall conduction, cold side convection, and fouling resistances.' }
    ],
    formulas: [
      { label: 'Fourier Conduction Law', formula: 'q = -k \\cdot A \\cdot \\frac{dT}{dx}' },
      { label: 'Heat Duty of Heat Exchanger', formula: 'Q = U \\cdot A \\cdot LMTD \\cdot F_{correction}' },
      { label: 'LMTD (Log Mean Temp Diff)', formula: 'LMTD = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1 / \\Delta T_2)}' }
    ],
    rules: [
      'Counter-current flow maximizes LMTD and effectiveness compared to co-current configuration.',
      'Always add a fouling factor allowance ($R_f$) when designing exchangers for untreated cooling tower water.'
    ]
  },
  separation_process: {
    id: 'separation_process',
    name: 'Separation Process (Operasi Pemisahan)',
    desc: 'Binary distillation column design using McCabe-Thiele, minimum stages, gas absorption towers, and packing height calculations.',
    concepts: [
      { name: 'McCabe-Thiele Stepping', desc: 'Graphical layout using equilibrium curves, rectifying operating lines, stripping operating lines, and the feed q-line.' },
      { name: 'Reflux Ratio Constraints', desc: 'Minimum reflux ratio (R_min) requires infinite stages. Total reflux (R = infinity) requires minimum stages (N_min).' },
      { name: 'Feed Quality q', desc: 'Fraction of feed that is liquid. q = 1 (saturated liquid), q = 0 (saturated vapor), q > 1 (subcooled liquid).' }
    ],
    formulas: [
      { label: 'Fenske Equation (N_min)', formula: 'N_{min} = \\frac{\\ln(\\frac{x_D}{1-x_D} \\cdot \\frac{1-xB}{xB})}{\\ln(\\alpha_{avg})}' },
      { label: 'Rectifying Operating Line', formula: 'y = \\frac{R}{R+1} \\cdot x + \\frac{x_D}{R+1}' },
      { label: 'Feed Line (q-line)', formula: 'y = \\frac{q}{q-1} \\cdot x - \\frac{z_F}{q-1}' }
    ],
    rules: [
      'Operating reflux ratio is typically set between 1.2 to 1.5 times the minimum reflux ratio ($R = 1.2 \\, R_{min}$) for optimal economic design.',
      'Feeding a column at the correct feed stage minimizes entropy generation and reboiler duty.'
    ]
  },
  reaction_engineering: {
    id: 'reaction_engineering',
    name: 'Reaction Engineering (Kinetika & Reaktor)',
    desc: 'Chemical kinetics, rate equations, Arrhenius temperature dependance, CSTR/PFR sizing, and reactor network arrangements.',
    concepts: [
      { name: 'Reaction Rate Law', desc: 'Mathematical expression describing reaction speed. r_A = -k * Ca^n. Rate constant k increases with temperature.' },
      { name: 'CSTR Performance', desc: 'Mixed Flow Reactor. Operates at uniform composition equal to outlet concentration. Sizing: V = F_A0 * X / (-r_A).' },
      { name: 'PFR Performance', desc: 'Plug Flow Reactor. Concentration decays continuously along length. Sizing: V = integral( F_A0 / -r_A * dX ).' }
    ],
    formulas: [
      { label: 'Arrhenius Rate Equation', formula: 'k(T) = A \\cdot e^{-E_a / (R \\cdot T)}' },
      { label: 'CSTR Design Equation', formula: 'V = \\frac{F_{A0} \\cdot X}{-r_A}' },
      { label: 'PFR Design Equation', formula: 'V = F_{A0} \\int_{0}^{X} \\frac{dX}{-r_A}' }
    ],
    rules: [
      'PFR requires less volume than CSTR for any positive reaction order, as it maintains higher reactant concentration throughout.',
      'For highly exothermic reactions, CSTR offers better temperature control, whereas PFR is prone to hot-spots and thermal runway.'
    ]
  },
  process_control: {
    id: 'process_control',
    name: 'Process Control (Pengendalian Proses)',
    desc: 'Dynamic system modeling, transfer functions, stability margins, and PID tuning parameter implementations.',
    concepts: [
      { name: 'Feedback Control Loop', desc: 'Compares Process Variable (PV) with Setpoint (SP). Error is fed to PID controller to adjust control valve opening.' },
      { name: 'First Order Plus Dead Time', desc: 'FOPDT model: G(s) = K * exp(-theta*s) / (tau*s + 1). Typical representation of process dynamics.' },
      { name: 'PID Controller Equation', desc: 'Adjusts output based on proportional error, integral of past errors, and derivative rate of error change.' }
    ],
    formulas: [
      { label: 'PID Time Domain Output', formula: 'CO(t) = K_c \\left( e(t) + \\frac{1}{\\tau_I} \\int_{0}^{t} e(t)dt + \\tau_D \\frac{de(t)}{dt} \\right)' },
      { label: 'First-Order Transfer Function', formula: 'G(s) = \\frac{K_p}{\\tau \\cdot s + 1}' },
      { label: 'Cohen-Coon tuning (Kp)', formula: 'K_c = \\frac{1}{K_p} \\frac{\\tau}{\\theta} \\left( \\frac{4}{3} + \\frac{\\theta}{4\\tau} \\right)' }
    ],
    rules: [
      'Adding derivative action (D) reduces overshoot but is highly sensitive to process measurement noise.',
      'Keep integral time (tau_I) large enough to prevent loop oscillations, but small enough to eliminate steady-state offset.'
    ]
  }
}

// Procedural Practice Problems Generator
export const generatePracticeProblem = (topicId) => {
  const randRange = (min, max) => Math.random() * (max - min) + min
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

  switch (topicId) {
    case 'mass_balance': {
      const freshFeed = randInt(80, 150)
      const conversion = randRange(0.4, 0.6)
      const purgeFrac = randRange(0.04, 0.08)
      
      const singlePassC = conversion
      const freshInert = 0.01 // 1% inert in fresh feed
      // Analytical solution for purge rate and recycle ratio at steady state
      // For simplicity, let's solve recycle ratio for simple reactant conversion loop
      const recycleRatio = (1 - singlePassC) / (singlePassC * (1 - purgeFrac))
      const recycleFlow = freshFeed * recycleRatio

      return {
        question: `Suatu reaktor dioperasikan dengan loop recycle untuk mengonversi reaktan A menjadi produk B. Fresh feed yang masuk mengandung komponen A murni sebesar ${freshFeed} kg/jam. Konversi satu kali lewat (single-pass conversion) reaktan A di dalam reaktor adalah ${(singlePassC*100).toFixed(0)}%. Jika 5% dari aliran outlet reaktor dialirkan ke sistem pemisahan dan sisanya di-recycle kembali ke inlet mixer reaktor, hitunglah Laju Alir Recycle (kg/jam) pada kondisi steady-state!`,
        params: { freshFeed, conversion: singlePassC, purgeFrac: 0.05 },
        solutionData: {
          given: `Fresh Feed (F) = ${freshFeed} kg/jam\nSingle-pass conversion (X_sp) = ${(singlePassC*100).toFixed(0)}% = ${singlePassC.toFixed(2)}\nPurge Fraction (f_p) = 5% = 0.05`,
          asked: `Laju Alir Recycle (R) dalam kg/jam`,
          formula: `Neraca Massa Mixer: F + R = Feed_{reaktor}\nOutlet Reaktor = Feed_{reaktor} \\cdot (1 - X_{sp})\nRecycle R = Outlet Reaktor \\cdot (1 - f_p)\nSubstitusi: R = \\frac{F \\cdot (1 - X_{sp}) \\cdot (1 - f_p)}{1 - (1 - X_{sp}) \\cdot (1 - f_p)}`,
          solution: `1. Hitung pengali recycle:\n   Faktor = (1 - X_sp) * (1 - f_p) = (1 - ${singlePassC.toFixed(2)}) * (1 - 0.05) = ${(1-singlePassC).toFixed(2)} * 0.95 = ${((1-singlePassC)*0.95).toFixed(3)}\n2. Hitung Laju Alir Recycle:\n   R = [ ${freshFeed} * ${((1-singlePassC)*0.95).toFixed(3)} ] / [ 1 - ${((1-singlePassC)*0.95).toFixed(3)} ]\n   R = ${recycleFlow.toFixed(1)} kg/jam`,
          answer: `${recycleFlow.toFixed(1)} kg/jam`,
          interpretation: `Laju alir recycle yang tinggi (${recycleFlow.toFixed(1)} kg/jam dibandingkan fresh feed ${freshFeed} kg/jam) berguna untuk meningkatkan total konversi secara dramatis, namun berkonkuensi meningkatkan diameter pipa inlet dan beban pemanasan pre-heater reaktor.`
        }
      }
    }
    case 'fluid_mechanics': {
      const zHeight = randRange(2, 6)
      const flowRate = randRange(10, 20) // kg/s
      const friction = randRange(15, 30) // kPa
      const temp = randInt(25, 45)

      // Vapor pressure of water lookup (approximate)
      const pVap = temp === 25 ? 3.17 : temp === 35 ? 5.62 : 9.58 // kPa
      const pAtm = 101.325 // kPa
      const density = 998 // kg/m3
      const g = 9.81
      
      // NPSHa = (P_atm - P_vap)/(rho*g) + zHeight - friction_head
      const pHead = ((pAtm - pVap) * 1000) / (density * g)
      const frictionHead = (friction * 1000) / (density * g)
      const npsha = pHead - zHeight - frictionHead // assuming pump is placed above suction liquid level

      return {
        question: `Sebuah pompa sentrifugal digunakan untuk memindahkan air pada suhu ${temp}°C dari tangki terbuka ke reaktor. Elevasi permukaan air di tangki berada ${zHeight.toFixed(1)} meter di bawah garis sumbu inlet pompa. Rugi gesekan (friction loss) pada pipa isap (suction pipe) diestimasi sebesar ${friction.toFixed(1)} kPa. Tekanan uap air pada suhu tersebut adalah ${pVap.toFixed(2)} kPa. Hitunglah Net Positive Suction Head Available (NPSH Tersedia) untuk pompa tersebut dalam satuan meter air! (Gunakan Densitas = 998 kg/m³, g = 9.81 m/s², Tekanan Barometrik = 101.3 kPa)`,
        params: { temp, zHeight, friction, pVap },
        solutionData: {
          given: `Tekanan Atmosfer Tangki (P_atm) = 101.3 kPa = 101,300 Pa\nElevasi Hisap (z) = -${zHeight.toFixed(1)} m\nRugi Gesek (h_f) = ${friction.toFixed(1)} kPa = ${friction.toFixed(1)} m head\nTekanan Uap (P_vap) = ${pVap.toFixed(2)} kPa = ${pVap.toFixed(2)} Pa\nDensitas (rho) = 998 kg/m³`,
          asked: `NPSH Tersedia (NPSHa) dalam meter`,
          formula: `NPSH_a = \\frac{P_{atm} - P_{vap}}{\\rho \\cdot g} - z_{suction} - h_{friction}`,
          solution: `1. Konversi beda tekanan atmosfir & uap menjadi tinggi tekan head:\n   Head Tekan = (101,300 - ${pVap * 1000}) / (998 * 9.81) = ${(101.3 - pVap).toFixed(1)} kPa / 9.79 = ${pHead.toFixed(2)} meter\n2. Konversi friction loss menjadi tinggi tekan friction:\n   Head Gesek = ${friction * 1000} / (998 * 9.81) = ${frictionHead.toFixed(2)} meter\n3. Hitung NPSHa:\n   NPSHa = ${pHead.toFixed(2)} m - ${zHeight.toFixed(1)} m - ${frictionHead.toFixed(2)} m = ${npsha.toFixed(2)} meter`,
          answer: `${npsha.toFixed(2)} m`,
          interpretation: `NPSH Tersedia sebesar ${npsha.toFixed(2)} meter air merupakan batas aman suction. Jika pompa membutuhkan NPSH Required sebesar 3.0 m, maka desain ini aman dari kavitasi (NPSHa > NPSHr).`
        }
      }
    }
    case 'reaction_engineering': {
      const feed = randInt(4, 10) // mol/s
      const Ca0 = randInt(100, 300) // mol/m3
      const k = randRange(0.01, 0.03) // 1/s
      const conversion = randRange(0.75, 0.85)

      // V = F_A0 / k * ln(1 / (1-X)) for first order PFR
      const V_pfr = (feed / k) * Math.log(1 / (1 - conversion))
      
      return {
        question: `Reaksi orde satu fase cair A -> B berlangsung secara isotermal di dalam Plug Flow Reactor (PFR). Laju alir umpan reaktan A (F_A0) murni adalah ${feed} mol/detik dengan konsentrasi umpan awal C_A0 = ${Ca0} mol/m³. Konstanta laju reaksi (k) bernilai ${k.toFixed(3)} s⁻¹. Jika target konversi reaktan A keluar reaktor ditetapkan sebesar ${(conversion*100).toFixed(0)}%, tentukan volume reaktor PFR (m³) yang dibutuhkan!`,
        params: { feed, Ca0, k, conversion },
        solutionData: {
          given: `Laju Alir Umpan (F_A0) = ${feed} mol/s\nKonsentrasi Umpan (C_A0) = ${Ca0} mol/m³\nKonstanta Laju Reaksi (k) = ${k.toFixed(3)} s⁻¹\nKonversi Target (X) = ${(conversion*100).toFixed(0)}% = ${conversion.toFixed(2)}`,
          asked: `Volume reaktor PFR (V) dalam m³`,
          formula: `Design Equation PFR Orde 1 Isothermal: V = F_{A0} \\int_{0}^{X} \\frac{dX}{k \\cdot C_A}\nKarena C_A = C_{A0}(1-X) dan F_{A0} = v_0 \\cdot C_{A0}:\nV = \\frac{F_{A0}}{k} \\ln\\left(\\frac{1}{1-X}\\right)`,
          solution: `1. Hitung suku logaritma konversi:\n   ln(1 / (1 - X)) = ln(1 / (1 - ${conversion.toFixed(2)})) = ln(1 / ${(1-conversion).toFixed(2)}) = ${Math.log(1 / (1-conversion)).toFixed(3)}\n2. Hitung volume PFR:\n   V = (${feed} / ${k.toFixed(3)}) * ${Math.log(1 / (1-conversion)).toFixed(3)} = ${(feed/k).toFixed(0)} * ${Math.log(1 / (1-conversion)).toFixed(3)}\n   V = ${V_pfr.toFixed(1)} m³`,
          answer: `${V_pfr.toFixed(1)} m³`,
          interpretation: `Reaktor PFR membutuhkan volume ${V_pfr.toFixed(1)} m³ untuk mengolah umpan ${feed} mol/s. Jika kita menggunakan CSTR untuk target konversi yang sama, volume yang dibutuhkan akan jauh lebih besar karena konsentrasi reaktan di CSTR seragam pada tingkat outlet yang rendah.`
        }
      }
    }
    case 'heat_transfer': {
      const thi = randInt(130, 160)
      const tho = randInt(80, 100)
      const tci = randInt(25, 30)
      const tco = randInt(45, 60)
      const U = randInt(200, 350)
      const flowHot = randRange(2.0, 5.0)

      // Heat transfer LMTD counter-current
      const dt1 = thi - tco
      const dt2 = tho - tci
      const lmtd = (dt1 - dt2) / Math.log(dt1 / dt2)

      // Q = m * cp * dt (assume hot fluid Cp = 2.2 kJ/kg C, typical oil)
      const cp = 2.2
      const Q = flowHot * cp * (thi - tho) // kW
      
      // Area = Q / (U/1000 * LMTD)
      const A = Q / ((U / 1000) * lmtd)

      return {
        question: `Sebuah alat penukar panas pipa ganda (double-pipe heat exchanger) aliran berlawanan arah (counter-current) dirancang untuk mendinginkan minyak proses dari ${thi}°C menjadi ${tho}°C dengan laju alir ${flowHot.toFixed(1)} kg/s (Cp = ${cp} kJ/kg·°C). Air pendingin masuk pada suhu ${tci}°C dan keluar pada suhu ${tco}°C. Koefisien perpindahan panas menyeluruh (overall heat transfer coefficient, U) alat tersebut diestimasi sebesar ${U} W/m²·°C. Hitunglah luas permukaan perpindahan panas (Area, m²) yang diperlukan!`,
        params: { thi, tho, tci, tco, U, flowHot },
        solutionData: {
          given: `Suhu Minyak Masuk (T_h,in) = ${thi}°C\nSuhu Minyak Keluar (T_h,out) = ${tho}°C\nLaju Alir Minyak (m_h) = ${flowHot.toFixed(1)} kg/s (Cp = ${cp} kJ/kg·°C)\nSuhu Air Masuk (T_c,in) = ${tci}°C\nSuhu Air Keluar (T_c,out) = ${tco}°C\nKoefisien Overall (U) = ${U} W/m²·°C`,
          asked: `Luas Permukaan Perpindahan Panas (A) dalam m²`,
          formula: `Beban Panas (Q) = m_h \\cdot Cp \\cdot (T_{h,in} - T_{h,out})\nDriving Force (LMTD) = \\frac{\\Delta T_1 - \\Delta T_2}{\\ln(\\Delta T_1 / \\Delta T_2)}\nLuas Area (A) = \\frac{Q}{U \\cdot LMTD}`,
          solution: `1. Hitung Beban Panas Q:\n   Q = ${flowHot.toFixed(1)} kg/s * ${cp} kJ/kg·°C * (${thi} - ${tho})°C = ${(flowHot*cp).toFixed(2)} * ${thi-tho} = ${Q.toFixed(1)} kW\n2. Hitung LMTD untuk counter-current:\n   dT_1 = ${thi} - ${tco} = ${dt1}°C\n   dT_2 = ${tho} - ${tci} = ${dt2}°C\n   LMTD = (${dt1} - ${dt2}) / ln(${dt1} / ${dt2}) = ${lmtd.toFixed(2)}°C\n3. Hitung Luas Area A:\n   A = ${Q.toFixed(1)} kW / [ (${U}/1000 kW/m²·°C) * ${lmtd.toFixed(2)}°C ]\n   A = ${A.toFixed(2)} m²`,
          answer: `${A.toFixed(2)} m²`,
          interpretation: `Luas area perpindahan panas yang dibutuhkan adalah ${A.toFixed(2)} m². Jika koefisien overall U meningkat (misalnya karena laju alir bertambah cepat atau pembersihan pipa), maka kebutuhan area pemisah fisik akan menurun.`
        }
      }
    }
    default: {
      return {
        question: "Study material has been generated. Ask Jarvis to build custom questions for other topics!",
        params: {},
        solutionData: {
          given: "Syllabus active",
          asked: "Help Devan sizing chemical plant",
          formula: "Terra Nova Engine Solver active",
          solution: "Ready",
          answer: "Success",
          interpretation: "Select specific topic above."
        }
      }
    }
  }
}
