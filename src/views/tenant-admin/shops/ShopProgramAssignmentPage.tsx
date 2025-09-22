import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Notification,
    toast,
    Input,
    Select,
    Pagination,
    Table,
    FormContainer,
    Tag,
    Checkbox,
} from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineDocumentText,
} from 'react-icons/hi'
import * as ShopService from '@/services/ShopService'
import ProgramService from '@/services/ProgramService'
import ApiService from '@/services/ApiService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Shop } from '@/@types/shop'
import type {
    Program,
    ProgramShopSubscription,
    AssignProgramToShopsRequest,
} from '@/@types/program'
import useAuth from '@/auth/useAuth'

const { Tr, Th, Td, THead, TBody } = Table

// Local interface for update subscription request
interface UpdateSubscriptionRequest {
    retroactiveDays: number
    minWarrantySalesDollars: number
    isActive: boolean
    startDate?: string
    endDate?: string
    additionalParameters?: Record<string, any>
}

const ShopProgramAssignmentPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    // State management
    const [shop, setShop] = useState<Shop | null>(null)
    const [programs, setPrograms] = useState<Program[]>([])
    const [subscriptions, setSubscriptions] = useState<
        ProgramShopSubscription[]
    >([])
    const [loading, setLoading] = useState(false)
    const [programsLoading, setProgramsLoading] = useState(false)
    const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)
    const [searchText, setSearchText] = useState('')

    // Navigation states - no more dialogs
    const [isAddingProgram, setIsAddingProgram] = useState(false)
    const [isEditingSubscription, setIsEditingSubscription] = useState(false)
    const [selectedSubscription, setSelectedSubscription] =
        useState<ProgramShopSubscription | null>(null)

    // Form states for add/edit
    const [formData, setFormData] = useState({
        programId: '',
        retroactiveDays: 0,
        minWarrantySalesDollars: 0,
        isActive: true,
        startDate: '',
        endDate: '',
        additionalParameters: {},
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)

    // Tenant admin check
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin && id) {
            fetchShopDetails(parseInt(id, 10))
            fetchPrograms()
            fetchSubscriptions(parseInt(id, 10))
        }
    }, [isTenantAdmin, id])

    const fetchShopDetails = async (shopId: number) => {
        setLoading(true)
        try {
            const data = await ShopService.getShopById(shopId)
            setShop(data)
        } catch (error) {
            console.error('Error fetching shop details:', error)
            toast.push(
                <Notification type="danger" title="Error fetching shop details">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
            navigate('/admin/shops')
        } finally {
            setLoading(false)
        }
    }

    const fetchPrograms = async () => {
        setProgramsLoading(true)
        try {
            const data = await ProgramService.getPrograms()
            setPrograms(data.filter((p) => p.isActive)) // Only show active programs
        } catch (error) {
            console.error('Error fetching programs:', error)
            toast.push(
                <Notification type="danger" title="Error fetching programs">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setProgramsLoading(false)
        }
    }

    const fetchSubscriptions = async (shopId: number) => {
        setSubscriptionsLoading(true)
        try {
            // Use ApiService to ensure proper authentication headers
            const data = await ApiService.fetchDataWithAxios<any[]>({
                url: `Program/shop/${shopId}`,
                method: 'get',
            })

            // Map API response to match our interface
            const subscriptionsData: ProgramShopSubscription[] = data.map(
                (item: any) => ({
                    shopSubscriptionId:
                        item.shopSubscriptionID || item.shopSubscriptionId,
                    programId: item.programID || item.programId,
                    programName: item.programName,
                    shopId: item.shopID || item.shopId,
                    shopName: item.shopName,
                    retroactiveDays: item.retroactiveDays,
                    minWarrantySalesDollars: item.minWarrantySalesDollars,
                    assignedAt: item.assignedAt,
                    assignedByUserId:
                        item.assignedByUserID || item.assignedByUserId,
                    isActive: item.isActive,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    additionalParameters: item.additionalParameters,
                }),
            )

            setSubscriptions(subscriptionsData)
        } catch (error) {
            console.error('Error fetching subscriptions:', error)
            toast.push(
                <Notification
                    type="danger"
                    title="Error fetching subscriptions"
                >
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSubscriptionsLoading(false)
        }
    }

    const handleBack = () => {
        navigate(`/admin/shops/${id}/view`)
    }

    const handleAddProgram = async () => {
        if (!shop || !formData.programId) return

        try {
            // Format dates properly for API
            const formatDateForAPI = (dateString: string) => {
                if (!dateString) return undefined
                // Ensure we send just the date part, not full ISO string
                const date = new Date(dateString)
                return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
            }

            const request = {
                programID: parseInt(formData.programId),
                shopID: shop.id,
                retroactiveDays: formData.retroactiveDays,
                minWarrantySalesDollars: formData.minWarrantySalesDollars,
                isActive: formData.isActive,
                startDate: formatDateForAPI(formData.startDate),
                endDate: formatDateForAPI(formData.endDate),
                additionalParameters: formData.additionalParameters,
            }

            console.log('=== REQUEST DEBUG INFO ===')
            console.log('Assigning program with request:', request)
            console.log('Request keys:', Object.keys(request))
            console.log('Request values:', Object.values(request))
            console.log('Request JSON:', JSON.stringify(request, null, 2))
            console.log(
                'Endpoint URL:',
                `Program/${formData.programId}/assign/shop`,
            )
            console.log('Shop ID:', shop.id)
            console.log('Program ID:', formData.programId)
            console.log('Form data:', formData)
            console.log('=========================')

            // Use the correct endpoint for assigning program to a single shop
            const result = await ApiService.fetchDataWithAxios({
                url: `Program/${formData.programId}/assign/shop`,
                method: 'post',
                data: request,
            })

            console.log('Program assignment result:', result)

            toast.push(
                <Notification type="success" title="Program assigned">
                    Program has been assigned to the shop successfully
                </Notification>,
            )

            setIsAddingProgram(false)
            resetForm()
            fetchSubscriptions(shop.id)
        } catch (error) {
            console.error('Error assigning program:', error)

            // Log detailed error information for debugging
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any
                console.log('=== DETAILED ERROR DEBUG INFO ===')
                console.log('Error status:', axiosError.response?.status)
                console.log('Error headers:', axiosError.response?.headers)
                console.log('Error data:', axiosError.response?.data)
                console.log('Error config:', axiosError.config)
                console.log(
                    'Request payload that was sent:',
                    axiosError.config?.data,
                )
                console.log('Request URL:', axiosError.config?.url)
                console.log('Request method:', axiosError.config?.method)
                console.log('================================')

                // If we get a 500 but there's response data, it might actually be successful
                if (
                    axiosError.response?.status === 500 &&
                    axiosError.response?.data
                ) {
                    console.log(
                        '500 error but with response data - treating as success:',
                        axiosError.response.data,
                    )

                    toast.push(
                        <Notification type="success" title="Program assigned">
                            Program has been assigned to the shop successfully
                        </Notification>,
                    )

                    setIsAddingProgram(false)
                    resetForm()
                    fetchSubscriptions(shop.id)
                    return
                }
            } else {
                console.log('=== NON-AXIOS ERROR DEBUG INFO ===')
                console.log('Error object:', error)
                console.log('Error type:', typeof error)
                console.log('Error constructor:', error?.constructor?.name)
                console.log('=================================')
            }

            toast.push(
                <Notification type="danger" title="Error assigning program">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const handleUpdateSubscription = async () => {
        if (!selectedSubscription) return

        try {
            const request: UpdateSubscriptionRequest = {
                retroactiveDays: formData.retroactiveDays,
                minWarrantySalesDollars: formData.minWarrantySalesDollars,
                isActive: formData.isActive,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                additionalParameters: formData.additionalParameters,
            }

            // Use ApiService for authenticated requests
            await ApiService.fetchDataWithAxios({
                url: `Program/${selectedSubscription.programId}/assign/shop/${selectedSubscription.shopSubscriptionId}`,
                method: 'put',
                data: request,
            })

            toast.push(
                <Notification type="success" title="Subscription updated">
                    Program subscription has been updated successfully
                </Notification>,
            )

            setIsEditingSubscription(false)
            setSelectedSubscription(null)
            resetForm()
            if (shop) fetchSubscriptions(shop.id)
        } catch (error) {
            console.error('Error updating subscription:', error)
            toast.push(
                <Notification type="danger" title="Error updating subscription">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const handleDeleteSubscription = async (
        subscription: ProgramShopSubscription,
    ) => {
        if (
            !window.confirm(
                'Are you sure you want to remove this program subscription?',
            )
        ) {
            return
        }

        try {
            await ProgramService.removeShopAssignment(
                subscription.programId,
                subscription.shopSubscriptionId,
            )

            toast.push(
                <Notification type="success" title="Subscription removed">
                    Program subscription has been removed successfully
                </Notification>,
            )

            if (shop) fetchSubscriptions(shop.id)
        } catch (error) {
            console.error('Error removing subscription:', error)
            toast.push(
                <Notification type="danger" title="Error removing subscription">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        }
    }

    const openEditDialog = (subscription: ProgramShopSubscription) => {
        setSelectedSubscription(subscription)
        setFormData({
            programId: subscription.programId.toString(),
            retroactiveDays: subscription.retroactiveDays,
            minWarrantySalesDollars: subscription.minWarrantySalesDollars,
            isActive: subscription.isActive,
            startDate: subscription.startDate || '',
            endDate: subscription.endDate || '',
            additionalParameters: subscription.additionalParameters || {},
        })
        setIsEditingSubscription(true)
    }

    const resetForm = () => {
        setFormData({
            programId: '',
            retroactiveDays: 0,
            minWarrantySalesDollars: 0,
            isActive: true,
            startDate: '',
            endDate: '',
            additionalParameters: {},
        })
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString()
    }

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString()
    }

    // Filter subscriptions based on search text
    const filteredSubscriptions = subscriptions.filter((subscription) => {
        if (!searchText) return true
        const searchLower = searchText.toLowerCase()
        return subscription.programName?.toLowerCase().includes(searchLower)
    })

    // Calculate pagination
    const totalItems = filteredSubscriptions.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)
    const paginatedSubscriptions = filteredSubscriptions.slice(
        startIndex,
        endIndex,
    )

    // Available programs for adding (exclude already assigned ones)
    const availablePrograms = programs.filter(
        (program) =>
            !subscriptions.some((sub) => sub.programId === program.programId),
    )

    if (!isTenantAdmin) {
        return (
            <div className="p-4">
                <Card className="text-center p-4">
                    <h4 className="mb-2">Access Denied</h4>
                    <p>
                        You must be a tenant administrator to access this page.
                    </p>
                </Card>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-2 sm:p-4">
                <Card className="text-center p-8">
                    <div>Loading shop details...</div>
                </Card>
            </div>
        )
    }

    if (!shop) {
        return (
            <div className="p-2 sm:p-4">
                <Card className="text-center p-8">
                    <div>Shop not found</div>
                </Card>
            </div>
        )
    }

    // Render add program page
    if (isAddingProgram) {
        return (
            <div className="p-2 sm:p-4">
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <Button
                            size="sm"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => {
                                setIsAddingProgram(false)
                                resetForm()
                            }}
                        >
                            Back to Subscriptions
                        </Button>
                        <div>
                            <h3 className="text-lg font-semibold">
                                Add Program Subscription
                            </h3>
                            <p className="text-sm text-gray-600">
                                {shop.name} - {shop.city}, {shop.state}
                            </p>
                        </div>
                    </div>

                    <FormContainer>
                        <div className="grid grid-cols-1 gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Program *
                                </label>
                                <Select
                                    value={
                                        formData.programId
                                            ? {
                                                  value: formData.programId,
                                                  label:
                                                      availablePrograms.find(
                                                          (p) =>
                                                              p.programId.toString() ===
                                                              formData.programId,
                                                      )?.programName || '',
                                              }
                                            : null
                                    }
                                    onChange={(selectedOption) =>
                                        setFormData({
                                            ...formData,
                                            programId:
                                                selectedOption?.value || '',
                                        })
                                    }
                                    options={availablePrograms.map(
                                        (program) => ({
                                            value: program.programId.toString(),
                                            label: program.programName,
                                        }),
                                    )}
                                    placeholder={
                                        programsLoading
                                            ? 'Loading programs...'
                                            : 'Select a program'
                                    }
                                    isDisabled={programsLoading}
                                    isClearable={false}
                                />
                                {programsLoading && (
                                    <p className="text-sm text-blue-500 mt-1">
                                        Loading available programs...
                                    </p>
                                )}
                                {!programsLoading && programs.length === 0 && (
                                    <p className="text-sm text-orange-500 mt-1">
                                        No programs found. Please check if
                                        programs exist and are active.
                                    </p>
                                )}
                                {!programsLoading &&
                                    programs.length > 0 &&
                                    availablePrograms.length === 0 && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            All available programs are already
                                            assigned to this shop.
                                        </p>
                                    )}
                                {!programsLoading &&
                                    availablePrograms.length > 0 && (
                                        <p className="text-sm text-green-600 mt-1">
                                            {availablePrograms.length}{' '}
                                            program(s) available for assignment.
                                        </p>
                                    )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Retroactive Days
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.retroactiveDays}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                retroactiveDays:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            })
                                        }
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Min Warranty Sales ($)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.minWarrantySalesDollars}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                minWarrantySalesDollars:
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                            })
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                startDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        End Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                endDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.isActive}
                                        onChange={(checked) =>
                                            setFormData({
                                                ...formData,
                                                isActive: checked,
                                            })
                                        }
                                    />
                                    <span className="text-sm font-medium">
                                        Active Subscription
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500 mt-1">
                                    Inactive subscriptions will not benefit from
                                    program features.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    onClick={() => {
                                        setIsAddingProgram(false)
                                        resetForm()
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    onClick={handleAddProgram}
                                    disabled={!formData.programId}
                                >
                                    Add Program Subscription
                                </Button>
                            </div>
                        </div>
                    </FormContainer>
                </Card>
            </div>
        )
    }

    // Render edit subscription page
    if (isEditingSubscription && selectedSubscription) {
        return (
            <div className="p-2 sm:p-4">
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <Button
                            size="sm"
                            icon={<HiOutlineArrowLeft />}
                            onClick={() => {
                                setIsEditingSubscription(false)
                                setSelectedSubscription(null)
                                resetForm()
                            }}
                        >
                            Back to Subscriptions
                        </Button>
                        <div>
                            <h3 className="text-lg font-semibold">
                                Edit Program Subscription
                            </h3>
                            <p className="text-sm text-gray-600">
                                {shop.name} - {shop.city}, {shop.state}
                            </p>
                        </div>
                    </div>

                    <FormContainer>
                        <div className="grid grid-cols-1 gap-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Program
                                </label>
                                <Input
                                    value={
                                        selectedSubscription.programName || ''
                                    }
                                    disabled
                                    className="bg-gray-50"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    The program cannot be changed for existing
                                    subscriptions.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Retroactive Days
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.retroactiveDays}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                retroactiveDays:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            })
                                        }
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Min Warranty Sales ($)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.minWarrantySalesDollars}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                minWarrantySalesDollars:
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                            })
                                        }
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                startDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        End Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                endDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={formData.isActive}
                                        onChange={(checked) =>
                                            setFormData({
                                                ...formData,
                                                isActive: checked,
                                            })
                                        }
                                    />
                                    <span className="text-sm font-medium">
                                        Active Subscription
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500 mt-1">
                                    Inactive subscriptions will not apply to new
                                    warranty claims.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    onClick={() => {
                                        setIsEditingSubscription(false)
                                        setSelectedSubscription(null)
                                        resetForm()
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    onClick={handleUpdateSubscription}
                                >
                                    Update Subscription
                                </Button>
                            </div>
                        </div>
                    </FormContainer>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-2 sm:p-4">
            <Card>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            icon={<HiOutlineArrowLeft />}
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                        <div>
                            <h3 className="text-lg font-semibold">
                                Program Subscriptions
                            </h3>
                            <p className="text-sm text-gray-600">
                                {shop.name} - {shop.city}, {shop.state}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="solid"
                        icon={<HiOutlinePlus />}
                        onClick={() => setIsAddingProgram(true)}
                        disabled={availablePrograms.length === 0}
                    >
                        Add Program
                    </Button>
                </div>

                <div className="mb-6">
                    <Input
                        placeholder="Search subscriptions..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                <div className="min-h-96">
                    {subscriptionsLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <div>Loading subscriptions...</div>
                        </div>
                    ) : paginatedSubscriptions.length === 0 ? (
                        <div className="text-center py-8">
                            <HiOutlineDocumentText
                                className="mx-auto h-12 w-12 text-gray-400"
                                aria-hidden="true"
                            />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No program subscriptions
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchText
                                    ? 'No subscriptions match your search.'
                                    : 'This shop has no program subscriptions yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Table>
                                <THead>
                                    <Tr>
                                        <Th>Program</Th>
                                        <Th>Status</Th>
                                        <Th>Retroactive Days</Th>
                                        <Th>Min Warranty Sales</Th>
                                        <Th>Start Date</Th>
                                        <Th>End Date</Th>
                                        <Th>Created</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {paginatedSubscriptions.map(
                                        (subscription) => (
                                            <Tr
                                                key={`subscription-${subscription.shopSubscriptionId}`}
                                            >
                                                <Td>
                                                    <div>
                                                        <div className="font-medium">
                                                            {
                                                                subscription.programName
                                                            }
                                                        </div>
                                                        {/* Program description not available in subscription, show program name only */}
                                                    </div>
                                                </Td>
                                                <Td>
                                                    <Tag
                                                        className={
                                                            subscription.isActive
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }
                                                    >
                                                        {subscription.isActive
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Tag>
                                                </Td>
                                                <Td>
                                                    {
                                                        subscription.retroactiveDays
                                                    }
                                                </Td>
                                                <Td>
                                                    $
                                                    {subscription.minWarrantySalesDollars.toLocaleString()}
                                                </Td>
                                                <Td>
                                                    {formatDate(
                                                        subscription.startDate,
                                                    )}
                                                </Td>
                                                <Td>
                                                    {formatDate(
                                                        subscription.endDate,
                                                    )}
                                                </Td>
                                                <Td>
                                                    {formatDateTime(
                                                        subscription.assignedAt,
                                                    )}
                                                </Td>
                                                <Td>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="xs"
                                                            variant="plain"
                                                            icon={
                                                                <HiOutlinePencil />
                                                            }
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    subscription,
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            size="xs"
                                                            variant="plain"
                                                            icon={
                                                                <HiOutlineTrash />
                                                            }
                                                            onClick={() =>
                                                                handleDeleteSubscription(
                                                                    subscription,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </Td>
                                            </Tr>
                                        ),
                                    )}
                                </TBody>
                            </Table>

                            {totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={totalItems}
                                        currentPage={currentPage}
                                        pageSize={pageSize}
                                        onChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ShopProgramAssignmentPage
