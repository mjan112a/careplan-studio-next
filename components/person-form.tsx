"use client"

import type { Person, PolicyData } from "../types/financial-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "../utils/calculation-utils"

// Helper function to interpolate between two policy data points
const interpolate = (a: number, b: number, ratio: number): number => {
  return a + (b - a) * ratio
}

// Helper function to find the appropriate policy data for a given year
const findPolicyDataForYear = (policyData: PolicyData[], policyYear: number): PolicyData => {
  // If policy year is less than 1, use the first year
  if (policyYear < 1) return policyData[0]

  // Try to find exact match
  const exactMatch = policyData.find((p) => p.year === policyYear)
  if (exactMatch) return exactMatch

  // Find the closest years before and after
  const sortedData = [...policyData].sort((a, b) => a.year - b.year)

  // If policy year is beyond the last year in data, use the last year
  if (policyYear > sortedData[sortedData.length - 1].year) {
    return sortedData[sortedData.length - 1]
  }

  // Find the years that bracket the policy year
  let lowerIndex = 0
  for (let i = 0; i < sortedData.length; i++) {
    if (sortedData[i].year < policyYear) {
      lowerIndex = i
    } else {
      break
    }
  }

  const upperIndex = lowerIndex + 1

  // If we can't interpolate (shouldn't happen with our checks above), return the closest
  if (upperIndex >= sortedData.length) return sortedData[lowerIndex]

  const lowerYear = sortedData[lowerIndex].year
  const upperYear = sortedData[upperIndex].year

  // Calculate how far between the two years we are (0 to 1)
  const ratio = (policyYear - lowerYear) / (upperYear - lowerYear)

  // Interpolate between the two policy data points
  return {
    year: policyYear,
    premium: interpolate(sortedData[lowerIndex].premium, sortedData[upperIndex].premium, ratio),
    cashValue: interpolate(sortedData[lowerIndex].cashValue, sortedData[upperIndex].cashValue, ratio),
    deathBenefit: interpolate(sortedData[lowerIndex].deathBenefit, sortedData[upperIndex].deathBenefit, ratio),
    totalLTCBenefit: interpolate(sortedData[lowerIndex].totalLTCBenefit, sortedData[upperIndex].totalLTCBenefit, ratio),
    aobMonthly: interpolate(sortedData[lowerIndex].aobMonthly, sortedData[upperIndex].aobMonthly, ratio),
    cobMonthly: interpolate(sortedData[lowerIndex].cobMonthly, sortedData[upperIndex].cobMonthly, ratio),
  }
}

interface PersonFormProps {
  person: Person
  onChange: (updatedPerson: Person) => void
}

