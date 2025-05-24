"use client"
import type { Person } from "@/types/person"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/utils/format"
import { getPolicyDataForPerson } from "@/types/policy-data"

// Import the Tooltip component at the top of the file
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

interface PersonFormProps {
  person: Person
  onChange: (person: Person) => void
  title?: string
  personIndex?: number
}

export function PersonForm({ person, onChange, title = "Person", personIndex = 0 }: PersonFormProps) {
  const handleChange = (field: keyof Person, value: any) => {
    onChange({ ...person, [field]: value })
  }

  // Handle tax rate change with validation
  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string for user typing
    if (value === "") {
      handleChange("retirementAssetsTaxRate", 0)
      return
    }

    // Parse the percentage value
    const numValue = Number.parseFloat(value) / 100

    // Validate the range (0-100%)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
      handleChange("retirementAssetsTaxRate", numValue)
    }
  }

  // Get policy data for this person
  const policyData = getPolicyDataForPerson(personIndex)
  const hasPolicyData = !!policyData

  // Calculate total LTC benefit available
  const calculateTotalLTCBenefit = () => {
    if (!policyData || !person.ltcEventEnabled) return 0

    let totalBenefit = 0
    for (let i = 0; i < person.ltcDuration; i++) {
      const age = person.ltcEventAge + i
      const annualData = policyData.annual_policy_data.find((data) => data.insured_age === age)
      if (annualData) {
        totalBenefit += annualData.annual_ltc_benefit || 0
      }
    }
    return totalBenefit
  }

  const totalLTCBenefit = calculateTotalLTCBenefit()

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="retirement">Retirement</TabsTrigger>
            <TabsTrigger value="ltc">LTC Event</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={person.name} onChange={(e) => handleChange("name", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={30}
                  max={85}
                  value={person.age}
                  onChange={(e) => handleChange("age", Number.parseInt(e.target.value) || person.age)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="income">Annual Income: {formatCurrency(person.income)}</Label>
                <Slider
                  id="income"
                  min={0}
                  max={500000}
                  step={5000}
                  value={[person.income]}
                  onValueChange={(value) => handleChange("income", value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retirementSavings">
                  Retirement Savings: {formatCurrency(person.retirementSavings)}
                </Label>
                <Slider
                  id="retirementSavings"
                  min={0}
                  max={2000000}
                  step={10000}
                  value={[person.retirementSavings]}
                  onValueChange={(value) => handleChange("retirementSavings", value[0])}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualSavings">Annual Savings: {formatCurrency(person.annualSavings)}</Label>
                <Slider
                  id="annualSavings"
                  min={0}
                  max={50000}
                  step={1000}
                  value={[person.annualSavings]}
                  onValueChange={(value) => handleChange("annualSavings", value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deathAge">Death Age</Label>
                <Input
                  id="deathAge"
                  type="number"
                  min={person.age + 1}
                  max={110}
                  value={person.deathAge}
                  onChange={(e) => handleChange("deathAge", Number.parseInt(e.target.value) || person.deathAge)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preRetirementAssetReturns" className="flex items-center">
                  Pre-Retirement Returns: {(person.preRetirementAssetReturns * 100).toFixed(1)}%
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Expected annual return on retirement assets before retirement. Typically higher than
                          post-retirement returns due to more aggressive investment strategy.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Slider
                  id="preRetirementAssetReturns"
                  min={0.01}
                  max={0.12}
                  step={0.005}
                  value={[person.preRetirementAssetReturns]}
                  onValueChange={(value) => handleChange("preRetirementAssetReturns", value[0])}
                />
              </div>
              <div className="space-y-2">{/* Empty div to maintain grid layout */}</div>
            </div>
          </TabsContent>

          <TabsContent value="retirement" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retirementAge">Retirement Age: {person.retirementAge}</Label>
                <Slider
                  id="retirementAge"
                  min={Math.max(person.age, 50)}
                  max={85}
                  step={1}
                  value={[person.retirementAge]}
                  onValueChange={(value) => handleChange("retirementAge", value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incomeReplacementRatio">
                  Gross Income Replacement: {(person.incomeReplacementRatio * 100).toFixed(0)}%
                </Label>
                <Slider
                  id="incomeReplacementRatio"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[person.incomeReplacementRatio]}
                  onValueChange={(value) => handleChange("incomeReplacementRatio", value[0])}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="socialSecurityIncome">
                  Social Security: {formatCurrency(person.socialSecurityIncome)}
                </Label>
                <Slider
                  id="socialSecurityIncome"
                  min={0}
                  max={50000}
                  step={1000}
                  value={[person.socialSecurityIncome]}
                  onValueChange={(value) => handleChange("socialSecurityIncome", value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherRetirementIncome">
                  Other Income: {formatCurrency(person.otherRetirementIncome)}
                </Label>
                <Slider
                  id="otherRetirementIncome"
                  min={0}
                  max={100000}
                  step={1000}
                  value={[person.otherRetirementIncome]}
                  onValueChange={(value) => handleChange("otherRetirementIncome", value[0])}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualPayIncrease">
                  Annual Pay Increase: {(person.annualPayIncrease * 100).toFixed(1)}%
                </Label>
                <Slider
                  id="annualPayIncrease"
                  min={0}
                  max={0.1}
                  step={0.005}
                  value={[person.annualPayIncrease]}
                  onValueChange={(value) => handleChange("annualPayIncrease", value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetReturns" className="flex items-center">
                  Retirement Returns: {(person.assetReturns * 100).toFixed(1)}%
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Expected annual return on retirement assets during retirement. Typically lower than
                          pre-retirement returns due to more conservative investment strategy.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Slider
                  id="assetReturns"
                  min={0.01}
                  max={0.12}
                  step={0.005}
                  value={[person.assetReturns]}
                  onValueChange={(value) => handleChange("assetReturns", value[0])}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retirementAssetsTaxRate">Retirement Assets Tax Rate (%)</Label>
                <Input
                  id="retirementAssetsTaxRate"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={(person.retirementAssetsTaxRate * 100).toFixed(0)}
                  onChange={handleTaxRateChange}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">{/* Empty div to maintain grid layout */}</div>
            </div>
          </TabsContent>

          <TabsContent value="ltc" className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="ltcEventEnabled"
                checked={person.ltcEventEnabled}
                onCheckedChange={(checked) => handleChange("ltcEventEnabled", checked)}
              />
              <Label htmlFor="ltcEventEnabled">Enable LTC Event</Label>
            </div>

            {person.ltcEventEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ltcEventAge">LTC Event Age: {person.ltcEventAge}</Label>
                    <Slider
                      id="ltcEventAge"
                      min={person.age}
                      max={person.deathAge - 1}
                      step={1}
                      value={[person.ltcEventAge]}
                      onValueChange={(value) => handleChange("ltcEventAge", value[0])}
                    />
                    {hasPolicyData && (
                      <div className="text-sm text-muted-foreground">
                        Total LTC Benefit Available: {formatCurrency(totalLTCBenefit)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ltcDuration">LTC Duration (years)</Label>
                    <Input
                      id="ltcDuration"
                      type="number"
                      min={1}
                      max={10}
                      value={person.ltcDuration}
                      onChange={(e) =>
                        handleChange("ltcDuration", Number.parseInt(e.target.value) || person.ltcDuration)
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ltcCostPerYear">LTC Cost Per Year: {formatCurrency(person.ltcCostPerYear)}</Label>
                  <Slider
                    id="ltcCostPerYear"
                    min={50000}
                    max={300000}
                    step={10000}
                    value={[person.ltcCostPerYear]}
                    onValueChange={(value) => handleChange("ltcCostPerYear", value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ltcInflation">LTC Inflation: {(person.ltcInflation * 100).toFixed(1)}%</Label>
                  <Slider
                    id="ltcInflation"
                    min={0.01}
                    max={0.1}
                    step={0.005}
                    value={[person.ltcInflation]}
                    onValueChange={(value) => handleChange("ltcInflation", value[0])}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="policy" className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="policyEnabled"
                checked={person.policyEnabled}
                onCheckedChange={(checked) => handleChange("policyEnabled", checked)}
              />
              <Label htmlFor="policyEnabled">Enable LTC Policy</Label>
            </div>

            {person.policyEnabled && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="initialPremiumFromAssets"
                    checked={person.initialPremiumFromAssets}
                    onCheckedChange={(checked) => handleChange("initialPremiumFromAssets", checked)}
                  />
                  <Label htmlFor="initialPremiumFromAssets" className="flex items-center">
                    Pay Initial Premium from Assets
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            When enabled, the initial premium payment will be deducted from retirement assets with tax
                            implications. When disabled, the initial premium is paid from another source with no impact
                            on assets.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                </div>

                {/* New toggle for pre-retirement premium source */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="premiumsFromAssetsPreRetirement"
                    checked={person.premiumsFromAssetsPreRetirement}
                    onCheckedChange={(checked) => handleChange("premiumsFromAssetsPreRetirement", checked)}
                  />
                  <Label htmlFor="premiumsFromAssetsPreRetirement" className="flex items-center">
                    Pay Premiums from Assets Before Retirement
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            When enabled, premium payments before retirement will be deducted from retirement assets.
                            When disabled, premiums are assumed to be paid from current income.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="policyLoanEnabled"
                      checked={person.policyLoanEnabled}
                      onCheckedChange={(checked) => handleChange("policyLoanEnabled", checked)}
                    />
                    <Label htmlFor="policyLoanEnabled">Enable Policy Loans</Label>
                  </div>

                  {person.policyLoanEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="policyLoanRate">Policy Loan Rate (%)</Label>
                      <Input
                        id="policyLoanRate"
                        type="number"
                        min={0}
                        max={15}
                        step={0.25}
                        value={(person.policyLoanRate * 100).toFixed(2)}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "") {
                            handleChange("policyLoanRate", 0)
                            return
                          }
                          const numValue = Number.parseFloat(value) / 100
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 0.15) {
                            handleChange("policyLoanRate", numValue)
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
