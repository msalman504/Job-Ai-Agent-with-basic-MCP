import React from 'react';
import { CpuChipIcon, DocumentTextIcon, ClockIcon, PlayIcon } from './icons';

interface ControlPanelProps {
  resume: string;
  setResume: (resume: string) => void;
  timeFilter: string;
  setTimeFilter: (filter: string) => void;
  onStart: () => void;
  isLoading: boolean;
}

const PanelHeader: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex items-center gap-3 mb-4 text-mcp-secondary">
        {children}
        <h3 className="text-lg font-bold tracking-widest uppercase">{title}</h3>
    </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  resume,
  setResume,
  timeFilter,
  setTimeFilter,
  onStart,
  isLoading,
}) => {
  return (
    <div className="bg-mcp-light-background p-6 border border-mcp-border rounded-lg shadow-lg h-full flex flex-col">
      <PanelHeader title="Directive Input">
        <CpuChipIcon className="w-6 h-6" />
      </PanelHeader>
      
      <div className="flex flex-col gap-6 flex-grow">
        <div>
          <label htmlFor="resume" className="flex items-center gap-2 mb-2 text-mcp-primary font-semibold">
            <DocumentTextIcon className="w-5 h-5"/>
            Resume Data
          </label>
          <textarea
            id="resume"
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Paste your resume text here..."
            className="w-full h-48 p-3 bg-mcp-background border border-mcp-border rounded-md focus:ring-2 focus:ring-mcp-primary focus:border-mcp-primary outline-none transition-all duration-300 resize-none"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="timeFilter" className="flex items-center gap-2 mb-2 text-mcp-primary font-semibold">
            <ClockIcon className="w-5 h-5"/>
            Time Horizon
          </label>
          <select
            id="timeFilter"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full p-3 bg-mcp-background border border-mcp-border rounded-md focus:ring-2 focus:ring-mcp-primary focus:border-mcp-primary outline-none transition-all duration-300"
            disabled={isLoading}
          >
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
          <p className="text-xs text-mcp-text/50 mt-2">
            The agent uses live web search to prioritize recent and available job postings.
          </p>
        </div>
      </div>
      
      <button
        onClick={onStart}
        disabled={isLoading || !resume.trim()}
        className="w-full mt-6 py-4 px-6 bg-mcp-primary text-white font-bold text-lg rounded-lg flex items-center justify-center gap-3 uppercase tracking-widest
                   hover:bg-mcp-secondary hover:shadow-glow-secondary transition-all duration-300
                   disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <PlayIcon className="w-6 h-6"/>
        {isLoading ? 'Processing...' : 'Initiate Protocol'}
      </button>
    </div>
  );
};