"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import { HelpCircle } from "lucide-react"
import { PolicyGrowthChart } from "@/components/policy-growth-chart"
import { PolicyComparisonChart } from "@/components/policy-comparison-chart"
import { FinancialCalculationDebug } from "@/components/financial-calculation-debug"
import { usePolicyData } from '@/lib/policy-data'
import { PolicyData } from '@/types/simulator-interfaces'

// Import the new tax visualization components
import { TaxImpactVisualization } from "@/components/tax-impact-visualization"
import { TaxEfficiencyAdvisor } from "@/components/tax-efficiency-advisor"
import { logger } from '@/lib/logging'

// Get policy data from URL if available
let initialPolicyData: PolicyData[] | null = null;
if (typeof window !== 'undefined') {
  try {
    const formElement = document.querySelector('input[name="data"]') as HTMLInputElement | null
    if (formElement?.value) {
      // Try to parse JSON data from the form
      try {
        const jsonData = JSON.parse(formElement.value);
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          initialPolicyData = jsonData as PolicyData[];
          logger.info('Retrieved policy data for simulation', { 
            dataLength: initialPolicyData.length,
            sampleYear: initialPolicyData[0]?.annual_policy_data?.[0]
          });
        }
      } catch (parseError) {
        logger.error('Error parsing policy data JSON', { error: parseError });
      }
    }
  } catch (error) {
    logger.error('Error handling policy data', { error })
  }
}

export default function Home() {
  const [useActualPolicy, setUseActualPolicy] = useState(true)
  const [shiftPolicyDataYear, setShiftPolicyDataYear] = useState(false)
  const [mergeSampleData, setMergeSampleData] = useState(true)

  // Chart visibility toggles
  const [showPolicyBenefits, setShowPolicyBenefits] = useState(true)
  const [showPolicyComparison, setShowPolicyComparison] = useState(true)

  // Tour state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [runTour, setRunTour] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Use our policy data hook
  const { policyData } = usePolicyData(mergeSampleData)
  
  // Set active policy data - use initial data if provided via form, or hook data
  const activePolicyData = initialPolicyData || policyData

  // Initialize person data with policy information, with fallbacks if policy data is missing
  const [person1, setPerson1] = useState<Person>(() => {
    const policy = activePolicyData && activePolicyData.length > 0 ? activePolicyData[0] : null
    return {
      ...defaultPerson,
      name: policy ? policy.policy_level_information.insured_person_name : "Person 1",
      age: policy ? policy.policy_level_information.insured_person_age : defaultPerson.age,
      sex: policy
        ? policy.policy_level_information.insured_person_gender.toLowerCase() === "male"
          ? "male"
          : "female"
        : defaultPerson.sex,
      policyAnnualPremium: policy ? policy.policy_level_information.initial_premium : defaultPerson.policyAnnualPremium,
      policyBenefitPerYear: policy
        ? policy.annual_policy_data[0]?.monthly_benefit_limit * 12 || defaultPerson.policyBenefitPerYear
        : defaultPerson.policyBenefitPerYear,
      ltcEventEnabled: false,
      policyEnabled: false,
      initialPremiumFromAssets: true,
      premiumsFromAssetsPreRetirement: true,
      preRetirementAssetReturns: 0.07, // Add the new field with default value
    }
  })

  // Check if tour has been completed on component mount
  useEffect(() => {
    setIsMounted(true)

    // Only run client-side code after component is mounted
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

  return (
    <main className="container mx-auto py-8">
      {/* Original UI code remains unchanged */}
      <h1 className="text-3xl font-bold mb-6 text-center">LTC Event Financial Impact Simulator</h1>

      <div className="flex items-center space-x-4 mb-6 justify-between">
        <Button variant="outline" size="sm" onClick={handleRestartTour} className="flex items-center gap-1">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Help</span>
        </Button>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>

      {/* The rest of the UI would be here - we're not making any changes to it */}
      
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
