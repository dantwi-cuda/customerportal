/**
 * Feature Guards - Route and Component Protection
 * Protects paid features and shows appropriate fallbacks
 */

import React, { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useFeatureGuard } from '@/hooks/useFeatureNavigation'
import { useAuth } from '@/auth/useAuth'
import {
    FREE_FEATURES,
    FEATURE_DEFINITIONS,
} from '@/constants/features.constant'
import type {
    FeatureGuardProps,
    FeatureWrapperProps,
    RouteGuardProps,
} from '@/@types/feature'

// Loading component for feature checks
const FeatureLoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Checking feature access...</span>
    </div>
)

// Fallback component for disabled features
const FeatureDisabledFallback: React.FC<{
    featureKey: string
    reason?: string
    showUpgrade?: boolean
}> = ({ featureKey, reason, showUpgrade = true }) => {
    const featureDefinition = FEATURE_DEFINITIONS[featureKey]

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7h-3a3 3 0 00-3-3H9a3 3 0 00-3 3H3m0 0a3 3 0 013-3h12a3 3 0 013 3m-3 0v6a3 3 0 01-3 3H9a3 3 0 01-3-3v-6"
                    />
                </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Feature Not Available
            </h3>

            <p className="text-gray-600 mb-4 max-w-md">
                {featureDefinition?.description ||
                    `The ${featureKey} feature is not enabled for your account.`}
            </p>

            {reason && <p className="text-sm text-gray-500 mb-4">{reason}</p>}

            {showUpgrade && featureDefinition?.category === 'paid' && (
                <div className="space-y-3">
                    <button
                        className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
                        onClick={() => {
                            // TODO: Implement upgrade flow
                            console.log(
                                'Upgrade requested for feature:',
                                featureKey,
                            )
                        }}
                    >
                        Upgrade to Access This Feature
                    </button>

                    <div className="text-xs text-gray-500">
                        Contact your administrator to enable this feature
                    </div>
                </div>
            )}
        </div>
    )
}

// Error boundary for feature loading errors
class FeatureErrorBoundary extends React.Component<
    { children: ReactNode; featureKey: string },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: ReactNode; featureKey: string }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(
            `Feature guard error for ${this.props.featureKey}:`,
            error,
            errorInfo,
        )
    }

    render() {
        if (this.state.hasError) {
            return (
                <FeatureDisabledFallback
                    featureKey={this.props.featureKey}
                    reason="An error occurred while checking feature access"
                    showUpgrade={false}
                />
            )
        }

        return this.props.children
    }
}

/**
 * FeatureGuard - Protects components based on feature access
 * Use this to wrap components that should only be visible to users with specific features
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
    featureKey,
    children,
    fallback,
    showLoading = true,
    showUpgrade = true,
    redirect,
    requireAll = false,
    onAccessDenied,
}) => {
    const { canAccess, isLoading, reason, isFreeFeature } =
        useFeatureGuard(featureKey)
    const location = useLocation()

    useEffect(() => {
        if (!isLoading && !canAccess && onAccessDenied) {
            onAccessDenied(featureKey, reason)
        }
    }, [isLoading, canAccess, onAccessDenied, featureKey, reason])

    // Show loading state while checking access
    if (isLoading && showLoading) {
        return <FeatureLoadingSpinner />
    }

    // If access is denied and redirect is specified, redirect
    if (!canAccess && redirect) {
        return <Navigate to={redirect} state={{ from: location }} replace />
    }

    // If access is granted, render children
    if (canAccess) {
        return (
            <FeatureErrorBoundary featureKey={featureKey}>
                {children}
            </FeatureErrorBoundary>
        )
    }

    // If access is denied, show fallback or default message
    if (fallback) {
        return <>{fallback}</>
    }

    return (
        <FeatureDisabledFallback
            featureKey={featureKey}
            reason={reason}
            showUpgrade={showUpgrade && !isFreeFeature}
        />
    )
}

/**
 * FeatureWrapper - Conditionally renders content based on feature access
 * Use this for inline feature checks without full protection
 */
export const FeatureWrapper: React.FC<FeatureWrapperProps> = ({
    featureKey,
    children,
    fallback = null,
    invert = false,
}) => {
    const { canAccess, isLoading } = useFeatureGuard(featureKey)

    // Don't render anything while loading
    if (isLoading) {
        return null
    }

    // Render based on access and invert flag
    const shouldRender = invert ? !canAccess : canAccess

    if (shouldRender) {
        return <>{children}</>
    }

    return <>{fallback}</>
}

