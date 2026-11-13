const API_URL = "http://127.0.0.1:8000";

// Submit content
export async function submitContent(data) {
  const response = await fetch(`${API_URL}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to submit content");
  }

  return response.json();
}

// Get all submissions
export async function getSubmissions() {
  const response = await fetch(`${API_URL}/submissions`);

  if (!response.ok) {
    throw new Error("Failed to retrieve submissions");
  }

  return response.json();
}

// Get brand guidelines
export async function getGuidelines() {
  const response = await fetch(`${API_URL}/guidelines`);

  if (!response.ok) {
    throw new Error("Failed to retrieve guidelines");
  }

  return response.json();
}