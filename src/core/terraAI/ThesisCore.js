/**
 * ═══════════════════════════════════════════════════════════════
 *  TERRA AI: THESIS CORE ENGINE
 *  Handles local thesis ideation seed lists, scoring criteria,
 *  topic analysis, proposal templates, and defense panel coordinate states.
 * ═══════════════════════════════════════════════════════════════
 */

export class ThesisCore {
  constructor() {
    // Seed ideas for the Ideation Engine
    this.seedIdeas = [
      {
        id: 'idea-1',
        title: 'Optimasi Konsumsi Energi Kolom Distilasi Dinding Pembagi (Dividing-Wall Column) pada Pemisahan Campuran Terner',
        domain: 'Process Optimization',
        novelty: 4,
        feasibility: 3,
        difficulty: 4,
        relevance: 5,
        description: 'Mendesain ulang kolom distilasi konvensional menjadi dividing-wall column untuk memisahkan campuran hidrokarbon terner dengan penghematan energi mencapai 30%.',
        gap: 'Studi komparasi efisiensi termodinamika pada laju alir umpan fluktuatif.'
      },
      {
        id: 'idea-2',
        title: 'Adsorpsi Logam Berat (Cr+6, Pb+2) dari Limbah Industri Elektroplating Menggunakan Biochar Berbasis Ampas Tebu Teraktivasi KOH',
        domain: 'Adsorption Systems',
        novelty: 3,
        feasibility: 5,
        difficulty: 2,
        relevance: 4,
        description: 'Pemanfaatan ampas tebu lokal menjadi biochar aktif sebagai adsorben murah untuk mereduksi kontaminasi logam berat dengan target efisiensi > 95%.',
        gap: 'Kinetika desorpsi dan siklus regenerasi adsorben untuk penggunaan skala kontinu.'
      },
      {
        id: 'idea-3',
        title: 'Sintesis Biodiesel dari Minyak Jelantah Menggunakan Katalis Heterogen Kalsium Oksida (CaO) Berbahan Cangkang Kerang Darah',
        domain: 'Biodiesel / Catalysis',
        novelty: 3,
        feasibility: 4,
        difficulty: 3,
        relevance: 4,
        description: 'Produksi biodiesel dari feedstock murah dengan katalis heterogen ramah lingkungan yang disintesis dari limbah padat cangkang kerang.',
        gap: 'Stabilitas termal katalis terhadap kontaminasi asam lemak bebas tinggi.'
      },
      {
        id: 'idea-4',
        title: 'Pemisahan Gas CO2 dari Gas Alam Menggunakan Membran Matriks Campuran (MMM) Berbasis Polimer/Zeolit Zeolitic Imidazolate Framework (ZIF-8)',
        domain: 'Membrane Separation',
        novelty: 5,
        feasibility: 3,
        difficulty: 5,
        relevance: 5,
        description: 'Fabrikasi membran tipis komposit untuk menyaring gas CO2 dengan selektivitas tinggi guna memenuhi standar gas pipa industri.',
        gap: 'Mengatasi masalah plasticization membran pada tekanan operasi tinggi (>30 bar).'
      },
      {
        id: 'idea-5',
        title: 'Pengolahan Air Limbah Tekstil Menggunakan Reaktor Ozonasi Katalitis Berbasis Katalis TiO2 Tersangga Karbon Aktif',
        domain: 'Wastewater Treatment',
        novelty: 4,
        feasibility: 4,
        difficulty: 3,
        relevance: 5,
        description: 'Penerapan Advanced Oxidation Processes (AOPs) untuk mendegradasi zat warna azo yang sulit diurai secara biologis.',
        gap: 'Optimasi konsumsi energi pembangkitan ozon per meter kubik limbah terolah.'
      },
      {
        id: 'idea-6',
        title: 'Penerapan Deep Learning (Artificial Neural Network) untuk Prediksi Keseimbangan Uap-Cair (VLE) Campuran Multikomponen Non-Ideal',
        domain: 'AI for Chemical Engineering',
        novelty: 5,
        feasibility: 4,
        difficulty: 4,
        relevance: 4,
        description: 'Menggantikan persamaan keadaan termodinamika kompleks (seperti UNIFAC/NRTL) dengan model machine learning cepat untuk simulasi proses real-time.',
        gap: 'Generalisasi model ANN pada kondisi mendekati titik kritis campuran gas.'
      }
    ];
  }

