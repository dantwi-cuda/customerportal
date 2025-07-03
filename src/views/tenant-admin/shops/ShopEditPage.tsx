import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Notification,
    toast,
    FormContainer,
    FormItem,
    Switcher,
    Select,
} from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineSave } from 'react-icons/hi'
import * as ShopService from '@/services/ShopService'
import { useNavigate, useParams } from 'react-router-dom'
import type { Shop, ShopDto } from '@/@types/shop'
import useAuth from '@/auth/useAuth'
import type { SingleValue } from 'react-select'

// Types for Select component
interface SelectOption {
    value: string
    label: string
}

const ShopEditPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isNewShop = id === 'create'

    // State management
    const [shop, setShop] = useState<ShopDto>({
        name: '',
        source: '',
        postalCode: '',
        city: '',
        state: '',
        country: '',
        isActive: true,
        programNames: [],
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Tenant admin check: User must have a tenantId to manage shops
    const isTenantAdmin = !!user?.tenantId

    useEffect(() => {
        if (isTenantAdmin) {
            if (!isNewShop && id) {
                fetchShopDetails(parseInt(id, 10))
            }
        }
    }, [isTenantAdmin, id, isNewShop])

    const fetchShopDetails = async (shopId: number) => {
        setLoading(true)
        try {
            const data = await ShopService.getShopById(shopId)
            setShop({
                id: data.id,
                name: data.name,
                source: data.source || '',
                postalCode: data.postalCode || '',
                city: data.city || '',
                state: data.state || '',
                country: data.country || '',
                isActive: data.isActive,
                programNames: data.programNames || [],
            })
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

    const handleSave = async () => {
        if (!shop.name.trim()) {
            toast.push(
                <Notification type="warning" title="Validation Error">
                    Shop name is required
                </Notification>,
            )
            return
        }

        setSaving(true)
        try {
            if (isNewShop) {
                await ShopService.createShop(shop)
                toast.push(
                    <Notification type="success" title="Shop created">
                        Shop has been created successfully
                    </Notification>,
                )
            } else if (id) {
                await ShopService.updateShop(parseInt(id, 10), shop)
                toast.push(
                    <Notification type="success" title="Shop updated">
                        Shop has been updated successfully
                    </Notification>,
                )
            }
            navigate('/admin/shops')
        } catch (error) {
            console.error('Error saving shop:', error)
            toast.push(
                <Notification type="danger" title="Error saving shop">
                    {error instanceof Error
                        ? error.message
                        : 'An unknown error occurred'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleBack = () => {
        navigate('/admin/shops')
    }

    const handleInputChange = (
        field: keyof ShopDto,
        value: string | boolean | string[],
    ) => {
        setShop((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    // Country options
    const countryOptions = [
        { value: '', label: 'Select Country' },
        { value: 'US', label: 'United States' },
        { value: 'CA', label: 'Canada' },
        { value: 'MX', label: 'Mexico' },
        { value: 'UK', label: 'United Kingdom' },
        { value: 'DE', label: 'Germany' },
        { value: 'FR', label: 'France' },
        { value: 'AU', label: 'Australia' },
        { value: 'JP', label: 'Japan' },
    ]

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

    return (
        <div className="p-2 sm:p-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineArrowLeft />}
                        onClick={handleBack}
                    >
                        Back to Shops
                    </Button>
                    <h3 className="text-lg font-medium">
                        {isNewShop
                            ? 'Create New Shop'
                            : `Edit Shop: ${shop.name}`}
                    </h3>
                </div>
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlineSave />}
                    onClick={handleSave}
                    loading={saving}
                >
                    {isNewShop ? 'Create Shop' : 'Save Changes'}
                </Button>
            </div>

            {loading ? (
                <Card className="text-center p-8">
                    <div>Loading shop details...</div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <div className="p-6">
                                <h4 className="text-base font-semibold mb-4">
                                    Shop Information
                                </h4>
                                <FormContainer>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormItem label="Shop Name" asterisk>
                                            <Input
                                                placeholder="Enter shop name"
                                                value={shop.name}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </FormItem>

                                        <FormItem label="Source">
                                            <Input
                                                placeholder="Enter source"
                                                value={shop.source || ''}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'source',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </FormItem>

                                        <FormItem label="City">
                                            <Input
                                                placeholder="Enter city"
                                                value={shop.city || ''}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'city',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </FormItem>

                                        <FormItem label="State">
                                            <Input
                                                placeholder="Enter state"
                                                value={shop.state || ''}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'state',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </FormItem>

                                        <FormItem label="Postal Code">
                                            <Input
                                                placeholder="Enter postal code"
                                                value={shop.postalCode || ''}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'postalCode',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </FormItem>

                                        <FormItem label="Country">
                                            <Select
                                                placeholder="Select country"
                                                value={countryOptions.find(
                                                    (option) =>
                                                        option.value ===
                                                        shop.country,
                                                )}
                                                onChange={(
                                                    newValue: SingleValue<SelectOption>,
                                                ) => {
                                                    if (newValue) {
                                                        handleInputChange(
                                                            'country',
                                                            newValue.value,
                                                        )
                                                    }
                                                }}
                                                options={countryOptions}
                                                isClearable
                                            />
                                        </FormItem>
                                    </div>
                                </FormContainer>
                            </div>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <div className="p-6">
                                <h4 className="text-base font-semibold mb-4">
                                    Shop Status
                                </h4>
                                <FormContainer>
                                    <FormItem label="Active Status">
                                        <div className="flex items-center gap-3">
                                            <Switcher
                                                checked={shop.isActive}
                                                onChange={(checked) =>
                                                    handleInputChange(
                                                        'isActive',
                                                        checked,
                                                    )
                                                }
                                            />
                                            <span className="text-sm">
                                                {shop.isActive
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {shop.isActive
                                                ? 'Shop is currently active and visible to users'
                                                : 'Shop is inactive and hidden from users'}
                                        </div>
                                    </FormItem>
                                </FormContainer>
                            </div>
                        </Card>

                        {shop.programNames && shop.programNames.length > 0 && (
                            <Card className="mt-6">
                                <div className="p-6">
                                    <h4 className="text-base font-semibold mb-4">
                                        Current Programs
                                    </h4>
                                    <div className="space-y-2">
                                        {shop.programNames.map(
                                            (program, index) => (
                                                <div
                                                    key={index}
                                                    className="px-3 py-2 bg-gray-100 rounded-lg"
                                                >
                                                    <span className="text-sm">
                                                        {program}
                                                    </span>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ShopEditPage
