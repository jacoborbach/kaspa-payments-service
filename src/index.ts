/**
 * Kaspa Payments Service - Main API Server
 * Platform-agnostic payment service for Kaspa cryptocurrency
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { KaspaApiClient } from './kaspa-api';
import { ExchangeRateService } from './exchange-rate';
import { PaymentCheckRequest } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const kaspaApi = new KaspaApiClient();
const exchangeRate = new ExchangeRateService();

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'kaspa-payments-service' });
});

// Get balance for a Kaspa address
app.get('/api/balance/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const result = await kaspaApi.getBalance(address);

    if (result.error) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get current exchange rate
app.get('/api/rate', async (req: Request, res: Response) => {
  try {
    const result = await exchangeRate.getRate();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate KAS amount for fiat amount
app.post('/api/calculate-kas', async (req: Request, res: Response) => {
  try {
    const { fiatAmount } = req.body;

    if (!fiatAmount || isNaN(fiatAmount)) {
      return res.status(400).json({ error: 'Valid fiatAmount is required' });
    }

    const kasAmount = await exchangeRate.calculateKasAmount(parseFloat(fiatAmount));
    res.json({ kasAmount, fiatAmount: parseFloat(fiatAmount) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check if payment has been received
app.post('/api/check-payment', async (req: Request, res: Response) => {
  try {
    const { address, expectedAmount, sinceTimestamp } = req.body as PaymentCheckRequest;

    if (!address || !expectedAmount) {
      return res.status(400).json({
        found: false,
        error: 'address and expectedAmount are required',
      });
    }

    const result = await kaspaApi.checkPaymentReceived(
      address,
      parseFloat(expectedAmount.toString()),
      sinceTimestamp ? parseInt(sinceTimestamp.toString()) : undefined
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      found: false,
      error: error.message,
    });
  }
});

// Webhook endpoint (for future use)
app.post('/api/webhook', async (req: Request, res: Response) => {
  try {
    // Webhook handling can be implemented here
    // For now, just acknowledge receipt
    res.json({ received: true, timestamp: Date.now() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server (for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Kaspa Payments Service running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  });
}

// Export for Vercel serverless
export default app;

