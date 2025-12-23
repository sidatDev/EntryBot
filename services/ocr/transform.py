import subprocess
import json
import logging

logger = logging.getLogger(__name__)

def transform_with_llm(raw_text: str) -> dict:
    """
    Passes raw text to Qwen CLI to extract structured JSON.
    """
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

    try:
        logger.info("Calling Qwen CLI...")
        # Mocking Qwen call via subprocess
        # Ensure 'qwen' is in PATH or use absolute path
        process = subprocess.run(
            ['qwen', full_prompt],
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=60 # 60s timeout
        )

        if process.returncode != 0:
            logger.error(f"Qwen CLI error: {process.stderr}")
            if "login" in process.stderr.lower():
                 return {"error": "Qwen CLI requires authentication. Mount ~/.qwen-code or provide env vars."}
            return {"error": "LLM extraction failed", "details": process.stderr}

        output = process.stdout.strip()
        
        # Clean up output if model adds markdown fence
        if output.startswith("```json"):
            output = output.replace("```json", "").replace("```", "")
        elif output.startswith("```"):
            output = output.replace("```", "")
        
        return json.loads(output)

    except json.JSONDecodeError:
        logger.error(f"Failed to parse LLM JSON output: {output}")
        return {"error": "Invalid JSON response", "raw_output": output}
    except Exception as e:
        logger.error(f"LLM Transformation error: {str(e)}")
        return {"error": str(e)}
