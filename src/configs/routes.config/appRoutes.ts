import { lazy } from 'react'
import { END_USER, TENANT_ADMIN, CS_ADMIN, CS_USER } from '@/constants/roles.constant'
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
    
    // Main Reports page for tenant portal navigation
    {
        key: 'reports',
        path: '/reports',
        component: lazy(() => import('@/views/reports/ReportsMainPage')),
        authority: [TENANT_ADMIN, END_USER, 'report.read', 'report.all'],
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
        key: 'accounting',
        path: '/accounting',
        component: lazy(() => import('@/views/accounting/AccountingMainPage')),
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'accounting.chartOfAccounts',
        path: '/accounting/chart-of-accounts',
        component: lazy(() => import('@/views/dashboard/Dashboard')), // Placeholder - replace when component exists
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'accounting.shopChartOfAccount',
        path: '/accounting/shop-chart-of-account',
        component: lazy(() => import('@/views/accounting/ShopChartOfAccountPage')),
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'accounting.uploadGL',
        path: '/accounting/upload-gl',
        component: lazy(() => import('@/views/accounting/UploadGeneralLedgerPageComplete')),
        authority: [TENANT_ADMIN, END_USER],
    },
    
    // Subscriptions
    {
        key: 'app.subscriptions',
        path: '/subscriptions',
        component: lazy(() => import('@/views/subscriptions/SubscriptionManagementPage')),
        authority: [TENANT_ADMIN, END_USER, 'subscription.view', 'subscription.all'],
    },
    {
        key: 'app.subscriptions.create',
        path: '/subscriptions/create',
        component: lazy(() => import('@/views/subscriptions/SubscriptionWizardPage')),
        authority: [TENANT_ADMIN, 'subscription.create', 'subscription.all'],
    },
    {
        key: 'app.subscriptions.edit',
        path: '/subscriptions/edit/:id',
        component: lazy(() => import('@/views/subscriptions/SubscriptionWizardPage')),
        authority: [TENANT_ADMIN, 'subscription.edit', 'subscription.all'],
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
        key: 'app.programs.details',
        path: '/app/programs/:programId/details',
        component: lazy(() => import('@/views/programs/ProgramDetailsPage')),
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
    
    // Program Types Management
    {
        key: 'app.program-types',
        path: '/app/program-types',
        component: lazy(() => import('@/views/programs/ProgramTypesListPage')),
        authority: [CS_ADMIN, CS_USER],
    },
    {
        key: 'app.program-types.create',
        path: '/app/program-types/create',
        component: lazy(() => import('@/views/programs/CreateEditProgramTypePage')),
        authority: [CS_ADMIN, CS_USER],
    },
    {
        key: 'app.program-types.edit',
        path: '/app/program-types/edit/:id',
        component: lazy(() => import('@/views/programs/CreateEditProgramTypePage')),
        authority: [CS_ADMIN, CS_USER],
    },
    
    // Program Categories Management
    {
        key: 'app.program-categories',
        path: '/app/program-categories',
        component: lazy(() => import('@/views/programs/ProgramCategoriesListPage')),
        authority: [CS_ADMIN, CS_USER],
    },
    {
        key: 'app.program-categories.add',
        path: '/app/program-categories/add',
        component: lazy(() => import('@/views/programs/CreateEditProgramCategoryPage')),
        authority: [CS_ADMIN, CS_USER],
    },
    {
        key: 'app.program-categories.edit',
        path: '/app/program-categories/edit/:id',
        component: lazy(() => import('@/views/programs/CreateEditProgramCategoryPage')),
        authority: [CS_ADMIN, CS_USER],
    },
    
    // Profile management
    {
        key: 'app.profile',
        path: '/app/profile',
        component: lazy(() => import('@/views/profile/ProfilePage')),
        authority: [TENANT_ADMIN, END_USER],
    },
    {
        key: 'app.account-settings',
        path: '/app/account-settings',
        component: lazy(() => import('@/views/account-settings/AccountSettingsPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'app.activity-log',
        path: '/app/activity-log',
        component: lazy(() => import('@/views/activity-log/ActivityLogPage')),
        authority: [TENANT_ADMIN],
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
