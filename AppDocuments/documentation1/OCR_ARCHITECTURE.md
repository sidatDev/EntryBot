# OCR Pipeline Implementation Roadmap

**Role:** Senior System Architect
**Date:** 2024-12-22
**Topic:** Automated Invoice OCR Pipeline (PaddleOCR + Qwen)

## 1. Architecture Overview

We are moving from a monolithic, synchronous OCR process to an **asynchronous, event-driven microservice**. This ensures scalability and prevents the main application from hanging during heavy OCR processing.

### Workflow
1.  **Frontend**: User uploads PDF/Image -> Next.js Server.
2.  **Monolith**: Uploads file to **S3 Bucket** (`raw-invoices/`).
3.  **Trigger**: S3 Event Notification calls **OCR Service** (Webhook/SQS).
4.  **OCR Service (Docker)**:
    *   Downloads file.
    *   Runs **PaddleOCR** to extract raw text.
    *   Passes raw text to **Qwen LLM** (CLI/Internal) for structuring.
    *   Returns structured JSON.
5.  **Callback**: OCR Service POSTs result to Monolith API (`/api/webhooks/ocr`).
6.  **Database**: Monolith updates `Document` with `rawText` and `Invoice` with extracted data.
7.  **Frontend**: User sees "Processing..." -> "Complete".

## 2. Infrastructure Components

### A. Dockerized OCR Service
*   **Base Image**: `python:3.11-slim` (Debian-based for GL dependencies).
*   **Libraries**: `paddlepaddle`, `paddleocr`, `fastapi`, `uvicorn`.
*   **System Deps**: `libgl1-mesa-glx`, `libgomp1` (Critical for Paddle).

### B. S3 Trigger Logic
Instead of complex Polling:
*   **Option A (Direct Webhook)**: Configure S3 to send `ObjectCreated` event to `https://ocr-service.internal/process`.
*   **Option B (Async Worker - Recommended)**:
    *   S3 -> **SQS Queue**.
    *   OCR Service has a background thread consuming from SQS.
    *   This handles burst traffic better than direct webhooks.

### C. Database Schema
To support traceability, extend `Document` model:

```prisma
model Document {
  id          String   @id @default(cuid())
  // ... existing fields
  
  // New Fields
  ocrStatus   String   @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED
  ocrText     String?  @db.Text            // Raw output from Paddle
  ocrMetadata Json?                        // Confidence scores, bounding boxes
  
  error       String?                      // Error message if failed
}
```

## 3. Implementation Steps

### Step 1: Deploy OCR Microservice
Build and deploy the provided `Docker` container. Ensure it has GPU access if available (nvidia-docker) or optimize for CPU (`paddlepaddle` vs `paddlepaddle-gpu`).

### Step 2: Configure S3 & Queue
Set up S3 Bucket Notification to push to SQS. Configure OCR Service env vars with SQS credentials.

### Step 3: Implement Monolith Webhook
Create `POST /api/webhooks/ocr-result` in Next.js to receive `{ documentId, data, text }` and update Prisma.

### Step 4: LLM Transformation
Integrate `Qwen` to parse the messy OCR text into clean JSON.

---

## 4. Boilerplate Code

### Dockerfile (Service)
See `services/ocr/Dockerfile`

### Logic (LLM Transformation)
See `services/ocr/transform.py`
