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
        console.error('Error loading presets:', error);
        // Continue even if presets fail to load
      } else {
        setPresets(data || []);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
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

    // Validation
    if (!formData.title || !formData.title.trim()) {
      alert('❌ Tournament Name is required');
      return;
    }

    if (!formData.start_time) {
      alert('❌ Start Date & Time is required');
      return;
    }

    if (usePreset && !selectedPreset) {
      alert('❌ Please select a preset');
      return;
    }

    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Build the safest possible insert object
      const tournamentData = {};
      
      // Required fields
      tournamentData.title = formData.title.trim();
      tournamentData.game = formData.game || 'Free Fire';
      tournamentData.start_time = formData.start_time;
      tournamentData.status = formData.status || 'upcoming';
      
      // Numeric fields with defaults
      tournamentData.prize_pool = parseFloat(formData.prize_pool) || 0;
      tournamentData.entry_fee = parseFloat(formData.entry_fee) || 0;
      tournamentData.max_participants = parseInt(formData.max_participants) || 50;
      
      // Optional text fields
      if (formData.description && formData.description.trim()) {
        tournamentData.description = formData.description.trim();
      }
      
      if (formData.rules && formData.rules.trim()) {
        tournamentData.rules = formData.rules.trim();
      }
      
      if (formData.room_id && formData.room_id.trim()) {
        tournamentData.room_id = formData.room_id.trim();
      }
      
      if (formData.room_password && formData.room_password.trim()) {
        tournamentData.room_password = formData.room_password.trim();
      }
      
      // Foreign keys
      if (usePreset && selectedPreset && selectedPreset.id) {
        tournamentData.preset_id = selectedPreset.id;
      }
      
      if (user && user.id) {
        tournamentData.created_by = user.id;
      }

      console.log('📤 Sending tournament data:', tournamentData);

      const { data, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Tournament created:', data);
      alert('✅ Tournament created successfully!');
      router.push('/admin/tournaments');
      
    } catch (error) {
      console.error('❌ Error creating tournament:', error);
      
      // More helpful error messages
      if (error.message.includes('schema cache')) {
        alert('❌ Database schema error. Please:\n1. Refresh the page\n2. Wait 2 minutes\n3. Try again\n\nIf issue persists, restart PostgREST in Supabase settings.');
      } else if (error.message.includes('column')) {
        alert('❌ Database column error:\n' + error.message + '\n\nPlease verify the SQL script was run correctly.');
      } else {
        alert('❌ Error: ' + error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-discord-text">Loading presets...</p>
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
              Use Preset (7 Available)
            </button>
            <button
              type="button"
              onClick={() => {
                setUsePreset(false);
                setSelectedPreset(null);
              }}
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
              {presets.length === 0 ? (
                <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-4 text-center">
                  <p className="text-red-400">No presets found. Please run the SQL script to create presets.</p>
                </div>
              ) : (
                <>
                  <select
                    value={selectedPreset?.id || ''}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                    required
                  >
                    <option value="">-- Choose a Preset --</option>
                    {presets.map(preset => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} (Entry: ₹{preset.entry_fee} | Kill: ₹{preset.per_kill_reward} | Booyah: ₹{preset.booyah_reward})
                      </option>
                    ))}
                  </select>
                  
                  {selectedPreset && (
                    <div className="mt-4 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg p-4">
                      <h3 className="font-bold text-white mb-2">{selectedPreset.name}</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-green-400">💰 Entry Fee: ₹{selectedPreset.entry_fee}</p>
                          <p className="text-green-400">☠️ Per Kill: ₹{selectedPreset.per_kill_reward}</p>
                          <p className="text-green-400">👑 Booyah: ₹{selectedPreset.booyah_reward}</p>
                        </div>
                        <div>
                          <p className="text-green-400">🎮 Mode: {selectedPreset.mode}</p>
                          <p className="text-green-400">👥 Players: {selectedPreset.min_players}-{selectedPreset.max_players}</p>
                          <p className="text-green-400">💵 Type: {selectedPreset.is_free ? 'FREE' : 'PAID'}</p>
                        </div>
                      </div>
                      <p className="text-green-300 text-sm italic">{selectedPreset.description_template}</p>
                    </div>
                  )}
                </>
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
                maxLength={200}
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
                maxLength={1000}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Rules (one per line)</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({...formData, rules: e.target.value})}
                placeholder="No cheating&#10;No hacking&#10;Respectful behavior"
                rows={5}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 font-mono text-sm"
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
                    step="0.01"
                    min="0"
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
                    step="0.01"
                    min="0"
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
              </select>
            </div>
          </div>
        </div>

        {/* Room Details */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-2">🎮 Room Details (Optional)</h2>
          <p className="text-discord-text text-sm mb-4">Can be added now or later via Edit</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Room ID</label>
              <input
                type="text"
                value={formData.room_id}
                onChange={(e) => setFormData({...formData, room_id: e.target.value})}
                placeholder="123456789"
                maxLength={50}
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
                maxLength={50}
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
            disabled={creating}
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
          >
            <FaCheckCircle />
            {creating ? 'Creating Tournament...' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
