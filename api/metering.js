// Vercel Node.js Serverless Function: Usage metering and limits
// Expects env:
// - STRIPE_SECRET_KEY (for customer lookup)
// - METERING_STORE_URL (optional: external store for usage data)

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const meteringStoreUrl = process.env.METERING_STORE_URL;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

// Plan limits (can be moved to env or DB)
const PLAN_LIMITS = {
  trial: { searches: 5, applies: 3 },
  subscriber: { searches: 100, applies: 50 },
  owner: { searches: 1000, applies: 500 },
  admin: { searches: -1, applies: -1 }, // unlimited
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, customerId, userId } = req.body || {};
    
    if (!action || !['check', 'increment'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "check" or "increment"' });
    }

    // Get user role (simplified - in production, query your DB)
    let userRole = 'trial';
    if (customerId && stripe) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
        if (subscriptions.data.length > 0) {
          userRole = 'subscriber';
        }
      } catch (err) {
        console.warn('Could not fetch customer/subscription:', err.message);
      }
    }

    const limits = PLAN_LIMITS[userRole] || PLAN_LIMITS.trial;
    
    if (action === 'check') {
      // Check if user can perform action
      const { searches, applies } = req.body;
      const canSearch = limits.searches === -1 || searches < limits.searches;
      const canApply = limits.applies === -1 || applies < limits.applies;
      
      return res.status(200).json({
        canSearch,
        canApply,
        limits,
        role: userRole,
        remaining: {
          searches: limits.searches === -1 ? -1 : Math.max(0, limits.searches - (searches || 0)),
          applies: limits.applies === -1 ? -1 : Math.max(0, limits.applies - (applies || 0)),
        }
      });
    }

    if (action === 'increment') {
      // TODO: Increment usage counters in your store
      // For now, just return success
      return res.status(200).json({ success: true, role: userRole, limits });
    }

  } catch (error) {
    console.error('Metering error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
