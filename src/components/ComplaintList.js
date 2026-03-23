import React, { useState, useEffect } from 'react';
import {
    getAllComplaints,
    updateComplaintStatus,
    reclassifyComplaint,
    deleteComplaint
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ComplaintList.css';

function ComplaintList() {

    // ============================================
    // State Variables
    // ============================================
    const [complaints, setComplaints] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [verifyFilter, setVerifyFilter] = useState('ALL'); // NEW
    const [updatingId, setUpdatingId] = useState(null);
    const [reclassifyingId, setReclassifyingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [expandedPhoto, setExpandedPhoto] = useState(null); // NEW
    const { isAdmin } = useAuth();

    // ============================================
    // Load complaints on page open
    // ============================================
    useEffect(() => {
        fetchComplaints();
    }, []);

    // Apply filters when anything changes
    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [complaints, search, deptFilter, priorityFilter, statusFilter, verifyFilter]);

    // ============================================
    // Fetch Complaints from Spring Boot
    // ============================================
    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const data = await getAllComplaints();
            setComplaints(data.reverse());
        } catch (err) {
            setError('Failed to load complaints.');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // Filter Logic
    // ============================================
    const applyFilters = () => {
        let result = [...complaints];

        if (search) {
            result = result.filter(c =>
                c.title.toLowerCase()
                    .includes(search.toLowerCase()) ||
                c.location.toLowerCase()
                    .includes(search.toLowerCase())
            );
        }

        if (deptFilter !== 'ALL') {
            result = result.filter(
                c => c.department === deptFilter);
        }

        if (priorityFilter !== 'ALL') {
            result = result.filter(
                c => c.priority === priorityFilter);
        }

        if (statusFilter !== 'ALL') {
            result = result.filter(
                c => c.status === statusFilter);
        }

        // NEW — verification filter
        if (verifyFilter !== 'ALL') {
            result = result.filter(
                c => c.verificationStatus === verifyFilter);
        }

        setFiltered(result);
    };

    // ============================================
    // Status Update Handler
    // PENDING → IN_PROGRESS → RESOLVED → PENDING
    // ============================================
    const handleStatusUpdate = async (id, currentStatus) => {
        const nextStatus = {
            'PENDING': 'IN_PROGRESS',
            'IN_PROGRESS': 'RESOLVED',
            'RESOLVED': 'PENDING'
        };

        try {
            setUpdatingId(id);
            const updated = await updateComplaintStatus(
                id, nextStatus[currentStatus]);
            setComplaints(prev =>
                prev.map(c => c.id === id ? updated : c));
        } catch (err) {
            alert('Failed to update status!');
        } finally {
            setUpdatingId(null);
        }
    };

    // ============================================
    // Re-classify Handler
    // Calls ML service again for prediction
    // ============================================
    const handleReclassify = async (id) => {
        try {
            setReclassifyingId(id);
            const updated = await reclassifyComplaint(id);
            setComplaints(prev =>
                prev.map(c => c.id === id ? updated : c));
        } catch (err) {
            alert('Failed to reclassify! Is ML service running?');
        } finally {
            setReclassifyingId(null);
        }
    };

    // ============================================
    // Delete Handler
    // Admin only! Resolved complaints only!
    // ============================================
    const handleDelete = async (id, status) => {
        if (status !== 'RESOLVED') {
            alert(
                '❌ Only RESOLVED complaints can be deleted!\n' +
                'Please mark it as RESOLVED first.'
            );
            return;
        }

        const confirmed = window.confirm(
            '🗑️ Are you sure you want to delete?\n' +
            'This action cannot be undone!'
        );

        if (!confirmed) return;

        try {
            setDeletingId(id);
            await deleteComplaint(id);
            setComplaints(prev =>
                prev.filter(c => c.id !== id));
            alert('✅ Complaint deleted successfully!');
        } catch (err) {
            alert('❌ Failed to delete: ' +
                (err.response?.data?.error
                    || 'Unknown error'));
        } finally {
            setDeletingId(null);
        }
    };

    // ============================================
    // Format date nicely
    // ============================================
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ============================================
    // NEW — Get verification badge
    // ============================================
    const getVerifyBadge = (status) => {
        if (status === 'VERIFIED')
            return <span className="badge verify-VERIFIED">✅ Verified</span>;
        if (status === 'UNVERIFIED')
            return <span className="badge verify-UNVERIFIED">⚠️ Unverified</span>;
        if (status === 'SUSPICIOUS')
            return <span className="badge verify-SUSPICIOUS">🚨 Suspicious</span>;
        return <span className="badge verify-NO_PHOTO">❌ No Photo</span>;
    };

    // ============================================
    // Stats calculations
    // ============================================
    const stats = {
        total: complaints.length,
        high: complaints.filter(
            c => c.priority === 'HIGH').length,
        pending: complaints.filter(
            c => c.status === 'PENDING').length,
        verified: complaints.filter(
            c => c.verificationStatus === 'VERIFIED').length, // UPDATED
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="dashboard-container">

            {/* NEW — Fullscreen Photo Modal */}
            {expandedPhoto && (
                <div
                    className="photo-modal-overlay"
                    onClick={() => setExpandedPhoto(null)}
                >
                    <div className="photo-modal">
                        <img
                            src={expandedPhoto.photo}
                            alt="Evidence"
                            className="photo-modal-img"
                        />
                        <div className="photo-modal-info">
                            <strong>{expandedPhoto.title}</strong>
                            <span>{expandedPhoto.location}</span>
                            {expandedPhoto.photoLatitude && (
                                <span className="gps-coords">
                                    📍 GPS: {expandedPhoto.photoLatitude.toFixed(5)},
                                    {expandedPhoto.photoLongitude.toFixed(5)}
                                    &nbsp;—&nbsp;
                                    <a
                                        href={`https://www.google.com/maps?q=${expandedPhoto.photoLatitude},${expandedPhoto.photoLongitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        View on Google Maps 🗺️
                                    </a>
                                </span>
                            )}
                            <span className="close-hint">
                                Click anywhere to close
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="dashboard-header">
                <h2>Complaints Dashboard</h2>
                <div className="header-actions">
                    <button
                        className="refresh-btn"
                        onClick={fetchComplaints}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Stats Row — UPDATED */}
            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-number">
                        {stats.total}
                    </span>
                    <span className="stat-label">
                        Total Complaints
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {stats.high}
                    </span>
                    <span className="stat-label">
                        High Priority
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {stats.pending}
                    </span>
                    <span className="stat-label">
                        Pending
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {stats.verified}
                    </span>
                    <span className="stat-label">
                        Verified
                    </span>
                </div>
            </div>

            {/* Filters Row — UPDATED with verification filter */}
            <div className="filters-row">

                {/* Search */}
                <input
                    className="search-input"
                    type="text"
                    placeholder="🔍 Search by title or location..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                {/* Department Filter */}
                <select
                    className="filter-select"
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                >
                    <option value="ALL">All Departments</option>
                    <option value="WATER">💧 Water</option>
                    <option value="ELECTRICITY">
                        ⚡ Electricity
                    </option>
                    <option value="ROADS">🛣️ Roads</option>
                    <option value="SANITATION">
                        🗑️ Sanitation
                    </option>
                    <option value="PARKS">🌳 Parks</option>
                    <option value="UNASSIGNED">
                        ❓ Unassigned
                    </option>
                </select>

                {/* Priority Filter */}
                <select
                    className="filter-select"
                    value={priorityFilter}
                    onChange={e =>
                        setPriorityFilter(e.target.value)}
                >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">🔴 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">🟢 Low</option>
                </select>

                {/* Status Filter */}
                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={e =>
                        setStatusFilter(e.target.value)}
                >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">⏳ Pending</option>
                    <option value="IN_PROGRESS">
                        🔄 In Progress
                    </option>
                    <option value="RESOLVED">✅ Resolved</option>
                </select>

                {/* NEW — Verification Filter */}
                <select
                    className="filter-select"
                    value={verifyFilter}
                    onChange={e => setVerifyFilter(e.target.value)}
                >
                    <option value="ALL">All Verifications</option>
                    <option value="VERIFIED">✅ Verified</option>
                    <option value="UNVERIFIED">⚠️ Unverified</option>
                    <option value="NO_PHOTO">❌ No Photo</option>
                </select>
            </div>

            {/* Results count */}
            {!loading && (
                <p className="results-count">
                    Showing {filtered.length} of{' '}
                    {complaints.length} complaints
                </p>
            )}

            {/* Loading */}
            {loading && (
                <div className="loading">
                    🔄 Loading complaints...
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="error-msg">❌ {error}</div>
            )}

            {/* Table — UPDATED with Photo column */}
            {!loading && !error && (
                <div className="table-container">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            📭 No complaints found!
                        </div>
                    ) : (
                        <table className="complaints-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Photo</th> {/* NEW */}
                                    <th>Title</th>
                                    <th>Location</th>
                                    <th>Department</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Verification</th> {/* NEW */}
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(complaint => (
                                    <tr key={complaint.id}>

                                        {/* ID */}
                                        <td className="id-cell">
                                            #{complaint.id}
                                        </td>

                                        {/* NEW — Photo Thumbnail */}
                                        <td>
                                            {complaint.photo ? (
                                                <img
                                                    src={complaint.photo}
                                                    alt="evidence"
                                                    className="complaint-thumb"
                                                    onClick={() =>
                                                        setExpandedPhoto(complaint)}
                                                    title="Click to view full photo"
                                                />
                                            ) : (
                                                <span className="no-photo-badge">
                                                    No photo
                                                </span>
                                            )}
                                        </td>

                                        {/* Title */}
                                        <td className="title-cell">
                                            {complaint.title}
                                        </td>

                                        {/* Location */}
                                        <td>
                                            {complaint.location}
                                        </td>

                                        {/* Department */}
                                        <td>
                                            <span className={
                                                `badge dept-${complaint.department}`
                                            }>
                                                {complaint.department}
                                            </span>
                                        </td>

                                        {/* Priority */}
                                        <td>
                                            {complaint.priority
                                                ? (
                                                <span className={
                                                    `badge priority-${complaint.priority}`
                                                }>
                                                    {complaint.priority}
                                                </span>
                                            ) : (
                                                <span className="badge dept-UNASSIGNED">
                                                    N/A
                                                </span>
                                            )}
                                        </td>

                                        {/* Status - Clickable! */}
                                        <td>
                                            <button
                                                className={`status-btn status-${complaint.status}`}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        complaint.id,
                                                        complaint.status
                                                    )}
                                                disabled={
                                                    updatingId === complaint.id}
                                                title="Click to change status"
                                            >
                                                {updatingId === complaint.id
                                                    ? '...'
                                                    : complaint.status === 'PENDING'
                                                        ? '⏳ PENDING'
                                                        : complaint.status === 'IN_PROGRESS'
                                                            ? '🔄 IN PROGRESS'
                                                            : '✅ RESOLVED'
                                                }
                                            </button>
                                        </td>

                                        {/* NEW — Verification Badge */}
                                        <td>
                                            {getVerifyBadge(complaint.verificationStatus)}
                                        </td>

                                        {/* Date */}
                                        <td className="date-cell">
                                            {formatDate(
                                                complaint.createdAt)}
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="action-buttons">

                                                {/* Re-classify — UNASSIGNED only */}
                                                {(complaint.department
                                                    === 'UNASSIGNED'
                                                    || !complaint.priority
                                                ) && (
                                                    <button
                                                        className="reclassify-btn"
                                                        onClick={() =>
                                                            handleReclassify(
                                                                complaint.id
                                                            )}
                                                        disabled={
                                                            reclassifyingId
                                                            === complaint.id}
                                                    >
                                                        {reclassifyingId
                                                            === complaint.id
                                                            ? '🔄 ...'
                                                            : '🤖 Re-classify'
                                                        }
                                                    </button>
                                                )}

                                                {/* Delete button — Admin + Resolved only */}
                                                {isAdmin() &&
                                                complaint.status
                                                    === 'RESOLVED' && (
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() =>
                                                            handleDelete(
                                                                complaint.id,
                                                                complaint.status
                                                            )}
                                                        disabled={
                                                            deletingId
                                                            === complaint.id}
                                                        title="Delete resolved complaint"
                                                    >
                                                        {deletingId
                                                            === complaint.id
                                                            ? '...'
                                                            : '🗑️ Delete'
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default ComplaintList;