import ApiService from './ApiService'
import type { 
  TenantFeatureResponse,
  BulkUpdateTenantFeaturesRequest,
  TenantFeatureResponseListApiResponse,
  TenantFeatureResponseApiResponse,
  ApiResponse,
  FeatureActivity,
  FeatureStats
} from '@/@types/featureManagement'
import { FEATURE_API_ENDPOINTS } from '@/constants/features.constant'

class TenantFeatureService {
  private static instance: TenantFeatureService
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()

  public static getInstance(): TenantFeatureService {
    if (!TenantFeatureService.instance) {
      TenantFeatureService.instance = new TenantFeatureService()
    }
    return TenantFeatureService.instance
  }

  /**
   * Get all tenant features with detailed status information
   */
  async getAllTenantFeatures(): Promise<TenantFeatureResponse[]> {
    const cacheKey = 'all_tenant_features'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await ApiService.fetchDataWithAxios<TenantFeatureResponseListApiResponse>({
        url: FEATURE_API_ENDPOINTS.TENANT_FEATURES,
        method: 'GET'
      })

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, 5 * 60 * 1000) // 5 minutes
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tenant features')
      }
    } catch (error) {
      console.error('Error fetching tenant features:', error)
      throw error
    }
  }

  /**
   * Get tenant features for a specific tenant (admin only)
   */
  async getTenantFeatures(tenantId: number): Promise<TenantFeatureResponse[]> {
    const cacheKey = `tenant_features_${tenantId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const url = FEATURE_API_ENDPOINTS.TENANT_FEATURES_BY_TENANT.replace('{tenantId}', tenantId.toString())
      const response = await ApiService.fetchDataWithAxios<TenantFeatureResponseListApiResponse>({
        url,
        method: 'GET'
      })

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data, 5 * 60 * 1000) // 5 minutes
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tenant features')
      }
    } catch (error) {
      console.error(`Error fetching features for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Enable a feature for a tenant
   */
  async enableFeatureForTenant(tenantId: number, featureId: string): Promise<TenantFeatureResponse> {
    try {
      const url = FEATURE_API_ENDPOINTS.TENANT_FEATURE_ENABLE
        .replace('{tenantId}', tenantId.toString())
        .replace('{featureId}', featureId)
      
      const response = await ApiService.fetchDataWithAxios<TenantFeatureResponseApiResponse>({
        url,
        method: 'POST'
      })

      if (response.success && response.data) {
        // Invalidate caches
        this.invalidateCache(`tenant_features_${tenantId}`)
        this.invalidateCache('all_tenant_features')
        this.invalidateCache('feature_stats')
        
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to enable feature for tenant')
      }
    } catch (error) {
      console.error(`Error enabling feature ${featureId} for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Disable a feature for a tenant
   */
  async disableFeatureForTenant(tenantId: number, featureId: string): Promise<void> {
    try {
      const url = FEATURE_API_ENDPOINTS.TENANT_FEATURE_DISABLE
        .replace('{tenantId}', tenantId.toString())
        .replace('{featureId}', featureId)
      
      const response = await ApiService.fetchDataWithAxios<ApiResponse<any>>({
        url,
        method: 'POST'
      })

      if (response.success) {
        // Invalidate caches
        this.invalidateCache(`tenant_features_${tenantId}`)
        this.invalidateCache('all_tenant_features')
        this.invalidateCache('feature_stats')
      } else {
        throw new Error(response.error?.message || 'Failed to disable feature for tenant')
      }
    } catch (error) {
      console.error(`Error disabling feature ${featureId} for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Bulk enable/disable features for a tenant
   */
  async bulkUpdateTenantFeatures(tenantId: number, updates: BulkUpdateTenantFeaturesRequest): Promise<void> {
    try {
      const url = FEATURE_API_ENDPOINTS.TENANT_FEATURES_BULK.replace('{tenantId}', tenantId.toString())
      
      const response = await ApiService.fetchDataWithAxios<ApiResponse<any>>({
        url,
        method: 'POST',
        data: updates as any
      })

      if (response.success) {
        // Invalidate caches
        this.invalidateCache(`tenant_features_${tenantId}`)
        this.invalidateCache('all_tenant_features')
        this.invalidateCache('feature_stats')
      } else {
        throw new Error(response.error?.message || 'Failed to bulk update tenant features')
      }
    } catch (error) {
      console.error(`Error bulk updating features for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Bulk update features across multiple tenants
   */
  async bulkUpdateMultipleTenants(
    tenantIds: number[], 
    updates: BulkUpdateTenantFeaturesRequest
  ): Promise<{ success: number[]; failed: Array<{ tenantId: number; error: string }> }> {
    const results = {
      success: [] as number[],
      failed: [] as Array<{ tenantId: number; error: string }>
    }

    // Process in batches of 5 to avoid overwhelming the server
    const batchSize = 5
    for (let i = 0; i < tenantIds.length; i += batchSize) {
      const batch = tenantIds.slice(i, i + batchSize)
      
      const promises = batch.map(async (tenantId) => {
        try {
          await this.bulkUpdateTenantFeatures(tenantId, updates)
          results.success.push(tenantId)
        } catch (error) {
          results.failed.push({
            tenantId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      await Promise.all(promises)
    }

    return results
  }

  /**
   * Get feature assignment statistics across all tenants
   */
  async getFeatureStats(): Promise<FeatureStats> {
    const cacheKey = 'feature_stats'
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // This would typically be a dedicated endpoint, but we'll calculate from available data
      const allTenantFeatures = await this.getAllTenantFeatures()
      
      const stats: FeatureStats = {
        totalFeatures: 0,
        totalTenants: 0,
        featuresEnabledCount: 0,
        activeFeatures: 0
      }

      // Group by feature to count unique features and enabled count
      const featureMap = new Map<string, { total: number; enabled: number }>()
      const tenantSet = new Set<number>()

      allTenantFeatures.forEach(tf => {
        // Assuming we can derive tenantId from the response or context
        // In real implementation, this might come from a different endpoint
        tenantSet.add(1) // Placeholder
        
        if (!featureMap.has(tf.featureId)) {
          featureMap.set(tf.featureId, { total: 0, enabled: 0 })
        }
        
        const feature = featureMap.get(tf.featureId)!
        feature.total++
        if (tf.isEnabled) {
          feature.enabled++
        }
      })

      stats.totalFeatures = featureMap.size
      stats.totalTenants = tenantSet.size
      stats.featuresEnabledCount = Array.from(featureMap.values())
        .reduce((sum, f) => sum + f.enabled, 0)
      stats.activeFeatures = Array.from(featureMap.values())
        .filter(f => f.enabled > 0).length

      this.setCache(cacheKey, stats, 5 * 60 * 1000) // 5 minutes
      return stats
    } catch (error) {
      console.error('Error calculating feature stats:', error)
      throw error
    }
  }

  /**
   * Get recent feature activities
   */
  async getRecentActivities(limit: number = 10): Promise<FeatureActivity[]> {
    const cacheKey = `recent_activities_${limit}`
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // This would typically be a dedicated audit endpoint
      // For now, return mock data structure
      const activities: FeatureActivity[] = []
      
      this.setCache(cacheKey, activities, 2 * 60 * 1000) // 2 minutes
      return activities
    } catch (error) {
      console.error('Error fetching recent activities:', error)
      throw error
    }
  }

  /**
   * Search tenant features
   */
  async searchTenantFeatures(params: {
    tenantId?: number
    featureKey?: string
    isEnabled?: boolean
    category?: string
    searchQuery?: string
  }): Promise<TenantFeatureResponse[]> {
    try {
      let features: TenantFeatureResponse[]

      if (params.tenantId) {
        features = await this.getTenantFeatures(params.tenantId)
      } else {
        features = await this.getAllTenantFeatures()
      }

      // Apply client-side filtering
      let filtered = features

      if (params.featureKey) {
        filtered = filtered.filter(f => f.featureKey === params.featureKey)
      }

      if (params.isEnabled !== undefined) {
        filtered = filtered.filter(f => f.isEnabled === params.isEnabled)
      }

      if (params.category) {
        filtered = filtered.filter(f => f.category === params.category)
      }

      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase()
        filtered = filtered.filter(f =>
          f.featureName.toLowerCase().includes(query) ||
          f.featureKey.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query)
        )
      }

      return filtered
    } catch (error) {
      console.error('Error searching tenant features:', error)
      throw error
    }
  }

  /**
   * Get features that are not assigned to a specific tenant
   */
  async getUnassignedFeatures(tenantId: number): Promise<string[]> {
    try {
      // This would typically involve comparing all available features with assigned features
      // Implementation depends on how the backend provides this data
      const tenantFeatures = await this.getTenantFeatures(tenantId)
      const assignedFeatureIds = tenantFeatures.map(tf => tf.featureId)
      
      // In a real implementation, you'd get all available features and subtract assigned ones
      return [] // Placeholder
    } catch (error) {
      console.error(`Error getting unassigned features for tenant ${tenantId}:`, error)
      throw error
    }
  }

  /**
   * Validate bulk operation
   */
  validateBulkOperation(updates: BulkUpdateTenantFeaturesRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!updates.featureUpdates || updates.featureUpdates.length === 0) {
      errors.push('No feature updates provided')
    }

    if (updates.featureUpdates && updates.featureUpdates.length > 50) {
      errors.push('Maximum 50 features can be updated in a single operation')
    }

    updates.featureUpdates?.forEach((update, index) => {
      if (!update.featureId) {
        errors.push(`Feature ID is required for update ${index + 1}`)
      }
      
      if (update.reason && update.reason.length > 500) {
        errors.push(`Reason for update ${index + 1} must not exceed 500 characters`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Cache management methods
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key)
  }

  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear all tenant-related caches
   */
  public clearTenantCache(tenantId?: number): void {
    if (tenantId) {
      this.invalidateCache(`tenant_features_${tenantId}`)
    } else {
      // Clear all tenant-specific caches
      const keys = Array.from(this.cache.keys())
      keys.forEach(key => {
        if (key.startsWith('tenant_features_')) {
          this.cache.delete(key)
        }
      })
    }
    
    this.invalidateCache('all_tenant_features')
    this.invalidateCache('feature_stats')
  }
}

export default TenantFeatureService