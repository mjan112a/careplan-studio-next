"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function Documentation() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LTC Simulator Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
              <TabsTrigger value="calculations">Calculations</TabsTrigger>
              <TabsTrigger value="formulas">Formulas</TabsTrigger>
              <TabsTrigger value="disclaimers">Disclaimers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <h2 className="text-xl font-bold">How the Simulator Works</h2>
              <p>
                The LTC Event Simulator is designed to model the financial impact of long-term care events on an
                individual's or household's retirement assets. It projects financial outcomes from the current age
                through the end of life, taking into account various factors such as income, expenses, retirement
                savings, long-term care costs, and insurance benefits.
              </p>

              <Alert className="my-4 border-amber-500">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-500">Important Assumption</AlertTitle>
                <AlertDescription>
                  This simulator assumes all retirement assets are qualified (tax-deferred) accounts such as 401(k)s,
                  403(b)s, or Traditional IRAs. Withdrawals from these accounts are taxed as ordinary income, and any
                  remaining balances passed to heirs will also be subject to income tax. In contrast, life insurance
                  death benefits are generally received income tax-free by beneficiaries.
                </AlertDescription>
              </Alert>

              <h3 className="text-lg font-semibold mt-4">Key Components</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Personal Information:</strong> Age, income, retirement savings, and other demographic data.
                </li>
                <li>
                  <strong>Retirement Planning:</strong> Retirement age, income replacement ratio, Social Security, and
                  other retirement income.
                </li>
                <li>
                  <strong>LTC Event Modeling:</strong> Age at which an LTC event occurs, duration, and annual cost
                  (adjusted for inflation from current age).
                </li>
                <li>
                  <strong>Insurance Modeling:</strong> Policy benefits, premiums, and features like policy loans and
                  death benefit acceleration.
                </li>
                <li>
                  <strong>Financial Projections:</strong> Year-by-year calculations of income, expenses, assets, and
                  cash flow.
                </li>
                <li>
                  <strong>Legacy Planning:</strong> Comparison of after-tax legacy values between insurance and
                  non-insurance strategies.
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-4">Simulation Process</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  The simulator starts with the current age and projects financial data for each year until the
                  specified death age.
                </li>
                <li>
                  For each year, it calculates income (work, Social Security, other), expenses (basic living, LTC,
                  premiums), and adjusts for inflation.
                </li>
                <li>
                  If there's an LTC event, it applies LTC expenses (inflated from current age) and insurance benefits if
                  a policy is in place.
                </li>
                <li>
                  It tracks retirement assets, policy values, and death benefits, adjusting for returns, withdrawals,
                  policy loans, and LTC benefit payments.
                </li>
                <li>
                  The results are displayed in various charts and tables to help visualize the financial impact of LTC
                  events with and without insurance.
                </li>
              </ol>

              <h3 className="text-lg font-semibold mt-4">Policy Data Integration</h3>
              <p>
                The simulator can use either simplified policy calculations or actual policy data. When actual policy
                data is available, it uses the specific premium, benefit, and cash value information from the policy
                illustration to provide more accurate projections. The simulator also accurately models how LTC benefits
                reduce both the death benefit and policy cash value on a dollar-for-dollar basis.
              </p>

              <h3 className="text-lg font-semibold mt-4">Simulator Controls</h3>
              <p>
                The simulator includes several controls that affect how calculations are performed. The most important
                is the "Use Actual Policy Data" toggle at the top of the interface, which determines whether the
                simulator uses detailed data from imported policy illustrations or simplified calculations based on
                basic parameters. This toggle significantly affects the accuracy and specificity of the projections,
                especially for policy values, benefits, and premiums over time.
              </p>
            </TabsContent>

            <TabsContent value="assumptions" className="space-y-4 pt-4">
              <h2 className="text-xl font-bold">Model Assumptions</h2>
              <p>
                The simulator makes several assumptions to project financial outcomes. Understanding these assumptions
                is crucial for interpreting the results correctly.
              </p>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="financial-assumptions">
                  <AccordionTrigger>Financial Assumptions</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Qualified Retirement Assets:</strong> All retirement assets are assumed to be in
                        qualified (tax-deferred) accounts such as 401(k)s, 403(b)s, or Traditional IRAs. Withdrawals are
                        taxed at the specified tax rate, and any remaining balances at death will be subject to income
                        tax when inherited.
                      </li>
                      <li>
                        <strong>Asset Returns:</strong> The simulator uses different return rates for pre-retirement and
                        retirement periods. Pre-retirement assets typically grow at a higher rate (default: 7%), while
                        retirement assets grow at a more conservative rate (default: 5%). These rates remain constant
                        throughout the projection.
                      </li>
                      <li>
                        <strong>Inflation:</strong> The model uses separate inflation rates for general expenses
                        (default: 2.5%) and LTC costs (default: 5%). These rates remain constant throughout the
                        projection and are applied from the current age.
                      </li>
                      <li>
                        <strong>Income Growth:</strong> Work income increases at a constant annual rate (default: 3%)
                        until retirement.
                      </li>
                      <li>
                        <strong>Taxation:</strong> A flat tax rate is applied to withdrawals from retirement assets.
                        This simplifies the complex tax code but may not accurately reflect progressive tax brackets or
                        different tax treatment for various types of accounts.
                      </li>
                      <li>
                        <strong>Retirement Income Replacement:</strong> Basic living expenses in retirement are
                        calculated as a percentage of pre-retirement income, adjusted for inflation.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ltc-assumptions">
                  <AccordionTrigger>Long-Term Care Assumptions</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>LTC Event Timing:</strong> LTC events occur at a specific age and last for a fixed
                        duration. In reality, LTC needs can begin gradually and vary in intensity.
                      </li>
                      <li>
                        <strong>LTC Costs:</strong> Annual LTC costs are specified in today's dollars and are inflated
                        from the current age to the age when the LTC event occurs and throughout the LTC event. This
                        accounts for the full impact of inflation on future LTC costs.
                      </li>
                      <li>
                        <strong>Pre-Retirement LTC Impact:</strong> If an LTC event occurs before retirement, work
                        income is reduced by 80%, annual savings stop, and basic living expenses are added to the
                        financial projection.
                      </li>
                      <li>
                        <strong>LTC Inflation:</strong> LTC costs typically rise faster than general inflation. The
                        model uses a separate, higher inflation rate for LTC expenses (default: 5% vs. 2.5% for general
                        inflation).
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policy-assumptions">
                  <AccordionTrigger>Insurance Policy Assumptions</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Benefit Eligibility:</strong> The model assumes that if an LTC event occurs and a policy
                        is in place, benefits are paid immediately without an elimination period.
                      </li>
                      <li>
                        <strong>Benefit Payments:</strong> Benefits are paid up to the annual limit or the actual LTC
                        expenses, whichever is lower, for the duration of the policy benefit period or until the maximum
                        benefit is reached.
                      </li>
                      <li>
                        <strong>Death Benefit Reduction:</strong> When LTC benefits are paid, the death benefit is
                        reduced by the amount of benefits paid on a dollar-for-dollar basis (acceleration model).
                      </li>
                      <li>
                        <strong>Cash Value Reduction:</strong> Cash values are reduced on a dollar-for-dollar basis when
                        LTC benefits are paid, matching the reduction in the death benefit. This accurately reflects how
                        most LTC riders work on life insurance policies.
                      </li>
                      <li>
                        <strong>Policy Loans:</strong> Policy loans are available after retirement if retirement assets
                        are depleted. Loan interest accrues annually and is added to the loan balance. Both policy loans
                        and loan interest reduce the policy value and death benefit on a dollar-for-dollar basis.
                      </li>
                      <li>
                        <strong>Premium Payments:</strong> Premiums can be paid from current income, retirement assets,
                        or policy loans (after retirement if assets are depleted). The simulator also supports paying
                        initial premiums from assets and pre-retirement premiums from assets.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="household-assumptions">
                  <AccordionTrigger>Household Assumptions</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Combined Finances:</strong> The household projection assumes combined finances with
                        shared assets and expenses.
                      </li>
                      <li>
                        <strong>Independent LTC Events:</strong> LTC events for each person are modeled independently,
                        which may not capture the potential for caregiving between spouses.
                      </li>
                      <li>
                        <strong>Survivor Considerations:</strong> The model does not specifically account for changes in
                        expenses or income when one spouse dies before the other.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="legacy-assumptions">
                  <AccordionTrigger>Legacy Planning Assumptions</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Tax Treatment of Qualified Assets:</strong> Any remaining qualified retirement assets at
                        death are assumed to be subject to income tax when inherited by beneficiaries. The simulator
                        applies the same tax rate used for withdrawals during life.
                      </li>
                      <li>
                        <strong>Tax Treatment of Life Insurance:</strong> Life insurance death benefits are assumed to
                        be received income tax-free by beneficiaries, which is generally the case under current tax law.
                      </li>
                      <li>
                        <strong>Estate Taxes:</strong> The simulator does not account for potential estate taxes, which
                        may apply to larger estates. Both qualified assets and life insurance proceeds could be subject
                        to estate tax if the total estate exceeds exemption thresholds.
                      </li>
                      <li>
                        <strong>Beneficiary Considerations:</strong> The simulator does not account for specific
                        beneficiary designations or trust arrangements that might affect the tax treatment of inherited
                        assets.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="calculations" className="space-y-4 pt-4">
              <h2 className="text-xl font-bold">Calculation Logic</h2>
              <p>
                The simulator uses a year-by-year projection approach, calculating various financial metrics for each
                year from the current age to the death age. Below is an explanation of the key calculation logic.
              </p>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="income-calculations">
                  <AccordionTrigger>Income Calculations</AccordionTrigger>
                  <AccordionContent>
                    <h4 className="font-semibold">Work Income</h4>
                    <p className="mb-2">
                      Work income is calculated for pre-retirement years and is reduced during LTC events:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`// If there's an LTC event before retirement, reduce work income by 80%
let workIncomeReductionFactor = 1.0
if (hasLTCEvent && !isRetired) {
  workIncomeReductionFactor = 0.2 // Reduce to 20% of normal income during LTC event
}

const workIncome = !isRetired
  ? person.income * Math.pow(1 + person.annualPayIncrease, year) * workIncomeReductionFactor
  : 0`}
                    </pre>

                    <h4 className="font-semibold mt-4">Retirement Income</h4>
                    <p className="mb-2">Social Security and other retirement income are adjusted for inflation:</p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`const socialSecurityIncome = isRetired
  ? person.socialSecurityIncome * Math.pow(1 + person.generalInflation, year)
  : 0

const otherRetirementIncome = isRetired
  ? person.otherRetirementIncome * Math.pow(1 + person.generalInflation, year)
  : 0`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="expense-calculations">
                  <AccordionTrigger>Expense Calculations</AccordionTrigger>
                  <AccordionContent>
                    <h4 className="font-semibold">Basic Living Expenses</h4>
                    <p className="mb-2">
                      Basic expenses are calculated for retirement years and during pre-retirement LTC events:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`const basicExpenses = isRetired || (hasLTCEvent && !isRetired)
  ? person.income * person.incomeReplacementRatio * Math.pow(1 + person.generalInflation, year)
  : 0`}
                    </pre>

                    <h4 className="font-semibold mt-4">LTC Expenses</h4>
                    <p className="mb-2">
                      LTC expenses are calculated during LTC events with LTC-specific inflation from the current age:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`const ltcExpenses = hasLTCEvent
  ? person.ltcCostPerYear * Math.pow(1 + person.ltcInflation, age - person.age)
  : 0`}
                    </pre>

                    <h4 className="font-semibold mt-4">Premium Expenses</h4>
                    <p className="mb-2">
                      Premium expenses are calculated based on policy data or simplified calculations:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`let premiumExpenses = 0
if (person.policyEnabled) {
  if (useActualPolicy && hasPolicyData && personPolicy) {
    // Find the annual policy data for the current policy year
    const annualData = personPolicy.annual_policy_data.find((data) => data.policy_year === policyYear)
    // ... (logic to find the appropriate premium)
    premiumExpenses = policyDataForYear.annual_premium
  } else {
    premiumExpenses = age < person.deathAge ? person.policyAnnualPremium : 0
  }
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ltc-benefit-calculations">
                  <AccordionTrigger>LTC Benefit Calculations</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">LTC benefits are calculated based on policy data or simplified calculations:</p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`let ltcBenefits = 0
