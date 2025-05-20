"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/utils/format"
import type { YearlyFinancialData } from "@/utils/financial-calculations"
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

interface PolicyComparisonChartProps {
  data: YearlyFinancialData[]
  title?: string
  showLTCEvent?: boolean
  ltcEventAge?: number
}

export function PolicyComparisonChart({
  data,
  title = "Policy Value Comparison",
  showLTCEvent = true,
  ltcEventAge = 80,
}: PolicyComparisonChartProps) {
  // Format data for the chart
  const chartData = data.map((item) => ({
    age: item.age,
    policyYear: item.policyYear,
    adjustedCashValue: Math.round(item.policyValue),
    adjustedDeathBenefit: Math.round(item.deathBenefit),
    originalCashValue: Math.round(item.originalPolicyValue || 0),
    originalDeathBenefit: Math.round(item.originalDeathBenefit || 0),
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
              <Line
                type="monotone"
                dataKey="adjustedCashValue"
                name="Adjusted Cash Value"
                stroke="#059669"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="adjustedDeathBenefit"
                name="Adjusted Death Benefit"
                stroke="#dc2626"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="originalCashValue"
                name="Original Cash Value"
                stroke="#0d9488"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="originalDeathBenefit"
                name="Original Death Benefit"
                stroke="#be185d"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
              {showLTCEvent && <ReferenceLine x={ltcEventAge} stroke="#ef4444" label="LTC Event" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
