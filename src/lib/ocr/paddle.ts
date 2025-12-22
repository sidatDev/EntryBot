import { spawn } from 'child_process';
import path from 'path';

interface OCRResult {
    success: boolean;
    text?: string;
    data?: any[];
    error?: string;
}

export async function extractTextWithPaddle(imagePath: string): Promise<OCRResult> {
    return new Promise((resolve, reject) => {
        // Resolve absolute path to script
        const scriptPath = path.join(process.cwd(), 'scripts', 'ocr_service.py');

        // Determine python command
        // In production docker, it is python3. locally might be python or python3.
        const pythonCommand = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

        console.log(`[PaddleOCR] Spawning: ${pythonCommand} ${scriptPath} "${imagePath}"`);

        const pythonProcess = spawn(pythonCommand, [scriptPath, imagePath]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            // Logging stderr but not rejecting immediately as some libs print warnings to stderr
            console.warn(`[PaddleOCR Stderr]: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return resolve({
                    success: false,
                    error: `Process exited with code ${code}. Stderr: ${errorData}`
                });
            }

            try {
                // Find the JSON output lines
                const lines = outputData.trim().split('\n');
                // The last line should be our JSON
                const lastLine = lines[lines.length - 1];
                const result: OCRResult = JSON.parse(lastLine);
                resolve(result);
            } catch (e: any) {
                resolve({
                    success: false,
                    error: `Failed to parse JSON output: ${e.message}. Raw output: ${outputData}`
                });
            }
        });

        pythonProcess.on('error', (err) => {
            resolve({
                success: false,
                error: `Failed to start python process: ${err.message}. Ensure Python is installed.`
            });
        });
    });
}
