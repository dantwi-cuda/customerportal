import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Input,
    DatePicker,
    FormItem,
    FormContainer,
    Checkbox,
    Table,
    Alert,
    Notification,
    Avatar,
    Badge,
    Skeleton,
} from '@/components/ui'
import { toast } from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineX } from 'react-icons/hi'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useParams, useNavigate } from 'react-router-dom'
import type { Program, AssignProgramToCustomersRequest } from '@/@types/program'
import type { Customer } from '@/@types/customer'
import ProgramService from '@/services/ProgramService'
import * as CustomerService from '@/services/CustomerService'
import useAuth from '@/auth/useAuth'

const assignValidationSchema = Yup.object().shape({
    customerIds: Yup.array().min(1, 'Please select at least one customer'),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', (startDate, schema) => {
            return startDate
                ? schema.min(startDate, 'End date must be after start date')
                : schema
        }),
})

const AssignCustomersToProgram: React.FC = () => {
    const { programId } = useParams<{ programId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [program, setProgram] = useState<Program | null>(null)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [searchText, setSearchText] = useState('')

    const hasAssignAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'program.assign'].includes(role),
    )

    const getBackPath = () => {
        return '/tenantportal/programs'
    }

    useEffect(() => {
        if (programId) {
            loadData()
        }
    }, [programId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [programData, customersResponse] = await Promise.all([
                ProgramService.getProgram(parseInt(programId!)),
                CustomerService.getCustomers(),
            ])
            setProgram(programData)

            // Convert CustomerDetailsResponse to Customer
            const customersData: Customer[] = customersResponse.map(
                (customer) => ({
                    id: parseInt(customer.id || '0'),
                    name: customer.name,
                    legalName: customer.legalName,
                    contactEmail: undefined, // CustomerDetailsResponse doesn't have contactEmail
                    domainUrl: customer.domainUrl,
                    subdomain: customer.subdomain,
                    isActive: customer.isActive,
                }),
            )

            setCustomers(customersData)
        } catch (error) {
            console.error('Error loading data:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load program or customers data
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (values: any) => {
        if (!program) return

        try {
            setSubmitting(true)
            const assignmentData: AssignProgramToCustomersRequest = {
                customerIds: values.customerIds,
                startDate: values.startDate || undefined,
                endDate: values.endDate || undefined,
            }

            await ProgramService.assignProgramToCustomers(
                program.programId,
                assignmentData,
            )

            toast.push(
                <Notification title="Success" type="success">
                    Program assigned to customers successfully
                </Notification>,
            )

            navigate(getBackPath())
        } catch (error) {
            console.error('Error assigning program:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to assign program to customers
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
            customer.legalName.toLowerCase().includes(searchText.toLowerCase()),
    )

    if (!hasAssignAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to assign programs to customers.
                </Alert>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton height="60px" />
                <Skeleton height="400px" />
            </div>
        )
    }

    if (!program) {
        return (
            <Card>
                <Alert type="danger">Program not found.</Alert>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <Button
                        variant="plain"
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(getBackPath())}
                    >
                        Back to Programs
                    </Button>
                    <div>
                        <h4 className="mb-1">Assign Program to Customers</h4>
                        <p className="text-gray-600">
                            Assign "{program.name}" to one or more customers
                        </p>
                    </div>
                </div>

                {/* Program Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm text-gray-600">
                                Program Name
                            </span>
                            <p className="font-medium">{program.name}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Type</span>
                            <p className="font-medium">
                                {program.programTypeName || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">
                                Manufacturer
                            </span>
                            <p className="font-medium">
                                {program.manufacturerName || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <Formik
                    initialValues={{
                        customerIds: [] as number[],
                        startDate: null,
                        endDate: null,
                    }}
                    validationSchema={assignValidationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ values, setFieldValue, errors, touched }) => (
                        <Form>
                            <FormContainer>
                                {/* Assignment Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <FormItem
                                        label="Start Date (Optional)"
                                        invalid={Boolean(
                                            errors.startDate &&
                                                touched.startDate,
                                        )}
                                        errorMessage={errors.startDate}
                                    >
                                        <Field name="startDate">
                                            {({ field }: any) => (
                                                <DatePicker
                                                    {...field}
                                                    placeholder="Select start date"
                                                    value={field.value}
                                                    onChange={(date) =>
                                                        setFieldValue(
                                                            'startDate',
                                                            date,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="End Date (Optional)"
                                        invalid={Boolean(
                                            errors.endDate && touched.endDate,
                                        )}
                                        errorMessage={errors.endDate}
                                    >
                                        <Field name="endDate">
                                            {({ field }: any) => (
                                                <DatePicker
                                                    {...field}
                                                    placeholder="Select end date"
                                                    value={field.value}
                                                    onChange={(date) =>
                                                        setFieldValue(
                                                            'endDate',
                                                            date,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>
                                </div>

                                {/* Customer Selection */}
                                <div className="mb-6">
                                    <h5 className="mb-4">Select Customers</h5>

                                    {/* Search */}
                                    <div className="mb-4">
                                        <Input
                                            placeholder="Search customers..."
                                            value={searchText}
                                            onChange={(e) =>
                                                setSearchText(e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Customer List */}
                                    <div className="border rounded-lg max-h-96 overflow-auto">
                                        <Table>
                                            <Table.THead>
                                                <Table.Tr>
                                                    <Table.Th>
                                                        <Checkbox
                                                            checked={
                                                                filteredCustomers.length >
                                                                    0 &&
                                                                filteredCustomers.every(
                                                                    (
                                                                        customer,
                                                                    ) =>
                                                                        values.customerIds.includes(
                                                                            customer.id,
                                                                        ),
                                                                )
                                                            }
                                                            onChange={(
                                                                checked,
                                                            ) => {
                                                                if (checked) {
                                                                    const allCustomerIds =
                                                                        [
                                                                            ...new Set(
                                                                                [
                                                                                    ...values.customerIds,
                                                                                    ...filteredCustomers.map(
                                                                                        (
                                                                                            c,
                                                                                        ) =>
                                                                                            c.id,
                                                                                    ),
                                                                                ],
                                                                            ),
                                                                        ]
                                                                    setFieldValue(
                                                                        'customerIds',
                                                                        allCustomerIds,
                                                                    )
                                                                } else {
                                                                    const filteredCustomerIds =
                                                                        filteredCustomers.map(
                                                                            (
                                                                                c,
                                                                            ) =>
                                                                                c.id,
                                                                        )
                                                                    setFieldValue(
                                                                        'customerIds',
                                                                        values.customerIds.filter(
                                                                            (
                                                                                id,
                                                                            ) =>
                                                                                !filteredCustomerIds.includes(
                                                                                    id,
                                                                                ),
                                                                        ),
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                    </Table.Th>
                                                    <Table.Th>
                                                        Customer Name
                                                    </Table.Th>
                                                    <Table.Th>
                                                        Legal Name
                                                    </Table.Th>
                                                    <Table.Th>Status</Table.Th>
                                                </Table.Tr>
                                            </Table.THead>
                                            <Table.TBody>
                                                {filteredCustomers.map(
                                                    (customer) => (
                                                        <Table.Tr
                                                            key={customer.id}
                                                        >
                                                            <Table.Td>
                                                                <Checkbox
                                                                    checked={values.customerIds.includes(
                                                                        customer.id,
                                                                    )}
                                                                    onChange={(
                                                                        checked,
                                                                    ) => {
                                                                        if (
                                                                            checked
                                                                        ) {
                                                                            setFieldValue(
                                                                                'customerIds',
                                                                                [
                                                                                    ...values.customerIds,
                                                                                    customer.id,
                                                                                ],
                                                                            )
                                                                        } else {
                                                                            setFieldValue(
                                                                                'customerIds',
                                                                                values.customerIds.filter(
                                                                                    (
                                                                                        id,
                                                                                    ) =>
                                                                                        id !==
                                                                                        customer.id,
                                                                                ),
                                                                            )
                                                                        }
                                                                    }}
                                                                />
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar
                                                                        size="sm"
                                                                        shape="circle"
                                                                    >
                                                                        {customer.name.charAt(
                                                                            0,
                                                                        )}
                                                                    </Avatar>
                                                                    <span className="font-medium">
                                                                        {
                                                                            customer.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <span className="text-gray-600">
                                                                    {customer.legalName ||
                                                                        'N/A'}
                                                                </span>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Badge
                                                                    className={
                                                                        customer.isActive
                                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200'
                                                                    }
                                                                >
                                                                    {customer.isActive
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </Badge>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ),
                                                )}
                                                {filteredCustomers.length ===
                                                    0 && (
                                                    <Table.Tr>
                                                        <Table.Td
                                                            colSpan={4}
                                                            className="text-center py-8"
                                                        >
                                                            No customers found
                                                        </Table.Td>
                                                    </Table.Tr>
                                                )}
                                            </Table.TBody>
                                        </Table>
                                    </div>

                                    {errors.customerIds &&
                                        touched.customerIds && (
                                            <div className="text-red-500 text-sm mt-2">
                                                {errors.customerIds}
                                            </div>
                                        )}

                                    <div className="mt-2 text-sm text-gray-600">
                                        {values.customerIds.length} customer(s)
                                        selected
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        icon={<HiOutlineCheck />}
                                        loading={submitting}
                                        disabled={
                                            values.customerIds.length === 0
                                        }
                                    >
                                        Assign Program
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="plain"
                                        icon={<HiOutlineX />}
                                        onClick={() => navigate(getBackPath())}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </FormContainer>
                        </Form>
                    )}
                </Formik>
            </Card>
        </div>
    )
}

export default AssignCustomersToProgram
