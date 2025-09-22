import { BrowserRouter } from 'react-router-dom'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import { useTokenRefresh } from '@/auth/useTokenRefresh'
import Views from '@/views'
import appConfig from './configs/app.config'
import SwaggerService from '@/services/SwaggerService'
import { useEffect } from 'react'

if (appConfig.enableMock) {
    import('./mock')
}

// Component to handle token refresh inside AuthProvider context
function AppContent() {
    // Initialize token refresh mechanism
    useTokenRefresh()

    return (
        <Layout>
            <Views />
        </Layout>
    )
}

function App() {
    useEffect(() => {
        SwaggerService.initializeSwagger()
    }, [])

    return (
        <Theme>
            <BrowserRouter>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </BrowserRouter>
        </Theme>
    )
}

export default App
