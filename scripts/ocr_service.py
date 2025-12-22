import sys
import json
import logging
import subprocess
from paddleocr import PaddleOCR

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ocr_process(image_path):
    try:
        # Initialize PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        
        logger.info(f"Processing image: {image_path}")
        result = ocr.ocr(image_path, cls=True)
        
        full_text = []

        if result and result[0]:
            for line in result[0]:
                text_content = line[1][0]
                full_text.append(text_content)
        
        raw_text = "\n".join(full_text)
        
        # --- QWEN INTEGRATION ---
        
        # System prompt enforcing JSON only
        system_prompt = (
            "You are a strict data extraction assistant. "
            "Extract invoice data (invoice_number, date, due_date, vendor_name, customer_name, total_amount, currency) "
            "from the OCR text below. "
            "Return ONLY valid JSON. No markdown, no explanations. "
            "Use keys: invoice_number, date, due_date, vendor_name, customer_name, total_amount, currency."
        )
        
        user_prompt = f"OCR TEXT:\n{raw_text}\n\nJSON:"
        full_prompt = f"{system_prompt}\n{user_prompt}"
        
        ai_extraction = {}
        
        try:
            logger.info("Calling Qwen CLI...")
            # Using 'qwen' command implies it's in PATH.
            # Assuming 'qwen <prompt>' works or we need 'qwen run ...'
            # Based on user context, we will try direct prompt argument.
            process = subprocess.run(
                ['qwen', full_prompt],
                capture_output=True,
                text=True,
                encoding='utf-8',
                timeout=60 # Timeout for AI
            )
            
            if process.returncode == 0:
                output = process.stdout.strip()
                # Clean up markdown if present
                if output.startswith("```json"):
                    output = output.replace("```json", "").replace("```", "")
                elif output.startswith("```"):
                     output = output.replace("```", "")
                
                try:
                    ai_extraction = json.loads(output)
                except:
                    logger.warning("Failed to parse Qwen JSON", output)
                    ai_extraction = {"raw_ai_output": output}
            else:
                logger.error(f"Qwen CLI failed: {process.stderr}")
                ai_extraction = {"error": "CLI execution failed", "stderr": process.stderr}

        except Exception as ai_err:
             logger.error(f"AI Module Error: {ai_err}")
             ai_extraction = {"error": str(ai_err)}

        # Output final combined JSON
        output = {
            "success": True,
            "text": raw_text,
            "ai_extraction": ai_extraction
        }
        
        print(json.dumps(output))

    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_output))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    ocr_process(image_path)
