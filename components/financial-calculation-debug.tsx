"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { YearlyFinancialData } from "@/utils/financial-calculations"
import { formatCurrency, formatPercentage } from "@/utils/format"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { useState, useRef, useEffect } from "react"
import { MobileFriendlyTooltip } from "./mobile-friendly-tooltip"

interface FinancialCalculationDebugProps {
  data: YearlyFinancialData[]
  title?: string
  showRetirementAge?: boolean
  retirementAge?: number
  ltcEventAge?: number
  preRetirementAssetReturns: number
  assetReturns: number
  annualSavings?: number
}

export function FinancialCalculationDebug({
  data,
  title = "Financial Details",
  showRetirementAge = true,
  retirementAge = 65,
  ltcEventAge = 75,
  preRetirementAssetReturns,
  assetReturns,
  annualSavings = 0,
}: FinancialCalculationDebugProps) {
  // State to track the tooltip data
  const [tooltipData, setTooltipData] = useState<any>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Format data for the chart
  const chartData = data.map((item) => ({
    age: item.age,
    isRetired: item.age >= retirementAge,
    assets: Math.round(item.assets || 0),
    policyValue: Math.round(item.policyValue || 0),
    totalAssets: Math.round((item.assets || 0) + (item.policyValue || 0)),
    assetsWithoutPolicy: Math.round(item.assets || 0),
    netCashFlow: Math.round(item.netCashFlow || 0),
    withdrawal: -Math.round(item.withdrawal || 0), // Make negative
    taxOnWithdrawal: -Math.round(item.taxOnWithdrawal || 0), // Make negative
    hasLTCEvent: item.hasLTCEvent,
    policyLoanTaken: -Math.round(item.policyLoanTaken || 0), // Make negative
    policyLoanInterest: -Math.round(item.policyLoanInterest || 0),
    policyLoanBalance: Math.round(item.policyLoanBalance || 0),
    workIncome: Math.round(item.workIncome || 0),
    socialSecurityIncome: Math.round(item.socialSecurityIncome || 0),
    otherRetirementIncome: Math.round(item.otherRetirementIncome || 0),
    basicExpenses: -Math.round(item.basicExpenses || 0), // Make negative
    ltcExpenses: -Math.round(item.ltcExpenses || 0), // Make negative
    premiumExpenses: -Math.round(item.premiumExpenses || 0), // Make negative
    ltcBenefits: Math.round(item.ltcBenefits || 0),
    appliedGrowthRate: item.appliedGrowthRate || 0,
    originalPolicyValue: Math.round(item.originalPolicyValue || 0),
    originalDeathBenefit: Math.round(item.originalDeathBenefit || 0),
  }))

  // Function to start the auto-hide timer
  const startAutoHideTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Set a new timer to hide the tooltip after 5 seconds
    timerRef.current = setTimeout(() => {
      setTooltipData(null)
    }, 5000) // 5000 milliseconds = 5 seconds
  }

  // Effect to handle tooltip visibility and timer
  useEffect(() => {
    // When tooltip data changes (new tooltip shown), start the timer
    if (tooltipData) {
      startAutoHideTimer()
    }

    // Cleanup function to clear the timer when component unmounts
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [tooltipData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Get the data for this age
      const ageData = chartData.find((d) => d.age === label)

      if (!ageData) return null

      // Update the tooltip data state and reset the timer
      setTimeout(() => {
        setTooltipData({ ageData, label })
        startAutoHideTimer() // Reset the timer when hovering over a new data point
      }, 0)

      // Return null as we'll render the tooltip separately
      return null
    }

    return null
  }

  // Render the detailed tooltip content
  const renderTooltipContent = () => {
    if (!tooltipData) return null

    const { ageData, label } = tooltipData

    // Calculate the asset growth rate used for this year
    const assetGrowthRate = ageData.isRetired ? assetReturns : preRetirementAssetReturns

    // Find the previous year's data for comparison
    const prevAgeData = chartData.find((d) => d.age === label - 1)

    // Calculate asset changes
    const startingAssets = prevAgeData ? prevAgeData.assets : ageData.assets

    // Determine if we're in pre-retirement and not in an LTC event
    const isPreRetirementNoLTC = !ageData.isRetired && !ageData.hasLTCEvent

    // Calculate annual savings (only applied in pre-retirement and no LTC event)
    const appliedAnnualSavings = isPreRetirementNoLTC ? annualSavings : 0

    // Calculate asset growth
    const assetGrowthAmount = Math.round(
      (startingAssets + appliedAnnualSavings - Math.abs(ageData.withdrawal)) * assetGrowthRate,
    )

    // Calculate the expected ending assets based on the formula
    const expectedEndingAssets = Math.round(
      (startingAssets + appliedAnnualSavings - Math.abs(ageData.withdrawal)) * (1 + assetGrowthRate),
    )

    // Get the actual ending assets from the data
    const actualEndingAssets = ageData.assets

    // Check if there's a discrepancy
    const hasDiscrepancy = expectedEndingAssets !== actualEndingAssets

    // Calculate policy value changes
    const startingPolicyValue = prevAgeData ? prevAgeData.policyValue : ageData.policyValue
    const endingPolicyValue = ageData.policyValue
    const policyValueChange = endingPolicyValue - startingPolicyValue

    return (
      <div
        ref={tooltipRef}
        className="fixed left-4 top-20 z-50 bg-white p-2 border rounded shadow-lg text-xs max-w-md"
        style={{ width: "400px" }}
        onMouseEnter={() => startAutoHideTimer()} // Reset timer when mouse enters tooltip
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-sm">Age {label} - Financial Details</h3>
          <div className="text-xs text-gray-500">(Auto-hides in 5 seconds)</div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-1">
          <div className="font-semibold">Retirement Status:</div>
          <div>{ageData.isRetired ? "Retired" : "Working"}</div>
          <div className="font-semibold">LTC Event:</div>
          <div>{ageData.hasLTCEvent ? "Yes" : "No"}</div>
        </div>

        <h4 className="font-semibold text-xs border-b pb-0.5 mb-1">Income & Expenses</h4>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-1">
          <div>Work Income:</div>
          <div>{formatCurrency(ageData.workIncome)}</div>
          <div>Social Security:</div>
          <div>{formatCurrency(ageData.socialSecurityIncome)}</div>
          <div>Other Retirement Income:</div>
          <div>{formatCurrency(ageData.otherRetirementIncome)}</div>
          <div>LTC Benefits:</div>
          <div>{formatCurrency(ageData.ltcBenefits)}</div>
          <div>Basic Expenses:</div>
          <div>{formatCurrency(Math.abs(ageData.basicExpenses))}</div>
          <div>LTC Expenses:</div>
          <div>{formatCurrency(Math.abs(ageData.ltcExpenses))}</div>
          <div>Premium Expenses:</div>
          <div>{formatCurrency(Math.abs(ageData.premiumExpenses))}</div>
          <div className="font-semibold">Net Cash Flow:</div>
          <div className={ageData.netCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(ageData.netCashFlow)}
          </div>
        </div>

        <h4 className="font-semibold text-xs border-b pb-0.5 mb-1">Asset Balance Sheet (Detailed)</h4>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mb-1">
          {/* Starting values */}
          <div className="col-span-2 bg-gray-100 mt-1 mb-0.5 px-1 font-semibold">Starting Values:</div>
          <div className="pl-2">Starting Assets (without Policy):</div>
          <div>{formatCurrency(startingAssets)}</div>
          <div className="pl-2">Starting Policy Value:</div>
          <div>{formatCurrency(startingPolicyValue)}</div>
          <div className="pl-2">Starting Total Assets:</div>
          <div>{formatCurrency(startingAssets + startingPolicyValue)}</div>

          {/* Additions */}
          <div className="col-span-2 bg-gray-100 mt-1 mb-0.5 px-1 font-semibold">Additions:</div>

          {isPreRetirementNoLTC && (
            <>
              <div className="pl-2">Annual Savings:</div>
              <div>{formatCurrency(appliedAnnualSavings)}</div>
            </>
          )}

          <div className="pl-2">Asset Growth ({formatPercentage(assetGrowthRate)}):</div>
          <div>{formatCurrency(assetGrowthAmount)}</div>

          {ageData.policyValue > 0 && (
            <>
              <div className="pl-2">Policy Growth ({formatPercentage(ageData.appliedGrowthRate)}):</div>
              <div>{formatCurrency(startingPolicyValue * ageData.appliedGrowthRate)}</div>
            </>
          )}

          <div className="pl-2">LTC Benefits:</div>
          <div>{formatCurrency(ageData.ltcBenefits)}</div>

          <div className="pl-2">Policy Loans Taken:</div>
          <div>{formatCurrency(Math.abs(ageData.policyLoanTaken))}</div>

          {/* Subtractions */}
          <div className="col-span-2 bg-gray-100 mt-1 mb-0.5 px-1 font-semibold">Subtractions:</div>

          <div className="pl-2">Withdrawal for Expenses:</div>
          <div>{formatCurrency(Math.abs(ageData.withdrawal))}</div>

          <div className="pl-2">Tax on Withdrawal:</div>
          <div>{formatCurrency(Math.abs(ageData.taxOnWithdrawal))}</div>

          <div className="pl-2">Policy Loan Interest:</div>
          <div>{formatCurrency(Math.abs(ageData.policyLoanInterest))}</div>

          {/* Result */}
          <div className="col-span-2 border-t border-gray-300 mt-1"></div>

          <div className="font-semibold">Expected Ending Assets (without Policy):</div>
          <div>{formatCurrency(expectedEndingAssets)}</div>

          <div className="font-semibold">Actual Ending Assets (without Policy):</div>
          <div className={hasDiscrepancy ? "text-red-600 font-semibold" : ""}>{formatCurrency(actualEndingAssets)}</div>

          <div className="font-semibold">Ending Policy Value:</div>
          <div>{formatCurrency(endingPolicyValue)}</div>

          <div className="font-semibold">Total Assets (with Policy):</div>
          <div>{formatCurrency(actualEndingAssets + endingPolicyValue)}</div>

          {hasDiscrepancy && (
            <>
              <div className="font-semibold text-red-600">Discrepancy in Assets:</div>
              <div className="text-red-600 font-semibold">
                {formatCurrency(actualEndingAssets - expectedEndingAssets)}
              </div>
            </>
          )}
        </div>

        <h4 className="font-semibold text-xs border-b pb-0.5 mb-1">Detailed Calculation Formulas</h4>
        <div className="text-[10px] mt-0.5 font-mono bg-gray-100 p-1 rounded">
          {/* Assets without policy calculation */}
          <div className="font-semibold">// Assets without Policy Calculation:</div>
          {!ageData.isRetired ? (
            <>
              <div>// Pre-retirement asset calculation</div>
              <div>startingAssets = {formatCurrency(startingAssets)}</div>
              {isPreRetirementNoLTC && <div>annualSavings = {formatCurrency(appliedAnnualSavings)}</div>}
              <div>withdrawal = {formatCurrency(Math.abs(ageData.withdrawal))}</div>
              <div>preRetirementAssetReturns = {formatPercentage(assetGrowthRate)}</div>
              <div>currentAssets = (startingAssets + annualSavings - withdrawal) * (1 + preRetirementAssetReturns)</div>
              <div>
                = ({formatCurrency(startingAssets)} + {formatCurrency(appliedAnnualSavings)} -{" "}
                {formatCurrency(Math.abs(ageData.withdrawal))}) * (1 + {formatPercentage(assetGrowthRate)})
              </div>
              <div>= {formatCurrency(expectedEndingAssets)}</div>
              {hasDiscrepancy && (
                <div className="text-red-600">
                  // Warning: Actual ending assets ({formatCurrency(actualEndingAssets)}) don't match expected
                  calculation
                </div>
              )}
            </>
          ) : (
            <>
              <div>// Retirement asset calculation</div>
              <div>startingAssets = {formatCurrency(startingAssets)}</div>
              <div>withdrawal = {formatCurrency(Math.abs(ageData.withdrawal))}</div>
              <div>assetReturns = {formatPercentage(assetGrowthRate)}</div>
              <div>currentAssets = (startingAssets - withdrawal) * (1 + assetReturns)</div>
              <div>
                = ({formatCurrency(startingAssets)} - {formatCurrency(Math.abs(ageData.withdrawal))}) * (1 +{" "}
                {formatPercentage(assetGrowthRate)})
              </div>
              <div>= {formatCurrency(expectedEndingAssets)}</div>
              {hasDiscrepancy && (
                <div className="text-red-600">
                  // Warning: Actual ending assets ({formatCurrency(actualEndingAssets)}) don't match expected
                  calculation
                </div>
              )}
            </>
          )}

          {/* Policy value calculation */}
          {ageData.policyValue > 0 && (
            <>
              <div className="mt-2 font-semibold">// Policy Value Calculation:</div>
              <div>startingPolicyValue = {formatCurrency(startingPolicyValue)}</div>
              <div>appliedGrowthRate = {formatPercentage(ageData.appliedGrowthRate)}</div>
              <div>policyLoanTaken = {formatCurrency(Math.abs(ageData.policyLoanTaken))}</div>
              <div>policyLoanInterest = {formatCurrency(Math.abs(ageData.policyLoanInterest))}</div>
              <div>ltcBenefitsPaid = {formatCurrency(ageData.ltcBenefits)}</div>
              <div>
                policyValue = startingPolicyValue * (1 + appliedGrowthRate) - policyLoanTaken - policyLoanInterest -
                ltcBenefitsPaid
              </div>
              <div>
                = {formatCurrency(startingPolicyValue)} * (1 + {formatPercentage(ageData.appliedGrowthRate)}) -{" "}
                {formatCurrency(Math.abs(ageData.policyLoanTaken))} -{" "}
                {formatCurrency(Math.abs(ageData.policyLoanInterest))} - {formatCurrency(ageData.ltcBenefits)}
              </div>
              <div>= {formatCurrency(endingPolicyValue)}</div>
            </>
          )}

          {/* Total assets calculation */}
          <div className="mt-2 font-semibold">// Total Assets Calculation:</div>
          <div>totalAssets = assets + policyValue</div>
          <div>
            = {formatCurrency(actualEndingAssets)} + {formatCurrency(endingPolicyValue)}
          </div>
          <div>= {formatCurrency(actualEndingAssets + endingPolicyValue)}</div>

          {/* Year-over-year change */}
          <div className="mt-2 font-semibold">// Year-over-Year Changes:</div>
          <div>
            Assets Change: {formatCurrency(actualEndingAssets - startingAssets)} (
            {formatPercentage(actualEndingAssets / startingAssets - 1)})
          </div>
          {ageData.policyValue > 0 && (
            <div>
              Policy Value Change: {formatCurrency(endingPolicyValue - startingPolicyValue)} (
              {formatPercentage(endingPolicyValue / startingPolicyValue - 1)})
            </div>
          )}
          <div>
            Total Assets Change:{" "}
            {formatCurrency(actualEndingAssets + endingPolicyValue - (startingAssets + startingPolicyValue))} (
            {formatPercentage((actualEndingAssets + endingPolicyValue) / (startingAssets + startingPolicyValue) - 1)})
          </div>
        </div>

        {/* Add a new section to show asset progression over time */}
        <h4 className="font-semibold text-xs border-b pb-0.5 mb-1 mt-2">Asset Progression</h4>
        <div className="text-[10px] mt-0.5 bg-gray-100 p-1 rounded">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="pr-2">Age</th>
                <th className="pr-2">Assets</th>
                <th className="pr-2">Policy Value</th>
                <th className="pr-2">Total Assets</th>
              </tr>
            </thead>
            <tbody>
              {/* Show previous year */}
              {prevAgeData && (
                <tr className="border-b border-gray-300">
                  <td className="pr-2">{label - 1}</td>
                  <td className="pr-2">{formatCurrency(prevAgeData.assets)}</td>
                  <td className="pr-2">{formatCurrency(prevAgeData.policyValue)}</td>
                  <td className="pr-2">{formatCurrency(prevAgeData.assets + prevAgeData.policyValue)}</td>
                </tr>
              )}
              {/* Show current year */}
              <tr className="font-semibold">
                <td className="pr-2">{label}</td>
                <td className="pr-2">{formatCurrency(ageData.assets)}</td>
                <td className="pr-2">{formatCurrency(ageData.policyValue)}</td>
                <td className="pr-2">{formatCurrency(ageData.assets + ageData.policyValue)}</td>
              </tr>
              {/* Show next year if available */}
              {chartData.find((d) => d.age === label + 1) && (
                <tr className="text-gray-500">
                  <td className="pr-2">{label + 1}</td>
                  <td className="pr-2">{formatCurrency(chartData.find((d) => d.age === label + 1)?.assets || 0)}</td>
                  <td className="pr-2">
                    {formatCurrency(chartData.find((d) => d.age === label + 1)?.policyValue || 0)}
                  </td>
                  <td className="pr-2">
                    {formatCurrency(
                      (chartData.find((d) => d.age === label + 1)?.assets || 0) +
                        (chartData.find((d) => d.age === label + 1)?.policyValue || 0),
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add a simplified asset calculation summary for mobile */}
        <h4 className="font-semibold text-xs border-b pb-0.5 mb-1 mt-2">Asset Calculations</h4>
        <div className="text-[10px] mt-0.5 bg-gray-100 p-1 rounded">
          <div className="font-semibold">Assets Without Policy:</div>
          <div className="grid grid-cols-2 pl-2">
            <div>Previous Year:</div>
            <div>{formatCurrency(prevAgeData ? prevAgeData.assets : 0)}</div>
            <div>Current Year:</div>
            <div>{formatCurrency(ageData.assets)}</div>
            <div>Change:</div>
            <div>{formatCurrency(ageData.assets - (prevAgeData ? prevAgeData.assets : 0))}</div>
          </div>

          <div className="font-semibold mt-1">Policy Value:</div>
          <div className="grid grid-cols-2 pl-2">
            <div>Previous Year:</div>
            <div>{formatCurrency(prevAgeData ? prevAgeData.policyValue : 0)}</div>
            <div>Current Year:</div>
            <div>{formatCurrency(ageData.policyValue)}</div>
            <div>Change:</div>
            <div>{formatCurrency(ageData.policyValue - (prevAgeData ? prevAgeData.policyValue : 0))}</div>
          </div>

          <div className="font-semibold mt-1">Total Assets:</div>
          <div className="grid grid-cols-2 pl-2">
            <div>Previous Year:</div>
            <div>{formatCurrency(prevAgeData ? prevAgeData.assets + prevAgeData.policyValue : 0)}</div>
            <div>Current Year:</div>
            <div>{formatCurrency(ageData.assets + ageData.policyValue)}</div>
            <div>Change:</div>
            <div>
              {formatCurrency(
                ageData.assets + ageData.policyValue - (prevAgeData ? prevAgeData.assets + prevAgeData.policyValue : 0),
              )}
            </div>
          </div>

          <div className="text-xs mt-1">
            totalAssets = assets + policyValue = {formatCurrency(ageData.assets)} +{" "}
            {formatCurrency(ageData.policyValue)} = {formatCurrency(ageData.assets + ageData.policyValue)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="py-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] pt-0" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age" />
            <YAxis tickFormatter={(value) => `${value < 0 ? "-" : ""}${(Math.abs(value) / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Define patterns */}
            <defs>
              <pattern
                id="pattern-policy"
                patternUnits="userSpaceOnUse"
                width="10"
                height="10"
                patternTransform="rotate(45)"
              >
                <rect width="10" height="10" fill="#059669" />
                <path d="M0 0L10 10M10 0L0 10" stroke="white" strokeWidth="2" />
              </pattern>
              <pattern id="pattern-withdrawal" patternUnits="userSpaceOnUse" width="6" height="6">
                <rect width="6" height="6" fill="#ea580c" />
                <circle cx="3" cy="3" r="1.5" fill="white" />
              </pattern>
              <pattern id="pattern-tax" patternUnits="userSpaceOnUse" width="8" height="8">
                <rect width="8" height="8" fill="#dc2626" />
                <rect x="0" y="0" width="4" height="4" fill="white" />
                <rect x="4" y="4" width="4" height="4" fill="white" />
              </pattern>
              <pattern id="pattern-loan" patternUnits="userSpaceOnUse" width="10" height="10">
                <rect width="10" height="10" fill="#7c3aed" />
                <line x1="0" y1="5" x2="10" y2="5" stroke="white" strokeWidth="2" />
              </pattern>
            </defs>

            {/* Positive values - Assets */}
            <Bar dataKey="assets" name="Retirement Assets" fill="#0284c7" stackId="assets" />
            <Bar dataKey="policyValue" name="Policy Value" fill="url(#pattern-policy)" stackId="assets" />
            <Bar dataKey="totalAssets" name="Total Assets" fill="#0ea5e9" stackId="total" />

            {/* Negative values - Expenses and Withdrawals - each in their own stack */}
            <Bar dataKey="withdrawal" name="Withdrawals" fill="url(#pattern-withdrawal)" />
            <Bar dataKey="taxOnWithdrawal" name="Tax on Withdrawals" fill="url(#pattern-tax)" />
            <Bar dataKey="policyLoanTaken" name="Policy Loans" fill="url(#pattern-loan)" />
            <Bar dataKey="basicExpenses" name="Basic Expenses" fill="#f97316" />
            <Bar dataKey="ltcExpenses" name="LTC Expenses" fill="#ef4444" />
            <Bar dataKey="premiumExpenses" name="Premium Expenses" fill="#be185d" />

            {/* Reference lines */}
            <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
            {showRetirementAge && <ReferenceLine x={retirementAge} stroke="#f59e0b" label="Retirement" />}
            {ltcEventAge && <ReferenceLine x={ltcEventAge} stroke="#ef4444" label="LTC Event" />}
          </BarChart>
        </ResponsiveContainer>
        {tooltipData && (
          <MobileFriendlyTooltip
            title={`Age ${tooltipData.label} - Financial Details`}
            isOpen={!!tooltipData}
            onClose={() => setTooltipData(null)}
          >
            {renderTooltipContent()}
          </MobileFriendlyTooltip>
        )}
      </CardContent>
    </Card>
  )
}
