import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, BookOpen, CheckCircle, Award, Play,
  Trash2, Plus, FileText, Send, Radio, User, Cpu, X, Copy,
  ArrowUp, Sparkles, Activity, FileCheck, ShieldAlert
} from 'lucide-react';
import { GeminiService } from '../core/terraAI/GeminiService';
import { ThesisCore } from '../core/terraAI/ThesisCore';
import './ai/TerraDashboard.css';

const thesisCore = new ThesisCore();

export default function ThesisStudio({ projectId, appContext }) {
  const [activeTab, setActiveTab] = useState('IDEATION');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideationList] = useState(thesisCore.getSeedIdeas());
  const [methodologyLang, setMethodologyLang] = useState('id');

  const [proposalData, setProposalData] = useState(() => {
    const saved = localStorage.getItem(`engineeros_thesis_proposal_${projectId}`);
    return saved ? JSON.parse(saved) : { title: '', background: '', problemStatement: '', objectives: '', methodology: '' };
  });

  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem(`engineeros_thesis_checklist_${projectId}`);
    return saved ? JSON.parse(saved) : { title: false, background: false, literature: false, methodology: false, massBalance: false, economics: false };
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem(`engineeros_thesis_chat_${projectId}`);
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Halo! Gue Terra, Pembimbing Skripsi lo. Siap bantu nyusun draf, bab metodologi, analisis gap, sampai latihan sidang!' }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [evalTopic, setEvalTopic] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [defenseActive, setDefenseActive] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`engineeros_thesis_proposal_${projectId}`, JSON.stringify(proposalData));
    syncCloud();
  }, [proposalData, projectId]);

  useEffect(() => {
    localStorage.setItem(`engineeros_thesis_checklist_${projectId}`, JSON.stringify(checklist));
    syncCloud();
  }, [checklist, projectId]);

  useEffect(() => {
    localStorage.setItem(`engineeros_thesis_chat_${projectId}`, JSON.stringify(chatMessages));
  }, [chatMessages, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const savedProposal = localStorage.getItem(`engineeros_thesis_proposal_${projectId}`);
    setProposalData(savedProposal ? JSON.parse(savedProposal) : { title: '', background: '', problemStatement: '', objectives: '', methodology: '' });

    const savedChecklist = localStorage.getItem(`engineeros_thesis_checklist_${projectId}`);
    setChecklist(savedChecklist ? JSON.parse(savedChecklist) : { title: false, background: false, literature: false, methodology: false, massBalance: false, economics: false });

    const savedChat = localStorage.getItem(`engineeros_thesis_chat_${projectId}`);
    setChatMessages(savedChat ? JSON.parse(savedChat) : [
      { role: 'assistant', content: 'Halo! Gue Terra, Pembimbing Skripsi lo. Siap bantu nyusun draf, bab metodologi, analisis gap, sampai latihan sidang!' }
    ]);
  }, [projectId]);

  const syncCloud = async () => {
    const token = localStorage.getItem('engineeros_auth_token') || '';
    if (!token) return;
    const host = import.meta.env.VITE_API_URL || '';
    try {
      const rawProjects = localStorage.getItem('engineeros_terra_projects');
      if (rawProjects) {
        const parsed = JSON.parse(rawProjects);
        const updated = parsed.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              thesis_proposal: proposalData,
              thesis_checklist: checklist
            };
          }
          return p;
        });
        localStorage.setItem('engineeros_terra_projects', JSON.stringify(updated));
        await fetch(`${host}/api/auth/me/ai-projects?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai_projects_json: JSON.stringify(updated) })
        });
      }
    } catch (e) {
      console.warn("Failed to sync thesis data to cloud:", e);
    }
  };

  const handleSendMessage = async (customText = null) => {
    const text = customText || inputText;
    if (!text.trim()) return;
    if (!customText) setInputText('');

    const newMsgs = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(newMsgs);
    setIsProcessing(true);

    try {
      const apiKey = localStorage.getItem('gemini_api_key') || '';
      if (!apiKey) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: '**API Key belum dikonfigurasi.** Harap masukkan API Key Gemini Anda di panel Terra AI.' }]);
        return;
      }
      const gemini = new GeminiService(apiKey);
      const systemInstruction = `You are Prof. TERRA, an expert chemical and process engineering thesis supervisor. 
Provide critical academic reviews, suggest enhancements, and debate methodology rigorously but supportively. 
Speak in a friendly "Indo-English" academic mix (e.g., "Gue saranin lo cek reflux ratio-nya").`;

      const response = await gemini.callGemini(text, systemInstruction);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Gagal mendapatkan respon: ${e.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const runEvaluation = () => {
    if (!evalTopic.trim()) return;
    const localEval = thesisCore.localEvaluateTopic(evalTopic);
    setEvalResult({
      score: localEval.score,
      novelty: localEval.novelty,
      feasibility: localEval.feasibility,
      critiques: localEval.critiques
    });
    handleSendMessage(`Evaluasikan secara sangat kritis topik skripsi saya: "${evalTopic}"`);
  };

  const generateMethodology = () => {
    const pfd = appContext?.pfd;
    if (!pfd || !pfd.nodes || pfd.nodes.length === 0) {
      alert("Flowsheet kosong! Silakan buat diagram alir di PFD Builder terlebih dahulu.");
      return;
    }
    const prompt = `Lakukan penulisan Bab 3 (Metodologi Penelitian) draft skripsi saya berdasarkan konfigurasi simulasi pabrik berikut:
- Model Termodinamika: ${pfd.thermoModel || 'Ideal'}
- Preset Campuran: ${pfd.activePreset || 'Custom Binary'}
- Daftar Equipment: ${JSON.stringify(pfd.nodes.map(n => ({ tag: n.tag, label: n.label, type: n.type })))}
- Aliran Arus: ${JSON.stringify(pfd.streams.map(s => ({ id: s.id, from: s.from, to: s.to })))}

Tulis dalam bahasa ${methodologyLang === 'id' ? 'Indonesia' : 'Inggris'}.`;
    handleSendMessage(prompt);
  };

  const startDefenseSim = () => {
    if (!proposalData.title.trim()) {
      alert("Harap masukkan judul proposal di Proposal Builder terlebih dahulu.");
      return;
    }
    setDefenseActive(true);
    handleSendMessage(`Saya ingin memulai Simulasi Sidang Pertahanan Skripsi.
Draf judul proposal saya adalah: "${proposalData.title}"
Metodologi: ${proposalData.methodology || 'Belum didefinisikan secara rinci.'}
Dewan penguji silakan ajukan pertanyaan pertama.`);
  };

  return (
    <div className="os-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 120px)', gap: 16 }}>

      {/* Left Workspace Panel */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 24,
          background: 'rgba(10, 7, 24, 0.40)',
          backdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GraduationCap size={24} color="#a855f7" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: '#fff' }}>
              Thesis Studio
            </h2>
          </div>

          {/* Sub Navigation - Emojis removed, replaced with Lucide icons */}
          <div className="thesis-subtabs" style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'IDEATION', label: 'Ideation', icon: <Sparkles size={13} /> },
              { id: 'EVALUATION', label: 'Evaluation', icon: <Activity size={13} /> },
              { id: 'PROPOSAL', label: 'Proposal', icon: <FileText size={13} /> },
              { id: 'METHODOLOGY', label: 'Methodology', icon: <FileCheck size={13} /> },
              { id: 'CHECKLIST', label: 'Checklist', icon: <CheckCircle size={13} /> },
              { id: 'DEFENSE', label: 'Defense', icon: <Award size={13} /> }
            ].map(tab => (
              <button
                key={tab.id}
                className={`subtab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'DEFENSE') setDefenseActive(false); }}
                style={{
                  padding: '8px 12px',
                  fontSize: '0.72rem',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: activeTab === tab.id ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid transparent',
                  background: activeTab === tab.id ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                  color: activeTab === tab.id ? '#c084fc' : '#94a3b8'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }} className="thin-scrollbar">

          {activeTab === 'IDEATION' && (
            <div>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 20 }}>
                Pilih draf ide topik riset unggulan di bidang Teknik Kimia dan Energi untuk dianalisis lebih lanjut.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }} className="thin-scrollbar">
                  {ideationList.map(idea => (
                    <div
                      key={idea.id}
                      onClick={() => setSelectedIdea(idea)}
                      className={`idea-card ${selectedIdea?.id === idea.id ? 'selected' : ''}`}
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        border: selectedIdea?.id === idea.id ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        background: selectedIdea?.id === idea.id ? 'rgba(168, 85, 247, 0.08)' : 'rgba(0,0,0,0.2)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: selectedIdea?.id === idea.id ? '#c084fc' : '#fff', fontWeight: 600 }}>{idea.title}</h5>
                      <span style={{ fontSize: '0.62rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{idea.domain}</span>
                    </div>
                  ))}
                </div>

                <div
                  className="glass-panel"
                  style={{
                    padding: 20,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}
                >
                  {selectedIdea ? (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', color: '#c084fc', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{selectedIdea.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 16 }}>{selectedIdea.description}</p>

                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                          <span style={{ color: '#c084fc', fontWeight: 600 }}>Celah Penelitian:</span> {selectedIdea.gap}
                        </div>
                      </div>

                      <button
                        className="primary-btn"
                        style={{ marginTop: 24, background: 'var(--purple-gradient)', border: 'none', padding: '10px 18px' }}
                        onClick={() => {
                          setProposalData(prev => ({ ...prev, title: selectedIdea.title }));
                          setActiveTab('PROPOSAL');
                        }}
                      >
                        Gunakan Ide di Proposal Builder
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.82rem' }}>
                      Pilih ide dari panel kiri untuk memuat rincian kelayakan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EVALUATION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                Masukkan topik skripsi Anda sendiri untuk diuji kelayakan dan orisinalitasnya secara otomatis oleh AI.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={evalTopic}
                  onChange={(e) => setEvalTopic(e.target.value)}
                  placeholder="Contoh: Optimasi Kolom Distilasi Azeotropik dengan Metode Penambahan Entrainer Etilen Glikol..."
                  style={{
                    flex: 1,
                    padding: 12,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.82rem'
                  }}
                />
                <button className="primary-btn" onClick={runEvaluation} style={{ background: 'var(--purple-gradient)', padding: '0 20px', border: 'none' }}>
                  Evaluasi
                </button>
              </div>

              {evalResult && (
                <div className="glass-panel" style={{ padding: 20, borderRadius: 8, marginTop: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Penyaringan Kebaruan & Kelayakan</h4>
                      <small style={{ color: '#a855f7', fontWeight: 600 }}>Skor Kematangan: {evalResult.score}/100</small>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div>Novelty: <span style={{ color: '#c084fc', fontWeight: 700 }}>{evalResult.novelty}/5</span></div>
                      <div>Feasibility: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{evalResult.feasibility}/5</span></div>
                    </div>
                  </div>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {evalResult.critiques.map((crit, i) => (
                      <li key={i} style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 8, lineHeight: 1.5 }}>{crit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PROPOSAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="page-desc" style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem' }}>
                  Lengkapi komponen dasar proposal dan salin draf lengkapnya.
                </p>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    const temp = thesisCore.generateProposalTemplate(proposalData.title || 'Draft Skripsi');
                    setProposalData(prev => ({ ...prev, ...temp }));
                  }}
                  style={{ fontSize: '0.7rem', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Gunakan Template
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Judul Proposal</label>
                <input
                  type="text"
                  value={proposalData.title}
                  onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                  placeholder="Masukkan judul skripsi..."
                  style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latar Belakang</label>
                <textarea
                  rows={3}
                  value={proposalData.background}
                  onChange={(e) => setProposalData({ ...proposalData, background: e.target.value })}
                  style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rumusan Masalah</label>
                <textarea
                  rows={2}
                  value={proposalData.problemStatement}
                  onChange={(e) => setProposalData({ ...proposalData, problemStatement: e.target.value })}
                  style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Metodologi Awal</label>
                <textarea
                  rows={2}
                  value={proposalData.methodology}
                  onChange={(e) => setProposalData({ ...proposalData, methodology: e.target.value })}
                  style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: '0.82rem', outline: 'none', lineHeight: 1.5 }}
                />
              </div>

              <button
                className="primary-btn"
                onClick={() => {
                  const md = `# ${proposalData.title}\n\n## Latar Belakang\n${proposalData.background}\n\n## Rumusan Masalah\n${proposalData.problemStatement}\n\n## Metodologi\n${proposalData.methodology}`;
                  navigator.clipboard.writeText(md);
                  alert("Proposal berhasil disalin ke clipboard!");
                }}
                style={{ background: 'var(--purple-gradient)', border: 'none', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Copy size={14} /> Salin Draft Markdown
              </button>
            </div>
          )}

          {activeTab === 'METHODOLOGY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                Generate Bab III Metodologi secara otomatis menggunakan data flowsheet dan model termodinamika dari PFD Builder.
              </p>

              <div
                className="glass-panel"
                style={{
                  padding: 18,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: '#cbd5e1'
                }}
              >
                <div style={{ marginBottom: 6 }}><strong style={{ color: '#c084fc' }}>Model Termodinamika:</strong> {appContext?.pfd?.thermoModel || 'Ideal'}</div>
                <div style={{ marginBottom: 6 }}><strong style={{ color: '#c084fc' }}>Preset Campuran:</strong> {appContext?.pfd?.activePreset || 'Custom Binary'}</div>
                <div><strong style={{ color: '#c084fc' }}>Peralatan Flowsheet:</strong> {appContext?.pfd?.nodes?.length || 0} unit terdeteksi</div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  value={methodologyLang}
                  onChange={(e) => setMethodologyLang(e.target.value)}
                  style={{
                    padding: 10,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
                <button className="primary-btn" onClick={generateMethodology} style={{ flex: 1, background: 'var(--purple-gradient)', border: 'none', padding: 10 }}>
                  Generate Bab III
                </button>
              </div>
            </div>
          )}

          {activeTab === 'CHECKLIST' && (
            <div>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 20 }}>
                Pantau perkembangan draf skripsi Anda dari bab awal hingga simulasi ekonomi pabrik.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {[
                  { id: 'title', label: 'Draf Judul & Kebaruan Disetujui' },
                  { id: 'background', label: 'Bab I Pendahuluan Selesai' },
                  { id: 'literature', label: 'Bab II Tinjauan Pustaka & Sintesis Data' },
                  { id: 'methodology', label: 'Bab III Diagram Alir & Model Termodinamika' },
                  { id: 'massBalance', label: 'Simulasi Neraca Massa & Energi (PFD Builder)' },
                  { id: 'economics', label: 'Evaluasi Kelayakan Ekonomi Pabrik' }
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => setChecklist({ ...checklist, [item.id]: !checklist[item.id] })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      background: checklist[item.id] ? 'rgba(168, 85, 247, 0.06)' : 'rgba(0,0,0,0.15)',
                      borderColor: checklist[item.id] ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle size={18} color={checklist[item.id] ? '#c084fc' : '#475569'} style={{ filter: checklist[item.id] ? 'drop-shadow(0 0 4px rgba(168,85,247,0.3))' : 'none' }} />
                    <span style={{ fontSize: '0.82rem', color: checklist[item.id] ? '#c084fc' : '#cbd5e1', fontWeight: checklist[item.id] ? 600 : 500 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'DEFENSE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                Simulasikan sidang pertahanan proposal skripsi Anda di hadapan 3 dewan penguji AI yang kritis.
              </p>

              {!defenseActive ? (
                <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                  <button className="primary-btn" onClick={startDefenseSim} style={{ background: 'var(--purple-gradient)', border: 'none', padding: '12px 24px', fontSize: '0.85rem' }}>
                    Mulai Simulasi Sidang
                  </button>
                </div>
              ) : (
                <div
                  className="glass-panel"
                  style={{
                    padding: 18,
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.04)',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <ShieldAlert size={16} /> STATUS: SIDANG BERJALAN
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
                    Gunakan panel chat pembimbing di sebelah kanan untuk menjawab setiap cecaran pertanyaan dari dewan penguji!
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right AI Chat Sidebar - iOS Dynamic UX Context */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 20,
          background: 'rgba(10, 7, 24, 0.40)',
          backdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16, marginBottom: 16 }}>
          <Cpu size={18} color="#a855f7" style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.4))' }} />
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
            Pembimbing Skripsi
          </h4>
        </div>

        {/* Chat Thread Container with .terra-dashboard wrapper to load bubble CSS styles correctly */}
        <div className="terra-dashboard" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            className="terra-chat-panel-rebuilt scale-md thin-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              paddingRight: 4,
              marginBottom: 16
            }}
          >
            {chatMessages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={index}
                  className={`bubble-row ${isUser ? 'user thesis' : 'assistant'}`}
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                >
                  {!isUser && (
                    <div className="bubble-avatar" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                      <Cpu size={11} />
                    </div>
                  )}
                  <div className="bubble-text-content" style={{ fontSize: '0.78rem', lineHeight: 1.45 }}>
                    {msg.content}
                  </div>
                  {isUser && (
                    <div className="bubble-avatar" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <User size={11} />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input - Circle Send Button with ArrowUp */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            placeholder={isProcessing ? 'Memikirkan jawaban...' : 'Tanya pembimbing...'}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              color: '#fff',
              fontSize: '0.78rem',
              outline: 'none',
              transition: 'border 0.2s'
            }}
          />
          <button
            className="primary-btn"
            onClick={() => handleSendMessage()}
            disabled={isProcessing}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--purple-gradient)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0
            }}
          >
            <ArrowUp size={16} color="#fff" />
          </button>
        </div>
      </div>

    </div>
  );
}
