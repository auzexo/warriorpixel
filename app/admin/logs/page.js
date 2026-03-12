'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { FaHistory, FaFilter, FaDiscord, FaUser, FaTrophy, FaMoneyBillWave, FaBullhorn, FaDownload } from 'react-icons/fa';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
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
        .eq('setting_key', 'discord_logs_webhook_url')
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
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const logsWithAdmin = await Promise.all(
          data.map(async (log) => {
            if (log.admin_id) {
              try {
                const { data: adminData } = await supabase
                  .from('admin_accounts')
                  .select('admin_id, user_id')
                  .eq('id', log.admin_id)
                  .single();

                if (adminData) {
                  const { data: userData } = await supabase
                    .from('users')
                    .select('username')
                    .eq('id', adminData.user_id)
                    .single();

                  return {
                    ...log,
                    admin_username: userData?.username || 'Unknown',
                    admin_account_id: adminData.admin_id,
                  };
                }
              } catch (err) {
                console.error('Error loading admin for log:', err);
              }
            }
            return { ...log, admin_username: 'Unknown', admin_account_id: 'Unknown' };
          })
        );

        setLogs(logsWithAdmin);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    if (actionType.includes('tournament')) return FaTrophy;
    if (actionType.includes('user')) return FaUser;
    if (actionType.includes('money')) return FaMoneyBillWave;
    if (actionType.includes('announcement')) return FaBullhorn;
    return FaHistory;
  };

  const getActionColor = (actionType) => {
    if (actionType.includes('delete') || actionType.includes('ban')) return 'text-red-400';
    if (actionType.includes('create') || actionType.includes('reward')) return 'text-green-400';
    if (actionType.includes('edit') || actionType.includes('update')) return 'text-yellow-400';
    if (actionType.includes('money')) return 'text-blue-400';
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
        name: `${log.action_type.replace(/_/g, ' ').toUpperCase()}`,
        value: `**Admin:** ${log.admin_username || 'Unknown'}\n` +
               `**Time:** ${new Date(log.created_at).toLocaleString('en-IN')}\n` +
               `**Details:** ${JSON.stringify(log.details || {})}`,
        inline: false,
      }));

      await fetch(discordWebhook, {
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

      alert('Logs sent to Discord successfully!');
    } catch (error) {
      console.error('Error sending to Discord:', error);
      alert('Error sending to Discord: ' + error.message);
    } finally {
      setSendingToDiscord(false);
    }
  };

  const exportLogs = () => {
    const csv = [
      'Timestamp,Action,Admin,Details',
      ...logs.map(log => {
        const timestamp = new Date(log.created_at).toISOString();
        const action = log.action_type.replace(/,/g, ' ');
        const admin = log.admin_username || 'Unknown';
        const details = JSON.stringify(log.details || {}).replace(/,/g, ' ');
        return `${timestamp},${action},${admin},${details}`;
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header - IMPROVED UI */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Logs</h1>
            <p className="text-discord-text">View all admin actions and activities</p>
          </div>
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all"
          >
            <FaDownload />
            Export CSV
          </button>
        </div>

        {/* Stats - NEW */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-600 rounded-xl p-4">
            <FaHistory className="text-2xl text-purple-300 mb-2" />
            <p className="text-xs text-purple-200 mb-1">Total Logs</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-600 rounded-xl p-4">
            <FaDiscord className="text-2xl text-blue-300 mb-2" />
            <p className="text-xs text-blue-200 mb-1">Webhook</p>
            <p className="text-sm font-bold text-white">{discordWebhook ? '✓ Active' : '✗ None'}</p>
          </div>
          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-600 rounded-xl p-4">
            <FaFilter className="text-2xl text-green-300 mb-2" />
            <p className="text-xs text-green-200 mb-1">Filter</p>
            <p className="text-sm font-bold text-white">{actionFilter === 'all' ? 'All' : actionFilter.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Discord Integration - BETTER UI */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 border border-purple-600 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaDiscord className="text-purple-300" />
            Send Logs to Discord
          </h3>
          <div className="flex flex-col md:flex-row gap-3">
            {loadingWebhook ? (
              <div className="flex-1 px-4 py-3 bg-black bg-opacity-30 border border-purple-500 rounded-lg">
                <span className="text-purple-200 text-sm">Loading webhook...</span>
              </div>
            ) : (
              <input
                type="url"
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                placeholder="Discord Webhook URL"
                className="flex-1 px-4 py-3 bg-black bg-opacity-30 border border-purple-500 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
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
          <p className="text-xs text-purple-200 mt-2">
            Sends the last 10 admin actions to your Discord channel
          </p>
        </div>

        {/* Filters - BETTER UI */}
        <div className="bg-discord-dark rounded-xl p-5 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-purple-400 text-lg" />
            <h3 className="font-bold text-white">Filter Logs</h3>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full md:w-72 px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 font-medium"
          >
            <option value="all">All Actions</option>
            <option value="tournament_create">Tournament Created</option>
            <option value="tournament_edit">Tournament Edited</option>
            <option value="tournament_delete">Tournament Deleted</option>
            <option value="user_ban">User Banned</option>
            <option value="user_suspend">User Suspended</option>
            <option value="user_activate">User Activated</option>
            <option value="user_currency_edit">Currency Edited</option>
            <option value="reward_given">Reward Given</option>
            <option value="money_sent">Money Sent</option>
            <option value="money_taken">Money Taken</option>
            <option value="announcement_create">Announcement Created</option>
          </select>
        </div>

        {/* Logs List - BETTER UI */}
        <div className="bg-discord-dark rounded-xl border border-gray-700 shadow-xl">
          <div className="p-5 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
            <h2 className="text-xl font-bold text-white">Recent Activity ({logs.length})</h2>
          </div>

          <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-discord-text mt-3">Loading logs...</p>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => {
                const Icon = getActionIcon(log.action_type);
                const colorClass = getActionColor(log.action_type);

                return (
                  <div key={log.id} className="p-5 hover:bg-gray-800 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                        <Icon className={`text-2xl ${colorClass}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className={`font-bold text-lg ${colorClass}`}>
                            {log.action_type.replace(/_/g, ' ').toUpperCase()}
                          </h3>
                          <span className="text-xs text-discord-text bg-gray-800 px-2 py-1 rounded">
                            {new Date(log.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-discord-text mb-2">
                          Admin: <span className="text-purple-400 font-bold">
                            {log.admin_username || 'Unknown'}
                          </span>
                        </p>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mt-2">
                            <p className="text-xs text-purple-400 font-bold mb-1">Details:</p>
                            <pre className="text-xs text-white overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <FaHistory className="text-6xl text-gray-700 mx-auto mb-4" />
                <p className="text-white font-semibold mb-1">No logs found</p>
                <p className="text-discord-text text-sm">Admin actions will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Info - BETTER UI */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-600 rounded-xl p-5">
          <p className="text-blue-300 text-sm font-bold flex items-center gap-2">
            <span className="text-lg">ℹ️</span> About Logs
          </p>
          <p className="text-blue-100 text-sm mt-2">
            All admin actions are automatically logged. Logs are kept for audit purposes and can be sent to Discord for team transparency.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
