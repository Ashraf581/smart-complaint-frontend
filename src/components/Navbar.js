import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { auth, logout, isAdmin } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Don't show navbar on login/register pages
    if (location.pathname === '/login' ||
        location.pathname === '/register') {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                🏛️ <span>Smart Complaint System</span>
            </div>
            <div className="navbar-links">
                {/* Citizen + Admin can submit */}
                <Link
                    to="/submit"
                    className={location.pathname === '/submit'
                        ? 'active' : ''}
                >
                    📝 Submit
                </Link>

                {/* Everyone can see complaints */}
                <Link
                    to="/dashboard"
                    className={location.pathname === '/dashboard'
                        ? 'active' : ''}
                >
                    📊 Dashboard
                </Link>

                {/* Only Admin can see statistics */}
                {isAdmin() && (
                    <Link
                        to="/statistics"
                        className={location.pathname === '/statistics'
                            ? 'active' : ''}
                    >
                        📈 Statistics
                    </Link>
                )}

                {/* User info + Logout */}
                {auth && (
                    <div className="navbar-user">
                        <span className="user-info">
                            {auth.role === 'ADMIN' ? '👨‍💼' : '👤'}
                            {auth.username}
                        </span>
                        <button
                            className="logout-btn"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;