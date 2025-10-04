// FIX: The content for this file was missing, causing multiple build errors.
// This new content implements the root App component, which orchestrates the
// application's state and logic, connecting the UI components and the Gemini service.

import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { AgentStatusPanel } from './components/AgentStatusPanel';
import { ActivityLog } from './components/ActivityLog';
import { ResultsPanel } from './components/ResultsPanel';
import { UserProfile } from './components/UserProfile';
import { Agent, AgentName, AgentStatus, Job, JobApplyStatus, LogEntry, LogLevel } from './types';
import * as geminiService from './services/geminiService';
import { useSubscription } from './auth/SubscriptionContext';

const initialAgents: Agent[] = [
  { name: AgentName.JOB_SEARCH, status: AgentStatus.IDLE },
  { name: AgentName.APPLICATION, status: AgentStatus.IDLE },
];

function App() {
  const { role } = useSubscription();
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile'>('dashboard');
  const [resume, setResume] = useState('');
  const [timeFilter, setTimeFilter] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const newLog: LogEntry = {
      level,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const updateAgentStatus = useCallback((agentName: AgentName, status: AgentStatus) => {
    setAgents(prev => prev.map(agent => agent.name === agentName ? { ...agent, status } : agent));
  }, []);

  const updateJob = useCallback((jobId: string, updates: Partial<Job>) => {
    setJobs(prev => prev.map(job => job.id === jobId ? { ...job, ...updates } : job));
  }, []);

  const handleStart = async () => {
    if (!isPremium) {
      addLog(LogLevel.INFO, 'Free plan: limited run. Upgrade for unlimited searches and applies.');
    }
    
    // Check usage limits
    try {
      const response = await fetch('/api/metering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'check', 
          searches: 0, // TODO: get from localStorage or DB
          applies: 0   // TODO: get from localStorage or DB
        }),
      });
      const data = await response.json();
      if (!data.canSearch) {
        addLog(LogLevel.WARN, 'Search limit reached. Please upgrade to continue.');
        return;
      }
    } catch (err) {
      addLog(LogLevel.WARN, 'Could not check usage limits. Proceeding...');
    }
    
    setIsLoading(true);
    setJobs([]);
    setLogs([]);
    setAgents(initialAgents);
    addLog(LogLevel.SYSTEM, 'Protocol initiated. Activating agents...');
    
    // --- JOB SEARCH AGENT ---
    updateAgentStatus(AgentName.JOB_SEARCH, AgentStatus.RUNNING);
    addLog(LogLevel.SEARCH, `Searching for jobs from the last ${timeFilter} days based on resume.`);
    
    try {
        let foundJobs = await geminiService.searchJobs(resume, timeFilter);
        if (!isPremium) {
            foundJobs = foundJobs.slice(0, 3);
        }
        if (foundJobs.length === 0) {
            addLog(LogLevel.WARN, 'Job Search Agent found no new job targets. Protocol finished.');
            updateAgentStatus(AgentName.JOB_SEARCH, AgentStatus.COMPLETED);
            setIsLoading(false);
            return;
        }

        addLog(LogLevel.SUCCESS, `Job Search Agent identified ${foundJobs.length} potential targets.`);
        updateAgentStatus(AgentName.JOB_SEARCH, AgentStatus.COMPLETED);
        setJobs(foundJobs);

        // --- APPLICATION AGENT ---
        updateAgentStatus(AgentName.APPLICATION, AgentStatus.RUNNING);
        addLog(LogLevel.INFO, 'Application Agent activated. Analyzing targets and preparing application packages.');

        for (const job of foundJobs) {
            try {
                // Analyze job
                updateJob(job.id, { status: JobApplyStatus.ANALYZING });
                addLog(LogLevel.ANALYZE, `Analyzing match for "${job.title}" at ${job.company}.`);
                const analysis = await geminiService.analyzeJobMatch(resume, job.description);
                updateJob(job.id, { ...analysis, status: JobApplyStatus.APPLYING });
                addLog(LogLevel.SUCCESS, `Analysis complete. ATS score: ${analysis.atsScore}%.`);

                // Prepare application data
                addLog(LogLevel.APPLY, `Generating application materials for "${job.title}".`);
                const [appData, coverLetter] = await Promise.all([
                    geminiService.generateApplicationData(resume, job),
                    geminiService.generateCoverLetter(resume, job)
                ]);

                updateJob(job.id, {
                    applicationData: JSON.stringify(appData),
                    coverLetter,
                    status: JobApplyStatus.READY_TO_DISPATCH,
                });
                addLog(LogLevel.SUCCESS, `Application package for "${job.title}" is ready for dispatch.`);
            } catch (jobError) {
                const errorMessage = jobError instanceof Error ? jobError.message : 'An unknown error occurred';
                addLog(LogLevel.ERROR, `Failed to process job "${job.title}": ${errorMessage}`);
                updateJob(job.id, { status: JobApplyStatus.FAILED });
            }
        }
        
        updateAgentStatus(AgentName.APPLICATION, AgentStatus.COMPLETED);
        addLog(LogLevel.SYSTEM, 'All agents have completed their tasks. System standing by.');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown critical error occurred';
        addLog(LogLevel.ERROR, `A critical error occurred: ${errorMessage}`);
        updateAgentStatus(AgentName.JOB_SEARCH, AgentStatus.ERROR);
        updateAgentStatus(AgentName.APPLICATION, AgentStatus.ERROR);
    } finally {
        setIsLoading(false);
    }
  };

  const handleApply = (job: Job) => {
    updateJob(job.id, { status: JobApplyStatus.DISPATCHED });
    addLog(LogLevel.APPLY, `Application for "${job.title}" dispatched to user for final submission.`);
  };

  const startCheckout = async (billingInterval: 'month' | 'year' = 'month') => {
    try {
      // Temporary: Use direct Stripe test link
      const stripeTestUrl = 'https://buy.stripe.com/test_00gbLd8GucKXeKk6oo';
      
      // Store a mock session ID for testing
      window.localStorage.setItem('job-agent.checkoutSessionId', 'test_session_' + Date.now());
      window.localStorage.setItem('job-agent.customerId', 'test_customer_' + Date.now());
      
      addLog(LogLevel.INFO, 'Redirecting to Stripe checkout...');
      window.location.href = stripeTestUrl;
    } catch (err) {
      addLog(LogLevel.ERROR, 'Checkout failed.');
    }
  };

  const isPremium = role === 'subscriber' || role === 'owner' || role === 'admin';

  const openBillingPortal = async () => {
    try {
      const storedCustomerId = window.localStorage.getItem('job-agent.customerId');
      if (!storedCustomerId) {
        addLog(LogLevel.WARN, 'No Stripe customerId found. Complete checkout first.');
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
        addLog(LogLevel.ERROR, 'Unable to open billing portal.');
      }
    } catch (e) {
      addLog(LogLevel.ERROR, 'Billing portal error.');
    }
  };

  if (currentView === 'profile') {
    return <UserProfile />;
  }

  return (
    <div className="bg-mcp-background text-mcp-text min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-mcp-primary tracking-widest uppercase">Job Agent</h1>
        <p className="text-mcp-secondary">Automated Job Search & Application Assistant</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setCurrentView('profile')}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
          >
            Profile
          </button>
          {!isPremium && (
            <>
              <button
                onClick={() => startCheckout('month')}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Upgrade to Pro (Monthly)
              </button>
              <button
                onClick={() => startCheckout('year')}
                className="px-4 py-2 rounded bg-slate-600 text-white hover:bg-slate-700"
              >
                Annual (Save)
              </button>
            </>
          )}
          {isPremium && (
            <button
              onClick={openBillingPortal}
              className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Manage Billing
            </button>
          )}
        </div>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <ControlPanel 
            resume={resume}
            setResume={setResume}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            onStart={handleStart}
            isLoading={isLoading}
          />
          <AgentStatusPanel agents={agents} />
        </div>
        
        <div className="lg:col-span-2 h-[80vh] flex flex-col gap-6">
            <div className="flex-1 min-h-0">
                <ResultsPanel jobs={jobs} onApply={handleApply} />
            </div>
            <div className="flex-1 min-h-0">
                <ActivityLog logs={logs} />
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;