// FIX: The content for this file was missing, causing build errors.
// This new content implements the ActivityLog component as a functional React component
// to display log entries from the application's operations.

import React from 'react';
import { LogEntry, LogLevel } from '../types';

interface ActivityLogProps {
  logs: LogEntry[];
}

const levelStyles: Record<LogLevel, { icon: string; color: string }> = {
    [LogLevel.SYSTEM]: { icon: '⚙️', color: 'text-mcp-secondary' },
    [LogLevel.INFO]: { icon: 'ℹ️', color: 'text-mcp-text' },
    [LogLevel.SUCCESS]: { icon: '✅', color: 'text-mcp-success' },
    [LogLevel.WARN]: { icon: '⚠️', color: 'text-mcp-warning' },
    [LogLevel.ERROR]: { icon: '❌', color: 'text-mcp-error' },
    [LogLevel.SEARCH]: { icon: '🔍', color: 'text-mcp-primary' },
    [LogLevel.APPLY]: { icon: '📨', color: 'text-mcp-primary' },
    [LogLevel.ANALYZE]: { icon: '📊', color: 'text-mcp-primary' },
};

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-mcp-light-background p-6 border border-mcp-border rounded-lg shadow-lg h-full flex flex-col">
      <h3 className="text-lg font-bold tracking-widest uppercase text-mcp-secondary mb-4">Activity Log</h3>
      <div 
        ref={logContainerRef} 
        className="flex-grow overflow-y-auto pr-2 bg-mcp-background p-3 rounded-md border border-mcp-border/50 text-sm font-mono"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4f9cff #101827' }}
      >
        {logs.map((log, index) => {
          const style = levelStyles[log.level];
          return (
            <div key={index} className={`flex items-start gap-3 mb-2 ${style.color}`}>
              <span className="flex-shrink-0 w-5 text-center">{style.icon}</span>
              <span className="text-mcp-text/60">{log.timestamp}</span>
              <span className="flex-grow">{log.message}</span>
            </div>
          );
        })}
         {logs.length === 0 && (
            <div className="text-mcp-text/50">Log stream initialized... Awaiting directive.</div>
        )}
      </div>
    </div>
  );
};
