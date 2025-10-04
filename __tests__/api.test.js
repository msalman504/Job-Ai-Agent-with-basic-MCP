// API endpoint tests
// Run with: npm test or jest

const { mockFetch } = require('./auth.test.js');

describe('API Endpoints', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Checkout API', () => {
    test('should create checkout session', async () => {
      const mockResponse = {
        url: 'https://checkout.stripe.com/test_session_123',
        sessionId: 'test_session_123'
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingInterval: 'month' }),
      });

      const data = await response.json();

      expect(global.fetch).toHaveBeenCalledWith('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingInterval: 'month' }),
      });

      expect(data.url).toBe(mockResponse.url);
      expect(data.sessionId).toBe(mockResponse.sessionId);
    });

    test('should handle checkout errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ billingInterval: 'month' }),
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Metering API', () => {
    test('should check usage limits', async () => {
      const mockResponse = {
        canSearch: true,
        canApply: true,
        limits: { searches: 5, applies: 3 },
        role: 'trial',
        remaining: { searches: 2, applies: 1 }
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const response = await fetch('/api/metering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'check', 
          searches: 3, 
          applies: 2 
        }),
      });

      const data = await response.json();

      expect(data.canSearch).toBe(true);
      expect(data.canApply).toBe(true);
      expect(data.role).toBe('trial');
      expect(data.remaining.searches).toBe(2);
    });

    test('should enforce limits for free users', async () => {
      const mockResponse = {
        canSearch: false,
        canApply: false,
        limits: { searches: 5, applies: 3 },
        role: 'trial',
        remaining: { searches: 0, applies: 0 }
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const response = await fetch('/api/metering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'check', 
          searches: 5, 
          applies: 3 
        }),
      });

      const data = await response.json();

      expect(data.canSearch).toBe(false);
      expect(data.canApply).toBe(false);
      expect(data.remaining.searches).toBe(0);
    });
  });

  describe('Trial API', () => {
    test('should start trial', async () => {
      const mockResponse = {
        success: true,
        trialStartDate: '2024-01-01T00:00:00.000Z',
        trialEndDate: '2024-01-08T00:00:00.000Z',
        limits: { searches: 5, applies: 3 }
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', userId: 'user_123' }),
      });

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.trialStartDate).toBeDefined();
      expect(data.trialEndDate).toBeDefined();
      expect(data.limits.searches).toBe(5);
    });

    test('should check trial status', async () => {
      const mockResponse = {
        isTrialActive: true,
        daysRemaining: 3,
        trialStartDate: '2024-01-01T00:00:00.000Z',
        trialEndDate: '2024-01-08T00:00:00.000Z',
        limits: { searches: 5, applies: 3 },
        usage: { searches: 2, applies: 1 }
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', userId: 'user_123' }),
      });

      const data = await response.json();

      expect(data.isTrialActive).toBe(true);
      expect(data.daysRemaining).toBeGreaterThan(0);
      expect(data.usage.searches).toBe(2);
    });
  });

  describe('Billing Portal API', () => {
    test('should create billing portal session', async () => {
      const mockResponse = {
        url: 'https://billing.stripe.com/session_123'
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'cus_123' }),
      });

      const data = await response.json();

      expect(data.url).toBe(mockResponse.url);
    });

    test('should handle missing customer ID', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ error: 'Missing customerId' }),
        status: 400,
      });

      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      expect(data.error).toBe('Missing customerId');
    });
  });

  describe('Email Reminders API', () => {
    test('should send trial started email', async () => {
      const mockResponse = {
        success: true,
        messageId: 'msg_123',
        type: 'trial_started'
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const response = await fetch('/api/email-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'trial_started',
          email: 'test@example.com',
          data: { appUrl: 'https://jobagent.com' }
        }),
      });

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.type).toBe('trial_started');
      expect(data.messageId).toBeDefined();
    });

    test('should validate email parameters', async () => {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ error: 'Missing type or email' }),
        status: 400,
      });

      const response = await fetch('/api/email-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      expect(data.error).toBe('Missing type or email');
    });
  });

  describe('Webhook API', () => {
    test('should handle checkout completed webhook', async () => {
      const mockWebhookEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer: 'cus_test_456'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ received: true }),
        status: 200,
      });

      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockWebhookEvent),
      });

      const data = await response.json();

      expect(data.received).toBe(true);
    });

    test('should handle subscription updated webhook', async () => {
      const mockWebhookEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'active'
          }
        }
      };

      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ received: true }),
        status: 200,
      });

      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockWebhookEvent),
      });

      const data = await response.json();

      expect(data.received).toBe(true);
    });
  });
});

// Helper function to simulate API responses
const createMockResponse = (data, status = 200) => {
  return {
    json: () => Promise.resolve(data),
    status,
    ok: status >= 200 && status < 300,
  };
};

module.exports = {
  createMockResponse,
};
