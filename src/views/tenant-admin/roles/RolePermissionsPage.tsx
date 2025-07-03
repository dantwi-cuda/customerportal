import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    Button,
    Checkbox,
    Notification,
    toast,
    Spinner,
    Alert,
    FormItem, // Added FormItem back
} from '@/components/ui'
import RoleService from '@/services/RoleService'
import PermissionService from '@/services/PermissionService' // Added PermissionService
import { useNavigate, useParams } from 'react-router-dom'
import type { RoleDto, UpdateRoleDto } from '@/@types/role'
import type { Permission } from '@/@types/permission' // Added Permission type
import useAuth from '@/auth/useAuth' // Added useAuth

interface PermissionGroup {
    category: string
    permissions: Permission[] // Changed to store full Permission objects
}

const RolePermissionsPage = () => {
    const navigate = useNavigate()
    // Check for both parameter names to be compatible with either path format
    const params = useParams()
    const id = params.roleId || params.id

    // Debug logging for URL parameter and routing
    console.log('RolePermissionsPage: Params object:', params)
    console.log('RolePermissionsPage: Resolved role ID:', id)

    const { user } = useAuth() // Added useAuth hook

    console.log('RolePermissionsPage: authUser:', JSON.stringify(user, null, 2))

    const [loading, setLoading] = useState(false)
    const [permissionsLoading, setPermissionsLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [permissionsError, setPermissionsError] = useState<string | null>(
        null,
    )
    const [role, setRole] = useState<RoleDto | null>(null)
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]) // Changed to Permission[]
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
        [],
    )
    // const [debugMode, setDebugMode] = useState(false) // Removed debugMode, can be re-added if needed

    const fetchRole = useCallback(
        async (roleId: string) => {
            if (!user) {
                setError('User not authenticated.')
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                setError(null)
                console.log(
                    'RolePermissionsPage: Fetching role with ID:',
                    roleId,
                )
                const data = await RoleService.getRole(roleId)
                console.log('Role data received:', data)

                if (!data) {
                    console.error(
                        'Role data is empty or undefined for ID:',
                        roleId,
                    )
                    throw new Error('Role data is empty')
                }

                // Debug actual string representation of both IDs for comparison
                const authTenantIdStr = String(user?.tenantId || '')
                const roleTenantIdStr = String(data?.tenantId || '')
                console.log(
                    'DEBUG TENANT IDS - Auth:',
                    authTenantIdStr,
                    'Role:',
                    roleTenantIdStr,
                    'Equal?:',
                    authTenantIdStr === roleTenantIdStr,
                )
                console.log(
                    'Types - Auth tenantId type:',
                    typeof user?.tenantId,
                    'Role tenantId type:',
                    typeof data.tenantId,
                )

                // Define system role names
                const SYSTEM_TENANT_ADMIN_NAME = 'Tenant-Admin'
                const SYSTEM_TENANT_USER_NAME = 'Tenant-User'

                const isSystemRoleByName =
                    data.name === SYSTEM_TENANT_ADMIN_NAME ||
                    data.name === SYSTEM_TENANT_USER_NAME
                let canManageThisRolePermissions = false

                if (user?.tenantId) {
                    // User must be a tenant-scoped user

                    // Scenario 1: Managing permissions for a global system role
                    if (isSystemRoleByName && data.tenantId === null) {
                        canManageThisRolePermissions = true
                        console.log(
                            'Access granted: System role with null tenantId',
                        )
                    }
                    // Scenario 2: Managing permissions for a role specifically scoped to this user's tenant
                    else if (
                        data.tenantId &&
                        String(data.tenantId) === String(user.tenantId)
                    ) {
                        canManageThisRolePermissions = true
                        console.log(
                            'Access granted: tenantId match',
                            String(data.tenantId),
                            '===',
                            String(user.tenantId),
                        )
                    }
                    // Debug for the case where we're denying access
                    else if (data.tenantId) {
                        console.log(
                            "Access denied reason: tenantIds don't match -",
                            'data.tenantId type:',
                            typeof data.tenantId,
                            'user.tenantId type:',
                            typeof user.tenantId,
                            'data.tenantId:',
                            data.tenantId,
                            'user.tenantId:',
                            user.tenantId,
                        )
                    }
                }

                if (!canManageThisRolePermissions) {
                    toast.push(
                        <Notification
                            title="Access Denied"
                            type="danger"
                            duration={3000}
                        >
                            You do not have permission to manage permissions for
                            this role.
                        </Notification>,
                    )
                    navigate('/tenantportal/tenant/roles')
                    setLoading(false)
                    return
                }

                setRole(data)
                // Initialize selectedPermissions from role data
                if (data.permissions) {
                    const permissionsArray = Array.isArray(data.permissions)
                        ? data.permissions
                        : typeof data.permissions === 'string'
                          ? [data.permissions]
                          : []
                    setSelectedPermissions(permissionsArray)
                } else {
                    setSelectedPermissions([])
                }
            } catch (err) {
                console.error('Error fetching role:', err)
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to fetch role details.'
                setError(errorMessage)
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        {errorMessage}
                    </Notification>,
                )
            } finally {
                setLoading(false)
            }
        },
        [user, navigate],
    )

    const fetchAllPermissions = useCallback(async () => {
        try {
            setPermissionsLoading(true)
            setPermissionsError(null)
            const permissionsData = await PermissionService.getPermissions() // Use PermissionService
            console.log('All permissions data received:', permissionsData)

            if (!Array.isArray(permissionsData)) {
                console.warn(
                    'Permissions data is not an array:',
                    permissionsData,
                )
                setAllPermissions([])
                throw new Error('Received invalid format for permissions list.')
            }

            setAllPermissions(permissionsData)
        } catch (err) {
            console.error('Error fetching all permissions:', err)
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch available permissions.'
            setPermissionsError(errorMessage)
            toast.push(
                <Notification title="Error" type="danger" duration={5000}>
                    {errorMessage}
                </Notification>,
            )
            setAllPermissions([]) // Ensure allPermissions is an empty array on error
        } finally {
            setPermissionsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (id) {
            fetchRole(id)
            fetchAllPermissions()
        }
    }, [id, fetchRole, fetchAllPermissions]) // Helper function to group permissions by resource within categories
    const groupPermissionsByResourceAndCategory = (
        permissions: Permission[],
    ): PermissionGroup[] => {
        // First, group by category
        const categoryGroups: Record<string, Permission[]> = {}
        permissions.forEach((permission) => {
            const category = permission.category || 'General'
            if (!categoryGroups[category]) {
                categoryGroups[category] = []
            }
            categoryGroups[category].push(permission)
        })

        return Object.entries(categoryGroups)
            .map(([category, perms]) => ({
                category,
                permissions: perms.sort((a, b) => {
                    // Sort by resource first
                    const resourceA = getResourceFromPermission(a.name)
                    const resourceB = getResourceFromPermission(b.name)

                    if (resourceA !== resourceB) {
                        return resourceA.localeCompare(resourceB)
                    }

                    // Then sort by permission type: all, read, write
                    // "all" should come first, then "read", then "write"
                    const getPermType = (name: string): number => {
                        if (name.endsWith('.all')) return 1
                        if (name.endsWith('.read')) return 2
                        if (name.endsWith('.write')) return 3
                        return 4
                    }

                    const typeA = getPermType(a.name)
                    const typeB = getPermType(b.name)

                    return typeA - typeB
                }),
            }))
            .sort((a, b) => a.category.localeCompare(b.category))
    }

    // Group permissions by category when allPermissions are loaded
    useEffect(() => {
        if (allPermissions.length > 0) {
            console.log('Grouping permissions from:', allPermissions)
            const groupArray =
                groupPermissionsByResourceAndCategory(allPermissions)
            console.log('Grouped permissions:', groupArray)
            setPermissionGroups(groupArray)
        } else {
            setPermissionGroups([]) // Clear groups if no permissions
        }
    }, [allPermissions])

    // Helper function to check if a permission name is an "all" permission
    const isAllPermission = (permissionName: string): boolean => {
        return permissionName.endsWith('.all')
    }

    // Helper function to get the base resource name from a permission
    const getResourceFromPermission = (permissionName: string): string => {
        const parts = permissionName.split('.')
        if (parts.length >= 2) {
            return parts[0] // First part is usually the resource name
        }
        return ''
    }

    // Get related permissions for a given permission name
    const getRelatedPermissions = (permissionName: string): string[] => {
        const resourceName = getResourceFromPermission(permissionName)
        if (!resourceName) return []

        // If this is an "all" permission, find the related read/write permissions
        if (isAllPermission(permissionName)) {
            return allPermissions
                .filter(
                    (p) =>
                        p.name !== permissionName && // Not the "all" permission itself
                        p.name.startsWith(resourceName) && // Same resource
                        (p.name.endsWith('.read') || p.name.endsWith('.write')), // Only get .read and .write
                )
                .map((p) => p.name)
        }
        // If this is a read/write permission, find the corresponding "all" permission
        else if (
            permissionName.endsWith('.read') ||
            permissionName.endsWith('.write')
        ) {
            const allPermName = `${resourceName}.all`
            const allPerm = allPermissions.find((p) => p.name === allPermName)
            return allPerm ? [allPermName] : []
        }

        return []
    }

    // Enhanced handleTogglePermission to handle parent-child relationship
    const handleTogglePermission = (permissionName: string) => {
        setSelectedPermissions((prevSelected) => {
            let newSelected = [...prevSelected]
            const isCurrentlySelected = prevSelected.includes(permissionName)
            const resourceName = getResourceFromPermission(permissionName)

            // Specific handling for "system" resource permissions
            if (resourceName === 'system') {
                const systemAll = 'system.all'
                const systemLogs = 'system.logs'
                const systemSettings = 'system.settings'

                // Check if these permissions actually exist in allPermissions
                const systemAllExists = allPermissions.some(
                    (p) => p.name === systemAll,
                )
                const systemLogsExists = allPermissions.some(
                    (p) => p.name === systemLogs,
                )
                const systemSettingsExists = allPermissions.some(
                    (p) => p.name === systemSettings,
                )

                if (permissionName === systemAll) {
                    const relatedSystemPerms: string[] = [] // Explicitly typed as string[]
                    if (systemLogsExists) relatedSystemPerms.push(systemLogs)
                    if (systemSettingsExists)
                        relatedSystemPerms.push(systemSettings)

                    if (isCurrentlySelected) {
                        // Unchecking system.all
                        newSelected = newSelected.filter(
                            (p) =>
                                p !== systemAll &&
                                !relatedSystemPerms.includes(p),
                        )
                    } else {
                        // Checking system.all
                        if (systemAllExists) newSelected.push(systemAll)
                        relatedSystemPerms.forEach((p) => {
                            if (!newSelected.includes(p)) newSelected.push(p)
                        })
                    }
                } else if (
                    permissionName === systemLogs ||
                    permissionName === systemSettings
                ) {
                    if (isCurrentlySelected) {
                        // Unchecking system.logs or system.settings
                        newSelected = newSelected.filter(
                            (p) =>
                                p !== permissionName &&
                                (systemAllExists ? p !== systemAll : true),
                        )
                    } else {
                        // Checking system.logs or system.settings
                        newSelected.push(permissionName)
                        // Check if system.all should be selected
                        const logsSelected =
                            permissionName === systemLogs && systemLogsExists
                                ? true
                                : newSelected.includes(systemLogs)
                        const settingsSelected =
                            permissionName === systemSettings &&
                            systemSettingsExists
                                ? true
                                : newSelected.includes(systemSettings)

                        if (
                            logsSelected &&
                            settingsSelected &&
                            systemAllExists
                        ) {
                            if (!newSelected.includes(systemAll)) {
                                newSelected.push(systemAll)
                            }
                        }
                    }
                } else {
                    // Other system permissions (if any) - regular toggle
                    if (isCurrentlySelected) {
                        newSelected = newSelected.filter(
                            (p) => p !== permissionName,
                        )
                    } else {
                        newSelected.push(permissionName)
                    }
                }
            }
            // Generic handling for other resources (non-system)
            else if (isAllPermission(permissionName)) {
                // e.g., users.all
                const genericResourceAllPermName = `${resourceName}.all`
                const relatedGenericPermissions = allPermissions
                    .filter(
                        (p) =>
                            p.name.startsWith(resourceName + '.') &&
                            (p.name.endsWith('.read') ||
                                p.name.endsWith('.write')),
                    )
                    .map((p) => p.name)

                if (isCurrentlySelected) {
                    // Unchecking a generic .all permission
                    newSelected = newSelected.filter(
                        (p) =>
                            p !== genericResourceAllPermName &&
                            !relatedGenericPermissions.includes(p),
                    )
                } else {
                    // Checking a generic .all permission
                    newSelected.push(genericResourceAllPermName)
                    relatedGenericPermissions.forEach((p) => {
                        if (!newSelected.includes(p)) newSelected.push(p)
                    })
                }
            } else if (
                permissionName.endsWith('.read') ||
                permissionName.endsWith('.write')
            ) {
                // Generic .read or .write
                const genericAllPermName = `${resourceName}.all`
                const genericReadPermName = `${resourceName}.read`
                const genericWritePermName = `${resourceName}.write`
                const genericAllPermExists = allPermissions.some(
                    (p) => p.name === genericAllPermName,
                )
                const genericReadPermExists = allPermissions.some(
                    (p) => p.name === genericReadPermName,
                )
                const genericWritePermExists = allPermissions.some(
                    (p) => p.name === genericWritePermName,
                )

                if (isCurrentlySelected) {
                    // Unchecking .read or .write
                    newSelected = newSelected.filter(
                        (p) =>
                            p !== permissionName &&
                            (genericAllPermExists
                                ? p !== genericAllPermName
                                : true),
                    )
                } else {
                    // Checking .read or .write
                    newSelected.push(permissionName)
                    const hasRead =
                        permissionName === genericReadPermName &&
                        genericReadPermExists
                            ? true
                            : newSelected.includes(genericReadPermName)
                    const hasWrite =
                        permissionName === genericWritePermName &&
                        genericWritePermExists
                            ? true
                            : newSelected.includes(genericWritePermName)

                    if (hasRead && hasWrite && genericAllPermExists) {
                        if (!newSelected.includes(genericAllPermName)) {
                            newSelected.push(genericAllPermName)
                        }
                    }
                }
            } else {
                // Fallback for any other permission not covered above
                if (isCurrentlySelected) {
                    newSelected = newSelected.filter(
                        (p) => p !== permissionName,
                    )
                } else {
                    newSelected.push(permissionName)
                }
            }
            return [...new Set(newSelected)] // Ensure unique permissions
        })
    }

    const handleSavePermissions = async () => {
        if (!id || !role) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Role data is not available. Cannot save permissions.
                </Notification>,
            )
            return
        }

        // Tenant authorization check before saving
        if (
            user?.tenantId &&
            role.tenantId &&
            String(role.tenantId) !== user.tenantId
        ) {
            toast.push(
                <Notification
                    title="Access Denied"
                    type="danger"
                    duration={3000}
                >
                    You do not have permission to modify this role.
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            const numericTenantId = role.tenantId
                ? parseInt(String(role.tenantId), 10)
                : undefined

            if (
                role.tenantId &&
                (numericTenantId === undefined || isNaN(numericTenantId))
            ) {
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Invalid Tenant ID for the role.
                    </Notification>,
                )
                setSaving(false)
                return
            }

            const updateDto: UpdateRoleDto = {
                name: role.name, // Keep original name
                description: role.description, // Keep original description
                permissions: selectedPermissions, // Set new permissions
                tenantId: numericTenantId,
                type: role.type || 'TENANT', // Preserve original type or default to TENANT
            }

            await RoleService.updateRole(id, updateDto) // Use updateRole

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Permissions updated successfully
                </Notification>,
            )
            // Optionally, re-fetch role to confirm changes, or navigate
            // fetchRole(id); // Re-fetch to update local state if staying on page
            navigate('/tenantportal/tenant/roles') // Navigate back to roles list
        } catch (error) {
            console.error('Error saving permissions:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to save permissions
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    // This effect ensures role permissions are correctly reflected in selectedPermissions when role data changes
    useEffect(() => {
        if (role && role.permissions) {
            const permissionsArray = Array.isArray(role.permissions)
                ? role.permissions
                : typeof role.permissions === 'string'
                  ? [role.permissions]
                  : []
            // Filter to ensure only valid permissions (present in allPermissions) are selected
            const validSelectedPermissions = permissionsArray.filter((pName) =>
                allPermissions.some((ap) => ap.name === pName),
            )
            setSelectedPermissions(validSelectedPermissions)
        } else if (role) {
            // If role exists but has no permissions
            setSelectedPermissions([])
        }
    }, [role, allPermissions]) // Rerun when role or allPermissions changes

    if (loading && !role) {
        // Show main loader only if role is not yet loaded
        return (
            <div className="flex items-center justify-center h-80">
                <Spinner size={40} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4">
                <Alert type="danger" showIcon>
                    {error}
                </Alert>
                <Button
                    className="mt-4"
                    onClick={() => navigate('/tenantportal/tenant/roles')}
                >
                    Back to Roles List
                </Button>
            </div>
        )
    }

    if (!role) {
        // If no error but role is still null (e.g., after navigation due to auth error)
        return (
            <div className="p-4 text-center">
                <p>Role not found or access denied.</p>
                <Button
                    className="mt-4"
                    onClick={() => navigate('/tenantportal/tenant/roles')}
                >
                    Back to Roles List
                </Button>
            </div>
        )
    }
    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        Manage Permissions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        Role:{' '}
                        <span className="font-semibold">{role?.name}</span>{' '}
                        {role?.description && `- ${role.description}`}
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/tenantportal/tenant/roles')}
                    variant="plain"
                    className="border border-gray-300"
                >
                    Back to Roles List
                </Button>
            </div>
            {permissionsLoading && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                    <Spinner size={40} />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Loading permissions...
                    </p>
                </div>
            )}
            {permissionsError && !permissionsLoading && (
                <Alert type="warning" showIcon className="mb-4">
                    {permissionsError} Could not load all available permissions.
                    Some options might be missing.
                </Alert>
            )}
            {!permissionsLoading &&
                permissionGroups.length === 0 &&
                !permissionsError && (
                    <Card className="p-4 text-center">
                        <p>No permissions available to assign.</p>
                    </Card>
                )}
            {permissionGroups.map((group) => (
                <Card
                    key={group.category}
                    className="mb-6 rounded-lg overflow-hidden shadow-sm"
                >
                    <div className="p-4">
                        <h5 className="font-semibold text-lg mb-4 capitalize bg-gray-100 dark:bg-gray-700 -mx-4 -mt-4 p-4 border-b dark:border-gray-700">
                            {group.category} Permissions
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                            {(() => {
                                // Group permissions by resource within this category for better visualization
                                const resourceGroups: Record<
                                    string,
                                    Permission[]
                                > = {}

                                group.permissions.forEach((permission) => {
                                    const resource = getResourceFromPermission(
                                        permission.name,
                                    )
                                    if (!resourceGroups[resource]) {
                                        resourceGroups[resource] = []
                                    }
                                    resourceGroups[resource].push(permission)
                                })

                                return Object.entries(resourceGroups).map(
                                    ([resource, permissionsInResource]) => {
                                        // Old sort based on .all, .read, .write (lines 648-657) is removed.
                                        // New logic to order permissions:
                                        let allPermissionDetails:
                                            | Permission
                                            | undefined = undefined
                                        let specificActionPerms: Permission[] =
                                            []

                                        // The 'permissionsInResource' is sorted by 'groupPermissionsByResourceAndCategory'
                                        // where '.all' types generally come first.
                                        if (
                                            permissionsInResource.length > 0 &&
                                            permissionsInResource[0].name ===
                                                `${resource}.all`
                                        ) {
                                            allPermissionDetails =
                                                permissionsInResource[0]
                                            specificActionPerms =
                                                permissionsInResource.slice(1)
                                        } else {
                                            // Fallback: explicitly find '.all' and filter others.
                                            allPermissionDetails =
                                                permissionsInResource.find(
                                                    (p) =>
                                                        p.name ===
                                                        `${resource}.all`,
                                                )
                                            specificActionPerms =
                                                permissionsInResource.filter(
                                                    (p) =>
                                                        p.name !==
                                                        `${resource}.all`,
                                                )
                                        }

                                        specificActionPerms.sort((a, b) => {
                                            const actionA =
                                                a.name
                                                    .split('.')
                                                    .pop()
                                                    ?.toLowerCase() || ''
                                            const actionB =
                                                b.name
                                                    .split('.')
                                                    .pop()
                                                    ?.toLowerCase() || ''
                                            return actionA.localeCompare(
                                                actionB,
                                            )
                                        })

                                        const finalPermissionsToRender = [
                                            ...(allPermissionDetails
                                                ? [allPermissionDetails]
                                                : []),
                                            ...specificActionPerms,
                                        ].filter((p) => p) as Permission[] // filter(p => p) removes undefined

                                        // The old definitions of allPerm, readPerm, writePerm, otherPerms (lines 659-670) are removed.

                                        return (
                                            <div
                                                key={resource}
                                                className="" // Retain existing wrapper class for the resource block
                                            >
                                                <div className="font-medium text-lg text-blue-600 dark:text-blue-400 mb-4 capitalize border-b pb-2">
                                                    {resource}
                                                </div>
                                                <div className="flex flex-row items-center justify-between w-full gap-2">
                                                    {' '}
                                                    {/* Added gap-2 for spacing */}
                                                    {finalPermissionsToRender.map(
                                                        (permission) => {
                                                            const actionName =
                                                                permission.name
                                                                    .split('.')
                                                                    .pop()
                                                                    ?.toLowerCase() ||
                                                                ''
                                                            const displayLabel =
                                                                actionName
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                actionName.slice(
                                                                    1,
                                                                )

                                                            let bgColor =
                                                                'bg-gray-200 dark:bg-gray-600' // Default background
                                                            if (
                                                                actionName ===
                                                                'all'
                                                            ) {
                                                                bgColor =
                                                                    'bg-blue-100 dark:bg-blue-900'
                                                            } else if (
                                                                actionName ===
                                                                    'read' ||
                                                                (resource ===
                                                                    'system' &&
                                                                    actionName ===
                                                                        'logs')
                                                            ) {
                                                                bgColor =
                                                                    'bg-green-100 dark:bg-green-900'
                                                            } else if (
                                                                actionName ===
                                                                    'write' ||
                                                                (resource ===
                                                                    'system' &&
                                                                    actionName ===
                                                                        'settings')
                                                            ) {
                                                                bgColor =
                                                                    'bg-purple-100 dark:bg-purple-900'
                                                            }

                                                            return (
                                                                permission && (
                                                                    <label
                                                                        key={
                                                                            permission.id ||
                                                                            permission.name
                                                                        }
                                                                        className={`flex-1 flex items-center space-x-2 px-4 py-2 cursor-pointer justify-center ${bgColor} ${
                                                                            selectedPermissions.includes(
                                                                                permission.name,
                                                                            )
                                                                                ? 'font-bold'
                                                                                : ''
                                                                        } rounded-md`} // Added rounded-md
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedPermissions.includes(
                                                                                permission.name,
                                                                            )}
                                                                            onChange={() =>
                                                                                handleTogglePermission(
                                                                                    permission.name,
                                                                                )
                                                                            }
                                                                            className="form-checkbox h-5 w-5 text-blue-600 focus:ring-blue-500"
                                                                        />
                                                                        <span className="text-sm font-medium dark:text-gray-200">
                                                                            {
                                                                                displayLabel
                                                                            }
                                                                        </span>
                                                                    </label>
                                                                )
                                                            )
                                                        },
                                                    )}
                                                </div>
                                                {/* The old otherPerms.length > 0 block (around lines 743-776) is removed by this refactoring. */}
                                            </div>
                                        )
                                    },
                                )
                            })()}
                        </div>
                    </div>
                </Card>
            ))}
            {permissionGroups.length > 0 && (
                <div className="mt-8 mb-4 flex justify-end gap-2 sticky bottom-4 right-4">
                    <Button
                        variant="solid"
                        color="blue-600"
                        onClick={handleSavePermissions}
                        loading={saving}
                        disabled={saving || loading || permissionsLoading}
                        size="lg"
                        className="px-8 shadow-lg hover:shadow-xl transition-shadow duration-200"
                        icon={<span className="mr-2">💾</span>}
                    >
                        {saving ? 'Saving...' : 'Save Permissions'}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default RolePermissionsPage
