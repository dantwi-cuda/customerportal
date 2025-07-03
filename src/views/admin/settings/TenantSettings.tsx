import { useState, useEffect } from 'react'
import {
    Card,
    Tabs,
    Input,
    Upload,
    Button,
    FormItem,
    FormContainer,
    Select,
} from '@/components/ui'
import { Form, Formik } from 'formik'
import * as Yup from 'yup'
import {
    getTenantSettings,
    updateTenantSettings,
} from '@/services/CustomerService'
import {
    HiOutlineOfficeBuilding,
    HiOutlineMail,
    HiOutlineColorSwatch,
    HiOutlineCog,
} from 'react-icons/hi'

interface GeneralSettingsForm {
    tenantName: string
    contactEmail: string
    contactPhone: string
    address: string
    city: string
    state: string
    country: string
    zipCode: string
}

interface BrandingSettingsForm {
    primaryColor: string
    secondaryColor: string
    logo: File | null
    favicon: File | null
}

interface NotificationSettingsForm {
    emailNotifications: boolean
    userCreationNotification: boolean
    weeklyReportNotification: boolean
}

interface SecuritySettingsForm {
    mfaRequired: boolean
    passwordPolicy: string
    sessionTimeout: number
}

const generalValidationSchema = Yup.object().shape({
    tenantName: Yup.string().required('Tenant name is required'),
    contactEmail: Yup.string()
        .email('Invalid email')
        .required('Contact email is required'),
    contactPhone: Yup.string(),
    address: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),
    country: Yup.string(),
    zipCode: Yup.string(),
})

