import React, { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    Checkbox,
    Select,
    Notification,
    toast,
} from '@/components/ui'
import { Form, FormItem } from '@/components/ui/Form'
import UserService from '@/services/UserService'
import RoleService from '@/services/RoleService'
import { useNavigate } from 'react-router-dom'
import type { UserDto, CreateUserRequest } from '@/@types/user'
import type { RoleDto } from '@/@types/role'
import { Controller, useForm } from 'react-hook-form'

const UserCreateForm = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<RoleDto[]>([])

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            isCustomerUser: false,
            isCCIUser: false,
            roles: [] as string[],
        },
    })

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        try {
            console.log('Fetching roles for user creation')
            const data = await RoleService.getRoles()

            // Ensure we've got valid data
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid roles data received')
            }

            console.log('Roles received for create form:', data)
            setRoles(data)
        } catch (error) {
            console.error('Error fetching roles for create form:', error)
            toast.push(
                <Notification title="Warning" type="warning" duration={3000}>
                    Could not load roles list. Some functions may be limited.
                </Notification>,
            )
        }
    }

    const onSubmit = async (values: {
        name: string
        email: string
        password: string
        confirmPassword: string
        isCustomerUser: boolean
        isCCIUser: boolean
        roles: string[]
    }) => {
        console.log('Create form values:', values)

        if (values.password !== values.confirmPassword) {
            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Passwords do not match
                </Notification>,
            )
            return
        }

        try {
            setLoading(true)

            // Create proper UserDto object according to the API schema
            const userDto: UserDto = {
                id: '', // Include empty ID field as required by the API
                name: values.name,
                email: values.email,
                isCustomerUser: values.isCustomerUser || false,
                isCCIUser: values.isCCIUser || false,
                status: 'Active',
            }

            // Create the request according to the CreateUserRequest schema
            const createUserRequest: CreateUserRequest = {
                user: userDto,
                password: values.password,
                roles:
                    values.roles.map((roleId) => {
                        const role = roles.find((r) => r.id === roleId)
                        return role ? role.name : roleId // Use role names instead of IDs
                    }) || [],
            }

            console.log(
                'Sending create user request:',
                JSON.stringify(createUserRequest),
            )

            // Call the API to create the user
            const createdUser = await UserService.createUser(createUserRequest)

            console.log(
                'User created successfully - Server response:',
                JSON.stringify(createdUser, null, 2),
            )

            toast.push(
                <Notification title="Success" type="success" duration={3000}>
                    User created successfully
                </Notification>,
            )
            navigate('/admin/users')
        } catch (error: any) {
            console.error('Error creating user:', error)

            // Add more detailed error logging
            if (error.response) {
                console.error('Error response data:', error.response.data)
                console.error('Error response status:', error.response.status)
                console.error('Error response headers:', error.response.headers)
            } else if (error.request) {
                console.error(
                    'Error request (no response received):',
                    error.request,
                )
            } else {
                console.error('Error message:', error.message)
            }

            toast.push(
                <Notification title="Error" type="danger" duration={3000}>
                    Failed to create user:{' '}
                    {error.response?.data?.message ||
                        error.message ||
                        'Unknown error'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="container mx-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h3>Create New User</h3>
                </div>
                <Card>
                    <div className="max-w-md mx-auto">
                        <Form onSubmit={handleSubmit(onSubmit)}>
                            <FormItem
                                label="Name"
                                invalid={!!errors.name}
                                errorMessage={errors.name?.message as string}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{ required: 'Please enter name' }}
                                    render={({ field }) => <Input {...field} />}
                                />
                            </FormItem>
                            <FormItem
                                label="Email"
                                invalid={!!errors.email}
                                errorMessage={errors.email?.message as string}
                            >
                                <Controller
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: 'Please enter email',
                                        pattern: {
                                            value: /\S+@\S+\.\S+/,
                                            message:
                                                'Please enter a valid email',
                                        },
                                    }}
                                    render={({ field }) => <Input {...field} />}
                                />
                            </FormItem>
                            <FormItem
                                label="Password"
                                invalid={!!errors.password}
                                errorMessage={
                                    errors.password?.message as string
                                }
                            >
                                <Controller
                                    name="password"
                                    control={control}
                                    rules={{
                                        required: 'Please enter password',
                                        minLength: {
                                            value: 8,
                                            message:
                                                'Password must be at least 8 characters',
                                        },
                                    }}
                                    render={({ field }) => (
                                        <Input {...field} type="password" />
                                    )}
                                />
                            </FormItem>
                            <FormItem
                                label="Confirm Password"
                                invalid={!!errors.confirmPassword}
                                errorMessage={
                                    errors.confirmPassword?.message as string
                                }
                            >
                                <Controller
                                    name="confirmPassword"
                                    control={control}
                                    rules={{
                                        required: 'Please confirm password',
                                    }}
                                    render={({ field }) => (
                                        <Input {...field} type="password" />
                                    )}
                                />
                            </FormItem>
                            <FormItem label="User Type">
                                <div className="flex flex-col gap-2">
                                    <Controller
                                        name="isCustomerUser"
                                        control={control}
                                        render={({
                                            field: { value, onChange, ...rest },
                                        }) => (
                                            <Checkbox
                                                checked={value}
                                                onChange={() =>
                                                    onChange(!value)
                                                }
                                                {...rest}
                                            >
                                                Customer Staff
                                            </Checkbox>
                                        )}
                                    />
                                    <Controller
                                        name="isCCIUser"
                                        control={control}
                                        render={({
                                            field: { value, onChange, ...rest },
                                        }) => (
                                            <Checkbox
                                                checked={value}
                                                onChange={() =>
                                                    onChange(!value)
                                                }
                                                {...rest}
                                            >
                                                CCI Staff
                                            </Checkbox>
                                        )}
                                    />
                                </div>
                            </FormItem>
                            <FormItem label="Roles">
                                <Controller
                                    name="roles"
                                    control={control}
                                    render={({ field }) => {
                                        // Ensure field.value is always an array
                                        const roleValues = Array.isArray(
                                            field.value,
                                        )
                                            ? field.value
                                            : []

                                        // Map role IDs to selection options
                                        const selectedOptions = roleValues
                                            .map((roleId) => {
                                                const role = roles.find(
                                                    (r) => r.id === roleId,
                                                )
                                                return role
                                                    ? {
                                                          value: role.id || '',
                                                          label:
                                                              role.name || '',
                                                      }
                                                    : null
                                            })
                                            .filter(Boolean)

                                        return (
                                            <Select
                                                value={selectedOptions}
                                                onChange={(options: any) => {
                                                    const selectedValueArray =
                                                        options
                                                            ? Array.isArray(
                                                                  options,
                                                              )
                                                                ? options.map(
                                                                      (
                                                                          option: any,
                                                                      ) =>
                                                                          option.value,
                                                                  )
                                                                : options.value
                                                                  ? [
                                                                        options.value,
                                                                    ]
                                                                  : []
                                                            : []
                                                    field.onChange(
                                                        selectedValueArray,
                                                    )
                                                }}
                                                placeholder="Select roles"
                                                options={roles.map((role) => ({
                                                    value: role.id || '',
                                                    label: role.name || '',
                                                }))}
                                                isMulti
                                                isClearable={true}
                                                closeMenuOnSelect={false}
                                            />
                                        )
                                    }}
                                />
                            </FormItem>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    onClick={() => navigate('/admin/users')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="solid"
                                    type="submit"
                                    loading={loading}
                                >
                                    Create User
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default UserCreateForm
