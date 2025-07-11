import { lazy } from 'react'
import { CS_ADMIN, TENANT_ADMIN } from '@/constants/roles.constant' 
import type { Routes } from '@/@types/routes'

/**
 * Tenant Portal Routes - For CS-Admin (Tenant/Portal Admin)
 * These users have full access to manage both customers and portal admin users
 */
const tenantPortalRoutes: Routes = [
    // Dashboard
    {
        key: 'tenantportal.dashboard',
        path: '/tenantportal/dashboard',
        component: lazy(() => import('@/views/admin/TenantPortalDashboard')),
        authority: [CS_ADMIN],
    },
    
    // User Management - CS-Admin only
    {
        key: 'tenantportal.users',
        path: '/tenantportal/users',
        component: lazy(() => import('@/views/admin/users/UsersListPage')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.users.create',
        path: '/tenantportal/users/create',
        component: lazy(() => import('@/views/admin/users/UserCreateForm')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.users.edit',
        path: '/tenantportal/users/edit/:id',
        component: lazy(() => import('@/views/admin/users/UserEditForm')),
        authority: [CS_ADMIN],
    },
    
    // Customer Management
    {
        key: 'tenantportal.customers',
        path: '/tenantportal/customers',
        component: lazy(() => import('@/views/admin/customers/CustomerListPage')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.customers.create',
        path: '/tenantportal/customers/create',
        component: lazy(() => import('@/views/admin/customers/CustomerCreateWizard')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.customers.edit',
        path: '/tenantportal/customers/edit/:id',
        component: lazy(() => import('@/views/admin/customers/EditCustomerPage')),
        authority: [CS_ADMIN],
    },
    
    // Role Management
    {
        key: 'tenantportal.roles',
        path: '/tenantportal/roles',
        component: lazy(() => import('@/views/admin/roles/RolesListPage')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.roles.create',
        path: '/tenantportal/roles/create',
        component: lazy(() => import('@/views/admin/roles/RoleCreateForm')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.roles.edit',
        path: '/tenantportal/roles/edit/:id',
        component: lazy(() => import('@/views/admin/roles/RoleEditForm')),
        authority: [CS_ADMIN],
    },    // Tenant Admin User Management (Admin Menu)
    {
        key: 'adminMenu.users',
        path: '/tenantportal/tenant/users',
        component: lazy(() => import('@/views/tenant-admin/users/UserManagementPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.users.create',
        path: '/tenantportal/tenant/users/create',
        component: lazy(() => import('@/views/tenant-admin/users/TenantUserCreateForm')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.users.edit',
        path: '/tenantportal/tenant/users/edit/:userId',
        component: lazy(() => import('@/views/tenant-admin/users/TenantUserEditForm')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.users.assign-shops',
        path: '/tenantportal/tenant/users/assign-shops/:userId',
        component: lazy(() => import('@/views/tenant-admin/users/AssignShopsPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.users.assign-reports',
        path: '/tenantportal/tenant/users/assign-reports/:userId',
        component: lazy(() => import('@/views/tenant-admin/users/AssignReportsPage')),
        authority: [TENANT_ADMIN],
    },

    // Tenant Admin Role Management (Admin Menu)
    {
        key: 'adminMenu.roles',
        path: '/tenantportal/tenant/roles',
        component: lazy(() => import('@/views/tenant-admin/roles/RolesListPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.roles.create',
        path: '/tenantportal/tenant/roles/create',
        component: lazy(() => import('@/views/tenant-admin/roles/RoleCreateForm')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.roles.edit',
        path: '/tenantportal/tenant/roles/edit/:id', // Changed :roleId to :id
        component: lazy(() => import('@/views/tenant-admin/roles/RoleEditForm')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.roles.permissions',
        path: '/tenantportal/tenant/roles/permissions/:roleId',
        component: lazy(() => import('@/views/tenant-admin/roles/RolePermissionsPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.roles.users',
        path: '/tenantportal/tenant/roles/users/:roleId',
        component: lazy(() => import('@/views/tenant-admin/roles/RoleUsersPage')),
        authority: [TENANT_ADMIN],
    },
    
    // Tenant Admin Workspace Management (Admin Menu)
    {
        key: 'adminMenu.workspaces',
        path: '/tenantportal/tenant/workspaces',
        component: lazy(() => import('@/views/tenant-admin/workspaces/WorkspacesListPage')),
        authority: [TENANT_ADMIN],
    },    {
        key: 'adminMenu.workspaces.details',
        path: '/tenantportal/tenant/workspaces/:workspaceId',
        component: lazy(() => import('@/views/tenant-admin/workspaces/WorkspaceDetailsPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.workspaces.edit',
        path: '/tenantportal/tenant/workspaces/:workspaceId/edit',
        component: lazy(() => import('@/views/tenant-admin/workspaces/WorkspaceEditPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.workspaces.assignments',
        path: '/tenantportal/tenant/workspaces/:workspaceId/assignments',
        component: lazy(() => import('@/views/tenant-admin/workspaces/WorkspaceAssignmentsPage')),        authority: [TENANT_ADMIN],
    },
    
    // Tenant Admin Report Categories Management (Admin Menu)
    {
        key: 'adminMenu.reportCategories',
        path: '/tenantportal/tenant/report-categories',
        component: lazy(() => import('@/views/tenant-admin/report-categories/ReportCategoriesListPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.reportCategories.new',
        path: '/tenantportal/tenant/report-categories/new',
        component: lazy(() => import('@/views/tenant-admin/report-categories/ReportCategoryEditPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.reportCategories.details',
        path: '/tenantportal/tenant/report-categories/:categoryId',
        component: lazy(() => import('@/views/tenant-admin/report-categories/ReportCategoryDetailsPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.reportCategories.edit',
        path: '/tenantportal/tenant/report-categories/:categoryId/edit',
        component: lazy(() => import('@/views/tenant-admin/report-categories/ReportCategoryEditPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.reportCategories.assignments',
        path: '/tenantportal/tenant/report-categories/:categoryId/assignments',
        component: lazy(() => import('@/views/tenant-admin/report-categories/ReportCategoryAssignmentsPage')),
        authority: [TENANT_ADMIN],
    },
    
    // Tenant Admin Reports Management (Admin Menu)
    {
        key: 'adminMenu.reports',
        path: '/tenantportal/tenant/reports',
        component: lazy(() => import('@/views/tenant-admin/reports/ReportsListPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'tenantportal.tenant.reports.bulk-assign',
        path: '/tenantportal/tenant/reports/bulk-assign',
        component: lazy(() => import('@/views/tenant-admin/reports/BulkCategoryAssignmentPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'tenantportal.tenant.reports.new',
        path: '/tenantportal/tenant/reports/new',
        component: lazy(() => import('@/views/tenant-admin/reports/ReportEditPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'tenantportal.tenant.reports.edit',
        path: '/tenantportal/tenant/reports/:id/edit',
        component: lazy(() => import('@/views/tenant-admin/reports/ReportEditPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'tenantportal.tenant.reports.assignments',
        path: '/tenantportal/tenant/reports/:id/assignments',
        component: lazy(() => import('@/views/tenant-admin/reports/ReportAssignmentsPage')),
        authority: [TENANT_ADMIN],
    },    {
        key: 'tenantportal.tenant.reports.view',
        path: '/tenantportal/tenant/reports/:id/view',
        component: lazy(() => import('@/views/tenant-admin/reports/ReportViewerPage')),
        authority: [TENANT_ADMIN],
    },    
    // Tenant Admin Shop Management (Admin Menu)
    {
        key: 'adminMenu.shops',
        path: '/admin/shops',
        component: lazy(() => import('@/views/tenant-admin/shops/ShopsListPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.shops.create',
        path: '/admin/shops/create',
        component: lazy(() => import('@/views/tenant-admin/shops/ShopEditPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.shops.edit',
        path: '/admin/shops/:id/edit',
        component: lazy(() => import('@/views/tenant-admin/shops/ShopEditPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.shops.view',
        path: '/admin/shops/:id/view',
        component: lazy(() => import('@/views/tenant-admin/shops/ShopViewPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.shops.users',
        path: '/admin/shops/:id/users',
        component: lazy(() => import('@/views/tenant-admin/shops/ShopUserAssignmentPage')),
        authority: [TENANT_ADMIN],
    },
    {
        key: 'adminMenu.shops.programs',
        path: '/admin/shops/:id/programs',
        component: lazy(() => import('@/views/tenant-admin/shops/ShopProgramAssignmentPage')),
        authority: [TENANT_ADMIN],
    },
    
    // Programs / Network Management
    {
        key: 'tenantportal.programs',
        path: '/tenantportal/programs',
        component: lazy(() => import('@/views/programs/ProgramsListPage')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.programs.add',
        path: '/tenantportal/programs/add',
        component: lazy(() => import('@/views/programs/ProgramForm')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.programs.edit',
        path: '/tenantportal/programs/edit/:programId',
        component: lazy(() => import('@/views/programs/ProgramForm')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.programs.assign-customers',
        path: '/tenantportal/programs/:programId/assign-customers',
        component: lazy(() => import('@/views/programs/AssignCustomersToProgram')),
        authority: [CS_ADMIN],
    },
    {
        key: 'tenantportal.programs.assignments',
        path: '/tenantportal/programs/:programId/assignments',
        component: lazy(() => import('@/views/programs/ProgramAssignmentsPage')),
        authority: [CS_ADMIN],
    },
]

export default tenantPortalRoutes