const TenantSettings = () => {
    const [activeTab, setActiveTab] = useState('general')
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true)
                const data = await getTenantSettings()
                setSettings(data)
            } catch (error) {
                console.error('Failed to fetch tenant settings:', error)
                // In a real app, show an error notification here
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [])

    const generalInitialValues: GeneralSettingsForm = {
        tenantName: settings?.general?.tenantName || '',
        contactEmail: settings?.general?.contactEmail || '',
        contactPhone: settings?.general?.contactPhone || '',
        address: settings?.general?.address || '',
        city: settings?.general?.city || '',
        state: settings?.general?.state || '',
        country: settings?.general?.country || '',
        zipCode: settings?.general?.zipCode || '',
    }

    const handleGeneralSubmit = async (
        values: GeneralSettingsForm,
        { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
    ) => {
        try {
            await updateTenantSettings({
                general: values,
            })
            // In a real app, show success notification
        } catch (error) {
            console.error('Failed to update general settings:', error)
            // In a real app, show error notification
        } finally {
            setSubmitting(false)
        }
    }

    // Content for the tabs
    const tabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <Formik
                        initialValues={generalInitialValues}
                        validationSchema={generalValidationSchema}
                        onSubmit={handleGeneralSubmit}
                        enableReinitialize
                    >
                        {({
                            values,
                            touched,
                            errors,
                            isSubmitting,
                            handleChange,
                        }) => (
                            <Form>
                                <FormContainer>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormItem
                                            label="Organization Name"
                                            invalid={
                                                errors.tenantName &&
                                                touched.tenantName
                                            }
                                            errorMessage={errors.tenantName}
                                        >
                                            <Input
                                                name="tenantName"
                                                placeholder="Enter organization name"
                                                value={values.tenantName}
                                                onChange={handleChange}
                                            />
                                        </FormItem>

                                        <FormItem
                                            label="Contact Email"
                                            invalid={
                                                errors.contactEmail &&
                                                touched.contactEmail
                                            }
                                            errorMessage={errors.contactEmail}
                                        >
                                            <Input
                                                name="contactEmail"
                                                placeholder="Enter contact email"
                                                value={values.contactEmail}
                                                onChange={handleChange}
                                            />
                                        </FormItem>
                                    </div>

                                    <FormItem label="Contact Phone">
                                        <Input
                                            name="contactPhone"
                                            placeholder="Enter contact phone number"
                                            value={values.contactPhone}
                                            onChange={handleChange}
                                        />
                                    </FormItem>

                                    <div className="border-t border-gray-200 my-4 pt-4">
                                        <h5 className="mb-4">
                                            Address Information
                                        </h5>

                                        <FormItem label="Street Address">
                                            <Input
                                                name="address"
                                                placeholder="Enter street address"
                                                value={values.address}
                                                onChange={handleChange}
                                            />
                                        </FormItem>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormItem label="City">
                                                <Input
                                                    name="city"
                                                    placeholder="Enter city"
                                                    value={values.city}
                                                    onChange={handleChange}
                                                />
                                            </FormItem>

                                            <FormItem label="State/Province">
                                                <Input
                                                    name="state"
                                                    placeholder="Enter state/province"
                                                    value={values.state}
                                                    onChange={handleChange}
                                                />
                                            </FormItem>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormItem label="Country">
                                                <Input
                                                    name="country"
                                                    placeholder="Enter country"
                                                    value={values.country}
                                                    onChange={handleChange}
                                                />
                                            </FormItem>

                                            <FormItem label="ZIP/Postal Code">
                                                <Input
                                                    name="zipCode"
                                                    placeholder="Enter ZIP/postal code"
                                                    value={values.zipCode}
                                                    onChange={handleChange}
                                                />
                                            </FormItem>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={isSubmitting}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                )

            case 'branding':
                return (
                    <div>
                        <p className="mb-4 text-gray-500">
                            Customize the appearance of your portal with your
                            organization's branding.
                        </p>

                        {/* This is just a placeholder - in a real app, this would be a full form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block mb-2 font-medium">
                                    Organization Logo
                                </label>
                                <Upload />
                                <p className="text-xs text-gray-500 mt-1">
                                    Recommended size: 250x50px, PNG or SVG
                                    format
                                </p>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Favicon
                                </label>
                                <Upload />
                                <p className="text-xs text-gray-500 mt-1">
                                    Recommended size: 32x32px, ICO format
                                </p>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Primary Color
                                </label>
                                <Input
                                    type="color"
                                    className="h-10"
                                    value="#4F46E5"
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Secondary Color
                                </label>
                                <Input
                                    type="color"
                                    className="h-10"
                                    value="#10B981"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button variant="solid">Save Changes</Button>
                        </div>
                    </div>
                )

            case 'notifications':
                return (
                    <div>
                        <p className="mb-4 text-gray-500">
                            Configure notification preferences for your
                            organization.
                        </p>

                        {/* This is just a placeholder - in a real app, this would be a full form */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h6>Email Notifications</h6>
                                    <p className="text-gray-500 text-sm">
                                        Receive important updates via email
                                    </p>
                                </div>
                                <div>
                                    <Switch checked={true} />
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <h6>New User Notification</h6>
                                    <p className="text-gray-500 text-sm">
                                        Get notified when a new user is created
                                    </p>
                                </div>
                                <div>
                                    <Switch checked={false} />
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <div>
                                    <h6>Weekly Report Summary</h6>
                                    <p className="text-gray-500 text-sm">
                                        Receive weekly usage reports
                                    </p>
                                </div>
                                <div>
                                    <Switch checked={true} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button variant="solid">Save Changes</Button>
                        </div>
                    </div>
                )

            case 'security':
                return (
                    <div>
                        <p className="mb-4 text-gray-500">
                            Configure security settings for your organization.
                        </p>

                        {/* This is just a placeholder - in a real app, this would be a full form */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h6>Require Multi-Factor Authentication</h6>
                                    <p className="text-gray-500 text-sm">
                                        Enforce MFA for all users
                                    </p>
                                </div>
                                <div>
                                    <Switch checked={true} />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Password Policy
                                </label>
                                <Select defaultValue="strong">
                                    <option value="basic">
                                        Basic - 8+ characters
                                    </option>
                                    <option value="medium">
                                        Medium - 8+ chars with numbers
                                    </option>
                                    <option value="strong">
                                        Strong - 8+ chars with numbers and
                                        symbols
                                    </option>
                                    <option value="custom">Custom</option>
                                </Select>
                            </div>

                            <div>
                                <label className="block mb-2 font-medium">
                                    Session Timeout (minutes)
                                </label>
                                <Input
                                    type="number"
                                    min="5"
                                    max="1440"
                                    defaultValue={60}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button variant="solid">Save Changes</Button>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    // Placeholder component - we'd normally import this
    const Switch = ({ checked = false }) => (
        <div
            className={`w-11 h-6 rounded-full p-1 cursor-pointer ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
        >
            <div
                className={`h-4 w-4 rounded-full bg-white transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </div>
    )

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>

            <Card>
                <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                    <Tabs.TabList>
                        <Tabs.TabNav
                            value="general"
                            icon={<HiOutlineOfficeBuilding />}
                        >
                            General
                        </Tabs.TabNav>
                        <Tabs.TabNav
                            value="branding"
                            icon={<HiOutlineColorSwatch />}
                        >
                            Branding
                        </Tabs.TabNav>
                        <Tabs.TabNav
                            value="notifications"
                            icon={<HiOutlineMail />}
                        >
                            Notifications
                        </Tabs.TabNav>
                        <Tabs.TabNav value="security" icon={<HiOutlineCog />}>
                            Security
                        </Tabs.TabNav>
                    </Tabs.TabList>
                    <div className="p-4">{tabContent()}</div>
                </Tabs>
            </Card>
        </div>
    )
}

export default TenantSettings
