// filepath: c:\work\customerportal\src\services\WorkspaceService.ts
import ApiService from './ApiService'
import { 
    WorkspaceDto, 
    CreateWorkspaceDto, 
    UpdateWorkspaceDto, 
    // AssignWorkspacesToCustomersDto, // This DTO might be deprecated if we switch to single assignments
    // UnassignWorkspacesFromCustomersDto, // This DTO might be deprecated
    WorkspaceCustomerAssignment,
    UpdateTenantWorkspaceNameDto,
    UpdateCustomerWorkspaceNameAndStatusDto
} from '@/@types/workspace'

const WorkspaceService = {
    // Workspace CRUD operations
    async getWorkspaces(params?: { customerId?: string }): Promise<WorkspaceDto[]> {
        return ApiService.fetchDataWithAxios<WorkspaceDto[]>({ 
            url: '/api/workspace', 
            method: 'get',
            params
        })
    },

    async getWorkspace(workspaceId: string): Promise<WorkspaceDto> {
        return ApiService.fetchDataWithAxios<WorkspaceDto>({
            url: `/api/workspace/${workspaceId}`,
            method: 'get',
        })
    },

    async createWorkspace(data: CreateWorkspaceDto): Promise<WorkspaceDto> {
        return ApiService.fetchDataWithAxios<WorkspaceDto>({
            url: '/api/workspace', 
            method: 'post',
            data: data as any, // Cast to any
        })
    },

    async updateWorkspace(workspaceId: string, data: UpdateWorkspaceDto): Promise<WorkspaceDto> {
        return ApiService.fetchDataWithAxios<WorkspaceDto>({
            url: `/api/workspace/${workspaceId}`,
            method: 'put',
            data: data as any, // Cast to any
        })
    },

    async deleteWorkspace(workspaceId: string): Promise<void> {
        return ApiService.fetchDataWithAxios<void>({
            url: `/api/workspace/${workspaceId}`,
            method: 'delete',
        })
    },

    // Workspace to Customer/Tenant assignment operations
    async getAssignedCustomersForWorkspace(workspaceId: string): Promise<WorkspaceCustomerAssignment[]> {
        return ApiService.fetchDataWithAxios<WorkspaceCustomerAssignment[]>({
            url: `/api/workspace/${workspaceId}/customers`,
            method: 'get',
        })
    },

    async getAssignedWorkspacesForCustomer(customerId: string): Promise<WorkspaceCustomerAssignment[]> {
        return ApiService.fetchDataWithAxios<WorkspaceCustomerAssignment[]>({
            url: `/api/customers/${customerId}/workspaces`,
            method: 'get',
        })
    },
    
    async getAllWorkspaceCustomerAssignments(): Promise<WorkspaceCustomerAssignment[]> {
        return ApiService.fetchDataWithAxios<WorkspaceCustomerAssignment[]>({
            url: '/api/workspace/assignments', // Corrected endpoint
            method: 'get',
        });
    },

    // async assignWorkspacesToCustomers(data: AssignWorkspacesToCustomersDto): Promise<void> {
    //     // This method might be deprecated or changed based on new single assignment endpoint
    //     return ApiService.fetchDataWithAxios<void>({
    //         url: '/api/workspace/assign-to-customers', 
    //         method: 'post',
    //         data: data as any, // Cast to any
    //     })
    // },

    async assignWorkspaceToCustomer(workspaceId: string, customerId: string, nameData: UpdateTenantWorkspaceNameDto): Promise<void> {
        return ApiService.fetchDataWithAxios<void>({
            url: `/api/workspace/${workspaceId}/customers/${customerId}`,
            method: 'post',
            data: nameData as any, // Cast to any
        });
    },

    async assignWorkspaceToMultipleCustomers(workspaceId: string, customerIds: string[], customWorkspaceNameForAll: string | null): Promise<void> {
        return ApiService.fetchDataWithAxios<void>({
            url: `/api/Workspace/${workspaceId}/customers`,
            method: 'post',
            data: { 
                customerIds: customerIds.map(id => parseInt(id, 10)), // Ensure customerIds are numbers
                customWorkspaceNameForAll 
            } as any, // Cast to any for now, consider creating a specific DTO type if not already defined
        });
    },

    // async unassignWorkspacesFromCustomers(data: UnassignWorkspacesFromCustomersDto): Promise<void> {
    //     // This method might be deprecated or changed based on new single unassignment endpoint
    //     return ApiService.fetchDataWithAxios<void>({
    //         url: '/api/workspace/unassign-from-customers', 
    //         method: 'post',
    //         data: data as any, // Cast to any
    //     })    // },
    
    async unassignWorkspaceFromCustomer(workspaceId: string, customerId: string): Promise<void> {
        return ApiService.fetchDataWithAxios<void>({
            url: `/api/workspace/${workspaceId}/customers/${customerId}`,
            method: 'delete',
        });
    },

    // Update workspace name and active status for a specific customer
    async updateWorkspaceNameAndStatus(workspaceId: string, customerId: string, data: UpdateCustomerWorkspaceNameAndStatusDto): Promise<void> {
        return ApiService.fetchDataWithAxios<void>({
            url: `/api/workspace/${workspaceId}/customers/${customerId}/nameandstatus`,
            method: 'put',
            data: data as any,
        });
    },

    // Get active workspaces for tenant
    async getActiveWorkspaces(): Promise<WorkspaceDto[]> {
        return ApiService.fetchDataWithAxios<WorkspaceDto[]>({ 
            url: '/api/workspace', 
            method: 'get',
            params: { isActive: true }
        });
    },

    // Workspace Role assignment methods
    async assignRoleToWorkspace(workspaceId: string, roleId: string): Promise<void> {
        return ApiService.fetchDataWithAxios<void>({
            url: `/api/workspace/${workspaceId}/roles/${roleId}`,
            method: 'post',
        });
    },

    async removeRoleFromWorkspace(workspaceId: string, roleId: string): Promise<void> {
        return ApiService.fetchDataWithAxios<void>({
            url: `/api/workspace/${workspaceId}/roles/${roleId}`,
            method: 'delete',
        });
    },

    async checkRoleWorkspaceAssignment(workspaceId: string, roleId: string): Promise<boolean> {
        return ApiService.fetchDataWithAxios<boolean>({
            url: `/api/workspace/${workspaceId}/roles/${roleId}`,
            method: 'get',
        });
    },

    async getWorkspaceRoles(workspaceId: string): Promise<string[]> {
        return ApiService.fetchDataWithAxios<string[]>({
            url: `/api/workspace/${workspaceId}/roles`,
            method: 'get',
        });
    },

    async getWorkspacesByRole(roleId: string): Promise<WorkspaceDto[]> {
        return ApiService.fetchDataWithAxios<WorkspaceDto[]>({
            url: `/api/workspace/roles/${roleId}/workspaces`,
            method: 'get',
        });
    },

    // Use for tracking assignments and active status
    async getWorkspaceAssignments(params?: { isActive?: boolean }): Promise<WorkspaceCustomerAssignment[]> {
        return ApiService.fetchDataWithAxios<WorkspaceCustomerAssignment[]>({
            url: '/api/workspace/assignments',
            method: 'get',
            params
        });
    }
}

export default WorkspaceService
