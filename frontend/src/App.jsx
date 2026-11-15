import { useState, useEffect, useRef } from "react";
import "./App.css";

import {
  submitContent,
  analyzeSubmission,
  getGuidelines,
  getReviewQueue,
  submitHumanReview,
  getSubmissionHistory,
  createGuideline,
  extractGuidelinesFromPDF
} from "./services/api";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // ==========================================
  // CONTENT FORM STATES
  // ==========================================

  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("Social Media");
  const [content, setContent] = useState("");

  // ==========================================
  // SUBMISSION STATES
  // ==========================================

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);

  // ==========================================
  // AI ANALYSIS STATES
  // ==========================================

  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const analysisResultRef = useRef(null);

  useEffect(() => {
    if (analysis && analysisResultRef.current) {
      analysisResultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [analysis]);

  // ==========================================
  // REVIEW QUEUE STATES
  // ==========================================

  const [reviewItems, setReviewItems] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewComments, setReviewComments] = useState({});
  const [reviewingId, setReviewingId] = useState(null);

  // ==========================================
  // HISTORY STATES
  // ==========================================

  const [historyItems, setHistoryItems] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // ==========================================
  // BRAND GUIDELINES STATES
  // ==========================================

  const [guidelines, setGuidelines] = useState([]);
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
  const [guidelineError, setGuidelineError] = useState("");
  const [guidelineSuccess, setGuidelineSuccess] = useState("");
  const [isSavingGuideline, setIsSavingGuideline] = useState(false);

  const [guidelineForm, setGuidelineForm] = useState({
    title: "",
    category: "",
    rule: "",
    description: ""
  });

  // ==========================================
  // PDF EXTRACTION STATES
  // ==========================================

  const [pdfFile, setPdfFile] = useState(null);
  const [extractedGuidelines, setExtractedGuidelines] = useState([]);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isSavingExtracted, setIsSavingExtracted] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfSuccess, setPdfSuccess] = useState("");

  // ==========================================
  // SECTION REFERENCES
  // ==========================================

