// app/shop/page.js
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShopProducts, getVouchers, purchaseVoucher } from '@/lib/database';
import ShopProductCard from '@/components/ShopProductCard';
import VoucherCard from '@/components/VoucherCard';
import { FaShoppingCart, FaGem, FaTicketAlt } from 'react-icons/fa';

export default function ShopPage() {
  const { userProfile, refreshProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState('gems');

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    setLoading(true);
    const [productsResult, vouchersResult] = await Promise.all([
      getShopProducts(),
      getVouchers()
    ]);

    if (productsResult.success) {
      setProducts(productsResult.data);
    }
    if (vouchersResult.success) {
      setVouchers(vouchersResult.data);
    }
    setLoading(false);
  };

  const handlePurchaseProduct = async (product) => {
    alert(`💳 PhonePe payment coming soon!\nProduct: ${product.name}\nPrice: ₹${product.price_real}`);
  };

  const handlePurchaseVoucher = async (voucherType) => {
    setPurchasing(true);
    const result = await purchaseVoucher(userProfile.id, voucherType);
    
    if (result.success) {
      alert('✅ Voucher purchased successfully!');
      refreshProfile();
      loadShopData();
    } else {
      alert(`❌ ${result.error}`);
    }
    setPurchasing(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaShoppingCart />
          Shop
        </h1>
        <p className="text-white text-opacity-90 text-base md:text-lg">
          Buy gems, vouchers, and exclusive items
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-primary-card rounded-lg p-1 border border-white border-opacity-5">
        <button
          onClick={() => setActiveTab('gems')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'gems' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FaGem />
          Gems
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'vouchers' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FaTicketAlt />
          Vouchers
        </button>
      </div>

      {/* Gems Section */}
      {activeTab === 'gems' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Gem Packages</h2>
            <p className="text-gray-400">Purchase gems with real money (PhonePe)</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-primary-card rounded-xl h-64 skeleton"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ShopProductCard
                  key={product.id}
                  product={product}
                  onPurchase={handlePurchaseProduct}
                  loading={purchasing}
                />
              ))}
            </div>
          ) : (
            <div className="bg-primary-card rounded-xl p-8 md:p-12 text-center">
              <FaGem className="text-5xl md:text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No products available</p>
            </div>
          )}

          <div className="mt-6 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              💳 <strong>PhonePe Integration:</strong> Zero charges on UPI payments! Pay securely with PhonePe.
            </p>
          </div>
        </div>
      )}

      {/* Vouchers Section */}
      {activeTab === 'vouchers' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Tournament Vouchers</h2>
            <p className="text-gray-400">Buy with gems - One-time purchase per voucher</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-primary-card rounded-xl h-64 skeleton"></div>
              ))}
            </div>
          ) : vouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {vouchers.map((voucher) => (
                <VoucherCard
                  key={voucher.id}
                  voucher={voucher}
                  userProfile={userProfile}
                  onPurchase={handlePurchaseVoucher}
                  loading={purchasing}
                />
              ))}
            </div>
          ) : (
            <div className="bg-primary-card rounded-xl p-8 md:p-12 text-center">
              <FaTicketAlt className="text-5xl md:text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No vouchers available</p>
            </div>
          )}

          <div className="mt-6 bg-purple-500 bg-opacity-10 border border-purple-500 rounded-lg p-4">
            <p className="text-sm text-purple-400">
              ⚠️ <strong>Important:</strong> Each voucher can only be purchased once per user. Use them wisely!
            </p>
          </div>
        </div>
      )}

      {/* Your Balance */}
      <div className="bg-primary-card rounded-xl p-4 md:p-6 border border-white border-opacity-5">
        <h3 className="font-bold mb-4 text-lg">Your Balance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-5 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Real Money</p>
            <p className="text-2xl font-bold text-green-400">₹{(userProfile?.wallet_real || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white bg-opacity-5 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Gems</p>
            <p className="text-2xl font-bold text-cyan-400">{userProfile?.wallet_gems || 0}</p>
          </div>
          <div className="bg-white bg-opacity-5 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Coins</p>
            <p className="text-2xl font-bold text-yellow-400">{userProfile?.wallet_coins || 0}</p>
          </div>
          <div className="bg-white bg-opacity-5 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Vouchers</p>
            <p className="text-2xl font-bold text-purple-400">
              {(userProfile?.wallet_vouchers_20 || 0) + 
               (userProfile?.wallet_vouchers_30 || 0) + 
               (userProfile?.wallet_vouchers_50 || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
