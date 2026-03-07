import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line
} from 'recharts';
import { getAllComplaints } from '../services/api';
import './Statistics.css';

// Color schemes
const DEPT_COLORS = {
    WATER: '#4da6ff',
    ELECTRICITY: '#ffd700',
    ROADS: '#ff9f40',
    SANITATION: '#2ed573',
    PARKS: '#00fa9a',
    UNASSIGNED: '#8892a4'
};

const PRIORITY_COLORS = {
    HIGH: '#ff6b6b',
    MEDIUM: '#ffa500',
    LOW: '#2ed573'
};

const STATUS_COLORS = {
    PENDING: '#8892a4',
    IN_PROGRESS: '#4da6ff',
    RESOLVED: '#2ed573'
};

function Statistics() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getAllComplaints();
            setComplaints(data);
        } catch (err) {
            console.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // Data preparation for charts
    // ============================================

    // Department distribution
    const deptData = Object.entries(
        complaints.reduce((acc, c) => {
            acc[c.department] = (acc[c.department] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    // Priority distribution
    const priorityData = Object.entries(
        complaints.reduce((acc, c) => {
            if (c.priority) {
                acc[c.priority] = (acc[c.priority] || 0) + 1;
            }
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    // Status distribution
    const statusData = Object.entries(
        complaints.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    // Complaints over time (by date)
    const timeData = Object.entries(
        complaints.reduce((acc, c) => {
            const date = new Date(c.createdAt)
                .toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short'
                });
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {})
    ).map(([date, count]) => ({ date, count }));

    // Department vs Priority breakdown
    const deptPriorityData = ['WATER', 'ELECTRICITY', 'ROADS',
                               'SANITATION', 'PARKS'].map(dept => ({
        dept,
        HIGH: complaints.filter(c =>
            c.department === dept && c.priority === 'HIGH').length,
        MEDIUM: complaints.filter(c =>
            c.department === dept && c.priority === 'MEDIUM').length,
        LOW: complaints.filter(c =>
            c.department === dept && c.priority === 'LOW').length,
    }));

    // Summary stats
    const stats = {
        total: complaints.length,
        resolved: complaints.filter(c => c.status === 'RESOLVED').length,
        avgConfidence: complaints.length > 0
            ? Math.round(
                complaints
                    .filter(c => c.confidence && c.confidence !== '0%')
                    .reduce((sum, c) =>
                        sum + parseFloat(c.confidence), 0) /
                complaints.filter(c =>
                    c.confidence && c.confidence !== '0%').length
              )
            : 0,
        resolutionRate: complaints.length > 0
            ? Math.round(
                complaints.filter(c =>
                    c.status === 'RESOLVED').length /
                complaints.length * 100
              )
            : 0
    };

    if (loading) {
        return (
            <div className="stats-container">
                <div className="loading">🔄 Loading statistics...</div>
            </div>
        );
    }

    return (
        <div className="stats-container">

            {/* Header */}
            <div className="stats-header">
                <h2>Statistics Overview</h2>
                <p className="stats-subtitle">
                    Real-time analytics for all complaints
                </p>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-icon">📋</div>
                    <div className="summary-info">
                        <span className="summary-number">
                            {stats.total}
                        </span>
                        <span className="summary-label">
                            Total Complaints
                        </span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">✅</div>
                    <div className="summary-info">
                        <span className="summary-number">
                            {stats.resolved}
                        </span>
                        <span className="summary-label">
                            Resolved
                        </span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">🎯</div>
                    <div className="summary-info">
                        <span className="summary-number">
                            {stats.avgConfidence}%
                        </span>
                        <span className="summary-label">
                            Avg AI Confidence
                        </span>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-icon">📈</div>
                    <div className="summary-info">
                        <span className="summary-number">
                            {stats.resolutionRate}%
                        </span>
                        <span className="summary-label">
                            Resolution Rate
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">

                {/* Chart 1: Department Pie Chart */}
                <div className="chart-card">
                    <h3>Complaints by Department</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={deptData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                dataKey="value"
                                label={({name, value}) =>
                                    `${name}: ${value}`}
                                labelLine={true}
                            >
                                {deptData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={DEPT_COLORS[entry.name]
                                            || '#8892a4'}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid #2a2a4a',
                                    borderRadius: '8px',
                                    color: '#e2e8f0'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 2: Priority Pie Chart */}
                <div className="chart-card">
                    <h3>Complaints by Priority</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={priorityData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                label={({name, value}) =>
                                    `${name}: ${value}`}
                            >
                                {priorityData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={PRIORITY_COLORS[entry.name]
                                            || '#8892a4'}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid #2a2a4a',
                                    borderRadius: '8px',
                                    color: '#e2e8f0'
                                }}
                            />
                            <Legend
                                formatter={(value) => (
                                    <span style={{color: '#a8b2d8'}}>
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 3: Status Bar Chart */}
                <div className="chart-card">
                    <h3>Complaints by Status</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={statusData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#2a2a4a"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{fill: '#8892a4', fontSize: 12}}
                            />
                            <YAxis
                                tick={{fill: '#8892a4', fontSize: 12}}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid #2a2a4a',
                                    borderRadius: '8px',
                                    color: '#e2e8f0'
                                }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {statusData.map((entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={STATUS_COLORS[entry.name]
                                            || '#8892a4'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 4: Complaints Over Time */}
                <div className="chart-card">
                    <h3>Complaints Over Time</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={timeData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#2a2a4a"
                            />
                            <XAxis
                                dataKey="date"
                                tick={{fill: '#8892a4', fontSize: 11}}
                            />
                            <YAxis
                                tick={{fill: '#8892a4', fontSize: 12}}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid #2a2a4a',
                                    borderRadius: '8px',
                                    color: '#e2e8f0'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#e94560"
                                strokeWidth={3}
                                dot={{
                                    fill: '#e94560',
                                    strokeWidth: 2,
                                    r: 5
                                }}
                                activeDot={{r: 7}}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 5: Department vs Priority (Full Width) */}
                <div className="chart-card chart-full">
                    <h3>Department vs Priority Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={deptPriorityData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#2a2a4a"
                            />
                            <XAxis
                                dataKey="dept"
                                tick={{fill: '#8892a4', fontSize: 12}}
                            />
                            <YAxis
                                tick={{fill: '#8892a4', fontSize: 12}}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid #2a2a4a',
                                    borderRadius: '8px',
                                    color: '#e2e8f0'
                                }}
                            />
                            <Legend
                                formatter={(value) => (
                                    <span style={{color: '#a8b2d8'}}>
                                        {value}
                                    </span>
                                )}
                            />
                            <Bar
                                dataKey="HIGH"
                                fill="#ff6b6b"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="MEDIUM"
                                fill="#ffa500"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="LOW"
                                fill="#2ed573"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default Statistics;