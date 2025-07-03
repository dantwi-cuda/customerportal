export interface CustomerInfo {
    id?: string
    name: string
    legalName: string
    domainUrl: string
    subdomain?: string
    isActive: boolean
}

export interface Customer {
    id: number
    name: string
    legalName: string
    contactEmail?: string
    domainUrl: string
    subdomain?: string
    isActive: boolean
}

export interface CustomerCredentials {
    biUsername: string
    biPassword: string
}

export interface CustomerBranding {
    displayTitle: string
    logoUrl: string
    backgroundUrl?: string
    faviconUrl?: string
    primaryColor?: string
    secondaryColor?: string
}

export interface CustomerDetailsResponse extends CustomerInfo {
    credentials?: CustomerCredentials
    branding?: CustomerBranding
}