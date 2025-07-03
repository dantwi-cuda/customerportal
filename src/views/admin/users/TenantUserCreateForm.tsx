import { useState } from 'react'
import {
    Card,
    Input,
    Button,
    FormItem,
    FormContainer,
    Select,
} from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import { Form, Formik } from 'formik'
import * as Yup from 'yup'
import { createTenantUser } from '@/services/UserService'

interface FormData {
    name: string
    email: string
    role: string
    password: string
    confirmPassword: string
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    role: Yup.string().required('Role is required'),
    password: Yup.string()
        .required('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
        ),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
        .required('Please confirm your password'),
})

const TenantUserCreateForm = () => {
    const navigate = useNavigate()
    const [submitError, setSubmitError] = useState('')

    const initialValues: FormData = {
        name: '',
        email: '',
        role: '',
        password: '',
        confirmPassword: '',
    }

    const roleOptions = [
        { value: 'User', label: 'User' },
        { value: 'Manager', label: 'Manager' },
        { value: 'Admin', label: 'Admin' },
    ]

    const onSubmit = async (
        values: FormData,
        { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
    ) => {
        try {
            setSubmitError('')
            await createTenantUser({
                name: values.name,
                email: values.email,
                role: values.role,
                password: values.password,
            })

            navigate('/app/users', {
                state: { success: true, message: 'User created successfully' },
            })
        } catch (error) {
            console.error('Failed to create user:', error)
            setSubmitError('Failed to create user. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="flex items-center mb-6">
                <Button
                    variant="plain"
                    size="sm"
                    icon={<HiArrowLeft />}
                    onClick={() => navigate('/app/users')}
                >
                    Back to Users
                </Button>
                <h1 className="text-2xl font-bold ml-4">Add New User</h1>
            </div>

            <Card>
                <div className="p-4">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={onSubmit}
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
                                    <FormItem
                                        label="Full Name"
                                        invalid={errors.name && touched.name}
                                        errorMessage={errors.name}
                                    >
                                        <Input
                                            name="name"
                                            placeholder="Enter user's full name"
                                            value={values.name}
                                            onChange={handleChange}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Email"
                                        invalid={errors.email && touched.email}
                                        errorMessage={errors.email}
                                    >
                                        <Input
                                            name="email"
                                            placeholder="Enter user's email address"
                                            value={values.email}
                                            onChange={handleChange}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Role"
                                        invalid={errors.role && touched.role}
                                        errorMessage={errors.role}
                                    >
                                        <Select
                                            name="role"
                                            placeholder="Select user role"
                                            options={roleOptions}
                                            value={values.role}
                                            onChange={handleChange}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Password"
                                        invalid={
                                            errors.password && touched.password
                                        }
                                        errorMessage={errors.password}
                                    >
                                        <Input
                                            type="password"
                                            name="password"
                                            placeholder="Create a password"
                                            value={values.password}
                                            onChange={handleChange}
                                        />
                                    </FormItem>

                                    <FormItem
                                        label="Confirm Password"
                                        invalid={
                                            errors.confirmPassword &&
                                            touched.confirmPassword
                                        }
                                        errorMessage={errors.confirmPassword}
                                    >
                                        <Input
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Confirm password"
                                            value={values.confirmPassword}
                                            onChange={handleChange}
                                        />
                                    </FormItem>

                                    {submitError && (
                                        <div className="text-red-500 mb-4">
                                            {submitError}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={() =>
                                                navigate('/app/users')
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={isSubmitting}
                                        >
                                            Create User
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

export default TenantUserCreateForm
