import React, { useState } from 'react';
import { ThesisCore } from '../../../core/terraAI/ThesisCore.js';
import { UserCheck, Cpu, Calculator, GraduationCap, Play, Square, Copy, Check, FileText } from 'lucide-react';

const thesisCore = new ThesisCore();

const ThesisWorkspace = ({ onSendMessage, messages, isProcessing, activeSubMode, setActiveSubMode, appContext, activeProjectId }) => {
  const pfd = appContext?.pfd;
  const [ideationList] = useState(thesisCore.getSeedIdeas());
  // Dynamic state syncing per project
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [methodologyLang, setMethodologyLang] = useState('id');
  
  // Topic Evaluation States
  const [userTopic, setUserTopic] = useState('');
  const [evalResult, setEvalResult] = useState(null);

  // Proposal Builder States (with project persistence)
  const [proposalData, setProposalData] = useState(() => {
    const saved = localStorage.getItem(`chempilot_thesis_proposal_${activeProjectId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      title: '',
      background: '',
      problemStatement: '',
      objectives: '',
      methodology: ''
    };
  });
  const [proposalStatus, setProposalStatus] = useState('');

  // Lit Analysis States
  const [litText, setLitText] = useState('');

  // Defense Mode States
  const [defenseActive, setDefenseActive] = useState(false);

  // Supervisor Progress Checklist States (with project persistence)
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`chempilot_thesis_checklist_${activeProjectId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      title: false,
      background: false,
      literature: false,
      methodology: false,
      massBalance: false,
      economics: false
    };
  });

  // Reload states when project switches
  React.useEffect(() => {
    const savedProposal = localStorage.getItem(`chempilot_thesis_proposal_${activeProjectId}`);
    if (savedProposal) {
      try { setProposalData(JSON.parse(savedProposal)); } catch (e) {}
    } else {
      setProposalData({
        title: '',
        background: '',
        problemStatement: '',
        objectives: '',
        methodology: ''
      });
    }

    const savedChecklist = localStorage.getItem(`chempilot_thesis_checklist_${activeProjectId}`);
    if (savedChecklist) {
      try { setChecklist(JSON.parse(savedChecklist)); } catch (e) {}
    } else {
      setChecklist({
        title: false,
        background: false,
        literature: false,
        methodology: false,
        massBalance: false,
        economics: false
      });
    }
    
    // Reset temporary states
    setUserTopic('');
    setEvalResult(null);
    setLitText('');
    setDefenseActive(false);
  }, [activeProjectId]);

  // Autosave proposalData
  React.useEffect(() => {
    localStorage.setItem(`chempilot_thesis_proposal_${activeProjectId}`, JSON.stringify(proposalData));
  }, [proposalData, activeProjectId]);

  // Autosave checklist
  React.useEffect(() => {
    localStorage.setItem(`chempilot_thesis_checklist_${activeProjectId}`, JSON.stringify(checklist));
  }, [checklist, activeProjectId]);

  const toggleChecklistItem = (item) => {
    setChecklist(prev => {
      const updated = {
        ...prev,
        [item]: !prev[item]
      };
      localStorage.setItem(`chempilot_thesis_checklist_${activeProjectId}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Determine active examiner based on the last message from assistant
  const getActiveExaminer = () => {
    if (!messages || messages.length === 0) return 'PEMBIMBING';
    
    // Find last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant') {
        const txt = msg.content;
        if (txt.includes('Rahma')) return 'RAHMA';
        if (txt.includes('Budi')) return 'BUDI';
        if (txt.includes('Pembimbing') || txt.includes('Supervisor')) return 'PEMBIMBING';
      }
    }
    return 'PEMBIMBING'; // Default
  };

  const activeExaminer = getActiveExaminer();

  // Trigger Action through Chat
  const runEvaluation = async () => {
    if (!userTopic.trim()) return;
    setEvalResult(null);
    
    // 1. Run local pre-scoring
    const localEval = thesisCore.localEvaluateTopic(userTopic);
    setEvalResult({
      score: localEval.score,
      novelty: localEval.novelty,
      feasibility: localEval.feasibility,
      critiques: localEval.critiques,
      llmFeedback: "Analyzing deep academic nuances..."
    });

    // 2. Push to Gemini for the strict professor criticism
    const prompt = `Evaluasikan secara sangat kritis topik skripsi saya: "${userTopic}". 
Berikan evaluasi dalam format:
- Nilai Kelayakan & Kebaruan (skor 1-100)
- Kritik Utama (Mengapa topik ini terlalu luas/sempit/generic)
- Pertanyaan kunci yang harus dijawab
- Saran Perbaikan konkret.`;
    
    onSendMessage(prompt, null, 'THESIS', 'THESIS_EVALUATION');
  };

  const handleSelectIdea = (idea) => {
    setSelectedIdea(idea);
    setUserTopic(idea.title);
    setProposalData(prev => ({
      ...prev,
      title: idea.title,
      ...thesisCore.generateProposalTemplate(idea.title)
    }));
  };

  const loadProposalTemplate = () => {
    if (!proposalData.title.trim()) {
      alert("Masukkan judul skripsi terlebih dahulu!");
      return;
    }
    const template = thesisCore.generateProposalTemplate(proposalData.title);
    setProposalData(prev => ({
      ...prev,
      ...template
    }));
  };

  const copyProposalMarkdown = () => {
    const md = `# Proposal Skripsi: ${proposalData.title}\n\n` +
      `${proposalData.background}\n\n` +
      `${proposalData.problemStatement}\n\n` +
      `${proposalData.objectives}\n\n` +
      `${proposalData.methodology}`;
    navigator.clipboard.writeText(md);
    setProposalStatus('Proposal copied to clipboard!');
    setTimeout(() => setProposalStatus(''), 3000);
  };

  const analyzeLiterature = () => {
    if (!litText.trim()) return;
    const prompt = `Lakukan analisis gap literatur dari abstrak/abstrak jurnal berikut:
"${litText}"

Harap identifikasi:
1. Research Gap (celah penelitian yang belum terjawab)
2. Weakness (kelemahan metodologi atau batasan asumsi yang mereka pakai)
3. Opportunities (peluang perbaikan/modifikasi yang bisa saya lakukan)`;
    onSendMessage(prompt, null, 'THESIS', 'THESIS_LITERATURE');
  };

  const startDefenseSim = () => {
    if (!proposalData.title.trim()) {
      alert("Masukkan judul proposal Anda untuk memulai sidang!");
      return;
    }
    setDefenseActive(true);
    const prompt = `Saya ingin memulai Simulasi Sidang Pertahanan Skripsi (Thesis Defense Mode).
Saya draf judul proposal saya adalah: "${proposalData.title}"
Metodologi awal saya: ${proposalData.methodology || 'Belum didefinisikan secara rinci.'}

Silakan para dewan penguji (Dr. Devan's Supervisor, Dr. Rahma, Prof. Budi) memberikan pembukaan dan mengajukan pertanyaan pertama!`;
    onSendMessage(prompt, null, 'THESIS', 'THESIS_DEFENSE');
  };

  const generateMethodology = () => {
    if (!pfd || !pfd.nodes || pfd.nodes.length === 0) {
      alert("Flowsheet kosong! Buat flowsheet terlebih dahulu di PFD Builder.");
      return;
    }

    const prompt = `Lakukan penulisan Bab 3 (Metodologi Penelitian) draft skripsi saya berdasarkan konfigurasi simulasi pabrik berikut:
- Model Termodinamika: ${pfd.thermoModel || 'Ideal'}
- Preset Campuran: ${pfd.activePreset || 'Custom Binary'}
- Daftar Equipment: ${JSON.stringify(pfd.nodes.map(n => ({ tag: n.tag, label: n.label, type: n.type, params: pfd.params?.[n.id] || {} })))}
- Aliran Arus (Streams): ${JSON.stringify(pfd.streams.map(s => ({ id: s.id, from: s.from, to: s.to })))}

Format Penulisan yang Harus Diikuti:
1. Judul: "BAB III: METODOLOGI PENELITIAN"
2. Sub-bab 3.1: Diagram Alir Proses (Deskripsikan secara detail dan formal urutan unit operasi pabrik)
3. Sub-bab 3.2: Model Termodinamika (Berikan penjelasan kritis dan ilmiah mengapa model termodinamika ${pfd.thermoModel || 'Ideal'} digunakan untuk memodelkan sistem ${pfd.activePreset || 'Custom Binary'})
4. Sub-bab 3.3: Spesifikasi Peralatan Utama (Buat draf tabel spesifikasi yang rapi untuk alat-alat yang terpasang beserta kondisi operasinya)

Gunakan bahasa akademis formal yang baku, kritis, dan sangat ilmiah (tulis dalam bahasa ${methodologyLang === 'id' ? 'Indonesia' : 'Inggris'}).`;

    onSendMessage(prompt, null, 'THESIS', 'THESIS_METHODOLOGY');
  };

  return (
    <div className="thesis-workspace-container">
      {/* Tab Navigation */}
      <div className="thesis-subtabs">
        {[
          { id: 'THESIS_IDEATION', label: '💡 Ideation' },
          { id: 'THESIS_EVALUATION', label: '📊 Topic Evaluation' },
          { id: 'THESIS_PROPOSAL', label: '📝 Proposal Builder' },
          { id: 'THESIS_METHODOLOGY', label: '🧬 Methodology' },
          { id: 'THESIS_LITERATURE', label: '🔬 Lit Analysis' },
          { id: 'SUPERVISOR', label: '👨‍🏫 Supervisor' },
          { id: 'THESIS_DEFENSE', label: '🎓 Defense Arena' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`subtab-btn ${activeSubMode === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveSubMode(tab.id);
              if (tab.id !== 'THESIS_DEFENSE') setDefenseActive(false);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="thesis-tab-body">
        
        {/* 1. IDEATION ENGINE */}
        {activeSubMode === 'THESIS_IDEATION' && (
          <div className="thesis-ideation-deck">
            <div className="widget-header">
              <h3>Thesis Ideation Engine</h3>
              <p>Pilih topik riset teknik kimia unggulan untuk dibedah secara kritis.</p>
            </div>
            
            <div className="ideation-grid">
              <div className="ideas-list">
                {ideationList.map(idea => (
                  <div
                    key={idea.id}
                    className={`idea-card ${selectedIdea?.id === idea.id ? 'selected' : ''}`}
                    onClick={() => handleSelectIdea(idea)}
                  >
                    <div className="idea-domain-badge">{idea.domain}</div>
                    <h4>{idea.title}</h4>
                    <p>{idea.description.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>

              <div className="idea-details-pane">
                {selectedIdea ? (
                  <div className="glass-panel-content">
                    <div className="details-header">
                      <span className="idea-domain-badge">{selectedIdea.domain}</span>
                      <h4>{selectedIdea.title}</h4>
                    </div>
                    
                    <p className="idea-desc">{selectedIdea.description}</p>
                    
                    <div className="metric-gauges">
                      {[
                        { label: 'Novelty (Kebaruan)', val: selectedIdea.novelty, color: '#a855f7' },
                        { label: 'Feasibility (Kelayakan)', val: selectedIdea.feasibility, color: 'var(--accent)' },
                        { label: 'Difficulty (Kesulitan)', val: selectedIdea.difficulty, color: '#f59e0b' },
                        { label: 'Industry Relevance', val: selectedIdea.relevance, color: '#3b82f6' }
                      ].map(metric => (
                        <div key={metric.label} className="metric-row">
                          <span className="metric-label">{metric.label}</span>
                          <div className="bar-wrapper">
                            <div className="fill-bar" style={{ width: `${metric.val * 20}%`, backgroundColor: metric.color }}></div>
                          </div>
                          <span className="metric-val">{metric.val}/5</span>
                        </div>
                      ))}
                    </div>

                    <div className="idea-gap-box">
                      <strong>Celah Penelitian (Gap):</strong>
                      <p>{selectedIdea.gap}</p>
                    </div>

                    <div className="idea-actions">
                      <button className="primary-btn" onClick={() => setActiveSubMode('THESIS_EVALUATION')}>
                        Evaluasi Judul Ini
                      </button>
                      <button className="secondary-btn" onClick={() => setActiveSubMode('THESIS_PROPOSAL')}>
                        Muat di Proposal Builder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="details-placeholder">
                    <span>💡 Pilih ide riset dari daftar sebelah kiri untuk melihat rincian kelayakan, novelty, dan gap penelitian.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. TOPIC EVALUATION */}
        {activeSubMode === 'THESIS_EVALUATION' && (
          <div className="topic-evaluator">
            <div className="widget-header">
              <h3>Topic Evaluation Engine</h3>
              <p>Masukkan draf judul skripsi lo untuk diuji kelayakannya secara akademis.</p>
            </div>
            
            <div className="eval-input-group">
              <input
                type="text"
                value={userTopic}
                onChange={(e) => setUserTopic(e.target.value)}
                placeholder="Contoh: Ekstraksi pectin dari kulit buah naga berbasis gel ultrasonik..."
              />
              <button className="primary-btn" onClick={runEvaluation} disabled={isProcessing}>
                {isProcessing ? 'Critiquing...' : 'Evaluasi Judul'}
              </button>
            </div>

            {evalResult && (
              <div className="eval-results-grid">
                <div className="score-card">
                  <div className="score-ring">
                    <span className="score-number">{evalResult.score}</span>
                    <span className="score-label">Maturity Score</span>
                  </div>
                  <div className="score-meters">
                    <div className="meter">
                      <span>Novelty</span>
                      <div className="meter-dots">
                        {[1, 2, 3, 4, 5].map(d => (
                          <div key={d} className={`dot ${d <= evalResult.novelty ? 'active' : ''}`} style={{ backgroundColor: '#a855f7' }}></div>
                        ))}
                      </div>
                    </div>
                    <div className="meter">
                      <span>Feasibility</span>
                      <div className="meter-dots">
                        {[1, 2, 3, 4, 5].map(d => (
                          <div key={d} className={`dot ${d <= evalResult.feasibility ? 'active' : ''}`} style={{ backgroundColor: 'var(--accent)' }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="feedback-details">
                  <h4>Hasil Penyaringan Lokal:</h4>
                  <ul>
                    {evalResult.critiques.map((crit, idx) => (
                      <li key={idx} className={crit.includes('Bagus') ? 'good' : 'warning'}>
                        {crit}
                      </li>
                    ))}
                  </ul>
                  <div className="chat-reference-note">
                    <small>💬 Analisis mendalam dari Gemini sedang dimuat di panel obrolan kanan. Professor TERRA AI akan mendebat judul ini secara detail.</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. PROPOSAL BUILDER */}
        {activeSubMode === 'THESIS_PROPOSAL' && (
          <div className="proposal-builder">
            <div className="widget-header">
              <h3>Structured Proposal Builder</h3>
              <p>Tulis draf bagian-bagian utama proposal skripsi lo dan ekspor draf akademis lengkap.</p>
            </div>

            <div className="proposal-layout">
              <div className="proposal-form">
                <div className="form-group">
                  <label>Judul Proposal</label>
                  <input
                    type="text"
                    value={proposalData.title}
                    onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                    placeholder="Judul skripsi"
                  />
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label>Latar Belakang & Masalah</label>
                    <button onClick={loadProposalTemplate} className="helper-link">Load Template</button>
                  </div>
                  <textarea
                    rows={4}
                    value={proposalData.background}
                    onChange={(e) => setProposalData({ ...proposalData, background: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Rumusan Masalah & Batasan</label>
                  <textarea
                    rows={3}
                    value={proposalData.problemStatement}
                    onChange={(e) => setProposalData({ ...proposalData, problemStatement: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tujuan Penelitian</label>
                  <textarea
                    rows={3}
                    value={proposalData.objectives}
                    onChange={(e) => setProposalData({ ...proposalData, objectives: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Metodologi & Desain Eksperimen</label>
                  <textarea
                    rows={4}
                    value={proposalData.methodology}
                    onChange={(e) => setProposalData({ ...proposalData, methodology: e.target.value })}
                  />
                </div>

                <div className="form-actions">
                  <button className="primary-btn" onClick={copyProposalMarkdown}>Copy Markdown</button>
                  <button className="secondary-btn" onClick={startDefenseSim}>Uji di Sidang Simulasi</button>
                  {proposalStatus && <div className="status-toast">{proposalStatus}</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. LITERATURE ANALYSIS */}
        {activeSubMode === 'THESIS_LITERATURE' && (
          <div className="literature-analyser">
            <div className="widget-header">
              <h3>Literature Analysis Engine</h3>
              <p>Tempel abstrak jurnal/paper referensi untuk mencari kelemahan dan peluang celah riset.</p>
            </div>

            <div className="lit-input-area">
              <textarea
                rows={6}
                value={litText}
                onChange={(e) => setLitText(e.target.value)}
                placeholder="Tempel teks abstrak paper di sini..."
              />
              <button className="primary-btn" onClick={analyzeLiterature} disabled={isProcessing || !litText.trim()}>
                {isProcessing ? 'Analyzing...' : 'Bedah Abstrak Jurnal'}
              </button>
            </div>
          </div>
        )}

        {/* 5. DEFENSE ARENA */}
        {activeSubMode === 'THESIS_DEFENSE' && (
          <div className="defense-simulator-arena">
            <div className="widget-header">
              <h3>Thesis Defense Mode (Simulasi Sidang)</h3>
              <p>Uji kesiapan argumen lo di depan dewan penguji virtual. Mereka akan menguliti logika riset lo.</p>
            </div>

            {!defenseActive ? (
              <div className="defense-setup-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '40px 20px', background: 'rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '14px', gap: '16px' }}>
                <div className="setup-orb" style={{ fontSize: '3rem', animation: 'float 3s infinite ease-in-out' }}>🎓</div>
                <h4>Siap Menghadapi Sidang?</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '360px', lineHeight: 1.5 }}>
                  Simulasi sidang akan mengaktifkan 3 penguji virtual dengan fokus berbeda.<br />
                  Pastikan Judul dan Metodologi awal sudah diisi di tab **Proposal Builder** agar mereka punya bahan pertanyaan.
                </p>
                <button className="primary-btn active" onClick={startDefenseSim} style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={14} /> Masuki Ruang Sidang
                </button>
              </div>
            ) : (
              <div className="defense-session-view">
                <div className="examiner-panel-avatars">
                  <div className={`examiner-avatar ${activeExaminer === 'PEMBIMBING' ? 'active' : ''}`}>
                    <div className="av-circle">
                      <UserCheck size={18} />
                    </div>
                    <span>Dosen Pembimbing</span>
                    <small>Supportive / Rigorous</small>
                  </div>
                  <div className={`examiner-avatar ${activeExaminer === 'RAHMA' ? 'active' : ''}`}>
                    <div className="av-circle">
                      <Cpu size={18} />
                    </div>
                    <span>Dr. Rahma (Penguji 1)</span>
                    <small>Math & Thermo Core</small>
                  </div>
                  <div className={`examiner-avatar ${activeExaminer === 'BUDI' ? 'active' : ''}`}>
                    <div className="av-circle">
                      <Calculator size={18} />
                    </div>
                    <span>Prof. Budi (Penguji 2)</span>
                    <small>Eco & Feasibility</small>
                  </div>
                </div>

                <div className="defense-status-ticker">
                  <div className="ticker-led pulse"></div>
                  <span>SIDANG SEDANG BERLANGSUNG · Jawab pertanyaan penguji di panel chat kanan</span>
                </div>

                <button className="danger-btn" onClick={() => setDefenseActive(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px' }}>
                  <Square size={12} /> Akhiri Sidang
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. METHODOLOGY WRITER */}
        {activeSubMode === 'THESIS_METHODOLOGY' && (
          <div className="thesis-methodology-writer">
            <div className="widget-header">
              <h3>Flowsheet-to-Thesis Methodology Writer</h3>
              <p>Ekstrak parameter flowsheet PFD aktif lo menjadi draf dokumen akademis Bab III secara otomatis.</p>
            </div>
            
            <div className="flowsheet-methodology-card" style={{
              background: 'rgba(30,41,59,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div className="flowsheet-meta-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}>
                <div style={{ background: 'rgba(15,23,42,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>Active Preset</div>
                  <span style={{ color: '#f1f5f9', fontWeight: 'bold' }}>{pfd?.activePreset || 'Custom Flowsheet'}</span>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>Thermodynamic Model</div>
                  <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{pfd?.thermoModel || 'Ideal'}</span>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>Unit Operations</div>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{pfd?.nodes?.length || 0} unit(s)</span>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>Stream Connections</div>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{pfd?.streams?.length || 0} stream(s)</span>
                </div>
              </div>

              <div className="language-selector-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Target Language:</span>
                <select 
                  value={methodologyLang} 
                  onChange={(e) => setMethodologyLang(e.target.value)} 
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    color: '#f1f5f9',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="id">Bahasa Indonesia (Formal)</option>
                  <option value="en">English (Academic Style)</option>
                </select>
              </div>

              <div style={{ marginTop: '8px' }}>
                <button 
                  className="primary-btn active" 
                  onClick={generateMethodology} 
                  disabled={isProcessing || !pfd?.nodes?.length}
                  style={{ width: '100%', padding: '12px 20px', borderRadius: '8px' }}
                >
                  {isProcessing ? '🔬 Generating Chapter 3...' : '🧬 Generate Bab 3 Metodologi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. SUPERVISOR COMPANION DASHBOARD */}
        {activeSubMode === 'SUPERVISOR' && (
          <div className="supervisor-dashboard-panel" style={{ animation: 'slideUp 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="widget-header">
              <h3>Supervisor Advisory Board</h3>
              <p>Ruang bimbingan intensif dengan Dosen Pembimbing virtual kamu.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Profile Card */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '50%',
                    background: 'var(--purple-gradient)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#fff'
                  }}>
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Prof. Ir. Devan, M.T., Ph.D.</h4>
                    <span style={{ fontSize: '0.62rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dosen Pembimbing Utama</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(3, 5, 8, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.02)', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.45 }}>
                  "Pastikan neraca massa kamu ditutup dulu 100%. Jangan bawa flowsheet bocor ke ruang bimbingan saya. Baca buku termodinamika Smith Van Ness Bab 8 kalau dasar model kamu masih lemah."
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Discussion Triggers</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button 
                      onClick={() => onSendMessage("Prof, tolong uji dasar termodinamika dan pilihan fluid package pada flowsheet saya.", null, 'THESIS', 'SUPERVISOR')}
                      style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.15)', color: '#d8b4fe', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.06)'; }}
                    >
                      🧪 Konsultasikan Fluid Package / Termodinamika
                    </button>
                    <button 
                      onClick={() => onSendMessage("Prof, tolong evaluasi desain reaktor dan optimasi yields di flowsheet saya.", null, 'THESIS', 'SUPERVISOR')}
                      style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.15)', color: '#d8b4fe', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.06)'; }}
                    >
                      🏭 Konsultasikan Desain Reaktor & Yields
                    </button>
                    <button 
                      onClick={() => onSendMessage("Prof, mohon koreksi draft Bab III Metodologi saya yang sudah saya ketik.", null, 'THESIS', 'SUPERVISOR')}
                      style={{ background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.15)', color: '#d8b4fe', padding: '8px 12px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.06)'; }}
                    >
                      📝 Minta Koreksi Draft Bab III
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Checklist */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#fff' }}>Bimbingan Progress Tracker</h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.68rem', color: '#64748b', lineHeight: 1.4 }}>
                  Centang progres skripsi lo di sini untuk memantau seberapa dekat lo ke kelayakan sidang.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'title', label: 'Draf Judul Skripsi Disetujui' },
                    { id: 'background', label: 'Latar Belakang & Rumusan Masalah' },
                    { id: 'literature', label: 'Tinjauan Pustaka & Literatur Gap' },
                    { id: 'methodology', label: 'Spesifikasi Alat & Desain Pabrik' },
                    { id: 'massBalance', label: 'Neraca Massa & Energi 100% Klop' },
                    { id: 'economics', label: 'Kalkulasi Kelayakan Ekonomi Pabrik' }
                  ].map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => toggleChecklistItem(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: 'rgba(3, 5, 8, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(3, 5, 8, 0.3)'; }}
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist[item.id]} 
                        onChange={() => {}} // Controlled via row click
                        style={{ cursor: 'pointer', accentColor: '#a855f7' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: checklist[item.id] ? '#94a3b8' : '#cbd5e1', textDecoration: checklist[item.id] ? 'line-through' : 'none' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ThesisWorkspace;
