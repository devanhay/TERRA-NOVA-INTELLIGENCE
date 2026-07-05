import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Workflow, LayoutGrid, BookOpen, Library,
  FlaskConical, ArrowLeftRight, Scale, Zap, Thermometer,
  Atom, BrainCircuit, ChevronLeft, Menu, Folder, FolderPlus,
  CheckCircle2, AlertTriangle, X, FilePlus,
  Globe, Monitor, Wind
} from 'lucide-react'
import './App.css'
import UnitConverter from './components/UnitConverter'
import MassBalance from './components/MassBalance'
import EnergyBalance from './components/EnergyBalance'
import Thermodynamics from './components/Thermodynamics'
import ReactionEng from './components/ReactionEng'
import AICompanion from './components/AICompanion'
import CalculatorHub from './components/CalculatorHub'
import FormulaLibrary from './components/FormulaLibrary'
import PFDBuilder from './components/PFDBuilder'
import DistillationDesign from './components/DistillationDesign'
import TerraDashboard from './components/ai/TerraDashboard'
import Dashboard from './components/Dashboard'
import BookLibrary from './components/BookLibrary'
import AuthModal from './components/AuthModal'

// ── BOOT SEQUENCE ──────────────────────────────
const BOOT_LINES = [
  { text: 'initializing terra-nova-os...', delay: 0,    status: 'ok' },
  { text: 'loading Peng-Robinson EOS engine', delay: 250, status: 'ok' },
  { text: 'compiling McCabe-Thiele stage stepping', delay: 500, status: 'ok' },
  { text: 'mounting parametric sensitivity solver', delay: 750, status: 'ok' },
  { text: 'connecting jarvis companion engine', delay: 1000, status: 'ok' },
  { text: 'system ready',                  delay: 1250, status: 'ok' },
]

