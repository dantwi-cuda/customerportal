# Customer Portal Docker Setup

## Overview

This Docker setup provides a production-ready containerized deployment of the Customer Portal React application with optimized build and security configurations.

## Docker Configuration

### Multi-Stage Build

-   **Builder Stage**: Uses Node.js 20 Alpine to build the React TypeScript application
-   **Production Stage**: Uses Nginx Alpine for serving the built application

### Features

-   ✅ Production-optimized Nginx configuration
-   ✅ Client-side routing support (React Router)
-   ✅ API proxy configuration for backend services
-   ✅ Security headers and caching strategies
-   ✅ Health check endpoint
-   ✅ Non-root user execution
-   ✅ Gzip compression enabled

## Building and Running

### Build the Docker Image

```bash
docker build -t customer-portal .
```

### Run the Container

```bash
# Basic run
docker run -p 8080:80 customer-portal

# With environment variables and backend network
docker run -p 8080:80 \
  --network app-network \
  --name customer-portal \
  customer-portal
```

### Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
    frontend:
        build: .
        ports:
            - '8080:80'
        depends_on:
            - backend
        networks:
            - app-network
        restart: unless-stopped

    backend:
        image: your-backend-image:latest
        ports:
            - '5211:5211'
        networks:
            - app-network
        restart: unless-stopped

networks:
    app-network:
        driver: bridge
```

Run with Docker Compose:

```bash
docker-compose up -d
```

## Configuration Details

### Nginx Configuration

-   **Port**: 80 (internal), map to desired external port
-   **Root**: `/usr/share/nginx/html`
-   **API Proxy**: Routes `/api/*` requests to `backend:5211`
-   **Health Check**: Available at `/health`

### Security Features

-   Non-root user execution (nginx:nginx)
-   Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
-   Content Security Policy ready

### Performance Optimizations

-   Gzip compression for text assets
-   Static asset caching (1 year for immutable assets)
-   No-cache for HTML files
-   Optimized Docker layers

## Environment Variables

The application can be configured using environment variables:

```bash
# Example environment variables
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_POWERBI_CLIENT_ID=your-powerbi-client-id
```

## Health Monitoring

The container includes a health check that:

-   Runs every 30 seconds
-   Times out after 3 seconds
-   Starts checking after 5 seconds
-   Retries 3 times before marking unhealthy

Check container health:

```bash
docker ps
# Look for health status in the STATUS column
```

## Troubleshooting

### Common Issues

1. **API calls failing**: Ensure backend service is named `backend` in Docker network or update nginx proxy configuration
2. **React Router 404s**: Nginx configuration includes `try_files` directive for client-side routing
3. **Permission issues**: Container runs as non-root user `nginx` for security

### Debug Commands

```bash
# View container logs
docker logs customer-portal

# Execute shell in running container
docker exec -it customer-portal sh

# Check nginx configuration
docker exec customer-portal nginx -t
```

## Production Deployment

### Best Practices

1. Use specific image tags instead of `latest`
2. Implement proper logging aggregation
3. Set up monitoring and alerting
4. Use secrets management for sensitive configuration
5. Implement blue-green or rolling deployments

### Kubernetes Deployment

The container is ready for Kubernetes deployment with:

-   Health checks configured
-   Non-root user execution
-   Resource limits can be applied
-   Horizontal Pod Autoscaling compatible

Example Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: customer-portal
spec:
    replicas: 3
    selector:
        matchLabels:
            app: customer-portal
    template:
        metadata:
            labels:
                app: customer-portal
        spec:
            containers:
                - name: customer-portal
                  image: customer-portal:latest
                  ports:
                      - containerPort: 80
                  livenessProbe:
                      httpGet:
                          path: /health
                          port: 80
                      initialDelaySeconds: 30
                      periodSeconds: 10
                  readinessProbe:
                      httpGet:
                          path: /health
                          port: 80
                      initialDelaySeconds: 5
                      periodSeconds: 5
```
