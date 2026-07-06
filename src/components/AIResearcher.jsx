import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, BookOpen, FileText, Send, Radio, User, Cpu, 
  Bookmark, Copy, ExternalLink, ArrowUp, Sparkles, FolderHeart, 
  Activity, Award, Trash2
} from 'lucide-react';
import { GeminiService } from '../core/terraAI/GeminiService';
import './ai/TerraDashboard.css';

export default function AIResearcher({ projectId }) {
  const [activeTab, setActiveTab] = useState('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [savedPapers, setSavedPapers] = useState(() => {
    const saved = localStorage.getItem(`engineeros_research_papers_${projectId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem(`engineeros_research_notes_${projectId}`);
    return saved || '';
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem(`engineeros_research_chat_${projectId}`);
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Halo! Gue Terra, AI Research Assistant lo. Cari paper, tinjau metodologi, atau buat ringkasan di sini!' }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`engineeros_research_papers_${projectId}`, JSON.stringify(savedPapers));
    syncCloud();
  }, [savedPapers, projectId]);

  useEffect(() => {
    localStorage.setItem(`engineeros_research_notes_${projectId}`, notes);
    syncCloud();
  }, [notes, projectId]);

  useEffect(() => {
    localStorage.setItem(`engineeros_research_chat_${projectId}`, JSON.stringify(chatMessages));
  }, [chatMessages, projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const savedPapersData = localStorage.getItem(`engineeros_research_papers_${projectId}`);
    setSavedPapers(savedPapersData ? JSON.parse(savedPapersData) : []);

    const savedNotesData = localStorage.getItem(`engineeros_research_notes_${projectId}`);
    setNotes(savedNotesData || '');

    const savedChatData = localStorage.getItem(`engineeros_research_chat_${projectId}`);
    setChatMessages(savedChatData ? JSON.parse(savedChatData) : [
      { role: 'assistant', content: 'Halo! Gue Terra, AI Research Assistant lo. Cari paper, tinjau metodologi, atau buat ringkasan di sini!' }
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
              research_papers: savedPapers,
              research_notes: notes
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
      console.warn("Failed to sync research data to cloud:", e);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchQuery.trim())}&max_results=6`;
      const res = await fetch(url);
      const text = await res.text();

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const entries = xmlDoc.getElementsByTagName("entry");
      const list = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const title = entry.getElementsByTagName("title")[0]?.textContent?.trim() || "No Title";
        const summary = entry.getElementsByTagName("summary")[0]?.textContent?.trim() || "No Summary";
        const authors = Array.from(entry.getElementsByTagName("author")).map(a => a.getElementsByTagName("name")[0]?.textContent).join(", ");
        const link = entry.getElementsByTagName("id")[0]?.textContent || "";
        const published = entry.getElementsByTagName("published")[0]?.textContent || "";

        list.push({
          id: 'arxiv-' + i + '-' + Date.now(),
          title,
          summary,
          authors,
          link,
          published: new Date(published).toLocaleDateString()
        });
      }
      setSearchResults(list);
    } catch (err) {
      console.error(err);
      setSearchResults([
        { id: 'mock-1', title: 'Optimisasi Proses Pemisahan Distilasi Skala Industri', authors: 'T. H. Devan, R. Rahma', published: '2026-05-12', summary: 'Paper ini mendiskusikan implementasi algoritma kecerdasan buatan dalam merancang dan mengoptimasi parameter reflux ratio pada menara distilasi multi-komponen.', link: 'https://arxiv.org' }
      ]);
    } finally {
      setIsSearching(false);
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
      const systemInstruction = `You are Prof. TERRA, an elite academic research assistant. 
Help the student synthesize literature, identify gaps, construct hypotheses, or translate math equations.
Write in a friendly "Indo-English" mix.`;

      const response = await gemini.callGemini(text, systemInstruction);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Gagal mendapatkan respon: ${e.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyCitation = (paper, format) => {
    const primaryAuthor = paper.authors.split(',')[0];
    const year = new Date(paper.published).getFullYear() || 2026;
    let citation = '';

    if (format === 'APA') {
      citation = `${primaryAuthor}. (${year}). ${paper.title}. Retrieved from ${paper.link}`;
    } else if (format === 'IEEE') {
      citation = `[1] ${primaryAuthor}, "${paper.title}," ${year}. [Online]. Available: ${paper.link}`;
    } else if (format === 'BibTeX') {
      citation = `@article{ref_${paper.id},\n  author = {${paper.authors}},\n  title = {${paper.title}},\n  year = {${year}},\n  url = {${paper.link}}\n}`;
    }

    navigator.clipboard.writeText(citation);
    alert(`Citation (${format}) copied to clipboard!`);
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
            <Search size={24} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 8px rgba(76, 201, 240, 0.4))' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: '#fff' }}>
              AI Researcher
            </h2>
          </div>
          
          <div className="thesis-subtabs" style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'SEARCH', label: 'Search Literature', icon: <Search size={13} /> },
              { id: 'SAVED', label: 'Saved Papers', icon: <Bookmark size={13} /> },
              { id: 'NOTES', label: 'Research Notes', icon: <FileText size={13} /> }
            ].map(tab => (
              <button
                key={tab.id}
                className={`subtab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '0.72rem', 
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  border: activeTab === tab.id ? '1px solid rgba(76, 201, 240, 0.3)' : '1px solid transparent',
                  background: activeTab === tab.id ? 'rgba(76, 201, 240, 0.12)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : '#94a3b8'
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }} className="thin-scrollbar">
          
          {activeTab === 'SEARCH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                Cari paper akademis global dari database arXiv secara real-time.
              </p>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan topik riset (e.g. chemical engineering column, distillation control)..."
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
                <button className="primary-btn" type="submit" disabled={isSearching} style={{ background: 'var(--accent-gradient)', border: 'none', padding: '0 20px' }}>
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {searchResults.map(paper => (
                  <div 
                    key={paper.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: 20, 
                      borderRadius: 8, 
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>{paper.title}</h4>
                      <button 
                        onClick={() => {
                          if (savedPapers.some(p => p.title === paper.title)) return;
                          setSavedPapers([...savedPapers, paper]);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 2 }}
                      >
                        <Bookmark size={18} />
                      </button>
                    </div>
                    <small style={{ color: '#64748b', fontSize: '0.7rem' }}>{paper.authors} — {paper.published}</small>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 10, lineHeight: 1.5 }}>{paper.summary}</p>
                    
                    <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                      <a href={paper.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--accent)', textDecoration: 'none' }}>
                        <ExternalLink size={12} /> Buka PDF ArXiv
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SAVED' && (
            <div>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 20 }}>
                Daftar literatur penting yang telah Anda simpan beserta modul sitasi cepat.
              </p>
              {savedPapers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.82rem' }}>Belum ada paper yang disimpan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {savedPapers.map(paper => (
                    <div key={paper.id} className="glass-panel" style={{ padding: 18, borderRadius: 8, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>{paper.title}</h4>
                        <button 
                          onClick={() => setSavedPapers(savedPapers.filter(p => p.id !== paper.id))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <small style={{ color: '#64748b', fontSize: '0.7rem' }}>{paper.authors}</small>
                      
                      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="secondary-btn" onClick={() => copyCitation(paper, 'APA')} style={{ fontSize: '0.68rem', padding: '6px 12px' }}>Copy APA</button>
                        <button className="secondary-btn" onClick={() => copyCitation(paper, 'IEEE')} style={{ fontSize: '0.68rem', padding: '6px 12px' }}>Copy IEEE</button>
                        <button className="secondary-btn" onClick={() => copyCitation(paper, 'BibTeX')} style={{ fontSize: '0.68rem', padding: '6px 12px' }}>Copy BibTeX</button>
                        <button className="primary-btn" onClick={() => handleSendMessage(`Buatkan ringkasan metodologi dan novelty dari paper: "${paper.title}"`)} style={{ fontSize: '0.68rem', padding: '6px 12px', background: 'var(--accent-gradient)', border: 'none' }}>Summarize AI</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'NOTES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="page-desc" style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 14 }}>
                Tulis catatan kajian literatur, ringkasan jurnal, dan draf rumusan hipotesis skripsi Anda di sini.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mulai menulis catatan akademis..."
                style={{ 
                  width: '100%', 
                  minHeight: '50vh', 
                  padding: 14, 
                  background: 'rgba(0,0,0,0.3)', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: 8, 
                  color: '#fff', 
                  fontSize: '0.85rem', 
                  lineHeight: 1.6,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
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
          <Cpu size={18} color="var(--accent)" style={{ filter: 'drop-shadow(0 0 6px rgba(76, 201, 240, 0.4))' }} />
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
            AI Research Assistant
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
                  className={`bubble-row ${isUser ? 'user general' : 'assistant'}`} 
                  style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
                >
                  {!isUser && (
                    <div className="bubble-avatar" style={{ background: 'rgba(76, 201, 240, 0.1)', color: 'var(--accent)', border: '1px solid rgba(76, 201, 240, 0.2)' }}>
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
            placeholder={isProcessing ? 'Memikirkan jawaban...' : 'Tanya paper/metodologi...'}
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
              background: 'var(--accent-gradient)', 
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
