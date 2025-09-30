/**
 * Feature Navigation Hook - Dynamic Menu Generation
 * Replaces static navigation with dynamic feature-based menu generation
 */

import { useEffect, useMemo, useCallback } from 'react'
import { useFeatureStore, featureSelectors } from '@/store/featureStore'
import { useAuth } from '@/auth'
import type { 
  FeatureMenuItem, 
  FeatureAccessResponse 
} from '@/@types/feature'
import type { NavigationTree } from '@/@types/navigation'
import type { User } from '@/@types/auth'
import { FREE_FEATURES, FEATURE_DEFINITIONS } from '@/constants/features.constant'

export interface UseFeatureNavigationResult {
  // Navigation items
  navigationItems: NavigationTree[]
  menuItems: FeatureMenuItem[]
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Error handling
  error: string | null
  
  // Feature access methods
  hasFeatureAccess: (featureKey: string) => boolean
  checkFeatureAccess: (featureKey: string) => Promise<FeatureAccessResponse>
  
  // Navigation state
  activeFeature: string | null
  collapsedMenus: string[]
  
  // Navigation actions
  setActiveFeature: (featureKey: string | null) => void
  toggleMenuCollapse: (menuKey: string) => void
  refreshNavigation: () => Promise<void>
  
  // Utility methods
  getFeatureDefinition: (featureKey: string) => any
  validateUserAccess: (featureKey: string, userRoles: string[]) => boolean
}

export const useFeatureNavigation = (): UseFeatureNavigationResult => {
  const { user, authenticated } = useAuth()
  
  // Store selectors
  const enabledFeatureKeys = useFeatureStore(featureSelectors.enabledFeatureKeys)
  const availableFeatures = useFeatureStore(featureSelectors.availableFeatures)
  const isLoading = useFeatureStore(featureSelectors.userFeaturesLoading)
  const error = useFeatureStore(featureSelectors.userFeaturesError)
  const activeFeature = useFeatureStore(featureSelectors.activeFeature)
  const collapsedMenus = useFeatureStore(featureSelectors.collapsedMenus)
  
  // Store actions
  const fetchUserFeatures = useFeatureStore(state => state.fetchUserFeatures)
  const checkFeatureAccessAction = useFeatureStore(state => state.checkFeatureAccess)
  const hasFeatureAccessAction = useFeatureStore(state => state.hasFeatureAccess)
  const setActiveFeature = useFeatureStore(state => state.setActiveFeature)
  const toggleMenuCollapse = useFeatureStore(state => state.toggleMenuCollapse)
  const refreshEnabledFeatures = useFeatureStore(state => state.refreshEnabledFeatures)

  // Initialize feature navigation on auth change
  useEffect(() => {
    if (authenticated && user) {
      fetchUserFeatures()
    }
  }, [authenticated, user, fetchUserFeatures])

  // Transform feature menu items to navigation format
  const navigationItems = useMemo((): NavigationTree[] => {
    if (!availableFeatures.length) return []

    return availableFeatures
      .filter(feature => {
        // Filter based on user roles
        if (feature.requiredRoles.length > 0 && user?.roles) {
          return feature.requiredRoles.some(role => 
            user.roles?.some((userRole: string) => userRole === role)
          )
        }
        return true
      })
      .map(feature => transformToNavigationItem(feature))
      .filter(Boolean) as NavigationTree[]
  }, [availableFeatures, user?.roles])

  // Check if user has access to a feature
  const hasFeatureAccess = useCallback((featureKey: string): boolean => {
    return hasFeatureAccessAction(featureKey)
  }, [hasFeatureAccessAction])

  // Check feature access with API call
  const checkFeatureAccess = useCallback(async (featureKey: string): Promise<FeatureAccessResponse> => {
    return checkFeatureAccessAction(featureKey)
  }, [checkFeatureAccessAction])

  // Refresh navigation data
  const refreshNavigation = useCallback(async (): Promise<void> => {
    await fetchUserFeatures()
  }, [fetchUserFeatures])

  // Get feature definition
  const getFeatureDefinition = useCallback((featureKey: string) => {
    return FEATURE_DEFINITIONS[featureKey]
  }, [])

  // Validate user access based on roles
  const validateUserAccess = useCallback((featureKey: string, userRoles: string[]): boolean => {
    const definition = FEATURE_DEFINITIONS[featureKey]
    if (!definition?.requiredRoles?.length) return true
    
    return definition.requiredRoles.some(requiredRole =>
      userRoles.some(userRole => userRole === requiredRole)
    )
  }, [])

  // Computed values
  const isInitialized = useMemo(() => {
    return authenticated ? availableFeatures.length > 0 || !isLoading : true
  }, [authenticated, availableFeatures.length, isLoading])

  return {
    // Navigation items
    navigationItems,
    menuItems: availableFeatures,
    
    // Loading states
    isLoading,
    isInitialized,
    
    // Error handling
    error,
    
    // Feature access methods
    hasFeatureAccess,
    checkFeatureAccess,
    
    // Navigation state
    activeFeature,
    collapsedMenus,
    
    // Navigation actions
    setActiveFeature,
    toggleMenuCollapse,
    refreshNavigation,
    
    // Utility methods
    getFeatureDefinition,
    validateUserAccess,
  }
}

