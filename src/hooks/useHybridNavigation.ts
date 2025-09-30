/**
 * Hybrid Navigation Hook - Option C Implementation
 * Enhances static navigation with FeatureService access control
 */

import { useMemo, useEffect } from 'react'
import { useAuth } from '@/auth'
import navigationConfig from '@/configs/navigation.config'
import { useFeatureStore } from '@/store/featureStore'
import { 
  FEATURE_TO_MENU_MAPPING, 
  MENU_TO_FEATURE_MAPPING,
  FREE_FEATURES 
} from '@/constants/features.constant'
import type { NavigationTree } from '@/@types/navigation'

export interface UseHybridNavigationResult {
  // Navigation items with feature-based access control
  navigationItems: NavigationTree[]
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Access control functions
  hasMenuAccess: (menuKey: string) => boolean
  hasFeatureAccess: (featureKey: string) => boolean
  
  // Cache and refresh functions
  refreshFeatures: () => void
  clearCache: () => void
  
  // Debugging
  debugInfo: {
    enabledFeatureKeys: string[]
    totalMenuItems: number
    accessibleMenuItems: number
  }
}

export const useHybridNavigation = (): UseHybridNavigationResult => {
  const { user, authenticated } = useAuth()
  
  // Get feature access data from store
  const enabledFeatureKeys = useFeatureStore(state => state.userFeatures.enabledFeatureKeys)
  const isLoading = useFeatureStore(state => state.userFeatures.loading)
  const error = useFeatureStore(state => state.userFeatures.error)
  
  // Initialize features when authenticated
  const fetchUserFeatures = useFeatureStore(state => state.fetchUserFeatures)
  const clearAllCache = useFeatureStore(state => state.clearAllCache)
  
  // Load features when user is authenticated
  useEffect(() => {
    if (authenticated && user) {
      console.log('HybridNavigation - Loading user features for authenticated user:', {
        authenticated,
        user: user.userName,
        userEmail: user.email,
        userAuthority: user.authority,
        currentEnabledFeatures: enabledFeatureKeys,
        isLoading
      })
      
      // Clear cache and fetch fresh data
      clearAllCache()
      fetchUserFeatures()
    }
  }, [authenticated, user, fetchUserFeatures, clearAllCache])

  // Debug feature loading state
  useEffect(() => {
    console.log('HybridNavigation - Feature state changed:', {
      enabledFeatureKeys,
      isLoading,
      error,
      featuresCount: enabledFeatureKeys.length
    })
    
    // Expose debug methods to window for testing
    if (typeof window !== 'undefined') {
      (window as any).debugFeatures = {
        clearCache: clearAllCache,
        refreshFeatures: fetchUserFeatures,
        currentFeatures: enabledFeatureKeys,
        forceRefresh: () => {
          clearAllCache()
          fetchUserFeatures()
        }
      }
    }
  }, [enabledFeatureKeys, isLoading, error, clearAllCache, fetchUserFeatures])
  
  // Check if user has access to a specific feature
  const hasFeatureAccess = useMemo(() => {
    return (featureKey: string): boolean => {
      // Always allow free features
      if (FREE_FEATURES.includes(featureKey as any)) {
        return true
      }
      
      // Check if feature is enabled for tenant
      return enabledFeatureKeys.includes(featureKey)
    }
  }, [enabledFeatureKeys])
  
  // Check if user has access to a specific menu item
  const hasMenuAccess = useMemo(() => {
    return (menuKey: string): boolean => {
      // Get features that control this menu
      const requiredFeatures = MENU_TO_FEATURE_MAPPING[menuKey] || []
      
      // If no features control this menu, check role-based access (existing logic)
      if (requiredFeatures.length === 0) {
        return true // Will be filtered by role-based access in navigation filter
      }
      
      // Check if user has at least one required feature
      return requiredFeatures.some(featureKey => hasFeatureAccess(featureKey))
    }
  }, [hasFeatureAccess])
  
  // Enhanced navigation items with feature-based access control
  const navigationItems = useMemo((): NavigationTree[] => {
    if (!authenticated) {
      return []
    }
    
    // Start with complete static navigation structure
    const enhancedNavigation = enhanceNavigationWithFeatures(navigationConfig, hasMenuAccess, user?.authority || [])
    
    console.log('HybridNavigation - Enhanced navigation:', {
      originalItems: navigationConfig.length,
      enhancedItems: enhancedNavigation.length,
      enabledFeatures: enabledFeatureKeys,
      userRoles: user?.roles,
      userAuthority: user?.authority,
      userRoleString: user?.authority?.join(', ') || 'No roles',
      hasMenuAccess: {
        home: hasMenuAccess('home'),
        tenantportal: hasMenuAccess('tenantportal'),
        adminMenu: hasMenuAccess('adminMenu'),
        tenantDashboard: hasMenuAccess('tenantDashboard'),
        shopKPI: hasMenuAccess('shopKPI'),
        'shopKPI.shopProperties': hasMenuAccess('shopKPI.shopProperties'),
        'shopKPI.shopKpi': hasMenuAccess('shopKPI.shopKpi'),
        partsManagement: hasMenuAccess('partsManagement'),
        accounting: hasMenuAccess('accounting'),
        subscriptions: hasMenuAccess('subscriptions'),
        reports: hasMenuAccess('reports'),
      },
      roleConstants: {
        TENANT_ADMIN: 'Tenant-Admin',
        CS_ADMIN: 'CS-Admin',
        END_USER: 'End-User'
      }
    })
    
    return enhancedNavigation
  }, [authenticated, hasMenuAccess, user?.roles, enabledFeatureKeys])
  
  // Computed states
  const isInitialized = !isLoading && !error
  const totalMenuItems = navigationConfig.length
  const accessibleMenuItems = navigationItems.length
  
  return {
    navigationItems,
    isLoading,
    isInitialized,
    hasMenuAccess,
    hasFeatureAccess,
    refreshFeatures: () => {
      console.log('HybridNavigation - Manual refresh triggered')
      clearAllCache()
      fetchUserFeatures()
    },
    clearCache: () => {
      console.log('HybridNavigation - Cache cleared')
      clearAllCache()
    },
    debugInfo: {
      enabledFeatureKeys,
      totalMenuItems,
      accessibleMenuItems,
    }
  }
}

