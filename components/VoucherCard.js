// components/VoucherCard.js
'use client';

import { FaTicketAlt, FaGem, FaCheck } from 'react-icons/fa';

const VoucherCard = ({ voucher, userProfile, onPurchase, loading }) => {
  const voucherType = voucher.voucher_type;
  const purchasedField = `purchased_voucher_${voucherType}`;
  const isPurchased = userProfile?.[purchasedField] || false;
  const hasEnoughGems = (userProfile?.wallet_gems || 0) >= voucher.gem_cost;

  return (
    <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5 hover:border-purple-500 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-600 bg-opacity-20 rounded-lg flex items-center justify-center">
            <FaTicketAlt className="text-2xl text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{voucher.name}</h3>
            <p className="text-sm text-gray-400">{voucher.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg">
          <span className="text-sm text-gray-400">Applicable for:</span>
          <span className="font-semibold text-white">₹{voucher.applicable_entry_fee} tournaments</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg">
          <span className="text-sm text-gray-400">Price:</span>
          <div className="flex items-center gap-2">
            <FaGem className="text-cyan-400" />
            <span className="font-bold text-cyan-400">{voucher.gem_cost} gems</span>
          </div>
        </div>

        {isPurchased ? (
          <button
            disabled
            className="w-full bg-green-600 bg-opacity-50 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <FaCheck />
            Already Purchased
          </button>
        ) : (
          <button
            onClick={() => onPurchase(voucherType)}
            disabled={loading || !hasEnoughGems}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              hasEnoughGems
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : hasEnoughGems ? 'Purchase' : 'Insufficient Gems'}
          </button>
        )}

        {voucher.one_time_purchase && (
          <p className="text-xs text-center text-yellow-400">
            ⚠️ One-time purchase only
          </p>
        )}
      </div>
    </div>
  );
};

export default VoucherCard;
