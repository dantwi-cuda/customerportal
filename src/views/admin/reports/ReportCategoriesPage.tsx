import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    Input,
    Button,
    Tag,
    Dropdown,
    Menu,
    Dialog,
    Notification,
    toast,
    Pagination,
    Select,
    FormContainer,
    FormItem,
} from '@/components/ui'
import Table from '@/components/ui/Table'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineTrash,
    HiOutlineDotsVertical,
    HiOutlinePlus,
    HiOutlineEye,
    HiOutlineCheck,
} from 'react-icons/hi'
import * as ReportService from '@/services/ReportService'
import RoleService from '@/services/RoleService'
import UserService from '@/services/UserService'
import { useNavigate } from 'react-router-dom'
import type { ReportCategory } from '@/@types/report'
import type { RoleDto } from '@/@types/role'
import type { UserDto } from '@/@types/user'
import useAuth from '@/auth/useAuth'
import { ADMIN } from '@/constants/roles.constant'

// Simple Space component
const Space = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex items-center gap-2">{children}</div>
}

interface CategoryFormData {
    name: string
    systemName: string
    description: string
    isActive: boolean
    isDefault: boolean
}

const ReportCategoriesPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [categories, setCategories] = useState<ReportCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [categoryToDelete, setCategoryToDelete] =
        useState<ReportCategory | null>(null)
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [formType, setFormType] = useState<'create' | 'edit'>('create')
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        systemName: '',
        description: '',
        isActive: true,
        isDefault: false,
    })

    const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([])
    const [availableUsers, setAvailableUsers] = useState<UserDto[]>([])
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [assignmentModalVisible, setAssignmentModalVisible] = useState(false)
    const [categoryToAssign, setCategoryToAssign] =
        useState<ReportCategory | null>(null)
    const [assignmentType, setAssignmentType] = useState<'roles' | 'users'>(
        'roles',
    )

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10) // Default items per page

    // Check if current user has admin permission
    const hasAdminPermission = user?.authority?.includes(ADMIN)

    // Filtered categories based on search text
    const filteredCategories = categories.filter(
        (category) =>
            category.name.toLowerCase().includes(searchText.toLowerCase()) ||
            category.systemName
                .toLowerCase()
                .includes(searchText.toLowerCase()),
    )

    // Calculate pagination
    const totalCategories = filteredCategories.length
    const totalPages = Math.ceil(totalCategories / pageSize)

    // Get current page data
    const paginatedCategories = filteredCategories.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    )

    // Fetch categories and related data
    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchRoles()
        fetchUsers()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const data = await ReportService.getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to fetch report categories
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const fetchRoles = async () => {
        try {
            const data = await RoleService.getRoles()
            setAvailableRoles(data)
        } catch (error) {
            console.error('Error fetching roles:', error)
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await UserService.getUsers()
            setAvailableUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    // Form handlers
    const handleInputChange = (
        field: keyof CategoryFormData,
        value: string | boolean,
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSystemNameGeneration = () => {
        if (formData.name) {
            const systemName = formData.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
            setFormData((prev) => ({ ...prev, systemName }))
        }
    }

    // Search handler
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value)
        setCurrentPage(1) // Reset to first page on new search
    }

    // Pagination handlers
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber)
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setCurrentPage(1) // Reset to first page when changing page size
    }

    // CRUD operations
    const handleCreateCategory = () => {
        setFormType('create')
        setFormData({
            name: '',
            systemName: '',
            description: '',
            isActive: true,
            isDefault: false,
        })
        setEditModalVisible(true)
    }

    const handleEditCategory = (category: ReportCategory) => {
        setFormType('edit')
        setFormData({
            name: category.name,
            systemName: category.systemName,
            description: category.description || '',
            isActive: category.isActive,
            isDefault: category.isDefault,
        })
        setCategoryToDelete(category) // Reuse this state for edit operations
        setEditModalVisible(true)
    }

    const handleSubmitForm = async () => {
        try {
            if (formType === 'create') {
                await ReportService.createCategory(formData)
                toast.push(
                    <Notification title="Success" type="success">
                        Report category created successfully
                    </Notification>,
                )
            } else {
                if (!categoryToDelete?.id) return

                await ReportService.updateCategory(
                    categoryToDelete.id,
                    formData,
                )
                toast.push(
                    <Notification title="Success" type="success">
                        Report category updated successfully
                    </Notification>,
                )
            }
            setEditModalVisible(false)
            fetchCategories()
        } catch (error) {
            console.error('Error saving category:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to save report category
                </Notification>,
            )
        }
    }

    const confirmDeleteCategory = (category: ReportCategory) => {
        setCategoryToDelete(category)
        setDeleteModalVisible(true)
    }

    const handleDeleteCategory = async () => {
        if (!categoryToDelete?.id) return

        try {
            await ReportService.deleteCategory(categoryToDelete.id)
            toast.push(
                <Notification title="Success" type="success">
                    Report category deleted successfully
                </Notification>,
            )
            fetchCategories()
        } catch (error) {
            console.error('Error deleting category:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to delete report category
                </Notification>,
            )
        } finally {
            setDeleteModalVisible(false)
            setCategoryToDelete(null)
        }
    }

    const handleSetDefaultCategory = async (category: ReportCategory) => {
        try {
            await ReportService.setDefaultCategory(category.id)
            toast.push(
                <Notification title="Success" type="success">
                    Default category set successfully
                </Notification>,
            )
            fetchCategories()
        } catch (error) {
            console.error('Error setting default category:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to set default category
                </Notification>,
            )
        }
    }

    // Role/User assignment
    const handleAssignment = (
        category: ReportCategory,
        type: 'roles' | 'users',
    ) => {
        setCategoryToAssign(category)
        setAssignmentType(type)

        // Set selected roles/users based on what's already assigned to the category
        if (type === 'roles') {
            setSelectedRoles(category.assignedRoles || [])
        } else {
            setSelectedUsers(category.assignedUsers || [])
        }

        setAssignmentModalVisible(true)
    }

    const handleSubmitAssignment = async () => {
        if (!categoryToAssign?.id) return

        try {
            if (assignmentType === 'roles') {
                await ReportService.assignRolesToCategory(
                    categoryToAssign.id,
                    selectedRoles,
                )
            } else {
                await ReportService.assignUsersToCategory(
                    categoryToAssign.id,
                    selectedUsers,
                )
            }

            toast.push(
                <Notification title="Success" type="success">
                    Assignment updated successfully
                </Notification>,
            )
            fetchCategories()
        } catch (error) {
            console.error('Error updating assignment:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update assignment
                </Notification>,
            )
        } finally {
            setAssignmentModalVisible(false)
            setCategoryToAssign(null)
        }
    }

    // Table columns definition
    const columns = [
        {
            key: 'name',
            dataIndex: 'name',
            title: 'Name',
            render: (_: any, record: ReportCategory) => (
                <div className="font-semibold">{record.name}</div>
            ),
        },
        {
            key: 'systemName',
            dataIndex: 'systemName',
            title: 'System Name',
            render: (_: any, record: ReportCategory) => (
                <span className="text-gray-500">{record.systemName}</span>
            ),
        },
        {
            key: 'default',
            dataIndex: 'isDefault',
            title: 'Default',
            render: (_: any, record: ReportCategory) =>
                record.isDefault ? (
                    <Tag className="bg-green-500">Default</Tag>
                ) : (
                    <Button
                        size="xs"
                        variant="solid"
                        onClick={() => handleSetDefaultCategory(record)}
                    >
                        Set Default
                    </Button>
                ),
        },
        {
            key: 'status',
            dataIndex: 'isActive',
            title: 'Status',
            render: (_: any, record: ReportCategory) => (
                <Tag
                    className={
                        record.isActive ? 'bg-emerald-500' : 'bg-red-500'
                    }
                >
                    {record.isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            key: 'actions',
            dataIndex: 'id',
            title: 'Actions',
            render: (_: any, record: ReportCategory) => (
                <div className="flex justify-end">
                    <Dropdown
                        placement="bottom-end"
                        renderTitle={
                            <Button
                                variant="plain"
                                icon={<HiOutlineDotsVertical />}
                            />
                        }
                    >
                        <Menu
                            onSelect={(key) => {
                                if (key === 'edit') {
                                    handleEditCategory(record)
                                } else if (key === 'delete') {
                                    confirmDeleteCategory(record)
                                } else if (key === 'assign-roles') {
                                    handleAssignment(record, 'roles')
                                } else if (key === 'assign-users') {
                                    handleAssignment(record, 'users')
                                }
                            }}
                        >
                            <Menu.MenuItem eventKey="edit">
                                <Space>
                                    <HiOutlinePencilAlt />
                                    <span>Edit</span>
                                </Space>
                            </Menu.MenuItem>
                            <Menu.MenuItem eventKey="assign-roles">
                                <Space>
                                    <HiOutlineEye />
                                    <span>Assign Roles</span>
                                </Space>
                            </Menu.MenuItem>
                            <Menu.MenuItem eventKey="assign-users">
                                <Space>
                                    <HiOutlineEye />
                                    <span>Assign Users</span>
                                </Space>
                            </Menu.MenuItem>
                            {hasAdminPermission && (
                                <Menu.MenuItem eventKey="delete">
                                    <Space>
                                        <HiOutlineTrash />
                                        <span>Delete</span>
                                    </Space>
                                </Menu.MenuItem>
                            )}
                        </Menu>
                    </Dropdown>
                </div>
            ),
        },
    ]

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Report Categories</h3>
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={handleCreateCategory}
                    >
                        Add Category
                    </Button>
                </div>

                <Card className="mb-4">
                    <div className="mb-4">
                        <Input
                            placeholder="Search categories..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={handleSearch}
                            value={searchText}
                        />
                    </div>

                    {filteredCategories.length === 0 && !loading && (
                        <div className="p-4 text-center text-gray-500">
                            No report categories found.
                        </div>
                    )}

                    <Table
                        loading={loading}
                        columns={columns}
                        dataSource={paginatedCategories}
                        rowKey="id"
                    />

                    {totalCategories > 0 && (
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center">
                                <span className="mr-2">Items per page:</span>
                                <Select
                                    size="sm"
                                    options={[
                                        { value: '5', label: '5' },
                                        { value: '10', label: '10' },
                                        { value: '20', label: '20' },
                                        { value: '50', label: '50' },
                                    ]}
                                    value={{
                                        value: pageSize.toString(),
                                        label: pageSize.toString(),
                                    }}
                                    onChange={(option: any) =>
                                        handlePageSizeChange(
                                            Number(option.value),
                                        )
                                    }
                                    menuPlacement="top"
                                    className="min-w-[80px]"
                                />
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                total={totalCategories}
                                pageSize={pageSize}
                                onChange={handlePageChange}
                                displayTotal={true}
                            />
                        </div>
                    )}
                </Card>
            </div>

            {/* Create/Edit Category Modal */}
            <Dialog
                isOpen={editModalVisible}
                onClose={() => setEditModalVisible(false)}
            >
                <h5 className="mb-4">
                    {formType === 'create'
                        ? 'Create Category'
                        : 'Edit Category'}
                </h5>
                <FormContainer>
                    <FormItem label="Name">
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                handleInputChange('name', e.target.value)
                            }
                            onBlur={handleSystemNameGeneration}
                        />
                    </FormItem>
                    <FormItem label="System Name">
                        <Input
                            value={formData.systemName}
                            onChange={(e) =>
                                handleInputChange('systemName', e.target.value)
                            }
                            placeholder="Auto-generated from name"
                        />
                    </FormItem>
                    <FormItem label="Description">
                        <Input
                            value={formData.description}
                            onChange={(e) =>
                                handleInputChange('description', e.target.value)
                            }
                        />
                    </FormItem>
                    <FormItem>
                        <div className="flex items-center">
                            <input
                                id="isActive"
                                type="checkbox"
                                className="mr-2"
                                checked={formData.isActive}
                                onChange={(e) =>
                                    handleInputChange(
                                        'isActive',
                                        e.target.checked,
                                    )
                                }
                            />
                            <label htmlFor="isActive">Active</label>
                        </div>
                    </FormItem>
                    <FormItem>
                        <div className="flex items-center">
                            <input
                                id="isDefault"
                                type="checkbox"
                                className="mr-2"
                                checked={formData.isDefault}
                                onChange={(e) =>
                                    handleInputChange(
                                        'isDefault',
                                        e.target.checked,
                                    )
                                }
                            />
                            <label htmlFor="isDefault">
                                Set as Default Category
                            </label>
                        </div>
                    </FormItem>
                    <div className="text-right mt-6">
                        <Button
                            className="mr-2"
                            variant="plain"
                            onClick={() => setEditModalVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="solid" onClick={handleSubmitForm}>
                            {formType === 'create' ? 'Create' : 'Update'}
                        </Button>
                    </div>
                </FormContainer>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
            >
                <h5 className="mb-4">Delete Category</h5>
                <p>
                    Are you sure you want to delete the category{' '}
                    <strong>{categoryToDelete?.name}</strong>? This action
                    cannot be undone.
                </p>
                <div className="text-right mt-6">
                    <Button
                        className="mr-2"
                        variant="plain"
                        onClick={() => setDeleteModalVisible(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="solid"
                        color="red"
                        onClick={handleDeleteCategory}
                    >
                        Delete
                    </Button>
                </div>
            </Dialog>

            {/* Role/User Assignment Modal */}
            <Dialog
                isOpen={assignmentModalVisible}
                onClose={() => setAssignmentModalVisible(false)}
            >
                <h5 className="mb-4">
                    {assignmentType === 'roles'
                        ? 'Assign Roles'
                        : 'Assign Users'}{' '}
                    to {categoryToAssign?.name}
                </h5>
                <div className="mb-4">
                    <p>
                        {assignmentType === 'roles'
                            ? 'Select which roles have access to this report category:'
                            : 'Select which users have access to this report category:'}
                    </p>
                </div>
                <FormContainer>
                    <FormItem>
                        <Select
                            isMulti
                            placeholder={`Select ${assignmentType}`}
                            options={
                                assignmentType === 'roles'
                                    ? availableRoles.map((role) => ({
                                          value: role.id,
                                          label: role.name,
                                      }))
                                    : availableUsers.map((user) => ({
                                          value: user.id,
                                          label: user.name,
                                      }))
                            }
                            value={
                                assignmentType === 'roles'
                                    ? selectedRoles.map((id) => ({
                                          value: id,
                                          label:
                                              availableRoles.find(
                                                  (role) => role.id === id,
                                              )?.name || id,
                                      }))
                                    : selectedUsers.map((id) => ({
                                          value: id,
                                          label:
                                              availableUsers.find(
                                                  (user) => user.id === id,
                                              )?.name || id,
                                      }))
                            }
                            onChange={(selectedOptions: any) => {
                                const selectedIds = selectedOptions
                                    ? selectedOptions.map(
                                          (option: any) => option.value,
                                      )
                                    : []
                                assignmentType === 'roles'
                                    ? setSelectedRoles(selectedIds)
                                    : setSelectedUsers(selectedIds)
                            }}
                        />
                    </FormItem>
                    <div className="text-right mt-6">
                        <Button
                            className="mr-2"
                            variant="plain"
                            onClick={() => setAssignmentModalVisible(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            onClick={handleSubmitAssignment}
                        >
                            Save
                        </Button>
                    </div>
                </FormContainer>
            </Dialog>
        </div>
    )
}

export default ReportCategoriesPage