/**
 * Enhance static navigation with feature-based access control
 */
function enhanceNavigationWithFeatures(
  navigation: NavigationTree[],
  hasMenuAccess: (menuKey: string) => boolean,
  userAuthority: string[]
): NavigationTree[] {
  return navigation.reduce<NavigationTree[]>((acc, navItem) => {
    // Check feature-based access
    const hasFeatureAccess = hasMenuAccess(navItem.key)
    
    // Check role-based access (existing logic)
    const hasRoleAccess = !navItem.authority?.length || 
      navItem.authority.some(role => userAuthority.includes(role))
    
    console.log(`Navigation check for ${navItem.key}:`, {
      featureAccess: hasFeatureAccess,
      roleAccess: hasRoleAccess,
      requiredAuthority: navItem.authority,
      userAuthority: userAuthority,
      userRoles: userAuthority.join(', '),
      willShow: hasFeatureAccess && hasRoleAccess
    })
    
    // Must have both feature and role access
    if (!hasFeatureAccess || !hasRoleAccess) {
      return acc
    }
    
    // Process sub-menus recursively
    const enhancedItem = { ...navItem }
    if (enhancedItem.subMenu && enhancedItem.subMenu.length > 0) {
      const enhancedSubMenus = enhanceNavigationWithFeatures(
        enhancedItem.subMenu,
        hasMenuAccess,
        userAuthority
      )
      
      // Only include parent if it has accessible sub-menus or is a direct item
      if (enhancedSubMenus.length > 0 || enhancedItem.type === 'item') {
        enhancedItem.subMenu = enhancedSubMenus
        acc.push(enhancedItem)
      }
    } else {
      // Leaf item - include if accessible
      acc.push(enhancedItem)
    }
    
    return acc
  }, [])
}