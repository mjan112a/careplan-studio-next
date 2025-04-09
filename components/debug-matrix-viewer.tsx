"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "../utils/formatting-utils"
import type { Person, CombinedYearlyData } from "../types/financial-types"

interface DebugMatrixViewerProps {
  person1: Person
  person2: Person
  combinedData: CombinedYearlyData[]
}

export default function DebugMatrixViewer({ person1, person2, combinedData }: DebugMatrixViewerProps) {
  // Function to render a person's retirement data
  const renderPersonData = (person: Person) => {
    if (!person.enabled || person.retirementData.length === 0) {
      return <div className="p-4 text-red-500">No data available for {person.name}</div>
    }

    // Get the first few years of data for display
    const dataToShow = person.retirementData.slice(0, 15)

    return (
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead>Projection Year</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Calendar Year</TableHead>
              <TableHead>Work Income</TableHead>
              <TableHead>Social Security</TableHead>
              <TableHead>Pension</TableHead>
              <TableHead>Policy Income</TableHead>
              <TableHead>Income Needed</TableHead>
              <TableHead>Income Gap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataToShow.map((data, index) => (
              <TableRow key={index} className={data.age === 55 ? "bg-yellow-100" : ""}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{data.age}</TableCell>
                <TableCell>{data.year}</TableCell>
                <TableCell>{formatCurrency(data.workIncome)}</TableCell>
                <TableCell>{formatCurrency(data.socialSecurity)}</TableCell>
                <TableCell>{formatCurrency(data.pension)}</TableCell>
                <TableCell>{formatCurrency(data.policyIncome)}</TableCell>
                <TableCell>{formatCurrency(data.incomeNeeded)}</TableCell>
                <TableCell>{formatCurrency(data.incomeGap)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Function to render combined data
  const renderCombinedData = () => {
    if (combinedData.length === 0) {
      return <div className="p-4 text-red-500">No combined data available</div>
    }

    // Get the first few years of data for display
    const dataToShow = combinedData.slice(0, 15)

    return (
      <div className="overflow-auto max-h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead>Projection Year</TableHead>
              <TableHead>Calendar Year</TableHead>
              <TableHead>P1 Age</TableHead>
              <TableHead>P2 Age</TableHead>
              <TableHead>P1 Work Income</TableHead>
              <TableHead>P2 Work Income</TableHead>
              <TableHead>Combined Work Income</TableHead>
              <TableHead>P1 Income Gap</TableHead>
              <TableHead>P2 Income Gap</TableHead>
              <TableHead>Combined Income Gap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataToShow.map((data, index) => {
              // Calculate ages for each person based on projection year
              const p1Age = person1.enabled ? person1.currentAge + data.projectionYear - 1 : null
              const p2Age = person2.enabled ? person2.currentAge + data.projectionYear - 1 : null

              return (
                <TableRow key={index} className={p1Age === 55 || p2Age === 55 ? "bg-yellow-100" : ""}>
                  <TableCell className="font-medium">{data.projectionYear}</TableCell>
                  <TableCell>{data.year}</TableCell>
                  <TableCell>{p1Age}</TableCell>
                  <TableCell>{p2Age}</TableCell>
                  <TableCell>{formatCurrency(data.p1_workIncome || 0)}</TableCell>
                  <TableCell>{formatCurrency(data.p2_workIncome || 0)}</TableCell>
                  <TableCell>{formatCurrency(data.combined_workIncome || 0)}</TableCell>
                  <TableCell>{formatCurrency(data.p1_incomeGap || 0)}</TableCell>
                  <TableCell>{formatCurrency(data.p2_incomeGap || 0)}</TableCell>
                  <TableCell>{formatCurrency(data.combined_incomeGap || 0)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>Debug Data Matrix Viewer</div>
          <div className="text-sm text-gray-500">Showing data by projection year (not age)</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="person1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="person1" disabled={!person1.enabled}>
              Person 1 Matrix
            </TabsTrigger>
            <TabsTrigger value="person2" disabled={!person2.enabled}>
              Person 2 Matrix
            </TabsTrigger>
            <TabsTrigger value="combined" disabled={combinedData.length === 0}>
              Combined Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="person1">{renderPersonData(person1)}</TabsContent>

          <TabsContent value="person2">{renderPersonData(person2)}</TabsContent>

          <TabsContent value="combined">{renderCombinedData()}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

