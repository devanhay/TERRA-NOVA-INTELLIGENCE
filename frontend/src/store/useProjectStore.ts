import { create } from 'zustand'

export interface Node {
  id: string
  type: string
  label: string
  tag: string
  x: number
  y: number
  calculated: boolean
  results: any[] | null
  error: string | null
  warnings: string[]
  _hasWarnings?: boolean
}

export interface Stream {
  id: string
  from: string
  to: string
  data: any
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
  
  // Actions
  setTab: (tab: string) => void
  setLoading: (l: boolean) => void
  fetchProjects: () => Promise<void>
  loadProject: (id: string) => Promise<void>
  createProject: (name: string) => Promise<void>
  saveProject: () => Promise<void>
  deleteProject: (id: string) => Promise<void>
  updateFlowsheet: (nodes: Node[], streams: Stream[], params: Record<string, any>) => void
  setChemicalModel: (preset: string, model: string) => void
}

const BACKEND_URL = 'http://localhost:8000/api'

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

  setTab: (activeTab) => set({ activeTab }),
  setLoading: (loading) => set({ loading }),

  fetchProjects: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/`)
      if (res.ok) {
        const data = await res.json()
        set({ projects: data })
      }
    } catch (e) {
      console.error('Failed to fetch projects from backend:', e)
    }
  },

  loadProject: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`${BACKEND_URL}/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        const parsed = JSON.parse(data.flowsheet_json)
        set({
          activeProjectId: data.id,
          activeProjectName: data.name,
          nodes: parsed.nodes || [],
          streams: parsed.streams || [],
          equipParams: parsed.equipParams || {},
          selectedPreset: parsed.selectedPreset || 'Benzene-Toluene',
          thermoModel: parsed.thermoModel || 'Ideal',
          loading: false
        })
      }
    } catch (e) {
      console.error('Error loading project:', e)
      set({ loading: false })
    }
  },

  createProject: async (name) => {
    const newId = 'proj_' + Math.random().toString(36).substring(2, 9)
    try {
      const initialFlowsheet = JSON.stringify({
        nodes: [],
        streams: [],
        equipParams: {},
        selectedPreset: 'Benzene-Toluene',
        thermoModel: 'Ideal'
      })
      const res = await fetch(`${BACKEND_URL}/projects/`, {
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
      }
    } catch (e) {
      console.error('Error creating project:', e)
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
      await fetch(`${BACKEND_URL}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeProjectId,
          name: activeProjectName,
          flowsheet: { flowsheet_json }
        })
      })
      await get().fetchProjects()
    } catch (e) {
      console.error('Failed to save project:', e)
    }
  },

  deleteProject: async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await get().fetchProjects()
        if (get().activeProjectId === id) {
          set({
            activeProjectId: null,
            activeProjectName: '',
            nodes: [],
            streams: [],
            equipParams: {}
          })
        }
      }
    } catch (e) {
      console.error('Error deleting project:', e)
    }
  },

  updateFlowsheet: (nodes, streams, equipParams) => {
    set({ nodes, streams, equipParams })
    get().saveProject()
  },

  setChemicalModel: (selectedPreset, thermoModel) => {
    set({ selectedPreset, thermoModel })
    get().saveProject()
  }
}))
