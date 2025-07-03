import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    Button,
    Input,
    Select,
    FormContainer,
    FormItem,
    Tabs,
} from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { AdaptiveCard } from '@/components/shared' // Corrected import name
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import UserService from '@/services/UserService'
import useAuth from '@/auth/useAuth'
import { TENANT_ADMIN, END_USER } from '@/constants/roles.constant'
import { UpdateUserRequest, UserDto } from '@/@types/user'
import {
    HiOutlineUser,
    HiOutlineLockClosed,
    HiOutlineSave,
} from 'react-icons/hi'
import { Notification } from '@/components/ui/Notification' // Corrected: Keep Notification import
import toast from '@/components/ui/toast/toast' // Corrected: Add separate import for toast
import { Loading } from '@/components/shared'

const { TabNav, TabList, TabContent } = Tabs

const tenantAssignableRolesOptions = [
    { value: TENANT_ADMIN, label: 'Tenant Admin' },
    { value: END_USER, label: 'End User' },
]

const userStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]

const userDetailsValidationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string()
        .email('Invalid email format')
        .required('Email is required'),
    roles: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one role must be selected')
        .required('Role is required'),
    status: Yup.string().required('Status is required'),
})

const passwordChangeValidationSchema = Yup.object().shape({
    newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match') // Removed null
        .required('Confirm password is required'),
})

