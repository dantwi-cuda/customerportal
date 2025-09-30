/**
 * Feature Store - Zustand State Management for Feature System
 * Manages user features, admin features, loading states, and caching
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import featureService from '@/services/FeatureService'
import type {
  FeatureResponse,
  TenantFeatureResponse,
  FeatureMenuItem,
  UserFeaturesResponse,
  FeatureAccessResponse,
  FeatureUsageReport,
  AuditLogResponse,
  AuditQuery,
} from '@/@types/feature'

// Store state interface
interface FeatureState {
  // User features state
  userFeatures: {
    data: UserFeaturesResponse | null
    enabledFeatureKeys: string[]
    availableFeatures: FeatureMenuItem[]
    loading: boolean
    error: string | null
    lastUpdated: Date | null
  }

  // Admin features state (for portal admin only)
  adminFeatures: {
    allFeatures: FeatureResponse[]
    tenantFeatures: Record<string, TenantFeatureResponse[]>
    usageReport: FeatureUsageReport | null
    auditLog: AuditLogResponse | null
    loading: boolean
    error: string | null
    lastUpdated: Date | null
  }

  // Navigation state
  navigation: {
    menuItems: FeatureMenuItem[]
    collapsedMenus: string[]
    activeFeatureKey: string | null
  }

  // Cache and performance
  cache: {
    featureAccessCache: Record<string, { hasAccess: boolean; expiresAt: Date }>
    invalidationQueue: string[]
  }

  // Loading states for specific operations
  loadingStates: {
    checkingAccess: string[]
    enablingFeature: string[]
    disablingFeature: string[]
    bulkUpdating: boolean
  }
}

// Store actions interface
interface FeatureActions {
  // User feature actions
  fetchUserFeatures: () => Promise<void>
  checkFeatureAccess: (featureKey: string, useCache?: boolean) => Promise<FeatureAccessResponse>
  refreshEnabledFeatures: () => Promise<void>
  hasFeatureAccess: (featureKey: string) => boolean

  // Admin feature actions
  fetchAllFeatures: () => Promise<void>
  fetchTenantFeatures: (tenantId: string) => Promise<void>
  enableTenantFeature: (tenantId: string, featureId: string, reason?: string) => Promise<void>
  disableTenantFeature: (tenantId: string, featureId: string, reason?: string) => Promise<void>
  bulkUpdateTenantFeatures: (tenantId: string, updates: Array<{ featureId: string; enabled: boolean; reason?: string }>) => Promise<void>
  
  // Reporting and audit actions
  fetchUsageReport: (startDate?: string, endDate?: string) => Promise<void>
  fetchAuditLog: (query: AuditQuery) => Promise<void>

  // Navigation actions
  setActiveFeature: (featureKey: string | null) => void
  toggleMenuCollapse: (menuKey: string) => void
  generateNavigation: () => FeatureMenuItem[]

  // Cache management
  clearFeatureAccessCache: () => void
  invalidateFeatureCache: (featureKey: string) => void
  clearAllCache: () => void

  // Error handling
  clearUserError: () => void
  clearAdminError: () => void

  // Reset actions
  resetUserFeatures: () => void
  resetAdminFeatures: () => void
  resetStore: () => void
}

type FeatureStore = FeatureState & FeatureActions

// Initial state
const initialState: FeatureState = {
  userFeatures: {
    data: null,
    enabledFeatureKeys: [],
    availableFeatures: [],
    loading: false,
    error: null,
    lastUpdated: null,
  },
  adminFeatures: {
    allFeatures: [],
    tenantFeatures: {},
    usageReport: null,
    auditLog: null,
    loading: false,
    error: null,
    lastUpdated: null,
  },
  navigation: {
    menuItems: [],
    collapsedMenus: [],
    activeFeatureKey: null,
  },
  cache: {
    featureAccessCache: {},
    invalidationQueue: [],
  },
  loadingStates: {
    checkingAccess: [],
    enablingFeature: [],
    disablingFeature: [],
    bulkUpdating: false,
  },
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000

export const useFeatureStore = create<FeatureStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // USER FEATURE ACTIONS
      fetchUserFeatures: async () => {
        set(state => ({
          userFeatures: { ...state.userFeatures, loading: true, error: null }
        }))

        try {
          const data = await featureService.getUserFeatures()
          
          set(state => ({
            userFeatures: {
              ...state.userFeatures,
              data,
              enabledFeatureKeys: data.enabledFeatureKeys,
              availableFeatures: data.availableFeatures,
              loading: false,
              lastUpdated: new Date(),
            },
            navigation: {
              ...state.navigation,
              menuItems: data.availableFeatures,
            }
          }))
        } catch (error) {
          set(state => ({
            userFeatures: {
              ...state.userFeatures,
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch user features',
            }
          }))
        }
      },

      checkFeatureAccess: async (featureKey: string, useCache = true) => {
        const state = get()
        
        // Check cache first if enabled
        if (useCache) {
          const cached = state.cache.featureAccessCache[featureKey]
          if (cached && cached.expiresAt > new Date()) {
            return {
              featureKey,
              hasAccess: cached.hasAccess,
              reason: cached.hasAccess ? 'Feature enabled (cached)' : 'Feature disabled (cached)',
            }
          }
        }

        // Add to loading state
        set(state => ({
          loadingStates: {
            ...state.loadingStates,
            checkingAccess: [...state.loadingStates.checkingAccess, featureKey],
          }
        }))

        try {
          const result = await featureService.checkFeatureAccess(featureKey)
          
          // Update cache
          const expiresAt = new Date(Date.now() + CACHE_EXPIRATION_MS)
          set(state => ({
            cache: {
              ...state.cache,
              featureAccessCache: {
                ...state.cache.featureAccessCache,
                [featureKey]: { hasAccess: result.hasAccess, expiresAt },
              }
            },
            loadingStates: {
              ...state.loadingStates,
              checkingAccess: state.loadingStates.checkingAccess.filter(key => key !== featureKey),
            }
          }))

          return result
        } catch (error) {
          set(state => ({
            loadingStates: {
              ...state.loadingStates,
              checkingAccess: state.loadingStates.checkingAccess.filter(key => key !== featureKey),
            }
          }))
          
          return {
            featureKey,
            hasAccess: false,
            reason: 'Error checking feature access',
          }
        }
      },

      refreshEnabledFeatures: async () => {
        try {
          const enabledFeatureKeys = await featureService.getEnabledFeatures()
          
          set(state => ({
            userFeatures: {
              ...state.userFeatures,
              enabledFeatureKeys,
              lastUpdated: new Date(),
            }
          }))
          
          // Clear cache to force refresh
          get().clearFeatureAccessCache()
        } catch (error) {
          console.error('Error refreshing enabled features:', error)
        }
      },

      hasFeatureAccess: (featureKey: string) => {
        const state = get()
        return state.userFeatures.enabledFeatureKeys.includes(featureKey) || featureService.isFreeFeature(featureKey)
      },

      // ADMIN FEATURE ACTIONS
      fetchAllFeatures: async () => {
        set(state => ({
          adminFeatures: { ...state.adminFeatures, loading: true, error: null }
        }))

        try {
          // TODO: Implement admin features API
          console.warn('getAllFeatures method not available')
          
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              allFeatures: [],
              loading: false,
              lastUpdated: new Date(),
            }
          }))
        } catch (error) {
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch all features',
            }
          }))
        }
      },

      fetchTenantFeatures: async (tenantId: string) => {
        set(state => ({
          adminFeatures: { ...state.adminFeatures, loading: true, error: null }
        }))

        try {
          // TODO: Implement getTenantFeatures method
          console.warn('getTenantFeatures method not available')
          const features: any[] = []
          
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              tenantFeatures: {
                ...state.adminFeatures.tenantFeatures,
                [tenantId]: features,
              },
              loading: false,
              lastUpdated: new Date(),
            }
          }))
        } catch (error) {
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch tenant features',
            }
          }))
        }
      },

      enableTenantFeature: async (tenantId: string, featureId: string, reason?: string) => {
        set(state => ({
          loadingStates: {
            ...state.loadingStates,
            enablingFeature: [...state.loadingStates.enablingFeature, `${tenantId}-${featureId}`],
          }
        }))

        try {
          // TODO: Implement enableTenantFeature method
          console.warn('enableTenantFeature method not available')
          
          // Refresh tenant features
          await get().fetchTenantFeatures(tenantId)
          
          set(state => ({
            loadingStates: {
              ...state.loadingStates,
              enablingFeature: state.loadingStates.enablingFeature.filter(
                key => key !== `${tenantId}-${featureId}`
              ),
            }
          }))
        } catch (error) {
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              error: error instanceof Error ? error.message : 'Failed to enable feature',
            },
            loadingStates: {
              ...state.loadingStates,
              enablingFeature: state.loadingStates.enablingFeature.filter(
                key => key !== `${tenantId}-${featureId}`
              ),
            }
          }))
          throw error
        }
      },

      disableTenantFeature: async (tenantId: string, featureId: string, reason?: string) => {
        set(state => ({
          loadingStates: {
            ...state.loadingStates,
            disablingFeature: [...state.loadingStates.disablingFeature, `${tenantId}-${featureId}`],
          }
        }))

        try {
          // TODO: Implement disableTenantFeature method
          console.warn('disableTenantFeature method not available')
          
          // Refresh tenant features
          await get().fetchTenantFeatures(tenantId)
          
          set(state => ({
            loadingStates: {
              ...state.loadingStates,
              disablingFeature: state.loadingStates.disablingFeature.filter(
                key => key !== `${tenantId}-${featureId}`
              ),
            }
          }))
        } catch (error) {
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              error: error instanceof Error ? error.message : 'Failed to disable feature',
            },
            loadingStates: {
              ...state.loadingStates,
              disablingFeature: state.loadingStates.disablingFeature.filter(
                key => key !== `${tenantId}-${featureId}`
              ),
            }
          }))
          throw error
        }
      },

      bulkUpdateTenantFeatures: async (tenantId: string, updates: Array<{ featureId: string; enabled: boolean; reason?: string }>) => {
        set(state => ({
          loadingStates: { ...state.loadingStates, bulkUpdating: true }
        }))

        try {
          const bulkUpdates = updates.map(update => ({
            featureId: update.featureId,
            isEnabled: update.enabled,
            reason: update.reason,
          }))

          // TODO: Implement bulkUpdateTenantFeatures method
          console.warn('bulkUpdateTenantFeatures method not available')
          
          // Refresh tenant features
          await get().fetchTenantFeatures(tenantId)
          
          set(state => ({
            loadingStates: { ...state.loadingStates, bulkUpdating: false }
          }))
        } catch (error) {
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              error: error instanceof Error ? error.message : 'Failed to bulk update features',
            },
            loadingStates: { ...state.loadingStates, bulkUpdating: false }
          }))
          throw error
        }
      },

      // REPORTING AND AUDIT ACTIONS
      fetchUsageReport: async (startDate?: string, endDate?: string) => {
        set(state => ({
          adminFeatures: { ...state.adminFeatures, loading: true, error: null }
        }))

        try {
          // TODO: Implement getFeatureUsageReport method
          console.warn('getFeatureUsageReport method not available')
          const report = null
          
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              usageReport: report,
              loading: false,
            }
          }))
        } catch (error) {
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch usage report',
            }
          }))
        }
      },

      fetchAuditLog: async (query: AuditQuery) => {
        set(state => ({
          adminFeatures: { ...state.adminFeatures, loading: true, error: null }
        }))

        try {
          // TODO: Implement getFeatureAuditLog method
          console.warn('getFeatureAuditLog method not available')
          const auditLog = null
          
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              auditLog,
              loading: false,
            }
          }))
        } catch (error) {
          set(state => ({
            adminFeatures: {
              ...state.adminFeatures,
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch audit log',
            }
          }))
        }
      },

      // NAVIGATION ACTIONS
      setActiveFeature: (featureKey: string | null) => {
        set(state => ({
          navigation: { ...state.navigation, activeFeatureKey: featureKey }
        }))
      },

      toggleMenuCollapse: (menuKey: string) => {
        set(state => {
          const collapsedMenus = state.navigation.collapsedMenus.includes(menuKey)
            ? state.navigation.collapsedMenus.filter(key => key !== menuKey)
            : [...state.navigation.collapsedMenus, menuKey]
          
          return {
            navigation: { ...state.navigation, collapsedMenus }
          }
        })
      },

      generateNavigation: () => {
        const state = get()
        return state.userFeatures.availableFeatures
      },

      // CACHE MANAGEMENT
      clearFeatureAccessCache: () => {
        set(state => ({
          cache: { ...state.cache, featureAccessCache: {} }
        }))
      },

      invalidateFeatureCache: (featureKey: string) => {
        set(state => {
          const newCache = { ...state.cache.featureAccessCache }
          delete newCache[featureKey]
          
          return {
            cache: {
              ...state.cache,
              featureAccessCache: newCache,
              invalidationQueue: [...state.cache.invalidationQueue, featureKey],
            }
          }
        })
      },

      clearAllCache: () => {
        set(state => ({
          cache: {
            featureAccessCache: {},
            invalidationQueue: [],
          }
        }))
      },

      // ERROR HANDLING
      clearUserError: () => {
        set(state => ({
          userFeatures: { ...state.userFeatures, error: null }
        }))
      },

      clearAdminError: () => {
        set(state => ({
          adminFeatures: { ...state.adminFeatures, error: null }
        }))
      },

      // RESET ACTIONS
      resetUserFeatures: () => {
        set(state => ({
          userFeatures: initialState.userFeatures,
          navigation: initialState.navigation,
        }))
      },

      resetAdminFeatures: () => {
        set(state => ({
          adminFeatures: initialState.adminFeatures
        }))
      },

      resetStore: () => {
        set(() => initialState)
      },
    })),
    {
      name: 'feature-store',
      partialize: (state: any) => ({
        // Only persist navigation state and collapsed menus
        navigation: {
          collapsedMenus: state.navigation.collapsedMenus,
          activeFeatureKey: state.navigation.activeFeatureKey,
        },
      }),
    }
  )
)

// Selectors for optimized component subscriptions
export const featureSelectors = {
  // User feature selectors
  enabledFeatureKeys: (state: FeatureStore) => state.userFeatures.enabledFeatureKeys,
  availableFeatures: (state: FeatureStore) => state.userFeatures.availableFeatures,
  userFeaturesLoading: (state: FeatureStore) => state.userFeatures.loading,
  userFeaturesError: (state: FeatureStore) => state.userFeatures.error,

  // Navigation selectors
  navigationItems: (state: FeatureStore) => state.navigation.menuItems,
  collapsedMenus: (state: FeatureStore) => state.navigation.collapsedMenus,
  activeFeature: (state: FeatureStore) => state.navigation.activeFeatureKey,

  // Admin selectors
  allFeatures: (state: FeatureStore) => state.adminFeatures.allFeatures,
  tenantFeatures: (tenantId: string) => (state: FeatureStore) => 
    state.adminFeatures.tenantFeatures[tenantId] || [],
  adminLoading: (state: FeatureStore) => state.adminFeatures.loading,
  adminError: (state: FeatureStore) => state.adminFeatures.error,
  usageReport: (state: FeatureStore) => state.adminFeatures.usageReport,
  auditLog: (state: FeatureStore) => state.adminFeatures.auditLog,

  // Loading state selectors
  isCheckingAccess: (featureKey: string) => (state: FeatureStore) =>
    state.loadingStates.checkingAccess.includes(featureKey),
  isEnablingFeature: (tenantId: string, featureId: string) => (state: FeatureStore) =>
    state.loadingStates.enablingFeature.includes(`${tenantId}-${featureId}`),
  isDisablingFeature: (tenantId: string, featureId: string) => (state: FeatureStore) =>
    state.loadingStates.disablingFeature.includes(`${tenantId}-${featureId}`),
  isBulkUpdating: (state: FeatureStore) => state.loadingStates.bulkUpdating,
}

export default useFeatureStore