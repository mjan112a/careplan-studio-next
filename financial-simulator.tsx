"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Person, CombinedYearlyData } from "./types/financial-types"
import { calculateRetirementScenario } from "./utils/calculation-utils"
import { combineRetirementData } from "./utils/combine-utils"
import {
  getIncomeMaxValue,
  getIncomeMinValue,
  getAssetMaxValue,
  getAssetMinValue,
  getLtcMaxValue,
  getAgeRange,
} from "./utils/chart-utils"
import PersonForm from "./components/person-form"
import KeySliders from "./components/key-sliders"
import IncomeChart from "./components/income-chart"
import AssetChart from "./components/asset-chart"
import LtcChart from "./components/ltc-chart"
import SummaryCard from "./components/summary-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "./utils/formatting-utils"
import ReportButton from "./components/report-button"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, BarChart2, Settings, Bug, Upload, RefreshCw, LogOut } from "lucide-react"
import Link from "next/link"
import { PolicyProvider, usePolicyData } from "./utils/policy-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import PolicyDataUploader from "./components/policy-data-uploader"
import { Badge } from "@/components/ui/badge"

export default function FinancialSimulatorWrapper() {
  return (
    <PolicyProvider>
      <FinancialSimulator />
    </PolicyProvider>
  )
}

function FinancialSimulator() {
  const {
    useAlternativeData,
    togglePolicyData,
    getCurrentPolicyData,
    setCustomPolicyData,
    hasCustomData,
    resetToDefaultData,
  } = usePolicyData()

  // Use a ref to track if this is the first render
  const isInitialMount = useRef(true)

  // Get the initial policy data
  const initialPolicyData = getCurrentPolicyData()

  // State for policy data uploader
  const [showUploader, setShowUploader] = useState(false)

  // Initial person data
  const initialPerson1: Person = {
    id: "1",
    name: "Person 1",
    policyData: initialPolicyData.policyData1,
    enabled: true,
    active: true,

    // Financial Parameters
    annualIncome: 150000,
    payRaise: 2,
    retirementAge: 67,
    incomeReplacement: 0.7,
    fourOhOneKBalance: 500000,
    annualContribution: 19500,
    expectedSocialSecurity: 36000,
    expectedPension: 0,

    // LTC Event Parameters
    ltcEventEnabled: false,
    ltcEventAge: 75,
    ltcMonthlyNeed: 7000,
    ltcDuration: 4,
    currentAge: 60,

    // Death Parameters
    deathAge: 80, // Set default death age to 80

    // Policy Parameters
    policyEnabled: false,
    isPremiumSingle: false,
    annualPremiumAmount: 3000,
    premiumYears: 15,

    // Economic Assumptions
    assetReturnRate: 7,
    retirementReturnRate: 5,
    generalInflationRate: 3,
    ltcInflationRate: 5,

    // Calculated Results
    retirementData: [],
    incomeGap: 0,
    ltcGap: 0,
    totalAssets: 0,
    totalLtcNeeded: 0,
    totalLtcCovered: 0,
  }

  const initialPerson2: Person = {
    ...initialPerson1,
    id: "2",
    name: "Person 2",
    policyData: initialPolicyData.policyData2,
    enabled: false,
    currentAge: 60,
    annualIncome: 120000,
    fourOhOneKBalance: 400000,
    ltcEventAge: 78,
    ltcEventEnabled: false,
    policyEnabled: false,
    deathAge: 80, // Set default death age to 80
    annualPremiumAmount: 3219.56,
  }

  // Create state for the input parameters (not calculated results)
  const [person1Inputs, setPerson1Inputs] = useState<Person>(initialPerson1)
  const [person2Inputs, setPerson2Inputs] = useState<Person>(initialPerson2)

  // Create separate state for the calculated results
  const [person1Results, setPerson1Results] = useState<Person>(calculateRetirementScenario(initialPerson1))
  const [person2Results, setPerson2Results] = useState<Person>(calculateRetirementScenario(initialPerson2))

  const [combinedView, setCombinedView] = useState<boolean>(false)
  const [combinedData, setCombinedData] = useState<CombinedYearlyData[]>([])
  const [activeTab, setActiveTab] = useState<string>("person1")

  // Add state to control sidebar visibility
  const [showSidebar, setShowSidebar] = useState<boolean>(true)

  // Add state for chart scaling
  const [incomeMaxValue, setIncomeMaxValue] = useState<number>(0)
  const [incomeMinValue, setIncomeMinValue] = useState<number>(0)
  const [assetMaxValue, setAssetMaxValue] = useState<number>(0)
  const [assetMinValue, setAssetMinValue] = useState<number>(0)
  const [ltcMaxValue, setLtcMaxValue] = useState<number>(0)
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 0])

  // Flag to track when policy data changes
  const [policyDataChanged, setPolicyDataChanged] = useState<boolean>(false)

  // Handle custom policy data upload
  const handlePolicyDataUploaded = (person1Data: any[], person2Data: any[]) => {
    console.log("Custom policy data uploaded")
    setCustomPolicyData(person1Data, person2Data)
    setPolicyDataChanged(true)
  }

  // Memoize the calculation function to avoid unnecessary recalculations
  const calculateResults = useCallback((person: Person) => {
    console.log(`Calculating results for ${person.name}, policy enabled: ${person.policyEnabled}`)
    // Create a deep copy to ensure no reference issues
    const personCopy = JSON.parse(JSON.stringify(person))
    return calculateRetirementScenario(personCopy)
  }, [])

  // Handle person data changes - immediately recalculate
  const handlePerson1Change = useCallback(
    (updatedPerson: Person) => {
      console.log(`Person 1 changed, policy enabled: ${updatedPerson.policyEnabled}`)
      setPerson1Inputs(updatedPerson)

      // Force a recalculation
      const calculatedPerson = calculateResults(updatedPerson)
      setPerson1Results(calculatedPerson)
    },
    [calculateResults],
  )

  const handlePerson2Change = useCallback(
    (updatedPerson: Person) => {
      console.log(`Person 2 changed, policy enabled: ${updatedPerson.policyEnabled}`)
      setPerson2Inputs(updatedPerson)

      // Force a recalculation
      const calculatedPerson = calculateResults(updatedPerson)
      setPerson2Results(calculatedPerson)
    },
    [calculateResults],
  )

  // Handle person tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "combined") {
      setCombinedView(true)
    } else {
      setCombinedView(false)
    }
  }

  // Function to toggle Person 2 enabled state
  const togglePerson2 = () => {
    const updatedPerson = {
      ...person2Inputs,
      enabled: !person2Inputs.enabled,
    }

    console.log(`Toggling Person 2 enabled state to: ${updatedPerson.enabled}`)
    handlePerson2Change(updatedPerson)
  }

  // Add this function right after the handleTabChange function
  const saveDebugData = () => {
    console.log("Saving debug data to localStorage")

    // Store the data in localStorage for the debug page to access
    localStorage.setItem("debug_person1", JSON.stringify(person1Results))
    localStorage.setItem("debug_person2", JSON.stringify(person2Results))
    localStorage.setItem("debug_combinedData", JSON.stringify(combinedData))
  }

  // Add this function to the component
  const forceRecalculate = useCallback(() => {
    console.log("FORCE RECALCULATING ALL DATA")

    // Force recalculation of both people
    const recalculatedPerson1 = calculateResults(person1Inputs)
    const recalculatedPerson2 = calculateResults(person2Inputs)

    // Update the state
    setPerson1Results(recalculatedPerson1)
    setPerson2Results(recalculatedPerson2)

    // Log the results
    console.log(
      "RECALCULATION COMPLETE - Person 1 first few ages:",
      recalculatedPerson1.retirementData
        .filter((d) => d.age >= recalculatedPerson1.currentAge && d.age < recalculatedPerson1.currentAge + 5)
        .map((d) => ({
          age: d.age,
          workIncome: d.workIncome,
        })),
    )
  }, [calculateResults, person1Inputs, person2Inputs])

  // Create the combined data whenever results change
  useEffect(() => {
    console.log("Creating combined data")

    // Debug log Person 1's retirement data
    if (person1Results.enabled) {
      console.log("Person 1 retirement data:", {
        currentAge: person1Results.currentAge,
        firstFewAges: person1Results.retirementData.slice(0, 3).map((d) => ({
          age: d.age,
          workIncome: d.workIncome,
        })),
      })
    }

    // Use the updated combineRetirementData function to create combined data
    const combined = combineRetirementData(person1Results, person2Results)
    setCombinedData(combined)

    // Save debug data whenever results change
    saveDebugData()
  }, [person1Results, person2Results])

  // Calculate chart scales whenever results or combined data change
  useEffect(() => {
    console.log("Calculating chart scales")
    // Income chart scales
    const incomeMax = getIncomeMaxValue(person1Results, person2Results, combinedData)
    const incomeMin = getIncomeMinValue(person1Results, person2Results, combinedData)

    // Asset chart scales
    const assetMax = getAssetMaxValue(person1Results, person2Results, combinedData)
    const assetMin = getAssetMinValue(person1Results, person2Results, combinedData)

    // LTC chart scale
    const ltcMax = getLtcMaxValue(person1Results, person2Results, combinedData)

    // Shared x-axis range
    const [minAge, maxAge] = getAgeRange(person1Results, person2Results)

    setIncomeMaxValue(incomeMax)
    setIncomeMinValue(incomeMin)
    setAssetMaxValue(assetMax)
    setAssetMinValue(assetMin)
    setLtcMaxValue(ltcMax)
    setAgeRange([minAge, maxAge])
  }, [person1Results, person2Results, combinedData])

  // Handle policy data toggle
  useEffect(() => {
    // Skip the first render to avoid double initialization
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    console.log("Policy data toggle changed, updating data")
    setPolicyDataChanged(true)
  }, [useAlternativeData, hasCustomData])

  // Update policy data when the flag changes
  useEffect(() => {
    if (!policyDataChanged) return

    const currentPolicyData = getCurrentPolicyData()
    console.log("Updating policy data", currentPolicyData)

    // Update person1 policy data
    setPerson1Inputs((prev) => ({
      ...prev,
      policyData: currentPolicyData.policyData1,
    }))

    // Update person2 policy data
    setPerson2Inputs((prev) => ({
      ...prev,
      policyData: currentPolicyData.policyData2,
    }))

    // Reset the flag
    setPolicyDataChanged(false)

    // Schedule a recalculation after state updates
    const timer = setTimeout(() => {
      forceRecalculate()
    }, 100)

    return () => clearTimeout(timer)
  }, [policyDataChanged, getCurrentPolicyData, forceRecalculate])

  // Handle resetting to default data
  const handleResetData = () => {
    resetToDefaultData()
    setPolicyDataChanged(true)
  }

  // Render the charts based on the active tab
  const renderCharts = () => {
    if (activeTab === "person1" && person1Results.enabled) {
      return (
        <div className="space-y-6">
          <SummaryCard person={person1Results} />

          {/* Key sliders positioned right after the summary card */}
          <KeySliders person={person1Inputs} onChange={handlePerson1Change} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Income & Expenses</CardTitle>
                <CardDescription>Income sources and expenses over time</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <IncomeChart
                  person={person1Results}
                  combinedView={false}
                  combinedData={[]}
                  maxValue={incomeMaxValue}
                  minValue={incomeMinValue}
                  ageRange={ageRange}
                  startAge={person1Results.currentAge}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Asset Projection</CardTitle>
                <CardDescription>Asset growth with/without policy</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <AssetChart
                  person={person1Results}
                  combinedView={false}
                  combinedData={[]}
                  maxValue={assetMaxValue}
                  minValue={assetMinValue}
                  ageRange={ageRange}
                />
              </CardContent>
            </Card>
          </div>

          {person1Results.ltcEventEnabled && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">LTC Event Impact</CardTitle>
                <CardDescription>Costs, benefits, and out-of-pocket expenses during LTC event</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <LtcChart
                  person={person1Results}
                  combinedView={false}
                  combinedData={[]}
                  maxValue={ltcMaxValue}
                  minValue={0}
                  ageRange={ageRange}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )
    } else if (activeTab === "person2" && person2Results.enabled) {
      // Similar structure for Person 2
      return (
        <div className="space-y-6">
          <SummaryCard person={person2Results} />

          {/* Key sliders positioned right after the summary card */}
          <KeySliders person={person2Inputs} onChange={handlePerson2Change} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Income & Expenses</CardTitle>
                <CardDescription>Income sources and expenses over time</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <IncomeChart
                  person={person2Results}
                  combinedView={false}
                  combinedData={[]}
                  maxValue={incomeMaxValue}
                  minValue={incomeMinValue}
                  ageRange={ageRange}
                  startAge={person2Results.currentAge}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Asset Projection</CardTitle>
                <CardDescription>Asset growth with/without policy</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <AssetChart
                  person={person2Results}
                  combinedView={false}
                  combinedData={[]}
                  maxValue={assetMaxValue}
                  minValue={assetMinValue}
                  ageRange={ageRange}
                />
              </CardContent>
            </Card>
          </div>

          {person2Results.ltcEventEnabled && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">LTC Event Impact</CardTitle>
                <CardDescription>Costs, benefits, and out-of-pocket expenses during LTC event</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <LtcChart
                  person={person2Results}
                  combinedView={false}
                  combinedData={[]}
                  maxValue={ltcMaxValue}
                  minValue={0}
                  ageRange={ageRange}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )
    } else if (activeTab === "combined") {
      // Combined view with similar structure
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Combined Household Summary</CardTitle>
              <CardDescription>
                Combined financial projection for {person1Results.enabled ? person1Results.name : ""}
                {person1Results.enabled && person2Results.enabled ? " and " : ""}
                {person2Results.enabled ? person2Results.name : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Combined Income</h3>
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-600">Total Annual Income:</span>
                    <span>
                      {formatCurrency(
                        (person1Results.enabled ? person1Results.annualIncome : 0) +
                          (person2Results.enabled ? person2Results.annualIncome : 0),
                      )}
                    </span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-600">Combined Social Security:</span>
                    <span>
                      {formatCurrency(
                        (person1Results.enabled ? person1Results.expectedSocialSecurity : 0) +
                          (person2Results.enabled ? person2Results.expectedSocialSecurity : 0),
                      )}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Combined Assets</h3>
                  <p className="text-sm flex justify-between">
                    <span className="text-gray-600">Total 401(k) Assets:</span>
                    <span>
                      {formatCurrency(
                        (person1Results.enabled ? person1Results.fourOhOneKBalance : 0) +
                          (person2Results.enabled ? person2Results.fourOhOneKBalance : 0),
                      )}
                    </span>
                  </p>
                  {(person1Results.policyEnabled || person2Results.policyEnabled) && (
                    <p className="text-sm flex justify-between">
                      <span className="text-gray-600">Total Policy Cash Value:</span>
                      <span>
                        {formatCurrency(
                          (person1Results.enabled &&
                          person1Results.policyEnabled &&
                          person1Results.policyData.length > 0
                            ? person1Results.policyData[0].cashValue
                            : 0) +
                            (person2Results.enabled &&
                            person2Results.policyEnabled &&
                            person2Results.policyData.length > 0
                              ? person2Results.policyData[0].cashValue
                              : 0),
                        )}
                      </span>
                    </p>
                  )}
                </div>

                {/* Add LTC summary section for combined view */}
                {(person1Results.ltcEventEnabled || person2Results.ltcEventEnabled) && (
                  <div className="col-span-2 mt-2 pt-2 border-t">
                    <h3 className="text-sm font-medium mb-2">Combined LTC Events</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {person1Results.enabled && person1Results.ltcEventEnabled && (
                        <div className="space-y-1">
                          <p className="text-sm flex justify-between">
                            <span className="text-gray-600">{person1Results.name} LTC Event:</span>
                            <span>
                              Age {person1Results.ltcEventAge} for {person1Results.ltcDuration} years
                            </span>
                          </p>
                          <p className="text-sm flex justify-between">
                            <span className="text-gray-600">Monthly Cost:</span>
                            <span>{formatCurrency(person1Results.ltcMonthlyNeed)}</span>
                          </p>
                        </div>
                      )}
                      {person2Results.enabled && person2Results.ltcEventEnabled && (
                        <div className="space-y-1">
                          <p className="text-sm flex justify-between">
                            <span className="text-gray-600">{person2Results.name} LTC Event:</span>
                            <span>
                              Age {person2Results.ltcEventAge} for {person2Results.ltcDuration} years
                            </span>
                          </p>
                          <p className="text-sm flex justify-between">
                            <span className="text-gray-600">Monthly Cost:</span>
                            <span>{formatCurrency(person2Results.ltcMonthlyNeed)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Combined Income & Expenses</CardTitle>
                <CardDescription>Household income sources and expenses</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <IncomeChart
                  person={person1Results.enabled ? person1Results : person2Results}
                  combinedView={true}
                  combinedData={combinedData}
                  maxValue={incomeMaxValue}
                  minValue={incomeMinValue}
                  ageRange={ageRange}
                  person2={person2Results.enabled ? person2Results : undefined}
                  startAge={Math.min(
                    person1Results.enabled ? person1Results.currentAge : 999,
                    person2Results.enabled ? person2Results.currentAge : 999,
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Combined Asset Projection</CardTitle>
                <CardDescription>Household assets with/without policies</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <AssetChart
                  person={person1Results.enabled ? person1Results : person2Results}
                  combinedView={true}
                  combinedData={combinedData}
                  maxValue={assetMaxValue}
                  minValue={assetMinValue}
                  ageRange={ageRange}
                  person2={person2Results.enabled ? person2Results : undefined}
                />
              </CardContent>
            </Card>
          </div>

          {(person1Results.ltcEventEnabled || person2Results.ltcEventEnabled) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Combined LTC Impact</CardTitle>
                <CardDescription>Combined LTC costs and benefits</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <LtcChart
                  person={person1Results.enabled ? person1Results : person2Results}
                  combinedView={true}
                  combinedData={combinedData}
                  maxValue={ltcMaxValue}
                  minValue={0}
                  ageRange={ageRange}
                  person2={person2Results.enabled ? person2Results : undefined}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )
    } else {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Select a person or combined view to see charts</p>
        </div>
      )
    }
  }

  // Render the inputs based on the active tab
  const renderInputs = () => {
    if (activeTab === "person1") {
      return <PersonForm person={person1Inputs} onChange={handlePerson1Change} />
    } else if (activeTab === "person2") {
      return <PersonForm person={person2Inputs} onChange={handlePerson2Change} />
    } else {
      return (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Select individual tabs to modify person-specific settings. The combined view shows the aggregate
                  impact of both people's financial situations.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("person1")}
                    className="w-full"
                    disabled={!person1Results.enabled}
                  >
                    Edit {person1Results.name}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("person2")}
                    className="w-full"
                    disabled={!person2Results.enabled}
                  >
                    Edit {person2Results.name}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Hybrid Life Insurance & LTC Financial Simulator</CardTitle>
              <CardDescription>
                Visualize the impact of hybrid whole life insurance policies on retirement planning and long-term care
                scenarios
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Policy Data Controls */}
              <div className="flex items-center gap-2">
                {hasCustomData && (
                  <Badge variant="outline" className="bg-blue-50">
                    Using Custom Data
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowUploader(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Policy Data
                </Button>
                {hasCustomData && (
                  <Button variant="outline" size="sm" onClick={handleResetData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                )}
                {!hasCustomData && (
                  <div className="flex items-center gap-2 ml-2">
                    <Switch checked={useAlternativeData} onCheckedChange={togglePolicyData} id="policy-data-toggle" />
                    <Label htmlFor="policy-data-toggle" className="text-sm">
                      {useAlternativeData ? "Using Annual Premium Data" : "Using Single Premium Data"}
                    </Label>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
                {showSidebar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {showSidebar ? "Hide" : "Show"} Inputs
              </Button>
              <Link href="/debug" passHref>
                <Button variant="outline" size="sm" onClick={saveDebugData}>
                  <Bug className="h-4 w-4 mr-2" />
                  Debug View
                </Button>
              </Link>
              <ReportButton person1={person1Results} person2={person2Results} combinedData={combinedData} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("isAuthenticated")
                  localStorage.removeItem("username")
                  window.location.href = "/login"
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Policy Data Uploader */}
        <PolicyDataUploader
          isOpen={showUploader}
          onClose={() => setShowUploader(false)}
          onDataUploaded={handlePolicyDataUploaded}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Inputs */}
          {showSidebar && (
            <div className="lg:w-1/4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Settings className="h-5 w-5 mr-2" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Person 2:</span>
                    <Button variant={person2Results.enabled ? "default" : "outline"} size="sm" onClick={togglePerson2}>
                      {person2Results.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>

                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="person1" disabled={!person1Results.enabled}>
                        Person 1
                      </TabsTrigger>
                      <TabsTrigger value="person2" disabled={!person2Results.enabled}>
                        Person 2
                      </TabsTrigger>
                      <TabsTrigger value="combined" disabled={!person1Results.enabled && !person2Results.enabled}>
                        Combined
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {renderInputs()}
            </div>
          )}

          {/* Main content area - Charts */}
          <div className={`${showSidebar ? "lg:w-3/4" : "w-full"} space-y-6`}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {activeTab === "person1"
                      ? person1Results.name
                      : activeTab === "person2"
                        ? person2Results.name
                        : "Combined Household"}{" "}
                    Analysis
                  </CardTitle>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="person1" disabled={!person1Results.enabled} className="px-3">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Person 1
                      </TabsTrigger>
                      <TabsTrigger value="person2" disabled={!person2Results.enabled} className="px-3">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Person 2
                      </TabsTrigger>
                      <TabsTrigger
                        value="combined"
                        disabled={!person1Results.enabled && !person2Results.enabled}
                        className="px-3"
                      >
                        <BarChart2 className="h-4 w-4 mr-2" />
                        Combined
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
            </Card>

            {renderCharts()}
          </div>
        </div>

        {/* Advanced controls - only visible to developers */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={forceRecalculate} className="text-xs">
            Recalculate
          </Button>
        </div>
      </div>
    </div>
  )
}

