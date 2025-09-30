import React from 'react'
import { FormItem, FormContainer } from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Button } from '@/components/ui/Button'
import { Switcher } from '@/components/ui/Switcher'
import classNames from '@/utils/classNames'
import { TbCheck } from 'react-icons/tb'
import presetThemeSchemaConfig from '@/configs/preset-theme-schema.config'

export type CustomerInfoFormValues = {
    name: string
    subdomain: string
    address?: string
    theme?: string
    legacyBusinessNetworkID?: string
    portalDisplayName?: string
    portalDisplaySubName?: string
    portalDisplayPageSubTitle?: string
    isActive?: boolean
}

interface CustomerInfoFormProps {
    initialValues?: CustomerInfoFormValues
    // eslint-disable-next-line no-unused-vars
    onSubmit: (values: CustomerInfoFormValues, helpers: any) => void
    isSubmitting?: boolean
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Customer name is required'),
    subdomain: Yup.string().required('Subdomain is required'),
    address: Yup.string(),
    theme: Yup.string(),
    legacyBusinessNetworkID: Yup.string(),
    portalDisplayName: Yup.string(),
    portalDisplaySubName: Yup.string(),
    portalDisplayPageSubTitle: Yup.string(),
})

const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
    initialValues = {
        name: '',
        subdomain: '',
        address: '',
        theme: 'default',
        legacyBusinessNetworkID: '',
        portalDisplayName: '',
        portalDisplaySubName: '',
        portalDisplayPageSubTitle: '',
        isActive: true,
    },
    onSubmit,
    isSubmitting,
}) => {
    console.log('CustomerInfoForm received initialValues:', initialValues)
    console.log('CustomerInfoForm initialValues breakdown:', {
        name: initialValues.name,
        subdomain: initialValues.subdomain,
        address: initialValues.address,
        theme: initialValues.theme,
        legacyBusinessNetworkID: initialValues.legacyBusinessNetworkID,
        portalDisplayName: initialValues.portalDisplayName,
        portalDisplaySubName: initialValues.portalDisplaySubName,
        portalDisplayPageSubTitle: initialValues.portalDisplayPageSubTitle,
        isActive: initialValues.isActive,
    })

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize
        >
            {({ errors, touched, values, setFieldValue }) => {
                console.log('CustomerInfoForm current form values:', values)
                console.log('CustomerInfoForm form values breakdown:', {
                    name: values.name,
                    subdomain: values.subdomain,
                    address: values.address,
                    theme: values.theme,
                    legacyBusinessNetworkID: values.legacyBusinessNetworkID,
                    portalDisplayName: values.portalDisplayName,
                    portalDisplaySubName: values.portalDisplaySubName,
                    portalDisplayPageSubTitle: values.portalDisplayPageSubTitle,
                    isActive: values.isActive,
                })
                return (
                    <Form>
                        <FormContainer>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem
                                    label="Customer Name"
                                    invalid={!!(errors.name && touched.name)}
                                    errorMessage={errors.name}
                                >
                                    <Field name="name">
                                        {({ field, meta }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Enter customer name"
                                                invalid={
                                                    meta.touched && meta.error
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                <FormItem
                                    label="Subdomain"
                                    invalid={
                                        !!(
                                            errors.subdomain &&
                                            touched.subdomain
                                        )
                                    }
                                    errorMessage={errors.subdomain}
                                >
                                    <Field name="subdomain">
                                        {({ field, meta }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Enter subdomain"
                                                invalid={
                                                    meta.touched && meta.error
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                            </div>

                            <FormItem
                                label="Address"
                                invalid={!!(errors.address && touched.address)}
                                errorMessage={errors.address}
                            >
                                <Field name="address">
                                    {({ field, meta }: any) => (
                                        <Input
                                            {...field}
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Enter address"
                                            invalid={meta.touched && meta.error}
                                        />
                                    )}
                                </Field>
                            </FormItem>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem label="Theme">
                                    <Field name="theme">
                                        {({ field, form }: any) => (
                                            <div className="inline-flex items-center gap-2">
                                                {Object.entries(
                                                    presetThemeSchemaConfig,
                                                ).map(([key, value]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        className={classNames(
                                                            'h-8 w-8 rounded-full flex items-center justify-center border-2 border-white',
                                                            field.value ===
                                                                key &&
                                                                'ring-2 ring-primary',
                                                        )}
                                                        style={{
                                                            backgroundColor:
                                                                value.light
                                                                    .primary ||
                                                                '',
                                                        }}
                                                        onClick={() =>
                                                            form.setFieldValue(
                                                                'theme',
                                                                key,
                                                            )
                                                        }
                                                    >
                                                        {field.value === key ? (
                                                            <TbCheck className="text-neutral text-lg" />
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </Field>
                                </FormItem>

                                <FormItem
                                    label="Legacy Business Network ID"
                                    invalid={
                                        !!(
                                            errors.legacyBusinessNetworkID &&
                                            touched.legacyBusinessNetworkID
                                        )
                                    }
                                    errorMessage={
                                        errors.legacyBusinessNetworkID
                                    }
                                >
                                    <Field name="legacyBusinessNetworkID">
                                        {({ field, meta }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Enter legacy business network ID"
                                                invalid={
                                                    meta.touched && meta.error
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem
                                    label="Portal Display Name"
                                    invalid={
                                        !!(
                                            errors.portalDisplayName &&
                                            touched.portalDisplayName
                                        )
                                    }
                                    errorMessage={errors.portalDisplayName}
                                >
                                    <Field name="portalDisplayName">
                                        {({ field, meta }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Enter portal display name"
                                                invalid={
                                                    meta.touched && meta.error
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>

                                <FormItem
                                    label="Portal Display Sub Name"
                                    invalid={
                                        !!(
                                            errors.portalDisplaySubName &&
                                            touched.portalDisplaySubName
                                        )
                                    }
                                    errorMessage={errors.portalDisplaySubName}
                                >
                                    <Field name="portalDisplaySubName">
                                        {({ field, meta }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Enter portal display sub name"
                                                invalid={
                                                    meta.touched && meta.error
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormItem
                                    label="Portal Display Page Sub Title"
                                    invalid={
                                        !!(
                                            errors.portalDisplayPageSubTitle &&
                                            touched.portalDisplayPageSubTitle
                                        )
                                    }
                                    errorMessage={
                                        errors.portalDisplayPageSubTitle
                                    }
                                >
                                    <Field name="portalDisplayPageSubTitle">
                                        {({ field, meta }: any) => (
                                            <Input
                                                {...field}
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Enter portal display page sub title"
                                                invalid={
                                                    meta.touched && meta.error
                                                }
                                            />
                                        )}
                                    </Field>
                                </FormItem>
                            </div>

                            <FormItem label="Active Status">
                                <Switcher
                                    checked={values.isActive}
                                    onChange={(checked: boolean) =>
                                        setFieldValue('isActive', checked)
                                    }
                                />
                                <span className="ml-2 text-sm">
                                    {values.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </FormItem>

                            <FormItem>
                                <Button
                                    type="submit"
                                    variant="solid"
                                    loading={isSubmitting}
                                >
                                    {isSubmitting
                                        ? 'Saving...'
                                        : 'Save Customer Information'}
                                </Button>
                            </FormItem>
                        </FormContainer>
                    </Form>
                )
            }}
        </Formik>
    )
}

export default CustomerInfoForm
