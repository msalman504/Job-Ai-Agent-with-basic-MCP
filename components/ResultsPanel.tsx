import React, { useState, useMemo } from 'react';
import { Job, JobApplyStatus } from '../types';
import { ApplicationData } from '../services/geminiService';
import { 
    ClipboardDocumentIcon, 
    ArrowTopRightOnSquareIcon, 
    BriefcaseIcon, 
    MapPinIcon, 
    LightBulbIcon, 
    ChevronDownIcon,
    UserCircleIcon,
    DocumentTextIcon,
} from './icons';

interface ResultsPanelProps {
  jobs: Job[];
  onApply: (job: Job) => void;
}

const statusInfo: Record<JobApplyStatus, { text: string; color: string; animation?: string }> = {
    [JobApplyStatus.PENDING]: { text: 'Queued', color: 'text-gray-400' },
    [JobApplyStatus.ANALYZING]: { text: 'Analyzing...', color: 'text-mcp-warning', animation: 'animate-pulse' },
    [JobApplyStatus.APPLYING]: { text: 'Compiling...', color: 'text-mcp-warning', animation: 'animate-pulse' },
    [JobApplyStatus.READY_TO_DISPATCH]: { text: 'Ready', color: 'text-mcp-primary' },
    [JobApplyStatus.DISPATCHED]: { text: 'Dispatched', color: 'text-mcp-success' },
    [JobApplyStatus.FAILED]: { text: 'Failed', color: 'text-mcp-error' },
};

const AtsScoreIndicator: React.FC<{ score?: number }> = ({ score = 0 }) => {
    const circumference = 2 * Math.PI * 20; // 2 * pi * radius
    const offset = circumference - (score / 100) * circumference;
    
    let colorClass = 'stroke-mcp-error';
    if (score >= 75) {
        colorClass = 'stroke-mcp-success';
    } else if (score >= 50) {
        colorClass = 'stroke-mcp-warning';
    }

    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 44 44">
                <circle
                    className="stroke-mcp-border"
                    strokeWidth="4"
                    fill="transparent"
                    r="20"
                    cx="22"
                    cy="22"
                />
                <circle
                    className={`transform -rotate-90 origin-center transition-all duration-1000 ${colorClass}`}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r="20"
                    cx="22"
                    cy="22"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                {score}%
            </span>
        </div>
    );
};

const DataField: React.FC<{ label: string; value: string; onCopy: () => void; copied: boolean }> = ({ label, value, onCopy, copied }) => (
    <div className="flex justify-between items-start gap-2">
        <div>
            <p className="text-xs text-mcp-text/70">{label}</p>
            <p className="text-sm text-mcp-text">{value}</p>
        </div>
        <button onClick={onCopy} className="p-1.5 text-mcp-text/70 hover:text-white hover:bg-mcp-border rounded-md transition-colors" title={`Copy ${label}`}>
            <ClipboardDocumentIcon className="w-4 h-4" />
        </button>
        {copied && <span className="text-xs text-mcp-success absolute right-10">Copied!</span>}
    </div>
);


