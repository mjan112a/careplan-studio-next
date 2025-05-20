"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { YearlyFinancialData } from "@/utils/financial-calculations"
import { formatCurrency } from "@/utils/format"
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
  Line,
} from "recharts"
// Update the imports to include the CustomDualAxis
import { CustomDualAxis } from "./custom-dual-axis"

// Update the IncomeExpenseChartProps interface to include person2 data
interface IncomeExpenseChartProps {
  data: YearlyFinancialData[]
  title?: string
  showLTCEvent?: boolean
  showRetirementAge?: boolean
  retirementAge?: number
  ltcEventAge?: number
  person1StartAge?: number
  person2StartAge?: number
  retirementAge2?: number
  ltcEventAge2?: number
}

export function IncomeExpenseChart({
  data,
  title = "Income & Expenses",
  showLTCEvent = true,
  showRetirementAge = true,
  retirementAge = 65,
  ltcEventAge = 80,
  person1StartAge,
  person2StartAge,
  retirementAge2,
  ltcEventAge2,
}: IncomeExpenseChartProps) {
  // Format data for the chart
  const chartData = data.map((item) => ({
    age: item.age,
    year: item.year,
    workIncome: Math.round(item.workIncome || 0),
    socialSecurityIncome: Math.round(item.socialSecurityIncome || 0),
    otherRetirementIncome: Math.round(item.otherRetirementIncome || 0),
    assetWithdrawals: Math.round(item.withdrawal || 0) - Math.round(item.taxOnWithdrawal || 0), // Add net withdrawals as income
    basicExpenses: -Math.round(item.basicExpenses || 0), // Make negative
    ltcExpenses: -Math.round(item.ltcExpenses || 0), // Make negative
    premiumExpenses: -Math.round(item.premiumExpenses || 0), // Make negative
    ltcBenefits: Math.round(item.ltcBenefits || 0),
    policyLoanTaken: Math.round(item.policyLoanTaken || 0),
    netCashFlow: Math.round(item.netCashFlow || 0),
    withdrawal: Math.round(item.withdrawal || 0),
    taxOnWithdrawal: -Math.round(item.taxOnWithdrawal || 0), // Make negative
    hasLTCEvent: item.hasLTCEvent,
    policyLoanInterest: Math.round(item.policyLoanInterest || 0),
    policyLoanBalance: Math.round(item.policyLoanBalance || 0),
    // Calculate total income and expenses for debugging
    totalIncome:
      Math.round(item.workIncome || 0) +
      Math.round(item.socialSecurityIncome || 0) +
      Math.round(item.otherRetirementIncome || 0) +
      Math.round(item.ltcBenefits || 0) +
      Math.round(item.policyLoanTaken || 0),
    totalExpenses:
      Math.round(item.basicExpenses || 0) +
      Math.round(item.ltcExpenses || 0) +
      Math.round(item.premiumExpenses || 0) +
      Math.round(item.taxOnWithdrawal || 0),
    // Fix: Use the correct property names from YearlyFinancialData
    assets: Math.round(item.assets || 0),
    policyValue: Math.round(item.policyValue || 0),
    totalAssets: Math.round((item.assets || 0) + (item.policyValue || 0)),
  }))

  // Update the CustomTooltip function to show both people's ages
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate Person 1 and Person 2 ages
      const person1Age = person1StartAge !== undefined ? person1StartAge + Number(label) : null
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
              {entry.name}: {formatCurrency(Math.abs(entry.value))}
            </p>
          ))}

          {/* Add detailed income/expense balance information */}
          {chartData.find((d) => d.age === label) && (
            <div className="mt-1 pt-1 border-t border-gray-200">
              <p className="text-xs font-semibold">Income/Expense Balance:</p>
              <p className="text-xs">
                Total Income: {formatCurrency(chartData.find((d) => d.age === label)?.totalIncome || 0)}
              </p>
              <p className="text-xs">
                Total Expenses: {formatCurrency(chartData.find((d) => d.age === label)?.totalExpenses || 0)}
              </p>
              <p className="text-xs font-semibold">
                Difference:{" "}
                {formatCurrency(
                  (chartData.find((d) => d.age === label)?.totalIncome || 0) -
                    (chartData.find((d) => d.age === label)?.totalExpenses || 0),
                )}
              </p>
              <p className="text-xs">
                Net Cash Flow: {formatCurrency(chartData.find((d) => d.age === label)?.netCashFlow || 0)}
              </p>
            </div>
          )}

          {/* Add policy loan information if relevant */}
          {chartData.find((d) => d.age === label) && chartData.find((d) => d.age === label)?.policyLoanTaken > 0 && (
            <div className="mt-1 pt-1 border-t border-gray-200">
              <p className="text-xs font-semibold">Policy Loan Details:</p>
              <p className="text-xs">
                New Loan: {formatCurrency(chartData.find((d) => d.age === label)?.policyLoanTaken || 0)}
              </p>
              <p className="text-xs">
                Loan Interest: {formatCurrency(chartData.find((d) => d.age === label)?.policyLoanInterest || 0)}
              </p>
              <p className="text-xs">
                Total Loan Balance: {formatCurrency(chartData.find((d) => d.age === label)?.policyLoanBalance || 0)}
              </p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" />
            {/* Update the XAxis to use the CustomDualAxis */}
            <XAxis
              dataKey="year"
              height={60}
              tick={<CustomDualAxis person1StartAge={person1StartAge || 0} person2StartAge={person2StartAge || 0} />}
            />
            <YAxis tickFormatter={(value) => `${(Math.abs(value) / 1000).toFixed(0)}k`} />
            <Tooltip content={CustomTooltip} />
            <Legend
              content={({ payload }) => (
                <div className="flex flex-wrap gap-4 justify-center text-xs">
                  {payload?.map((entry, index) => (
                    <div key={`item-${index}`} className="flex items-center">
                      <div className="w-3 h-3 mr-1" style={{ backgroundColor: entry.color }} />
                      <span>
                        {entry.value === "totalAssets" ? (
                          <span className="flex items-center">
                            Total Assets
                            <span
                              className="ml-1 text-gray-500 text-xs"
                              title="Sum of retirement assets and policy value"
                            >
                              (Assets + Policy Value)
                            </span>
                          </span>
                        ) : (
                          entry.value
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            />
            {/* Income bars with more distinct colors */}
            <Bar dataKey="workIncome" name="Work Income" fill="#0284c7" stackId="income" />
            <Bar dataKey="socialSecurityIncome" name="Social Security" fill="#7c3aed" stackId="income" />
            <Bar dataKey="otherRetirementIncome" name="Other Income" fill="#2563eb" stackId="income" />
            <Bar dataKey="ltcBenefits" name="LTC Benefits" fill="#059669" stackId="income" />
            <Bar dataKey="policyLoanTaken" name="Policy Loans" fill="#0d9488" stackId="income" />
            <Bar dataKey="assetWithdrawals" name="Asset Withdrawals" fill="#f59e0b" stackId="income" />

            {/* Expense bars with more distinct colors */}
            <Bar dataKey="basicExpenses" name="Basic Expenses" fill="#ea580c" />
            <Bar dataKey="ltcExpenses" name="LTC Expenses" fill="#dc2626" />
            <Bar dataKey="premiumExpenses" name="Premium Expenses" fill="#be185d" />
            <Bar dataKey="taxOnWithdrawal" name="Tax on Withdrawals" fill="#7e22ce" />

            {/* Add a line for net cash flow */}
            <Line
              type="monotone"
              dataKey="netCashFlow"
              name="Net Cash Flow"
              stroke="#000000"
              strokeWidth={2}
              dot={{ r: 3 }}
            />

            {showRetirementAge && <ReferenceLine x={retirementAge} stroke="#f59e0b" label="Retirement" />}
            {showLTCEvent && <ReferenceLine x={ltcEventAge} stroke="#ef4444" label="LTC Event" />}
            {/* Add reference lines for Person 2's events if provided */}
            {showRetirementAge && retirementAge2 && (
              <ReferenceLine x={retirementAge2 - (person2StartAge || 0)} stroke="#ec4899" label="P2 Retirement" />
            )}
            {showLTCEvent && ltcEventAge2 && (
              <ReferenceLine
                x={ltcEventAge2 - (person2StartAge || 0)}
                stroke="#ec4899"
                strokeDasharray="3 3"
                label="P2 LTC Event"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
