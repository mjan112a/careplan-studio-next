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

interface PolicyBenefitsChartProps {
  data: YearlyFinancialData[]
  title?: string
  showLTCEvent?: boolean
  ltcEventAge?: number
}

export function PolicyBenefitsChart({
  data,
  title = "Policy Benefits Over Time",
  showLTCEvent = true,
  ltcEventAge = 80,
}: PolicyBenefitsChartProps) {
  // Format data for the chart
  const chartData = data.map((item) => ({
    age: item.age,
    policyYear: item.policyYear,
    deathBenefit: Math.round(item.deathBenefit),
    ltcBenefits: Math.round(item.ltcBenefits),
    premiumExpenses: Math.round(item.premiumExpenses),
    policyValue: Math.round(item.policyValue),
    hasLTCEvent: item.hasLTCEvent,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white bg-opacity-90 p-3 border rounded shadow-sm text-sm"
          style={{ transform: "translate(10px, -20px)" }}
        >
          <p className="font-bold text-xs">Age: {label}</p>
          <p className="text-xs">Policy Year: {payload[0]?.payload.policyYear}</p>
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
              <Line type="monotone" dataKey="deathBenefit" name="Death Benefit" stroke="#dc2626" strokeWidth={3} />
              <Line type="monotone" dataKey="policyValue" name="Cash Value" stroke="#059669" strokeWidth={3} />
              <Line type="monotone" dataKey="ltcBenefits" name="LTC Benefits" stroke="#7c3aed" strokeWidth={3} />
              <Line
                type="monotone"
                dataKey="premiumExpenses"
                name="Premium"
                stroke="#ea580c"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              {showLTCEvent && <ReferenceLine x={ltcEventAge} stroke="#ef4444" label="LTC Event" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