  /**
   * Returns list of pre-seeded thesis ideas grouped by category
   */
  getSeedIdeas() {
    return this.seedIdeas;
  }

  /**
   * Locally evaluates a topic proposal before passing to Gemini for critical detailing
   */
  localEvaluateTopic(topic) {
    const text = topic.toLowerCase();
    let score = 50; // Starter score
    const feedbacks = [];
    
    // Check length / specific details
    if (topic.length < 20) {
      score -= 20;
      feedbacks.push("Judul terlalu pendek dan tidak deskriptif.");
    }
    
    // Check for broad terms
    const broadKeywords = ['pengolahan air', 'distilasi', 'adsorpsi', 'biodiesel', 'produksi', 'studi'];
    let broadCount = 0;
    broadKeywords.forEach(kw => {
      if (text.includes(kw)) broadCount++;
    });

    // Check for specific methodologies or materials
    const specificKeywords = ['menggunakan', 'berbasis', 'dengan metode', 'dengan bantuan', 'optimasi', 'kinetika', 'variasi'];
    let specificCount = 0;
    specificKeywords.forEach(kw => {
      if (text.includes(kw)) specificCount++;
    });

    if (broadCount > 1 && specificCount === 0) {
      score -= 15;
      feedbacks.push("Topik terlalu umum (generic). Tambahkan batasan sistem, bahan baku spesifik, atau metode yang digunakan.");
    }

    if (specificCount > 0) {
      score += 15;
      feedbacks.push("Bagus. Judul mengandung deskripsi metodologi/alat/bahan baku yang spesifik.");
    }

    // Check for chemical engineering elements
    const chemEngTerms = ['katalis', 'reaktor', 'membran', 'adsorb', 'distilasi', 'ekstraksi', 'kinetika', 'termodinamika', 'efisiensi', 'simulasi', 'optimasi', 'hambatan', 'neraca'];
    let hasChemEngTerm = chemEngTerms.some(term => text.includes(term));
    if (!hasChemEngTerm) {
      score -= 20;
      feedbacks.push("Kandungan Chemical Engineering lemah. Pastikan topik berfokus pada perpindahan massa/panas, kinetika reaksi, termodinamika, atau kontrol proses.");
    } else {
      score += 10;
    }

    score = Math.min(95, Math.max(10, score));

    return {
      score,
      novelty: Math.round(score * 0.8 / 20), // 1 to 5
      feasibility: Math.round((100 - score) * 0.4 / 20) + 3,
      critiques: feedbacks
    };
  }

  /**
   * Builds structural skeleton draft for a chosen title
   */
  generateProposalTemplate(title) {
    return {
      title: title,
      background: `### 1. Latar Belakang
Tuliskan urgensi dari judul "${title}". 
- Mengapa topik ini penting dibahas saat ini?
- Apa masalah industri atau lingkungan yang ingin diselesaikan?
- Tunjukkan referensi literatur awal (minimal 3 jurnal utama).`,
      problemStatement: `### 2. Rumusan Masalah
Definisikan dengan jelas batas masalah:
- Apa batasan penelitian ini?
- Mengapa metode konvensional tidak menyelesaikan masalah tersebut?
- Apa hipotesis awal Anda mengenai pengaruh variabel bebas terhadap variabel terikat?`,
      objectives: `### 3. Tujuan Penelitian
1. Menganalisis efisiensi proses pemisahan/reaksi...
2. Mempelajari pengaruh variabel temperatur, tekanan, dan rasio umpan terhadap...
3. Memodelkan kurva kinetika atau kesetimbangan termodinamika sistem...`,
      methodology: `### 4. Metodologi Penelitian
- **Bahan & Alat:** (Sebutkan reaktan, pelarut, adsorben, tipe membran, atau modul reaktor)
- **Variabel Penelitian:**
  - Variabel Tetap: Laju alir, konsentrasi katalis...
  - Variabel Bebas: Temperatur (30, 45, 60 C), waktu kontak...
  - Variabel Terikat: Yield biodiesel, efisiensi adsorpsi...
- **Prosedur Percobaan:** (Gambarkan diagram alir proses secara singkat)
- **Metode Analisis:** (GC-MS, FTIR, SEM, XRD, HPLC)`
    };
  }
}
