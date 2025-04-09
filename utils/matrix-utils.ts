import type { Person, DataMatrix, YearlyData } from "../types/financial-types"

// Function to create a structured data matrix from person data
export const createDataMatrix = (person1: Person, person2: Person): DataMatrix => {
  // Determine the range of years to include
  const startAge = Math.min(
    person1.enabled ? person1.currentAge : Number.POSITIVE_INFINITY,
    person2.enabled ? person2.currentAge : Number.POSITIVE_INFINITY,
  )

  const endAge = 95 // Maximum projection age
  const totalYears = endAge - startAge + 1

  // Initialize the matrix structure
  const matrix: DataMatrix = {
    yearsFromNow: Array(totalYears)
      .fill(0)
      .map((_, i) => i),
    ages: {
      person1: Array(totalYears).fill(0),
      person2: Array(totalYears).fill(0),
    },
    baseData: {
      person1: {
        workIncome: Array(totalYears).fill(0),
        socialSecurity: Array(totalYears).fill(0),
        pension: Array(totalYears).fill(0),
        policyIncome: Array(totalYears).fill(0),
        incomeNeeded: Array(totalYears).fill(0),
        assets401k: Array(totalYears).fill(0),
        policyPremium: Array(totalYears).fill(0),
        policyCashValue: Array(totalYears).fill(0),
        policyDeathBenefit: Array(totalYears).fill(0),
        ltcCosts: Array(totalYears).fill(0),
        ltcBenefits: Array(totalYears).fill(0),
      },
      person2: {
        workIncome: Array(totalYears).fill(0),
        socialSecurity: Array(totalYears).fill(0),
        pension: Array(totalYears).fill(0),
        policyIncome: Array(totalYears).fill(0),
        incomeNeeded: Array(totalYears).fill(0),
        assets401k: Array(totalYears).fill(0),
        policyPremium: Array(totalYears).fill(0),
        policyCashValue: Array(totalYears).fill(0),
        policyDeathBenefit: Array(totalYears).fill(0),
        ltcCosts: Array(totalYears).fill(0),
        ltcBenefits: Array(totalYears).fill(0),
      },
    },
    derivedData: {
      person1: {
        incomeGap: Array(totalYears).fill(0),
        ltcOutOfPocket: Array(totalYears).fill(0),
        netWorth: Array(totalYears).fill(0),
        netWorthNoPolicyScenario: Array(totalYears).fill(0),
      },
      person2: {
        incomeGap: Array(totalYears).fill(0),
        ltcOutOfPocket: Array(totalYears).fill(0),
        netWorth: Array(totalYears).fill(0),
        netWorthNoPolicyScenario: Array(totalYears).fill(0),
      },
      combined: {
        workIncome: Array(totalYears).fill(0),
        socialSecurity: Array(totalYears).fill(0),
        pension: Array(totalYears).fill(0),
        policyIncome: Array(totalYears).fill(0),
        incomeNeeded: Array(totalYears).fill(0),
        incomeGap: Array(totalYears).fill(0),
        assets401k: Array(totalYears).fill(0),
        policyPremium: Array(totalYears).fill(0),
        policyCashValue: Array(totalYears).fill(0),
        policyDeathBenefit: Array(totalYears).fill(0),
        ltcCosts: Array(totalYears).fill(0),
        ltcBenefits: Array(totalYears).fill(0),
        ltcOutOfPocket: Array(totalYears).fill(0),
        netWorth: Array(totalYears).fill(0),
        netWorthNoPolicyScenario: Array(totalYears).fill(0),
      },
    },
  }

  // Fill in the ages
  for (let i = 0; i < totalYears; i++) {
    const currentAge = startAge + i
    matrix.ages.person1[i] = person1.enabled ? currentAge : 0
    matrix.ages.person2[i] = person2.enabled ? currentAge : 0
  }

  // Fill in person1 data
  if (person1.enabled) {
    fillPersonData(matrix, person1, "person1", startAge)
  }

  // Fill in person2 data
  if (person2.enabled) {
    fillPersonData(matrix, person2, "person2", startAge)
  }

  // Calculate combined data
  for (let i = 0; i < totalYears; i++) {
    // Base data sums
    matrix.derivedData.combined.workIncome[i] =
      matrix.baseData.person1.workIncome[i] + matrix.baseData.person2.workIncome[i]

    matrix.derivedData.combined.socialSecurity[i] =
      matrix.baseData.person1.socialSecurity[i] + matrix.baseData.person2.socialSecurity[i]

    matrix.derivedData.combined.pension[i] = matrix.baseData.person1.pension[i] + matrix.baseData.person2.pension[i]

    matrix.derivedData.combined.policyIncome[i] =
      matrix.baseData.person1.policyIncome[i] + matrix.baseData.person2.policyIncome[i]

    matrix.derivedData.combined.incomeNeeded[i] =
      matrix.baseData.person1.incomeNeeded[i] + matrix.baseData.person2.incomeNeeded[i]

    matrix.derivedData.combined.assets401k[i] =
      matrix.baseData.person1.assets401k[i] + matrix.baseData.person2.assets401k[i]

    matrix.derivedData.combined.policyPremium[i] =
      matrix.baseData.person1.policyPremium[i] + matrix.baseData.person2.policyPremium[i]

    matrix.derivedData.combined.policyCashValue[i] =
      matrix.baseData.person1.policyCashValue[i] + matrix.baseData.person2.policyCashValue[i]

    matrix.derivedData.combined.policyDeathBenefit[i] =
      matrix.baseData.person1.policyDeathBenefit[i] + matrix.baseData.person2.policyDeathBenefit[i]

    matrix.derivedData.combined.ltcCosts[i] = matrix.baseData.person1.ltcCosts[i] + matrix.baseData.person2.ltcCosts[i]

    matrix.derivedData.combined.ltcBenefits[i] =
      matrix.baseData.person1.ltcBenefits[i] + matrix.baseData.person2.ltcBenefits[i]

    // Derived data
    matrix.derivedData.combined.incomeGap[i] =
      matrix.derivedData.person1.incomeGap[i] + matrix.derivedData.person2.incomeGap[i]

    matrix.derivedData.combined.ltcOutOfPocket[i] =
      matrix.derivedData.person1.ltcOutOfPocket[i] + matrix.derivedData.person2.ltcOutOfPocket[i]

    matrix.derivedData.combined.netWorth[i] =
      matrix.derivedData.person1.netWorth[i] + matrix.derivedData.person2.netWorth[i]

    matrix.derivedData.combined.netWorthNoPolicyScenario[i] =
      matrix.derivedData.person1.netWorthNoPolicyScenario[i] + matrix.derivedData.person2.netWorthNoPolicyScenario[i]
  }

  return matrix
}

