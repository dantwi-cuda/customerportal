import { lazy } from 'react'
import { END_USER, TENANT_ADMIN } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

/**
 * Main App Routes - For Tenant-Admin and End-User
 * These users have access to the tenant-specific functionality
 */
const appRoutes: Routes = [    // Dashboard
    {
        key: 'app.dashboard',
        path: '/app/dashboard',
        component: lazy(() => import('@/views/dashboard/Dashboard')),
        authority: [TENANT_ADMIN, END_USER],
    },
      // Tenant Dashboard (enhanced dashboard with detailed analytics)
    {
        key: 'tenantDashboard',
        path: '/app/tenant-dashboard',
        component: lazy(() => import('@/views/app/tenant-dashboard/TenantDashboardPage')),
        authority: [TENANT_ADMIN, END_USER],
    },
    
    // Reports section
    {
        key: 'app.reports',
        path: '/app/reports',
        component: lazy(() => import('@/views/reports/ReportsListPage')),
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'app.reports.view',
        path: '/app/reports/:id',
        component: lazy(() => import('@/views/reports/ReportViewer')),
        authority: [TENANT_ADMIN, END_USER],
    },
    
    // User management (Tenant-Admin only)
    {
        key: 'app.users',
        path: '/app/users',
        component: lazy(() => import('@/views/admin/users/TenantUsersPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'app.users.create',
        path: '/app/users/create',
        component: lazy(() => import('@/views/admin/users/TenantUserCreateForm')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'app.users.edit',
        path: '/app/users/edit/:id',
        component: lazy(() => import('@/views/admin/users/TenantUserEditForm')),
        authority: [TENANT_ADMIN],
    },      // Shop Properties (for users with shop properties permissions)
    {
        key: 'shopKPI.shopProperties',
        path: '/app/shop-properties',
        component: lazy(() => import('@/views/app/shop-properties/ShopPropertiesListPage')),
        authority: [TENANT_ADMIN, END_USER], // Will be filtered by permission check inside component
    },    // Shop KPIs (for users with shop KPI permissions)
    {
        key: 'shopKPI.shopKpi',
        path: '/app/shop-kpi',
        component: lazy(() => import('@/views/app/shop-kpi/ShopKPIListPage')),
        authority: [TENANT_ADMIN, END_USER], // Will be filtered by permission check inside component
    },
      // Accounting routes
    {
        key: 'accounting.chartOfAccounts',
        path: '/accounting/chart-of-accounts',
        component: lazy(() => import('@/views/dashboard/Dashboard')), // Placeholder - replace when component exists
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'accounting.uploadGL',
        path: '/accounting/upload-gl',
        component: lazy(() => import('@/views/dashboard/Dashboard')), // Placeholder - replace when component exists
        authority: [TENANT_ADMIN, END_USER],
    },
    
    // Subscriptions
    {
        key: 'subscriptions',
        path: '/subscriptions',
        component: lazy(() => import('@/views/dashboard/Dashboard')), // Placeholder - replace when component exists
        authority: [TENANT_ADMIN, END_USER],
    },
    
    // Reports (user-facing)
    {
        key: 'reports',
        path: '/reports',
        component: lazy(() => import('@/views/reports/ReportsListPage')),
        authority: [END_USER],
    },
    
    // Dashboard (main user dashboard)
    {
        key: 'dashboard',
        path: '/dashboard',
        component: lazy(() => import('@/views/dashboard/Dashboard')),
        authority: [TENANT_ADMIN, END_USER],
    },
    
    // Programs / Network Management
    {
        key: 'app.programs',
        path: '/app/programs',
        component: lazy(() => import('@/views/programs/ProgramsListPage')),
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'app.programs.add',
        path: '/app/programs/add',
        component: lazy(() => import('@/views/programs/ProgramForm')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'app.programs.edit',
        path: '/app/programs/edit/:programId',
        component: lazy(() => import('@/views/programs/ProgramForm')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'app.programs.assign-shops',
        path: '/app/programs/:programId/assign-shops',
        component: lazy(() => import('@/views/programs/AssignShopsToProgram')),
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'app.programs.assignments',
        path: '/app/programs/:programId/assignments',
        component: lazy(() => import('@/views/programs/ProgramAssignmentsPage')),
        authority: [TENANT_ADMIN, END_USER],
    },
    
    // Settings (Tenant-Admin only)
    {
        key: 'app.settings',
        path: '/app/settings',
        component: lazy(() => import('@/views/admin/settings/TenantSettings')),
        authority: [TENANT_ADMIN],
    },
]

export default appRoutes
