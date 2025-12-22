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
        "Extract invoice data (invoice_number, date, vendor_name, total_amount, currency) "
        "from the text below. "
        "Return ONLY valid JSON. No markdown, no explanations."
    )
    
    user_prompt = f"OCR TEXT:\n{raw_text}\n\nJSON:"
    
    # Combine for CLI (assuming simple prompt argument or echo piping)
    # Adjust valid Qwen CLI syntax here.
    full_prompt = f"{system_prompt}\n{user_prompt}"

    try:
        # Mocking Qwen call via subprocess
        # Ensure 'qwen' is in PATH or use absolute path
        process = subprocess.run(
            ['qwen', full_prompt],
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=30 # 30s timeout
        )

        if process.returncode != 0:
            logger.error(f"Qwen CLI error: {process.stderr}")
            return {"error": "LLM extraction failed", "details": process.stderr}

        output = process.stdout.strip()
        
        # Clean up output if model adds markdown fence
        if output.startswith("```json"):
            output = output.replace("```json", "").replace("```", "")
        
        return json.loads(output)

    except json.JSONDecodeError:
        logger.error("Failed to parse LLM JSON output")
        return {"error": "Invalid JSON response", "raw_output": output}
    except Exception as e:
        logger.error(f"LLM Transformation error: {str(e)}")
        return {"error": str(e)}
