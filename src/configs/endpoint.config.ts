// We no longer need the prefix since it's included in the app.config
// export const apiPrefix = '/api'

const endpointConfig = {
    // Auth endpoints
    auth: {
        signIn: 'Auth/login',
        signOut: 'Auth/logout',
        refreshToken: 'Auth/refresh',
        verifyMfa: 'Auth/verify-mfa',
        changePassword: 'Auth/change-password',
        resetPassword: 'Auth/reset-password',
    },
    
    // User endpoints
    users: {
        list: 'Users',
        getById: 'Users', // Append /{id} when using
        create: 'Users',
        update: 'Users', // Append /{id} when using
        delete: 'Users', // Append /{id} when using
    },
    
    // Customer endpoints
    customers: {
        getDetails: 'api/CustomerManagement/details',
        updateInfo: 'api/CustomerManagement',  // Append /{id} when using
        updateCredentials: 'api/CustomerManagement/credentials',
        updateBranding: 'api/CustomerManagement/branding',
        getAccessToken: 'api/CustomerManagement/access-token',
        endCustomerSession: 'api/CustomerManagement/end-session',
    },
    
    // Role & Permission endpoints
    roles: {
        list: 'Roles',
        getById: 'Roles', // Append /{id} when using
        create: 'Roles',
        update: 'Roles', // Append /{id} when using
        delete: 'Roles', // Append /{id} when using
        assignUsers: 'Roles/assign-users',
        removeUsers: 'Roles/remove-users',
    },
    
    permissions: {
        list: 'Permissions',
    },
    
    // Dashboard endpoints
    dashboard: {
        summary: 'Dashboard/summary',
        salesByShop: 'Dashboard/sales-by-shop',
        salesByLocation: 'Dashboard/sales-by-location',
        userStats: 'Dashboard/user-stats',
    },
    
    // Report endpoints
    reports: {
        list: 'Reports',
        details: 'Reports',  // Append /{id} when using
        embedToken: 'Reports/embed-token',
        categories: 'Reports/categories',
        workspaces: 'Reports/workspaces',
        pin: 'Reports/pin',
        unpin: 'Reports/unpin',
        pinned: 'Reports/pinned',
    },
    
    // Shop endpoints
    shops: {
        list: 'Shop',
        getById: 'Shop', // Append /{id} when using
        create: 'Shop',
        update: 'Shop', // Append /{id} when using
        delete: 'Shop', // Append /{id} when using
        activate: 'Shop', // Append /{id}/activate when using
        deactivate: 'Shop', // Append /{id}/deactivate when using
        assignPrograms: 'Shop', // Append /{id}/programs when using
        assignUsers: 'Shop', // Append /{id}/users when using
        getKpis: 'Shop', // Append /{id}/kpis when using
    },
}

export default endpointConfig
