import React, { useState, useEffect } from 'react'
import { Card, Input, Button, Avatar, Notification } from '@/components/ui'
import { toast } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'
import { PiUserCircleDuotone } from 'react-icons/pi'
import { apiChangePassword } from '@/services/AuthService'

interface ChangePasswordForm {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

const ProfilePage: React.FC = () => {
    const { avatar, name, email, roles, authority } = useSessionUser(
        (state) => state.user,
    )

    // For backwards compatibility, use authority if roles is undefined
    const userAuthority = roles || authority
    const userName = name

    const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    // Generate user initials from userName as fallback option
    const getUserInitials = (name: string) => {
        if (!name) return 'U'
        const nameParts = name.trim().split(' ')
        if (nameParts.length >= 2) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        }
        return name[0].toUpperCase()
    }

    // Check if avatar is a real user avatar or just a default placeholder
    const isDefaultAvatar =
        avatar &&
        (avatar.includes('/img/avatars/thumb-') ||
            avatar.includes('default') ||
            avatar.includes('placeholder'))

    // Enhanced avatar configuration with fallback logic
    const avatarProps = (() => {
        console.log('📄 ProfilePage Avatar Debug:', {
            avatar: avatar,
            isDefaultAvatar: isDefaultAvatar,
            userName: userName,
            hasUserName: !!(userName && userName.trim()),
        })

        // Only use avatar if it's not a default/placeholder image
        if (avatar && avatar.trim() && !isDefaultAvatar) {
            console.log('✅ ProfilePage: Using user avatar image')
            return { src: avatar }
        } else if (userName && userName.trim()) {
            const initials = getUserInitials(userName)
            console.log('👤 ProfilePage: Using initials fallback:', initials)
            return {
                children: initials,
                className:
                    'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg border-2 border-white dark:border-gray-700 font-semibold',
            }
        } else {
            console.log('🔄 ProfilePage: Using generic user icon fallback')
            return {
                icon: <PiUserCircleDuotone />,
                className:
                    'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg border-2 border-white dark:border-gray-700',
            }
        }
    })()

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.push(
                <Notification title="Error" type="danger">
                    New passwords do not match
                </Notification>,
            )
            return
        }

        if (passwordForm.newPassword.length < 6) {
            toast.push(
                <Notification title="Error" type="danger">
                    Password must be at least 6 characters long
                </Notification>,
            )
            return
        }

        setIsChangingPassword(true)
        try {
            await apiChangePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })

            toast.push(
                <Notification title="Success" type="success">
                    Password changed successfully
                </Notification>,
            )

            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            setShowPasswordForm(false)
        } catch (error) {
            console.error('Failed to change password:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Failed to change password. Please check your current
                    password.
                </Notification>,
            )
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleInputChange = (
        field: keyof ChangePasswordForm,
        value: string,
    ) => {
        setPasswordForm((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-2">Profile</h1>
                <p className="text-gray-600">
                    Manage your profile information and security settings
                </p>
            </div>

            {/* User Information Card */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">User Information</h2>
                <div className="flex items-center gap-6 mb-6">
                    <Avatar size={80} {...avatarProps} />
                    <div>
                        <h3 className="text-xl font-medium">
                            {userName || 'Anonymous'}
                        </h3>
                        <p className="text-gray-600">
                            {email || 'No email available'}
                        </p>
                        <div className="mt-2">
                            <span className="text-sm text-gray-500">
                                Roles:{' '}
                            </span>
                            <span className="text-sm">
                                {userAuthority?.join(', ') ||
                                    'No roles assigned'}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Security Settings Card */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                    Security Settings
                </h2>

                {!showPasswordForm ? (
                    <div>
                        <p className="text-gray-600 mb-4">
                            Change your password to keep your account secure
                        </p>
                        <Button
                            onClick={() => setShowPasswordForm(true)}
                            variant="solid"
                        >
                            Change Password
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Current Password
                            </label>
                            <Input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) =>
                                    handleInputChange(
                                        'currentPassword',
                                        e.target.value,
                                    )
                                }
                                required
                                placeholder="Enter your current password"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                New Password
                            </label>
                            <Input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    handleInputChange(
                                        'newPassword',
                                        e.target.value,
                                    )
                                }
                                required
                                placeholder="Enter your new password"
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Confirm New Password
                            </label>
                            <Input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    handleInputChange(
                                        'confirmPassword',
                                        e.target.value,
                                    )
                                }
                                required
                                placeholder="Confirm your new password"
                                minLength={6}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="solid"
                                loading={isChangingPassword}
                                disabled={
                                    !passwordForm.currentPassword ||
                                    !passwordForm.newPassword ||
                                    !passwordForm.confirmPassword
                                }
                            >
                                Change Password
                            </Button>
                            <Button
                                type="button"
                                variant="plain"
                                onClick={() => {
                                    setShowPasswordForm(false)
                                    setPasswordForm({
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: '',
                                    })
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    )
}

export default ProfilePage
