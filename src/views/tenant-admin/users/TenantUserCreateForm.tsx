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
        .required('Role is required'),
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
        value: role.id, // Assuming role.id is the value to be stored
        label: role.name,
    }))

    const initialValues = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: tenantRoles.length > 0 ? [tenantRoles[0].id] : [], // Default to first tenant role if available
        status: 'active',
    }

    const handleSubmit = async (
        values: typeof initialValues,
        { setSubmitting, setFieldError }: any,
    ) => {
        setSubmitting(true)
        if (!tenantAdminUser || !(tenantAdminUser as any).tenantId) {
            toast.push(
                <Notification title="Error" type="danger" duration={2500}>
                    Tenant information is missing. Cannot create user.
                </Notification>,
            )
            setSubmitting(false)
            return
        }

        const createUserDto: UserDto = {
            name: values.name,
            email: values.email,
            status: values.status,
            isCustomerUser: true,
            isCCIUser: false,
            tenantId: (tenantAdminUser as any).tenantId,
        }

        const createPayload: CreateUserRequest = {
            user: createUserDto,
            password: values.password,
            roles: values.roles, // These should be role IDs
        }

        try {
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
            const errorMessage =
                error.response?.data?.message || 'An unexpected error occurred.'
            toast.push(
                <Notification
                    title="Creation Failed"
                    type="danger"
                    duration={2500}
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
                {({ values, touched, errors, isSubmitting, setFieldValue }) => (
                    <Form>
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
                                    <Field
                                        type="text"
                                        name="name"
                                        component={Input}
                                        placeholder="Full Name"
                                    />
                                </FormItem>
                                <FormItem
                                    label="Email"
                                    invalid={!!(errors.email && touched.email)}
                                    errorMessage={errors.email as string}
                                >
                                    <Field
                                        type="email"
                                        name="email"
                                        component={Input}
                                        placeholder="user@example.com"
                                    />
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
                                    <Field
                                        type="password"
                                        name="password"
                                        component={Input}
                                        placeholder="Min 8 characters"
                                    />
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
                                    <Field
                                        type="password"
                                        name="confirmPassword"
                                        component={Input}
                                        placeholder="Confirm password"
                                    />
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
