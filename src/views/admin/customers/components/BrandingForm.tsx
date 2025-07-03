import React, { useState } from 'react'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { Upload } from '@/components/ui/Upload'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar' // For logo preview
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'

export type BrandingFormValues = {
    logo?: File | string | null // Can be File object for new upload, string for existing URL, or null
    backgroundImage?: File | string | null
}

interface BrandingFormProps {
    initialValues?: BrandingFormValues
    // eslint-disable-next-line no-unused-vars
    onSubmit: (values: BrandingFormValues, helpers: any) => void
    isSubmitting?: boolean
    existingLogoUrl?: string
    existingBackgroundImageUrl?: string
}

const validationSchema = Yup.object().shape({
    // Add validation if specific file types or sizes are required
    // logo: Yup.mixed().test('fileType', 'Unsupported File Format', (value) => ...),
    // backgroundImage: Yup.mixed().test('fileSize', 'File too large', (value) => ...),
})

const BrandingForm: React.FC<BrandingFormProps> = ({
    initialValues = { logo: null, backgroundImage: null },
    onSubmit,
    isSubmitting,
    existingLogoUrl,
    existingBackgroundImageUrl,
}) => {
    const [logoPreview, setLogoPreview] = useState<string | null>(
        existingLogoUrl || null,
    )
    const [bgPreview, setBgPreview] = useState<string | null>(
        existingBackgroundImageUrl || null,
    )

    const handleLogoUpload = (files: File[], setFieldValue: any) => {
        if (files && files.length > 0) {
            const file = files[0]
            setFieldValue('logo', file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        } else {
            setFieldValue('logo', null)
            setLogoPreview(existingLogoUrl || null) // Revert to existing if upload is cleared
        }
    }

    const handleBackgroundUpload = (files: File[], setFieldValue: any) => {
        if (files && files.length > 0) {
            const file = files[0]
            setFieldValue('backgroundImage', file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setBgPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        } else {
            setFieldValue('backgroundImage', null)
            setBgPreview(existingBackgroundImageUrl || null) // Revert to existing
        }
    }

    return (
        <Formik
            initialValues={initialValues} // Ensure initialValues are correctly passed or default
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize // Important if initialValues can change
        >
            {({ errors, touched, setFieldValue }) => (
                <Form>
                    <FormContainer>
                        <FormItem
                            label="Logo"
                            invalid={Boolean(errors.logo && touched.logo)}
                            errorMessage={errors.logo as string}
                        >
                            <Upload
                                draggable
                                onChange={(files) =>
                                    handleLogoUpload(files, setFieldValue)
                                }
                                onFileRemove={() =>
                                    handleLogoUpload([], setFieldValue)
                                } // Clear preview and value
                                showList={false} // Hide default file list, we use Avatar for preview
                                accept=".png, .jpg, .jpeg, .gif, .svg" // Specify acceptable file types
                            >
                                {logoPreview ? (
                                    <Avatar
                                        size={100}
                                        src={logoPreview}
                                        shape="square"
                                    />
                                ) : (
                                    <div className="text-center p-4 border border-dashed rounded-md">
                                        Click or drag file to this area to
                                        upload logo
                                    </div>
                                )}
                            </Upload>
                        </FormItem>

                        <FormItem
                            label="Background Image"
                            invalid={Boolean(
                                errors.backgroundImage &&
                                    touched.backgroundImage,
                            )}
                            errorMessage={errors.backgroundImage as string}
                        >
                            <Upload
                                draggable
                                onChange={(files) =>
                                    handleBackgroundUpload(files, setFieldValue)
                                }
                                onFileRemove={() =>
                                    handleBackgroundUpload([], setFieldValue)
                                }
                                showList={false}
                                accept=".png, .jpg, .jpeg"
                            >
                                {bgPreview ? (
                                    <img
                                        src={bgPreview}
                                        alt="Background Preview"
                                        style={{
                                            maxHeight: 150,
                                            width: 'auto',
                                        }}
                                        className="rounded-md"
                                    />
                                ) : (
                                    <div className="text-center p-4 border border-dashed rounded-md">
                                        Click or drag file to this area to
                                        upload background image
                                    </div>
                                )}
                            </Upload>
                        </FormItem>

                        <FormItem>
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
