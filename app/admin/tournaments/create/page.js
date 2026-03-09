'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { FaTrophy, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

export default function CreateTournamentPage() {
  const router = useRouter();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [usePreset, setUsePreset] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    game: 'Free Fire',
    description: '',
    rules: '',
    prize_pool: '',
    entry_fee: '',
    max_participants: 50,
    start_time: '',
    status: 'upcoming',
    room_id: '',
    room_password: ''
  });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_presets')
        .select('*')
        .eq('is_active', true)
        .order('preset_number');

      if (error) throw error;
      setPresets(data || []);
    } catch (error) {
      console.error('Error loading presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetId) => {
    const preset = presets.find(p => p.id === parseInt(presetId));
    setSelectedPreset(preset);

    if (preset) {
      setFormData(prev => ({
        ...prev,
        entry_fee: preset.entry_fee,
        description: preset.description_template || '',
        rules: preset.rules?.join('\n') || '',
        max_participants: preset.max_players
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.start_time) {
      alert('Please fill in all required fields');
      return;
    }

    if (usePreset && !selectedPreset) {
      alert('Please select a preset');
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const tournamentData = {
        title: formData.title,
        game: formData.game,
        description: formData.description,
        rules: formData.rules,
        prize_pool: parseFloat(formData.prize_pool) || 0,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        max_participants: parseInt(formData.max_participants),
        start_time: formData.start_time,
        status: formData.status,
        room_id: formData.room_id || null,
        room_password: formData.room_password || null,
        created_by: user?.id,
        preset_id: usePreset ? selectedPreset?.id : null
      };

      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select()
        .single();

      if (error) throw error;

      alert('Tournament created successfully!');
      router.push('/admin/tournaments');
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Error: ' + error.message);
    } finally {
      setCreating(false);
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
          Back to Tournaments
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Create Tournament</h1>
        <p className="text-discord-text">Fill in the details to create a new tournament</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preset or Custom */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">🏆 Tournament Type</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => setUsePreset(true)}
              className={`px-6 py-4 rounded-lg font-bold transition-all ${
                usePreset 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-discord-darkest text-discord-text hover:bg-gray-800'
              }`}
            >
              Use Preset
            </button>
            <button
              type="button"
              onClick={() => setUsePreset(false)}
              className={`px-6 py-4 rounded-lg font-bold transition-all ${
                !usePreset 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-discord-darkest text-discord-text hover:bg-gray-800'
              }`}
            >
              Custom Tournament
            </button>
          </div>

          {/* Preset Selection */}
          {usePreset && (
            <div>
              <label className="block text-white font-semibold mb-2">Select Preset *</label>
              <select
                value={selectedPreset?.id || ''}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                required
              >
                <option value="">-- Choose a Preset --</option>
                {presets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} - Entry: ₹{preset.entry_fee} | Per Kill: ₹{preset.per_kill_reward} | Booyah: ₹{preset.booyah_reward}
                  </option>
                ))}
              </select>
              
              {selectedPreset && (
                <div className="mt-4 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">{selectedPreset.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-400">Entry Fee: ₹{selectedPreset.entry_fee}</p>
                      <p className="text-green-400">Per Kill: ₹{selectedPreset.per_kill_reward}</p>
                      <p className="text-green-400">Booyah: ₹{selectedPreset.booyah_reward}</p>
                    </div>
                    <div>
                      <p className="text-green-400">Mode: {selectedPreset.mode}</p>
                      <p className="text-green-400">Players: {selectedPreset.min_players}-{selectedPreset.max_players}</p>
                      <p className="text-green-400">Type: {selectedPreset.is_free ? 'FREE' : 'PAID'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📝 Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2">Tournament Name *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Friday Night Finals"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Game *</label>
              <select
                value={formData.game}
                onChange={(e) => setFormData({...formData, game: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              >
                <option value="Free Fire">Free Fire</option>
                <option value="PUBG Mobile">PUBG Mobile</option>
                <option value="COD Mobile">COD Mobile</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tournament description..."
                rows={3}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Rules</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({...formData, rules: e.target.value})}
                placeholder="Tournament rules (one per line)..."
                rows={5}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">⚙️ Tournament Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!usePreset && (
              <>
                <div>
                  <label className="block text-white font-semibold mb-2">Prize Pool (₹)</label>
                  <input
                    type="number"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                    placeholder="1000"
                    className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Entry Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({...formData, entry_fee: e.target.value})}
                    placeholder="10"
                    className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-white font-semibold mb-2">Max Players *</label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                min="10"
                max="50"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Start Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Room Details */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-2">🎮 Room Details</h2>
          <p className="text-discord-text text-sm mb-4">Can be added now or later (5 min before start)</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Room ID</label>
              <input
                type="text"
                value={formData.room_id}
                onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                placeholder="123456789"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Room Password</label>
              <input
                type="text"
                value={formData.room_password}
                onChange={(e) => setFormData({...formData, room_password: e.target.value})}
                placeholder="pass1234"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/tournaments')}
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
          >
            <FaCheckCircle />
            {creating ? 'Creating...' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
