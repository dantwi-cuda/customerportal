import ApiService from './ApiService'

// ShopStats DTOs based on swagger.json
export interface ShopStatsDto {
    id: number
    shopId?: number | null
    mappedMake?: string | null
    date?: string | null
    numberOfROs?: number | null
    grossAmount?: number | null
    netAmount?: number | null
    repairCost?: number | null
    labourAmount?: number | null
    paintLabourAmount?: number | null
    bodyLabourAmount?: number | null
    frameLabourAmount?: number | null
    mechanicalLabourAmount?: number | null
    otherLabourAmount?: number | null
    labourCost?: number | null
    paintLabourCost?: number | null
    mechanicalLabourCost?: number | null
    otherLabourCost?: number | null
    paintMaterialsAmount?: number | null
    materialsAmount?: number | null
    paintMaterialsCost?: number | null
    materialsCost?: number | null
    nonOEMPartsCost?: number | null
    amPartsCost?: number | null
}

export interface DashboardApiResponse {
    shopStats: ShopDashboardStatsDto[]
    totals: DashboardSummaryDto
    trendData: any[]
    topPerformers: any[]
}

export interface DashboardSummaryDto {
    totalShops: number
    totalROs: number
    totalRevenue: number
    totalCosts: number
    averageProfitMargin: number
    totalLabourHours: number
    averageLabourEfficiency: number
}

export interface ShopDashboardStatsDto {
    shopId: number
    shopName: string
    shopLocation: string
    city: string
    state: string
    country: string
    latitude: number | null
    longitude: number | null
    totalROs: number
    totalGrossAmount: number
    totalNetAmount: number
    totalLabourHours: number
    totalRevenue: number
    totalCosts: number
    profitMargin: number
    averageROValue: number
    labourEfficiency: number
    totalPartsAmount: number
    oemPartsPercentage: number
    aftermarketPartsPercentage: number
    recycledPartsPercentage: number
    paintLabourPercentage: number
    bodyLabourPercentage: number
    mechanicalLabourPercentage: number
    frameLabourPercentage: number
    topVehicleMakes: any[]
    lastDataDate: string
    firstDataDate: string
}

export async function getDashboardSummary(
    startDate: string,
    endDate: string
): Promise<DashboardApiResponse> {
    return ApiService.fetchDataWithAxios<DashboardApiResponse>({
        url: '/api/ShopStats/dashboard/summary',
        method: 'get',
        params: {
            startDate,
            endDate,
        },
    })
}

export async function getDashboardShops(
    startDate: string,
    endDate: string
): Promise<ShopDashboardStatsDto[]> {
    return ApiService.fetchDataWithAxios<ShopDashboardStatsDto[]>({
        url: '/api/ShopStats/dashboard/shops',
        method: 'get',
        params: {
            startDate,
            endDate,
        },
    })
}