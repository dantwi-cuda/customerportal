import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    FormItem,
    FormContainer,
    Notification,
    toast,
    Textarea,
} from '@/components/ui'
import RoleService from '@/services/RoleService'
import { useNavigate } from 'react-router-dom'
import type { CreateRoleDto } from '@/@types/role'
import useAuth from '@/auth/useAuth'

const RoleCreateForm = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [roleName, setRoleName] = useState('')
    const [roleDescription, setRoleDescription] = useState('')

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault() // Prevent default form submission
        try {
            setLoading(true)

            if (!user?.tenantId) {
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Tenant information is missing. Cannot create role.
                    </Notification>,
                )
                setLoading(false)
                return
            }

            const numericTenantId = parseInt(user.tenantId, 10)
            if (isNaN(numericTenantId)) {
                toast.push(
                    <Notification title="Error" type="danger" duration={3000}>
                        Invalid Tenant ID format.
                    </Notification>,
                )
                setLoading(false)
                return
            }

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
                setLoading(false)
                return
            }

            const createRoleDto: CreateRoleDto = {
                name: roleName,
                description: roleDescription || null,
                permissions: [],
                tenantId: numericTenantId, // Use parsed tenantId
                type: 'TENANT',
            }

            const result = await RoleService.createRole(createRoleDto)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Role created successfully
                </Notification>,
            )
            navigate(`/tenantportal/tenant/roles/permissions/${result.id}`) // Corrected navigation path
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to create role
                </Notification>,
            )
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Create New Tenant Role</h3>
                </div>
                <Card>
                    <div className="max-w-md mx-auto">
                        {/* Use a standard form element */}
                        <form onSubmit={handleSubmit}>
                            <FormContainer>
                                <FormItem
                                    label="Role Name"
                                    // Removed name prop, validation handled in handleSubmit
                                    // rules prop is not standard for FormItem, validation handled manually
                                >
                                    <Input
                                        value={roleName}
                                        onChange={(e) =>
                                            setRoleName(e.target.value)
                                        }
                                        placeholder="Enter role name"
                                        required // HTML5 required attribute
                                    />
                                </FormItem>
                                <FormItem
                                    label="Description (Optional)"
                                    // Removed name prop
                                >
                                    <Textarea
                                        value={roleDescription}
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
                                            navigate(
                                                '/tenantportal/tenant/roles',
                                            )
                                        } // Corrected cancel navigation
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="solid"
                                        type="submit"
                                        loading={loading}
                                    >
                                        Create Role
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

export default RoleCreateForm
