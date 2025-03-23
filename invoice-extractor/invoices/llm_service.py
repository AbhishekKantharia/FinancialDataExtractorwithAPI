import os
import logging
import re
import json
import tempfile
from datetime import datetime
from decimal import Decimal, InvalidOperation
from langchain_google_genai import ChatGoogleGenerativeAI
from PIL import Image
import pytesseract
import PyPDF2
from dotenv import load_dotenv

load_dotenv()

# Setup logger
logger = logging.getLogger(__name__)

class InvoiceExtractor:
    def __init__(self):
        self.google_api_key = os.getenv('GOOGLE_API_KEY')
        if not self.google_api_key:
            raise ValueError("❌ GOOGLE_API_KEY is missing. Please set it in your environment variables.")

        # ✅ Initialize Gemini model via LangChain
        self.model = ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=self.google_api_key
        )

    def extract_text_from_image(self, file_path):
        """Extracts text from an image file using Tesseract OCR."""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text.strip() if text else None
        except Exception as e:
            logger.error(f"❌ Error extracting text from image: {e}")
            return None

    def extract_text_from_pdf(self, file_path):
        """Extracts text from a PDF file using PyPDF2."""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = " ".join(page.extract_text() for page in reader.pages if page.extract_text())
            return text.strip() if text else None
        except Exception as e:
            logger.error(f"❌ Error extracting text from PDF: {e}")
            return None

    def extract_invoice_data(self, file_path):
        """Extracts structured invoice data using Google Gemini AI."""
        
        # Determine file type and extract raw text
        file_extension = os.path.splitext(file_path)[1].lower()
        text = None

        if file_extension in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']:
            text = self.extract_text_from_image(file_path)
        elif file_extension == '.pdf':
            text = self.extract_text_from_pdf(file_path)
        else:
            try:
                with open(file_path, 'r', errors='ignore') as file:
                    text = file.read().strip()
            except Exception as e:
                logger.error(f"❌ Error reading text file: {e}")

        if not text:
            return {'success': False, 'error': 'Failed to extract text from the invoice'}

        # Prepare LLM prompt
        prompt = f"""
        You are an invoice data extraction assistant. Extract the following information from the provided invoice text:

        - **Invoice Date**: (e.g., "Statement Date", "Bill Date", "Invoice Date") in YYYY-MM-DD format.
        - **Invoice Number**: (e.g., "Invoice Number", "Bill Number", "Account Number").
        - **Total Amount**: (e.g., "Total Amount Due", "Balance Due", "Payment Amount") in numeric format (e.g., 1250.00).
        - **Due Date**: (e.g., "Payment Due Date", "Due By Date", "Auto Pay Date") in YYYY-MM-DD format.

        Format the response as a **valid JSON object** with these exact keys:
        ```
        {{
            "invoice_date": "YYYY-MM-DD",
            "invoice_number": "string",
            "amount": "numeric",
            "due_date": "YYYY-MM-DD"
        }}
        ```

        If any field is missing, return `null` for that field.
        
        Here is the invoice text:
        ```
        {text}
        ```

        JSON Response:
        """

        # Call Google Gemini AI API
        try:
            response = self.model.invoke(prompt)

            # Extract LLM response
            response_text = response.strip()
            
            # Try to find JSON in response
            json_match = re.search(r'({.*})', response_text.replace('\n', ''), re.DOTALL)
            json_str = json_match.group(1) if json_match else response_text
            
            # Parse JSON
            data = json.loads(json_str)

            # ✅ Process extracted data
            return self._process_invoice_data(data)

        except Exception as e:
            logger.error(f"❌ Error calling Google Gemini API: {e}")
            return {'success': False, 'error': f'LLM processing error: {str(e)}'}

    def _process_invoice_data(self, data):
        """Validates and processes extracted invoice data."""
        processed_data = {}

        # Invoice Date
        processed_data['invoice_date'] = self._validate_date(data.get('invoice_date'))

        # Invoice Number
        processed_data['invoice_number'] = data.get('invoice_number')

        # Amount
        processed_data['amount'] = self._validate_amount(data.get('amount'))

        # Due Date
        processed_data['due_date'] = self._validate_date(data.get('due_date'))

        return {'success': True, 'data': processed_data}

    def _validate_date(self, date_str):
        """Validates and converts a date string to YYYY-MM-DD format."""
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None
        except ValueError:
            return None

    def _validate_amount(self, amount_str):
        """Validates and converts an amount string to Decimal format."""
        if not amount_str:
            return None
        try:
            return Decimal(re.sub(r'[^\d.]', '', amount_str))  # Remove non-numeric symbols
        except (ValueError, TypeError, InvalidOperation):
            return None

