import classNames from '@/utils/classNames'
import ScrollBar from '@/components/ui/ScrollBar'
import Logo from '@/components/template/Logo'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import appConfig from '@/configs/app.config'
import { Link } from 'react-router'
import {
    SIDE_NAV_WIDTH,
    SIDE_NAV_COLLAPSED_WIDTH,
    SIDE_NAV_CONTENT_GUTTER,
    HEADER_HEIGHT,
    LOGO_X_GUTTER,
} from '@/constants/theme.constant'
import type { Mode } from '@/@types/theme'
import { useMemo } from 'react'
import { useHybridNavigation } from '@/hooks/useHybridNavigation'

type SideNavProps = {
    translationSetup?: boolean
    background?: boolean
    className?: string
    contentClass?: string
    mode?: Mode
}

const sideNavStyle = {
    width: SIDE_NAV_WIDTH,
    minWidth: SIDE_NAV_WIDTH,
}

const sideNavCollapseStyle = {
    width: SIDE_NAV_COLLAPSED_WIDTH,
    minWidth: SIDE_NAV_COLLAPSED_WIDTH,
}

const SideNav = () => {
    const themeColor = useThemeStore((state) => state.themeSchema)
    const mode = useThemeStore((state) => state.mode)
    const direction = useThemeStore((state) => state.direction)
    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )
    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)
    const userAuthority = useSessionUser((state) => state.user?.authority)

    const { navigationItems } = useHybridNavigation()

    const sideNavStyle = useMemo(
        () => ({
            width: sideNavCollapse ? SIDE_NAV_COLLAPSED_WIDTH : SIDE_NAV_WIDTH,
            minWidth: sideNavCollapse
                ? SIDE_NAV_COLLAPSED_WIDTH
                : SIDE_NAV_WIDTH,
        }),
        [sideNavCollapse],
    )

    const logoMode = useMemo(() => {
        if (mode === 'dark') {
            return 'light' // Use light logo on dark theme
        }
        return 'dark' // Use dark logo on light theme
    }, [mode])

    const logoType = useMemo(() => {
        return sideNavCollapse ? 'streamline' : 'full'
    }, [sideNavCollapse])

    const menuVariant = useMemo(() => {
        return `side-nav-${mode}`
    }, [mode])

    return (
        <div
            className={classNames('side-nav', menuVariant)}
            style={sideNavStyle}
        >
            <div className="side-nav-header">
                <Link
                    className={classNames('side-nav-logo', {
                        [LOGO_X_GUTTER]: !sideNavCollapse,
                    })}
                    to={'/'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sideNavCollapse
                            ? 'center'
                            : 'flex-start',
                        height: `${HEADER_HEIGHT}px`,
                        padding: sideNavCollapse ? '0' : undefined,
                    }}
                >
                    <Logo
                        mode={logoMode}
                        type={logoType}
                        logoWidth={sideNavCollapse ? '32px' : 'auto'}
                    />
                </Link>
            </div>
            <div className="side-nav-content">
                <ScrollBar
                    direction={direction}
                    className={classNames(
                        'side-nav-scroll',
                        SIDE_NAV_CONTENT_GUTTER,
                    )}
                    style={{
                        height: `calc(100% - ${HEADER_HEIGHT}px)`,
                    }}
                >
                    <VerticalMenuContent
                        collapsed={sideNavCollapse}
                        navigationTree={navigationItems}
                        routeKey={currentRouteKey}
                        userAuthority={userAuthority || []}
                        onMenuItemClick={() => {}}
                    />
                </ScrollBar>
            </div>
        </div>
    )
}

export default SideNav
