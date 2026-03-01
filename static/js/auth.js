/**
 * Authentication Helper - JWT Token Management
 * Manages authentication state and API requests with auth headers
 */

const Auth = {
    /**
     * Get the authentication token from localStorage
     * @returns {string|null} The JWT token or null
     */
    getToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Get the current user object from localStorage
     * @returns {object|null} The user object or null
     */
    getUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Failed to parse user object:', e);
            return null;
        }
    },

    /**
     * Set authentication token and user in localStorage
     * @param {string} token - JWT token
     * @param {object} user - User object
     */
    setAuth(token, user) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Clear authentication data from localStorage
     */
    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Get headers for authenticated API requests
     * @returns {object} Headers object with Authorization
     */
    getAuthHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },

    /**
     * Make an authenticated fetch request
     * @param {string} url - API endpoint URL
     * @param {object} options - Fetch options (method, body, etc.)
     * @returns {Promise<Response>} Fetch response
     */
    async authenticatedFetch(url, options = {}) {
        const token = this.getToken();
        
        // Merge default headers with provided options
        const fetchOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': options.headers?.['Content-Type'] || 'application/json'
            }
        };

        // Add authorization header if token exists
        if (token) {
            fetchOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, fetchOptions);
            
            // Handle 401 Unauthorized - redirect to login
            if (response.status === 401) {
                console.warn('Authentication failed - redirecting to login');
                this.clearAuth();
                window.location.href = '/login';
                return response; // Return so caller can handle
            }
            
            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    },

    /**
     * Logout user - clear auth and redirect to login
     */
    async logout() {
        const token = this.getToken();
        
        // Call logout endpoint
        if (token) {
            try {
                await this.authenticatedFetch('/api/auth/logout', {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Logout API call failed:', error);
            }
        }
        
        // Clear local storage
        this.clearAuth();
        
        // Redirect to login
        window.location.href = '/login';
    },

    /**
     * Check authentication on page load
     * Redirects to login if not authenticated (except for public pages)
     */
    checkAuth() {
        // List of public pages that don't require authentication
        const publicPages = ['/login', '/login.html', '/static/login.html'];
        const currentPath = window.location.pathname;
        
        // Check if current page is public
        const isPublicPage = publicPages.some(page => 
            currentPath.endsWith(page)
        );
        
        // If not authenticated and not on a public page, redirect to login
        if (!this.isAuthenticated() && !isPublicPage) {
            console.log('User not authenticated - redirecting to login');
            window.location.href = '/login';
        }
    },

    /**
     * Get user role
     * @returns {string|null} User role (admin, accountant, user) or null
     */
    getRole() {
        const user = this.getUser();
        return user?.role || null;
    },

    /**
     * Check if user has admin role
     * @returns {boolean} True if user is admin
     */
    isAdmin() {
        return this.getRole() === 'admin';
    },

    /**
     * Check if user has accountant role
     * @returns {boolean} True if user is accountant or admin
     */
    isAccountant() {
        const role = this.getRole();
        return role === 'accountant' || role === 'admin';
    }
};

// Make Auth globally available
window.Auth = Auth;

// Auto-check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    Auth.checkAuth();
});
