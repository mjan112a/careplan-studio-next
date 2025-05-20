"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { YearlyFinancialData } from "@/utils/financial-calculations"
import { formatCurrency } from "@/utils/format"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { InitialAssetCalculation } from "./initial-asset-calculation"
import type { Person } from "@/types/person"
// Update the imports to include the CustomDualAxis
import { CustomDualAxis } from "./custom-dual-axis"

// Define the chart legend items
const legendItems = [
  { name: "Retirement Assets", color: "#0284c7", dashed: false },
  { name: "Policy Value", color: "#059669", dashed: false },
  { name: "Death Benefit", color: "#dc2626", dashed: true },
  { name: "Total Assets", color: "#7c3aed", dashed: false },
  { name: "Total Assets (No Policy)", color: "#7c3aed", dashed: true },
]

// Update the AssetProjectionChartProps interface to include person2 data
interface AssetProjectionChartProps {
  data: YearlyFinancialData[]
  comparisonData?: YearlyFinancialData[]
  title?: string
  showLTCEvent?: boolean
  showRetirementAge?: boolean
  retirementAge?: number
  ltcEventAge?: number
  legacyAssets?: number
  person?: Person
  person2?: Person
  personIndex?: number
  showInitialCalculation?: boolean
  person1StartAge?: number
  person2StartAge?: number
}

