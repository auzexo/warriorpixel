// components/ShopProductCard.js
'use client';

import { FaGem, FaCoins, FaShoppingCart } from 'react-icons/fa';

const ShopProductCard = ({ product, onPurchase, loading }) => {
  const isGemPackage = product.category === 'gems';

  return (
    <div className="bg-primary-card rounded-xl p-6 border border-white border-opacity-5 hover:border-purple-500 transition-all group">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {isGemPackage ? (
            <FaGem className="text-4xl text-white" />
          ) : (
            <FaCoins className="text-4xl text-white" />
          )}
        </div>
        
        <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
        
        {product.description && (
          <p className="text-sm text-gray-400">{product.description}</p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {product.gives_gems > 0 && (
          <div className="flex items-center justify-between p-3 bg-cyan-500 bg-opacity-10 rounded-lg border border-cyan-500 border-opacity-20">
            <span className="text-sm text-gray-400">You Get:</span>
            <div className="flex items-center gap-2">
              <FaGem className="text-cyan-400" />
              <span className="font-bold text-cyan-400 text-lg">{product.gives_gems} gems</span>
            </div>
          </div>
        )}

        {product.gives_coins > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-500 bg-opacity-10 rounded-lg border border-yellow-500 border-opacity-20">
            <span className="text-sm text-gray-400">You Get:</span>
            <div className="flex items-center gap-2">
              <FaCoins className="text-yellow-400" />
              <span className="font-bold text-yellow-400 text-lg">{product.gives_coins} coins</span>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-white border-opacity-10">
          <div className="flex items-center justify-center">
            <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
              ₹{product.price_real}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onPurchase(product)}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105"
      >
        <FaShoppingCart />
        {loading ? 'Processing...' : 'Buy Now'}
      </button>

      {product.limited_stock && product.stock_remaining !== undefined && (
        <div className="mt-3 text-center">
          <span className="text-xs text-orange-400">
            ⚡ Only {product.stock_remaining} left!
          </span>
        </div>
      )}
    </div>
  );
};

export default ShopProductCard;
