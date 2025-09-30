/**
 * Feature Guard Usage Examples
 * This file demonstrates how to use the various feature protection components
 */

import React from 'react'
import {
    FeatureGuard,
    FeatureWrapper,
    RouteGuard,
    MultiFeatureGuard,
    FeatureButton,
    FeatureLink,
} from '@/components/shared/FeatureGuard'

// Example 1: Protecting a full page/component with FeatureGuard
export const PartsManagementPage: React.FC = () => {
    return (
        <FeatureGuard
            featureKey="partsManagement"
            showLoading={true}
            showUpgrade={true}
            onAccessDenied={(featureKey, reason) => {
                console.log(`Access denied to ${featureKey}: ${reason}`)
                // Track analytics, show notification, etc.
            }}
        >
            <div>
                <h1>Parts Management</h1>
                <p>
                    This content is only visible to users with Parts Management
                    feature enabled.
                </p>

                {/* Nested feature protection for specific sub-features */}
                <FeatureWrapper featureKey="partsManagement.advanced">
                    <button>Advanced Parts Operations</button>
                </FeatureWrapper>
            </div>
        </FeatureGuard>
    )
}

// Example 2: Route-level protection
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        <RouteGuard
            featureKey="accounting"
            redirectTo="/upgrade-required"
            showLoading={true}
        >
            {children}
        </RouteGuard>
    )
}

// Example 3: Conditional rendering with FeatureWrapper
export const DashboardPage: React.FC = () => {
    return (
        <div>
            <h1>Dashboard</h1>

            {/* Show different content based on feature access */}
            <FeatureWrapper featureKey="shopKPI">
                <div className="grid grid-cols-3 gap-4">
                    <div>Shop Performance KPIs</div>
                    <div>Goals Tracking</div>
                    <div>Analytics</div>
                </div>
            </FeatureWrapper>

            {/* Show fallback for users without access */}
            <FeatureWrapper
                featureKey="shopKPI"
                fallback={
                    <div className="p-4 bg-gray-100 rounded">
                        <p>Upgrade to Pro to see detailed KPI analytics</p>
                    </div>
                }
            />

            {/* Inverted wrapper - show content to users WITHOUT feature */}
            <FeatureWrapper featureKey="premiumReports" invert={true}>
                <div className="border p-4 rounded">
                    <h3>Upgrade to Premium</h3>
                    <p>Get access to advanced reporting features</p>
                    <button>Upgrade Now</button>
                </div>
            </FeatureWrapper>
        </div>
    )
}

// Example 4: Multiple feature requirements
export const AdvancedAnalyticsSection: React.FC = () => {
    return (
        <MultiFeatureGuard
            featureKeys={['shopKPI', 'reports', 'accounting']}
            requireAll={true}
            fallback={
                <div>
                    <p>This advanced analytics section requires:</p>
                    <ul>
                        <li>Shop KPI access</li>
                        <li>Reports access</li>
                        <li>Accounting access</li>
                    </ul>
                </div>
            }
        >
            <div>
                <h2>Advanced Cross-Module Analytics</h2>
                <p>
                    Comprehensive analytics combining shop performance,
                    financial data, and custom reports.
                </p>
            </div>
        </MultiFeatureGuard>
    )
}

// Example 5: Feature-protected buttons and actions
export const ToolbarComponent: React.FC = () => {
    return (
        <div className="flex space-x-2">
            {/* Regular button */}
            <button className="btn btn-primary">View Data</button>

            {/* Feature-protected button */}
            <FeatureButton
                featureKey="accounting"
                className="btn btn-secondary"
                onClick={() => console.log('Export to accounting system')}
                disabledTooltip="Accounting integration requires premium subscription"
            >
                Export to Accounting
            </FeatureButton>

            {/* Feature-protected link */}
            <FeatureLink
                featureKey="reports"
                to="/reports/advanced"
                className="btn btn-outline"
            >
                Advanced Reports
            </FeatureLink>
        </div>
    )
}

// Example 6: Using feature guards in navigation
export const SidebarMenuItem: React.FC<{
    title: string
    path: string
    featureKey?: string
}> = ({ title, path, featureKey }) => {
    if (!featureKey) {
        // Non-feature controlled menu item
        return (
            <a href={path} className="nav-item">
                {title}
            </a>
        )
    }

    // Feature-controlled menu item
    return (
        <FeatureWrapper featureKey={featureKey}>
            <a href={path} className="nav-item">
                {title}
            </a>
        </FeatureWrapper>
    )
}

// Example 7: Custom fallback components
const CustomUpgradeFallback: React.FC<{ featureKey: string }> = ({
    featureKey,
}) => (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Unlock {featureKey} Feature</h3>
        <p className="mb-4">Enhance your workflow with premium features</p>
        <button className="bg-white text-blue-600 px-4 py-2 rounded font-semibold">
            Start Free Trial
        </button>
    </div>
)

export const CustomProtectedComponent: React.FC = () => {
    return (
        <FeatureGuard
            featureKey="premiumFeature"
            fallback={<CustomUpgradeFallback featureKey="premiumFeature" />}
        >
            <div>Premium feature content here</div>
        </FeatureGuard>
    )
}

// Example 8: Error handling and analytics
export const AnalyticsProtectedComponent: React.FC = () => {
    return (
        <FeatureGuard
            featureKey="analytics"
            onAccessDenied={(featureKey, reason) => {
                // Track feature access attempts
                console.log('Feature access denied:', { featureKey, reason })

                // Send to analytics
                // analytics.track('feature_access_denied', { feature: featureKey, reason })

                // Show user feedback
                // toast.warning(`${featureKey} feature is not available. Contact support to upgrade.`)
            }}
        >
            <div>Analytics dashboard content</div>
        </FeatureGuard>
    )
}

// Example 9: Loading states customization
export const CustomLoadingProtectedComponent: React.FC = () => {
    return (
        <FeatureGuard
            featureKey="customFeature"
            showLoading={false} // Disable default loading
        >
            <div>
                {/* Your own loading implementation */}
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        </FeatureGuard>
    )
}

// Example 10: Integration with React Router
/*
// In your router configuration:
import { RouteGuard } from '@/components/shared/FeatureGuard'

const router = createBrowserRouter([
  {
    path: "/accounting",
    element: (
      <RouteGuard featureKey="accounting" redirectTo="/upgrade">
        <AccountingPage />
      </RouteGuard>
    )
  },
  {
    path: "/parts-management",
    element: (
      <RouteGuard featureKey="partsManagement">
        <PartsManagementPage />
      </RouteGuard>
    )
  }
])
*/

export default {
    PartsManagementPage,
    ProtectedRoute,
    DashboardPage,
    AdvancedAnalyticsSection,
    ToolbarComponent,
    SidebarMenuItem,
    CustomProtectedComponent,
    AnalyticsProtectedComponent,
    CustomLoadingProtectedComponent,
}
