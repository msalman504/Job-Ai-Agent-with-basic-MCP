// Vercel Node.js Serverless Function: Trial management
// Expects env:
// - TRIAL_DURATION_DAYS (default: 7)
// - TRIAL_SEARCH_LIMIT (default: 5)
// - TRIAL_APPLY_LIMIT (default: 3)

const TRIAL_DURATION_DAYS = parseInt(process.env.TRIAL_DURATION_DAYS) || 7;
const TRIAL_SEARCH_LIMIT = parseInt(process.env.TRIAL_SEARCH_LIMIT) || 5;
const TRIAL_APPLY_LIMIT = parseInt(process.env.TRIAL_APPLY_LIMIT) || 3;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, userId } = req.body || {};
    
    if (!action || !['check', 'start', 'extend'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "check", "start", or "extend"' });
    }

    // Get trial info from localStorage (in production, use your DB)
    const trialKey = `job-agent.trial.${userId || 'default'}`;
    let trialData = null;
    
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(trialKey);
        trialData = stored ? JSON.parse(stored) : null;
      } catch (err) {
        console.warn('Could not parse trial data:', err.message);
      }
    }

    const now = new Date();
    const trialStartDate = trialData?.startDate ? new Date(trialData.startDate) : null;
    const trialEndDate = trialStartDate ? new Date(trialStartDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000) : null;
    const isTrialActive = trialEndDate && now < trialEndDate;
    const daysRemaining = trialEndDate ? Math.max(0, Math.ceil((trialEndDate - now) / (24 * 60 * 60 * 1000))) : 0;

    switch (action) {
      case 'check':
        return res.status(200).json({
          isTrialActive,
          daysRemaining,
          trialStartDate: trialStartDate?.toISOString(),
          trialEndDate: trialEndDate?.toISOString(),
          limits: {
            searches: TRIAL_SEARCH_LIMIT,
            applies: TRIAL_APPLY_LIMIT,
          },
          usage: trialData?.usage || { searches: 0, applies: 0 },
        });

      case 'start':
        if (trialData && isTrialActive) {
          return res.status(400).json({ error: 'Trial already active' });
        }

        const newTrialData = {
          startDate: now.toISOString(),
          usage: { searches: 0, applies: 0 },
        };

        // In production, save to your database
        if (typeof window !== 'undefined') {
          localStorage.setItem(trialKey, JSON.stringify(newTrialData));
        }

        return res.status(200).json({
          success: true,
          trialStartDate: newTrialData.startDate,
          trialEndDate: new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          limits: {
            searches: TRIAL_SEARCH_LIMIT,
            applies: TRIAL_APPLY_LIMIT,
          },
        });

      case 'extend':
        if (!trialData || !isTrialActive) {
          return res.status(400).json({ error: 'No active trial to extend' });
        }

        // Extend trial by 3 days (configurable)
        const extendedEndDate = new Date(trialEndDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        const extendedTrialData = {
          ...trialData,
          extendedEndDate: extendedEndDate.toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(trialKey, JSON.stringify(extendedTrialData));
        }

        return res.status(200).json({
          success: true,
          trialEndDate: extendedEndDate.toISOString(),
          daysRemaining: Math.ceil((extendedEndDate - now) / (24 * 60 * 60 * 1000)),
        });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Trial management error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
