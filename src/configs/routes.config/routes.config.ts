import { lazy } from 'react'
import authRoute from './authRoute'
import othersRoute from './othersRoute'
// import adminRoutes from './adminRoutes' // Commented out as per plan
import tenantPortalRoutes from './tenantPortalRoutes'
import customerPortalRoutes from './customerPortalRoutes'
import appRoutes from './appRoutes'
import type { Routes } from '@/@types/routes'

// Assuming CS_ADMIN and CS_USER roles are defined in your constants
import { CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER } from '@/constants/roles.constant'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    // Home redirect
    {
        key: 'home',
        path: '/home',
        component: lazy(() => import('@/views/Home')),
        authority: [],
    },
    
    // Include all route groups
    ...tenantPortalRoutes,  // CS-Admin routes
    ...customerPortalRoutes, // CS-User routes
    {
        key: 'tenantportal.workspaces',
        path: '/tenantportal/workspaces',
        component: lazy(() => import('@/views/admin/workspaces/WorkspaceManagementPage')),
        authority: [CS_ADMIN, CS_USER],
    },
    {
        key: 'tenantportal.workspaces.create',
        path: '/tenantportal/workspaces/create',
        component: lazy(() => import('@/views/admin/workspaces/WorkspaceCreateForm')),
        authority: [CS_ADMIN, CS_USER],
    },
    {
        key: 'tenantportal.workspaces.edit',
        path: '/tenantportal/workspaces/edit/:workspaceId',
        component: lazy(() => import('@/views/admin/workspaces/WorkspaceEditForm')),
        authority: [CS_ADMIN, CS_USER],
    },
    {
        key: 'tenantportal.workspaces.assignments',
        path: '/tenantportal/workspaces/assignments',
        component: lazy(() => import('@/views/admin/workspaces/WorkspaceAssignments')),
        authority: [CS_ADMIN, CS_USER],
    },
    // Consolidated Customer Management Routes for CS_ADMIN and CS_USER
    {
        key: 'admin.customers.list',
        path: '/admin/customers',
        component: lazy(() => import('@/views/admin/customers/CustomerListPage')), 
        authority: [CS_ADMIN, CS_USER], 
        meta: {
            header: { title: 'Customer Management' }, // Reverted to object structure
        },
    },
    {
        key: 'admin.customers.create',
        path: '/admin/customers/create',
        component: lazy(() => import('@/views/admin/customers/CustomerCreateWizard')),
        authority: [CS_ADMIN, CS_USER],
        meta: {
            header: { title: 'Create Customer' }, // Reverted to object structure
        },
    },
    {
        key: 'admin.customers.edit',
        path: '/admin/customers/edit/:customerId',
        component: lazy(() => import('@/views/admin/customers/EditCustomerPage')),  
        authority: [CS_ADMIN, CS_USER],
        meta: {
            header: { title: 'Edit Customer' }, // Reverted to object structure
        },
    },
    // Shop Attributes Management Routes (Tenant Portal)
    {
        key: 'tenantportal.shopAttributes.attributes',
        path: '/admin/shop-attributes',
        component: lazy(() => import('@/views/admin/shop-attributes/ShopAttributeListPage')),
        authority: [CS_ADMIN, CS_USER],
        meta: {
            header: { title: 'Shop Attributes' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'tenantportal.shopAttributes.attributes.create',
        path: '/admin/shop-attributes/create',
        component: lazy(() => import('@/views/admin/shop-attributes/ShopAttributeFormPage')),
        authority: [CS_ADMIN, CS_USER],
        meta: {
            header: { title: 'Create Shop Attribute' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'tenantportal.shopAttributes.attributes.edit',
        path: '/admin/shop-attributes/edit/:id',
        component: lazy(() => import('@/views/admin/shop-attributes/ShopAttributeFormPage')),
        authority: [CS_ADMIN, CS_USER],
        meta: {
            header: { title: 'Edit Shop Attribute' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'tenantportal.shopAttributes.categories',
        path: '/admin/attribute-categories',
        component: lazy(() => import('@/views/admin/attribute-categories/AttributeCategoryListPage')),
        authority: [CS_ADMIN, CS_USER],
        meta: {
            header: { title: 'Attribute Categories' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'tenantportal.shopAttributes.units',
        path: '/admin/attribute-units',
        component: lazy(() => import('@/views/admin/attribute-units/AttributeUnitListPage')),
        authority: [CS_ADMIN, CS_USER],
        meta: {
            header: { title: 'Attribute Units' },
            pageContainerType: 'contained',
        },
    },
    // Parts Management Routes
    {
        key: 'partsManagement.manufacturers',
        path: '/parts-management/manufacturers',
        component: lazy(() => import('@/views/parts-management/manufacturers/ManufacturerManagementPage')),
        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, 'manufacturer.all', 'manufacturer.view'],
        meta: {
            header: { title: 'Manufacturer Management' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'partsManagement.brands',
        path: '/parts-management/brands',
        component: lazy(() => import('@/views/parts-management/brands/BrandManagementPage')),
        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, 'brand.all', 'brand.view'],
        meta: {
            header: { title: 'Brand Management' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'partsManagement.suppliers',
        path: '/parts-management/suppliers',
        component: lazy(() => import('@/views/parts-management/suppliers/SupplierManagementPage')),
        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, 'suppliers.all', 'suppliers.view'],
        meta: {
            header: { title: 'Supplier Management' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'partsManagement.partCategories',
        path: '/parts-management/part-categories',
        component: lazy(() => import('@/views/parts-management/part-categories/PartCategoryManagementPage')),
        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, 'partcategory.all', 'partcategory.view'],
        meta: {
            header: { title: 'Part Category Management' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'partsManagement.masterParts',
        path: '/parts-management/master-parts',
        component: lazy(() => import('@/views/parts-management/master-parts/MasterPartManagementPage')),
        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, 'masterparts.all', 'masterparts.view'],
        meta: {
            header: { title: 'Master Parts Management' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'partsManagement.supplierParts',
        path: '/parts-management/supplier-parts',
        component: lazy(() => import('@/views/parts-management/supplier-parts/SupplierPartManagementPage')),
        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, 'supplierparts.all', 'supplierparts.view'],
        meta: {
            header: { title: 'Supplier Parts Management' },
            pageContainerType: 'contained',
        },
    },
    {
        key: 'partsManagement.matchParts',
        path: '/parts-management/match-parts',
        component: lazy(() => import('@/views/parts-management/match-parts/MatchPartManagementPage')),
        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, 'matchparts.all', 'matchparts.view'],
        meta: {
            header: { title: 'Match Parts Management' },
            pageContainerType: 'contained',
        },
    },
    // ...adminRoutes, // Ensure this is removed or handled
    ...appRoutes,           // Tenant-Admin and End-User routes
    /** Example purpose only, please remove */
    {
        key: 'singleMenuItem',
        path: '/single-menu-view',
        component: lazy(() => import('@/views/demo/SingleMenuView')),
        authority: [],
    },
    {
        key: 'collapseMenu.item1',
        path: '/collapse-menu-item-view-1',
        component: lazy(() => import('@/views/demo/CollapseMenuItemView1')),
        authority: [],
    },
    {
        key: 'collapseMenu.item2',
        path: '/collapse-menu-item-view-2',
        component: lazy(() => import('@/views/demo/CollapseMenuItemView2')),
        authority: [],
    },
    {
        key: 'groupMenu.single',
        path: '/group-single-menu-item-view',
        component: lazy(() => import('@/views/demo/GroupSingleMenuItemView')),
        authority: [],
    },
    {
        key: 'groupMenu.collapse.item1',
        path: '/group-collapse-menu-item-view-1',
        component: lazy(
            () => import('@/views/demo/GroupCollapseMenuItemView1'),
        ),
        authority: [],
    },
    {
        key: 'groupMenu.collapse.item2',
        path: '/group-collapse-menu-item-view-2',
        component: lazy(
            () => import('@/views/demo/GroupCollapseMenuItemView2'),
        ),
        authority: [],
    },
    // adminRoutes is already included above, removing duplicate
    ...othersRoute,
]