// Helper function to fill in data for a single person
function fillPersonData(matrix: DataMatrix, person: Person, personKey: "person1" | "person2", startAge: number) {
  // For each year in the person's retirement data
  person.retirementData.forEach((yearData: YearlyData) => {
    const index = yearData.age - startAge

    // Skip if the index is out of bounds
    if (index < 0 || index >= matrix.yearsFromNow.length) return

    // Fill in base data
    matrix.baseData[personKey].workIncome[index] = yearData.workIncome
    matrix.baseData[personKey].socialSecurity[index] = yearData.socialSecurity
    matrix.baseData[personKey].pension[index] = yearData.pension
    matrix.baseData[personKey].policyIncome[index] = yearData.policyIncome
    matrix.baseData[personKey].incomeNeeded[index] = yearData.incomeNeeded
    matrix.baseData[personKey].assets401k[index] = yearData.assets401k
    matrix.baseData[personKey].policyPremium[index] = yearData.policyPremium
    matrix.baseData[personKey].policyCashValue[index] = yearData.policyCashValue
    matrix.baseData[personKey].policyDeathBenefit[index] = yearData.policyDeathBenefit
    matrix.baseData[personKey].ltcCosts[index] = yearData.ltcCosts
    matrix.baseData[personKey].ltcBenefits[index] = yearData.ltcBenefits

    // Fill in derived data
    matrix.derivedData[personKey].incomeGap[index] = yearData.incomeGap
    matrix.derivedData[personKey].ltcOutOfPocket[index] = yearData.ltcOutOfPocket
    matrix.derivedData[personKey].netWorth[index] = yearData.netWorth
    matrix.derivedData[personKey].netWorthNoPolicyScenario[index] = yearData.netWorthNoPolicyScenario
  })
}

