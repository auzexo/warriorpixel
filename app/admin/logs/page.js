'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaFileAlt, FaSearch, FaFilter, FaDownload, FaSync, FaUser, FaClock, FaInfoCircle } from 'react-icons/fa';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, actionFilter, dateFilter]);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      alert('Error loading logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target_user_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(log => new Date(log.created_at) >= filterDate);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Action', 'Details', 'Admin ID', 'Target User', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.action,
        `"${log.details?.replace(/"/g, '""') || ''}"`,
        log.admin_id,
        log.target_user_id || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sendToDiscord = async (log) => {
    if (!confirm(`Send this log to Discord?\n\nAction: ${log.action}\nDetails: ${log.details}`)) {
      return;
    }

    try {
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'discord_webhook_logs')
        .single();

      if (!settings?.setting_value) {
        alert('Discord webhook not configured');
        return;
      }

      let severity = 'info';
      const actionLower = log.action.toLowerCase();
      if (actionLower.includes('delete') || actionLower.includes('ban')) severity = 'danger';
      if (actionLower.includes('create')) severity = 'success';
      if (actionLower.includes('distribute') || actionLower.includes('prize')) severity = 'warning';

      const colors = {
        info: 3447003,
        success: 3066993,
        warning: 16776960,
        danger: 15158332
      };

      const embed = {
        title: `${getActionIcon(log.action)} ${log.action}`,
        description: log.details,
        color: colors[severity],
        timestamp: log.created_at,
        fields: [
          {
            name: 'Admin ID',
            value: `\`${log.admin_id?.substring(0, 8)}...\``,
            inline: true
          },
          {
            name: 'IP Address',
            value: log.ip_address || 'N/A',
            inline: true
          }
        ],
        footer: {
          text: 'WarriorPixel Admin Logs'
        }
      };

      const response = await fetch(settings.setting_value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!response.ok) {
        throw new Error('Discord webhook failed');
      }

      alert('✅ Sent to Discord successfully!');
    } catch (error) {
      console.error('Discord error:', error);
      alert('Failed to send to Discord: ' + error.message);
    }
  };

  const getActionColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('create') || actionLower.includes('login')) return 'text-green-400';
    if (actionLower.includes('delete') || actionLower.includes('ban')) return 'text-red-400';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'text-blue-400';
    if (actionLower.includes('distribute') || actionLower.includes('prize')) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getActionIcon = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('create')) return '✨';
    if (actionLower.includes('delete')) return '🗑️';
    if (actionLower.includes('update') || actionLower.includes('edit')) return '✏️';
    if (actionLower.includes('ban')) return '🚫';
    if (actionLower.includes('login')) return '🔐';
    if (actionLower.includes('distribute') || actionLower.includes('prize')) return '💰';
    return '📝';
  };

  const actionTypes = [...new Set(logs.map(log => log.action))].filter(Boolean);

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Admin Logs</h1>
            <p className="text-discord-text">Track all administrative actions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <FaSync />
              Refresh
            </button>
            <button
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <FaDownload />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaFileAlt className="text-2xl text-purple-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Total Logs</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaFilter className="text-2xl text-blue-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Filtered</p>
            <p className="text-2xl font-bold text-white">{filteredLogs.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaUser className="text-2xl text-green-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Actions</p>
            <p className="text-2xl font-bold text-white">{actionTypes.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaClock className="text-2xl text-orange-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Today</p>
            <p className="text-2xl font-bold text-white">
              {logs.filter(log => new Date(log.created_at) > new Date(Date.now() - 86400000)).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaFilter />
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              >
                <option value="all">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl overflow-hidden">
          {currentLogs.length === 0 ? (
            <div className="text-center py-12">
              <FaInfoCircle className="text-5xl text-gray-600 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">No logs found</p>
              <p className="text-discord-text">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {currentLogs.map((log) => (
                <div key={log.id} className="bg-discord-darkest border border-gray-800 rounded-lg p-4 hover:border-purple-600 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getActionIcon(log.action)}</span>
                        <span className={`font-bold text-lg ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                      <p className="text-white mb-2">{log.details}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-discord-text">
                        <span className="flex items-center gap-1">
                          <FaClock className="text-xs" />
                          {new Date(log.created_at).toLocaleString('en-IN')}
                        </span>
                        <span>Admin: {log.admin_id?.substring(0, 8)}...</span>
                        <span>IP: {log.ip_address || 'N/A'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => sendToDiscord(log)}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                    >
                      📢 Discord
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
              <p className="text-sm text-discord-text">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