export function AssetProjectionChart({
  data,
  comparisonData,
  title = "Asset Projection",
  showLTCEvent = true,
  showRetirementAge = true,
  retirementAge = 65,
  ltcEventAge = 80,
  legacyAssets,
  person,
  person2,
  personIndex = 0,
  showInitialCalculation = true,
  person1StartAge,
  person2StartAge,
}: AssetProjectionChartProps) {
  const [chartType, setChartType] = useState<"line" | "area" | "stacked">("line")
  const [showComparison, setShowComparison] = useState(true)

  // Format data for the chart
  const chartData = data.map((item) => ({
    year: item.year, // Use year instead of age
    age: item.age, // Keep age for reference
    assets: Math.round(item.assets),
    policyValue: Math.round(item.policyValue),
    deathBenefit: Math.round(item.deathBenefit),
    totalAssets: Math.round(item.totalAssets),
    hasLTCEvent: item.hasLTCEvent,
    // Add comparison data if available
    totalAssetsNoPolicyLine:
      comparisonData && comparisonData.find((d) => d.age === item.age)
        ? Math.round(comparisonData.find((d) => d.age === item.age)!.totalAssets)
        : undefined,
  }))

  // Calculate first-year withdrawal rate (4% rule reference)
  const calculateFirstYearWithdrawalRate = () => {
    if (!retirementAge || !data.length) return null

    // Find the retirement year index
    const retirementYearIndex = data.findIndex((item) => item.age === retirementAge)
    if (retirementYearIndex < 0 || retirementYearIndex >= data.length - 1) return null

    // Get retirement year data and next year data
    const retirementYearData = data[retirementYearIndex]
    const firstRetirementYearData = data[retirementYearIndex + 1]

    // Calculate first year withdrawal rate
    const firstYearWithdrawalRate = (firstRetirementYearData.withdrawal / retirementYearData.assets) * 100

    return firstYearWithdrawalRate
  }

  const firstYearWithdrawalRate = calculateFirstYearWithdrawalRate()

  // Calculate retirement and LTC event years
  const calculateRetirementYear = () => {
    if (!retirementAge || !data.length) return null

    // If person is defined, calculate years until retirement
    if (person && person.age !== undefined) {
      return retirementAge - person.age
    }

    // Fallback: find the retirement year in the data
    const retirementYearData = data.find((item) => item.age === retirementAge)
    return retirementYearData ? retirementYearData.year : null
  }

  const calculateLTCEventYear = () => {
    if (!ltcEventAge || !data.length) return null

    // If person is defined, calculate years until LTC event
    if (person && person.age !== undefined) {
      return ltcEventAge - person.age
    }

    // Fallback: find the LTC event year in the data
    const ltcEventYearData = data.find((item) => item.age === ltcEventAge)
    return ltcEventYearData ? ltcEventYearData.year : null
  }

  const retirementYear = calculateRetirementYear()
  const ltcEventYear = calculateLTCEventYear()

  // Update the CustomTooltip function to show both people's ages
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the corresponding age for this year
      const dataPoint = data.find((item) => item.year === Number(label))
      const age = dataPoint ? dataPoint.age : null

      // Calculate Person 2's age if we have the starting ages
      const person1Age = person1StartAge !== undefined ? person1StartAge + Number(label) : age
      const person2Age = person2StartAge !== undefined ? person2StartAge + Number(label) : null

      return (
        <div
          className="bg-white bg-opacity-90 p-3 border rounded shadow-sm text-sm"
          style={{ transform: "translate(10px, -20px)" }}
        >
          <p className="font-bold text-xs">
            Year: {label}
            {person1Age ? ` (P1 Age: ${person1Age})` : ""}
            {person2Age ? ` (P2 Age: ${person2Age})` : ""}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Custom legend component that shows line styles
  const CustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-2 mb-1">
        {legendItems.map((item, index) => {
          // Only show the "No Policy" item if comparison is enabled
          if (item.name === "Total Assets (No Policy)" && (!comparisonData || !showComparison)) {
            return null
          }

          return (
            <div key={index} className="flex items-center">
              <div className="w-8 h-4 mr-2 flex items-center">
                {item.dashed ? (
                  <svg width="32" height="4" viewBox="0 0 32 4">
                    <line x1="0" y1="2" x2="32" y2="2" stroke={item.color} strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                ) : (
                  <div
                    style={{
                      backgroundColor: item.color,
                      height: "3px",
                      width: "100%",
                    }}
                  />
                )}
              </div>
              <span className="text-xs">{item.name}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex flex-col items-end">
            {legacyAssets !== undefined && (
              <div className="text-sm font-medium">
                Total Legacy Assets at Death: <span className="text-emerald-600">{formatCurrency(legacyAssets)}</span>
                <div className="text-xs text-muted-foreground">(Retirement assets + death benefit)</div>
              </div>
            )}
            {comparisonData && showComparison && (
              <div className="text-sm mt-1">
                <span>
                  Policy Impact: {(() => {
                    const withPolicy = data[data.length - 1]?.totalAssets || 0
                    const withoutPolicy = comparisonData[comparisonData.length - 1]?.totalAssets || 0
                    const difference = withPolicy - withoutPolicy
                    const isPositive = difference > 0
                    return (
                      <span className={isPositive ? "text-emerald-600" : "text-red-600"}>
                        {isPositive ? "+" : ""}
                        {formatCurrency(difference)}
                      </span>
                    )
                  })()}
                </span>
                <div className="text-xs text-muted-foreground">
                  (Difference in final total assets with vs. without policy)
                </div>
              </div>
            )}
            {showRetirementAge && retirementAge && firstYearWithdrawalRate !== null && (
              <div className="text-sm mt-1">
                <span>
                  First-Year Withdrawal Rate:{" "}
                  <span
                    className={
                      firstYearWithdrawalRate > 5
                        ? "text-red-600"
                        : firstYearWithdrawalRate > 4
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }
                  >
                    {firstYearWithdrawalRate.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">(4% rule reference)</span>
                </span>
                {firstYearWithdrawalRate > 5 && (
                  <div className="text-xs text-red-600">High risk of depleting assets</div>
                )}
                {firstYearWithdrawalRate > 4 && firstYearWithdrawalRate <= 5 && (
                  <div className="text-xs text-amber-600">Moderate risk - consider adjustments</div>
                )}
                {firstYearWithdrawalRate <= 4 && (
                  <div className="text-xs text-emerald-600">Generally sustainable rate</div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="stacked">Stacked</TabsTrigger>
            </TabsList>

            {comparisonData && (
              <div className="flex items-center justify-end mt-2 mb-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`showComparison-${title.replace(/\s+/g, "")}`}
                    checked={showComparison}
                    onCheckedChange={setShowComparison}
                  />
                  <Label htmlFor={`showComparison-${title.replace(/\s+/g, "")}`}>Show Without Policy Comparison</Label>
                </div>
              </div>
            )}

            <TabsContent value="line" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {/* Update the XAxis in all chart components to use the CustomDualAxis */}
                  <XAxis
                    dataKey="year"
                    height={60}
                    tick={
                      <CustomDualAxis
                        person1StartAge={person1StartAge || person?.age || 0}
                        person2StartAge={person2StartAge || person2?.age || 0}
                      />
                    }
                    label={{ value: "Years", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="assets" name="Retirement Assets" stroke="#0284c7" strokeWidth={3} />
                  <Line type="monotone" dataKey="policyValue" name="Policy Value" stroke="#059669" strokeWidth={3} />
                  <Line
                    type="monotone"
                    dataKey="deathBenefit"
                    name="Death Benefit"
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line type="monotone" dataKey="totalAssets" name="Total Assets" stroke="#7c3aed" strokeWidth={3} />
                  {showComparison && comparisonData && (
                    <Line
                      type="monotone"
                      dataKey="totalAssetsNoPolicyLine"
                      name="Total Assets (No Policy)"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  )}
                  {showComparison && comparisonData && (
                    <Area
                      type="monotone"
                      dataKey="totalAssets"
                      stroke="none"
                      fill="#7c3aed"
                      fillOpacity={0.2}
                      activeDot={false}
                      stackId="diff"
                    />
                  )}
                  {showComparison && comparisonData && (
                    <Area
                      type="monotone"
                      dataKey="totalAssetsNoPolicyLine"
                      stroke="none"
                      fill="#7c3aed"
                      fillOpacity={0.2}
                      activeDot={false}
                      stackId="diff"
                      baseValue="dataMin"
                    />
                  )}
                  {showRetirementAge && retirementYear !== null && (
                    <ReferenceLine
                      x={retirementYear}
                      stroke="#f59e0b"
                      label={{
                        value: "Retirement",
                        position: "top",
                      }}
                    />
                  )}
                  {showLTCEvent && ltcEventYear !== null && (
                    <ReferenceLine
                      x={ltcEventYear}
                      stroke="#ef4444"
                      label={{
                        value: "LTC Event",
                        position: "top",
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="stacked" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {/* Do the same for the AreaChart XAxis */}
                  <XAxis
                    dataKey="year"
                    height={60}
                    tick={
                      <CustomDualAxis
                        person1StartAge={person1StartAge || person?.age || 0}
                        person2StartAge={person2StartAge || person2?.age || 0}
                      />
                    }
                    label={{ value: "Years", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="assets"
                    name="Retirement Assets"
                    fill="#0284c7"
                    stroke="#0284c7"
                    stackId="1"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="policyValue"
                    name="Policy Value"
                    fill="#059669"
                    stroke="#059669"
                    stackId="1"
                    fillOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="deathBenefit"
                    name="Death Benefit"
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  {showComparison && comparisonData && (
                    <Line
                      type="monotone"
                      dataKey="totalAssetsNoPolicyLine"
                      name="Total Assets (No Policy)"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  )}
                  {showRetirementAge && retirementYear !== null && (
                    <ReferenceLine
                      x={retirementYear}
                      stroke="#f59e0b"
                      label={{
                        value: "Retirement",
                        position: "top",
                      }}
                    />
                  )}
                  {showLTCEvent && ltcEventYear !== null && (
                    <ReferenceLine
                      x={ltcEventYear}
                      stroke="#ef4444"
                      label={{
                        value: "LTC Event",
                        position: "top",
                      }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <CustomLegend />
          </Tabs>
        </CardContent>
      </Card>

      {/* Add the initial asset calculation component below the chart */}
      {showInitialCalculation && person && <InitialAssetCalculation person={person} personIndex={personIndex} />}
    </>
  )
}
