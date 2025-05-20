"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { YearlyFinancialData } from "@/utils/financial-calculations"
import { formatCurrency } from "@/utils/format"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface PolicyLoanChartProps {
  data: YearlyFinancialData[]
  title?: string
  showLTCEvent?: boolean
  showRetirementAge?: boolean
  retirementAge?: number
  ltcEventAge?: number
}

export function PolicyLoanChart({
  data,
  title = "Policy Loan Analysis",
  showLTCEvent = true,
  showRetirementAge = true,
  retirementAge = 65,
  ltcEventAge = 80,
}: PolicyLoanChartProps) {
  // Format data for the chart
  const chartData = data.map((item) => ({
    age: item.age,
    policyLoanTaken: Math.round(item.policyLoanTaken || 0),
    policyLoanBalance: Math.round(item.policyLoanBalance || 0),
    policyLoanInterest: Math.round(item.policyLoanInterest || 0),
    policyValue: Math.round(item.policyValue || 0),
    deathBenefit: Math.round(item.deathBenefit || 0),
    netDeathBenefit: Math.round((item.deathBenefit || 0) - (item.policyLoanBalance || 0)),
    hasLTCEvent: item.hasLTCEvent,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the policy loan balance entry
      const loanBalanceEntry = payload.find((p: any) => p.dataKey === "policyLoanBalance")
      const deathBenefitEntry = payload.find((p: any) => p.dataKey === "deathBenefit")

      // Only show loan impact if there's a loan balance
      const hasLoanBalance = loanBalanceEntry && loanBalanceEntry.value > 0
      const deathBenefitValue = deathBenefitEntry ? deathBenefitEntry.value : 0
      const loanBalanceValue = loanBalanceEntry ? loanBalanceEntry.value : 0

      return (
        <div
          className="bg-white bg-opacity-90 p-3 border rounded shadow-sm text-sm"
          style={{ transform: "translate(10px, -20px)" }}
        >
          <p className="font-bold text-xs">Age: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}

          {/* Add policy loan impact on death benefit */}
          {hasLoanBalance && (
            <div className="mt-1 pt-1 border-t border-gray-200">
              <p className="text-xs font-semibold">Death Benefit Impact:</p>
              <p className="text-xs">Gross Death Benefit: {formatCurrency(deathBenefitValue)}</p>
              <p className="text-xs">Loan Balance: {formatCurrency(loanBalanceValue)}</p>
              <p className="text-xs">
                Net Death Benefit: {formatCurrency(Math.max(0, deathBenefitValue - loanBalanceValue))}
              </p>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  // Check if there are any policy loans in the data
  const hasAnyPolicyLoans = data.some((item) => (item.policyLoanBalance || 0) > 0)

  if (!hasAnyPolicyLoans) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-center">
            No policy loans have been taken in this scenario.
            <br />
            Enable policy loans in the Policy tab to see this analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="policyLoanBalance" name="Loan Balance" stroke="#dc2626" strokeWidth={3} />
              <Line
                type="monotone"
                dataKey="policyLoanTaken"
                name="New Loan"
                stroke="#ea580c"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="policyLoanInterest"
                name="Loan Interest"
                stroke="#be185d"
                strokeWidth={2}
                strokeDasharray="2 2"
              />
              <Line type="monotone" dataKey="policyValue" name="Policy Value" stroke="#059669" strokeWidth={3} />
              <Line
                type="monotone"
                dataKey="deathBenefit"
                name="Gross Death Benefit"
                stroke="#7c3aed"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              {showRetirementAge && <ReferenceLine x={retirementAge} stroke="#f59e0b" label="Retirement" />}
              {showLTCEvent && <ReferenceLine x={ltcEventAge} stroke="#ef4444" label="LTC Event" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
