import { useCallback } from 'react'
import useDarkMode from '@/utils/hooks/useDarkMode'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { PiSunDuotone, PiMoonDuotone } from 'react-icons/pi'
import type { CommonProps } from '@/@types/common'

const _DarkModeToggle = ({ className }: CommonProps) => {
    const [isDark, setIsDark] = useDarkMode()

    const toggleDarkMode = useCallback(() => {
        setIsDark(isDark ? 'light' : 'dark')
    }, [isDark, setIsDark])

    return (
        <div
            className={`flex items-center cursor-pointer text-2xl p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className || ''}`}
            onClick={toggleDarkMode}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? (
                <PiSunDuotone className="text-yellow-500" />
            ) : (
                <PiMoonDuotone className="text-blue-600" />
            )}
        </div>
    )
}

const DarkModeToggle = withHeaderItem(_DarkModeToggle)

export default DarkModeToggle
