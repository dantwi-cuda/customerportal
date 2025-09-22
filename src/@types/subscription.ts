export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface ScheduleConfig {
    dailyTime?: string
    weeklyDays?: DayOfWeek[]
    weeklyTime?: string
    monthlyDay?: number
    monthlyTime?: string
    lastDayOfMonth?: boolean
    monthlyWeekOption?: string
    monthlyDayOfWeek?: DayOfWeek
    timeZone?: string
}

export interface SubscriptionReport {
    id: number
    reportId: number
    reportName?: string
    reportDescription?: string
    workspaceName?: string
    createdAt: string
}

export interface SubscriptionUser {
    id: number
    userId?: string
    userName?: string
    userEmail?: string
    createdAt: string
}

export interface SubscriptionExecution {
    id: number
    executedAt: string
    status?: string
    details?: string
    emailsSent: number
    emailsFailed: number
    errorDetails?: string
    executionDuration?: {
        ticks: number
        days: number
        hours: number
        milliseconds: number
        minutes: number
        seconds: number
        totalDays: number
        totalHours: number
        totalMilliseconds: number
        totalMinutes: number
        totalSeconds: number
    }
}

export interface Subscription {
    id: number
    name: string
    description?: string
    tenantId: number
    tenantName?: string
    emailSubject: string
    emailBody: string
    scheduleType: string
    scheduleConfig: ScheduleConfig
    scheduleStartDate: string
    scheduleEndDate?: string
    isActive: boolean
    createdAt: string
    updatedAt?: string
    createdByUserId?: string
    createdByUserName?: string
    lastUpdatedByUserId?: string
    lastUpdatedByUserName?: string
    lastExecutedAt?: string
    nextExecutionAt?: string
    executionStatus?: string
    lastExecutionDetails?: string
    reports?: SubscriptionReport[]
    users?: SubscriptionUser[]
    recentExecutions?: SubscriptionExecution[]
}

export interface CreateSubscriptionDto {
    name: string
    description?: string
    emailSubject: string
    emailBody: string
    scheduleType: string
    scheduleConfig: ScheduleConfig
    scheduleStartDate: string
    scheduleEndDate?: string
    isActive: boolean
    reportIds: number[]
    userIds: string[]
}

export interface UpdateSubscriptionDto {
    name: string
    description?: string
    emailSubject: string
    emailBody: string
    scheduleType: string
    scheduleConfig: ScheduleConfig
    scheduleStartDate: string
    scheduleEndDate?: string
    isActive: boolean
    reportIds: number[]
    userIds: string[]
}

export type ScheduleType = 'daily' | 'weekly' | 'monthly'

export interface SubscriptionFormData {
    name: string
    description: string
    emailSubject: string
    emailBody: string
    scheduleType: ScheduleType
    scheduleConfig: ScheduleConfig
    scheduleStartDate: Date
    scheduleEndDate?: Date
    isActive: boolean
    reportIds: number[]
    userIds: string[]
}
