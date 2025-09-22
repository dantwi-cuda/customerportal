import ApiService from './ApiService'
import type { 
    Subscription, 
    CreateSubscriptionDto, 
    UpdateSubscriptionDto,
    SubscriptionExecution
} from '@/@types/subscription'

export async function apiGetSubscriptions(tenantId?: number): Promise<Subscription[]> {
    const params = tenantId ? { tenantId } : {}
    return ApiService.fetchDataWithAxios<Subscription[]>({
        url: '/subscription',
        method: 'get',
        params,
    })
}

export async function apiGetSubscription(id: number): Promise<Subscription> {
    return ApiService.fetchDataWithAxios<Subscription>({
        url: `/subscription/${id}`,
        method: 'get',
    })
}

export async function apiCreateSubscription(data: CreateSubscriptionDto): Promise<Subscription> {
    return ApiService.fetchDataWithAxios<Subscription>({
        url: '/subscription',
        method: 'post',
        data: data as any,
    })
}

export async function apiUpdateSubscription(id: number, data: UpdateSubscriptionDto): Promise<Subscription> {
    return ApiService.fetchDataWithAxios<Subscription>({
        url: `/subscription/${id}`,
        method: 'put',
        data: data as any,
    })
}

export async function apiDeleteSubscription(id: number): Promise<void> {
    return ApiService.fetchDataWithAxios<void>({
        url: `/subscription/${id}`,
        method: 'delete',
    })
}

export async function apiGetSubscriptionExecutions(id: number): Promise<SubscriptionExecution[]> {
    return ApiService.fetchDataWithAxios<SubscriptionExecution[]>({
        url: `/subscription/${id}/executions`,
        method: 'get',
    })
}

export async function apiGetActiveSubscriptionsForExecution(): Promise<Subscription[]> {
    return ApiService.fetchDataWithAxios<Subscription[]>({
        url: '/subscription/active-for-execution',
        method: 'get',
    })
}

const SubscriptionService = {
    getSubscriptions: apiGetSubscriptions,
    getSubscription: apiGetSubscription,
    createSubscription: apiCreateSubscription,
    updateSubscription: apiUpdateSubscription,
    deleteSubscription: apiDeleteSubscription,
    getSubscriptionExecutions: apiGetSubscriptionExecutions,
    getActiveSubscriptionsForExecution: apiGetActiveSubscriptionsForExecution,
}

export default SubscriptionService
