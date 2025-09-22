export interface CustomerInfo {
    id?: string
    name: string
    legalName?: string
    domainUrl?: string
    subdomain?: string
    address?: string
    theme?: string
    legacyBusinessNetworkID?: string
    portalDisplayName?: string
    portalDisplaySubName?: string
    portalDisplayPageSubTitle?: string
    portalWindowIcon?: string
    isActive?: boolean
}

export interface Customer {
    id: number
    name: string
    subdomain?: string
    address?: string
    logoUrl?: string
    backgroundImageUrl?: string
    theme?: string
    legacyBusinessNetworkID?: string
    portalDisplayName?: string
    portalDisplaySubName?: string
    portalDisplayPageSubTitle?: string
    portalWindowIcon?: string
    isActive: boolean
    createdAt?: string
    updatedAt?: string
}

export interface CreateCustomerRequest {
    name: string
    subdomain: string
    address?: string
    theme?: string
    legacyBusinessNetworkID?: string
    portalDisplayName?: string
    portalDisplaySubName?: string
    portalDisplayPageSubTitle?: string
    portalWindowIcon?: string
}

export interface UpdateCustomerRequest {
    name: string
    subdomain: string
    address?: string
    theme?: string
    legacyBusinessNetworkID?: string
    portalDisplayName?: string
    portalDisplaySubName?: string
    portalDisplayPageSubTitle?: string
    portalWindowIcon?: string
    isActive: boolean
}

export interface CustomerLogoRequest {
    url: string
    fileName: string
    originalFileName: string
    contentType: string
    sizeInBytes: number
    width: number
    height: number
    uploadedAt: string
}

export interface CustomerBackgroundRequest {
    url: string
    fileName: string
    originalFileName: string
    contentType: string
    sizeInBytes: number
    width: number
    height: number
    uploadedAt: string
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