import React, { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Input,
    Select,
    DatePicker,
    FormItem,
    FormContainer,
    Alert,
    Notification,
    Skeleton,
} from '@/components/ui'
import { toast } from '@/components/ui'
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineX } from 'react-icons/hi'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useParams, useNavigate } from 'react-router-dom'
import type {
    Program,
    CreateProgramRequest,
    UpdateProgramRequest,
} from '@/@types/program'
import type { ProgramType } from '@/@types/programType'
import type { ProgramCategory } from '@/@types/programCategory'
import type { Manufacturer } from '@/@types/parts'
import ProgramService from '@/services/ProgramService'
import ProgramCategoryService from '@/services/ProgramCategoryService'
import ManufacturerService from '@/services/ManufacturerService'
import useAuth from '@/auth/useAuth'

const programValidationSchema = Yup.object().shape({
    name: Yup.string().required('Program name is required'),
    description: Yup.string(),
    programTypeId: Yup.number().required('Program type is required'),
    contactName: Yup.string(),
    contactPhone: Yup.string(),
    contactEmail: Yup.string().email('Invalid email format'),
    startDate: Yup.date().nullable(),
    endDate: Yup.date()
        .nullable()
        .when('startDate', {
            is: (startDate: any) => startDate != null,
            then: (schema) =>
                schema.min(
                    Yup.ref('startDate'),
                    'End date must be after start date',
                ),
            otherwise: (schema) => schema,
        }),
    typeSpecificAttributes: Yup.object(),
})

