'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  FaBolt, FaPlus, FaEdit, FaTrash,
  FaToggleOn, FaToggleOff, FaArrowLeft, FaSave
} from 'react-icons/fa';

const DIFF_STYLES = {
  easy:   { color:'text-green-400',  bg:'bg-green-900',  border:'border-green-700',  badge:'bg-green-900 border-green-600 text-green-300'  },
  medium: { color:'text-yellow-400', bg:'bg-yellow-900', border:'border-yellow-700', badge:'bg-yellow-900 border-yellow-600 text-yellow-300' },
  hard:   { color:'text-red-400',    bg:'bg-red-900',    border:'border-red-700',    badge:'bg-red-900 border-red-600 text-red-300'          },
};

const MISSION_TYPES = [
  'login', 'earn_xp', 'earn_season_xp', 'join_tournament',
  'win_tournament', 'claim_achievement', 'visit_profile', 'read_notifications'
];

const REWARD_TYPES = ['coins','gems','xp','voucher_20','voucher_30','voucher_50'];

const EMPTY_FORM = {
  title:'', description:'', mission_type:'join_tournament',
  target_value:1, reward_type:'coins', reward_amount:100,
  season_xp_reward:40, difficulty:'medium', icon:'🎯', is_active:true
};

export default function AdminMissionsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterDiff, setFilterDiff] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('mission_templates').select('*')
        .order('difficulty').order('id');
      setTemplates(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({
      title: t.title, description: t.description || '',
      mission_type: t.mission_type, target_value: t.target_value,
      reward_type: t.reward_type, reward_amount: t.reward_amount,
      season_xp_reward: t.season_xp_reward, difficulty: t.difficulty,
      icon: t.icon || '🎯', is_active: t.is_active
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('❌ Title required', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        mission_type: form.mission_type,
        target_value: parseInt(form.target_value),
        reward_type: form.reward_type,
        reward_amount: parseInt(form.reward_amount),
        season_xp_reward: parseInt(form.season_xp_reward),
        difficulty: form.difficulty,
        icon: form.icon || '🎯',
        is_active: form.is_active
      };

      if (editingId) {
        const { error } = await supabase.from('mission_templates')
          .update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('✅ Mission updated');
      } else {
        const { error } = await supabase.from('mission_templates').insert(payload);
        if (error) throw error;
        showToast('✅ Mission created');
      }
      setShowForm(false);
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (t) => {
    try {
      const { error } = await supabase.from('mission_templates')
        .update({ is_active: !t.is_active }).eq('id', t.id);
      if (error) throw error;
      showToast(`${!t.is_active ? '✅ Enabled' : '⏸️ Disabled'}: ${t.title}`);
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete mission "${t.title}"?\n\nThis cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('mission_templates').delete().eq('id', t.id);
      if (error) throw error;
      showToast('✅ Mission deleted');
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
  };

  const filtered = filterDiff === 'all'
    ? templates
    : templates.filter(t => t.difficulty === filterDiff);

  const counts = {
    easy:   templates.filter(t => t.difficulty === 'easy').length,
    medium: templates.filter(t => t.difficulty === 'medium').length,
    hard:   templates.filter(t => t.difficulty === 'hard').length,
  };

  return (
    <div className="min-h-screen bg-discord-darkest p-4">
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl font-bold text-white text-sm text-center shadow-lg ${toast.type==='error'?'bg-red-600':'bg-green-600'}`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/admin/seasons')}
            className="p-2 bg-discord-dark border border-gray-700 rounded-lg text-white hover:border-purple-600">
            <FaArrowLeft size={14} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FaBolt className="text-yellow-400" /> Mission Templates
            </h1>
            <p className="text-discord-text text-xs">
              {templates.length} total · {templates.filter(t => t.is_active).length} active
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold">
            <FaPlus /> New Mission
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {['easy','medium','hard'].map(d => {
            const s = DIFF_STYLES[d];
            return (
              <div key={d} className={`rounded-xl border ${s.border} ${s.bg} bg-opacity-20 p-3 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{counts[d]}</p>
                <p className={`text-xs font-bold capitalize ${s.color}`}>{d}</p>
              </div>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['all','easy','medium','hard'].map(f => (
            <button key={f} onClick={() => setFilterDiff(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                filterDiff===f ? 'bg-purple-600 border-purple-500 text-white' : 'bg-discord-dark border-gray-700 text-gray-400'
              }`}>{f}</button>
          ))}
        </div>

        {/* Mission list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => {
              const s = DIFF_STYLES[t.difficulty];
              return (
                <div key={t.id} className={`bg-discord-dark border rounded-xl p-3 ${
                  t.is_active ? 'border-gray-700' : 'border-gray-800 opacity-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${s.bg} bg-opacity-30`}>
                      {t.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className={`font-bold text-sm ${t.is_active ? 'text-white' : 'text-gray-500'}`}>{t.title}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${s.badge}`}>{t.difficulty}</span>
                        {!t.is_active && <span className="text-xs text-gray-600 border border-gray-700 px-1.5 py-0.5 rounded">disabled</span>}
                      </div>
                      {t.description && <p className="text-xs text-gray-500 mb-1">{t.description}</p>}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="text-blue-400">📋 {t.mission_type.replace(/_/g,' ')}</span>
                        <span className="text-gray-400">Target: {t.target_value}</span>
                        <span className="text-yellow-400">
                          Reward: {t.reward_amount} {t.reward_type.replace(/_/g,' ')}
                        </span>
                        <span className="text-orange-400">+{t.season_xp_reward} Season XP</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => handleToggle(t)} title={t.is_active ? 'Disable' : 'Enable'}>
                        {t.is_active
                          ? <FaToggleOn className="text-green-400 text-xl" />
                          : <FaToggleOff className="text-gray-600 text-xl" />
                        }
                      </button>
                      <button onClick={() => openEdit(t)}
                        className="p-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded text-xs">
                        <FaEdit size={11} />
                      </button>
                      <button onClick={() => handleDelete(t)}
                        className="p-1.5 bg-red-900 hover:bg-red-800 text-white rounded text-xs">
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-discord-dark border border-purple-600 rounded-xl max-w-md w-full p-5 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">
                {editingId ? '✏️ Edit Mission' : '➕ New Mission'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {['easy','medium','hard'].map(d => (
                  <button key={d} onClick={() => setForm(f => ({...f, difficulty:d}))}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all capitalize ${
                      form.difficulty===d ? `${DIFF_STYLES[d].bg} bg-opacity-60 ${DIFF_STYLES[d].border} ${DIFF_STYLES[d].color}` : 'bg-discord-darkest border-gray-700 text-gray-400'
                    }`}>{d}</button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="text-xs text-gray-400 block mb-1">Icon</label>
                  <input value={form.icon} onChange={e => setForm(f => ({...f, icon:e.target.value}))}
                    className="w-full px-2 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-center text-lg" />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-gray-400 block mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" placeholder="Mission title" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" placeholder="Short description" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Mission Type</label>
                  <select value={form.mission_type} onChange={e => setForm(f => ({...f, mission_type:e.target.value}))}
                    className="w-full px-2 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-xs">
                    {MISSION_TYPES.map(m => <option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Target Value</label>
                  <input type="number" min="1" value={form.target_value}
                    onChange={e => setForm(f => ({...f, target_value:e.target.value}))}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Reward Type</label>
                  <select value={form.reward_type} onChange={e => setForm(f => ({...f, reward_type:e.target.value}))}
                    className="w-full px-2 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-xs">
                    {REWARD_TYPES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Reward Amount</label>
                  <input type="number" min="1" value={form.reward_amount}
                    onChange={e => setForm(f => ({...f, reward_amount:e.target.value}))}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Season XP Reward</label>
                <input type="number" min="0" value={form.season_xp_reward}
                  onChange={e => setForm(f => ({...f, season_xp_reward:e.target.value}))}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-400">Active (assignable to users)</label>
                <button onClick={() => setForm(f => ({...f, is_active:!f.is_active}))}>
                  {form.is_active
                    ? <FaToggleOn className="text-green-400 text-2xl" />
                    : <FaToggleOff className="text-gray-600 text-2xl" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                <FaSave size={12} /> {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
