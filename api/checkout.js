// Vercel Node.js Serverless Function: Create Stripe Checkout Session
// Expects env:
// - STRIPE_SECRET_KEY
// - STRIPE_PRICE_PRO_MONTHLY (or STRIPE_PRICE_PRO)
// - STRIPE_PRICE_PRO_YEARLY (optional)
// - PUBLIC_APP_URL (e.g., https://your-app.vercel.app)

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO;
const priceYearly = process.env.STRIPE_PRICE_PRO_YEARLY;
const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';

if (!stripeSecretKey) {
  console.warn('Missing STRIPE_SECRET_KEY');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: enforce auth & role checks once backend session available
    if (!stripe) throw new Error('Stripe is not configured');
    if (!priceMonthly && !priceYearly) throw new Error('No Stripe prices configured');

    const { billingInterval } = req.body || {};
    const price = billingInterval === 'year' ? (priceYearly || priceMonthly) : priceMonthly;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${publicAppUrl}/?checkout=success`,
      cancel_url: `${publicAppUrl}/?checkout=cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Checkout error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

