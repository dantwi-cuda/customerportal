import ApiService from './ApiService'
import type {
    ShopAttributeDto,
    CreateShopAttributeDto,
    UpdateShopAttributeDto,
    AttributeCategoryDto,
    CreateAttributeCategoryDto,
    UpdateAttributeCategoryDto,
    AttributeUnitDto,
    CreateAttributeUnitDto,
    UpdateAttributeUnitDto,
} from '@/@types/shop'

// Shop Attribute API calls
export async function getShopAttributes(): Promise<ShopAttributeDto[]> {
    const response = await ApiService.fetchDataWithAxios<ShopAttributeDto[]>({
        url: '/api/ShopAttribute',
        method: 'get',
    })
    return response
}

export async function getShopAttribute(id: number): Promise<ShopAttributeDto> {
    const response = await ApiService.fetchDataWithAxios<ShopAttributeDto>({
        url: `/api/ShopAttribute/${id}`,
        method: 'get',
    })
    return response
}

export async function createShopAttribute(
    data: CreateShopAttributeDto,
): Promise<ShopAttributeDto> {
    const response = await ApiService.fetchDataWithAxios<ShopAttributeDto, CreateShopAttributeDto>({
        url: '/api/ShopAttribute',
        method: 'post',
        data,
    })
    return response
}

export async function updateShopAttribute(
    id: number,
    data: UpdateShopAttributeDto,
): Promise<ShopAttributeDto> {
    const response = await ApiService.fetchDataWithAxios<ShopAttributeDto, UpdateShopAttributeDto>({
        url: `/api/ShopAttribute/${id}`,
        method: 'put',
        data,
    })
    return response
}

export async function deleteShopAttribute(id: number): Promise<void> {
    await ApiService.fetchDataWithAxios<void>({
        url: `/api/ShopAttribute/${id}`,
        method: 'delete',
    })
}

export async function getShopAttributesByCategory(
    categoryId: number,
): Promise<ShopAttributeDto[]> {
    const response = await ApiService.fetchDataWithAxios<ShopAttributeDto[]>({
        url: `/api/ShopAttribute/category/${categoryId}`,
        method: 'get',
    })
    return response
}

// Attribute Category API calls
export async function getAttributeCategories(): Promise<AttributeCategoryDto[]> {
    const response = await ApiService.fetchDataWithAxios<AttributeCategoryDto[]>({
        url: '/api/AttributeCategory',
        method: 'get',
    })
    return response
}

export async function getAttributeCategory(
    id: number,
): Promise<AttributeCategoryDto> {
    const response = await ApiService.fetchDataWithAxios<AttributeCategoryDto>({
        url: `/api/AttributeCategory/${id}`,
        method: 'get',
    })
    return response
}

export async function createAttributeCategory(
    data: CreateAttributeCategoryDto,
): Promise<AttributeCategoryDto> {
    const response = await ApiService.fetchDataWithAxios<AttributeCategoryDto, CreateAttributeCategoryDto>({
        url: '/api/AttributeCategory',
        method: 'post',
        data,
    })
    return response
}

export async function updateAttributeCategory(
    id: number,
    data: UpdateAttributeCategoryDto,
): Promise<AttributeCategoryDto> {
    const response = await ApiService.fetchDataWithAxios<AttributeCategoryDto, UpdateAttributeCategoryDto>({
        url: `/api/AttributeCategory/${id}`,
        method: 'put',
        data,
    })
    return response
}

export async function deleteAttributeCategory(id: number): Promise<void> {
    await ApiService.fetchDataWithAxios<void>({
        url: `/api/AttributeCategory/${id}`,
        method: 'delete',
    })
}

// Attribute Unit API calls
export async function getAttributeUnits(): Promise<AttributeUnitDto[]> {
    const response = await ApiService.fetchDataWithAxios<AttributeUnitDto[]>({
        url: '/api/AttributeUnit',
        method: 'get',
    })
    return response
}

export async function getAttributeUnit(id: number): Promise<AttributeUnitDto> {
    const response = await ApiService.fetchDataWithAxios<AttributeUnitDto>({
        url: `/api/AttributeUnit/${id}`,
        method: 'get',
    })
    return response
}

export async function createAttributeUnit(
    data: CreateAttributeUnitDto,
): Promise<AttributeUnitDto> {
    const response = await ApiService.fetchDataWithAxios<AttributeUnitDto, CreateAttributeUnitDto>({
        url: '/api/AttributeUnit',
        method: 'post',
        data,
    })
    return response
}

export async function updateAttributeUnit(
    id: number,
    data: UpdateAttributeUnitDto,
): Promise<AttributeUnitDto> {
    const response = await ApiService.fetchDataWithAxios<AttributeUnitDto, UpdateAttributeUnitDto>({
        url: `/api/AttributeUnit/${id}`,
        method: 'put',
        data,
    })
    return response
}

export async function deleteAttributeUnit(id: number): Promise<void> {
    await ApiService.fetchDataWithAxios<void>({
        url: `/api/AttributeUnit/${id}`,
        method: 'delete',
    })
}
