import { useState, useEffect } from 'react'
import {
    Card,
    Input,
    Button,
    FormItem,
    FormContainer,
    Select,
    Spinner,
} from '@/components/ui'
import { useNavigate, useParams } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'
import { Form, Formik } from 'formik'
import * as Yup from 'yup'
import { getTenantUser, updateTenantUser } from '@/services/UserService'
import type { TenantUser } from '@/@types/user'

interface FormData {
    name: string
    email: string
    role: string
    status: string
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    role: Yup.string().required('Role is required'),
    status: Yup.string().required('Status is required'),
})

const TenantUserEditForm = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [user, setUser] = useState<TenantUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitError, setSubmitError] = useState('')

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return

            try {
                setLoading(true)
                const userData = await getTenantUser(id)
                setUser(userData)
            } catch (error) {
                console.error('Failed to fetch user data:', error)
                // In a real app, show an error notification here
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [id])

    const roleOptions = [
        { value: 'User', label: 'User' },
        { value: 'Manager', label: 'Manager' },
        { value: 'Admin', label: 'Admin' },
    ]

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
    ]

    const onSubmit = async (
        values: FormData,
        { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
    ) => {
        if (!id) return

        try {
            setSubmitError('')
            await updateTenantUser(id, {
                name: values.name,
                email: values.email,
                role: values.role,
                status: values.status,
            })

            navigate('/app/users', {
                state: { success: true, message: 'User updated successfully' },
            })
        } catch (error) {
            console.error('Failed to update user:', error)
            setSubmitError('Failed to update user. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size={40} />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
                <p className="mb-4">
                    The user you are trying to edit does not exist or you don't
                    have permission to access it.
                </p>
                <Button onClick={() => navigate('/app/users')}>
                    Back to Users List
                </Button>
            </div>
        )
    }

    const initialValues: FormData = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
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
                <h1 className="text-2xl font-bold ml-4">Edit User</h1>
            </div>

            <Card>
                <div className="p-4">
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={onSubmit}
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
                                        label="Status"
                                        invalid={
                                            errors.status && touched.status
                                        }
                                        errorMessage={errors.status}
                                    >
                                        <Select
                                            name="status"
                                            placeholder="Select user status"
                                            options={statusOptions}
                                            value={values.status}
                                            onChange={handleChange}
                                        />
                                    </FormItem>

                                    <div className="border-t border-gray-200 my-4 pt-4">
                                        <Button
                                            type="button"
                                            variant="twoTone"
                                            color="red"
                                            className="mb-4"
                                        >
                                            Reset User Password
                                        </Button>
                                    </div>

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
                                            Save Changes
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

export default TenantUserEditForm
