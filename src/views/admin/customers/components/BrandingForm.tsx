import React from 'react'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import ImageUploadComponent from '@/components/shared/ImageUploadComponent'

export type BrandingFormValues = {
    logo?: File | string | null
    backgroundImage?: File | string | null
    icon?: File | string | null // Added icon field
}

interface BrandingFormProps {
    initialValues?: BrandingFormValues
    // eslint-disable-next-line no-unused-vars
    onSubmit: (values: BrandingFormValues, helpers: any) => void
    isSubmitting?: boolean
    existingLogoUrl?: string
    existingBackgroundImageUrl?: string
    existingIconUrl?: string // Added icon URL prop
}

const validationSchema = Yup.object().shape({
    logo: Yup.mixed().nullable(),
    backgroundImage: Yup.mixed().nullable(),
    icon: Yup.mixed().nullable(), // Added icon validation
})

const BrandingForm: React.FC<BrandingFormProps> = ({
    initialValues = { logo: null, backgroundImage: null, icon: null },
    onSubmit,
    isSubmitting,
    existingLogoUrl,
    existingBackgroundImageUrl,
    existingIconUrl, // Added icon URL
}) => {
    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ setFieldValue }) => (
                <Form>
                    <FormContainer>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {/* Logo Upload */}
                            <div>
                                <h5 className="mb-4">Customer Logo</h5>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload your customer's logo. Recommended:
                                    200x100px, max 2MB.
                                </p>
                                <Field name="logo">
                                    {({ field, meta }: any) => (
                                        <ImageUploadComponent
                                            label="Company Logo"
                                            description="Upload company logo"
                                            currentImageUrl={existingLogoUrl}
                                            onUpload={async (file: File) => {
                                                setFieldValue('logo', file)
                                                return {
                                                    url: URL.createObjectURL(
                                                        file,
                                                    ),
                                                    fileName: file.name,
                                                    originalFileName: file.name,
                                                    contentType: file.type,
                                                    sizeInBytes: file.size,
                                                    uploadedAt:
                                                        new Date().toISOString(),
                                                }
                                            }}
                                            accept="image/*"
                                            maxSizeInMB={2}
                                            maxWidth={500}
                                            maxHeight={250}
                                        />
                                    )}
                                </Field>
                            </div>

                            {/* Background Image Upload */}
                            <div>
                                <h5 className="mb-4">Background Image</h5>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload a background image for the customer
                                    portal. Recommended: 1920x1080px, max 5MB.
                                </p>
                                <Field name="backgroundImage">
                                    {({ field, meta }: any) => (
                                        <ImageUploadComponent
                                            label="Background Image"
                                            description="Upload background image"
                                            currentImageUrl={
                                                existingBackgroundImageUrl
                                            }
                                            onUpload={async (file: File) => {
                                                setFieldValue(
                                                    'backgroundImage',
                                                    file,
                                                )
                                                return {
                                                    url: URL.createObjectURL(
                                                        file,
                                                    ),
                                                    fileName: file.name,
                                                    originalFileName: file.name,
                                                    contentType: file.type,
                                                    sizeInBytes: file.size,
                                                    uploadedAt:
                                                        new Date().toISOString(),
                                                }
                                            }}
                                            accept="image/*"
                                            maxSizeInMB={5}
                                            aspectRatio="16:9"
                                        />
                                    )}
                                </Field>
                            </div>

                            {/* Icon Upload */}
                            <div>
                                <h5 className="mb-4">Portal Icon</h5>
                                <p className="text-sm text-gray-600 mb-4">
                                    Upload a favicon/icon for the customer
                                    portal. Recommended: 32x32px, max 1MB.
                                </p>
                                <Field name="icon">
                                    {({ field, meta }: any) => (
                                        <ImageUploadComponent
                                            label="Portal Icon"
                                            description="Upload portal icon/favicon"
                                            currentImageUrl={existingIconUrl}
                                            onUpload={async (file: File) => {
                                                setFieldValue('icon', file)
                                                return {
                                                    url: URL.createObjectURL(
                                                        file,
                                                    ),
                                                    fileName: file.name,
                                                    originalFileName: file.name,
                                                    contentType: file.type,
                                                    sizeInBytes: file.size,
                                                    uploadedAt:
                                                        new Date().toISOString(),
                                                }
                                            }}
                                            accept="image/*"
                                            maxSizeInMB={1}
                                            minWidth={16}
                                            minHeight={16}
                                            maxWidth={512}
                                            maxHeight={512}
                                            aspectRatio="1:1"
                                        />
                                    )}
                                </Field>
                            </div>
                        </div>

                        <FormItem className="mt-8">
                            <Button
                                variant="solid"
                                type="submit"
                                loading={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Branding'}
                            </Button>
                        </FormItem>
                    </FormContainer>
                </Form>
            )}
        </Formik>
    )
}

export default BrandingForm