const JobCard: React.FC<{ job: Job; onApply: (job: Job) => void; }> = ({ job, onApply }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const applicationData = useMemo(() => {
        try {
            return job.applicationData ? JSON.parse(job.applicationData) as ApplicationData : null;
        } catch {
            return null;
        }
    }, [job.applicationData]);

    const handleCopy = (field: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleDispatch = () => {
        window.open(job.url, '_blank');
        onApply(job);
    };

    const isAnalyzed = job.atsScore !== undefined;

    return (
        <div className="p-4 bg-mcp-background rounded-md border border-mcp-border/50 transition-all duration-300">
            <div className="flex justify-between items-start gap-4">
                {isAnalyzed && <AtsScoreIndicator score={job.atsScore} />}
                <div className="flex-grow">
                    <p className="font-bold text-mcp-primary">{job.title}</p>
                    <p className="text-sm text-mcp-text">{job.company}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-mcp-text/70">
                        {job.location && <div className="flex items-center gap-1"><MapPinIcon className="w-3 h-3"/>{job.location}</div>}
                        {job.jobType && <div className="flex items-center gap-1"><BriefcaseIcon className="w-3 h-3"/>{job.jobType}</div>}
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold ${statusInfo[job.status].color} ${statusInfo[job.status].animation || ''}`}>
                        {statusInfo[job.status].text.toUpperCase()}
                    </span>
                     {isAnalyzed && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-mcp-secondary hover:text-white flex items-center gap-1 text-xs">
                           Details
                           <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-mcp-border/30 space-y-4">
                    <div>
                        <h4 className="font-bold text-mcp-secondary mb-2">Job Description</h4>
                        <p className="text-sm text-mcp-text/80 max-h-32 overflow-y-auto pr-2">{job.description}</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-mcp-secondary mb-2 flex items-center gap-2"><LightBulbIcon className="w-5 h-5"/>Resume Suggestions</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-mcp-text/80">
                            {job.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>

                    {job.status === JobApplyStatus.READY_TO_DISPATCH && (
                        <div className="pt-4 mt-4 border-t border-mcp-border/30">
                            <h3 className="text-base font-bold text-mcp-primary mb-3">Application Package</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-mcp-secondary flex items-center gap-2"><UserCircleIcon className="w-5 h-5"/>Pre-filled Data</h4>
                                    {applicationData && <div className="p-3 bg-mcp-background border border-mcp-border/50 rounded-md space-y-2">
                                        <DataField label="Full Name" value={applicationData.fullName} onCopy={() => handleCopy('fullName', applicationData.fullName)} copied={copiedField === 'fullName'} />
                                        <DataField label="Email" value={applicationData.email} onCopy={() => handleCopy('email', applicationData.email)} copied={copiedField === 'email'} />
                                        <DataField label="Phone" value={applicationData.phone} onCopy={() => handleCopy('phone', applicationData.phone)} copied={copiedField === 'phone'} />
                                    </div>}
                                    <h4 className="font-bold text-mcp-secondary flex items-center gap-2 pt-2"><DocumentTextIcon className="w-5 h-5"/>Cover Letter</h4>
                                    <div className="relative">
                                        <textarea readOnly value={job.coverLetter} className="w-full h-32 p-2 bg-mcp-background border border-mcp-border/50 rounded-md text-sm text-mcp-text/80 resize-none"/>
                                        <button onClick={() => handleCopy('coverLetter', job.coverLetter!)} className="absolute top-2 right-2 p-1.5 text-mcp-text/70 hover:text-white hover:bg-mcp-border rounded-md transition-colors" title="Copy Cover Letter">
                                            <ClipboardDocumentIcon className="w-4 h-4"/>
                                        </button>
                                        {copiedField === 'coverLetter' && <span className="text-xs text-mcp-success absolute bottom-3 right-3">Copied!</span>}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                     <h4 className="font-bold text-mcp-secondary flex items-center gap-2"><LightBulbIcon className="w-5 h-5"/>Interest Statement</h4>
                                     <div className="relative">
                                        <textarea readOnly value={applicationData?.interestStatement} className="w-full h-32 p-2 bg-mcp-background border border-mcp-border/50 rounded-md text-sm text-mcp-text/80 resize-none"/>
                                        <button onClick={() => handleCopy('interest', applicationData!.interestStatement)} className="absolute top-2 right-2 p-1.5 text-mcp-text/70 hover:text-white hover:bg-mcp-border rounded-md transition-colors" title="Copy Interest Statement">
                                            <ClipboardDocumentIcon className="w-4 h-4"/>
                                        </button>
                                        {copiedField === 'interest' && <span className="text-xs text-mcp-success absolute bottom-3 right-3">Copied!</span>}
                                    </div>
                                    <button
                                      onClick={handleDispatch}
                                      className="w-full mt-2 py-3 px-3 bg-mcp-primary text-white font-bold text-sm rounded-md flex items-center justify-center gap-2 hover:bg-mcp-secondary hover:shadow-glow-secondary transition-all duration-300"
                                   >
                                       <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                       Dispatch Application
                                   </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
             {job.status === JobApplyStatus.DISPATCHED && (
                 <div className="mt-3 text-xs text-mcp-success/80 font-semibold">
                     Application dispatched. Awaiting user submission.
                 </div>
            )}
        </div>
    );
};


export const ResultsPanel: React.FC<ResultsPanelProps> = ({ jobs, onApply }) => {
    return (
        <div className="bg-mcp-light-background p-6 border border-mcp-border rounded-lg shadow-lg h-full flex flex-col">
            <h3 className="text-lg font-bold tracking-widest uppercase text-mcp-secondary mb-4">Job Targets</h3>
            <div className="flex-grow overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4f9cff #101827' }}>
                {jobs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-mcp-border font-bold">
                        AWAITING TARGETS...
                    </div>
                ) : (
                    <div className="space-y-3">
                        {jobs.map(job => (
                           <JobCard key={job.id} job={job} onApply={onApply}/>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};