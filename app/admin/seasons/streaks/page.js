'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  FaFire, FaPlus, FaEdit, FaTrash,
  FaSave, FaArrowLeft, FaStar, FaCoins, FaGem, FaTicketAlt
} from 'react-icons/fa';

const REWARD_TYPES = [
  { value:'coins',      label:'Coins',      icon:'🪙' },
  { value:'gems',       label:'Gems',       icon:'💎' },
  { value:'voucher_20', label:'₹20 Voucher',icon:'🎫' },
  { value:'voucher_30', label:'₹30 Voucher',icon:'🎫' },
  { value:'voucher_50', label:'₹50 Voucher',icon:'🎟️' },
  { value:'xp',         label:'XP',         icon:'⭐' },
];

const EMPTY_FORM = { streak_day: '', reward_type: 'coins', reward_amount: 100, label: '', icon: '🪙', is_milestone: true };

export default function AdminStreaksPage() {
  const router = useRouter();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('streak_reward_config').select('*')
        .order('streak_day');
      setMilestones(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      streak_day: m.streak_day,
      reward_type: m.reward_type,
      reward_amount: m.reward_amount,
      label: m.label || '',
      icon: m.icon || '🎁',
      is_milestone: m.is_milestone
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.streak_day || form.streak_day < 1) {
      showToast('❌ Streak day must be 1 or more', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        streak_day: parseInt(form.streak_day),
        reward_type: form.reward_type,
        reward_amount: parseInt(form.reward_amount),
        label: form.label.trim() || null,
        icon: form.icon || '🎁',
        is_milestone: form.is_milestone
      };
      if (editingId) {
        const { error } = await supabase.from('streak_reward_config')
          .update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('✅ Milestone updated');
      } else {
        const { error } = await supabase.from('streak_reward_config').insert(payload);
        if (error) throw error;
        showToast('✅ Milestone added');
      }
      setShowForm(false);
      load();
    } catch (e) {
      showToast(`❌ ${e.message.includes('unique') ? `Day ${form.streak_day} already exists` : e.message}`, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (m) => {
    if (!confirm(`Remove Day ${m.streak_day} milestone?`)) return;
    try {
      const { error } = await supabase.from('streak_reward_config').delete().eq('id', m.id);
      if (error) throw error;
      showToast('✅ Milestone removed');
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
  };

  const onTypeChange = (type) => {
    const rt = REWARD_TYPES.find(r => r.value === type);
    setForm(f => ({ ...f, reward_type: type, icon: rt?.icon || '🎁' }));
  };

  const isMilestones = milestones.filter(m => m.is_milestone);
  const isRegular = milestones.filter(m => !m.is_milestone);

  return (
    <div className="min-h-screen bg-discord-darkest p-4">
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl font-bold text-white text-sm text-center shadow-lg ${toast.type==='error'?'bg-red-600':'bg-green-600'}`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/admin/seasons')}
            className="p-2 bg-discord-dark border border-gray-700 rounded-lg text-white hover:border-purple-600">
            <FaArrowLeft size={14} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FaFire className="text-orange-400" /> Streak Reward Config
            </h1>
            <p className="text-discord-text text-xs">Configure daily login streak rewards</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold">
            <FaPlus /> Add Milestone
          </button>
        </div>

        {/* Daily formula info */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-5">
          <h3 className="text-white font-bold mb-2 text-sm flex items-center gap-2">
            <FaStar className="text-yellow-400" size={13} /> Default Daily Reward Formula
          </h3>
          <div className="space-y-1 text-xs text-gray-400">
            <p>• <span className="text-white">Every 7 days:</span> Gems = 5 + (streak ÷ 7)</p>
            <p>• <span className="text-white">Every 3rd day:</span> Coins = 50 + streak × 2</p>
            <p>• <span className="text-white">All other days:</span> Coins = 30 + streak × 3</p>
            <p>• <span className="text-orange-400">Milestone days override these formulas</span></p>
          </div>
          <div className="mt-3 bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-2">
            <p className="text-blue-400 text-xs">
              💡 Add milestones for specific days (e.g. Day 7, 14, 30). They take priority over the formula above.
            </p>
          </div>
        </div>

        {/* Milestone rewards */}
        <div className="mb-5">
          <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
            🏆 Milestone Rewards
            <span className="text-xs text-gray-500 font-normal">({isMilestones.length})</span>
          </h3>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : isMilestones.length === 0 ? (
            <div className="text-center py-6 bg-discord-dark border border-gray-800 rounded-xl">
              <p className="text-gray-500 text-sm">No milestones. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {isMilestones.map(m => (
                <div key={m.id} className="bg-discord-dark border border-yellow-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-900 bg-opacity-40 flex items-center justify-center text-2xl flex-shrink-0">
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-yellow-400 font-bold text-sm">Day {m.streak_day}</span>
                      <span className="text-xs bg-yellow-900 text-yellow-300 border border-yellow-700 px-1.5 py-0.5 rounded">Milestone</span>
                    </div>
                    <p className="text-white text-sm">{m.reward_amount} {m.reward_type.replace(/_/g,' ')}</p>
                    {m.label && <p className="text-gray-500 text-xs">{m.label}</p>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(m)}
                      className="p-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded text-xs">
                      <FaEdit size={11} />
                    </button>
                    <button onClick={() => handleDelete(m)}
                      className="p-1.5 bg-red-900 hover:bg-red-800 text-white rounded text-xs">
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3 text-sm">📅 Reward Preview (Days 1–30)</h3>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const milestone = milestones.find(m => m.streak_day === day && m.is_milestone);
              return (
                <div key={day} className={`rounded-lg p-1.5 text-center border text-xs ${
                  milestone
                    ? 'bg-yellow-900 bg-opacity-30 border-yellow-700'
                    : day % 7 === 0 ? 'bg-purple-900 bg-opacity-20 border-purple-800'
                    : day % 3 === 0 ? 'bg-blue-900 bg-opacity-20 border-blue-900'
                    : 'bg-discord-darkest border-gray-800'
                }`}>
                  <p className={`font-bold ${milestone ? 'text-yellow-400' : day % 7 === 0 ? 'text-purple-400' : 'text-gray-400'}`}>
                    {day}
                  </p>
                  {milestone && <p className="text-yellow-300" style={{fontSize:'9px'}}>{milestone.icon}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-800 inline-block"></span> Milestone</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-800 inline-block"></span> Weekly gems</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-900 inline-block"></span> 3-day bonus</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark border border-purple-600 rounded-xl max-w-sm w-full p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">{editingId ? 'Edit Milestone' : 'Add Milestone'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Streak Day *</label>
                <input type="number" min="1" value={form.streak_day}
                  onChange={e => setForm(f => ({...f, streak_day: e.target.value}))}
                  disabled={!!editingId}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm disabled:opacity-50"
                  placeholder="e.g. 7" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Reward Type</label>
                  <select value={form.reward_type} onChange={e => onTypeChange(e.target.value)}
                    className="w-full px-2 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm">
                    {REWARD_TYPES.map(r => (
                      <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Amount</label>
                  <input type="number" min="1" value={form.reward_amount}
                    onChange={e => setForm(f => ({...f, reward_amount: e.target.value}))}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Icon</label>
                  <input value={form.icon} onChange={e => setForm(f => ({...f, icon: e.target.value}))}
                    className="w-full px-2 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-center text-lg" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">Label (optional)</label>
                  <input value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm"
                    placeholder="e.g. 7-Day Champion!" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5">
                <FaSave size={12} /> {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
