import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Checkbox,
    Notification,
    toast,
    Spinner,
    Alert,
} from '@/components/ui'
import RoleService from '@/services/RoleService'
import { useNavigate, useParams } from 'react-router-dom'
import type { RoleDto } from '@/@types/role'

interface PermissionGroup {
    category: string
    permissions: string[]
}

const RolePermissionsPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(false)
    const [permissionsLoading, setPermissionsLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [permissionsError, setPermissionsError] = useState<string | null>(
        null,
    )
    const [role, setRole] = useState<RoleDto | null>(null)
    const [allPermissions, setAllPermissions] = useState<string[]>([])
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
        [],
    )
    const [debugMode, setDebugMode] = useState(false)
    useEffect(() => {
        if (id) {
            const loadData = async () => {
                try {
                    console.log('Starting data load sequence for role ID:', id)

                    // First get the role data so we know what the permissions should be
                    await fetchRole(id)

                    // Then get all available permissions
                    await fetchAllPermissions()

                    // Force permissions to refresh (redundant with our other useEffect but ensures consistency)
                    if (role?.permissions) {
                        console.log(
                            'Ensuring role permissions are selected after data load',
                        )
                        const rolePerms = Array.isArray(role.permissions)
                            ? role.permissions
                            : typeof role.permissions === 'string'
                              ? [role.permissions]
                              : []

                        if (rolePerms.length > 0) {
                            console.log(
                                'Setting permissions from loadData sequence:',
                                rolePerms,
                            )
                            setSelectedPermissions(rolePerms)
                        }
                    }

                    console.log('Data load sequence completed')
                } catch (error) {
                    console.error('Error in data load sequence:', error)
                }
            }
            loadData()
        }
    }, [id])

    // This effect ensures role permissions are selected when the role data loads
    useEffect(() => {
        if (role && role.permissions) {
            console.log(
                'Setting selected permissions from role:',
                role.permissions,
            )
            // Ensure permissions is always an array
            const permissionsArray = Array.isArray(role.permissions)
                ? role.permissions
                : typeof role.permissions === 'string'
                  ? [role.permissions]
                  : []

            console.log('Processed role permissions array:', permissionsArray)
            // Use a callback form to ensure we're not dependent on stale state
            setSelectedPermissions((prev) => {
                console.log('Previous selected permissions:', prev)
                console.log('New permissions being set:', permissionsArray)
                return [...permissionsArray]
            })
        }
    }, [role])
    // Sync permissions after both role and all permissions are loaded
    useEffect(() => {
        // Only run this effect when we have both role data and all permissions loaded
        if (role?.permissions && allPermissions.length > 0) {
            console.log('Syncing role permissions with all permissions')

            // Ensure role permissions is always an array
            const rolePermissionsArray = Array.isArray(role.permissions)
                ? role.permissions
                : typeof role.permissions === 'string'
                  ? [role.permissions]
                  : []

            // Filter role permissions to only include ones that exist in allPermissions
            const validRolePermissions = rolePermissionsArray.filter(
                (permission) => allPermissions.includes(permission),
            )

            console.log(
                `Found ${validRolePermissions.length} valid permissions for this role`,
            )

            // Always set the permissions, even if the array is empty (which means no permissions for this role)
            setSelectedPermissions(validRolePermissions)

            // Force-update the component state to trigger a re-render
            setTimeout(() => {
                console.log(
                    'Refreshing UI to ensure checkboxes reflect selected permissions',
                )
                setSelectedPermissions((prev) => [...prev])
            }, 100)
        }
    }, [role, allPermissions])

    // Group permissions by category when they are loaded
    useEffect(() => {
        if (allPermissions.length > 0) {
            console.log('Grouping permissions:', allPermissions)
            const groups: Record<string, string[]> = {}

            allPermissions.forEach((permission) => {
                // Permissions are expected to be in format: "category.action"
                const parts = permission.split('.')
                const category = parts.length > 1 ? parts[0] : 'General'

                if (!groups[category]) {
                    groups[category] = []
                }
                groups[category].push(permission)
            })

            const groupArray = Object.entries(groups).map(
                ([category, permissions]) => ({
                    category,
                    permissions,
                }),
            )

            // Sort groups alphabetically
            groupArray.sort((a, b) => a.category.localeCompare(b.category))

            console.log('Grouped permissions:', groupArray)
            setPermissionGroups(groupArray)
        }
    }, [allPermissions])

    const fetchRole = async (roleId: string) => {
        try {
            setLoading(true)
            setError(null)
            const data = await RoleService.getRole(roleId)
            console.log('Role data received:', data)

            if (!data) {
                throw new Error('Role data is empty')
            } // Only set the role data - permissions will be handled by the useEffect
            console.log('Setting role data:', data)
            setRole(data)
            // Note: We're not directly setting selectedPermissions here
            // The useEffect with [role] dependency will handle setting the permissions
        } catch (error) {
            console.error('Error fetching role:', error)
            setError(
                'Failed to fetch role details. Please try refreshing the page.',
            )
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch role details
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const fetchAllPermissions = async () => {
        try {
            setPermissionsLoading(true)
            setPermissionsError(null)

            try {
                const permissions = await RoleService.getPermissions()
                console.log('Raw permissions response:', permissions)

                // Handle different response formats
                let processedPermissions: string[] = []

                if (Array.isArray(permissions)) {
                    // Ideal case: API returns array of strings
                    processedPermissions = permissions
                } else if (permissions && typeof permissions === 'object') {
                    // Case: API returns object with permission values
                    if (
                        Object.values(permissions).some(
                            (val) => typeof val === 'string',
                        )
                    ) {
                        // Object contains string values we can extract
                        processedPermissions = Object.values(
                            permissions,
                        ).filter((val) => typeof val === 'string') as string[]
                    } else {
                        // Try to extract permission data from complex structure
                        const extractedPermissions =
                            extractPermissionsFromObject(permissions)
                        if (extractedPermissions.length > 0) {
                            processedPermissions = extractedPermissions
                        }
                    }
                }

                // If we have role with permissions, use that as a fallback
                if (
                    processedPermissions.length === 0 &&
                    role?.permissions &&
                    role.permissions.length > 0
                ) {
                    console.log(
                        'Using role permissions as fallback for all permissions',
                    )
                    processedPermissions = [...role.permissions]
                }

                // If we still have no permissions, use hardcoded defaults as last resort
                if (processedPermissions.length === 0) {
                    console.warn(
                        'Using hardcoded default permissions as fallback',
                    )
                    processedPermissions = [
                        'customers.view',
                        'customers.create',
                        'customers.edit',
                        'customers.delete',
                        'reports.view',
                        'reports.create',
                        'reports.edit',
                        'reports.delete',
                        'roles.view',
                        'roles.create',
                        'roles.edit',
                        'roles.delete',
                        'shops.view',
                        'shops.create',
                        'shops.edit',
                        'shops.delete',
                        'users.view',
                        'users.create',
                        'users.edit',
                        'users.delete',
                        'workspaces.view',
                        'workspaces.create',
                        'workspaces.edit',
                        'workspaces.delete',
                    ]
                }

                console.log('Processed permissions:', processedPermissions)
                setAllPermissions(processedPermissions)
            } catch (innerError) {
                console.error(
                    'Inner error in permission processing:',
                    innerError,
                )
                throw innerError
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
            setPermissionsError(
                'Failed to fetch available permissions. Using available role permissions instead.',
            )
            toast.push(
                <Notification title="Warning" type="warning" duration={5000}>
                    Could not fetch all available permissions. Some permissions
                    may not be displayed.
                </Notification>,
            )

            // Fallback: if we have role with permissions, use those
            if (role?.permissions && role.permissions.length > 0) {
                setAllPermissions([...role.permissions])
            }
        } finally {
            setPermissionsLoading(false)
        }
    }

    // Helper function to extract permission strings from complex objects
    const extractPermissionsFromObject = (obj: any): string[] => {
        const permissions: string[] = []

        const traverse = (current: any, prefix: string = '') => {
            if (!current) return

            if (typeof current === 'string' && current.includes('.')) {
                permissions.push(current)
            } else if (Array.isArray(current)) {
                current.forEach((item) => {
                    if (typeof item === 'string' && item.includes('.')) {
                        permissions.push(item)
                    } else {
                        traverse(item, prefix)
                    }
                })
            } else if (typeof current === 'object') {
                Object.entries(current).forEach(([key, value]) => {
                    // Skip certain properties that are likely not permissions
                    if (
                        [
                            'id',
                            'name',
                            'description',
                            'createdAt',
                            'updatedAt',
                        ].includes(key)
                    ) {
                        return
                    }

                    const newPrefix = prefix ? `${prefix}.${key}` : key
                    if (
                        typeof value === 'boolean' &&
                        value === true &&
                        prefix
                    ) {
                        permissions.push(newPrefix)
                    } else {
                        traverse(value, newPrefix)
                    }
                })
            }
        }

        traverse(obj)
        return permissions
    } // This function is kept for compatibility with the handleGroupChange function
    // Individual checkboxes now use direct state updates
    const handlePermissionChange = (permission: string, checked: boolean) => {
        console.log(
            `Changing permission ${permission} to ${checked ? 'selected' : 'unselected'}`,
        )

        if (checked) {
            setSelectedPermissions((prev) => {
                // Avoid duplicates
                if (prev.includes(permission)) {
                    return prev
                }
                const updated = [...prev, permission]
                console.log('Updated selected permissions:', updated)
                return updated
            })
        } else {
            setSelectedPermissions((prev) => {
                const updated = prev.filter((p) => p !== permission)
                console.log('Updated selected permissions:', updated)
                return updated
            })
        }
    }

    // This function is kept for backward compatibility but is no longer used directly
    // The checkbox components now use direct state updates instead

    const handleGroupChange = (category: string, checked: boolean) => {
        const group = permissionGroups.find((g) => g.category === category)
        if (!group) return

        if (checked) {
            // Add all permissions in this group if they're not already selected
            const newPermissions = [...selectedPermissions]
            group.permissions.forEach((permission) => {
                if (!newPermissions.includes(permission)) {
                    newPermissions.push(permission)
                }
            })
            setSelectedPermissions(newPermissions)
        } else {
            // Remove all permissions in this group
            setSelectedPermissions((prev) =>
                prev.filter((p) => !group.permissions.includes(p)),
            )
        }
    }

    const isGroupChecked = (category: string) => {
        const group = permissionGroups.find((g) => g.category === category)
        if (!group) return false

        // Group is checked if all its permissions are selected
        return group.permissions.every((p) => selectedPermissions.includes(p))
    }

    const isGroupIndeterminate = (category: string) => {
        const group = permissionGroups.find((g) => g.category === category)
        if (!group) return false

        // Group is indeterminate if some but not all permissions are selected
        const selectedInGroup = group.permissions.filter((p) =>
            selectedPermissions.includes(p),
        )
        return (
            selectedInGroup.length > 0 &&
            selectedInGroup.length < group.permissions.length
        )
    }

    const handleSavePermissions = async () => {
        if (!id) return

        try {
            setSaving(true)
            await RoleService.updateRolePermissions(id, selectedPermissions)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Permissions updated successfully
                </Notification>,
            )
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to update permissions
                </Notification>,
            )
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const handleSelectAll = () => {
        console.log('Selecting all permissions:', allPermissions)
        if (allPermissions.length > 0) {
            // Create a new array to ensure React detects the state change
            const newPermissions = [...allPermissions]
            console.log('Setting all permissions:', newPermissions.length)

            // Set the permissions with a new array reference
            setSelectedPermissions(newPermissions)
        }
    }

    const handleSelectNone = () => {
        console.log('Clearing all selected permissions')

        // Simply set to an empty array - this should be sufficient with our updated checkbox component
        setSelectedPermissions([])

        console.log('All permissions cleared')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <Spinner size={40} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto">
                <Alert type="danger" showIcon className="mb-4">
                    {error}
                </Alert>
                <Button onClick={() => navigate('/admin/roles')}>
                    Back to Roles
                </Button>
            </div>
        )
    }

    if (!role) {
        return (
            <div className="container mx-auto">
                <Alert type="warning" showIcon className="mb-4">
                    No role data found. Please try refreshing the page.
                </Alert>
                <Button onClick={() => navigate('/admin/roles')}>
                    Back to Roles
                </Button>
            </div>
        )
    }

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Manage Permissions: {role.name}</h3>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/admin/roles')}>
                            Back to Roles
                        </Button>
                    </div>
                </div>

                <Card className="mb-4">
                    <div className="p-2">
                        <Alert type="info" showIcon className="mb-4">
                            Select the permissions to grant to users with this
                            role. Permissions are grouped by category.
                        </Alert>

                        {permissionsError && (
                            <Alert type="danger" showIcon className="mb-4">
                                {permissionsError}
                            </Alert>
                        )}

                        {permissionsLoading ? (
                            <div className="flex justify-center p-6">
                                <Spinner />
                            </div>
                        ) : permissionGroups.length === 0 ? (
                            <Alert type="warning" showIcon className="mb-4">
                                No permissions found. Please make sure
                                permissions have been configured.
                            </Alert>
                        ) : (
                            <>
                                <div className="mb-4 flex justify-between">
                                    <div>
                                        <span className="font-semibold">
                                            Total Permissions Selected:
                                        </span>{' '}
                                        {selectedPermissions.length} of{' '}
                                        {allPermissions.length}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={handleSelectNone}
                                        >
                                            Select None
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSelectAll}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setDebugMode((prev) => !prev)
                                            }
                                            variant={
                                                debugMode ? 'solid' : 'default'
                                            }
                                        >
                                            Debug
                                        </Button>
                                    </div>
                                </div>

                                <div className="divide-y">
                                    {permissionGroups.map((group) => (
                                        <div
                                            key={group.category}
                                            className="py-4"
                                        >
                                            <div className="mb-2">
                                                {' '}
                                                <Checkbox
                                                    checked={isGroupChecked(
                                                        group.category,
                                                    )}
                                                    className={
                                                        isGroupIndeterminate(
                                                            group.category,
                                                        )
                                                            ? 'partial-checked'
                                                            : ''
                                                    }
                                                    checkboxClass={
                                                        isGroupIndeterminate(
                                                            group.category,
                                                        )
                                                            ? 'text-primary'
                                                            : ''
                                                    }
                                                    onChange={() => {
                                                        const isChecked =
                                                            isGroupChecked(
                                                                group.category,
                                                            )
                                                        console.log(
                                                            `Group ${group.category} toggled from:`,
                                                            isChecked
                                                                ? 'checked'
                                                                : 'unchecked',
                                                            'to:',
                                                            !isChecked
                                                                ? 'checked'
                                                                : 'unchecked',
                                                        )
                                                        handleGroupChange(
                                                            group.category,
                                                            !isChecked, // Toggle the current state
                                                        )
                                                    }}
                                                >
                                                    <span className="font-semibold">
                                                        {group.category}
                                                    </span>
                                                </Checkbox>
                                                {debugMode && (
                                                    <span className="text-xs ml-2 text-gray-500">
                                                        (
                                                        {
                                                            group.permissions
                                                                .length
                                                        }{' '}
                                                        permissions)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="ml-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {group.permissions.map(
                                                    (permission) => (
                                                        <Checkbox
                                                            key={permission}
                                                            checked={selectedPermissions.includes(
                                                                permission,
                                                            )}
                                                            onChange={() => {
                                                                const isCurrentlySelected =
                                                                    selectedPermissions.includes(
                                                                        permission,
                                                                    )
                                                                console.log(
                                                                    `${permission} checkbox toggled from:`,
                                                                    isCurrentlySelected
                                                                        ? 'selected'
                                                                        : 'unselected',
                                                                    'to:',
                                                                    !isCurrentlySelected
                                                                        ? 'selected'
                                                                        : 'unselected',
                                                                )
                                                                if (
                                                                    isCurrentlySelected
                                                                ) {
                                                                    // Remove permission if already selected
                                                                    setSelectedPermissions(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            prev.filter(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    p !==
                                                                                    permission,
                                                                            ),
                                                                    )
                                                                } else {
                                                                    // Add permission if not already selected
                                                                    setSelectedPermissions(
                                                                        (
                                                                            prev,
                                                                        ) => [
                                                                            ...prev,
                                                                            permission,
                                                                        ],
                                                                    )
                                                                }
                                                            }}
                                                        >
                                                            {debugMode
                                                                ? permission
                                                                : permission &&
                                                                    permission.includes(
                                                                        '.',
                                                                    )
                                                                  ? permission
                                                                        .split(
                                                                            '.',
                                                                        )
                                                                        .slice(
                                                                            1,
                                                                        )
                                                                        .join(
                                                                            '.',
                                                                        )
                                                                  : permission}
                                                        </Checkbox>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        onClick={handleSavePermissions}
                        loading={saving}
                        disabled={
                            permissionsLoading || Boolean(permissionsError)
                        }
                    >
                        Save Permissions
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default RolePermissionsPage
