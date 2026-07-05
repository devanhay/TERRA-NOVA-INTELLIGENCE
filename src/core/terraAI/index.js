/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: MAIN PIPELINE ORCHESTRATOR
 *  The core intelligence engine orchestrating inputs, logic context,
 *  memory search, and dual-core routing (General vs Thesis).
 * ═══════════════════════════════════════════════════════════════
 */

import { IntentEngine } from './IntentEngine.js';
import { LogicEngine } from './LogicEngine.js';
import { EmotionEngine } from './EmotionEngine.js';
import { MLEngine } from './MLEngine.js';
import { LanguageEngine } from './LanguageEngine.js';
import { MemoryEngine } from './MemoryEngine.js';
import { ThesisCore } from './ThesisCore.js';
import { ChemEngOntology } from '../../data/knowledgeGraph/chemEngOntology.js';

export class TerraAIEngine {
  constructor(userId = 'default_user') {
    this.userId = userId;
    
    // Initialize Cores
    this.intentCore = new IntentEngine();
    this.logicCore = new LogicEngine(ChemEngOntology);
    this.emotionCore = new EmotionEngine();
    this.mlCore = new MLEngine();
    this.languageCore = new LanguageEngine();
    this.memoryCore = new MemoryEngine();
    this.thesisCore = new ThesisCore();

    // Session State
    this.currentStress = 30;
    this.currentConfusion = 20;
    
    // Initialize Memory
    this.memoryCore.loadMemories(this.userId);
  }

  /**
   * The Cognitive Pipeline Execution
   */
  processInput(userInput, workspaceContext = {}) {
    const pipelineLog = [];
    
    const forceCore = workspaceContext.forceCore || null;
    const forceMode = workspaceContext.forceMode || null;

    // 1. INTENT DETECTION & CORE ROUTING
    pipelineLog.push("Executing [IntentEngine] Core Router...");
    const routingResult = this.intentCore.detectIntent(userInput, forceCore, forceMode);
    pipelineLog.push(`[Core Router] Active Core: ${routingResult.core} | Mode: ${routingResult.mode}`);

    // 2. MEMORY RETRIEVAL
    pipelineLog.push("Executing [MemoryEngine] long-term lookup...");
    const memoryContext = this.memoryCore.getRelevantContext(userInput);

    // 3. KNOWLEDGE & LOGIC REASONING
    pipelineLog.push("Executing [LogicEngine] ontology mapping...");
    // Translate old intent categories to general logic paths
    const logicIntentObj = { intent: routingResult.core === 'THESIS' ? 'ACADEMIC' : routingResult.mode };
    const logicOutput = this.logicCore.reason(logicIntentObj, workspaceContext);

    // 4. ML ENGINE (Adaptation)
    pipelineLog.push("Executing [MLEngine] cognitive analytics...");
    const currentMastery = workspaceContext.masteryData || { mass_balance: 40, thermodynamics: 60 };
    const mlRecommendations = this.mlCore.generateStudyRecommendation(currentMastery);

    // 5. EMOTION ENGINE
    pipelineLog.push("Executing [EmotionEngine] sentiment analysis...");
    const emotionState = this.emotionCore.analyzeEmotion(userInput, this.currentStress, this.currentConfusion);
    this.currentStress = emotionState.stress;
    this.currentConfusion = emotionState.confusion;

    // 6. WORKSPACE EXTRA CONTEXT INJECTION (PFD, Calc, Distill)
    pipelineLog.push("Injecting live ChemPilot workspace telemetry...");
    const extraContext = {};
    if (workspaceContext.activeTab) {
      extraContext.activeTab = workspaceContext.activeTab;
    }
    if (workspaceContext.pfd) {
      extraContext.pfdSummary = {
        nodeCount: workspaceContext.pfd.nodes?.length || 0,
        streamCount: workspaceContext.pfd.streams?.length || 0,
        equipmentTags: workspaceContext.pfd.nodes?.map(n => n.tag) || []
      };
    }
    if (workspaceContext.calc) {
      extraContext.activeCalculation = workspaceContext.calc;
    }
    if (workspaceContext.distill) {
      extraContext.distillationDesign = {
        preset: workspaceContext.distill.activePreset,
        refluxRatio: workspaceContext.distill.refluxRatio
      };
    }

    // 7. LANGUAGE ENGINE (System Prompt Generation)
    pipelineLog.push("Executing [LanguageEngine] compiling instructions...");
    const systemPrompt = this.languageCore.constructSystemPrompt({
      core: routingResult.core,
      mode: routingResult.mode,
      reasoningChain: logicOutput.reasoningChain,
      emotionState: emotionState,
      activeProject: workspaceContext.activeProject,
      mlRecommendations: mlRecommendations,
      memoryContext: memoryContext,
      extraContext: Object.keys(extraContext).length > 0 ? extraContext : null
    });

    pipelineLog.push("Cognitive pipeline complete. Dispatching to Gemini neural network.");

    // Return the final orchestrated payload
    return {
      finalSystemPrompt: systemPrompt,
      detectedCore: routingResult.core,
      detectedMode: routingResult.mode,
      logicLog: logicOutput.reasoningLog,
      emotionState: emotionState,
      pipelineLog: pipelineLog,
      userMessage: userInput
    };
  }

  /**
   * Generates a targeted system prompt for real-time flowsheet diagnostic audits.
   */
  generateCoPilotPrompt(pfdData) {
    const nodesSummary = pfdData.nodes?.map(n => {
      const resultsText = n.results?.map(r => `${r.label}: ${r.val}`).join(", ") || "No simulation results yet";
      return `- Equipment ${n.tag} (${n.label}, type: ${n.type}): ${resultsText}`;
    }).join("\n") || "No equipment added yet.";

    const streamsSummary = pfdData.streams?.map(s => {
      const flowText = s.data?.flow != null ? `Flow: ${s.data.flow} kg/s, Temp: ${s.data.temp} C, Press: ${s.data.press} kPa` : "Not calculated";
      return `- Stream ${s.id} (from ${s.from} to ${s.to}): ${flowText}`;
    }).join("\n") || "No streams added yet.";

    const systemPrompt = `You are the TERRA AI Real-Time Co-Pilot inside ChemPilot OS.
Your task is to analyze the user's active chemical process flowsheet (PFD) and provide a concise, expert diagnostic check or warning.

Active Flowsheet Data:
${nodesSummary}

Active Stream Data:
${streamsSummary}

Audit rules to watch:
1. Pump cavitation: check if NPSH available is below NPSH required.
2. Reactor thermal runaway: check if adiabatic temperature rise (exothermic) exceeds 50 degrees C.
3. Distillation column efficiency: check if reflux ratio is extremely high (>3 times Rmin).
4. Compressor metallurgical limits: check if outlet temperature exceeds 200 degrees C.
5. Inefficiencies: identify high utility duties or material balance discrepancies.

Response Constraints:
- Be brutally honest, direct, and academic.
- Keep your response extremely concise (maximum 3 sentences).
- Write in a natural "Indo-English" mix (typical of Indonesian chemical engineering students: use terms like "lo", "reflux ratio-nya", "utility cost-nya").
- Focus ONLY on the single most critical issue or optimization opportunity you detect. If everything is optimal, say so in a cool, supportive way.`;

    return {
      systemPrompt,
      userPrompt: "Audit dan berikan analisis singkat satu baris dari update flowsheet terbaru saya."
    };
  }
}
