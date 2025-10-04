// Vercel Node.js Serverless Function: Create Stripe Billing Portal URL
// Expects env:
// - STRIPE_SECRET_KEY
// - PUBLIC_APP_URL

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const publicAppUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!stripe) throw new Error('Stripe is not configured');

    const { customerId } = req.body || {};
    if (!customerId) throw new Error('Missing customerId');

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${publicAppUrl}/billing`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

