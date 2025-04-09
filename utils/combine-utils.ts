import type { Person, CombinedYearlyData, YearlyData } from "../types/financial-types"

export const combineRetirementData = (person1: Person, person2: Person): CombinedYearlyData[] => {
  if (!person1.enabled && !person2.enabled) return []

  console.log("COMBINING DATA: Creating combined retirement data")

  // SUPER DETAILED DEBUGGING
  console.log("DETAILED DEBUG - Person 1 data:", {
    enabled: person1.enabled,
    currentAge: person1.enabled ? person1.currentAge : "N/A",
    retirementDataLength: person1.enabled ? person1.retirementData.length : 0,
    firstYearData:
      person1.enabled && person1.retirementData.length > 0
        ? {
            age: person1.retirementData[0].age,
            year: person1.retirementData[0].year,
            workIncome: person1.retirementData[0].workIncome,
          }
        : "No data",
  })

  console.log("DETAILED DEBUG - Person 2 data:", {
    enabled: person2.enabled,
    currentAge: person2.enabled ? person2.currentAge : "N/A",
    retirementDataLength: person2.enabled ? person2.retirementData.length : 0,
    firstYearData:
      person2.enabled && person2.retirementData.length > 0
        ? {
            age: person2.retirementData[0].age,
            year: person2.retirementData[0].year,
            workIncome: person2.retirementData[0].workIncome,
          }
        : "No data",
  })

  // Create a map to store data by projection year (not age) for quick lookup
  const p1DataByYear = new Map<number, YearlyData>()
  const p2DataByYear = new Map<number, YearlyData>()

  // Determine the current year
  const currentYear = new Date().getFullYear()

  // Fill the maps with data, using projection year as the key
  if (person1.enabled) {
    person1.retirementData.forEach((data, index) => {
      // Use 1-based index for projection year (year 1, year 2, etc.)
      const projectionYear = index + 1
      p1DataByYear.set(projectionYear, data)
    })

    // Log the first few entries to verify
    console.log(
      "DETAILED DEBUG - Person 1 data by projection year:",
      Array.from(p1DataByYear.entries())
        .filter(([year]) => year <= 5)
        .map(([year, data]) => ({
          projectionYear: year,
          age: data.age,
          workIncome: data.workIncome,
        })),
    )
  }

  if (person2.enabled) {
    person2.retirementData.forEach((data, index) => {
      // Use 1-based index for projection year (year 1, year 2, etc.)
      const projectionYear = index + 1
      p2DataByYear.set(projectionYear, data)
    })
  }

  // Determine the maximum projection year
  const maxProjectionYear = Math.max(
    person1.enabled ? person1.retirementData.length : 0,
    person2.enabled ? person2.retirementData.length : 0,
  )

  // Create the combined data array
  const combinedData: CombinedYearlyData[] = []

  // For each projection year
  for (let projectionYear = 1; projectionYear <= maxProjectionYear; projectionYear++) {
    // Get data for this projection year
    const p1Data = p1DataByYear.get(projectionYear)
    const p2Data = p2DataByYear.get(projectionYear)

    // Calculate the actual calendar year
    const year = currentYear + projectionYear - 1

    // Create a data point for this projection year
    const dataPoint: CombinedYearlyData = {
      projectionYear,
      year,
      age: 0, // We'll calculate this below
      yearsFromNow: projectionYear - 1,
    }

    // Set the age based on the first enabled person's data
    if (p1Data) {
      dataPoint.age = p1Data.age
    } else if (p2Data) {
      dataPoint.age = p2Data.age
    }

    // Add Person 1 data with p1_ prefix
    if (p1Data) {
      Object.entries(p1Data).forEach(([key, value]) => {
        if (key !== "age" && key !== "year" && key !== "projectionYear") {
          dataPoint[`p1_${key}`] = value as number | boolean
        }
      })
    }

    // Add Person 2 data with p2_ prefix
    if (p2Data) {
      Object.entries(p2Data).forEach(([key, value]) => {
        if (key !== "age" && key !== "year" && key !== "projectionYear") {
          dataPoint[`p2_${key}`] = value as number | boolean
        }
      })
    }

    // Calculate combined values
    dataPoint.combined_workIncome = (dataPoint.p1_workIncome || 0) + (dataPoint.p2_workIncome || 0)
    dataPoint.combined_socialSecurity = (dataPoint.p1_socialSecurity || 0) + (dataPoint.p2_socialSecurity || 0)
    dataPoint.combined_pension = (dataPoint.p1_pension || 0) + (dataPoint.p2_pension || 0)
    dataPoint.combined_policyIncome = (dataPoint.p1_policyIncome || 0) + (dataPoint.p2_policyIncome || 0)
    dataPoint.combined_incomeNeeded = (dataPoint.p1_incomeNeeded || 0) + (dataPoint.p2_incomeNeeded || 0)
    dataPoint.combined_incomeGap = (dataPoint.p1_incomeGap || 0) + (dataPoint.p2_incomeGap || 0)
    dataPoint.combined_assets401k = (dataPoint.p1_assets401k || 0) + (dataPoint.p2_assets401k || 0)
    dataPoint.combined_assets401kNoPolicyScenario =
      (dataPoint.p1_assets401kNoPolicyScenario || 0) + (dataPoint.p2_assets401kNoPolicyScenario || 0)
    dataPoint.combined_policyPremium = (dataPoint.p1_policyPremium || 0) + (dataPoint.p2_policyPremium || 0)
    dataPoint.combined_policyCashValue = (dataPoint.p1_policyCashValue || 0) + (dataPoint.p2_policyCashValue || 0)
    dataPoint.combined_policyDeathBenefit =
      (dataPoint.p1_policyDeathBenefit || 0) + (dataPoint.p2_policyDeathBenefit || 0)
    dataPoint.combined_ltcCosts = (dataPoint.p1_ltcCosts || 0) + (dataPoint.p2_ltcCosts || 0)
    dataPoint.combined_ltcBenefits = (dataPoint.p1_ltcBenefits || 0) + (dataPoint.p2_ltcBenefits || 0)
    dataPoint.combined_ltcOutOfPocket = (dataPoint.p1_ltcOutOfPocket || 0) + (dataPoint.p2_ltcOutOfPocket || 0)
    dataPoint.combined_netWorth = (dataPoint.p1_netWorth || 0) + (dataPoint.p2_netWorth || 0)
    dataPoint.combined_netWorthNoPolicyScenario =
      (dataPoint.p1_netWorthNoPolicyScenario || 0) + (dataPoint.p2_netWorthNoPolicyScenario || 0)

    combinedData.push(dataPoint)
  }

  // Handle bankruptcy
  let bankruptAge = 0
  for (let i = 0; i < combinedData.length; i++) {
    const p1Bankrupt = combinedData[i].p1_bankrupt === true
    const p2Bankrupt = combinedData[i].p2_bankrupt === true

    if ((p1Bankrupt || p2Bankrupt) && bankruptAge === 0) {
      bankruptAge = combinedData[i].age
      combinedData[i].combined_bankrupt = true
      combinedData[i].combined_bankruptAge = bankruptAge
    }

    if (bankruptAge > 0 && combinedData[i].age >= bankruptAge) {
      combinedData[i].combined_bankrupt = true
      combinedData[i].combined_bankruptAge = bankruptAge

      // Zero out assets after bankruptcy
      if (combinedData[i].age > bankruptAge) {
        combinedData[i].combined_assets401k = 0
        combinedData[i].combined_netWorth = combinedData[i].combined_policyCashValue || 0
      }
    }
  }

  // Log the first few entries to verify
  if (combinedData.length > 0) {
    console.log(
      "DETAILED DEBUG - First 5 combined data entries:",
      combinedData.slice(0, 5).map((d) => ({
        projectionYear: d.projectionYear,
        age: d.age,
        p1_workIncome: d.p1_workIncome,
        p2_workIncome: d.p2_workIncome,
        combined_workIncome: d.combined_workIncome,
      })),
    )
  }

  console.log("COMBINING DATA: Combined data created with length:", combinedData.length)
  return combinedData
}

