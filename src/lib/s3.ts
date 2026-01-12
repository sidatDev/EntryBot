import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "entrybot-uploads";

export async function uploadToS3(file: Buffer, fileName: string, contentType: string) {
    // Sanitize filename: replace spaces and special chars with hyphens, remove problematic characters
    const sanitizedFileName = fileName
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[()[\]{}]/g, '')      // Remove parentheses and brackets
        .replace(/['"]/g, '')           // Remove quotes
        .replace(/[|\\]/g, '-')         // Replace pipes and backslashes with hyphens
        .replace(/--+/g, '-')           // Replace multiple consecutive hyphens with single hyphen
        .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens

    const key = `uploads/${Date.now()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        // ACL: 'public-read' // Optional: if bucket policy allows, otherwise remove
    });

    try {
        await s3Client.send(command);
        // Construct public URL manually since we know the structure
        // If AWS_S3_ENDPOINT includes bucket in path, use it. MinIO often does path style: endpoint/bucket/key
        const endpoint = process.env.AWS_S3_ENDPOINT?.replace(/\/+$/, ""); // Remove trailing slash
        return `${endpoint}/${BUCKET_NAME}/${key}`;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw new Error("Failed to upload file to S3");
    }
}

export async function deleteFromS3(fileUrl: string) {
    // Extract key from URL
    // URL format: https://endpoint/bucket/uploads/filename
    // We need "uploads/filename"
    try {
        const url = new URL(fileUrl);
        // Pathname is /entrybot-uploads/uploads/filename
        // Remove leading slash and bucket name
        const pathParts = url.pathname.split('/'); // ["", "entrybot-uploads", "uploads", "filename"]
        // slice(2) to skip empty string and bucket name
        const key = pathParts.slice(2).join('/');

        if (!key) return;

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting from S3:", error);
        // Don't throw, just log
    }
}

// Helper to get buffer from S3 (for merge/split operations)
export async function getFileBufferFromS3(fileUrl: string): Promise<Buffer> {
    try {
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        const key = pathParts.slice(2).join('/'); // Remove bucket name

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) throw new Error("No body in response");

        // Convert stream to buffer
        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
    } catch (error) {
        console.error("Error getting file from S3:", error);
        throw new Error("Failed to retrieve file from S3");
    }
}

export async function getPresignedUrl(fileUrl: string) {
    try {
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        // Format: /bucket/uploads/key
        // slice(2) removes "" and "bucket"
        const key = pathParts.slice(2).join('/');

        if (!key) return fileUrl;

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        console.error("Error creating presigned URL:", error);
        return fileUrl;
    }
}