const ProgramForm: React.FC = () => {
    const { programId } = useParams<{ programId: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isEdit = Boolean(programId)

    const [program, setProgram] = useState<Program | null>(null)
    const [programTypes, setProgramTypes] = useState<ProgramType[]>([])
    const [selectedProgramType, setSelectedProgramType] =
        useState<ProgramType | null>(null)
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
    const [programCategories, setProgramCategories] = useState<
        ProgramCategory[]
    >([])
    const [loading, setLoading] = useState(isEdit)
    const [submitting, setSubmitting] = useState(false)

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.edit'].includes(role),
    )

    const hasCreateAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'Tenant-Admin', 'program.create'].includes(role),
    )

    const isPortalAdmin = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const getBackPath = () => {
        return isPortalAdmin ? '/tenantportal/programs' : '/app/programs'
    }

    useEffect(() => {
        loadData()
    }, [programId])

    const loadData = async () => {
        try {
            setLoading(true)

            // Load program types
            const programTypesData = await ProgramService.getProgramTypes()
            setProgramTypes(programTypesData)

            // Load program categories for dropdown options
            try {
                const categoriesData =
                    await ProgramCategoryService.getProgramCategories()
                setProgramCategories(categoriesData)
            } catch (error) {
                console.warn('Failed to load program categories:', error)
                setProgramCategories([])
            }

            // Load manufacturers for dropdown options
            try {
                const manufacturersData =
                    await ManufacturerService.getManufacturers()
                setManufacturers(manufacturersData)
            } catch (error) {
                console.warn('Failed to load manufacturers:', error)
                setManufacturers([])
            }

            if (isEdit && programId) {
                const programData = await ProgramService.getProgram(
                    parseInt(programId),
                )
                setProgram(programData)

                // Set the selected program type if editing
                const selectedType = programTypesData.find(
                    (type) => type.programTypeID === programData.programTypeId,
                )
                setSelectedProgramType(selectedType || null)
            }
        } catch (error) {
            console.error('Error loading data:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to load program data
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    const handleProgramTypeChange = (
        programTypeId: number,
        setFieldValue: any,
    ) => {
        const selectedType = programTypes.find(
            (type) => type.programTypeID === programTypeId,
        )
        setSelectedProgramType(selectedType || null)
        setFieldValue('programTypeId', programTypeId)

        // Clear existing type-specific attributes when changing program type
        if (selectedType) {
            const newAttributes: Record<string, any> = {}
            selectedType.attributes?.forEach((attr) => {
                newAttributes[attr.attributeName] = attr.defaultValue || ''
            })
            setFieldValue('typeSpecificAttributes', newAttributes)
        } else {
            setFieldValue('typeSpecificAttributes', {})
        }
    }

    const handleSubmit = async (values: any) => {
        try {
            setSubmitting(true)

            // Convert typeSpecificAttributes to JSON structure
            const typeSpecificAttributes = selectedProgramType?.attributes
                ? Object.keys(values.typeSpecificAttributes || {}).reduce(
                      (acc, key) => {
                          const value = values.typeSpecificAttributes[key]
                          if (value !== undefined && value !== '') {
                              acc[key] = value
                          }
                          return acc
                      },
                      {} as Record<string, any>,
                  )
                : undefined

            if (isEdit && program) {
                const updateData: UpdateProgramRequest = {
                    programName: values.name,
                    programDescription: values.description || undefined,
                    programTypeID: values.programTypeId,
                    contactName: values.contactName || undefined,
                    contactPhone: values.contactPhone || undefined,
                    contactEmail: values.contactEmail || undefined,
                    startDate: values.startDate || undefined,
                    endDate: values.endDate || undefined,
                    isActive:
                        values.isActive !== undefined ? values.isActive : true,
                    typeSpecificAttributes,
                }

                await ProgramService.updateProgram(
                    program.programId,
                    updateData,
                )

                toast.push(
                    <Notification title="Success" type="success">
                        Program updated successfully
                    </Notification>,
                )
            } else {
                const createData: CreateProgramRequest = {
                    programName: values.name,
                    programDescription: values.description || undefined,
                    programTypeID: values.programTypeId,
                    contactName: values.contactName || undefined,
                    contactPhone: values.contactPhone || undefined,
                    contactEmail: values.contactEmail || undefined,
                    startDate: values.startDate || undefined,
                    endDate: values.endDate || undefined,
                    isActive:
                        values.isActive !== undefined ? values.isActive : true,
                    typeSpecificAttributes,
                }

                await ProgramService.createProgram(createData)

                toast.push(
                    <Notification title="Success" type="success">
                        Program created successfully
                    </Notification>,
                )
            }

            navigate(getBackPath())
        } catch (error) {
            console.error('Error saving program:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to save program
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (!hasCreateAccess && !isEdit) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to create programs.
                </Alert>
            </Card>
        )
    }

    if (!hasEditAccess && isEdit) {
        return (
            <Card>
                <Alert type="danger">
                    You don't have permission to edit programs.
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

    if (isEdit && !program) {
        return (
            <Card>
                <Alert type="danger">Program not found.</Alert>
            </Card>
        )
    }

    const initialValues = {
        name: program?.programName || '',
        description: program?.programDescription || '',
        programTypeId: program?.programTypeId || '',
        contactName: program?.contactName || '',
        contactPhone: program?.contactPhone || '',
        contactEmail: program?.contactEmail || '',
        startDate: program?.startDate ? new Date(program.startDate) : null,
        endDate: program?.endDate ? new Date(program.endDate) : null,
        isActive: program?.isActive !== undefined ? program.isActive : true,
        typeSpecificAttributes: program?.typeSpecificAttributes || {},
    }

    return (
        <div className="space-y-4">
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
                        <h4 className="mb-1">
                            {isEdit ? 'Edit Program' : 'Add New Program'}
                        </h4>
                        <p className="text-gray-600">
                            {isEdit
                                ? 'Update program details'
                                : 'Create a new program'}
                        </p>
                    </div>
                </div>

                <Formik
                    initialValues={initialValues}
                    validationSchema={programValidationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, setFieldValue, errors, touched }) => (
                        <Form>
                            <FormContainer>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormItem
                                        label="Program Name *"
                                        invalid={Boolean(
                                            errors.name && touched.name,
                                        )}
                                        errorMessage={errors.name}
                                    >
                                        <Field name="name">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter program name"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Program Type *"
                                        invalid={Boolean(
                                            errors.programTypeId &&
                                                touched.programTypeId,
                                        )}
                                        errorMessage={errors.programTypeId}
                                    >
                                        <Field name="programTypeId">
                                            {({ field }: any) => (
                                                <Select
                                                    {...field}
                                                    placeholder="Select program type"
                                                    value={
                                                        field.value
                                                            ? {
                                                                  value: field.value,
                                                                  label:
                                                                      programTypes.find(
                                                                          (
                                                                              pt,
                                                                          ) =>
                                                                              pt.programTypeID ===
                                                                              field.value,
                                                                      )
                                                                          ?.typeName ||
                                                                      '',
                                                              }
                                                            : null
                                                    }
                                                    options={programTypes.map(
                                                        (type) => ({
                                                            value: type.programTypeID,
                                                            label: type.typeName,
                                                        }),
                                                    )}
                                                    onChange={(option: any) =>
                                                        handleProgramTypeChange(
                                                            option?.value || '',
                                                            setFieldValue,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Contact Name"
                                        invalid={Boolean(
                                            errors.contactName &&
                                                touched.contactName,
                                        )}
                                        errorMessage={errors.contactName}
                                    >
                                        <Field name="contactName">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter contact name"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Contact Phone"
                                        invalid={Boolean(
                                            errors.contactPhone &&
                                                touched.contactPhone,
                                        )}
                                        errorMessage={errors.contactPhone}
                                    >
                                        <Field name="contactPhone">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    placeholder="Enter contact phone"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Contact Email"
                                        invalid={Boolean(
                                            errors.contactEmail &&
                                                touched.contactEmail,
                                        )}
                                        errorMessage={errors.contactEmail}
                                    >
                                        <Field name="contactEmail">
                                            {({ field }: any) => (
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="Enter contact email"
                                                />
                                            )}
                                        </Field>
                                    </FormItem>

                                    <FormItem
                                        label="Start Date"
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
                                        label="End Date"
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

                                <FormItem
                                    label="Description"
                                    invalid={Boolean(
                                        errors.description &&
                                            touched.description,
                                    )}
                                    errorMessage={errors.description}
                                >
                                    <Field name="description">
                                        {({ field }: any) => (
                                            <Input
                                                {...field}
                                                textArea
                                                rows={4}
                                                placeholder="Enter program description"
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                {/* Dynamic Program Type Attributes */}
                                {selectedProgramType &&
                                    selectedProgramType.attributes &&
                                    selectedProgramType.attributes.length >
                                        0 && (
                                        <div className="col-span-1 md:col-span-2">
                                            <h5 className="text-lg font-medium mb-4 pb-2 border-b border-gray-200">
                                                Program Type Attributes
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedProgramType.attributes.map(
                                                    (attribute) => (
                                                        <FormItem
                                                            key={
                                                                attribute.attributeID
                                                            }
                                                            label={`${attribute.attributeName}${attribute.isRequired ? ' *' : ''}`}
                                                            invalid={Boolean(
                                                                errors
                                                                    .typeSpecificAttributes?.[
                                                                    attribute
                                                                        .attributeName
                                                                ] &&
                                                                    touched
                                                                        .typeSpecificAttributes?.[
                                                                        attribute
                                                                            .attributeName
                                                                    ],
                                                            )}
                                                            errorMessage={
                                                                typeof errors
                                                                    .typeSpecificAttributes?.[
                                                                    attribute
                                                                        .attributeName
                                                                ] === 'string'
                                                                    ? (errors
                                                                          .typeSpecificAttributes[
                                                                          attribute
                                                                              .attributeName
                                                                      ] as string)
                                                                    : undefined
                                                            }
                                                        >
                                                            <Field
                                                                name={`typeSpecificAttributes.${attribute.attributeName}`}
                                                            >
                                                                {({
                                                                    field,
                                                                }: any) => {
                                                                    const getInputComponent =
                                                                        () => {
                                                                            // Handle DataSource dropdown fields
                                                                            if (
                                                                                attribute.dataSource
                                                                            ) {
                                                                                const dataSource =
                                                                                    attribute.dataSource.toLowerCase()

                                                                                if (
                                                                                    dataSource ===
                                                                                    'manufacturers'
                                                                                ) {
                                                                                    const manufacturerOptions =
                                                                                        manufacturers.map(
                                                                                            (
                                                                                                manufacturer,
                                                                                            ) => ({
                                                                                                value: manufacturer.manufacturerID,
                                                                                                label: manufacturer.manufacturerName,
                                                                                            }),
                                                                                        )

                                                                                    return (
                                                                                        <Select
                                                                                            {...field}
                                                                                            placeholder={`Select ${attribute.attributeName.toLowerCase()}`}
                                                                                            value={
                                                                                                field.value
                                                                                                    ? manufacturerOptions.find(
                                                                                                          (
                                                                                                              option,
                                                                                                          ) =>
                                                                                                              option.value ===
                                                                                                              field.value,
                                                                                                      )
                                                                                                    : null
                                                                                            }
                                                                                            options={
                                                                                                manufacturerOptions
                                                                                            }
                                                                                            onChange={(
                                                                                                option: any,
                                                                                            ) =>
                                                                                                setFieldValue(
                                                                                                    `typeSpecificAttributes.${attribute.attributeName}`,
                                                                                                    option?.value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )
                                                                                }

                                                                                if (
                                                                                    dataSource ===
                                                                                    'program category'
                                                                                ) {
                                                                                    const categoryOptions =
                                                                                        programCategories.map(
                                                                                            (
                                                                                                category,
                                                                                            ) => ({
                                                                                                value: category.programCategoryID,
                                                                                                label: category.categoryName,
                                                                                            }),
                                                                                        )

                                                                                    return (
                                                                                        <Select
                                                                                            {...field}
                                                                                            placeholder={`Select ${attribute.attributeName.toLowerCase()}`}
                                                                                            value={
                                                                                                field.value
                                                                                                    ? categoryOptions.find(
                                                                                                          (
                                                                                                              option,
                                                                                                          ) =>
                                                                                                              option.value ===
                                                                                                              field.value,
                                                                                                      )
                                                                                                    : null
                                                                                            }
                                                                                            options={
                                                                                                categoryOptions
                                                                                            }
                                                                                            onChange={(
                                                                                                option: any,
                                                                                            ) =>
                                                                                                setFieldValue(
                                                                                                    `typeSpecificAttributes.${attribute.attributeName}`,
                                                                                                    option?.value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )
                                                                                }
                                                                            }

                                                                            // Handle regular data type fields
                                                                            switch (
                                                                                (
                                                                                    attribute.dataType ||
                                                                                    'string'
                                                                                ).toLowerCase()
                                                                            ) {
                                                                                case 'number':
                                                                                case 'decimal':
                                                                                case 'integer':
                                                                                    return (
                                                                                        <Input
                                                                                            {...field}
                                                                                            type="number"
                                                                                            placeholder={
                                                                                                attribute.attributeDescription ||
                                                                                                `Enter ${attribute.attributeName.toLowerCase()}`
                                                                                            }
                                                                                            value={
                                                                                                field.value ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                setFieldValue(
                                                                                                    `typeSpecificAttributes.${attribute.attributeName}`,
                                                                                                    e
                                                                                                        .target
                                                                                                        .value
                                                                                                        ? parseFloat(
                                                                                                              e
                                                                                                                  .target
                                                                                                                  .value,
                                                                                                          )
                                                                                                        : '',
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )
                                                                                case 'boolean':
                                                                                    return (
                                                                                        <Select
                                                                                            {...field}
                                                                                            placeholder="Select value"
                                                                                            value={
                                                                                                field.value !==
                                                                                                    undefined &&
                                                                                                field.value !==
                                                                                                    ''
                                                                                                    ? {
                                                                                                          value: field.value,
                                                                                                          label: field.value
                                                                                                              ? 'Yes'
                                                                                                              : 'No',
                                                                                                      }
                                                                                                    : null
                                                                                            }
                                                                                            options={[
                                                                                                {
                                                                                                    value: true,
                                                                                                    label: 'Yes',
                                                                                                },
                                                                                                {
                                                                                                    value: false,
                                                                                                    label: 'No',
                                                                                                },
                                                                                            ]}
                                                                                            onChange={(
                                                                                                option: any,
                                                                                            ) =>
                                                                                                setFieldValue(
                                                                                                    `typeSpecificAttributes.${attribute.attributeName}`,
                                                                                                    option?.value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )
                                                                                case 'date':
                                                                                    return (
                                                                                        <DatePicker
                                                                                            {...field}
                                                                                            placeholder={
                                                                                                attribute.attributeDescription ||
                                                                                                `Select ${attribute.attributeName.toLowerCase()}`
                                                                                            }
                                                                                            value={
                                                                                                field.value
                                                                                                    ? new Date(
                                                                                                          field.value,
                                                                                                      )
                                                                                                    : null
                                                                                            }
                                                                                            onChange={(
                                                                                                date,
                                                                                            ) =>
                                                                                                setFieldValue(
                                                                                                    `typeSpecificAttributes.${attribute.attributeName}`,
                                                                                                    date?.toISOString(),
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )
                                                                                case 'text':
                                                                                case 'textarea':
                                                                                    return (
                                                                                        <Input
                                                                                            {...field}
                                                                                            textArea
                                                                                            rows={
                                                                                                3
                                                                                            }
                                                                                            placeholder={
                                                                                                attribute.attributeDescription ||
                                                                                                `Enter ${attribute.attributeName.toLowerCase()}`
                                                                                            }
                                                                                            value={
                                                                                                field.value ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                setFieldValue(
                                                                                                    `typeSpecificAttributes.${attribute.attributeName}`,
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )
                                                                                default: // string and other types
                                                                                    return (
                                                                                        <Input
                                                                                            {...field}
                                                                                            placeholder={
                                                                                                attribute.attributeDescription ||
                                                                                                `Enter ${attribute.attributeName.toLowerCase()}`
                                                                                            }
                                                                                            value={
                                                                                                field.value ||
                                                                                                ''
                                                                                            }
                                                                                            onChange={(
                                                                                                e,
                                                                                            ) =>
                                                                                                setFieldValue(
                                                                                                    `typeSpecificAttributes.${attribute.attributeName}`,
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    )
                                                                            }
                                                                        }

                                                                    return getInputComponent()
                                                                }}
                                                            </Field>
                                                            {attribute.attributeDescription && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {
                                                                        attribute.attributeDescription
                                                                    }
                                                                </p>
                                                            )}
                                                        </FormItem>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {isEdit && (
                                    <FormItem label="Status">
                                        <Field name="isActive">
                                            {({ field }: any) => (
                                                <Select
                                                    {...field}
                                                    value={
                                                        field.value
                                                            ? {
                                                                  value: true,
                                                                  label: 'Active',
                                                              }
                                                            : {
                                                                  value: false,
                                                                  label: 'Inactive',
                                                              }
                                                    }
                                                    options={[
                                                        {
                                                            value: true,
                                                            label: 'Active',
                                                        },
                                                        {
                                                            value: false,
                                                            label: 'Inactive',
                                                        },
                                                    ]}
                                                    onChange={(option: any) =>
                                                        setFieldValue(
                                                            'isActive',
                                                            option?.value,
                                                        )
                                                    }
                                                />
                                            )}
                                        </Field>
                                    </FormItem>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        icon={<HiOutlineCheck />}
                                        loading={submitting}
                                    >
                                        {isEdit
                                            ? 'Update Program'
                                            : 'Create Program'}
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

export default ProgramForm
