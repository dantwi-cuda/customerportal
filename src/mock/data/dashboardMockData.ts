// Mock data for tenant dashboard when API is not available
import type {
    ShopStatsDto,
    DashboardStatsDto,
    ShopRevenueDto,
    CityRevenueDto,
    LegacyMonthlyTrendDto,
    LabourCategoryDto,
    TenantDashboardDto,
    ShopSummaryDto,
    MonthlyTrendDto,
    ShopKpiDto,
} from '@/services/ShopStatsService'
import type { Shop } from '@/@types/shop'

// Generate mock shops data
export const getMockShops = (): Shop[] => [
    {
        id: 1,
        name: 'Downtown Auto Body',
        source: 'direct',
        postalCode: 'M5H 2N2',
        city: 'Toronto',
        state: 'ON',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Paint Services'],
        kpIs: [],
    },
    {
        id: 2,
        name: 'Westside Collision Center',
        source: 'partner',
        postalCode: 'V6B 2W9',
        city: 'Vancouver',
        state: 'BC',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Detailing'],
        kpIs: [],
    },
    {
        id: 3,
        name: 'Eastend Repair Shop',
        source: 'direct',
        postalCode: 'T2P 2M5',
        city: 'Calgary',
        state: 'AB',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Mechanical'],
        kpIs: [],
    },
    {
        id: 4,
        name: 'Central Auto Works',
        source: 'partner',
        postalCode: 'M4W 3L4',
        city: 'Toronto',
        state: 'ON',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Paint Services'],
        kpIs: [],
    },
    {
        id: 5,
        name: 'Northgate Body Shop',
        source: 'direct',
        postalCode: 'T5K 1M8',
        city: 'Edmonton',
        state: 'AB',
        country: 'Canada',
        isActive: true,
        programNames: ['Body Work', 'Paint Services'],
        kpIs: [],
    },
    {
        id: 6,
        name: 'Southview Collision',
        source: 'partner',
        postalCode: 'H3A 1B1',
        city: 'Montreal',
        state: 'QC',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Glass Repair'],
        kpIs: [],
    },
    {
        id: 7,
        name: 'Pacific Coast Auto',
        source: 'direct',
        postalCode: 'V8W 1P6',
        city: 'Victoria',
        state: 'BC',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Restoration'],
        kpIs: [],
    },
    {
        id: 8,
        name: 'Atlantic Auto Repair',
        source: 'partner',
        postalCode: 'B3H 4R2',
        city: 'Halifax',
        state: 'NS',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Mechanical'],
        kpIs: [],
    },
    {
        id: 9,
        name: 'Prairie Motors',
        source: 'direct',
        postalCode: 'S7K 1J5',
        city: 'Saskatoon',
        state: 'SK',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Parts Sales'],
        kpIs: [],
    },
    {
        id: 10,
        name: 'Capital City Collision',
        source: 'partner',
        postalCode: 'K1A 0A6',
        city: 'Ottawa',
        state: 'ON',
        country: 'Canada',
        isActive: true,
        programNames: ['Collision Repair', 'Insurance Claims'],
        kpIs: [],
    },
]

// Generate mock tenant dashboard data using the optimized structure
export const getMockTenantDashboard = (): TenantDashboardDto => {
    const shops = getMockShops()
    const now = new Date()
    
    // Generate shop summaries
    const shopSummaries: ShopSummaryDto[] = shops.map(shop => {
        const baseRevenue = 15000 + Math.random() * 35000
        const totalOrders = Math.floor(50 + Math.random() * 150)
        const totalCustomers = Math.floor(totalOrders * 0.7) // Some customers have multiple orders
        
        return {
            shopId: shop.id.toString(),
            shopName: shop.name,
            isActive: shop.isActive,
            totalRevenue: Math.floor(baseRevenue),
            totalOrders,
            totalCustomers,
            averageOrderValue: Math.floor(baseRevenue / totalOrders),
            lastOrderDate: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
    })
    
    // Generate monthly trends for last 6 months
    const monthlyTrends: MonthlyTrendDto[] = []
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const totalOrders = Math.floor(500 + Math.random() * 300)
        const totalRevenue = Math.floor(totalOrders * (2000 + Math.random() * 1000))
        const totalCustomers = Math.floor(totalOrders * 0.7)
        
        monthlyTrends.push({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            totalRevenue,
            totalOrders,
            totalCustomers,
            averageOrderValue: Math.floor(totalRevenue / totalOrders),
            shopCount: shops.length,
        })
    }
    
    // Calculate totals
    const totalRevenue = shopSummaries.reduce((sum, shop) => sum + shop.totalRevenue, 0)
    const totalOrders = shopSummaries.reduce((sum, shop) => sum + shop.totalOrders, 0)
    const totalCustomers = shopSummaries.reduce((sum, shop) => sum + shop.totalCustomers, 0)
    
    return {
        tenantId: 'tenant-123',
        totalShops: shops.length,
        totalActiveShops: shops.filter(shop => shop.isActive).length,
        totalRevenue,
        totalOrders,
        averageOrderValue: Math.floor(totalRevenue / totalOrders),
        totalCustomers,
        lastUpdated: now.toISOString(),
        shopSummaries: shopSummaries.sort((a, b) => b.totalRevenue - a.totalRevenue), // Sort by revenue desc
        monthlyTrends,
    }
}

