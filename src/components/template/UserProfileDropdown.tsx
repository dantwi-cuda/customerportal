import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser } from '@/store/authStore'
import { Link } from 'react-router'
import {
    PiUserCircleDuotone,
    PiGearDuotone,
    PiPulseDuotone,
    PiSignOutDuotone,
} from 'react-icons/pi'
import { useAuth } from '@/auth'
import type { JSX } from 'react'

type DropdownList = {
    label: string
    path: string
    icon: JSX.Element
    authority?: string[]
}

const _UserDropdown = () => {
    const { avatar, name, email, roles, authority } = useSessionUser(
        (state) => state.user,
    )
    const { signOut } = useAuth()

    // For backwards compatibility, use authority if roles is undefined
    const userAuthority = roles || authority
    const userName = name

    // Debug: Log the complete user object from session
    const fullUser = useSessionUser((state) => state.user)
    console.log('👤 Complete User Object from Session:', fullUser)

    // Check if avatar is a real user avatar or just a default placeholder
    const isDefaultAvatar =
        avatar &&
        (avatar.includes('/img/avatars/thumb-') ||
            avatar.includes('default') ||
            avatar.includes('placeholder'))

    console.log('🖼️ Avatar Analysis:', {
        avatar: avatar,
        isDefaultAvatar: isDefaultAvatar,
        shouldUseAvatar: avatar && !isDefaultAvatar,
        detectedPatterns: {
            hasThumbPattern: avatar?.includes('/img/avatars/thumb-'),
            hasDefaultPattern: avatar?.includes('default'),
            hasPlaceholderPattern: avatar?.includes('placeholder'),
        },
    })

    // Check if user is tenant admin
    const isTenantAdmin = userAuthority?.some((role: string) =>
        ['Tenant-Admin'].includes(role),
    )

    const dropdownItemList: DropdownList[] = [
        {
            label: 'Profile',
            path: '/app/profile',
            icon: <PiUserCircleDuotone />,
        },
        {
            label: 'Account Setting',
            path: '/app/account-settings',
            icon: <PiGearDuotone />,
            authority: ['Tenant-Admin'],
        },
        {
            label: 'Activity Log',
            path: '/app/activity-log',
            icon: <PiPulseDuotone />,
            authority: ['Tenant-Admin'],
        },
    ]

    const handleSignOut = () => {
        signOut()
    }

    // Generate user initials from userName as another fallback option
    const getUserInitials = (name: string) => {
        console.log('🔤 Generating initials for:', name)

        if (!name) {
            console.log('⚠️ No name provided, using default "U"')
            return 'U'
        }

        const nameParts = name.trim().split(' ')
        console.log('📝 Name parts:', nameParts)

        if (nameParts.length >= 2) {
            const initials =
                `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
            console.log('👥 Multi-part name, generated initials:', initials)
            return initials
        }

        const singleInitial = name[0].toUpperCase()
        console.log('👤 Single name, generated initial:', singleInitial)
        return singleInitial
    }

    // Avatar configuration with enhanced fallback logic
    const avatarProps = (() => {
        console.log('🔍 Avatar Debug Info:', {
            // Raw API fields
            name: name,
            email: email,
            roles: roles,
            authority: authority,
            avatar: avatar,
            // Processed fields
            userName: userName,
            userAuthority: userAuthority,
            // Avatar analysis
            isDefaultAvatar: isDefaultAvatar,
            shouldUseAvatar: avatar && !isDefaultAvatar,
            // Validation checks
            avatarTrimmed: avatar?.trim(),
            hasAvatar: !!(avatar && avatar.trim()),
            userNameTrimmed: userName?.trim(),
            hasUserName: !!(userName && userName.trim()),
        })

        // Only use avatar if it's not a default/placeholder image
        if (avatar && avatar.trim() && !isDefaultAvatar) {
            console.log('✅ Using user avatar image:', avatar)
            return { src: avatar }
        } else if (userName && userName.trim()) {
            const initials = getUserInitials(userName)
            console.log('👤 Using user initials fallback:', {
                userName: userName,
                initials: initials,
                reason: isDefaultAvatar
                    ? 'Default avatar detected, using initials'
                    : 'No avatar image available',
            })
            return {
                // Use initials if userName is available
                children: initials,
                className:
                    'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg border-2 border-white dark:border-gray-700 font-semibold',
            }
        } else {
            console.log('🔄 Using generic user icon fallback:', {
                reason: 'No avatar image and no username available',
            })
            return {
                // Final fallback to generic user icon
                icon: <PiUserCircleDuotone />,
                className:
                    'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg border-2 border-white dark:border-gray-700',
            }
        }
    })()

    // Log final avatar configuration
    console.log('🎯 Final Avatar Configuration:', {
        type: avatarProps.src
            ? 'Image'
            : avatarProps.children
              ? 'Initials'
              : 'Icon',
        props: avatarProps,
    })

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            renderTitle={
                <div className="cursor-pointer flex items-center">
                    <Avatar size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <Avatar {...avatarProps} />
                    <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                            {userName || 'Anonymous'}
                        </div>
                        <div className="text-xs">
                            {email || 'No email available'}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>
            <Dropdown.Item variant="divider" />
            {dropdownItemList.map((item) => {
                // Check if this item should be shown based on authority
                if (
                    item.authority &&
                    !item.authority.some((role) =>
                        userAuthority?.includes(role),
                    )
                ) {
                    return null
                }

                return (
                    <Dropdown.Item
                        key={item.label}
                        eventKey={item.label}
                        className="px-0"
                    >
                        <Link
                            className="flex h-full w-full px-2"
                            to={item.path}
                        >
                            <span className="flex gap-2 items-center w-full">
                                <span className="text-xl">{item.icon}</span>
                                <span>{item.label}</span>
                            </span>
                        </Link>
                    </Dropdown.Item>
                )
            })}
            <Dropdown.Item variant="divider" />
            <Dropdown.Item
                eventKey="Sign Out"
                className="gap-2"
                onClick={handleSignOut}
            >
                <span className="text-xl">
                    <PiSignOutDuotone />
                </span>
                <span>Sign Out</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)

export default UserDropdown
