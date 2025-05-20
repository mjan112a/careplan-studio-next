"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import PersonForm from "@/components/person-form"
import { AssetProjectionChart } from "@/components/asset-projection-chart"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { PolicyDetails } from "@/components/policy-details"
import { PolicyBenefitsChart } from "@/components/policy-benefits-chart"
import { AIAnalysis } from "@/components/ai-analysis"
import { Documentation } from "@/components/documentation"
import { type Person, defaultPerson } from "@/types/person"
import { calculateFinancialProjection, calculateHouseholdProjection } from "@/utils/financial-calculations"
import { formatCurrency } from "@/utils/format"
import { getFullPolicyData } from "@/types/policy-data"
import { PolicyDataDebug } from "@/components/policy-data-debug"
import { ThemeToggle } from "@/components/theme-toggle"
import { PolicyLoanChart } from "@/components/policy-loan-chart"
import { CustomGuidedTour, WelcomeModal } from "@/components/custom-guided-tour"
import { HelpCircle } from "lucide-react"
import { PolicyGrowthChart } from "@/components/policy-growth-chart"
import { PolicyComparisonChart } from "@/components/policy-comparison-chart"
import { FinancialCalculationDebug } from "@/components/financial-calculation-debug"
import { PolicyData } from "@/types/policy-data"

// Import the new tax visualization components
import { TaxImpactVisualization } from "@/components/tax-impact-visualization"
import { TaxEfficiencyAdvisor } from "@/components/tax-efficiency-advisor"
import { logger } from '@/lib/logging'

