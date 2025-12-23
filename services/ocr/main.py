import os
import shutil
import tempfile
import logging
import requests
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from paddleocr import PaddleOCR
from transform import transform_with_llm

# Initialize FastAPI
app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize PaddleOCR once at startup
logger.info("Initializing PaddleOCR...")
ocr = PaddleOCR(use_angle_cls=True, lang='en')

class OCRResponse(BaseModel):
    raw_text: str
    structured_data: dict
    status: str

class URLRequest(BaseModel):
    url: str

def run_ocr_pipeline(file_path: str) -> dict:
    """
    Helper function to run OCR and transformation on a local file.
    """
    logger.info(f"Running OCR on: {file_path}")
    
    # 1. Run PaddleOCR
    result = ocr.ocr(file_path, cls=True)
    
    full_text_lines = []
    if result and result[0]:
        for line in result[0]:
            text_content = line[1][0]
            full_text_lines.append(text_content)
    
    raw_text = "\n".join(full_text_lines)
    logger.info(f"OCR Complete. Extracted {len(raw_text)} chars.")

    # 2. Transform with LLM (Qwen)
    structured_data = transform_with_llm(raw_text)

    return {
        "raw_text": raw_text,
        "structured_data": structured_data,
        "status": "success"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/process-url", response_model=OCRResponse)
async def process_from_url(request: URLRequest):
    """
    Downloads a file from a public URL and processes it.
    """
    temp_file_path = None
    try:
        logger.info(f"Downloading file from URL: {request.url}")
        response = requests.get(request.url, stream=True)
        response.raise_for_status()
        
        # Try to guess extension from URL or Content-Type, default to .jpg
        suffix = os.path.splitext(request.url.split('?')[0])[1]
        if not suffix:
            suffix = ".jpg"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(response.raw, tmp)
            temp_file_path = tmp.name
        
        return run_ocr_pipeline(temp_file_path)

    except Exception as e:
        logger.error(f"URL Processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/process", response_model=OCRResponse)
async def process_document(file: UploadFile = File(...)):
    """
    Receives an uploaded file and processes it.
    """
    temp_file_path = None
    try:
        suffix = os.path.splitext(file.filename)[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_file_path = tmp.name
        
        return run_ocr_pipeline(temp_file_path)

    except Exception as e:
        logger.error(f"Upload Processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
