import { useEffect, useRef } from 'react'
import { useAuth } from '@/auth'
import { useToken } from '@/store/authStore'

// JWT token payload interface
interface JWTPayload {
    exp: number
    iat: number
    [key: string]: any
}

// Function to decode JWT token without verification
const decodeJWT = (token: string): JWTPayload | null => {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }
        
        const payload = parts[1]
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decoded) as JWTPayload
    } catch (error) {
        console.error('Failed to decode JWT token:', error)
        return null
    }
}

// Function to check if token will expire soon (within 5 minutes)
const shouldRefreshToken = (token: string): boolean => {
    const payload = decodeJWT(token)
    if (!payload || !payload.exp) {
        return false
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = payload.exp - currentTime
    
    // Refresh if token expires within 5 minutes (300 seconds)
    return timeUntilExpiry <= 300
}

// Custom hook for automatic token refresh
export const useTokenRefresh = () => {
    const { refreshAccessToken, authenticated } = useAuth()
    const { token: currentToken } = useToken()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const isRefreshingRef = useRef(false)

    useEffect(() => {
        const setupTokenRefresh = async () => {
            // Only set up refresh for authenticated users with a valid token
            const resolvedToken = await Promise.resolve(currentToken)
            
            if (!authenticated || !resolvedToken || typeof resolvedToken !== 'string') {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
                return
            }

            const checkAndRefreshToken = async () => {
                // Prevent multiple simultaneous refresh attempts
                if (isRefreshingRef.current) {
                    return
                }

                try {
                    const tokenToCheck = await Promise.resolve(currentToken)
                    if (tokenToCheck && typeof tokenToCheck === 'string' && shouldRefreshToken(tokenToCheck)) {
                        console.log('Token will expire soon, attempting refresh...')
                        isRefreshingRef.current = true
                        
                        const success = await refreshAccessToken()
                        
                        if (success) {
                            console.log('Token refreshed successfully')
                        } else {
                            console.warn('Token refresh failed')
                        }
                    }
                } catch (error) {
                    console.error('Error during token refresh check:', error)
                } finally {
                    isRefreshingRef.current = false
                }
            }

            // Check immediately
            await checkAndRefreshToken()

            // Set up interval to check every 2 minutes
            intervalRef.current = setInterval(checkAndRefreshToken, 2 * 60 * 1000)
        }

        setupTokenRefresh()

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [authenticated, currentToken, refreshAccessToken])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])
}

// Function to manually check if current token needs refresh
export const checkTokenExpiration = (token: string): { isExpired: boolean; expiresIn: number } => {
    const payload = decodeJWT(token)
    
    if (!payload || !payload.exp) {
        return { isExpired: true, expiresIn: 0 }
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    const expiresIn = payload.exp - currentTime
    
    return {
        isExpired: expiresIn <= 0,
        expiresIn: Math.max(0, expiresIn)
    }
}
