"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPolicyDataForPerson } from "@/types/policy-data"
import { formatCurrency } from "@/utils/format"
import { PolicyData } from "@/types/simulator-interfaces"

interface PolicyDetailsProps {
  personIndex?: number
  shiftPolicyYear?: boolean
  policyData?: PolicyData[] | null
}

export function PolicyDetails({ personIndex = 0, shiftPolicyYear = false, policyData }: PolicyDetailsProps) {
  const policyDataForPerson = getPolicyDataForPerson(personIndex, policyData)

  if (!policyDataForPerson) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No policy data available.</p>
        </CardContent>
      </Card>
    )
  }

  const { policy_level_information, annual_policy_data } = policyDataForPerson

  // Adjust policy years if shift is enabled
  const adjustedAnnualData = shiftPolicyYear
    ? annual_policy_data.map((data) => ({
        ...data,
        policy_year: data.policy_year - 1, // Shift year down by 1
      }))
    : annual_policy_data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Details</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="riders">Riders</TabsTrigger>
            <TabsTrigger value="annual">Annual Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Insured</h3>
                <p className="text-sm">{policy_level_information.insured_person_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Age</h3>
                <p className="text-sm">{policy_level_information.insured_person_age}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Product</h3>
                <p className="text-sm">{policy_level_information.product_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Type</h3>
                <p className="text-sm capitalize">{policy_level_information.policy_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Initial Premium</h3>
                <p className="text-sm">{formatCurrency(policy_level_information.initial_premium)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Initial Death Benefit</h3>
                <p className="text-sm">{formatCurrency(policy_level_information.initial_death_benefit)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">Gender</h3>
                <p className="text-sm">{policy_level_information.insured_person_gender}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Risk Classification</h3>
                <p className="text-sm">{policy_level_information.insured_person_risk_classification}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="riders" className="pt-4">
            <div className="space-y-4">
              {policy_level_information.riders_and_features.map((rider, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <h3 className="text-sm font-medium">{rider.rider_feature_name}</h3>
                  <p className="text-xs text-muted-foreground">Status: {rider.status}</p>
                  <p className="text-xs mt-1">{rider.details}</p>
                  {rider.form_number && <p className="text-xs mt-1">Form: {rider.form_number}</p>}
                  {rider.acceleration_percentage_elected && (
                    <p className="text-xs mt-1">Acceleration: {rider.acceleration_percentage_elected}%</p>
                  )}
                  {rider.monthly_payout_percentage_elected && (
                    <p className="text-xs mt-1">Monthly Payout: {rider.monthly_payout_percentage_elected}%</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="annual" className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Year</th>
                    <th className="text-left p-2">Age</th>
                    <th className="text-right p-2">Premium</th>
                    <th className="text-right p-2">Cash Value</th>
                    <th className="text-right p-2">Death Benefit</th>
                    <th className="text-right p-2">Monthly LTC</th>
                    {policy_level_information.policy_type === "hybrid" && (
                      <th className="text-right p-2">Annual LTC</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {adjustedAnnualData.map((data, index) => (
                    <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="p-2">{data.policy_year}</td>
                      <td className="p-2">{data.insured_age}</td>
                      <td className="text-right p-2">{formatCurrency(data.annual_premium)}</td>
                      <td className="text-right p-2">{formatCurrency(data.surrender_value)}</td>
                      <td className="text-right p-2">{formatCurrency(data.death_benefit)}</td>
                      <td className="text-right p-2">{formatCurrency(data.monthly_benefit_limit)}</td>
                      {policy_level_information.policy_type === "hybrid" && data.annual_ltc_benefit && (
                        <td className="text-right p-2">{formatCurrency(data.annual_ltc_benefit)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
