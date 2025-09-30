import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { 
  FeatureResponse,
  TenantFeatureResponse,
  FeatureManagementState,
  FeatureFilters,
  TenantFeatureFilters,
  PaginationState,
  FeatureStats,
  FeatureActivity,
  FeatureManagementPermissions,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  BulkUpdateTenantFeaturesRequest
} from '@/@types/featureManagement'
import featureService from '@/services/FeatureService'
import TenantFeatureService from '@/services/TenantFeatureService'
import { CS_ADMIN, CS_USER } from '@/constants/roles.constant'
import { useSessionUser } from '@/store/authStore'

interface FeatureManagementActions {
  // Feature CRUD operations
  fetchAllFeatures: () => Promise<void>
  createFeature: (feature: CreateFeatureRequest) => Promise<void>
  updateFeature: (featureId: string, feature: UpdateFeatureRequest) => Promise<void>
  deleteFeature: (featureId: string) => Promise<void>
  
  // Tenant feature management
  fetchTenantFeatures: (tenantId: number) => Promise<void>
  enableFeatureForTenant: (tenantId: number, featureId: string) => Promise<void>
  disableFeatureForTenant: (tenantId: number, featureId: string) => Promise<void>
  bulkUpdateTenantFeatures: (tenantId: number, updates: BulkUpdateTenantFeaturesRequest) => Promise<void>
  bulkUpdateMultipleTenants: (tenantIds: number[], updates: BulkUpdateTenantFeaturesRequest) => Promise<void>
  
  // Statistics and activities
  fetchStats: () => Promise<void>
  fetchRecentActivities: () => Promise<void>
  
  // UI state management
  setSelectedTenant: (tenantId: number | null) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<FeatureFilters>) => void
  setTenantFilters: (filters: Partial<TenantFeatureFilters>) => void
  setPagination: (pagination: Partial<PaginationState>) => void
  toggleFeatureSelection: (featureId: string) => void
  clearFeatureSelection: () => void
  setSelectedFeatures: (featureIds: string[]) => void
  
  // Cache management
  clearCache: () => void
  refreshCache: () => Promise<void>
  
  // Error handling
  clearError: () => void
  setError: (error: string) => void
  
  // Permissions
  updatePermissions: () => void
}

interface FeatureManagementStore extends FeatureManagementState, FeatureManagementActions {}

const initialFilters: FeatureFilters = {
  category: undefined,
  isActive: undefined,
  searchQuery: '',
  menuPath: undefined
}

const initialTenantFilters: TenantFeatureFilters = {
  tenantId: undefined,
  isEnabled: undefined,
  category: undefined,
  searchQuery: ''
}

const initialPagination: PaginationState = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
}

const getInitialPermissions = (): FeatureManagementPermissions => {
  const authStore = useSessionUser.getState()
  const userAuthority = authStore.user?.authority || []

  const isCSAdmin = userAuthority.includes(CS_ADMIN)
  const isCSUser = userAuthority.includes(CS_USER)

  return {
    canViewFeatures: isCSAdmin || isCSUser,
    canCreateFeatures: isCSAdmin,
    canEditFeatures: isCSAdmin,
    canDeleteFeatures: isCSAdmin,
    canAssignFeatures: isCSAdmin || isCSUser,
    canViewTenantFeatures: isCSAdmin || isCSUser,
    canBulkUpdate: isCSAdmin || isCSUser,
    canViewAuditLog: isCSAdmin || isCSUser,
    canExportData: isCSAdmin || isCSUser
  }
}

