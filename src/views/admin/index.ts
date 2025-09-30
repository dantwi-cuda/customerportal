/**
 * Admin Portal Components Export
 * Centralized export for all admin feature management components
 */

// Main admin pages
export { default as TenantsListPage } from './TenantsListPage'
export { default as TenantFeatureManagement } from './TenantFeatureManagement'
export { default as FeatureAnalyticsDashboard } from './FeatureAnalyticsDashboard'

// Navigation and routing configuration for admin portal
export const adminRoutes = [
  {
    path: '/admin/tenants',
    component: 'TenantsListPage',
    title: 'Tenant Management',
    description: 'View and manage all tenants',
    requiredRoles: ['CS_ADMIN', 'CS_USER'],
  },
  {
    path: '/admin/tenants/:tenantId/features',
    component: 'TenantFeatureManagement',
    title: 'Feature Management',
    description: 'Manage features for a specific tenant',
    requiredRoles: ['CS_ADMIN'],
  },
  {
    path: '/admin/analytics',
    component: 'FeatureAnalyticsDashboard',
    title: 'Feature Analytics',
    description: 'View feature usage analytics and audit logs',
    requiredRoles: ['CS_ADMIN'],
  },
]

// Admin navigation menu items
export const adminNavigationItems = [
  {
    key: 'admin.tenants',
    path: '/admin/tenants',
    title: 'Tenant Management',
    icon: 'users',
    type: 'item',
    authority: ['CS_ADMIN', 'CS_USER'],
  },
  {
    key: 'admin.analytics',
    path: '/admin/analytics',
    title: 'Feature Analytics',
    icon: 'chart',
    type: 'item',
    authority: ['CS_ADMIN'],
  },
]