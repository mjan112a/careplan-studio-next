"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DebugMatrixViewer from "../../components/debug-matrix-viewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const router = useRouter()
  const [person1, setPerson1] = useState<any>(null)
  const [person2, setPerson2] = useState<any>(null)
  const [combinedData, setCombinedData] = useState<any[]>([])

  useEffect(() => {
    // Retrieve data from localStorage if available
    const storedPerson1 = localStorage.getItem("debug_person1")
    const storedPerson2 = localStorage.getItem("debug_person2")
    const storedCombinedData = localStorage.getItem("debug_combinedData")

    if (storedPerson1) setPerson1(JSON.parse(storedPerson1))
    if (storedPerson2) setPerson2(JSON.parse(storedPerson2))
    if (storedCombinedData) setCombinedData(JSON.parse(storedCombinedData))
  }, [])

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Simulator
        </Button>
        <h1 className="text-2xl font-bold">Debug Data View</h1>
      </div>

      {person1 && person2 && combinedData.length > 0 ? (
        <DebugMatrixViewer person1={person1} person2={person2} combinedData={combinedData} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Debug Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              No simulation data is currently available. Please run a simulation on the main page first, then return to
              this debug view.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

