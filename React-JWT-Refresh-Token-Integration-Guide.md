# React Integration Guide: JWT Refresh Token Implementation

## Overview
This guide helps React developers integrate the new JWT refresh token system to prevent automatic logouts due to token expiration. The implementation ensures seamless user experience with automatic token renewal.

## 🔄 API Changes

### Updated Login Endpoint
**Endpoint:** `POST /api/auth/login`

**Request:** (No changes)
```javascript
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** (Enhanced with refresh token)
```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "YWJjZGVmZ2hpams1NzY4...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    // ... other user properties
  }
}
```

### New Refresh Token Endpoint
**Endpoint:** `POST /api/auth/refresh`

**Request:**
```javascript
{
  "token": "current-jwt-token",           // Current JWT (can be expired)
  "refreshToken": "current-refresh-token" // Current refresh token
}
```

**Success Response:** `200 OK`
```javascript
{
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token",  // New refresh token (old one is revoked)
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    // ... other user properties
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid token format, expired refresh token, or revoked token
- `500 Internal Server Error` - Server error during refresh

## 🛠️ React Implementation

### 1. Update Token Storage (localStorage/sessionStorage)

```javascript
// utils/tokenStorage.js
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  hasValidTokens: () => {
    return !!(tokenStorage.getAccessToken() && tokenStorage.getRefreshToken());
  }
};
```

### 2. Enhanced Authentication Service

```javascript
// services/authService.js
import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:7241';

export const authService = {
  // Updated login method
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Store both tokens
      tokenStorage.setTokens(token, refreshToken);
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  },

  // New refresh token method
  async refreshToken() {
    try {
      const currentToken = tokenStorage.getAccessToken();
      const currentRefreshToken = tokenStorage.getRefreshToken();
      
      if (!currentToken || !currentRefreshToken) {
        throw new Error('No tokens available');
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        token: currentToken,
        refreshToken: currentRefreshToken
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Store new tokens
      tokenStorage.setTokens(token, refreshToken);
      
      // Update default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens();
      delete axios.defaults.headers.common['Authorization'];
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Token refresh failed' 
      };
    }
  },

  logout() {
    tokenStorage.clearTokens();
    delete axios.defaults.headers.common['Authorization'];
  },

  // Initialize auth state on app startup
  initializeAuth() {
    const token = tokenStorage.getAccessToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};
```

### 3. Axios Interceptor for Automatic Token Refresh

```javascript
// utils/axiosConfig.js
import axios from 'axios';
import { authService } from '../services/authService';
import { tokenStorage } from './tokenStorage';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResult = await authService.refreshToken();
        
        if (refreshResult.success) {
          const newToken = tokenStorage.getAccessToken();
          processQueue(null, newToken);
          
          // Retry original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        } else {
          // Refresh failed, redirect to login
          processQueue(new Error('Token refresh failed'), null);
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
```

### 4. JWT Token Utility Functions

```javascript
// utils/jwtUtils.js
export const jwtUtils = {
  // Decode JWT payload without verification
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired(token) {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  },

  // Check if token expires within specified minutes
  isTokenExpiringSoon(token, bufferMinutes = 5) {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Date.now() / 1000;
    const bufferTime = bufferMinutes * 60;
    return payload.exp < (currentTime + bufferTime);
  },

  // Get token expiration time
  getTokenExpiration(token) {
    const payload = this.decodeToken(token);
    return payload?.exp ? new Date(payload.exp * 1000) : null;
  }
};
```

### 5. React Hook for Authentication State

```javascript
// hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../utils/tokenStorage';
import { jwtUtils } from '../utils/jwtUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (token && refreshToken) {
          // Check if token is expired or expiring soon
          if (jwtUtils.isTokenExpiringSoon(token)) {
            // Try to refresh token
            const refreshResult = await authService.refreshToken();
            if (refreshResult.success) {
              setUser(refreshResult.user);
              setIsAuthenticated(true);
            } else {
              // Refresh failed, clear state
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // Token is still valid, initialize auth
            authService.initializeAuth();
            // You might want to fetch user data here
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Proactive token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const token = tokenStorage.getAccessToken();
      if (token && jwtUtils.isTokenExpiringSoon(token, 5)) {
        await authService.refreshToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 6. Protected Route Component

```javascript
// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
```

### 7. Updated Login Component

```javascript
// components/Login.js
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard'); // Redirect to main app
    } else {
      setError(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default Login;
```

### 8. App.js Integration

```javascript
// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './utils/axiosConfig'; // Initialize axios interceptors

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

## 🔧 Migration Steps

### Step 1: Update Dependencies
Ensure you have these dependencies:
```bash
npm install axios react-router-dom
```

### Step 2: Update Environment Variables
```env
# .env
REACT_APP_API_URL=https://localhost:7241
```

### Step 3: Replace Existing Auth Logic
1. Replace your existing auth service with the enhanced version above
2. Update login components to handle the new response format
3. Add the axios interceptor configuration
4. Wrap your app with the `AuthProvider`

### Step 4: Test the Implementation
1. Login and verify tokens are stored
2. Make API calls and verify automatic refresh works
3. Test token expiration scenarios
4. Verify logout clears tokens properly

## 🛡️ Security Considerations

### Token Storage
- **Production**: Consider using `httpOnly` cookies instead of localStorage for enhanced security
- **Development**: localStorage is acceptable for development/testing

### HTTPS Requirement
- Always use HTTPS in production to protect tokens in transit
- Refresh tokens should never be sent over unencrypted connections

### Error Handling
- Never log actual token values
- Implement proper error boundaries for auth failures
- Clear sensitive data on logout

## 🚀 Benefits

✅ **Seamless UX**: Users stay logged in automatically  
✅ **Security**: Token rotation prevents replay attacks  
✅ **Reliability**: Handles network failures gracefully  
✅ **Maintenance**: Clean separation of concerns  
✅ **Scalable**: Works with any React architecture  

## 📝 Testing Checklist

- [ ] Login returns both access and refresh tokens
- [ ] Tokens are stored and retrieved correctly
- [ ] Automatic refresh works on 401 responses
- [ ] Proactive refresh prevents token expiration
- [ ] Logout clears all tokens
- [ ] Protected routes redirect unauthenticated users
- [ ] Error handling works for network failures
- [ ] Multiple concurrent requests handle refresh correctly

Your React application will now handle JWT refresh tokens automatically, preventing unwanted logouts and providing a seamless user experience! 🎉
