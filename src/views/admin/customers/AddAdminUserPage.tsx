import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Card,
    Input,
    Button,
    Notification,
    toast,
    FormItem,
    FormContainer,
} from '@/components/ui'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import * as CustomerService from '@/services/CustomerService'
import UserService from '@/services/UserService'
import { TENANT_ADMIN } from '@/constants/roles.constant'
import type { CustomerDetailsResponse } from '@/@types/customer'
import type { CreateUserRequest } from '@/@types/user'

// Validation schema
const validationSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .required('Name is required'),
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        )
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
})

// Form values interface
interface AddAdminUserFormValues {
    name: string
    email: string
    password: string
    confirmPassword: string
}

const AddAdminUserPage = () => {
    const { customerId } = useParams<{ customerId: string }>()
    const navigate = useNavigate()
    const [customer, setCustomer] = useState<CustomerDetailsResponse | null>(
        null,
    )
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Initial form values
    const initialValues: AddAdminUserFormValues = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    }

    useEffect(() => {
        if (customerId) {
            fetchCustomer()
        }
    }, [customerId])

    const fetchCustomer = async () => {
        try {
            setLoading(true)
            const customerData = await CustomerService.getCustomerById(
                customerId!,
            )
            setCustomer(customerData)
        } catch (error) {
            console.error('Error fetching customer:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to fetch customer details
                </Notification>,
            )
            navigate('/admin/customers')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: AddAdminUserFormValues) => {
        if (!customer?.id) return

        setSubmitting(true)
        try {
            // Create the user request payload
            const createUserRequest: CreateUserRequest = {
                user: {
                    name: values.name,
                    email: values.email,
                    isCustomerUser: true,
                    isCCIUser: false,
                    isActive: true,
                    tenantId: customer.id, // Associate with the customer (tenant)
                },
                password: values.password,
                roles: [TENANT_ADMIN], // Assign Tenant-Admin role
            }

            console.log('Creating admin user with payload:', createUserRequest)

            // Create the user
            await UserService.createUser(createUserRequest)

            toast.push(
                <Notification type="success" title="Success">
                    Admin user created successfully for {customer.name}
                </Notification>,
            )

            // Navigate back to customer list
            navigate('/admin/customers')
        } catch (error) {
            console.error('Error creating admin user:', error)

            // Handle specific error cases
            let errorMessage = 'Failed to create admin user'
            if (error instanceof Error) {
                if (error.message.includes('email')) {
                    errorMessage = 'This email address is already in use'
                } else if (error.message.includes('validation')) {
                    errorMessage = 'Please check your input and try again'
                } else {
                    errorMessage = error.message
                }
            }

            toast.push(
                <Notification type="danger" title="Error">
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = () => {
        navigate('/admin/customers')
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div>Loading customer details...</div>
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <div>Customer not found</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Add Admin User
                </h2>
                <p className="text-gray-600 mt-2">
                    Create a new admin user for <strong>{customer.name}</strong>
                </p>
            </div>

            <Card>
                <div className="p-6">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, isValid }) => (
                            <Form>
                                <FormContainer>
                                    <FormItem
                                        label="Full Name"
                                        invalid={
                                            !!(errors.name && touched.name)
                                        }
                                        errorMessage={errors.name}
                                    >
                                        <Field name="name">
                                            {({ field, form }: any) => (
                                                <Input
                                                    type="text"
                                                    placeholder="Enter full name"
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
                                        label="Email Address"
                                        invalid={
                                            !!(errors.email && touched.email)
                                        }
                                        errorMessage={errors.email}
                                    >
                                        <Field name="email">
                                            {({ field, form }: any) => (
                                                <Input
                                                    type="email"
                                                    placeholder="Enter email address"
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
                                        label="Password"
                                        invalid={
                                            !!(
                                                errors.password &&
                                                touched.password
                                            )
                                        }
                                        errorMessage={errors.password}
                                    >
                                        <Field name="password">
                                            {({ field, form }: any) => (
                                                <Input
                                                    type="password"
                                                    placeholder="Enter password"
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
                                        errorMessage={errors.confirmPassword}
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

                                    <div className="mt-6">
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                                            <h4 className="text-sm font-medium text-blue-800 mb-2">
                                                Admin User Details
                                            </h4>
                                            <ul className="text-sm text-blue-700 space-y-1">
                                                <li>
                                                    • Role: Tenant Administrator
                                                </li>
                                                <li>
                                                    • Customer: {customer.name}
                                                </li>
                                                <li>
                                                    • Access Level: Full tenant
                                                    administration
                                                </li>
                                                <li>
                                                    • Can manage users,
                                                    settings, and data within
                                                    this tenant
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-8">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={handleCancel}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={submitting}
                                            disabled={!isValid}
                                        >
                                            Create Admin User
                                        </Button>
                                    </div>
                                </FormContainer>
                            </Form>
                        )}
                    </Formik>
                </div>
            </Card>
        </div>
    )
}

export default AddAdminUserPage
