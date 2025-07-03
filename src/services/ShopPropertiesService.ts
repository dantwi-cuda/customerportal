import ApiService from './ApiService'
import type { 
    ShopPropertiesDto,
    CreateShopPropertiesDto,
    UpdateShopPropertiesDto,
    BulkUpdateShopPropertiesDto,
    ShopPropertiesFilters
} from '@/@types/shop'

// Shop Properties APIs
export async function getShopPropertiesByShop(shopId: number) {
    return ApiService.fetchDataWithAxios<ShopPropertiesDto[]>({
        url: `/api/ShopProperties/shop/${shopId}`,
        method: 'get'
    })
}

export async function getShopPropertiesByShopAndYear(shopId: number, year: number, month?: number) {
    const params = month ? { month } : {}
    const url = `/api/ShopProperties/shop/${shopId}/year/${year}`
    console.log('ShopPropertiesService: Making API call to:', url, 'with params:', params)
    
    const result = await ApiService.fetchDataWithAxios<ShopPropertiesDto[]>({
        url,
        method: 'get',
        params
    })
    
    console.log('ShopPropertiesService: API response:', result)
    return result
}

export async function getShopPropertiesByAttribute(shopAttributeId: number) {
    return ApiService.fetchDataWithAxios<ShopPropertiesDto[]>({
        url: `/api/ShopProperties/attribute/${shopAttributeId}`,
        method: 'get'
    })
}

export async function getShopPropertyById(id: number) {
    return ApiService.fetchDataWithAxios<ShopPropertiesDto>({
        url: `/api/ShopProperties/${id}`,
        method: 'get'
    })
}

export async function createShopProperty(data: CreateShopPropertiesDto) {
    return ApiService.fetchDataWithAxios<ShopPropertiesDto>({
        url: '/api/ShopProperties',
        method: 'post',
        data: data as any
    })
}

export async function updateShopProperty(id: number, data: UpdateShopPropertiesDto) {
    return ApiService.fetchDataWithAxios<ShopPropertiesDto>({
        url: `/api/ShopProperties/${id}`,
        method: 'put',
        data: data as any
    })
}

export async function deleteShopProperty(id: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/ShopProperties/${id}`,
        method: 'delete'
    })
}

export async function bulkUpdateShopProperties(data: BulkUpdateShopPropertiesDto) {
    return ApiService.fetchDataWithAxios<ShopPropertiesDto[]>({
        url: '/api/ShopProperties/bulk-update',
        method: 'patch',
        data: data as any
    })
}

// Helper function to get filtered shop properties
export async function getFilteredShopProperties(filters: ShopPropertiesFilters) {
    if (filters.shopId && filters.year) {
        return getShopPropertiesByShopAndYear(filters.shopId, filters.year, filters.month)
    } else if (filters.shopId) {
        return getShopPropertiesByShop(filters.shopId)
    } else {
        // Fallback to get all for a default shop or handle error
        throw new Error('Shop ID is required for filtering shop properties')
    }
}

// Utility function to format date for display (YYYY-MMM)
export function formatPropertyDate(year: number, month: number): string {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${year}-${monthNames[month - 1]}`
}

// Utility function to get date range (2 years ago to 6 months in future)
export function getDateRange(): { startYear: number, startMonth: number, endYear: number, endMonth: number } {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 0-based to 1-based
    
    // 2 years ago from current date
    let startYear = currentYear - 2
    let startMonth = currentMonth
    
    // 6 months in future from current date
    let endYear = currentYear
    let endMonth = currentMonth + 6
    if (endMonth > 12) {
        endYear += Math.floor((endMonth - 1) / 12)
        endMonth = ((endMonth - 1) % 12) + 1
    }
    
    return { startYear, startMonth, endYear, endMonth }
}

// Utility function to generate year-month options for date filter
export function getDateOptions(): Array<{ label: string, value: string, year: number, month: number }> {
    const { startYear, startMonth, endYear, endMonth } = getDateRange()
    const options: Array<{ label: string, value: string, year: number, month: number }> = []
    
    let currentYear = startYear
    let currentMonth = startMonth
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const value = `${currentYear}${currentMonth.toString().padStart(2, '0')}`
        options.push({
            label: formatPropertyDate(currentYear, currentMonth),
            value: value,
            year: currentYear,
            month: currentMonth
        })
        
        currentMonth++
        if (currentMonth > 12) {
            currentMonth = 1
            currentYear++
        }
    }
    
    return options
}