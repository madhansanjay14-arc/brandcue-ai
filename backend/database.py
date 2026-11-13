import sqlite3
from pathlib import Path

# Database file location
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "brandcue.db"


# Connect to SQLite database
def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


# Create database tables
def init_db():

    connection = get_connection()
    cursor = connection.cursor()

    # 1. Brand Guidelines
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brand_guidelines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            rule TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Content Submissions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content_type TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 3. Analysis Results
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_id INTEGER NOT NULL,
            violations TEXT,
            suggestions TEXT,
            overall_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (submission_id)
                REFERENCES content_submissions(id)
        )
    """)

    # 4. Human Reviews
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_id INTEGER NOT NULL,
            decision TEXT NOT NULL,
            reviewer_comment TEXT,
            reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (submission_id)
                REFERENCES content_submissions(id)
        )
    """)

    connection.commit()
    connection.close()

    print("BrandCue AI database initialized successfully!")


if __name__ == "__main__":
    init_db()