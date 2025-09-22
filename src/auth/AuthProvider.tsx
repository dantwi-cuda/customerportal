import { useRef, useImperativeHandle, useState, useEffect } from 'react'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import {
    apiSignIn,
    apiSignOut,
    apiSignUp,
    verifyMfaCode,
    apiRefreshToken,
} from '@/services/AuthService'
import {
    getCustomerAccessToken,
    endCustomerSession,
} from '@/services/CustomerService'
import { REDIRECT_URL_KEY, ORIGINAL_PORTAL_KEY } from '@/constants/app.constant'
import { useNavigate } from 'react-router'
import type {
    SignInCredential,
    SignUpCredential,
    AuthResult,
    OauthSignInCallbackPayload,
    User,
    Token,
    MfaVerifyResponse,
} from '@/@types/auth'
import type { ReactNode, Ref } from 'react'
import type { NavigateFunction } from 'react-router'

type AuthProviderProps = { children: ReactNode }

export type IsolatedNavigatorRef = {
    navigate: NavigateFunction
}

const IsolatedNavigator = ({ ref }: { ref: Ref<IsolatedNavigatorRef> }) => {
    const navigate = useNavigate()

    useImperativeHandle(ref, () => {
        return {
            navigate,
        }
    }, [navigate])

    return <></>
}

