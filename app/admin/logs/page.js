'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { FaHistory, FaDiscord, FaSync } from 'react-icons/fa';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [sendingToDiscord, setSendingToDiscord] = useState(false);

  useEffect(() => {
    loadLogs();
    loadWebhook();
  }, []);

  const loadWebhook = async () => {
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
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const sendToDiscord = async () => {
    if (!discordWebhook) {
      alert('Please enter a Discord webhook URL');
      return;
    }

    if (!confirm('Send logs to Discord?')) return;

    setSendingToDiscord(true);

    try {
      const fields = logs.slice(0, 10).map(log => ({
        name: log.action || 'Unknown',
        value: `**Details:** ${log.details || 'None'}\n**Time:** ${new Date(log.created_at).toLocaleString('en-IN')}`,
        inline: false,
      }));

      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '📋 Admin Logs',
            description: `Last 10 admin actions`,
            color: 0xFF0000,
            fields: fields,
            footer: { text: 'WarriorPixel' },
            timestamp: new Date().toISOString(),
          }]
        }),
      });

      if (response.ok) {
        alert('✅ Sent to Discord!');
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      console.error('Discord error:', error);
      alert('❌ Failed to send');
    } finally {
      setSendingToDiscord(false);
    }
  };

  const getColor = (action) => {
    const a = (action || '').toLowerCase();
    if (a.includes('delete') || a.includes('ban')) return 'text-red-400';
    if (a.includes('create') || a.includes('login')) return 'text-green-400';
    if (a.includes('edit') || a.includes('update')) return 'text-yellow-400';
    return 'text-purple-400';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Logs</h1>
            <p className="text-discord-text">Last 20 admin actions</p>
          </div>
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2"
          >
            <FaSync />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaHistory className="text-2xl text-purple-400 mb-2" />
            <p className="text-xs text-discord-text">Total Shown</p>
            <p className="text-2xl font-bold text-white">{logs.length}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
            <FaDiscord className="text-2xl text-orange-400 mb-2" />
            <p className="text-xs text-discord-text">Webhook</p>
            <p className="text-sm font-bold text-white">{discordWebhook ? '✓ Set' : '✗ None'}</p>
          </div>
        </div>

        {/* Discord */}
        <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FaDiscord className="text-purple-400" />
            Send to Discord
          </h3>
          <div className="flex gap-3">
            <input
              type="url"
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              placeholder="Discord Webhook URL"
              className="flex-1 px-4 py-3 bg-discord-darkest border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={sendToDiscord}
              disabled={sendingToDiscord || !discordWebhook}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-bold"
            >
              {sendingToDiscord ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-discord-text mt-2">Sends last 10 logs</p>
        </div>

        {/* Logs */}
        <div className="bg-discord-dark rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          </div>

          <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {log.action?.toLowerCase().includes('create') ? '✨' :
                       log.action?.toLowerCase().includes('delete') ? '🗑️' :
                       log.action?.toLowerCase().includes('ban') ? '🚫' :
                       log.action?.toLowerCase().includes('login') ? '🔐' :
                       log.action?.toLowerCase().includes('prize') ? '💰' : '📝'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold ${getColor(log.action)}`}>
                          {log.action || 'Unknown'}
                        </h3>
                        <span className="text-xs text-discord-text">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-white mb-1">{log.details || 'No details'}</p>
                      <p className="text-xs text-discord-text">
                        Admin: {log.admin_id?.substring(0, 8) || 'Unknown'}...
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FaHistory className="text-5xl text-gray-600 mx-auto mb-3" />
                <p className="text-white">No logs yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-semibold">ℹ️ Info</p>
          <p className="text-discord-text text-sm">
            Showing the 20 most recent admin actions.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
