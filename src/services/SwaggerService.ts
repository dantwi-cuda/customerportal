import axios from 'axios'
import appConfig from '@/configs/app.config'

interface SwaggerConfig {
  spec: any;
  baseUrl: string;
}

class SwaggerService {
  private static instance: SwaggerService
  private swaggerConfig: SwaggerConfig | null = null

  private constructor() {}

  public static getInstance(): SwaggerService {
    if (!SwaggerService.instance) {
      SwaggerService.instance = new SwaggerService()
    }
    return SwaggerService.instance
  }

  /**
   * Initializes the Swagger configuration by fetching the spec from the specified URL
   * and setting the base URL to the local development environment
   */
  public async initializeSwagger(): Promise<SwaggerConfig> {
    if (this.swaggerConfig) {
      return this.swaggerConfig
    }

    try {
      // Use the proxied URL in development to avoid CORS issues
      // In development, the request will go through Vite's proxy
      const swaggerUrl = import.meta.env.DEV 
        ? '/swagger/v1/swagger.json' 
        : `${appConfig.apiPrefix.replace('/api', '')}/swagger/v1/swagger.json`;
      
      console.log('Fetching Swagger spec from:', swaggerUrl);
      const response = await axios.get(swaggerUrl);
      const swaggerSpec = response.data;

      // In dev mode, use an empty string to avoid double '/api' prefixing
      // This is because the paths in endpoint.config already include '/Auth/login' etc.
      // and Vite is proxying '/api' to the backend
      const baseUrl = import.meta.env.DEV ? '' : appConfig.apiPrefix.replace(/\/api$/, '');

      // Override the servers configuration
      if (swaggerSpec.servers) {
        swaggerSpec.servers = [
          {
            url: baseUrl,
            description: import.meta.env.DEV ? 'Development Server (Proxied)' : 'Direct Server'
          }
        ]
      }

      this.swaggerConfig = {
        spec: swaggerSpec,
        baseUrl: baseUrl
      }

      console.log('Swagger configuration initialized successfully:', this.swaggerConfig.baseUrl);
      return this.swaggerConfig
    } catch (error) {
      console.error('Failed to initialize Swagger configuration:', error)
      
      // Try to fallback to the local swagger.json file if available
      try {
        // For development/testing, fallback to the local swagger.json file
        console.log('Falling back to local swagger.json file');
        const response = await axios.get('/swagger.json');
        const swaggerSpec = response.data;
        
        // Use the same baseUrl logic as the primary method
        const baseUrl = import.meta.env.DEV ? '' : appConfig.apiPrefix.replace(/\/api$/, '');
        
        this.swaggerConfig = {
          spec: swaggerSpec,
          baseUrl: baseUrl
        }
        
        console.log('Initialized with local swagger.json file');
        return this.swaggerConfig;
      } catch (fallbackError) {
        console.error('Fallback to local swagger.json also failed:', fallbackError);
        
        // Set a default configuration to prevent app from breaking
        const baseUrl = import.meta.env.DEV ? '' : appConfig.apiPrefix.replace(/\/api$/, '');
        this.swaggerConfig = {
          spec: {},
          baseUrl: baseUrl
        }
        return this.swaggerConfig
      }
    }
  }

  /**
   * Returns the Swagger configuration if already initialized
   */
  public getSwaggerConfig(): SwaggerConfig | null {
    // If config is not initialized yet, return a default consistent with our initialization logic
    if (!this.swaggerConfig) {
      // In development mode, use an empty string to avoid double '/api' prefixing
      // In production, use the URL without the '/api' suffix
      const baseUrl = import.meta.env.DEV ? '' : appConfig.apiPrefix.replace(/\/api$/, '');
      return {
        spec: {},
        baseUrl: baseUrl
      };
    }
    return this.swaggerConfig
  }

  /**
   * Builds a fully qualified API URL
   */
  public buildApiUrl(path: string): string {
    // Remove leading slash if present
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path
    
    // In development mode, we need to prefix with '/api' manually
    // In production, we use the baseUrl from appConfig without the '/api' suffix
    const baseUrl = import.meta.env.DEV ? '/api' : appConfig.apiPrefix.replace(/\/api$/, '');
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    return `${normalizedBaseUrl}/${normalizedPath}`
  }
}

export default SwaggerService.getInstance()