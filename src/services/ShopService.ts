import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type { 
    Shop, 
    ShopDto, 
    ShopFilters,
    ShopKpi,
    AssignProgramsRequest,
    AssignUsersRequest 
} from '@/@types/shop'

// Shop APIs
export async function getShopsList(filters?: ShopFilters) {
    return ApiService.fetchDataWithAxios<Shop[]>({
        url: '/api/Shop',
        method: 'get',
        params: filters
    })
}

export async function getShopById(shopId: number) {
    return ApiService.fetchDataWithAxios<Shop>({
        url: `/api/Shop/${shopId}`,
        method: 'get'
    })
}

export async function createShop(shop: ShopDto) {
    return ApiService.fetchDataWithAxios<Shop>({
        url: '/api/Shop',
        method: 'post',
        data: shop
    })
}

export async function updateShop(shopId: number, shop: ShopDto) {
    return ApiService.fetchDataWithAxios<Shop>({
        url: `/api/Shop/${shopId}`,
        method: 'put',
        data: shop
    })
}

export async function deleteShop(shopId: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Shop/${shopId}`,
        method: 'delete'
    })
}

export async function activateShop(shopId: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Shop/${shopId}/activate`,
        method: 'post'
    })
}

export async function deactivateShop(shopId: number) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Shop/${shopId}/deactivate`,
        method: 'post'
    })
}

export async function assignPrograms(shopId: number, request: AssignProgramsRequest) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Shop/${shopId}/programs`,
        method: 'post',
        data: request
    })
}

export async function assignUsers(shopId: number, request: AssignUsersRequest) {
    return ApiService.fetchDataWithAxios<void>({
        url: `/api/Shop/${shopId}/users`,
        method: 'post',
        data: request
    })
}

export async function getShopKpis(shopId: number) {
    return ApiService.fetchDataWithAxios<ShopKpi[]>({
        url: `/api/Shop/${shopId}/kpis`,
        method: 'get'
    })
}

export async function assignShopsToUser(userId: string, shopIds: number[]) {
    return ApiService.fetchDataWithAxios<void>({
        url: '/api/Shop/bulk/assign-shops-to-user',
        method: 'post',
        data: {
            userId,
            shopIds
        }
    })
}

// Default export
const ShopService = {
    getShopsList,
    getShopById,
    createShop,
    updateShop,
    deleteShop,
    activateShop,
    deactivateShop,
    assignPrograms,
    assignUsers,
    getShopKpis,
    assignShopsToUser
}

export default ShopService
