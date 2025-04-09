"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "../utils/calculation-utils"
import type { Person } from "../types/financial-types"

interface KeySlidersProps {
  person: Person
  onChange: (updatedPerson: Person) => void
}

export default function KeySliders({ person, onChange }: KeySlidersProps) {
  // Create local state to track form values
  const [formValues, setFormValues] = useState<Person>(person)

  // Update local state when props change
  useEffect(() => {
    setFormValues(person)
  }, [person])

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

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Key Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Annual Income */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor={`annual-income-${formValues.id}`} className="text-base font-medium">
                Annual Income
              </Label>
              <span className="text-lg font-semibold">{formatCurrency(formValues.annualIncome)}</span>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                className="flex-grow h-6"
                min={0}
                max={500000}
                step={5000}
                value={[formValues.annualIncome]}
                onValueChange={(value) => handleChange("annualIncome", value[0])}
              />
              <Input
                id={`annual-income-${formValues.id}`}
                type="number"
                value={formValues.annualIncome}
                onChange={(e) => handleNumberChange("annualIncome", e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          {/* 401(k) Balance */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor={`401k-balance-${formValues.id}`} className="text-base font-medium">
                401(k) Balance
              </Label>
              <span className="text-lg font-semibold">{formatCurrency(formValues.fourOhOneKBalance)}</span>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                className="flex-grow h-6"
                min={0}
                max={2000000}
                step={10000}
                value={[formValues.fourOhOneKBalance]}
                onValueChange={(value) => handleChange("fourOhOneKBalance", value[0])}
              />
              <Input
                id={`401k-balance-${formValues.id}`}
                type="number"
                value={formValues.fourOhOneKBalance}
                onChange={(e) => handleNumberChange("fourOhOneKBalance", e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          {/* Annual Contribution */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor={`annual-contribution-${formValues.id}`} className="text-base font-medium">
                Annual Retirement Savings
              </Label>
              <span className="text-lg font-semibold">{formatCurrency(formValues.annualContribution)}</span>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                className="flex-grow h-6"
                min={0}
                max={30000}
                step={500}
                value={[formValues.annualContribution]}
                onValueChange={(value) => handleChange("annualContribution", value[0])}
              />
              <Input
                id={`annual-contribution-${formValues.id}`}
                type="number"
                value={formValues.annualContribution}
                onChange={(e) => handleNumberChange("annualContribution", e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          {/* Income Replacement Ratio */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor={`income-replacement-${formValues.id}`} className="text-base font-medium">
                Income Replacement Ratio
              </Label>
              <span className="text-lg font-semibold">{Math.round(formValues.incomeReplacement * 100)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                id={`income-replacement-${formValues.id}`}
                className="flex-grow h-6"
                min={0}
                max={1}
                step={0.01}
                value={[formValues.incomeReplacement]}
                onValueChange={(value) => handleChange("incomeReplacement", value[0])}
              />
              <div className="w-32 text-sm text-gray-600">
                <span>Retirement Income:</span>
                <span className="block font-medium">
                  {formatCurrency(formValues.annualIncome * formValues.incomeReplacement)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