const brandGuidelinesTopRef = useRef(null);
const pdfSectionRef = useRef(null);
const extractedGuidelinesRef = useRef(null);
const addGuidelineRef = useRef(null);
const existingGuidelinesRef = useRef(null);

  // ==========================================
  // SIDEBAR MENU
  // ==========================================

  const menuItems = [
    "Dashboard",
    "Brand Guidelines",
    "Content Checker",
    "Review Queue",
    "History"
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
        content: content.trim()
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

      setReviewError(
        error.message || "Unable to load the review queue."
      );
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
        [id]: ""
      }));

      await loadReviewQueue();

      alert(`Submission ${decision} successfully!`);
    } catch (error) {
      console.error("Human review error:", error);

      alert(
        error.message || "Unable to save the review decision."
      );
    } finally {
      setReviewingId(null);
    }
  }

  // ==========================================
  // LOAD HISTORY
  // ==========================================

  async function loadHistory() {
    try {
      setIsLoadingHistory(true);
      setHistoryError("");

      const result = await getSubmissionHistory();

      setHistoryItems(result.history || []);
    } catch (error) {
      console.error("History loading error:", error);

      setHistoryError(
        error.message || "Unable to load submission history."
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // ==========================================
  // LOAD BRAND GUIDELINES
  // ==========================================

  async function loadGuidelines() {
    try {
      setIsLoadingGuidelines(true);
      setGuidelineError("");

      const result = await getGuidelines();

      setGuidelines(result.guidelines || []);
    } catch (error) {
      console.error("Guidelines loading error:", error);

      setGuidelineError(
        error.message || "Unable to load guidelines."
      );
    } finally {
      setIsLoadingGuidelines(false);
    }
  }

  // ==========================================
  // GUIDELINE DUPLICATE CHECK
  // ==========================================

  function normalizeGuidelineValue(value) {
    return (value || "")
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isDuplicateGuideline(candidate, existingGuidelines = []) {
    const candidateTitle = normalizeGuidelineValue(candidate.title);
    const candidateCategory = normalizeGuidelineValue(candidate.category);
    const candidateRule = normalizeGuidelineValue(candidate.rule);

    return existingGuidelines.some((existing) =>
      normalizeGuidelineValue(existing.title) === candidateTitle &&
      normalizeGuidelineValue(existing.category) === candidateCategory &&
      normalizeGuidelineValue(existing.rule) === candidateRule
    );
  }

  // ==========================================
  // CREATE MANUAL GUIDELINE
  // ==========================================

  async function handleCreateGuideline(event) {
    event.preventDefault();

    const candidate = {
      title: guidelineForm.title.trim(),
      category: guidelineForm.category.trim(),
      rule: guidelineForm.rule.trim(),
      description: (guidelineForm.description || "").trim()
    };

    if (isDuplicateGuideline(candidate, guidelines)) {
      setGuidelineError(
        "This brand guideline already exists in your library. Edit the existing rule instead of adding it again."
      );
      setGuidelineSuccess("");
      return;
    }

    try {
      setIsSavingGuideline(true);
      setGuidelineError("");
      setGuidelineSuccess("");

      await createGuideline(candidate);

      setGuidelineSuccess(
        "Brand guideline added successfully!"
      );

      setGuidelineForm({
        title: "",
        category: "",
        rule: "",
        description: ""
      });

      await loadGuidelines();

      setTimeout(() => {
        existingGuidelinesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 300);
    } catch (error) {
      console.error("Guideline creation error:", error);

      setGuidelineError(
        error.message || "Unable to save guideline."
      );
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

      const extracted = (result.guidelines || []).map(
        (guideline) => ({
          ...guideline,
          selected: true
        })
      );

      setExtractedGuidelines(extracted);

      if (extracted.length > 0) {
        setTimeout(() => {
          extractedGuidelinesRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, 350);
      }

      setPdfSuccess(
        `${result.total_extracted} guidelines extracted successfully. Review them before saving.`
      );
    } catch (error) {
      console.error("PDF extraction failed:", error);

      setPdfError(
        error.message ||
          "PDF upload failed. Check your internet connection and try again. If the problem continues, the backend may be temporarily unavailable."
      );
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
        i === index
          ? { ...guideline, [field]: value }
          : guideline
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
  // SAVE EXTRACTED GUIDELINES
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
      setPdfError(
        "Please complete the title, category and rule fields."
      );
      return;
    }

    let savedCount = 0;
    let skippedCount = 0;

    try {
      setIsSavingExtracted(true);
      setPdfError("");
      setPdfSuccess("");

      // Compare against the current library and also against rules
      // already accepted earlier in this same PDF save operation.
      const knownGuidelines = [...guidelines];

      for (const guideline of selectedGuidelines) {
        const candidate = {
          title: guideline.title.trim(),
          category: guideline.category.trim(),
          rule: guideline.rule.trim(),
          description: (guideline.description || "").trim()
        };

        if (isDuplicateGuideline(candidate, knownGuidelines)) {
          skippedCount++;
          continue;
        }

        await createGuideline(candidate);
        knownGuidelines.push(candidate);
        savedCount++;
      }

      if (savedCount === 0) {
        setPdfSuccess(
          `No new guidelines were added. ${skippedCount} duplicate guideline(s) were skipped.`
        );
      } else {
        setPdfSuccess(
          `${savedCount} new guideline(s) saved successfully. ${skippedCount} duplicate(s) skipped.`
        );
      }

      setExtractedGuidelines([]);
      setPdfFile(null);

      await loadGuidelines();

      setTimeout(() => {
        existingGuidelinesRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 300);
    } catch (error) {
      console.error(
        "Saving extracted guidelines failed:",
        error
      );

      setPdfError(
        `${error.message || "Unable to save guidelines."} ${savedCount} guideline(s) were saved before the error.`
      );

      await loadGuidelines();
    } finally {
      setIsSavingExtracted(false);
    }
  }

  // ==========================================
  // SMOOTH SCROLL HELPER
  // ==========================================

  function scrollToSection(ref) {
    const target = ref.current;
    if (!target) return;

    const startPosition = window.scrollY;
    const targetPosition =
      target.getBoundingClientRect().top + window.scrollY - 20;
    const distance = targetPosition - startPosition;
    const duration = 1100;
    let startTime = null;

    function animateScroll(currentTime) {
      if (startTime === null) startTime = currentTime;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startPosition + distance * easedProgress);

      if (progress < 1) {
        window.requestAnimationFrame(animateScroll);
      }
    }

    window.requestAnimationFrame(animateScroll);
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
      <style>{`
        .brand-guidelines-page {
          max-width: 1120px; margin: 28px auto !important; padding: clamp(20px, 3vw, 34px) !important;
          border: 1px solid #e8eaf4 !important; border-radius: 22px !important;
          background: linear-gradient(180deg,#fff 0%,#fbfcff 100%) !important;
          box-shadow: 0 18px 50px rgba(27,35,75,.07) !important;
        }
        .brand-guidelines-page h2,.brand-guidelines-page h3 { color:#172554; letter-spacing:-.025em; }
        .brand-guidelines-page h3 { font-size:20px; font-weight:750; }
        .brand-guidelines-page p { line-height:1.65; }
        .brand-guidelines-page input:not([type=checkbox]),
        .brand-guidelines-page select,.brand-guidelines-page textarea {
          min-height:46px; border:1px solid #d9deec !important; border-radius:10px !important;
          background:#fff !important; color:#172033 !important; padding:12px 14px !important;
          font:inherit; transition:border-color .18s,box-shadow .18s;
        }
        .brand-guidelines-page textarea { min-height:100px; }
        .brand-guidelines-page input:focus,.brand-guidelines-page select:focus,.brand-guidelines-page textarea:focus {
          outline:none; border-color:#7667f5 !important; box-shadow:0 0 0 4px rgba(99,82,232,.12) !important;
        }
        .brand-guidelines-page label { display:block; color:#334155; font-size:13px; font-weight:650; margin-bottom:7px; }
        .brand-guidelines-page button { transition:transform .18s ease,box-shadow .18s ease,background .18s ease; }
        .brand-guidelines-page button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 20px rgba(79,70,229,.13); }
        .brand-guidelines-page button:focus-visible { outline:3px solid rgba(99,82,232,.3); outline-offset:3px; }
        .brand-guidelines-page button:disabled { cursor:not-allowed; opacity:.58; }
        .brand-guidelines-page [ref] { scroll-margin-top:24px; }
        .brand-guidelines-page > div[style*="background: rgb(245, 243, 255)"],
        .brand-guidelines-page > div[style*="background: rgb(248, 250, 252)"] {
          box-shadow:0 8px 24px rgba(31,41,85,.035);
        }
        .brand-guidelines-page footer { color:#94a3b8; }
        @media(max-width:640px) {
          .brand-guidelines-page { margin:12px auto !important; padding:16px !important; border-radius:16px !important; }
          .brand-guidelines-page input[type=file] { max-width:100%; font-size:12px; }
          .brand-guidelines-page button { max-width:100%; }
        }
      `}</style>
      <style>{`
        /* BrandCue identity and restrained motion system */
        .logo { display:flex; align-items:center; gap:12px; }
        .logo .brandcue-mark { position:relative; width:44px !important; height:44px !important; flex:0 0 44px; display:grid; place-items:center; padding:0 !important; overflow:visible; border-radius:14px !important; background:transparent !important; box-shadow:0 7px 18px rgba(91,75,220,.24); animation:brandcue-mark-float 5s ease-in-out infinite; }
        .logo .brandcue-mark svg { display:block; width:100%; height:100%; filter:drop-shadow(0 3px 5px rgba(35,29,110,.18)); }
        .logo .brandcue-mark:after { content:""; position:absolute; width:44px; height:44px; border:1px solid rgba(167,156,255,.5); border-radius:15px; pointer-events:none; animation:brandcue-mark-pulse 3.8s ease-out infinite; }
        .logo { position:relative; }
        .logo h2 { letter-spacing:-.35px; }
        .logo p { opacity:.78; }
        .sidebar nav .nav-item { transition:transform .22s ease,background .22s ease,box-shadow .22s ease; }
        .sidebar nav .nav-item:hover { transform:translateX(3px); }
        .bc-hero { position:relative; overflow:hidden; isolation:isolate; }
        .bc-hero:after { content:""; position:absolute; z-index:-1; width:320px; height:320px; top:-210px; right:-70px; border:1px solid rgba(255,255,255,.16); border-radius:50%; box-shadow:0 0 0 24px rgba(255,255,255,.035),0 0 0 52px rgba(255,255,255,.025); animation:brandcue-orbit 18s linear infinite; }
        .bc-feature,.bc-guide, .bc-review-card,.bc-history-item,.bc-guideline-card,.bc-form-card { animation:brandcue-enter .55s cubic-bezier(.2,.7,.2,1) both; }
        .bc-feature:nth-child(2),.bc-guide:nth-child(2) { animation-delay:.07s; }
        .bc-feature:nth-child(3),.bc-guide:nth-child(3) { animation-delay:.14s; }
        .bc-feature:nth-child(4),.bc-guide:nth-child(4) { animation-delay:.21s; }
        .primary-button,.bc-history-refresh,.analyze-button { transition:transform .22s ease,box-shadow .22s ease,filter .22s ease !important; }
        .primary-button:hover:not(:disabled),.bc-history-refresh:hover:not(:disabled),.analyze-button:hover:not(:disabled) { transform:translateY(-2px); filter:saturate(1.08); box-shadow:0 12px 24px rgba(81,67,214,.23) !important; }
        .primary-button:active:not(:disabled),.bc-history-refresh:active:not(:disabled),.analyze-button:active:not(:disabled) { transform:translateY(0) scale(.985); }
        .bc-review-summary,.bc-history-shell,.bc-create-rule-card,.bc-library-section { transition:box-shadow .25s ease,border-color .25s ease,transform .25s ease; }
        .bc-review-summary:hover,.bc-history-shell:hover,.bc-create-rule-card:hover,.bc-library-section:hover { border-color:#d8d5ff; box-shadow:0 16px 36px rgba(40,35,110,.075); }
        @keyframes brandcue-enter { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes brandcue-mark-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-2px); } }
        @keyframes brandcue-mark-pulse { 0% { transform:scale(1); opacity:.55; } 75%,100% { transform:scale(1.22); opacity:0; } }
        @keyframes brandcue-orbit { to { transform:rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          *,*::before,*::after { scroll-behavior:auto !important; animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
        }
        @media(max-width:640px) { .logo .brandcue-mark { width:40px !important; height:40px !important; flex-basis:40px; } .logo .brandcue-mark:after { width:40px; height:40px; } }
      `}</style>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon brandcue-mark" aria-label="BrandCue AI logo">
            <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
              <defs>
                <linearGradient id="brandcueMarkGradient" x1="5" y1="4" x2="43" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A99BFF" />
                  <stop offset="0.52" stopColor="#7565F2" />
                  <stop offset="1" stopColor="#5143D6" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#brandcueMarkGradient)" />
              <path d="M31.5 15.5H23a8.5 8.5 0 1 0 0 17h8.5" fill="none" stroke="white" strokeWidth="4.2" strokeLinecap="round" />
              <path d="M29 24h8" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="36.5" cy="14" r="3" fill="#DCD7FF" />
            </svg>
          </span>

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
              className={`nav-item ${
                activePage === item ? "active" : ""
              }`}
              onClick={() => handleNavigation(item)}
            >
              <span>
                {{
                  Dashboard: "▦",
                  "Brand Guidelines": "◈",
                  "Content Checker": "✧",
                  "Review Queue": "☷",
                  History: "◷"
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
            <p className="breadcrumb">
              Workspace / {activePage}
            </p>

            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <span className="status-indicator">
              ● System Online
            </span>

            <div className="avatar">MS</div>
          </div>
        </header>

        <section className="dashboard-content">
          <style>{`
            .bc-page { max-width:1180px; margin:0 auto; width:100%; }
            .bc-page-header { display:flex; align-items:center; justify-content:space-between; gap:22px; padding:28px 30px; margin-bottom:22px; border:1px solid #e7eaf4; border-radius:20px; background:linear-gradient(120deg,#fff 0%,#f5f6ff 100%); box-shadow:0 8px 24px rgba(24,32,66,.045); }
            .bc-page-kicker { display:inline-flex; align-items:center; gap:7px; margin-bottom:9px; color:#6558df; font-size:10px; font-weight:800; letter-spacing:1.15px; text-transform:uppercase; }
            .bc-page-header h1 { margin:0; color:#172033; font-size:clamp(24px,3vw,31px); line-height:1.2; letter-spacing:-.8px; }
            .bc-page-header p { margin:8px 0 0; color:#718096; font-size:13px; line-height:1.65; }
            .bc-page-header .primary-button { white-space:nowrap; box-shadow:0 7px 16px rgba(79,70,229,.16); }
            .bc-page-header.bc-page-header-centered { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; }
            .bc-page-header-centered > div:first-child { text-align:center; }
            .bc-page-header-centered .bc-page-kicker { justify-content:center; }
            .bc-centered-head { display:block; text-align:center; margin-left:auto; margin-right:auto; }
            .bc-centered-head > div { width:100%; text-align:center; }
            .bc-history-header { position:relative; display:flex; justify-content:center; align-items:center; min-height:76px; margin-bottom:24px; }
            .bc-history-title { text-align:center; }
            .bc-history-title .bc-page-kicker { justify-content:center; }
            .bc-history-header > button { position:absolute; right:0; top:50%; transform:translateY(-50%); }
            .bc-form-card { padding:28px; border:1px solid #e6e9f2; border-radius:18px; background:#fff; box-shadow:0 10px 28px rgba(20,30,60,.055); }
            .bc-form-card .form-heading { padding-bottom:18px; margin-bottom:22px; border-bottom:1px solid #edf0f6; }
            .bc-form-card .form-heading h2 { margin:0; color:#172033; font-size:19px; }
            .bc-form-card .form-heading p { margin:7px 0 0; color:#8290a5; font-size:12px; }
            .bc-form-card .form-group { margin-bottom:21px; }
            .bc-form-card label { display:block; margin-bottom:8px; color:#344054; font-size:12px; font-weight:700; }
            .bc-form-card input,.bc-form-card select,.bc-form-card textarea { border:1px solid #dce2ee !important; border-radius:10px !important; background:#fbfcff !important; color:#172033 !important; transition:border-color .18s,box-shadow .18s,background .18s; }
            .bc-form-card input:focus,.bc-form-card select:focus,.bc-form-card textarea:focus { outline:none; border-color:#8177ee !important; background:#fff !important; box-shadow:0 0 0 4px rgba(99,88,230,.11); }
            .bc-form-card textarea { line-height:1.7; }
            .bc-form-card .analyze-button { min-height:48px; border-radius:11px; box-shadow:0 8px 18px rgba(79,70,229,.16); }
            .bc-review-summary { display:flex; align-items:center; gap:14px; padding:18px 20px; margin-bottom:18px; border:1px solid #e4e7f3; border-radius:15px; background:#fff; box-shadow:0 5px 18px rgba(15,23,42,.035); }
            .bc-review-summary-icon { display:grid; place-items:center; width:42px; height:42px; border-radius:12px; color:#5146d8; background:#efedff; font-size:19px; }
            .bc-review-summary strong { display:block; color:#172033; font-size:15px; }
            .bc-review-summary small { display:block; margin-top:4px; color:#7b8498; font-size:11px; }
            .bc-review-card { padding:24px; margin-bottom:18px; border:1px solid #e6e9f2; border-radius:17px; background:#fff; box-shadow:0 7px 22px rgba(20,30,60,.045); transition:transform .2s,box-shadow .2s; }
            .bc-review-card:hover,.bc-history-item:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(20,30,60,.075); }
            .bc-review-card h2 { color:#172033; font-size:18px; }
            .bc-review-card h3 { color:#344054; font-size:13px; }
            .bc-review-card textarea { border:1px solid #dce2ee !important; border-radius:10px !important; }
            .bc-history-shell { padding:28px; border:1px solid #e6e9f2; border-radius:19px; background:linear-gradient(180deg,#fff 0%,#fbfcff 100%); box-shadow:0 8px 24px rgba(20,30,60,.045); }
            .bc-history-item { padding:22px; border:1px solid #e5e9f2 !important; border-radius:15px !important; background:#fff !important; box-shadow:0 4px 14px rgba(20,30,60,.025); transition:transform .2s,box-shadow .2s; }
            .bc-history-item h3 { color:#172033; font-size:16px; }
            .bc-history-item strong { color:#344054; font-size:12px; }
            /* BrandCue polish: clear hierarchy, calmer empty states and consistent cards */
            .bc-centered-head { text-align:center !important; }
            .bc-centered-head h2 { font-size:20px !important; letter-spacing:-.45px; }
            .bc-centered-head p { max-width:620px; margin:7px auto 0 !important; line-height:1.65; }
            .bc-feature-grid { margin-top:24px; }
            .bc-feature { text-align:center; padding:24px 22px; }
            .bc-feature-icon { margin:0 auto 15px; }
            .bc-feature p { min-height:0; }
            .bc-hero { margin-bottom:26px; }
            .bc-hero-copy { max-width:720px; margin:0 auto; text-align:center; }
            .bc-hero h1 { margin-left:auto; margin-right:auto; }
            .bc-guide { margin-top:24px; }
            .bc-guide .bc-section-head { display:block; text-align:center; }
            .bc-guide .bc-section-head > div { width:100%; }
            .bc-guide .bc-status-pill { display:inline-flex; margin-top:12px; }
            .bc-review-page { padding-bottom:34px; }
            .bc-review-page > .bc-page-header { margin-bottom:24px; }
            .bc-review-page > .content-card:not(.bc-review-card) { min-height:190px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:34px 24px; border:1px solid #e4e8f4; border-radius:18px; background:radial-gradient(circle at 50% 0%,rgba(99,88,230,.08),transparent 62%),#fff; box-shadow:0 10px 28px rgba(20,30,60,.045); }
            .bc-review-page > .content-card:not(.bc-review-card) h2 { margin:0 0 12px; color:#172033; font-size:20px; }
            .bc-review-page .empty-state { max-width:460px; margin:0 auto; color:#718096; line-height:1.7; }
            .bc-empty-icon { display:grid; place-items:center; width:54px; height:54px; margin:0 auto 14px; border-radius:17px; color:#0b946b; background:#e8faf3; font-size:25px; font-weight:800; box-shadow:0 0 0 7px rgba(16,185,129,.06); }
            .bc-review-summary { background:linear-gradient(110deg,#fff 0%,#f7f7ff 100%); border-color:#dedff7; }
            .bc-review-card { border-left:4px solid #7165e8; }
            .bc-review-card > .section-heading { padding-bottom:16px; border-bottom:1px solid #edf0f6; }
            .bc-history-shell { padding:30px; }
            .bc-history-header { min-height:100px; margin-bottom:28px; padding:8px 125px; }
            .bc-history-title h2 { margin:0; color:#172033; font-size:25px; letter-spacing:-.7px; }
            .bc-history-title p { max-width:560px; margin:8px auto 0 !important; line-height:1.65; }
            .bc-history-header > button { border:1px solid #d9def0 !important; border-radius:10px !important; background:#fff !important; box-shadow:0 4px 12px rgba(20,30,60,.04); }
            .bc-history-item { position:relative; overflow:hidden; }
            .bc-history-item:before { content:""; position:absolute; inset:0 auto 0 0; width:4px; background:linear-gradient(180deg,#786cf0,#aaa4ff); }
            .bc-history-item > div:first-child { padding-bottom:14px; border-bottom:1px solid #edf0f6; }
            .bc-history-item h3 { letter-spacing:-.2px; }
            .bc-history-item > div[style*="background: rgb(248, 250, 252)"] { border:1px solid #edf0f6; }
            .bc-guideline-card { padding:22px !important; margin-bottom:15px !important; border:1px solid #e3e8f3 !important; border-radius:16px !important; background:linear-gradient(145deg,#fff 0%,#fcfcff 100%) !important; box-shadow:0 5px 16px rgba(20,30,60,.035); transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease; }
            .bc-guideline-card:hover { transform:translateY(-2px); border-color:#c9c7ff !important; box-shadow:0 12px 26px rgba(79,70,229,.075); }
            .bc-guideline-card h3 { color:#172033; font-size:15px; letter-spacing:-.2px; }
            .bc-guideline-card .bc-guideline-category { display:inline-flex; align-items:center; padding:6px 10px !important; border:1px solid #e3e5ff; border-radius:20px !important; color:#5146d8 !important; background:#f1f0ff !important; font-size:10px !important; font-weight:700; }
            .bc-guideline-card .bc-guideline-rule { padding:13px 14px; border-radius:10px; background:#f8f9ff; color:#344054 !important; line-height:1.7; }
            .bc-guideline-card .bc-guideline-description { color:#718096 !important; line-height:1.65; }
            .bc-guideline-card .bc-guideline-status { display:inline-flex; align-items:center; gap:6px; color:#0f8a63 !important; font-size:11px !important; font-weight:700; }
            .bc-guideline-card .bc-guideline-status:before { content:""; width:7px; height:7px; border-radius:50%; background:#18b981; box-shadow:0 0 0 3px #e8faf3; }
            .bc-library-empty,.bc-history-empty { padding:34px 22px; border:1px dashed #d9def0; border-radius:16px; background:#fafbff; color:#718096; text-align:center; line-height:1.7; }
            .bc-library-empty:before,.bc-history-empty:before { display:block; margin-bottom:10px; color:#7469e8; font-size:25px; }
            .bc-library-empty:before { content:"◈"; }
            .bc-history-empty:before { content:"◷"; }
            @media(max-width:650px) { .bc-history-header { padding:0; min-height:0; } .bc-history-title h2 { font-size:22px; } .bc-review-page > .content-card:not(.bc-review-card) { min-height:160px; } .bc-history-shell { padding:19px; } }
            @media(max-width:650px) { .bc-page-header { align-items:stretch; flex-direction:column; padding:22px; } .bc-page-header.bc-page-header-centered { display:flex; } .bc-page-header .primary-button { width:100%; } .bc-form-card,.bc-history-shell { padding:19px; } .bc-review-card { padding:18px; } .bc-history-header { display:flex; flex-direction:column; gap:14px; } .bc-history-header > button { position:static; transform:none; width:100%; } }
            /* Brand Guidelines: refined section navigation, create form and rule library */
            .brand-guidelines-page > div:first-of-type { margin-bottom:22px !important; }
            .brand-guidelines-page > div:first-of-type > div:first-child { justify-content:center !important; text-align:center; }
            .brand-guidelines-page > div:first-of-type > div:first-child > div:last-child { text-align:center; }
            .brand-guidelines-page > div:first-of-type > div:first-child p { margin-left:auto; margin-right:auto; }
            .bc-guideline-nav-button { min-height:48px; display:flex; align-items:center; justify-content:center; gap:8px; padding:13px 16px !important; border-radius:12px !important; font-size:12px; font-weight:750 !important; letter-spacing:.01em; box-shadow:0 5px 14px rgba(31,41,85,.045); }
            .bc-guideline-nav-button.is-primary { background:linear-gradient(105deg,#6859ec,#5143d6) !important; box-shadow:0 8px 18px rgba(91,75,220,.2); }
            .bc-guideline-nav-button:not(.is-primary):hover { border-color:#9d95f4 !important; background:#f8f7ff !important; }
            .bc-create-rule-card { position:relative; overflow:hidden; padding:30px clamp(18px,3vw,34px) !important; border:1px solid #e1e6f2 !important; border-radius:20px !important; background:radial-gradient(circle at 100% 0%,rgba(120,108,245,.09),transparent 34%),linear-gradient(145deg,#fff 0%,#f7f8ff 100%) !important; box-shadow:0 12px 30px rgba(31,41,85,.055); }
            .bc-create-rule-card:before { content:"✎"; display:grid; place-items:center; width:46px; height:46px; margin:0 auto 12px; border-radius:15px; background:#eeebff; color:#5c4de2; font-size:21px; font-weight:800; }
            .bc-create-rule-card > h3 { margin:0 0 8px !important; text-align:center; color:#202044 !important; font-size:20px !important; }
            .bc-create-rule-card > p { max-width:560px; margin:0 auto 25px !important; text-align:center; color:#718096 !important; font-size:13px; }
            .bc-create-rule-card form { max-width:760px; margin:0 auto; }
            .bc-create-rule-card form > div { margin-bottom:19px !important; }
            .bc-create-rule-card label { color:#344054 !important; font-size:12px !important; font-weight:750 !important; }
            .bc-create-rule-card input,.bc-create-rule-card select,.bc-create-rule-card textarea { width:100% !important; box-sizing:border-box !important; margin-top:8px !important; padding:13px 15px !important; border:1px solid #dce2ee !important; border-radius:11px !important; background:rgba(255,255,255,.94) !important; color:#172033 !important; font-size:13px !important; transition:border-color .2s,box-shadow .2s !important; }
            .bc-create-rule-card input:focus,.bc-create-rule-card select:focus,.bc-create-rule-card textarea:focus { outline:none; border-color:#7768ef !important; box-shadow:0 0 0 4px rgba(116,100,239,.11) !important; }
            .bc-create-rule-card textarea { min-height:105px; line-height:1.65; resize:vertical; }
            .bc-create-rule-card button[type=submit] { display:block; min-width:180px; min-height:46px; margin:8px auto 0; border-radius:11px !important; background:linear-gradient(105deg,#6859ec,#5143d6) !important; box-shadow:0 8px 18px rgba(91,75,220,.18); }
            .bc-library-section { padding:28px clamp(16px,2.5vw,28px); border:1px solid #e5e8f3; border-radius:20px; background:linear-gradient(180deg,#fff 0%,#fafbff 100%); box-shadow:0 12px 30px rgba(31,41,85,.045); }
            .bc-library-section > div:first-child { margin-bottom:24px !important; }
            .bc-library-kicker { display:inline-flex; margin-bottom:9px; padding:6px 11px; border-radius:30px; background:#efedff; color:#5d50dc; font-size:9px; font-weight:850; letter-spacing:.12em; }
            .bc-library-heading h3 { display:flex; justify-content:center; align-items:center; gap:9px; color:#172033 !important; font-size:21px !important; }
            .bc-library-count { display:inline-grid; place-items:center; min-width:27px; height:27px; padding:0 7px; border-radius:20px; background:#5b4be7; color:#fff; font-size:12px; }
            .bc-library-heading p { margin:8px auto 0 !important; color:#7b879b !important; font-size:13px; }
            .bc-library-section .bc-guideline-card:last-of-type { margin-bottom:0 !important; }
            .bc-history-refresh { min-width:125px !important; min-height:42px; padding:10px 17px !important; border:0 !important; border-radius:10px !important; background:linear-gradient(105deg,#6859ec,#5143d6) !important; color:#fff !important; font-size:12px !important; font-weight:750 !important; box-shadow:0 7px 16px rgba(91,75,220,.18) !important; }
            .bc-history-refresh:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 11px 20px rgba(91,75,220,.24) !important; }
            /* Content Checker form: elevate the entire submission panel */
            .bc-checker-page .bc-form-card { position:relative; overflow:hidden; }
            .bc-checker-page .bc-form-card:before { content:""; position:absolute; left:0; top:0; width:100%; height:4px; background:linear-gradient(90deg,#6b5ce7,#a69cff,#6b5ce7); }
            .bc-checker-page .form-heading { display:flex; flex-direction:column; align-items:flex-start; gap:5px; padding:0 0 22px !important; }
            .bc-checker-page .form-heading h2 { display:flex; align-items:center; gap:10px; }
            .bc-checker-page .form-heading h2:before { content:"✦"; display:grid; place-items:center; width:34px; height:34px; border-radius:11px; background:#efedff; color:#5d50dc; font-size:15px; }
            .bc-checker-page .form-heading p { margin:0 !important; }
            .bc-checker-page .form-group { padding:0; }
            .bc-checker-page .form-group input,.bc-checker-page .form-group select { min-height:52px; }
            .bc-checker-page .form-group textarea { min-height:210px; background:linear-gradient(180deg,#fbfcff,#fff) !important; }
            .bc-checker-page .checker-info { border-color:#e2dfff !important; background:linear-gradient(100deg,#f7f6ff,#f1efff) !important; }
            .bc-checker-page .analyze-button { min-height:56px; font-size:14px !important; }
            /* AI result: premium report card with a clear reading hierarchy */
            .bc-analysis-result { position:relative; overflow:hidden; padding:26px !important; border:1px solid #e2e5f3 !important; border-radius:20px !important; background:linear-gradient(155deg,#fff 0%,#fbfbff 100%) !important; box-shadow:0 14px 34px rgba(30,35,85,.075) !important; }
            .bc-analysis-result:before { content:""; position:absolute; inset:0 0 auto; height:5px; background:linear-gradient(90deg,#6255e8,#a49bff,#6255e8); }
            .bc-analysis-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:8px 0 19px; border-bottom:1px solid #edf0f7; }
            .bc-analysis-heading h2 { margin:0; color:#172033; font-size:21px; letter-spacing:-.5px; }
            .bc-analysis-heading p { margin:6px 0 0; color:#8390a5; font-size:11px; }
            .bc-analysis-status,.bc-review-status { display:inline-flex; align-items:center; justify-content:center; gap:7px; flex-shrink:0; padding:9px 13px !important; border:1px solid #f5d6ad; border-radius:30px !important; background:#fff5e8 !important; color:#a85c12 !important; font-size:11px !important; font-weight:800 !important; letter-spacing:.02em; }
            .bc-analysis-status.is-compliant { border-color:#bcebd5; background:#eafaf2 !important; color:#087c55 !important; }
            .bc-analysis-result h3 { color:#202b43; font-size:15px; letter-spacing:-.15px; }
            .bc-analysis-result > div[style*="marginTop: 20px"] { padding:17px 18px; border:1px solid #edf0f7; border-radius:14px; background:#fff; }
            .bc-analysis-result > div[style*="marginTop: 25px"] { margin-top:20px !important; }
            .bc-analysis-result > div[style*="border: 1px solid rgb(226, 232, 240)"] { border-color:#e2e5f3 !important; border-radius:16px !important; background:linear-gradient(135deg,#fff,#f8f9ff) !important; }
            .bc-analysis-result > div[style*="border: 1px solid rgb(240, 213, 213)"] { border-color:#f4d2d2 !important; border-radius:13px !important; background:linear-gradient(135deg,#fffafa,#fff) !important; box-shadow:0 4px 12px rgba(185,55,55,.035); }
            .bc-analysis-result > div[style*="background: rgb(243, 247, 255)"] { border:1px solid #e1e7fb; border-radius:13px !important; background:linear-gradient(120deg,#f5f7ff,#f0f2ff) !important; }
            .bc-analysis-result button.primary-button { min-height:40px; padding:10px 17px; border-radius:10px; background:linear-gradient(105deg,#6859ec,#5143d6); box-shadow:0 6px 14px rgba(91,75,220,.17); }
            .bc-analysis-result > div[style*="background: rgb(255, 248, 232)"] { border:1px solid #f4e3b7; border-radius:13px !important; background:linear-gradient(110deg,#fff9e9,#fff5df) !important; }
            /* Review queue cards: strong status and readable evidence blocks */
            .bc-review-card { padding:26px !important; border:1px solid #e2e6f2 !important; border-left:4px solid #7468ec !important; border-radius:19px !important; background:linear-gradient(160deg,#fff 0%,#fcfcff 100%) !important; box-shadow:0 10px 28px rgba(25,35,75,.055) !important; }
            .bc-review-card > .section-heading { align-items:center; padding-bottom:17px; border-bottom:1px solid #edf0f6; }
            .bc-review-card > .section-heading h2 { margin:0; font-size:18px; letter-spacing:-.3px; }
            .bc-review-card > .section-heading p { margin-top:6px; color:#8290a5; font-size:11px; }
            .bc-review-card .bc-review-status { border-color:#f5d6ad; background:#fff3e4 !important; color:#a85c12 !important; }
            .bc-review-card h3 { margin-bottom:9px; color:#344054; font-size:13px; }
            .bc-review-card textarea { min-height:88px; padding:13px !important; background:#fbfcff !important; }
            .bc-review-card button { border-radius:10px !important; }
            /* History cards: readable sections and always-visible refresh action */
            .bc-history-header { min-height:94px; }
            .bc-history-header > button.bc-history-refresh { position:absolute; right:0; top:50%; transform:translateY(-50%); display:inline-flex !important; align-items:center; justify-content:center; gap:7px; width:auto !important; min-width:142px !important; min-height:43px !important; padding:11px 17px !important; border:0 !important; border-radius:11px !important; background:linear-gradient(105deg,#6859ec,#5143d6) !important; color:#fff !important; font-size:12px !important; font-weight:750 !important; line-height:1.2 !important; opacity:1 !important; visibility:visible !important; box-shadow:0 7px 16px rgba(91,75,220,.2) !important; }
            .bc-history-header > button.bc-history-refresh:disabled { opacity:.72 !important; cursor:wait; }
            .bc-history-header > button.bc-history-refresh:hover:not(:disabled) { transform:translateY(calc(-50% - 2px)); box-shadow:0 11px 20px rgba(91,75,220,.25) !important; }
            .bc-history-item { padding:24px !important; border:1px solid #e3e7f1 !important; border-radius:17px !important; background:linear-gradient(155deg,#fff,#fcfcff) !important; }
            .bc-history-item h3 { font-size:16px !important; }
            .bc-history-item > div[style*="background: rgb(248, 250, 252)"] { padding:16px !important; border:1px solid #e9edf5; border-radius:12px !important; background:#f8f9fd !important; }
            .bc-history-item > div[style*="marginTop: 18px"] { padding:15px 16px; border:1px solid #edf0f6; border-radius:12px; background:#fff; }
            .bc-history-item > div[style*="borderTop: 1px solid rgb(226, 232, 240)"] { border-top:1px solid #e8ebf4 !important; }
            @media(max-width:650px) { .bc-library-section { padding:20px 14px; } .bc-create-rule-card { padding:23px 16px !important; } .bc-guideline-nav-button { min-height:46px; } .bc-analysis-result { padding:19px !important; } .bc-analysis-heading { align-items:flex-start; flex-direction:column; } .bc-review-card { padding:18px !important; } .bc-history-header { display:flex; flex-direction:column; gap:14px; padding:0 0 10px; } .bc-history-header > button.bc-history-refresh { position:static; transform:none; width:100% !important; } }

            /* Content Checker - premium, calm and accessible form styling */
            .bc-checker-page { max-width:1040px; margin:30px auto !important; padding:0 28px 36px !important; }
            .bc-checker-page .bc-page-header { position:relative; overflow:hidden; display:flex; justify-content:center; text-align:center; padding:36px 28px !important; margin:0 0 24px !important; border:1px solid #e5e7f5; border-radius:22px; background:radial-gradient(circle at 10% 0%,rgba(124,108,255,.14),transparent 42%),linear-gradient(135deg,#fff 0%,#f5f6ff 100%); box-shadow:0 14px 36px rgba(31,41,85,.055); }
            .bc-checker-page .bc-page-header > div { width:100%; }
            .bc-checker-page .bc-page-kicker { display:inline-flex; align-items:center; justify-content:center; padding:7px 13px; border-radius:30px; background:#eeebff; color:#5b4be7; font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
            .bc-checker-page .bc-page-header h1 { margin:15px 0 7px !important; color:#172033; font-size:clamp(26px,3vw,35px) !important; font-weight:780 !important; letter-spacing:-.045em; }
            .bc-checker-page .bc-page-header p { margin:0 !important; color:#64748b; font-size:14px; }
            .bc-checker-page .bc-form-card { padding:30px clamp(20px,4vw,42px) !important; border:1px solid #e5e9f3 !important; border-radius:22px !important; background:#fff !important; box-shadow:0 16px 42px rgba(31,41,85,.065) !important; }
            .bc-checker-page .form-heading { text-align:left !important; padding:0 0 20px !important; margin-bottom:22px !important; border-bottom:1px solid #edf0f6; }
            .bc-checker-page .form-heading h2 { color:#172033 !important; font-size:20px !important; font-weight:750 !important; letter-spacing:-.025em; }
            .bc-checker-page .form-heading p { color:#7b879b !important; font-size:13px !important; }
            .bc-checker-page .form-group { margin-bottom:22px !important; }
            .bc-checker-page .form-group label { display:block; margin:0 0 9px !important; color:#344054 !important; font-size:12px !important; font-weight:700 !important; text-align:left !important; }
            .bc-checker-page .form-group input,.bc-checker-page .form-group select,.bc-checker-page .form-group textarea { width:100%; box-sizing:border-box; border:1px solid #dce2ee !important; border-radius:12px !important; background:#fbfcff !important; color:#172033 !important; padding:13px 15px !important; font-size:13px !important; transition:border-color .2s,box-shadow .2s,background .2s; }
            .bc-checker-page .form-group input,.bc-checker-page .form-group select { min-height:49px; }
            .bc-checker-page .form-group textarea { min-height:190px; resize:vertical; line-height:1.7; }
            .bc-checker-page .form-group input:focus,.bc-checker-page .form-group select:focus,.bc-checker-page .form-group textarea:focus { outline:none; border-color:#7464ef !important; background:#fff !important; box-shadow:0 0 0 4px rgba(116,100,239,.12) !important; }
            .bc-checker-page .character-count { margin-top:8px; color:#8a94a8; font-size:11px; text-align:right; }
            .bc-checker-page .checker-info { display:flex; align-items:center; gap:10px; margin:24px 0 18px !important; padding:14px 16px !important; border:1px solid #e7e4ff; border-radius:12px !important; background:#f7f6ff !important; color:#6255c8 !important; font-size:12px !important; line-height:1.5; }
            .bc-checker-page .checker-info span { flex:0 0 25px; display:grid; place-items:center; width:25px; height:25px; border-radius:8px; background:#eae7ff; font-weight:800; }
            .bc-checker-page .analyze-button { width:100%; min-height:53px; border-radius:12px !important; background:linear-gradient(100deg,#6556e9,#5142d7) !important; box-shadow:0 9px 20px rgba(91,75,220,.2); font-size:13px !important; font-weight:750 !important; letter-spacing:.01em; }
            .bc-checker-page .analyze-button:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 13px 25px rgba(91,75,220,.27); }
            /* PDF import card */
            .bc-pdf-card { position:relative; overflow:hidden; text-align:center; margin:0 0 26px; padding:30px clamp(18px,3vw,32px); border:1px solid #e1ddff; border-radius:20px; background:radial-gradient(circle at 90% 0%,rgba(125,107,255,.13),transparent 35%),linear-gradient(135deg,#faf9ff,#f1efff); box-shadow:0 12px 30px rgba(60,50,130,.055); }
            .bc-pdf-icon { display:grid; place-items:center; width:46px; height:46px; margin:0 auto 13px; border-radius:15px; background:#e7e3ff; color:#5b4be7; font-size:21px; }
            .bc-pdf-card h3 { margin:0 !important; color:#202044; font-size:19px !important; font-weight:760 !important; letter-spacing:-.025em; }
            .bc-pdf-card > p { max-width:570px; margin:9px auto 20px !important; color:#68738c !important; font-size:13px; line-height:1.65; }
            .bc-pdf-upload { display:block !important; width:min(100%,620px); box-sizing:border-box; margin:0 auto 17px !important; padding:13px 15px !important; border:1px dashed #b8b0f6 !important; border-radius:13px !important; background:rgba(255,255,255,.86) !important; color:#59627a; font-size:12px !important; }
            .bc-pdf-upload::file-selector-button { margin-right:12px; padding:9px 14px; border:0; border-radius:8px; background:#ebe8ff; color:#5142c8; font-weight:700; cursor:pointer; }
            .bc-pdf-action { min-width:185px; min-height:45px; padding:11px 20px !important; border:0 !important; border-radius:11px !important; background:linear-gradient(100deg,#7668ef,#5a4bdd) !important; color:#fff !important; font-weight:750 !important; box-shadow:0 8px 18px rgba(91,75,220,.18); }
            .bc-pdf-action:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 22px rgba(91,75,220,.24); }
            @media(max-width:650px) { .bc-checker-page { padding:0 14px 24px !important; margin:18px auto !important; } .bc-checker-page .bc-page-header { padding:27px 16px !important; } .bc-checker-page .bc-form-card { padding:22px 17px !important; } }
          `}</style>

          {/* ================================= */}
          {/* DASHBOARD */}
          {/* ================================= */}

          {activePage === "Dashboard" && (
            <div className="brandcue-dashboard">
              <style>{`
                .brandcue-dashboard { display:flex; flex-direction:column; gap:24px; }
                .bc-hero { position:relative; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; text-align:center; padding:38px 40px; border-radius:22px; color:#fff; background:linear-gradient(120deg,#171b3b 0%,#3432a6 58%,#6557ed 100%); box-shadow:0 18px 45px rgba(49,46,129,.18); }
                .bc-hero:before { content:""; position:absolute; width:300px; height:300px; border:1px solid rgba(255,255,255,.13); border-radius:50%; right:8%; top:-190px; box-shadow:0 0 0 35px rgba(255,255,255,.035),0 0 0 70px rgba(255,255,255,.025); }
                .bc-hero-copy,.bc-hero-actions { position:relative; z-index:1; }
                .bc-hero-copy { max-width:760px; text-align:center; }
                .bc-hero-copy .bc-eyebrow { margin-inline:auto; }
                .bc-hero p { margin-inline:auto; }
                .bc-eyebrow { display:inline-flex; align-items:center; gap:8px; padding:7px 11px; border:1px solid rgba(255,255,255,.2); border-radius:30px; background:rgba(255,255,255,.1); color:#e5e7ff; font-size:11px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; }
                .bc-hero h1 { margin:18px 0 10px; color:#fff; font-size:clamp(27px,3vw,38px); line-height:1.15; letter-spacing:-1px; }
                .bc-hero p { max-width:560px; margin:0; color:#d9dcff; font-size:15px; line-height:1.75; }
                .bc-hero-actions { display:flex; flex-direction:row; justify-content:center; flex-wrap:wrap; gap:11px; min-width:190px; }
                .bc-hero-primary,.bc-hero-secondary { display:flex; justify-content:center; align-items:center; gap:9px; padding:13px 17px; border-radius:11px; font-weight:700; cursor:pointer; transition:transform .2s,background .2s,box-shadow .2s; }
                .bc-hero-primary { border:1px solid #fff; color:#302c91; background:#fff; box-shadow:0 8px 20px rgba(13,14,50,.16); }
                .bc-hero-secondary { border:1px solid rgba(255,255,255,.35); color:#fff; background:rgba(255,255,255,.09); }
                .bc-hero-primary:hover,.bc-hero-secondary:hover { transform:translateY(-2px); }
                .bc-section-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; }
                .bc-section-head h2 { margin:0; color:#111827; font-size:19px; letter-spacing:-.3px; }
                .bc-section-head p { margin:6px 0 0; color:#718096; font-size:13px; }
                .bc-feature-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
                .bc-feature { min-width:0; padding:22px; border:1px solid #e7eaf3; border-radius:17px; background:#fff; box-shadow:0 5px 18px rgba(15,23,42,.035); transition:transform .2s,box-shadow .2s,border-color .2s; }
                .bc-feature:hover { transform:translateY(-3px); border-color:#c9c7ff; box-shadow:0 13px 28px rgba(79,70,229,.09); }
                .bc-feature-icon { display:grid; place-items:center; width:44px; height:44px; margin-bottom:16px; border-radius:13px; color:#5146d8; background:#efedff; font-size:21px; }
                .bc-feature h3 { margin:0 0 8px; color:#172033; font-size:15px; }
                .bc-feature p { min-height:42px; margin:0; color:#718096; font-size:12.5px; line-height:1.65; }
                .bc-feature button { margin-top:17px; padding:0; border:0; color:#5146d8; background:transparent; font-size:12px; font-weight:700; cursor:pointer; }
                .bc-lower-grid { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(260px,.85fr); gap:16px; }
                .bc-panel { padding:23px; border:1px solid #e7eaf3; border-radius:17px; background:#fff; box-shadow:0 5px 18px rgba(15,23,42,.035); }
                .bc-workflow { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:20px; }
                .bc-step { padding:16px; border-radius:13px; background:#f8f9ff; }
                .bc-step-num { display:grid; place-items:center; width:27px; height:27px; margin-bottom:11px; border-radius:9px; color:#5146d8; background:#e9e7ff; font-size:12px; font-weight:800; }
                .bc-step strong { display:block; margin-bottom:5px; color:#263047; font-size:12px; }
                .bc-step span { display:block; color:#7b8498; font-size:11px; line-height:1.55; }
                .bc-guide { padding:25px; border:1px solid #e7eaf3; border-radius:18px; background:linear-gradient(135deg,#ffffff 0%,#f8f9ff 100%); box-shadow:0 5px 18px rgba(15,23,42,.035); }
                .bc-guide-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:13px; margin-top:20px; }
                .bc-guide-card { position:relative; min-width:0; padding:19px 17px; border:1px solid #e8eaf4; border-radius:14px; background:#fff; transition:transform .2s,border-color .2s,box-shadow .2s; }
                .bc-guide-card:hover { transform:translateY(-3px); border-color:#c9c7ff; box-shadow:0 10px 24px rgba(79,70,229,.08); }
                .bc-guide-top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:14px; }
                .bc-guide-number { display:grid; place-items:center; width:32px; height:32px; border-radius:10px; color:#5146d8; background:#efedff; font-size:12px; font-weight:800; }
                .bc-guide-icon { color:#8b83ed; font-size:19px; }
                .bc-guide-card h3 { margin:0 0 8px; color:#172033; font-size:14px; }
                .bc-guide-card p { min-height:66px; margin:0; color:#718096; font-size:12px; line-height:1.65; }
                .bc-guide-card button { margin-top:15px; padding:8px 0; border:0; color:#5146d8; background:transparent; font-size:12px; font-weight:750; cursor:pointer; }
                .bc-guide-tip { display:flex; align-items:flex-start; gap:11px; margin-top:17px; padding:13px 15px; border-radius:12px; color:#56518f; background:#f0efff; font-size:12px; line-height:1.6; }
                @media(max-width:900px) { .bc-guide-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
                @media(max-width:600px) { .bc-guide-grid { grid-template-columns:1fr; } .bc-guide-card p { min-height:0; } .bc-guide { padding:19px; } }
                .bc-status-row { display:flex; align-items:center; gap:12px; padding:13px 0; border-bottom:1px solid #eef0f5; }
                .bc-status-row:last-child { border-bottom:0; padding-bottom:0; }
                .bc-status-dot { width:9px; height:9px; flex-shrink:0; border-radius:50%; background:#16b981; box-shadow:0 0 0 4px #e8faf3; }
                .bc-status-row strong { display:block; color:#263047; font-size:12px; }
                .bc-status-row small { display:block; margin-top:3px; color:#8791a3; font-size:11px; }
                .bc-status-pill { margin-left:auto; padding:5px 9px; border-radius:20px; color:#087f5b; background:#e9faf3; font-size:10px; font-weight:700; white-space:nowrap; }
                @media(max-width:900px) { .bc-hero { padding:30px; } .bc-feature-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .bc-lower-grid { grid-template-columns:1fr; } }
                @media(max-width:600px) { .bc-hero { align-items:center; flex-direction:column; padding:25px 22px; } .bc-hero-actions { width:100%; flex-direction:column; } .bc-feature-grid,.bc-workflow { grid-template-columns:1fr; } .bc-feature p { min-height:0; } .bc-section-head { align-items:flex-start; flex-direction:column; } }
              `}</style>

              <section className="bc-hero">
                <div className="bc-hero-copy">
                  <span className="bc-eyebrow">✦ Your brand command centre</span>
                  <h1>Make every message<br />feel unmistakably yours.</h1>
                  <p>Bring your brand standards, AI-powered content checks and human approvals together in one clear workspace.</p>
                </div>
              </section>

              <div className="bc-section-head bc-centered-head">
                <div>
                  <h2>Your brand workspace</h2>
                  <p>Everything you need to keep content consistent and on-brand.</p>
                </div>
              </div>

              <section className="bc-feature-grid">
                <article className="bc-feature">
                  <div className="bc-feature-icon">✦</div>
                  <h3>AI Content Intelligence</h3>
                  <p>Analyse marketing copy against your approved standards and surface specific issues with suggested corrections.</p>
                </article>
                <article className="bc-feature">
                  <div className="bc-feature-icon">◈</div>
                  <h3>Brand Rule Library</h3>
                  <p>Create brand rules manually or extract them from a PDF, then review and manage your approved standards.</p>
                </article>
                <article className="bc-feature">
                  <div className="bc-feature-icon">✓</div>
                  <h3>Human Review</h3>
                  <p>Keep people in control with a dedicated queue to approve or reject AI findings and record reviewer comments.</p>
                </article>
              </section>


              <section className="bc-guide">
                <div className="bc-section-head bc-centered-head">
                  <div>
                    <h2>How to use BrandCue AI</h2>
                    <p>Follow these four steps to check content and keep your brand consistent.</p>
                  </div>
                  <span className="bc-status-pill">Quick start guide</span>
                </div>

                <div className="bc-guide-grid">
                  <article className="bc-guide-card">
                    <div className="bc-guide-top"><span className="bc-guide-number">01</span><span className="bc-guide-icon">◈</span></div>
                    <h3>Set up your brand rules</h3>
                    <p>Open Brand Guidelines. Add rules manually or upload a brand guideline PDF and review the AI-extracted rules before saving.</p>
                    <button type="button" onClick={() => handleNavigation("Brand Guidelines")}>Set up guidelines →</button>
                  </article>

                  <article className="bc-guide-card">
                    <div className="bc-guide-top"><span className="bc-guide-number">02</span><span className="bc-guide-icon">✦</span></div>
                    <h3>Submit content for analysis</h3>
                    <p>Open Content Checker, enter a title, choose the content type, paste your draft and select Submit & Analyse with AI.</p>
                    <button type="button" onClick={() => setActivePage("Content Checker")}>Check content →</button>
                  </article>

                  <article className="bc-guide-card">
                    <div className="bc-guide-top"><span className="bc-guide-number">03</span><span className="bc-guide-icon">◎</span></div>
                    <h3>Understand the AI report</h3>
                    <p>Review the compliance score, detected violations, explanations and suggested corrections. Copy the corrected draft if useful.</p>
                    <button type="button" onClick={() => setActivePage("Content Checker")}>View checker →</button>
                  </article>

                  <article className="bc-guide-card">
                    <div className="bc-guide-top"><span className="bc-guide-number">04</span><span className="bc-guide-icon">✓</span></div>
                    <h3>Complete human review</h3>
                    <p>Open Review Queue, read the findings, add reviewer comments and approve or reject the submission. Check past decisions in History.</p>
                    <button type="button" onClick={() => handleNavigation("Review Queue")}>Open review queue →</button>
                  </article>
                </div>

                <div className="bc-guide-tip">
                  <strong>Important</strong>
                  <span>AI results are recommendations, not final approval. A human reviewer should verify the content and make the final decision.</span>
                </div>
              </section>

              <section className="bc-lower-grid">
                <div className="bc-panel">
                  <div className="bc-section-head bc-centered-head">
                    <div>
                      <h2>A simple, controlled workflow</h2>
                      <p>From first draft to human decision.</p>
                    </div>
                  </div>
                  <div className="bc-workflow">
                    <div className="bc-step"><div className="bc-step-num">01</div><strong>Set your standards</strong><span>Build your brand rule library or import rules from a PDF.</span></div>
                    <div className="bc-step"><div className="bc-step-num">02</div><strong>Check with AI</strong><span>Submit content and review detected issues and suggested improvements.</span></div>
                    <div className="bc-step"><div className="bc-step-num">03</div><strong>Approve with confidence</strong><span>A human reviewer makes the final approval decision.</span></div>
                  </div>
                </div>

                <div className="bc-panel">
                  <h2 style={{margin:"0 0 5px",fontSize:"17px",color:"#172033"}}>Workspace status</h2>
                  <p style={{margin:0,color:"#718096",fontSize:"12px"}}>Core BrandCue services</p>
                  <div style={{marginTop:"13px"}}>
                    <div className="bc-status-row"><span className="bc-status-dot"/><div><strong>AI content analysis</strong><small>Groq-powered analysis workflow</small></div><span className="bc-status-pill">Available</span></div>
                    <div className="bc-status-row"><span className="bc-status-dot"/><div><strong>Brand guidelines</strong><small>Rule creation and PDF extraction</small></div><span className="bc-status-pill">Available</span></div>
                    <div className="bc-status-row"><span className="bc-status-dot"/><div><strong>Human approvals</strong><small>Review and decision workflow</small></div><span className="bc-status-pill">Available</span></div>
                  </div>
                  <button className="text-button" style={{marginTop:"18px"}} onClick={() => handleNavigation("History")}>View activity history →</button>
                </div>
              </section>
            </div>
          )}

          {/* ================================= */}
          {/* CONTENT CHECKER */}
          {/* ================================= */}

          {activePage === "Content Checker" && (
            <div className="checker-container bc-page bc-checker-page">

              <div className="bc-page-header bc-page-header-centered">
                <div>
                  <span className="bc-page-kicker">✦ AI-powered brand review</span>
                  <h1>Content Compliance Checker</h1>

                  <p>
                    Analyse your content against approved brand guidelines.
                  </p>
                </div>
              </div>

              <form
                className="content-card checker-form bc-form-card"
                onSubmit={handleSubmit}
              >
                <div className="form-heading">
                  <h2>Submit Your Content</h2>
                  <p>Enter the content you want to check.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="contentTitle">
                    Content Title
                  </label>

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

                <div className="form-group">
                  <label htmlFor="contentType">
                    Content Type
                  </label>

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

                <div className="form-group">
                  <label htmlFor="content">
                    Content to Analyse
                  </label>

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
                      fontSize: "13px"
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
                      color: "#c0392b"
                    }}
                  >
                    <strong>AI Analysis Unavailable</strong>

                    <p style={{ marginTop: "8px" }}>
                      {analysisError}
                    </p>

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
                      {isAnalyzing
                        ? "Retrying..."
                        : "↻ Retry AI Analysis"}
                    </button>
                  </div>
                )}
              </form>

              {/* AI ANALYSIS RESULTS */}
              {analysis && (
                <div
                  ref={analysisResultRef}
                  className="content-card bc-analysis-result"
                  style={{
                    marginTop: "25px",
                    scrollMarginTop: "25px"
                  }}
                >
                  <div className="section-heading bc-analysis-heading">
                    <div>
                      <h2>✦ BrandCue AI Analysis</h2>
                      <p>Submission #{analysis.submission_id}</p>
                    </div>

                    <span
                      className={`bc-analysis-status ${analysis.overall_status === "compliant" ? "is-compliant" : "is-review"}`}
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
                            : "#c56b16"
                      }}
                    >
                      {analysis.overall_status === "compliant"
                        ? "✓ Compliant"
                        : "⚠ Needs Review"}
                    </span>
                  </div>

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
                      background: "#ffffff"
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
                        marginTop: "18px"
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
                            margin: 0
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

                    <div
                      style={{
                        width: "100%",
                        height: "12px",
                        background: "#e2e8f0",
                        borderRadius: "20px",
                        marginTop: "20px",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              Number(analysis.compliance_score) || 0
                            )
                          )}%`,
                          height: "100%",
                          background:
                            analysis.compliance_score >= 80
                              ? "#16a34a"
                              : analysis.compliance_score >= 50
                              ? "#f59e0b"
                              : "#dc2626",
                          borderRadius: "20px",
                          transition: "width 0.5s ease"
                        }}
                      />
                    </div>

                    <p
                      style={{
                        marginTop: "12px",
                        color: "#64748b",
                        fontSize: "13px"
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
                            background: "#fffafa"
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
                        whiteSpace: "pre-wrap"
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
                      color: "#805d16"
                    }}
                  >
                    <strong>Human Approval Required</strong>

                    <p style={{ marginTop: "6px" }}>
                      AI analysis is advisory. A human reviewer must make
                      the final approval decision.
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
            <div className="checker-container bc-page bc-review-page">

              <div className="bc-page-header bc-page-header-centered">
                <div>
                  <span className="bc-page-kicker">✓ Human-in-the-loop governance</span>
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
                  {isLoadingReviews
                    ? "Refreshing..."
                    : "↻ Refresh Queue"}
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
                  <div className="bc-empty-icon">✓</div>
                  <span className="bc-page-kicker">Queue status · Clear</span>
                  <h2>You're all caught up</h2>
                  <p className="empty-state">
                    There are no submissions waiting for review right now. New items will appear here after AI analysis.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bc-review-summary">
                    <div className="bc-review-summary-icon">☷</div>
                    <div><strong>{reviewItems.length} Pending {reviewItems.length === 1 ? "Review" : "Reviews"}</strong><small>Each submission requires a human decision before it is finalised.</small></div>
                  </div>

                  {reviewItems.map((item) => (
                    <div
                      className="content-card bc-review-card"
                      key={item.submission_id}
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
                          className="bc-review-status"
                          style={{
                            background: "#fff0e0",
                            color: "#c56b16",
                            padding: "8px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          Needs Review
                        </span>
                      </div>

                      <div style={{ marginTop: "20px" }}>
                        <h3>Submitted Content</h3>

                        <div
                          style={{
                            background: "#f7f8fc",
                            padding: "16px",
                            borderRadius: "8px",
                            marginTop: "10px",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.7"
                          }}
                        >
                          {item.content}
                        </div>
                      </div>

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
                                borderRadius: "8px"
                              }}
                            >
                              <h4>{violation.rule}</h4>

                              <p style={{ marginTop: "8px" }}>
                                <strong>Problem:</strong>{" "}
                                {violation.problem}
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
                              [item.submission_id]: e.target.value
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
                            fontFamily: "inherit"
                          }}
                          disabled={reviewingId === item.submission_id}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "18px",
                          flexWrap: "wrap"
                        }}
                      >
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            handleHumanReview(
                              item.submission_id,
                              "approved"
                            )
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
                            handleHumanReview(
                              item.submission_id,
                              "rejected"
                            )
                          }
                          disabled={reviewingId === item.submission_id}
                          style={{
                            padding: "12px 20px",
                            background: "#fff0f0",
                            color: "#c0392b",
                            border: "1px solid #e5baba",
                            borderRadius: "8px",
                            cursor: "pointer"
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
          {/* BRAND GUIDELINES */}
          {/* ================================= */}

          {activePage === "Brand Guidelines" && (
            <div className="content-card brand-guidelines-page">

              {/* BRAND GUIDELINES HEADER */}
              <div
  ref={brandGuidelinesTopRef}
  style={{ marginBottom: "28px", scrollMarginTop: "20px" }}
>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                  }}
                >
                  <div
                    style={{
                      width: "58px",
                      height: "58px",
                      flexShrink: 0,
                      borderRadius: "14px",
                      background: "#ede9fe",
                      color: "#4f46e5",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "28px"
                    }}
                  >
                    ◈
                  </div>

                  <div>
                    <h2 style={{ fontSize: "26px", margin: 0 }}>
                      Brand Guidelines
                    </h2>

                    <p style={{ color: "#64748b", marginTop: "6px" }}>
                      One workspace for your brand standards, content rules and governance.
                    </p>
                  </div>
                </div>

                {/* SECTION NAVIGATION BUTTONS */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                    marginTop: "28px"
                  }}
                >
                  {/* AI GUIDELINE EXTRACTOR */}
                  <button
                    type="button"
                    onClick={() => scrollToSection(pdfSectionRef)}
                    className="bc-guideline-nav-button is-primary"
                    style={{
                      padding: "15px",
                      border: "none",
                      borderRadius: "10px",
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    ✦ AI Guideline Extractor
                  </button>

                  {/* CREATE NEW GUIDELINE */}
                  <button
                    type="button"
                    onClick={() => scrollToSection(addGuidelineRef)}
                    className="bc-guideline-nav-button"
                    style={{
                      padding: "15px",
                      border: "1px solid #c7d2fe",
                      borderRadius: "10px",
                      background: "#ffffff",
                      color: "#3730a3",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    + Create a Brand Rule
                  </button>

                  {/* MANAGE BRAND RULES */}
                  <button
                    type="button"
                    onClick={() => scrollToSection(existingGuidelinesRef)}
                    className="bc-guideline-nav-button"
                    style={{
                      padding: "15px",
                      border: "1px solid #c7d2fe",
                      borderRadius: "10px",
                      background: "#ffffff",
                      color: "#3730a3",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    ▤ Guideline Library
                  </button>
                </div>
              </div>

              {/* ================================= */}
              {/* PDF GUIDELINE EXTRACTION */}
              {/* ================================= */}

              <div ref={pdfSectionRef} className="bc-pdf-card" style={{ scrollMarginTop: "25px" }}>
                <div className="bc-pdf-icon" aria-hidden="true">✦</div>
                <h3>Extract brand rules from a PDF</h3>
                <p>Save time by letting AI identify your brand standards. Review the extracted rules before adding them to your library.</p>

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
                  className="bc-pdf-upload"
                />

                {/* SELECTED PDF */}
                {pdfFile && (
                  <div
                    role="status"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "16px",
                      marginTop: "15px",
                      marginBottom: "18px",
                      background: "#ecfdf5",
                      border: "1px solid #86efac",
                      borderRadius: "10px"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "30px",
                        background: "#dcfce7",
                        padding: "10px",
                        borderRadius: "8px"
                      }}
                    >
                      📄
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          color: "#166534",
                          fontWeight: "700",
                          fontSize: "14px",
                          margin: "0 0 5px"
                        }}
                      >
                        ✓ PDF FILE SELECTED SUCCESSFULLY
                      </p>

                      <p
                        style={{
                          color: "#14532d",
                          fontWeight: "600",
                          fontSize: "13px",
                          margin: 0,
                          overflowWrap: "anywhere"
                        }}
                      >
                        {pdfFile.name}
                      </p>

                      <p
                        style={{
                          color: "#15803d",
                          fontSize: "12px",
                          margin: "5px 0 0"
                        }}
                      >
                        Your file is ready for AI guideline extraction.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExtractPdf}
                  disabled={
                    !pdfFile ||
                    isExtractingPdf ||
                    isSavingExtracted
                  }
                  className="bc-pdf-action"
                  style={{
                    padding: "12px 20px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#4f46e5",
                    color: "#ffffff",
                    fontWeight: "600",
                    cursor:
                      !pdfFile || isExtractingPdf || isSavingExtracted
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      !pdfFile || isExtractingPdf || isSavingExtracted
                        ? 0.6
                        : 1
                  }}
                >
                  {isExtractingPdf
                    ? "✦ Extracting..."
                    : "✦ Extract Guidelines"}
                </button>

                {pdfError && (
                  <p
                    role="alert"
                    style={{
                      color: "#dc2626",
                      marginTop: "14px"
                    }}
                  >
                    {pdfError}
                  </p>
                )}

                {pdfSuccess && (
                  <p
                    role="status"
                    style={{
                      color: "#15803d",
                      marginTop: "14px"
                    }}
                  >
                    {pdfSuccess}
                  </p>
                )}

                {/* REVIEW EXTRACTED GUIDELINES */}
                {extractedGuidelines.length > 0 && (
                  <div
                    ref={extractedGuidelinesRef}
                    style={{
                      marginTop: "25px",
                      scrollMarginTop: "25px"
                    }}
                  >
                    <h3>Review Extracted Guidelines</h3>

                    <p
                      style={{
                        color: "#64748b",
                        marginTop: "6px"
                      }}
                    >
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
                            onClick={() =>
                              handleRemoveExtractedGuideline(index)
                            }
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
                            extractedGuidelines.filter(
                              (item) => item.selected
                            ).length
                          })`}
                    </button>
                  </div>
                )}
              </div>

              {/* ================================= */}
              {/* ADD NEW GUIDELINE FORM */}
              {/* ================================= */}

              <div
                ref={addGuidelineRef}
                className="bc-create-rule-card"
                style={{
                  scrollMarginTop: "25px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "24px",
                  marginBottom: "28px"
                }}
              >
                <h3 style={{ marginBottom: "8px" }}>
                  + Create a Brand Rule
                </h3>

                <p
                  style={{
                    color: "#64748b",
                    marginBottom: "22px"
                  }}
                >
                  Manually create a brand rule with its category,
                  rule and description.
                </p>

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
                        boxSizing: "border-box",
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
                        boxSizing: "border-box",
                        padding: "12px",
                        marginTop: "8px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        background: "#ffffff",
                        color: "#0f172a"
                      }}
                    >
                      <option value="">Select a category</option>
                      <option value="Marketing Claims">
                        Marketing Claims
                      </option>
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
                        boxSizing: "border-box",
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
                        boxSizing: "border-box",
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
                    <p
                      role="alert"
                      style={{
                        color: "#dc2626",
                        marginBottom: "12px"
                      }}
                    >
                      {guidelineError}
                    </p>
                  )}

                  {guidelineSuccess && (
                    <p
                      role="status"
                      style={{
                        color: "#15803d",
                        marginBottom: "12px"
                      }}
                    >
                      {guidelineSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSavingGuideline}
                    style={{
                      padding: "12px 22px",
                      borderRadius: "8px"
                    }}
                  >
                    {isSavingGuideline
                      ? "Saving..."
                      : "Save Guideline"}
                  </button>
                </form>
              </div>

              {/* ================================= */}
              {/* EXISTING BRAND RULES */}
              {/* ================================= */}

              <div
                ref={existingGuidelinesRef}
                className="bc-library-section"
                style={{ scrollMarginTop: "25px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "18px"
                  }}
                >
                  <div className="bc-library-heading" style={{ width: "100%", textAlign: "center" }}>
                    <span className="bc-library-kicker">◈ APPROVED BRAND STANDARDS</span>
                    <h3 style={{ textAlign: "center", margin: 0 }}>
                      Your Brand Rule Library <span className="bc-library-count">{guidelines.length}</span>
                    </h3>

                    <p
                      style={{
                        color: "#64748b",
                        marginTop: "7px",
                        textAlign: "center"
                      }}
                    >
                      Your approved standards, organised in one place.
                    </p>
                  </div>
                </div>

                {isLoadingGuidelines && (
                  <p className="empty-state">
                    Loading guidelines...
                  </p>
                )}

                {guidelineError && (
                  <p
                    role="alert"
                    style={{
                      color: "#dc2626",
                      marginBottom: "12px"
                    }}
                  >
                    {guidelineError}
                  </p>
                )}

                {!isLoadingGuidelines &&
                  guidelines.length === 0 && (
                    <p className="empty-state">
                      No brand guidelines available yet.
                    </p>
                  )}

                {!isLoadingGuidelines &&
                  guidelines.map((item) => (
                    <div
                      key={item.id}
                      className="bc-guideline-card"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "14px",
                        background: "#ffffff"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap"
                        }}
                      >
                        <h3>{item.title}</h3>

                        <span
                          className="bc-guideline-category"
                          style={{
                            background: "#e0e7ff",
                            color: "#3730a3",
                            padding: "5px 10px",
                            borderRadius: "20px",
                            fontSize: "12px"
                          }}
                        >
                          {item.category}
                        </span>
                      </div>

                      <p
                        className="bc-guideline-rule"
                        style={{
                          color: "#334155",
                          marginTop: "12px",
                          lineHeight: "1.6"
                        }}
                      >
                        <strong>Rule:</strong> {item.rule}
                      </p>

                      {item.description && (
                        <p
                          className="bc-guideline-description"
                          style={{
                            color: "#64748b",
                            marginTop: "8px",
                            lineHeight: "1.6"
                          }}
                        >
                          {item.description}
                        </p>
                      )}

                      <p
                        className="bc-guideline-status"
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          marginTop: "12px"
                        }}
                      >
                        Status: {item.status || "Active"}
                      </p>
                    </div>
                  ))}

                {/* BOTTOM CREATE GUIDELINE SHORTCUT */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "30px",
                    paddingTop: "22px",
                    borderTop: "1px solid #e2e8f0"
                  }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => scrollToSection(brandGuidelinesTopRef)}
                    style={{
                      padding: "13px 24px",
                      borderRadius: "9px",
                      fontWeight: "600"
                    }}
                  >
                    ↑ Back to Brand Guidelines
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================= */}
          {/* SUBMISSION HISTORY */}
          {/* ================================= */}

          {activePage === "History" && (
            <div className="content-card bc-page bc-history-shell">

              <div className="bc-page-header bc-page-header-centered">
                <div>
                  <span className="bc-page-kicker">◷ Activity & decisions</span>
                  <h2>Submission History</h2>

                  <p
                    style={{
                      color: "#64748b",
                      marginTop: "6px"
                    }}
                  >
                    Track submitted content, AI analysis, and human review
                    decisions.
                  </p>
                </div>

                <button
                  className="primary-button"
                  type="button"
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                >
                  {isLoadingHistory ? "Refreshing..." : "↻ Refresh History"}
                </button>
              </div>

              {isLoadingHistory && (
                <p className="empty-state">
                  Loading submission history...
                </p>
              )}

              {historyError && (
                <p
                  style={{
                    color: "#dc2626",
                    padding: "12px"
                  }}
                >
                  {historyError}
                </p>
              )}

              {!isLoadingHistory &&
                !historyError &&
                historyItems.length === 0 && (
                  <div className="bc-history-empty">
                    No submissions have been recorded yet. Once you analyse content, its AI findings and human review decisions will appear here.
                  </div>
                )}

              {!isLoadingHistory && historyItems.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px"
                  }}
                >
                  {historyItems.map((item) => (
                    <div
                      key={item.submission_id}
                      className="bc-history-item"
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "20px",
                        background: "#ffffff"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          flexWrap: "wrap"
                        }}
                      >
                        <div>
                          <h3 style={{ margin: "0 0 8px 0" }}>
                            {item.title}
                          </h3>

                          <p
                            style={{
                              color: "#64748b",
                              fontSize: "13px",
                              margin: 0
                            }}
                          >
                            Submission #{item.submission_id} ·{" "}
                            {item.content_type}
                          </p>
                        </div>

                        <span
                          className={`bc-history-status status-${(item.status || "pending").replace(/\s+/g, "-").toLowerCase()}`}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            background:
                              item.status === "approved"
                                ? "#dcfce7"
                                : item.status === "rejected"
                                ? "#fee2e2"
                                : "#fef3c7",
                            color:
                              item.status === "approved"
                                ? "#166534"
                                : item.status === "rejected"
                                ? "#991b1b"
                                : "#92400e",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                        >
                          {(item.status || "pending")
                            .replace("_", " ")
                            .toUpperCase()}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "18px",
                          padding: "14px",
                          background: "#f8fafc",
                          borderRadius: "8px"
                        }}
                      >
                        <strong>Submitted Content</strong>

                        <p
                          style={{
                            color: "#475569",
                            whiteSpace: "pre-wrap",
                            marginBottom: 0
                          }}
                        >
                          {item.content}
                        </p>
                      </div>

                      <div style={{ marginTop: "18px" }}>
                        <strong>AI Analysis</strong>

                        <p style={{ color: "#475569" }}>
                          Status: {item.ai_status || "Not analyzed"}
                        </p>

                        <p
                          style={{
                            fontWeight: "600",
                            marginBottom: "6px"
                          }}
                        >
                          Detected Violations
                        </p>

                        {item.violations?.length > 0 ? (
                          <ul>
                            {item.violations.map((violation, index) => (
                              <li
                                key={index}
                                style={{ color: "#b91c1c" }}
                              >
                                {typeof violation === "string"
                                  ? violation
                                  : violation.description ||
                                    violation.rule ||
                                    JSON.stringify(violation)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ color: "#64748b" }}>
                            No violations recorded.
                          </p>
                        )}

                        <p
                          style={{
                            fontWeight: "600",
                            marginBottom: "6px"
                          }}
                        >
                          AI Suggestions
                        </p>

                        {item.suggestions?.length > 0 ? (
                          <ul>
                            {item.suggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                style={{ color: "#475569" }}
                              >
                                {typeof suggestion === "string"
                                  ? suggestion
                                  : suggestion.description ||
                                    suggestion.suggestion ||
                                    JSON.stringify(suggestion)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ color: "#64748b" }}>
                            No suggestions recorded.
                          </p>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: "18px",
                          borderTop: "1px solid #e2e8f0",
                          paddingTop: "14px"
                        }}
                      >
                        <strong>Human Review</strong>

                        <p style={{ color: "#475569" }}>
                          Decision:{" "}
                          {item.reviewer_decision || "Not reviewed"}
                        </p>

                        {item.reviewer_comment && (
                          <p style={{ color: "#475569" }}>
                            Reviewer Comment: {item.reviewer_comment}
                          </p>
                        )}

                        {item.reviewed_at && (
                          <p
                            style={{
                              color: "#64748b",
                              fontSize: "13px"
                            }}
                          >
                            Reviewed:{" "}
                            {new Date(item.reviewed_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          marginTop: "16px",
                          marginBottom: 0
                        }}
                      >
                        Submitted:{" "}
                        {new Date(item.created_at).toLocaleString()}
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
