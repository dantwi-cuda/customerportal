export type SignInCredential = {
    email: string
    password: string
}

export type SignInResponse = {
    token: string
    refreshToken?: string
    user: {
        id: string
        email: string
        name: string
        status: string
        isCustomerUser: boolean
        isCCIUser: boolean
        createdAt: string
        lastLoginAt: string
        roles: string[]
        tenantId?: string | null
        isActive: boolean
        // Legacy fields for backwards compatibility
        userId?: string
        userName?: string
        authority?: string[]
        avatar?: string
        customerName?: string
        customerId?: string
    }
    mfaRequired?: boolean
}

export type SignUpResponse = SignInResponse

export type SignUpCredential = {
    userName: string
    email: string
    password: string
}

export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    password: string
}

export type AuthRequestStatus = 'success' | 'failed' | 'mfa_required' | ''

export type AuthResult = {
    status: AuthRequestStatus
    message: string
    email?: string  // For MFA flow
}

export type MfaVerifyResponse = {
    status: AuthRequestStatus
    message: string
}

export type MfaVerificationRequest = {
    email: string
    code: string
}

export type User = {
    id?: string | null
    email?: string | null
    name?: string | null
    status?: string | null
    isCustomerUser?: boolean
    isCCIUser?: boolean
    createdAt?: string | null
    lastLoginAt?: string | null
    roles?: string[]
    tenantId?: string | null
    isActive?: boolean
    authority?: string[]
    // Legacy fields for backwards compatibility
    userId?: string | null
    avatar?: string | null
    userName?: string | null
    customerName?: string | null
    customerId?: string | null
}

export type Token = {
    accessToken: string
    refreshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
