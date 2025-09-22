import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Notification,
    Upload,
    Avatar,
} from '@/components/ui'
import { toast } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'
import ApiService from '@/services/ApiService'

interface CustomerBrandingInfo {
    id: number
    customerName: string
    logoUrl?: string
    primaryColor?: string
    secondaryColor?: string
    website?: string
    address?: string
    contactEmail?: string
    contactPhone?: string
}

const AccountSettingsPage: React.FC = () => {
    const { authority } = useSessionUser((state) => state.user)
    const [brandingInfo, setBrandingInfo] =
        useState<CustomerBrandingInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<CustomerBrandingInfo>>({})

    // Check if user is tenant admin
    const isTenantAdmin = authority?.some((role: string) =>
        ['Tenant-Admin'].includes(role),
    )

    useEffect(() => {
        if (isTenantAdmin) {
            fetchBrandingInfo()
        } else {
            setLoading(false)
        }
    }, [isTenantAdmin])

    const fetchBrandingInfo = async () => {
        try {
            setLoading(true)
            const response =
                await ApiService.fetchDataWithAxios<CustomerBrandingInfo>({
                    url: 'customers/current',
                    method: 'get',
                })
            setBrandingInfo(response)
            setFormData(response)
        } catch (error) {
            console.error('Failed to fetch branding info:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load customer information
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (
        field: keyof CustomerBrandingInfo,
        value: string,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSave = async () => {
        if (!brandingInfo) return

        setSaving(true)
        try {
            const response =
                await ApiService.fetchDataWithAxios<CustomerBrandingInfo>({
                    url: `customers/${brandingInfo.id}`,
                    method: 'put',
                    data: formData,
                })

            setBrandingInfo(response)
            setFormData(response)

            toast.push(
                <Notification title="Success" type="success">
                    Customer branding information updated successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Failed to update branding info:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update customer information
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleLogoUpload = async (files: File[]) => {
        if (!files || files.length === 0 || !brandingInfo) return

        const file = files[0]
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)

        try {
            // Use a different method for file upload since ApiService might not support FormData
            const response = await fetch(
                `/api/customers/${brandingInfo.id}/logo`,
                {
                    method: 'POST',
                    body: formDataUpload,
                    headers: {
                        // Don't set Content-Type, let the browser set it with boundary
                        Authorization: `Bearer ${localStorage.getItem('token')}`, // Adjust based on your auth implementation
                    },
                },
            )

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const result = (await response.json()) as { logoUrl: string }

            const updatedBranding = { ...brandingInfo, logoUrl: result.logoUrl }
            setBrandingInfo(updatedBranding)
            setFormData(updatedBranding)

            toast.push(
                <Notification title="Success" type="success">
                    Logo uploaded successfully
                </Notification>,
            )
        } catch (error) {
            console.error('Failed to upload logo:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to upload logo
                </Notification>,
            )
        }
    }

    if (!isTenantAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">
                        Account Settings
                    </h1>
                    <p className="text-gray-600">
                        Access denied. Only tenant administrators can access
                        account settings.
                    </p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">
                        Account Settings
                    </h1>
                    <p className="text-gray-600">
                        Loading customer information...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
                <p className="text-gray-600">
                    Manage your organization's branding and information
                </p>
            </div>

            {/* Company Information */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Company Name
                        </label>
                        <Input
                            value={formData.customerName || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'customerName',
                                    e.target.value,
                                )
                            }
                            placeholder="Enter company name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Website
                        </label>
                        <Input
                            value={formData.website || ''}
                            onChange={(e) =>
                                handleInputChange('website', e.target.value)
                            }
                            placeholder="https://example.com"
                            type="url"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                            Address
                        </label>
                        <Input
                            value={formData.address || ''}
                            onChange={(e) =>
                                handleInputChange('address', e.target.value)
                            }
                            placeholder="Enter company address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Contact Email
                        </label>
                        <Input
                            value={formData.contactEmail || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'contactEmail',
                                    e.target.value,
                                )
                            }
                            placeholder="contact@example.com"
                            type="email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Contact Phone
                        </label>
                        <Input
                            value={formData.contactPhone || ''}
                            onChange={(e) =>
                                handleInputChange(
                                    'contactPhone',
                                    e.target.value,
                                )
                            }
                            placeholder="+1 (555) 123-4567"
                            type="tel"
                        />
                    </div>
                </div>
            </Card>

            {/* Branding Settings */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Branding Settings
                </h2>

                {/* Logo Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Company Logo
                    </label>
                    <div className="flex items-center gap-4">
                        {formData.logoUrl && (
                            <Avatar
                                src={formData.logoUrl}
                                alt="Company Logo"
                                size={80}
                                shape="square"
                            />
                        )}
                        <Upload
                            accept="image/*"
                            onChange={(files) => handleLogoUpload(files)}
                        >
                            <Button variant="plain">
                                {formData.logoUrl
                                    ? 'Change Logo'
                                    : 'Upload Logo'}
                            </Button>
                        </Upload>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 200x200px. Formats: JPG, PNG, SVG
                    </p>
                </div>

                {/* Color Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Primary Color
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={formData.primaryColor || ''}
                                onChange={(e) =>
                                    handleInputChange(
                                        'primaryColor',
                                        e.target.value,
                                    )
                                }
                                placeholder="#3B82F6"
                                type="color"
                                className="w-20"
                            />
                            <Input
                                value={formData.primaryColor || ''}
                                onChange={(e) =>
                                    handleInputChange(
                                        'primaryColor',
                                        e.target.value,
                                    )
                                }
                                placeholder="#3B82F6"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Secondary Color
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={formData.secondaryColor || ''}
                                onChange={(e) =>
                                    handleInputChange(
                                        'secondaryColor',
                                        e.target.value,
                                    )
                                }
                                placeholder="#6B7280"
                                type="color"
                                className="w-20"
                            />
                            <Input
                                value={formData.secondaryColor || ''}
                                onChange={(e) =>
                                    handleInputChange(
                                        'secondaryColor',
                                        e.target.value,
                                    )
                                }
                                placeholder="#6B7280"
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    variant="solid"
                    onClick={handleSave}
                    loading={saving}
                    disabled={!brandingInfo}
                >
                    Save Changes
                </Button>
            </div>
        </div>
    )
}

export default AccountSettingsPage
