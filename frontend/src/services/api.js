// ==========================================
// BRANDCUE AI - BACKEND API SERVICE
// ==========================================

const API_URL = "http://127.0.0.1:8000";


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
// 5. ANALYZE SUBMISSION USING GEMINI AI
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
// GET PENDING HUMAN REVIEWS
// ==========================================

export async function getReviewQueue() {
  const response = await fetch(`${API_URL}/reviews`);

  if (!response.ok) {
    throw new Error("Unable to fetch review queue.");
  }

  return await response.json();
}


// ==========================================
// APPROVE OR REJECT CONTENT
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        decision,
        reviewer_comment: reviewerComment,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Unable to submit human review."
    );
  }

  return data;
}
// ==========================================
// GET SUBMISSION HISTORY
// ==========================================

export async function getSubmissionHistory() {
  const response = await fetch(`${API_URL}/history`);

  if (!response.ok) {
    throw new Error("Unable to fetch submission history.");
  }

  return await response.json();
}

export async function createGuideline(guideline) {
  const response = await fetch(`${API_URL}/guidelines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(guideline),
  });

  if (!response.ok) {
    throw new Error("Unable to create brand guideline.");
  }

  return await response.json();
}