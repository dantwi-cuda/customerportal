import { lazy } from 'react'
import { ADMIN, USER, CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

const othersRoute: Routes = [
    {
        key: 'accessDenied',
        path: `/access-denied`,
        component: lazy(() => import('@/views/others/AccessDenied')),
        authority: [ADMIN, USER, CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    },
    {
        key: 'maintenance',
        path: `/maintenance`,
        component: lazy(() => import('@/views/others/MaintenancePage')),
        authority: [ADMIN, USER, CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
            layout: 'blank',
        },
    },
    {
        key: 'roleDebugger',
        path: `/debug/roles`,
        component: lazy(() => import('@/views/debug/RoleDebugger')),
        authority: [ADMIN, USER, CS_ADMIN, CS_USER, TENANT_ADMIN, END_USER],
        meta: {
            pageBackgroundType: 'plain',
            pageContainerType: 'contained',
        },
    }
]

export default othersRoute
