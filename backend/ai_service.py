import os
import json
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


# ==========================================
# 1. LOAD ENVIRONMENT VARIABLES
# ==========================================

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY not found. Check your backend/.env file."
    )


# ==========================================
# 2. GROQ CLIENT CONFIGURATION
# ==========================================

client = Groq(
    api_key=API_KEY,
    timeout=30.0,
    max_retries=1
)

MODEL_NAME = "openai/gpt-oss-120b"


# ==========================================
# 3. VALIDATE AI RESPONSE
# ==========================================

def validate_result(result, guidelines):
    """
    Validate AI output against approved brand guidelines.
    """

    required_fields = [
        "overall_status",
        "summary",
        "violations",
        "corrected_content"
    ]

    for field in required_fields:
        if field not in result:
            raise ValueError(
                f"Missing field in AI response: {field}"
            )

    if result["overall_status"] not in [
        "compliant",
        "needs_review"
    ]:
        raise ValueError("Invalid overall status.")

    if not isinstance(result["violations"], list):
        raise ValueError("Violations must be a list.")

    approved_titles = {
        item["title"].strip().casefold()
        for item in guidelines
    }

    for violation in result["violations"]:

        if not isinstance(violation, dict):
            raise ValueError("Each violation must be an object.")

        for field in ["rule", "problem", "suggestion"]:

            if field not in violation:
                raise ValueError(
                    f"Missing '{field}' in violation."
                )

            if not isinstance(violation[field], str):
                raise ValueError(
                    f"'{field}' must be a string."
                )

            if not violation[field].strip():
                raise ValueError(
                    f"'{field}' cannot be empty."
                )

        violation_title = violation["rule"].strip().casefold()

        if violation_title not in approved_titles:
            raise ValueError(
                "AI referenced an unapproved guideline: "
                f"{violation['rule']}"
            )

    expected_status = (
        "needs_review"
        if result["violations"]
        else "compliant"
    )

    if result["overall_status"] != expected_status:
        raise ValueError(
            "AI status does not match detected violations."
        )

    result["human_approval_required"] = True

    return result


# ==========================================
# 4. AI CONTENT ANALYSIS
# ==========================================

def analyze_content(content, guidelines):
    """
    Analyze submitted content against approved brand guidelines.
    """

    if not content or not content.strip():
        raise ValueError("Submitted content cannot be empty.")

    if not guidelines:
        raise ValueError(
            "No approved brand guidelines were provided."
        )

    # Format guidelines for AI
    formatted_guidelines = json.dumps(
        guidelines,
        indent=2,
        ensure_ascii=False
    )

    # ======================================
    # SYSTEM PROMPT
    # ======================================

    system_prompt = """
You are BrandCue AI, an expert brand compliance assistant.

Your task is to analyze submitted content ONLY against
the approved brand guidelines supplied by the application.

STRICT RULES:

1. Evaluate every supplied active brand guideline separately.

2. Use ONLY the supplied guidelines.
   Never invent additional brand rules.

3. A guideline should be reported as violated only when
   the submitted content actually conflicts with that rule.

4. Do not assume that a claim is false merely because it
   sounds promotional. Evaluate it against the actual rule
   and available evidence in the submitted content.

5. For every violation:
   - Return the exact title of the violated guideline.
   - Explain the specific problem.
   - Provide a practical correction suggestion.

6. Do not report the same violation multiple times.

7. If no violations exist, return an empty violations list.

8. Provide corrected_content that preserves the original
   meaning as much as possible while addressing violations.

9. Do not invent product facts, statistics, certifications,
   guarantees, or company evidence.

10. Never claim that content has been approved by a human.

11. A human reviewer must always make the final decision.

STATUS RULES:

- If violations are found, overall_status must be "needs_review".
- If no violations are found, overall_status must be "compliant".

Return ONLY valid JSON in this exact structure:

{
    "overall_status": "compliant or needs_review",
    "summary": "Short explanation of the analysis",
    "violations": [
        {
            "rule": "Exact title of violated guideline",
            "problem": "What is wrong with the submitted content",
            "suggestion": "How to correct it"
        }
    ],
    "corrected_content": "Corrected version of submitted content",
    "human_approval_required": true
}
"""

    # ======================================
    # USER PROMPT
    # ======================================

    user_prompt = f"""
APPROVED ACTIVE BRAND GUIDELINES:

{formatted_guidelines}

SUBMITTED CONTENT:

{content}

TASK:

Evaluate the submitted content against every supplied
brand guideline.

Report only genuine violations of the supplied rules.

Use the exact guideline titles when reporting violations.

Return the result in the required JSON structure.
"""

    # ======================================
    # GROQ API REQUEST
    # ======================================

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,

            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],

            temperature=0.2,
            max_completion_tokens=2000,

            response_format={
                "type": "json_object"
            }
        )

        response_text = response.choices[0].message.content

        if not response_text:
            raise ValueError(
                "Groq returned an empty response."
            )

        result = json.loads(response_text)

        return validate_result(
            result,
            guidelines
        )

    except Exception as error:

        print(f"Groq AI analysis error: {error}")

        raise RuntimeError(
            f"AI analysis failed: {str(error)}"
        ) from error


# ==========================================
# 5. DIRECT TEST
# ==========================================

if __name__ == "__main__":

    sample_guidelines = [

        {
            "title": "No Unsupported Guarantees",
            "category": "Marketing Claims",
            "rule": (
                "Never make absolute or guaranteed product "
                "performance claims without approved evidence."
            ),
            "description": (
                "All promotional claims must be supported "
                "by verified company evidence."
            )
        },

        {
            "title": "Professional Brand Voice",
            "category": "Brand Voice",
            "rule": (
                "Always maintain a professional and respectful tone."
            ),
            "description": (
                "Avoid offensive, aggressive, or inappropriate language."
            )
        }

    ]

    # Test content intentionally contains two potential violations.
    sample_content = (
        "Our product guarantees 100% results for every customer! "
        "Buy now, you idiot, or miss this unbelievable opportunity!"
    )

    print("\n===================================")
    print("       BRANDCUE AI GROQ TEST")
    print("===================================\n")

    print("Testing with two approved guidelines...\n")

    result = analyze_content(
        sample_content,
        sample_guidelines
    )

    print("\n========== AI ANALYSIS RESULT ==========\n")

    print(
        json.dumps(
            result,
            indent=4,
            ensure_ascii=False
        )
    )

    print("\n===================================")
    print("          TEST COMPLETED")
    print("===================================")
