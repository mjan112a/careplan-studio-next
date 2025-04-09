"use client"

import type { Person, CombinedYearlyData } from "../types/financial-types"
import { formatCurrency } from "../utils/calculation-utils"
import {
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  ComposedChart,
  ReferenceLine,
  Label,
} from "recharts"
import DataTable from "./data-table"

interface AssetChartProps {
  person: Person
  combinedView: boolean
  combinedData: CombinedYearlyData[]
  maxValue: number
  minValue: number
  ageRange: [number, number]
  person2?: Person
  startAge?: number
}

export default function AssetChart({
  person,
  combinedView,
  combinedData,
  maxValue,
  minValue,
  ageRange,
  person2,
  startAge,
}: AssetChartProps) {
  if (!person.enabled && !combinedView) return null

  const data = combinedView ? combinedData : person.retirementData

  // For individual view, use the person's prefix
  // For combined view, use "combined_" for combined data
  const prefix = combinedView ? "combined_" : ""

  // Check if person is bankrupt
  const isBankrupt = combinedView ? data.some((item) => item[`combined_bankrupt`] === true) : person.bankrupt || false

  const bankruptAge = combinedView
    ? (data.find((item) => item[`combined_bankrupt`] === true)?.[`combined_bankruptAge`] as number) || 0
    : person.bankruptAge || 0

  // Filter data to only show up to bankruptcy
  const filteredData = isBankrupt ? data.filter((item) => item.age <= bankruptAge) : data

  // Process data to add withdrawal visualization
  const processedData = filteredData.map((item) => {
    const age = item.age
    const yearsFromNow = startAge ? age - startAge : age

    // For combined view, check if age is past either person's retirement age
    const isRetired = combinedView
      ? age >=
        Math.min(person.enabled ? person.retirementAge : 999, person2 && person2.enabled ? person2.retirementAge : 999)
      : age >= person.retirementAge

    const incomeGap = item[`${prefix}incomeGap`] || 0
    const ltcOutOfPocket = item[`${prefix}ltcOutOfPocket`] || 0

    // Only show withdrawals during retirement
    const withdrawals = isRetired ? incomeGap + ltcOutOfPocket : 0

    // Separate income gap and LTC withdrawals for visualization
    const incomeWithdrawals = isRetired ? incomeGap : 0
    const ltcWithdrawals = isRetired ? ltcOutOfPocket : 0

    return {
      ...item,
      yearsFromNow,
      [`${prefix}incomeWithdrawals`]: incomeWithdrawals > 0 ? -incomeWithdrawals : 0, // Negative for visual purposes
      [`${prefix}ltcWithdrawals`]: ltcWithdrawals > 0 ? -ltcWithdrawals : 0, // Negative for visual purposes
      [`${prefix}totalWithdrawals`]: withdrawals > 0 ? -withdrawals : 0, // Negative for visual purposes
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find net worth values
      const netWorth = payload.find((entry: any) => entry.dataKey === `${prefix}netWorth`)?.value || 0
      const netWorthNoPolicyScenario =
        payload.find((entry: any) => entry.dataKey === `${prefix}netWorthNoPolicyScenario`)?.value || 0

      // Calculate policy impact
      const policyImpact = netWorth - netWorthNoPolicyScenario

      // Find retirement assets and policy cash value
      const retirementAssets = payload.find((entry: any) => entry.dataKey === `${prefix}assets401k`)?.value || 0
      const policyCashValue = payload.find((entry: any) => entry.dataKey === `${prefix}policyCashValue`)?.value || 0

      // Find withdrawals
      const incomeWithdrawals = Math.abs(
        payload.find((entry: any) => entry.dataKey === `${prefix}incomeWithdrawals`)?.value || 0,
      )
      const ltcWithdrawals = Math.abs(
        payload.find((entry: any) => entry.dataKey === `${prefix}ltcWithdrawals`)?.value || 0,
      )
      const totalWithdrawals = incomeWithdrawals + ltcWithdrawals

      // Find LTC costs and benefits
      const ltcCosts = payload.find((entry: any) => entry.dataKey === `${prefix}ltcCosts`)?.value || 0
      const ltcBenefits = payload.find((entry: any) => entry.dataKey === `${prefix}ltcBenefits`)?.value || 0

      // Find policy premium
      const policyPremium = payload.find((entry: any) => entry.dataKey === `${prefix}policyPremium`)?.value || 0

      // Find age and check if retired
      const age = label
      const isRetired = combinedView
        ? age >=
          Math.min(
            person.enabled ? person.retirementAge : 999,
            person2 && person2.enabled ? person2.retirementAge : 999,
          )
        : age >= person.retirementAge

      // Check if this is an LTC event year
      const hasLtcEvent = ltcCosts > 0

      // Get individual person data for combined view
      const dataPoint = data.find((d) => d.age === label) || data[0]
      const p1LtcCosts = dataPoint.p1_ltcCosts || 0
      const p1LtcBenefits = dataPoint.p1_ltcBenefits || 0
      const p2LtcCosts = dataPoint.p2_ltcCosts || 0
      const p2LtcBenefits = dataPoint.p2_ltcBenefits || 0

      // Check if either person has an LTC event at this age
      const p1HasLtcEvent = p1LtcCosts > 0
      const p2HasLtcEvent = p2LtcCosts > 0

      return (
        <div className="bg-white p-4 border rounded shadow-sm max-w-xs">
          <div className="font-medium text-lg mb-2 border-b pb-1">
            Year {label} (Age: {dataPoint.age})
          </div>

          <div className="space-y-1 mb-3">
            {payload
              .filter((entry) => !entry.dataKey.includes("Withdrawals"))
              .map((entry: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
                    <span>{entry.name}:</span>
                  </div>
                  <span className="font-medium">{formatCurrency(entry.value)}</span>
                </div>
              ))}
          </div>

          {policyPremium > 0 && (
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Policy Premium:</span>
                <span className="text-red-600">-{formatCurrency(policyPremium)}</span>
              </div>
            </div>
          )}

          {isRetired && totalWithdrawals > 0 && (
            <div className="border-t pt-2 mt-2">
              <div className="font-medium mb-1">Withdrawals This Year:</div>

              {incomeWithdrawals > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Income Gap:</span>
                  <span className="text-red-600">-{formatCurrency(incomeWithdrawals)}</span>
                </div>
              )}

              {ltcWithdrawals > 0 && (
                <div className="flex justify-between text-sm">
                  <span>LTC Out-of-Pocket:</span>
                  <span className="text-red-600">-{formatCurrency(ltcWithdrawals)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium mt-1 border-t pt-1">
                <span>Total Withdrawals:</span>
                <span className="text-red-600">-{formatCurrency(totalWithdrawals)}</span>
              </div>
            </div>
          )}

          {(hasLtcEvent || (combinedView && (p1HasLtcEvent || p2HasLtcEvent))) && (
            <div className="border-t pt-2 mt-2">
              <div className="font-medium mb-1">LTC Event Impact:</div>
              <div className="flex justify-between text-sm">
                <span>Total LTC Cost:</span>
                <span>{formatCurrency(ltcCosts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Policy Benefit:</span>
                <span className="text-green-600">{formatCurrency(ltcBenefits)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Coverage Ratio:</span>
                <span>{ltcCosts > 0 ? Math.round((ltcBenefits / ltcCosts) * 100) : 0}%</span>
              </div>

              {/* Add breakdown for combined view */}
              {combinedView && (p1HasLtcEvent || p2HasLtcEvent) && (
                <div className="mt-2 pt-2 border-t">
                  <div className="font-medium mb-1">Individual Breakdown:</div>

                  {p1HasLtcEvent && (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Person 1 LTC Cost:</span>
                        <span>{formatCurrency(p1LtcCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Person 1 Benefits:</span>
                        <span>{formatCurrency(p1LtcBenefits)}</span>
                      </div>
                    </div>
                  )}

                  {p2HasLtcEvent && (
                    <div className="text-sm mt-1">
                      <div className="flex justify-between">
                        <span>Person 2 LTC Cost:</span>
                        <span>{formatCurrency(p2LtcCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Person 2 Benefits:</span>
                        <span>{formatCurrency(p2LtcBenefits)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span>Policy Impact:</span>
              <span className={policyImpact >= 0 ? "text-green-600" : "text-red-600"}>
                {formatCurrency(policyImpact)}
              </span>
            </div>

            {policyCashValue > 0 && (
              <div className="flex justify-between font-medium mt-1">
                <span>% of Net Worth in Policy:</span>
                <span>{Math.round((policyCashValue / netWorth) * 100)}%</span>
              </div>
            )}

            {retirementAssets > 0 && (
              <div className="flex justify-between font-medium mt-1">
                <span>% of Net Worth in 401(k):</span>
                <span>{Math.round((retirementAssets / netWorth) * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Define fields for the data table
  const assetFields = [
    { key: "assets401k", label: "401(k) Assets" },
    { key: "assets401kNoPolicyScenario", label: "401(k) No Policy" },
    { key: "policyPremium", label: "Policy Premium" },
    { key: "policyCashValue", label: "Policy Cash Value" },
    { key: "policyDeathBenefit", label: "Death Benefit" },
    { key: "incomeGap", label: "Income Gap" },
    { key: "ltcOutOfPocket", label: "LTC Out-of-Pocket" },
    { key: "netWorth", label: "Net Worth" },
    { key: "netWorthNoPolicyScenario", label: "Net Worth No Policy" },
    { key: "bankrupt", label: "Assets Depleted" },
  ]

  return (
    <div className="space-y-4">
      {/* Chart takes full width */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={processedData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="yearsFromNow"
              domain={startAge ? [ageRange[0] - startAge, ageRange[1] - startAge] : ageRange}
              type="number"
              allowDataOverflow
              label={{ value: "Years from now", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              tickFormatter={(value) => {
                // More compact currency formatting without cents
                return value >= 0
                  ? `$${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0, notation: "compact" })}`
                  : `-$${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0, notation: "compact" })}`
              }}
              domain={[minValue, maxValue]}
              allowDataOverflow
              style={{ fontSize: "10px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Income Gap Withdrawals */}
            <Bar
              dataKey={`${prefix}incomeWithdrawals`}
              name="Income Gap Withdrawals"
              fill="#ff6b6b"
              opacity={0.7}
              stackId="withdrawals"
            />

            {/* LTC Out-of-Pocket Withdrawals */}
            <Bar
              dataKey={`${prefix}ltcWithdrawals`}
              name="LTC Out-of-Pocket Withdrawals"
              fill="#ff0000"
              opacity={0.7}
              stackId="withdrawals"
            />

            {/* Net Worth With Policy */}
            <Line
              type="monotone"
              dataKey={`${prefix}netWorth`}
              name="Net Worth (With Policy)"
              stroke="#0066ff" // Changed to vibrant blue
              strokeWidth={2}
              dot={false}
            />

            {/* Net Worth Without Policy */}
            <Line
              type="monotone"
              dataKey={`${prefix}netWorthNoPolicyScenario`}
              name="Net Worth (Without Policy)"
              stroke="#8884d8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />

            {/* 401k Assets */}
            <Line
              type="monotone"
              dataKey={`${prefix}assets401k`}
              name="Retirement Assets (401k)"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
            />

            {/* Policy Cash Value */}
            <Line
              type="monotone"
              dataKey={`${prefix}policyCashValue`}
              name="Policy Cash Value"
              stroke="#ffc658"
              strokeWidth={2}
              dot={false}
            />

            {/* Add a reference line at bankruptcy age if bankrupt */}
            {isBankrupt && (
              <ReferenceLine x={bankruptAge} stroke="#ff0000" strokeWidth={2} strokeDasharray="3 3">
                <Label value="Assets Depleted" position="insideTopRight" fill="#ff0000" fontSize={12} />
              </ReferenceLine>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table below the chart */}
      <div className="w-full">
        <DataTable
          data={data}
          prefix={prefix}
          fields={assetFields}
          startAge={!combinedView ? person.currentAge : undefined}
          combinedView={combinedView}
          person1Age={combinedView && person.enabled ? person.currentAge : undefined}
          person2Age={combinedView && person2 && person2.enabled ? person2.currentAge : undefined}
        />
      </div>
    </div>
  )
}

