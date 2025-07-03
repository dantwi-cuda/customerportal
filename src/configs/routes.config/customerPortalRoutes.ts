import { lazy } from 'react'
import { CS_USER } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

/**
 * Customer Portal Routes - For CS-User (Admin)
 * These users can manage customers but not portal admin users
 */
const customerPortalRoutes: Routes = [    // Dashboard
    {
        key: 'admin.dashboard',
        path: '/admin/dashboard',
        component: lazy(() => import('@/views/admin/CustomerPortalDashboard')),
        authority: [CS_USER],
    },
    
    // Customer Management routes are now handled in the main routes.config.ts
    // to allow access for both CS_ADMIN and CS_USER and point to the consolidated components.
    // Removing them from here to avoid conflicts and incorrect authority checks.
    // {
    //     key: 'admin.customers',
    //     path: '/admin/customers',
    //     component: lazy(() => import('@/views/admin/customers/CustomerListPage')),
    //     authority: [CS_USER],
    // },
    // {
    //     key: 'admin.customers.create',
    //     path: '/admin/customers/create',
    //     component: lazy(() => import('@/views/admin/customers/CustomerCreateWizard')),
    //     authority: [CS_USER],
    // },
    // {
    //     key: 'admin.customers.edit',
    //     path: '/admin/customers/edit/:id',
    //     component: lazy(() => import('@/views/admin/customers/CustomerEditForm')),
    //     authority: [CS_USER],
    // },
]

export default customerPortalRoutes
