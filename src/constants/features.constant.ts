/**
 * Feature System Constants
 * Based on backend migration script and current navigation structure
 */

import type { FeatureDefinition } from '@/@types/feature'

// Feature Keys - Must match backend migration script
export const FEATURE_KEYS = {
  // Free Features
  DASHBOARD_BASIC: 'dashboard_basic',
  SHOP_KPI_BASIC: 'shop_kpi_basic',
  SHOP_PROPERTIES_BASIC: 'shop_properties_basic',
  SUBSCRIPTIONS_BASIC: 'subscriptions_basic',
  REPORTS_BASIC: 'reports_basic',
  
  // Paid Features
  KPI_GOALS_ADVANCED: 'kpi_goals_advanced',
  PARTS_MANAGEMENT_FULL: 'parts_management_full',
  ACCOUNTING_ADVANCED: 'accounting_advanced',
} as const

// Feature Categories
export const FEATURE_CATEGORIES = {
  FREE: 'free',
  PAID: 'paid',
} as const

// Feature Definitions - Must match backend migration script
export const FEATURE_DEFINITIONS: Record<string, FeatureDefinition> = {
  [FEATURE_KEYS.DASHBOARD_BASIC]: {
    key: FEATURE_KEYS.DASHBOARD_BASIC,
    name: 'Dashboard',
    description: 'Basic dashboard with essential metrics and overview',
    category: FEATURE_CATEGORIES.FREE,
    menuPath: 'tenantDashboard',
    defaultEnabled: true,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
  },
  
  [FEATURE_KEYS.SHOP_KPI_BASIC]: {
    key: FEATURE_KEYS.SHOP_KPI_BASIC,
    name: 'Shop KPI',
    description: 'Basic shop KPI overview and monitoring',
    category: FEATURE_CATEGORIES.FREE,
    menuPath: 'shopKPI',
    defaultEnabled: true,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
  },
  
  [FEATURE_KEYS.SHOP_PROPERTIES_BASIC]: {
    key: FEATURE_KEYS.SHOP_PROPERTIES_BASIC,
    name: 'Shop Properties',
    description: 'View and manage basic shop properties and information',
    category: FEATURE_CATEGORIES.FREE,
    menuPath: 'shopKPI.shopProperties',
    defaultEnabled: true,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
    dependencies: [FEATURE_KEYS.SHOP_KPI_BASIC],
  },
  
  [FEATURE_KEYS.SUBSCRIPTIONS_BASIC]: {
    key: FEATURE_KEYS.SUBSCRIPTIONS_BASIC,
    name: 'Subscriptions',
    description: 'Access to basic subscription information and status',
    category: FEATURE_CATEGORIES.FREE,
    menuPath: 'subscriptions',
    defaultEnabled: true,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
  },
  
  [FEATURE_KEYS.REPORTS_BASIC]: {
    key: FEATURE_KEYS.REPORTS_BASIC,
    name: 'Reports',
    description: 'Basic reporting capabilities with standard templates',
    category: FEATURE_CATEGORIES.FREE,
    menuPath: 'reports',
    defaultEnabled: true,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
  },
  
  // Paid Features
  [FEATURE_KEYS.KPI_GOALS_ADVANCED]: {
    key: FEATURE_KEYS.KPI_GOALS_ADVANCED,
    name: 'KPI and Goals',
    description: 'Advanced KPI tracking with detailed analytics, goals, and performance insights',
    category: FEATURE_CATEGORIES.PAID,
    menuPath: 'shopKPI.shopKpi',
    defaultEnabled: false,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
    dependencies: [FEATURE_KEYS.SHOP_KPI_BASIC],
  },
  
  [FEATURE_KEYS.PARTS_MANAGEMENT_FULL]: {
    key: FEATURE_KEYS.PARTS_MANAGEMENT_FULL,
    name: 'Parts Management',
    description: 'Complete parts management with manufacturers, brands, suppliers, categories, master parts, supplier parts, and match parts',
    category: FEATURE_CATEGORIES.PAID,
    menuPath: 'partsManagement',
    defaultEnabled: false,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
  },
  
  [FEATURE_KEYS.ACCOUNTING_ADVANCED]: {
    key: FEATURE_KEYS.ACCOUNTING_ADVANCED,
    name: 'Accounting',
    description: 'Advanced accounting features including master chart of accounts, chart of accounts, shop chart of accounts, and GL upload',
    category: FEATURE_CATEGORIES.PAID,
    menuPath: 'accounting',
    defaultEnabled: false,
    requiredRoles: ['TENANT_ADMIN', 'END_USER'],
  },
}

