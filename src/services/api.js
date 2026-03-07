// ============================================
// api.js
// All HTTP calls to Spring Boot backend
// Automatically adds JWT token to requests!
// ============================================

import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// ============================================
// Request Interceptor
// Automatically adds token to EVERY request!
// ============================================
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ============================================
// Response Interceptor
// If token expired → redirect to login
// ============================================
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const registerUser = async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
};

export const loginUser = async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
};

// Complaint APIs
export const submitComplaint = async (complaintData) => {
    const response = await api.post('/complaint', complaintData);
    return response.data;
};

export const getAllComplaints = async () => {
    const response = await api.get('/complaints');
    return response.data;
};

export const updateComplaintStatus = async (id, status) => {
    const response = await api.put(
        `/complaint/${id}/status`, { status });
    return response.data;
};

export const reclassifyComplaint = async (id) => {
    const response = await api.put(`/complaint/${id}/reclassify`);
    return response.data;
};

// Delete complaint (Admin only, Resolved only)
export const deleteComplaint = async (id) => {
    const response = await api.delete(`/complaint/${id}`);
    return response.data;
};

export default api;