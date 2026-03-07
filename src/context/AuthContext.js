// ============================================
// AuthContext.js
// Global authentication state
// Stores: token, username, role
// Available to ALL components!
// ============================================

import React, { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

// Create the context
const AuthContext = createContext(null);

// Provider component wraps entire app
export function AuthProvider({ children }) {

    // Check if token exists in localStorage on startup
    const [auth, setAuth] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 > Date.now()) {
                    return {
                        token,
                        username: decoded.sub,
                        role: decoded.role
                    };
                }
            } catch (e) {
                localStorage.removeItem('token');
            }
        }
        return null;
    });

    // Login function - saves token
    const login = (token, username, role) => {
        localStorage.setItem('token', token);
        setAuth({ token, username, role });
    };

    // Logout function - clears token
    const logout = () => {
        localStorage.removeItem('token');
        setAuth(null);
    };

    // Check if user is admin
    const isAdmin = () => auth?.role === 'ADMIN';

    // Check if user is logged in
    const isLoggedIn = () => auth !== null;

    return (
        <AuthContext.Provider value={{
            auth,
            login,
            logout,
            isAdmin,
            isLoggedIn
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for easy access
export function useAuth() {
    return useContext(AuthContext);
}

export default AuthContext;