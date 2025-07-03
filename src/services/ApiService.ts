import AxiosBase from './axios/AxiosBase'
import SwaggerService from './SwaggerService'
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const ApiService = {
    fetchDataWithAxios<Response = unknown, Request = Record<string, unknown>>(
        param: AxiosRequestConfig<Request>,
    ) {
        console.log('[ApiService] Initial param.url received:', param.url); // Added log

        // If the URL doesn't start with http(s), assume it's a relative path
        if (param.url && !param.url.startsWith('http')) {
            const swaggerConfig = SwaggerService.getSwaggerConfig();
            // Ensure swaggerConfig is truthy, otherwise, relative paths might be used as-is or handled by Axios default behavior
            if (swaggerConfig) { 
                let path = param.url;

                // 1. Log path before normalization
                console.log('[ApiService] Path before normalization:', path);

                // 2. Repeatedly remove leading slashes
                while (path.startsWith('/')) {
                    path = path.substring(1);
                }

                // 3. Repeatedly remove 'api/' prefix and any slashes exposed by its removal
                // This loop ensures that 'api/api/foo' becomes 'foo'
                while (path.startsWith('api/')) {
                    path = path.substring(4); // Remove 'api/'
                    while (path.startsWith('/')) { // Remove any leading slashes that were between 'api/' segments
                        path = path.substring(1);
                    }
                }
                // 'path' should now be the base endpoint, e.g., "Auth/login"
                console.log('[ApiService] Path after normalization:', path);

                if (import.meta.env.DEV) {
                    // In DEV, AxiosBase has baseURL='/api'. So, just pass the clean path.
                    param.url = path; 
                } else {
                    // For production, construct the full URL carefully
                    let prodBaseUrl = swaggerConfig.baseUrl || '';
                    if (prodBaseUrl.endsWith('/')) {
                        prodBaseUrl = prodBaseUrl.slice(0, -1);
                    }
                    if (prodBaseUrl.endsWith('/api')) {
                        prodBaseUrl = prodBaseUrl.slice(0, -3);
                    }
                    if (prodBaseUrl.endsWith('/')) {
                        prodBaseUrl = prodBaseUrl.slice(0, -1);
                    }
                    param.url = `${prodBaseUrl}/api/${path}`;
                }
                console.log('[ApiService] Final API Request URL to be used:', param.url, 'Method:', param.method);
            } else {
                console.warn('[ApiService] Swagger config is not available. Using param.url as is for relative path construction if not a full URL:', param.url);
            }
        } else {
            console.log('[ApiService] param.url is absolute or undefined. Using as is:', param.url);
        }

        return new Promise<Response>((resolve, reject) => {
            AxiosBase(param)
                .then((response: AxiosResponse<Response>) => {
                    resolve(response.data)
                })
                .catch((errors: AxiosError) => {
                    // Add error logging
                    console.error(
                        'API Request failed:',
                        errors.message,
                        'URL:',
                        param.url,
                        'Status:',
                        errors.response?.status,
                    )
                    reject(errors)
                })
        })
    },
}

export default ApiService
