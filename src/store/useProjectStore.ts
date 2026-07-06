import { create } from 'zustand'

export interface EquipmentResult {
  label: string
  val: string | number
  unit?: string
}

export interface StreamData {
  temp?: string | number
  press?: string | number
  flow?: string | number
  phase?: string
  zA?: string | number
  [key: string]: any
}

export interface Node {
  id: string
  type: string
  label: string
  tag: string
  x: number
  y: number
  calculated: boolean
  results: EquipmentResult[] | null
  error: string | null
  warnings: string[]
  _hasWarnings?: boolean
}

export interface Stream {
  id: string
  from: string
  to: string
  data: StreamData
  calculated: boolean
}

export interface ProjectStore {
  projects: any[]
  activeProjectId: string | null
  activeProjectName: string
  nodes: Node[]
  streams: Stream[]
  equipParams: Record<string, any>
  selectedPreset: string
  thermoModel: string
  activeTab: string
  loading: boolean
  error: string | null
  
  // Actions
  setTab: (tab: string) => void
  setLoading: (l: boolean) => void
  fetchProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createProject: (name: string) => Promise<void>
  saveProject: () => Promise<void>
  triggerDebouncedSave: () => void
  deleteProject: (id: string) => Promise<void>
  updateFlowsheet: (nodes: Node[], streams: Stream[], params: Record<string, any>) => void
  setChemicalModel: (preset: string, model: string) => void
}

const getBackendUrl = (): string => {
  let url = ''
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL
  } else if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    url = process.env.NEXT_PUBLIC_API_URL
  } else {
    url = 'http://localhost:8000'
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1)
  }
  return `${url}/api`
}

const BACKEND_URL = getBackendUrl()
let saveDebounceTimer: any = null

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,
  activeProjectName: 'Default Project',
  nodes: [],
  streams: [],
  equipParams: {},
  selectedPreset: 'Benzene-Toluene',
  thermoModel: 'Ideal',
  activeTab: 'dashboard',
  loading: false,
  error: null,

  setTab: (activeTab) => set({ activeTab }),
  setLoading: (loading) => set({ loading }),

  fetchProjects: async () => {
    try {
      const token = localStorage.getItem('engineeros_auth_token') || ''
      const res = await fetch(`${BACKEND_URL}/projects/?token=${encodeURIComponent(token)}`)
      if (res.ok) {
        const data = await res.json()
        set({ projects: data, error: null })
      } else {
        throw new Error('Gagal mengambil daftar proyek dari server.')
      }
    } catch (e: any) {
      console.error('Failed to fetch projects from backend:', e)
      set({ error: e.message || 'Gagal sinkronisasi daftar proyek.' })
    }
  },

  loadProject: async (id) => {
    set({ loading: true, error: null })
    try {
      const token = localStorage.getItem('engineeros_auth_token') || ''
      const res = await fetch(`${BACKEND_URL}/projects/${id}?token=${encodeURIComponent(token)}`)
      if (res.ok) {
        const data = await res.json()
        
        let parsed
        try {
          parsed = JSON.parse(data.flowsheet_json)
        } catch (parseError) {
          console.error('Failed to parse flowsheet_json:', parseError)
          // Fallback to empty state
          parsed = { nodes: [], streams: [], equipParams: {} }
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('engineeros_notification', {
              detail: { type: 'error', message: 'Struktur flowsheet corrupt. Dimuat dengan template kosong.' }
            }))
          }
        }

        set({
          activeProjectId: data.id,
          activeProjectName: data.name,
          nodes: parsed.nodes || [],
          streams: parsed.streams || [],
          equipParams: parsed.equipParams || {},
          selectedPreset: parsed.selectedPreset || 'Benzene-Toluene',
          thermoModel: parsed.thermoModel || 'Ideal',
          loading: false,
          error: null
        })
      } else {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Gagal memuat proyek dari server.')
      }
    } catch (e: any) {
      console.error('Error loading project:', e)
      set({ loading: false, error: e.message || 'Gagal memuat proyek.' })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('engineeros_notification', {
          detail: { type: 'error', message: `Gagal memuat proyek: ${e.message || 'Masalah jaringan.'}` }
        }))
      }
    }
  },

  createProject: async (name) => {
    const newId = crypto.randomUUID()
    try {
      const initialFlowsheet = JSON.stringify({
        nodes: [],
        streams: [],
        equipParams: {},
        selectedPreset: 'Benzene-Toluene',
        thermoModel: 'Ideal'
      })
      const token = localStorage.getItem('engineeros_auth_token') || ''
      const res = await fetch(`${BACKEND_URL}/projects/?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          name,
          flowsheet: { flowsheet_json: initialFlowsheet }
        })
      })
      if (res.ok) {
        await get().fetchProjects()
        await get().loadProject(newId)
      } else {
        throw new Error('Gagal menyimpan proyek baru ke database.')
      }
    } catch (e: any) {
      console.error('Error creating project:', e)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('engineeros_notification', {
          detail: { type: 'error', message: `Gagal membuat proyek: ${e.message}` }
        }))
      }
    }
  },

  saveProject: async () => {
    const { activeProjectId, activeProjectName, nodes, streams, equipParams, selectedPreset, thermoModel } = get()
    if (!activeProjectId) return

    try {
      const flowsheet_json = JSON.stringify({
        nodes,
        streams,
        equipParams,
        selectedPreset,
        thermoModel
      })
      const token = localStorage.getItem('engineeros_auth_token') || ''
      const res = await fetch(`${BACKEND_URL}/projects/?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeProjectId,
          name: activeProjectName,
          flowsheet: { flowsheet_json }
        })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Gagal menyimpan proyek.')
      }
      await get().fetchProjects()
    } catch (e: any) {
      console.error('Failed to save project:', e)
    }
  },

  triggerDebouncedSave: () => {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer)
    }
    saveDebounceTimer = setTimeout(() => {
      get().saveProject()
    }, 500)
  },

  deleteProject: async (id) => {
    try {
      const token = localStorage.getItem('engineeros_auth_token') || ''
      const res = await fetch(`${BACKEND_URL}/projects/${id}?token=${encodeURIComponent(token)}`, { 
        method: 'DELETE' 
      })
      if (res.ok) {
        await get().fetchProjects()
        if (get().activeProjectId === id) {
          set({
            activeProjectId: null,
            activeProjectName: '',
            nodes: [],
            streams: [],
            equipParams: {},
            error: null
          })
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Gagal menghapus proyek.')
      }
    } catch (e: any) {
      console.error('Error deleting project:', e)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('engineeros_notification', {
          detail: { type: 'error', message: `Gagal menghapus proyek: ${e.message}` }
        }))
      }
    }
  },

  updateFlowsheet: (nodes, streams, equipParams) => {
    set({ nodes, streams, equipParams })
    get().triggerDebouncedSave()
  },

  setChemicalModel: (selectedPreset, thermoModel) => {
    set({ selectedPreset, thermoModel })
    get().triggerDebouncedSave()
  }
}))