// Hook for checking specific feature access with loading state
export const useFeatureAccess = (featureKey: string) => {
  const isCheckingAccess = useFeatureStore(featureSelectors.isCheckingAccess(featureKey))
  const hasAccess = useFeatureStore(state => state.hasFeatureAccess(featureKey))
  const checkAccess = useFeatureStore(state => state.checkFeatureAccess)
  
  const checkFeatureAccess = useCallback(async () => {
    return checkAccess(featureKey)
  }, [checkAccess, featureKey])
  
  return {
    hasAccess,
    isLoading: isCheckingAccess,
    checkAccess: checkFeatureAccess,
  }
}

// Hook for admin feature management
export const useAdminFeatures = () => {
  const allFeatures = useFeatureStore(featureSelectors.allFeatures)
  const isLoading = useFeatureStore(featureSelectors.adminLoading)
  const error = useFeatureStore(featureSelectors.adminError)
  const usageReport = useFeatureStore(featureSelectors.usageReport)
  const auditLog = useFeatureStore(featureSelectors.auditLog)
  
  // Actions
  const fetchAllFeatures = useFeatureStore(state => state.fetchAllFeatures)
  const fetchTenantFeatures = useFeatureStore(state => state.fetchTenantFeatures)
  const enableTenantFeature = useFeatureStore(state => state.enableTenantFeature)
  const disableTenantFeature = useFeatureStore(state => state.disableTenantFeature)
  const bulkUpdateTenantFeatures = useFeatureStore(state => state.bulkUpdateTenantFeatures)
  const fetchUsageReport = useFeatureStore(state => state.fetchUsageReport)
  const fetchAuditLog = useFeatureStore(state => state.fetchAuditLog)
  const clearAdminError = useFeatureStore(state => state.clearAdminError)
  
  // Get tenant features with selector
  const getTenantFeatures = useCallback((tenantId: string) => {
    return useFeatureStore.getState().adminFeatures.tenantFeatures[tenantId] || []
  }, [])
  
  // Check loading states for specific operations
  const isEnablingFeature = useCallback((tenantId: string, featureId: string) => {
    return useFeatureStore(featureSelectors.isEnablingFeature(tenantId, featureId))
  }, [])
  
  const isDisablingFeature = useCallback((tenantId: string, featureId: string) => {
    return useFeatureStore(featureSelectors.isDisablingFeature(tenantId, featureId))
  }, [])
  
  const isBulkUpdating = useFeatureStore(featureSelectors.isBulkUpdating)
  
  return {
    // Data
    allFeatures,
    getTenantFeatures,
    usageReport,
    auditLog,
    
    // Loading states
    isLoading,
    isBulkUpdating,
    isEnablingFeature,
    isDisablingFeature,
    
    // Error handling
    error,
    clearError: clearAdminError,
    
    // Actions
    fetchAllFeatures,
    fetchTenantFeatures,
    enableTenantFeature,
    disableTenantFeature,
    bulkUpdateTenantFeatures,
    fetchUsageReport,
    fetchAuditLog,
  }
}

// Utility function to transform feature menu item to navigation item
function transformToNavigationItem(feature: FeatureMenuItem): NavigationTree | null {
  try {
    const navigationItem: NavigationTree = {
      key: feature.menuKey,
      title: feature.title,
      translateKey: feature.title, // Using title as translate key for now
      path: feature.path,
      icon: feature.icon,
      type: feature.type,
      authority: [], // Empty authority array for feature-controlled items
      subMenu: feature.subMenus?.map(subMenu => transformToNavigationItem(subMenu)).filter(Boolean) as NavigationTree[] || [],
      metadata: {
        featureKey: feature.featureKey,
        category: feature.metadata?.category,
        description: feature.metadata?.description,
        isFeatureControlled: true,
      },
    }

    return navigationItem
  } catch (error) {
    console.error('Error transforming feature to navigation item:', feature, error)
    return null
  }
}

// Hook for feature-based route protection
export const useFeatureGuard = (featureKey: string) => {
  const { hasAccess, checkAccess, isLoading } = useFeatureAccess(featureKey)
  const { user } = useAuth()
  
  // Check if feature is free (always accessible)
  const isFreeFeature = FREE_FEATURES.includes(featureKey as any)
  
  // Validate role-based access
  const hasRoleAccess = useMemo(() => {
    const definition = FEATURE_DEFINITIONS[featureKey]
    if (!definition?.requiredRoles?.length || !user?.roles) return true
    
    return definition.requiredRoles.some(requiredRole =>
      user.roles?.some((userRole: string) => userRole === requiredRole)
    )
  }, [featureKey, user?.roles])
  
  // Combined access check
  const canAccess = isFreeFeature || (hasAccess && hasRoleAccess)
  
  return {
    canAccess,
    hasFeatureAccess: hasAccess,
    hasRoleAccess,
    isFreeFeature,
    isLoading,
    checkAccess,
    reason: !canAccess 
      ? (!hasRoleAccess ? 'Insufficient role permissions' : 'Feature not enabled for tenant')
      : undefined,
  }
}

export default useFeatureNavigation