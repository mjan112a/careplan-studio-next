"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { getFullPolicyData } from "@/types/policy-data"
import type { Person } from "@/types/person"

interface AIAnalysisProps {
  person1: Person
  person2: Person
}

export function AIAnalysis({ person1, person2 }: AIAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false)
  const policyData = getFullPolicyData()

  // Get policy information for each person
  const person1Policy = policyData && policyData.length > 0 ? policyData[0] : null
  const person2Policy = policyData && policyData.length > 1 ? policyData[1] : null

  // Mock analysis data - in a real implementation, this would come from an LLM API
  const generateAnalysis = (person: Person, personPolicy: any, personIndex: number) => {
    if (!personPolicy) {
      return {
        noData: {
          title: "No Policy Data Available",
          content: `We couldn't generate a personalized analysis for this person because the policy data is not available. Please ensure the policy data is properly loaded.`,
        },
      }
    }

    const personName = personPolicy.policy_level_information.insured_person_name
    const personAge = personPolicy.policy_level_information.insured_person_age
    const personGender = personPolicy.policy_level_information.insured_person_gender
    const deathBenefit = personPolicy.policy_level_information.initial_death_benefit.toLocaleString()
    const premium = personPolicy.policy_level_information.initial_premium.toLocaleString()
    const ltcBenefit = personPolicy.annual_policy_data[0].monthly_benefit_limit * 12
    const ltcBenefitFormatted = ltcBenefit.toLocaleString()
    const surrenderValue20Years =
      personPolicy.annual_policy_data.find((d) => d.policy_year === 20)?.surrender_value.toLocaleString() || "0"

    // Get LTC rider details
    const ltcRider = personPolicy.policy_level_information.riders_and_features.find((rider) =>
      rider.rider_feature_name.includes("Chronic Care"),
    )

    return {
      personalizedNarrative: {
        title: "Personalized Client Narrative",
        content: `For ${personName}, this policy isn't just about long-term care—it's about maintaining independence and dignity during retirement years. With a monthly benefit of $${(ltcBenefit / 12).toLocaleString()}, ${personName} can ensure access to quality care without burdening family members. The death benefit of $${deathBenefit} also provides peace of mind knowing that loved ones will be financially protected.`,
      },
      objectionAnticipator: {
        title: "Objection Anticipator & Response",
        content: `Based on ${personName}'s profile as a ${personAge}-year-old ${personGender.toLowerCase()} with a focus on retirement planning, the most likely objection may be concerns about premium affordability over time. Consider addressing this by highlighting the policy's surrender value of $${surrenderValue20Years} after 20 years, which provides significant liquidity if needs change. Also emphasize that the $${premium} annual premium is securing both LTC protection and a death benefit.`,
      },
      policySimplifier: {
        title: "Policy Language Simplifier",
        content: `When your policy says "Accelerated Death Benefit for Chronic Care," what this means specifically for you, ${personName}, is that if you become unable to perform 2 of 6 daily living activities or have cognitive impairment, you can access up to $${ltcBenefitFormatted} annually for care expenses without having to submit receipts. This gives you the freedom to choose how and where you receive care, whether at home or in a facility.`,
      },
      competitiveEdge: {
        title: "Competitive Edge Identifier",
        content: `For someone in your situation, ${personName}, this policy has three distinct advantages over competing offerings: 1) The cash indemnity benefit that pays without requiring care receipts, 2) The ability to accelerate ${ltcRider?.acceleration_percentage_elected || 100}% of your death benefit for LTC needs, and 3) A monthly benefit structure that provides ${ltcRider?.monthly_payout_percentage_elected || 4}% of your death benefit monthly, higher than the industry standard.`,
      },
      taxAnalysis: {
        title: "Tax Advantage Analysis",
        content: `${personName}, your policy provides significant tax advantages: The LTC benefits are generally received tax-free under current tax law, the death benefit is typically income tax-free to beneficiaries, and the policy's cash value grows tax-deferred. Based on your current marginal tax rate of ${person.marginalTaxRate * 100}%, this tax-free LTC benefit is equivalent to a taxable benefit of $${Math.round(ltcBenefit / (1 - person.marginalTaxRate)).toLocaleString()} annually.`,
      },
      familyImpact: {
        title: "Family Impact Assessment",
        content: `If you require long-term care at age ${person.ltcEventAge}, without this policy, your family might need to provide ${person.ltcDuration} years of care or fund $${person.ltcCostPerYear.toLocaleString()} annually (growing with inflation). With this policy, that financial burden is significantly reduced, allowing family members to focus on emotional support rather than financial concerns or caregiving duties.`,
      },
      retirementIntegration: {
        title: "Retirement Plan Integration",
        content: `This policy complements your retirement strategy by protecting your $${person.retirementSavings.toLocaleString()} in savings from being depleted by long-term care costs. Our analysis shows that without LTC coverage, a care event at age ${person.ltcEventAge} could reduce your retirement assets by approximately 30-40%. This policy helps ensure your retirement income of $${(person.socialSecurityIncome + person.otherRetirementIncome).toLocaleString()} annually remains sustainable.`,
      },
      valueTimeline: {
        title: "Value Timeline Visualizer",
        content: `Your policy's value evolves over time: In the early years, the death benefit of $${deathBenefit} provides immediate protection. By year 10, your surrender value grows to $${personPolicy.annual_policy_data.find((d) => d.policy_year === 10)?.surrender_value.toLocaleString() || "0"}. At retirement age ${person.retirementAge}, your LTC benefit will have increased to approximately $${Math.round(ltcBenefit * Math.pow(1.02, person.retirementAge - personAge)).toLocaleString()} annually, assuming standard inflation protection.`,
      },
      scenarioModeler: {
        title: "Life Scenario Modeler",
        content: `We've modeled three scenarios for you, ${personName}: 1) No LTC event - your policy provides a death benefit and accumulates cash value reaching $${surrenderValue20Years} after 20 years. 2) LTC event at age ${person.ltcEventAge} - your policy provides $${ltcBenefitFormatted} annually for care, preserving approximately $${Math.round(person.ltcCostPerYear * person.ltcDuration).toLocaleString()} of your assets. 3) Early policy surrender - after 15 years, you could access approximately $${personPolicy.annual_policy_data.find((d) => d.policy_year === 15)?.surrender_value.toLocaleString() || "0"} in cash value.`,
      },
      legacyPlanning: {
        title: "Legacy Planning Optimizer",
        content: `This policy enhances your legacy planning options. The $${deathBenefit} death benefit provides immediate liquidity to beneficiaries, potentially avoiding forced asset sales. If you need LTC, the policy preserves your other assets for legacy purposes. Additionally, the charitable giving rider provides an extra benefit to your chosen charity without reducing your beneficiaries' portion.`,
      },
    }
  }

  const person1Analysis = generateAnalysis(person1, person1Policy, 0)
  const person2Analysis = generateAnalysis(person2, person2Policy, 1)

  const renderAnalysisCards = (analysis: any) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(analysis).map((item: any, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <p className="text-sm">{item.content}</p>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle>AI-Powered Policy Analysis</CardTitle>
          <CardDescription>Advanced insights generated from policy illustrations and personal data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="person1">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="person1">Person 1 Analysis</TabsTrigger>
              <TabsTrigger value="person2">Person 2 Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="person1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2 pt-4">
                          <Skeleton className="h-4 w-[250px]" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-[180px] w-full" />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                renderAnalysisCards(person1Analysis)
              )}
            </TabsContent>
            <TabsContent value="person2">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2 pt-4">
                          <Skeleton className="h-4 w-[250px]" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-[180px] w-full" />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                renderAnalysisCards(person2Analysis)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
