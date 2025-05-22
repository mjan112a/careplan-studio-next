"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSamplePolicyData } from "@/types/policy-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PolicyData } from "@/types/simulator-interfaces"

interface PolicyDataDebugProps {
  shiftPolicyYear?: boolean
  policyData?: PolicyData[] | null
}

export function PolicyDataDebug({ shiftPolicyYear = false, policyData }: PolicyDataDebugProps) {
  const [showData, setShowData] = useState(false)
  
  // Use provided policy data or fallback to sample data
  const displayPolicyData = policyData || getSamplePolicyData()

  // Adjust policy years if shift is enabled
  const adjustedPolicyData = shiftPolicyYear
    ? displayPolicyData.map((policy) => ({
        ...policy,
        annual_policy_data: policy.annual_policy_data.map((data) => ({
          ...data,
          policy_year: data.policy_year - 1, // Shift year down by 1
        })),
      }))
    : displayPolicyData

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Policy Data Debug</CardTitle>
        <CardDescription>View the raw policy data for debugging purposes</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowData(!showData)} className="mb-4">
          {showData ? "Hide Raw Data" : "Show Raw Data"}
        </Button>

        {showData && (
          <ScrollArea className="h-[400px] w-full border rounded-md p-4">
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(adjustedPolicyData, null, 2)}</pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
