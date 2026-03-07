import React from 'react';
import { BrowserRouter, Routes, Route,
         Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ComplaintForm from './components/ComplaintForm';
import ComplaintList from './components/ComplaintList';
import Statistics from './components/Statistics';
import './App.css';

// Protected Route component
function ProtectedRoute({ children, adminOnly = false }) {
    const { isLoggedIn, isAdmin } = useAuth();

    if (!isLoggedIn()) {
        return <Navigate to="/login" />;
    }

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/submit" />;
    }

    return children;
}

function AppRoutes() {
    return (
        <>
            <Navbar />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Default redirect */}
                <Route path="/"
                    element={<Navigate to="/login" />} />

                {/* Protected routes - any logged in user */}
                <Route path="/submit" element={
                    <ProtectedRoute>
                        <ComplaintForm />
                    </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <ComplaintList />
                    </ProtectedRoute>
                } />

                {/* Admin only route */}
                <Route path="/statistics" element={
                    <ProtectedRoute adminOnly={true}>
                        <Statistics />
                    </ProtectedRoute>
                } />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="app">
                    <AppRoutes />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
