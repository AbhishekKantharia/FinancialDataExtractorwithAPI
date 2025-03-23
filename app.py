import os
import io
from flask import Flask, request, jsonify
from google.cloud import vision
from pdf2image import convert_from_path
import pytesseract

# Initialize Flask App
app = Flask(__name__)

# Set Google API Key from Environment
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path_to_your_service_account.json"

# Initialize Google Vision Client
vision_client = vision.ImageAnnotatorClient()

def extract_text_from_image(image):
    """Extracts text from an image using Google Vision API."""
    image_bytes = io.BytesIO()
    image.save(image_bytes, format="JPEG")
    content = image_bytes.getvalue()

    image = vision.Image(content=content)
    response = vision_client.text_detection(image=image)
    
    if response.error.message:
        return None
    
    return response.text_annotations[0].description if response.text_annotations else ""

def extract_invoice_details(text):
    """Extracts invoice details from text using simple regex parsing."""
    import re

    invoice_data = {
        "Invoice_date": re.search(r"Billing Date\s+(\d{2}/\d{2}/\d{2})", text),
        "Invoice_number": re.search(r"Account Number\s+(\d+)", text),
        "Amount": re.search(r"Total Amount Due\s+\$([\d.]+)", text),
        "Due_date": re.search(r"Auto Pay\s+(\d{2}/\d{2}/\d{2})", text),
    }

    return {key: (match.group(1) if match else "Not Found") for key, match in invoice_data.items()}

@app.route('/extract-invoice', methods=['POST'])
def extract_invoice():
    """Extracts invoice details from an uploaded PDF."""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    
    # Convert PDF to image
    images = convert_from_path(file.filename)
    extracted_text = ""
    
    for img in images:
        extracted_text += extract_text_from_image(img) + "\n"

    invoice_details = extract_invoice_details(extracted_text)

    return jsonify(invoice_details)

if __name__ == '__main__':
    app.run(debug=True)
