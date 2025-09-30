/**
 * Feature Service - API Layer for Feature Management
 * Handles all communication with the backend feature APIs based on swagger.json
 */

import ApiService from './ApiService'
import type {
  TenantFeatureResponse,
  StringListApiResponse,
  BooleanApiResponse,
  TenantFeatureResponseListApiResponse,
  FeatureMenuItem,
  UserFeaturesResponse,
  FeatureAccessResponse,
} from '@/@types/feature'
import type { FeatureResponse } from '@/@types/featureManagement'
import {
  FEATURE_API_ENDPOINTS,
  FEATURE_DEFINITIONS,
  FEATURE_NAVIGATION_ICONS,
  FREE_FEATURES,
  FEATURE_KEYS,
} from '@/constants/features.constant'

export class FeatureService {
  /**
   * USER FEATURE ACCESS METHODS
   */

  /**
   * Get all available features for the current user
   * Returns enabled features without navigation hierarchy (now handled by hybrid navigation)
   */
  async getUserFeatures(): Promise<UserFeaturesResponse> {
    try {
      console.log('FeatureService - Starting getUserFeatures API calls...')
      
      // Get enabled feature keys for current tenant
      const enabledFeaturesResponse = await ApiService.fetchDataWithAxios<StringListApiResponse>({
        url: FEATURE_API_ENDPOINTS.TENANT_FEATURES_ENABLED,
        method: 'get'
      })

      console.log('FeatureService - Enabled features API response:', enabledFeaturesResponse)

      if (!enabledFeaturesResponse.success) {
        throw new Error(enabledFeaturesResponse.message || 'Failed to fetch enabled features')
      }

      const enabledFeatureKeys = enabledFeaturesResponse.data

      // Get detailed tenant features information
      const tenantFeaturesResponse = await ApiService.fetchDataWithAxios<TenantFeatureResponseListApiResponse>({
        url: FEATURE_API_ENDPOINTS.TENANT_FEATURES,
        method: 'get'
      })

      console.log('FeatureService - Tenant features API response:', tenantFeaturesResponse)

      if (!tenantFeaturesResponse.success) {
        throw new Error(tenantFeaturesResponse.message || 'Failed to fetch tenant features')
      }

      // Return enabled features (hierarchy is now handled by hybrid navigation)
      const availableFeatures = this.transformToFeatureList(
        tenantFeaturesResponse.data,
        enabledFeatureKeys
      )

      console.log('FeatureService - Final available features:', availableFeatures)

      return {
        userId: '', // Will be populated by auth context
        tenantId: '', // Will be populated by auth context
        availableFeatures,
        enabledFeatureKeys,
      }
    } catch (error) {
      console.error('FeatureService - Error fetching user features:', error)
      
      // For development/testing: Return mock data if API fails
      console.warn('FeatureService - API failed, returning mock data for testing')
      return this.getMockUserFeatures()
    }
  }

