/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: EMOTION ENGINE
 *  Detects user sentiment and adjusts AI empathy levels.
 * ═══════════════════════════════════════════════════════════════
 */

export class EmotionEngine {
  constructor() {
    this.stressWords = ['stress', 'tired', 'exhausted', 'burnout', 'pusing', 'capek', 'lelah', 'overwhelmed'];
    this.confusionWords = ['confused', 'dont understand', 'hard', 'difficult', 'bingung', 'sulit', 'tidak paham'];
  }

  analyzeEmotion(text, currentStress, currentConfusion) {
    const input = text.toLowerCase();
    let stressDelta = 0;
    let confusionDelta = 0;

    this.stressWords.forEach(w => {
      if (input.includes(w)) stressDelta += 15;
    });

    this.confusionWords.forEach(w => {
      if (input.includes(w)) confusionDelta += 15;
    });

    // Natural decay if no negative words found
    if (stressDelta === 0) stressDelta = -5;
    if (confusionDelta === 0) confusionDelta = -5;

    const newStress = Math.min(100, Math.max(0, currentStress + stressDelta));
    const newConfusion = Math.min(100, Math.max(0, currentConfusion + confusionDelta));

    let empathyLevel = "Supportive and Analytical";
    if (newStress > 70) {
      empathyLevel = "High Empathy & Stress Reduction (Concise, Encouraging)";
    } else if (newConfusion > 70) {
      empathyLevel = "Highly Educational (Slower pace, more analogies)";
    } else if (newStress < 30 && newConfusion < 30) {
      empathyLevel = "Professional & Rigorous (Standard Engineering)";
    }

    return {
      stress: newStress,
      confusion: newConfusion,
      empathyLevel: empathyLevel
    };
  }
}
