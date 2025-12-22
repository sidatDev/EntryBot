import os
import shutil
import tempfile
import logging
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
ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

class OCRResponse(BaseModel):
    raw_text: str
    structured_data: dict
    status: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/process", response_model=OCRResponse)
async def process_document(file: UploadFile = File(...)):
    """
    Receives a file, runs PaddleOCR, transforms via Qwen, returns JSON.
    """
    temp_file_path = None
    try:
        # Save uploaded file to temp
        suffix = os.path.splitext(file.filename)[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            temp_file_path = tmp.name
        
        logger.info(f"Processing file: {temp_file_path}")

        # 1. Run PaddleOCR
        result = ocr.ocr(temp_file_path, cls=True)
        
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

    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
