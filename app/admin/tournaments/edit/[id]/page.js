'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

export default function EditTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      // Format datetime for input
      const startTime = data.start_time ? new Date(data.start_time).toISOString().slice(0, 16) : '';

      setFormData({
        title: data.title || '',
        game: data.game || 'Free Fire',
        description: data.description || '',
        rules: data.rules || '',
        prize_pool: String(data.prize_pool || 0),
        entry_fee: String(data.entry_fee || 0),
        max_participants: String(data.max_participants || 50),
        start_time: startTime,
        status: data.status || 'upcoming',
        room_id: data.room_id || '',
        room_password: data.room_password || ''
      });
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
      const updateData = {
        title: formData.title.trim(),
        game: formData.game,
        description: formData.description.trim() || null,
        rules: formData.rules.trim() || null,
        prize_pool: parseFloat(formData.prize_pool) || 0,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        max_participants: parseInt(formData.max_participants) || 50,
        start_time: formData.start_time,
        status: formData.status,
        room_id: formData.room_id.trim() || null,
        room_password: formData.room_password.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tournaments')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

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
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/tournaments')}
          className="flex items-center gap-2 text-discord-text hover:text-white mb-4 transition-all"
        >
          <FaArrowLeft />
          Back
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Edit Tournament</h1>
        <p className="text-discord-text">Update tournament details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📝 Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">Name *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Game</label>
              <select
                value={formData.game}
                onChange={(e) => setFormData({...formData, game: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              >
                <option value="Free Fire">Free Fire</option>
                <option value="PUBG">PUBG</option>
                <option value="COD">COD</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Rules</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({...formData, rules: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">⚙️ Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Prize Pool (₹)</label>
              <input
                type="number"
                value={formData.prize_pool}
                onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Entry Fee (₹)</label>
              <input
                type="number"
                value={formData.entry_fee}
                onChange={(e) => setFormData({...formData, entry_fee: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Max Players *</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                min="10"
                max="50"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Start Time *</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Room Details */}
        <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-2">🎮 Room Details</h2>
          <p className="text-yellow-400 text-sm mb-4">Add or update room ID and password</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Room ID</label>
              <input
                type="text"
                value={formData.room_id}
                onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                placeholder="123456789"
                className="w-full px-4 py-3 bg-discord-darkest border border-yellow-600 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Password</label>
              <input
                type="text"
                value={formData.room_password}
                onChange={(e) => setFormData({...formData, room_password: e.target.value})}
                placeholder="pass123"
                className="w-full px-4 py-3 bg-discord-darkest border border-yellow-600 text-white rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/tournaments')}
            disabled={saving}
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
