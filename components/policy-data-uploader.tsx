"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Upload, Check } from "lucide-react"
import type { PolicyData } from "../types/financial-types"
import { parsePolicyData } from "../utils/ts-parser"

interface PolicyDataUploaderProps {
  onDataUploaded: (person1Data: PolicyData[], person2Data: PolicyData[]) => void
  isOpen: boolean
  onClose: () => void
}

export default function PolicyDataUploader({ onDataUploaded, isOpen, onClose }: PolicyDataUploaderProps) {
  const [tsInput, setTsInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
          Paste your policy data in TypeScript format. The data should include arrays for both policyData1 and
          policyData2.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
        <Button onClick={handleUpload} disabled={!tsInput.trim()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Data
        </Button>
      </CardFooter>
    </Card>
  )
}

