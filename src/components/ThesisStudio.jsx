import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, BookOpen, CheckCircle, Award, Play, 
  Trash2, Plus, FileText, Send, Radio, User, Cpu, X, Copy 
} from 'lucide-react';
import { GeminiService } from '../core/terraAI/GeminiService';
import { ThesisCore } from '../core/terraAI/ThesisCore';
import './ai/TerraDashboard.css'; // Leverage existing glass/chat styles

const thesisCore = new ThesisCore();

export default function ThesisStudio({ projectId, appContext }) {
  const [activeTab, setActiveTab] = useState('IDEATION');
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [ideationList] = useState(thesisCore.getSeedIdeas());
  const [methodologyLang, setMethodologyLang] = useState('id');

  // Load and save states per project ID
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
  const [litText, setLitText] = useState('');
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

  // Load saved states when project changes
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
      // Sync structured thesis metadata inside general AI Workspace structure
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
    <div className="os-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 100px)', gap: 16 }}>
      
      {/* Left Workspace Panel */}
      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GraduationCap size={22} className="text-accent" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Thesis Studio</h2>
          </div>
          
          {/* Sub Navigation */}
          <div className="thesis-subtabs" style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'IDEATION', label: '💡 Ideation' },
              { id: 'EVALUATION', label: '📊 Evaluation' },
              { id: 'PROPOSAL', label: '📝 Proposal' },
              { id: 'METHODOLOGY', label: '🧬 Methodology' },
              { id: 'CHECKLIST', label: '👨‍🏫 Checklist' },
              { id: 'DEFENSE', label: '🎓 Defense' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`subtab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'DEFENSE') setDefenseActive(false); }}
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 6 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
          
          {activeTab === 'IDEATION' && (
            <div>
              <p className="page-desc">Pilih draf ide topik riset unggulan di bidang Teknik Kimia dan Energi untuk dianalisis lebih lanjut.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }}>
                  {ideationList.map(idea => (
                    <div
                      key={idea.id}
                      onClick={() => setSelectedIdea(idea)}
                      className={`idea-card ${selectedIdea?.id === idea.id ? 'selected' : ''}`}
                      style={{ padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: selectedIdea?.id === idea.id ? 'rgba(76, 201, 240, 0.1)' : 'rgba(0,0,0,0.2)' }}
                    >
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '0.78rem', color: '#fff' }}>{idea.title}</h5>
                      <span style={{ fontSize: '0.62rem', color: 'var(--accent)' }}>{idea.domain}</span>
                    </div>
                  ))}
                </div>

                <div className="glass-panel" style={{ padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
                  {selectedIdea ? (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>{selectedIdea.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>{selectedIdea.description}</p>
                      
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>**Research Gap:** {selectedIdea.gap}</div>
                      </div>

                      <button 
                        className="primary-btn" 
                        style={{ marginTop: 20 }}
                        onClick={() => {
                          setProposalData(prev => ({ ...prev, title: selectedIdea.title }));
                          setActiveTab('PROPOSAL');
                        }}
                      >
                        Gunakan Ide di Proposal Builder
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.8rem' }}>
                      Pilih ide dari panel kiri untuk memuat rincian.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EVALUATION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="page-desc">Tulis topik skripsi Anda sendiri untuk diuji kelayakan dan orisinalitasnya secara otomatis oleh AI.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={evalTopic}
                  onChange={(e) => setEvalTopic(e.target.value)}
                  placeholder="Contoh: Optimasi Kolom Distilasi Azeotropik dengan Metode Penambahan Entrainer Etilen Glikol..."
                  style={{ flex: 1, padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                />
                <button className="primary-btn" onClick={runEvaluation}>Evaluasi</button>
              </div>

              {evalResult && (
                <div className="glass-panel" style={{ padding: 16, borderRadius: 8, marginTop: 12 }}>
                  <div style={{ display: 'flex', justifycontent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0 }}>Kelayakan Akademis</h4>
                      <small style={{ color: '#64748b' }}>Skor Kelayakan: {evalResult.score}/100</small>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div>Novelty: {evalResult.novelty}/5</div>
                      <div>Feasibility: {evalResult.feasibility}/5</div>
                    </div>
                  </div>
                  <ul>
                    {evalResult.critiques.map((crit, i) => (
                      <li key={i} style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>{crit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PROPOSAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="page-desc" style={{ margin: 0 }}>Lengkapi komponen dasar proposal dan salin draf lengkapnya.</p>
                <button className="secondary-btn" onClick={() => {
                  const temp = thesisCore.generateProposalTemplate(proposalData.title || 'Draft Skripsi');
                  setProposalData(prev => ({ ...prev, ...temp }));
                }} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Gunakan Template</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Judul Proposal</label>
                <input
                  type="text"
                  value={proposalData.title}
                  onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                  placeholder="Masukkan judul skripsi..."
                  style={{ padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Latar Belakang</label>
                <textarea
                  rows={3}
                  value={proposalData.background}
                  onChange={(e) => setProposalData({ ...proposalData, background: e.target.value })}
                  style={{ padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Rumusan Masalah</label>
                <textarea
                  rows={2}
                  value={proposalData.problemStatement}
                  onChange={(e) => setProposalData({ ...proposalData, problemStatement: e.target.value })}
                  style={{ padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Metodologi Awal</label>
                <textarea
                  rows={2}
                  value={proposalData.methodology}
                  onChange={(e) => setProposalData({ ...proposalData, methodology: e.target.value })}
                  style={{ padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                />
              </div>

              <button className="primary-btn" onClick={() => {
                const md = `# ${proposalData.title}\n\n## Latar Belakang\n${proposalData.background}\n\n## Rumusan Masalah\n${proposalData.problemStatement}\n\n## Metodologi\n${proposalData.methodology}`;
                navigator.clipboard.writeText(md);
                alert("Proposal berhasil disalin ke clipboard!");
              }}>
                <Copy size={12} style={{ marginRight: 6 }} /> Salin Draft Markdown
              </button>
            </div>
          )}

          {activeTab === 'METHODOLOGY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="page-desc">Generate Bab III Metodologi secara otomatis menggunakan data flowsheet dan termodinamika dari PFD Builder.</p>
              
              <div className="glass-panel" style={{ padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
                <strong>Model Termodinamika Aktif:</strong> {appContext?.pfd?.thermoModel || 'Belum diset (Ideal)'} <br/>
                <strong>Preset Campuran:</strong> {appContext?.pfd?.activePreset || 'Custom Binary'} <br/>
                <strong>Total Peralatan (Nodes):</strong> {appContext?.pfd?.nodes?.length || 0}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select 
                  value={methodologyLang} 
                  onChange={(e) => setMethodologyLang(e.target.value)}
                  style={{ padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
                <button className="primary-btn" onClick={generateMethodology} style={{ flex: 1 }}>
                  Generate Bab III
                </button>
              </div>
            </div>
          )}

          {activeTab === 'CHECKLIST' && (
            <div>
              <p className="page-desc">Pantau perkembangan draf skripsi Anda dari bab awal hingga simulasi ekonomi pabrik.</p>
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
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      background: checklist[item.id] ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.15)',
                      borderColor: checklist[item.id] ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <CheckCircle size={16} color={checklist[item.id] ? '#34d399' : '#475569'} />
                    <span style={{ fontSize: '0.8rem', color: checklist[item.id] ? '#34d399' : '#cbd5e1' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'DEFENSE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="page-desc">Simulasikan sidang pertahanan proposal skripsi Anda di hadapan 3 dewan penguji AI yang kritis.</p>
              
              {!defenseActive ? (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <button className="primary-btn" onClick={startDefenseSim}>Mulai Simulasi Sidang</button>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: 16, borderRadius: 8, background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ color: '#f87171', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Award size={14} /> STATUS: SIDANG BERJALAN
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#fca5a5', margin: 0 }}>Gunakan panel chat pembimbing di sebelah kanan untuk menjawab setiap cecaran pertanyaan penguji!</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right AI Chat Sidebar */}
      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 12 }}>
          <Cpu size={16} className="text-accent" />
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Pembimbing Skripsi AI</h4>
        </div>

        {/* Chat Thread */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, marginBottom: 12 }}>
          {chatMessages.map((msg, index) => (
            <div key={index} className={`bubble-row ${msg.role}`} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div 
                className={`bubble-text-content ${msg.role}`}
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                  background: msg.role === 'user' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
                  color: msg.role === 'user' ? '#fff' : '#cbd5e1',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            placeholder={isProcessing ? 'Thinking...' : 'Tanya pembimbing...'}
            disabled={isProcessing}
            style={{ flex: 1, padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: '0.78rem' }}
          />
          <button 
            className="primary-btn" 
            onClick={() => handleSendMessage()}
            disabled={isProcessing}
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>

    </div>
  );
}
