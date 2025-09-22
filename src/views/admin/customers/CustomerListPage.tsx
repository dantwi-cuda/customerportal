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
    Avatar,
    Pagination,
    Select,
} from '@/components/ui'
import Table from '@/components/ui/Table'
import {
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineTrash,
    HiOutlineDotsVertical,
    HiOutlinePlus,
    HiOutlineLogin,
    HiOutlineUserAdd,
} from 'react-icons/hi'
import * as CustomerService from '@/services/CustomerService'
import { useNavigate } from 'react-router-dom'
import type { CustomerDetailsResponse } from '@/@types/customer'
import useAuth from '@/auth/useAuth'
import { ADMIN } from '@/constants/roles.constant'

// Simple Space component
const Space = ({ children }: { children: React.ReactNode }) => {
    return <div className="flex items-center gap-2">{children}</div>
}

const CustomersListPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [customers, setCustomers] = useState<CustomerDetailsResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [deleteModalVisible, setDeleteModalVisible] = useState(false)
    const [customerToDelete, setCustomerToDelete] =
        useState<CustomerDetailsResponse | null>(null)
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(5) // Default items per page

    // Check if current user has admin permission
    const hasAdminPermission = user?.authority?.includes(ADMIN)

    useEffect(() => {
        fetchCustomers()
    }, [])

    // Define filteredCustomers at the component level
    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            customer.subdomain
                ?.toLowerCase()
                .includes(searchText.toLowerCase()) ||
            customer.domainUrl
                ?.toLowerCase()
                .includes(searchText.toLowerCase()) ||
            customer.address?.toLowerCase().includes(searchText.toLowerCase()),
    )
    // Calculate pagination
    const totalCustomers = filteredCustomers.length
    const totalPages = Math.ceil(totalCustomers / pageSize)

    // Get current page data
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
    )

    // Debug logging
    useEffect(() => {
        console.log('Current customers state:', customers)
        console.log('Filtered customers:', filteredCustomers)
        console.log('Pagination info:', {
            currentPage,
            pageSize,
            totalItems: totalCustomers,
            totalPages,
            currentPageItems: paginatedCustomers.length,
        })
    }, [
        customers,
        filteredCustomers,
        currentPage,
        pageSize,
        totalCustomers,
        totalPages,
        paginatedCustomers,
    ])

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            const data = await CustomerService.getCustomers()
            console.log('Fetched customers:', data)
            setCustomers(data)
        } catch (error) {
            console.error('Error fetching customers:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to fetch customers
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value)
        setCurrentPage(1) // Reset to first page on new search
    }
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber)
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setCurrentPage(1) // Reset to first page when changing page size
    }

    const handleCreateCustomer = () => {
        navigate('/admin/customers/create')
    }

    const handleEditCustomer = (customer: CustomerDetailsResponse) => {
        navigate(`/tenantportal/customers/edit/${customer.id}`)
    }

    const confirmDeleteCustomer = (customer: CustomerDetailsResponse) => {
        setCustomerToDelete(customer)
        setDeleteModalVisible(true)
    }

    const handleDeleteCustomer = async () => {
        if (!customerToDelete?.id) return

        try {
            await CustomerService.deleteCustomer(customerToDelete.id)
            toast.push(
                <Notification title="Success" type="success">
                    Customer deleted successfully
                </Notification>,
            )
            fetchCustomers()
        } catch (error) {
            console.error('Error deleting customer:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to delete customer
                </Notification>,
            )
        } finally {
            setDeleteModalVisible(false)
            setCustomerToDelete(null)
        }
    }

    const handleAccessCustomerPortal = async (
        customer: CustomerDetailsResponse,
    ) => {
        if (!customer.id) return

        try {
            const { token, domain } =
                await CustomerService.getCustomerAccessToken(customer.id)
            toast.push(
                <Notification title="Success" type="success">
                    Accessing customer portal...
                </Notification>,
            )

            // In a real implementation, this would handle redirecting to the customer portal
            // with the appropriate token
            console.log(`Access token received for ${domain}:`, token)

            // Example redirection (would depend on actual implementation)
            // window.location.href = `https://${domain}?token=${token}`
        } catch (error) {
            console.error('Error accessing customer portal:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to access customer portal
                </Notification>,
            )
        }
    }

    const handleAddAdminUser = (customer: CustomerDetailsResponse) => {
        navigate(`/admin/customers/${customer.id}/add-admin-user`)
    }
    const columns = [
        {
            key: 'name',
            dataIndex: 'name',
            title: 'Customer',
            render: (_: any, record: CustomerDetailsResponse) => (
                <div className="flex items-center">
                    <Avatar
                        size={40}
                        shape="circle"
                        src={record.branding?.logoUrl}
                        icon={record.name?.charAt(0)}
                    />
                    <div className="ml-2">
                        <div className="font-semibold">{record.name}</div>
                        <div className="text-xs text-gray-500">
                            {record.subdomain ||
                                record.domainUrl ||
                                'No subdomain'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'domain',
            dataIndex: 'subdomain',
            title: 'Subdomain',
            render: (_: any, record: CustomerDetailsResponse) => (
                <span>{record.subdomain || record.domainUrl || 'N/A'}</span>
            ),
        },
        {
            key: 'address',
            dataIndex: 'address',
            title: 'Address',
            render: (_: any, record: CustomerDetailsResponse) => (
                <span>{record.address || 'N/A'}</span>
            ),
        },
        {
            key: 'status',
            dataIndex: 'isActive',
            title: 'Status',
            render: (_: any, record: CustomerDetailsResponse) => (
                <Tag
                    className={
                        record.isActive ? 'bg-emerald-500' : 'bg-red-500'
                    }
                    prefixClass={
                        record.isActive ? 'bg-emerald-600' : 'bg-red-600'
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
            render: (_: any, record: CustomerDetailsResponse) => (
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
                        {' '}
                        <Menu
                            onSelect={(key) => {
                                if (key === 'access') {
                                    handleAccessCustomerPortal(record)
                                } else if (key === 'edit') {
                                    handleEditCustomer(record)
                                } else if (key === 'add-admin') {
                                    handleAddAdminUser(record)
                                } else if (key === 'delete') {
                                    confirmDeleteCustomer(record)
                                }
                            }}
                        >
                            <Menu.MenuItem
                                eventKey="access"
                                disabled={!record.isActive}
                            >
                                <Space>
                                    <HiOutlineLogin />
                                    <span>Access Portal</span>
                                </Space>
                            </Menu.MenuItem>
                            <Menu.MenuItem eventKey="edit">
                                <Space>
                                    <HiOutlinePencilAlt />
                                    <span>Edit</span>
                                </Space>
                            </Menu.MenuItem>
                            <Menu.MenuItem eventKey="add-admin">
                                <Space>
                                    <HiOutlineUserAdd />
                                    <span>Add Admin User</span>
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
                    <h3>Customer Management</h3>
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={handleCreateCustomer}
                    >
                        Create Customer
                    </Button>
                </div>

                <Card className="mb-4">
                    <div className="mb-4">
                        <Input
                            placeholder="Search customers..."
                            prefix={<HiOutlineSearch className="text-lg" />}
                            onChange={handleSearch}
                            value={searchText}
                        />{' '}
                    </div>
                    {/* Debug info - remove in production */}
                    {filteredCustomers.length === 0 && !loading && (
                        <div className="p-4 text-center text-red-500">
                            No customers found. Check console for details.
                        </div>
                    )}{' '}
                    <Table
                        loading={loading}
                        columns={columns}
                        dataSource={paginatedCustomers}
                        rowKey="id"
                    />
                    {totalCustomers > 0 && (
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center">
                                <span className="mr-2">Items per page:</span>{' '}
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
                                total={totalCustomers}
                                pageSize={pageSize}
                                onChange={handlePageChange}
                                displayTotal={true}
                            />
                        </div>
                    )}
                </Card>
            </div>

            <Dialog
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <h5 className="mb-4">Delete Customer</h5>
                <p>
                    Are you sure you want to delete{' '}
                    <strong>{customerToDelete?.name}</strong>? This action
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
                        onClick={handleDeleteCustomer}
                    >
                        Delete
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default CustomersListPage