// Function to convert the matrix back to CombinedYearlyData format for compatibility
export const matrixToCombinedData = (matrix: DataMatrix): any[] => {
  const combinedData = []

  for (let i = 0; i < matrix.yearsFromNow.length; i++) {
    const yearData: any = {
      yearsFromNow: matrix.yearsFromNow[i],
      age: matrix.ages.person1[i] || matrix.ages.person2[i],
      year: new Date().getFullYear() + matrix.yearsFromNow[i],

      // Person 1 data
      p1_workIncome: matrix.baseData.person1.workIncome[i],
      p1_socialSecurity: matrix.baseData.person1.socialSecurity[i],
      p1_pension: matrix.baseData.person1.pension[i],
      p1_policyIncome: matrix.baseData.person1.policyIncome[i],
      p1_incomeNeeded: matrix.baseData.person1.incomeNeeded[i],
      p1_incomeGap: matrix.derivedData.person1.incomeGap[i],
      p1_assets401k: matrix.baseData.person1.assets401k[i],
      p1_policyPremium: matrix.baseData.person1.policyPremium[i],
      p1_policyCashValue: matrix.baseData.person1.policyCashValue[i],
      p1_policyDeathBenefit: matrix.baseData.person1.policyDeathBenefit[i],
      p1_ltcCosts: matrix.baseData.person1.ltcCosts[i],
      p1_ltcBenefits: matrix.baseData.person1.ltcBenefits[i],
      p1_ltcOutOfPocket: matrix.derivedData.person1.ltcOutOfPocket[i],
      p1_netWorth: matrix.derivedData.person1.netWorth[i],
      p1_netWorthNoPolicyScenario: matrix.derivedData.person1.netWorthNoPolicyScenario[i],

      // Person 2 data
      p2_workIncome: matrix.baseData.person2.workIncome[i],
      p2_socialSecurity: matrix.baseData.person2.socialSecurity[i],
      p2_pension: matrix.baseData.person2.pension[i],
      p2_policyIncome: matrix.baseData.person2.policyIncome[i],
      p2_incomeNeeded: matrix.baseData.person2.incomeNeeded[i],
      p2_incomeGap: matrix.derivedData.person2.incomeGap[i],
      p2_assets401k: matrix.baseData.person2.assets401k[i],
      p2_policyPremium: matrix.baseData.person2.policyPremium[i],
      p2_policyCashValue: matrix.baseData.person2.policyCashValue[i],
      p2_policyDeathBenefit: matrix.baseData.person2.policyDeathBenefit[i],
      p2_ltcCosts: matrix.baseData.person2.ltcCosts[i],
      p2_ltcBenefits: matrix.baseData.person2.ltcBenefits[i],
      p2_ltcOutOfPocket: matrix.derivedData.person2.ltcOutOfPocket[i],
      p2_netWorth: matrix.derivedData.person2.netWorth[i],
      p2_netWorthNoPolicyScenario: matrix.derivedData.person2.netWorthNoPolicyScenario[i],

      // Combined data
      combined_workIncome: matrix.derivedData.combined.workIncome[i],
      combined_socialSecurity: matrix.derivedData.combined.socialSecurity[i],
      combined_pension: matrix.derivedData.combined.pension[i],
      combined_policyIncome: matrix.derivedData.combined.policyIncome[i],
      combined_incomeNeeded: matrix.derivedData.combined.incomeNeeded[i],
      combined_incomeGap: matrix.derivedData.combined.incomeGap[i],
      combined_assets401k: matrix.derivedData.combined.assets401k[i],
      combined_policyPremium: matrix.derivedData.combined.policyPremium[i],
      combined_policyCashValue: matrix.derivedData.combined.policyCashValue[i],
      combined_policyDeathBenefit: matrix.derivedData.combined.policyDeathBenefit[i],
      combined_ltcCosts: matrix.derivedData.combined.ltcCosts[i],
      combined_ltcBenefits: matrix.derivedData.combined.ltcBenefits[i],
      combined_ltcOutOfPocket: matrix.derivedData.combined.ltcOutOfPocket[i],
      combined_netWorth: matrix.derivedData.combined.netWorth[i],
      combined_netWorthNoPolicyScenario: matrix.derivedData.combined.netWorthNoPolicyScenario[i],
    }

    combinedData.push(yearData)
  }

  return combinedData
}

