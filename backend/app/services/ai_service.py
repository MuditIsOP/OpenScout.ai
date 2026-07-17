"""AI Service using Google Gemini to generate explanations."""

import json
from datetime import datetime, timezone
from google import genai
from google.genai import types
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)

    async def generate_recommendation_explanations(
        self, 
        db: AsyncIOMotorDatabase, 
        profile: dict, 
        repo: dict, 
        score_breakdown: dict
    ) -> dict:
        """Generate human-readable explanations justifying the match score."""
        
        prompt = f"""
        You are an expert technical recruiter analyzing an open-source repository match.
        
        User Profile:
        Primary Languages: {profile.get('primary_languages')}
        Skills: {profile.get('skills')}
        Experience Level: {profile.get('experience_level')}
        
        Repository:
        Name: {repo.get('full_name')}
        Primary Language: {repo.get('primary_language')}
        Topics: {repo.get('topics')}
        
        Score Breakdown:
        {json.dumps(score_breakdown, indent=2)}
        
        Generate exactly 3 bullet points explaining why this repository is a good match for the developer, based ONLY on the data above.
        Return the result as JSON matching this schema:
        {{
            "confidence_score": <float between 0 and 1>,
            "reasons": ["reason 1", "reason 2", "reason 3"]
        }}
        """

        try:
            # Note: The new google-genai SDK provides typed responses
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            
            result = json.loads(response.text)
            
            # Log the AI run
            await db["ai_runs"].insert_one({
                "feature": "recommendation_explanation",
                "repository": repo.get("full_name"),
                "created_at": datetime.now(timezone.utc)
            })
            
            return result
        except Exception as e:
            print(f"Gemini generation failed: {e}")
            # Fallback
            return {
                "confidence_score": 0.5,
                "reasons": [
                    f"Matches your interest in {repo.get('primary_language')}",
                    "Aligns with your general technical background.",
                    "Good repository health and activity."
                ]
            }

# Singleton
ai_service = AIService()
