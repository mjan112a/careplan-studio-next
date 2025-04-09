"use client"

import type { Person, CombinedYearlyData } from "../types/financial-types"
import { formatCurrency } from "../utils/calculation-utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Label,
} from "recharts"
import DataTable from "./data-table"

interface LtcChartProps {
  person: Person
  combinedView: boolean
  combinedData: CombinedYearlyData[]
  maxValue: number
  minValue: number
  ageRange: [number, number]
  person2?: Person
  startAge?: number
}

export default function LtcChart({
  person,
  combinedView,
  combinedData,
  maxValue,
  minValue,
  ageRange,
  person2,
  startAge,
}: LtcChartProps) {
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

  // Highlight LTC event years
  const processedData = filteredData.map((item) => {
    const ltcCosts = item[`${prefix}ltcCosts`] || 0
    const yearsFromNow = startAge ? item.age - startAge : item.age

    // For combined view, also check individual person data
    const p1LtcCosts = combinedView ? item.p1_ltcCosts || 0 : 0
    const p2LtcCosts = combinedView ? item.p2_ltcCosts || 0 : 0

    return {
      ...item,
      yearsFromNow,
      isLtcEvent: ltcCosts > 0 || p1LtcCosts > 0 || p2LtcCosts > 0,
      p1_hasLtcEvent: p1LtcCosts > 0,
      p2_hasLtcEvent: p2LtcCosts > 0,
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find LTC costs, benefits, and out-of-pocket expenses
      const ltcCosts = payload.find((entry: any) => entry.dataKey === `${prefix}ltcCosts`)?.value || 0
      const ltcBenefits = payload.find((entry: any) => entry.dataKey === `${prefix}ltcBenefits`)?.value || 0
      const ltcOutOfPocket = payload.find((entry: any) => entry.dataKey === `${prefix}ltcOutOfPocket`)?.value || 0

      // Calculate coverage percentage
      const coveragePercentage = ltcCosts > 0 ? Math.round((ltcBenefits / ltcCosts) * 100) : 0

      // Check if this is an LTC event year
      const isLtcEvent = ltcCosts > 0

      // Find asset impact
      const dataPoint = data.find((d) => d.age === label) || data[0]
      const assets401k = dataPoint[`${prefix}assets401k`] || 0
      const assets401kNoPolicyScenario = dataPoint[`${prefix}assets401kNoPolicyScenario`] || 0
      const assetImpact = assets401k - assets401kNoPolicyScenario

      // Get individual person data for combined view
      const p1LtcCosts = dataPoint.p1_ltcCosts || 0
      const p1LtcBenefits = dataPoint.p1_ltcBenefits || 0
      const p1LtcOutOfPocket = dataPoint.p1_ltcOutOfPocket || 0
      const p2LtcCosts = dataPoint.p2_ltcCosts || 0
      const p2LtcBenefits = dataPoint.p2_ltcBenefits || 0
      const p2LtcOutOfPocket = dataPoint.p2_ltcOutOfPocket || 0

      // Check if either person has an LTC event at this age
      const p1HasLtcEvent = p1LtcCosts > 0
      const p2HasLtcEvent = p2LtcCosts > 0

      return (
        <div className="bg-white p-4 border rounded shadow-sm max-w-xs">
          <div className="font-medium text-lg mb-2 border-b pb-1">
            Year {label} (Age: {dataPoint.age})
          </div>

          <div className="space-y-1 mb-3">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 mr-2" style={{ backgroundColor: entry.color }}></div>
                  <span>{entry.name}:</span>
                </div>
                <span className="font-medium">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>

          {(isLtcEvent || (combinedView && (p1HasLtcEvent || p2HasLtcEvent))) && (
            <div className="border-t pt-2 mt-2">
              <div className="font-medium mb-1">LTC Event Details:</div>

              <div className="flex justify-between font-medium">
                <span>Policy Coverage:</span>
                <span>{coveragePercentage}%</span>
              </div>

              <div className="flex justify-between text-sm mt-1">
                <span>Monthly LTC Cost:</span>
                <span>{formatCurrency(ltcCosts / 12)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Monthly Benefit:</span>
                <span>{formatCurrency(ltcBenefits / 12)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Monthly Out-of-Pocket:</span>
                <span>{formatCurrency(ltcOutOfPocket / 12)}</span>
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
                      <div className="flex justify-between">
                        <span>Person 1 Out-of-Pocket:</span>
                        <span>{formatCurrency(p1LtcOutOfPocket)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Person 1 Coverage:</span>
                        <span>{p1LtcCosts > 0 ? Math.round((p1LtcBenefits / p1LtcCosts) * 100) : 0}%</span>
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
                      <div className="flex justify-between">
                        <span>Person 2 Out-of-Pocket:</span>
                        <span>{formatCurrency(p2LtcOutOfPocket)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Person 2 Coverage:</span>
                        <span>{p2LtcCosts > 0 ? Math.round((p2LtcBenefits / p2LtcCosts) * 100) : 0}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between font-medium mt-2 pt-1 border-t">
                <span>Asset Impact:</span>
                <span className={assetImpact >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(assetImpact)}
                </span>
              </div>

              {ltcOutOfPocket > 0 && (
                <div className="mt-2 pt-2 border-t text-sm text-red-600">
                  This out-of-pocket expense will be withdrawn from your retirement assets.
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Define fields for the data table
  const ltcFields = [
    { key: "ltcCosts", label: "LTC Costs" },
    { key: "ltcBenefits", label: "LTC Benefits" },
    { key: "ltcOutOfPocket", label: "Out-of-Pocket" },
    { key: "policyIncome", label: "Policy Income" },
  ]

  return (
    <div className="space-y-4">
      {/* Chart takes full width */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
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

            {/* LTC Costs */}
            <Area
              type="monotone"
              dataKey={`${prefix}ltcCosts`}
              name="LTC Costs"
              stackId="1"
              fill="#ff0000"
              stroke="#ff0000"
              fillOpacity={0.6}
            />

            {/* LTC Benefits */}
            <Area
              type="monotone"
              dataKey={`${prefix}ltcBenefits`}
              name="Policy Benefits"
              stackId="2"
              fill="#ffc658"
              stroke="#ffc658"
              fillOpacity={0.6}
            />

            {/* Out of Pocket */}
            <Area
              type="monotone"
              dataKey={`${prefix}ltcOutOfPocket`}
              name="Out-of-Pocket Expenses"
              stackId="1"
              fill="#ff6b6b"
              stroke="#ff6b6b"
              fillOpacity={0.6}
            />

            {/* Add a reference line at bankruptcy age if bankrupt */}
            {isBankrupt && (
              <ReferenceLine x={bankruptAge} stroke="#ff0000" strokeWidth={2} strokeDasharray="3 3">
                <Label value="Assets Depleted" position="insideTopRight" fill="#ff0000" fontSize={12} />
              </ReferenceLine>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Table below the chart */}
      <div className="w-full">
        <DataTable
          data={data}
          prefix={prefix}
          fields={ltcFields}
          startAge={!combinedView ? person.currentAge : undefined}
          combinedView={combinedView}
          person1Age={combinedView && person.enabled ? person.currentAge : undefined}
          person2Age={combinedView && person2 && person2.enabled ? person2.currentAge : undefined}
        />
      </div>
    </div>
  )
}

