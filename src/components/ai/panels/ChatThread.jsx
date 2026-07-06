import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mammoth from 'mammoth';
import { 
  User, 
  Cpu, 
  GraduationCap, 
  Paperclip, 
  ArrowUp, 
  X, 
  Radio, 
  Settings2,
  FileText,
  AlertCircle,
  WifiOff,
  KeyRound,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const parsePdf = async (arrayBuffer) => {
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += `\n--- Halaman ${i} ---\n${pageText}\n`;
  }
  return fullText;
};

const ChatThread = ({ 
  messages, 
  isProcessing, 
  onSendMessage, 
  activeCore, 
  activeMode, 
  onSwitchCore, 
  onSelectMode, 
  isDrawerMode, 
  onClose,
  layoutMode,
  chatScale,
  setChatScale
}) => {
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [thinkingMessage, setThinkingMessage] = useState('Terra processing thought impulses...');

  const handleAdjustScale = (direction) => {
    const scales = ['xs', 'sm', 'md', 'lg'];
    const currentIndex = scales.indexOf(chatScale || 'md');
    let nextIndex = currentIndex;
    if (direction === 'in' && currentIndex < scales.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'out' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }
    const nextScale = scales[nextIndex];
    if (setChatScale) {
      setChatScale(nextScale);
    }
    localStorage.setItem('engineeros_chat_scale', nextScale);
  };

  // Automatically scroll messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Cycle thinking statuses during processing states
  useEffect(() => {
    if (!isProcessing) return;
    
    // Choose status based on mode
    const statuses = {
      THESIS_IDEATION: [
        'Terra analyzing thesis novelty...',
        'Filtering chemical process options...',
        'Cross-referencing industry relevance matrices...'
      ],
      THESIS_EVALUATION: [
        'Evaluating methodology complexity...',
        'Checking research gap dimensions...',
        'Assessing thermodynamic viability constraints...'
      ],
      THESIS_PROPOSAL: [
        'Compiling proposal skeleton...',
        'Validating research objectives...',
        'Structuring experimental variables...'
      ],
      THESIS_DEFENSE: [
        'Supervisor formulating response...',
        'Dr. Rahma checking material balance...',
        'Prof. Budi assessing scaling economics...'
      ],
      SUPERVISOR: [
        'Professor reviewing academic claims...',
        'Scanning Perry\'s Handbook for heuristics...',
        'Identifying logical fallacies in assertions...'
      ]
    };

    const selectedStatuses = statuses[activeMode] || [
      'Terra assembling equations...',
      'Mapping chemical engineering ontology...',
      'Compiling AI mentor instructions...'
    ];

    let index = 0;
    setThinkingMessage(selectedStatuses[0]);

    const interval = setInterval(() => {
      index = (index + 1) % selectedStatuses.length;
      setThinkingMessage(selectedStatuses[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isProcessing, activeMode]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show visual indicator that extraction is active
    setAttachedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      content: '[Sedang mengekstrak teks dokumen...]'
    });

    const isPdf = file.name.endsWith('.pdf');
    const isDocx = file.name.endsWith('.docx');

    if (isPdf || isDocx) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          let text = '';
          if (isPdf) {
            text = await parsePdf(arrayBuffer);
          } else {
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
          }
          setAttachedFile({
            name: file.name,
            size: file.size,
            type: file.type,
            content: text
          });
        } catch (err) {
          console.error("Gagal membaca dokumen:", err);
          setAttachedFile({
            name: file.name,
            size: file.size,
            type: file.type,
            content: `[Error: Gagal mengekstrak dokumen. Detail: ${err.message}]`
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (
      file.type.startsWith('text/') || 
      file.name.endsWith('.json') || 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.md') || 
      file.name.endsWith('.py') || 
      file.name.endsWith('.js') || 
      file.name.endsWith('.xml')
    ) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          content: event.target.result
        });
      };
      reader.readAsText(file);
    } else {
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        content: "[File ini bukan teks, PDF, atau Word. Metadata parsed.]"
      });
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() || attachedFile) {
      onSendMessage(input, attachedFile);
      setInput('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`terra-chat-panel-rebuilt ${isDrawerMode ? 'in-drawer' : ''} ${layoutMode === 'FOCUS_CHAT' ? 'focus-mode' : ''} scale-${chatScale}`}>
      
      {/* 1. COMPACT DRAWER HEADER */}
      {isDrawerMode && (
        <div className="drawer-header-compact">
          <div className="hdr-top">
            <div className="core-lbl-nav">
              <span className="dot"></span>
              <span>TERRA INTEL CORE</span>
            </div>
            <button className="close-btn-nav" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
          <div className="hdr-selects">
            <select 
              value={activeCore} 
              onChange={(e) => onSwitchCore(e.target.value)}
              className="compact-select"
            >
              <option value="GENERAL">General Core</option>
              <option value="THESIS">Thesis Core</option>
            </select>
            <select 
              value={activeMode} 
              onChange={(e) => onSelectMode(e.target.value)}
              className="compact-select"
            >
              {activeCore === 'GENERAL' ? (
                <>
                  <option value="STUDY">Study Mode</option>
                  <option value="SOLVE">Solve Mode</option>
                  <option value="LOGIC">Logic Mode</option>
                  <option value="PLANT">Plant Mode</option>
                  <option value="RESEARCH">Research Mode</option>
                  <option value="COMPANION">Companion Mode</option>
                </>
              ) : (
                <>
                  <option value="THESIS_IDEATION">Ideation Engine</option>
                  <option value="THESIS_EVALUATION">Topic Evaluator</option>
                  <option value="THESIS_PROPOSAL">Proposal Builder</option>
                  <option value="THESIS_METHODOLOGY">Methodology Writer</option>
                  <option value="THESIS_LITERATURE">Lit Analysis</option>
                  <option value="SUPERVISOR">Supervisor Mode</option>
                  <option value="THESIS_CRITIC">Writing Critic</option>
                  <option value="THESIS_DEFENSE">Defense Mode</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* 2. CHAT MESSAGE AREA */}
      <div className="chat-viewport-rebuilt">
        {messages.map((msg, index) => (
          <div key={index} className={`bubble-row ${msg.role} ${msg.core === 'THESIS' ? 'thesis' : 'general'} ${msg.isCoPilot ? 'co-pilot' : ''} ${msg.isError ? 'error-bubble-row' : ''}`}>
            <div className="bubble-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {msg.isError
                ? (msg.errorType === 'NETWORK_ERROR' ? <WifiOff size={14}/> : msg.errorType === 'AUTH_ERROR' || msg.errorType === 'NO_API_KEY' ? <KeyRound size={14}/> : <AlertCircle size={14}/>)
                : msg.isCoPilot ? <Radio size={14} /> : (msg.role === 'user' ? <User size={14} /> : (msg.core === 'THESIS' ? <GraduationCap size={14} /> : <Cpu size={14} />))
              }
            </div>
            <div className={`bubble-text-content ${msg.isError ? 'error-bubble-content' : ''}`}>
              {msg.isCoPilot && (
                <div className="co-pilot-hdr" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Cpu size={10} /> CO-PILOT ADVICE
                </div>
              )}
              {msg.isError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.60rem', fontFamily: 'var(--font-mono)', color: '#f59e0b', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>
                  <AlertCircle size={11}/>
                  {msg.errorType === 'NO_API_KEY' ? 'API KEY REQUIRED' : msg.errorType === 'AUTH_ERROR' ? 'AUTHENTICATION ERROR' : msg.errorType === 'NETWORK_ERROR' ? 'CONNECTION ERROR' : 'SYSTEM ERROR'}
                </div>
              )}
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <>
                  {msg.attachedFile && (
                    <div className="chat-message-attachment-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Paperclip size={10} />
                      <span>{msg.attachedFile.name}</span>
                    </div>
                  )}
                  <div>{msg.content}</div>
                </>
              )}
            </div>
          </div>
        ))}
        
        {/* Animated Processing Status Indicator */}
        {isProcessing && (
          <div className="bubble-row assistant processing-state">
            <div className="bubble-avatar animate-pulse" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings2 size={14} />
            </div>
            <div className="processing-text-wrapper">
              <span className="thinking-log-ticker">{thinkingMessage}</span>
              <div className="pulse-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 3. CAPSULE CHAT INPUT AREA */}
      <div className="chat-input-capsule-container">
        {attachedFile && (
          <div className="attached-file-preview-pill">
            <FileText size={12} color="#38bdf8" />
            <span className="file-name">{attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)</span>
            <button type="button" className="remove-attached-file-btn" onClick={() => setAttachedFile(null)}>
              <X size={8} />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="chat-input-capsule-form">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <button 
            type="button" 
            className="capsule-attach-btn" 
            onClick={() => fileInputRef.current?.click()}
            title="Attach document or data"
          >
            <Paperclip size={16} />
          </button>
          
          {/* Visual Scale Zoom Controls */}
          <div className="chat-scale-controls-pills" style={{ display: 'flex', gap: 2, paddingRight: 6, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              type="button"
              className="scale-ctrl-btn"
              onClick={() => handleAdjustScale('out')}
              title="Kecilkan Tampilan Chat (Zoom Out)"
              style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <ZoomOut size={13} />
            </button>
            <button 
              type="button"
              className="scale-ctrl-btn"
              onClick={() => handleAdjustScale('in')}
              title="Besarkan Tampilan Chat (Zoom In)"
              style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <ZoomIn size={13} />
            </button>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              attachedFile 
                ? `Attached: ${attachedFile.name}. Ask Terra...` 
                : (activeCore === 'THESIS' 
                    ? "Tanya skripsi, diskusikan gap riset, atau draf metode..." 
                    : "Tanya konsep teknik kimia, rumus balance, atau optimasi...")
            }
            disabled={isProcessing}
            className="capsule-input"
          />
          <button 
            type="submit" 
            disabled={isProcessing || (!input.trim() && !attachedFile)}
            className={`ios-send-btn ${activeCore === 'THESIS' ? 'thesis' : 'general'} ${(!input.trim() && !attachedFile) ? 'disabled' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isProcessing ? (
              <div className="ios-spinner"></div>
            ) : (
              <ArrowUp size={16} />
            )}
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatThread;
