import { useEffect } from 'react'
import RoleRedirect from '@/components/route/RoleRedirect'
import appConfig from '@/configs/app.config'
import { useAuth } from '@/auth'

const Home = () => {
    const { user } = useAuth()

    useEffect(() => {
        // Log user details to help debug role-based routing
        console.log('Home: User details:', {
            id: user?.userId,
            name: user?.userName,
            roles: user?.authority,
        })

        console.log('Home: Using app config paths:', appConfig.rolePaths)
    }, [user])

    // Using RoleRedirect component to handle role-based routing
    // useConfigPaths=true ensures we use the central config for consistent routing
    return <RoleRedirect useConfigPaths={true} />
}

export default Home
