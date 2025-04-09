"use client"

import type { Person } from "../types/financial-types"
import { formatCurrency } from "../utils/calculation-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Tooltip from "./tooltip-helper"
import { AlertTriangle } from "lucide-react"

interface SummaryCardProps {
  person: Person
}

export default function SummaryCard({ person }: SummaryCardProps) {
  if (!person.enabled) return null

  // Find the retirement year data
  const retirementYearData = person.retirementData.find((d) => d.age === person.retirementAge)

  // Find the LTC event year data
  const ltcEventYearData = person.ltcEventEnabled
    ? person.retirementData.find((d) => d.age === person.ltcEventAge)
    : null

  // Find the death year data
  const deathYearData = person.retirementData.find((d) => d.age === person.deathAge)

  // Find the final year data
  const finalYearData = person.retirementData[person.retirementData.length - 1]

  // Check if person is bankrupt
  const isBankrupt = person.bankrupt || false
  const bankruptAge = person.bankruptAge || 0

  // Calculate total policy income during LTC events
  const totalPolicyIncome = person.retirementData.reduce((sum, year) => sum + year.policyIncome, 0)

  // Calculate total policy premium
  const totalPolicyPremium = person.retirementData.reduce((sum, year) => sum + year.policyPremium, 0)

  // Get legacy amount (death benefit at death age)
  const legacyAmount = person.legacyAmount || 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">{person.name} Summary</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal">
              Policy:{" "}
              <span className={person.policyEnabled ? "text-green-600" : "text-red-600"}>
                {person.policyEnabled ? "Enabled" : "Disabled"}
              </span>
            </span>
            {isBankrupt && (
              <div className="flex items-center text-red-600 text-sm font-normal">
                <AlertTriangle className="mr-1" size={16} />
                Assets depleted at age {bankruptAge}
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2 p-3 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium flex items-center gap-1">
              Retirement (Age {person.retirementAge})
              <Tooltip content="Summary of your financial situation at retirement age" />
            </h3>
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Income Needed:</span>
              <span>{formatCurrency(retirementYearData?.incomeNeeded || 0)}/year</span>
            </p>
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Income Gap:</span>
              <span>{formatCurrency(retirementYearData?.incomeGap || 0)}/year</span>
            </p>
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Assets at Retirement:</span>
              <span>{formatCurrency(retirementYearData?.netWorth || 0)}</span>
            </p>
          </div>

          {person.ltcEventEnabled && ltcEventYearData && (
            <div className="space-y-2 p-3 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium flex items-center gap-1">
                LTC Event (Age {person.ltcEventAge})
                <Tooltip content="Financial impact during the long-term care event" />
              </h3>
              <p className="text-sm flex justify-between">
                <span className="text-gray-600">Annual LTC Cost:</span>
                <span>{formatCurrency(ltcEventYearData.ltcCosts)}</span>
              </p>
              {person.policyEnabled && ltcEventYearData.policyIncome > 0 && (
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">LTC Benefits:</span>
                  <span className="text-green-600">{formatCurrency(ltcEventYearData.policyIncome)}/year</span>
                </p>
              )}
              <p className="text-sm flex justify-between">
                <span className="text-gray-600">Out-of-Pocket:</span>
                <span>{formatCurrency(ltcEventYearData.ltcOutOfPocket)}</span>
              </p>
              <p className="text-sm flex justify-between">
                <span className="text-gray-600">Coverage Ratio:</span>
                <span>
                  {ltcEventYearData.ltcCosts > 0
                    ? Math.round((ltcEventYearData.ltcBenefits / ltcEventYearData.ltcCosts) * 100)
                    : 0}
                  %
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2 p-3 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium flex items-center gap-1">
              {isBankrupt ? `Outcome at Age ${bankruptAge}` : "Final Outcome (Age 95)"}
              <Tooltip
                content={
                  isBankrupt
                    ? `Financial situation at age ${bankruptAge} when assets were depleted`
                    : "Projected financial situation at age 95"
                }
              />
            </h3>
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Final Assets (With Policy):</span>
              <span>{formatCurrency(isBankrupt ? 0 : finalYearData?.netWorth || 0)}</span>
            </p>
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Final Assets (No Policy):</span>
              <span>{formatCurrency(isBankrupt ? 0 : finalYearData?.netWorthNoPolicyScenario || 0)}</span>
            </p>
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Difference:</span>
              <span
                className={
                  (finalYearData?.netWorth || 0) - (finalYearData?.netWorthNoPolicyScenario || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {formatCurrency((finalYearData?.netWorth || 0) - (finalYearData?.netWorthNoPolicyScenario || 0))}
              </span>
            </p>
          </div>

          <div className="space-y-2 p-3 bg-green-50 rounded-md">
            <h3 className="text-sm font-medium flex items-center gap-1">
              Policy Impact
              <Tooltip content="Overall impact of the policy on your long-term care costs" />
            </h3>
            {person.policyEnabled && (
              <p className="text-sm flex justify-between">
                <span className="text-gray-600">Total Premium Paid:</span>
                <span className="text-red-600">-{formatCurrency(totalPolicyPremium)}</span>
              </p>
            )}
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Total LTC Costs:</span>
              <span>{formatCurrency(person.totalLtcNeeded)}</span>
            </p>
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Total LTC Coverage:</span>
              <span>{formatCurrency(person.totalLtcCovered)}</span>
            </p>
            {person.policyEnabled && totalPolicyIncome > 0 && (
              <p className="text-sm flex justify-between">
                <span className="text-gray-600">Total LTC Benefits:</span>
                <span className="text-green-600">{formatCurrency(totalPolicyIncome)}</span>
              </p>
            )}
            <p className="text-sm flex justify-between">
              <span className="text-gray-600">Coverage Ratio:</span>
              <span>
                {person.totalLtcNeeded > 0 ? Math.round((person.totalLtcCovered / person.totalLtcNeeded) * 100) : 0}%
              </span>
            </p>
          </div>

          {/* New Legacy section */}
          {person.policyEnabled && (
            <div className="space-y-2 p-3 bg-purple-50 rounded-md col-span-1 md:col-span-2 lg:col-span-4">
              <h3 className="text-sm font-medium flex items-center gap-1">
                Legacy (Age {person.deathAge})
                <Tooltip content="Death benefit that would be paid to heirs at death" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <p className="text-sm flex justify-between">
                  <span className="text-gray-600">Death Benefit:</span>
                  <span className="text-green-600">{formatCurrency(legacyAmount)}</span>
                </p>
                {deathYearData && (
                  <>
                    <p className="text-sm flex justify-between">
                      <span className="text-gray-600">Retirement Assets at Death:</span>
                      <span>{formatCurrency(deathYearData.assets401k)}</span>
                    </p>
                    <p className="text-sm flex justify-between">
                      <span className="text-gray-600">Total to Heirs:</span>
                      <span className="font-medium">{formatCurrency(legacyAmount + deathYearData.assets401k)}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {isBankrupt && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="text-sm font-medium text-red-700">Financial Sustainability Alert</h4>
                <p className="text-xs text-red-600 mt-1">
                  Your retirement assets are projected to be depleted by age {bankruptAge}. Consider adjusting your
                  retirement strategy by:
                </p>
                <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                  <li>Increasing retirement savings</li>
                  <li>Reducing planned retirement expenses</li>
                  <li>Delaying retirement</li>
                  <li>Increasing policy coverage for long-term care</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

