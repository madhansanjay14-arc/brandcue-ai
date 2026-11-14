import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

from database import get_connection, init_db
from ai_service import analyze_content


# ==========================================
# 1. INITIALIZE DATABASE
# ==========================================

init_db()


# ==========================================
# 2. CREATE FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="BrandCue AI",
    description="AI-powered Brand Compliance Platform",
    version="1.0.0"
)


# ==========================================
# 3. CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://brandcue-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 4. REQUEST MODELS
# ==========================================

class GuidelineCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=100)
    rule: str = Field(min_length=1)
    description: str = ""


class ContentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    content_type: str
    content: str = Field(min_length=1, max_length=10000)


class ReviewCreate(BaseModel):
    decision: Literal["approved", "rejected"]
    reviewer_comment: str = ""


# ==========================================
# 5. SUBMIT CONTENT
# ==========================================

@app.post("/submissions")
def create_submission(submission: ContentCreate):

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO content_submissions
            (title, content_type, content)
            VALUES (?, ?, ?)
            """,
            (
                submission.title,
                submission.content_type,
                submission.content
            )
        )

        connection.commit()

        return {
            "message": "Content submitted successfully",
            "submission_id": cursor.lastrowid,
            "status": "pending"
        }

    finally:
        connection.close()


# ==========================================
# 6. GET ALL SUBMISSIONS
# ==========================================

@app.get("/submissions")
def get_submissions():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT * FROM content_submissions
            ORDER BY id DESC
            """
        )

        submissions = [
            dict(row) for row in cursor.fetchall()
        ]

        return {
            "total": len(submissions),
            "submissions": submissions
        }

    finally:
        connection.close()


# ==========================================
# 7. ADD BRAND GUIDELINE
# ==========================================

@app.post("/guidelines")
def add_guideline(guideline: GuidelineCreate):

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO brand_guidelines
            (title, category, rule, description)
            VALUES (?, ?, ?, ?)
            """,
            (
                guideline.title,
                guideline.category,
                guideline.rule,
                guideline.description
            )
        )

        connection.commit()

        return {
            "message": "Brand guideline added successfully",
            "id": cursor.lastrowid
        }

    finally:
        connection.close()


# ==========================================
# 8. GET ACTIVE BRAND GUIDELINES
# ==========================================

@app.get("/guidelines")
def get_guidelines():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT * FROM brand_guidelines
            WHERE status = 'active'
            ORDER BY id DESC
            """
        )

        guidelines = [
            dict(row) for row in cursor.fetchall()
        ]

        return {
            "total": len(guidelines),
            "guidelines": guidelines
        }

    finally:
        connection.close()


# ==========================================
# 9. AI CONTENT ANALYSIS + COMPLIANCE SCORE
# ==========================================

