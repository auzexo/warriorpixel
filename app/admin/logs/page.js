'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { FaHistory, FaFilter, FaDiscord, FaUser, FaTrophy, FaMoneyBillWave, FaBullhorn, FaSync, FaDownload } from 'react-icons/fa';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [sendingToDiscord, setSendingToDiscord] = useState(false);
  const [loadingWebhook, setLoadingWebhook] = useState(true);

  useEffect(() => {
    loadLogs();
    loadDefaultWebhook();
  }, [actionFilter]);

  const loadDefaultWebhook = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'discord_webhook_logs')
        .single();

      if (data?.setting_value) {
        setDiscordWebhook(data.setting_value);
      }
    } catch (error) {
      console.error('Error loading webhook:', error);
    } finally {
      setLoadingWebhook(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('tournament')) return FaTrophy;
    if (actionLower.includes('user') || actionLower.includes('ban')) return FaUser;
    if (actionLower.includes('money') || actionLower.includes('prize') || actionLower.includes('wallet')) return FaMoneyBillWave;
    if (actionLower.includes('announcement')) return FaBullhorn;
    return FaHistory;
  };

  const getActionColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('delete') || actionLower.includes('ban')) return 'text-red-400';
    if (actionLower.includes('create') || actionLower.includes('login')) return 'text-green-400';
    if (actionLower.includes('edit') || actionLower.includes('update')) return 'text-yellow-400';
    if (actionLower.includes('prize') || actionLower.includes('distribute')) return 'text-blue-400';
    return 'text-purple-400';
  };

  const sendLogsToDiscord = async () => {
    if (!discordWebhook) {
      alert('Please enter a Discord webhook URL');
      return;
    }

    if (!confirm('Send recent admin logs to Discord?')) return;

    setSendingToDiscord(true);

    try {
      const recentLogs = logs.slice(0, 10);
      
      const fields = recentLogs.map(log => ({
        name: `${log.action || 'Unknown Action'}`,
        value: `**Details:** ${log.details || 'No details'}\n` +
               `**Time:** ${new Date(log.created_at).toLocaleString('en-IN')}\n` +
               `**Admin:** ${log.admin_id?.substring(0, 8)}...`,
        inline: false,
      }));

      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '📋 Admin Activity Logs',
            description: `Recent ${recentLogs.length} admin actions`,
            color: 0xFF0000,
            fields: fields,
            footer: { text: 'WarriorPixel Admin Logs' },
            timestamp: new Date().toISOString(),
          }]
        }),
      });

      if (!response.ok) throw new Error('Discord webhook failed');

      alert('✅ Logs sent to Discord successfully!');
    } catch (error) {
      console.error('Error sending to Discord:', error);
      alert('❌ Error sending to Discord: ' + error.message);
    } finally {
      setSendingToDiscord(false);
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Action', 'Details', 'Admin ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.action,
        `"${log.details?.replace(/"/g, '""') || ''}"`,
        log.admin_id,
        log.ip_address || 'N/A'
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

  // Get unique action types
  const actionTypes = [...new Set(logs.map(log => log.action))].filter(Boolean);

  // Filter logs by search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Logs</h1>
            <p className="text-discord-text">View all admin actions and activities</p>
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
            <FaHistory className="text-2xl text-purple-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Total Logs</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaFilter className="text-2xl text-blue-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Filtered</p>
            <p className="text-2xl font-bold text-white">{filteredLogs.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaTrophy className="text-2xl text-green-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Action Types</p>
            <p className="text-2xl font-bold text-white">{actionTypes.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaDiscord className="text-2xl text-orange-400 mb-2" />
            <p className="text-xs text-discord-text mb-1">Last 24h</p>
            <p className="text-2xl font-bold text-white">
              {logs.filter(log => new Date(log.created_at) > new Date(Date.now() - 86400000)).length}
            </p>
          </div>
        </div>

        {/* Discord Integration */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaDiscord className="text-purple-400" />
            Send Logs to Discord
          </h3>
          <div className="flex flex-col md:flex-row gap-3">
            {loadingWebhook ? (
              <div className="flex-1 px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg">
                <span className="text-discord-text text-sm">Loading webhook...</span>
              </div>
            ) : (
              <input
                type="url"
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                placeholder="Discord Webhook URL"
                className="flex-1 px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            )}
            <button
              onClick={sendLogsToDiscord}
              disabled={sendingToDiscord || !discordWebhook || loadingWebhook}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-bold transition-all"
            >
              {sendingToDiscord ? 'Sending...' : 'Send to Discord'}
            </button>
          </div>
          {!loadingWebhook && discordWebhook && (
            <p className="text-xs text-green-400 mt-2">✓ Webhook loaded from settings</p>
          )}
          <p className="text-xs text-discord-text mt-2">
            Sends the last 10 admin actions to your Discord channel
          </p>
        </div>

        {/* Filters */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-purple-400" />
            <h3 className="font-semibold text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search action or details..."
                className="w-full px-4 py-2 bg-discord-darkest border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 bg-discord-darkest border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-discord-dark rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Recent Activity ({filteredLogs.length})</h2>
          </div>

          <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-discord-text mt-4">Loading logs...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                const colorClass = getActionColor(log.action);

                return (
                  <div key={log.id} className="p-4 hover:bg-gray-800 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-gray-800">
                        <Icon className={`text-xl ${colorClass}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <h3 className={`font-bold ${colorClass}`}>
                            {log.action}
                          </h3>
                          <span className="text-xs text-discord-text">
                            {new Date(log.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-white mb-2">
                          {log.details}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-discord-text">
                          <span>Admin: {log.admin_id?.substring(0, 8)}...</span>
                          <span>IP: {log.ip_address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <FaHistory className="text-6xl text-gray-600 mx-auto mb-4" />
                <p className="text-white font-semibold mb-2">No logs found</p>
                <p className="text-discord-text">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-semibold">ℹ️ About Logs</p>
          <p className="text-discord-text text-sm mt-1">
            All admin actions are automatically logged. Logs are kept for audit and can be sent to Discord for team transparency.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
