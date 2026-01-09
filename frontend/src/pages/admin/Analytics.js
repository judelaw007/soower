import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [period, setPeriod] = useState('12');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRevenueAnalytics({ period });
      setAnalytics(response.data.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalRevenue = analytics.reduce((sum, item) => sum + parseFloat(item.revenue), 0);
  const totalTransactions = analytics.reduce((sum, item) => sum + item.transactions, 0);
  const avgMonthlyRevenue = analytics.length > 0 ? totalRevenue / analytics.length : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Revenue Analytics</h1>
          <p>Track your platform's financial performance</p>
        </div>
        <select
          className="input"
          style={{ width: 'auto' }}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
          <option value="24">Last 24 months</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="analytics-stats">
        <div className="stat-card">
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Transactions</p>
          <p className="stat-value">{totalTransactions.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Monthly Revenue</p>
          <p className="stat-value">{formatCurrency(avgMonthlyRevenue)}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card chart-card">
        <h3>Revenue Over Time</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={{ fill: '#4F46E5', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Chart */}
      <div className="card chart-card">
        <h3>Transactions Per Month</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip
                formatter={(value) => [value, 'Transactions']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="transactions" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Monthly Breakdown</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Transactions</th>
                <th>Avg per Transaction</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((item, index) => (
                <tr key={index}>
                  <td>{item.month}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(item.revenue)}</td>
                  <td>{item.transactions}</td>
                  <td>
                    {item.transactions > 0
                      ? formatCurrency(item.revenue / item.transactions)
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
