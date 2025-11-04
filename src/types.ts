/**
 * Type definitions for Kaspa Payments Service
 */

export interface PaymentCheckRequest {
  address: string;
  expectedAmount: number;
  sinceTimestamp?: number;
}

export interface PaymentCheckResponse {
  found: boolean;
  txid?: string;
  amount?: number;
  timestamp?: number;
  confirmations?: number;
  error?: string;
  message?: string;
  currentBalance?: number;
  expected?: number;
}

export interface BalanceResponse {
  balance: number; // in KAS
  address: string;
  error?: string;
}

export interface ExchangeRateResponse {
  rate: number; // USD per KAS
  timestamp: number;
  error?: string;
}

export interface KaspaTransaction {
  transaction_id?: string;
  block_time?: number;
  timestamp?: number;
  outputs?: Array<{
    script_public_key_address?: string;
    amount?: number; // in sompi
  }>;
  is_accepted?: boolean;
}

export interface KaspaApiResponse {
  balance?: number;
  transactions?: KaspaTransaction[];
  [key: string]: any;
}

