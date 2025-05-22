"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatPercentage } from "@/utils/format"
import type { YearlyFinancialData } from "@/utils/financial-calculations"
import type { Person } from "@/types/person"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
// Update the CustomXAxis reference to use our new component
import { CustomDualAxis } from "./custom-dual-axis"

// Update the TaxImpactVisualizationProps interface
interface TaxImpactVisualizationProps {
  data: YearlyFinancialData[]
  comparisonData?: YearlyFinancialData[]
  title?: string
  person1?: Person
  person2?: Person
  showRetirementAge?: boolean
  retirementAge1?: number
  retirementAge2?: number
  ltcEventAge1?: number
  ltcEventAge2?: number
  deathAge1?: number
  deathAge2?: number
  ageDifference?: number
  person1StartAge?: number
  person2StartAge?: number
}

export function TaxImpactVisualization({
  data,
  comparisonData,
  title = "Tax Impact Analysis",
  person1,
  person2,
  showRetirementAge = true,
  retirementAge1 = 65,
  retirementAge2,
  ltcEventAge1 = 80,
  ltcEventAge2,
  deathAge1,
  deathAge2,
  ageDifference = 0,
  person1StartAge,
  person2StartAge,
}: TaxImpactVisualizationProps) {
  const [chartType, setChartType] = useState<"cumulative" | "annual" | "breakdown">("cumulative")
  const [showComparison, setShowComparison] = useState(true)

  // Calculate tax metrics
  const calculateTaxMetrics = (projectionData: YearlyFinancialData[]) => {
    // Total tax paid over the entire projection
    const totalTaxPaid = projectionData.reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

    // Pre-retirement tax paid (using person1's retirement age as reference)
    const preRetirementTaxPaid = projectionData
      .filter((year) => year.age < (retirementAge1 || 65))
      .reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

    // Retirement tax paid (before LTC event)
    const retirementTaxPaid = projectionData
      .filter((year) => year.age >= (retirementAge1 || 65) && !year.hasLTCEvent)
      .reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

    // LTC event tax paid
    const ltcEventTaxPaid = projectionData
      .filter((year) => year.hasLTCEvent)
      .reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

    // Tax efficiency ratio (lower is better)
    // This measures how much tax is paid relative to total withdrawals
    const totalWithdrawals = projectionData.reduce((sum, year) => sum + year.withdrawal, 0)
    const taxEfficiencyRatio = totalWithdrawals > 0 ? totalTaxPaid / totalWithdrawals : 0

    return {
      totalTaxPaid,
      preRetirementTaxPaid,
      retirementTaxPaid,
      ltcEventTaxPaid,
      taxEfficiencyRatio,
    }
  }

  const withPolicyMetrics = calculateTaxMetrics(data)
  const withoutPolicyMetrics = comparisonData ? calculateTaxMetrics(comparisonData) : null

  // Format data for the charts with dual age axis
  const formatChartData = () => {
    // Cumulative tax data
    const cumulativeData = data.map((item, index) => {
      // Calculate cumulative tax up to this point
      const cumulativeTax = data.slice(0, index + 1).reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

      // Get comparison data if available
      const comparisonCumulativeTax = comparisonData
        ? comparisonData
            .slice(0, index + 1)
            .filter((year) => year.age <= item.age)
            .reduce((sum, year) => sum + year.taxOnWithdrawal, 0)
        : undefined

      // Calculate Person 2's age based on age difference
      const person2Age = item.age - ageDifference

      return {
        year: index,
        age: item.age,
        person2Age,
        cumulativeTax,
        comparisonCumulativeTax,
        hasLTCEvent: item.hasLTCEvent,
        isRetired: item.age >= (retirementAge1 || 65),
      }
    })

    // Annual tax data
    const annualData = data.map((item) => {
      // Get comparison data if available
      const comparisonItem = comparisonData?.find((year) => year.age === item.age)

      // Calculate Person 2's age based on age difference
      const person2Age = item.age - ageDifference

      return {
        year: data.indexOf(item),
        age: item.age,
        person2Age,
        annualTax: item.taxOnWithdrawal,
        comparisonAnnualTax: comparisonItem?.taxOnWithdrawal,
        hasLTCEvent: item.hasLTCEvent,
        isRetired: item.age >= (retirementAge1 || 65),
      }
    })

    // Tax breakdown data for pie chart
    const breakdownData = [
      {
        name: "Pre-Retirement",
        value: withPolicyMetrics.preRetirementTaxPaid,
        color: "#0284c7", // Blue
      },
      {
        name: "Retirement",
        value: withPolicyMetrics.retirementTaxPaid,
        color: "#059669", // Green
      },
      {
        name: "LTC Event",
        value: withPolicyMetrics.ltcEventTaxPaid,
        color: "#dc2626", // Red
      },
    ]

    // Comparison breakdown data
    const comparisonBreakdownData = withoutPolicyMetrics
      ? [
          {
            name: "Pre-Retirement",
            value: withoutPolicyMetrics.preRetirementTaxPaid,
            color: "#0369a1", // Darker Blue
          },
          {
            name: "Retirement",
            value: withoutPolicyMetrics.retirementTaxPaid,
            color: "#047857", // Darker Green
          },
          {
            name: "LTC Event",
            value: withoutPolicyMetrics.ltcEventTaxPaid,
            color: "#b91c1c", // Darker Red
          },
        ]
      : []

    return {
      cumulativeData,
      annualData,
      breakdownData,
      comparisonBreakdownData,
    }
  }

  const { cumulativeData, annualData, breakdownData, comparisonBreakdownData } = formatChartData()

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the data point to get Person 2's age
      const dataPoint = cumulativeData.find((d) => d.age === label)
      const person2Age = dataPoint ? dataPoint.person2Age : label - (ageDifference || 0)

      return (
        <div className="bg-white bg-opacity-90 p-3 border rounded shadow-sm text-sm">
          <p className="font-bold text-xs">
            Person 1 Age: {label} | Person 2 Age: {person2Age}
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

  // Custom X Axis with dual age labels
  const CustomXAxis = (props: any) => {
    const { x, y, width, height, stroke, payload } = props

    // Add null checks to handle undefined payload
    if (!payload || payload.value === undefined) {
      return null // Return null if payload or payload.value is undefined
    }

    // Calculate Person 2's age based on age difference
    const person2Age = payload.value - (ageDifference || 0)

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
          {payload.value}
        </text>
        <text x={0} y={0} dy={32} textAnchor="middle" fill="#666" fontSize={12}>
          {person2Age}
        </text>
      </g>
    )
  }

  // Tax savings calculation
  const taxSavings = withoutPolicyMetrics ? withoutPolicyMetrics.totalTaxPaid - withPolicyMetrics.totalTaxPaid : 0

  // Tax efficiency improvement
  const taxEfficiencyImprovement = withoutPolicyMetrics
    ? withoutPolicyMetrics.taxEfficiencyRatio - withPolicyMetrics.taxEfficiencyRatio
    : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <div className="text-sm font-normal">
            {withoutPolicyMetrics && (
              <span
                className={
                  taxSavings > 0 ? "text-emerald-600 font-medium" : taxSavings < 0 ? "text-red-600 font-medium" : ""
                }
              >
                {taxSavings > 0
                  ? `Tax Savings: ${formatCurrency(taxSavings)}`
                  : taxSavings < 0
                    ? `Additional Tax: ${formatCurrency(Math.abs(taxSavings))}`
                    : "No Tax Difference"}
              </span>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Total tax paid over lifetime:{" "}
          <span className="font-medium">{formatCurrency(withPolicyMetrics.totalTaxPaid)}</span>
          {withoutPolicyMetrics && (
            <span className="text-muted-foreground ml-2">
              (vs. {formatCurrency(withoutPolicyMetrics.totalTaxPaid)} without policy)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cumulative">Cumulative Tax</TabsTrigger>
            <TabsTrigger value="annual">Annual Tax</TabsTrigger>
            <TabsTrigger value="breakdown">Tax Breakdown</TabsTrigger>
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

          {/* Cumulative Tax Chart */}
          <TabsContent value="cumulative" className="h-[400px]">
            <div className="mb-2 text-xs text-center text-gray-500 flex justify-center">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>Person 1 Events</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-pink-500 mr-1"></div>
                <span>Person 2 Events</span>
              </div>
            </div>
            <div className="mb-2 text-xs text-center text-gray-500">
              <span>X-Axis: Top Row = Person 1 Age | Bottom Row = Person 2 Age</span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={cumulativeData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  height={60}
                  tick={
                    <CustomDualAxis
                      person1StartAge={person1StartAge || person1?.age || 0}
                      person2StartAge={person2StartAge || person2?.age || 0}
                    />
                  }
                  label={{
                    value: "Years",
                    position: "insideBottom",
                    offset: -15,
                  }}
                />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulativeTax"
                  name="Cumulative Tax (With Policy)"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.6}
                />
                {showComparison && comparisonData && (
                  <Area
                    type="monotone"
                    dataKey="comparisonCumulativeTax"
                    name="Cumulative Tax (Without Policy)"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.6}
                    strokeDasharray="5 5"
                  />
                )}

                {/* Person 1 Event Reference Lines */}
                {showRetirementAge && retirementAge1 && person1StartAge && (
                  <ReferenceLine
                    x={retirementAge1 - person1StartAge}
                    stroke="#3b82f6"
                    label={{
                      value: "P1 Retirement",
                      position: "top",
                      fill: "#3b82f6",
                      fontSize: 12,
                    }}
                  />
                )}

                {ltcEventAge1 && person1StartAge && (
                  <ReferenceLine
                    x={ltcEventAge1 - person1StartAge}
                    stroke="#3b82f6"
                    strokeDasharray="3 3"
                    label={{
                      value: "P1 LTC",
                      position: "top",
                      fill: "#3b82f6",
                      fontSize: 12,
                    }}
                  />
                )}

                {deathAge1 && (
                  <ReferenceLine
                    x={deathAge1 - (person1StartAge || 0)}
                    stroke="#3b82f6"
                    strokeDasharray="5 5"
                    label={{
                      value: "P1 Death",
                      position: "top",
                      fill: "#3b82f6",
                      fontSize: 12,
                    }}
                  />
                )}

                {/* Person 2 Event Reference Lines */}
                {showRetirementAge && retirementAge2 && person2StartAge && (
                  <ReferenceLine
                    x={retirementAge2 - person2StartAge}
                    stroke="#ec4899"
                    label={{
                      value: "P2 Retirement",
                      position: "insideBottomRight",
                      fill: "#ec4899",
                      fontSize: 12,
                    }}
                  />
                )}

                {ltcEventAge2 && (
                  <ReferenceLine
                    x={ltcEventAge2 - (person2StartAge || 0)}
                    stroke="#ec4899"
                    strokeDasharray="3 3"
                    label={{
                      value: "P2 LTC",
                      position: "insideBottomRight",
                      fill: "#ec4899",
                      fontSize: 12,
                    }}
                  />
                )}

                {deathAge2 && (
                  <ReferenceLine
                    x={deathAge2 - (person2StartAge || 0)}
                    stroke="#ec4899"
                    strokeDasharray="5 5"
                    label={{
                      value: "P2 Death",
                      position: "insideBottomRight",
                      fill: "#ec4899",
                      fontSize: 12,
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Annual Tax Chart */}
          <TabsContent value="annual" className="h-[400px]">
            <div className="mb-2 text-xs text-center text-gray-500 flex justify-center">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>Person 1 Events</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-pink-500 mr-1"></div>
                <span>Person 2 Events</span>
              </div>
            </div>
            <div className="mb-2 text-xs text-center text-gray-500">
              <span>X-Axis: Top Row = Person 1 Age | Bottom Row = Person 2 Age</span>
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={annualData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  height={60}
                  tick={
                    <CustomDualAxis
                      person1StartAge={person1StartAge || person1?.age || 0}
                      person2StartAge={person2StartAge || person2?.age || 0}
                    />
                  }
                  label={{
                    value: "Years",
                    position: "insideBottom",
                    offset: -15,
                  }}
                />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="annualTax"
                  name="Annual Tax (With Policy)"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                  barSize={8}
                />
                {showComparison && comparisonData && (
                  <Bar
                    dataKey="comparisonAnnualTax"
                    name="Annual Tax (Without Policy)"
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                    barSize={8}
                  />
                )}

                {/* Person 1 Event Reference Lines */}
                {showRetirementAge && retirementAge1 && person1StartAge && (
                  <ReferenceLine
                    x={retirementAge1 - person1StartAge}
                    stroke="#3b82f6"
                    label={{
                      value: "P1 Retirement",
                      position: "top",
                      fill: "#3b82f6",
                      fontSize: 12,
                    }}
                  />
                )}

                {ltcEventAge1 && person1StartAge && (
                  <ReferenceLine
                    x={ltcEventAge1 - person1StartAge}
                    stroke="#3b82f6"
                    strokeDasharray="3 3"
                    label={{
                      value: "P1 LTC",
                      position: "top",
                      fill: "#3b82f6",
                      fontSize: 12,
                    }}
                  />
                )}

                {deathAge1 && (
                  <ReferenceLine
                    x={deathAge1 - (person1StartAge || 0)}
                    stroke="#3b82f6"
                    strokeDasharray="5 5"
                    label={{
                      value: "P1 Death",
                      position: "top",
                      fill: "#3b82f6",
                      fontSize: 12,
                    }}
                  />
                )}

                {/* Person 2 Event Reference Lines */}
                {showRetirementAge && retirementAge2 && person2StartAge && (
                  <ReferenceLine
                    x={retirementAge2 - person2StartAge}
                    stroke="#ec4899"
                    label={{
                      value: "P2 Retirement",
                      position: "insideBottomRight",
                      fill: "#ec4899",
                      fontSize: 12,
                    }}
                  />
                )}

                {ltcEventAge2 && (
                  <ReferenceLine
                    x={ltcEventAge2 - (person2StartAge || 0)}
                    stroke="#ec4899"
                    strokeDasharray="3 3"
                    label={{
                      value: "P2 LTC",
                      position: "insideBottomRight",
                      fill: "#ec4899",
                      fontSize: 12,
                    }}
                  />
                )}

                {deathAge2 && (
                  <ReferenceLine
                    x={deathAge2 - (person2StartAge || 0)}
                    stroke="#ec4899"
                    strokeDasharray="5 5"
                    label={{
                      value: "P2 Death",
                      position: "insideBottomRight",
                      fill: "#ec4899",
                      fontSize: 12,
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Tax Breakdown */}
          <TabsContent value="breakdown" className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="flex flex-col">
                <h3 className="text-sm font-medium mb-2 text-center">Tax Breakdown (With Policy)</h3>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={breakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Pre-Retirement Tax:</span>
                    <span>{formatCurrency(withPolicyMetrics.preRetirementTaxPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Retirement Tax:</span>
                    <span>{formatCurrency(withPolicyMetrics.retirementTaxPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>LTC Event Tax:</span>
                    <span>{formatCurrency(withPolicyMetrics.ltcEventTaxPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1 border-t">
                    <span>Total Tax:</span>
                    <span>{formatCurrency(withPolicyMetrics.totalTaxPaid)}</span>
                  </div>
                </div>
              </div>

              {showComparison && comparisonData && withoutPolicyMetrics && (
                <div className="flex flex-col">
                  <h3 className="text-sm font-medium mb-2 text-center">Tax Breakdown (Without Policy)</h3>
                  <div className="flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={comparisonBreakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {comparisonBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Pre-Retirement Tax:</span>
                      <span>{formatCurrency(withoutPolicyMetrics.preRetirementTaxPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Retirement Tax:</span>
                      <span>{formatCurrency(withoutPolicyMetrics.retirementTaxPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>LTC Event Tax:</span>
                      <span>{formatCurrency(withoutPolicyMetrics.ltcEventTaxPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-1 border-t">
                      <span>Total Tax:</span>
                      <span>{formatCurrency(withoutPolicyMetrics.totalTaxPaid)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Tax Insights Section */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Tax Efficiency Insights</h3>
          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-500">Tax Efficiency Ratio</h4>
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">{formatPercentage(withPolicyMetrics.taxEfficiencyRatio)}</p>
                {withoutPolicyMetrics && (
                  <div
                    className={
                      taxEfficiencyImprovement > 0
                        ? "text-emerald-600 text-sm"
                        : taxEfficiencyImprovement < 0
                          ? "text-red-600 text-sm"
                          : "text-sm"
                    }
                  >
                    {taxEfficiencyImprovement > 0
                      ? `${formatPercentage(taxEfficiencyImprovement)} more efficient`
                      : taxEfficiencyImprovement < 0
                        ? `${formatPercentage(Math.abs(taxEfficiencyImprovement))} less efficient`
                        : "No difference"}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Ratio of tax paid to total withdrawals (lower is better)
                {withoutPolicyMetrics && (
                  <span className="ml-1">
                    vs. {formatPercentage(withoutPolicyMetrics.taxEfficiencyRatio)} without policy
                  </span>
                )}
              </p>
            </div>

            {/* Tax Strategy Recommendations */}
            <div className="border rounded-lg p-3 bg-blue-50">
              <h4 className="text-xs font-medium text-blue-700">Tax Strategy Recommendations</h4>
              <ul className="text-xs text-gray-700 mt-1 space-y-1 list-disc pl-4">
                <li>
                  Consider Roth conversions in low-income years to reduce future tax burden on retirement withdrawals
                </li>
                <li>
                  Explore tax-free LTC benefits through qualified LTC insurance to avoid taxation on benefit payments
                </li>
                <li>Strategically time withdrawals to stay in lower tax brackets and minimize lifetime tax burden</li>
                <li>
                  Utilize tax-free death benefits to efficiently transfer wealth to beneficiaries without tax
                  implications
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
