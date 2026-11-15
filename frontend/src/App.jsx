import { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  submitContent,
  analyzeSubmission,
  getGuidelines,
  getSubmissions,
  getReviewQueue,
  submitHumanReview,
  getSubmissionHistory,
  createGuideline,
  extractGuidelinesFromPDF
} from "./services/api";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // Content form
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("Social Media");
  const [content, setContent] = useState("");

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);

  // AI analysis states
  const [analysis, setAnalysis] = useState(null);
  const analysisResultRef = useRef(null);
  useEffect(() => {
  if (analysis && analysisResultRef.current) {
    analysisResultRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [analysis]);
  
  const [analysisError, setAnalysisError] = useState("");

  // Review Queue states
  const [reviewItems, setReviewItems] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewComments, setReviewComments] = useState({});
  const [reviewingId, setReviewingId] = useState(null);

  // History states
const [historyItems, setHistoryItems] = useState([]);
const [isLoadingHistory, setIsLoadingHistory] = useState(false);
const [historyError, setHistoryError] = useState("");
// Brand Guidelines states
const [guidelines, setGuidelines] = useState([]);
const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
const [guidelineError, setGuidelineError] = useState("");
const [guidelineSuccess, setGuidelineSuccess] = useState("");
const [isSavingGuideline, setIsSavingGuideline] = useState(false);

// PDF Guideline Extraction states
const [pdfFile, setPdfFile] = useState(null);
const [extractedGuidelines, setExtractedGuidelines] = useState([]);
const [isExtractingPdf, setIsExtractingPdf] = useState(false);
const [isSavingExtracted, setIsSavingExtracted] = useState(false);
const [pdfError, setPdfError] = useState("");
const [pdfSuccess, setPdfSuccess] = useState("");

const [guidelineForm, setGuidelineForm] = useState({
  title: "",
  category: "",
  rule: "",
  description: ""
});

  const menuItems = [
    "Dashboard",
    "Brand Guidelines",
    "Content Checker",
    "Review Queue",
    "History",
  ];

  // ==========================================
  // SUBMIT CONTENT AND ANALYZE WITH GROQ AI
  // ==========================================

  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitMessage("");
    setSubmitError(false);
    setAnalysis(null);
    setAnalysisError("");
    setSubmissionId(null);

    if (!contentTitle.trim() || !content.trim()) {
      setSubmitError(true);
      setSubmitMessage("Please enter both title and content.");
      return;
    }

    let newSubmissionId;

    try {
      setIsSubmitting(true);

      const result = await submitContent({
        title: contentTitle.trim(),
        content_type: contentType,
        content: content.trim(),
      });

      newSubmissionId = result.submission_id;
      setSubmissionId(newSubmissionId);
      setSubmitMessage("Content submitted successfully!");

      setContentTitle("");
      setContent("");
    } catch (error) {
      console.error("Submission failed:", error);
      setSubmitError(true);
      setSubmitMessage(
        error.message || "Unable to submit content. Please try again."
      );
      return;
    } finally {
      setIsSubmitting(false);
    }

    try {
      setIsAnalyzing(true);
      setSubmitMessage("Content saved. Analysing with Groq AI...");

      const aiResult = await analyzeSubmission(newSubmissionId);
      setAnalysis(aiResult);
      setSubmitMessage("AI analysis completed successfully!");
    } catch (error) {
      console.error("AI analysis failed:", error);
      setAnalysisError(
        error.message || "AI service is temporarily unavailable."
      );
      setSubmitMessage(
        "Content saved successfully, but AI analysis is unavailable."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ==========================================
  // RETRY AI ANALYSIS
  // ==========================================

  async function handleRetryAnalysis() {
    if (!submissionId) return;

    try {
      setIsAnalyzing(true);
      setAnalysisError("");
      setSubmitMessage("Retrying AI analysis...");

      const aiResult = await analyzeSubmission(submissionId);
      setAnalysis(aiResult);
      setSubmitMessage("AI analysis completed successfully!");
    } catch (error) {
      console.error("Retry analysis failed:", error);
      setAnalysisError(
        error.message || "AI service is temporarily unavailable."
      );
      setSubmitMessage(
        "Content is saved, but AI analysis is still unavailable."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ==========================================
  // COPY CORRECTED CONTENT
  // ==========================================

  async function copyCorrectedContent() {
    if (!analysis?.corrected_content) return;

    try {
      await navigator.clipboard.writeText(analysis.corrected_content);
      alert("Corrected content copied successfully!");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Unable to copy content.");
    }
  }

  // ==========================================
  // LOAD REVIEW QUEUE
  // ==========================================

  async function loadReviewQueue() {
    try {
      setIsLoadingReviews(true);
      setReviewError("");

      const result = await getReviewQueue();
      setReviewItems(result.reviews || []);
    } catch (error) {
      console.error("Review queue error:", error);
      setReviewError(error.message || "Unable to load the review queue.");
    } finally {
      setIsLoadingReviews(false);
    }
  }

  // ==========================================
  // APPROVE OR REJECT SUBMISSION
  // ==========================================

  async function handleHumanReview(id, decision) {
    const action = decision === "approved" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} submission #${id}?`
      )
    ) {
      return;
    }

    try {
      setReviewingId(id);

      const comment = reviewComments[id] || "";

      await submitHumanReview(id, decision, comment);

      setReviewComments((previous) => ({
        ...previous,
        [id]: "",
      }));

      await loadReviewQueue();
      alert(`Submission ${decision} successfully!`);
    } catch (error) {
      console.error("Human review error:", error);
      alert(error.message || "Unable to save the review decision.");
    } finally {
      setReviewingId(null);
    }
  }

  async function loadHistory() {
  try {
    setIsLoadingHistory(true);
    setHistoryError("");

    const result = await getSubmissionHistory();
    setHistoryItems(result.history || []);
  } catch (error) {
    console.error("History loading error:", error);
    setHistoryError(error.message || "Unable to load submission history.");
  } finally {
    setIsLoadingHistory(false);
  }
}

async function loadGuidelines() {
  try {
    setIsLoadingGuidelines(true);
    setGuidelineError("");

    const result = await getGuidelines();
    setGuidelines(result.guidelines || []);
  } catch (error) {
    console.error("Guidelines loading error:", error);
    setGuidelineError(error.message || "Unable to load guidelines.");
  } finally {
    setIsLoadingGuidelines(false);
  }
}

async function handleCreateGuideline(event) {
  event.preventDefault();

  try {
    setIsSavingGuideline(true);
    setGuidelineError("");
    setGuidelineSuccess("");

    await createGuideline(guidelineForm);

    setGuidelineSuccess("Brand guideline added successfully!");

    setGuidelineForm({
      title: "",
      category: "",
      rule: "",
      description: ""
    });

    await loadGuidelines();
  } catch (error) {
    console.error("Guideline creation error:", error);
    setGuidelineError(error.message || "Unable to save guideline.");
  } finally {
    setIsSavingGuideline(false);
  }
}

// ==========================================
// EXTRACT GUIDELINES FROM PDF
// ==========================================

async function handleExtractPdf() {
  if (!pdfFile) {
    setPdfError("Please select a PDF file first.");
    return;
  }

  if (!pdfFile.name.toLowerCase().endsWith(".pdf")) {
    setPdfError("Only PDF files are supported.");
    return;
  }

  if (pdfFile.size > 10 * 1024 * 1024) {
    setPdfError("PDF file must be smaller than 10 MB.");
    return;
  }

  try {
    setIsExtractingPdf(true);
    setPdfError("");
    setPdfSuccess("");
    setExtractedGuidelines([]);

    const result = await extractGuidelinesFromPDF(pdfFile);

    setExtractedGuidelines(
      (result.guidelines || []).map((guideline) => ({
        ...guideline,
        selected: true
      }))
    );

    setPdfSuccess(
      `${result.total_extracted} guidelines extracted successfully. Review them before saving.`
    );
  } catch (error) {
    console.error("PDF extraction failed:", error);
    setPdfError(error.message || "Unable to extract guidelines from PDF.");
  } finally {
    setIsExtractingPdf(false);
  }
}

// ==========================================
// EDIT EXTRACTED GUIDELINE
// ==========================================

function handleExtractedGuidelineChange(index, field, value) {
  setExtractedGuidelines((previous) =>
    previous.map((guideline, i) =>
      i === index ? { ...guideline, [field]: value } : guideline
    )
  );
}

// ==========================================
// REMOVE EXTRACTED GUIDELINE
// ==========================================

function handleRemoveExtractedGuideline(index) {
  setExtractedGuidelines((previous) =>
    previous.filter((_, i) => i !== index)
  );
}

// ==========================================
// APPROVE AND SAVE EXTRACTED GUIDELINES
// ==========================================

async function handleSaveExtractedGuidelines() {
  const selectedGuidelines = extractedGuidelines.filter(
    (guideline) => guideline.selected
  );

  if (selectedGuidelines.length === 0) {
    setPdfError("Please keep at least one guideline to save.");
    return;
  }

  const invalidGuideline = selectedGuidelines.find(
    (guideline) =>
      !guideline.title?.trim() ||
      !guideline.category?.trim() ||
      !guideline.rule?.trim()
  );

  if (invalidGuideline) {
    setPdfError("Please complete the title, category and rule fields.");
    return;
  }

  let savedCount = 0;

try {
  setIsSavingExtracted(true);
  setPdfError("");
  setPdfSuccess("");

    for (const guideline of selectedGuidelines) {
      await createGuideline({
        title: guideline.title.trim(),
        category: guideline.category.trim(),
        rule: guideline.rule.trim(),
        description: (guideline.description || "").trim()
      });

      savedCount++;
    }

    setPdfSuccess(
      `${savedCount} brand guidelines saved successfully!`
    );

    setExtractedGuidelines([]);
    setPdfFile(null);

    await loadGuidelines();
  } catch (error) {
    console.error("Saving extracted guidelines failed:", error);

    setPdfError(
      `${error.message || "Unable to save guidelines."} ${savedCount} guideline(s) were saved before the error.`
    );

    await loadGuidelines();
  } finally {
    setIsSavingExtracted(false);
  }
}
  // ==========================================
  // NAVIGATION
  // ==========================================

function handleNavigation(page) {
  setActivePage(page);

  if (page === "Review Queue") {
    loadReviewQueue();
  }

  if (page === "History") {
    loadHistory();
  }

  if (page === "Brand Guidelines") {
  loadGuidelines();
}
}

  // ==========================================
  // MAIN APPLICATION
  // ==========================================

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">B</span>
          <div>
            <h2>BrandCue AI</h2>
            <p>Brand Intelligence</p>
          </div>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${activePage === item ? "active" : ""}`}
              onClick={() => handleNavigation(item)}
            >
              <span>
                {{
                  Dashboard: "▦",
                  "Brand Guidelines": "◈",
                  "Content Checker": "✧",
                  "Review Queue": "☷",
                  History: "◷",
                }[item]}
              </span>
              {item}
            </button>
          ))}
        </nav>

        {/* ADMIN PROFILE */}
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">MS</div>
            <div>
              <strong>Madhan Sanjay</strong>
              <p>Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {activePage}</p>
            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <span className="status-indicator">● System Online</span>
            <div className="avatar">MS</div>
          </div>
        </header>

        <section className="dashboard-content">
          {/* ================================= */}
          {/* DASHBOARD */}
          {/* ================================= */}

          {activePage === "Dashboard" && (
            <>
              <div className="welcome-section">
                <div>
                  <h1>Welcome to BrandCue AI 👋</h1>
                  <p>
                    Keep every piece of content consistent with your brand.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setActivePage("Content Checker")}
                >
                  + Check New Content
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <p>Total Content Checked</p>
                  <h2>—</h2>
                  <span>Live analytics coming next</span>
                </div>

                <div className="stat-card">
                  <p>Compliant Content</p>
                  <h2>—</h2>
                  <span className="success-text">
                    Analysis records available
                  </span>
                </div>

                <div className="stat-card">
                  <p>Issues Detected</p>
                  <h2>—</h2>
                  <span className="warning-text">
                    Analysis records available
                  </span>
                </div>

                <div className="stat-card">
                  <p>Pending Reviews</p>
                  <h2>—</h2>
                  <span>Human review required</span>
                </div>
              </div>

              <div className="content-card">
                <div className="section-heading">
                  <div>
                    <h2>Recent Content Checks</h2>
                    <p>Monitor your brand compliance activity.</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("History")}
                  >
                    View History →
                  </button>
                </div>

                <p className="empty-state">
                  Submit content through the Content Checker to begin
                  monitoring brand compliance.
                </p>
              </div>
            </>
          )}

          {/* ================================= */}
          {/* CONTENT CHECKER */}
          {/* ================================= */}

          {activePage === "Content Checker" && (
            <div className="checker-container">
              <div className="welcome-section">
                <div>
                  <h1>Content Compliance Checker</h1>
                  <p>
                    Analyse your content against approved brand guidelines.
                  </p>
                </div>
              </div>

              <form
                className="content-card checker-form"
                onSubmit={handleSubmit}
              >
                <div className="form-heading">
                  <h2>Submit Your Content</h2>
                  <p>Enter the content you want to check.</p>
                </div>

                {/* TITLE */}
                <div className="form-group">
                  <label htmlFor="contentTitle">Content Title</label>
                  <input
                    id="contentTitle"
                    type="text"
                    placeholder="e.g. Summer Marketing Campaign"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    maxLength={150}
                    required
                    disabled={isSubmitting || isAnalyzing}
                  />
                </div>

                {/* CONTENT TYPE */}
                <div className="form-group">
                  <label htmlFor="contentType">Content Type</label>
                  <select
                    id="contentType"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    disabled={isSubmitting || isAnalyzing}
                  >
                    <option>Social Media</option>
                    <option>Advertisement</option>
                    <option>Email</option>
                    <option>Website Copy</option>
                    <option>Marketing Document</option>
                  </select>
                </div>

                {/* CONTENT */}
                <div className="form-group">
                  <label htmlFor="content">Content to Analyse</label>
                  <textarea
                    id="content"
                    placeholder="Paste your marketing content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={9}
                    maxLength={10000}
                    required
                    disabled={isSubmitting || isAnalyzing}
                  />

                  <div className="character-count">
                    {content.length} / 10000 characters
                  </div>
                </div>

                <div className="checker-info">
                  <span>✦</span>
                  Your content will be checked against your organisation's
                  approved brand guidelines.
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="primary-button analyze-button"
                  disabled={isSubmitting || isAnalyzing}
                >
                  {isSubmitting
                    ? "Submitting Content..."
                    : isAnalyzing
                    ? "✦ Analysing with Groq AI..."
                    : "✦ Submit & Analyse with AI"}
                </button>

                {/* SUBMISSION MESSAGE */}
                {submitMessage && (
                  <div
                    role="status"
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius: "8px",
                      background: submitError ? "#fff0f0" : "#e8f8ef",
                      color: submitError ? "#c0392b" : "#12845e",
                      fontSize: "13px",
                    }}
                  >
                    {submitMessage}
                    {submissionId !== null && (
                      <p style={{ marginTop: "6px" }}>
                        Submission ID: {submissionId}
                      </p>
                    )}
                  </div>
                )}

                {/* AI ERROR */}
                {analysisError && (
                  <div
                    role="alert"
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius: "8px",
                      background: "#fff0f0",
                      color: "#c0392b",
                    }}
                  >
                    <strong>AI Analysis Unavailable</strong>
                    <p style={{ marginTop: "8px" }}>{analysisError}</p>
                    <p style={{ marginTop: "8px" }}>
                      Your content is safely saved. AI analysis can be
                      attempted again later.
                    </p>

                    <button
                      type="button"
                      className="primary-button"
                      style={{ marginTop: "12px" }}
                      onClick={handleRetryAnalysis}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? "Retrying..." : "↻ Retry AI Analysis"}
                    </button>
                  </div>
                )}
              </form>

              {/* AI ANALYSIS RESULTS */}
              {analysis && (
  <div
    ref={analysisResultRef}
    className="content-card"
    style={{ marginTop: "25px", scrollMarginTop: "25px" }}
  >
                  <div className="section-heading">
                    <div>
                      <h2>✦ BrandCue AI Analysis</h2>
                      <p>Submission #{analysis.submission_id}</p>
                    </div>

                    <span
                      style={{
                        padding: "8px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          analysis.overall_status === "compliant"
                            ? "#e8f8ef"
                            : "#fff0e0",
                        color:
                          analysis.overall_status === "compliant"
                            ? "#12845e"
                            : "#c56b16",
                      }}
                    >
                      {analysis.overall_status === "compliant"
                        ? "✓ Compliant"
                        : "⚠ Needs Review"}
                    </span>
                  </div>

                  {/* SUMMARY */}
                  <div style={{ marginTop: "20px" }}>
                    <h3>Analysis Summary</h3>
                    <p style={{ marginTop: "8px", lineHeight: "1.7" }}>
                      {analysis.summary}
                    </p>
                  </div>

                  {/* COMPLIANCE SCORE */}
<div
  style={{
    marginTop: "25px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#ffffff",
  }}
>
  <h3>Brand Compliance Score</h3>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "15px",
      marginTop: "18px",
    }}
  >
    <div>
      <h1
        style={{
          fontSize: "42px",
          color:
            analysis.compliance_score >= 80
              ? "#16a34a"
              : analysis.compliance_score >= 50
              ? "#d97706"
              : "#dc2626",
          margin: 0,
        }}
      >
        {analysis.compliance_score ?? 0}%
      </h1>

      <p style={{ color: "#64748b", marginTop: "5px" }}>
        Overall guideline compliance
      </p>
    </div>

    <div style={{ textAlign: "right" }}>
      <p style={{ color: "#16a34a", marginBottom: "8px" }}>
        ✓ Passed: {analysis.passed_guidelines ?? 0}
      </p>

      <p style={{ color: "#dc2626", marginBottom: "8px" }}>
        ✕ Violations: {analysis.violated_guidelines ?? 0}
      </p>

      <p style={{ color: "#64748b" }}>
        Total checked: {analysis.total_guidelines ?? 0}
      </p>
    </div>
  </div>

  {/* PROGRESS BAR */}
  <div
    style={{
      width: "100%",
      height: "12px",
      background: "#e2e8f0",
      borderRadius: "20px",
      marginTop: "20px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${Math.min(
          100,
          Math.max(0, Number(analysis.compliance_score) || 0)
        )}%`,
        height: "100%",
        background:
          analysis.compliance_score >= 80
            ? "#16a34a"
            : analysis.compliance_score >= 50
            ? "#f59e0b"
            : "#dc2626",
        borderRadius: "20px",
        transition: "width 0.5s ease",
      }}
    />
  </div>

  <p
    style={{
      marginTop: "12px",
      color: "#64748b",
      fontSize: "13px",
    }}
  >
    {analysis.total_guidelines === 0
      ? "No active guidelines were available for this analysis."
      : analysis.compliance_score >= 80
      ? "Good compliance! Most brand guidelines were followed."
      : analysis.compliance_score >= 50
      ? "Moderate compliance. Review the detected violations."
      : "Low compliance. Significant improvements are required."}
  </p>
</div>

                  {/* VIOLATIONS */}
                  <div style={{ marginTop: "25px" }}>
                    <h3>
                      Detected Violations ({analysis.violations?.length || 0})
                    </h3>

                    {!analysis.violations ||
                    analysis.violations.length === 0 ? (
                      <p style={{ marginTop: "12px", color: "#12845e" }}>
                        ✓ No violations detected against the supplied
                        guidelines.
                      </p>
                    ) : (
                      analysis.violations.map((violation, index) => (
                        <div
                          key={index}
                          style={{
                            marginTop: "15px",
                            padding: "18px",
                            border: "1px solid #f0d5d5",
                            borderRadius: "10px",
                            background: "#fffafa",
                          }}
                        >
                          <h4>
                            {index + 1}. {violation.rule}
                          </h4>

                          <p style={{ marginTop: "10px" }}>
                            <strong>Problem:</strong> {violation.problem}
                          </p>

                          <p style={{ marginTop: "10px" }}>
                            <strong>Suggested Correction:</strong>{" "}
                            {violation.suggestion}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* CORRECTED CONTENT */}
                  <div style={{ marginTop: "25px" }}>
                    <h3>Suggested Corrected Content</h3>

                    <div
                      style={{
                        marginTop: "12px",
                        padding: "18px",
                        borderRadius: "10px",
                        background: "#f3f7ff",
                        lineHeight: "1.7",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {analysis.corrected_content}
                    </div>

                    <button
                      type="button"
                      className="primary-button"
                      style={{ marginTop: "12px" }}
                      onClick={copyCorrectedContent}
                    >
                      Copy Corrected Content
                    </button>
                  </div>

                  {/* HUMAN APPROVAL */}
                  <div
                    style={{
                      marginTop: "25px",
                      padding: "15px",
                      borderRadius: "8px",
                      background: "#fff8e8",
                      color: "#805d16",
                    }}
                  >
                    <strong>Human Approval Required</strong>
                    <p style={{ marginTop: "6px" }}>
                      AI analysis is advisory. A human reviewer must make the
                      final approval decision.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================= */}
          {/* REVIEW QUEUE */}
          {/* ================================= */}

          {activePage === "Review Queue" && (
            <div className="checker-container">
              <div className="welcome-section">
                <div>
                  <h1>Human Review Queue</h1>
                  <p>
                    Review AI findings and make the final approval decision.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={loadReviewQueue}
                  disabled={isLoadingReviews}
                >
                  {isLoadingReviews ? "Refreshing..." : "↻ Refresh Queue"}
                </button>
              </div>

              {reviewError && (
                <div className="content-card">
                  <p style={{ color: "#c0392b" }}>{reviewError}</p>
                </div>
              )}

              {isLoadingReviews ? (
                <div className="content-card">
                  <p className="empty-state">
                    Loading review submissions...
                  </p>
                </div>
              ) : reviewItems.length === 0 ? (
                <div className="content-card">
                  <h2>All caught up! 🎉</h2>
                  <p className="empty-state">
                    No submissions are currently waiting for human review.
                  </p>
                </div>
              ) : (
                <div>
                  <div
                    className="content-card"
                    style={{ marginBottom: "20px" }}
                  >
                    <h2>{reviewItems.length} Pending Reviews</h2>
                    <p>Each submission requires a human decision.</p>
                  </div>

                  {reviewItems.map((item) => (
                    <div
                      className="content-card"
                      key={item.submission_id}
                      style={{ marginBottom: "22px" }}
                    >
                      <div className="section-heading">
                        <div>
                          <h2>{item.title}</h2>
                          <p>
                            Submission #{item.submission_id} ·{" "}
                            {item.content_type}
                          </p>
                        </div>

                        <span
                          style={{
                            background: "#fff0e0",
                            color: "#c56b16",
                            padding: "8px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          Needs Review
                        </span>
                      </div>

                      {/* SUBMITTED CONTENT */}
                      <div style={{ marginTop: "20px" }}>
                        <h3>Submitted Content</h3>
                        <div
                          style={{
                            background: "#f7f8fc",
                            padding: "16px",
                            borderRadius: "8px",
                            marginTop: "10px",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.7",
                          }}
                        >
                          {item.content}
                        </div>
                      </div>

                      {/* AI VIOLATIONS */}
                      <div style={{ marginTop: "22px" }}>
                        <h3>AI-Detected Violations</h3>

                        {item.violations?.length > 0 ? (
                          item.violations.map((violation, index) => (
                            <div
                              key={index}
                              style={{
                                marginTop: "12px",
                                padding: "16px",
                                border: "1px solid #f0d5d5",
                                background: "#fffafa",
                                borderRadius: "8px",
                              }}
                            >
                              <h4>{violation.rule}</h4>

                              <p style={{ marginTop: "8px" }}>
                                <strong>Problem:</strong> {violation.problem}
                              </p>

                              <p style={{ marginTop: "8px" }}>
                                <strong>Suggestion:</strong>{" "}
                                {violation.suggestion}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p style={{ marginTop: "10px" }}>
                            No violations recorded.
                          </p>
                        )}
                      </div>

                      {/* REVIEWER COMMENTS */}
                      <div style={{ marginTop: "22px" }}>
                        <label htmlFor={`review-comment-${item.submission_id}`}>
                          <strong>Reviewer Comments</strong>
                        </label>

                        <textarea
                          id={`review-comment-${item.submission_id}`}
                          rows={3}
                          placeholder="Enter your review comments..."
                          value={reviewComments[item.submission_id] || ""}
                          onChange={(e) =>
                            setReviewComments((previous) => ({
                              ...previous,
                              [item.submission_id]: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px",
                            marginTop: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            resize: "vertical",
                            background: "#ffffff",
                            color: "#1f2937",
                            fontSize: "13px",
                            fontFamily: "inherit",
                          }}
                          disabled={reviewingId === item.submission_id}
                        />
                      </div>

                      {/* REVIEW ACTIONS */}
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "18px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            handleHumanReview(item.submission_id, "approved")
                          }
                          disabled={reviewingId === item.submission_id}
                        >
                          {reviewingId === item.submission_id
                            ? "Processing..."
                            : "✓ Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleHumanReview(item.submission_id, "rejected")
                          }
                          disabled={reviewingId === item.submission_id}
                          style={{
                            padding: "12px 20px",
                            background: "#fff0f0",
                            color: "#c0392b",
                            border: "1px solid #e5baba",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================= */}
          {/* OTHER PAGES */}
          {/* ================================= */}

{/* BRAND GUIDELINES PLACEHOLDER */}
{/* BRAND GUIDELINES */}
{activePage === "Brand Guidelines" && (
  <div className="content-card">

    <div style={{ marginBottom: "24px" }}>
      <h2>Brand Guidelines</h2>
      <p style={{ color: "#64748b", marginTop: "6px" }}>
        Create and manage the rules that keep your brand consistent.
      </p>
    </div>

        {/* PDF GUIDELINE EXTRACTION */}
    <div
      style={{
        background: "#f0f7ff",
        border: "1px solid #bfdbfe",
        borderRadius: "12px",
        padding: "22px",
        marginBottom: "28px"
      }}
    >
      <h3>✦ Extract Guidelines from PDF using AI</h3>

      <p style={{ color: "#64748b", marginTop: "8px" }}>
        Upload your brand guideline PDF. AI will identify rules
        and prepare them for your approval.
      </p>

      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => {
          setPdfFile(e.target.files?.[0] || null);
          setPdfError("");
          setPdfSuccess("");
          setExtractedGuidelines([]);
        }}
        disabled={isExtractingPdf || isSavingExtracted}
        style={{
          display: "block",
          marginTop: "18px",
          marginBottom: "15px"
        }}
      />

      {pdfFile && (
        <p style={{ color: "#475569", fontSize: "13px" }}>
          Selected: {pdfFile.name}
        </p>
      )}

      <button
        type="button"
        onClick={handleExtractPdf}
        disabled={!pdfFile || isExtractingPdf || isSavingExtracted}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: "8px",
          background: "#2563eb",
          color: "#ffffff",
          fontWeight: "600",
          cursor: "pointer"
        }}
      >
        {isExtractingPdf ? "✦ Extracting..." : "✦ Extract Guidelines"}
      </button>

      {pdfError && (
        <p role="alert" style={{ color: "#dc2626", marginTop: "14px" }}>
          {pdfError}
        </p>
      )}

      {pdfSuccess && (
        <p role="status" style={{ color: "#15803d", marginTop: "14px" }}>
          {pdfSuccess}
        </p>
      )}

      {extractedGuidelines.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h3>Review Extracted Guidelines</h3>

          <p style={{ color: "#64748b", marginTop: "6px" }}>
            Edit the extracted rules, uncheck unwanted ones,
            or remove them before saving.
          </p>

          {extractedGuidelines.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#ffffff",
                border: "1px solid #dbeafe",
                borderRadius: "10px",
                padding: "18px",
                marginTop: "15px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px"
                }}
              >
                <label style={{ fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) =>
                      handleExtractedGuidelineChange(
                        index,
                        "selected",
                        e.target.checked
                      )
                    }
                    disabled={isSavingExtracted}
                    style={{ marginRight: "8px" }}
                  />
                  Include this guideline
                </label>

                <button
                  type="button"
                  onClick={() => handleRemoveExtractedGuideline(index)}
                  disabled={isSavingExtracted}
                  style={{
                    border: "none",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    padding: "7px 12px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              </div>

              <div style={{ marginTop: "15px" }}>
                <label>Guideline Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    handleExtractedGuidelineChange(
                      index,
                      "title",
                      e.target.value
                    )
                  }
                  disabled={isSavingExtracted}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px",
                    marginTop: "7px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px"
                  }}
                />
              </div>

              <div style={{ marginTop: "15px" }}>
                <label>Category</label>
                <input
                  type="text"
                  value={item.category}
                  onChange={(e) =>
                    handleExtractedGuidelineChange(
                      index,
                      "category",
                      e.target.value
                    )
                  }
                  disabled={isSavingExtracted}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px",
                    marginTop: "7px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px"
                  }}
                />
              </div>

              <div style={{ marginTop: "15px" }}>
                <label>Brand Rule</label>
                <textarea
                  value={item.rule}
                  onChange={(e) =>
                    handleExtractedGuidelineChange(
                      index,
                      "rule",
                      e.target.value
                    )
                  }
                  rows={3}
                  disabled={isSavingExtracted}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px",
                    marginTop: "7px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ marginTop: "15px" }}>
                <label>Description</label>
                <textarea
                  value={item.description || ""}
                  onChange={(e) =>
                    handleExtractedGuidelineChange(
                      index,
                      "description",
                      e.target.value
                    )
                  }
                  rows={2}
                  disabled={isSavingExtracted}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px",
                    marginTop: "7px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "7px",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleSaveExtractedGuidelines}
            disabled={
              isSavingExtracted ||
              extractedGuidelines.length === 0
            }
            style={{
              marginTop: "20px",
              padding: "13px 22px",
              border: "none",
              borderRadius: "8px",
              background: "#15803d",
              color: "#ffffff",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {isSavingExtracted
              ? "Saving Guidelines..."
              : `✓ Approve & Save Selected (${
                  extractedGuidelines.filter((item) => item.selected).length
                })`}
          </button>
        </div>
      )}
    </div>

    {/* ADD GUIDELINE FORM */}
    <div style={{
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "22px",
      marginBottom: "28px"
    }}>
      <h3 style={{ marginBottom: "18px" }}>
        + Add New Guideline
      </h3>

      <form onSubmit={handleCreateGuideline}>

        <div style={{ marginBottom: "16px" }}>
          <label>Guideline Title</label>
          <input
            type="text"
            placeholder="Example: No Unsupported Guarantees"
            value={guidelineForm.title}
            onChange={(e) =>
              setGuidelineForm({
                ...guidelineForm,
                title: e.target.value
              })
            }
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#0f172a"
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Category</label>
          <select
            value={guidelineForm.category}
            onChange={(e) =>
              setGuidelineForm({
                ...guidelineForm,
                category: e.target.value
              })
            }
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#0f172a"
            }}
          >
            <option value="">Select a category</option>
            <option value="Marketing Claims">Marketing Claims</option>
            <option value="Brand Voice">Brand Voice</option>
            <option value="Visual Identity">Visual Identity</option>
            <option value="Content Style">Content Style</option>
            <option value="Compliance">Compliance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Brand Rule</label>
          <textarea
            placeholder="Describe the rule that content must follow..."
            value={guidelineForm.rule}
            onChange={(e) =>
              setGuidelineForm({
                ...guidelineForm,
                rule: e.target.value
              })
            }
            required
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#0f172a",
              resize: "vertical"
            }}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label>Description</label>
          <textarea
            placeholder="Explain why this guideline matters..."
            value={guidelineForm.description}
            onChange={(e) =>
              setGuidelineForm({
                ...guidelineForm,
                description: e.target.value
              })
            }
            rows={2}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#0f172a",
              resize: "vertical"
            }}
          />
        </div>

        {guidelineError && (
          <p style={{ color: "#dc2626", marginBottom: "12px" }}>
            {guidelineError}
          </p>
        )}

        {guidelineSuccess && (
          <p style={{ color: "#15803d", marginBottom: "12px" }}>
            {guidelineSuccess}
          </p>
        )}

        <button
          type="submit"
          disabled={isSavingGuideline}
          style={{
            padding: "12px 22px",
            border: "none",
            borderRadius: "8px",
            background: "#4f46e5",
            color: "#ffffff",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {isSavingGuideline ? "Saving..." : "Save Guideline"}
        </button>

      </form>
    </div>

    {/* EXISTING GUIDELINES */}
    <div>
      <h3 style={{ marginBottom: "16px" }}>
        Existing Brand Rules ({guidelines.length})
      </h3>

      {isLoadingGuidelines && (
        <p className="empty-state">Loading guidelines...</p>
      )}

      {!isLoadingGuidelines && guidelines.length === 0 && (
        <p className="empty-state">
          No brand guidelines available yet.
        </p>
      )}

      {!isLoadingGuidelines && guidelines.map((item) => (
        <div
          key={item.id}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "18px",
            marginBottom: "14px",
            background: "#ffffff"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <h3>{item.title}</h3>

            <span style={{
              background: "#e0e7ff",
              color: "#3730a3",
              padding: "5px 10px",
              borderRadius: "20px",
              fontSize: "12px"
            }}>
              {item.category}
            </span>
          </div>

          <p style={{
            color: "#334155",
            marginTop: "12px"
          }}>
            <strong>Rule:</strong> {item.rule}
          </p>

          {item.description && (
            <p style={{
              color: "#64748b",
              marginTop: "8px"
            }}>
              {item.description}
            </p>
          )}

          <p style={{
            color: "#64748b",
            fontSize: "12px",
            marginTop: "12px"
          }}>
            Status: {item.status || "Active"}
          </p>
        </div>
      ))}
    </div>

  </div>
)}
{/* SUBMISSION HISTORY */}
{activePage === "History" && (
  <div className="content-card">
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "12px"
    }}>
      <div>
        <h2>Submission History</h2>
        <p style={{ color: "#64748b", marginTop: "6px" }}>
          Track submitted content, AI analysis, and human review decisions.
        </p>
      </div>

      <button
        onClick={loadHistory}
        disabled={isLoadingHistory}
        style={{
  padding: "10px 18px",
  minWidth: "100px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#172033",
  fontWeight: "600",
  fontSize: "12px",
  cursor: "pointer"
}}
      >
        {isLoadingHistory ? "Refreshing..." : "↻ Refresh"}
      </button>
    </div>

    {isLoadingHistory && (
      <p className="empty-state">Loading submission history...</p>
    )}

    {historyError && (
      <p style={{ color: "#dc2626", padding: "12px" }}>
        {historyError}
      </p>
    )}

    {!isLoadingHistory && !historyError && historyItems.length === 0 && (
      <p className="empty-state">No submission history available.</p>
    )}

    {!isLoadingHistory && historyItems.length > 0 && (
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}>
        {historyItems.map((item) => (
          <div
            key={item.submission_id}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "20px",
              background: "#ffffff"
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0" }}>
                  {item.title}
                </h3>

                <p style={{
                  color: "#64748b",
                  fontSize: "13px",
                  margin: 0
                }}>
                  Submission #{item.submission_id} · {item.content_type}
                </p>
              </div>

              <span style={{
                padding: "6px 12px",
                borderRadius: "20px",
                background:
                  item.status === "approved" ? "#dcfce7" :
                  item.status === "rejected" ? "#fee2e2" :
                  "#fef3c7",
                color:
                  item.status === "approved" ? "#166534" :
                  item.status === "rejected" ? "#991b1b" :
                  "#92400e",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                {(item.status || "pending").replace("_", " ").toUpperCase()}
              </span>
            </div>

            <div style={{
              marginTop: "18px",
              padding: "14px",
              background: "#f8fafc",
              borderRadius: "8px"
            }}>
              <strong>Submitted Content</strong>
              <p style={{
                color: "#475569",
                whiteSpace: "pre-wrap",
                marginBottom: 0
              }}>
                {item.content}
              </p>
            </div>

            <div style={{ marginTop: "18px" }}>
              <strong>AI Analysis</strong>
              <p style={{ color: "#475569" }}>
                Status: {item.ai_status || "Not analyzed"}
              </p>

              <p style={{ fontWeight: "600", marginBottom: "6px" }}>
                Detected Violations
              </p>

              {item.violations?.length > 0 ? (
                <ul>
                  {item.violations.map((violation, index) => (
                    <li key={index} style={{ color: "#b91c1c" }}>
                      {typeof violation === "string"
                        ? violation
                        : violation.description ||
                          violation.rule ||
                          JSON.stringify(violation)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#64748b" }}>No violations recorded.</p>
              )}

              <p style={{ fontWeight: "600", marginBottom: "6px" }}>
                AI Suggestions
              </p>

              {item.suggestions?.length > 0 ? (
                <ul>
                  {item.suggestions.map((suggestion, index) => (
                    <li key={index} style={{ color: "#475569" }}>
                      {typeof suggestion === "string"
                        ? suggestion
                        : suggestion.description ||
                          suggestion.suggestion ||
                          JSON.stringify(suggestion)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#64748b" }}>No suggestions recorded.</p>
              )}
            </div>

            <div style={{
              marginTop: "18px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "14px"
            }}>
              <strong>Human Review</strong>

              <p style={{ color: "#475569" }}>
                Decision: {item.reviewer_decision || "Not reviewed"}
              </p>

              {item.reviewer_comment && (
                <p style={{ color: "#475569" }}>
                  Reviewer Comment: {item.reviewer_comment}
                </p>
              )}

              {item.reviewed_at && (
                <p style={{ color: "#64748b", fontSize: "13px" }}>
                  Reviewed: {new Date(item.reviewed_at).toLocaleString()}
                </p>
              )}
            </div>

            <p style={{
              color: "#64748b",
              fontSize: "12px",
              marginTop: "16px",
              marginBottom: 0
            }}>
              Submitted: {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
)}

          {/* FOOTER */}
          <footer>
            BrandCue AI © 2026 · Every Content. One Consistent Brand.
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
