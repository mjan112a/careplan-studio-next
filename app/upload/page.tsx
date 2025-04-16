'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

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

export default function AddMyPolicy() {
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array for handleFiles
    const fileArray = Array.from(files);
    await handleFiles(fileArray);
  };

  const handleRemoveImage = async (index: number) => {
    const image = images[index];
    if (!image) return;

    // If this is the last image and we have a planId, redirect to edit page
    if (images.length === 1 && image.planId) {
      router.push(`/edit-my-plan/${image.planId}`);
      return;
    }

    setImages(prev => prev.filter((_, i) => i !== index));
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
        // Add file to state with initial progress
        setImages(prev => [...prev, {
          id: fileId,
          url: URL.createObjectURL(file),
          originalFileName: file.name,
          processedFileName: '',
          planId: images.length > 0 ? images[0].planId : undefined
        }]);

        const formData = new FormData();
        formData.append('file', file);

        // If we have images, use the planId from the first image
        if (images.length > 0 && images[0].planId) {
          formData.append('planId', images[0].planId);
        }

        // Add retry logic with exponential backoff
        let retries = 3;
        let delay = 1000; // Start with 1 second delay

        while (retries > 0) {
          try {
            const response = await fetch('/api/process-upload', {
              method: 'POST',
              body: formData,
            });

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

            // Update file in state with final URL and policyId
            setImages(prev => prev.map(f => 
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
        // Remove failed file from state
        setImages(prev => prev.filter(f => f.id !== fileId));
      }

      // Add a small delay between file uploads to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen bg-nt-beige py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => router.push('/home')}
                  variant="ghost"
                  className="flex items-center gap-2 text-sm text-nt-gray hover:text-nt-blue"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-nt-beige text-nt-gray border border-nt-gray/20">
                <p>Go to Home</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Card className="bg-white shadow-lg">
          <CardContent>
            <div className="space-y-6">
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
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Policy Documents
                  </label>
                  <p className="mt-2 text-sm text-nt-gray">
                    or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-nt-gray/60">
                    PDF, PNG, JPG, HEIC up to 50MB
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-nt-gray/10">
                        <Image
                          src={image.url}
                          alt={`Uploaded ${index + 1}`}
                          className="object-cover"
                          width={300}
                          height={300}
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-nt-blue border-t-transparent"></div>
                  <p className="mt-2 text-sm text-nt-gray">Uploading...</p>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}