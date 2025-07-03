export type DashboardStats = {
    // storeCount: number; // Original, might be replaced or not used by current Dashboard.tsx cards
    // ytdRevenue: number; // Original
    // revenueGrowth: number; // Original, seems to be a direct growth value
    // growthPercentage: number; // Original
    // roCount: number; // Original

    totalShops: { value: number; growth: number };
    totalRevenue: { value: number; growth: number };
    totalReports: { value: number; growth: number };
    // Include other properties if they are still needed and used elsewhere
    salesByShop?: SalesByShop[];
    salesByLocation?: SalesByLocation[];
}

export type SalesByShop = {
    id: string
    name: string
    revenue: number
    roCount: number
    laborCost: number
    laborHours: number
    growth: number
}

export type SalesByLocation = {
    id: string
    name: string
    latitude: number
    longitude: number
    revenue: number
    count: number
}

export interface SalesBySite {
    id: string
    name: string
    revenue: number
    growth: number
    comparison: 'up' | 'down' | 'unchanged'
}

export interface DashboardSummary {
    totalRevenue: number
    averageTicket: number
    totalROs: number
    totalShops: number
    revenueComparison: number
    ticketComparison: number
    roComparison: number
    topPerformers: SalesBySite[]
    lowPerformers: SalesBySite[]
}

export interface DashboardFilters {
    dateRange: string
    shops?: string[]
    categories?: string[]
}