if (person.policyEnabled && hasLTCEvent) {
  if (useActualPolicy && hasPolicyData && personPolicy) {
    // Find policy data for current year
    // ...
    
    // Apply the benefit up to the actual LTC expenses
    ltcBenefits = Math.min(annualBenefit, ltcExpenses)
    
    // Track cumulative benefits paid
    cumulativeLTCBenefits += ltcBenefits
    
    // Check if we've exceeded the maximum benefit
    const maxBenefit = policyDataForYear.death_benefit * 
      ((ltcRider?.acceleration_percentage_elected || 100) / 100)
    
    if (cumulativeLTCBenefits > maxBenefit) {
      // Cap the benefits at the maximum
      ltcBenefits -= cumulativeLTCBenefits - maxBenefit
      cumulativeLTCBenefits = maxBenefit
    }
  } else {
    // Simplified benefit calculation
    ltcBenefits = age < person.ltcEventAge + person.policyBenefitDuration
      ? Math.min(person.policyBenefitPerYear, ltcExpenses)
      : 0
    cumulativeLTCBenefits += ltcBenefits
  }
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policy-value-adjustments">
                  <AccordionTrigger>Policy Value and Death Benefit Adjustments</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      When LTC benefits are paid, both the death benefit and policy value are reduced on a
                      dollar-for-dollar basis:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`// Only adjust for LTC benefits if we're in an LTC event
if (hasLTCEvent && ltcBenefits > 0) {
  // Reduce death benefit by benefits paid this year (1:1 deduction)
  deathBenefit = Math.max(0, deathBenefit - ltcBenefits)

  // Reduce policy value by the same amount (1:1 deduction)
  policyValue = Math.max(0, policyValue - ltcBenefits)

  // Mark that we've deviated from the illustration
  hasDeviatedFromIllustration = true
}`}
                    </pre>

                    <p className="mb-2 mt-4">Similarly, policy loans and loan interest reduce both values:</p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`// Calculate policy loan interest on existing loan balance
const policyLoanInterest = policyLoanBalance * person.policyLoanRate

// Update loan balance with interest
policyLoanBalance += policyLoanInterest

// If new loans are taken or interest accrues
if (policyLoanTaken > 0 || policyLoanInterest > 0) {
  // Reduce policy value by just the new loan and interest
  policyValue = Math.max(0, policyValue - policyLoanTaken - policyLoanInterest)

  // Reduce death benefit by just the new loan and interest
  deathBenefit = Math.max(0, deathBenefit - policyLoanTaken - policyLoanInterest)
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cash-flow-calculations">
                  <AccordionTrigger>Cash Flow and Withdrawal Calculations</AccordionTrigger>
                  <AccordionContent>
                    <h4 className="font-semibold">Net Cash Flow</h4>
                    <p className="mb-2">Net cash flow is calculated as income plus benefits minus expenses:</p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`let netCashFlow = totalIncome + ltcBenefits - totalExpenses`}
                    </pre>

                    <h4 className="font-semibold mt-4">Withdrawals from Retirement Assets</h4>
                    <p className="mb-2">If there's a cash shortfall, withdrawals are made from retirement assets:</p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`if (netCashFlow < 0) {
  // First try to withdraw from retirement assets
  if (currentAssets > 0) {
    // Calculate how much we need to withdraw, including tax
    const shortfall = -netCashFlow
    const shortfallWithdrawal = shortfall / (1 - person.retirementAssetsTaxRate)
    const shortfallTax = shortfallWithdrawal * person.retirementAssetsTaxRate
    
    // Limit withdrawal to available assets
    // ...
    
    withdrawal += shortfallWithdrawal
    taxOnWithdrawal += shortfallTax
  }
  // Only take policy loans if there are no retirement assets left
  else if (person.policyEnabled && person.policyLoanEnabled && isRetired && policyValue > 0) {
    // ...
  }
}`}
                    </pre>

                    <h4 className="font-semibold mt-4">Policy Loans</h4>
                    <p className="mb-2">
                      If retirement assets are depleted, policy loans may be taken to cover shortfalls:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`// Only take policy loans if there are no retirement assets left
