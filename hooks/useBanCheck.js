'use client';

// Backward compatible wrapper - uses context internally
// This prevents duplicate queries across components
export function useBanCheck() {
  // Lazy import to avoid circular deps
  const { useBanContext } = require('@/context/BanContext');
  return useBanContext();
}
