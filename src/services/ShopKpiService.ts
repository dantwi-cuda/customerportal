import ApiService from './ApiService'

export interface ShopKpiDto {
    id: number
    shopAttributeId: number
    shopId: number
    kpiYear: number
    kpiMonth: number
    kpiValue: number | null
    kpiGoal: number | null
    kpiThreshold: number | null
    rowModifiedBy: string | null
    rowModifiedOn: string | null
    kpibmsValue: number | null
    attributeName: string | null
    attributeCategoryDescription: string | null
    attributeUnitType: string | null
}

export interface UpdateShopKpiDto {
    kpiYear: number
    kpiMonth: number
    kpiValue: number | null
    kpiGoal: number | null
    kpiThreshold: number | null
    kpibmsValue: number | null
}

export interface ShopKpiBulkUpdateItem {
    id: number
    kpiValue: number | null
    kpiGoal: number | null
}

export interface BulkUpdateShopKpiDto {
    updates: ShopKpiBulkUpdateItem[]
}

export async function apiGetShopKpis<T>(shopId: number) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/api/ShopKpi/shop/${shopId}`,
        method: 'get',
    })
}

export async function apiGetShopKpiById<T>(id: number) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/api/ShopKpi/${id}`,
        method: 'get',
    })
}

export async function apiUpdateShopKpi<T>(id: number, data: UpdateShopKpiDto) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/api/ShopKpi/${id}`,
        method: 'put',
        data,
    })
}

export async function apiBulkUpdateShopKpis<T>(data: BulkUpdateShopKpiDto) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/ShopKpi/bulk-update',
        method: 'patch',
        data,
    })
}

export async function apiDeleteShopKpi<T>(id: number) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/api/ShopKpi/${id}`,
        method: 'delete',
    })
}
