export type SignInCredential = {
    email: string
    password: string
}

export type SignInResponse = {
    token: string
    user: {
        userId: string
        userName: string
        authority: string[]
        avatar: string
        email: string
        customerName?: string  // Added for multi-tenant support
        customerId?: string    // Added for multi-tenant support
    }
    mfaRequired?: boolean     // Added for MFA support
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

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
    email?: string  // For MFA flow
}>

export type MfaVerifyResponse = Promise<{
    status: AuthRequestStatus
    message: string
}>

export type User = {
    userId?: string | null
    avatar?: string | null
    userName?: string | null
    email?: string | null
    authority?: string[]
    customerName?: string | null  // Added for multi-tenant support
    customerId?: string | null    // Added for multi-tenant support
    tenantId?: string | null      // Added for tenant admin
}

export type Token = {
    accessToken: string
    refreshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
