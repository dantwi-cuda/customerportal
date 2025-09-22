export type AppConfig = {
    apiPrefix: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    locale: string
    accessTokenPersistStrategy: 'localStorage' | 'sessionStorage' | 'cookies'
    enableMock: boolean
    activeNavTranslation: boolean
    // Role-based entry paths
    rolePaths: {
        csAdmin: string
        csUser: string
        tenantAdmin: string
        endUser: string
    }
}

const appConfig: AppConfig = {
    // Update this URL to match your actual backend API URL
    apiPrefix: 'http://localhost:5211/api', // Example: 'http://localhost:5000/api'
    authenticatedEntryPath: '/home', // This will trigger the RoleRedirect in Home.tsx
    unAuthenticatedEntryPath: '/sign-in',
    locale: 'en',
    accessTokenPersistStrategy: 'cookies',
    enableMock: false, // Disabled - using real API endpoints
    activeNavTranslation: false,
    // Define default entry paths for each role
    rolePaths: {
        csAdmin: '/tenantportal/dashboard',
        csUser: '/admin/dashboard',
        tenantAdmin: '/app/tenant-dashboard', 
        endUser: '/app/tenant-dashboard'
    }
}

export default appConfig
