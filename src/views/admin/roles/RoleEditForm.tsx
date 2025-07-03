import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    FormContainer,
    FormItem,
    Notification,
    toast,
    Spinner,
} from '@/components/ui'
import RoleService from '@/services/RoleService'
import { useNavigate, useParams } from 'react-router-dom'
import type { RoleDto, UpdateRoleDto } from '@/@types/role'

const RoleEditForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [role, setRole] = useState<RoleDto | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchRole(id)
        }
    }, [id])

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

            // Check if name is missing but we have the ID
            if (data.id && !data.name) {
                console.warn('Role name is missing in the API response:', data)
                // Try to set a placeholder name based on ID
                data.name = `Role ${data.id.substring(0, 8)}...`
            }

            setRole(data)
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

    const handleSubmit = async (values: { name: string }) => {
        if (!id || !role) return

        try {
            setSaving(true)

            const updateRoleDto: UpdateRoleDto = {
                name: values.name,
                permissions: role.permissions || [],
            }

            await RoleService.updateRole(id, updateRoleDto)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Role updated successfully
                </Notification>,
            )
            navigate('/admin/roles')
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
                    <h3>Edit Role</h3>
                </div>
                <Card className="text-center p-5">
                    <div className="mb-4 text-red-500">
                        {error || 'Could not load role information'}
                    </div>
                    <Button onClick={() => navigate('/admin/roles')}>
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
                    <h3>Edit Role: {role.name}</h3>
                    <div className="flex gap-2">
                        <Button
                            onClick={() =>
                                navigate(`/admin/roles/permissions/${id}`)
                            }
                        >
                            Manage Permissions
                        </Button>
                        <Button onClick={() => navigate('/admin/roles')}>
                            Back to List
                        </Button>
                    </div>
                </div>
                <Card>
                    <div className="max-w-md mx-auto">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                const nameInput = e.currentTarget.querySelector(
                                    'input[name="roleName"]',
                                ) as HTMLInputElement
                                if (nameInput) {
                                    handleSubmit({ name: nameInput.value })
                                }
                            }}
                        >
                            <FormContainer>
                                <FormItem
                                    label="Role Name"
                                    htmlFor="roleName"
                                    asterisk
                                    invalid={false}
                                >
                                    <Input
                                        name="roleName"
                                        defaultValue={role.name || ''}
                                        placeholder="Enter role name"
                                        required
                                    />
                                </FormItem>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button
                                        type="button"
                                        onClick={() => navigate('/admin/roles')}
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
                            </FormContainer>
                        </form>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default RoleEditForm