// Menu Path to Feature Key Mapping
export const MENU_PATH_TO_FEATURE: Record<string, string> = {
  'tenantDashboard': FEATURE_KEYS.DASHBOARD_BASIC,
  'shopKPI': FEATURE_KEYS.SHOP_KPI_BASIC,
  'shopKPI.shopProperties': FEATURE_KEYS.SHOP_PROPERTIES_BASIC,
  'shopKPI.shopKpi': FEATURE_KEYS.KPI_GOALS_ADVANCED,
  'partsManagement': FEATURE_KEYS.PARTS_MANAGEMENT_FULL,
  'accounting': FEATURE_KEYS.ACCOUNTING_ADVANCED,
  'subscriptions': FEATURE_KEYS.SUBSCRIPTIONS_BASIC,
  'reports': FEATURE_KEYS.REPORTS_BASIC,
}

// Feature Key to Menu Path Mapping (reverse lookup)
export const FEATURE_TO_MENU_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(MENU_PATH_TO_FEATURE).map(([menuPath, featureKey]) => [featureKey, menuPath])
)

// Free Features (always enabled)
export const FREE_FEATURES = [
  FEATURE_KEYS.DASHBOARD_BASIC,
  FEATURE_KEYS.SHOP_KPI_BASIC,
  FEATURE_KEYS.SHOP_PROPERTIES_BASIC,
  FEATURE_KEYS.SUBSCRIPTIONS_BASIC,
  FEATURE_KEYS.REPORTS_BASIC,
] as const

// Paid Features (controlled by admin)
export const PAID_FEATURES = [
  FEATURE_KEYS.KPI_GOALS_ADVANCED,
  FEATURE_KEYS.PARTS_MANAGEMENT_FULL,
  FEATURE_KEYS.ACCOUNTING_ADVANCED,
] as const

// All Features
export const ALL_FEATURES = [...FREE_FEATURES, ...PAID_FEATURES] as const

// Feature Access Levels
export const FEATURE_ACCESS_LEVELS = {
  PUBLIC: 'public',        // No authentication required
  AUTHENTICATED: 'authenticated', // Any authenticated user
  ROLE_BASED: 'role_based',      // Based on user roles
  FEATURE_BASED: 'feature_based', // Based on enabled features
} as const

// Cache Configuration
export const FEATURE_CACHE_CONFIG = {
  USER_FEATURES_TTL: 5 * 60 * 1000,    // 5 minutes
  ADMIN_FEATURES_TTL: 10 * 60 * 1000,  // 10 minutes
  AUDIT_LOG_TTL: 2 * 60 * 1000,        // 2 minutes
  MAX_CACHE_SIZE: 100,                  // Maximum cache entries
} as const

