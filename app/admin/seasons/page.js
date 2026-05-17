'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatISTDate, getTimeLeft } from '@/lib/timeUtils';
import {
  FaFire, FaPlus, FaPlay, FaStop, FaUndo,
  FaChartBar, FaEdit, FaCalendarAlt, FaCopy,
  FaCheckCircle, FaClock, FaArchive
} from 'react-icons/fa';

const STATUS_STYLE = {
  active:   { label:'Active',   color:'text-green-400',  bg:'bg-green-900',  border:'border-green-600',  dot:'bg-green-400'  },
  upcoming: { label:'Upcoming', color:'text-yellow-400', bg:'bg-yellow-900', border:'border-yellow-600', dot:'bg-yellow-400' },
  ended:    { label:'Ended',    color:'text-gray-400',   bg:'bg-gray-800',   border:'border-gray-600',   dot:'bg-gray-500'   },
};

const getStatus = (s) => {
  if (s.is_active) return 'active';
  const now = new Date();
  if (new Date(s.start_date) > now) return 'upcoming';
  return 'ended';
};

const EMPTY_FORM = {
  name:'', description:'', start_date:'', end_date:'',
  premium_cost_coins:600, elite_cost_gems:150,
  premium_badge_name:'', premium_badge_icon:'💎',
  warrior_badge_name:'', warrior_badge_icon:'⚔️',
  premium_badge_color:'yellow', warrior_badge_color:'purple',
  banner_color:'#dc2626'
};

