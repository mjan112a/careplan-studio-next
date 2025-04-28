// This component has been replaced by PolicyUpload. Remove or archive if not needed.

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Upload, Check, Trash2 } from "lucide-react"
import type { PolicyData } from "../types/financial-types"
import { parsePolicyData } from "../utils/ts-parser"
import Image from "next/image"
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'react-hot-toast'
import { supabase } from "@/utils/supabase"

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

interface UploadedFile {
  id: string;
  url: string;
  originalFileName: string;
  processedFileName: string;
  planId?: string;
  policyId?: string;
}

interface PolicyDataUploaderProps {
  onDataUploaded: (person1Data: PolicyData[], person2Data: PolicyData[]) => void
  isOpen: boolean
  onClose: () => void
}

export default function PolicyDataUploader({ onDataUploaded, isOpen, onClose }: PolicyDataUploaderProps) {
  const [tsInput, setTsInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    const fileArray = Array.from(uploadedFiles);
    await handleFiles(fileArray);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type ${file.type} is not supported. Please upload PDF, JPG, PNG, or HEIC files.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFiles = async (newFiles: File[]) => {
    setIsUploading(true);
    setError(null);
    
    // Process files sequentially to avoid rate limiting
    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        setError(validationError);
        continue;
      }

      const fileId = uuidv4();
      
      try {
        setFiles(prev => [...prev, {
          id: fileId,
          url: URL.createObjectURL(file),
          originalFileName: file.name,
          processedFileName: '',
        }]);

        const formData = new FormData();
        formData.append('file', file);

        // Get the current session to access the JWT token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        console.log('Session token:', session.access_token); // Debug log

        // Add retry logic with exponential backoff
        let retries = 3;
        let delay = 1000; // Start with 1 second delay

        while (retries > 0) {
          try {
            const response = await fetch('/api/process-upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: formData,
            });

            if (response.status === 401) {
              console.error('Auth error response:', await response.text()); // Debug log
              throw new Error('Authentication failed');
            }

            if (response.status === 429) {
              // If rate limited, wait and retry
              retries--;
              if (retries === 0) {
                throw new Error('Rate limit exceeded. Please try again in a few minutes.');
              }
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // Exponential backoff
              continue;
            }

            if (!response.ok) {
              throw new Error(`Failed to process policy document: ${response.statusText}`);
            }

            const data = await response.json();

            setFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, url: data.url, processedFileName: data.processedFileName, policyId: data.policyId }
                : f
            ));

            toast.success(`Successfully uploaded ${file.name}`);
            break; // Success, exit retry loop
          } catch (error) {
            if (retries === 0) throw error;
            retries--;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      } catch (error) {
        console.error('Error processing file:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to upload policy document';
        toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
        setError(errorMessage);
        setFiles(prev => prev.filter(f => f.id !== fileId));
      }

      // Add a small delay between file uploads to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsUploading(false);
  };

  const handleUpload = () => {
    try {
      // Reset states
      setError(null)
      setSuccess(false)

      // Parse the TypeScript input
      const { person1Data, person2Data } = parsePolicyData(tsInput)

      // If we got here, the data is valid
      onDataUploaded(person1Data, person2Data)
      setSuccess(true)

      // Close the uploader after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid format")
    }
  }

  if (!isOpen) return null

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Policy Data</CardTitle>
        <CardDescription>
          Upload policy documents or paste your policy data in TypeScript format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-nt-gray/20 rounded-lg p-6 bg-nt-gray/5">
            <div className="text-center">
              <input
                type="file"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                multiple
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-nt-blue hover:bg-nt-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nt-blue"
              >
                <Upload className="w-5 h-5 mr-2" strokeWidth={2} aria-hidden="true" />
                <span>Upload Policy Documents</span>
              </label>
              <p className="mt-2 text-sm text-nt-gray">
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-nt-gray/60">
                PDF, PNG, JPG, HEIC up to 50MB
              </p>
            </div>
          </div>

          {/* Uploaded Files Preview */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-nt-gray/10">
                    <Image
                      src={file.url}
                      alt={`Uploaded ${index + 1}`}
                      className="object-cover"
                      width={300}
                      height={300}
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TypeScript Input Section */}
          <div className="text-sm text-gray-500">
            Expected format:
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">
              {`export const policyData1: PolicyData[] = [
  {
    year: 1,
    premium: 3000.0,
    cashValue: 0,
    deathBenefit: 51213,
    totalLTCBenefit: 107128,
    aobMonthly: 2134,
    cobMonthly: 2134,
  },
  // more entries...
]

export const policyData2: PolicyData[] = [
  {
    year: 1,
    premium: 3219.56,
    cashValue: 0,
    deathBenefit: 50000,
    totalLTCBenefit: 104591,
    aobMonthly: 2083,
    cobMonthly: 2083,
  },
  // more entries...
]`}
            </pre>
          </div>

          <Textarea
            placeholder="Paste your TypeScript policy data here..."
            className="min-h-[300px] font-mono text-sm"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4"></AlertCircle>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4"></Check>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Policy data uploaded successfully!</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!tsInput.trim() && files.length === 0}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Data
        </Button>
      </CardFooter>
    </Card>
  )
}

