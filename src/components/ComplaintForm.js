// ============================================
// ComplaintForm.js
// Form to submit new complaints
// Calls POST /api/complaint
// ============================================

import React, { useState } from 'react';
import { submitComplaint } from '../services/api';
import './ComplaintForm.css';

function ComplaintForm() {
    // Form data state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: ''
    });

    // UI states
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            // Call Spring Boot API
            const result = await submitComplaint(formData);
            setSuccess(result);

            // Clear form after success
            setFormData({
                title: '',
                description: '',
                location: ''
            });

        } catch (err) {
            setError('Failed to submit complaint. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-card">
                <h2>📝 Submit a Complaint</h2>
                <p className="form-subtitle">
                    Your complaint will be automatically routed
                    to the right department using AI!
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Title Field */}
                    <div className="form-group">
                        <label>Complaint Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. No water supply in our area"
                            required
                        />
                    </div>

                    {/* Description Field */}
                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your complaint in detail..."
                            rows="5"
                            required
                        />
                    </div>

                    {/* Location Field */}
                    <div className="form-group">
                        <label>Location *</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Hyderabad, Sector 4"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? '🔄 Submitting...' : '🚀 Submit Complaint'}
                    </button>
                </form>

                {/* Success Message */}
                {success && (
                    <div className="success-card">
                        <h3>✅ Complaint Submitted Successfully!</h3>
                        <div className="result-grid">
                            <div className="result-item">
                                <span className="result-label">ID</span>
                                <span className="result-value">
                                    #{success.id}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Department</span>
                                <span className={`badge dept-${success.department}`}>
                                    {success.department}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Priority</span>
                                <span className={`badge priority-${success.priority}`}>
                                    {success.priority}
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">AI Confidence</span>
                                <span className="result-value">
                                    {success.confidence}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="error-card">
                        ❌ {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ComplaintForm;