if (person.policyEnabled && person.policyLoanEnabled && isRetired && policyValue > 0) {
  // Calculate how much we need to borrow
  const shortfall = -netCashFlow

  // Calculate the maximum loan-to-value ratio (default to 95% if not specified)
  const maxLoanToValueRatio = person.policyMaxLoanToValueRatio || 0.95

  // Calculate the maximum allowable loan based on the loan-to-value ratio
  const maxAllowableLoan = policyValue * maxLoanToValueRatio

  // Calculate available borrowing capacity
  const availableCashValue = Math.max(0, maxAllowableLoan - policyLoanBalance)

  // Limit loan to available cash value
  policyLoanTaken = Math.min(shortfall, availableCashValue)

  // Update loan balance
  policyLoanBalance += policyLoanTaken
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="asset-calculations">
                  <AccordionTrigger>Asset and Policy Value Calculations</AccordionTrigger>
                  <AccordionContent>
                    <h4 className="font-semibold">Retirement Assets</h4>
                    <p className="mb-2">
                      Retirement assets are updated based on savings, withdrawals, and investment returns:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`if (!isRetired) {
  // If there's an LTC event pre-retirement, we don't add annual savings
  const annualSavingsAmount = hasLTCEvent ? 0 : person.annualSavings
  currentAssets = (currentAssets + annualSavingsAmount - withdrawal) * (1 + person.preRetirementAssetReturns)
} else {
  currentAssets = (currentAssets - withdrawal) * (1 + person.assetReturns)
}

// Ensure assets don't go negative
currentAssets = Math.max(0, currentAssets)`}
                    </pre>

                    <h4 className="font-semibold mt-4">Policy Growth Rates</h4>
                    <p className="mb-2">
                      When using actual policy data, the simulator calculates growth rates from the illustration:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`// Pre-calculate growth rates from policy data for easier lookup
const cashValueGrowthRates: { [policyYear: number]: number } = {}
const deathBenefitGrowthRates: { [policyYear: number]: number } = {}

if (useActualPolicy && hasPolicyData && personPolicy) {
  personPolicy.annual_policy_data.forEach((data, index) => {
    if (index === 0) return // Skip first year

    const prevData = personPolicy.annual_policy_data[index - 1]

    // Calculate cash value growth rate
    if (prevData.surrender_value > 0) {
      cashValueGrowthRates[data.policy_year] = data.surrender_value / prevData.surrender_value - 1
    } else {
      cashValueGrowthRates[data.policy_year] = 0
    }

    // Calculate death benefit growth rate
    if (prevData.death_benefit > 0) {
      deathBenefitGrowthRates[data.policy_year] = data.death_benefit / prevData.death_benefit - 1
    } else {
      deathBenefitGrowthRates[data.policy_year] = 0
    }
  })
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="household-calculations">
                  <AccordionTrigger>Household Calculations</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Household projections combine the financial data from individual projections:
                    </p>
                    <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                      {`const combinedData: YearlyFinancialData = {
  age: p1Data ? p1Data.age : p2Data ? p2Data.age : 0, // Use person1's age as reference point
  year,
  policyYear: 0, // Not applicable for household
  income: (p1Data?.income || 0) + (p2Data?.income || 0),
  workIncome: (p1Data?.workIncome || 0) + (p2Data?.workIncome || 0),
  socialSecurityIncome: (p1Data?.socialSecurityIncome || 0) + (p2Data?.socialSecurityIncome || 0),
  otherRetirementIncome: (p1Data?.otherRetirementIncome || 0) + (p2Data?.otherRetirementIncome || 0),
  expenses: (p1Data?.expenses || 0) + (p2Data?.expenses || 0),
  basicExpenses: (p1Data?.basicExpenses || 0) + (p2Data?.basicExpenses || 0),
  ltcExpenses: (p1Data?.ltcExpenses || 0) + (p2Data?.ltcExpenses || 0),
  premiumExpenses: (p1Data?.premiumExpenses || 0) + (p2Data?.premiumExpenses || 0),
  ltcBenefits: (p1Data?.ltcBenefits || 0) + (p2Data?.ltcBenefits || 0),
  netCashFlow: (p1Data?.netCashFlow || 0) + (p2Data?.netCashFlow || 0),
  withdrawal: (p1Data?.withdrawal || 0) + (p2Data?.withdrawal || 0),
  taxOnWithdrawal: (p1Data?.taxOnWithdrawal || 0) + (p2Data?.taxOnWithdrawal || 0),
  assets: (p1Data?.assets || 0) + (p2Data?.assets || 0),
  policyValue: (p1Data?.policyValue || 0) + (p2Data?.policyValue || 0),
  deathBenefit: (p1Data?.deathBenefit || 0) + (p2Data?.deathBenefit || 0),
  totalAssets: (p1Data?.totalAssets || 0) + (p2Data?.totalAssets || 0),
  cumulativeLTCBenefits: (p1Data?.cumulativeLTCBenefits || 0) + (p2Data?.cumulativeLTCBenefits || 0),
  hasLTCEvent: p1Data?.hasLTCEvent || false || p2Data?.hasLTCEvent || false,
  isAlive: p1Data?.isAlive || false || p2Data?.isAlive || false,
  policyLoanTaken: (p1Data?.policyLoanTaken || 0) + (p2Data?.policyLoanTaken || 0),
  policyLoanBalance: (p1Data?.policyLoanBalance || 0) + (p2Data?.policyLoanBalance || 0),
  policyLoanInterest: (p1Data?.policyLoanInterest || 0) + (p2Data?.policyLoanInterest || 0),
}`}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policy-data-toggle">
                  <AccordionTrigger>Use Actual Policy Data Toggle</AccordionTrigger>
                  <AccordionContent>
                    <h4 className="font-semibold">What the Toggle Does</h4>
                    <p className="mb-2">
                      The "Use Actual Policy Data" toggle at the top of the interface controls whether the simulator
                      uses:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                      <li>
                        <strong>ON:</strong> Detailed data from imported policy illustrations, including actual
                        premiums, cash values, death benefits, and LTC benefits over time.
                      </li>
                      <li>
                        <strong>OFF:</strong> Simplified calculations based on the basic policy parameters entered in
                        the interface.
                      </li>
                    </ul>

                    <h4 className="font-semibold mt-4">When to Use Each Option</h4>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                      <li>
                        <strong>Use Actual Policy Data (ON):</strong> When you have imported policy illustrations and
                        want the most accurate representation of how specific policies will perform over time. This is
                        ideal for client presentations and detailed planning.
                      </li>
                      <li>
                        <strong>Simplified Calculations (OFF):</strong> When you want to quickly model generic policies,
                        don't have policy illustrations available, or want to compare different policy structures
                        without being tied to specific product details.
                      </li>
                    </ul>

                    <h4 className="font-semibold mt-4">Specific Calculation Differences</h4>
                    <p className="mb-2">When "Use Actual Policy Data" is ON, the simulator:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                      <li>Uses year-by-year premium amounts from the policy data, which may vary over time</li>
                      <li>
                        Uses actual cash value accumulation patterns, which often include early-year surrender charges
                      </li>
                      <li>Applies the exact monthly LTC benefit amounts from the policy</li>
                      <li>
                        Respects policy-specific rules about benefit acceleration percentages and maximum benefits
                      </li>
                      <li>
                        Accounts for policy features like increasing death benefits or premium cessation at certain ages
                      </li>
                      <li>
                        Applies dollar-for-dollar reductions to both death benefit and cash value when LTC benefits are
                        paid
                      </li>
                    </ul>

                    <p className="mb-2">When "Use Actual Policy Data" is OFF, the simulator:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                      <li>Uses a constant annual premium amount throughout the projection</li>
                      <li>
                        Applies a simplified cash value accumulation formula (typically a percentage of premiums paid)
                      </li>
                      <li>Uses the flat LTC benefit amount entered in the interface</li>
                      <li>Applies simplified rules for benefit duration and maximum benefits</li>
                      <li>
                        Still applies dollar-for-dollar reductions to both death benefit and cash value when LTC
                        benefits are paid
                      </li>
                    </ul>

                    <h4 className="font-semibold mt-4">How to Verify Which Mode is Active</h4>
                    <p className="mb-2">You can verify the toggle's effect by:</p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                      <li>Checking the "Policy Benefits Over Time" chart with the toggle in both positions</li>
                      <li>Looking at the "Policy Details" card, which shows data from the actual policy</li>
                      <li>
                        Examining the "Policy Data Debug" section in the Analysis tab to see if policy data is loaded
                      </li>
                      <li>
                        Comparing the premium and benefit amounts shown in the interface with those in your policy
                        illustration
                      </li>
                    </ul>

                    <h4 className="font-semibold mt-4">Limitations</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Actual Policy Data:</strong> Only works if policy data has been properly imported. The
                        simulator will fall back to simplified calculations if no policy data is available.
                      </li>
                      <li>
                        <strong>Simplified Calculations:</strong> May not accurately represent complex policy features
                        like varying premiums, non-linear cash value growth, or indexed crediting strategies.
                      </li>
                      <li>
                        <strong>Hybrid Approach:</strong> Even when using actual policy data, some aspects of the
                        simulation (like policy loans or the interaction between LTC benefits and death benefits) may
                        still use simplified calculations.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="formulas" className="space-y-4 pt-4">
              <h2 className="text-xl font-bold">Key Formulas</h2>
              <p>
                The simulator uses various mathematical formulas to project financial outcomes. Below are the key
                formulas used in the calculations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Income Formulas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Work Income</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Work income with annual increases and LTC adjustment:
                      </p>
                      <div className="bg-muted p-2 rounded">
                        <p>Work Income = Base Income × (1 + Annual Increase)^Years × LTC Reduction Factor</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Where LTC Reduction Factor = 0.2 during LTC events, 1.0 otherwise
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">Retirement Income</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Social Security and other retirement income with inflation:
                      </p>
                      <div className="bg-muted p-2 rounded">
                        <p>Social Security = Base SS × (1 + Inflation)^Years</p>
                        <p>Other Retirement Income = Base Other × (1 + Inflation)^Years</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Expense Formulas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Basic Living Expenses</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Basic expenses during retirement or LTC events:
                      </p>
                      <div className="bg-muted p-2 rounded">
                        <p>Basic Expenses = Income × Replacement Ratio × (1 + Inflation)^Years</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">LTC Expenses</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        LTC expenses with LTC-specific inflation from current age:
                      </p>
                      <div className="bg-muted p-2 rounded">
                        <p>LTC Expenses = Base LTC Cost × (1 + LTC Inflation)^(Current Age - Starting Age)</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: This accounts for inflation from the current age to the LTC event age and beyond
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Asset Formulas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Pre-Retirement Assets</h4>
                      <p className="text-sm text-muted-foreground mb-1">Asset growth before retirement:</p>
                      <div className="bg-muted p-2 rounded">
                        <p>
                          Assets = (Previous Assets + Annual Savings - Withdrawals) × (1 + Pre-Retirement Return Rate)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Note: Annual Savings = 0 during LTC events</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">Retirement Assets</h4>
                      <p className="text-sm text-muted-foreground mb-1">Asset growth during retirement:</p>
                      <div className="bg-muted p-2 rounded">
                        <p>Assets = (Previous Assets - Withdrawals) × (1 + Retirement Return Rate)</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">Withdrawal Calculation</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Gross withdrawal needed to cover a shortfall:
                      </p>
                      <div className="bg-muted p-2 rounded">
                        <p>Gross Withdrawal = Shortfall / (1 - Tax Rate)</p>
                        <p>Tax on Withdrawal = Gross Withdrawal × Tax Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Policy Formulas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Policy Loan Calculations</h4>
                      <p className="text-sm text-muted-foreground mb-1">Policy loan interest and balance:</p>
                      <div className="bg-muted p-2 rounded">
                        <p>Loan Interest = Loan Balance × Loan Interest Rate</p>
                        <p>New Loan Balance = Previous Loan Balance + Loan Interest + New Loans Taken</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">LTC Benefit Calculations</h4>
                      <p className="text-sm text-muted-foreground mb-1">LTC benefits paid during an LTC event:</p>
                      <div className="bg-muted p-2 rounded">
                        <p>LTC Benefits = Min(Annual Benefit Limit, LTC Expenses)</p>
                        <p>Subject to: Cumulative Benefits ≤ Maximum Benefit (typically % of Death Benefit)</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">Policy Value Adjustments</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Policy value and death benefit adjustments for LTC benefits and loans:
                      </p>
                      <div className="bg-muted p-2 rounded">
                        <p>
                          Adjusted Death Benefit = Original Death Benefit - LTC Benefits - Loan Amount - Loan Interest
                        </p>
                        <p>
                          Adjusted Policy Value = Original Policy Value - LTC Benefits - Loan Amount - Loan Interest
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: Both are reduced on a dollar-for-dollar basis
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Compound Growth and Inflation Formulas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Many calculations in the simulator use compound growth or inflation formulas:</p>
                  <div className="bg-muted p-4 rounded">
                    <p className="font-medium">Future Value = Present Value × (1 + Rate)^Years</p>
                    <p className="mt-2">Where:</p>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Future Value = The value after compounding</li>
                      <li>Present Value = The initial value</li>
                      <li>Rate = The annual growth or inflation rate (as a decimal)</li>
                      <li>Years = The number of years of compounding</li>
                      <li>^ = Exponentiation (raising to a power)</li>
                    </ul>
                    <p className="mt-4 text-sm text-muted-foreground">
                      This formula is used for income growth, inflation adjustments, and investment returns.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disclaimers" className="space-y-4 pt-4">
              <h2 className="text-xl font-bold">Disclaimers and Limitations</h2>

              <Alert variant="warning" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Disclaimer</AlertTitle>
                <AlertDescription>
                  This simulator is for educational and illustrative purposes only. It is not financial advice.
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="general-disclaimers">
                  <AccordionTrigger>General Disclaimers</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Not Financial Advice:</strong> This simulator is not intended to provide specific
                        financial, investment, tax, legal, or insurance advice. It is designed for educational and
                        illustrative purposes only.
                      </li>
                      <li>
                        <strong>Consult Professionals:</strong> Users should consult with qualified financial
                        professionals, tax advisors, and insurance specialists before making any financial decisions
                        based on the simulator's results.
                      </li>
                      <li>
                        <strong>Simplified Model:</strong> This simulator uses simplified models and assumptions that
                        may not accurately reflect all real-world complexities, market conditions, or individual
                        circumstances.
                      </li>
                      <li>
                        <strong>Future Uncertainty:</strong> The simulator projects future outcomes based on current
                        inputs and assumptions. Actual results will vary due to market fluctuations, policy changes,
                        health conditions, and other unpredictable factors.
                      </li>
                      <li>
                        <strong>No Guarantees:</strong> Past performance and projected results are not guarantees of
                        future outcomes. All financial and insurance decisions involve risk.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="model-limitations">
                  <AccordionTrigger>Model Limitations</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Constant Returns:</strong> The simulator assumes constant investment returns, which does
                        not reflect real-world market volatility and sequence of returns risk.
                      </li>
                      <li>
                        <strong>Simplified Tax Treatment:</strong> The tax calculations are simplified and do not
                        account for the complex U.S. tax code, including different tax treatment for various types of
                        accounts (401(k), IRA, Roth, taxable), tax brackets, deductions, or future tax law changes.
                      </li>
                      <li>
                        <strong>Fixed Inflation Rates:</strong> The simulator uses constant inflation rates, whereas
                        actual inflation varies over time and affects different expense categories differently.
                      </li>
                      <li>
                        <strong>Discrete LTC Events:</strong> The simulator models LTC events as occurring at a specific
                        age for a fixed duration with constant costs. In reality, LTC needs often develop gradually,
                        vary in intensity, and may include periods of recovery.
                      </li>
                      <li>
                        <strong>Simplified Policy Mechanics:</strong> The simulator may not capture all the nuances of
                        specific insurance policies, including elimination periods, benefit triggers, inflation
                        protection options, and non-forfeiture benefits.
                      </li>
                      <li>
                        <strong>Limited Household Dynamics:</strong> The simulator does not fully model the complex
                        dynamics of household finances, including the impact of one spouse providing care for another or
                        changes in expenses after the death of a spouse.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-limitations">
                  <AccordionTrigger>Data Limitations</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Policy Illustrations:</strong> When using actual policy data, the simulator relies on
                        policy illustrations that contain non-guaranteed elements. Actual policy performance may differ
                        from illustrated values.
                      </li>
                      <li>
                        <strong>LTC Cost Projections:</strong> LTC costs vary significantly by location, level of care,
                        and provider. The simulator uses general cost estimates that may not reflect the specific costs
                        in your area or for your preferred care options.
                      </li>
                      <li>
                        <strong>Mortality Assumptions:</strong> The simulator uses a fixed death age rather than
                        actuarial life expectancy or mortality tables. Actual life expectancy varies based on health,
                        genetics, lifestyle, and other factors.
                      </li>
                      <li>
                        <strong>Policy Underwriting:</strong> The simulator does not account for insurance underwriting,
                        which may affect premium rates, benefit eligibility, or policy availability based on health
                        status.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="usage-disclaimers">
                  <AccordionTrigger>Usage Disclaimers</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Input Accuracy:</strong> The accuracy of the simulator's projections depends on the
                        accuracy of the input data. Users should verify all inputs and assumptions.
                      </li>
                      <li>
                        <strong>Regular Review:</strong> Financial plans should be reviewed and updated regularly to
                        account for changes in personal circumstances, economic conditions, and policy terms.
                      </li>
                      <li>
                        <strong>Sensitivity Analysis:</strong> Users should test multiple scenarios with different
                        assumptions to understand the range of possible outcomes and the sensitivity of results to key
                        variables.
                      </li>
                      <li>
                        <strong>Comprehensive Planning:</strong> LTC planning should be part of a comprehensive
                        financial plan that includes retirement planning, estate planning, tax planning, and healthcare
                        planning.
                      </li>
                      <li>
                        <strong>Policy Verification:</strong> Users should verify all policy details, benefits, and
                        terms directly with the insurance company or through a licensed insurance professional.
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Final Note</h3>
                <p>
                  This simulator is provided "as is" without warranties of any kind, either express or implied. The
                  developers and distributors of this simulator shall not be liable for any damages or losses resulting
                  from the use of this simulator, including but not limited to direct, indirect, incidental, punitive,
                  and consequential damages.
                </p>
                <p className="mt-2">
                  By using this simulator, you acknowledge that you have read and understood these disclaimers and
                  limitations, and agree that you are using the simulator at your own risk.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
