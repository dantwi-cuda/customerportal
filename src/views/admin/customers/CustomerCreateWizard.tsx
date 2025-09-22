import React, { useState } from 'react'
import {
    Card,
    Button,
    FormContainer,
    FormItem,
    Input,
    Upload,
    Steps,
    Alert,
    Notification,
    toast,
} from '@/components/ui'
import { Switcher } from '@/components/ui/Switcher'
import { useNavigate } from 'react-router-dom'
import {
    HiOutlineCheck,
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
} from 'react-icons/hi'
import { TbCheck } from 'react-icons/tb'
import useAuth from '@/auth/useAuth'
import {
    createCustomer,
    uploadCustomerLogo,
    uploadCustomerBackground,
} from '@/services/CustomerService'
import {
    CreateCustomerRequest,
    CustomerLogoRequest,
    CustomerBackgroundRequest,
} from '@/@types/customer'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'
import classNames from '@/utils/classNames'

// Customer creation wizard as specified in the PRD
const CustomerCreateWizard = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [domainValidationMessage, setDomainValidationMessage] = useState('')

    // Form data state - matching CustomerInfoForm fields plus admin info
    const [formData, setFormData] = useState({
        // Basic Customer Info
        name: '',
        subdomain: '',
        address: '',
        theme: 'default',
        legacyBusinessNetworkID: '',

        // Portal Branding
        portalDisplayName: '',
        portalDisplaySubName: '',
        portalDisplayPageSubTitle: '',
        portalWindowIcon: '',
        isActive: true,

        // Admin Info
        adminName: '',
        adminEmail: '',

        // File uploads
        logo: null as File | null,
        backgroundImage: null as File | null,
    })

    // Wizard steps
    const steps = [
        {
            title: 'Customer Information',
            description: 'Basic customer details',
        },
        {
            title: 'Portal Branding',
            description: 'Customize portal appearance',
        },
        {
            title: 'Admin Information',
            description: 'Customer admin account',
        },
        {
            title: 'Assets & Review',
            description: 'Upload assets and confirm',
        },
    ]

    const handleInputChange = (field: string, value: any) => {
        setFormData({
            ...formData,
            [field]: value,
        })
    }

    const handleFileChange = (field: string, file: File | null) => {
        setFormData({
            ...formData,
            [field]: file,
        })
    }

    // Domain validation through API
    const validateDomain = async () => {
        setValidating(true)

        // Simulate API call to check domain uniqueness
        setTimeout(() => {
            const isDomainTaken = ['acme', 'example', 'test'].includes(
                formData.subdomain,
            )

            if (isDomainTaken) {
                setDomainValidationMessage('This subdomain is already in use')
            } else if (formData.subdomain) {
                setDomainValidationMessage('Subdomain is available')
            }

            setValidating(false)
        }, 1000)
    }

    // Submit final data to API
    const handleSubmit = async () => {
        setLoading(true)

        try {
            // Prepare customer data for creation
            const customerData: CreateCustomerRequest = {
                name: formData.name,
                subdomain: formData.subdomain,
                address: formData.address,
                theme: formData.theme,
                legacyBusinessNetworkID: formData.legacyBusinessNetworkID,
                portalDisplayName: formData.portalDisplayName,
                portalDisplaySubName: formData.portalDisplaySubName,
                portalDisplayPageSubTitle: formData.portalDisplayPageSubTitle,
                portalWindowIcon: formData.portalWindowIcon,
            }

            console.log('Creating customer with data:', customerData)

            // Create the customer
            const newCustomer = await createCustomer(customerData)
            console.log('Customer created successfully:', newCustomer)

            // Upload logo if provided
            if (formData.logo && newCustomer.id) {
                const logoData: CustomerLogoRequest = {
                    url: '', // This would be filled by the upload service
                    fileName: formData.logo.name,
                    originalFileName: formData.logo.name,
                    contentType: formData.logo.type,
                    sizeInBytes: formData.logo.size,
                    width: 0, // Would be determined by upload service
                    height: 0, // Would be determined by upload service
                    uploadedAt: new Date().toISOString(),
                }
                await uploadCustomerLogo(newCustomer.id, logoData)
            }

            // Upload background image if provided
            if (formData.backgroundImage && newCustomer.id) {
                const backgroundData: CustomerBackgroundRequest = {
                    url: '', // This would be filled by the upload service
                    fileName: formData.backgroundImage.name,
                    originalFileName: formData.backgroundImage.name,
                    contentType: formData.backgroundImage.type,
                    sizeInBytes: formData.backgroundImage.size,
                    width: 0, // Would be determined by upload service
                    height: 0, // Would be determined by upload service
                    uploadedAt: new Date().toISOString(),
                }
                await uploadCustomerBackground(newCustomer.id, backgroundData)
            }

            toast.push(
                <Notification title="Success" type="success">
                    Customer "{formData.name}" created successfully
                </Notification>,
            )

            navigate('/admin/customers')
        } catch (error) {
            console.error('Error creating customer:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to create customer. Please try again.
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    // Render different step content based on current step
    const renderStepContent = () => {
        switch (step) {
            case 0: // Customer Information
                return (
                    <FormContainer>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem label="Customer Name">
                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter customer name"
                                />
                            </FormItem>

                            <FormItem
                                label="Subdomain"
                                extra={
                                    domainValidationMessage && (
                                        <div
                                            className={
                                                domainValidationMessage.includes(
                                                    'already',
                                                )
                                                    ? 'text-red-500'
                                                    : 'text-green-500'
                                            }
                                        >
                                            {domainValidationMessage}
                                        </div>
                                    )
                                }
                            >
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.subdomain}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'subdomain',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Enter subdomain"
                                        onBlur={validateDomain}
                                    />
                                    <Button
                                        loading={validating}
                                        onClick={validateDomain}
                                    >
                                        Check
                                    </Button>
                                </div>
                            </FormItem>
                        </div>

                        <FormItem label="Address">
                            <Input
                                value={formData.address}
                                onChange={(e) =>
                                    handleInputChange('address', e.target.value)
                                }
                                placeholder="Enter company address"
                            />
                        </FormItem>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem label="Legacy Business Network ID">
                                <Input
                                    value={formData.legacyBusinessNetworkID}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'legacyBusinessNetworkID',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter legacy business network ID"
                                />
                            </FormItem>

                            <FormItem label="Theme">
                                <div className="inline-flex items-center gap-2">
                                    {Object.entries(
                                        presetThemeSchemaConfig,
                                    ).map(([key, value]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            className={classNames(
                                                'h-8 w-8 rounded-full flex items-center justify-center border-2 border-white',
                                                formData.theme === key &&
                                                    'ring-2 ring-primary',
                                            )}
                                            style={{
                                                backgroundColor:
                                                    value.light.primary || '',
                                            }}
                                            onClick={() =>
                                                handleInputChange('theme', key)
                                            }
                                        >
                                            {formData.theme === key ? (
                                                <TbCheck className="text-neutral text-lg" />
                                            ) : (
                                                <></>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </FormItem>
                        </div>
                    </FormContainer>
                )

            case 1: // Portal Branding
                return (
                    <FormContainer>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem label="Portal Display Name">
                                <Input
                                    value={formData.portalDisplayName}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'portalDisplayName',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter portal display name"
                                />
                            </FormItem>

                            <FormItem label="Portal Display Sub Name">
                                <Input
                                    value={formData.portalDisplaySubName}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'portalDisplaySubName',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter portal display sub name"
                                />
                            </FormItem>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem label="Portal Display Page Sub Title">
                                <Input
                                    value={formData.portalDisplayPageSubTitle}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'portalDisplayPageSubTitle',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter portal display page sub title"
                                />
                            </FormItem>

                            <FormItem label="Portal Window Icon URL">
                                <Input
                                    value={formData.portalWindowIcon}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'portalWindowIcon',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter portal window icon URL"
                                />
                            </FormItem>
                        </div>

                        <FormItem label="Active Status">
                            <Switcher
                                checked={formData.isActive}
                                onChange={(checked: boolean) =>
                                    handleInputChange('isActive', checked)
                                }
                            />
                            <span className="ml-2 text-sm">
                                {formData.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </FormItem>
                    </FormContainer>
                )

            case 2: // Admin Information
                return (
                    <FormContainer>
                        <FormItem label="Admin Name">
                            <Input
                                value={formData.adminName}
                                onChange={(e) =>
                                    handleInputChange(
                                        'adminName',
                                        e.target.value,
                                    )
                                }
                                placeholder="Enter admin name"
                            />
                        </FormItem>

                        <FormItem label="Admin Email">
                            <Input
                                value={formData.adminEmail}
                                onChange={(e) =>
                                    handleInputChange(
                                        'adminEmail',
                                        e.target.value,
                                    )
                                }
                                placeholder="Enter admin email"
                                type="email"
                            />
                        </FormItem>

                        <Alert type="info" showIcon>
                            The admin will receive an email invitation to set
                            their password and access the customer portal.
                        </Alert>
                    </FormContainer>
                )

            case 3: // Assets & Review
                return (
                    <div>
                        <FormContainer className="mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem label="Company Logo">
                                    <Upload
                                        onChange={(files) =>
                                            handleFileChange(
                                                'logo',
                                                files?.[0] || null,
                                            )
                                        }
                                        fileList={
                                            formData.logo ? [formData.logo] : []
                                        }
                                    />
                                </FormItem>

                                <FormItem label="Background Image">
                                    <Upload
                                        onChange={(files) =>
                                            handleFileChange(
                                                'backgroundImage',
                                                files?.[0] || null,
                                            )
                                        }
                                        fileList={
                                            formData.backgroundImage
                                                ? [formData.backgroundImage]
                                                : []
                                        }
                                    />
                                </FormItem>
                            </div>
                        </FormContainer>

                        <Card className="mb-4">
                            <h5 className="mb-4">Customer Information</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="font-semibold">
                                        Customer Name
                                    </div>
                                    <div>
                                        {formData.name || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Subdomain
                                    </div>
                                    <div>
                                        {formData.subdomain || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">Address</div>
                                    <div>
                                        {formData.address || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">Theme</div>
                                    <div className="flex items-center">
                                        <div
                                            className="w-4 h-4 rounded mr-2"
                                            style={{
                                                backgroundColor:
                                                    presetThemeSchemaConfig[
                                                        formData.theme
                                                    ]?.light.primary ||
                                                    '#2a85ff',
                                            }}
                                        />
                                        {formData.theme}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="mb-4">
                            <h5 className="mb-4">Portal Branding</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="font-semibold">
                                        Portal Display Name
                                    </div>
                                    <div>
                                        {formData.portalDisplayName ||
                                            'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Portal Display Sub Name
                                    </div>
                                    <div>
                                        {formData.portalDisplaySubName ||
                                            'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Portal Page Sub Title
                                    </div>
                                    <div>
                                        {formData.portalDisplayPageSubTitle ||
                                            'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">Status</div>
                                    <div>
                                        {formData.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="mb-4">
                            <h5 className="mb-4">Admin Information</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="font-semibold">
                                        Admin Name
                                    </div>
                                    <div>
                                        {formData.adminName || 'Not specified'}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Admin Email
                                    </div>
                                    <div>
                                        {formData.adminEmail || 'Not specified'}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )

            default:
                return null
        }
    }

    // Check if current step is valid to proceed
    const isStepValid = () => {
        switch (step) {
            case 0: // Customer Information
                return (
                    formData.name &&
                    formData.subdomain &&
                    !domainValidationMessage?.includes('already')
                )
            case 1: // Portal Branding (optional fields)
                return true
            case 2: // Admin Information
                return formData.adminName && formData.adminEmail
            case 3: // Assets & Review
                return true
            default:
                return true
        }
    }

    return (
        <div className="container mx-auto">
            <Card>
                <div className="mb-6">
                    <h4>Create New Customer</h4>
                    <p className="text-gray-500">
                        Add a new customer and tenant admin
                    </p>
                </div>

                <div className="mb-6">
                    <Steps current={step}>
                        {steps.map((item) => (
                            <Steps.Item
                                key={item.title}
                                title={item.title}
                                description={item.description}
                            />
                        ))}
                    </Steps>
                </div>

                <div className="mb-6">{renderStepContent()}</div>

                <div className="flex justify-between">
                    <Button
                        variant="plain"
                        onClick={() =>
                            step > 0
                                ? setStep(step - 1)
                                : navigate('/admin/customers')
                        }
                        icon={<HiOutlineArrowLeft />}
                    >
                        {step > 0 ? 'Back' : 'Cancel'}
                    </Button>

                    <Button
                        variant="solid"
                        disabled={!isStepValid()}
                        loading={loading}
                        icon={
                            step === steps.length - 1 ? (
                                <HiOutlineCheck />
                            ) : (
                                <HiOutlineArrowRight />
                            )
                        }
                        onClick={() => {
                            if (step === steps.length - 1) {
                                handleSubmit()
                            } else {
                                setStep(step + 1)
                            }
                        }}
                    >
                        {step === steps.length - 1 ? 'Create Customer' : 'Next'}
                    </Button>
                </div>
            </Card>
        </div>
    )
}

export default CustomerCreateWizard
