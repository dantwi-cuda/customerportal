import {
    PiHouseLineDuotone,
    PiArrowsInDuotone,
    PiBookOpenUserDuotone,
    PiBookBookmarkDuotone,
    PiAcornDuotone,
    PiBagSimpleDuotone,
    PiGearSixDuotone,
    PiUsersDuotone,
    PiCheckSquareDuotone,
    PiFileTextDuotone,
    PiStorefrontDuotone,
    PiUserCircleDuotone,
    PiShieldCheckDuotone,
    PiChartLineDuotone,
    PiGraphDuotone,
    PiCurrencyDollarDuotone,
    PiCreditCardDuotone,
    PiPresentationChartDuotone,
    PiStackDuotone,
    PiCubeDuotone,
    PiEngine,
    PiWrenchDuotone,
    PiNetworkDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    // Existing icons
    home: <PiHouseLineDuotone />,
    singleMenu: <PiAcornDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,

    // New icons for admin section
    setting: <PiGearSixDuotone />,
    users: <PiUsersDuotone />,
    workspace: <PiCheckSquareDuotone />,
    category: <PiFileTextDuotone />,
    reports: <PiPresentationChartDuotone />,
    shop: <PiStorefrontDuotone />,
    customer: <PiUserCircleDuotone />,
    role: <PiShieldCheckDuotone />,

    // New icons for standard menu
    dashboard: <PiGraphDuotone />,
    chart: <PiChartLineDuotone />,
    accounting: <PiCurrencyDollarDuotone />,
    subscription: <PiCreditCardDuotone />,
    network: <PiNetworkDuotone />,

    // Parts management icons
    components: <PiCubeDuotone />,
    parts: <PiWrenchDuotone />,
    cog: <PiGearSixDuotone />,
    building: <PiStorefrontDuotone />,
    tag: <PiFileTextDuotone />,
    truck: <PiStackDuotone />,
    gear: <PiGearSixDuotone />,
    package: <PiBagSimpleDuotone />,
    link: <PiArrowsInDuotone />,
}

export default navigationIcon
