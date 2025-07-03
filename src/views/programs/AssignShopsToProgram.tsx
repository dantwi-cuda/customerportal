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
import type { Program, AssignProgramToShopsRequest } from '@/@types/program'
import type { Shop } from '@/@types/shop'
import ProgramService from '@/services/ProgramService'
import ShopService from '@/services/ShopService'
import useAuth from '@/auth/useAuth'

const assignValidationSchema = Yup.object().shape({
    shopIds: Yup.array().min(1, 'Please select at least one shop'),
    retroactiveDays: Yup.number()
        .min(0, 'Retroactive days must be 0 or greater')
        .max(365, 'Retroactive days cannot exceed 365'),
    minWarrantySalesDollars: Yup.number().min(
        0,
        'Minimum warranty sales must be 0 or greater',
    ),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', (startDate, schema) => {
            return startDate
                ? schema.min(startDate, 'End date must be after start date')
                : schema
        }),
})

const AssignShopsToProgram: React.FC = () => {
    const { programId } = useParams<{ programId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [program, setProgram] = useState<Program | null>(null)
    const [shops, setShops] = useState<Shop[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [searchText, setSearchText] = useState('')

    const hasAssignAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'Tenant-User', 'program.assign'].includes(
            role,
        ),
    )

    const getBackPath = () => {
        return '/app/programs'
    }

    useEffect(() => {
        if (programId) {
            loadData()
        }
    }, [programId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [programData, shopsData] = await Promise.all([
                ProgramService.getProgram(parseInt(programId!)),
                ShopService.getShopsList(),
            ])
            setProgram(programData)
            setShops(shopsData.filter((shop) => shop.isActive))
        } catch (error) {
            console.error('Error loading data:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load program or shops data
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
            const assignmentData: AssignProgramToShopsRequest = {
                shopAssignments: values.shopIds.map((shopId: number) => ({
                    shopId,
                    retroactiveDays: values.retroactiveDays || 0,
                    minWarrantySalesDollars:
                        values.minWarrantySalesDollars || 0,
                })),
            }

            await ProgramService.assignProgramToShops(
                program.programId,
                assignmentData,
            )

            toast.push(
                <Notification title="Success" type="success">
                    Program assigned to shops successfully
                </Notification>,
            )

            navigate(getBackPath())
        } catch (error) {
            console.error('Error assigning program:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to assign program to shops
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const filteredShops = shops.filter(
        (shop) =>
            shop.name.toLowerCase().includes(searchText.toLowerCase()) ||
            `${shop.city} ${shop.state}`
                .toLowerCase()
                .includes(searchText.toLowerCase()),
    )

    if (!hasAssignAccess) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to assign programs to shops.
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
                        <h4 className="mb-1">Assign Program to Shops</h4>
                        <p className="text-gray-600">
                            Assign "{program.name}" to one or more shops
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
                        shopIds: [] as number[],
                        retroactiveDays: 0,
                        minWarrantySalesDollars: 0,
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
                                        label="Retroactive Days"
                                        invalid={Boolean(
                                            errors.retroactiveDays &&
                                                touched.retroactiveDays,
                                        )}
                                        errorMessage={errors.retroactiveDays}
                                    >
                                        <Field name="retroactiveDays">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Enter retroactive days"
                                                    min="0"
                                                    max="365"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Minimum Warranty Sales ($)"
                                        invalid={Boolean(
                                            errors.minWarrantySalesDollars &&
                                                touched.minWarrantySalesDollars,
                                        )}
                                        errorMessage={
                                            errors.minWarrantySalesDollars
                                        }
                                    >
                                        <Field name="minWarrantySalesDollars">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    placeholder="Enter minimum warranty sales"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

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

                                {/* Shop Selection */}
                                <div className="mb-6">
                                    <h5 className="mb-4">Select Shops</h5>

                                    {/* Search */}
                                    <div className="mb-4">
                                        <Input
                                            placeholder="Search shops..."
                                            value={searchText}
                                            onChange={(e) =>
                                                setSearchText(e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Shop List */}
                                    <div className="border rounded-lg max-h-96 overflow-auto">
                                        <Table>
                                            <Table.THead>
                                                <Table.Tr>
                                                    <Table.Th>
                                                        <Checkbox
                                                            checked={
                                                                filteredShops.length >
                                                                    0 &&
                                                                filteredShops.every(
                                                                    (shop) =>
                                                                        values.shopIds.includes(
                                                                            shop.id,
                                                                        ),
                                                                )
                                                            }
                                                            onChange={(
                                                                checked,
                                                            ) => {
                                                                if (checked) {
                                                                    const allShopIds =
                                                                        [
                                                                            ...new Set(
                                                                                [
                                                                                    ...values.shopIds,
                                                                                    ...filteredShops.map(
                                                                                        (
                                                                                            s,
                                                                                        ) =>
                                                                                            s.id,
                                                                                    ),
                                                                                ],
                                                                            ),
                                                                        ]
                                                                    setFieldValue(
                                                                        'shopIds',
                                                                        allShopIds,
                                                                    )
                                                                } else {
                                                                    const filteredShopIds =
                                                                        filteredShops.map(
                                                                            (
                                                                                s,
                                                                            ) =>
                                                                                s.id,
                                                                        )
                                                                    setFieldValue(
                                                                        'shopIds',
                                                                        values.shopIds.filter(
                                                                            (
                                                                                id,
                                                                            ) =>
                                                                                !filteredShopIds.includes(
                                                                                    id,
                                                                                ),
                                                                        ),
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                    </Table.Th>
                                                    <Table.Th>
                                                        Shop Name
                                                    </Table.Th>
                                                    <Table.Th>
                                                        Location
                                                    </Table.Th>
                                                    <Table.Th>Status</Table.Th>
                                                </Table.Tr>
                                            </Table.THead>
                                            <Table.TBody>
                                                {filteredShops.map((shop) => (
                                                    <Table.Tr key={shop.id}>
                                                        <Table.Td>
                                                            <Checkbox
                                                                checked={values.shopIds.includes(
                                                                    shop.id,
                                                                )}
                                                                onChange={(
                                                                    checked,
                                                                ) => {
                                                                    if (
                                                                        checked
                                                                    ) {
                                                                        setFieldValue(
                                                                            'shopIds',
                                                                            [
                                                                                ...values.shopIds,
                                                                                shop.id,
                                                                            ],
                                                                        )
                                                                    } else {
                                                                        setFieldValue(
                                                                            'shopIds',
                                                                            values.shopIds.filter(
                                                                                (
                                                                                    id,
                                                                                ) =>
                                                                                    id !==
                                                                                    shop.id,
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
                                                                    {shop.name.charAt(
                                                                        0,
                                                                    )}
                                                                </Avatar>
                                                                <span className="font-medium">
                                                                    {shop.name}
                                                                </span>
                                                            </div>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <span className="text-gray-600">
                                                                {`${shop.city || ''} ${shop.state || ''}`.trim() ||
                                                                    'N/A'}
                                                            </span>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                className={
                                                                    shop.isActive
                                                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200'
                                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-200'
                                                                }
                                                            >
                                                                {shop.isActive
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </Badge>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                                {filteredShops.length === 0 && (
                                                    <Table.Tr>
                                                        <Table.Td
                                                            colSpan={4}
                                                            className="text-center py-8"
                                                        >
                                                            No shops found
                                                        </Table.Td>
                                                    </Table.Tr>
                                                )}
                                            </Table.TBody>
                                        </Table>
                                    </div>

                                    {errors.shopIds && touched.shopIds && (
                                        <div className="text-red-500 text-sm mt-2">
                                            {errors.shopIds}
                                        </div>
                                    )}

                                    <div className="mt-2 text-sm text-gray-600">
                                        {values.shopIds.length} shop(s) selected
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        icon={<HiOutlineCheck />}
                                        loading={submitting}
                                        disabled={values.shopIds.length === 0}
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

export default AssignShopsToProgram
