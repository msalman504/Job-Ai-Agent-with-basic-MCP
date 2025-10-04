import React, { useState, useEffect } from 'react';
import { useSubscription } from '../auth/SubscriptionContext';

interface BillingInfo {
  customerId: string;
  subscriptionStatus: string;
  currentPeriodEnd: string;
  planName: string;
  amount: number;
}

export const BillingDashboard: React.FC = () => {
  const { role, setRole } = useSubscription();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const isPremium = role === 'subscriber' || role === 'owner' || role === 'admin';

  useEffect(() => {
    // Simulate fetching billing info
    const customerId = localStorage.getItem('job-agent.customerId');
    if (customerId) {
      setBillingInfo({
        customerId,
        subscriptionStatus: isPremium ? 'active' : 'inactive',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        planName: isPremium ? 'Pro Monthly' : 'Free',
        amount: isPremium ? 2900 : 0, // in cents
      });
    }
    setLoading(false);
  }, [isPremium]);

  const openBillingPortal = async () => {
    try {
      const storedCustomerId = localStorage.getItem('job-agent.customerId');
      if (!storedCustomerId) {
        alert('No billing information found. Please complete checkout first.');
        return;
      }
      const resp = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: storedCustomerId })
      });
      const data = await resp.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to open billing portal.');
      }
    } catch (e) {
      alert('Billing portal error.');
    }
  };

  const startCheckout = async (billingInterval: 'month' | 'year' = 'month') => {
    try {
      // Temporary: Use direct Stripe test link
      const stripeTestUrl = 'https://buy.stripe.com/test_00gbLd8GucKXeKk6oo';
      
      // Store mock data for testing
      localStorage.setItem('job-agent.checkoutSessionId', 'test_session_' + Date.now());
      localStorage.setItem('job-agent.customerId', 'test_customer_' + Date.now());
      
      window.location.href = stripeTestUrl;
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Current Plan</h2>
              <p className="text-gray-600">
                {isPremium ? 'Pro Plan' : 'Free Plan'} - {billingInfo?.planName || 'Free'}
              </p>
              {isPremium && billingInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  Next billing: {new Date(billingInfo.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${isPremium ? (billingInfo?.amount || 2900) / 100 : 0}
                {isPremium && <span className="text-sm text-gray-500">/month</span>}
              </div>
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                isPremium 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isPremium ? 'Active' : 'Free'}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Job Searches</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isPremium ? '∞' : '3/5'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isPremium ? '∞' : '2/3'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isPremium ? '∞' : '5/10'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Subscription</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {isPremium ? (
              <>
                <button
                  onClick={openBillingPortal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Manage Billing
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel your subscription?')) {
                      // TODO: Implement cancellation
                      alert('Cancellation feature coming soon. Please contact support.');
                    }
                  }}
                  className="border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel Subscription
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => startCheckout('month')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Upgrade to Pro
                </button>
                <button
                  onClick={() => startCheckout('year')}
                  className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Save 17% with Annual
                </button>
              </>
            )}
          </div>
        </div>

        {/* Billing History */}
        {isPremium && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Pro Monthly</p>
                  <p className="text-sm text-gray-500">December 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">$29.00</p>
                  <p className="text-sm text-green-600">Paid</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Pro Monthly</p>
                  <p className="text-sm text-gray-500">November 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">$29.00</p>
                  <p className="text-sm text-green-600">Paid</p>
                </div>
              </div>
            </div>
            <button
              onClick={openBillingPortal}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              View all invoices →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