// Generate mock shop stats data
export const getMockShopStats = (startDate: string, endDate: string): ShopStatsDto[] => {
    const shops = getMockShops()
    const mockData: ShopStatsDto[] = []
    let id = 1

    // Generate data for each shop
    shops.forEach(shop => {
        // Generate multiple entries for date range
        const start = new Date(startDate)
        const end = new Date(endDate)
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        
        // Generate 3-5 random entries per shop across the date range
        const numEntries = Math.floor(Math.random() * 3) + 3
        
        for (let i = 0; i < numEntries; i++) {
            const randomDay = Math.floor(Math.random() * daysDiff)
            const entryDate = new Date(start)
            entryDate.setDate(start.getDate() + randomDay)
            
            const baseRevenue = 15000 + Math.random() * 35000 // $15k - $50k
            const numROs = Math.floor(Math.random() * 20) + 5 // 5-25 ROs
            const labourHoursMultiplier = 8 + Math.random() * 12 // 8-20 hours per RO
            
            mockData.push({
                id: id++,
                shopId: shop.id,
                date: entryDate.toISOString(),
                numberOfROs: numROs,
                grossAmount: baseRevenue,
                netAmount: baseRevenue * 0.85,
                repairCost: baseRevenue * 0.7,
                labourAmount: baseRevenue * 0.4,
                paintLabourAmount: baseRevenue * 0.15,
                bodyLabourAmount: baseRevenue * 0.12,
                frameLabourAmount: baseRevenue * 0.08,
                mechanicalLabourAmount: baseRevenue * 0.05,
                otherLabourAmount: baseRevenue * 0.03,
                labourHours: numROs * labourHoursMultiplier,
                paintLabourHours: numROs * labourHoursMultiplier * 0.3,
                bodyLabourHours: numROs * labourHoursMultiplier * 0.25,
                frameLabourHours: numROs * labourHoursMultiplier * 0.2,
                otherLabourHours: numROs * labourHoursMultiplier * 0.25,
                materialsAmount: baseRevenue * 0.3,
                partsCost: baseRevenue * 0.25,
                labourCost: baseRevenue * 0.3,
                paintLabourCost: baseRevenue * 0.12,
                mechanicalLabourCost: baseRevenue * 0.08,
                otherLabourCost: baseRevenue * 0.05,
                paintMaterialsAmount: baseRevenue * 0.1,
                paintMaterialsCost: baseRevenue * 0.08,
                materialsCost: baseRevenue * 0.2,
                partsAmount: baseRevenue * 0.3,
                oemPartsAmount: baseRevenue * 0.2,
                amPartsAmount: baseRevenue * 0.08,
                reconditionedPartsAmount: baseRevenue * 0.02,
                mappedMake: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW'][Math.floor(Math.random() * 5)],
            })
        }
    })
    
    return mockData
}

export const getMockDashboardStats = (
    shopStatsData: ShopStatsDto[],
    shopsData: Shop[],
    dateRange: { startDate: string; endDate: string }
): DashboardStatsDto => {
    const totalRevenue = shopStatsData.reduce((sum, stat) => sum + (stat.grossAmount || 0), 0)
    const totalLabourHours = shopStatsData.reduce((sum, stat) => sum + (stat.labourHours || 0), 0)
    
    return {
        totalShops: shopsData.length,
        totalRevenue,
        totalLabourHours,
        dateRange
    }
}

