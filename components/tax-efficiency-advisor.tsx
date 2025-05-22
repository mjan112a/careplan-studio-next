"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatPercentage } from "@/utils/format"
import type { YearlyFinancialData } from "@/utils/financial-calculations"
import type { Person } from "@/types/person"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface TaxEfficiencyAdvisorProps {
  person1Projection: YearlyFinancialData[]
  person2Projection?: YearlyFinancialData[]
  householdProjection: YearlyFinancialData[]
  householdProjectionWithoutInsurance: YearlyFinancialData[]
  person1: Person
  person2?: Person
}

export function TaxEfficiencyAdvisor({
  person1Projection,
  person2Projection,
  householdProjection,
  householdProjectionWithoutInsurance,
  person1,
  person2,
}: TaxEfficiencyAdvisorProps) {
  // Calculate total tax paid for each scenario
  const calculateTotalTax = (projection: YearlyFinancialData[]) => {
    return projection.reduce((sum, year) => sum + year.taxOnWithdrawal, 0)
  }

  const person1TotalTax = calculateTotalTax(person1Projection)
  const person2TotalTax = person2Projection ? calculateTotalTax(person2Projection) : 0
  const householdTotalTax = calculateTotalTax(householdProjection)
  const householdTotalTaxWithoutInsurance = calculateTotalTax(householdProjectionWithoutInsurance)

  // Calculate tax savings
  const taxSavings = householdTotalTaxWithoutInsurance - householdTotalTax

  // Calculate tax by life phase
  const calculateTaxByPhase = (projection: YearlyFinancialData[], retirementAge: number) => {
    const preRetirementTax = projection
      .filter((year) => year.age < retirementAge)
      .reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

    const retirementTax = projection
      .filter((year) => year.age >= retirementAge && !year.hasLTCEvent)
      .reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

    const ltcEventTax = projection
      .filter((year) => year.hasLTCEvent)
      .reduce((sum, year) => sum + year.taxOnWithdrawal, 0)

    return {
      preRetirementTax,
      retirementTax,
      ltcEventTax,
    }
  }

  const householdTaxByPhase = calculateTaxByPhase(householdProjection, person1.retirementAge)
  const householdTaxByPhaseWithoutInsurance = calculateTaxByPhase(
    householdProjectionWithoutInsurance,
    person1.retirementAge,
  )

  // Find the years with highest tax burden
  const getHighTaxYears = (projection: YearlyFinancialData[], top = 5) => {
    return [...projection]
      .sort((a, b) => b.taxOnWithdrawal - a.taxOnWithdrawal)
      .slice(0, top)
      .map((year) => ({
        age: year.age,
        tax: year.taxOnWithdrawal,
        withdrawal: year.withdrawal,
        hasLTCEvent: year.hasLTCEvent,
        isRetired: year.age >= person1.retirementAge,
      }))
  }

  const highTaxYears = getHighTaxYears(householdProjection)
  const highTaxYearsWithoutInsurance = getHighTaxYears(householdProjectionWithoutInsurance)

  // Calculate tax efficiency metrics
  const calculateTaxEfficiency = (projection: YearlyFinancialData[]) => {
    const totalWithdrawals = projection.reduce((sum, year) => sum + year.withdrawal, 0)
    const totalTax = projection.reduce((sum, year) => sum + year.taxOnWithdrawal, 0)
    const taxEfficiencyRatio = totalWithdrawals > 0 ? totalTax / totalWithdrawals : 0

    return {
      totalWithdrawals,
      totalTax,
      taxEfficiencyRatio,
    }
  }

  const householdTaxEfficiency = calculateTaxEfficiency(householdProjection)
  const householdTaxEfficiencyWithoutInsurance = calculateTaxEfficiency(householdProjectionWithoutInsurance)

  // Generate tax-saving strategies based on the data
  const generateTaxStrategies = () => {
    const strategies = []

    // Strategy 1: Roth Conversion
    const rothConversionSavings = householdTaxByPhase.retirementTax * 0.3 // Estimate 30% savings
    strategies.push({
      name: "Strategic Roth Conversions",
      description:
        "Convert traditional retirement assets to Roth accounts during lower-income years to reduce future tax burden.",
      potentialSavings: rothConversionSavings,
      implementation:
        "Identify years with lower income (especially early retirement) and convert portions of traditional retirement accounts to Roth accounts, paying taxes at potentially lower rates now to avoid higher taxes later.",
      impact: "Reduces tax burden during retirement and LTC events by creating tax-free withdrawal options.",
    })

    // Strategy 2: Tax-Free LTC Benefits
    const ltcBenefitTaxSavings = householdTaxByPhase.ltcEventTax * 0.8 // Estimate 80% savings
    strategies.push({
      name: "Tax-Free LTC Benefits",
      description:
        "Utilize qualified long-term care insurance policies that provide tax-free benefits to cover LTC expenses.",
      potentialSavings: ltcBenefitTaxSavings,
      implementation:
        "Structure LTC coverage through qualified policies that provide tax-free benefits under Section 7702B of the Internal Revenue Code.",
      impact:
        "Eliminates taxation on LTC benefit payments, significantly reducing tax burden during high-expense LTC years.",
    })

    // Strategy 3: Asset Location Optimization
    const assetLocationSavings = householdTotalTax * 0.15 // Estimate 15% savings
    strategies.push({
      name: "Asset Location Optimization",
      description: "Strategically place investments in tax-advantaged or taxable accounts based on tax efficiency.",
      potentialSavings: assetLocationSavings,
      implementation:
        "Place tax-inefficient investments (bonds, REITs) in tax-advantaged accounts and tax-efficient investments (index funds, growth stocks) in taxable accounts.",
      impact:
        "Reduces overall tax drag on investment returns and creates more flexibility for tax-efficient withdrawals in retirement.",
    })

    // Strategy 4: Bracket Management
    const bracketManagementSavings = householdTotalTax * 0.1 // Estimate 10% savings
    strategies.push({
      name: "Tax Bracket Management",
      description: "Carefully manage withdrawals to stay within lower tax brackets and avoid bracket creep.",
      potentialSavings: bracketManagementSavings,
      implementation:
        "Plan withdrawals from different account types (taxable, tax-deferred, tax-free) to optimize annual tax burden and stay within target tax brackets.",
      impact:
        "Smooths tax burden over retirement years and prevents large tax spikes that push income into higher brackets.",
    })

    // Strategy 5: Charitable Giving
    const charitableGivingSavings = householdTotalTax * 0.08 // Estimate 8% savings
    strategies.push({
      name: "Strategic Charitable Giving",
      description: "Utilize charitable giving strategies to reduce taxable income and fulfill philanthropic goals.",
      potentialSavings: charitableGivingSavings,
      implementation:
        "Consider qualified charitable distributions (QCDs) from IRAs, donor-advised funds, or bunching charitable deductions in specific tax years.",
      impact:
        "Reduces taxable income while supporting charitable causes, potentially lowering overall tax burden in retirement.",
    })

    return strategies
  }

  const taxStrategies = generateTaxStrategies()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tax Efficiency Advisor</CardTitle>
        <CardDescription>
          Strategies to minimize tax burden and maximize after-tax wealth for your clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Tax Overview</TabsTrigger>
            <TabsTrigger value="strategies">Tax Strategies</TabsTrigger>
            <TabsTrigger value="comparison">With/Without Comparison</TabsTrigger>
          </TabsList>

          {/* Tax Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Total Tax Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(householdTotalTax)}</div>
                  <p className="text-sm text-muted-foreground">Over lifetime with current strategy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Tax Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${taxSavings > 0 ? "text-emerald-600" : taxSavings < 0 ? "text-red-600" : ""}`}
                  >
                    {taxSavings > 0
                      ? formatCurrency(taxSavings)
                      : taxSavings < 0
                        ? `-${formatCurrency(Math.abs(taxSavings))}`
                        : formatCurrency(0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Compared to no insurance strategy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Tax Efficiency Ratio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(householdTaxEfficiency.taxEfficiencyRatio)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tax paid as percentage of total withdrawals (lower is better)
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Tax by Life Phase</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pre-Retirement:</span>
                    <span className="font-medium">{formatCurrency(householdTaxByPhase.preRetirementTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retirement (Pre-LTC):</span>
                    <span className="font-medium">{formatCurrency(householdTaxByPhase.retirementTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">During LTC Event:</span>
                    <span className="font-medium">{formatCurrency(householdTaxByPhase.ltcEventTax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="font-medium">{formatCurrency(householdTotalTax)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Highest Tax Years</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {highTaxYears.slice(0, 3).map((year, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">
                          Age {year.age} {year.hasLTCEvent ? "(LTC Event)" : year.isRetired ? "(Retired)" : "(Working)"}
                          :
                        </span>
                        <span className="font-medium">{formatCurrency(year.tax)}</span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-2">
                      These years represent tax planning opportunities where strategic adjustments could significantly
                      reduce tax burden.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Individual Tax Burden</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{person1.name}:</span>
                    <span className="font-medium">{formatCurrency(person1TotalTax)}</span>
                  </div>
                  {person2 && person2.name !== "Person 2" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{person2.name}:</span>
                      <span className="font-medium">{formatCurrency(person2TotalTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Household Total:</span>
                    <span className="font-medium">{formatCurrency(householdTotalTax)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Strategies Tab */}
          <TabsContent value="strategies" className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-medium text-blue-800 mb-1">Advisor Talking Points</h3>
              <p className="text-sm text-blue-700">
                Use these tax-saving strategies to demonstrate additional value beyond the insurance benefits. These
                strategies can help your clients keep more of their hard-earned money and reduce the amount paid to the
                IRS over their lifetime.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {taxStrategies.map((strategy, index) => (
                <AccordionItem key={index} value={`strategy-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <span>{strategy.name}</span>
                      <span className="text-emerald-600 font-medium text-sm">
                        Save up to {formatCurrency(strategy.potentialSavings)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      <p className="text-sm">{strategy.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Implementation</h4>
                          <p className="text-xs">{strategy.implementation}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="text-xs font-medium text-gray-700 mb-1">Impact</h4>
                          <p className="text-xs">{strategy.impact}</p>
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg mt-3">
                        <h4 className="text-xs font-medium text-emerald-700 mb-1">Potential Tax Savings</h4>
                        <p className="text-sm font-medium text-emerald-600">
                          {formatCurrency(strategy.potentialSavings)}
                        </p>
                        <p className="text-xs text-emerald-700 mt-1">
                          This represents approximately{" "}
                          {formatPercentage(strategy.potentialSavings / householdTotalTax)} of the total projected tax
                          burden.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Card className="mt-6">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Combined Strategy Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-emerald-500 h-4 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (taxStrategies.reduce((sum, strategy) => sum + strategy.potentialSavings, 0) /
                              householdTotalTax) *
                              100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      {formatPercentage(
                        Math.min(
                          1,
                          taxStrategies.reduce((sum, strategy) => sum + strategy.potentialSavings, 0) /
                            householdTotalTax,
                        ),
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Current Tax Projection</div>
                      <div className="text-xl font-bold">{formatCurrency(householdTotalTax)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Potential After Strategies</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {formatCurrency(
                          Math.max(
                            0,
                            householdTotalTax -
                              taxStrategies.reduce((sum, strategy) => sum + strategy.potentialSavings, 0),
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mt-2">
                    <strong>Note:</strong> Actual tax savings will depend on implementation timing, market conditions,
                    and changes in tax law. These projections are estimates based on current tax rates and regulations.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* With/Without Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">With Insurance Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Total Tax Paid</div>
                    <div className="text-xl font-bold">{formatCurrency(householdTotalTax)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Tax by Life Phase</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Pre-Retirement:</div>
                      <div className="text-right">{formatCurrency(householdTaxByPhase.preRetirementTax)}</div>
                      <div>Retirement:</div>
                      <div className="text-right">{formatCurrency(householdTaxByPhase.retirementTax)}</div>
                      <div>LTC Event:</div>
                      <div className="text-right">{formatCurrency(householdTaxByPhase.ltcEventTax)}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Tax Efficiency Ratio</div>
                    <div className="text-lg font-medium">
                      {formatPercentage(householdTaxEfficiency.taxEfficiencyRatio)}
                    </div>
                    <div className="text-xs text-gray-500">
                      (Tax paid as percentage of total withdrawals - lower is better)
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-gray-400">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Without Insurance Strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Total Tax Paid</div>
                    <div className="text-xl font-bold">{formatCurrency(householdTotalTaxWithoutInsurance)}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Tax by Life Phase</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Pre-Retirement:</div>
                      <div className="text-right">
                        {formatCurrency(householdTaxByPhaseWithoutInsurance.preRetirementTax)}
                      </div>
                      <div>Retirement:</div>
                      <div className="text-right">
                        {formatCurrency(householdTaxByPhaseWithoutInsurance.retirementTax)}
                      </div>
                      <div>LTC Event:</div>
                      <div className="text-right">
                        {formatCurrency(householdTaxByPhaseWithoutInsurance.ltcEventTax)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Tax Efficiency Ratio</div>
                    <div className="text-lg font-medium">
                      {formatPercentage(householdTaxEfficiencyWithoutInsurance.taxEfficiencyRatio)}
                    </div>
                    <div className="text-xs text-gray-500">
                      (Tax paid as percentage of total withdrawals - lower is better)
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Key Tax Differences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 text-sm font-medium">Category</div>
                    <div className="col-span-1 text-sm font-medium text-center">Difference</div>
                    <div className="col-span-1 text-sm font-medium text-right">Impact</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t pt-2">
                    <div className="col-span-1 text-sm">Total Tax</div>
                    <div className="col-span-1 text-sm text-center">
                      {formatCurrency(Math.abs(householdTotalTax - householdTotalTaxWithoutInsurance))}
                    </div>
                    <div
                      className={`col-span-1 text-sm text-right ${taxSavings > 0 ? "text-emerald-600" : taxSavings < 0 ? "text-red-600" : ""}`}
                    >
                      {taxSavings > 0
                        ? `${formatPercentage(taxSavings / householdTotalTaxWithoutInsurance)} less tax`
                        : taxSavings < 0
                          ? `${formatPercentage(Math.abs(taxSavings) / householdTotalTax)} more tax`
                          : "No difference"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t pt-2">
                    <div className="col-span-1 text-sm">LTC Event Tax</div>
                    <div className="col-span-1 text-sm text-center">
                      {formatCurrency(
                        Math.abs(householdTaxByPhase.ltcEventTax - householdTaxByPhaseWithoutInsurance.ltcEventTax),
                      )}
                    </div>
                    <div
                      className={`col-span-1 text-sm text-right ${
                        householdTaxByPhase.ltcEventTax < householdTaxByPhaseWithoutInsurance.ltcEventTax
                          ? "text-emerald-600"
                          : householdTaxByPhase.ltcEventTax > householdTaxByPhaseWithoutInsurance.ltcEventTax
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {householdTaxByPhase.ltcEventTax < householdTaxByPhaseWithoutInsurance.ltcEventTax
                        ? `${formatPercentage(
                            (householdTaxByPhaseWithoutInsurance.ltcEventTax - householdTaxByPhase.ltcEventTax) /
                              householdTaxByPhaseWithoutInsurance.ltcEventTax,
                          )} less tax during LTC`
                        : householdTaxByPhase.ltcEventTax > householdTaxByPhaseWithoutInsurance.ltcEventTax
                          ? `${formatPercentage(
                              (householdTaxByPhase.ltcEventTax - householdTaxByPhaseWithoutInsurance.ltcEventTax) /
                                householdTaxByPhaseWithoutInsurance.ltcEventTax,
                            )} more tax during LTC`
                          : "No difference"}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t pt-2">
                    <div className="col-span-1 text-sm">Tax Efficiency</div>
                    <div className="col-span-1 text-sm text-center">
                      {formatPercentage(
                        Math.abs(
                          householdTaxEfficiency.taxEfficiencyRatio -
                            householdTaxEfficiencyWithoutInsurance.taxEfficiencyRatio,
                        ),
                      )}
                    </div>
                    <div
                      className={`col-span-1 text-sm text-right ${
                        householdTaxEfficiency.taxEfficiencyRatio <
                        householdTaxEfficiencyWithoutInsurance.taxEfficiencyRatio
                          ? "text-emerald-600"
                          : householdTaxEfficiency.taxEfficiencyRatio >
                              householdTaxEfficiencyWithoutInsurance.taxEfficiencyRatio
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {householdTaxEfficiency.taxEfficiencyRatio <
                      householdTaxEfficiencyWithoutInsurance.taxEfficiencyRatio
                        ? "More tax efficient"
                        : householdTaxEfficiency.taxEfficiencyRatio >
                            householdTaxEfficiencyWithoutInsurance.taxEfficiencyRatio
                          ? "Less tax efficient"
                          : "No difference"}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mt-4 text-sm">
                  <p>
                    <strong>Key Insight:</strong>{" "}
                    {taxSavings > 0
                      ? `The insurance strategy reduces overall tax burden by ${formatCurrency(
                          taxSavings,
                        )}, primarily by providing tax-free benefits during LTC events and reducing taxable withdrawals from retirement accounts.`
                      : taxSavings < 0
                        ? `While the insurance strategy increases overall tax burden by ${formatCurrency(
                            Math.abs(taxSavings),
                          )}, it provides other benefits such as asset protection and guaranteed LTC coverage that may outweigh the tax considerations.`
                        : "The insurance strategy has a neutral tax impact, while providing other benefits such as asset protection and guaranteed LTC coverage."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
