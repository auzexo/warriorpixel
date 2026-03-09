'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FaArrowLeft, FaBan, FaClock, FaFlag, FaStickyNote, FaKey, 
  FaCheckCircle, FaExclamationTriangle, FaWallet, FaTrophy,
  FaMoneyBillWave, FaHistory, FaShieldAlt, FaUndo, FaTrash
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
  
  // Forms
  const [banForm, setBanForm] = useState({ reason: '' });
  const [suspendForm, setSuspendForm] = useState({ duration: '1', reason: '' });
  const [noteForm, setNoteForm] = useState({ note: '', is_flagged: false });
  
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
      alert('Please provide a reason for the ban');
      return;
    }

    if (!confirm('Permanently ban this user? This is a serious action!')) {
      return;
    }

    setProcessing(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // Create ban record
      await supabase
        .from('user_bans')
        .insert({
          user_id: params.id,
          ban_type: 'permanent',
          reason: banForm.reason.trim(),
          expires_at: null,
          banned_by: adminUser?.id,
          is_active: true
        });

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: params.id,
          title: '❌ Account Banned',
          message: `Your account has been permanently banned. Reason: ${banForm.reason}`,
          type: 'ban',
          read: false
        });

      alert('✅ User banned successfully');
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
      alert('Please provide a reason for suspension');
      return;
    }

    setProcessing(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      const durationDays = parseInt(suspendForm.duration);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      await supabase
        .from('user_bans')
        .insert({
          user_id: params.id,
          ban_type: 'temporary',
          reason: suspendForm.reason.trim(),
          expires_at: expiresAt.toISOString(),
          banned_by: adminUser?.id,
          is_active: true
        });

      await supabase
        .from('notifications')
        .insert({
          user_id: params.id,
          title: '⏸️ Account Suspended',
          message: `Your account has been suspended for ${durationDays} days. Reason: ${suspendForm.reason}`,
          type: 'suspend',
          read: false
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
    if (!confirm('Remove this ban/suspension?')) return;

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
          title: '✅ Account Unbanned',
          message: 'Your account has been unbanned. You can now access all features.',
          type: 'unban',
          read: false
        });

      alert('✅ User unbanned successfully');
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteForm.note.trim()) {
      alert('Please enter a note');
      return;
    }

    setProcessing(true);

    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      await supabase
        .from('admin_notes')
        .insert({
          user_id: params.id,
          note: noteForm.note.trim(),
          is_flagged: noteForm.is_flagged,
          created_by: adminUser?.id
        });

      alert('✅ Note added successfully');
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

      alert('✅ Note deleted');
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Send password reset email to this user?')) return;

    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      alert('✅ Password reset email sent');
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleVerifyUser = async () => {
    try {
      await supabase
        .from('users')
        .update({ is_verified: !user.is_verified })
        .eq('id', params.id);

      alert(user.is_verified ? '✅ User unverified' : '✅ User verified');
      loadUserData();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
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

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-white text-xl mb-4">User not found</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
          >
            ← Back to Users
          </button>
        </div>
      </AdminLayout>
    );
  }

  const activeBan = bans.find(b => b.is_active);
  const isBanned = !!activeBan;
  const isFlagged = notes.some(n => n.is_flagged);

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{user.username || 'Unknown User'}</h1>
            <p className="text-discord-text">{user.email}</p>
            <p className="text-xs text-discord-text font-mono mt-1">ID: {user.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {isBanned && (
              <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold flex items-center gap-2">
                <FaBan />
                BANNED
              </span>
            )}
            {isFlagged && (
              <span className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold flex items-center gap-2">
                <FaFlag />
                FLAGGED
              </span>
            )}
            {user.is_verified && (
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
                <FaCheckCircle />
                VERIFIED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {!isBanned ? (
          <>
            <button
              onClick={() => setShowBanModal(true)}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <FaBan />
              Ban User
            </button>
            <button
              onClick={() => setShowSuspendModal(true)}
              className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <FaClock />
              Suspend
            </button>
          </>
        ) : (
          <button
            onClick={() => handleUnbanUser(activeBan.id)}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all col-span-2"
          >
            <FaUndo />
            Unban User
          </button>
        )}
        <button
          onClick={() => setShowNoteModal(true)}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <FaStickyNote />
          Add Note
        </button>
        <button
          onClick={handleResetPassword}
          className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <FaKey />
          Reset Password
        </button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaWallet className="text-3xl text-green-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Wallet Balance</p>
          <p className="text-2xl font-bold text-white">₹{parseFloat(user.wallet_real || 0).toFixed(2)}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaTrophy className="text-3xl text-yellow-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Total Wins</p>
          <p className="text-2xl font-bold text-white">{user.total_wins || 0}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaShieldAlt className="text-3xl text-blue-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Total Games</p>
          <p className="text-2xl font-bold text-white">{user.total_games || 0}</p>
        </div>
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <FaMoneyBillWave className="text-3xl text-purple-400 mb-3" />
          <p className="text-sm text-discord-text mb-1">Achievement Points</p>
          <p className="text-2xl font-bold text-white">{user.achievement_points || 0}</p>
        </div>
      </div>

      {/* Active Ban/Suspension */}
      {activeBan && (
        <div className="bg-red-600 bg-opacity-10 border border-red-600 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <FaBan className="text-red-400" />
                Active {activeBan.ban_type === 'permanent' ? 'Ban' : 'Suspension'}
              </h3>
              <p className="text-red-400 mb-2">
                <strong>Reason:</strong> {activeBan.reason}
              </p>
              {activeBan.ban_type === 'temporary' && (
                <p className="text-red-400">
                  <strong>Expires:</strong> {new Date(activeBan.expires_at).toLocaleString('en-IN')}
                </p>
              )}
              <p className="text-sm text-discord-text mt-2">
                Banned on: {new Date(activeBan.created_at).toLocaleString('en-IN')}
              </p>
            </div>
            <button
              onClick={() => handleUnbanUser(activeBan.id)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <FaUndo />
              Unban
            </button>
          </div>
        </div>
      )}

      {/* Admin Notes */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Admin Notes ({notes.length})</h3>
          <button
            onClick={() => setShowNoteModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
          >
            Add Note
          </button>
        </div>
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-center text-discord-text py-8">No notes yet</p>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className={`p-4 rounded-lg border ${
                  note.is_flagged 
                    ? 'bg-yellow-600 bg-opacity-10 border-yellow-600' 
                    : 'bg-discord-darkest border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.is_flagged && <FaFlag className="text-yellow-400" />}
                    <span className="text-xs text-discord-text">
                      By {note.created_by_user?.username || 'Admin'} • {new Date(note.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
                <p className="text-white">{note.note}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tournaments */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-400" />
            Recent Tournaments ({tournaments.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tournaments.length === 0 ? (
              <p className="text-center text-discord-text py-8">No tournaments</p>
            ) : (
              tournaments.map(t => (
                <div key={t.id} className="bg-discord-darkest rounded-lg p-3">
                  <p className="font-semibold text-white text-sm">{t.tournament?.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      t.tournament?.status === 'completed' ? 'bg-gray-600' :
                      t.tournament?.status === 'live' ? 'bg-green-600' :
                      'bg-blue-600'
                    } text-white`}>
                      {t.tournament?.status}
                    </span>
                    {t.seat_number && (
                      <span className="text-xs text-discord-text">Seat #{t.seat_number}</span>
                    )}
                  </div>
                  {t.prize_won > 0 && (
                    <p className="text-xs text-green-400 mt-1">Won: ₹{parseFloat(t.prize_won).toFixed(2)}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-green-400" />
            Recent Transactions ({transactions.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-center text-discord-text py-8">No transactions</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="bg-discord-darkest rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-discord-text">{tx.type}</span>
                    <span className={`font-bold text-sm ${
                      tx.amount >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.amount >= 0 ? '+' : ''}₹{parseFloat(tx.amount).toFixed(2)}
                    </span>
                  </div>
                  {tx.description && (
                    <p className="text-xs text-discord-text">{tx.description}</p>
                  )}
                  <p className="text-xs text-discord-text mt-1">
                    {new Date(tx.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity Log & IP Tracking */}
      <div className="bg-discord-dark border border-gray-800 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaHistory className="text-blue-400" />
          Activity Log & IP Tracking ({activityLog.length})
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {activityLog.length === 0 ? (
            <p className="text-center text-discord-text py-8">No activity logged</p>
          ) : (
            activityLog.map(log => (
              <div key={log.id} className="bg-discord-darkest rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{log.activity_type}</p>
                    {log.description && (
                      <p className="text-xs text-discord-text">{log.description}</p>
                    )}
                    {log.ip_address && (
                      <p className="text-xs text-yellow-400 font-mono mt-1">
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-discord-text">
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ban History */}
      {bans.length > 0 && (
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Ban History ({bans.length})</h3>
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
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    ban.ban_type === 'permanent' ? 'bg-red-600' : 'bg-orange-600'
                  } text-white`}>
                    {ban.ban_type === 'permanent' ? 'PERMANENT BAN' : 'SUSPENSION'}
                  </span>
                  <span className={`text-xs font-bold ${
                    ban.is_active ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {ban.is_active ? 'ACTIVE' : 'LIFTED'}
                  </span>
                </div>
                <p className="text-white mb-1">
                  <strong>Reason:</strong> {ban.reason}
                </p>
                {ban.ban_type === 'temporary' && ban.expires_at && (
                  <p className="text-discord-text text-sm">
                    <strong>Expires:</strong> {new Date(ban.expires_at).toLocaleString('en-IN')}
                  </p>
                )}
                <p className="text-xs text-discord-text mt-2">
                  Created: {new Date(ban.created_at).toLocaleString('en-IN')}
                </p>
                {ban.unbanned_at && (
                  <p className="text-xs text-green-400 mt-1">
                    Unbanned: {new Date(ban.unbanned_at).toLocaleString('en-IN')}
                  </p>
                )}
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
              <p className="text-red-400 text-sm">
                <FaExclamationTriangle className="inline mr-2" />
                This is a permanent ban. The user will lose all access.
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
    </AdminLayout>
  );
}
