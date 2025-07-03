import React, { useState, useEffect } from 'react'
import {
    Dialog,
    Button,
    Notification,
    toast,
    Select,
    FormItem,
    FormContainer,
} from '@/components/ui'
import { Loading } from '@/components/shared'
import * as ReportService from '@/services/ReportService'
import UserService from '@/services/UserService'
import RoleService from '@/services/RoleService'
import { ReportCategory } from '@/@types/report'
import { UserDto } from '@/@types/user'
import { RoleDto } from '@/@types/role'
import useAuth from '@/auth/useAuth'

interface AssignmentDialogProps {
    open: boolean
    type: 'users' | 'roles'
    category?: ReportCategory
    onClose: (shouldRefresh?: boolean) => void
    onSuccess: () => void
}

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({
    open,
    type,
    category,
    onClose,
    onSuccess,
}) => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [users, setUsers] = useState<UserDto[]>([])
    const [roles, setRoles] = useState<RoleDto[]>([])
    const [selectedItems, setSelectedItems] = useState<string[]>([])

    useEffect(() => {
        if (open && category) {
            loadData()
        }
    }, [open, category, type])

    const loadData = async () => {
        setLoading(true)
        try {
            if (type === 'users') {
                // Load all users for the tenant
                const allUsers = await UserService.getUsers({
                    isCustomerUser: true,
                })
                const tenantUsers = allUsers.filter(
                    (u) => u.tenantId === user?.tenantId,
                )
                setUsers(tenantUsers)

                // Set currently assigned users
                setSelectedItems(category?.assignedUserIds || [])
            } else {
                // Load all roles
                const allRoles = await RoleService.getRoles()
                setRoles(allRoles)

                // Set currently assigned roles
                setSelectedItems(category?.assignedRoles || [])
            }
        } catch (error) {
            console.error(`Failed to load ${type}:`, error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load {type}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!category) return

        setSaving(true)
        try {
            if (type === 'users') {
                await ReportService.assignUsersToCategory(
                    category.id,
                    selectedItems,
                )
                toast.push(
                    <Notification title="Success" type="success">
                        Users assigned successfully
                    </Notification>,
                )
            } else {
                await ReportService.assignRolesToCategory(
                    category.id,
                    selectedItems,
                )
                toast.push(
                    <Notification title="Success" type="success">
                        Roles assigned successfully
                    </Notification>,
                )
            }
            onClose(true) // Refresh the list
            onSuccess() // Also call the onSuccess callback
        } catch (error) {
            console.error(`Failed to assign ${type}:`, error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to assign {type}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        onClose(false)
    }

    const getOptions = () => {
        if (type === 'users') {
            return users.map((user) => ({
                value: user.id,
                label: `${user.name || user.email} (${user.email})`,
            }))
        } else {
            return roles.map((role) => ({
                value: role.name || role.id || '',
                label: `${role.name || role.id || ''} - ${role.description || 'No description'}`,
            }))
        }
    }

    const getCurrentAssignments = () => {
        if (type === 'users') {
            return selectedItems.map((userId) => {
                const user = users.find((u) => u.id === userId)
                return user
                    ? `${user.name || user.email} (${user.email})`
                    : userId
            })
        } else {
            return selectedItems.map((roleName) => {
                const role = roles.find((r) => (r.name || r.id) === roleName)
                return role
                    ? `${role.name || role.id || ''} - ${role.description || 'No description'}`
                    : roleName
            })
        }
    }

    return (
        <Dialog
            isOpen={open}
            onClose={handleClose}
            onRequestClose={handleClose}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={!saving}
            width={700}
        >
            <div className="p-6">
                <h5 className="mb-4">
                    Assign {type === 'users' ? 'Users' : 'Roles'} to Category:{' '}
                    {category?.name}
                </h5>

                {loading ? (
                    <div className="py-8">
                        <Loading loading={true} />
                    </div>
                ) : (
                    <FormContainer>
                        <FormItem
                            label={`Select ${type === 'users' ? 'Users' : 'Roles'}`}
                        >
                            <Select
                                isMulti
                                placeholder={`Choose ${type}...`}
                                options={getOptions()}
                                value={getOptions().filter((option) =>
                                    selectedItems.includes(option.value),
                                )}
                                onChange={(selectedOptions) => {
                                    const values = selectedOptions
                                        ? selectedOptions.map(
                                              (option: any) => option.value,
                                          )
                                        : []
                                    setSelectedItems(values)
                                }}
                                isSearchable
                                closeMenuOnSelect={false}
                                hideSelectedOptions={false}
                                controlShouldRenderValue={true}
                                maxMenuHeight={200}
                            />
                        </FormItem>

                        {selectedItems.length > 0 && (
                            <FormItem label="Current Assignments">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Selected {type} ({selectedItems.length}
                                        ):
                                    </div>
                                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                                        {getCurrentAssignments().map(
                                            (assignment, index) => (
                                                <li
                                                    key={index}
                                                    className="text-sm"
                                                >
                                                    • {assignment}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            </FormItem>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <Button
                                type="button"
                                variant="plain"
                                onClick={handleClose}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="solid"
                                loading={saving}
                                onClick={handleSave}
                                disabled={loading}
                            >
                                Save Assignments
                            </Button>
                        </div>
                    </FormContainer>
                )}
            </div>
        </Dialog>
    )
}

export default AssignmentDialog
