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
    const [updatingId, setUpdatingId] = useState(null);
    const [reclassifyingId, setReclassifyingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
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
    }, [complaints, search, deptFilter,
        priorityFilter, statusFilter]);

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
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
        resolved: complaints.filter(
            c => c.status === 'RESOLVED').length,
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="dashboard-container">

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

            {/* Stats Row */}
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
                        {stats.resolved}
                    </span>
                    <span className="stat-label">
                        Resolved
                    </span>
                </div>
            </div>

            {/* Filters Row */}
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

            {/* Table */}
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
                                    <th>Title</th>
                                    <th>Location</th>
                                    <th>Department</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Confidence</th>
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

                                        {/* Confidence */}
                                        <td>
                                            {complaint.confidence
                                                || 'N/A'}
                                        </td>

                                        {/* Date */}
                                        <td className="date-cell">
                                            {formatDate(
                                                complaint.createdAt)}
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="action-buttons">

                                                {/* Re-classify
                                                    UNASSIGNED only */}
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

                                                {/* Delete button
                                                    Admin + Resolved only */}
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
