'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { FaHistory, FaFilter, FaDiscord, FaUser, FaTrophy, FaMoneyBillWave, FaBullhorn } from 'react-icons/fa';

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
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'discord_logs_webhook_url')
      .single();

    if (data?.setting_value) {
      setDiscordWebhook(data.setting_value);
    }
    setLoadingWebhook(false);
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
      const recentLogs = logs.slice(0, 10); // Last 10 logs
      
      const fields = recentLogs.map(log => ({
        name: `${log.action_type.replace(/_/g, ' ').toUpperCase()}`,
        value: `**Admin:** ${log.admin_accounts?.users?.username || 'Unknown'}\n` +
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Logs</h1>
          <p className="text-discord-text">View all admin actions and activities</p>
        </div>

        {/* Discord Integration */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaDiscord className="text-purple-400" />
            Send Logs to Discord
          </h3>
          <div className="flex gap-3">
            <input
              type="url"
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              placeholder="Discord Webhook URL"
              className="flex-1 px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={sendLogsToDiscord}
              disabled={sendingToDiscord || !discordWebhook}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
            >
              {sendingToDiscord ? 'Sending...' : 'Send to Discord'}
            </button>
          </div>
          <p className="text-xs text-discord-text mt-2">
            This will send the last 10 admin actions to your Discord channel
          </p>
        </div>

        {/* Filters */}
        <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-purple-400" />
            <h3 className="font-semibold text-white">Filter Logs</h3>
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
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

        {/* Logs List */}
        <div className="bg-discord-dark rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Recent Activity ({logs.length})</h2>
          </div>

          <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => {
                const Icon = getActionIcon(log.action_type);
                const colorClass = getActionColor(log.action_type);

                return (
                  <div key={log.id} className="p-4 hover:bg-white hover:bg-opacity-5 transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-white bg-opacity-5`}>
                        <Icon className={`text-xl ${colorClass}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">
                            {log.action_type.replace(/_/g, ' ').toUpperCase()}
                          </h3>
                          <span className="text-xs text-discord-text">
                            {new Date(log.created_at).toLocaleString('en-IN')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-discord-text mb-2">
                          Admin: <span className="text-purple-400 font-semibold">
                            {log.admin_accounts?.users?.username || 'Unknown'}
                          </span>
                        </p>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="bg-white bg-opacity-5 rounded-lg p-3 mt-2">
                            <p className="text-xs text-discord-text font-semibold mb-1">Details:</p>
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
                <FaHistory className="text-6xl text-gray-600 mx-auto mb-4" />
                <p className="text-discord-text">No logs found</p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-semibold">ℹ️ About Logs</p>
          <p className="text-discord-text text-sm mt-1">
            All admin actions are automatically logged. Logs are kept for audit purposes and can be sent to Discord for team transparency.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
  }
