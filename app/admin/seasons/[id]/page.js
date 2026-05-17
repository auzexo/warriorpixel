'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatISTDate } from '@/lib/timeUtils';
import {
  FaEdit, FaSave, FaTimes, FaArrowLeft,
  FaChevronLeft, FaChevronRight, FaFire,
  FaCoins, FaGem, FaTicketAlt, FaStar, FaCrown
} from 'react-icons/fa';

const REWARD_TYPES = [
  { value:'coins',      label:'Coins',        icon:'🪙' },
  { value:'gems',       label:'Gems',          icon:'💎' },
  { value:'xp',         label:'XP',            icon:'⭐' },
  { value:'voucher_20', label:'₹20 Voucher',   icon:'🎫' },
  { value:'voucher_30', label:'₹30 Voucher',   icon:'🎫' },
  { value:'voucher_50', label:'₹50 Voucher',   icon:'🎟️' },
  { value:'badge',      label:'Badge',         icon:'👑' },
  { value:'ticket',     label:'Ticket',        icon:'🎮' },
];

const BADGE_COLORS = ['orange','purple','yellow','blue','red','green','pink','cyan'];

export default function AdminSeasonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = parseInt(params.id);

  const [season, setSeason] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingReward, setEditingReward] = useState(null); // { tier, pass_type }
  const [rewardForm, setRewardForm] = useState({});
  const [infoForm, setInfoForm] = useState({});
  const [showInfoEdit, setShowInfoEdit] = useState(false);
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState(null);
  const [filterPass, setFilterPass] = useState('all');

  const TIERS_PER_PAGE = 10;

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.from('seasons').select('*').eq('id', seasonId).single();
      setSeason(s);
      setInfoForm({
        name: s.name,
        description: s.description || '',
        start_date: s.start_date?.slice(0,16) || '',
        end_date: s.end_date?.slice(0,16) || '',
        premium_cost_coins: s.premium_cost_coins,
        elite_cost_gems: s.elite_cost_gems,
        premium_badge_name: s.premium_badge_name || '',
        premium_badge_icon: s.premium_badge_icon || '💎',
        premium_badge_color: s.premium_badge_color || 'yellow',
        warrior_badge_name: s.warrior_badge_name || '',
        warrior_badge_icon: s.warrior_badge_icon || '⚔️',
        warrior_badge_color: s.warrior_badge_color || 'purple',
        banner_color: s.banner_color || '#dc2626',
      });

      const { data: r } = await supabase
        .from('season_rewards').select('*')
        .eq('season_id', seasonId).order('tier').order('pass_type');
      setRewards(r || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [seasonId]);

  const getReward = (tier, pt) =>
    rewards.find(r => r.tier === tier && r.pass_type === pt);

  const handleEditReward = (tier, pt) => {
    const rw = getReward(tier, pt);
    setEditingReward({ tier, pass_type: pt });
    setRewardForm(rw ? {
      reward_type: rw.reward_type,
      reward_amount: rw.reward_amount,
      reward_label: rw.reward_label,
      icon: rw.icon || REWARD_TYPES.find(r=>r.value===rw.reward_type)?.icon || '🎁',
    } : {
      reward_type: 'coins', reward_amount: 50,
      reward_label: '50 Coins', icon: '🪙'
    });
  };

  const handleSaveReward = async () => {
    if (!editingReward) return;
    setSaving(true);
    try {
      const existing = getReward(editingReward.tier, editingReward.pass_type);
      if (existing) {
        const { error } = await supabase.from('season_rewards').update({
          reward_type: rewardForm.reward_type,
          reward_amount: parseInt(rewardForm.reward_amount),
          reward_label: rewardForm.reward_label,
          icon: rewardForm.icon,
        }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('season_rewards').insert({
          season_id: seasonId,
          tier: editingReward.tier,
          pass_type: editingReward.pass_type,
          reward_type: rewardForm.reward_type,
          reward_amount: parseInt(rewardForm.reward_amount),
          reward_label: rewardForm.reward_label,
          icon: rewardForm.icon,
        });
        if (error) throw error;
      }
      showToast(`✅ Tier ${editingReward.tier} ${editingReward.pass_type} reward saved`);
      setEditingReward(null);
      await load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('seasons').update({
        name: infoForm.name,
        description: infoForm.description,
        start_date: new Date(infoForm.start_date).toISOString(),
        end_date: new Date(infoForm.end_date).toISOString(),
        premium_cost_coins: parseInt(infoForm.premium_cost_coins),
        elite_cost_gems: parseInt(infoForm.elite_cost_gems),
        premium_badge_name: infoForm.premium_badge_name,
        premium_badge_icon: infoForm.premium_badge_icon,
        premium_badge_color: infoForm.premium_badge_color,
        warrior_badge_name: infoForm.warrior_badge_name,
        warrior_badge_icon: infoForm.warrior_badge_icon,
        warrior_badge_color: infoForm.warrior_badge_color,
        banner_color: infoForm.banner_color,
      }).eq('id', seasonId);
      if (error) throw error;
      showToast('✅ Season info saved');
      setShowInfoEdit(false);
      await load();
    } catch (e) { showToast(`❌ ${e.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const onRewardTypeChange = (type) => {
    const rt = REWARD_TYPES.find(r => r.value === type);
    setRewardForm(f => ({
      ...f,
      reward_type: type,
      icon: rt?.icon || '🎁',
      reward_label: f.reward_amount + ' ' + (rt?.label || type)
    }));
  };

  const totalPages = season ? Math.ceil(season.max_tiers / TIERS_PER_PAGE) : 1;
  const pageTiers = season
    ? Array.from({ length: TIERS_PER_PAGE }, (_, i) => page * TIERS_PER_PAGE + i + 1)
        .filter(t => t <= season.max_tiers)
    : [];

  const PASS_TYPES = filterPass === 'all'
    ? ['free','premium','warrior']
    : [filterPass];

  if (loading) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
    </div>
  );

  if (!season) return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
      <p className="text-white">Season not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-discord-darkest p-4">
      {toast && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl font-bold text-white text-sm text-center shadow-lg ${toast.type==='error'?'bg-red-600':'bg-green-600'}`}>
          {toast.text}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/admin/seasons')}
            className="p-2 bg-discord-dark border border-gray-700 rounded-lg text-white hover:border-purple-600">
            <FaArrowLeft size={14} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{season.name}</h1>
            <p className="text-discord-text text-xs">
              {formatISTDate(season.start_date, false)} → {formatISTDate(season.end_date, false)}
              {season.is_active && <span className="ml-2 text-green-400 font-bold">● ACTIVE</span>}
            </p>
          </div>
          <button onClick={() => setShowInfoEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-bold">
            <FaEdit size={12} /> Edit Info
          </button>
        </div>

        {/* Season info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label:'Premium Cost', val:`${season.premium_cost_coins} 🪙`, color:'text-yellow-400' },
            { label:'Warrior Cost', val:`${season.elite_cost_gems} 💎`,    color:'text-purple-400' },
            { label:'Total Tiers',  val:`${season.max_tiers}`,              color:'text-blue-400'   },
            { label:'Total Rewards',val:`${rewards.length}`,               color:'text-green-400'  },
          ].map(c => (
            <div key={c.label} className="bg-discord-dark border border-gray-800 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${c.color}`}>{c.val}</p>
              <p className="text-xs text-discord-text">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Badges preview */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
            <FaCrown className="text-yellow-400" /> Season Badges
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-yellow-600 bg-yellow-900 bg-opacity-30">
              <span className="text-xl">{season.premium_badge_icon}</span>
              <div>
                <p className="text-yellow-300 text-sm font-bold">{season.premium_badge_name}</p>
                <p className="text-xs text-gray-500">💎 Premium Pass</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-500 bg-purple-900 bg-opacity-30">
              <span className="text-xl">{season.warrior_badge_icon}</span>
              <div>
                <p className="text-purple-300 text-sm font-bold">{season.warrior_badge_name}</p>
                <p className="text-xs text-gray-500">⚔️ Warrior Pass</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Editor */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <FaFire className="text-orange-400" /> Tier Rewards Editor
            </h3>
            {/* Filter */}
            <div className="flex gap-1">
              {['all','free','premium','warrior'].map(f => (
                <button key={f} onClick={() => setFilterPass(f)}
                  className={`px-2 py-1 rounded text-xs font-bold border transition-all ${
                    filterPass===f ? 'bg-purple-600 border-purple-500 text-white' : 'bg-discord-darkest border-gray-700 text-gray-400'
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          {/* Tier navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
              className="p-1.5 bg-discord-darkest border border-gray-700 rounded disabled:opacity-30 text-white">
              <FaChevronLeft size={12} />
            </button>
            <span className="text-white text-sm font-bold">
              Tiers {page*TIERS_PER_PAGE+1}–{Math.min((page+1)*TIERS_PER_PAGE, season.max_tiers)}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page>=totalPages-1}
              className="p-1.5 bg-discord-darkest border border-gray-700 rounded disabled:opacity-30 text-white">
              <FaChevronRight size={12} />
            </button>
          </div>

          {/* Rewards table */}
          <div className="space-y-1.5">
            {/* Header */}
            <div className={`grid gap-1.5 text-xs text-gray-400 font-bold px-2 ${PASS_TYPES.length===3?'grid-cols-4':'grid-cols-2'}`}>
              <span>Tier</span>
              {PASS_TYPES.map(pt => <span key={pt} className="capitalize">{pt}</span>)}
            </div>

            {pageTiers.map(tier => (
              <div key={tier} className={`grid gap-1.5 items-center ${PASS_TYPES.length===3?'grid-cols-4':'grid-cols-2'}`}>
                <span className="text-gray-400 text-xs font-bold px-2">T{tier}</span>
                {PASS_TYPES.map(pt => {
                  const rw = getReward(tier, pt);
                  return (
                    <button key={pt} onClick={() => handleEditReward(tier, pt)}
                      className={`text-left px-2 py-1.5 rounded-lg border text-xs transition-all hover:border-purple-500 ${
                        rw ? 'bg-discord-darkest border-gray-700 text-white' : 'bg-discord-darkest border-dashed border-gray-700 text-gray-600'
                      }`}>
                      {rw ? (
                        <span>{rw.icon} {rw.reward_label}</span>
                      ) : (
                        <span>+ Add reward</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Reward Modal */}
      {editingReward && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark border border-purple-600 rounded-xl max-w-sm w-full p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">
                Tier {editingReward.tier} — {editingReward.pass_type}
              </h3>
              <button onClick={() => setEditingReward(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Reward Type</label>
                <select value={rewardForm.reward_type} onChange={e => onRewardTypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm">
                  {REWARD_TYPES.map(r => (
                    <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Amount</label>
                <input type="number" value={rewardForm.reward_amount}
                  onChange={e => setRewardForm(f => ({...f, reward_amount: e.target.value, reward_label: e.target.value + ' ' + (REWARD_TYPES.find(r=>r.value===f.reward_type)?.label||f.reward_type)}))}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Label (shown to users)</label>
                <input value={rewardForm.reward_label}
                  onChange={e => setRewardForm(f => ({...f, reward_label: e.target.value}))}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm"
                  placeholder="e.g. 100 Coins" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Icon (emoji)</label>
                <input value={rewardForm.icon}
                  onChange={e => setRewardForm(f => ({...f, icon: e.target.value}))}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm"
                  placeholder="🎁" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditingReward(null)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold">Cancel</button>
              <button onClick={handleSaveReward} disabled={saving}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-bold">
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Info Modal */}
      {showInfoEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-discord-dark border border-purple-600 rounded-xl max-w-lg w-full p-5 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">Edit Season Info</h3>
              <button onClick={() => setShowInfoEdit(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Season Name</label>
                <input value={infoForm.name} onChange={e => setInfoForm({...infoForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea value={infoForm.description} onChange={e => setInfoForm({...infoForm, description: e.target.value})}
                  className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                  <input type="datetime-local" value={infoForm.start_date}
                    onChange={e => setInfoForm({...infoForm, start_date: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">End Date</label>
                  <input type="datetime-local" value={infoForm.end_date}
                    onChange={e => setInfoForm({...infoForm, end_date: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">💎 Premium Cost (coins)</label>
                  <input type="number" value={infoForm.premium_cost_coins}
                    onChange={e => setInfoForm({...infoForm, premium_cost_coins: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">⚔️ Warrior Cost (gems)</label>
                  <input type="number" value={infoForm.elite_cost_gems}
                    onChange={e => setInfoForm({...infoForm, elite_cost_gems: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">💎 Premium Badge</label>
                  <input value={infoForm.premium_badge_name}
                    onChange={e => setInfoForm({...infoForm, premium_badge_name: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" placeholder="Badge name" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">⚔️ Warrior Badge</label>
                  <input value={infoForm.warrior_badge_name}
                    onChange={e => setInfoForm({...infoForm, warrior_badge_name: e.target.value})}
                    className="w-full px-3 py-2 bg-discord-darkest border border-gray-700 text-white rounded-lg text-sm" placeholder="Badge name" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowInfoEdit(false)}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold">Cancel</button>
              <button onClick={handleSaveInfo} disabled={saving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold">
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