export const getMockShopRevenueData = (
    shopStatsData: ShopStatsDto[],
    shopsData: Shop[]
): ShopRevenueDto[] => {
    const shopRevenueMap = new Map<number, ShopRevenueDto>()
    
    shopStatsData.forEach(stat => {
        if (stat.shopId) {
            const existing = shopRevenueMap.get(stat.shopId)
            const shop = shopsData.find(s => s.id === stat.shopId)
            
            if (existing) {
                existing.totalRevenue += stat.grossAmount || 0
                existing.totalLabourHours += stat.labourHours || 0
                existing.numberOfROs += stat.numberOfROs || 0
            } else {
                shopRevenueMap.set(stat.shopId, {
                    shopId: stat.shopId,
                    shopName: shop?.name || `Shop ${stat.shopId}`,
                    shopCity: shop?.city,
                    totalRevenue: stat.grossAmount || 0,
                    totalLabourHours: stat.labourHours || 0,
                    numberOfROs: stat.numberOfROs || 0
                })
            }
        }
    })
    
    return Array.from(shopRevenueMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export const getMockCityRevenueData = (shopRevenueData: ShopRevenueDto[]): CityRevenueDto[] => {
    const cityRevenueMap = new Map<string, CityRevenueDto>()
    
    shopRevenueData.forEach(shop => {
        const city = shop.shopCity || 'Unknown'
        const existing = cityRevenueMap.get(city)
        
        if (existing) {
            existing.totalRevenue += shop.totalRevenue
            existing.shopCount += 1
        } else {
            cityRevenueMap.set(city, {
                city,
                totalRevenue: shop.totalRevenue,
                shopCount: 1,
            })
        }
    })
    
    return Array.from(cityRevenueMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export const getMockMonthlyTrendData = (): MonthlyTrendDto[] => {
    const months = []
    const now = new Date()
    
    // Generate data for last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const baseROs = 150 + Math.random() * 100 // 150-250 ROs per month
        const baseRevenue = baseROs * (2000 + Math.random() * 1000) // $2k-3k per RO
        
        months.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            numberOfROs: Math.floor(baseROs),
            totalRevenue: Math.floor(baseRevenue),
            year: date.getFullYear(),
            monthNumber: date.getMonth() + 1,
        })
    }
    
    return months
}

export const getMockLabourCategoryData = (shopStatsData: ShopStatsDto[]): LabourCategoryDto[] => {
    const categories: LabourCategoryDto[] = [
        {
            category: 'Paint Labour',
            hours: shopStatsData.reduce((sum, stat) => sum + (stat.paintLabourHours || 0), 0),
            amount: shopStatsData.reduce((sum, stat) => sum + (stat.paintLabourAmount || 0), 0),
            percentage: 0,
        },
        {
            category: 'Body Labour',
            hours: shopStatsData.reduce((sum, stat) => sum + (stat.bodyLabourHours || 0), 0),
            amount: shopStatsData.reduce((sum, stat) => sum + (stat.bodyLabourAmount || 0), 0),
            percentage: 0,
        },
        {
            category: 'Frame Labour',
            hours: shopStatsData.reduce((sum, stat) => sum + (stat.frameLabourHours || 0), 0),
            amount: shopStatsData.reduce((sum, stat) => sum + (stat.frameLabourAmount || 0), 0),
            percentage: 0,
        },
        {
            category: 'Mechanical Labour',
            hours: shopStatsData.reduce((sum, stat) => sum + (stat.mechanicalLabourAmount || 0), 0),
            amount: shopStatsData.reduce((sum, stat) => sum + (stat.mechanicalLabourAmount || 0), 0),
            percentage: 0,
        },
        {
            category: 'Other Labour',
            hours: shopStatsData.reduce((sum, stat) => sum + (stat.otherLabourHours || 0), 0),
            amount: shopStatsData.reduce((sum, stat) => sum + (stat.otherLabourAmount || 0), 0),
            percentage: 0,
        },
    ]
    
    // Calculate percentages
    const totalHours = categories.reduce((sum, cat) => sum + cat.hours, 0)
    categories.forEach(cat => {
        cat.percentage = totalHours > 0 ? (cat.hours / totalHours) * 100 : 0
    })
    
    return categories.filter(cat => cat.hours > 0)
}
