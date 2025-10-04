// Vercel Node.js Serverless Function: Stripe Webhook handler
// Expects env:
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET

import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on('data', (chunk) => chunks.push(chunk));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  if (!stripe || !webhookSecret) {
    return res.status(500).send('Stripe not configured');
  }

  let event;
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout completed:', session.id, 'Customer:', session.customer);
        // TODO: Store customerId and set role to 'subscriber' in your DB
        // For now, this is handled client-side via localStorage
        break;
      case 'invoice.paid':
        console.log('Invoice paid:', event.data.object.id);
        // TODO: Ensure subscription is active in your DB
        break;
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
        // TODO: Update user role based on subscription status
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription deleted:', event.data.object.id);
        // TODO: Downgrade user to 'trial' role
        break;
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

