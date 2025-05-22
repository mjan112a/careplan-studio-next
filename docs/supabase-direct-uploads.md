# Direct File Uploads with Supabase Storage

## Overview

To overcome Vercel's 4.5MB serverless function size limit, we've implemented direct uploads to Supabase Storage. This approach bypasses the API route size limit entirely, allowing for large file uploads (up to 50MB).

## How It Works

The upload process follows these steps:

1. **Request a Signed URL:**
   - Client sends file metadata (name, type, size) to our API
   - API generates a signed upload URL from Supabase
   - API creates a database record with 'pending' status

2. **Direct Upload to Supabase:**
   - Client uploads the file directly to Supabase Storage using the signed URL
   - This step bypasses our own API routes completely

3. **Process After Upload:**
   - Client notifies our API that the upload completed
   - API verifies the file exists, downloads it, and processes it
   - For images, we resize and optimize them
   - API updates the database record with 'completed' status

## Implementation Files

- `components/PolicyUpload.tsx` - The client-side upload component
- `app/api/policy-blob-upload/route.ts` - API route for generating signed URLs
- `app/api/process-upload/complete/route.ts` - API route for post-upload processing

## Advantages

1. **Bypasses API Size Limits:** Avoids the 4.5MB Vercel limit for API routes
2. **Improved Performance:** Uploads directly to storage instead of through our server
3. **Resilience:** File processing happens after successful upload
4. **Works on Vercel:** Compatible with Vercel's serverless environment

## Troubleshooting

If uploads fail:

1. Check browser console for network errors
2. Verify that the signed URL was generated correctly
3. Verify that the file size is under 50MB
4. Ensure the file type is supported
5. Check the server logs for errors in the processing step

## Database Schema Changes

The `policy_documents` table has a few additional fields:

- `upload_status`: 'pending' or 'completed'
- `original_hash`: SHA-256 hash of the original file
- `processed_hash`: SHA-256 hash of the processed file

## Security Considerations

- Signed URLs expire after a short period (typically 60 seconds)
- Authentication is required to generate the signed URL
- Each upload is tied to a specific user ID
- File paths include user IDs to enforce isolation

## Local Development

For local development, the entire upload process works normally since it's using Supabase Storage APIs rather than local file system operations. 