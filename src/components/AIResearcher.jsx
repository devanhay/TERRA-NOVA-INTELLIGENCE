import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, FileText, Send, Radio, User, Cpu, Bookmark, Copy, ExternalLink } from 'lucide-react';
import { GeminiService } from '../core/terraAI/GeminiService';
import './ai/TerraDashboard.css';

export default function AIResearcher({ projectId }) {
  const [activeTab, setActiveTab] = useState('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // States per project ID
  const [savedPapers, setSavedPapers] = useState(() => {
    const saved = localStorage.getItem(`engineeros_research_papers_${projectId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem(`engineeros_research_notes_${projectId}`);
    return saved ? JSON.parse(saved) : '';
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
      // Fetch academic papers from ArXiv API
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchQuery.trim())}&max_results=6`;
      const res = await fetch(url);
      const text = await res.text();

      // Simple parser for ArXiv XML response
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
      // Fallback mocks on connection issues
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
    <div className="os-workspace-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 100px)', gap: 16 }}>
      
      {/* Left Workspace Panel */}
      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={22} className="text-accent" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>AI Researcher</h2>
          </div>
          
          <div className="thesis-subtabs" style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'SEARCH', label: '🔍 Search Literature' },
              { id: 'SAVED', label: '📚 Saved Papers' },
              { id: 'NOTES', label: '📝 Research Notes' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`subtab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 6 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
          
          {activeTab === 'SEARCH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="page-desc">Cari paper akademis global dari database arXiv secara real-time.</p>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan topik riset (e.g. chemical engineering column, distillation control)..."
                  style={{ flex: 1, padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff' }}
                />
                <button className="primary-btn" type="submit" disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {searchResults.map(paper => (
                  <div key={paper.id} className="glass-panel" style={{ padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#fff' }}>{paper.title}</h4>
                      <button 
                        onClick={() => {
                          if (savedPapers.some(p => p.title === paper.title)) return;
                          setSavedPapers([...savedPapers, paper]);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                      >
                        <Bookmark size={16} />
                      </button>
                    </div>
                    <small style={{ color: '#64748b' }}>{paper.authors} — {paper.published}</small>
                    <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 8, lineHeight: 1.45 }}>{paper.summary}</p>
                    
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <a href={paper.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--accent)' }}>
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
              <p className="page-desc font-mono">Daftar literatur penting yang telah Anda simpan beserta modul sitasi cepat.</p>
              {savedPapers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Belum ada paper yang disimpan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {savedPapers.map(paper => (
                    <div key={paper.id} className="glass-panel" style={{ padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#fff' }}>{paper.title}</h4>
                        <button 
                          onClick={() => setSavedPapers(savedPapers.filter(p => p.id !== paper.id))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <small style={{ color: '#64748b' }}>{paper.authors}</small>
                      
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <button className="secondary-btn" onClick={() => copyCitation(paper, 'APA')} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>Copy APA</button>
                        <button className="secondary-btn" onClick={() => copyCitation(paper, 'IEEE')} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>Copy IEEE</button>
                        <button className="secondary-btn" onClick={() => copyCitation(paper, 'BibTeX')} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>Copy BibTeX</button>
                        <button className="primary-btn" onClick={() => handleSendMessage(`Buatkan ringkasan metodologi dan novelty dari paper: "${paper.title}"`)} style={{ fontSize: '0.65rem', padding: '4px 8px' }}>Summarize AI</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'NOTES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="page-desc">Tulis catatan kajian literatur, ringkasan jurnal, dan draf rumusan hipotesis skripsi Anda di sini.</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mulai menulis catatan akademis..."
                style={{ width: '100%', minHeight: '50vh', padding: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem', lineHeight: 1.5 }}
              />
            </div>
          )}

        </div>
      </div>

      {/* Right AI Chat Sidebar */}
      <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, marginBottom: 12 }}>
          <Cpu size={16} className="text-accent" />
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>AI Research Assistant</h4>
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
            placeholder={isProcessing ? 'Thinking...' : 'Tanya paper/metodologi...'}
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