export default function AdminSeasonsPage() {
  const router = useRouter();
  const [seasons, setSeasons] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('seasons').select('*')
        .order('created_at', { ascending: false });
      setSeasons(data || []);

      // Load analytics for each season
      const analyticsMap = {};
      for (const s of (data || [])) {
        const { data: a } = await supabase.rpc('get_season_analytics', { p_season_id: s.id });
        analyticsMap[s.id] = a;
      }
      setAnalytics(analyticsMap);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      showToast('❌ Name, start date and end date are required', 'error'); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('seasons').insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        is_active: false,
        max_tiers: 90,
        premium_cost_coins: parseInt(form.premium_cost_coins),
        elite_cost_gems: parseInt(form.elite_cost_gems),
        premium_badge_name: form.premium_badge_name || form.name + ' Premium',
        premium_badge_icon: form.premium_badge_icon,
        warrior_badge_name: form.warrior_badge_name || form.name + ' Warrior',
        warrior_badge_icon: form.warrior_badge_icon,
        premium_badge_color: form.premium_badge_color,
        warrior_badge_color: form.warrior_badge_color,
        banner_color: form.banner_color
      });
      if (error) throw error;
      showToast('✅ Season created! Add rewards then launch it.');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleLaunch = async (id, name) => {
    const active = seasons.find(s => s.is_active);
    const msg = active
      ? `Launch "${name}"?\n\nThis will END the current season "${active.name}" first.`
      : `Launch "${name}"?\n\nThis will make it the active season.`;
    if (!confirm(msg)) return;
    setActionId(id);
    try {
      const { data, error } = await supabase.rpc('launch_season', { p_season_id: id });
      if (error) throw error;
      showToast(`✅ "${name}" is now live!`);
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setActionId(null); }
  };

  const handleEnd = async (id, name) => {
    if (!confirm(`End season "${name}" early?\n\nAll enrolled users will be notified.`)) return;
    setActionId(id);
    try {
      const { data, error } = await supabase.rpc('end_season', { p_season_id: id });
      if (error) throw error;
      showToast(`✅ Season "${name}" ended. Users notified.`);
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setActionId(null); }
  };

  const handleRollback = async (id, name) => {
    if (!confirm(`Rollback "${name}"?\n\nThis deactivates the season without notifying users.`)) return;
    setActionId(id);
    try {
      const { error } = await supabase.from('seasons')
        .update({ is_active: false }).eq('id', id);
      if (error) throw error;
      showToast(`✅ Season "${name}" rolled back.`);
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setActionId(null); }
  };

  const handleDuplicate = async (season) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('seasons').insert({
        name: season.name + ' (Copy)',
        description: season.description,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 86400000).toISOString(),
        is_active: false,
        max_tiers: season.max_tiers,
        premium_cost_coins: season.premium_cost_coins,
        elite_cost_gems: season.elite_cost_gems,
        premium_badge_name: season.premium_badge_name,
        premium_badge_icon: season.premium_badge_icon,
        warrior_badge_name: season.warrior_badge_name,
        warrior_badge_icon: season.warrior_badge_icon,
        premium_badge_color: season.premium_badge_color,
        warrior_badge_color: season.warrior_badge_color,
        banner_color: season.banner_color
      });
      if (error) throw error;
      showToast('✅ Season duplicated! Edit rewards then launch.');
      load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaFire className="text-2xl text-orange-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Season Management</h1>
              <p className="text-discord-text text-sm">Create, launch and manage seasons</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm">
            <FaPlus /> New Season
          </button>
        </div>

        {/* Quick nav to sub-pages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {[
            { label:'Mission Templates', icon:'🎯', path:'/admin/seasons/missions' },
            { label:'Streak Config',     icon:'🔥', path:'/admin/seasons/streaks'  },
            { label:'Active Season',     icon:'⚔️', path: seasons.find(s=>s.is_active) ? `/admin/seasons/${seasons.find(s=>s.is_active)?.id}` : '#' },
            { label:'Analytics',         icon:'📊', path:'#' },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.path)}
              className="flex items-center gap-2 px-3 py-2 bg-discord-dark border border-gray-700 hover:border-purple-600 text-white rounded-lg text-sm transition-all">
              <span>{item.icon}</span>
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Season list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : seasons.length === 0 ? (
          <div className="text-center py-12 bg-discord-dark border border-gray-800 rounded-xl">
            <FaFire className="text-4xl text-gray-600 mx-auto mb-3" />
            <p className="text-white font-bold mb-2">No seasons yet</p>
            <p className="text-discord-text text-sm">Click "New Season" to create your first one</p>
          </div>
        ) : (
          <div className="space-y-4">
            {seasons.map(season => {
              const status = getStatus(season);
              const style = STATUS_STYLE[status];
              const a = analytics[season.id] || {};
              const isProcessing = actionId === season.id;

              return (
                <div key={season.id} className={`bg-discord-dark border ${style.border} rounded-xl p-4`}>
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title + status */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-white font-bold text-lg">{season.name}</h2>
                        <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.color} font-bold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} inline-block`}></span>
                          {style.label}
                        </span>
                      </div>
                      {season.description && (
                        <p className="text-discord-text text-sm mb-2">{season.description}</p>
                      )}
                      {/* Dates */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt size={10} /> Start: {formatISTDate(season.start_date, false)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaClock size={10} /> End: {formatISTDate(season.end_date, false)}
                        </span>
                        {status === 'active' && (
                          <span className="text-orange-400 font-bold">
                            {getTimeLeft(season.end_date)}
                          </span>
                        )}
                      </div>
                      {/* Analytics row */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="text-blue-400">👥 {a.total_enrolled || 0} enrolled</span>
                        <span className="text-gray-400">🆓 {a.free_pass || 0} free</span>
                        <span className="text-yellow-400">💎 {a.premium_pass || 0} premium</span>
                        <span className="text-purple-400">⚔️ {a.warrior_pass || 0} warrior</span>
                        <span className="text-green-400">📈 Avg tier: {a.avg_tier || 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <button onClick={() => router.push(`/admin/seasons/${season.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold">
                        <FaEdit size={10} /> Edit
                      </button>

                      {status !== 'active' && (
                        <button onClick={() => handleLaunch(season.id, season.name)} disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
                          <FaPlay size={10} /> {isProcessing ? '...' : 'Launch'}
                        </button>
                      )}

                      {status === 'active' && (
                        <>
                          <button onClick={() => handleEnd(season.id, season.name)} disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
                            <FaStop size={10} /> {isProcessing ? '...' : 'End'}
                          </button>
                          <button onClick={() => handleRollback(season.id, season.name)} disabled={isProcessing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-700 hover:bg-orange-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
                            <FaUndo size={10} /> Rollback
                          </button>
                        </>
                      )}

                      <button onClick={() => handleDuplicate(season)} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold">
                        <FaCopy size={10} /> Copy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Season Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-discord-dark border border-purple-600 rounded-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus className="text-purple-400" /> Create New Season
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Season Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm"
                  placeholder="e.g. Season 2: Thunder Strike" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm"
                  rows={2} placeholder="Short season description" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Start Date *</label>
                  <input type="datetime-local" value={form.start_date}
                    onChange={e => setForm({...form, start_date: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">End Date *</label>
                  <input type="datetime-local" value={form.end_date}
                    onChange={e => setForm({...form, end_date: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">💎 Premium Pass Cost (coins)</label>
                  <input type="number" value={form.premium_cost_coins}
                    onChange={e => setForm({...form, premium_cost_coins: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">⚔️ Warrior Pass Cost (gems)</label>
                  <input type="number" value={form.elite_cost_gems}
                    onChange={e => setForm({...form, elite_cost_gems: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">💎 Premium Badge Name</label>
                  <input value={form.premium_badge_name}
                    onChange={e => setForm({...form, premium_badge_name: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm"
                    placeholder="e.g. Thunder Premium" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">⚔️ Warrior Badge Name</label>
                  <input value={form.warrior_badge_name}
                    onChange={e => setForm({...form, warrior_badge_name: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm"
                    placeholder="e.g. Thunder Warrior" />
                </div>
              </div>
              <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-400 text-xs">💡 After creating, go to Edit → add tier rewards → then Launch when ready.</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-bold text-sm">
                {saving ? 'Creating...' : '✅ Create Season'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
