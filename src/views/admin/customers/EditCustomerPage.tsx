import React, { useState, useEffect } from 'react'
import {
    Card,
    Tabs,
    Button,
    Notification,
    toast,
    Spinner,
} from '@/components/ui'
import { useNavigate, useParams } from 'react-router-dom'
import CustomerInfoForm, {
    CustomerInfoFormValues,
} from './components/CustomerInfoForm'
import CredentialsForm, {
    CredentialsFormValues,
} from './components/CredentialsForm'
import BrandingForm, { BrandingFormValues } from './components/BrandingForm'
import * as CustomerService from '@/services/CustomerService'
import FileService from '@/services/FileService' // Import FileService
import type { CustomerDetailsResponse } from '@/@types/customer'

const EditCustomerPage = () => {
    const navigate = useNavigate()
    const params = useParams<{ id: string }>()
    console.log('EditCustomerPage rendered. All params from useParams:', params)
    console.log('EditCustomerPage rendered. ID from useParams:', params.id)
    const id = params.id

    const [activeTab, setActiveTab] = useState('info')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [customer, setCustomer] = useState<CustomerDetailsResponse | null>(
        null,
    )

    useEffect(() => {
        console.log('EditCustomerPage useEffect triggered. ID:', id) // Log ID when useEffect runs
        if (id) {
            fetchCustomer(id)
        } else {
            // If id is not present (e.g., /customers/edit/ instead of /customers/edit/123),
            // stop the loading indicator. The subsequent check for `!customer` will handle UI.
            console.warn(
                'EditCustomerPage: Customer ID is missing from URL parameters. Cannot fetch customer data.',
            )
            setLoading(false)
        }
    }, [id])

    const fetchCustomer = async (customerId: string) => {
        setLoading(true)
        // Ensure customer state is null at the beginning of a fetch
        // especially if a previous fetch failed or was for a different ID.
        setCustomer(null)
        try {
            console.log(`Fetching customer with ID: ${customerId}`)
            const data = await CustomerService.getCustomerById(customerId)
            console.log('Customer data received in EditCustomerPage:', data)
            console.log('Customer data fields:', {
                name: data?.name,
                subdomain: data?.subdomain,
                address: data?.address,
                theme: data?.theme,
                legacyBusinessNetworkID: data?.legacyBusinessNetworkID,
                portalDisplayName: data?.portalDisplayName,
                portalDisplaySubName: data?.portalDisplaySubName,
                portalDisplayPageSubTitle: data?.portalDisplayPageSubTitle,
                portalWindowIcon: data?.portalWindowIcon,
                isActive: data?.isActive,
            })
            if (data && data.id !== '0') {
                // Check if data is valid and not the "Unknown" customer
                setCustomer(data)
            } else {
                // If data is null, or it's the default "Unknown" customer, treat as not found.
                console.warn(
                    'Customer not found or API returned default/empty object for ID:',
                    customerId,
                )
                // setCustomer(null); // Already null or will be handled by the !customer check
                toast.push(
                    <Notification title="Not Found" type="warning">
                        Customer with ID {customerId} not found.
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Error fetching customer in EditCustomerPage:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to fetch customer details. Please try again.
                </Notification>,
            )
            // Removed navigate('/admin/customers') to stay on page and show error/not found state
        } finally {
            setLoading(false)
        }
    }

    const handleSaveInfo = async (values: CustomerInfoFormValues) => {
        if (!id || !customer) return

        setSaving(true)
        try {
            // Convert form values to UpdateCustomerRequest format
            const updateData = {
                name: values.name,
                subdomain: values.subdomain,
                address: values.address || '',
                theme: values.theme || 'default',
                legacyBusinessNetworkID: values.legacyBusinessNetworkID || '',
                portalDisplayName: values.portalDisplayName || '',
                portalDisplaySubName: values.portalDisplaySubName || '',
                portalDisplayPageSubTitle:
                    values.portalDisplayPageSubTitle || '',
                portalWindowIcon: values.portalWindowIcon || '',
                isActive: values.isActive ?? true,
            }

            const updatedCustomer = await CustomerService.updateCustomer(
                id,
                updateData,
            )
            setCustomer(updatedCustomer)

            toast.push(
                <Notification title="Success" type="success">
                    Customer information updated
                </Notification>,
            )
        } catch (error: any) {
            console.error('Error updating customer info:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Failed to update customer information'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleSaveCredentials = async (values: CredentialsFormValues) => {
        if (!id || !customer) return

        setSaving(true)
        try {
            // Map CredentialsFormValues to CustomerCredentials type expected by the service
            const credsToUpdate = {
                biUsername: values.username,
                biPassword: values.password || '', // Handle optional password
            }
            await CustomerService.updateCustomerCredentials(id, credsToUpdate)

            setCustomer((prev) =>
                prev
                    ? {
                          ...prev,
                          credentials: {
                              ...prev.credentials,
                              ...credsToUpdate,
                          },
                      }
                    : null,
            )

            toast.push(
                <Notification title="Success" type="success">
                    Credentials updated
                </Notification>,
            )
        } catch (error: any) {
            console.error('Error updating credentials:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Failed to update credentials'}
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleSaveBranding = async (values: BrandingFormValues) => {
        if (!customer || !customer.id) {
            // Ensure customer and customer.id are defined
            toast.push(
                <Notification title="Error" type="danger">
                    Customer data is not available.
                </Notification>,
            )
            return
        }
        setSaving(true)
        try {
            let logoUrl = customer.branding?.logoUrl || ''
            let backgroundUrl = customer.branding?.backgroundUrl || ''

            // Upload logo if a new file is provided
            if (values.logo && values.logo instanceof File) {
                try {
                    const uploadResponse = await FileService.uploadFile(
                        values.logo,
                        { type: 'logo', customerId: customer.id },
                    )
                    logoUrl = uploadResponse.url
                } catch (uploadError) {
                    console.error('Error uploading logo:', uploadError)
                    toast.push(
                        <Notification title="Logo Upload Failed" type="danger">
                            Could not upload logo. Please try again.
                        </Notification>,
                    )
                    setSaving(false)
                    return
                }
            } else if (typeof values.logo === 'string') {
                logoUrl = values.logo // Use existing or manually entered URL
            } else if (values.logo === null) {
                logoUrl = '' // Explicitly cleared
            }

            // Upload background image if a new file is provided
            if (
                values.backgroundImage &&
                values.backgroundImage instanceof File
            ) {
                try {
                    const uploadResponse = await FileService.uploadFile(
                        values.backgroundImage,
                        { type: 'backgroundImage', customerId: customer.id },
                    )
                    backgroundUrl = uploadResponse.url
                } catch (uploadError) {
                    console.error(
                        'Error uploading background image:',
                        uploadError,
                    )
                    toast.push(
                        <Notification
                            title="Background Upload Failed"
                            type="danger"
                        >
                            Could not upload background image. Please try again.
                        </Notification>,
                    )
                    setSaving(false)
                    return
                }
            } else if (typeof values.backgroundImage === 'string') {
                backgroundUrl = values.backgroundImage // Use existing or manually entered URL
            } else if (values.backgroundImage === null) {
                backgroundUrl = '' // Explicitly cleared
            }

            const updatedBranding = {
                ...customer.branding,
                displayTitle: customer.name || 'Default Title',
                logoUrl: logoUrl,
                backgroundUrl: backgroundUrl,
            }

            const updatedCustomer: CustomerDetailsResponse = {
                ...customer,
                branding: updatedBranding,
            }

            // await CustomerService.updateCustomerBranding(
            //     id, // This 'id' could be undefined if not checked
            //     updatedBranding as any,
            // )

            // Ensure 'id' is defined before calling the service
            if (id) {
                await CustomerService.updateCustomerBranding(
                    id,
                    updatedBranding as any,
                )
            } else {
                console.error(
                    'Customer ID is undefined, cannot update branding.',
                )
                toast.push(
                    <Notification title="Error" type="danger">
                        Cannot update branding: Customer ID is missing.
                    </Notification>,
                )
                setSaving(false) // Reset saving state
                return // Exit if no id
            }

            setCustomer(updatedCustomer)

            toast.push(
                <Notification title="Success" type="success">
                    Branding updated
                </Notification>,
            )
        } catch (error) {
            console.error('Error updating branding:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to update branding
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        navigate('/admin/customers')
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-80">
                <Spinner size={40} />
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Edit Customer</h3>
                    <Button variant="plain" onClick={handleCancel}>
                        Back to Customers
                    </Button>
                </div>
                <Card>
                    <div className="p-4 text-center">
                        <h5>Customer not found</h5>
                        <p className="mt-2">
                            The customer you're trying to edit doesn't exist or
                            has been deleted.
                        </p>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <h3>Edit Customer: {customer.name}</h3>
                <Button variant="plain" onClick={handleCancel}>
                    Back to Customers
                </Button>
            </div>

            <Card>
                <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                    <Tabs.TabList>
                        <Tabs.TabNav value="info">Customer Info</Tabs.TabNav>
                        <Tabs.TabNav value="credentials">
                            Admin User
                        </Tabs.TabNav>
                        <Tabs.TabNav value="branding">Branding</Tabs.TabNav>
                    </Tabs.TabList>
                    <Tabs.TabContent value="info">
                        <div className="mt-6">
                            {(() => {
                                const initialValues: CustomerInfoFormValues = {
                                    name: customer.name || '',
                                    subdomain: customer.subdomain || '',
                                    address: customer.address || '',
                                    theme: customer.theme || 'default',
                                    legacyBusinessNetworkID:
                                        customer.legacyBusinessNetworkID || '',
                                    portalDisplayName:
                                        customer.portalDisplayName || '',
                                    portalDisplaySubName:
                                        customer.portalDisplaySubName || '',
                                    portalDisplayPageSubTitle:
                                        customer.portalDisplayPageSubTitle ||
                                        '',
                                    portalWindowIcon:
                                        customer.portalWindowIcon || '',
                                    isActive: customer.isActive ?? true,
                                }
                                console.log(
                                    'Form initialValues:',
                                    initialValues,
                                )
                                console.log('Detailed field values:', {
                                    name: initialValues.name,
                                    subdomain: initialValues.subdomain,
                                    address: initialValues.address,
                                    theme: initialValues.theme,
                                    legacyBusinessNetworkID:
                                        initialValues.legacyBusinessNetworkID,
                                    portalDisplayName:
                                        initialValues.portalDisplayName,
                                    portalDisplaySubName:
                                        initialValues.portalDisplaySubName,
                                    portalDisplayPageSubTitle:
                                        initialValues.portalDisplayPageSubTitle,
                                    portalWindowIcon:
                                        initialValues.portalWindowIcon,
                                    isActive: initialValues.isActive,
                                })
                                return (
                                    <CustomerInfoForm
                                        initialValues={initialValues}
                                        onSubmit={handleSaveInfo}
                                        isSubmitting={
                                            saving && activeTab === 'info'
                                        }
                                        customer={customer}
                                    />
                                )
                            })()}
                        </div>
                    </Tabs.TabContent>
                    <Tabs.TabContent value="credentials">
                        <div className="mt-6">
                            <CredentialsForm
                                initialValues={{
                                    username:
                                        customer.credentials?.biUsername || '',
                                    // Password field is for new input, not displaying existing
                                }}
                                onSubmit={handleSaveCredentials}
                                isSubmitting={
                                    saving && activeTab === 'credentials'
                                }
                                isNewUser={false} // Set to false for editing existing user credentials
                            />
                        </div>
                    </Tabs.TabContent>
                    <Tabs.TabContent value="branding">
                        <div className="mt-6">
                            <BrandingForm
                                initialValues={{
                                    logo: customer.branding?.logoUrl || null,
                                    backgroundImage:
                                        customer.branding?.backgroundUrl ||
                                        null,
                                }}
                                onSubmit={handleSaveBranding}
                                isSubmitting={
                                    saving && activeTab === 'branding'
                                }
                                existingLogoUrl={customer.branding?.logoUrl}
                                existingBackgroundImageUrl={
                                    customer.branding?.backgroundUrl
                                }
                            />
                        </div>
                    </Tabs.TabContent>
                </Tabs>
            </Card>
        </div>
    )
}

export default EditCustomerPage
