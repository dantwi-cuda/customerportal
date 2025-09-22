import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import {
    Card,
    Button,
    Notification,
    toast,
    Alert,
    Spinner,
    Badge,
    Input,
    Textarea,
    Select,
    Switcher,
    FormItem,
    FormContainer,
} from '@/components/ui'
import {
    HiOutlineArrowLeft,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineDuplicate,
} from 'react-icons/hi'
import ProgramTypeService from '@/services/ProgramTypeService'
import useAuth from '@/auth/useAuth'
import type {
    ProgramType,
    ProgramTypeAttribute,
    CreateProgramTypeRequest,
    UpdateProgramTypeRequest,
} from '@/@types/programType'

interface AttributeForm {
    attributeID?: number // Optional ID for existing attributes
    attributeName: string
    attributeDescription: string
    dataType: string
    isRequired: boolean
    defaultValue: string
    validationRules: string
    dataSource: string
}

interface ProgramTypeForm {
    typeName: string
    typeDescription: string
    isActive: boolean
    attributes: AttributeForm[]
}

const dataTypeOptions = [
    { value: 'String', label: 'Text' },
    { value: 'Number', label: 'Number' },
    { value: 'Boolean', label: 'True/False' },
    { value: 'Date', label: 'Date' },
    { value: 'DateTime', label: 'Date & Time' },
    { value: 'Email', label: 'Email' },
    { value: 'URL', label: 'URL' },
    { value: 'Phone', label: 'Phone Number' },
    { value: 'JSON', label: 'JSON Object' },
]

const dataSourceOptions = [
    { value: '', label: 'None' },
    { value: 'Manufacturers', label: 'Manufacturers' },
    { value: 'Program Category', label: 'Program Category' },
]

const programTypeValidationSchema = Yup.object({
    typeName: Yup.string()
        .required('Program type name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    typeDescription: Yup.string().max(
        500,
        'Description cannot exceed 500 characters',
    ),
    isActive: Yup.boolean(),
    attributes: Yup.array().of(
        Yup.object({
            attributeName: Yup.string()
                .required('Attribute name is required')
                .min(2, 'Name must be at least 2 characters')
                .max(100, 'Name cannot exceed 100 characters'),
            attributeDescription: Yup.string().max(
                250,
                'Description cannot exceed 250 characters',
            ),
            dataType: Yup.string().required('Data type is required'),
            isRequired: Yup.boolean(),
            defaultValue: Yup.string().max(
                255,
                'Default value cannot exceed 255 characters',
            ),
            validationRules: Yup.string().max(
                500,
                'Validation rules cannot exceed 500 characters',
            ),
            dataSource: Yup.string(),
        }),
    ),
})

