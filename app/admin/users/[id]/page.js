'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/adminLogger';
import { formatISTDate } from '@/lib/timeUtils';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FaArrowLeft, FaBan, FaClock, FaFlag, FaStickyNote, FaKey, 
  FaCheckCircle, FaExclamationTriangle, FaWallet, FaTrophy,
  FaMoneyBillWave, FaHistory, FaShieldAlt, FaUndo, FaTrash,
  FaEdit, FaCoins, FaGem, FaTicketAlt, FaInfoCircle, FaUser
} from 'react-icons/fa';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bans, setBans] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showBanModal, setShowBanModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Forms
  const [banForm, setBanForm] = useState({ reason: '' });
  const [suspendForm, setSuspendForm] = useState({ duration: '1', reason: '' });
  const [noteForm, setNoteForm] = useState({ note: '', is_flagged: false });
  const [walletForm, setWalletForm] = useState({
    wallet_real: '0',
    wallet_bonus: '0',
    wallet_gems: '0',
    wallet_coins: '0',
    wallet_vouchers_20: '0',
    wallet_vouchers_30: '0',
    wallet_vouchers_50: '0',
    reason: ''
  });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [params.id]);

  const loadUserData = async () => {
    try {
      // Load user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Set wallet form initial values
      setWalletForm({
        wallet_real: String(userData.wallet_real || 0),
        wallet_bonus: String(userData.wallet_bonus || 0),
        wallet_gems: String(userData.wallet_gems || 0),
        wallet_coins: String(userData.wallet_coins || 0),
        wallet_vouchers_20: String(userData.wallet_vouchers_20 || 0),
        wallet_vouchers_30: String(userData.wallet_vouchers_30 || 0),
        wallet_vouchers_50: String(userData.wallet_vouchers_50 || 0),
        reason: ''
      });

      // Load bans
      const { data: bansData } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false });
      setBans(bansData || []);

      // Load notes
      const { data: notesData } = await supabase
        .from('admin_notes')
        .select('*, created_by_user:users!admin_notes_created_by_fkey(username)')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false });
      setNotes(notesData || []);

      // Load tournament participation
      const { data: tournamentData } = await supabase
        .from('tournament_participants')
        .select('*, tournament:tournaments(title, status, start_time)')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setTournaments(tournamentData || []);

      // Load transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setTransactions(transactionsData || []);

      // Load activity log
      const { data: activityData } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setActivityLog(activityData || []);

    } catch (error) {
      console.error('Error:', error);
      alert('Error loading user data');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!banForm.reason.trim()) {
      alert('❌ Please provide a reason for the ban');
      return;
    }

    if (!confirm('⚠️ PERMANENT BAN - This user will lose ALL access to the platform. Continue?')) {
      return;
    }

    setProcessing(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Create ban record
      const { data: banData } = await supabase
        .from('user_bans')
        .insert({
          user_id: params.id,
          ban_type: 'permanent',
          reason: banForm.reason.trim(),
          expires_at: null,
          banned_by: adminUser?.id,
          is_active: true
        })
        .select()
        .single();

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: params.id,
          title: '❌ Account Permanently Banned',
          message: `Your account has been permanently banned. Reason: ${banForm.reason}`,
          type: 'ban',
          read: false
        });

      // LOG ACTION
      await logAdminAction('user_ban', {
        user_id: params.id,
        username: user.username,
        ban_type: 'permanent',
        reason: banForm.reason.trim(),
        ban_id: banData?.id
      });

      alert('✅ User permanently banned');
      setShowBanModal(false);
      setBanForm({ reason: '' });
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspendUser = async () => {
      if (!suspendForm.reason.trim()) {
        alert('❌ Please provide a reason for suspension');
        return;
      }

      setProcessing(true);

      try {
        const { data: { user: adminUser } } = await supabase.auth.getUser();

        const durationDays = parseInt(suspendForm.duration);

// Simple date math - JavaScript handles timezone automatically
        const now = new Date(); // Current time in IST
        const expiresAt = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));

      const { data: suspendData } = await supabase
        .from('user_bans')
        .insert({
          user_id: params.id,
          ban_type: 'temporary',
          reason: suspendForm.reason.trim(),
          expires_at: expiresAt.toISOString(),
          banned_by: adminUser?.id,
          is_active: true
        })
        .select()
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: params.id,
          title: '⏸️ Account Suspended',
          message: `Your account has been suspended for ${durationDays} days. Reason: ${suspendForm.reason}`,
          type: 'suspend',
          read: false
        });

      // LOG ACTION
      await logAdminAction('user_suspend', {
        user_id: params.id,
        username: user.username,
        ban_type: 'temporary',
        duration_days: durationDays,
        expires_at: expiresAt.toISOString(),
        reason: suspendForm.reason.trim(),
        suspend_id: suspendData?.id
      });

      alert(`✅ User suspended for ${durationDays} days`);
      setShowSuspendModal(false);
      setSuspendForm({ duration: '1', reason: '' });
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUnbanUser = async (banId) => {
    const ban = bans.find(b => b.id === banId);
    if (!confirm(`⚠️ LIFT ${ban.ban_type === 'permanent' ? 'BAN' : 'SUSPENSION'}?\n\nThis will restore user access.`)) return;

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      await supabase
        .from('user_bans')
        .update({
          is_active: false,
          unbanned_by: adminUser?.id,
          unbanned_at: new Date().toISOString()
        })
        .eq('id', banId);

      await supabase
        .from('notifications')
        .insert({
          user_id: params.id,
          title: '✅ Access Restored',
          message: 'Your account access has been restored.',
          type: 'unban'
        });

      // LOG ACTION
      await logAdminAction('user_unban', {
        user_id: params.id,
        username: user.username,
        ban_id: banId,
        original_ban_type: ban.ban_type,
        original_reason: ban.reason
      });

      alert('✅ Ban/suspension lifted');
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.note.trim()) {
      alert('❌ Please enter a note');
      return;
    }

    setProcessing(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      const { data: noteData } = await supabase
        .from('admin_notes')
        .insert({
          user_id: params.id,
          note: noteForm.note.trim(),
          is_flagged: noteForm.is_flagged,
          created_by: adminUser?.id
        })
        .select()
        .single();

      // LOG ACTION
      await logAdminAction('user_note_add', {
        user_id: params.id,
        username: user.username,
        note_id: noteData?.id,
        is_flagged: noteForm.is_flagged,
        note_preview: noteForm.note.trim().substring(0, 100)
      });

      alert('✅ Note added');
      setShowNoteModal(false);
      setNoteForm({ note: '', is_flagged: false });
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await supabase
        .from('admin_notes')
        .delete()
        .eq('id', noteId);

      // LOG ACTION
      await logAdminAction('user_note_delete', {
        user_id: params.id,
        username: user.username,
        note_id: noteId
      });

      alert('✅ Note deleted');
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleUpdateWallet = async () => {
    if (!walletForm.reason.trim()) {
      alert('❌ Please provide a reason for wallet modification');
      return;
    }

    if (!confirm('⚠️ MODIFY WALLET BALANCES?\n\nThis will change user wallet values. Ensure accuracy!')) {
      return;
    }

    setProcessing(true);

    try {
      const oldValues = {
        wallet_real: parseFloat(user.wallet_real || 0),
        wallet_bonus: parseFloat(user.wallet_bonus || 0),
        wallet_gems: parseFloat(user.wallet_gems || 0),
        wallet_coins: parseFloat(user.wallet_coins || 0),
        wallet_vouchers_20: parseInt(user.wallet_vouchers_20 || 0),
        wallet_vouchers_30: parseInt(user.wallet_vouchers_30 || 0),
        wallet_vouchers_50: parseInt(user.wallet_vouchers_50 || 0)
      };

      const newValues = {
        wallet_real: parseFloat(walletForm.wallet_real || 0),
        wallet_bonus: parseFloat(walletForm.wallet_bonus || 0),
        wallet_gems: parseFloat(walletForm.wallet_gems || 0),
        wallet_coins: parseFloat(walletForm.wallet_coins || 0),
        wallet_vouchers_20: parseInt(walletForm.wallet_vouchers_20 || 0),
        wallet_vouchers_30: parseInt(walletForm.wallet_vouchers_30 || 0),
        wallet_vouchers_50: parseInt(walletForm.wallet_vouchers_50 || 0)
      };

      // Calculate changes
      const changes = {};
      Object.keys(oldValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          changes[key] = { from: oldValues[key], to: newValues[key], diff: newValues[key] - oldValues[key] };
        }
      });

      if (Object.keys(changes).length === 0) {
        alert('❌ No changes detected');
        setProcessing(false);
        return;
      }

      // Update wallet
      const { error } = await supabase
        .from('users')
        .update(newValues)
        .eq('id', params.id);

      if (error) throw error;

      // Create transaction records for real money changes
      if (changes.wallet_real) {
        await supabase.from('transactions').insert({
          user_id: params.id,
          type: 'admin_adjustment',
          amount: changes.wallet_real.diff,
          currency: 'real',
          status: 'completed',
          description: `Admin adjustment: ${walletForm.reason}`
        });
      }

      // LOG ACTION
      await logAdminAction('user_wallet_edit', {
        user_id: params.id,
        username: user.username,
        changes: changes,
        reason: walletForm.reason.trim(),
        fields_changed: Object.keys(changes)
      });

      alert('✅ Wallet updated successfully');
      setShowWalletModal(false);
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getActiveBan = () => {
    return bans.find(ban => ban.is_active);
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

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-white text-xl">User not found</p>
        </div>
      </AdminLayout>
    );
  }

  const activeBan = getActiveBan();
    const isFlagged = notes.some(note => note.is_flagged);
  
  // Check if active ban is actually expired
    const isBanActuallyActive = activeBan && (
      activeBan.ban_type === 'permanent' || 
      (activeBan.ban_type === 'temporary' && activeBan.expires_at && new Date(activeBan.expires_at) > new Date())
    );

    return (
      <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-2 text-discord-text hover:text-white mb-4 transition-all"
        >
          <FaArrowLeft />
          Back to Users
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FaUser className="text-3xl text-purple-400" />
              <h1 className="text-3xl font-bold text-white break-words">{user.username}</h1>
              {isFlagged && (
                <FaFlag className="text-2xl text-yellow-400" title="Flagged User" />
              )}
              {isBanActuallyActive && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                                {activeBan.ban_type === 'permanent' ? 'BANNED' : 'SUSPENDED'}
                              </span>
                            )}
            </div>
            <p className="text-discord-text font-mono text-sm">ID: {user.id}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowWalletModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <FaWallet />
              Edit Wallet
            </button>
            <button
              onClick={() => setShowNoteModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
            >
              <FaStickyNote />
              Add Note
            </button>
            {isBanActuallyActive ? (
              <button
                onClick={() => handleUnbanUser(activeBan.id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
              >
                <FaUndo />
                Lift Ban
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
                >
                  <FaClock />
                  Suspend
                </button>
                <button
                  onClick={() => setShowBanModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
                >
                  <FaBan />
                  Ban
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* DEBUG INFO */}
      {isBanActuallyActive && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-xl p-4 mb-4">
          <p className="text-yellow-300 text-xs">DEBUG INFO:</p>
          <p className="text-yellow-300 text-xs">Raw UTC: {activeBan.expires_at}</p>
          <p className="text-yellow-300 text-xs">Raw Date Object: {new Date(activeBan.expires_at).toString()}</p>
          <p className="text-yellow-300 text-xs">IST Converted: {new Date(new Date(activeBan.expires_at).getTime() + 19800000).toUTCString()}</p>
        </div>
      )}
      {/* Active Ban Warning */}
      {isBanActuallyActive && (
        <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-2xl text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-white mb-2 text-lg">
                {activeBan.ban_type === 'permanent' ? '🚫 PERMANENTLY BANNED' : '⏸️ SUSPENDED'}
              </h3>
              <p className="text-red-300 mb-2"><strong>Reason:</strong> {activeBan.reason}</p>
              {activeBan.ban_type === 'temporary' && activeBan.expires_at && (
                <p className="text-red-300 mb-2">
                  <strong>Expires:</strong> {(() => {
                    const d = new Date(activeBan.expires_at + 'Z');
                    const ist = new Date(d.getTime() + 19800000);
                    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    let h = ist.getUTCHours();
                    const m = String(ist.getUTCMinutes()).padStart(2,'0');
                    const ap = h >= 12 ? 'pm' : 'am';
                    h = h % 12 || 12;
                    return `${ist.getUTCDate()} ${mon[ist.getUTCMonth()]} ${ist.getUTCFullYear()}, ${h}:${m} ${ap} IST`;
                  })()}
                </p>
              )}
              <p className="text-xs text-red-400">
                Banned on: {(() => {
                  const d = new Date(activeBan.created_at + 'Z');
                  const ist = new Date(d.getTime() + 19800000);
                  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  let h = ist.getUTCHours();
                  const m = String(ist.getUTCMinutes()).padStart(2,'0');
                  const ap = h >= 12 ? 'pm' : 'am';
                  h = h % 12 || 12;
                  return `${ist.getUTCDate()} ${mon[ist.getUTCMonth()]} ${ist.getUTCFullYear()}, ${h}:${m} ${ap} IST`;
                })()}
              </p>
              <div className="mt-3">
                <button
                  onClick={() => handleUnbanUser(activeBan.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2"
                >
                  <FaUndo />
                  Lift {activeBan.ban_type === 'permanent' ? 'Ban' : 'Suspension'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-discord-text mb-1">Email</p>
          <p className="text-white font-semibold break-all">{user.email || 'N/A'}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-discord-text mb-1">Phone</p>
          <p className="text-white font-semibold">{user.phone || 'N/A'}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-discord-text mb-1">Joined</p>
          <p className="text-white font-semibold">{formatISTDate(user.created_at, false)}</p>
        </div>
      </div>

      {/* Wallet Balance */}
      <div className="bg-gradient-to-br from-green-900 to-emerald-900 bg-opacity-20 border border-green-600 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FaWallet className="text-green-400" />
            Wallet Balance
          </h3>
          <button
            onClick={() => setShowWalletModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2"
          >
            <FaEdit />
            Modify
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-discord-dark rounded-lg p-4 text-center">
            <FaMoneyBillWave className="text-2xl text-green-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">Real Money</p>
            <p className="text-xl font-bold text-green-400">₹{parseFloat(user.wallet_real || 0).toFixed(2)}</p>
          </div>
          <div className="bg-discord-dark rounded-lg p-4 text-center">
            <FaCoins className="text-2xl text-yellow-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">Coins</p>
            <p className="text-xl font-bold text-yellow-400">{parseInt(user.wallet_coins || 0)}</p>
          </div>
          <div className="bg-discord-dark rounded-lg p-4 text-center">
            <FaGem className="text-2xl text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">Gems</p>
            <p className="text-xl font-bold text-purple-400">{parseInt(user.wallet_gems || 0)}</p>
          </div>
          <div className="bg-discord-dark rounded-lg p-4 text-center">
            <FaTicketAlt className="text-2xl text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">₹20 Voucher</p>
            <p className="text-xl font-bold text-blue-400">{parseInt(user.wallet_vouchers_20 || 0)}</p>
          </div>
          <div className="bg-discord-dark rounded-lg p-4 text-center">
            <FaTicketAlt className="text-2xl text-orange-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">₹30 Voucher</p>
            <p className="text-xl font-bold text-orange-400">{parseInt(user.wallet_vouchers_30 || 0)}</p>
          </div>
          <div className="bg-discord-dark rounded-lg p-4 text-center">
            <FaTicketAlt className="text-2xl text-red-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">₹50 Voucher</p>
            <p className="text-xl font-bold text-red-400">{parseInt(user.wallet_vouchers_50 || 0)}</p>
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      {notes.length > 0 && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaStickyNote className="text-blue-400" />
            Admin Notes ({notes.length})
          </h3>
          <div className="space-y-3">
            {notes.map(note => (
              <div
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.is_flagged 
                    ? 'bg-yellow-600 bg-opacity-10 border-yellow-600' 
                    : 'bg-discord-darkest border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {note.is_flagged && <FaFlag className="text-yellow-400" />}
                    <p className="text-white font-semibold">
                      {note.created_by_user?.username || 'Admin'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-400 hover:text-red-300 transition-all"
                  >
                    <FaTrash />
                  </button>
                </div>
                <p className="text-discord-text break-words whitespace-pre-wrap">{note.note}</p>
                <p className="text-xs text-discord-text mt-2">
                  {formatISTDate(note.created_at, true)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournament History */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaTrophy className="text-yellow-400" />
          Tournament History ({tournaments.length})
        </h3>
        {tournaments.length === 0 ? (
          <p className="text-discord-text text-center py-8">No tournament participation</p>
        ) : (
          <div className="space-y-3">
            {tournaments.map(tp => (
              <div key={tp.id} className="bg-discord-darkest rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold break-words">{tp.tournament?.title || 'Unknown'}</p>
                    <p className="text-xs text-discord-text">Seat #{tp.seat_number}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                    tp.tournament?.status === 'completed' ? 'bg-gray-600' :
                    tp.tournament?.status === 'live' ? 'bg-red-600' :
                    'bg-blue-600'
                  } text-white`}>
                    {tp.tournament?.status || 'unknown'}
                  </span>
                </div>
                <p className="text-sm text-discord-text">
                  IGN: {tp.in_game_name} ({tp.in_game_id})
                </p>
                {tp.kills !== null && (
                  <p className="text-sm text-green-400 mt-1">Kills: {tp.kills}</p>
                )}
                {tp.prize_won > 0 && (
                  <p className="text-sm text-yellow-400 mt-1">Prize: ₹{tp.prize_won}</p>
                )}
                <p className="text-xs text-discord-text mt-2">
                  Joined: {formatISTDate(tp.created_at, true)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaHistory className="text-green-400" />
          Recent Transactions ({transactions.length})
        </h3>
        {transactions.length === 0 ? (
          <p className="text-discord-text text-center py-8">No transactions</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-discord-darkest rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm break-words">
                    {tx.description || tx.type}
                  </p>
                  <p className="text-xs text-discord-text">
                    {formatISTDate(tx.created_at, true)}
                  </p>
                </div>
                <p className={`text-lg font-bold flex-shrink-0 ${
                  tx.amount >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaShieldAlt className="text-purple-400" />
          Activity Log ({activityLog.length})
        </h3>
        {activityLog.length === 0 ? (
          <p className="text-discord-text text-center py-8">No activity logged</p>
        ) : (
          <div className="space-y-2">
            {activityLog.map(log => (
              <div key={log.id} className="bg-discord-darkest rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm break-words">
                      {log.action_type}
                    </p>
                    {log.description && (
                      <p className="text-xs text-discord-text break-words mt-1">{log.description}</p>
                    )}
                    {log.ip_address && (
                      <p className="text-xs text-yellow-400 font-mono mt-1">
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-discord-text flex-shrink-0">
                    {formatISTDate(log.created_at, true)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ban History */}
      {bans.length > 0 && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaBan className="text-red-400" />
            Ban History ({bans.length})
          </h3>
          <div className="space-y-3">
            {bans.map(ban => (
              <div
                key={ban.id}
                className={`p-4 rounded-lg border ${
                  ban.is_active 
                    ? 'bg-red-600 bg-opacity-10 border-red-600' 
                    : 'bg-gray-600 bg-opacity-10 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    ban.ban_type === 'permanent' ? 'bg-red-600' : 'bg-orange-600'
                  } text-white flex-shrink-0`}>
                    {ban.ban_type === 'permanent' ? 'PERMANENT BAN' : 'SUSPENSION'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${
                      ban.is_active ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {ban.is_active ? 'ACTIVE' : 'LIFTED'}
                    </span>
                    {ban.is_active && (
                      <button
                        onClick={() => handleUnbanUser(ban.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                      >
                        Lift
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-white mb-2 break-words">
                  <strong>Reason:</strong> {ban.reason}
                </p>
                {ban.ban_type === 'temporary' && ban.expires_at && (
                  <p className="text-discord-text text-sm mb-2">
                    <strong>Expires:</strong> {formatISTDate(ban.expires_at, true)}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-discord-text">
                  <p>Created: {formatISTDate(ban.created_at, true)}</p>
                  {ban.unbanned_at && (
                    <p className="text-green-400">
                      Lifted: {formatISTDate(ban.unbanned_at, true)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark border border-red-600 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FaBan className="text-red-400" />
              Ban User Permanently
            </h2>
            <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-sm flex items-start gap-2">
                <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                <span>This is a permanent ban. The user will be restricted to read-only access (home, videos, info, help, downloads only).</span>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">Reason *</label>
              <textarea
                value={banForm.reason}
                onChange={(e) => setBanForm({reason: e.target.value})}
                placeholder="Explain why this user is being banned..."
                rows={4}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
              >
                {processing ? 'Banning...' : 'Ban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark border border-orange-600 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FaClock className="text-orange-400" />
              Suspend User Temporarily
            </h2>
            <div className="bg-orange-600 bg-opacity-10 border border-orange-600 rounded-lg p-4 mb-4">
              <p className="text-orange-400 text-sm flex items-start gap-2">
                <FaInfoCircle className="flex-shrink-0 mt-0.5" />
                <span>User will be restricted until expiration. Access limited to home, videos, info, help, downloads.</span>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">Duration</label>
              <select
                value={suspendForm.duration}
                onChange={(e) => setSuspendForm({...suspendForm, duration: e.target.value})}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-600"
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days (1 Week)</option>
                <option value="14">14 Days (2 Weeks)</option>
                <option value="30">30 Days (1 Month)</option>
                <option value="90">90 Days (3 Months)</option>
                <option value="180">180 Days (6 Months)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">Reason *</label>
              <textarea
                value={suspendForm.reason}
                onChange={(e) => setSuspendForm({...suspendForm, reason: e.target.value})}
                placeholder="Explain why this user is being suspended..."
                rows={4}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-orange-600"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
              >
                {processing ? 'Suspending...' : 'Suspend User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark border border-blue-600 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FaStickyNote className="text-blue-400" />
              Add Admin Note
            </h2>
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">Note *</label>
              <textarea
                value={noteForm.note}
                onChange={(e) => setNoteForm({...noteForm, note: e.target.value})}
                placeholder="Add an internal note about this user..."
                rows={4}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteForm.is_flagged}
                  onChange={(e) => setNoteForm({...noteForm, is_flagged: e.target.checked})}
                  className="w-5 h-5"
                />
                <FaFlag className="text-yellow-400" />
                <span>Flag this user as suspicious</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoteModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
              >
                {processing ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Edit Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-discord-dark border border-green-600 rounded-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FaWallet className="text-green-400" />
              Edit Wallet Balance
            </h2>
            <div className="bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg p-4 mb-4">
              <p className="text-yellow-400 text-sm flex items-start gap-2">
                <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                <span>Changes are immediate and logged. Ensure accuracy before saving!</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Real Money (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={walletForm.wallet_real}
                  onChange={(e) => setWalletForm({...walletForm, wallet_real: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Bonus (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={walletForm.wallet_bonus}
                  onChange={(e) => setWalletForm({...walletForm, wallet_bonus: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Gems</label>
                <input
                  type="number"
                  value={walletForm.wallet_gems}
                  onChange={(e) => setWalletForm({...walletForm, wallet_gems: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">₹20 Vouchers</label>
                <input
                  type="number"
                  value={walletForm.wallet_vouchers_20}
                  onChange={(e) => setWalletForm({...walletForm, wallet_vouchers_20: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">₹30 Vouchers</label>
                <input
                  type="number"
                  value={walletForm.wallet_vouchers_30}
                  onChange={(e) => setWalletForm({...walletForm, wallet_vouchers_30: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-600 font-bold"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">₹50 Vouchers</label>
                <input
                  type="number"
                  value={walletForm.wallet_vouchers_50}
                  onChange={(e) => setWalletForm({...walletForm, wallet_vouchers_50: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-600 font-bold"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">Reason for Modification *</label>
              <textarea
                value={walletForm.reason}
                onChange={(e) => setWalletForm({...walletForm, reason: e.target.value})}
                placeholder="Explain why you're modifying this wallet..."
                rows={3}
                className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWalletModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateWallet}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
