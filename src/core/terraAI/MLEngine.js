/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: ML ENGINE (Machine Learning Core)
 *  Tracks user learning curves and identifies weaknesses.
 * ═══════════════════════════════════════════════════════════════
 */

export class MLEngine {
  constructor() {
    this.topics = [
      'mass_balance', 'energy_balance', 'thermodynamics', 'fluid_mechanics',
      'heat_transfer', 'separation_process', 'reaction_engineering', 'process_control'
    ];
  }

  updateMastery(currentMastery, topic, isSuccess) {
    const newMastery = { ...currentMastery };
    if (!newMastery[topic]) return newMastery;

    const delta = isSuccess ? 5 : -2; // Gain on success, slight decay on failure
    newMastery[topic] = Math.min(100, Math.max(0, newMastery[topic] + delta));

    return newMastery;
  }

  identifyWeaknesses(masteryData) {
    const weaknesses = [];
    for (const [topic, score] of Object.entries(masteryData)) {
      if (score < 50) {
        weaknesses.push(topic);
      }
    }
    // Sort by lowest score first
    weaknesses.sort((a, b) => masteryData[a] - masteryData[b]);
    return weaknesses;
  }

  generateStudyRecommendation(masteryData) {
    const weaknesses = this.identifyWeaknesses(masteryData);
    if (weaknesses.length === 0) return "Mastery levels are optimal. Prof: 'Bagus sekali, pondasi kamu sudah solid. Kita bisa lanjut ke desain pabrik kompleks.'";
    
    const primaryWeakness = weaknesses[0].replace('_', ' ');
    
    return `[ML ADAPTATION]
Target Area: ${primaryWeakness.toUpperCase()}
Recommendation Strategy:
1. Simplify concepts using real-world analogies (e.g. coffee making for extraction).
2. Professor's Advice: 'Gini, skor kamu di ${primaryWeakness} masih di bawah rata-rata. Jangan panik. Coba kita bedah ulang konsep dasarnya pelan-pelan. Saya sarankan kita kerjakan 2 soal latihan dasar sebelum lanjut ke simulasi PFD.'`;
  }
}