// API Endpoints
export const FEATURE_API_ENDPOINTS = {
  // Features Management
  FEATURES: '/api/Features',
  FEATURE_BY_ID: '/api/Features/{featureId}',
  
  // Tenant Features
  TENANT_FEATURES: '/api/tenant-features',
  TENANT_FEATURES_ENABLED: '/api/tenant-features/enabled',
  TENANT_FEATURE_CHECK: '/api/tenant-features/{featureKey}/enabled',
  TENANT_FEATURES_BY_TENANT: '/api/tenant-features/tenant/{tenantId}',
  TENANT_FEATURE_ENABLE: '/api/tenant-features/tenant/{tenantId}/features/{featureId}/enable',
  TENANT_FEATURE_DISABLE: '/api/tenant-features/tenant/{tenantId}/features/{featureId}/disable',
  TENANT_FEATURES_BULK: '/api/tenant-features/tenant/{tenantId}/features/bulk',
  
  // Audit
  AUDIT_LOG: '/api/Audit',
  FEATURE_USAGE_REPORT: '/api/Reports/FeatureUsage',
  
  // Customer APIs (for tenant selection) - using existing working endpoints
  CUSTOMERS: '/api/CustomerManagement',
  CUSTOMER_BY_ID: '/api/CustomerManagement/{id}',
} as const

