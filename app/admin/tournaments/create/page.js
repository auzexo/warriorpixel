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
    prize_pool: '0',
    entry_fee: '0',
    max_participants: '50',
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

      if (error) {
        console.error('Preset load error:', error);
      } else {
        setPresets(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetId) => {
    if (!presetId) {
      setSelectedPreset(null);
      return;
    }

    const preset = presets.find(p => p.id === parseInt(presetId));
    setSelectedPreset(preset);

    if (preset) {
      setFormData(prev => ({
        ...prev,
        entry_fee: String(preset.entry_fee || 0),
        prize_pool: String(preset.entry_fee || 0),
        description: preset.description_template || '',
        rules: Array.isArray(preset.rules) ? preset.rules.join('\n') : '',
        max_participants: String(preset.max_players || 50)
      }));
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

    if (usePreset && !selectedPreset) {
      alert('❌ Please select a preset');
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const tournamentData = {
        title: formData.title.trim(),
        game: formData.game,
        start_time: formData.start_time,
        status: formData.status,
        prize_pool: parseFloat(formData.prize_pool) || 0,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        max_participants: parseInt(formData.max_participants) || 50,
        description: formData.description.trim() || null,
        rules: formData.rules.trim() || null,
        room_id: formData.room_id.trim() || null,
        room_password: formData.room_password.trim() || null,
        preset_id: usePreset && selectedPreset ? selectedPreset.id : null,
        created_by: user?.id || null
      };

      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select()
        .single();

      if (error) throw error;

      alert('✅ Tournament created!');
      router.push('/admin/tournaments');
      
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
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
          Back
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Create Tournament</h1>
        <p className="text-discord-text">Fill in the details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preset Type */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">🏆 Type</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => setUsePreset(true)}
              className={`px-6 py-4 rounded-lg font-bold ${
                usePreset ? 'bg-purple-600 text-white' : 'bg-discord-darkest text-discord-text'
              }`}
            >
              Preset
            </button>
            <button
              type="button"
              onClick={() => {setUsePreset(false); setSelectedPreset(null);}}
              className={`px-6 py-4 rounded-lg font-bold ${
                !usePreset ? 'bg-purple-600 text-white' : 'bg-discord-darkest text-discord-text'
              }`}
            >
              Custom
            </button>
          </div>

          {usePreset && (
            <div>
              <label className="block text-white font-semibold mb-2">Select Preset *</label>
              {presets.length === 0 ? (
                <p className="text-red-400 text-sm">No presets found</p>
              ) : (
                <>
                  <select
                    value={selectedPreset?.id || ''}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
                    required
                  >
                    <option value="">-- Choose --</option>
                    {presets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} (Entry: ₹{preset.entry_fee})
                      </option>
                    ))}
                  </select>
                  
                  {selectedPreset && (
                    <div className="mt-4 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg p-4">
                      <p className="text-white font-bold">{selectedPreset.name}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <p className="text-green-400">Entry: ₹{selectedPreset.entry_fee}</p>
                        <p className="text-green-400">Kill: ₹{selectedPreset.per_kill_reward}</p>
                        <p className="text-green-400">Booyah: ₹{selectedPreset.booyah_reward}</p>
                        <p className="text-green-400">Max: {selectedPreset.max_players}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

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
                placeholder="Friday Finals"
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
          
          <div className="grid grid-cols-2 gap-4">
            {!usePreset && (
              <>
                <div>
                  <label className="block text-white font-semibold mb-2">Prize (₹)</label>
                  <input
                    type="number"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                    className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-2">Entry (₹)</label>
                  <input
                    type="number"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({...formData, entry_fee: e.target.value})}
                    className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
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
              <label className="block text-white font-semibold mb-2">Room ID</label>
              <input
                type="text"
                value={formData.room_id}
                onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                placeholder="123456789"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Password</label>
              <input
                type="text"
                value={formData.room_password}
                onChange={(e) => setFormData({...formData, room_password: e.target.value})}
                placeholder="pass123"
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/tournaments')}
            className="flex-1 px-6 py-4 bg-gray-700 text-white rounded-lg font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
