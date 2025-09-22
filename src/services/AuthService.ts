import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    SignInCredential,
    SignUpCredential,
    ForgotPassword,
    ResetPassword,
    SignInResponse,
    SignUpResponse,
    MfaVerificationRequest,
} from '@/@types/auth'

export async function apiSignIn(data: SignInCredential) {
    return ApiService.fetchDataWithAxios<SignInResponse>({
        url: endpointConfig.auth.signIn,
        method: 'post',
        data,
    })
}

export async function apiSignUp(data: SignUpCredential) {
    return ApiService.fetchDataWithAxios<SignUpResponse>({
        url: endpointConfig.auth.signIn, // Using sign-in for now, update when signup endpoint is available
        method: 'post',
        data,
    })
}

export async function apiSignOut() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.auth.signOut,
        method: 'post',
    })
}

export async function apiVerifyMfa(data: MfaVerificationRequest) {
    return ApiService.fetchDataWithAxios<SignInResponse>({
        url: endpointConfig.auth.verifyMfa,
        method: 'post',
        data,
    })
}

// Add this function to match the import in AuthProvider.tsx
export async function verifyMfaCode(email: string, code: string) {
    return ApiService.fetchDataWithAxios<{
        success: boolean;
        token: string;
        user?: any;
        message?: string;
    }>({
        url: endpointConfig.auth.verifyMfa,
        method: 'post',
        data: { email, code },
    })
}

export async function apiRefreshToken(refreshToken: string, currentToken?: string) {
    return ApiService.fetchDataWithAxios<SignInResponse>({
        url: endpointConfig.auth.refreshToken,
        method: 'post',
        data: { 
            token: currentToken || '', 
            refreshToken 
        },
    })
}

export async function apiForgotPassword<T>(data: ForgotPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: 'Auth/forgot-password',
        method: 'post',
        data,
    })
}

export async function apiResetPassword<T>(data: ResetPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.auth.resetPassword,
        method: 'post',
        data,
    })
}

// Add this function for changing password based on the swagger endpoint
export async function apiChangePassword<T>(data: { currentPassword: string, newPassword: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.auth.changePassword,
        method: 'post',
        data,
    })
}
