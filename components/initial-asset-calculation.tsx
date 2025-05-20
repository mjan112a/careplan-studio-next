"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/utils/format"
import type { Person } from "@/types/person"
import { getFullPolicyData } from "@/types/policy-data"

interface InitialAssetCalculationProps {
  person: Person
  personIndex?: number
}

export function InitialAssetCalculation({ person, personIndex = 0 }: InitialAssetCalculationProps) {
  const [activeTab, setActiveTab] = useState<string>("with-policy")

  // Get policy data
  const policyData = getFullPolicyData()
  const hasPolicyData = policyData && policyData.length > personIndex && personIndex >= 0
  const personPolicy = hasPolicyData ? policyData[personIndex] : null

  // Get initial premium amount
  const getInitialPremium = () => {
    if (!person.policyEnabled) return 0

    if (hasPolicyData && personPolicy) {
      return personPolicy.policy_level_information.initial_premium
    }

    return person.policyAnnualPremium
  }

  const initialPremium = getInitialPremium()

  // Calculate initial premium withdrawal (including tax)
  const initialPremiumWithdrawal = person.initialPremiumFromAssets
    ? initialPremium / (1 - person.retirementAssetsTaxRate)
    : 0

  const taxOnInitialPremium = initialPremiumWithdrawal * person.retirementAssetsTaxRate

  // Calculate first year premium withdrawal (if paying from assets before retirement)
  const firstYearPremiumWithdrawal =
    !person.initialPremiumFromAssets && person.premiumsFromAssetsPreRetirement && person.policyEnabled
      ? initialPremium / (1 - person.retirementAssetsTaxRate)
      : 0

  const taxOnFirstYearPremium = firstYearPremiumWithdrawal * person.retirementAssetsTaxRate

  // Calculate first year ending assets
  const firstYearEndingAssets =
    person.retirementSavings - initialPremiumWithdrawal - firstYearPremiumWithdrawal + person.annualSavings

  // Calculate comparison (without policy)
  const withoutPolicyEndingAssets = person.retirementSavings + person.annualSavings

  // Calculate the difference
  const difference = firstYearEndingAssets - withoutPolicyEndingAssets

  return (
    <Card className="w-full mt-4" style={{ display: "none" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Initial Asset Calculation</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="with-policy">With Policy</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="with-policy" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Starting Retirement Savings:</span>
                <span className="font-medium">{formatCurrency(person.retirementSavings)}</span>
              </div>

              {person.policyEnabled && person.initialPremiumFromAssets && initialPremium > 0 && (
                <>
                  <div className="flex justify-between text-red-600">
                    <span>Initial Premium Payment:</span>
                    <span>- {formatCurrency(initialPremium)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Tax on Initial Premium:</span>
                    <span>- {formatCurrency(taxOnInitialPremium)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground italic pl-4">
                    (Premium paid from assets because "Pay Initial Premium from Assets" is enabled)
                  </div>
                </>
              )}

              {person.policyEnabled &&
                !person.initialPremiumFromAssets &&
                person.premiumsFromAssetsPreRetirement &&
                initialPremium > 0 && (
                  <>
                    <div className="flex justify-between text-red-600">
                      <span>First Year Premium Withdrawal:</span>
                      <span>- {formatCurrency(firstYearPremiumWithdrawal - taxOnFirstYearPremium)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Tax on Premium Withdrawal:</span>
                      <span>- {formatCurrency(taxOnFirstYearPremium)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground italic pl-4">
                      (Premium paid from assets because "Pay Premiums from Assets Before Retirement" is enabled)
                    </div>
                  </>
                )}

              <div className="flex justify-between text-green-600">
                <span>Annual Savings Addition:</span>
                <span>+ {formatCurrency(person.annualSavings)}</span>
              </div>

              <div className="border-t pt-2 flex justify-between font-bold">
                <span>First-Year Ending Assets:</span>
                <span>{formatCurrency(firstYearEndingAssets)}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 border-r pr-4">
                <h3 className="font-bold">With Policy</h3>
                <div className="flex justify-between">
                  <span>Starting Assets:</span>
                  <span>{formatCurrency(person.retirementSavings)}</span>
                </div>

                {person.policyEnabled && person.initialPremiumFromAssets && initialPremium > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Initial Premium:</span>
                    <span>- {formatCurrency(initialPremiumWithdrawal)}</span>
                  </div>
                )}

                {person.policyEnabled &&
                  !person.initialPremiumFromAssets &&
                  person.premiumsFromAssetsPreRetirement &&
                  initialPremium > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>First Year Premium:</span>
                      <span>- {formatCurrency(firstYearPremiumWithdrawal)}</span>
                    </div>
                  )}

                <div className="flex justify-between text-green-600">
                  <span>Annual Savings:</span>
                  <span>+ {formatCurrency(person.annualSavings)}</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Ending Assets:</span>
                  <span>{formatCurrency(firstYearEndingAssets)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold">Without Policy</h3>
                <div className="flex justify-between">
                  <span>Starting Assets:</span>
                  <span>{formatCurrency(person.retirementSavings)}</span>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>Annual Savings:</span>
                  <span>+ {formatCurrency(person.annualSavings)}</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Ending Assets:</span>
                  <span>{formatCurrency(withoutPolicyEndingAssets)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Difference in First-Year Assets:</span>
              <span className={difference >= 0 ? "text-green-600" : "text-red-600"}>
                {difference >= 0 ? "+" : ""}
                {formatCurrency(difference)}
              </span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
