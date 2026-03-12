'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminLogger';
import { formatUTCToISTLocal, parseISTToUTC, formatISTDate } from '@/lib/timeUtils';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaArrowLeft, FaCheckCircle, FaClock, FaInfoCircle, FaGamepad } from 'react-icons/fa';

export default function EditTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    game: 'Free Fire',
    description: '',
    rules: '',
    prize_pool: '0',
    entry_fee: '0',
    max_participants: '50',
    start_time: '',
    status: 'upcoming',
    room_id: '',
    room_password: ''
  });

  useEffect(() => {
    loadTournament();
  }, []);

  const loadTournament = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      // CRITICAL: Convert UTC time from database to IST for datetime-local input
      const startTimeIST = data.start_time ? formatUTCToISTLocal(data.start_time) : '';

      const tournamentData = {
        title: data.title || '',
        game: data.game || 'Free Fire',
        description: data.description || '',
        rules: data.rules || '',
        prize_pool: String(data.prize_pool || 0),
        entry_fee: String(data.entry_fee || 0),
        max_participants: String(data.max_participants || 50),
        start_time: startTimeIST,
        status: data.status || 'upcoming',
        room_id: data.room_id || '',
        room_password: data.room_password || ''
      };

      setFormData(tournamentData);
      setOriginalData(tournamentData);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to load tournament');
      router.push('/admin/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('❌ Tournament Name is required');
      return;
    }

    if (!formData.start_time) {
      alert('❌ Start Time is required');
      return;
    }

    setSaving(true);

    try {
      // CRITICAL: Convert IST time from input to UTC for database storage
      const startTimeUTC = parseISTToUTC(formData.start_time);

      const updateData = {
        title: formData.title.trim(),
        game: formData.game,
        description: formData.description.trim() || null,
        rules: formData.rules.trim() || null,
        prize_pool: parseFloat(formData.prize_pool) || 0,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        max_participants: parseInt(formData.max_participants) || 50,
        start_time: startTimeUTC, // Store as UTC
        status: formData.status,
        room_id: formData.room_id.trim() || null,
        room_password: formData.room_password.trim() || null,
        updated_at: new Date().toISOString()
      };

      console.log('Updating tournament:', {
        input_time_ist: formData.start_time,
        converted_time_utc: startTimeUTC
      });

      const { error } = await supabase
        .from('tournaments')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      // LOG THE EDIT ACTION WITH DETAILED CHANGES
      const changes = {};
      const fieldsChanged = [];

      if (originalData.title !== formData.title) {
        changes.title = { from: originalData.title, to: formData.title };
        fieldsChanged.push('title');
      }
      if (originalData.status !== formData.status) {
        changes.status = { from: originalData.status, to: formData.status };
        fieldsChanged.push('status');
      }
      if (originalData.prize_pool !== formData.prize_pool) {
        changes.prize_pool = { from: `₹${originalData.prize_pool}`, to: `₹${formData.prize_pool}` };
        fieldsChanged.push('prize_pool');
      }
      if (originalData.entry_fee !== formData.entry_fee) {
        changes.entry_fee = { from: `₹${originalData.entry_fee}`, to: `₹${formData.entry_fee}` };
        fieldsChanged.push('entry_fee');
      }
      if (originalData.max_participants !== formData.max_participants) {
        changes.max_participants = { from: originalData.max_participants, to: formData.max_participants };
        fieldsChanged.push('max_participants');
      }
      if (originalData.start_time !== formData.start_time) {
        changes.start_time = { from: originalData.start_time, to: formData.start_time };
        fieldsChanged.push('start_time');
      }
      if (originalData.game !== formData.game) {
        changes.game = { from: originalData.game, to: formData.game };
        fieldsChanged.push('game');
      }
      if (originalData.description !== formData.description) {
        changes.description = 'updated';
        fieldsChanged.push('description');
      }
      if (originalData.rules !== formData.rules) {
        changes.rules = 'updated';
        fieldsChanged.push('rules');
      }
      if (originalData.room_id !== formData.room_id) {
        changes.room_id = 'updated';
        fieldsChanged.push('room_id');
      }
      if (originalData.room_password !== formData.room_password) {
        changes.room_password = 'updated';
        fieldsChanged.push('room_password');
      }

      await logAdminAction('tournament_edit', {
        tournament_id: params.id,
        tournament_title: formData.title,
        changes: changes,
        fields_changed: fieldsChanged,
        total_changes: fieldsChanged.length
      });

      alert('✅ Tournament updated successfully!');
      router.push('/admin/tournaments');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

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
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/tournaments')}
          className="flex items-center gap-2 text-discord-text hover:text-white mb-4 transition-all"
        >
          <FaArrowLeft />
          Back to Tournaments
        </button>
        <div className="flex items-center gap-3 mb-2">
          <FaTrophy className="text-3xl text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Edit Tournament</h1>
        </div>
        <p className="text-discord-text">Update tournament details and settings</p>
      </div>

      {/* IST Timezone Info Banner */}
      <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="text-xl text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-1 text-sm">
              🕐 Timezone: Indian Standard Time (IST)
            </h3>
            <p className="text-xs text-blue-300">
              All times are in IST. Tournaments auto-switch from UPCOMING → LIVE when start time is reached.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-Status Info Banner */}
      <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FaClock className="text-xl text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-1 text-sm">
              ⚡ Automatic Status Switching
            </h3>
            <p className="text-xs text-yellow-300">
              When start time is reached, status automatically changes from <span className="font-bold">UPCOMING</span> to <span className="font-bold text-red-400">LIVE</span>. This prevents late entries and ensures fair play.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            📝 Tournament Details
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Tournament Name *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Friday Night Finals"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Game
              </label>
              <select
                value={formData.game}
                onChange={(e) => setFormData({...formData, game: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 font-semibold"
              >
                <option value="Free Fire">🔥 Free Fire</option>
                <option value="PUBG">🎮 PUBG</option>
                <option value="COD">💣 COD</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Brief description of the tournament..."
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Rules
              </label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({...formData, rules: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-500 resize-none font-mono text-sm"
                placeholder="Tournament rules (one per line)..."
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            ⚙️ Tournament Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-green-900 bg-opacity-10 border border-green-600 rounded-lg p-4">
              <label className="block text-green-400 font-bold mb-2 text-sm">
                💰 Prize Pool (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.prize_pool}
                onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-green-700 text-white rounded-lg focus:outline-none focus:border-green-500 font-bold text-lg"
                placeholder="100"
              />
            </div>

            <div className="bg-blue-900 bg-opacity-10 border border-blue-600 rounded-lg p-4">
              <label className="block text-blue-400 font-bold mb-2 text-sm">
                🎫 Entry Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.entry_fee}
                onChange={(e) => setFormData({...formData, entry_fee: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-blue-700 text-white rounded-lg focus:outline-none focus:border-blue-500 font-bold text-lg"
                placeholder="10"
              />
            </div>

            <div className="bg-purple-900 bg-opacity-10 border border-purple-600 rounded-lg p-4">
              <label className="block text-purple-400 font-bold mb-2 text-sm">
                👥 Max Players *
              </label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                min="10"
                max="50"
                className="w-full px-4 py-3 bg-discord-darkest border border-purple-700 text-white rounded-lg focus:outline-none focus:border-purple-500 font-bold text-lg"
                required
              />
              <p className="text-xs text-purple-300 mt-1">Range: 10-50 players</p>
            </div>

            <div className="bg-orange-900 bg-opacity-10 border border-orange-600 rounded-lg p-4">
              <label className="block text-orange-400 font-bold mb-2 text-sm flex items-center gap-2">
                <FaClock />
                Start Time (IST) *
              </label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-orange-700 text-white rounded-lg focus:outline-none focus:border-orange-500 font-semibold"
                required
              />
              <p className="text-xs text-orange-300 mt-1">
                🕐 Indian Standard Time (IST)
              </p>
            </div>

            <div className="bg-red-900 bg-opacity-10 border border-red-600 rounded-lg p-4 md:col-span-2">
              <label className="block text-red-400 font-bold mb-2 text-sm">
                🚦 Tournament Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-red-700 text-white rounded-lg focus:outline-none focus:border-red-500 font-bold text-lg"
              >
                <option value="upcoming">⏳ UPCOMING</option>
                <option value="live">🔴 LIVE</option>
                <option value="completed">✅ COMPLETED</option>
              </select>
              <p className="text-xs text-red-300 mt-2">
                ⚠️ Manual override available. Auto-switches to LIVE at start time if set to UPCOMING.
              </p>
            </div>
          </div>
        </div>

        {/* Room Details */}
        <div className="bg-gradient-to-br from-yellow-900 to-orange-900 bg-opacity-20 border border-yellow-600 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            🎮 Room Details
          </h2>
          <p className="text-yellow-300 text-sm mb-5">
            Add or update game room credentials (visible to participants when tournament is LIVE)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Room ID
              </label>
              <input
                type="text"
                value={formData.room_id}
                onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                placeholder="123456789"
                className="w-full px-4 py-3 bg-discord-darkest border border-yellow-600 text-white rounded-lg focus:outline-none focus:border-yellow-500 font-mono font-bold text-lg"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Room Password
              </label>
              <input
                type="text"
                value={formData.room_password}
                onChange={(e) => setFormData({...formData, room_password: e.target.value})}
                placeholder="pass123"
                className="w-full px-4 py-3 bg-discord-darkest border border-yellow-600 text-white rounded-lg focus:outline-none focus:border-yellow-500 font-mono font-bold text-lg"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 sticky bottom-4 z-10">
          <button
            type="button"
            onClick={() => router.push('/admin/tournaments')}
            disabled={saving}
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg font-bold transition-all shadow-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
