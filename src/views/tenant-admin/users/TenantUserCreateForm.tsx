import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Button,
    Input,
    Select,
    FormContainer,
    FormItem,
    Alert,
} from '@/components/ui' // Added Alert
import { Card } from '@/components/ui/Card'
import { AdaptiveCard } from '@/components/shared'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import UserService from '@/services/UserService'
import RoleService from '@/services/RoleService' // Import RoleService
import useAuth from '@/auth/useAuth'
// import { TENANT_ADMIN, END_USER } from '@/constants/roles.constant' // Comment out direct constant usage
import { CreateUserRequest, UserDto } from '@/@types/user'
import { RoleDto as TenantRoleDto } from '@/@types/role' // Use RoleDto for tenant roles
import { HiOutlineUserAdd } from 'react-icons/hi'
import { Notification } from '@/components/ui/Notification'
import toast from '@/components/ui/toast/toast'

const userStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string()
        .email('Invalid email format')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
    roles: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one role must be selected')
        .required('Role is required'), // Array of role names
    status: Yup.string().required('Status is required'),
})

const TenantUserCreateForm = () => {
    const navigate = useNavigate()
    const { user: tenantAdminUser } = useAuth()
    const [tenantRoles, setTenantRoles] = useState<TenantRoleDto[]>([])
    const [loadingRoles, setLoadingRoles] = useState(true)

    useEffect(() => {
        const fetchTenantRoles = async () => {
            if (tenantAdminUser && (tenantAdminUser as any).tenantId) {
                setLoadingRoles(true)
                try {
                    const roles = await RoleService.getRoles({
                        tenantId: (tenantAdminUser as any).tenantId,
                        type: 'TENANT',
                    })
                    setTenantRoles(roles)
                } catch (error) {
                    console.error('Failed to fetch tenant roles:', error)
                    toast.push(
                        <Notification
                            title="Error"
                            type="danger"
                            duration={3000}
                        >
                            Failed to load assignable roles.
                        </Notification>,
                    )
                } finally {
                    setLoadingRoles(false)
                }
            }
        }
        fetchTenantRoles()
    }, [tenantAdminUser])

    const tenantAssignableRolesOptions = tenantRoles.map((role) => ({
        value: role.name, // Use role name instead of role.id
        label: role.name,
    }))

    const initialValues = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: [], // Don't default to any role, let user select
        status: 'active',
    }

    const handleSubmit = async (
        values: typeof initialValues,
        { setSubmitting, setFieldError }: any,
    ) => {
        console.log('Form submission started with values:', values)
        setSubmitting(true)

        // Validation
        if (!tenantAdminUser || !(tenantAdminUser as any).tenantId) {
            toast.push(
                <Notification title="Error" type="danger" duration={2500}>
                    Tenant information is missing. Cannot create user.
                </Notification>,
            )
            setSubmitting(false)
            return
        }

        if (!values.roles || values.roles.length === 0) {
            setFieldError('roles', 'At least one role must be selected')
            setSubmitting(false)
            return
        }

        const createUserDto: UserDto = {
            name: values.name,
            email: values.email,
            status: values.status === 'active' ? 'Active' : 'Inactive', // String status as shown in Postman
            isActive: values.status === 'active', // Boolean isActive
            isCustomerUser: true,
            isCCIUser: false, // Tenant users are not CCI users
            tenantId: Number((tenantAdminUser as any).tenantId), // Convert to number
            roles: values.roles, // Include roles in user object as shown in Postman
            createdAt: new Date().toISOString(), // Add createdAt timestamp
        }

        const createPayload: CreateUserRequest = {
            user: createUserDto,
            password: values.password,
            roles: values.roles, // These should be role names at the top level too
        }

        console.log('=== PAYLOAD BEING SENT ===')
        console.log(JSON.stringify(createPayload, null, 2))
        console.log('=== END PAYLOAD ===')

        try {
            console.log('Sending payload to API:', createPayload)
            await UserService.createUser(createPayload)
            toast.push(
                <Notification
                    title="User Created"
                    type="success"
                    duration={2500}
                >
                    User {values.name} has been created successfully.
                </Notification>,
            )
            navigate('/tenantportal/tenant/users')
        } catch (error: any) {
            console.error('Failed to create user:', error)
            console.error('Error response:', error.response?.data)

            let errorMessage = 'An unexpected error occurred.'

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message
                // Handle specific error cases
                if (errorMessage.includes('already taken')) {
                    errorMessage = `The email address is already registered. Please use a different email address.`
                }
            } else if (error.response?.data?.errors) {
                // Handle validation errors
                const errors = error.response.data.errors
                errorMessage = Object.values(errors).flat().join(', ')
            } else if (error.response?.status === 400) {
                errorMessage =
                    'Invalid data provided. Please check all fields and try again.'
            } else if (error.message) {
                errorMessage = error.message
            }

            toast.push(
                <Notification
                    title="Creation Failed"
                    type="danger"
                    duration={5000}
                >
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AdaptiveCard className="h-full" bodyClass="h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="mb-4 text-lg font-semibold">
                    Create New Tenant User
                </h3>
            </div>
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize // Important for when tenantRoles load
            >
                {({
                    values,
                    touched,
                    errors,
                    isSubmitting,
                    setFieldValue,
                    isValid,
                }) => (
                    <Form>
                        {/* Debug info - remove in production */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                                <p>
                                    <strong>Debug Info:</strong>
                                </p>
                                <p>Form Valid: {isValid ? 'Yes' : 'No'}</p>
                                <p>Values: {JSON.stringify(values, null, 2)}</p>
                                <p>Errors: {JSON.stringify(errors, null, 2)}</p>
                            </div>
                        )}
                        <FormContainer>
                            <Card className="p-6 mb-6">
                                <h4 className="text-md font-semibold mb-4">
                                    User Information
                                </h4>
                                <FormItem
                                    label="Name"
                                    invalid={!!(errors.name && touched.name)}
                                    errorMessage={errors.name as string}
                                >
                                    <Field name="name">
                                        {({ field, form }: any) => (
                                            <Input
                                                type="text"
                                                placeholder="Full Name"
                                                value={field.value}
                                                onChange={(e) =>
                                                    form.setFieldValue(
                                                        field.name,
                                                        e.target.value,
                                                    )
                                                }
                                                onBlur={() =>
                                                    form.setFieldTouched(
                                                        field.name,
                                                        true,
                                                    )
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                                <FormItem
                                    label="Email"
                                    invalid={!!(errors.email && touched.email)}
                                    errorMessage={errors.email as string}
                                >
                                    <Field name="email">
                                        {({ field, form }: any) => (
                                            <Input
                                                type="email"
                                                placeholder="user@example.com"
                                                value={field.value}
                                                onChange={(e) =>
                                                    form.setFieldValue(
                                                        field.name,
                                                        e.target.value,
                                                    )
                                                }
                                                onBlur={() =>
                                                    form.setFieldTouched(
                                                        field.name,
                                                        true,
                                                    )
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                            </Card>

                            <Card className="p-6 mb-6">
                                <h4 className="text-md font-semibold mb-4">
                                    Security & Access
                                </h4>
                                <FormItem
                                    label="Password"
                                    invalid={
                                        !!(errors.password && touched.password)
                                    }
                                    errorMessage={errors.password as string}
                                >
                                    <Field name="password">
                                        {({ field, form }: any) => (
                                            <Input
                                                type="password"
                                                placeholder="Min 8 characters"
                                                value={field.value}
                                                onChange={(e) =>
                                                    form.setFieldValue(
                                                        field.name,
                                                        e.target.value,
                                                    )
                                                }
                                                onBlur={() =>
                                                    form.setFieldTouched(
                                                        field.name,
                                                        true,
                                                    )
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                                <FormItem
                                    label="Confirm Password"
                                    invalid={
                                        !!(
                                            errors.confirmPassword &&
                                            touched.confirmPassword
                                        )
                                    }
                                    errorMessage={
                                        errors.confirmPassword as string
                                    }
                                >
                                    <Field name="confirmPassword">
                                        {({ field, form }: any) => (
                                            <Input
                                                type="password"
                                                placeholder="Confirm password"
                                                value={field.value}
                                                onChange={(e) =>
                                                    form.setFieldValue(
                                                        field.name,
                                                        e.target.value,
                                                    )
                                                }
                                                onBlur={() =>
                                                    form.setFieldTouched(
                                                        field.name,
                                                        true,
                                                    )
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                                <FormItem
                                    label="Roles"
                                    invalid={!!(errors.roles && touched.roles)}
                                    errorMessage={errors.roles as string}
                                >
                                    {loadingRoles ? (
                                        <p>Loading roles...</p>
                                    ) : tenantAssignableRolesOptions.length ===
                                      0 ? (
                                        <Alert
                                            type="info"
                                            showIcon
                                            className="mb-4"
                                        >
                                            No tenant-specific roles available.
                                            Please create roles in the Role
                                            Management section first.
                                        </Alert>
                                    ) : (
                                        <Field name="roles">
                                            {({ field, form }: any) => (
                                                <Select
                                                    isMulti
                                                    options={
                                                        tenantAssignableRolesOptions
                                                    }
                                                    value={tenantAssignableRolesOptions.filter(
                                                        (option) =>
                                                            field.value?.includes(
                                                                option.value,
                                                            ),
                                                    )}
                                                    onChange={(
                                                        selectedOptions: any,
                                                    ) =>
                                                        form.setFieldValue(
                                                            field.name,
                                                            selectedOptions
                                                                ? selectedOptions.map(
                                                                      (
                                                                          o: any,
                                                                      ) =>
                                                                          o.value,
                                                                  )
                                                                : [],
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    )}
                                </FormItem>
                                <FormItem
                                    label="Status"
                                    invalid={
                                        !!(errors.status && touched.status)
                                    }
                                    errorMessage={errors.status as string}
                                >
                                    <Field name="status">
                                        {({ field, form }: any) => (
                                            <Select
                                                options={userStatusOptions}
                                                value={userStatusOptions.find(
                                                    (option) =>
                                                        option.value ===
                                                        field.value,
                                                )}
                                                onChange={(
                                                    selectedOption: any,
                                                ) =>
                                                    form.setFieldValue(
                                                        field.name,
                                                        selectedOption
                                                            ? selectedOption.value
                                                            : null,
                                                    )
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                            </Card>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="plain"
                                    onClick={() =>
                                        navigate('/tenantportal/tenant/users')
                                    }
                                    disabled={isSubmitting || loadingRoles}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    color="blue-600"
                                    type="submit"
                                    loading={isSubmitting}
                                    disabled={
                                        isSubmitting ||
                                        loadingRoles ||
                                        tenantAssignableRolesOptions.length ===
                                            0
                                    }
                                    icon={<HiOutlineUserAdd />}
                                >
                                    {isSubmitting
                                        ? 'Creating...'
                                        : 'Create User'}
                                </Button>
                            </div>
                        </FormContainer>
                    </Form>
                )}
            </Formik>
        </AdaptiveCard>
    )
}

export default TenantUserCreateForm
