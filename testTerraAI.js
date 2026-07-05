import { TerraAIEngine } from './src/core/terraAI/index.js';

const engine = new TerraAIEngine('devan_test');

console.log("=== EXECUTING HEADLESS PIPELINE TEST ===");
console.log("Input: 'I am so stressed, I don't understand how reflux affects distillation purity.'\n");

const result = engine.processInput("I am so stressed, I don't understand how reflux affects distillation purity.", { activeProject: 'Methanol Tower Design' });

console.log("1. DETECTED INTENT:");
console.log("  ", result.detectedIntent);

console.log("\n2. EMOTION CORE STATE:");
console.log("   Stress:", result.emotionState.stress, "%");
console.log("   Confusion:", result.emotionState.confusion, "%");
console.log("   Empathy Target:", result.emotionState.empathyLevel);

console.log("\n3. LOGIC REASONING LOG:");
result.logicLog.forEach(log => console.log("  ", log));

console.log("\n4. FINAL SYNTHESIZED SYSTEM PROMPT (For LLM):");
console.log("-------------------------------------------------");
console.log(result.finalSystemPrompt);
console.log("-------------------------------------------------");

console.log("\nHeadless pipeline successfully validated.");