function BootScreen({ onDone }) {
  const [lines, setLines] = useState([])
  const [barW, setBarW] = useState(0)

  useEffect(() => {
    BOOT_LINES.forEach((l, i) => {
      setTimeout(() => setLines(p => [...p, l]), l.delay)
    })
    
    const interval = setInterval(() => {
      setBarW(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 38)

    setTimeout(onDone, 2400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="boot-overlay">
      {/* Background Neon Glow Orbs */}
      <div className="boot-glow-orb orb-purple" />
      <div className="boot-glow-orb orb-emerald" />

      {/* Morphoglass Card */}
      <div className="boot-glass-card">
        {/* Animated Neural Spinner */}
        <div className="boot-spinner-container">
          <div className="boot-spinner-outer" />
          <div className="boot-spinner-inner" />
          <div className="boot-spinner-core" />
        </div>

        <div className="boot-logo">
          <span>Chem</span>pilot <span style={{ color: '#38bdf8', fontSize: '0.65em', fontWeight: 600 }}>OS</span>
        </div>
        <div className="boot-sub">TERRA NOVA OS · V5.0 (QUANTUM LEAP)</div>

        <div className="boot-log">
          {lines.map((l, i) => (
            <div key={i} className="boot-log-line">
              <span className="boot-log-prefix">❯</span>
              <span className="boot-log-text">{l.text}</span>
              <span className="boot-log-ok">✓ READY</span>
            </div>
          ))}
        </div>

        <div className="boot-bar">
          <div className="boot-bar-fill" style={{ width: `${barW}%` }} />
        </div>
        <div className="boot-progress-percent">
          LOADING CORES ({Math.round(barW)}%)
        </div>
      </div>
    </div>
  )
}

// ── NAV STRUCTURE ──────────────────────────────
const NAV = [
  { id: 'home',      Icon: LayoutDashboard, label: 'Dashboard',          group: 'SYSTEM' },
  { id: 'pfd',       Icon: Workflow,        label: 'PFD Builder',        group: 'SYSTEM', badge: 'NEW' },
  { id: 'hub',       Icon: LayoutGrid,      label: 'Calculator Hub',     group: 'SYSTEM' },
  { id: 'formulas',  Icon: BookOpen,        label: 'Formula Library',    group: 'SYSTEM' },
  { id: 'library',   Icon: Library,         label: 'Bookmart Library',   group: 'SYSTEM', badge: 'NEW' },
  { id: 'distill',   Icon: FlaskConical,    label: 'Distillation Design',group: 'CHEMENG', badge: 'NEW' },
  { id: 'converter', Icon: ArrowLeftRight,  label: 'Unit Converter',     group: 'CHEMENG' },
  { id: 'mass',      Icon: Scale,           label: 'Mass Balance',       group: 'CHEMENG' },
  { id: 'energy',    Icon: Zap,             label: 'Energy Balance',     group: 'CHEMENG' },
  { id: 'thermo',    Icon: Thermometer,     label: 'Thermodynamics',     group: 'CHEMENG' },
  { id: 'reaction',  Icon: Atom,            label: 'Reaction Eng.',      group: 'CHEMENG' },
  { id: 'ai',        Icon: BrainCircuit,    label: 'AI Companion',       group: 'AI' },
]

const PAGE_META = {
  home:      { title: 'Dashboard',            desc: 'Terra Nova Intelligence · Engineering OS' },
  pfd:       { title: 'PFD Builder',          desc: 'Drag-drop process flow diagram designer' },
  hub:       { title: 'Calculator Hub',       desc: '19+ calculators · 5 disciplines · AI solver' },
  formulas:  { title: 'Formula Library',      desc: '30+ formulas · searchable · bookmark favorites' },
  library:   { title: 'Bookmarks',            desc: 'Reference books, PDF translation, and AI annotation' },
  distill:   { title: 'Distillation Design',  desc: 'Fenske-Underwood-Gilliland shortcut method' },
  converter: { title: 'Unit Converter',       desc: '8 categories · 50+ units' },
  mass:      { title: 'Mass Balance',         desc: 'Single stream · mixer · reactor · separator' },
  energy:    { title: 'Energy Balance',       desc: 'Sensible · latent · HX · combustion' },
  thermo:    { title: 'Thermodynamics',       desc: 'Ideal gas · enthalpy · isentropic · Cp/Cv' },
  reaction:  { title: 'Reaction Engineering', desc: 'CSTR · PFR · Batch · Arrhenius' },
  ai:        { title: 'AI Companion',         desc: 'Claude AI · Chemical Engineering Mentor' },
}

// ── DASHBOARD COMPONENT IMPORTED FROM ./components/Dashboard.jsx ──────────────────

// ── ROOT APP ───────────────────────────────────
// ── DEFAULT FLOWSHEETS FOR PROJECT SEEDING ──────────────────────────────
const DEFAULT_FLOWSHEET_1 = {
  nodes: [
    { id: 'n1', type: 'feedtank', label: 'Feed Tank', tag: 'T-101', x: 100, y: 150, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
    { id: 'n2', type: 'pump', label: 'Pump', tag: 'P-101', x: 280, y: 150, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
    { id: 'n3', type: 'heater', label: 'Heater', tag: 'H-101', x: 460, y: 150, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
    { id: 'n4', type: 'storagetank', label: 'Storage Tank', tag: 'TK-101', x: 640, y: 150, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
  ],
  streams: [
    { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
    { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
    { id: 'S-103', from: 'n3', to: 'n4', data: {}, calculated: false }
  ],
  equipParams: {
    n1: { flow: '10', temp: '25', press: '101.3', zA: '50' },
    n2: { pressureRise: '300', efficiency: '75', npshr: '1.5', staticHead: '2' },
    n3: { targetTemp: '80', pressDrop: '10' },
    n4: { volume: '100' }
  },
  activePreset: 'Benzene-Toluene',
  thermoModel: 'Ideal',
  NC: 5,
  SC: 104
}

const DEFAULT_FLOWSHEET_2 = {
  nodes: [
    { id: 'n1', type: 'feedtank', label: 'Feed Tank', tag: 'T-101', x: 80, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
    { id: 'n2', type: 'distillation', label: 'Distillation', tag: 'C-101', x: 260, y: 220, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
    { id: 'n3', type: 'storagetank', label: 'Storage Tank', tag: 'TK-101', x: 460, y: 80, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false },
    { id: 'n4', type: 'storagetank', label: 'Storage Tank', tag: 'TK-102', x: 460, y: 360, calculated: false, results: null, error: null, warnings: [], _hasWarnings: false }
  ],
  streams: [
    { id: 'S-101', from: 'n1', to: 'n2', data: {}, calculated: false },
    { id: 'S-102', from: 'n2', to: 'n3', data: {}, calculated: false },
    { id: 'S-103', from: 'n2', to: 'n4', data: {}, calculated: false }
  ],
  equipParams: {
    n1: { flow: '15', temp: '90', press: '101.3', zA: '45' },
    n2: { refluxRatio: '2.5', distillatePurity: '95', bottomsPurity: '5', operatingPressure: '101.3', feedQuality: '1' },
    n3: { volume: '200' },
    n4: { volume: '200' }
  },
  activePreset: 'Benzene-Toluene',
  thermoModel: 'Ideal',
  NC: 5,
  SC: 104
}

// Seed default templates if empty
if (!localStorage.getItem('chempilot_pfd_proj-default-1')) {
  localStorage.setItem('chempilot_pfd_proj-default-1', JSON.stringify(DEFAULT_FLOWSHEET_1))
}
if (!localStorage.getItem('chempilot_pfd_proj-default-2')) {
  localStorage.setItem('chempilot_pfd_proj-default-2', JSON.stringify(DEFAULT_FLOWSHEET_2))
}

// ── ROOT APP ───────────────────────────────────
export default function App() {
  const [booted, setBooted] = useState(false)
  const [bootVisible, setBootVisible] = useState(true)
  const [active, setActive] = useState('home')
  const [clock, setClock] = useState(new Date())
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('chempilot_sidebar_collapsed') === 'true'
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [ambientMode, setAmbientMode] = useState(() => {
    return localStorage.getItem('chempilot_ambient_mode') || 'COSMIC'
  })
  const [motionMode, setMotionMode] = useState(() => {
    return localStorage.getItem('chempilot_motion_mode') || 'FLUID'
  })
  // Toast notification state
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message: string }
  // New Project modal state
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectNameInput, setProjectNameInput] = useState('')
  const projectInputRef = useRef(null)

  // Authentication State
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('chempilot_auth_token') || '')
  const [authUsername, setAuthUsername] = useState(() => localStorage.getItem('chempilot_auth_username') || '')
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    localStorage.setItem('chempilot_ambient_mode', ambientMode)
    if (ambientMode === 'FLAT') {
      document.body.classList.add('theme-flat')
      document.body.classList.remove('theme-cosmic')
    } else {
      document.body.classList.add('theme-cosmic')
      document.body.classList.remove('theme-flat')
    }
  }, [ambientMode])

  useEffect(() => {
    localStorage.setItem('chempilot_motion_mode', motionMode)
    if (motionMode === 'REDUCED') {
      document.body.classList.add('motion-reduced')
    } else {
      document.body.classList.remove('motion-reduced')
    }
  }, [motionMode])
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('chempilot_sidebar_collapsed', next ? 'true' : 'false')
      return next
    })
  }

  // App context for context-aware AI Companion
  const [appContext, setAppContext] = useState({
    activeTab: 'home',
    pfd: null,
    calc: null,
    formula: null,
    distill: null
  })

  // Projects store
  const [projectsList, setProjectsList] = useState(() => {
    const saved = localStorage.getItem('chempilot_projects')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch (e) {}
    }
    return [
      { id: 'proj-default-1', name: 'Ethanol Separation Plant', lastModified: new Date().toISOString() },
      { id: 'proj-default-2', name: 'Benzene-Toluene Fractionation', lastModified: new Date().toISOString() }
    ]
  })

  const [currentProjectId, setCurrentProjectId] = useState(() => {
    const saved = localStorage.getItem('chempilot_current_project')
    return saved || 'proj-default-1'
  })

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-migrate old saved PFD flowsheet parameters
  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('chempilot_pfd_')) {
          const raw = localStorage.getItem(key)
          if (raw) {
            const data = JSON.parse(raw)
            let migrated = false
            if (data.activePreset === 'Ethanol-Water' && data.equipParams) {
              Object.keys(data.equipParams).forEach(nid => {
                const p = data.equipParams[nid]
                if (p && p.refluxRatio && parseFloat(p.refluxRatio) <= 3.0) {
                  p.refluxRatio = '8.0'
                  migrated = true
                }
              })
            }
            if (migrated) {
              localStorage.setItem(key, JSON.stringify(data))
            }
          }
        }
      }
    } catch (e) {
      console.warn("PFD migration error:", e)
    }
  }, [])

  useEffect(() => {
    const handleRoute = (e) => {
      if (e.detail) setActive(e.detail)
    }
    window.addEventListener('chempilot_route_tab', handleRoute)
    return () => window.removeEventListener('chempilot_route_tab', handleRoute)
  }, [])

  useEffect(() => {
    localStorage.setItem('chempilot_projects', JSON.stringify(projectsList))
  }, [projectsList])

  useEffect(() => {
    localStorage.setItem('chempilot_current_project', currentProjectId)
  }, [currentProjectId])

  // Sync projects from cloud DB on login or startup
  useEffect(() => {
    const syncProjects = async () => {
      if (!authToken) return
      const host = import.meta.env.VITE_API_URL || ''
      try {
        const res = await fetch(`${host}/api/projects/?token=${encodeURIComponent(authToken)}`)
        if (res.ok) {
          const cloudProjects = await res.json()
          if (Array.isArray(cloudProjects) && cloudProjects.length > 0) {
            // Merge cloud metadata with local list
            setProjectsList(prev => {
              const merged = [...prev]
              cloudProjects.forEach(cp => {
                if (!merged.some(p => p.id === cp.id)) {
                  merged.push({ id: cp.id, name: cp.name, lastModified: cp.updated_at })
                }
              })
              return merged
            })
          }
        }
      } catch (err) {
        console.warn("Failed to sync cloud projects:", err)
      }
    }
    syncProjects()
  }, [authToken])

  // Auto-save flowsheet state to cloud DB when app context changes (Autosave)
  useEffect(() => {
    const saveToCloud = async () => {
      if (!authToken || !appContext.pfd) return
      const host = import.meta.env.VITE_API_URL || ''
      const currentProj = projectsList.find(p => p.id === currentProjectId)
      if (!currentProj) return

      try {
        await fetch(`${host}/api/projects/?token=${encodeURIComponent(authToken)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentProjectId,
            name: currentProj.name,
            flowsheet: {
              flowsheet_json: JSON.stringify(appContext.pfd)
            }
          })
        })
      } catch (e) {
        console.warn("Failed to auto-save flowsheet:", e)
      }
    }

    const timer = setTimeout(saveToCloud, 2000) // Debounce saves by 2 seconds
    return () => clearTimeout(timer)
  }, [appContext.pfd, currentProjectId, authToken, projectsList])

  useEffect(() => {
    setAppContext(prev => ({ ...prev, activeTab: active }))
  }, [active])

  const updateAppContext = (moduleName, data) => {
    setAppContext(prev => ({
      ...prev,
      [moduleName]: data
    }))
  }

  const handleBootDone = () => {
    setBooted(true)
    setTimeout(() => setBootVisible(false), 700)
  }

  const handleCreateProject = () => {
    setProjectNameInput('')
    setProjectModalOpen(true)
    setTimeout(() => projectInputRef.current?.focus(), 80)
  }

  const handleCreateProjectConfirm = () => {
    const name = projectNameInput.trim()
    if (!name) return
    const id = 'proj-' + Date.now()
    const newProj = { id, name, lastModified: new Date().toISOString() }
    setProjectsList(p => [...p, newProj])
    setCurrentProjectId(id)
    setProjectModalOpen(false)
    setProjectNameInput('')
    showToast('success', `Project "${name}" created.`)
  }

  const handleDeleteProject = (id) => {
    if (id === currentProjectId) {
      const remaining = projectsList.filter(p => p.id !== id)
      if (remaining.length > 0) {
        setCurrentProjectId(remaining[0].id)
      }
    }
    setProjectsList(p => p.filter(p => p.id !== id))
    localStorage.removeItem('chempilot_pfd_' + id)
    localStorage.removeItem('chempilot_calc_' + id)
    localStorage.removeItem('chempilot_distill_' + id)
    localStorage.removeItem('chempilot_ai_history_' + id)
  }

  const handleExportProjects = () => {
    const data = {}
    projectsList.forEach(p => {
      data[p.id] = {
        meta: p,
        pfd: localStorage.getItem('chempilot_pfd_' + p.id),
        calc: localStorage.getItem('chempilot_calc_' + p.id),
        distill: localStorage.getItem('chempilot_distill_' + p.id),
        ai: localStorage.getItem('chempilot_ai_history_' + p.id)
      }
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chempilot-workspace-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportProjects = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result)
        const newProjects = []
        Object.keys(imported).forEach(id => {
          const entry = imported[id]
          if (entry.meta) {
            newProjects.push(entry.meta)
            if (entry.pfd) localStorage.setItem('chempilot_pfd_' + id, entry.pfd)
            if (entry.calc) localStorage.setItem('chempilot_calc_' + id, entry.calc)
            if (entry.distill) localStorage.setItem('chempilot_distill_' + id, entry.distill)
            if (entry.ai) localStorage.setItem('chempilot_ai_history_' + id, entry.ai)
          }
        })
        if (newProjects.length > 0) {
          setProjectsList(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const filtered = newProjects.filter(p => !existingIds.has(p.id))
            return [...prev, ...filtered]
          })
          setCurrentProjectId(newProjects[0].id)
          showToast('success', `${newProjects.length} project(s) imported.`)
        }
      } catch (err) {
        showToast('error', 'Invalid file format. Please use a valid ChemPilot backup.')
      }
    }
    reader.readAsText(file)
  }

  const groups = [...new Set(NAV.map(n => n.group))]
  const meta = PAGE_META[active] || {}

  return (
    <>
      {/* Boot Screen */}
      {bootVisible && (
        <div className={`boot-overlay ${booted ? 'fade-out' : ''}`}>
          <BootScreen onDone={handleBootDone} />
        </div>
      )}

      {isMobileSidebarOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setIsMobileSidebarOpen(false)} 
        />
      )}

      <div className="os-shell" style={{ opacity: booted ? 1 : 0, transition: 'opacity 0.5s var(--ease)' }}>

        {/* SIDEBAR */}
        <aside className={`os-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
          {/* Mobile Close Button */}
          <button 
            className="mobile-sidebar-close"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
          <div className="sidebar-brand">
            <div className="brand-wordmark">
              {!isSidebarCollapsed && <span><span className="em">Chem</span>pilot OS</span>}
              <button 
                className="sidebar-toggle-btn" 
                onClick={toggleSidebar} 
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <Menu size={14}/> : <ChevronLeft size={14}/>}
              </button>
              {!isSidebarCollapsed && (
                <div 
                  className="brand-neural-orb" 
                  onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
                  title="Toggle Terra AI Sidebar Console"
                />
              )}
            </div>
            {!isSidebarCollapsed && <div className="brand-meta">Terra Nova Intelligence</div>}
          </div>

          <nav className="sidebar-nav">
            {groups.map(g => (
              <div key={g}>
                {!isSidebarCollapsed && <div className="nav-group-label">{g}</div>}
                {NAV.filter(n => n.group === g).map((n, i) => (
                  <button key={n.id}
                    className={`nav-btn ${active === n.id ? 'active' : ''}`}
                    onClick={() => { setActive(n.id); setIsMobileSidebarOpen(false); }}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="nav-icon"><n.Icon size={15} strokeWidth={1.8} /></span>
                    {!isSidebarCollapsed && <span className="nav-label">{n.label}</span>}
                    {!isSidebarCollapsed && n.badge && <span className="nav-badge">{n.badge}</span>}

                    {/* Collapsed Hover Tooltips */}
                    {isSidebarCollapsed && (
                      <div className="sidebar-tooltip">
                        {n.label}
                        {n.badge && <span className="tooltip-badge">{n.badge}</span>}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ))}

            {/* PROJECTS SECTION */}
            <div className="sidebar-projects-section">
              {!isSidebarCollapsed && (
                <div className="nav-group-label projects-label">
                  <span>Projects</span>
                  <button className="project-add-btn" onClick={handleCreateProject} title="New Project">
                    <FilePlus size={12} />
                  </button>
                </div>
              )}

              {isSidebarCollapsed ? (
                <div className="collapsed-project-indicator" onClick={toggleSidebar}>
                  <Folder size={16}/>
                  <div className="sidebar-tooltip">Manage Projects</div>
                </div>
              ) : (
                <>
                  <div className="project-list">
                    {projectsList.map(p => (
                      <div key={p.id} className="project-row">
                        <button
                          className={`nav-btn project-nav-btn ${currentProjectId === p.id ? 'active' : ''}`}
                          onClick={() => setCurrentProjectId(p.id)}
                        >
                          <span className="nav-icon"><Folder size={13} strokeWidth={1.8}/></span>
                          <span className="project-name">{p.name}</span>
                        </button>
                        {projectsList.length > 1 && (
                          <button
                            className="project-delete-btn"
                            onClick={() => handleDeleteProject(p.id)}
                            title="Delete Project"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="project-actions">
                    <button className="project-action-btn" onClick={handleExportProjects}>Export</button>
                    <label className="project-action-btn">
                      Import
                      <input type="file" accept=".json" onChange={handleImportProjects} style={{ display: 'none' }} />
                    </label>
                  </div>
                </>
              )}
            </div>
          </nav>

          {!isSidebarCollapsed ? (
            <div className="sidebar-system">
              <div className="system-status">
                <div className="status-led" />
                <span>system online</span>
              </div>
              <div className="system-builder">
                built by <span className="hi">Devan</span><br />
                mahasiswa teknik kimia<br />
                <span className="hi">phase-2</span> · 2026
              </div>
            </div>
          ) : (
            <div className="sidebar-system" style={{ padding: '16px 0', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'center' }}>
              <div className="status-led" title="System Online" />
            </div>
          )}
        </aside>

        {/* MAIN */}
        <div 
          className={`os-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
          style={active === 'ai' ? { overflow: 'hidden' } : {}}
        >

          {/* Top bar */}
          <div className="os-topbar">
            <div className="topbar-left">
              <button 
                className="mobile-menu-toggle"
                onClick={() => setIsMobileSidebarOpen(true)}
                title="Open Navigation Menu"
              >
                <Menu size={15} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="status-led" style={{ width: 4, height: 4 }} />
                <span>chempilot-os</span>
              </div>
              <span className="topbar-sep">╱</span>
              <span>{meta.title}</span>
            </div>
             <div className="topbar-right">
              <button 
                onClick={() => setAmbientMode(prev => prev === 'COSMIC' ? 'FLAT' : 'COSMIC')}
                className={`hud-toggle-pill ${ambientMode === 'COSMIC' ? 'pill-active' : ''}`}
                title="Toggle workspace atmosphere theme"
              >
                {ambientMode === 'COSMIC'
                  ? <><Globe size={11}/> Cosmic HUD</>
                  : <><Monitor size={11}/> Console Flat</>
                }
              </button>
              <button 
                onClick={() => setMotionMode(prev => prev === 'FLUID' ? 'REDUCED' : 'FLUID')}
                className={`hud-toggle-pill ${motionMode === 'FLUID' ? 'pill-active' : 'pill-purple'}`}
                title="Toggle visual motion comfort mode"
              >
                {motionMode === 'FLUID'
                  ? <><Zap size={11}/> Fluid Mode</>
                  : <><Wind size={11}/> Calm Mode</>
                }
              </button>
              <div className="hud-separator" />
              
              <div className="topbar-auth-pill">
              {authToken ? (
                <button 
                  onClick={() => {
                    localStorage.removeItem('chempilot_auth_token')
                    localStorage.removeItem('chempilot_auth_username')
                    setAuthToken('')
                    setAuthUsername('')
                    showToast('success', 'Logged out. Guest Mode active.')
                  }}
                  className="hud-toggle-pill pill-active"
                  title="Click to logout"
                  style={{ textTransform: 'capitalize' }}
                >
                  👤 <span className="auth-pill-text">{authUsername}</span> <span className="auth-pill-text">(Keluar)</span>
                </button>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="hud-toggle-pill"
                  style={{ background: 'var(--purple-gradient)', color: '#fff', border: 'none' }}
                >
                  🔑 <span className="auth-pill-text">Masuk Akun</span>
                </button>
              )}
              </div>

              <div className="hud-separator" />
              <span className="topbar-tag">v2.0</span>
              <span className="topbar-clock">{clock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>



          {/* Content */}
          <div 
            className="os-content" 
            style={active === 'ai' ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 0 0' } : {}}
          >
            {active !== 'home' && active !== 'ai' && (
              <div className="mb-lg">
                <div className="page-eyebrow">
                  <span style={{ color: 'var(--accent)' }}>◉</span>
                  Terra Nova OS
                </div>
                <div className="page-title">{meta.title}</div>
                <div className="page-desc">{meta.desc}</div>
              </div>
            )}

            {active === 'home'      && (
              <Dashboard 
                setActive={setActive} 
                projectsList={projectsList} 
                currentProjectId={currentProjectId} 
              />
            )}
            {active === 'pfd'       && <PFDBuilder key={currentProjectId} projectId={currentProjectId} updateAppContext={updateAppContext} setActive={setActive} />}
            {active === 'hub'       && <CalculatorHub key={currentProjectId} projectId={currentProjectId} updateAppContext={updateAppContext} />}
            {active === 'formulas'  && <FormulaLibrary updateAppContext={updateAppContext} setActive={setActive} />}
            {active === 'library'   && <BookLibrary />}
            {active === 'distill'   && <DistillationDesign key={currentProjectId} projectId={currentProjectId} updateAppContext={updateAppContext} />}
            {active === 'converter' && <UnitConverter />}
            {active === 'mass'      && <MassBalance />}
            {active === 'energy'    && <EnergyBalance />}
            {active === 'thermo'    && <Thermodynamics />}
            {active === 'reaction'  && <ReactionEng />}
            {active === 'ai'        && (
              <AICompanion 
                key={currentProjectId} 
                projectId={currentProjectId} 
                appContext={appContext} 
                setActive={setActive} 
                onLayoutModeChange={(mode) => {
                  if (mode === 'FOCUS_CHAT') {
                    setIsSidebarCollapsed(true)
                  }
                }}
              />
            )}
          </div>


        </div>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION BAR ─────────────────────────────── */}
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile Navigation">
        {/* Tab 1: Dashboard */}
        <button
          className={`mobile-nav-tab ${active === 'home' ? 'active' : ''}`}
          onClick={() => { setActive('home'); setIsMobileSidebarOpen(false); }}
          aria-label="Dashboard"
        >
          <span className="m-icon"><LayoutDashboard size={20} strokeWidth={1.7} /></span>
          <span className="m-label">Home</span>
        </button>

        {/* Tab 2: Calculator Hub */}
        <button
          className={`mobile-nav-tab ${active === 'hub' ? 'active' : ''}`}
          onClick={() => { setActive('hub'); setIsMobileSidebarOpen(false); }}
          aria-label="Calculator Hub"
        >
          <span className="m-icon"><LayoutGrid size={20} strokeWidth={1.7} /></span>
          <span className="m-label">Calc</span>
        </button>

        {/* Tab 3: PFD Builder */}
        <button
          className={`mobile-nav-tab ${active === 'pfd' ? 'active' : ''}`}
          onClick={() => { setActive('pfd'); setIsMobileSidebarOpen(false); }}
          aria-label="PFD Builder"
        >
          <span className="m-icon">
            <Workflow size={20} strokeWidth={1.7} />
            <span className="mobile-nav-badge" aria-hidden="true" />
          </span>
          <span className="m-label">PFD</span>
        </button>

        {/* Tab 4: Formula Library */}
        <button
          className={`mobile-nav-tab ${active === 'formulas' ? 'active' : ''}`}
          onClick={() => { setActive('formulas'); setIsMobileSidebarOpen(false); }}
          aria-label="Formula Library"
        >
          <span className="m-icon"><BookOpen size={20} strokeWidth={1.7} /></span>
          <span className="m-label">Formula</span>
        </button>

        {/* Tab 5: Distillation */}
        <button
          className={`mobile-nav-tab ${active === 'distill' ? 'active' : ''}`}
          onClick={() => { setActive('distill'); setIsMobileSidebarOpen(false); }}
          aria-label="Distillation Design"
        >
          <span className="m-icon"><FlaskConical size={20} strokeWidth={1.7} /></span>
          <span className="m-label">Distill</span>
        </button>

        {/* Tab 5.5: Bookmart Library */}
        <button
          className={`mobile-nav-tab ${active === 'library' ? 'active' : ''}`}
          onClick={() => { setActive('library'); setIsMobileSidebarOpen(false); }}
          aria-label="Bookmart Library"
        >
          <span className="m-icon"><Library size={20} strokeWidth={1.7} /></span>
          <span className="m-label">Books</span>
        </button>

        {/* Tab 6: AI Companion */}
        <button
          className={`mobile-nav-tab ${active === 'ai' ? 'active' : ''}`}
          onClick={() => { setActive('ai'); setIsMobileSidebarOpen(false); }}
          aria-label="AI Companion"
        >
          <span className="m-icon"><BrainCircuit size={20} strokeWidth={1.7} /></span>
          <span className="m-label">AI</span>
        </button>
      </nav>
      
      {/* Sliding AI Console Drawer */}
      {aiDrawerOpen && (
        <div className="ai-console-drawer">
          <TerraDashboard
            projectId={currentProjectId}
            appContext={appContext}
            isDrawerMode={true}
            onCloseDrawer={() => setAiDrawerOpen(false)}
          />
        </div>
      )}

      {/* New Project Modal */}
      {projectModalOpen && (
        <div className="glass-modal-backdrop" onClick={() => setProjectModalOpen(false)}>
          <div className="glass-modal" onClick={e => e.stopPropagation()}>
            <div className="glass-modal-header">
              <span className="glass-modal-title">New Project</span>
              <button className="glass-modal-close" onClick={() => setProjectModalOpen(false)}><X size={16}/></button>
            </div>
            <input
              ref={projectInputRef}
              className="glass-modal-input"
              placeholder="Project name…"
              value={projectNameInput}
              onChange={e => setProjectNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateProjectConfirm()}
            />
            <div className="glass-modal-actions">
              <button className="glass-modal-cancel" onClick={() => setProjectModalOpen(false)}>Cancel</button>
              <button className="glass-modal-confirm" onClick={handleCreateProjectConfirm}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={14} />
            : <AlertTriangle size={14} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cosmic Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(token, user) => {
          setAuthToken(token)
          setAuthUsername(user)
          showToast('success', `Selamat datang kembali, ${user}! Sync aktif.`)
        }}
      />
    </>
  )
}