interface Customer {
    id: number;
    name: string;
    subdomain?: string;
    address?: string | null;
    logoUrl?: string | null;
    backgroundImageUrl?: string | null;
    theme?: string | null;
    legacyBusinessNetworkID?: string | null;
    portalDisplayNameBold?: string | null;
    portalDisplayName?: string | null;
    portalDisplaySubName?: string | null;
    portalDisplayPageSubTitle?: string | null;
    portalWindowIcon?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    customerReports?: any[];
    customerShops?: any[];
    customerUsers?: any[];
    customerWorkspaces?: any[];
    programs?: any[];
    reportCategories?: any[];
}

export const customerMockData: Customer[] = [
    {
        id: 1,
        name: "Demo Customer",
        subdomain: "demo",
        address: "123 Main St, Demo City, DC 12345",
        logoUrl: null,
        backgroundImageUrl: null,
        theme: "default",
        legacyBusinessNetworkID: "BN001",
        portalDisplayNameBold: "Demo Portal",
        portalDisplayName: "Customer Portal",
        portalDisplaySubName: "Welcome to our portal",
        portalDisplayPageSubTitle: "Your trusted partner",
        portalWindowIcon: "https://example.com/favicon.ico",
        isActive: true,
        createdAt: "2025-07-02T21:51:51.266Z",
        updatedAt: "2025-07-02T21:51:51.266Z",
        customerReports: [],
        customerShops: [],
        customerUsers: [],
        customerWorkspaces: [],
        programs: [],
        reportCategories: []
    },
    {
        id: 2,
        name: "Test Corporation",
        subdomain: "test-corp",
        address: "456 Business Ave, Corporate City, CC 67890",
        logoUrl: "https://example.com/logos/test-corp-logo.png",
        backgroundImageUrl: "https://example.com/backgrounds/test-corp-bg.jpg",
        theme: "dark",
        legacyBusinessNetworkID: "BN002",
        portalDisplayNameBold: "Test Corp Portal",
        portalDisplayName: "Business Portal",
        portalDisplaySubName: "Enterprise Solutions",
        portalDisplayPageSubTitle: "Driving innovation forward",
        portalWindowIcon: "https://example.com/test-favicon.ico",
        isActive: true,
        createdAt: "2025-06-15T14:30:22.123Z",
        updatedAt: "2025-07-01T09:15:44.567Z",
        customerReports: [],
        customerShops: [],
        customerUsers: [],
        customerWorkspaces: [],
        programs: [],
        reportCategories: []
    },
    {
        id: 3,
        name: "Global Industries",
        subdomain: "global-ind",
        address: "789 Industrial Blvd, Manufacturing City, MC 11122",
        logoUrl: null,
        backgroundImageUrl: null,
        theme: "green",
        legacyBusinessNetworkID: "BN003",
        portalDisplayNameBold: "Global Industries",
        portalDisplayName: "Manufacturing Portal",
        portalDisplaySubName: "Worldwide Excellence",
        portalDisplayPageSubTitle: "Leading the industry",
        portalWindowIcon: null,
        isActive: false,
        createdAt: "2025-05-20T08:45:12.456Z",
        updatedAt: "2025-06-30T16:22:33.789Z",
        customerReports: [],
        customerShops: [],
        customerUsers: [],
        customerWorkspaces: [],
        programs: [],
        reportCategories: []
    }
];