const CreateEditProgramTypePage: React.FC = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const { user } = useAuth()

    const [loading, setLoading] = useState(false)
    const [programType, setProgramType] = useState<ProgramType | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const isEdit = Boolean(id)
    const title = isEdit ? 'Edit Program Type' : 'Create Program Type'

    // Check if we're in tenant portal based on current path
    const isInTenantPortal =
        window.location.pathname.startsWith('/tenantportal')
    const programTypesPath = isInTenantPortal
        ? '/tenantportal/program-types'
        : '/app/program-types'
    const programsPath = isInTenantPortal
        ? '/tenantportal/programs'
        : '/app/programs'

    // Check permissions - Only CS-Admin and CS-User can access program type management
    const hasAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasCreateAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    const hasEditAccess = user?.authority?.some((role: string) =>
        ['CS-Admin', 'CS-User'].includes(role),
    )

    useEffect(() => {
        if (isEdit && id) {
            loadProgramType(parseInt(id))
        }
    }, [id, isEdit])

    const loadProgramType = async (programTypeId: number) => {
        try {
            setLoading(true)
            const data =
                await ProgramTypeService.getProgramTypeById(programTypeId)
            setProgramType(data)
        } catch (error) {
            console.error('Error loading program type:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    Failed to load program type
                </Notification>,
            )
            navigate(programTypesPath)
        } finally {
            setLoading(false)
        }
    }

    const getInitialValues = (): ProgramTypeForm => {
        if (isEdit && programType) {
            return {
                typeName: programType.typeName,
                typeDescription: programType.typeDescription || '',
                isActive: programType.isActive,
                attributes:
                    programType.attributes?.map((attr) => {
                        // Normalize dataType to match our options
                        let dataType =
                            attr.dataType || attr.attributeType || 'String'

                        // Handle case-insensitive matching and common variations
                        const normalizedType = dataType.toLowerCase()
                        switch (normalizedType) {
                            case 'string':
                            case 'text':
                                dataType = 'String'
                                break
                            case 'number':
                            case 'int':
                            case 'integer':
                            case 'decimal':
                            case 'float':
                                dataType = 'Number'
                                break
                            case 'boolean':
                            case 'bool':
                                dataType = 'Boolean'
                                break
                            case 'date':
                                dataType = 'Date'
                                break
                            case 'datetime':
                            case 'timestamp':
                                dataType = 'DateTime'
                                break
                            case 'email':
                                dataType = 'Email'
                                break
                            case 'url':
                            case 'uri':
                                dataType = 'URL'
                                break
                            case 'phone':
                            case 'phonenumber':
                                dataType = 'Phone'
                                break
                            case 'json':
                            case 'object':
                                dataType = 'JSON'
                                break
                            default:
                                // If we don't recognize the type, check if it matches any of our option values exactly
                                const matchingOption = dataTypeOptions.find(
                                    (option) =>
                                        option.value.toLowerCase() ===
                                        normalizedType,
                                )
                                dataType = matchingOption
                                    ? matchingOption.value
                                    : 'String'
                        }

                        return {
                            attributeID: attr.attributeID, // Include the ID for existing attributes
                            attributeName: attr.attributeName,
                            attributeDescription:
                                attr.attributeDescription ||
                                attr.description ||
                                '',
                            dataType: dataType,
                            isRequired: attr.isRequired,
                            defaultValue: attr.defaultValue || '',
                            validationRules: attr.validationRules || '',
                            dataSource: attr.dataSource || '',
                        }
                    }) || [],
            }
        }

        return {
            typeName: '',
            typeDescription: '',
            isActive: true,
            attributes: [],
        }
    }

    const handleSubmit = async (values: ProgramTypeForm) => {
        try {
            setSubmitting(true)

            if (isEdit && id) {
                // Update existing program type (without attributes)
                const updateRequest: UpdateProgramTypeRequest = {
                    typeName: values.typeName,
                    typeDescription: values.typeDescription,
                    isActive: values.isActive,
                    attributes: [], // Attributes will be handled separately
                }

                await ProgramTypeService.updateProgramType(
                    parseInt(id),
                    updateRequest,
                )

                // Handle attributes separately for updates
                const programTypeId = parseInt(id)

                // Get existing attributes to determine which to update/create/delete
                const existingProgramType =
                    await ProgramTypeService.getProgramTypeById(programTypeId)
                const existingAttributes = existingProgramType.attributes || []

                // Create or update attributes
                for (const attr of values.attributes) {
                    const attributeRequest = {
                        programTypeID: programTypeId,
                        attributeName: attr.attributeName,
                        attributeType: attr.dataType,
                        attributeDescription: attr.attributeDescription,
                        dataType: attr.dataType,
                        isRequired: attr.isRequired,
                        defaultValue: attr.defaultValue,
                        description: attr.attributeDescription,
                        validationRules: attr.validationRules,
                        dataSource: attr.dataSource,
                        isActive: true,
                    }

                    if (attr.attributeID && attr.attributeID > 0) {
                        // Update existing attribute
                        await ProgramTypeService.updateProgramTypeAttribute(
                            programTypeId,
                            attr.attributeID,
                            attributeRequest,
                        )
                    } else {
                        // Create new attribute
                        await ProgramTypeService.createProgramTypeAttribute(
                            attributeRequest,
                        )
                    }
                }

                // Delete attributes that were removed
                const currentAttributeIds = values.attributes
                    .filter((attr) => attr.attributeID && attr.attributeID > 0)
                    .map((attr) => attr.attributeID!)

                for (const existingAttr of existingAttributes) {
                    if (
                        existingAttr.attributeID &&
                        !currentAttributeIds.includes(existingAttr.attributeID)
                    ) {
                        await ProgramTypeService.deleteProgramTypeAttribute(
                            programTypeId,
                            existingAttr.attributeID,
                        )
                    }
                }

                toast.push(
                    <Notification type="success" title="Success">
                        Program type updated successfully
                    </Notification>,
                )
            } else {
                // Create new program type (without attributes)
                const createRequest: CreateProgramTypeRequest = {
                    typeName: values.typeName,
                    typeDescription: values.typeDescription,
                    isActive: values.isActive,
                    attributes: [], // Attributes will be handled separately
                }

                const createdProgramType =
                    await ProgramTypeService.createProgramType(createRequest)
                const programTypeId = createdProgramType.programTypeID

                // Create attributes separately
                for (const attr of values.attributes) {
                    const attributeRequest = {
                        programTypeID: programTypeId,
                        attributeName: attr.attributeName,
                        attributeType: attr.dataType,
                        attributeDescription: attr.attributeDescription,
                        dataType: attr.dataType,
                        isRequired: attr.isRequired,
                        defaultValue: attr.defaultValue,
                        description: attr.attributeDescription,
                        validationRules: attr.validationRules,
                        dataSource: attr.dataSource,
                        isActive: true,
                    }

                    await ProgramTypeService.createProgramTypeAttribute(
                        attributeRequest,
                    )
                }

                toast.push(
                    <Notification type="success" title="Success">
                        Program type created successfully
                    </Notification>,
                )
            }

            navigate(programTypesPath)
        } catch (error) {
            console.error('Error saving program type:', error)
            toast.push(
                <Notification type="danger" title="Error">
                    {error instanceof Error
                        ? error.message
                        : 'Failed to save program type'}
                </Notification>,
            )
        } finally {
            setSubmitting(false)
        }
    }

    const addAttribute = (setFieldValue: any, attributes: AttributeForm[]) => {
        const newAttribute: AttributeForm = {
            attributeName: '',
            attributeDescription: '',
            dataType: 'String',
            isRequired: false,
            defaultValue: '',
            validationRules: '',
            dataSource: '',
        }
        setFieldValue('attributes', [...attributes, newAttribute])
    }

    const removeAttribute = (
        setFieldValue: any,
        attributes: AttributeForm[],
        index: number,
    ) => {
        const newAttributes = attributes.filter((_, i) => i !== index)
        setFieldValue('attributes', newAttributes)
    }

    const duplicateAttribute = (
        setFieldValue: any,
        attributes: AttributeForm[],
        index: number,
    ) => {
        const attributeToDuplicate = attributes[index]
        const newAttribute: AttributeForm = {
            // Don't include attributeID for duplicated attributes (they should be new)
            attributeName: `${attributeToDuplicate.attributeName} Copy`,
            attributeDescription: attributeToDuplicate.attributeDescription,
            dataType: attributeToDuplicate.dataType,
            isRequired: attributeToDuplicate.isRequired,
            defaultValue: attributeToDuplicate.defaultValue,
            validationRules: attributeToDuplicate.validationRules,
            dataSource: attributeToDuplicate.dataSource,
        }
        const newAttributes = [...attributes]
        newAttributes.splice(index + 1, 0, newAttribute)
        setFieldValue('attributes', newAttributes)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <Spinner size="40px" />
            </div>
        )
    }

    // Check if user has access to program type management
    if (!hasAccess) {
        return (
            <div className="space-y-4">
                <Card>
                    <div className="p-6 text-center">
                        <Alert type="warning" title="Access Denied">
                            You don't have permission to manage program types.
                            Only CS-Admin and CS-User roles can access this
                            feature.
                        </Alert>
                        <Button
                            variant="plain"
                            className="mt-4"
                            onClick={() => navigate(programsPath)}
                        >
                            Back to Programs
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    // Permission check for edit mode
    if (isEdit && !hasEditAccess) {
        return (
            <Alert type="warning" title="Access Denied">
                You don't have permission to edit program types.
            </Alert>
        )
    }

    // Permission check for create mode
    if (!isEdit && !hasCreateAccess) {
        return (
            <Alert type="warning" title="Access Denied">
                You don't have permission to create program types.
            </Alert>
        )
    }

    return (
        <div className="space-y-4">
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="plain"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(programTypesPath)}
                    >
                        Back to Program Types
                    </Button>
                    <div>
                        <h4 className="mb-1">{title}</h4>
                        <p className="text-gray-600">
                            {isEdit
                                ? 'Update program type and its attributes'
                                : 'Create a new program type with custom attributes'}
                        </p>
                    </div>
                </div>

                <Formik
                    initialValues={getInitialValues()}
                    validationSchema={programTypeValidationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ values, setFieldValue, errors, touched }) => (
                        <Form>
                            <FormContainer>
                                <div className="space-y-6">
                                    {/* Basic Information */}
                                    <Card className="p-6">
                                        <h5 className="mb-4">
                                            Basic Information
                                        </h5>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <FormItem
                                                label="Program Type Name"
                                                invalid={
                                                    !!(
                                                        errors.typeName &&
                                                        touched.typeName
                                                    )
                                                }
                                                errorMessage={errors.typeName}
                                            >
                                                <Field name="typeName">
                                                    {({ field, form }: any) => (
                                                        <Input
                                                            {...field}
                                                            placeholder="Enter program type name"
                                                            onChange={(e) =>
                                                                form.setFieldValue(
                                                                    field.name,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </Field>
                                            </FormItem>

                                            <FormItem label="Active Status">
                                                <Field name="isActive">
                                                    {({ field, form }: any) => (
                                                        <Switcher
                                                            checked={
                                                                field.value
                                                            }
                                                            onChange={(
                                                                checked,
                                                            ) =>
                                                                form.setFieldValue(
                                                                    field.name,
                                                                    checked,
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </Field>
                                            </FormItem>
                                        </div>

                                        <div className="mt-4">
                                            <FormItem
                                                label="Description"
                                                invalid={
                                                    !!(
                                                        errors.typeDescription &&
                                                        touched.typeDescription
                                                    )
                                                }
                                                errorMessage={
                                                    errors.typeDescription
                                                }
                                            >
                                                <Field name="typeDescription">
                                                    {({ field, form }: any) => (
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Enter program type description (optional)"
                                                            rows={3}
                                                            onChange={(e) =>
                                                                form.setFieldValue(
                                                                    field.name,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </Field>
                                            </FormItem>
                                        </div>
                                    </Card>

                                    {/* Attributes */}
                                    <Card className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h5>Attributes</h5>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Define custom attributes for
                                                    this program type
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="solid"
                                                size="sm"
                                                icon={<HiOutlinePlus />}
                                                onClick={() =>
                                                    addAttribute(
                                                        setFieldValue,
                                                        values.attributes,
                                                    )
                                                }
                                            >
                                                Add Attribute
                                            </Button>
                                        </div>

                                        {values.attributes.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <p>
                                                    No attributes defined yet.
                                                </p>
                                                <p className="text-sm">
                                                    Click "Add Attribute" to
                                                    create custom fields for
                                                    this program type.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {values.attributes.map(
                                                    (attribute, index) => (
                                                        <div
                                                            key={index}
                                                            className="space-y-4"
                                                        >
                                                            <Card className="p-4 border border-gray-200">
                                                                <div className="flex items-start justify-between mb-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge>
                                                                            Attribute{' '}
                                                                            {index +
                                                                                1}
                                                                        </Badge>
                                                                        {attribute.isRequired && (
                                                                            <Badge className="bg-red-100 text-red-800">
                                                                                Required
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="plain"
                                                                            size="xs"
                                                                            icon={
                                                                                <HiOutlineDuplicate />
                                                                            }
                                                                            onClick={() =>
                                                                                duplicateAttribute(
                                                                                    setFieldValue,
                                                                                    values.attributes,
                                                                                    index,
                                                                                )
                                                                            }
                                                                            title="Duplicate attribute"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="plain"
                                                                            size="xs"
                                                                            icon={
                                                                                <HiOutlineTrash />
                                                                            }
                                                                            onClick={() =>
                                                                                removeAttribute(
                                                                                    setFieldValue,
                                                                                    values.attributes,
                                                                                    index,
                                                                                )
                                                                            }
                                                                            className="text-red-600 hover:text-red-800"
                                                                            title="Remove attribute"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                    <FormItem label="Attribute Name">
                                                                        <Field
                                                                            name={`attributes.${index}.attributeName`}
                                                                        >
                                                                            {({
                                                                                field,
                                                                                form,
                                                                            }: any) => (
                                                                                <Input
                                                                                    {...field}
                                                                                    placeholder="Enter attribute name"
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>

                                                                    <FormItem label="Data Type">
                                                                        <Field
                                                                            name={`attributes.${index}.dataType`}
                                                                        >
                                                                            {({
                                                                                field,
                                                                                form,
                                                                            }: any) => (
                                                                                <Select
                                                                                    {...field}
                                                                                    options={
                                                                                        dataTypeOptions
                                                                                    }
                                                                                    value={dataTypeOptions.find(
                                                                                        (
                                                                                            option,
                                                                                        ) =>
                                                                                            option.value ===
                                                                                            field.value,
                                                                                    )}
                                                                                    onChange={(
                                                                                        selectedOption: any,
                                                                                    ) =>
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            selectedOption?.value ||
                                                                                                '',
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>
                                                                </div>

                                                                <div className="mt-4">
                                                                    <FormItem label="Description">
                                                                        <Field
                                                                            name={`attributes.${index}.attributeDescription`}
                                                                        >
                                                                            {({
                                                                                field,
                                                                                form,
                                                                            }: any) => (
                                                                                <Textarea
                                                                                    {...field}
                                                                                    placeholder="Enter attribute description (optional)"
                                                                                    rows={
                                                                                        2
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>
                                                                </div>

                                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                                                                    <FormItem label="Default Value">
                                                                        <Field
                                                                            name={`attributes.${index}.defaultValue`}
                                                                        >
                                                                            {({
                                                                                field,
                                                                                form,
                                                                            }: any) => (
                                                                                <Input
                                                                                    {...field}
                                                                                    placeholder="Enter default value (optional)"
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>

                                                                    <FormItem label="Data Source">
                                                                        <Field
                                                                            name={`attributes.${index}.dataSource`}
                                                                        >
                                                                            {({
                                                                                field,
                                                                                form,
                                                                            }: any) => (
                                                                                <Select
                                                                                    {...field}
                                                                                    options={
                                                                                        dataSourceOptions
                                                                                    }
                                                                                    value={dataSourceOptions.find(
                                                                                        (
                                                                                            option,
                                                                                        ) =>
                                                                                            option.value ===
                                                                                            field.value,
                                                                                    )}
                                                                                    onChange={(
                                                                                        selectedOption: any,
                                                                                    ) =>
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            selectedOption?.value ||
                                                                                                '',
                                                                                        )
                                                                                    }
                                                                                    placeholder="Select data source"
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>

                                                                    <FormItem label="Required Field">
                                                                        <Field
                                                                            name={`attributes.${index}.isRequired`}
                                                                        >
                                                                            {({
                                                                                field,
                                                                                form,
                                                                            }: any) => (
                                                                                <Switcher
                                                                                    checked={
                                                                                        field.value
                                                                                    }
                                                                                    onChange={(
                                                                                        checked,
                                                                                    ) =>
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            checked,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>
                                                                </div>

                                                                <div className="mt-4">
                                                                    <FormItem label="Validation Rules">
                                                                        <Field
                                                                            name={`attributes.${index}.validationRules`}
                                                                        >
                                                                            {({
                                                                                field,
                                                                                form,
                                                                            }: any) => (
                                                                                <Textarea
                                                                                    {...field}
                                                                                    placeholder="Enter validation rules in JSON format (optional)"
                                                                                    rows={
                                                                                        2
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        form.setFieldValue(
                                                                                            field.name,
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </Field>
                                                                    </FormItem>
                                                                </div>

                                                                {/* Remove button at the bottom of the card */}
                                                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                                                                    <Button
                                                                        type="button"
                                                                        variant="plain"
                                                                        size="sm"
                                                                        icon={
                                                                            <HiOutlineTrash />
                                                                        }
                                                                        onClick={() =>
                                                                            removeAttribute(
                                                                                setFieldValue,
                                                                                values.attributes,
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                    >
                                                                        Remove
                                                                        Attribute
                                                                    </Button>
                                                                </div>
                                                            </Card>

                                                            {/* Add attribute button after each card */}
                                                            <div className="flex justify-center">
                                                                <Button
                                                                    type="button"
                                                                    variant="plain"
                                                                    size="sm"
                                                                    icon={
                                                                        <HiOutlinePlus />
                                                                    }
                                                                    onClick={() =>
                                                                        addAttribute(
                                                                            setFieldValue,
                                                                            values.attributes,
                                                                        )
                                                                    }
                                                                    className="border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800"
                                                                >
                                                                    Add Another
                                                                    Attribute
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}

                                                {/* Final add button if no attributes exist yet */}
                                                {values.attributes.length ===
                                                    0 && (
                                                    <div className="flex justify-center py-4">
                                                        <Button
                                                            type="button"
                                                            variant="solid"
                                                            size="sm"
                                                            icon={
                                                                <HiOutlinePlus />
                                                            }
                                                            onClick={() =>
                                                                addAttribute(
                                                                    setFieldValue,
                                                                    values.attributes,
                                                                )
                                                            }
                                                        >
                                                            Add First Attribute
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="plain"
                                            onClick={() =>
                                                navigate(programTypesPath)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="solid"
                                            loading={submitting}
                                        >
                                            {isEdit
                                                ? 'Update Program Type'
                                                : 'Create Program Type'}
                                        </Button>
                                    </div>
                                </div>
                            </FormContainer>
                        </Form>
                    )}
                </Formik>
            </Card>
        </div>
    )
}

export default CreateEditProgramTypePage
