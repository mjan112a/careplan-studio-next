"use client"

import type { Person, CombinedYearlyData } from "../types/financial-types"
import { formatCurrency } from "../utils/calculation-utils"
import {
  Area,
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

interface IncomeChartProps {
  person: Person
  combinedView: boolean
  combinedData: CombinedYearlyData[]
  maxValue: number
  minValue: number
  ageRange: [number, number]
  person2?: Person
  startAge?: number
}

export default function IncomeChart({
  person,
  combinedView,
  combinedData,
  maxValue,
  minValue,
  ageRange,
  person2,
  startAge,
}: IncomeChartProps) {
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

  // Process data to add income gap visualization as negative bars
  const processedData = filteredData.map((item) => {
    // Use the yearsFromNow property if it exists, otherwise calculate it
    const yearsFromNow = item.yearsFromNow !== undefined ? item.yearsFromNow : startAge ? item.age - startAge : 0

    // For combined view, check if age is past either person's retirement age
    const isRetired = combinedView
      ? item.age >=
        Math.min(person.enabled ? person.retirementAge : 999, person2 && person2.enabled ? person2.retirementAge : 999)
      : item.age >= person.retirementAge

    const incomeGap = item[`${prefix}incomeGap`] || 0

    // Only show income gap during retirement
    const negativeIncomeGap = isRetired ? -incomeGap : 0

    return {
      ...item,
      yearsFromNow,
      [`${prefix}negativeIncomeGap`]: negativeIncomeGap,
    }
  })

  // Process data for the table to include calculated columns
  const tableData = data.map((item) => {
    // For individual view
    const workIncome = item[`${prefix}workIncome`] || 0
    const socialSecurity = item[`${prefix}socialSecurity`] || 0
    const pension = item[`${prefix}pension`] || 0
    const policyIncome = item[`${prefix}policyIncome`] || 0
    const incomeNeeded = item[`${prefix}incomeNeeded`] || 0

    // Calculate total income received
    const totalIncomeReceived = workIncome + socialSecurity + pension + policyIncome

    // Add these calculated fields to the item
    const updatedItem = {
      ...item,
      [`${prefix}totalIncomeReceived`]: totalIncomeReceived,
    }

    // For combined view, also calculate individual totals
    if (combinedView) {
      // Person 1
      const p1WorkIncome = item.p1_workIncome || 0
      const p1SocialSecurity = item.p1_socialSecurity || 0
      const p1Pension = item.p1_pension || 0
      const p1PolicyIncome = item.p1_policyIncome || 0
      updatedItem.p1_totalIncomeReceived = p1WorkIncome + p1SocialSecurity + p1Pension + p1PolicyIncome

      // Person 2
      const p2WorkIncome = item.p2_workIncome || 0
      const p2SocialSecurity = item.p2_socialSecurity || 0
      const p2Pension = item.p2_pension || 0
      const p2PolicyIncome = item.p2_policyIncome || 0
      updatedItem.p2_totalIncomeReceived = p2WorkIncome + p2SocialSecurity + p2Pension + p2PolicyIncome
    }

    return updatedItem
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate total income (all sources except income needed)
      const totalIncome = payload.reduce((sum: number, entry: any) => {
        // Only include income sources, not the income needed line or negative income gap
        if (
          entry.dataKey !== `${prefix}incomeNeeded` &&
          entry.dataKey !== `${prefix}incomeGap` &&
          entry.dataKey !== `${prefix}negativeIncomeGap` &&
          entry.value > 0
        ) {
          return sum + (entry.value || 0)
        }
        return sum
      }, 0)

      // Find income needed value
      const incomeNeeded = payload.find((entry: any) => entry.dataKey === `${prefix}incomeNeeded`)?.value || 0

      // Calculate surplus/deficit
      const surplusDeficit = totalIncome - incomeNeeded

      // Find income gap
      const negativeIncomeGap = payload.find((entry: any) => entry.dataKey === `${prefix}negativeIncomeGap`)?.value || 0
      const actualIncomeGap = Math.abs(negativeIncomeGap)

      // Find policy income and LTC costs
      const policyIncome = payload.find((entry: any) => entry.dataKey === `${prefix}policyIncome`)?.value || 0
      const ltcCosts = payload.find((entry: any) => entry.dataKey === `${prefix}ltcCosts`)?.value || 0
      const ltcBenefits = payload.find((entry: any) => entry.dataKey === `${prefix}ltcBenefits`)?.value || 0

      // Check if this is an LTC event year
      const hasLtcEvent = ltcCosts > 0

      // For combined view, get individual person data if available
      const dataPoint = data.find((d) => d.age === label) || data[0]

      // Get individual person data for combined view
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
              .filter((entry: any) => entry.dataKey !== `${prefix}negativeIncomeGap`)
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

          {incomeNeeded > 0 && (
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total Income:</span>
                <span>{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex justify-between font-medium mt-1">
                <span>{surplusDeficit >= 0 ? "Surplus:" : "Deficit:"}</span>
                <span className={surplusDeficit >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(Math.abs(surplusDeficit))}
                </span>
              </div>

              {(hasLtcEvent || (combinedView && (p1HasLtcEvent || p2HasLtcEvent))) && (
                <div className="mt-2 pt-2 border-t">
                  <div className="font-medium mb-1">LTC Impact:</div>
                  <div className="flex justify-between text-sm">
                    <span>LTC Costs:</span>
                    <span>{formatCurrency(ltcCosts)}</span>
                  </div>
                  {ltcBenefits > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>LTC Benefits:</span>
                      <span className="text-green-600">{formatCurrency(ltcBenefits)}</span>
                    </div>
                  )}

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

              {actualIncomeGap > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="text-sm text-red-600">
                    Income gap of {formatCurrency(actualIncomeGap)} will be withdrawn from your retirement assets.
                  </div>
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
  const incomeFields = [
    { key: "workIncome", label: "Work Income" },
    { key: "socialSecurity", label: "Social Security" },
    { key: "pension", label: "Pension" },
    { key: "policyIncome", label: "LTC Benefits" },
    { key: "totalIncomeReceived", label: "Total Income" },
    { key: "incomeNeeded", label: "Income Needed" },
    { key: "incomeGap", label: "Income Gap" },
    { key: "ltcCosts", label: "LTC Costs" },
    { key: "ltcBenefits", label: "LTC Benefits" },
  ]

  return (
    <div className="space-y-4">
      {/* Chart takes full width */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {/* Increase the left margin to provide more space for the y-axis labels */}
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

            {/* Income Gap as negative bars */}
            <Bar
              dataKey={`${prefix}negativeIncomeGap`}
              name="Income Gap (Withdrawn from Assets)"
              fill="#ff6b6b"
              opacity={0.7}
            />

            {/* Work Income */}
            <Area
              type="monotone"
              dataKey={`${prefix}workIncome`}
              name="Work Income"
              stackId="1"
              fill="#8884d8"
              stroke="#8884d8"
              fillOpacity={0.6}
            />

            {/* Social Security */}
            <Area
              type="monotone"
              dataKey={`${prefix}socialSecurity`}
              name="Social Security"
              stackId="1"
              fill="#82ca9d"
              stroke="#82ca9d"
              fillOpacity={0.6}
            />

            {/* Pension */}
            <Area
              type="monotone"
              dataKey={`${prefix}pension`}
              name="Pension"
              stackId="1"
              fill="#ffc658"
              stroke="#ffc658"
              fillOpacity={0.6}
            />

            {/* Policy Income */}
            <Area
              type="monotone"
              dataKey={`${prefix}policyIncome`}
              name="LTC Benefits"
              stackId="1"
              fill="#4caf50"
              stroke="#4caf50"
              fillOpacity={0.6}
            />

            {/* Income Needed Line */}
            <Line
              type="monotone"
              dataKey={`${prefix}incomeNeeded`}
              name="Income Needed"
              stroke="#ff0000"
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
          data={tableData}
          prefix={prefix}
          fields={incomeFields}
          startAge={!combinedView ? person.currentAge : undefined}
          combinedView={combinedView}
          person1Age={combinedView && person.enabled ? person.currentAge : undefined}
          person2Age={combinedView && person2 && person2.enabled ? person2.currentAge : undefined}
        />
      </div>
    </div>
  )
}

