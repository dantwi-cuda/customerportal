import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Form,
    FormItem,
    FormContainer,
    Notification,
    toast,
} from '@/components/ui'
import RoleService from '@/services/RoleService'
import { useNavigate } from 'react-router-dom'
import type { CreateRoleDto } from '@/@types/role'

const RoleCreateForm = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (values: { name: string }) => {
        try {
            setLoading(true)

            const createRoleDto: CreateRoleDto = {
                name: values.name,
                permissions: [], // Initially create with no permissions
            }

            const result = await RoleService.createRole(createRoleDto)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Role created successfully
                </Notification>,
            )
            // Navigate to permissions management for the new role
            navigate(`/admin/roles/permissions/${result.id}`)
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
                    <h3>Create New Role</h3>
                </div>
                <Card>
                    <div className="max-w-md mx-auto">
                        <FormContainer onFormSubmit={handleSubmit}>
                            <FormItem
                                label="Role Name"
                                name="name"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please enter role name',
                                    },
                                ]}
                            >
                                <Input />
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
                                    loading={loading}
                                >
                                    Create Role
                                </Button>
                            </div>
                        </FormContainer>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default RoleCreateForm
