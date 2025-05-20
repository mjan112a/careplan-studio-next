"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPercentage } from "@/utils/format"
import { getPolicyDataForPerson } from "@/types/policy-data"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PolicyGrowthChartProps {
  personIndex: number
  title?: string
}

export function PolicyGrowthChart({ personIndex, title = "Policy Growth Rates" }: PolicyGrowthChartProps) {
  const policyData = getPolicyDataForPerson(personIndex)

  if (!policyData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-center">No policy data available for this person.</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate growth rates from the annual data
  const growthData = policyData.annual_policy_data.map((data, index) => {
    // Skip the first year as we can't calculate growth rate
    if (index === 0) {
      return {
        policyYear: data.policy_year,
        age: data.insured_age,
        cashValueGrowthRate: 0,
        deathBenefitGrowthRate: 0,
      }
    }

    const prevData = policyData.annual_policy_data[index - 1]

    // Calculate cash value growth rate
    let cashValueGrowthRate = 0
    if (prevData.accumulation_value > 0) {
      cashValueGrowthRate = data.accumulation_value / prevData.accumulation_value - 1
    }

    // Calculate death benefit growth rate
    let deathBenefitGrowthRate = 0
    if (prevData.death_benefit > 0) {
      deathBenefitGrowthRate = data.death_benefit / prevData.death_benefit - 1
    }

    return {
      policyYear: data.policy_year,
      age: data.insured_age,
      cashValueGrowthRate,
      deathBenefitGrowthRate,
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white bg-opacity-90 p-3 border rounded shadow-sm text-sm">
          <p className="font-bold text-xs">Policy Year: {label}</p>
          <p className="text-xs">Age: {payload[0]?.payload.age}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {entry.name}: {formatPercentage(entry.value)}
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
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="policyYear" label={{ value: "Policy Year", position: "insideBottom", offset: -5 }} />
              <YAxis
                tickFormatter={(value) => formatPercentage(value)}
                label={{ value: "Growth Rate", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cashValueGrowthRate"
                name="Cash Value Growth"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="deathBenefitGrowthRate"
                name="Death Benefit Growth"
                stroke="#f43f5e"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
