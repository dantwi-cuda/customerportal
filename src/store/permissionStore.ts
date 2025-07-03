import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import PermissionService from '@/services/PermissionService'
import type { Permission } from '@/@types/permission'

type Role = {
    id: string
    name: string
    permissions: string[]
    isDefaultRole: boolean
}

type PermissionState = {
    permissions: Permission[]
    roles: Role[]
    userRoles: string[]
    loadingPermissions: boolean
    
    // Actions
    setPermissions: (permissions: Permission[]) => void
    setRoles: (roles: Role[]) => void
    setUserRoles: (roles: string[]) => void
    fetchPermissions: () => Promise<void>
    
    // Selectors
    hasPermission: (permissionId: string) => boolean
    hasRole: (roleId: string) => boolean
    getPermissionsForRole: (roleId: string) => Permission[]
    getPermissionsByCategory: () => Record<string, Permission[]>
}

export const usePermissionStore = create<PermissionState>()(
    persist(
        (set, get) => ({
            permissions: [],
            roles: [],
            userRoles: [],
            loadingPermissions: false,
            
            setPermissions: (permissions) => set({ permissions }),
            setRoles: (roles) => set({ roles }),
            setUserRoles: (roles) => set({ userRoles: roles }),
            
            fetchPermissions: async () => {
                try {
                    set({ loadingPermissions: true })
                    const permissions = await PermissionService.getPermissions()
                    set({ permissions, loadingPermissions: false })
                } catch (error) {
                    console.error('Failed to fetch permissions:', error)
                    set({ loadingPermissions: false })
                }
            },
            
            hasPermission: (permissionId) => {
                const { permissions, roles, userRoles } = get()
                
                // Check if user has roles with this permission
                const userHasRoleWithPermission = roles
                    .filter(role => userRoles.includes(role.id))
                    .some(role => role.permissions.includes(permissionId))
                    
                return userHasRoleWithPermission
            },
            
            hasRole: (roleId) => {
                return get().userRoles.includes(roleId)
            },
            
            getPermissionsForRole: (roleId) => {
                const { permissions, roles } = get()
                const role = roles.find(r => r.id === roleId)
                
                if (!role) return []
                
                return permissions.filter(permission => 
                    role.permissions.includes(permission.id)
                )
            },
            
            getPermissionsByCategory: () => {
                const { permissions } = get()
                
                return permissions.reduce((grouped, permission) => {
                    const category = permission.category || 'Other'
                    
                    if (!grouped[category]) {
                        grouped[category] = []
                    }
                    
                    grouped[category].push(permission)
                    return grouped
                }, {} as Record<string, Permission[]>)
            }
        }),
        { name: 'permissions' }
    )
)