const TenantUserEditForm = () => {
    const navigate = useNavigate()
    const { userId } = useParams<{ userId: string }>()
    const { user: tenantAdminUser } = useAuth()

    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<UserDto | null>(null)
    const [activeTab, setActiveTab] = useState('details')

    const fetchUser = useCallback(async () => {
        if (!userId) return
        setLoading(true)
        try {
            const fetchedUser = await UserService.getUser(userId)
            // Ensure the fetched user belongs to the current tenant admin
            if (fetchedUser.tenantId !== (tenantAdminUser as any)?.tenantId) {
                toast.push(
                    <Notification
                        title="Access Denied"
                        type="danger"
                        duration={3000}
                    >
                        You do not have permission to edit this user.
                    </Notification>,
                )
                navigate('/tenantportal/tenant/users')
                return
            }
            setUser(fetchedUser)
        } catch (error) {
            console.error('Failed to fetch user:', error)
            toast.push(
                <Notification title="Fetch Error" type="danger" duration={3000}>
                    Failed to load user data.
                </Notification>,
            )
            navigate('/tenantportal/tenant/users')
        } finally {
            setLoading(false)
        }
    }, [userId, navigate, tenantAdminUser])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    const handleUserDetailsSubmit = async (
        values: any,
        { setSubmitting, setFieldError }: any,
    ) => {
        if (!userId) return
        setSubmitting(true)

        const updateUserDto: UserDto = {
            id: userId,
            name: values.name,
            email: values.email,
            status: values.status,
            isCustomerUser: true, // Fixed for tenant admin scope
            isCCIUser: false, // Fixed for tenant admin scope
            // tenantId should not be changed by tenant admin
        }

        const updatePayload: UpdateUserRequest = {
            user: updateUserDto,
            roles: values.roles,
        }

        try {
            await UserService.updateUser(userId, updatePayload)
            toast.push(
                <Notification
                    title="User Updated"
                    type="success"
                    duration={2500}
                >
                    User details updated successfully.
                </Notification>,
            )
            fetchUser() // Re-fetch user to get updated data
        } catch (error: any) {
            console.error('Failed to update user details:', error)
            const errorMessage =
                error.response?.data?.message || 'An unexpected error occurred.'
            // setFieldError('generalDetails', errorMessage) // Commented out as generalDetails is not a field
            toast.push(
                <Notification
                    title="Update Failed"
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

    const handlePasswordChangeSubmit = async (
        values: any,
        { setSubmitting, setFieldError, resetForm }: any,
    ) => {
        if (!userId) return
        setSubmitting(true)

        try {
            await UserService.resetPassword(userId, values.newPassword)
            toast.push(
                <Notification
                    title="Password Updated"
                    type="success"
                    duration={2500}
                >
                    Password updated successfully.
                </Notification>,
            )
            resetForm()
        } catch (error: any) {
            console.error('Failed to update password:', error)
            const errorMessage =
                error.response?.data?.message || 'An unexpected error occurred.'
            // setFieldError('generalPassword', errorMessage) // Commented out as generalPassword is not a field
            toast.push(
                <Notification
                    title="Password Update Failed"
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

    if (loading) {
        return <Loading loading={true} />
    }

    if (!user) {
        return <div className="p-4">User not found or access denied.</div>
    }

    const initialUserDetailsValues = {
        name: user.name || '',
        email: user.email || '',
        roles: user.roles || [],
        status: user.status ? user.status.toLowerCase() : 'active', // Normalize to lowercase
    }

    const initialPasswordChangeValues = {
        newPassword: '',
        confirmPassword: '',
    }

    return (
        <AdaptiveCard className="h-full" bodyClass="h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="mb-4 text-lg font-semibold">
                    Edit Tenant User: {user.name}
                </h3>
            </div>
            <Tabs value={activeTab} onChange={setActiveTab}>
                <TabList>
                    <TabNav value="details" icon={<HiOutlineUser />}>
                        Details
                    </TabNav>
                    <TabNav value="password" icon={<HiOutlineLockClosed />}>
                        Change Password
                    </TabNav>
                </TabList>
                <div className="p-4">
                    <TabContent value="details">
                        <Formik
                            initialValues={initialUserDetailsValues}
                            validationSchema={userDetailsValidationSchema}
                            onSubmit={handleUserDetailsSubmit}
                            enableReinitialize
                        >
                            {({
                                values,
                                touched,
                                errors,
                                isSubmitting,
                                setFieldValue,
                            }) => (
                                <Form>
                                    <FormContainer>
                                        {/* {errors.generalDetails && ( // Commented out as generalDetails is not a field
                                            <Notification
                                                type="danger"
                                                className="mb-4"
                                            >
                                                {errors.generalDetails}
                                            </Notification>
                                        )} */}
                                        <Card className="p-6 mb-6">
                                            <h4 className="text-md font-semibold mb-4">
                                                User Information
                                            </h4>
                                            <FormItem
                                                label="Name"
                                                invalid={
                                                    !!(
                                                        errors.name &&
                                                        touched.name
                                                    )
                                                }
                                                errorMessage={
                                                    errors.name as string
                                                }
                                            >
                                                <Field name="name">
                                                    {({ field }: any) => (
                                                        <Input
                                                            {...field}
                                                            type="text"
                                                        />
                                                    )}
                                                </Field>
                                            </FormItem>
                                            <FormItem
                                                label="Email"
                                                invalid={
                                                    !!(
                                                        errors.email &&
                                                        touched.email
                                                    )
                                                }
                                                errorMessage={
                                                    errors.email as string
                                                }
                                            >
                                                <Field name="email">
                                                    {({ field }: any) => (
                                                        <Input
                                                            {...field}
                                                            type="email"
                                                        />
                                                    )}
                                                </Field>
                                            </FormItem>
                                        </Card>
                                        <Card className="p-6 mb-6">
                                            <h4 className="text-md font-semibold mb-4">
                                                Access Control
                                            </h4>
                                            <FormItem
                                                label="Roles"
                                                invalid={
                                                    !!(
                                                        errors.roles &&
                                                        touched.roles
                                                    )
                                                }
                                                errorMessage={
                                                    errors.roles as string
                                                }
                                            >
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
                                            </FormItem>
                                            <FormItem
                                                label="Status"
                                                invalid={
                                                    !!(
                                                        errors.status &&
                                                        touched.status
                                                    )
                                                }
                                                errorMessage={
                                                    errors.status as string
                                                }
                                            >
                                                <Field name="status">
                                                    {({ field, form }: any) => (
                                                        <Select
                                                            options={
                                                                userStatusOptions
                                                            }
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
                                                    navigate(
                                                        '/tenantportal/tenant/users',
                                                    )
                                                }
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="solid"
                                                color="blue-600"
                                                type="submit"
                                                loading={isSubmitting}
                                                icon={<HiOutlineSave />}
                                            >
                                                {isSubmitting
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </FormContainer>
                                </Form>
                            )}
                        </Formik>
                    </TabContent>
                    <TabContent value="password">
                        <Formik
                            initialValues={initialPasswordChangeValues}
                            validationSchema={passwordChangeValidationSchema}
                            onSubmit={handlePasswordChangeSubmit}
                        >
                            {({ touched, errors, isSubmitting }) => (
                                <Form>
                                    <FormContainer>
                                        {/* {errors.generalPassword && ( // Commented out as generalPassword is not a field
                                            <Notification
                                                type="danger"
                                                className="mb-4"
                                            >
                                                {errors.generalPassword}
                                            </Notification>
                                        )} */}
                                        <Card className="p-6">
                                            <h4 className="text-md font-semibold mb-4">
                                                Set New Password
                                            </h4>
                                            <FormItem
                                                label="New Password"
                                                invalid={
                                                    !!(
                                                        errors.newPassword &&
                                                        touched.newPassword
                                                    )
                                                }
                                                errorMessage={
                                                    errors.newPassword as string
                                                }
                                            >
                                                <Field
                                                    type="password"
                                                    name="newPassword"
                                                    component={Input}
                                                    placeholder="Min 8 characters"
                                                />
                                            </FormItem>
                                            <FormItem
                                                label="Confirm New Password"
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
                                                    placeholder="Confirm new password"
                                                />
                                            </FormItem>
                                        </Card>
                                        <div className="mt-6 flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="plain"
                                                onClick={() =>
                                                    navigate(
                                                        '/tenantportal/tenant/users',
                                                    )
                                                }
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="solid"
                                                color="blue-600"
                                                type="submit"
                                                loading={isSubmitting}
                                                icon={<HiOutlineLockClosed />}
                                            >
                                                {isSubmitting
                                                    ? 'Updating...'
                                                    : 'Update Password'}
                                            </Button>
                                        </div>
                                    </FormContainer>
                                </Form>
                            )}
                        </Formik>
                    </TabContent>
                </div>
            </Tabs>
        </AdaptiveCard> // Corrected component name
    )
}

export default TenantUserEditForm
