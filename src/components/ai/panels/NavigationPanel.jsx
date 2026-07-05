import React from 'react';
import { 
  Folder, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Layout, 
  Cpu, 
  GraduationCap, 
  BookOpen, 
  Calculator, 
  Layers, 
  Search, 
  Heart, 
  Lightbulb, 
  BarChart2, 
  FileText, 
  UserCheck, 
  Edit3 
} from 'lucide-react';

const NavigationPanel = ({ 
  activeCore, 
  activeMode, 
  setActiveMode, 
  onSwitchCore, 
  getOrbState, 
  isProcessing,
  projectId,
  layoutMode,
  setLayoutMode,
  projects = [],
  activeProjectId,
  activeChatId,
  onSelectProject,
  onSelectChat,
  onCreateProject,
  onCreateChat,
  onDeleteProject,
  onDeleteChat,
  onRenameChat,
  onExportData,
  onImportData
}) => {
  const generalModes = [
    { id: 'STUDY', icon: <BookOpen size={14} />, label: 'Study Mode', desc: 'Active recall & tutoring' },
    { id: 'SOLVE', icon: <Calculator size={14} />, label: 'Solve Mode', desc: 'Mathematical derivations' },
    { id: 'LOGIC', icon: <Cpu size={14} />, label: 'Logic Mode', desc: 'Chain-of-Thought reasoning' },
    { id: 'PLANT', icon: <Layers size={14} />, label: 'Plant Mode', desc: 'Troubleshoot PFD systems' },
    { id: 'RESEARCH', icon: <Search size={14} />, label: 'Research Mode', desc: 'Journal & paper studies' },
    { id: 'COMPANION', icon: <Heart size={14} />, label: 'Companion Mode', desc: 'Stress management' }
  ];

  const thesisModes = [
    { id: 'THESIS_IDEATION', icon: <Lightbulb size={14} />, label: 'Ideation Engine', desc: 'Generate novelty ideas' },
    { id: 'THESIS_EVALUATION', icon: <BarChart2 size={14} />, label: 'Topic Evaluator', desc: 'Critique study feasibility' },
    { id: 'THESIS_PROPOSAL', icon: <FileText size={14} />, label: 'Proposal Builder', desc: 'Draft outlines & objectives' },
    { id: 'THESIS_LITERATURE', icon: <Search size={14} />, label: 'Lit Analysis', desc: 'Identify research gaps' },
    { id: 'SUPERVISOR', icon: <UserCheck size={14} />, label: 'Supervisor Mode', desc: 'Strict professor debate' },
    { id: 'THESIS_CRITIC', icon: <Edit3 size={14} />, label: 'Writing Critic', desc: 'Review scientific drafts' },
    { id: 'THESIS_DEFENSE', icon: <GraduationCap size={14} />, label: 'Defense Mode', desc: 'Simulate defense panel' }
  ];

  const activeModesList = activeCore === 'GENERAL' ? generalModes : thesisModes;

  return (
    <div className="terra-nav-panel-rebuilt" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", gap: "16px" }}>
      {/* Brand Section */}
      <div className="brand-section-nav">
        <div className={`neural-orb-large ${getOrbState()} ${isProcessing ? 'thinking' : ''}`}>
          <div className="orb-pulse-ring"></div>
          <span className="orb-center-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeCore === 'THESIS' ? <GraduationCap size={20} /> : <Cpu size={20} />}
          </span>
        </div>
        <h3 className="brand-title">TERRA CORE</h3>
        <p className="brand-sub">Neural Intelligence OS</p>
      </div>

      {/* Core Selector Segments */}
      <div className="nav-core-switcher">
        <button 
          className={`switcher-btn ${activeCore === 'GENERAL' ? 'active general' : ''}`}
          onClick={() => onSwitchCore('GENERAL')}
        >
          General Intel
        </button>
        <button 
          className={`switcher-btn ${activeCore === 'THESIS' ? 'active thesis' : ''}`}
          onClick={() => onSwitchCore('THESIS')}
        >
          Thesis Advisor
        </button>
      </div>

      {/* AI Projects & Workflows Section */}
      <div className="nav-section projects-section-nav" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '150px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingRight: '8px' }}>
          <h4 className="section-label" style={{ margin: 0 }}>My Projects</h4>
          <button 
            onClick={() => {
              const name = prompt("Masukkan nama project baru:");
              if (name && name.trim()) onCreateProject(name);
            }} 
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.62rem',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'; }}
          >
            <Plus size={10} /> New
          </button>
        </div>

        <div className="projects-scroll-list" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
          {(!projects || projects.length === 0) ? (
            <div style={{ fontSize: '0.7rem', color: '#64748b', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
              No projects found. Click "+ New" to start.
            </div>
          ) : projects.map(proj => {
            const isExpanded = activeProjectId === proj.id;
            return (
              <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Project Header Item */}
                <div 
                  onClick={() => onSelectProject(proj.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isExpanded ? 'rgba(168, 85, 247, 0.06)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isExpanded ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  className="project-row-header"
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: isExpanded ? '#a855f7' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    <Folder size={12} color={isExpanded ? '#a855f7' : '#64748b'} /> {proj.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => onCreateChat(proj.id)}
                      style={{ background: 'none', border: 'none', color: '#475569', display: 'flex', padding: 2, cursor: 'pointer', transition: 'color 0.2s' }}
                      title="Add chat to project"
                      onMouseOver={(e) => { e.currentTarget.style.color = '#38bdf8'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = '#475569'; }}
                    >
                      <Plus size={10} />
                    </button>
                    <button 
                      onClick={(e) => onDeleteProject(proj.id, e)}
                      style={{ background: 'none', border: 'none', color: '#475569', display: 'flex', padding: 2, cursor: 'pointer', transition: 'color 0.2s' }}
                      title="Delete project"
                      onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = '#475569'; }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>

                {/* Chats Sub-List */}
                {isExpanded && (
                  <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid rgba(168, 85, 247, 0.1)', marginLeft: '16px' }}>
                    {proj.chats.map(chat => {
                      const isActiveChat = activeChatId === chat.id;
                      return (
                        <div 
                          key={chat.id}
                          onClick={() => onSelectChat(chat.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: isActiveChat ? 'rgba(56, 189, 248, 0.04)' : 'transparent',
                            border: `1px solid ${isActiveChat ? 'rgba(56, 189, 248, 0.1)' : 'transparent'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          className="chat-subrow-item"
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: isActiveChat ? '#38bdf8' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>
                            <MessageSquare size={10} color={isActiveChat ? '#38bdf8' : '#475569'} /> {chat.name}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => onRenameChat(proj.id, chat.id, chat.name)}
                              style={{ background: 'none', border: 'none', color: '#334155', display: 'flex', padding: 2, cursor: 'pointer', transition: 'color 0.2s' }}
                              title="Rename chat"
                              onMouseOver={(e) => { e.currentTarget.style.color = '#38bdf8'; }}
                              onMouseOut={(e) => { e.currentTarget.style.color = '#334155'; }}
                            >
                              <Edit2 size={8} />
                            </button>
                            <button 
                              onClick={(e) => onDeleteChat(proj.id, chat.id, e)}
                              style={{ background: 'none', border: 'none', color: '#334155', display: 'flex', padding: 2, cursor: 'pointer', transition: 'color 0.2s' }}
                              title="Delete chat"
                              onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                              onMouseOut={(e) => { e.currentTarget.style.color = '#334155'; }}
                            >
                              <X size={8} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Layout Mode Switcher */}
      <div className="nav-section layout-mode-section">
        <h4 className="section-label">Layout Mode</h4>
        <div className="nav-layout-toggle-group">
          <button 
            className={`layout-toggle-btn-nav ${layoutMode === 'WORKSPACE' ? 'active' : ''}`}
            onClick={() => setLayoutMode('WORKSPACE')}
            title="Split Workspace Mode"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <Layout size={10} /> Workspace
          </button>
          <button 
            className={`layout-toggle-btn-nav ${layoutMode === 'FOCUS_CHAT' ? 'active' : ''}`}
            onClick={() => setLayoutMode('FOCUS_CHAT')}
            title="Focus Chat Mode"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <MessageSquare size={10} /> Focus Chat
          </button>
        </div>
      </div>

      {/* Dynamic Mode Navigation */}
      <div className="nav-section modes-section">
        <h4 className="section-label">Cognitive Modules</h4>
        <div className="modes-scroll-list" style={{ overflowY: "auto", maxHeight: "200px", paddingRight: "4px" }}>
          {activeModesList.map(mode => (
            <div 
              key={mode.id}
              className={`mode-row-item ${activeMode === mode.id ? 'active' : ''} ${activeCore === 'THESIS' ? 'thesis' : 'general'}`}
              onClick={() => setActiveMode(mode.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span className="mode-icon-box" style={{ display: 'flex', alignItems: 'center', color: activeMode === mode.id ? 'currentColor' : '#475569' }}>
                {mode.icon}
              </span>
              <div className="mode-meta-box">
                <span className="mode-label-text" style={{ fontSize: '0.75rem' }}>{mode.label}</span>
                <span className="mode-desc-text" style={{ fontSize: '0.6rem' }}>{mode.desc}</span>
              </div>
              {activeMode === mode.id && <span className="active-led-nav"></span>}
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Backup Controls */}
      <div className="nav-section backup-section" style={{ borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          <button 
            onClick={onExportData}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#94a3b8',
              borderRadius: '4px',
              padding: '4px 0',
              fontSize: '0.58rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
          >
            💾 Backup Data
          </button>
          <button 
            onClick={onImportData}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#94a3b8',
              borderRadius: '4px',
              padding: '4px 0',
              fontSize: '0.58rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
          >
            📂 Restore Data
          </button>
        </div>
      </div>

      {/* Active Project Footer */}
      <div className="nav-footer-project" style={{ marginTop: 'auto', border: '1px solid rgba(255,255,255,0.02)' }}>
        <div className="proj-dot active"></div>
        <div className="proj-details-nav">
          <span className="lbl">ATTACHED WORKSPACE</span>
          <span className="val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.5px' }}>{projectId || 'proj-default-1'}</span>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;
