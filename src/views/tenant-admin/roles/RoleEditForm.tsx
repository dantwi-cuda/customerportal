import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    // FormContainer, // Not strictly needed with direct form element
    FormItem,
    Notification,
    toast,
    Spinner,
    Textarea, // Added Textarea
} from '@/components/ui'
import RoleService from '@/services/RoleService'
import { useNavigate, useParams } from 'react-router-dom'
import type { RoleDto, UpdateRoleDto } from '@/@types/role'
import useAuth from '@/auth/useAuth' // Added useAuth

const RoleEditForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const { user } = useAuth() // Added useAuth hook
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [role, setRole] = useState<RoleDto | null>(null)
    const [roleName, setRoleName] = useState('') // Added state for role name
    const [roleDescription, setRoleDescription] = useState('') // Added state for role description
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchRole(id)
        }
    }, [id, user]) // Added user to dependency array for tenant check

    const fetchRole = async (roleId: string) => {
        try {
            setLoading(true)
            setError(null)
            const data = await RoleService.getRole(roleId)
            console.log('Fetched role data in component:', data)

            // Check if we got a valid response
            if (!data) {
                throw new Error('No data returned from the API')
            }

            // Tenant authorization check
            // Ensure user and user.tenantId are available, and data.tenantId is present
            if (
                user &&
                user.tenantId &&
                data.tenantId &&
                String(data.tenantId) !== user.tenantId &&
                // Also ensure it's not a system role being edited by a system admin if that's a future case
                // For now, tenant admins can only edit roles of their own tenant.
                data.type === 'TENANT'
            ) {
                toast.push(
                    <Notification
                        title="Access Denied"
                        type="danger"
                        duration={3000}
                    >
                        You do not have permission to edit this role.
                    </Notification>,
                )
                navigate('/tenantportal/tenant/roles') // Corrected path
                return
            }

            // Check if name is missing but we have the ID
            if (data.id && !data.name) {
                console.warn('Role name is missing in the API response:', data)
                data.name = `Role ${data.id.substring(0, 8)}...`
            }

            setRole(data)
            setRoleName(data.name || '') // Initialize roleName state
            setRoleDescription(data.description || '') // Initialize roleDescription state
        } catch (error) {
            setError('Failed to fetch role details')
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch role details
                </Notification>,
            )
            console.error('Error fetching role:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        // Changed to accept form event
        event.preventDefault() // Prevent default form submission
        if (!id || !role) return

        try {
            setSaving(true)

            if (!roleName.trim()) {
                toast.push(
                    <Notification
                        title="Validation Error"
                        type="warning"
                        duration={3000}
                    >
                        Role name is required.
                    </Notification>,
                )
                setSaving(false)
                return
            }

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

            const updateRoleDto: UpdateRoleDto = {
                name: roleName, // Use state for name
                description: roleDescription || null, // Use state for description
                permissions: role.permissions || [],
                tenantId: numericTenantId, // Include tenantId
                type: 'TENANT', // Specify role type
            }

            await RoleService.updateRole(id, updateRoleDto)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Role updated successfully
                </Notification>,
            )
            navigate('/tenantportal/tenant/roles') // Corrected path
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to update role
                </Notification>,
            )
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <Spinner size={40} />
            </div>
        )
    }

    if (error || !role) {
        return (
            <div className="container mx-auto">
                <div className="mb-4">
                    <h3>Edit Tenant Role</h3> {/* Updated title */}
                </div>
                <Card className="text-center p-5">
                    <div className="mb-4 text-red-500">
                        {error || 'Could not load role information'}
                    </div>
                    <Button
                        onClick={() => navigate('/tenantportal/tenant/roles')}
                    >
                        Back to Role List
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    {/* Ensure role is not null before accessing role.name */}
                    <h3>Edit Tenant Role: {role?.name}</h3>{' '}
                    {/* Updated title */}
                    <div className="flex gap-2">
                        <Button
                            onClick={
                                () =>
                                    navigate(
                                        `/tenantportal/tenant/roles/permissions/${id}`,
                                    ) // Corrected path
                            }
                        >
                            Manage Permissions
                        </Button>
                        <Button
                            onClick={() =>
                                navigate('/tenantportal/tenant/roles')
                            }
                        >
                            Back to List
                        </Button>
                    </div>
                </div>
                <Card>
                    <div className="max-w-md mx-auto">
                        <form onSubmit={handleSubmit}>
                            {/* <FormContainer> - Can be removed if not providing specific context/styling */}
                            <FormItem
                                label="Role Name"
                                // Removed htmlFor, asterisk, invalid props as validation is manual
                            >
                                <Input
                                    value={roleName} // Controlled component
                                    onChange={(e) =>
                                        setRoleName(e.target.value)
                                    }
                                    placeholder="Enter role name"
                                    required
                                />
                            </FormItem>
                            {/* Added Description Field */}
                            <FormItem label="Description (Optional)">
                                <Textarea
                                    value={roleDescription} // Controlled component
                                    onChange={(e) =>
                                        setRoleDescription(e.target.value)
                                    }
                                    placeholder="Enter role description"
                                />
                            </FormItem>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        navigate('/tenantportal/tenant/roles')
                                    } // Corrected path
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    type="submit"
                                    loading={saving}
                                >
                                    Save Changes
                                </Button>
                            </div>
                            {/* </FormContainer> */}
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default RoleEditForm