// Function to fetch policy data from document IDs
async function fetchPolicyData(docIds: string[]): Promise<PolicyData[] | null> {
  try {
    logger.info('Fetching policy data', { count: docIds.length });
    
    const response = await fetch('/api/policy-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentIds: docIds }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch policy data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log the raw structure of the API response for debugging
    logger.debug('API Response Structure', {
      hasDocuments: !!data.documents,
      documentsCount: data.documents?.length,
      firstDocumentKeys: data.documents && data.documents.length > 0 ? Object.keys(data.documents[0]) : [],
      firstDocHasProcessedData: data.documents && data.documents.length > 0 ? !!data.documents[0].processed_data : false,
      processedDataType: data.documents && data.documents.length > 0 && data.documents[0].processed_data 
        ? typeof data.documents[0].processed_data 
        : 'N/A'
    });
    
    // Log all document data for debugging
    logger.info('Examining API response documents', {
      count: data.documents.length,
      documentsWithProcessedData: data.documents.filter((doc: any) => doc.processed_data).length,
      sampleDoc: data.documents.length > 0 ? {
        id: data.documents[0].id,
        processedDataType: typeof data.documents[0].processed_data
      } : null
    });
    
    // Extract and validate the processed data from the documents
    const policyData = data.documents
      .filter((doc: { processed_data: any }) => doc.processed_data)
      .map((doc: { processed_data: any; id: string }) => {
        let processedData = doc.processed_data;
        
        // Try parsing the processed_data if it's a string (could be stored as JSON string)
        if (typeof processedData === 'string') {
          try {
            logger.debug('Attempting to parse processed_data string', { 
              docId: doc.id,
              sample: processedData.substring(0, 100) + '...' 
            });
            processedData = JSON.parse(processedData);
          } catch (e) {
            logger.error('Failed to parse processed_data string', { 
              docId: doc.id,
              error: e instanceof Error ? e.message : String(e)
            });
          }
        }
        
        // Log document structure to help debug
        logger.debug('Processing document data', {
          docId: doc.id,
          hasProcessedData: !!processedData,
          processedDataType: typeof processedData,
          hasPolicyLevelInfo: !!processedData?.policy_level_information,
          hasAnnualData: !!processedData?.annual_policy_data,
          topLevelKeys: processedData ? Object.keys(processedData) : []
        });
        
        // Check if this is a database record with 'processed_data' as a property rather than the data itself
        if (processedData && 
            !processedData.policy_level_information && 
            !processedData.annual_policy_data && 
            processedData.processed_data) {
          logger.debug('Found nested processed_data structure, unwrapping', { docId: doc.id });
          processedData = processedData.processed_data;
          
          // Try parsing again if it's a string
          if (typeof processedData === 'string') {
            try {
              processedData = JSON.parse(processedData);
            } catch (e) {
              logger.error('Failed to parse nested processed_data', { docId: doc.id });
            }
          }
        }
        
        // Ensure policy has required structure, otherwise create a basic structure
        if (!processedData || !processedData.policy_level_information || !processedData.annual_policy_data) {
          logger.warn('Invalid policy data structure', { 
            docId: doc.id, 
            processedDataType: typeof processedData,
            keys: processedData ? Object.keys(processedData) : []
          });
          return {
            policy_level_information: {
              insured_person_name: 'Unknown',
              policy_type: 'Unknown',
              initial_premium: 0,
              insured_person_age: 65,
              insured_person_gender: 'Male'
            },
            annual_policy_data: [
              { monthly_benefit_limit: 0, policy_year: 1 }
            ],
            _incomplete: true,
            _original_doc_id: doc.id
          };
        }
        
        // Validate annual_policy_data is an array
        if (!Array.isArray(processedData.annual_policy_data)) {
          logger.warn('annual_policy_data is not an array', { 
            docId: doc.id,
            type: typeof processedData.annual_policy_data
          });
          processedData.annual_policy_data = [
            { monthly_benefit_limit: 0, policy_year: 1 }
          ];
        }
        
        return processedData;
      });
    
    // Log success with document retrieval details
    logger.info('Policy data retrieval summary', { 
      requestedCount: docIds.length,
      receivedCount: data.documents.length,
      usableCount: policyData.length,
      success: policyData.length > 0
    });
    
    return policyData.length > 0 ? policyData : null;
  } catch (error) {
    logger.error('Error fetching policy data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

// Initialize policy data
async function initPolicyData() {
  if (typeof window === 'undefined') return;
  
  try {
    // Check for document IDs only in URL parameters
    const params = new URLSearchParams(window.location.search);
    const docIdsParam = params.get('doc_ids');
    
    if (docIdsParam) {
      try {
        // Parse the comma-separated document IDs
        const docIds = docIdsParam.split(',').filter(id => id.trim() !== '');
        logger.info('Found document IDs in URL', { count: docIds.length });
        
        // Fetch the policy data for these documents
        const policyData = await fetchPolicyData(docIds);
        
        if (policyData && policyData.length > 0) {
          // Store in window global for use throughout the app
          window._customPolicyData = policyData;
          
          // Log a summary of each policy with validation
          const policySummary = policyData.map(policy => {
            // Validate that the policy has the expected structure
            if (!policy || !policy.policy_level_information) {
              logger.warn('Policy data missing expected structure', { policy });
              return {
                insured: 'Unknown',
                policyType: 'Unknown',
                premium: 0,
                benefit: 0
              };
            }
            
            return {
              insured: policy.policy_level_information.insured_person_name || 'Unknown',
              policyType: policy.policy_level_information.policy_type || 'Unknown',
              premium: policy.policy_level_information.initial_premium || 0,
              benefit: (policy.annual_policy_data && policy.annual_policy_data[0]?.monthly_benefit_limit * 12) || 0
            };
          });
          
          logger.info('Simulator initialized with policy data', { 
            count: policyData.length, 
            policies: policySummary 
          });
          
          // Force a re-render by setting state
          if (typeof window.forceSimulatorUpdate === 'function') {
            window.forceSimulatorUpdate();
          }
          
          return;
        }
      } catch (e) {
        logger.error('Failed to parse document IDs from URL', {
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }
    
    logger.info('No document IDs found in URL, using sample policy data');
  } catch (error) {
    logger.error('Error initializing policy data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Define the global forceUpdate function for type safety
declare global {
  interface Window {
    _customPolicyData?: PolicyData[];
    forceSimulatorUpdate?: () => void;
  }
}

export default function Home() {
  const [useActualPolicy, setUseActualPolicy] = useState(true)
  const [shiftPolicyDataYear, setShiftPolicyDataYear] = useState(false)
  const [policyData, setPolicyData] = useState<any[] | null>(null)
  const [dataInitialized, setDataInitialized] = useState(false)

  // Chart visibility toggles
  const [showPolicyBenefits, setShowPolicyBenefits] = useState(true)
  const [showPolicyComparison, setShowPolicyComparison] = useState(true)

  // Tour state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [runTour, setRunTour] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Initialize data and provide a way to force update from global scope
  useEffect(() => {
    setIsMounted(true)
    
    // Set the force update function with validation
    window.forceSimulatorUpdate = () => {
      try {
        // Validate custom policy data before setting it
        if (typeof window !== 'undefined' && window._customPolicyData) {
          // Log the structure to help with debugging
          logger.debug('Custom policy data structure', {
            length: window._customPolicyData.length,
            hasValidStructure: window._customPolicyData.every(p => 
              p && typeof p === 'object' && 
              p.policy_level_information && 
              typeof p.policy_level_information === 'object' &&
              Array.isArray(p.annual_policy_data)
            )
          });
          
          setPolicyData(window._customPolicyData);
        } else {
          setPolicyData(null);
        }
      } catch (error) {
        logger.error('Error in forceSimulatorUpdate', {
          error: error instanceof Error ? error.message : String(error)
        });
        setPolicyData(null);
      }
    }
    
    // Initialize policy data
    if (!dataInitialized) {
      initPolicyData();
      setDataInitialized(true);
    }
    
    try {
      // Get policy data from window global if available
      if (typeof window !== 'undefined' && window._customPolicyData) {
        // Log what we're using
        logger.info('Using custom policy data from window global', {
          count: window._customPolicyData.length
        });
        setPolicyData(window._customPolicyData);
      } else {
        // Use sample data as fallback
        logger.info('No custom policy data available, using sample data');
        const sampleData = getFullPolicyData();
        setPolicyData(sampleData);
      }
    } catch (error) {
      // Handle any errors during policy data initialization
      logger.error('Error setting initial policy data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Safely fallback to sample data
      const sampleData = getFullPolicyData();
      setPolicyData(sampleData);
    }
    
    return () => {
      // Cleanup
      if (typeof window !== 'undefined') {
        window.forceSimulatorUpdate = undefined;
      }
    }
  }, [dataInitialized])

  // Use policy data from state
  const activePolicyData = policyData || getFullPolicyData()

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
  const person1Projection = calculateFinancialProjection(person1, 0, useActualPolicy, shiftPolicyDataYear)
  const person2Projection = calculateFinancialProjection(person2, 1, useActualPolicy, shiftPolicyDataYear)
  const householdProjection = calculateHouseholdProjection(person1Projection, person2Projection)

  // Calculate projections with policy turned off for comparison
  const person1WithPolicyOff = { ...person1, policyEnabled: false }
  const person2WithPolicyOff = { ...person2, policyEnabled: false }
  const person1ProjectionWithPolicyOff = calculateFinancialProjection(
    person1WithPolicyOff,
    0,
    false,
    shiftPolicyDataYear,
  )
  const person2ProjectionWithPolicyOff = calculateFinancialProjection(
    person2WithPolicyOff,
    1,
    false,
    shiftPolicyDataYear,
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
  )
  const person2ProjectionWithoutInsurance = calculateFinancialProjection(
    person2WithoutInsurance,
    1,
    false,
    shiftPolicyDataYear,
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

  return (
    <main className="container mx-auto py-8">
      {/* Original UI code remains unchanged */}
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
          {/* Policy toggles hidden for now
          <div className="flex items-center space-x-2" data-tour="policy-toggle">
            <Switch id="useActualPolicy" checked={useActualPolicy} onCheckedChange={setUseActualPolicy} />
            <Label htmlFor="useActualPolicy">Use Actual Policy Data</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="shiftPolicyDataYear" checked={shiftPolicyDataYear} onCheckedChange={setShiftPolicyDataYear} />
            <Label htmlFor="shiftPolicyDataYear" className="flex items-center">
              Shift Policy Year
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Test feature: Shifts policy data by 1 year earlier to align end-of-year policy values with
                      calculation timing.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>
          */}

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
                <PersonForm person={{ ...person1, policyData: [] } as any} onChange={(p: any) => setPerson1(p)} />
                <PolicyDetails personIndex={0} shiftPolicyYear={shiftPolicyDataYear} />
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
                <PersonForm person={{ ...person2, policyData: [] } as any} onChange={(p: any) => setPerson2(p)} />
                <PolicyDetails personIndex={1} shiftPolicyYear={shiftPolicyDataYear} />
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
          <PolicyDataDebug shiftPolicyYear={shiftPolicyDataYear} />

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
