import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    FormItem,
    Checkbox,
    Notification,
    toast,
    Tabs,
    Spinner,
} from '@/components/ui'
import UserService from '@/services/UserService'
import RoleService from '@/services/RoleService'
import { useNavigate, useParams } from 'react-router-dom'
import type { UserDto, UpdateUserRequest } from '@/@types/user'
import type { RoleDto } from '@/@types/role'
import { useForm, Controller } from 'react-hook-form'
import ReactSelect from 'react-select'
import '@/assets/styles/roles-select.css'

const { TabNav, TabList, TabContent } = Tabs

// Define the form values type
type UserFormValues = {
    name: string
    email: string
    isCustomerUser: boolean
    isCCIUser: boolean
    roles: string[]
}

const UserEditForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<UserDto | null>(null)
    const [roles, setRoles] = useState<RoleDto[]>([])
    const [resetPasswordVisible, setResetPasswordVisible] = useState(false)
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    })
    const [fetchError, setFetchError] = useState<string | null>(null)

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserFormValues>()

    useEffect(() => {
        if (id) {
            // Load data immediately without retry mechanism for now
            fetchUser(id)
            fetchRoles()
        }
    }, [id])

    // Effect to set form values when user data is loaded
    useEffect(() => {
        if (user) {
            console.log('Setting form values with user data:', user)
            console.log('User roles before reset:', user.roles)

            reset({
                name: user.name,
                email: user.email,
                isCustomerUser: user.isCustomerUser,
                isCCIUser: user.isCCIUser,
                roles: user.roles || [],
            })

            console.log('Form reset with roles:', user.roles || [])
        }
    }, [user, reset])

    const fetchUser = async (userId: string) => {
        try {
            setLoading(true)
            setFetchError(null)
            console.log(`Fetching user with ID: ${userId}`)

            const data = await UserService.getUser(userId)

            if (!data) {
                throw new Error('No user data returned from API')
            }

            // Ensure the response has expected shape
            console.log('User data received in component:', data)
            console.log('Roles from API:', data.roles)
            console.log('User type - isCustomerUser:', data.isCustomerUser)
            console.log('User type - isCCIUser:', data.isCCIUser)

            // Ensure all required fields have values to prevent form errors
            const normalizedData: UserDto = {
                id: data.id || '',
                name: data.name || '',
                email: data.email || '',
                isCustomerUser: data.isCustomerUser === true,
                isCCIUser: data.isCCIUser === true,
                status: data.status || 'Active',
                roles: Array.isArray(data.roles) ? data.roles : [],
            }

            setUser(normalizedData)
        } catch (error) {
            console.error('Error fetching user:', error)
            setFetchError(
                'Failed to load user data. Please try refreshing the page.',
            )
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to fetch user details
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const fetchRoles = async () => {
        try {
            console.log('Fetching roles list')
            const data = await RoleService.getRoles()

            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid roles data')
            }

            console.log('Roles received:', data)
            setRoles(data)
        } catch (error) {
            console.error('Error fetching roles:', error)
            toast.push(
                <Notification title="Warning" type="warning" duration={3000}>
                    Could not load roles list. Some functions may be limited.
                </Notification>,
            )
        }
    }

    const onSubmit = async (values: UserFormValues) => {
        if (!id || !user) return

        console.log('Form submission values:', values)

        try {
            setSaving(true) // Create user data according to the API schema
            const roleIds = Array.isArray(values.roles) ? values.roles : []
            console.log('Role IDs from form:', roleIds)

            // Convert role IDs to role names for the API
            const roleNames = roleIds.map((roleId) => {
                const role = roles.find((r) => r.id === roleId)
                return role ? role.name : roleId // Fallback to ID if role not found
            })

            console.log('Role names for API request:', roleNames)

            const userDto: UserDto = {
                id,
                name: values.name,
                email: values.email,
                isCustomerUser: values.isCustomerUser,
                isCCIUser: values.isCCIUser,
                status: user.status || 'Active',
                roles: roleNames, // Include role names in the user object
            }

            const updateUserRequest: UpdateUserRequest = {
                user: userDto,
                roles: roleNames, // Also include role names as a separate property
            }

            console.log(
                'Sending update request:',
                JSON.stringify(updateUserRequest, null, 2),
            )

            await UserService.updateUser(id, updateUserRequest)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    User updated successfully
                </Notification>,
            )
            navigate('/admin/users')
        } catch (error) {
            console.error('Error updating user:', error)
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to update user
                </Notification>,
            )
        } finally {
            setSaving(false)
        }
    }

    const handleResetPassword = async () => {
        if (!id) return

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Passwords do not match
                </Notification>,
            )
            return
        }

        if (passwordData.newPassword.length < 8) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Password must be at least 8 characters
                </Notification>,
            )
            return
        }

        try {
            setSaving(true)
            await UserService.resetPassword(id, passwordData.newPassword)

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    Password reset successfully
                </Notification>,
            )
            setPasswordData({
                newPassword: '',
                confirmPassword: '',
            })
            setResetPasswordVisible(false)
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to reset password
                </Notification>,
            )
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <Spinner size={40} />
            </div>
        )
    }

    if (fetchError) {
        return (
            <div className="container mx-auto">
                <Card className="text-center p-6">
                    <h3 className="text-red-500 mb-4">Error Loading User</h3>
                    <p>{fetchError}</p>
                    <Button
                        className="mt-4"
                        variant="solid"
                        onClick={() => id && fetchUser(id)}
                    >
                        Try Again
                    </Button>
                    <Button
                        className="mt-2"
                        onClick={() => navigate('/admin/users')}
                    >
                        Back to User List
                    </Button>
                </Card>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="text-center">
                    <p className="mb-4">
                        No user data found or user ID is invalid.
                    </p>
                    <Button onClick={() => navigate('/admin/users')}>
                        Back to User List
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Edit User: {user.name}</h3>
                    <Button onClick={() => navigate('/admin/users')}>
                        Back to List
                    </Button>
                </div>
                <Card>
                    <Tabs defaultValue="profile">
                        <TabList>
                            <TabNav value="profile">Profile</TabNav>
                            <TabNav value="security">Security</TabNav>
                        </TabList>
                        <div className="p-4">
                            <TabContent value="profile">
                                <div className="max-w-md mx-auto">
                                    <form onSubmit={handleSubmit(onSubmit)}>
                                        <FormItem
                                            label="Name"
                                            invalid={Boolean(errors.name)}
                                            errorMessage={errors.name?.message}
                                        >
                                            <Controller
                                                name="name"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Please enter a name',
                                                }}
                                                render={({ field }) => (
                                                    <Input {...field} />
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem
                                            label="Email"
                                            invalid={Boolean(errors.email)}
                                            errorMessage={errors.email?.message}
                                        >
                                            <Controller
                                                name="email"
                                                control={control}
                                                rules={{
                                                    required:
                                                        'Please enter an email',
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message:
                                                            'Please enter a valid email',
                                                    },
                                                }}
                                                render={({ field }) => (
                                                    <Input {...field} />
                                                )}
                                            />
                                        </FormItem>
                                        <FormItem label="User Type">
                                            <div className="flex flex-col gap-2">
                                                <FormItem>
                                                    <Controller
                                                        name="isCustomerUser"
                                                        control={control}
                                                        render={({
                                                            field: {
                                                                value,
                                                                onChange,
                                                                ...rest
                                                            },
                                                        }) => (
                                                            <Checkbox
                                                                checked={value}
                                                                onChange={() =>
                                                                    onChange(
                                                                        !value,
                                                                    )
                                                                }
                                                                {...rest}
                                                            >
                                                                Customer Staff
                                                            </Checkbox>
                                                        )}
                                                    />
                                                </FormItem>
                                                <FormItem>
                                                    <Controller
                                                        name="isCCIUser"
                                                        control={control}
                                                        render={({
                                                            field: {
                                                                value,
                                                                onChange,
                                                                ...rest
                                                            },
                                                        }) => (
                                                            <Checkbox
                                                                checked={value}
                                                                onChange={() =>
                                                                    onChange(
                                                                        !value,
                                                                    )
                                                                }
                                                                {...rest}
                                                            >
                                                                CCI Staff
                                                            </Checkbox>
                                                        )}
                                                    />
                                                </FormItem>
                                            </div>
                                        </FormItem>
                                        <FormItem
                                            label="Roles"
                                            invalid={Boolean(errors.roles)}
                                            errorMessage={errors.roles?.message}
                                        >
                                            <Controller
                                                name="roles"
                                                control={control}
                                                render={({ field }) => {
                                                    console.log(
                                                        'Current field value:',
                                                        field.value,
                                                    )

                                                    // Ensure field.value is always an array
                                                    const roleValues =
                                                        Array.isArray(
                                                            field.value,
                                                        )
                                                            ? field.value
                                                            : []

                                                    console.log(
                                                        'Roles fetched from API:',
                                                        roles,
                                                    )

                                                    // Role IDs from API might be just the role name, not the ID
                                                    // First try to match by role.id, then by role.name if that doesn't work
                                                    const selectedOptions =
                                                        roleValues.map(
                                                            (roleValue) => {
                                                                // First check if any role has this ID
                                                                const roleById =
                                                                    roles.find(
                                                                        (r) =>
                                                                            r.id ===
                                                                            roleValue,
                                                                    )
                                                                if (roleById) {
                                                                    return {
                                                                        value:
                                                                            roleById.id ||
                                                                            '',
                                                                        label:
                                                                            roleById.name ||
                                                                            '',
                                                                    }
                                                                }

                                                                // If not found by ID, try to find by name
                                                                const roleByName =
                                                                    roles.find(
                                                                        (r) =>
                                                                            r.name &&
                                                                            r.name.toLowerCase() ===
                                                                                roleValue.toLowerCase(),
                                                                    )
                                                                if (
                                                                    roleByName
                                                                ) {
                                                                    return {
                                                                        value:
                                                                            roleByName.id ||
                                                                            '',
                                                                        label:
                                                                            roleByName.name ||
                                                                            '',
                                                                    }
                                                                }

                                                                // If still not found, use the value as is
                                                                return {
                                                                    value: roleValue,
                                                                    label: roleValue,
                                                                }
                                                            },
                                                        )

                                                    console.log(
                                                        'Role values array:',
                                                        roleValues,
                                                    )
                                                    console.log(
                                                        'All available roles:',
                                                        roles.map((r) => r.id),
                                                    )
                                                    console.log(
                                                        'Selected role options:',
                                                        selectedOptions,
                                                    )

                                                    return (
                                                        <ReactSelect
                                                            isMulti
                                                            placeholder="Select roles"
                                                            options={roles.map(
                                                                (role) => ({
                                                                    value:
                                                                        role.id ||
                                                                        '',
                                                                    label:
                                                                        role.name ||
                                                                        '',
                                                                }),
                                                            )}
                                                            value={
                                                                selectedOptions
                                                            }
                                                            onChange={(
                                                                options,
                                                            ) => {
                                                                console.log(
                                                                    'New selected options:',
                                                                    options,
                                                                )
                                                                field.onChange(
                                                                    options
                                                                        ? options.map(
                                                                              (
                                                                                  option,
                                                                              ) =>
                                                                                  option.value,
                                                                          )
                                                                        : [],
                                                                )
                                                            }}
                                                            classNamePrefix="select"
                                                            closeMenuOnSelect={
                                                                false
                                                            }
                                                            isClearable={true}
                                                            className="roles-multiselect"
                                                            aria-label="Select user roles"
                                                        />
                                                    )
                                                }}
                                            />
                                        </FormItem>
                                        <div className="flex justify-end gap-2 mt-6">
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    navigate('/admin/users')
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="solid"
                                                type="submit"
                                                loading={saving}
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </TabContent>
                            <TabContent value="security">
                                <div className="max-w-md mx-auto">
                                    <div className="mb-8">
                                        <h5 className="mb-4">Reset Password</h5>
                                        {resetPasswordVisible ? (
                                            <div>
                                                <FormItem label="New Password">
                                                    <Input
                                                        type="password"
                                                        value={
                                                            passwordData.newPassword
                                                        }
                                                        onChange={(e) =>
                                                            setPasswordData({
                                                                ...passwordData,
                                                                newPassword:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                </FormItem>
                                                <FormItem label="Confirm Password">
                                                    <Input
                                                        type="password"
                                                        value={
                                                            passwordData.confirmPassword
                                                        }
                                                        onChange={(e) =>
                                                            setPasswordData({
                                                                ...passwordData,
                                                                confirmPassword:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                </FormItem>
                                                <div className="flex gap-2 mt-4">
                                                    <Button
                                                        onClick={() => {
                                                            setResetPasswordVisible(
                                                                false,
                                                            )
                                                            setPasswordData({
                                                                newPassword: '',
                                                                confirmPassword:
                                                                    '',
                                                            })
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="solid"
                                                        color="red-500"
                                                        onClick={
                                                            handleResetPassword
                                                        }
                                                        loading={saving}
                                                    >
                                                        Reset Password
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                                    Reset the user's password.
                                                    This will generate a new
                                                    password and invalidate the
                                                    old one.
                                                </p>
                                                <Button
                                                    variant="solid"
                                                    color="red-500"
                                                    onClick={() =>
                                                        setResetPasswordVisible(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    Reset Password
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabContent>
                        </div>
                    </Tabs>
                </Card>
            </div>
        </div>
    )
}

export default UserEditForm
