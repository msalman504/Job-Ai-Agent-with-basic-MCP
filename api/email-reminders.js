// Vercel Node.js Serverless Function: Email reminders for trials and billing
// Expects env:
// - RESEND_API_KEY (for sending emails)
// - FROM_EMAIL (sender email address)

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || 'noreply@jobagent.com';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!resend) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const { type, email, data } = req.body || {};
    
    if (!type || !email) {
      return res.status(400).json({ error: 'Missing type or email' });
    }

    let subject, html;

    switch (type) {
      case 'trial_started':
        subject = 'Welcome to Job Agent - Your Free Trial Has Started!';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">Welcome to Job Agent!</h1>
            <p>Your 7-day free trial has started. Here's what you can do:</p>
            <ul>
              <li>Search for up to 5 jobs</li>
              <li>Generate up to 3 applications</li>
              <li>Get ATS analysis for each job</li>
              <li>Create personalized cover letters</li>
            </ul>
            <p>Ready to get started? <a href="${data?.appUrl || 'https://jobagent.com'}" style="color: #3b82f6;">Launch Job Agent</a></p>
            <p>Questions? Reply to this email and we'll help you out.</p>
          </div>
        `;
        break;

      case 'trial_ending':
        subject = 'Your Job Agent Trial Ends Tomorrow';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Trial Ending Soon</h1>
            <p>Your free trial ends tomorrow. Don't lose access to your job search automation!</p>
            <p>Upgrade to Pro to continue with:</p>
            <ul>
              <li>Unlimited job searches</li>
              <li>Advanced ATS analysis</li>
              <li>Premium cover letters</li>
              <li>Priority support</li>
            </ul>
            <p><a href="${data?.upgradeUrl || 'https://jobagent.com/pricing'}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade to Pro</a></p>
          </div>
        `;
        break;

      case 'trial_expired':
        subject = 'Your Job Agent Trial Has Expired';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Trial Expired</h1>
            <p>Your free trial has expired, but you can still upgrade to continue using Job Agent.</p>
            <p>We hope you found value in our service. Upgrade now to get back to automating your job search:</p>
            <p><a href="${data?.upgradeUrl || 'https://jobagent.com/pricing'}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade to Pro</a></p>
            <p>Need help? Reply to this email and we'll assist you.</p>
          </div>
        `;
        break;

      case 'payment_failed':
        subject = 'Payment Issue - Action Required';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Payment Issue</h1>
            <p>We couldn't process your payment for your Job Agent subscription.</p>
            <p>Please update your payment method to continue using Pro features:</p>
            <p><a href="${data?.billingUrl || 'https://jobagent.com/billing'}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment Method</a></p>
            <p>If you need help, reply to this email and we'll assist you.</p>
          </div>
        `;
        break;

      case 'subscription_cancelled':
        subject = 'We're Sorry to See You Go';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6b7280;">Subscription Cancelled</h1>
            <p>Your Job Agent subscription has been cancelled. You'll continue to have access to Pro features until ${data?.endDate || 'the end of your billing period'}.</p>
            <p>After that, you'll be moved to our free plan with limited features.</p>
            <p>Changed your mind? You can reactivate your subscription anytime:</p>
            <p><a href="${data?.reactivateUrl || 'https://jobagent.com/billing'}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reactivate Subscription</a></p>
            <p>We'd love to hear your feedback. Reply to this email to let us know how we can improve.</p>
          </div>
        `;
        break;

      default:
        return res.status(400).json({ error: 'Invalid email type' });
    }

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html,
    });

    return res.status(200).json({ 
      success: true, 
      messageId: result.data?.id,
      type 
    });

  } catch (error) {
    console.error('Email reminder error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