export const useFeatureManagementStore = create<FeatureManagementStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      features: [],
      featuresLoading: false,
      featuresError: null,
      
      tenantFeatures: {},
      selectedTenantId: null,
      tenantFeaturesLoading: false,
      tenantFeaturesError: null,
      
      selectedFeatures: [],
      searchQuery: '',
      filters: initialFilters,
      tenantFilters: initialTenantFilters,
      pagination: initialPagination,
      
      stats: null,
      statsLoading: false,
      recentActivities: [],
      activitiesLoading: false,
      
      lastFetched: {},
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      
      permissions: getInitialPermissions(),

      // Feature CRUD operations
      fetchAllFeatures: async () => {
        const state = get()
        const cacheKey = 'allFeatures'
        const lastFetch = state.lastFetched[cacheKey]
        
        // Check cache
        if (lastFetch && Date.now() - lastFetch < state.cacheExpiry && state.features.length > 0) {
          return
        }

        set({ featuresLoading: true, featuresError: null })
        
        try {
          // Use the admin getAllFeatures method we just added to FeatureService
          const features = await featureService.getAllFeatures()
          
          set({ 
            features,
            featuresLoading: false,
            lastFetched: { ...state.lastFetched, [cacheKey]: Date.now() },
            pagination: {
              ...state.pagination,
              total: features.length,
              totalPages: Math.ceil(features.length / state.pagination.pageSize)
            }
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch features'
          set({ featuresError: errorMessage, featuresLoading: false })
        }
      },

      createFeature: async (feature: CreateFeatureRequest) => {
        set({ featuresLoading: true, featuresError: null })
        
        try {
          const newFeature = await featureService.createFeature({
            featureKey: feature.featureKey,
            featureName: feature.featureName,
            description: feature.description,
            category: feature.category,
            menuPath: feature.menuPath,
            isActive: true
          })
          
          // Add to local state
          const state = get()
          set({ 
            features: [...state.features, newFeature],
            featuresLoading: false,
            lastFetched: { ...state.lastFetched, allFeatures: Date.now() }
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create feature'
          set({ featuresError: errorMessage, featuresLoading: false })
          throw error
        }
      },

      updateFeature: async (featureId: string, feature: UpdateFeatureRequest) => {
        set({ featuresLoading: true, featuresError: null })
        
        try {
          const updatedFeature = await featureService.updateFeature(featureId, feature)
          
          // Update in local state
          const state = get()
          const updatedFeatures = state.features.map(f => 
            f.featureId === featureId ? updatedFeature : f
          )
          
          set({ 
            features: updatedFeatures,
            featuresLoading: false,
            lastFetched: { ...state.lastFetched, allFeatures: Date.now() }
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update feature'
          set({ featuresError: errorMessage, featuresLoading: false })
          throw error
        }
      },

      deleteFeature: async (featureId: string) => {
        set({ featuresLoading: true, featuresError: null })
        
        try {
          await featureService.deleteFeature(featureId)
          
          // Remove from local state
          const state = get()
          const filteredFeatures = state.features.filter(f => f.featureId !== featureId)
          
          set({ 
            features: filteredFeatures,
            featuresLoading: false,
            lastFetched: { ...state.lastFetched, allFeatures: Date.now() }
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete feature'
          set({ featuresError: errorMessage, featuresLoading: false })
          throw error
        }
      },

      // Tenant feature management
      fetchTenantFeatures: async (tenantId: number) => {
        const state = get()
        const cacheKey = `tenantFeatures_${tenantId}`
        const lastFetch = state.lastFetched[cacheKey]
        
        // Check cache
        if (lastFetch && Date.now() - lastFetch < state.cacheExpiry && state.tenantFeatures[tenantId]) {
          return
        }

        set({ tenantFeaturesLoading: true, tenantFeaturesError: null })
        
        try {
          const tenantFeatureService = TenantFeatureService.getInstance()
          const features = await tenantFeatureService.getTenantFeatures(tenantId)
          
          set({ 
            tenantFeatures: {
              ...state.tenantFeatures,
              [tenantId]: features
            },
            tenantFeaturesLoading: false,
            lastFetched: { ...state.lastFetched, [cacheKey]: Date.now() }
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tenant features'
          set({ tenantFeaturesError: errorMessage, tenantFeaturesLoading: false })
        }
      },

      enableFeatureForTenant: async (tenantId: number, featureId: string) => {
        set({ tenantFeaturesLoading: true, tenantFeaturesError: null })
        
        try {
          const tenantFeatureService = TenantFeatureService.getInstance()
          const updatedFeature = await tenantFeatureService.enableFeatureForTenant(tenantId, featureId)
          
          const state = get()
          const tenantFeatures = state.tenantFeatures[tenantId] || []
          const updatedTenantFeatures = tenantFeatures.map(f =>
            f.featureId === featureId ? updatedFeature : f
          )
          
          set({ 
            tenantFeatures: {
              ...state.tenantFeatures,
              [tenantId]: updatedTenantFeatures
            },
            tenantFeaturesLoading: false
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to enable feature'
          set({ tenantFeaturesError: errorMessage, tenantFeaturesLoading: false })
          throw error
        }
      },

      disableFeatureForTenant: async (tenantId: number, featureId: string) => {
        set({ tenantFeaturesLoading: true, tenantFeaturesError: null })
        
        try {
          const tenantFeatureService = TenantFeatureService.getInstance()
          await tenantFeatureService.disableFeatureForTenant(tenantId, featureId)
          
          const state = get()
          const tenantFeatures = state.tenantFeatures[tenantId] || []
          const updatedTenantFeatures = tenantFeatures.map(f =>
            f.featureId === featureId ? { ...f, isEnabled: false } : f
          )
          
          set({ 
            tenantFeatures: {
              ...state.tenantFeatures,
              [tenantId]: updatedTenantFeatures
            },
            tenantFeaturesLoading: false
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to disable feature'
          set({ tenantFeaturesError: errorMessage, tenantFeaturesLoading: false })
          throw error
        }
      },

      bulkUpdateTenantFeatures: async (tenantId: number, updates: BulkUpdateTenantFeaturesRequest) => {
        set({ tenantFeaturesLoading: true, tenantFeaturesError: null })
        
        try {
          const tenantFeatureService = TenantFeatureService.getInstance()
          await tenantFeatureService.bulkUpdateTenantFeatures(tenantId, updates)
          
          // Refresh tenant features
          await get().fetchTenantFeatures(tenantId)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update features'
          set({ tenantFeaturesError: errorMessage, tenantFeaturesLoading: false })
          throw error
        }
      },

      bulkUpdateMultipleTenants: async (tenantIds: number[], updates: BulkUpdateTenantFeaturesRequest) => {
        set({ tenantFeaturesLoading: true, tenantFeaturesError: null })
        
        try {
          const tenantFeatureService = TenantFeatureService.getInstance()
          const results = await tenantFeatureService.bulkUpdateMultipleTenants(tenantIds, updates)
          
          // Refresh affected tenant features
          for (const tenantId of results.success) {
            await get().fetchTenantFeatures(tenantId)
          }
          
          set({ tenantFeaturesLoading: false })
          
          // Return results for error reporting
          return results
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update multiple tenants'
          set({ tenantFeaturesError: errorMessage, tenantFeaturesLoading: false })
          throw error
        }
      },

      // Statistics and activities
      fetchStats: async () => {
        const state = get()
        const cacheKey = 'stats'
        const lastFetch = state.lastFetched[cacheKey]
        
        if (lastFetch && Date.now() - lastFetch < state.cacheExpiry && state.stats) {
          return
        }

        set({ statsLoading: true })
        
        try {
          const tenantFeatureService = TenantFeatureService.getInstance()
          const stats = await tenantFeatureService.getFeatureStats()
          
          set({ 
            stats,
            statsLoading: false,
            lastFetched: { ...state.lastFetched, [cacheKey]: Date.now() }
          })
        } catch (error) {
          console.error('Error fetching stats:', error)
          set({ statsLoading: false })
        }
      },

      fetchRecentActivities: async () => {
        set({ activitiesLoading: true })
        
        try {
          const tenantFeatureService = TenantFeatureService.getInstance()
          const activities = await tenantFeatureService.getRecentActivities()
          
          set({ 
            recentActivities: activities,
            activitiesLoading: false
          })
        } catch (error) {
          console.error('Error fetching recent activities:', error)
          set({ activitiesLoading: false })
        }
      },

      // UI state management
      setSelectedTenant: (tenantId: number | null) => {
        set({ selectedTenantId: tenantId })
        if (tenantId) {
          get().fetchTenantFeatures(tenantId)
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      },

      setFilters: (filters: Partial<FeatureFilters>) => {
        const state = get()
        set({ filters: { ...state.filters, ...filters } })
      },

      setTenantFilters: (filters: Partial<TenantFeatureFilters>) => {
        const state = get()
        set({ tenantFilters: { ...state.tenantFilters, ...filters } })
      },

      setPagination: (pagination: Partial<PaginationState>) => {
        const state = get()
        set({ pagination: { ...state.pagination, ...pagination } })
      },

      toggleFeatureSelection: (featureId: string) => {
        const state = get()
        const isSelected = state.selectedFeatures.includes(featureId)
        
        if (isSelected) {
          set({ selectedFeatures: state.selectedFeatures.filter(id => id !== featureId) })
        } else {
          set({ selectedFeatures: [...state.selectedFeatures, featureId] })
        }
      },

      clearFeatureSelection: () => {
        set({ selectedFeatures: [] })
      },

      setSelectedFeatures: (featureIds: string[]) => {
        set({ selectedFeatures: featureIds })
      },

      // Cache management
      clearCache: () => {
        const tenantFeatureService = TenantFeatureService.getInstance()
        tenantFeatureService.clearCache()
        
        set({ lastFetched: {} })
      },

      refreshCache: async () => {
        get().clearCache()
        
        // Refresh all data
        await Promise.all([
          get().fetchAllFeatures(),
          get().fetchStats(),
          get().fetchRecentActivities()
        ])
        
        // Refresh selected tenant features if any
        const { selectedTenantId } = get()
        if (selectedTenantId) {
          await get().fetchTenantFeatures(selectedTenantId)
        }
      },

      // Error handling
      clearError: () => {
        set({ 
          featuresError: null,
          tenantFeaturesError: null
        })
      },

      setError: (error: string) => {
        set({ featuresError: error })
      },

      // Permissions
      updatePermissions: () => {
        const permissions = getInitialPermissions()
        set({ permissions })
      }
    }),
    {
      name: 'feature-management-store',
      partialize: (state: FeatureManagementStore) => ({
        // Persist only UI state, not data that should be fresh
        selectedTenantId: state.selectedTenantId,
        filters: state.filters,
        tenantFilters: state.tenantFilters,
        pagination: state.pagination,
        selectedFeatures: []
      })
    }
  )
)

// Export helper hooks for common patterns
export const useFeatures = () => {
  const store = useFeatureManagementStore()
  return {
    features: store.features,
    loading: store.featuresLoading,
    error: store.featuresError,
    fetchFeatures: store.fetchAllFeatures,
    createFeature: store.createFeature,
    updateFeature: store.updateFeature,
    deleteFeature: store.deleteFeature
  }
}

export const useTenantFeatures = () => {
  const store = useFeatureManagementStore()
  return {
    tenantFeatures: store.tenantFeatures,
    selectedTenantId: store.selectedTenantId,
    loading: store.tenantFeaturesLoading,
    error: store.tenantFeaturesError,
    setSelectedTenant: store.setSelectedTenant,
    fetchTenantFeatures: store.fetchTenantFeatures,
    enableFeature: store.enableFeatureForTenant,
    disableFeature: store.disableFeatureForTenant,
    bulkUpdate: store.bulkUpdateTenantFeatures
  }
}

export const useFeatureManagementUI = () => {
  const store = useFeatureManagementStore()
  return {
    searchQuery: store.searchQuery,
    filters: store.filters,
    tenantFilters: store.tenantFilters,
    pagination: store.pagination,
    selectedFeatures: store.selectedFeatures,
    setSearchQuery: store.setSearchQuery,
    setFilters: store.setFilters,
    setTenantFilters: store.setTenantFilters,
    setPagination: store.setPagination,
    toggleFeatureSelection: store.toggleFeatureSelection,
    clearFeatureSelection: store.clearFeatureSelection,
    setSelectedFeatures: store.setSelectedFeatures
  }
}

export default useFeatureManagementStore