@app.post("/analyze/{submission_id}")
def analyze_submission(submission_id: int):

    connection = get_connection()

    try:
        cursor = connection.cursor()

        # Retrieve submitted content
        cursor.execute(
            """
            SELECT * FROM content_submissions
            WHERE id = ?
            """,
            (submission_id,)
        )

        submission = cursor.fetchone()

        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )

        submission = dict(submission)

        # Retrieve active brand guidelines
        cursor.execute(
            """
            SELECT * FROM brand_guidelines
            WHERE status = 'active'
            """
        )

        guidelines = [
            dict(row) for row in cursor.fetchall()
        ]

        if not guidelines:
            raise HTTPException(
                status_code=400,
                detail="No active brand guidelines available."
            )

        # Send content and guidelines to the AI service
        try:
            result = analyze_content(
                submission["content"],
                guidelines
            )

        except Exception as error:
            print("AI analysis error:", error)

            raise HTTPException(
                status_code=503,
                detail="AI service is temporarily unavailable. Please try again."
            )

        # Prepare database values
        violations = result.get("violations", [])

        suggestions = [
            item.get("suggestion", "")
            for item in violations
        ]

        overall_status = result.get(
            "overall_status",
            "needs_review"
        )

        # ==========================================
        # CALCULATE BRAND COMPLIANCE SCORE
        # ==========================================

        total_guidelines = len(guidelines)

        # ai_service validates that each violation's "rule"
        # matches an approved guideline title.
        guideline_titles = {
            str(guideline.get("title", "")).strip().casefold()
            for guideline in guidelines
        }

        violated_guideline_titles = {
            str(item.get("rule", "")).strip().casefold()
            for item in violations
            if str(item.get("rule", "")).strip().casefold()
            in guideline_titles
        }

        violated_guidelines = len(violated_guideline_titles)
        passed_guidelines = max(
            total_guidelines - violated_guidelines,
            0
        )

        compliance_score = round(
            (passed_guidelines / total_guidelines) * 100,
            1
        )

        # Save AI analysis
        cursor.execute(
            """
            INSERT INTO analysis_results
            (
                submission_id,
                violations,
                suggestions,
                overall_status
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                submission_id,
                json.dumps(violations),
                json.dumps(suggestions),
                overall_status
            )
        )

        # Update submission status
        cursor.execute(
            """
            UPDATE content_submissions
            SET status = ?
            WHERE id = ?
            """,
            (
                "needs_review",
                submission_id
            )
        )

        connection.commit()

        return {
            "message": "AI analysis completed successfully",
            "submission_id": submission_id,
            "overall_status": overall_status,
            "summary": result.get("summary", ""),
            "total_guidelines": total_guidelines,
            "passed_guidelines": passed_guidelines,
            "violated_guidelines": violated_guidelines,
            "compliance_score": compliance_score,
            "violations": violations,
            "suggestions": suggestions,
            "corrected_content": result.get(
                "corrected_content", ""
            ),
            "human_approval_required": True
        }

    finally:
        connection.close()


# ==========================================
# 10. HOMEPAGE
# ==========================================

@app.get("/")
def home():

    return {
        "message": "Welcome to BrandCue AI Backend!",
        "status": "Running"
    }


# ==========================================
# 11. HEALTH CHECK
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "application": "BrandCue AI"
    }


# ==========================================
# 12. GET SUBMISSIONS AWAITING HUMAN REVIEW
# ==========================================

@app.get("/reviews")
def get_review_queue():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                s.id AS submission_id,
                s.title,
                s.content_type,
                s.content,
                s.status,
                s.created_at,
                a.violations,
                a.suggestions,
                a.overall_status
            FROM content_submissions s
            LEFT JOIN analysis_results a
                ON a.id = (
                    SELECT MAX(a2.id)
                    FROM analysis_results a2
                    WHERE a2.submission_id = s.id
                )
            WHERE s.status = 'needs_review'
            ORDER BY s.created_at DESC
        """)

        reviews = []

        for row in cursor.fetchall():
            item = dict(row)

            item["violations"] = json.loads(
                item["violations"] or "[]"
            )

            item["suggestions"] = json.loads(
                item["suggestions"] or "[]"
            )

            reviews.append(item)

        return {
            "total": len(reviews),
            "reviews": reviews
        }

    finally:
        connection.close()


# ==========================================
# 13. APPROVE OR REJECT SUBMISSION
# ==========================================

@app.post("/reviews/{submission_id}")
def submit_human_review(
    submission_id: int,
    review: ReviewCreate
):

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id, status
            FROM content_submissions
            WHERE id = ?
        """, (submission_id,))

        submission = cursor.fetchone()

        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )

        if submission["status"] != "needs_review":
            raise HTTPException(
                status_code=400,
                detail="Submission is not awaiting human review"
            )

        cursor.execute("""
            INSERT INTO reviews (
                submission_id,
                decision,
                reviewer_comment
            )
            VALUES (?, ?, ?)
        """, (
            submission_id,
            review.decision,
            review.reviewer_comment
        ))

        cursor.execute("""
            UPDATE content_submissions
            SET status = ?
            WHERE id = ?
        """, (
            review.decision,
            submission_id
        ))

        connection.commit()

        return {
            "message": f"Submission {review.decision} successfully",
            "submission_id": submission_id,
            "decision": review.decision,
            "reviewer_comment": review.reviewer_comment
        }

    finally:
        connection.close()


# ==========================================
# 14. GET SUBMISSION HISTORY
# ==========================================

@app.get("/history")
def get_submission_history():

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                s.id AS submission_id,
                s.title,
                s.content_type,
                s.content,
                s.status,
                s.created_at,
                a.overall_status AS ai_status,
                a.violations,
                a.suggestions,
                r.decision AS reviewer_decision,
                r.reviewer_comment,
                r.reviewed_at
            FROM content_submissions s

            LEFT JOIN analysis_results a
                ON a.id = (
                    SELECT MAX(a2.id)
                    FROM analysis_results a2
                    WHERE a2.submission_id = s.id
                )

            LEFT JOIN reviews r
                ON r.id = (
                    SELECT MAX(r2.id)
                    FROM reviews r2
                    WHERE r2.submission_id = s.id
                )

            ORDER BY s.id DESC
        """)

        history = []

        for row in cursor.fetchall():
            item = dict(row)

            item["violations"] = json.loads(
                item["violations"] or "[]"
            )

            item["suggestions"] = json.loads(
                item["suggestions"] or "[]"
            )

            history.append(item)

        return {
            "total": len(history),
            "history": history
        }

    finally:
        connection.close()