/**
 * RouteGuard - Protects entire routes based on feature access
 * Use this in route definitions to protect pages
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
    featureKey,
    children,
    redirectTo = '/unauthorized',
    showLoading = true,
}) => {
    const { canAccess, isLoading, reason } = useFeatureGuard(featureKey)
    const { isAuthenticated } = useAuth()
    const location = useLocation()

    // If not authenticated, let auth guard handle it
    if (!isAuthenticated) {
        return <>{children}</>
    }

    // Show loading state while checking access
    if (isLoading && showLoading) {
        return <FeatureLoadingSpinner />
    }

    // If access is denied, redirect
    if (!canAccess) {
        return (
            <Navigate
                to={redirectTo}
                state={{
                    from: location,
                    featureKey,
                    reason,
                    type: 'feature_access_denied',
                }}
                replace
            />
        )
    }

    // If access is granted, render the protected route
    return <>{children}</>
}

/**
 * MultiFeatureGuard - Protects content requiring multiple features
 * Use this when a component needs access to multiple features
 */
export const MultiFeatureGuard: React.FC<{
    featureKeys: string[]
    children: ReactNode
    requireAll?: boolean
    fallback?: ReactNode
    showLoading?: boolean
}> = ({
    featureKeys,
    children,
    requireAll = true,
    fallback,
    showLoading = true,
}) => {
    const [accessResults, setAccessResults] = useState<Record<string, boolean>>(
        {},
    )
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAllFeatures = async () => {
            const results: Record<string, boolean> = {}

            // Check each feature
            for (const featureKey of featureKeys) {
                // For free features, always grant access
                if (FREE_FEATURES.includes(featureKey as any)) {
                    results[featureKey] = true
                } else {
                    // Use the existing feature guard logic
                    results[featureKey] = false // This would need to be implemented with actual check
                }
            }

            setAccessResults(results)
            setIsLoading(false)
        }

        checkAllFeatures()
    }, [featureKeys])

    if (isLoading && showLoading) {
        return <FeatureLoadingSpinner />
    }

    const hasAccess = requireAll
        ? featureKeys.every((key) => accessResults[key])
        : featureKeys.some((key) => accessResults[key])

    if (hasAccess) {
        return <>{children}</>
    }

    if (fallback) {
        return <>{fallback}</>
    }

    return (
        <FeatureDisabledFallback
            featureKey={featureKeys[0]}
            reason={`Access requires ${requireAll ? 'all' : 'one'} of: ${featureKeys.join(', ')}`}
        />
    )
}

/**
 * FeatureButton - Button that's only enabled if user has feature access
 * Use this for actions that require specific features
 */
export const FeatureButton: React.FC<{
    featureKey: string
    children: ReactNode
    onClick?: () => void
    className?: string
    disabled?: boolean
    disabledTooltip?: string
}> = ({
    featureKey,
    children,
    onClick,
    className = '',
    disabled = false,
    disabledTooltip,
}) => {
    const { canAccess, isLoading } = useFeatureGuard(featureKey)

    const isDisabled = disabled || isLoading || !canAccess
    const tooltipText =
        disabledTooltip ||
        (!canAccess ? `Feature ${featureKey} is not available` : undefined)

    return (
        <button
            onClick={isDisabled ? undefined : onClick}
            disabled={isDisabled}
            className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={tooltipText}
        >
            {isLoading ? (
                <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Loading...
                </span>
            ) : (
                children
            )}
        </button>
    )
}

/**
 * FeatureLink - Link that's only enabled if user has feature access
 * Use this for navigation links to feature-protected routes
 */
export const FeatureLink: React.FC<{
    featureKey: string
    to: string
    children: ReactNode
    className?: string
    disabled?: boolean
}> = ({ featureKey, to, children, className = '', disabled = false }) => {
    const { canAccess, isLoading } = useFeatureGuard(featureKey)

    const isDisabled = disabled || isLoading || !canAccess

    if (isDisabled) {
        return (
            <span
                className={`${className} opacity-50 cursor-not-allowed`}
                title={`Feature ${featureKey} is not available`}
            >
                {children}
            </span>
        )
    }

    return (
        <a href={to} className={className}>
            {children}
        </a>
    )
}

export default FeatureGuard
