import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'CITIZEN'       // Always CITIZEN, hidden from user!
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Check passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match!');
            setLoading(false);
            return;
        }

        // Check password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters!');
            setLoading(false);
            return;
        }

        try {
            // Send without confirmPassword field
            const { confirmPassword, ...dataToSend } = formData;
            const response = await registerUser(dataToSend);
            login(response.token,
                  response.username,
                  response.role);

            // Citizens always go to submit page
            navigate('/submit');

        } catch (err) {
            setError(err.response?.data?.error
                || 'Registration failed!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                <div className="auth-logo">🏛️</div>

                <h2>Create Account</h2>
                <p className="auth-subtitle">
                    Join Smart Complaint System as a Citizen
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="auth-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            required
                        />
                    </div>

                    <div className="auth-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="auth-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min 6 characters"
                            required
                        />
                    </div>

                    <div className="auth-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error">
                            ❌ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading
                            ? '🔄 Creating account...'
                            : '🚀 Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login">Sign in here</Link>
                </p>

            </div>
        </div>
    );
}

export default Register;