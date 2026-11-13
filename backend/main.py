from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection, init_db


# Initialize database
init_db()


# Create FastAPI application
app = FastAPI(
    title="BrandCue AI",
    description="AI-powered Brand Compliance Platform",
    version="1.0.0"
)


# Allow React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request model
class GuidelineCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    category: str = Field(min_length=1, max_length=100)
    rule: str = Field(min_length=1)
    description: str = ""

# Content submission request model
class ContentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    content_type: str
    content: str = Field(min_length=1, max_length=10000)


# Submit new content
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

        submission_id = cursor.lastrowid

        return {
            "message": "Content submitted successfully",
            "submission_id": submission_id,
            "status": "pending"
        }

    finally:
        connection.close()


# Retrieve submitted content
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

# Homepage API
@app.get("/")
def home():
    return {
        "message": "Welcome to BrandCue AI Backend!",
        "status": "Running"
    }


# Health API
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "BrandCue AI"
    }


# Add brand guideline
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

        guideline_id = cursor.lastrowid

        return {
            "message": "Brand guideline added successfully",
            "id": guideline_id
        }

    finally:
        connection.close()


# Retrieve all brand guidelines
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

        guidelines = [dict(row) for row in cursor.fetchall()]

        return {
            "total": len(guidelines),
            "guidelines": guidelines
        }

    finally:
        connection.close()