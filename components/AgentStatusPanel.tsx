
import React from 'react';
import { Agent, AgentStatus } from '../types';

interface AgentStatusPanelProps {
  agents: Agent[];
}

const statusStyles: Record<AgentStatus, { color: string; text: string; animation?: string }> = {
  [AgentStatus.IDLE]: { color: 'bg-gray-500', text: 'text-gray-400' },
  [AgentStatus.RUNNING]: { color: 'bg-mcp-warning', text: 'text-mcp-warning', animation: 'animate-pulse-fast' },
  [AgentStatus.COMPLETED]: { color: 'bg-mcp-success', text: 'text-mcp-success' },
  [AgentStatus.ERROR]: { color: 'bg-mcp-error', text: 'text-mcp-error', animation: 'animate-blink' },
};

export const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({ agents }) => {
  return (
    <div className="bg-mcp-light-background p-6 border border-mcp-border rounded-lg shadow-lg">
      <h3 className="text-lg font-bold tracking-widest uppercase text-mcp-secondary mb-4">Agent Status</h3>
      <div className="space-y-4">
        {agents.map((agent) => {
          const styles = statusStyles[agent.status];
          return (
            <div key={agent.name} className="flex items-center justify-between p-3 bg-mcp-background rounded-md border border-mcp-border/50">
              <span className="font-semibold text-mcp-text">{agent.name}</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${styles.color} ${styles.animation || ''}`}></div>
                <span className={`font-bold text-sm ${styles.text}`}>{agent.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
