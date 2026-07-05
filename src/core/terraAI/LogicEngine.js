/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: LOGIC ENGINE
 *  Forces Chain-of-Thought (CoT) reasoning based on Chemical Engineering principles.
 * ═══════════════════════════════════════════════════════════════
 */
import { findRelatedConcepts } from '../../data/knowledgeGraph/chemEngOntology.js';

export class LogicEngine {
  constructor(knowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph; // Can be a local JSON or API hook
  }

  reason(intentObj, context) {
    const log = [];
    log.push(`[LOGIC CORE] Analyzing Intent: ${intentObj.intent}`);

    let reasoningOutput = "";
    
    if (intentObj.intent === 'ACADEMIC') {
      log.push(`[LOGIC CORE] Extracting concepts from input...`);
      // Mock extraction
      const extractedConcept = "reflux"; 
      const relatedPaths = findRelatedConcepts(extractedConcept);
      
      log.push(`[LOGIC CORE] Found related ontology paths: ${relatedPaths.join(', ')}`);
      
      // We simulate extracting sources here based on the concept
      const sources = ["Separation Process Principles (Seader, Henley)", "Unit Operations of Chemical Engineering (McCabe, Smith, Harriott)"];
      
      reasoningOutput = `Reasoning Path:\n1. User asks about ${extractedConcept}.\n2. Linked to Separation Processes.\n3. Rule: Reflux ratio increases separation purity but raises reboiler duty.\n4. Formulate explanation based on mass transfer efficiency.\n5. Cite sources: ${sources.join(', ')}`;
    } 
    else if (intentObj.intent === 'ENGINEER') {
      log.push(`[LOGIC CORE] Analyzing PFD Flowsheet Context...`);
      if (context && context.flowsheetAlerts > 0) {
        reasoningOutput = `Reasoning Path:\n1. Detected flowsheet alerts: ${context.flowsheetAlerts}.\n2. Evaluate troubleshooting steps based on Perry's Handbook heuristics.\n3. Recommend specific parameter patches (Action Core).`;
      } else {
        reasoningOutput = `Reasoning Path:\n1. Flowsheet is stable.\n2. User asks for optimization.\n3. Suggest Pinch Analysis (Towler, Sinnott) or CAPEX review.`;
      }
    }
    else {
      reasoningOutput = "Reasoning Path:\nStandard conversational processing. Emphasize empathetic Indonesian ChemEng Professor persona. Use 'Coba kita bedah bareng-bareng' framework.";
    }

    return {
      reasoningLog: log,
      reasoningChain: reasoningOutput
    };
  }
}
