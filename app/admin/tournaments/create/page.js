'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin';
import { FaTrophy, FaArrowLeft, FaSave } from 'react-icons/fa';

export default function CreateTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    game: 'freefire',
    description: '',
    rules: '',
    prize_pool: '',
    entry_fee: '0',
    max_participants: '',
    start_time: '',
    status: 'upcoming',
    room_id: '',
    room_password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate room visible time (5 minutes before start)
      const startTime = new Date(formData.start_time);
      const roomVisibleAt = new Date(startTime.getTime() - 5 * 60000); // 5 minutes before

      const tournamentData = {
        name: formData.name,
        game: formData.game,
        description: formData.description || null,
        rules: formData.rules || null,
        prize_pool: parseFloat(formData.prize_pool),
        entry_fee: parseFloat(formData.entry_fee),
        max_participants: parseInt(formData.max_participants),
        start_time: formData.start_time,
        status: formData.status,
        room_id: formData.room_id || null,
        room_password: formData.room_password || null,
        room_visible_at: roomVisibleAt.toISOString(),
      };

      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      const adminSession = JSON.parse(localStorage.getItem('admin_session') || '{}');
      await logAdminAction(adminSession.adminAccountId, 'tournament_create', {
        targetTournamentId: data.id,
        tournamentName: data.name,
      });

      alert('Tournament created successfully!');
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error creating tournament: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
          >
            <FaArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Create Tournament</h1>
            <p className="text-discord-text">Fill in the details to create a new tournament</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-discord-dark rounded-xl p-6 border border-gray-800 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FaTrophy className="text-yellow-400" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Tournament Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Solo Showdown Championship"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Game *
                </label>
                <select
                  name="game"
                  value={formData.game}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="freefire">Free Fire</option>
                  <option value="bgmi">BGMI</option>
                  <option value="stumbleguys">Stumble Guys</option>
                  <option value="minecraft">Minecraft</option>
                  <option value="valorant">Valorant</option>
                  <option value="codm">Call of Duty Mobile</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tournament description..."
                rows="3"
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-discord-text mb-2">
                Rules
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                placeholder="Tournament rules..."
                rows="4"
                className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              ></textarea>
            </div>
          </div>

          {/* Tournament Settings */}
          <div className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-bold text-white">Tournament Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Prize Pool (₹) *
                </label>
                <input
                  type="number"
                  name="prize_pool"
                  value={formData.prize_pool}
                  onChange={handleChange}
                  placeholder="1000"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Entry Fee (₹) *
                </label>
                <select
                  name="entry_fee"
                  value={formData.entry_fee}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="0">FREE</option>
                  <option value="10">₹10</option>
                  <option value="20">₹20</option>
                  <option value="30">₹30</option>
                  <option value="50">₹50</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Max Participants *
                </label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  placeholder="50"
                  min="2"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Room Details */}
          <div className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-bold text-white">Room Details</h3>
            <p className="text-sm text-discord-text">Room ID and password will be visible to participants 5 minutes before tournament start</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleChange}
                  placeholder="123456789"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-discord-text mb-2">
                  Room Password
                </label>
                <input
                  type="text"
                  name="room_password"
                  value={formData.room_password}
                  onChange={handleChange}
                  placeholder="pass1234"
                  className="w-full px-4 py-3 bg-discord-input border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Creating...'
              ) : (
                <>
                  <FaSave />
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
      }
