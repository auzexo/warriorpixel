'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  FaTrophy, FaStar, FaGem, FaCrown, FaBolt,
  FaShieldAlt, FaMedal, FaSkull, FaFire, FaSync, FaUser
} from 'react-icons/fa';

// Professional gaming rank tiers with FA icons
const RANKS = [
  { level:1,  name:'Recruit',      Icon:FaShieldAlt, color:'text-gray-400',   border:'border-gray-600',   bg:'bg-gray-800',   hex:'#9ca3af' },
  { level:2,  name:'Iron',         Icon:FaShieldAlt, color:'text-stone-400',  border:'border-stone-600',  bg:'bg-stone-800',  hex:'#a8a29e' },
  { level:3,  name:'Bronze',       Icon:FaMedal,     color:'text-amber-600',  border:'border-amber-700',  bg:'bg-amber-900',  hex:'#d97706' },
  { level:4,  name:'Silver',       Icon:FaMedal,     color:'text-slate-300',  border:'border-slate-400',  bg:'bg-slate-800',  hex:'#cbd5e1' },
  { level:5,  name:'Gold',         Icon:FaTrophy,    color:'text-yellow-400', border:'border-yellow-500', bg:'bg-yellow-900', hex:'#facc15' },
  { level:6,  name:'Platinum',     Icon:FaGem,       color:'text-cyan-400',   border:'border-cyan-500',   bg:'bg-cyan-900',   hex:'#22d3ee' },
  { level:7,  name:'Diamond',      Icon:FaGem,       color:'text-blue-400',   border:'border-blue-500',   bg:'bg-blue-900',   hex:'#60a5fa' },
  { level:8,  name:'Master',       Icon:FaCrown,     color:'text-purple-400', border:'border-purple-500', bg:'bg-purple-900', hex:'#c084fc' },
  { level:9,  name:'Grandmaster',  Icon:FaCrown,     color:'text-red-400',    border:'border-red-500',    bg:'bg-red-900',    hex:'#f87171' },
  { level:10, name:'Immortal',     Icon:FaBolt,      color:'text-yellow-300', border:'border-yellow-400', bg:'bg-yellow-800', hex:'#fde047' },
];

const getRank = (level) => RANKS[Math.min((level || 1), 10) - 1];

const TABS = [
  { id:'xp',           label:'XP',      Icon:FaStar,      field:'xp',                color:'text-yellow-400' },
  { id:'wins',         label:'Wins',     Icon:FaTrophy,    field:'total_wins',         color:'text-green-400'  },
  { id:'achievements', label:'Achiev.',  Icon:FaGem,       field:'achievement_points', color:'text-purple-400' },
  { id:'level',        label:'Level',    Icon:FaFire,      field:'level',              color:'text-orange-400' },
];

const MEDALS = ['🥇','🥈','🥉'];

