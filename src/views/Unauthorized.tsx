/**
 * Unauthorized Page - Shown when feature access is denied
 * This page is displayed when users try to access features they don't have permission for
 */

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { FEATURE_DEFINITIONS } from '@/constants/features.constant'

interface LocationState {
    from?: Location
    featureKey?: string
    reason?: string
    type?: 'feature_access_denied' | 'insufficient_permissions'
}

const UnauthorizedPage: React.FC = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()

    const state = location.state as LocationState
    const featureKey = state?.featureKey
    const reason = state?.reason
    const fromPath = state?.from?.pathname || '/'
    const type = state?.type || 'feature_access_denied'

    const featureDefinition = featureKey
        ? FEATURE_DEFINITIONS[featureKey]
        : null

    const handleGoBack = () => {
        navigate(-1)
    }

    const handleGoHome = () => {
        navigate('/app/tenant-dashboard')
    }

    const handleContactSupport = () => {
        // TODO: Implement support contact mechanism
        console.log('Contact support clicked for feature:', featureKey)
    }

    const handleUpgrade = () => {
        // TODO: Implement upgrade flow
        console.log('Upgrade requested for feature:', featureKey)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    {/* Icon */}
                    <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                            className="h-12 w-12 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
                        {type === 'feature_access_denied'
                            ? 'Feature Not Available'
                            : 'Access Denied'}
                    </h1>

                    {/* Description */}
                    <div className="mt-4 space-y-2">
                        {featureDefinition && (
                            <p className="text-lg text-gray-600">
                                {featureDefinition.description}
                            </p>
                        )}

                        <p className="text-sm text-gray-500">
                            {reason ||
                                'You do not have permission to access this feature.'}
                        </p>

                        {featureKey && (
                            <p className="text-xs text-gray-400">
                                Feature: {featureKey}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-4">
                        {/* Feature-specific content */}
                        {featureDefinition?.category === 'paid' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-blue-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">
                                            Premium Feature
                                        </h3>
                                        <div className="mt-2 text-sm text-blue-700">
                                            <p>
                                                This feature is part of our
                                                premium plan. Upgrade your
                                                subscription to get access.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* User info */}
                        {user && (
                            <div className="bg-gray-50 rounded-md p-3">
                                <div className="text-sm text-gray-600">
                                    <p>
                                        <strong>User:</strong>{' '}
                                        {user.email || user.username}
                                    </p>
                                    <p>
                                        <strong>Roles:</strong>{' '}
                                        {user.roles
                                            ?.map((r) => r.name)
                                            .join(', ') || 'None'}
                                    </p>
                                    {user.tenantId && (
                                        <p>
                                            <strong>Tenant:</strong>{' '}
                                            {user.tenantId}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="space-y-3">
                            {featureDefinition?.category === 'paid' && (
                                <button
                                    onClick={handleUpgrade}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Upgrade to Premium
                                </button>
                            )}

                            <button
                                onClick={handleContactSupport}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Contact Support
                            </button>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleGoBack}
                                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Go Back
                                </button>

                                <button
                                    onClick={handleGoHome}
                                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional help text */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        If you believe this is an error, please contact your
                        system administrator.
                    </p>
                    {fromPath && fromPath !== '/' && (
                        <p className="text-xs text-gray-400 mt-1">
                            Attempted to access: {fromPath}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UnauthorizedPage
