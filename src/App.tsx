import { BrowserRouter } from 'react-router-dom'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import Views from '@/views'
import appConfig from './configs/app.config'
import SwaggerService from '@/services/SwaggerService'
import { useEffect } from 'react'

if (appConfig.enableMock) {
    import('./mock')
}

function App() {
    useEffect(() => {
        SwaggerService.initializeSwagger()
    }, [])
    return (
        <Theme>
            <BrowserRouter>
                <AuthProvider>
                    <Layout>
                        <Views />
                    </Layout>
                </AuthProvider>
            </BrowserRouter>
        </Theme>
    )
}

export default App
