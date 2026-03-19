'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { countryCodes, getCountryByCode } from '@/lib/countryCodes';
import { 
  FaUser, 
  FaEdit, 
  FaCoins, 
  FaGem, 
  FaMoneyBillWave, 
  FaTicketAlt,
  FaTrophy,
  FaChartLine,
  FaGamepad,
  FaCrown,
  FaHistory,
  FaExchangeAlt,
  FaDiscord,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaCheckCircle,
  FaTimes,
  FaSave,
  FaExclamationTriangle,
  FaStar
} from 'react-icons/fa';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [processing, setProcessing] = useState(false);
  
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    country_code: '+91',
    discord_id: ''
  });

  useEffect(() => {
    if (user && profile) {
      loadProfileData();
    }
  }, [user, profile]);

  const loadProfileData = async () => {
    try {
      setEditForm({
        username: profile.username || '',
        email: profile.email || '',
        phone: profile.phone || '',
        country_code: profile.country_code || '+91',
        discord_id: profile.discord_id || ''
      });

      setLoading(false);
      loadTournamentHistory();
      loadTransactions();
    } catch (error) {
      console.error('Error loading profile data:', error);
      setLoading(false);
    }
  };

  const loadTournamentHistory = async () => {
    try {
      const { data: tournamentData, error } = await supabase
        .from('tournament_participants')
        .select(`
          *,
          tournaments (
            tournament_name,
            tournament_date,
            entry_fee,
            prize_pool
          )
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Tournament history error:', error);
        return;
      }

      setTournamentHistory(tournamentData || []);
    } catch (error) {
      console.error('Error loading tournament history:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data: transactionData, error } = await supabase
        .from('admin_logs')
        .select('*')
        .eq('user_id', user.id)
        .in('action_type', ['wallet_edit', 'achievement_claim'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Transactions error:', error);
        return;
      }

      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editForm.username.trim()) {
      alert('❌ Username cannot be empty');
      return;
    }

    // Validate email format
    if (editForm.email && editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        alert('❌ Please enter a valid email address\n\nExample: user@example.com');
        return;
      }
    }

    // Validate phone number
    if (editForm.phone && editForm.phone.trim()) {
      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(editForm.phone)) {
        alert('❌ Phone number must contain only digits');
        return;
      }
      const maxLength = getCountryByCode(editForm.country_code).maxLength;
      if (editForm.phone.length !== maxLength) {
        alert(`❌ Phone number must be exactly ${maxLength} digits for ${getCountryByCode(editForm.country_code).name}`);
        return;
      }
    }

    setProcessing(true);
    try {
      // Check if discord_id already exists
      if (editForm.discord_id && editForm.discord_id !== profile.discord_id) {
        const { data: existingDiscord } = await supabase
          .from('users')
          .select('id')
          .eq('discord_id', editForm.discord_id)
          .neq('id', user.id)
          .single();

        if (existingDiscord) {
          alert('❌ This Discord ID is already in use by another account');
          setProcessing(false);
          return;
        }
      }

      // Check if phone already exists
      if (editForm.phone && 
          (editForm.phone !== profile.phone || editForm.country_code !== profile.country_code)) {
        const { data: existingPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone', editForm.phone)
          .eq('country_code', editForm.country_code)
          .neq('id', user.id)
          .single();

        if (existingPhone) {
          alert(`❌ This phone number is already in use\n\n${editForm.country_code} ${editForm.phone}`);
          setProcessing(false);
          return;
        }
      }

      const profileComplete = !!(
        editForm.username &&
        editForm.email &&
        editForm.phone &&
        editForm.discord_id
      );

      const updateData = {
        username: editForm.username,
        email: editForm.email || null,
        phone: editForm.phone || null,
        country_code: editForm.country_code,
        discord_id: editForm.discord_id || null,
        is_verified: profileComplete,
        profile_completed_at: profileComplete && !profile.is_verified ? new Date().toISOString() : profile.profile_completed_at
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setShowEditModal(false);
      
      if (profileComplete && !profile.is_verified) {
        alert('✅ Profile completed! You now have a verified badge! 🎉');
      } else {
        alert('✅ Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-4">
        <div className="text-center">
          <FaUser className="text-5xl text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-sm text-discord-text">Login to view your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darkest flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getInitial = () => {
    return profile.username?.charAt(0).toUpperCase() || 'U';
  };

  const getXPProgress = () => {
    const currentXP = profile.xp || 0;
    const requiredXP = profile.xp_to_next_level || 100;
    return (currentXP / requiredXP) * 100;
  };

  return (
    <div className="min-h-screen bg-discord-darkest p-3 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-4 md:p-6 mb-4 border border-purple-600">
          {!profile.is_verified && (
            <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg px-3 py-2 mb-4">
              <p className="text-yellow-400 text-xs md:text-sm flex items-center gap-2">
                <FaExclamationTriangle />
                <span>Complete your profile (email, phone, Discord ID) to get a verified badge!</span>
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center font-bold text-white text-4xl md:text-5xl border-4 border-purple-400 shadow-lg">
              {getInitial()}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                {profile.username}
                {profile.is_verified && (
                  <FaCheckCircle className="text-blue-400 text-xl md:text-2xl" title="Verified Profile" />
                )}
              </h1>
              <div className="space-y-1 text-sm md:text-base">
                <div className="flex items-center justify-center md:justify-start gap-2 text-purple-200">
                  <FaIdCard className="text-purple-400" />
                  <span>UID: {profile.uid}</span>
                </div>
                {profile.email && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-purple-200">
                    <FaEnvelope className="text-purple-400" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-purple-200">
                    <FaPhone className="text-purple-400" />
                    <span>{profile.country_code || '+91'} {profile.phone}</span>
                  </div>
                )}
                {profile.discord_id && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-purple-200">
                    <FaDiscord className="text-purple-400" />
                    <span>{profile.discord_id}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <FaEdit />
              <span className="hidden md:inline">Edit Profile</span>
            </button>
          </div>

          <div className="mt-4 bg-purple-900 bg-opacity-40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-400" />
                <span className="text-white font-bold">Level {profile.level || 1}</span>
              </div>
              <span className="text-purple-200 text-sm">
                {profile.xp || 0} / {profile.xp_to_next_level || 100} XP
              </span>
            </div>
            <div className="w-full bg-purple-950 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-purple-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, getXPProgress())}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-discord-dark border border-gray-800 rounded-lg p-4 text-center">
            <FaChartLine className="text-2xl md:text-3xl text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">Level</p>
            <p className="text-xl md:text-2xl font-bold text-white">{profile.level || 1}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-lg p-4 text-center">
            <FaTrophy className="text-2xl md:text-3xl text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">Achievement Pts</p>
            <p className="text-xl md:text-2xl font-bold text-purple-400">{profile.achievement_points || 0}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-lg p-4 text-center">
            <FaCrown className="text-2xl md:text-3xl text-yellow-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">Total Wins</p>
            <p className="text-xl md:text-2xl font-bold text-yellow-400">{profile.total_wins || 0}</p>
          </div>
          <div className="bg-discord-dark border border-gray-800 rounded-lg p-4 text-center">
            <FaGamepad className="text-2xl md:text-3xl text-green-400 mx-auto mb-2" />
            <p className="text-xs text-discord-text mb-1">Total Games</p>
            <p className="text-xl md:text-2xl font-bold text-green-400">{profile.total_games || 0}</p>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6 mb-4">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaCoins className="text-yellow-400" />
            Wallet
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-discord-darkest rounded-lg p-4 text-center border border-gray-700">
              <FaMoneyBillWave className="text-2xl text-green-400 mx-auto mb-2" />
              <p className="text-xs text-discord-text mb-1">Real Money</p>
              <p className="text-lg md:text-xl font-bold text-green-400">₹{parseFloat(profile.wallet_real || 0).toFixed(2)}</p>
            </div>
            <div className="bg-discord-darkest rounded-lg p-4 text-center border border-gray-700">
              <FaCoins className="text-2xl text-yellow-400 mx-auto mb-2" />
              <p className="text-xs text-discord-text mb-1">Coins</p>
              <p className="text-lg md:text-xl font-bold text-yellow-400">{parseInt(profile.wallet_coins || 0)}</p>
            </div>
            <div className="bg-discord-darkest rounded-lg p-4 text-center border border-gray-700">
              <FaGem className="text-2xl text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-discord-text mb-1">Gems</p>
              <p className="text-lg md:text-xl font-bold text-purple-400">{parseInt(profile.wallet_gems || 0)}</p>
            </div>
            <div className="bg-discord-darkest rounded-lg p-4 text-center border border-gray-700">
              <FaTicketAlt className="text-2xl text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-discord-text mb-1">₹20 Voucher</p>
              <p className="text-lg md:text-xl font-bold text-blue-400">{parseInt(profile.wallet_vouchers_20 || 0)}</p>
            </div>
            <div className="bg-discord-darkest rounded-lg p-4 text-center border border-gray-700">
              <FaTicketAlt className="text-2xl text-orange-400 mx-auto mb-2" />
              <p className="text-xs text-discord-text mb-1">₹30 Voucher</p>
              <p className="text-lg md:text-xl font-bold text-orange-400">{parseInt(profile.wallet_vouchers_30 || 0)}</p>
            </div>
            <div className="bg-discord-darkest rounded-lg p-4 text-center border border-gray-700">
              <FaTicketAlt className="text-2xl text-red-400 mx-auto mb-2" />
              <p className="text-xs text-discord-text mb-1">₹50 Voucher</p>
              <p className="text-lg md:text-xl font-bold text-red-400">{parseInt(profile.wallet_vouchers_50 || 0)}</p>
            </div>
          </div>
        </div>

        {/* Tournament History & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaHistory className="text-blue-400" />
              Tournament History
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tournamentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FaTrophy className="text-4xl text-gray-600 mx-auto mb-3" />
                  <p className="text-discord-text text-sm">No tournament history yet</p>
                </div>
              ) : (
                tournamentHistory.map((registration) => (
                  <div
                    key={registration.id}
                    className="bg-discord-darkest rounded-lg p-3 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm">
                        {registration.tournaments?.tournament_name || 'Unknown Tournament'}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        registration.status === 'confirmed' 
                          ? 'bg-green-600 text-white' 
                          : registration.status === 'pending'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {registration.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-discord-text">
                      <span>Seat: {registration.seat_number || 'TBA'}</span>
                      <span>Entry: ₹{registration.tournaments?.entry_fee || 0}</span>
                      <span>{new Date(registration.registered_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-discord-dark border border-gray-800 rounded-xl p-4 md:p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaExchangeAlt className="text-purple-400" />
              Recent Transactions
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <FaExchangeAlt className="text-4xl text-gray-600 mx-auto mb-3" />
                  <p className="text-discord-text text-sm">No transactions yet</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-discord-darkest rounded-lg p-3 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-white text-sm capitalize">
                        {transaction.action_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-discord-text">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-discord-text">
                      {typeof transaction.details === 'string' 
                        ? transaction.details 
                        : JSON.stringify(transaction.details)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-discord-dark border border-purple-600 rounded-xl max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaEdit className="text-purple-400" />
                Edit Profile
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Username *</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="your@example.com"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Phone Number</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select
                      value={editForm.country_code || '+91'}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        setEditForm({
                          ...editForm, 
                          country_code: newCode,
                          phone: ''
                        });
                      }}
                      className="w-full px-3 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600 text-sm"
                    >
                      {countryCodes.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="tel"
                      maxLength={getCountryByCode(editForm.country_code).maxLength}
                      value={editForm.phone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        setEditForm({...editForm, phone: cleaned});
                      }}
                      className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                      placeholder={`${getCountryByCode(editForm.country_code).maxLength} digits`}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getCountryByCode(editForm.country_code).name} - {getCountryByCode(editForm.country_code).maxLength} digits
                </p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Discord ID</label>
                <input
                  type="text"
                  value={editForm.discord_id}
                  onChange={(e) => setEditForm({...editForm, discord_id: e.target.value})}
                  className="w-full px-4 py-3 bg-discord-darkest border border-gray-700 text-white rounded-lg focus:outline-none focus:border-purple-600"
                  placeholder="username#1234 or Discord ID"
                />
              </div>

              <div className="bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg p-3">
                <p className="text-blue-400 text-xs flex items-start gap-2">
                  <FaCheckCircle className="flex-shrink-0 mt-0.5" />
                  <span>Fill all fields to get a verified badge on your profile!</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
