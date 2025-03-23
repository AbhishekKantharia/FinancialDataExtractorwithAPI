from django.apps import AppConfig
import logging
import os
from langchain_google_genai import ChatGoogleGenerativeAI
import torch
import whisper

logger = logging.getLogger(__name__)

class InvoicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'invoices'

    llm = None  # Google Generative AI Model
    whisper_model = None  # Whisper Model

    def ready(self):
        logger.info("📄 Invoice app is initializing...")

        # ✅ Load Google Generative AI (Gemini) for invoice processing
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            logger.warning("⚠️ GOOGLE_API_KEY is missing. LLM features might not work.")
        else:
            try:
                InvoicesConfig.llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=google_api_key)
                logger.info("✅ Google Generative AI (Gemini) initialized successfully!")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Google Generative AI: {e}")

        # ✅ Load Whisper for audio-based invoice processing
        try:
            if torch.cuda.is_available():
                InvoicesConfig.whisper_model = whisper.load_model("base").to("cuda")
            else:
                InvoicesConfig.whisper_model = whisper.load_model("base")
            logger.info("✅ Whisper AI model loaded successfully!")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Whisper model: {e}")

