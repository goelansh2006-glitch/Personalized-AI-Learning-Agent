import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "cognipath-hackathon-2026-secret-key-salt")
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")
    PORT = int(os.getenv("PORT", 5000))
    
    # API Keys for LLM inference
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

    # Default LLM preferences
    DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
    FALLBACK_GROQ_MODEL = "llama-3.1-8b-instant"
    DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"
    DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
    
    # Security parameters
    MAX_PROMPT_LENGTH = 4000
    RATE_LIMIT_BURST = 30
