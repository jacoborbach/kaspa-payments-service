/**
 * Kaspa API Client
 * Extracted from WooCommerce plugin's transaction polling logic
 */

import fetch from 'node-fetch';
import { PaymentCheckResponse, BalanceResponse, KaspaTransaction } from './types';

const API_BASE_URL = 'https://api.kaspa.org';

export class KaspaApiClient {
  /**
   * Get balance for a Kaspa address
   * Converts from sompi to KAS (1 KAS = 100,000,000 sompi)
   */
  async getBalance(address: string): Promise<BalanceResponse> {
    // Ensure address has kaspa: prefix
    const fullAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    const url = `${API_BASE_URL}/addresses/${encodeURIComponent(fullAddress)}/balance`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Kaspa-Payments-Service/1.0',
          'Accept': 'application/json',
        },
        timeout: 15000,
      } as any);

      if (!response.ok) {
        return {
          balance: 0,
          address: fullAddress,
          error: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();

      if (data.balance !== undefined) {
        const balanceSompi = data.balance;
        const balanceKas = balanceSompi / 100000000; // Convert sompi to KAS

        return {
          balance: balanceKas,
          address: fullAddress,
        };
      }

      return {
        balance: 0,
        address: fullAddress,
        error: 'Invalid response format',
      };
    } catch (error: any) {
      return {
        balance: 0,
        address: fullAddress,
        error: error.message || 'API call failed',
      };
    }
  }

  /**
   * Get full transactions for an address
   */
  async getFullTransactions(address: string): Promise<KaspaTransaction[] | null> {
    const fullAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    const url = `${API_BASE_URL}/addresses/${encodeURIComponent(fullAddress)}/full-transactions`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Kaspa-Payments-Service/1.0',
          'Accept': 'application/json',
        },
        timeout: 15000,
      } as any);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }

      if (data.transactions && Array.isArray(data.transactions)) {
        return data.transactions;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if payment has been received
   * Uses transaction history if timestamp provided, otherwise uses balance check
   */
  async checkPaymentReceived(
    address: string,
    expectedAmount: number,
    sinceTimestamp?: number
  ): Promise<PaymentCheckResponse> {
    // If we have a timestamp, check transactions for new payments
    if (sinceTimestamp) {
      const transactions = await this.getFullTransactions(address);

      if (transactions) {
        const newPayment = this.checkNewTransactions(
          transactions,
          address,
          expectedAmount,
          sinceTimestamp
        );

        if (newPayment) {
          return newPayment;
        }
      }
    }

    // Fallback to balance check
    const balanceResult = await this.getBalance(address);

    if (balanceResult.error) {
      return {
        found: false,
        error: balanceResult.error,
      };
    }

    const tolerance = 0.00000001; // 1 sompi tolerance

    if (balanceResult.balance >= expectedAmount - tolerance) {
      return {
        found: true,
        txid: `balance-confirmed-${Date.now()}`,
        amount: balanceResult.balance,
        timestamp: Math.floor(Date.now() / 1000),
        confirmations: 1,
      };
    }

    return {
      found: false,
      expected: expectedAmount,
      currentBalance: balanceResult.balance,
      message: sinceTimestamp
        ? 'No new transactions found since order creation'
        : 'Insufficient balance',
    };
  }

  /**
   * Check for new transactions since a given timestamp
   */
  private checkNewTransactions(
    transactions: KaspaTransaction[],
    address: string,
    expectedAmount: number,
    sinceTimestamp: number
  ): PaymentCheckResponse | null {
    for (const tx of transactions) {
      // Skip old transactions
      const txTime = tx.block_time || tx.timestamp;
      if (txTime && txTime <= sinceTimestamp) {
        continue;
      }

      // Check if this transaction has outputs to our address
      if (tx.outputs && Array.isArray(tx.outputs)) {
        for (const output of tx.outputs) {
          if (
            output.script_public_key_address === address &&
            output.amount !== undefined
          ) {
            // Convert from sompi to KAS
            const receivedAmount = output.amount / 100000000;

            // Check if amount matches (with small tolerance)
            if (Math.abs(receivedAmount - expectedAmount) < 0.00000001) {
              return {
                found: true,
                txid: tx.transaction_id || `tx-${Date.now()}`,
                amount: receivedAmount,
                timestamp: txTime || Math.floor(Date.now() / 1000),
                confirmations: tx.is_accepted ? 1 : 0,
              };
            }
          }
        }
      }
    }

    return null;
  }
}

