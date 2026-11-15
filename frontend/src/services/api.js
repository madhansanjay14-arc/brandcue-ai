// ==========================================
// BRANDCUE AI - BACKEND API SERVICE
// ==========================================

// Keep the deployed frontend connected to the deployed Render backend.
const API_URL = "https://brandcue-ai-backend.onrender.com";

async function handleResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();
        data = {
            detail: text || "The server returned an unexpected response."
        };
    }

    if (!response.ok) {
        throw new Error(
            data.detail || `Server request failed (${response.status}).`
        );
    }

    return data;
}

// Centralized fetch wrapper
async function apiRequest(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_URL}${path}`, options);
    } catch (error) {
        console.error(`Network request failed for ${path}:`, error);

        if (!navigator.onLine) {
            throw new Error(
                "You appear to be offline. Connect to the internet and try again."
            );
        }

        throw new Error(
            "Could not connect to the BrandCue AI server. Check your internet connection and try again. If this happens only on mobile, check that your browser allows this site to access the network."
        );
    }

    return handleResponse(response);
}

// ==========================================
// 1. SUBMIT CONTENT
// ==========================================

export async function submitContent(data) {
    return apiRequest("/submissions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
}

// ==========================================
// 2. GET ALL SUBMISSIONS
// ==========================================

export async function getSubmissions() {
    return apiRequest("/submissions");
}

// ==========================================
// 3. GET BRAND GUIDELINES
// ==========================================

export async function getGuidelines() {
    return apiRequest("/guidelines");
}

// ==========================================
// 4. ANALYZE SUBMISSION USING GROQ AI
// ==========================================

export async function analyzeSubmission(submissionId) {
    return apiRequest(`/analyze/${submissionId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    });
}

// ==========================================
// 5. GET PENDING HUMAN REVIEWS
// ==========================================

export async function getReviewQueue() {
    return apiRequest("/reviews");
}

// ==========================================
// 6. APPROVE OR REJECT CONTENT
// ==========================================

export async function submitHumanReview(
    submissionId,
    decision,
    reviewerComment
) {
    return apiRequest(`/reviews/${submissionId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            decision,
            reviewer_comment: reviewerComment
        })
    });
}

// ==========================================
// 7. GET SUBMISSION HISTORY
// ==========================================

export async function getSubmissionHistory() {
    return apiRequest("/history");
}

// ==========================================
// 8. CREATE BRAND GUIDELINE
// ==========================================

export async function createGuideline(guideline) {
    return apiRequest("/guidelines", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(guideline)
    });
}

// ==========================================
// 9. EXTRACT BRAND GUIDELINES FROM PDF
// ==========================================

export async function extractGuidelinesFromPDF(file) {
    if (!file) {
        throw new Error("Please select a PDF file first.");
    }

    const formData = new FormData();

    formData.append(
        "file",
        file,
        file.name || "brand-guidelines.pdf"
    );

    // IMPORTANT:
    // Do not manually set Content-Type for FormData.
    // The browser automatically adds the multipart boundary.
    return apiRequest("/guidelines/extract-pdf", {
        method: "POST",
        body: formData
    });
}
