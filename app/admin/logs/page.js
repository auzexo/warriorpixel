'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { FaHistory, FaSync, FaDownload } from 'react-icons/fa';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading logs:', error);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    try {
      const csv = [
        'Timestamp,Action,Details,Admin ID,IP Address',
        ...logs.map(log => {
          const timestamp = log.created_at ? new Date(log.created_at).toISOString() : '';
          const action = (log.action || '').replace(/,/g, ' ');
          const details = (log.details || '').replace(/,/g, ' ').replace(/"/g, '');
          const adminId = log.admin_id || '';
          const ip = log.ip_address || 'N/A';
          return `${timestamp},${action},${details},${adminId},${ip}`;
        })
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      alert('✅ Logs exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Error exporting logs');
    }
  };

  if (!mounted || loading) {
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
            <h1 className="text-3xl font-bold text-white mb-2">Admin Logs</h1>
            <p className="text-discord-text">View all admin actions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <FaSync />
              Refresh
            </button>
            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <FaDownload />
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaHistory className="text-2xl text-purple-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Total Logs</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-discord-text mb-1">Last 24h</p>
            <p className="text-2xl font-bold text-white">
              {logs.filter(log => {
                try {
                  return new Date(log.created_at) > new Date(Date.now() - 86400000);
                } catch {
                  return false;
                }
              }).length}
            </p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-discord-text mb-1">Actions</p>
            <p className="text-2xl font-bold text-white">
              {[...new Set(logs.map(l => l.action).filter(Boolean))].length}
            </p>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-discord-dark rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          </div>

          <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <FaHistory className="text-6xl text-gray-600 mx-auto mb-4" />
                <p className="text-white font-semibold mb-2">No logs found</p>
                <p className="text-discord-text">Admin actions will appear here</p>
              </div>
            ) : (
              logs.map((log) => {
                const actionColor = (() => {
                  const action = (log.action || '').toLowerCase();
                  if (action.includes('delete') || action.includes('ban')) return 'text-red-400';
                  if (action.includes('create') || action.includes('login')) return 'text-green-400';
                  if (action.includes('edit') || action.includes('update')) return 'text-yellow-400';
                  if (action.includes('prize') || action.includes('distribute')) return 'text-blue-400';
                  return 'text-purple-400';
                })();

                const actionIcon = (() => {
                  const action = (log.action || '').toLowerCase();
                  if (action.includes('create')) return '✨';
                  if (action.includes('delete')) return '🗑️';
                  if (action.includes('edit') || action.includes('update')) return '✏️';
                  if (action.includes('ban')) return '🚫';
                  if (action.includes('login')) return '🔐';
                  if (action.includes('prize') || action.includes('distribute')) return '💰';
                  return '📝';
                })();

                return (
                  <div key={log.id} className="p-4 hover:bg-gray-800">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{actionIcon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <h3 className={`font-bold ${actionColor}`}>
                            {log.action || 'Unknown Action'}
                          </h3>
                          <span className="text-xs text-discord-text">
                            {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : 'Unknown time'}
                          </span>
                        </div>
                        <p className="text-sm text-white mb-2">{log.details || 'No details'}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-discord-text">
                          <span>Admin: {log.admin_id ? log.admin_id.substring(0, 8) + '...' : 'Unknown'}</span>
                          <span>IP: {log.ip_address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-semibold">ℹ️ About Logs</p>
          <p className="text-discord-text text-sm mt-1">
            All admin actions are automatically logged for audit and transparency.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
