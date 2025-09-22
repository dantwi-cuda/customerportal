import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
    NAV_ITEM_TYPE_COLLAPSE,
} from '@/constants/navigation.constant'
import { 
    ADMIN, 
    USER, 
    CS_ADMIN, 
    CS_USER, 
    TENANT_ADMIN, 
    END_USER 
} from '@/constants/roles.constant'

import type { NavigationTree } from '@/@types/navigation'

const navigationConfig: NavigationTree[] = [
    // Home menu - Common for all users
    {
        key: 'home',
        path: '/app/tenant-dashboard',
        title: 'Home',
        translateKey: 'nav.home',
        icon: 'home',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [], // Accessible to all authenticated users
        subMenu: [],
    },
    
    // Tenant Portal Menu (CS-Admin)
    {
        key: 'tenantportal',
        path: '',
        title: 'Portal Administration',
        translateKey: 'nav.tenantportal',
        icon: 'setting',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [CS_ADMIN, CS_USER], // Reverted to constants only
        subMenu: [
            {
                key: 'tenantportal.dashboard',
                path: '/tenantportal/dashboard',
                title: 'Dashboard',
                translateKey: 'nav.tenantportal.dashboard',
                icon: 'dashboard',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [CS_ADMIN],
                subMenu: [],
            },
            {
                key: 'tenantportal.users',
                path: '/tenantportal/users',
                title: 'User Management',
                translateKey: 'nav.tenantportal.users',
                icon: 'users',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [CS_ADMIN],
                subMenu: [],
            },
            {
                key: 'tenantportal.customers',
                path: '/admin/customers',
                title: 'Customer Management',
                translateKey: 'nav.tenantportal.customers',
                icon: 'customer',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [CS_ADMIN, CS_USER], // Reverted to constants only
                subMenu: [],
            },
            {
                key: 'tenantportal.roles',
                path: '/tenantportal/roles',
                title: 'Role Management',
                translateKey: 'nav.tenantportal.roles',
                icon: 'role',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [CS_ADMIN],
                subMenu: [],
            },
            {
                key: 'tenantportal.workspaces',
                path: '/tenantportal/workspaces',
                title: 'Workspace Management',
                translateKey: 'nav.tenantportal.workspaces',
                icon: 'workspace', // Assuming a 'workspace' icon exists
                type: NAV_ITEM_TYPE_ITEM,
                authority: [CS_ADMIN, CS_USER], // Reverted to constants only
                subMenu: [],
            },
            {
                key: 'tenantportal.shopAttributes',
                path: '',
                title: 'Shop Attributes',
                translateKey: 'nav.tenantportal.shopAttributes',
                icon: 'attribute',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [CS_ADMIN, CS_USER],
                subMenu: [
                    {
                        key: 'tenantportal.shopAttributes.attributes',
                        path: '/admin/shop-attributes',
                        title: 'Attributes',
                        translateKey: 'nav.tenantportal.shopAttributes.attributes',
                        icon: 'list',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.shopAttributes.categories',
                        path: '/admin/attribute-categories',
                        title: 'Categories',
                        translateKey: 'nav.tenantportal.shopAttributes.categories',
                        icon: 'category',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.shopAttributes.units',
                        path: '/admin/attribute-units',
                        title: 'Units',
                        translateKey: 'nav.tenantportal.shopAttributes.units',
                        icon: 'unit',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER],
                        subMenu: [],
                    },
                ],
            },
            {
                key: 'tenantportal.partsManagement',
                path: '',
                title: 'Parts Management',
                translateKey: 'nav.tenantportal.partsManagement',
                icon: 'parts',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'manufacturer.all', 'manufacturer.view', 'brand.all', 'brand.view', 'suppliers.all', 'suppliers.view', 'partcategory.all', 'partcategory.view', 'masterparts.all', 'masterparts.view', 'supplierparts.all', 'supplierparts.view', 'matchparts.all', 'matchparts.view'],
                subMenu: [
                    {
                        key: 'tenantportal.partsManagement.manufacturers',
                        path: '/parts-management/manufacturers',
                        title: 'Manufacturers',
                        translateKey: 'nav.tenantportal.partsManagement.manufacturers',
                        icon: 'building',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'manufacturer.all', 'manufacturer.view'],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.partsManagement.brands',
                        path: '/parts-management/brands',
                        title: 'Brands',
                        translateKey: 'nav.tenantportal.partsManagement.brands',
                        icon: 'tag',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'brand.all', 'brand.view'],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.partsManagement.suppliers',
                        path: '/parts-management/suppliers',
                        title: 'Suppliers',
                        translateKey: 'nav.tenantportal.partsManagement.suppliers',
                        icon: 'truck',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'suppliers.all', 'suppliers.view'],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.partsManagement.partCategories',
                        path: '/parts-management/part-categories',
                        title: 'Part Categories',
                        translateKey: 'nav.tenantportal.partsManagement.partCategories',
                        icon: 'category',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'partcategory.all', 'partcategory.view'],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.partsManagement.masterParts',
                        path: '/parts-management/master-parts',
                        title: 'Master Parts',
                        translateKey: 'nav.tenantportal.partsManagement.masterParts',
                        icon: 'gear',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'masterparts.all', 'masterparts.view'],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.partsManagement.supplierParts',
                        path: '/parts-management/supplier-parts',
                        title: 'Supplier Parts',
                        translateKey: 'nav.tenantportal.partsManagement.supplierParts',
                        icon: 'package',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'supplierparts.all', 'supplierparts.view'],
                        subMenu: [],
                    },
                    {
                        key: 'tenantportal.partsManagement.matchParts',
                        path: '/parts-management/match-parts',
                        title: 'Match Parts',
                        translateKey: 'nav.tenantportal.partsManagement.matchParts',
                        icon: 'link',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER, 'matchparts.all', 'matchparts.view'],
                        subMenu: [],
                    },
                ],
            },
            {
                key: 'tenantportal.programs',
                path: '/tenantportal/programs',
                title: 'Programs / Network',
                translateKey: 'nav.tenantportal.programs',
                icon: 'network',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [CS_ADMIN, CS_USER],
                subMenu: [],
            },
        ],
    },
    
    // Customer Portal Admin Menu (Legacy CS-User/ADMIN, now for TENANT_ADMIN)
    // This section will be repurposed for TENANT_ADMIN
    {
        key: 'adminMenu',
        path: '',
        title: 'Admin Menu',
        translateKey: 'nav.adminMenu',
        icon: 'admin',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [TENANT_ADMIN], // Specifically for TENANT_ADMIN
        subMenu: [
            {
                key: 'adminMenu.users', // Fixed key to follow parent-child relationship
                path: '/tenantportal/tenant/users', // Changed path
                title: 'Users',
                translateKey: 'nav.adminMenu.users',
                icon: 'users',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
            {
                key: 'adminMenu.roles', // Fixed key to follow parent-child relationship
                path: '/tenantportal/tenant/roles', // New path for tenant roles
                title: 'Roles',
                translateKey: 'nav.adminMenu.roles',
                icon: 'role', // Using existing role icon
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
            {
                key: 'adminMenu.workspaces', // Fixed key to follow parent-child relationship
                path: '/tenantportal/tenant/workspaces',
                title: 'Workspaces',
                translateKey: 'nav.adminMenu.workspaces',
                icon: 'workspace',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
            {
                key: 'adminMenu.reportCategories',
                path: '/tenantportal/tenant/report-categories', // Changed path
                title: 'Report Categories',
                translateKey: 'nav.adminMenu.reportCategories',
                icon: 'category',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
            {
                key: 'adminMenu.reports',
                path: '/tenantportal/tenant/reports', // Updated path to our new reports management page
                title: 'Reports',
                translateKey: 'nav.adminMenu.reports',
                icon: 'reports',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
            {
                key: 'adminMenu.shops',
                path: '/admin/shops',
                title: 'Shops',
                translateKey: 'nav.adminMenu.shops',
                icon: 'shop',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
            {
                key: 'adminMenu.programs',
                path: '/app/programs',
                title: 'Programs / Network',
                translateKey: 'nav.adminMenu.programs',
                icon: 'network',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
        ],
    },

    // Standard Menu Items (for TENANT_ADMIN and TENANT_USER)
    // Re-using/adjusting existing 'shopKPI', 'accounting', 'subscriptions', 'reports'
    // Tenant Analytics Dashboard
    {
        key: 'tenantDashboard',
        path: '/app/tenant-dashboard',
        title: 'Dashboard',
        translateKey: 'nav.tenantDashboard',
        icon: 'chart',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [TENANT_ADMIN, END_USER],
        subMenu: [],
    },
    {
        key: 'shopKPI',
        path: '',
        title: 'Shop KPI',
        translateKey: 'nav.shopKPI',
        icon: 'chart',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [TENANT_ADMIN, END_USER, 'shop_properties.all', 'shop_properties.view', 'shop_properties.edit'],
        subMenu: [
            {
                key: 'shopKPI.shopProperties',
                path: '/app/shop-properties',
                title: 'Shop Properties',
                translateKey: 'nav.shopKPI.shopProperties',
                icon: 'property', // Add icon if available
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'shop_properties.all', 'shop_properties.view', 'shop_properties.edit'],
                subMenu: [],
            },
            {
                key: 'shopKPI.shopKpi',
                path: '/app/shop-kpi',
                title: 'KPI and Goals',
                translateKey: 'nav.shopKPI.shopKpi',
                icon: 'chart', // Add icon if available
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'shop_kpi.all', 'shop_kpi.view', 'shop_kpi.edit'],
                subMenu: [],
            }
        ],
    },
    {
        key: 'partsManagement',
        path: '',
        title: 'Parts Management',
        translateKey: 'nav.partsManagement',
        icon: 'parts', // Using a parts-specific icon
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [TENANT_ADMIN, END_USER, 'manufacturer.all', 'manufacturer.view', 'brand.all', 'brand.view', 'suppliers.all', 'suppliers.view', 'partcategory.all', 'partcategory.view', 'masterparts.all', 'masterparts.view', 'supplierparts.all', 'supplierparts.view', 'matchparts.all', 'matchparts.view'],
        subMenu: [
            {
                key: 'partsManagement.manufacturers',
                path: '/parts-management/manufacturers',
                title: 'Manufacturers',
                translateKey: 'nav.partsManagement.manufacturers',
                icon: 'building',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'manufacturer.all', 'manufacturer.view'],
                subMenu: [],
            },
            {
                key: 'partsManagement.brands',
                path: '/parts-management/brands',
                title: 'Brands',
                translateKey: 'nav.partsManagement.brands',
                icon: 'tag',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'brand.all', 'brand.view'],
                subMenu: [],
            },
            {
                key: 'partsManagement.suppliers',
                path: '/parts-management/suppliers',
                title: 'Suppliers',
                translateKey: 'nav.partsManagement.suppliers',
                icon: 'truck',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'suppliers.all', 'suppliers.view'],
                subMenu: [],
            },
            {
                key: 'partsManagement.partCategories',
                path: '/parts-management/part-categories',
                title: 'Part Categories',
                translateKey: 'nav.partsManagement.partCategories',
                icon: 'category',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'partcategory.all', 'partcategory.view'],
                subMenu: [],
            },
            {
                key: 'partsManagement.masterParts',
                path: '/parts-management/master-parts',
                title: 'Master Parts',
                translateKey: 'nav.partsManagement.masterParts',
                icon: 'gear',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'masterparts.all', 'masterparts.view'],
                subMenu: [],
            },
            {
                key: 'partsManagement.supplierParts',
                path: '/parts-management/supplier-parts',
                title: 'Supplier Parts',
                translateKey: 'nav.partsManagement.supplierParts',
                icon: 'package',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'supplierparts.all', 'supplierparts.view'],
                subMenu: [],
            },
            {
                key: 'partsManagement.matchParts',
                path: '/parts-management/match-parts',
                title: 'Match Parts',
                translateKey: 'nav.partsManagement.matchParts',
                icon: 'link',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER, 'matchparts.all', 'matchparts.view'],
                subMenu: [],
            },
        ],
    },
    {
        key: 'accounting',
        path: '',
        title: 'Accounting',
        translateKey: 'nav.accounting',
        icon: 'accounting',
        type: NAV_ITEM_TYPE_COLLAPSE,
        authority: [TENANT_ADMIN, END_USER],
        subMenu: [
            {
                key: 'accounting.masterChartOfAccount',
                path: '/tenantportal/accounting/master-chart-of-account',
                title: 'Master Chart of Account',
                translateKey: 'nav.accounting.masterChartOfAccount',
                icon: '', // Add icon if available
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN],
                subMenu: [],
            },
            {
                key: 'accounting.chartOfAccounts',
                path: '/accounting/chart-of-accounts',
                title: 'Chart of Accounts',
                translateKey: 'nav.accounting.chartOfAccounts',
                icon: '', // Add icon if available
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER],
                subMenu: [],
            },
            {
                key: 'accounting.shopChartOfAccount',
                path: '/accounting/shop-chart-of-account',
                title: 'Shop Chart of Account',
                translateKey: 'nav.accounting.shopChartOfAccount',
                icon: '', // Add icon if available
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER],
                subMenu: [],
            },
            {
                key: 'accounting.uploadGL',
                path: '/accounting/upload-gl',
                title: 'Upload GL',
                translateKey: 'nav.accounting.uploadGL',
                icon: '', // Add icon if available
                type: NAV_ITEM_TYPE_ITEM,
                authority: [TENANT_ADMIN, END_USER],
                subMenu: [],
            }
        ],
    },
    {
        key: 'subscriptions',
        path: '/subscriptions',
        title: 'Subscriptions',
        translateKey: 'nav.subscriptions',
        icon: 'subscription',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [TENANT_ADMIN, END_USER, 'subscription.view', 'subscription.all'],
        subMenu: [],
    },
    {
        key: 'reports',
        path: '/reports', // User-facing reports listing/gallery
        title: 'Reports',
        translateKey: 'nav.reports',
        icon: 'reports',
        type: NAV_ITEM_TYPE_ITEM,
        authority: [TENANT_ADMIN, END_USER, 'report.read', 'report.all'], // Added permissions for reports access
        subMenu: [],
    },

    // Removing the old 'app' menu section as its items are now covered above or under 'adminMenu'
    // {
    //     key: 'app',
    //     path: '',
    //     title: 'Application',
    //     translateKey: 'nav.app',
    //     icon: 'apps',
    //     type: NAV_ITEM_TYPE_COLLAPSE,
    //     authority: [TENANT_ADMIN, END_USER],
    //     subMenu: [
    //         // ... submenus like app.dashboard, app.reports, app.orders, app.users, app.settings
    //     ]
    // }

    // Deprecating/Removing old 'admin' (CS_USER, ADMIN) and 'standard' (ADMIN, USER) specific sections
    // as their functionalities are merged into the new role-based structure above.
    // Ensure all necessary routes from these are covered in the new TENANT_ADMIN or general user sections.

]

export default navigationConfig