export default function PersonForm({ person, onChange }: PersonFormProps) {
  // Create local state to track form values
  const [formValues, setFormValues] = useState<Person>(person)

  // Update local state when props change
  useEffect(() => {
    setFormValues(person)
  }, [person])

  // Generate complete policy data for all years
  const completeYearlyPolicyData = useMemo(() => {
    const result: PolicyData[] = []
    // Get the max year from the policy data
    const maxYear = Math.max(...formValues.policyData.map((data) => data.year))

    // Generate data for each year from 1 to maxYear
    for (let year = 1; year <= maxYear; year++) {
      result.push(findPolicyDataForYear(formValues.policyData, year))
    }

    return result
  }, [formValues.policyData])

  const handleChange = (field: keyof Person, value: any) => {
    // Update local state
    const updatedPerson = {
      ...formValues,
      [field]: value,
    }
    setFormValues(updatedPerson)

    // Immediately notify parent component
    onChange(updatedPerson)
  }

  const handleNumberChange = (field: keyof Person, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      handleChange(field, numValue)
    }
  }

  // Special handler for LTC event age to ensure immediate updates
  const handleLtcEventAgeChange = (value: number) => {
    handleChange("ltcEventAge", value)
  }

  // COMPLETELY REWRITTEN policy toggle handler
  const handlePolicyToggle = () => {
    // Get the current policy status
    const currentStatus = formValues.policyEnabled

    // Log the current status and the change we're about to make
    console.log(`POLICY TOGGLE: Current status: ${currentStatus}, changing to: ${!currentStatus}`)

    // Create a completely new person object with the updated policy status
    const updatedPerson = {
      ...formValues,
      policyEnabled: !currentStatus,
    }

    // Log the new person object
    console.log("POLICY TOGGLE: New person object:", updatedPerson)

    // Update local state
    setFormValues(updatedPerson)

    // Immediately notify parent component with the new object
    onChange(updatedPerson)

    // Log that we've completed the toggle
    console.log(`POLICY TOGGLE: Toggle complete, new status: ${!currentStatus}`)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={formValues.enabled}
              onCheckedChange={(checked) => handleChange("enabled", checked)}
              id={`enable-${formValues.id}`}
            />
            <Input value={formValues.name} onChange={(e) => handleChange("name", e.target.value)} className="w-40" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financial">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="ltc">LTC Event</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
            <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
            <TabsTrigger value="policyData">Policy Data</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`current-age-${formValues.id}`}>Current Age</Label>
                <Input
                  id={`current-age-${formValues.id}`}
                  type="number"
                  value={formValues.currentAge}
                  onChange={(e) => handleNumberChange("currentAge", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`retirement-age-${formValues.id}`}>Retirement Age</Label>
                <Input
                  id={`retirement-age-${formValues.id}`}
                  type="number"
                  value={formValues.retirementAge}
                  onChange={(e) => handleNumberChange("retirementAge", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`pay-raise-${formValues.id}`}>Annual Pay Raise (%)</Label>
                <Input
                  id={`pay-raise-${formValues.id}`}
                  type="number"
                  value={formValues.payRaise}
                  onChange={(e) => handleNumberChange("payRaise", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`social-security-${formValues.id}`}>Expected Social Security</Label>
                <Input
                  id={`social-security-${formValues.id}`}
                  type="number"
                  value={formValues.expectedSocialSecurity}
                  onChange={(e) => handleNumberChange("expectedSocialSecurity", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`pension-${formValues.id}`}>Other Annual Income (Pension, annuity, etc.)</Label>
                <Input
                  id={`pension-${formValues.id}`}
                  type="number"
                  value={formValues.expectedPension}
                  onChange={(e) => handleNumberChange("expectedPension", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ltc" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Switch
                checked={formValues.ltcEventEnabled}
                onCheckedChange={(checked) => handleChange("ltcEventEnabled", checked)}
                id={`ltc-enabled-${formValues.id}`}
              />
              <Label htmlFor={`ltc-enabled-${formValues.id}`}>Enable LTC Event</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`ltc-age-${formValues.id}`}>LTC Event Age</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id={`ltc-age-${formValues.id}`}
                    className="flex-grow"
                    min={formValues.currentAge}
                    max={95}
                    step={1}
                    value={[formValues.ltcEventAge]}
                    onValueChange={(value) => handleLtcEventAgeChange(value[0])}
                    disabled={!formValues.ltcEventEnabled}
                  />
                  <span className="w-12 text-right">{formValues.ltcEventAge}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ltc-duration-${formValues.id}`}>LTC Duration (Years)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id={`ltc-duration-${formValues.id}`}
                    className="flex-grow"
                    min={1}
                    max={10}
                    step={1}
                    value={[formValues.ltcDuration]}
                    onValueChange={(value) => handleChange("ltcDuration", value[0])}
                    disabled={!formValues.ltcEventEnabled}
                  />
                  <span className="w-12 text-right">{formValues.ltcDuration}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ltc-monthly-need-${formValues.id}`}>Monthly LTC Need</Label>
                <Input
                  id={`ltc-monthly-need-${formValues.id}`}
                  type="number"
                  value={formValues.ltcMonthlyNeed}
                  onChange={(e) => handleNumberChange("ltcMonthlyNeed", e.target.value)}
                  disabled={!formValues.ltcEventEnabled}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policy" className="space-y-4 mt-4">
            {/* COMPLETELY REWRITTEN policy toggle UI */}
            <div className="p-4 border rounded-md bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formValues.policyEnabled}
                    onCheckedChange={handlePolicyToggle}
                    id={`policy-enabled-${formValues.id}`}
                  />
                  <Label htmlFor={`policy-enabled-${formValues.id}`} className="font-bold">
                    Enable Policy
                  </Label>
                </div>
                <Badge variant={formValues.policyEnabled ? "default" : "destructive"}>
                  {formValues.policyEnabled ? "ENABLED" : "DISABLED"}
                </Badge>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                {formValues.policyEnabled
                  ? "Policy is active and providing benefits during LTC events"
                  : "Policy is inactive (no premiums, no benefits)"}
              </div>

              <Button
                type="button"
                onClick={handlePolicyToggle}
                variant={formValues.policyEnabled ? "destructive" : "default"}
                className="w-full"
              >
                {formValues.policyEnabled ? "Disable Policy" : "Enable Policy"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formValues.isPremiumSingle}
                  onCheckedChange={(checked) => handleChange("isPremiumSingle", checked)}
                  id={`premium-single-${formValues.id}`}
                  disabled={!formValues.policyEnabled}
                />
                <Label htmlFor={`premium-single-${formValues.id}`}>Single Premium</Label>
              </div>

              {!formValues.isPremiumSingle && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`annual-premium-${formValues.id}`}>Annual Premium</Label>
                    <Input
                      id={`annual-premium-${formValues.id}`}
                      type="number"
                      value={formValues.annualPremiumAmount}
                      onChange={(e) => handleNumberChange("annualPremiumAmount", e.target.value)}
                      disabled={!formValues.policyEnabled || formValues.isPremiumSingle}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`premium-years-${formValues.id}`}>Premium Payment Years</Label>
                    <Input
                      id={`premium-years-${formValues.id}`}
                      type="number"
                      value={formValues.premiumYears}
                      onChange={(e) => handleNumberChange("premiumYears", e.target.value)}
                      disabled={!formValues.policyEnabled || formValues.isPremiumSingle}
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assumptions" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`asset-return-${formValues.id}`}>Asset Return Rate (%)</Label>
                <Input
                  id={`asset-return-${formValues.id}`}
                  type="number"
                  value={formValues.assetReturnRate}
                  onChange={(e) => handleNumberChange("assetReturnRate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`retirement-return-${formValues.id}`}>Retirement Return Rate (%)</Label>
                <Input
                  id={`retirement-return-${formValues.id}`}
                  type="number"
                  value={formValues.retirementReturnRate}
                  onChange={(e) => handleNumberChange("retirementReturnRate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`inflation-${formValues.id}`}>General Inflation Rate (%)</Label>
                <Input
                  id={`inflation-${formValues.id}`}
                  type="number"
                  value={formValues.generalInflationRate}
                  onChange={(e) => handleNumberChange("generalInflationRate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`ltc-inflation-${formValues.id}`}>LTC Inflation Rate (%)</Label>
                <Input
                  id={`ltc-inflation-${formValues.id}`}
                  type="number"
                  value={formValues.ltcInflationRate}
                  onChange={(e) => handleNumberChange("ltcInflationRate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`death-age-${formValues.id}`}>Death Age (for Legacy Calculation)</Label>
                <Input
                  id={`death-age-${formValues.id}`}
                  type="number"
                  value={formValues.deathAge}
                  onChange={(e) => handleNumberChange("deathAge", e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policyData" className="space-y-4 mt-4">
            <div className="max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Cash Value</TableHead>
                    <TableHead>Death Benefit</TableHead>
                    <TableHead>Total LTC Benefit</TableHead>
                    <TableHead>AOB Monthly</TableHead>
                    <TableHead>COB Monthly</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completeYearlyPolicyData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>{data.year}</TableCell>
                      <TableCell>{formatCurrency(data.premium)}</TableCell>
                      <TableCell>{formatCurrency(data.cashValue)}</TableCell>
                      <TableCell>{formatCurrency(data.deathBenefit)}</TableCell>
                      <TableCell>{formatCurrency(data.totalLTCBenefit)}</TableCell>
                      <TableCell>{formatCurrency(data.aobMonthly)}</TableCell>
                      <TableCell>{formatCurrency(data.cobMonthly)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

