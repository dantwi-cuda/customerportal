import { createContext } from 'react'
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult, // This is already a Promise type: Promise<{ status: AuthRequestStatus; message: string; email?: string; }>
    User,
    OauthSignInCallbackPayload,
    MfaVerifyResponse, // This is already a Promise type: Promise<{ status: AuthRequestStatus; message: string; }>
    AuthRequestStatus,
} from '@/@types/auth'

type Auth = {
    authenticated: boolean
    user: User
    signIn: (values: SignInCredential) => AuthResult
    signUp: (values: SignUpCredential) => AuthResult
    signOut: () => void
    oAuthSignIn: (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => void
    verifyMfa: (email: string, code: string) => MfaVerifyResponse // Changed to MfaVerifyResponse
    isCustomerPortal: boolean
    customerName: string
    accessCustomerPortal: (customerId: string) => AuthResult // Changed to AuthResult
    exitCustomerPortal: () => void
}

const defaultFunctionPlaceHolder = async (): AuthResult => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return {
        status: '' as AuthRequestStatus,
        message: '',
    }
}

const defaultOAuthSignInPlaceHolder = (
    callback: (payload: OauthSignInCallbackPayload) => void,
): void => {
    callback({
        onSignIn: () => {},
        redirect: () => {},
    })
}

const defaultMfaVerifyPlaceholder = async (): MfaVerifyResponse => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    return {
        status: '' as AuthRequestStatus,
        message: '',
    }
}

const AuthContext = createContext<Auth>({
    authenticated: false,
    user: {},
    signIn: defaultFunctionPlaceHolder,
    signUp: defaultFunctionPlaceHolder,
    signOut: () => {},
    oAuthSignIn: defaultOAuthSignInPlaceHolder,
    verifyMfa: defaultMfaVerifyPlaceholder,
    isCustomerPortal: false,
    customerName: '',
    accessCustomerPortal: defaultFunctionPlaceHolder,
    exitCustomerPortal: () => {},
})

export default AuthContext
