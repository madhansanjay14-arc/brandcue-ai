# BrandCue AI
### Every Content. One Consistent Brand.

**An AI-powered brand compliance platform that helps organizations maintain consistent, trustworthy and compliant brand communication.**

<p align="center">

  **[Live Application](https://brandcue-ai.vercel.app/) · [API Documentation](https://brandcue-ai-backend.onrender.com/docs) · [GitHub Repository](https://github.com/madhansanjay14-arc/brandcue-ai)**

</p>

---

## Overview

Organizations often struggle to maintain consistent brand communication across different content creators, marketing teams and communication channels.

**BrandCue AI** addresses this challenge by evaluating submitted content against approved brand guidelines.

The platform uses Large Language Model (LLM)-powered analysis to identify potential violations, explain detected issues, suggest corrections and calculate a brand compliance score.

It also supports AI-powered extraction of brand guidelines from PDF documents and provides a human-controlled approval workflow.

The goal is simple: help organizations maintain one consistent brand identity across every piece of content.

---

## Key Features

### 1. AI-Powered Content Analysis
Analyses submitted marketing content against approved brand guidelines using Groq AI.

### 2. Brand Guidelines Management
Create, organize and manage approved brand rules across different categories.

### 3. AI-Powered PDF Guideline Extraction
Upload brand guideline PDFs and automatically extract structured rules using AI.

### 4. Violation Detection
Identifies potential violations of approved brand standards and provides explanations.

### 5. Correction Suggestions
Generates actionable suggestions and corrected content to improve brand compliance.

### 6. Brand Compliance Score
Calculates an overall compliance score based on passed and violated guidelines.

### 7. Human Review Workflow
Allows reviewers to approve or reject submissions and provide comments.

### 8. Review Queue
Displays submissions requiring human review.

### 9. Submission History
Maintains previous submissions, analysis results and reviewer decisions.

### 10. Duplicate Guideline Prevention
Prevents duplicate guidelines from being unnecessarily added to the brand rule library.

---

## Application Workflow

1. An administrator creates brand guidelines manually or uploads a PDF.
2. BrandCue AI extracts structured guidelines from the uploaded document.
3. The administrator reviews and selects the guidelines to save.
4. A content creator submits marketing content.
5. The backend retrieves active brand guidelines.
6. The AI service analyses the submitted content against those guidelines.
7. Potential violations and explanations are generated.
8. Correction suggestions and corrected content are provided.
9. A compliance score is calculated.
10. A human reviewer approves or rejects the submission.
11. Submission and review information are available in History.

**Human accountability:** AI analysis is advisory. Final approval remains with a human reviewer. BrandCue AI does not automatically publish content.

---

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | CSS |
| Backend | Python |
| API Framework | FastAPI |
| Database | SQLite |
| AI Provider | Groq API |
| AI Model | openai/gpt-oss-120b |
| PDF Processing | PyMuPDF |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git and GitHub |

---

## System Architecture

```text
                    USER
                      |
                      v
              REACT + VITE
                 FRONTEND
                      |
                HTTP REQUESTS
                      |
                      v
                FASTAPI
                 BACKEND
                      |
           +----------+----------+
           |                     |
           v                     v
      SQLITE DATABASE         GROQ API
           |                     |
           |                LLM ANALYSIS
           |                     |
           +----------+----------+
                      |
                      v
                ANALYSIS RESULTS
                      |
           +----------+----------+
           |                     |
           v                     v
      COMPLIANCE SCORE      CORRECTIONS
           |                     |
           +----------+----------+
                      |
                      v
                 HUMAN REVIEW
                      |
                      v
                APPROVE / REJECT
                      |
                      v
              SUBMISSION HISTORY
```

### Component Responsibilities

- **React + Vite:** Provides the user interface for managing guidelines, submitting content and reviewing analysis results.
- **FastAPI:** Handles API requests, backend processing and communication between application components.
- **Groq API:** Performs AI-powered guideline extraction and content analysis.
- **SQLite:** Stores brand guidelines, content submissions, analysis results and review information.
- **PyMuPDF:** Extracts text from uploaded PDF documents.

---

## AI-Powered Brand Compliance Analysis

BrandCue AI evaluates submitted content against active brand guidelines.

### Analysis Process

1. Retrieve active brand guidelines.
2. Submit content and guideline information to the AI service.
3. Identify potential guideline violations.
4. Validate detected violation references against approved guideline titles.
5. Generate explanations for identified issues.
6. Provide correction suggestions.
7. Generate corrected content.
8. Calculate the compliance score.
9. Send the result for human review.

### Compliance Score Calculation

The platform currently uses a count-based compliance calculation.

**Formula:**

```text
Compliance Score =
(Passed Guidelines / Total Guidelines) × 100
```

**Example:**

| Metric | Value |
|---|---:|
| Total Guidelines | 4 |
| Passed Guidelines | 2 |
| Violated Guidelines | 2 |
| Compliance Score | 50% |

The score represents the proportion of guidelines passed. It is not currently severity-weighted.

---

## AI-Powered PDF Guideline Extraction

BrandCue AI allows users to upload brand guideline PDF documents and extract structured rules.

### Extraction Workflow

1. User uploads a PDF.
2. FastAPI receives the document.
3. PyMuPDF extracts the document text.
4. Extracted text is processed using Groq AI.
5. Structured brand guidelines are generated.
6. Extracted guidelines are returned for review.
7. Users can select the guidelines they want to save.

Each extracted guideline contains:

- Title
- Category
- Rule
- Description

Extracted guidelines are not automatically saved. Users review and select them before adding them to the approved brand library.

---

## Human Review and Approval

BrandCue AI maintains human control over final content decisions.

The review workflow includes:

- AI-generated analysis results.
- Identified violations and correction suggestions.
- Pending submissions in the Review Queue.
- Human approval or rejection.
- Reviewer comments.
- Recorded review decisions.
- Submission History.

This approach ensures that AI assists the review process without replacing human accountability.

---

## Project Structure

```text
brandcue-ai/
│
├── backend/
│   ├── main.py
│   ├── ai_service.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env                 # Local environment file; not committed
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── services/
│   │       └── api.js
│   │
│   ├── package.json
│   └── index.html
│
├── docs/
│   └── screenshots/
│       ├── ai-analysis.png
│       ├── pdf-extraction.png
│       └── review-queue.png
│
├── .gitignore
└── README.md
```

The `.env` file and local database are excluded from version control.

---

## Live Demo

| Resource | Link |
|---|---|
| Live Application | [BrandCue AI](https://brandcue-ai.vercel.app/) |
| Backend API | [Render Backend](https://brandcue-ai-backend.onrender.com/) |
| Health Check | [Backend Health](https://brandcue-ai-backend.onrender.com/health) |
| Interactive API Documentation | [FastAPI Swagger Docs](https://brandcue-ai-backend.onrender.com/docs) |
| Source Code | [GitHub Repository](https://github.com/madhansanjay14-arc/brandcue-ai) |

---

## Local Installation

### Prerequisites

Install the following:

- Python
- Node.js and npm
- Git
- Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/madhansanjay14-arc/brandcue-ai.git

cd brandcue-ai
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the backend directory:

```env
GROQ_API_KEY=your_groq_api_key
```

Start the backend:

```bash
python -m uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Configure the API base URL in:

```text
frontend/src/services/api.js
```

For local backend development, use:

```javascript
const API_URL = "http://127.0.0.1:8000";
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

**Note:** Restore the deployed Render API URL before committing changes intended for production.

---

## Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend information |
| GET | `/health` | Health check |
| POST | `/submissions` | Submit content |
| GET | `/submissions` | Retrieve submissions |
| POST | `/guidelines` | Create brand guidelines |
| GET | `/guidelines` | Retrieve active guidelines |
| POST | `/guidelines/extract-pdf` | Extract guidelines from PDF |
| POST | `/analyze/{submission_id}` | Analyse submitted content |
| GET | `/reviews` | Retrieve pending reviews |
| POST | `/reviews/{submission_id}` | Submit human review |
| GET | `/history` | Retrieve submission history |

Full API documentation is available through the deployed FastAPI Swagger interface.

---

## Testing and Validation

The following implementation checks have been performed:

- Frontend production build completed successfully.
- Backend startup tested using Uvicorn.
- Backend health endpoint tested successfully.
- PDF guideline extraction API returned HTTP 200 in testing.
- Four structured guidelines were successfully extracted in an API test.
- Manual brand guideline creation tested.
- Compliance score calculations tested.
- Human approval and rejection workflows tested.
- GitHub source code updated.

These tests represent the checks performed during development. Mobile PDF upload compatibility and some deployment behaviours require further verification.

---

## Current Limitations

- Compliance scoring is currently count-based rather than severity-weighted.
- Visual brand compliance for uploaded images is not implemented.
- Advanced role-based access and multi-user collaboration are not implemented.
- Multi-stage approval and advanced revision tracking are not yet available.
- Mobile PDF upload compatibility requires further verification.
- SQLite persistence across Render restarts and redeployments has not been verified.
- Advanced OCR for scanned PDF documents is not implemented.

---

## Round 3 Roadmap

Three major planned improvements:

### 1. Visual Brand Compliance Engine

Introduce AI-powered analysis of marketing images and creative assets to identify logo usage issues, inconsistent brand colours and typography deviations where technically feasible.

### 2. Governance Analytics

Introduce analytics for recurring violations, frequently violated guidelines, compliance trends and review statuses to help organizations understand brand governance patterns.

### 3. Expanded Human Review Controls

Introduce role-based reviewer permissions, revision tracking, resubmission workflows and improved audit history to strengthen accountability and collaboration.

---

## Team

**Team Name: DataWizards**

| Team Member | Role |
|---|---|
| Madhan Sanjay | Team Leader |
| Nitheeshwaran | Team Member |
| Nikil | Team Member |
| Balamurugan | Team Member |
| Pravinraj | Team Member |

**Hackathon:** CodeNova India 2026  
**Round:** Round 2 – The Build

---

## Conclusion

BrandCue AI demonstrates how AI can support consistent and responsible brand communication.

By combining approved brand guidelines, AI-powered content analysis, PDF guideline extraction, compliance scoring and human-controlled review, the platform provides a structured approach to brand governance.

The project focuses on making potential content issues easier to identify, understand and correct while keeping final decisions in human hands.

**BrandCue AI — Every Content. One Consistent Brand.**

---

*Developed by Team DataWizards for CodeNova India 2026.*
