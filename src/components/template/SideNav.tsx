import classNames from '@/utils/classNames'
import ScrollBar from '@/components/ui/ScrollBar'
import Logo from '@/components/template/Logo'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import navigationConfig from '@/configs/navigation.config'
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
import { useMemo, useEffect } from 'react'
import type { NavigationTree } from '@/@types/navigation'

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

const SideNav = ({
    translationSetup = appConfig.activeNavTranslation,
    background = true,
    className,
    contentClass,
    mode,
}: SideNavProps) => {
    const defaultMode = useThemeStore((state) => state.mode)
    const direction = useThemeStore((state) => state.direction)
    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )

    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)

    const userAuthority = useSessionUser((state) => state.user.authority) || []

    // Add debugging to check user authority and menu filtering
    useEffect(() => {
        console.log('SideNav - User authority:', userAuthority)
        console.log('Navigation config:', navigationConfig)
    }, [userAuthority])

    // filter navigation tree by authority
    const filteredNavigation: NavigationTree[] = useMemo(() => {
        const filterTree = (nodes: NavigationTree[]): NavigationTree[] =>
            nodes.reduce<NavigationTree[]>((acc, nav) => {
                const hasAccess =
                    !nav.authority?.length ||
                    nav.authority.some((role) => userAuthority.includes(role))

                // Debug log for item access
                if (nav.key === 'tenantportal') {
                    console.log(`Menu item '${nav.key}' access check:`, {
                        hasAccess,
                        authority: nav.authority,
                        userAuthority,
                        hasMatch: nav.authority?.some((role) =>
                            userAuthority.includes(role),
                        ),
                    })
                }

                if (!hasAccess) return acc
                const item = { ...nav }
                if (item.subMenu?.length) {
                    const sub = filterTree(item.subMenu)
                    if (sub.length) item.subMenu = sub
                    else item.subMenu = []
                }
                acc.push(item)
                return acc
            }, [])

        const filtered = filterTree(navigationConfig)
        console.log('Filtered navigation:', filtered)
        return filtered
    }, [navigationConfig, userAuthority])

    return (
        <div
            style={sideNavCollapse ? sideNavCollapseStyle : sideNavStyle}
            className={classNames(
                'side-nav',
                background && 'side-nav-bg',
                !sideNavCollapse && 'side-nav-expand',
                className,
            )}
        >
            <Link
                to={appConfig.authenticatedEntryPath}
                className="side-nav-header flex flex-col justify-center"
                style={{ height: HEADER_HEIGHT }}
            >
                <div
                    className={classNames(
                        'flex items-center',
                        sideNavCollapse && 'ltr:ml-[11.5px] ltr:mr-[11.5px]',
                        sideNavCollapse
                            ? SIDE_NAV_CONTENT_GUTTER
                            : LOGO_X_GUTTER,
                    )}
                >
                    <Logo
                        imgClass="max-h-10"
                        mode={mode || defaultMode}
                        type={sideNavCollapse ? 'streamline' : 'full'}
                    />
                    {!sideNavCollapse && (
                        <span className="ml-3 text-xl font-bold text-gray-800 dark:text-white">
                            ClaimsCorp
                        </span>
                    )}
                </div>
            </Link>
            <div className={classNames('side-nav-content', contentClass)}>
                <ScrollBar style={{ height: '100%' }} direction={direction}>
                    <VerticalMenuContent
                        collapsed={sideNavCollapse}
                        navigationTree={filteredNavigation}
                        routeKey={currentRouteKey}
                        direction={direction}
                        translationSetup={translationSetup}
                        userAuthority={userAuthority}
                    />
                </ScrollBar>
            </div>
        </div>
    )
}

export default SideNav
