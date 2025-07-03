import React, { useState } from 'react'
import {
    Card,
    Button,
    FormContainer,
    FormItem,
    Input,
    Select,
    Upload,
    Steps,
    Alert,
    Notification,
    toast,
} from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import {
    HiOutlineCheck,
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
} from 'react-icons/hi'
import useAuth from '@/auth/useAuth'

// Customer creation wizard as specified in the PRD
const CustomerCreateWizard = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(false)
    const [domainValidationMessage, setDomainValidationMessage] = useState('')

    // Form data state
    const [formData, setFormData] = useState({
        // Tenant Info
        tenantName: '',
        domain: '',
        region: '',

        // Admin Info
        adminName: '',
        adminEmail: '',

        // Branding
        logo: null,
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
    })

    // Wizard steps
    const steps = [
        {
            title: 'Tenant Information',
            description: 'Basic tenant details',
        },
        {
            title: 'Admin Information',
            description: 'Tenant admin account',
        },
        {
            title: 'Branding',
            description: 'Customize appearance',
        },
        {
            title: 'Review & Confirm',
            description: 'Verify and submit',
        },
    ]

    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value,
        })
    }

    // Mock domain validation through API
    const validateDomain = async () => {
        setValidating(true)

        // Simulate API call to check domain uniqueness
        setTimeout(() => {
            const isDomainTaken = [
                'acme.com',
                'example.com',
                'test.com',
            ].includes(formData.domain)

            if (isDomainTaken) {
                setDomainValidationMessage('This domain is already in use')
            } else if (formData.domain) {
                setDomainValidationMessage('Domain is available')
            }

            setValidating(false)
        }, 1000)
    }

    // Submit final data to API
    const handleSubmit = async () => {
        setLoading(true)

        // Simulate API call
        setTimeout(() => {
            toast.push(
                <Notification title="Success" type="success">
                    Customer created successfully
                </Notification>,
            )
            setLoading(false)
            navigate('/admin/customers')
        }, 1500)
    }

    // Render different step content based on current step
    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <FormContainer>
                        <FormItem label="Tenant Name" required>
                            <Input
                                value={formData.tenantName}
                                onChange={(e) =>
                                    handleInputChange(
                                        'tenantName',
                                        e.target.value,
                                    )
                                }
                                placeholder="Enter tenant name"
                            />
                        </FormItem>

                        <FormItem
                            label="Domain"
                            required
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
                                    value={formData.domain}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'domain',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Enter domain name"
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

                        <FormItem label="Region" required>
                            <Select
                                options={[
                                    { value: 'us-east', label: 'US East' },
                                    { value: 'us-west', label: 'US West' },
                                    { value: 'eu', label: 'Europe' },
                                    { value: 'asia', label: 'Asia Pacific' },
                                ]}
                                value={formData.region}
                                onChange={(option) =>
                                    handleInputChange('region', option.value)
                                }
                                placeholder="Select region"
                            />
                        </FormItem>
                    </FormContainer>
                )

            case 1:
                return (
                    <FormContainer>
                        <FormItem label="Admin Name" required>
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

                        <FormItem label="Admin Email" required>
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
                            their password.
                        </Alert>
                    </FormContainer>
                )

            case 2:
                return (
                    <FormContainer>
                        <FormItem label="Company Logo">
                            <Upload />
                        </FormItem>

                        <FormItem label="Primary Color">
                            <Input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) =>
                                    handleInputChange(
                                        'primaryColor',
                                        e.target.value,
                                    )
                                }
                            />
                        </FormItem>

                        <FormItem label="Secondary Color">
                            <Input
                                type="color"
                                value={formData.secondaryColor}
                                onChange={(e) =>
                                    handleInputChange(
                                        'secondaryColor',
                                        e.target.value,
                                    )
                                }
                            />
                        </FormItem>
                    </FormContainer>
                )

            case 3:
                return (
                    <div>
                        <Card className="mb-4">
                            <h5 className="mb-4">Tenant Information</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="font-semibold">
                                        Tenant Name
                                    </div>
                                    <div>{formData.tenantName}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Domain</div>
                                    <div>{formData.domain}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">Region</div>
                                    <div>{formData.region}</div>
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
                                    <div>{formData.adminName}</div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Admin Email
                                    </div>
                                    <div>{formData.adminEmail}</div>
                                </div>
                            </div>
                        </Card>

                        <Card className="mb-4">
                            <h5 className="mb-4">Branding</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="font-semibold">
                                        Primary Color
                                    </div>
                                    <div className="flex items-center">
                                        <div
                                            className="w-6 h-6 rounded mr-2"
                                            style={{
                                                backgroundColor:
                                                    formData.primaryColor,
                                            }}
                                        />
                                        {formData.primaryColor}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold">
                                        Secondary Color
                                    </div>
                                    <div className="flex items-center">
                                        <div
                                            className="w-6 h-6 rounded mr-2"
                                            style={{
                                                backgroundColor:
                                                    formData.secondaryColor,
                                            }}
                                        />
                                        {formData.secondaryColor}
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
            case 0:
                return (
                    formData.tenantName &&
                    formData.domain &&
                    formData.region &&
                    !domainValidationMessage?.includes('already')
                )
            case 1:
                return formData.adminName && formData.adminEmail
            case 2:
                return true // Branding is optional
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
