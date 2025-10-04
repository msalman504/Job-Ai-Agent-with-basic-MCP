# Job Agent - AI-Powered Job Application Assistant

Job Agent is an intelligent, multi-agent web application designed to automate and streamline the most tedious parts of the job search process. By leveraging the power of the Google Gemini API, it acts as a personal career assistant, finding relevant job opportunities, analyzing them against your resume, and preparing a complete application package for your final review and submission.

The user interface is designed to resemble a mission control panel, visualizing the "Job Search" and "Application" agents as they perform their tasks in a "Model Context Protocol" (MCP).

![Job Agent Screenshot](https://storage.googleapis.com/aistudio-hosting/workspace-files/job-agent-screenshot.png) 
*(This is a representative image of the application's interface)*

---

## ✨ Features

-   **AI-Powered Job Search**: Ingests your resume text and uses Google Search via the Gemini API to find the most relevant job postings within a specified time frame.
-   **ATS Match Score**: Analyzes each found job against your resume to provide an estimated Applicant Tracking System (ATS) score, giving you a quick insight into your chances.
-   **Actionable Resume Suggestions**: For each job, the AI provides specific, actionable suggestions on how to tailor your resume to better match the job description.
-   **Automated Cover Letter Generation**: Creates a unique, professional, and compelling cover letter from scratch, tailored specifically to the job and your resume.
-   **Application Data Pre-fill**: Extracts key personal information (Full Name, Email, Phone) from your resume and generates a concise statement of interest to speed up form filling.
-   **Assisted Application Protocol**: Prepares a complete application package and opens the job link in a new tab. It provides easy "copy" buttons for all generated content, allowing you to complete applications in seconds.
-   **Multi-Agent UI**: A dynamic interface that shows the real-time status of the `Job Search Agent` and `Application Agent`, complete with a detailed activity log for full transparency.

---

## ⚙️ How It Works

The application follows a simple, powerful workflow:

1.  **Input**: Paste your complete resume into the "Resume Data" field and select a "Time Horizon" for how recent the job postings should be.
2.  **Initiate**: Click "Initiate Protocol".
3.  **Search**: The **Job Search Agent** activates. It uses your resume to query for relevant jobs and populates the "Job Targets" panel.
4.  **Analyze & Prepare**: The **Application Agent** activates. For each job, it performs a sequence of tasks:
    -   Calculates the ATS score and generates resume suggestions.
    -   Generates a tailored cover letter.
    -   Extracts personal data and creates an "interest statement".
    -   Updates the job's status to `READY FOR DISPATCH`.
5.  **Review**: Expand any job card in the "Job Targets" panel to see the full analysis, suggestions, cover letter, and pre-filled data.
6.  **Dispatch**: Click the **"Dispatch Application"** button. This action:
    -   Opens the official job application page in a new browser tab.
    -   Makes the complete application package (cover letter, personal data) available for you to easily copy and paste into the form.
7.  **Submit**: You have the final control. Review the pre-filled form on the job site and click submit.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI / Language Model**: Google Gemini API (`gemini-2.5-flash`) via the `@google/genai` SDK.

---

## 🚀 Getting Started

To run this project locally, you will need Node.js and npm installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/Job-Ai-Agent-with-basic-MCP.git
    cd Job-Ai-Agent-with-basic-MCP
    ```

2.  **Get your API Key:**
    -   You need a Google Gemini API key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

3.  **Set up environment variables:**
    -   The application loads the Gemini API key from an environment variable named `process.env.API_KEY`. For local development, you would typically use a `.env` file and a tool like Vite or Create React App to load it.

4.  **Environment variables:**
    - Create a `.env.local` file with:
    ```bash
    VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx_from_clerk
    API_KEY=your_gemini_api_key
    ```

5.  **Install dependencies and run:**
    ```bash
    npm install
    npm run dev
    ```

---

## ⚠️ Disclaimer

This tool is an **assistant** and is designed with a "human-in-the-loop" philosophy. **It does not automatically submit job applications on your behalf.** You, the user, are always in control of the final submission. This ensures that you can review all AI-generated content and verify the application details before they are sent. The goal is to augment your job search, not replace your judgment.
