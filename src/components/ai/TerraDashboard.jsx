import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, WifiOff, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';
import NavigationPanel from './panels/NavigationPanel';
import ContextPanel from './panels/ContextPanel';
import ChatThread from './panels/ChatThread';
import ThesisWorkspace from './panels/ThesisWorkspace';
import { TerraAIEngine } from '../../core/terraAI/index.js';
import { GeminiService } from '../../core/terraAI/GeminiService.js';
import './TerraDashboard.css';

const TerraDashboard = ({ projectId, appContext, isDrawerMode = false, onCloseDrawer = null, onLayoutModeChange = null }) => {
  // Dual-Core State: GENERAL or THESIS
  const [activeCore, setActiveCore] = useState('GENERAL');
  const [activeMode, setActiveMode] = useState('STUDY'); // STUDY, SOLVE, LOGIC, etc.
  const [isNavOpen, setIsNavOpen] = useState(true);
  
  // Thesis-specific active feature subtab
  const [activeThesisSubMode, setActiveThesisSubMode] = useState('THESIS_IDEATION');
  
  // Dual Layout Modes: WORKSPACE (3-panel split) or FOCUS_CHAT (full width discussion)
  const [layoutMode, setLayoutMode] = useState('WORKSPACE');

  // Mobile view active tab: 'TOOLS' or 'CHAT' (so both are fully accessible on <=900px screens)
  const [mobileActivePanel, setMobileActivePanel] = useState('CHAT');

  // Resizable Right AI Panel Width (in pixels)
  const [chatWidth, setChatWidth] = useState(480);
  const isResizing = useRef(false);
  const [chatScale, setChatScale] = useState(() => {
    return localStorage.getItem('chempilot_chat_scale') || 'md';
  });

  // Telemetry drawer collapsible visibility state (default true on large monitors)
  const [showTelemetry, setShowTelemetry] = useState(window.innerWidth > 1400);

  // Projects state containing multiple chat workflows
  const [projects, setProjects] = useState(() => {
    try {
      const raw = localStorage.getItem('chempilot_terra_projects');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].chats && parsed[0].chats.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse projects:", e);
    }
    const seed = [
      {
        id: 'proj-default-1',
        name: 'Skripsi Utama (Distilasi)',
        createdAt: new Date().toISOString(),
        chats: [
          {
            id: 'chat-default-1',
            name: 'Draf Judul & Ideasi',
            messages: [
              { role: 'assistant', content: 'Halo! Gue Terra, AI Companion lo untuk skripsi. Ada judul atau topik riset yang lagi lo pikirin?', core: 'THESIS' }
            ]
          },
          {
            id: 'chat-default-2',
            name: 'Konsultasi Bab III Metodologi',
            messages: [
              { role: 'assistant', content: 'Halo! Di thread ini kita fokus nyusun Bab III Metodologi ya. Silakan jalankan flowsheet lo lalu klik tombol di tab Metodologi!', core: 'THESIS' }
            ]
          }
        ]
      }
    ];
    localStorage.setItem('chempilot_terra_projects', JSON.stringify(seed));
    return seed;
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem('chempilot_terra_active_project') || 'proj-default-1';
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    return localStorage.getItem('chempilot_terra_active_chat') || 'chat-default-1';
  });

  // Derived active project and chat
  const activeProject = (Array.isArray(projects) && projects.find(p => p.id === activeProjectId)) || (Array.isArray(projects) && projects[0]) || null;
  const activeChat = activeProject?.chats?.find(c => c.id === activeChatId) || activeProject?.chats?.[0] || null;

  // Sync messages from the currently active project chat
  const [messages, setMessages] = useState(() => {
    return (activeChat?.messages && activeChat.messages.length > 0) ? activeChat.messages : [
      { role: 'assistant', content: 'Halo! Saya Core Intelijen TERRA AI. Siap membantu mendesain pabrik, menyelesaikan termodinamika, atau membimbing skripsi Teknik Kimia kamu.' }
    ];
  });

  useEffect(() => {
    if (activeChat) {
      setMessages((activeChat.messages && activeChat.messages.length > 0) ? activeChat.messages : [
        { role: 'assistant', content: 'Halo! Saya Core Intelijen TERRA AI. Siap membantu mendesain pabrik, menyelesaikan termodinamika, atau membimbing skripsi Teknik Kimia kamu.' }
      ]);
    }
  }, [activeChatId, activeProjectId, projects]);

  // Sync AI Workspace (chat projects and histories) from cloud database on mount
  useEffect(() => {
    const syncCloudWorkspace = async () => {
      const token = localStorage.getItem('chempilot_auth_token') || '';
      if (!token) return;
      const host = import.meta.env.VITE_API_URL || '';
      try {
        const res = await fetch(`${host}/api/auth/me/ai-projects?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ai_projects_json) {
            const parsed = JSON.parse(data.ai_projects_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
              localStorage.setItem('chempilot_terra_projects', data.ai_projects_json);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to sync cloud AI workspace:", err);
      }
    };
    syncCloudWorkspace();
  }, []);

  // Debounced auto-save of AI Workspace to cloud database
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    
    // Save to local storage
    localStorage.setItem('chempilot_terra_projects', JSON.stringify(projects));
    
    const token = localStorage.getItem('chempilot_auth_token') || '';
    if (!token) return;
    
    const host = import.meta.env.VITE_API_URL || '';
    const timer = setTimeout(async () => {
      try {
        await fetch(`${host}/api/auth/me/ai-projects?token=${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ai_projects_json: JSON.stringify(projects) })
        });
      } catch (err) {
        console.warn("Failed to auto-save AI workspace to cloud:", err);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [projects]);


  const updateProjectChatMessages = (newMsgsOrFn) => {
    setMessages(prev => {
      const nextVal = typeof newMsgsOrFn === 'function' ? newMsgsOrFn(prev) : newMsgsOrFn;
      setProjects(projPrev => {
        const updated = projPrev.map(p => {
          if (p.id === activeProjectId) {
            return {
              ...p,
              chats: p.chats.map(c => {
                if (c.id === activeChatId) {
                  return { ...c, messages: nextVal };
                }
                return c;
              })
            };
          }
          return p;
        });
        localStorage.setItem('chempilot_terra_projects', JSON.stringify(updated));
        return updated;
      });
      return nextVal;
    });
  };

  const handleSelectProject = (projId) => {
    setActiveProjectId(projId);
    localStorage.setItem('chempilot_terra_active_project', projId);
    const proj = projects.find(p => p.id === projId);
    const firstChatId = proj?.chats?.[0]?.id || '';
    if (firstChatId) {
      setActiveChatId(firstChatId);
      localStorage.setItem('chempilot_terra_active_chat', firstChatId);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    localStorage.setItem('chempilot_terra_active_chat', chatId);
  };

  const handleCreateProject = (name) => {
    const projName = name?.trim() || `Project Baru #${projects.length + 1}`;
    const newProj = {
      id: 'proj-' + Date.now(),
      name: projName,
      createdAt: new Date().toISOString(),
      chats: [
        {
          id: 'chat-' + Date.now() + '-1',
          name: 'Chat Pertama',
          messages: [
            { role: 'assistant', content: `Halo! Ini project "${projName}". Apa yang mau kita bahas sekarang?`, core: activeCore }
          ]
        }
      ]
    };
    const updated = [...projects, newProj];
    setProjects(updated);
    localStorage.setItem('chempilot_terra_projects', JSON.stringify(updated));
    handleSelectProject(newProj.id);
  };

  const handleCreateChat = (projId) => {
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    const newChat = {
      id: 'chat-' + Date.now(),
      name: `Chat #${proj.chats.length + 1}`,
      messages: [
        { role: 'assistant', content: 'Halo! Ada topik baru yang mau lo diskusikan di project ini?', core: activeCore }
      ]
    };
    const updated = projects.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          chats: [...p.chats, newChat]
        };
      }
      return p;
    });
    setProjects(updated);
    localStorage.setItem('chempilot_terra_projects', JSON.stringify(updated));
    handleSelectChat(newChat.id);
  };

  const handleDeleteProject = (projId, e) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert("Lo harus punya minimal satu project di workspace!");
      return;
    }
    if (!confirm("Hapus project ini beserta seluruh chat di dalamnya?")) return;
    const updated = projects.filter(p => p.id !== projId);
    setProjects(updated);
    localStorage.setItem('chempilot_terra_projects', JSON.stringify(updated));
    if (activeProjectId === projId) {
      handleSelectProject(updated[0].id);
    }
  };

  const handleDeleteChat = (projId, chatId, e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === projId);
    if (!proj) return;
    if (proj.chats.length <= 1) {
      alert("Project harus punya minimal satu chat!");
      return;
    }
    if (!confirm("Hapus chat ini?")) return;
    const updated = projects.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          chats: p.chats.filter(c => c.id !== chatId)
        };
      }
      return p;
    });
    setProjects(updated);
    localStorage.setItem('chempilot_terra_projects', JSON.stringify(updated));
    if (activeChatId === chatId) {
      const nextChat = updated.find(p => p.id === projId)?.chats?.[0];
      if (nextChat) {
        handleSelectChat(nextChat.id);
      }
    }
  };

  const handleRenameChat = (projId, chatId, currentName) => {
    const newName = prompt("Masukkan nama baru untuk chat:", currentName);
    if (!newName || !newName.trim()) return;
    const updated = projects.map(p => {
      if (p.id === projId) {
        return {
          ...p,
          chats: p.chats.map(c => {
            if (c.id === chatId) {
              return { ...c, name: newName.trim() };
            }
            return c;
          })
        };
      }
      return p;
    });
    setProjects(updated);
    localStorage.setItem('chempilot_terra_projects', JSON.stringify(updated));
  };
  const [emotionState, setEmotionState] = useState({ stress: 30, confusion: 20, empathyLevel: 'Normal' });
  const [pipelineLog, setPipelineLog] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [engine, setEngine] = useState(null);

  // Student mastery stats (bound to MLEngine context)
  const [masteryData, setMasteryData] = useState(() => {
    const saved = localStorage.getItem('chempilot_mastery');
    return saved ? JSON.parse(saved) : { mass_balance: 45, thermodynamics: 60, reaction: 70, plant_design: 50 };
  });

  // API Key Management
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '';
  const [apiKey, setApiKey] = useState(() => {
    if (envKey) {
      localStorage.setItem('gemini_api_key', envKey);
      return envKey;
    }
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [showApiPrompt, setShowApiPrompt] = useState(() => {
    if (envKey) return false;
    return !localStorage.getItem('gemini_api_key');
  });
  const [tempKey, setTempKey] = useState('');

  useEffect(() => {
    // Initialize TerraAIEngine on mount
    setEngine(new TerraAIEngine('devan'));
  }, []);

  // Save mastery changes
  useEffect(() => {
    localStorage.setItem('chempilot_mastery', JSON.stringify(masteryData));
  }, [masteryData]);

  // Layout mode propagation callback
  useEffect(() => {
    if (onLayoutModeChange) {
      onLayoutModeChange(layoutMode);
    }
  }, [layoutMode, onLayoutModeChange]);

  // Handle core switcher click
  const handleSwitchCore = (core) => {
    setActiveCore(core);
    if (core === 'GENERAL') {
      setActiveMode('STUDY');
    } else {
      setActiveMode(activeThesisSubMode);
    }
  };

  // Sync mode changes
  const handleSelectMode = (mode) => {
    setActiveMode(mode);
    if (mode.startsWith('THESIS_') || mode === 'SUPERVISOR') {
      setActiveThesisSubMode(mode);
    }
  };

  const handleSaveApiKey = () => {
    if (tempKey.trim().length > 10) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowApiPrompt(false);
    }
  };

  // Drag to Resize Handlers
  const startResizing = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e) => {
    if (!isResizing.current) return;
    // Calculate new width relative to window X coordinate
    const newWidth = window.innerWidth - e.clientX - 20;
    // Bind resizing boundaries (min 350px, max 55% of screen width)
    if (newWidth > 350 && newWidth < window.innerWidth * 0.55) {
      setChatWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Central LLM calling and cognitive pipeline triggers
  const handleSendMessage = async (text, file = null, forceCore = null, forceMode = null) => {
    if (!engine) return;

    const currentCore = forceCore || activeCore;
    const currentMode = forceMode || activeMode;

    const newMessages = [...messages, { 
      role: 'user', 
      content: text, 
      attachedFile: file ? { name: file.name, size: file.size } : null 
    }];
    updateProjectChatMessages(newMessages);
    setIsProcessing(true);

    try {
      // Assemble full runtime context
      const runtimeContext = {
        activeProject: projectId || 'None',
        forceCore: currentCore,
        forceMode: currentMode,
        masteryData: masteryData,
        pfd: appContext?.pfd,
        calc: appContext?.calc,
        distill: appContext?.distill,
        activeTab: appContext?.activeTab
      };

      // Wrap text with document content if present
      let processedText = text;
      if (file && file.content) {
        processedText = `[ATTACHED FILE: ${file.name}]\n=== CONTENT ===\n${file.content}\n===============\n\nUser Question: ${text}`;
      }

      // Run Cognitive Pipeline
      const result = engine.processInput(processedText, runtimeContext);

      setEmotionState(result.emotionState);
      setPipelineLog(result.pipelineLog.concat(result.logicLog));
      
      // Update states back to frontend visual cues
      if (!forceCore && !forceMode) {
        setActiveCore(result.detectedCore);
        setActiveMode(result.detectedMode);
        if (result.detectedCore === 'THESIS' && (result.detectedMode.startsWith('THESIS_') || result.detectedMode === 'SUPERVISOR')) {
          setActiveThesisSubMode(result.detectedMode);
        }
      }

      if (apiKey) {
        const gemini = new GeminiService(apiKey);
        const llmResponse = await gemini.generateResponse(result.finalSystemPrompt, result.userMessage);
        
        updateProjectChatMessages([...newMessages, { role: 'assistant', content: llmResponse, core: result.detectedCore }]);

        // Dynamically adjust student mastery based on academic triggers
        if (currentMode === 'SOLVE' && text.toLowerCase().includes('benar')) {
          setMasteryData(prev => ({
            ...prev,
            thermodynamics: Math.min(100, prev.thermodynamics + 5)
          }));
        }
      } else {
        updateProjectChatMessages([...newMessages, { 
          role: 'assistant', 
          content: '**API Key belum dikonfigurasi.**\n\nSilakan masukkan Gemini API Key kamu terlebih dahulu. Klik tombol **"Set API Key"** di panel atas untuk memulai.', 
          core: 'GENERAL',
          isError: true,
          errorType: 'NO_API_KEY'
        }]);
      }
    } catch (error) {
      console.error('Terra AI error:', error);
      // Classify error for better UX
      const isAuthError = error.message?.toLowerCase().includes('api key') || error.message?.toLowerCase().includes('401') || error.message?.toLowerCase().includes('403') || error.message?.toLowerCase().includes('invalid');
      const isNetworkError = error.message?.toLowerCase().includes('network') || error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('timeout');
      const errorMsg = isAuthError
        ? '**API Key tidak valid atau sudah kedaluwarsa.**\n\nSilakan perbarui API Key kamu melalui tombol **"Set API Key"** di panel atas.'
        : isNetworkError
        ? '**Gagal terhubung ke server AI.**\n\nPeriksa koneksi internet kamu, lalu coba lagi.'
        : `**Terjadi kesalahan pada sistem.**\n\n\`${error.message}\``;
      updateProjectChatMessages([...newMessages, { 
        role: 'assistant', 
        content: errorMsg,
        core: 'GENERAL',
        isError: true,
        errorType: isAuthError ? 'AUTH_ERROR' : isNetworkError ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(projects, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `chempilot_terra_backup_${Date.now()}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      alert("Gagal melakukan backup data: " + e.message);
    }
  };

  const handleImportData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].chats) {
            setProjects(parsed);
            localStorage.setItem('chempilot_terra_projects', JSON.stringify(parsed));
            setActiveProjectId(parsed[0].id);
            localStorage.setItem('chempilot_terra_active_project', parsed[0].id);
            if (parsed[0].chats && parsed[0].chats.length > 0) {
              setActiveChatId(parsed[0].chats[0].id);
              localStorage.setItem('chempilot_terra_active_chat', parsed[0].chats[0].id);
            }
            alert("Data berhasil dipulihkan dari backup!");
          } else {
            alert("Format file backup tidak valid.");
          }
        } catch (err) {
          alert("Gagal mengimpor file: " + err.message);
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  // Determine dynamic Neural Orb visual color representation
  const getOrbState = () => {
    if (activeMode === 'THESIS_DEFENSE') return 'defense';
    if (activeMode === 'SUPERVISOR') return 'critic';
    return activeCore === 'THESIS' ? 'thesis' : 'general';
  };

  return (
    <div className={`terra-dashboard ${isDrawerMode ? 'drawer-layout' : ''}`} style={{ position: 'relative' }}>
      
      {/* API Key Modal Overlay */}
      {showApiPrompt && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.9)', backdropFilter: 'blur(15px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ padding: '30px', maxWidth: '400px', textAlign: 'center', borderColor: 'var(--terra-general-glow)', background: 'rgba(15, 23, 42, 0.95)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🧠</div>
            <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '15px', color: '#fff' }}>TERRA Neural Core</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '20px', lineHeight: 1.6 }}>
              Masukkan Google Gemini API Key untuk menghubungkan neural core dengan kecerdasan simulasi. API Key disimpan aman secara lokal di browser Anda.
            </p>
            <input 
              type="password" 
              placeholder="AIzaSy..." 
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              style={{
                width: '100%', padding: '12px', marginBottom: '20px',
                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', borderRadius: '6px', outline: 'none'
              }}
            />
            <button 
              onClick={handleSaveApiKey}
              className="primary-btn"
              style={{ width: '100%', padding: '12px' }}
            >
              Nyalakan Mesin Intelijen
            </button>
          </div>
        </div>
      )}

      {/* 1. LEFT PANEL - Brain Navigation Sidebar with Toggle */}
      {!isDrawerMode && isNavOpen && (
        <NavigationPanel 
          activeCore={activeCore}
          activeMode={activeMode} 
          setActiveMode={handleSelectMode} 
          onSwitchCore={handleSwitchCore}
          getOrbState={getOrbState}
          isProcessing={isProcessing}
          projectId={projectId}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          projects={projects}
          activeProjectId={activeProjectId}
          activeChatId={activeChatId}
          onSelectProject={handleSelectProject}
          onSelectChat={handleSelectChat}
          onCreateProject={handleCreateProject}
          onCreateChat={handleCreateChat}
          onDeleteProject={handleDeleteProject}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />
      )}

      {/* Floating Toggle Button for Navigation Sidebar */}
      {!isDrawerMode && (
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className={`terra-nav-toggle-floating ${isNavOpen ? 'nav-open' : 'nav-closed'}`}
          title={isNavOpen ? "Collapse Intelligence Sidebar" : "Expand Intelligence Sidebar"}
        >
          {isNavOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>
      )}

      {/* 2. DYNAMIC WORKSPACE PANEL LAYOUTS */}
      <div className="terra-dashboard-body">
        
        {/* Core 1: General Intelligence Workspace */}
        {activeCore === 'GENERAL' && (
          <>
            {/* Center Panel: Chat thread takes main focal area */}
            <ChatThread 
              messages={messages} 
              isProcessing={isProcessing} 
              onSendMessage={(text, file) => handleSendMessage(text, file)} 
              activeCore={activeCore}
              activeMode={activeMode}
              onSwitchCore={handleSwitchCore}
              onSelectMode={handleSelectMode}
              isDrawerMode={isDrawerMode}
              onClose={onCloseDrawer}
              layoutMode="FOCUS_CHAT"
              chatScale={chatScale}
              setChatScale={setChatScale}
            />
            
            {/* Right Panel: Live insights system monitor */}
            {!isDrawerMode && showTelemetry && (
              <ContextPanel 
                emotionState={emotionState} 
                pipelineLog={pipelineLog} 
                masteryData={masteryData}
              />
            )}
          </>
        )}

        {/* Core 2: Thesis Advisor Workspace */}
        {activeCore === 'THESIS' && (
          <>
            {/* Mobile View Toggle Switch for Thesis Core */}
            <div className="mobile-workspace-toggle-bar">
              <button 
                className={`toggle-btn ${mobileActivePanel === 'TOOLS' ? 'active' : ''}`}
                onClick={() => setMobileActivePanel('TOOLS')}
              >
                📝 Workspace Tools
              </button>
              <button 
                className={`toggle-btn ${mobileActivePanel === 'CHAT' ? 'active' : ''}`}
                onClick={() => setMobileActivePanel('CHAT')}
              >
                💬 Chat Discussion
              </button>
            </div>

            {layoutMode === 'WORKSPACE' ? (
              <>
                {/* Center Panel: Tool workspace splits on the left (or visible on mobile drawer) */}
                <div className={`thesis-workspace-panel-wrapper ${mobileActivePanel === 'TOOLS' ? 'mobile-visible' : 'mobile-hidden'}`}>
                  <ThesisWorkspace 
                    onSendMessage={handleSendMessage} 
                    messages={messages} 
                    isProcessing={isProcessing} 
                    activeSubMode={activeThesisSubMode}
                    setActiveSubMode={setActiveThesisSubMode}
                    appContext={appContext}
                  />
                </div>
                
                {/* Interactive Drag Resizer Divider Bar */}
                {!isDrawerMode && (
                  <div className="workspace-resizer" onMouseDown={startResizing}>
                    <div className="resizer-bar-glow"></div>
                  </div>
                )}
                
                {/* Right Panel: Resizable Chat Panel container */}
                <div 
                  className={`thesis-chat-panel-wrapper ${mobileActivePanel === 'CHAT' ? 'mobile-visible' : 'mobile-hidden'}`}
                  style={{ width: isDrawerMode ? '100%' : `${chatWidth}px`, flexShrink: 0 }}
                >
                  <ChatThread 
                    messages={messages} 
                    isProcessing={isProcessing} 
                    onSendMessage={(text, file) => handleSendMessage(text, file)} 
                    activeCore={activeCore}
                    activeMode={activeMode}
                    onSwitchCore={handleSwitchCore}
                    onSelectMode={handleSelectMode}
                    isDrawerMode={isDrawerMode}
                    onClose={onCloseDrawer}
                    layoutMode={layoutMode}
                    chatScale={chatScale}
                    setChatScale={setChatScale}
                  />
                </div>
              </>
            ) : (
              // Focus Chat Mode: Chat container covers the entire viewport center space
              <div className="focus-chat-workspace-wrapper">
                <ChatThread 
                  messages={messages} 
                  isProcessing={isProcessing} 
                  onSendMessage={(text, file) => handleSendMessage(text, file)} 
                  activeCore={activeCore}
                  activeMode={activeMode}
                  onSwitchCore={handleSwitchCore}
                  onSelectMode={handleSelectMode}
                  isDrawerMode={isDrawerMode}
                  onClose={onCloseDrawer}
                  layoutMode="FOCUS_CHAT"
                  chatScale={chatScale}
                  setChatScale={setChatScale}
                />
              </div>
            )}
          </>
        )}
        
      </div>
      
    </div>
  );
};

export default TerraDashboard;
