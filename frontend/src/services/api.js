// ==========================================
// BRANDCUE AI - BACKEND API SERVICE
// ==========================================

// LIVE RENDER BACKEND
const API_URL = "https://brandcue-ai-backend.onrender.com";


// ==========================================
// 1. COMMON API RESPONSE HANDLER
// ==========================================

async function handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "Something went wrong with the server."
        );
    }

    return data;
}


// ==========================================
// 2. SUBMIT CONTENT
// ==========================================

export async function submitContent(data) {
    const response = await fetch(`${API_URL}/submissions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return handleResponse(response);
}


// ==========================================
// 3. GET ALL SUBMISSIONS
// ==========================================

export async function getSubmissions() {
    const response = await fetch(`${API_URL}/submissions`);

    return handleResponse(response);
}


// ==========================================
// 4. GET BRAND GUIDELINES
// ==========================================

export async function getGuidelines() {
    const response = await fetch(`${API_URL}/guidelines`);

    return handleResponse(response);
}


// ==========================================
// 5. ANALYZE SUBMISSION USING GROQ AI
// ==========================================

export async function analyzeSubmission(submissionId) {
    const response = await fetch(
        `${API_URL}/analyze/${submissionId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    return handleResponse(response);
}


// ==========================================
// 6. GET PENDING HUMAN REVIEWS
// ==========================================

export async function getReviewQueue() {
    const response = await fetch(`${API_URL}/reviews`);

    return handleResponse(response);
}


// ==========================================
// 7. APPROVE OR REJECT CONTENT
// ==========================================

export async function submitHumanReview(
    submissionId,
    decision,
    reviewerComment
) {
    const response = await fetch(
        `${API_URL}/reviews/${submissionId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                decision,
                reviewer_comment: reviewerComment
            })
        }
    );

    return handleResponse(response);
}


// ==========================================
// 8. GET SUBMISSION HISTORY
// ==========================================

export async function getSubmissionHistory() {
    const response = await fetch(`${API_URL}/history`);

    return handleResponse(response);
}


// ==========================================
// 9. CREATE BRAND GUIDELINE
// ==========================================

export async function createGuideline(guideline) {
    const response = await fetch(`${API_URL}/guidelines`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(guideline)
    });

    return handleResponse(response);
}

// ==========================================
// 10. EXTRACT BRAND GUIDELINES FROM PDF
// ==========================================

export async function extractGuidelinesFromPDF(file) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
        `${API_URL}/guidelines/extract-pdf`,
        {
            method: "POST",
            body: formData
        }
    );

    return handleResponse(response);
}