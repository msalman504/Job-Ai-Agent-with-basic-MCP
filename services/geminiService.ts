import { GoogleGenAI, Type } from "@google/genai";
import { Job, JobApplyStatus } from '../types';

// FIX: Initialize GoogleGenAI strictly with process.env.API_KEY as per the coding guidelines.
// The fallback and warning are against the requirement that the API key's availability is a hard requirement and handled externally.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJobsFromText = (text: string): Job[] => {
    const jobs: Job[] = [];
    // Split by a delimiter that's unlikely to be in the job description
    const jobEntries = text.split('---JOB_SEPARATOR---');

    jobEntries.forEach((entry, index) => {
        if (!entry.trim()) return;

        try {
            const titleMatch = entry.match(/JOB:\s*(.*?)\s*\|/);
            const companyMatch = entry.match(/COMPANY:\s*(.*?)\s*\|/);
            const urlMatch = entry.match(/URL:\s*(.*?)\s*\|/);
            const descriptionMatch = entry.match(/SUMMARY:\s*([\s\S]*)/);

            if (titleMatch && companyMatch && urlMatch && descriptionMatch) {
                const job: Job = {
                    id: `job-${Date.now()}-${index}`,
                    title: titleMatch[1].trim(),
                    company: companyMatch[1].trim(),
                    url: urlMatch[1].trim(),
                    description: descriptionMatch[1].trim(),
                    status: JobApplyStatus.PENDING,
                };
                if (job.url.startsWith('http') && job.description) {
                   jobs.push(job);
                }
            }
        // FIX: Corrected a malformed try-catch block. The invalid syntax was causing multiple cascading errors.
        } catch (error) {
            console.error('Error parsing entry:', entry, error);
        }
    });

    return jobs;
};

export const searchJobs = async (resume: string, timeFilter: string): Promise<Job[]> => {
    const prompt = `
        You are an expert job search assistant. Your primary goal is to find currently available job postings that are a strong match for the provided resume.

        CRITICAL INSTRUCTIONS:
        1.  **Find ACTIVE Jobs Only**: You must only return jobs that are currently available and accepting applications. Use the Google Search tool to find the most recent listings from the last ${timeFilter} days.
        2.  **Prioritize Direct Links**: Prefer direct links to the company's own career page or primary job boards (like LinkedIn, Greenhouse, Lever). Avoid links from job aggregators that are often outdated.
        3.  **Verify Relevance**: The jobs must be highly relevant to the skills and experience listed in the resume.
        4.  **Extract a Summary**: You must extract a concise 3-4 sentence summary of the job description, capturing the key responsibilities and requirements.

        For each job found, you must format the output EXACTLY as follows, using '---JOB_SEPARATOR---' to separate each distinct job entry:
        'JOB: [Job Title] | COMPANY: [Company] | URL: [URL] | SUMMARY: [3-4 sentence summary of the job description]'
        ---JOB_SEPARATOR---
        'JOB: [Next Job Title] | COMPANY: [Next Company] | URL: [Next URL] | SUMMARY: [Next 3-4 sentence summary of the job description]'

        Resume:
        ---
        ${resume}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const jobsText = response.text;
        return parseJobsFromText(jobsText);
    } catch (error) {
        console.error("Error searching for jobs:", error);
        throw new Error("Failed to fetch jobs from Gemini API.");
    }
};

export interface JobAnalysis {
    atsScore: number;
    suggestions: string[];
    location: string;
    jobType: string;
}

export const analyzeJobMatch = async (resume: string, jobDescription: string): Promise<JobAnalysis> => {
    const prompt = `
        Analyze the provided resume against the job description from the perspective of an advanced Applicant Tracking System (ATS) and a career coach.
        Provide a detailed analysis in JSON format. The analysis must include:
        1.  "atsScore": An estimated ATS score as a percentage (a number from 0 to 100) representing how well the resume matches the job description.
        2.  "suggestions": An array of 3-5 specific, actionable suggestions for improving the resume to better match this specific job.
        3.  "location": The job location as a string (e.g., "San Francisco, CA", "Remote").
        4.  "jobType": The type of employment (e.g., "Full-time", "Contract", "Part-time").

        Resume:
        ---
        ${resume}
        ---
        Job Description:
        ---
        ${jobDescription}
        ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        atsScore: { type: Type.NUMBER },
                        suggestions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        location: { type: Type.STRING },
                        jobType: { type: Type.STRING },
                    },
                },
            },
        });

        return JSON.parse(response.text) as JobAnalysis;
    } catch (error) {
        console.error("Error analyzing job match:", error);
        throw new Error("Failed to analyze job match.");
    }
};

export interface ApplicationData {
    fullName: string;
    email: string;
    phone: string;
    interestStatement: string;
}

export const generateApplicationData = async (resume: string, job: Job): Promise<ApplicationData> => {
    const prompt = `
        Based on the provided resume and job description, extract key personal information and generate a compelling statement of interest.
        Provide the output in a structured JSON format. The JSON object must include:
        1. "fullName": The full name of the applicant.
        2. "email": The primary email address.
        3. "phone": The primary phone number.
        4. "interestStatement": A concise, 2-3 sentence paragraph explaining why the applicant is a great fit for this specific role at this company, tailored from their resume.

        Resume:
        ---
        ${resume}
        ---
        Job: ${job.title} at ${job.company}
        ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fullName: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        interestStatement: { type: Type.STRING },
                    },
                },
            },
        });
        return JSON.parse(response.text) as ApplicationData;
    } catch (error) {
        console.error("Error generating application data:", error);
        throw new Error("Failed to generate application data.");
    }
};

export const generateCoverLetter = async (resume: string, job: Job): Promise<string> => {
    const prompt = `
        You are an expert career assistant. Your task is to write a professional and compelling cover letter for a specific job application.
        Use the provided resume and the detailed job description to highlight the most relevant skills and experiences.
        The cover letter must be tailored specifically to the job. Maintain a professional tone and structure.
        Only output the cover letter text, without any introductory or concluding remarks.

        Job Title: ${job.title} at ${job.company}
        Job Description: ${job.description}
        Resume:
        ---
        ${resume}
        ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating cover letter:", error);
        throw new Error("Failed to generate cover letter.");
    }
};