// Error Codes
export const FEATURE_ERROR_CODES = {
  FEATURE_NOT_FOUND: 'FEATURE_NOT_FOUND',
  FEATURE_ALREADY_ENABLED: 'FEATURE_ALREADY_ENABLED',
  FEATURE_ALREADY_DISABLED: 'FEATURE_ALREADY_DISABLED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  DEPENDENCY_NOT_MET: 'DEPENDENCY_NOT_MET',
  CACHE_ERROR: 'CACHE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

// Success Messages
export const FEATURE_SUCCESS_MESSAGES = {
  FEATURE_ENABLED: 'Feature has been successfully enabled',
  FEATURE_DISABLED: 'Feature has been successfully disabled',
  BULK_UPDATE_SUCCESS: 'Features have been successfully updated',
  CACHE_REFRESHED: 'Feature cache has been refreshed',
} as const

// Loading Messages
export const FEATURE_LOADING_MESSAGES = {
  LOADING_FEATURES: 'Loading features...',
  ENABLING_FEATURE: 'Enabling feature...',
  DISABLING_FEATURE: 'Disabling feature...',
  BULK_UPDATING: 'Updating features...',
  REFRESHING_CACHE: 'Refreshing feature cache...',
} as const

// Default Navigation Icons (mapping to existing icon system)
export const FEATURE_NAVIGATION_ICONS: Record<string, string> = {
  [FEATURE_KEYS.DASHBOARD_BASIC]: 'chart',
  [FEATURE_KEYS.SHOP_KPI_BASIC]: 'chart',
  [FEATURE_KEYS.SHOP_PROPERTIES_BASIC]: 'property',
  [FEATURE_KEYS.KPI_GOALS_ADVANCED]: 'chart',
  [FEATURE_KEYS.PARTS_MANAGEMENT_FULL]: 'parts',
  [FEATURE_KEYS.ACCOUNTING_ADVANCED]: 'accounting',
  [FEATURE_KEYS.SUBSCRIPTIONS_BASIC]: 'subscription',
  [FEATURE_KEYS.REPORTS_BASIC]: 'reports',
}

// Feature Migration Mapping (for backward compatibility)
export const LEGACY_MENU_TO_FEATURE_MAPPING: Record<string, string[]> = {
  'tenantDashboard': [FEATURE_KEYS.DASHBOARD_BASIC],
  'shopKPI': [FEATURE_KEYS.SHOP_KPI_BASIC],
  'shopKPI.shopProperties': [FEATURE_KEYS.SHOP_PROPERTIES_BASIC],
  'shopKPI.shopKpi': [FEATURE_KEYS.KPI_GOALS_ADVANCED],
  'partsManagement': [FEATURE_KEYS.PARTS_MANAGEMENT_FULL],
  'accounting': [FEATURE_KEYS.ACCOUNTING_ADVANCED],
  'subscriptions': [FEATURE_KEYS.SUBSCRIPTIONS_BASIC],
  'reports': [FEATURE_KEYS.REPORTS_BASIC],
}

// Hybrid Navigation: Feature-to-Menu Mapping
// Maps feature keys to static navigation menu keys for Option C implementation
export const FEATURE_TO_MENU_MAPPING: Record<string, string[]> = {
  // Dashboard feature controls dashboard menu
  [FEATURE_KEYS.DASHBOARD_BASIC]: ['tenantDashboard'],
  
  // Shop KPI Basic controls the main Shop KPI menu and all its sub-menus
  [FEATURE_KEYS.SHOP_KPI_BASIC]: ['shopKPI', 'shopKPI.shopProperties', 'shopKPI.shopKpi'],
  
  // Shop Properties can be controlled independently (if needed for granular access)
  [FEATURE_KEYS.SHOP_PROPERTIES_BASIC]: ['shopKPI.shopProperties'],
  
  // KPI Goals Advanced controls the advanced KPI sub-menu
  [FEATURE_KEYS.KPI_GOALS_ADVANCED]: ['shopKPI.shopKpi'],
  
  // Parts Management controls the entire parts management tree
  [FEATURE_KEYS.PARTS_MANAGEMENT_FULL]: [
    'partsManagement',
    'partsManagement.manufacturers',
    'partsManagement.brands', 
    'partsManagement.suppliers',
    'partsManagement.partCategories',
    'partsManagement.masterParts',
    'partsManagement.supplierParts',
    'partsManagement.matchParts'
  ],
  
  // Accounting controls the entire accounting tree
  [FEATURE_KEYS.ACCOUNTING_ADVANCED]: [
    'accounting',
    'accounting.masterChartOfAccount',
    'accounting.chartOfAccounts',
    'accounting.shopChartOfAccount',
    'accounting.uploadGL'
  ],
  
  // Basic features
  [FEATURE_KEYS.SUBSCRIPTIONS_BASIC]: ['subscriptions'],
  [FEATURE_KEYS.REPORTS_BASIC]: ['reports'],
}

// Menu-to-Feature reverse mapping for quick lookups
export const MENU_TO_FEATURE_MAPPING: Record<string, string[]> = Object.entries(FEATURE_TO_MENU_MAPPING)
  .reduce((acc, [featureKey, menuKeys]) => {
    menuKeys.forEach(menuKey => {
      if (!acc[menuKey]) acc[menuKey] = []
      acc[menuKey].push(featureKey)
    })
    return acc
  }, {} as Record<string, string[]>)

// Event Types
export const FEATURE_EVENTS = {
  FEATURE_ENABLED: 'feature:enabled',
  FEATURE_DISABLED: 'feature:disabled',
  FEATURES_BULK_UPDATED: 'features:bulk-updated',
  FEATURES_REFRESHED: 'features:refreshed',
  CACHE_INVALIDATED: 'cache:invalidated',
} as const

// Validation Rules
export const FEATURE_VALIDATION = {
  FEATURE_KEY_PATTERN: /^[a-z0-9_]+$/,
  FEATURE_KEY_MAX_LENGTH: 100,
  FEATURE_NAME_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 500,
  REASON_MAX_LENGTH: 500,
} as const

// Admin Portal Constants
export const ADMIN_PORTAL_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_BULK_OPERATIONS: 50,
  SEARCH_DEBOUNCE_MS: 300,
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  EXPORT_FORMATS: ['csv', 'json', 'xlsx'] as const,
} as const

export default {
  FEATURE_KEYS,
  FEATURE_CATEGORIES,
  FEATURE_DEFINITIONS,
  FREE_FEATURES,
  PAID_FEATURES,
  ALL_FEATURES,
  MENU_PATH_TO_FEATURE,
  FEATURE_TO_MENU_PATH,
  FEATURE_CACHE_CONFIG,
  FEATURE_API_ENDPOINTS,
  FEATURE_ERROR_CODES,
  FEATURE_SUCCESS_MESSAGES,
  FEATURE_LOADING_MESSAGES,
  FEATURE_NAVIGATION_ICONS,
  LEGACY_MENU_TO_FEATURE_MAPPING,
  FEATURE_TO_MENU_MAPPING,
  MENU_TO_FEATURE_MAPPING,
  FEATURE_EVENTS,
  FEATURE_VALIDATION,
  ADMIN_PORTAL_CONFIG,
}