const fmtScore = (player, tab) => {
  const v = player[TABS.find(t=>t.id===tab)?.field] || 0;
  if (tab==='xp') return `${v.toLocaleString()} XP`;
  if (tab==='wins') return `${v} W`;
  if (tab==='achievements') return `${v} pts`;
  if (tab==='level') return `Lv.${v}`;
  return v;
};

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('xp');
  const [leaders, setLeaders] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, [tab]);

  const load = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const field = TABS.find(t=>t.id===tab)?.field;
      const { data } = await supabase
        .from('users')
        .select('id,username,level,xp,xp_to_next_level,total_wins,achievement_points')
        .order(field, { ascending: false })
        .limit(50);
      setLeaders(data || []);
      if (user && data) {
        const idx = data.findIndex(u => u.id === user.id);
        if (idx !== -1) setMyRank(idx + 1);
        else {
          const { count } = await supabase.from('users')
            .select('id', { count:'exact', head:true })
            .gt(field, profile?.[field] || 0);
          setMyRank((count||0)+1);
        }
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  return (
    <div className="min-h-screen bg-discord-darkest p-3">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FaTrophy className="text-2xl text-yellow-400" />
            <h1 className="text-xl font-bold text-white">Leaderboard</h1>
          </div>
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
            <FaSync className={refreshing ? 'animate-spin' : ''} size={12} />
            {refreshing ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Rank Tiers - horizontal scroll */}
        <div className="overflow-x-auto pb-2 mb-4">
          <div className="flex gap-1.5 min-w-max">
            {RANKS.map(r => (
              <div key={r.level} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border ${r.border} ${r.bg} bg-opacity-30`}>
                <r.Icon className={r.color} size={12} />
                <span className={`text-xs font-bold ${r.color} whitespace-nowrap`}>{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Rank Card */}
        {user && profile && (
          <div className="bg-gradient-to-r from-purple-900 to-purple-800 border border-purple-600 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center font-bold text-white">
                {profile.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{profile.username}</p>
                <div className="flex items-center gap-1.5">
                  {(() => { const r = getRank(profile.level); return <><r.Icon className={r.color} size={10} /><span className={`text-xs ${r.color}`}>{r.name}</span></>; })()}
                  <span className="text-xs text-gray-500">· Lv.{profile.level||1}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-purple-300">YOUR RANK</p>
                <p className="text-2xl font-bold text-white">{myRank ? `#${myRank}` : '—'}</p>
              </div>
            </div>
            {/* XP bar */}
            <div className="mt-2">
              <div className="w-full bg-purple-950 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-yellow-400 to-purple-400 h-full rounded-full"
                  style={{ width: `${Math.min(100, ((profile.xp||0)/(profile.xp_to_next_level||100))*100)}%` }} />
              </div>
              <p className="text-xs text-purple-400 mt-0.5 text-right">{profile.xp||0}/{profile.xp_to_next_level||100} XP</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                tab===t.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-discord-dark border-gray-700 text-gray-400 hover:border-purple-600'
              }`}>
              <t.Icon className={tab===t.id ? 'text-white' : t.color} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12">
            <FaTrophy className="text-4xl text-gray-600 mx-auto mb-3" />
            <p className="text-discord-text text-sm">No players yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {leaders.map((player, i) => {
              const pos = i + 1;
              const isMe = user?.id === player.id;
              const rank = getRank(player.level);
              return (
                <div key={player.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
                  isMe ? 'bg-purple-900 bg-opacity-40 border-purple-500' :
                  pos===1 ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' :
                  pos===2 ? 'bg-gray-700 bg-opacity-20 border-gray-600' :
                  pos===3 ? 'bg-orange-900 bg-opacity-20 border-orange-700' :
                  'bg-discord-dark border-gray-800'
                }`}>
                  {/* Position */}
                  <div className="w-8 text-center flex-shrink-0">
                    {pos <= 3 ? (
                      <span className="text-lg">{MEDALS[pos-1]}</span>
                    ) : (
                      <span className={`text-sm font-bold ${pos<=10?'text-white':'text-gray-500'}`}>#{pos}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 flex-shrink-0 ${
                    isMe ? 'bg-purple-600 border-purple-400' : `${rank.bg} bg-opacity-60 ${rank.border}`
                  }`}>
                    <span className="text-white">{player.username?.charAt(0).toUpperCase()||'?'}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isMe?'text-purple-300':'text-white'}`}>
                      {player.username}{isMe && <span className="text-purple-400 text-xs ml-1">(you)</span>}
                    </p>
                    <div className="flex items-center gap-1">
                      <rank.Icon className={rank.color} size={9} />
                      <span className={`text-xs ${rank.color}`}>{rank.name}</span>
                      <span className="text-xs text-gray-600">· Lv.{player.level||1}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`font-bold text-sm ${
                      pos===1?'text-yellow-400':pos===2?'text-gray-300':pos===3?'text-orange-400':isMe?'text-purple-300':'text-white'
                    }`}>{fmtScore(player, tab)}</p>
                    {tab!=='wins' && <p className="text-xs text-gray-600">{player.total_wins||0}W</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer stats */}
        {!loading && leaders.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { Icon:FaUser,   color:'text-blue-400',   label:'Players',  val:`${leaders.length}+` },
              { Icon:FaStar,   color:'text-yellow-400', label:'Top XP',   val:(leaders[0]?.xp||0).toLocaleString() },
              { Icon:FaTrophy, color:'text-green-400',  label:'Top Wins', val:leaders[0]?.total_wins||0 },
            ].map(({Icon,color,label,val}) => (
              <div key={label} className="bg-discord-dark border border-gray-800 rounded-lg p-2 text-center">
                <Icon className={`${color} mx-auto mb-1`} size={16} />
                <p className="text-white font-bold text-sm">{val}</p>
                <p className="text-xs text-discord-text">{label}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