function AuthProvider({ children }: AuthProviderProps) {
    const signedIn = useSessionUser((state) => state.session.signedIn)
    const user = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)
    const setSessionSignedIn = useSessionUser(
        (state) => state.setSessionSignedIn,
    )
    const { token, setToken, setRefreshToken, clearTokens } = useToken()
    const [tokenState, setTokenState] = useState(token)
    const [isCustomerPortal, setIsCustomerPortal] = useState(false)
    const [customerName, setCustomerName] = useState('')

    const authenticated = Boolean(tokenState && signedIn)

    const navigatorRef = useRef<IsolatedNavigatorRef>(null)

    // Determine if current session is in a customer portal
    useEffect(() => {
        const hostname = window.location.hostname

        // Check if we're on a customer subdomain
        if (hostname !== 'urlist.com' && hostname !== 'localhost') {
            const parts = hostname.split('.')
            if (parts.length >= 3) {
                setIsCustomerPortal(true)

                // Get customer name from session if available
                if (user?.customerName) {
                    setCustomerName(user.customerName)
                } else {
                    // Get customer name based on subdomain
                    // This would typically be fetched from an API
                    setCustomerName(parts[0])
                }
            }
        }

        // Check if we're accessing via token in URL (customer portal access)
        const urlParams = new URLSearchParams(window.location.search)
        const accessToken = urlParams.get('token')

        if (accessToken && !authenticated) {
            // Handle access token from URL (customer portal access flow)
            handleSignIn({ accessToken }, undefined)

            // Remove token from URL for security
            const cleanUrl = window.location.pathname
            window.history.replaceState({}, document.title, cleanUrl)
        }
    }, [authenticated, user])

    const redirect = () => {
        const search = window.location.search
        const params = new URLSearchParams(search)
        const redirectUrl = params.get(REDIRECT_URL_KEY)

        navigatorRef.current?.navigate(
            redirectUrl ? redirectUrl : appConfig.authenticatedEntryPath,
        )
    }

    const handleSignIn = (
        tokens: Token,
        user?: User & { roles?: string[] },
    ) => {
        setToken(tokens.accessToken)
        setTokenState(tokens.accessToken)

        // Store refresh token if provided
        if (tokens.refreshToken) {
            setRefreshToken(tokens.refreshToken)
        }

        setSessionSignedIn(true)

        if (user) {
            // Map backend roles to frontend authority
            const userToStore: User = {
                ...user,
                authority: user.roles || user.authority || [], // Prioritize roles, then authority, then empty array
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (userToStore as any).roles // Remove roles property to avoid confusion

            console.log('AuthProvider: User to store:', userToStore)
            console.log('AuthProvider: User authority:', userToStore.authority)

            setUser(userToStore)
        }
    }

    const handleSignOut = () => {
        clearTokens()
        setUser({})
        setSessionSignedIn(false)
    }

    const signIn = async (values: SignInCredential): Promise<AuthResult> => {
        try {
            const resp = await apiSignIn(values)
            if (resp) {
                // Handle both access token and refresh token
                const tokens: Token = {
                    accessToken: resp.token,
                    refreshToken: resp.refreshToken,
                }

                handleSignIn(tokens, resp.user)

                // Check if MFA is required
                if (resp.mfaRequired) {
                    // Return early to allow MFA verification
                    return {
                        status: 'mfa_required',
                        message: 'MFA verification required',
                        email: values.email,
                    }
                }

                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to sign in',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const verifyMfa = async (
        email: string,
        code: string,
    ): Promise<MfaVerifyResponse> => {
        try {
            const resp = await verifyMfaCode(email, code)
            if (resp.success) {
                handleSignIn({ accessToken: resp.token }, resp.user)
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: resp.message || 'Invalid verification code',
            }
        } catch (error: any) {
            return {
                status: 'failed',
                message: error?.response?.data?.message || error.toString(),
            }
        }
    }

    const signUp = async (values: SignUpCredential): Promise<AuthResult> => {
        try {
            const resp = await apiSignUp(values)
            if (resp) {
                handleSignIn({ accessToken: resp.token }, resp.user)
                redirect()
                return {
                    status: 'success',
                    message: '',
                }
            }
            return {
                status: 'failed',
                message: 'Unable to sign up',
            }
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        } catch (errors: any) {
            return {
                status: 'failed',
                message: errors?.response?.data?.message || errors.toString(),
            }
        }
    }

    const signOut = async () => {
        try {
            // If in customer portal mode and accessed from main portal, return to main portal
            if (isCustomerPortal && localStorage.getItem(ORIGINAL_PORTAL_KEY)) {
                await endCustomerSession()
                const originalPortal = localStorage.getItem(ORIGINAL_PORTAL_KEY)
                localStorage.removeItem(ORIGINAL_PORTAL_KEY)

                if (originalPortal) {
                    window.location.href = originalPortal
                    return
                }
            }

            await apiSignOut()
        } finally {
            handleSignOut()
            navigatorRef.current?.navigate('/')
        }
    }

    const oAuthSignIn = (
        callback: (payload: OauthSignInCallbackPayload) => void,
    ) => {
        callback({
            onSignIn: handleSignIn,
            redirect,
        })
    }

    const accessCustomerPortal = async (
        customerId: string,
    ): Promise<AuthResult> => {
        try {
            const resp = await getCustomerAccessToken(customerId)

            if (resp && resp.token) {
                // Store original portal to return to
                localStorage.setItem(
                    ORIGINAL_PORTAL_KEY,
                    window.location.origin,
                )

                // Get customer domain
                const customerDomain = resp.domain || `${customerId}.urlist.com`

                // Redirect with token
                const redirectUrl = `https://${customerDomain}/portal-access?token=${resp.token}`
                window.location.href = redirectUrl

                return {
                    status: 'success',
                    message: 'Redirecting to customer portal...',
                }
            }

            return {
                status: 'failed',
                message: 'Unable to access customer portal',
            }
        } catch (error: any) {
            return {
                status: 'failed',
                message:
                    error?.response?.data?.message ||
                    'Unable to access customer portal',
            }
        }
    }

    const exitCustomerPortal = async () => {
        try {
            await endCustomerSession()
            const originalPortal = localStorage.getItem(ORIGINAL_PORTAL_KEY)

            if (originalPortal) {
                window.location.href = originalPortal
                localStorage.removeItem(ORIGINAL_PORTAL_KEY)
            } else {
                // If no original portal stored, just sign out
                await signOut()
            }
        } catch (error) {
            // On error, still try to redirect back
            const originalPortal = localStorage.getItem(ORIGINAL_PORTAL_KEY)
            if (originalPortal) {
                window.location.href = originalPortal
                localStorage.removeItem(ORIGINAL_PORTAL_KEY)
            } else {
                // Fall back to sign out
                await signOut()
            }
        }
    }

    // Add proactive token refresh functionality
    const refreshAccessToken = async (): Promise<boolean> => {
        try {
            const tokenUtils = useToken()
            const currentRefreshToken = await Promise.resolve(
                tokenUtils.refreshToken,
            )
            const currentAccessToken = await Promise.resolve(tokenUtils.token)

            if (!currentRefreshToken) {
                return false
            }

            const response = await apiRefreshToken(
                currentRefreshToken,
                currentAccessToken || undefined,
            )

            if (response?.token) {
                setToken(response.token)
                setTokenState(response.token)

                // Update refresh token if provided
                if (response.refreshToken) {
                    setRefreshToken(response.refreshToken)
                }

                return true
            }

            return false
        } catch (error) {
            console.error('Proactive token refresh failed:', error)
            return false
        }
    }

    return (
        <AuthContext.Provider
            value={{
                authenticated,
                user,
                signIn,
                signUp,
                signOut,
                oAuthSignIn,
                verifyMfa,
                isCustomerPortal,
                customerName,
                accessCustomerPortal,
                exitCustomerPortal,
                refreshAccessToken,
            }}
        >
            {children}
            <IsolatedNavigator ref={navigatorRef} />
        </AuthContext.Provider>
    )
}

export default AuthProvider
