import { Permission } from '@/@types/permission';
import ApiService from './ApiService';

const PermissionService = {
    async getPermissions(): Promise<Permission[]> {
        return ApiService.fetchDataWithAxios<Permission[]>({
            url: '/api/Permission',
            method: 'get',
        });
    },
};

export default PermissionService;