  /**
   * Check if a specific feature is enabled for the current user
   */
  async checkFeatureAccess(featureKey: string): Promise<FeatureAccessResponse> {
    try {
      const response = await ApiService.fetchDataWithAxios<BooleanApiResponse>({
        url: FEATURE_API_ENDPOINTS.TENANT_FEATURE_CHECK.replace('{featureKey}', featureKey),
        method: 'get'
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to check feature access')
      }

      return {
        featureKey,
        hasAccess: response.data,
        reason: response.message,
      }
    } catch (error) {
      console.error(`Error checking feature access for ${featureKey}:`, error)
      throw error
    }
  }

  /**
   * Get list of all enabled features for current tenant
   */
  async getEnabledFeatures(): Promise<string[]> {
    try {
      const response = await ApiService.fetchDataWithAxios<StringListApiResponse>({
        url: FEATURE_API_ENDPOINTS.TENANT_FEATURES_ENABLED,
        method: 'get'
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch enabled features')
      }

      return response.data
    } catch (error) {
      console.error('Error fetching enabled features:', error)
      throw error
    }
  }

  /**
   * Transform tenant features response to simple feature list
   * Navigation hierarchy is now handled by hybrid navigation hook
   */
  transformToFeatureList(
    tenantFeatures: TenantFeatureResponse[],
    enabledFeatureKeys: string[]
  ): FeatureMenuItem[] {
    // Filter enabled features and create simple list (no hierarchy)
    return tenantFeatures
      .filter(tenantFeature => enabledFeatureKeys.includes(tenantFeature.featureKey))
      .map(tenantFeature => {
        const definition = FEATURE_DEFINITIONS[tenantFeature.featureKey]
        const icon = FEATURE_NAVIGATION_ICONS[tenantFeature.featureKey] || 'HiCog'
        
        return {
          menuKey: `feature-${tenantFeature.featureKey}`,
          featureKey: tenantFeature.featureKey,
          title: definition?.name || tenantFeature.featureName,
          path: this.convertMenuPathToRoute(definition?.menuPath || tenantFeature.featureKey),
          icon,
          type: 'item' as const,
          requiredRoles: definition?.requiredRoles || [],
          metadata: {
            category: definition?.category || 'free',
            description: definition?.description,
            isEnabled: tenantFeature.isEnabled,
          },
          subMenus: [], // No sub-menus in simplified version
        }
      })
  }

  /**
   * Convert menuPath to actual route path
   */
  private convertMenuPathToRoute(menuPath: string): string {
    const pathMappings: Record<string, string> = {
      'tenantDashboard': '/app/tenant-dashboard',
      'shopKPI': '/app/shop-kpi',
      'shopKPI.shopProperties': '/app/shop-properties',
      'shopKPI.shopKpi': '/app/shop-kpi',
      'subscriptions': '/subscriptions',
      'reports': '/reports',
      'partsManagement': '/parts-management',
      'accounting': '/accounting',
    }
    
    return pathMappings[menuPath] || `/features/${menuPath.split('.').pop()}`
  }

  /**
   * Get mock user features for testing when API is not available
   */
  private getMockUserFeatures(): UserFeaturesResponse {
    // Mock tenant features response that would come from API
    const mockTenantFeatures: TenantFeatureResponse[] = [
      {
        featureId: '1',
        featureKey: FEATURE_KEYS.SHOP_KPI_BASIC,
        featureName: 'Shop KPI',
        category: 'free',
        isEnabled: true,
        enabledAt: new Date().toISOString(),
        enabledBy: { userId: '1', userName: 'System', email: 'system@system.com' }
      },
      {
        featureId: '2', 
        featureKey: FEATURE_KEYS.SHOP_PROPERTIES_BASIC,
        featureName: 'Shop Properties',
        category: 'free',
        isEnabled: true,
        enabledAt: new Date().toISOString(),
        enabledBy: { userId: '1', userName: 'System', email: 'system@system.com' }
      },
      {
        featureId: '3',
        featureKey: FEATURE_KEYS.KPI_GOALS_ADVANCED,
        featureName: 'KPI and Goals',
        category: 'paid',
        isEnabled: true,
        enabledAt: new Date().toISOString(),
        enabledBy: { userId: '1', userName: 'System', email: 'system@system.com' }
      }
    ]

    const enabledFeatureKeys = mockTenantFeatures.map(f => f.featureKey)
    const availableFeatures = this.transformToFeatureList(mockTenantFeatures, enabledFeatureKeys)

    return {
      userId: 'mock-user',
      tenantId: 'mock-tenant',
      availableFeatures,
      enabledFeatureKeys,
    }
  }

  /**
   * Check if feature is a free feature
   */
  isFreeFeature(featureKey: string): boolean {
    return FREE_FEATURES.includes(featureKey as any)
  }

  /**
   * Get feature category
   */
  getFeatureCategory(featureKey: string): 'free' | 'paid' {
    return this.isFreeFeature(featureKey) ? 'free' : 'paid'
  }

  /**
   * Validate feature dependencies
   */
  validateFeatureDependencies(featureKey: string, enabledFeatures: string[]): { valid: boolean; missing: string[] } {
    const definition = FEATURE_DEFINITIONS[featureKey]
    if (!definition?.dependencies?.length) {
      return { valid: true, missing: [] }
    }

    const missing = definition.dependencies.filter(dep => !enabledFeatures.includes(dep))
    return {
      valid: missing.length === 0,
      missing,
    }
  }

  /**
   * ADMIN FEATURE MANAGEMENT METHODS
   * These methods are for CS-Admin users to manage system features
   */

  /**
   * Get all system features (admin only)
   */
  async getAllFeatures(): Promise<FeatureResponse[]> {
    try {
      const response = await ApiService.fetchDataWithAxios<{ success: boolean; data: FeatureResponse[]; message?: string }>({
        url: FEATURE_API_ENDPOINTS.FEATURES,
        method: 'GET'
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch features')
      }

      return response.data
    } catch (error) {
      console.error('Error fetching all features:', error)
      throw error
    }
  }

  /**
   * Create a new feature (admin only)
   */
  async createFeature(feature: { featureKey: string; featureName: string; description: string; category: string; menuPath: string; isActive?: boolean }): Promise<FeatureResponse> {
    try {
      const response = await ApiService.fetchDataWithAxios<{ success: boolean; data: FeatureResponse; message?: string }>({
        url: FEATURE_API_ENDPOINTS.FEATURES,
        method: 'POST',
        data: feature as any
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to create feature')
      }

      return response.data
    } catch (error) {
      console.error('Error creating feature:', error)
      throw error
    }
  }

  /**
   * Get feature by ID (admin only)
   */
  async getFeatureById(featureId: string): Promise<FeatureResponse> {
    try {
      const url = FEATURE_API_ENDPOINTS.FEATURE_BY_ID.replace('{featureId}', featureId)
      const response = await ApiService.fetchDataWithAxios<{ success: boolean; data: FeatureResponse; message?: string }>({
        url,
        method: 'GET'
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch feature')
      }

      return response.data
    } catch (error) {
      console.error('Error fetching feature by ID:', error)
      throw error
    }
  }

  /**
   * Update an existing feature (admin only)
   */
  async updateFeature(featureId: string, feature: Partial<Omit<FeatureResponse, 'id' | 'createdAt' | 'updatedAt'>>): Promise<FeatureResponse> {
    try {
      const url = FEATURE_API_ENDPOINTS.FEATURE_BY_ID.replace('{featureId}', featureId)
      const response = await ApiService.fetchDataWithAxios<{ success: boolean; data: FeatureResponse; message?: string }>({
        url,
        method: 'PUT',
        data: feature as any
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to update feature')
      }

      return response.data
    } catch (error) {
      console.error('Error updating feature:', error)
      throw error
    }
  }

  /**
   * Delete a feature (admin only - soft delete)
   */
  async deleteFeature(featureId: string): Promise<void> {
    try {
      const url = FEATURE_API_ENDPOINTS.FEATURE_BY_ID.replace('{featureId}', featureId)
      const response = await ApiService.fetchDataWithAxios<{ success: boolean; message?: string }>({
        url,
        method: 'DELETE'
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete feature')
      }
    } catch (error) {
      console.error('Error deleting feature:', error)
      throw error
    }
  }
}

// Export singleton instance
const featureService = new FeatureService()
export default featureService