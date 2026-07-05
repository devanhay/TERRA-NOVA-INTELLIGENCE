/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: INTENT ENGINE
 *  Parses raw user input to determine the core intent and active mode.
 * ═══════════════════════════════════════════════════════════════
 */

export class IntentEngine {
  constructor() {
    // Keywords for General Core Modes
    this.generalCategories = {
      STUDY: ['what is', 'explain', 'how does', 'concept', 'theory', 'define', 'tutor', 'learn', 'kuliah', 'materi'],
      SOLVE: ['calculate', 'solve', 'find the value', 'equation', 'compute', 'hitung', 'rumus', 'cari nilai'],
      LOGIC: ['logic', 'why', 'proof', 'derivation', 'reasoning', 'pembuktian', 'logika', 'kenapa', 'analisis'],
      PLANT: ['troubleshoot', 'fix', 'error', 'design', 'optimize', 'flowsheet', 'pfd', 'pump', 'distillation', 'reactor', 'pabrik', 'simulasi'],
      RESEARCH: ['papers', 'literature', 'journal', 'study on', 'research', 'jurnal', 'artikel ilmiah', 'bacaan'],
      COMPANION: ['stress', 'tired', 'help me', 'guide', 'motivation', 'burnout', 'capek', 'lelah', 'pusing']
    };

    // Keywords for Thesis Core Modes
    this.thesisCategories = {
      THESIS_IDEATION: ['thesis idea', 'ideation', 'topics for thesis', 'generate thesis', 'ide judul', 'ide skripsi', 'topik skripsi'],
      THESIS_EVALUATION: ['evaluate topic', 'assess topic', 'my topic is', 'is this topic good', 'evaluasi judul', 'evaluasi topik'],
      THESIS_PROPOSAL: ['proposal', 'background statement', 'objectives', 'problem statement', 'hypotheses', 'methodology', 'latar belakang', 'rumusan masalah', 'tujuan penelitian'],
      THESIS_LITERATURE: ['literature gap', 'research gap', 'novelty check', 'methodology gap', 'celah penelitian', 'novelty', 'kebaruan'],
      THESIS_CRITIC: ['critic writing', 'critique draft', 'review my paragraph', 'grammar check', 'academic writing', 'kritik tulisan', 'tinjau paragraf'],
      THESIS_DEFENSE: ['defense', 'mock defense', 'simulate defense', 'question me', 'defense mode', 'sidang', 'simulasi sidang', 'pertanyaan sidang']
    };
  }

  detectIntent(userInput, forceCore = null, forceMode = null) {
    const input = userInput.toLowerCase();
    
    // Explicit override from user interface selection
    if (forceMode) {
      const isThesis = forceMode.startsWith('THESIS_') || forceMode === 'SUPERVISOR';
      return {
        core: isThesis ? 'THESIS' : 'GENERAL',
        mode: forceMode,
        confidence: 1.0,
        originalText: userInput
      };
    }

    if (forceCore === 'THESIS') {
      // Find matches specifically inside thesis categories
      let detectedMode = 'SUPERVISOR'; // Default fallback inside Thesis
      let maxMatch = 0;
      for (const [mode, keywords] of Object.entries(this.thesisCategories)) {
        const matchCount = keywords.filter(kw => input.includes(kw)).length;
        if (matchCount > maxMatch) {
          maxMatch = matchCount;
          detectedMode = mode;
        }
      }
      return {
        core: 'THESIS',
        mode: detectedMode,
        confidence: maxMatch > 0 ? 0.85 : 0.5,
        originalText: userInput
      };
    }

    // Default: Check matches across both categories
    let detectedCore = 'GENERAL';
    let detectedMode = 'STUDY';
    let maxMatch = 0;

    // Check General categories
    for (const [mode, keywords] of Object.entries(this.generalCategories)) {
      const matchCount = keywords.filter(kw => input.includes(kw)).length;
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        detectedCore = 'GENERAL';
        detectedMode = mode;
      }
    }

    // Check Thesis categories
    for (const [mode, keywords] of Object.entries(this.thesisCategories)) {
      const matchCount = keywords.filter(kw => input.includes(kw)).length;
      if (matchCount > maxMatch) {
        maxMatch = matchCount;
        detectedCore = 'THESIS';
        detectedMode = mode;
      }
    }

    // Handshake fallback: check if user is mentioning 'thesis' or 'skripsi' without specific submode
    if (maxMatch === 0 && (input.includes('thesis') || input.includes('skripsi') || input.includes('dosen pembimbing'))) {
      detectedCore = 'THESIS';
      detectedMode = 'SUPERVISOR'; // Professor general chat
      maxMatch = 1;
    } else if (maxMatch === 0) {
      // Default general chat
      detectedCore = 'GENERAL';
      detectedMode = 'STUDY';
    }

    return {
      core: detectedCore,
      mode: detectedMode,
      confidence: maxMatch > 0 ? 0.8 : 0.4,
      originalText: userInput
    };
  }
}
