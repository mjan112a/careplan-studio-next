"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PersonForm } from "@/components/person-form"
import { AssetProjectionChart } from "@/components/asset-projection-chart"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { PolicyDetails } from "@/components/policy-details"
import { PolicyBenefitsChart } from "@/components/policy-benefits-chart"
import { AIAnalysis } from "@/components/ai-analysis"
import { Documentation } from "@/components/documentation"
import { type Person, defaultPerson } from "@/types/person"
import { calculateFinancialProjection, calculateHouseholdProjection } from "@/utils/financial-calculations"
import { formatCurrency } from "@/utils/format"
import { getSamplePolicyData } from "@/types/policy-data"
import { PolicyDataDebug } from "@/components/policy-data-debug"
import { ThemeToggle } from "@/components/theme-toggle"
import { PolicyLoanChart } from "@/components/policy-loan-chart"
import { CustomGuidedTour, WelcomeModal } from "@/components/custom-guided-tour"
import { HelpCircle, AlertCircle } from "lucide-react"
import { PolicyGrowthChart } from "@/components/policy-growth-chart"
import { PolicyComparisonChart } from "@/components/policy-comparison-chart"
import { FinancialCalculationDebug } from "@/components/financial-calculation-debug"
import { PolicyData } from "@/types/simulator-interfaces"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import the new tax visualization components
import { TaxImpactVisualization } from "@/components/tax-impact-visualization"
import { TaxEfficiencyAdvisor } from "@/components/tax-efficiency-advisor"
import { logger } from '@/lib/logging'

// Import our policy data hook
import { usePolicyData } from '@/lib/policy-data'

