import appConfig from '@/configs/app.config'
import {
    TOKEN_TYPE,
    REQUEST_HEADER_AUTH_KEY,
    TOKEN_NAME_IN_STORAGE,
} from '@/constants/api.constant'
import type { InternalAxiosRequestConfig } from 'axios'

const AxiosRequestIntrceptorConfigCallback = (
    config: InternalAxiosRequestConfig,
) => {
    // Get the token based on storage strategy (localStorage, sessionStorage, or cookies)
    let accessToken = ''
    const storage = appConfig.accessTokenPersistStrategy

    // First try to get token from the configured storage
    if (storage === 'localStorage') {
        accessToken = localStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    } else if (storage === 'sessionStorage') {
        accessToken = sessionStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
    } else if (storage === 'cookies') {
        // Get token from cookies
        const cookies = document.cookie.split(';')
        const tokenCookie = cookies.find((cookie) =>
            cookie.trim().startsWith(`${TOKEN_NAME_IN_STORAGE}=`),
        )
        if (tokenCookie) {
            accessToken = tokenCookie.split('=')[1] || ''
        }
    }

    // If no token in primary storage, try all other storage options as fallback
    if (!accessToken) {
        // Check localStorage if it's not the primary
        if (storage !== 'localStorage') {
            accessToken = localStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
        }

        // Check sessionStorage if it's not the primary and still no token
        if (!accessToken && storage !== 'sessionStorage') {
            accessToken = sessionStorage.getItem(TOKEN_NAME_IN_STORAGE) || ''
        }

        // Check cookies if it's not the primary and still no token
        if (!accessToken && storage !== 'cookies') {
            const cookies = document.cookie.split(';')
            const tokenCookie = cookies.find((cookie) =>
                cookie.trim().startsWith(`${TOKEN_NAME_IN_STORAGE}=`),
            )
            if (tokenCookie) {
                accessToken = tokenCookie.split('=')[1] || ''
            }
        }
    }

    // Apply token to request header if we found one
    if (accessToken) {
        // Make sure the token has the correct format with Bearer prefix
        config.headers[REQUEST_HEADER_AUTH_KEY] =
            accessToken.startsWith(TOKEN_TYPE.trim())
                ? accessToken
                : `${TOKEN_TYPE}${accessToken}`

        // Log only in development
        if (import.meta.env.DEV) {
            console.log(`Token applied to request: ${config.url}`)
        }
    } else {
        // Warning if no token found (only in development)
        if (import.meta.env.DEV) {
            console.warn(`No authentication token found for request: ${config.url}`)
        }
    }

    return config
}

export default AxiosRequestIntrceptorConfigCallback
