import React, { useState } from 'react'
import { Card, Button, Notification, toast } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import CustomerInfoForm, {
    CustomerInfoFormValues,
} from './components/CustomerInfoForm'
import * as CustomerService from '@/services/CustomerService'
import type { CreateCustomerRequest } from '@/@types/customer'

const CreateCustomerPage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (values: CustomerInfoFormValues) => {
        setLoading(true)
        try {
            // Convert form values to CreateCustomerRequest format
            const createData: CreateCustomerRequest = {
                name: values.name,
                subdomain: values.subdomain,
                address: values.address || '',
                theme: values.theme || 'default',
                legacyBusinessNetworkID: values.legacyBusinessNetworkID || '',
                portalDisplayName: values.portalDisplayName || '',
                portalDisplaySubName: values.portalDisplaySubName || '',
                portalDisplayPageSubTitle:
                    values.portalDisplayPageSubTitle || '',
                portalWindowIcon: values.portalWindowIcon || '',
            }

            const newCustomer = await CustomerService.createCustomer(createData)

            toast.push(
                <Notification title="Success" type="success">
                    Customer created successfully
                </Notification>,
            )

            // Navigate to edit page for the new customer
            navigate(`/admin/customers/edit/${newCustomer.id}`)
        } catch (error: any) {
            console.error('Error creating customer:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    {error.message || 'Failed to create customer'}
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-4 flex items-center">
                <Button
                    variant="plain"
                    size="sm"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/admin/customers')}
                >
                    Back to Customers
                </Button>
            </div>

            <Card>
                <div className="mb-6">
                    <h4>Create New Customer</h4>
                    <p className="text-gray-600">
                        Fill in the information to create a new customer
                        account.
                    </p>
                </div>

                <CustomerInfoForm
                    onSubmit={handleSubmit}
                    isSubmitting={loading}
                />
            </Card>
        </div>
    )
}

export default CreateCustomerPage