export default function Home() {
  const [useActualPolicy, setUseActualPolicy] = useState(true)
  const [shiftPolicyDataYear, setShiftPolicyDataYear] = useState(false)
  const [mergeSampleData, setMergeSampleData] = useState(true)
  
  // Use our new hook to get policy data
  const { policyData, loading } = usePolicyData(mergeSampleData)
  
  // Chart visibility toggles
  const [showPolicyBenefits, setShowPolicyBenefits] = useState(true)
  const [showPolicyComparison, setShowPolicyComparison] = useState(true)

  // Tour state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [runTour, setRunTour] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Use policy data from state or fallback to sample data
  const activePolicyData = policyData

  // Check if we're using sample data to complete the policy data
  const hasIncompletePolicyData = policyData && policyData.some(policy => policy._incomplete)
  const isShowingSampleDataNotice = hasIncompletePolicyData && mergeSampleData

  // Convert PolicyData to the format expected by PersonForm
  const convertToPersonFormPolicyData = (policyData: PolicyData | null): any[] => {
    if (!policyData) return [];
    
    return policyData.annual_policy_data.map(yearData => ({
      year: yearData.policy_year,
      premium: yearData.annual_premium,
      cashValue: yearData.surrender_value,
      deathBenefit: yearData.death_benefit,
      totalLTCBenefit: yearData.monthly_benefit_limit * 12, // Estimate total annual LTC benefit
      aobMonthly: yearData.monthly_benefit_limit,
      cobMonthly: yearData.monthly_benefit_limit,
    }));
  };

  // Initialize person data with policy information, with fallbacks if policy data is missing
  const [person1, setPerson1] = useState<Person>(() => {
    const policy = activePolicyData && activePolicyData.length > 0 ? activePolicyData[0] : null
    
    // Validate policy structure before using it
    const hasPolicyInfo = policy && policy.policy_level_information;
    const hasAnnualData = policy && policy.annual_policy_data && policy.annual_policy_data.length > 0;
    
    return {
      ...defaultPerson,
      name: hasPolicyInfo && policy.policy_level_information.insured_person_name 
        ? policy.policy_level_information.insured_person_name 
        : "Person 1",
      age: hasPolicyInfo && policy.policy_level_information.insured_person_age !== undefined
        ? policy.policy_level_information.insured_person_age 
        : defaultPerson.age,
      sex: hasPolicyInfo && policy.policy_level_information.insured_person_gender
        ? policy.policy_level_information.insured_person_gender.toLowerCase() === "male"
          ? "male"
          : "female"
        : defaultPerson.sex,
      policyAnnualPremium: hasPolicyInfo && policy.policy_level_information.initial_premium !== undefined
        ? policy.policy_level_information.initial_premium 
        : defaultPerson.policyAnnualPremium,
      policyBenefitPerYear: hasAnnualData && policy.annual_policy_data[0]?.monthly_benefit_limit !== undefined
        ? policy.annual_policy_data[0].monthly_benefit_limit * 12 
        : defaultPerson.policyBenefitPerYear,
      ltcEventEnabled: false,
      policyEnabled: false,
      initialPremiumFromAssets: true,
      premiumsFromAssetsPreRetirement: true,
      preRetirementAssetReturns: 0.07, // Add the new field with default value
    }
  })

  const [person2, setPerson2] = useState<Person>(() => {
    const policy = activePolicyData && activePolicyData.length > 1 ? activePolicyData[1] : null
    
    // Validate policy structure before using it
    const hasPolicyInfo = policy && policy.policy_level_information;
    const hasAnnualData = policy && policy.annual_policy_data && policy.annual_policy_data.length > 0;
    
    return {
      ...defaultPerson,
      name: hasPolicyInfo && policy.policy_level_information.insured_person_name 
        ? policy.policy_level_information.insured_person_name 
        : "Person 2",
      age: hasPolicyInfo && policy.policy_level_information.insured_person_age !== undefined
        ? policy.policy_level_information.insured_person_age 
        : defaultPerson.age + 2,
      sex: hasPolicyInfo && policy.policy_level_information.insured_person_gender
        ? policy.policy_level_information.insured_person_gender.toLowerCase() === "male"
          ? "male"
          : "female"
        : "female",
      policyAnnualPremium: hasPolicyInfo && policy.policy_level_information.initial_premium !== undefined
        ? policy.policy_level_information.initial_premium 
        : defaultPerson.policyAnnualPremium,
      policyBenefitPerYear: hasAnnualData && policy.annual_policy_data[0]?.monthly_benefit_limit !== undefined
        ? policy.annual_policy_data[0].monthly_benefit_limit * 12 
        : defaultPerson.policyBenefitPerYear,
      ltcEventEnabled: false,
      policyEnabled: false,
      initialPremiumFromAssets: true,
      premiumsFromAssetsPreRetirement: true,
      preRetirementAssetReturns: 0.07, // Add the new field with default value
    }
  })

  // Initialize client-side features once mounted
  useEffect(() => {
    setIsMounted(true)
    
    // Check if tour has been completed
    if (typeof window !== "undefined") {
      const hasCompletedTour = localStorage.getItem("ltcSimulator_tourCompleted") === "true"

      // Show welcome modal for first-time users after a short delay
      if (!hasCompletedTour) {
        setTimeout(() => setShowWelcomeModal(true), 1000)
      }
    }
  }, [])

  // Handle tour completion
  const handleTourComplete = () => {
    setRunTour(false)
    if (typeof window !== "undefined") {
      localStorage.setItem("ltcSimulator_tourCompleted", "true")
    }
  }

  // Handle tour start
  const handleStartTour = () => {
    setShowWelcomeModal(false)
    setRunTour(true)
  }

  // Handle tour skip
  const handleSkipTour = () => {
    setShowWelcomeModal(false)
    handleTourComplete()
  }

  // Handle restart tour
  const handleRestartTour = () => {
    setRunTour(true)
  }

  // Update policy values when policy is enabled
  useEffect(() => {
    if (person1.policyEnabled && activePolicyData && activePolicyData.length > 0) {
      const policy = activePolicyData[0]
      setPerson1((prev) => ({
        ...prev,
        policyAnnualPremium: policy.policy_level_information.initial_premium,
        policyBenefitPerYear: policy.annual_policy_data[0]?.monthly_benefit_limit * 12 || prev.policyBenefitPerYear,
      }))
    }
  }, [person1.policyEnabled, policyData])

  useEffect(() => {
    if (person2.policyEnabled && activePolicyData && activePolicyData.length > 1) {
      const policy = activePolicyData[1]
      setPerson2((prev) => ({
        ...prev,
        policyAnnualPremium: policy.policy_level_information.initial_premium,
        policyBenefitPerYear: policy.annual_policy_data[0]?.monthly_benefit_limit * 12 || prev.policyBenefitPerYear,
      }))
    }
  }, [person2.policyEnabled, policyData])

  // Calculate projections
  const person1Projection = calculateFinancialProjection(person1, 0, useActualPolicy, shiftPolicyDataYear, activePolicyData)
  const person2Projection = calculateFinancialProjection(person2, 1, useActualPolicy, shiftPolicyDataYear, activePolicyData)
  const householdProjection = calculateHouseholdProjection(person1Projection, person2Projection)

  // Calculate projections with policy turned off for comparison
  const person1WithPolicyOff = { ...person1, policyEnabled: false }
  const person2WithPolicyOff = { ...person2, policyEnabled: false }
  const person1ProjectionWithPolicyOff = calculateFinancialProjection(
    person1WithPolicyOff,
    0,
    false,
    shiftPolicyDataYear,
    activePolicyData
  )
  const person2ProjectionWithPolicyOff = calculateFinancialProjection(
    person2WithPolicyOff,
    1,
    false,
    shiftPolicyDataYear,
    activePolicyData
  )
  const householdProjectionWithPolicyOff = calculateHouseholdProjection(
    person1ProjectionWithPolicyOff,
    person2ProjectionWithPolicyOff,
  )

  // Calculate projections without LTC insurance
  const person1WithoutInsurance = { ...person1, policyEnabled: false }
  const person2WithoutInsurance = { ...person2, policyEnabled: false }
  const person1ProjectionWithoutInsurance = calculateFinancialProjection(
    person1WithoutInsurance,
    0,
    false,
    shiftPolicyDataYear,
    activePolicyData
  )
  const person2ProjectionWithoutInsurance = calculateFinancialProjection(
    person2WithoutInsurance,
    1,
    false,
    shiftPolicyDataYear,
    activePolicyData
  )
  const householdProjectionWithoutInsurance = calculateHouseholdProjection(
    person1ProjectionWithoutInsurance,
    person2ProjectionWithoutInsurance,
  )

  // Calculate legacy assets (assets at death)
  const person1LegacyAssets =
    person1Projection.length > 0
      ? person1Projection[person1Projection.length - 1].assets + // Retirement assets
        person1Projection[person1Projection.length - 1].deathBenefit // Death benefit (not cash value + death benefit)
      : 0

  const person2LegacyAssets =
    person2Projection.length > 0
      ? person2Projection[person2Projection.length - 1].assets + // Retirement assets
        person2Projection[person2Projection.length - 1].deathBenefit // Death benefit (not cash value + death benefit)
      : 0

  const householdLegacyAssets = person1LegacyAssets + person2LegacyAssets

  // Calculate legacy assets without insurance
  const person1LegacyAssetsWithoutInsurance =
    person1ProjectionWithoutInsurance.length > 0
      ? person1ProjectionWithoutInsurance[person1ProjectionWithoutInsurance.length - 1].totalAssets
      : 0

  const person2LegacyAssetsWithoutInsurance =
    person2ProjectionWithoutInsurance.length > 0
      ? person2ProjectionWithoutInsurance[person2ProjectionWithoutInsurance.length - 1].totalAssets
      : 0

  const householdLegacyAssetsWithoutInsurance =
    person1LegacyAssetsWithoutInsurance + person2LegacyAssetsWithoutInsurance

  // Show loading state while policy data is being fetched
  if (loading) {
    return (
      <main className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-semibold mb-4">Loading policy data...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your policy information.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto py-8">
      {/* Sample data notification */}
      {isShowingSampleDataNotice && (
        <Alert className="mb-6 bg-blue-100 border-2 border-blue-400 p-4 dark:bg-blue-900 dark:border-blue-600 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <AlertDescription className="text-base font-semibold text-blue-800 dark:text-blue-200">
              Some policy data was incomplete. Sample data has been merged to provide a complete simulation.
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      <h1 className="text-3xl font-bold mb-6 text-center">LTC Event Financial Impact Simulator</h1>

      <div className="flex items-center space-x-4 mb-6 justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleRestartTour} className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Add sample data merge toggle if we have incomplete policy data */}
          {policyData && policyData.some(policy => policy._incomplete) && (
            <div className="flex items-center space-x-2">
              <Switch id="mergeSampleData" checked={mergeSampleData} onCheckedChange={setMergeSampleData} />
              <Label htmlFor="mergeSampleData" className="flex items-center">
                Complete with Sample Data
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Fills in missing policy data fields with sample values for better simulation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>

      <Tabs defaultValue="person1" className="w-full" data-tour="tabs">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="person1" data-tour="person1-tab">
            Person 1
          </TabsTrigger>
          <TabsTrigger value="person2" data-tour="person2-tab">
            Person 2
          </TabsTrigger>
          {/* <TabsTrigger value="household" data-tour="household-tab">
            Household
          </TabsTrigger> */}
          <TabsTrigger value="analysis" data-tour="analysis-tab">
            Analysis
          </TabsTrigger>
          <TabsTrigger value="ai-insights" data-tour="ai-insights-tab">
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="documentation" data-tour="documentation-tab">
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="person1" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="grid grid-cols-1 gap-6">
                <PersonForm 
                  person={{ 
                    ...person1, 
                    policyData: activePolicyData && activePolicyData.length > 0 
                      ? convertToPersonFormPolicyData(activePolicyData[0]) 
                      : [] 
                  } as any} 
                  onChange={(p: any) => setPerson1(p)} 
                />
                <PolicyDetails personIndex={0} shiftPolicyYear={shiftPolicyDataYear} policyData={activePolicyData} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                <AssetProjectionChart
                  data={person1Projection}
                  comparisonData={person1ProjectionWithPolicyOff}
                  title="Asset Projection"
                  showLTCEvent={person1.ltcEventEnabled}
                  showRetirementAge={true}
                  retirementAge={person1.retirementAge}
                  ltcEventAge={person1.ltcEventAge}
                  legacyAssets={person1LegacyAssets}
                  person={person1}
                  personIndex={0}
                  showInitialCalculation={true}
                />
                <IncomeExpenseChart
                  data={person1Projection}
                  title="Income & Expenses"
                  showLTCEvent={person1.ltcEventEnabled}
                  showRetirementAge={true}
                  retirementAge={person1.retirementAge}
                  ltcEventAge={person1.ltcEventAge}
                />
                <FinancialCalculationDebug
                  data={person1Projection}
                  retirementAge={person1.retirementAge}
                  ltcEventAge={person1.ltcEventAge}
                  preRetirementAssetReturns={person1.preRetirementAssetReturns}
                  assetReturns={person1.assetReturns}
                />
                {person1.policyEnabled && (
                  <>
                    {/* Policy chart toggles */}
                    <div className="flex items-center justify-end space-x-6 mb-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showPolicyBenefits1"
                          checked={showPolicyBenefits}
                          onCheckedChange={setShowPolicyBenefits}
                        />
                        <Label htmlFor="showPolicyBenefits1">Show Policy Benefits Chart</Label>
                      </div>
                      {person1.ltcEventEnabled && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showPolicyComparison1"
                            checked={showPolicyComparison}
                            onCheckedChange={setShowPolicyComparison}
                          />
                          <Label htmlFor="showPolicyComparison1">Show Policy Comparison Chart</Label>
                        </div>
                      )}
                    </div>

                    {/* Conditionally render charts based on toggle state */}
                    {showPolicyBenefits && (
                      <PolicyBenefitsChart
                        data={person1Projection}
                        title="Policy Benefits Over Time"
                        showLTCEvent={person1.ltcEventEnabled}
                        ltcEventAge={person1.ltcEventAge}
                      />
                    )}

                    {person1.ltcEventEnabled && showPolicyComparison && (
                      <PolicyComparisonChart
                        data={person1Projection}
                        title="Original vs. Adjusted Policy Values"
                        showLTCEvent={true}
                        ltcEventAge={person1.ltcEventAge}
                      />
                    )}

                    <PolicyGrowthChart
                      personIndex={0}
                      title="Policy Growth Rates"
                      policyData={activePolicyData}
                    />
                  </>
                )}

                {person1.policyEnabled && person1.policyLoanEnabled && (
                  <PolicyLoanChart
                    data={person1Projection}
                    title="Policy Loan Analysis"
                    showLTCEvent={person1.ltcEventEnabled}
                    showRetirementAge={true}
                    retirementAge={person1.retirementAge}
                    ltcEventAge={person1.ltcEventAge}
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="person2" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="grid grid-cols-1 gap-6">
                <PersonForm 
                  person={{ 
                    ...person2, 
                    policyData: activePolicyData && activePolicyData.length > 1 
                      ? convertToPersonFormPolicyData(activePolicyData[1]) 
                      : [] 
                  } as any} 
                  onChange={(p: any) => setPerson2(p)} 
                />
                <PolicyDetails personIndex={1} shiftPolicyYear={shiftPolicyDataYear} policyData={activePolicyData} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                <AssetProjectionChart
                  data={person2Projection}
                  comparisonData={person2ProjectionWithPolicyOff}
                  title="Asset Projection"
                  showLTCEvent={person2.ltcEventEnabled}
                  showRetirementAge={true}
                  retirementAge={person2.retirementAge}
                  ltcEventAge={person2.ltcEventAge}
                  legacyAssets={person2LegacyAssets}
                  person={person2}
                  personIndex={1}
                  showInitialCalculation={true}
                />
                <IncomeExpenseChart
                  data={person2Projection}
                  title="Income & Expenses"
                  showLTCEvent={person2.ltcEventEnabled}
                  showRetirementAge={true}
                  retirementAge={person2.retirementAge}
                  ltcEventAge={person2.ltcEventAge}
                />
                <FinancialCalculationDebug
                  data={person2Projection}
                  retirementAge={person2.retirementAge}
                  ltcEventAge={person2.ltcEventAge}
                  preRetirementAssetReturns={person2.preRetirementAssetReturns}
                  assetReturns={person2.assetReturns}
                />
                {person2.policyEnabled && (
                  <>
                    {/* Policy chart toggles */}
                    <div className="flex items-center justify-end space-x-6 mb-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="showPolicyBenefits2"
                          checked={showPolicyBenefits}
                          onCheckedChange={setShowPolicyBenefits}
                        />
                        <Label htmlFor="showPolicyBenefits2">Show Policy Benefits Chart</Label>
                      </div>
                      {person2.ltcEventEnabled && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showPolicyComparison2"
                            checked={showPolicyComparison}
                            onCheckedChange={setShowPolicyComparison}
                          />
                          <Label htmlFor="showPolicyComparison2">Show Policy Comparison Chart</Label>
                        </div>
                      )}
                    </div>

                    {/* Conditionally render charts based on toggle state */}
                    {showPolicyBenefits && (
                      <PolicyBenefitsChart
                        data={person2Projection}
                        title="Policy Benefits Over Time"
                        showLTCEvent={person2.ltcEventEnabled}
                        ltcEventAge={person2.ltcEventAge}
                      />
                    )}

                    {person2.ltcEventEnabled && showPolicyComparison && (
                      <PolicyComparisonChart
                        data={person2Projection}
                        title="Original vs. Adjusted Policy Values"
                        showLTCEvent={true}
                        ltcEventAge={person2.ltcEventAge}
                      />
                    )}

                    <PolicyGrowthChart
                      personIndex={1}
                      title="Policy Growth Rates"
                      policyData={activePolicyData}
                    />
                  </>
                )}

                {person2.policyEnabled && person2.policyLoanEnabled && (
                  <PolicyLoanChart
                    data={person2Projection}
                    title="Policy Loan Analysis"
                    showLTCEvent={person2.ltcEventEnabled}
                    showRetirementAge={true}
                    retirementAge={person2.retirementAge}
                    ltcEventAge={person2.ltcEventAge}
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <h2 className="text-2xl font-bold">Insurance Impact Analysis</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetProjectionChart
              data={householdProjection}
              comparisonData={householdProjectionWithPolicyOff}
              title="With LTC Insurance"
              showLTCEvent={true}
              showRetirementAge={false}
              legacyAssets={householdLegacyAssets}
              showInitialCalculation={false}
            />

            <AssetProjectionChart
              data={householdProjectionWithoutInsurance}
              title="Without LTC Insurance"
              showLTCEvent={true}
              showRetirementAge={false}
              legacyAssets={householdLegacyAssetsWithoutInsurance}
              showInitialCalculation={false}
            />
          </div>

          <div className="bg-muted p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Key Insights</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                With LTC insurance, your assets are projected to last until age{" "}
                {householdProjection.findIndex((d) => d.assets <= 0) > 0
                  ? householdProjection.find((d) => d.assets <= 0)?.age || "end of life"
                  : "end of life"}
                .
              </li>
              <li>
                Without LTC insurance, your assets are projected to last until age{" "}
                {householdProjectionWithoutInsurance.findIndex((d) => d.assets <= 0) > 0
                  ? householdProjectionWithoutInsurance.find((d) => d.assets <= 0)?.age || "end of life"
                  : "end of life"}
                .
              </li>
              <li>Legacy assets with LTC insurance: {formatCurrency(householdLegacyAssets)}</li>
              <li>Legacy assets without LTC insurance: {formatCurrency(householdLegacyAssetsWithoutInsurance)}</li>
              <li>
                Difference in legacy assets:{" "}
                {formatCurrency(householdLegacyAssets - householdLegacyAssetsWithoutInsurance)}
              </li>
              {policyData && policyData.length > 0 ? (
                <>
                  <li>
                    The LTC insurance policies provide a combined monthly benefit of{" "}
                    {formatCurrency(
                      (policyData[0]?.annual_policy_data[0]?.monthly_benefit_limit || 0) +
                        (policyData[1]?.annual_policy_data[0]?.monthly_benefit_limit || 0),
                    )}
                    .
                  </li>
                  <li>
                    The total premium cost over your lifetime is approximately{" "}
                    {formatCurrency(
                      (policyData[0]?.annual_policy_data.reduce((sum: number, data: {annual_premium: number}) => sum + data.annual_premium, 0) || 0) +
                        (policyData[1]?.annual_policy_data.reduce((sum: number, data: {annual_premium: number}) => sum + data.annual_premium, 0) || 0),
                    )}
                    .
                  </li>
                  <li>
                    The death benefit protection provided by these policies is{" "}
                    {formatCurrency(
                      (policyData[0]?.policy_level_information.initial_death_benefit || 0) +
                        (policyData[1]?.policy_level_information.initial_death_benefit || 0),
                    )}
                    .
                  </li>
                </>
              ) : (
                <li>
                  The LTC insurance policies provide significant benefits that help protect your assets during long-term
                  care events.
                </li>
              )}
            </ul>
          </div>
          <PolicyDataDebug shiftPolicyYear={shiftPolicyDataYear} policyData={activePolicyData} />

          <div className="grid grid-cols-1 gap-6 mt-6">
            <TaxImpactVisualization
              data={householdProjection}
              comparisonData={householdProjectionWithoutInsurance}
              person1={person1}
              retirementAge1={person1.retirementAge}
              ltcEventAge1={person1.ltcEventAge}
              showRetirementAge={true}
              title="Household Tax Impact Analysis"
            />

            <TaxEfficiencyAdvisor
              person1Projection={person1Projection}
              person2Projection={person2Projection}
              householdProjection={householdProjection}
              householdProjectionWithoutInsurance={householdProjectionWithoutInsurance}
              person1={person1}
              person2={person2}
            />
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <AIAnalysis person1={person1} person2={person2} />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Documentation />
        </TabsContent>
      </Tabs>

      {/* Custom Guided Tour - Only render on client side */}
      {isMounted && (
        <>
          <CustomGuidedTour run={runTour} onComplete={handleTourComplete} onSkip={handleSkipTour} />
          <WelcomeModal open={showWelcomeModal} onStart={handleStartTour} onSkip={handleSkipTour} />
        </>
      )}
    </main>
  )
}
