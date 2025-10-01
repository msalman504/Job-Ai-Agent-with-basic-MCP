export enum AgentName {
  JOB_SEARCH = 'Job Search Agent',
  APPLICATION = 'Application Agent',
}

export enum AgentStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Agent {
  name: AgentName;
  status: AgentStatus;
}

export enum LogLevel {
  SYSTEM = 'SYSTEM',
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SEARCH = 'SEARCH',
  APPLY = 'APPLY',
  ANALYZE = 'ANALYZE',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
}

export enum JobApplyStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  APPLYING = 'APPLYING',
  READY_TO_DISPATCH = 'READY FOR DISPATCH',
  DISPATCHED = 'DISPATCHED',
  FAILED = 'FAILED',
}

export interface Job {
  id: string;
  title: string;
  company: string;
  url: string;
  status: JobApplyStatus;
  description: string;
  atsScore?: number;
  suggestions?: string[];
  location?: string;
  jobType?: string;
  coverLetter?: string;
  applicationData?: string; // JSON string of pre-filled data
}