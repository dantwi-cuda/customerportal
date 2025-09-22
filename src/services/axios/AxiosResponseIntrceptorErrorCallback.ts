import { useSessionUser, useToken } from '@/store/authStore'
import { apiRefreshToken } from '@/services/AuthService'
import appConfig from '@/configs/app.config'
import { REFRESH_TOKEN_NAME_IN_STORAGE, TOKEN_NAME_IN_STORAGE } from '@/constants/api.constant'
import type { AxiosError } from 'axios'

const unauthorizedCode = [401, 419, 440]

// Track if a refresh is currently in progress to prevent multiple refresh calls
let isRefreshing = false
let refreshTokenPromise: Promise<any> | null = null

const AxiosResponseIntrceptorErrorCallback = async (error: AxiosError) => {
    const { response, config } = error
    const { setToken, clearTokens } = useToken()

    if (response && unauthorizedCode.includes(response.status)) {
        // Don't attempt refresh for refresh token endpoint itself
        if (config?.url?.includes('/auth/refresh')) {
            clearTokens()
            useSessionUser.getState().setUser({})
            useSessionUser.getState().setSessionSignedIn(false)
            // Redirect to login or trigger logout
            if (typeof window !== 'undefined') {
                window.location.href = '/sign-in'
            }
            return Promise.reject(error)
        }

        // Check if we have a refresh token
        const refreshToken = getRefreshToken()
        const currentToken = getCurrentToken()
        
        if (refreshToken && !isRefreshing) {
            isRefreshing = true
            
            try {
                // Use the same promise for concurrent requests
                if (!refreshTokenPromise) {
                    refreshTokenPromise = apiRefreshToken(refreshToken, currentToken || undefined)
                }
                
                const refreshResponse = await refreshTokenPromise
                
                if (refreshResponse?.data?.token) {
                    // Update the access token
                    setToken(refreshResponse.data.token)
                    
                    // Update refresh token if provided
                    if (refreshResponse.data.refreshToken) {
                        setRefreshToken(refreshResponse.data.refreshToken)
                    }
                    
                    // Reset the refresh state
                    isRefreshing = false
                    refreshTokenPromise = null
                    
                    // Retry the original request with new token
                    if (config) {
                        const storage = getStorage()
                        const newToken = storage.getItem(TOKEN_NAME_IN_STORAGE)
                        if (newToken) {
                            config.headers['Authorization'] = `Bearer ${newToken}`
                        }
                        // Don't return here, let the original request retry automatically
                    }
                    
                    return Promise.reject(error) // Let the request interceptor handle retry
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
                // Clear all auth data and redirect to login
                clearTokens()
                useSessionUser.getState().setUser({})
                useSessionUser.getState().setSessionSignedIn(false)
                
                isRefreshing = false
                refreshTokenPromise = null
                
                if (typeof window !== 'undefined') {
                    window.location.href = '/sign-in'
                }
            }
        } else if (!refreshToken) {
            // No refresh token available, clear session
            clearTokens()
            useSessionUser.getState().setUser({})
            useSessionUser.getState().setSessionSignedIn(false)
            
            if (typeof window !== 'undefined') {
                window.location.href = '/sign-in'
            }
        }
    }
}

// Helper functions for refresh token management
const getStorage = () => {
    if (appConfig.accessTokenPersistStrategy === 'localStorage') {
        return localStorage
    }
    if (appConfig.accessTokenPersistStrategy === 'sessionStorage') {
        return sessionStorage
    }
    // For cookies, we'll use localStorage as fallback for refresh token
    return localStorage
}

const getCurrentToken = (): string | null => {
    const storage = getStorage()
    return storage.getItem(TOKEN_NAME_IN_STORAGE)
}

const getRefreshToken = (): string | null => {
    const storage = getStorage()
    return storage.getItem(REFRESH_TOKEN_NAME_IN_STORAGE)
}

const setRefreshToken = (token: string) => {
    const storage = getStorage()
    storage.setItem(REFRESH_TOKEN_NAME_IN_STORAGE, token)
}

export default AxiosResponseIntrceptorErrorCallback
