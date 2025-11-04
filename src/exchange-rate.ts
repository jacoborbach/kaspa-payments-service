/**
 * Exchange Rate Service
 * Fetches KAS/USD rates from CoinGecko API
 * Extracted from WooCommerce plugin's get_kas_rate() method
 */

import fetch from 'node-fetch';
import { ExchangeRateResponse } from './types';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry {
  rate: number;
  timestamp: number;
}

let rateCache: CacheEntry | null = null;

export class ExchangeRateService {
  /**
   * Get current KAS/USD exchange rate
   * Uses caching to avoid excessive API calls
   */
  async getRate(): Promise<ExchangeRateResponse> {
    // Check cache first
    if (rateCache && Date.now() - rateCache.timestamp < CACHE_TTL) {
      return {
        rate: rateCache.rate,
        timestamp: rateCache.timestamp,
      };
    }

    try {
      const response = await fetch(COINGECKO_API_URL, {
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000,
      } as any);

      if (!response.ok) {
        // Return cached rate if available, otherwise error
        if (rateCache) {
          return {
            rate: rateCache.rate,
            timestamp: rateCache.timestamp,
            error: 'Failed to fetch new rate, using cached',
          };
        }

        return {
          rate: 0.08, // Fallback rate
          timestamp: Math.floor(Date.now() / 1000),
          error: 'Failed to fetch rate',
        };
      }

      const data = await response.json() as { kaspa?: { usd?: number | string } };

      if (data.kaspa && data.kaspa.usd) {
        const rate = parseFloat(String(data.kaspa.usd));

        // Update cache
        rateCache = {
          rate,
          timestamp: Math.floor(Date.now() / 1000),
        };

        return {
          rate,
          timestamp: rateCache.timestamp,
        };
      }

      // Fallback to cached or default
      if (rateCache) {
        return {
          rate: rateCache.rate,
          timestamp: rateCache.timestamp,
          error: 'Invalid response format, using cached',
        };
      }

      return {
        rate: 0.08, // Fallback rate
        timestamp: Math.floor(Date.now() / 1000),
        error: 'Invalid response format',
      };
    } catch (error: any) {
      // Return cached rate if available
      if (rateCache) {
        return {
          rate: rateCache.rate,
          timestamp: rateCache.timestamp,
          error: 'API error, using cached rate',
        };
      }

      return {
        rate: 0.08, // Fallback rate
        timestamp: Math.floor(Date.now() / 1000),
        error: error.message || 'Failed to fetch rate',
      };
    }
  }

  /**
   * Calculate KAS amount needed for a fiat amount
   */
  async calculateKasAmount(fiatAmount: number): Promise<number> {
    const rateResult = await this.getRate();
    const rate = rateResult.rate || 0.08; // Fallback to $0.08 per KAS

    return Math.round((fiatAmount / rate) * 100000000) / 100000000; // Round to 8 decimals
  }
}

