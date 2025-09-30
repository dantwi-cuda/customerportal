import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Table,
    Badge,
    Notification,
    toast,
    Dialog,
    Progress,
} from '@/components/ui'
import {
    HiOutlineTrash,
    HiOutlinePlay,
    HiOutlineRefresh,
    HiOutlineEye,
    HiOutlineClock,
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

interface IncompleteCustomer {
    customerId: number
    customerName: string
    subdomain: string
    timestamp: number
    currentStep: number
    completedSteps: number
    totalSteps: number
    status: 'draft' | 'partial' | 'failed'
}

/**
 * Component to manage incomplete/abandoned customer creation processes
 * Shows customers that were started but not fully completed
 */
const IncompleteCustomerManager: React.FC = () => {
    const navigate = useNavigate()
    const [incompleteCustomers, setIncompleteCustomers] = useState<
        IncompleteCustomer[]
    >([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] =
        useState<IncompleteCustomer | null>(null)

    // Load incomplete customers from localStorage and potentially from backend
    useEffect(() => {
        loadIncompleteCustomers()
    }, [])

    const loadIncompleteCustomers = () => {
        const customers: IncompleteCustomer[] = []

        // Check localStorage for incomplete wizards
        const savedProgress = localStorage.getItem('customerWizardProgress')
        if (savedProgress) {
            try {
                const progress = JSON.parse(savedProgress)
                if (progress.customerId && progress.version === 1) {
                    customers.push({
                        customerId: progress.customerId,
                        customerName:
                            progress.customerInfo?.name || 'Unnamed Customer',
                        subdomain: progress.customerInfo?.subdomain || '',
                        timestamp: progress.timestamp,
                        currentStep: progress.currentStep,
                        completedSteps:
                            progress.stepStates?.filter(
                                (s: any) => s.status === 'completed',
                            ).length || 0,
                        totalSteps: 4,
                        status: progress.stepStates?.some(
                            (s: any) => s.status === 'failed',
                        )
                            ? 'failed'
                            : 'partial',
                    })
                }
            } catch (error) {
                console.error('Failed to parse saved progress:', error)
            }
        }

        // TODO: Load from backend API when available
        // const backendIncomplete = await getIncompleteCustomers()
        // customers.push(...backendIncomplete)

        setIncompleteCustomers(customers)
    }

    const continueCustomer = (customer: IncompleteCustomer) => {
        // Navigate to wizard with customer ID
        navigate(`/admin/customers/create?continue=${customer.customerId}`)
    }

    const deleteIncompleteCustomer = async (customer: IncompleteCustomer) => {
        try {
            // TODO: Call backend API to delete partial customer
            // await deletePartialCustomer(customer.customerId)

            // Remove from localStorage if it matches
            const savedProgress = localStorage.getItem('customerWizardProgress')
            if (savedProgress) {
                const progress = JSON.parse(savedProgress)
                if (progress.customerId === customer.customerId) {
                    localStorage.removeItem('customerWizardProgress')
                }
            }

            loadIncompleteCustomers()
            setDialogOpen(false)

            toast.push(
                <Notification title="Customer Deleted" type="success">
                    Incomplete customer "{customer.customerName}" has been
                    removed.
                </Notification>,
            )
        } catch (error) {
            console.error('Failed to delete incomplete customer:', error)
            toast.push(
                <Notification title="Delete Failed" type="danger">
                    Could not delete the incomplete customer.
                </Notification>,
            )
        }
    }

    const getTimeAgo = (timestamp: number) => {
        const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60))
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'partial':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        Partial
                    </Badge>
                )
            case 'failed':
                return <Badge className="bg-red-100 text-red-800">Failed</Badge>
            case 'draft':
                return (
                    <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                )
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const columns = [
        {
            header: 'Customer',
            accessorKey: 'customerName',
            cell: (props: any) => {
                const { customerName, subdomain } = props.row.original
                return (
                    <div>
                        <div className="font-medium">{customerName}</div>
                        <div className="text-sm text-gray-500">{subdomain}</div>
                    </div>
                )
            },
        },
        {
            header: 'Progress',
            accessorKey: 'progress',
            cell: (props: any) => {
                const { completedSteps, totalSteps, currentStep } =
                    props.row.original
                const percentage = (completedSteps / totalSteps) * 100
                return (
                    <div className="w-32">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span>
                                Step {currentStep + 1}/{totalSteps}
                            </span>
                            <span>
                                {completedSteps}/{totalSteps}
                            </span>
                        </div>
                        <Progress percent={percentage} size="sm" />
                    </div>
                )
            },
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (props: any) => getStatusBadge(props.row.original.status),
        },
        {
            header: 'Last Modified',
            accessorKey: 'timestamp',
            cell: (props: any) => (
                <div className="flex items-center text-sm text-gray-500">
                    <HiOutlineClock className="w-4 h-4 mr-1" />
                    {getTimeAgo(props.row.original.timestamp)}
                </div>
            ),
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            cell: (props: any) => {
                const customer = props.row.original
                return (
                    <div className="flex items-center space-x-2">
                        <Button
                            size="sm"
                            variant="twoTone"
                            icon={<HiOutlinePlay />}
                            onClick={() => continueCustomer(customer)}
                        >
                            Continue
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineEye />}
                            onClick={() =>
                                navigate(
                                    `/admin/customers/${customer.customerId}`,
                                )
                            }
                        >
                            View
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineTrash />}
                            onClick={() => {
                                setSelectedCustomer(customer)
                                setDialogOpen(true)
                            }}
                            className="text-red-600 hover:text-red-700"
                        >
                            Delete
                        </Button>
                    </div>
                )
            },
        },
    ]

    if (incompleteCustomers.length === 0) {
        return null // Don't show if no incomplete customers
    }

    return (
        <>
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Incomplete Customer Creation
                            </h3>
                            <p className="text-gray-600">
                                Continue or clean up customers that weren't
                                fully set up
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineRefresh />}
                            onClick={loadIncompleteCustomers}
                        >
                            Refresh
                        </Button>
                    </div>

                    <Table
                        columns={columns}
                        data={incompleteCustomers}
                        className="min-h-0"
                    />
                </div>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Delete Incomplete Customer
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete the incomplete customer
                        "{selectedCustomer?.customerName}"? This action cannot
                        be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="plain"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() =>
                                selectedCustomer &&
                                deleteIncompleteCustomer(selectedCustomer)
                            }
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export default IncompleteCustomerManager
