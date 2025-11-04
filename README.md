# Kaspa Payments Service

Core payment service for Kaspa cryptocurrency payments - platform agnostic.

## Features

- **Payment Detection**: Monitor Kaspa blockchain for payments
- **Exchange Rates**: Fetch real-time KAS/USD rates from CoinGecko
- **Balance Checking**: Check Kaspa address balances via official API
- **REST API**: Platform-agnostic API endpoints

## API Endpoints

### `GET /api/balance/:address`
Get balance for a Kaspa address

### `GET /api/rate`
Get current KAS/USD exchange rate

### `POST /api/check-payment`
Check if payment has been received

### `POST /api/webhook`
Receive payment confirmation webhooks

## Installation

1. Install dependencies:
   ```bash
   cd /Users/jacoborbach/kaspa-payments-service
   npm install
   ```

2. Test locally:
   ```bash
   npm run dev
   ```

   The service will start on `http://localhost:3000`

## Deployment

### Deploy to Vercel (Free Tier)

1. Push to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

Vercel configuration is already set up in `vercel.json`.

### Other Deployment Options

This service can be deployed to:
- Vercel (serverless functions) ✅ Recommended
- Netlify (serverless functions)
- Railway
- Fly.io
- Any Node.js hosting

## API Endpoints

### `GET /health`
Health check endpoint
- Response: `{ status: "ok", service: "kaspa-payments-service" }`

### `GET /api/balance/:address`
Get balance for a Kaspa address
- Example: `GET /api/balance/kaspa:qxxxxxxxxxxxxx`

### `GET /api/rate`
Get current KAS/USD exchange rate from CoinGecko
- Response: `{ rate: 0.044, timestamp: 1234567890 }`

### `POST /api/calculate-kas`
Calculate KAS amount for a fiat amount
- Body: `{ "fiatAmount": 100 }`
- Response: `{ "kasAmount": 2236.08, "fiatAmount": 100 }`

### `POST /api/check-payment`
Check if payment has been received
- Body: `{ "address": "kaspa:...", "expectedAmount": 1000, "sinceTimestamp": 1234567890 }`
- Response: `{ "found": true, "receivedAmount": 1000, "confirmed": true }`

### `POST /api/webhook`
Receive payment confirmation webhooks (for future use)

## Usage

This service is designed to be called by:
- WooCommerce plugin
- Shopify app
- Magento module
- Custom integrations

### Note on Address Generation

Address generation (KPUB) is client-side JavaScript using `kaspa-simple-wallet` and remains in the WooCommerce plugin. The service focuses on payment detection and exchange rates.

