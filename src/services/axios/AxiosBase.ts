import axios from 'axios'
import AxiosResponseIntrceptorErrorCallback from './AxiosResponseIntrceptorErrorCallback'
import AxiosRequestIntrceptorConfigCallback from './AxiosRequestIntrceptorConfigCallback'
import appConfig from '@/configs/app.config'
import SwaggerService from '../SwaggerService'
import type { AxiosError } from 'axios'

// In development mode, use relative /api path to leverage Vite's proxy
// In production, use the full URL from appConfig.apiPrefix
const baseURL = import.meta.env.DEV ? '/api' : appConfig.apiPrefix

const AxiosBase = axios.create({
    timeout: 60000,
    baseURL,
    withCredentials: true, // include cookies/credentials in cross-site requests
})

// Initialize Swagger in both development and production
SwaggerService.initializeSwagger()
  .then(() => console.log('Swagger configuration initialized successfully'))
  .catch(error => console.error('Failed to initialize Swagger configuration:', error))

AxiosBase.interceptors.request.use(
    (config) => {
        return AxiosRequestIntrceptorConfigCallback(config)
    },
    (error) => {
        return Promise.reject(error)
    },
)

AxiosBase.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        AxiosResponseIntrceptorErrorCallback(error)
        return Promise.reject(error)
    },
)

export default AxiosBase
