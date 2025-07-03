export interface Permission {
    id: string; // e.g., "user:create", "billing:read"
    name: string; // e.g., "Create Users", "View Billing"
    description?: string;
    category?: string; // e.g., "User Management", "Billing"
}
