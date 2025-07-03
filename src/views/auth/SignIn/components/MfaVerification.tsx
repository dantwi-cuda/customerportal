import { useState } from 'react'
import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { useAuth } from '@/auth'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const validationSchema = z.object({
    code: z.string().min(6, 'Please enter a valid verification code'),
})

type FormValues = {
    code: string
}

interface MfaVerificationProps {
    email: string
    onVerified: () => void
    onBack: () => void
}

const MfaVerification = ({
    email,
    onVerified,
    onBack,
}: MfaVerificationProps) => {
    const [isSubmitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const { verifyMfa } = useAuth()

    const { control, handleSubmit } = useForm<FormValues>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            code: '',
        },
    })

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true)
        setError('')

        try {
            const result = await verifyMfa(email, values.code)
            if (result.status === 'success') {
                onVerified()
            } else {
                setError(result.message || 'Verification failed')
            }
        } catch (err) {
            setError('Verification failed. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="mb-1">Two-Factor Authentication</h3>
                <p>
                    Please enter the verification code sent to your email
                    address.
                </p>
            </div>

            {error && (
                <Alert className="mb-4" type="danger" showIcon>
                    {error}
                </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem
                    label="Verification Code"
                    invalid={Boolean(error)}
                    errorMessage={error}
                >
                    <Controller
                        name="code"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                            <Input
                                {...field}
                                placeholder="Enter the 6-digit code"
                                autoComplete="one-time-code"
                                type="text"
                                invalid={!!error}
                            />
                        )}
                    />
                </FormItem>

                <div className="flex items-center justify-between mt-6">
                    <Button
                        type="button"
                        variant="plain"
                        onClick={onBack}
                        disabled={isSubmitting}
                    >
                        Back to Login
                    </Button>

                    <Button
                        block
                        loading={isSubmitting}
                        variant="solid"
                        type="submit"
                    >
                        Verify
                    </Button>
                </div>
            </Form>
        </div>
    )
}

export default MfaVerification
