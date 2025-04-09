import type { Person, CombinedYearlyData } from "../types/financial-types"

// Function to get the maximum value for income chart
export const getIncomeMaxValue = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]): number => {
  let maxValue = 0

  // Check person1 data
  if (person1.enabled && person1.retirementData.length > 0) {
    person1.retirementData.forEach((data) => {
      // Check income-related fields
      maxValue = Math.max(maxValue, data.workIncome || 0)
      maxValue = Math.max(maxValue, data.socialSecurity || 0)
      maxValue = Math.max(maxValue, data.pension || 0)
      maxValue = Math.max(maxValue, data.policyIncome || 0) // Include policy income
      maxValue = Math.max(maxValue, data.incomeNeeded || 0)
      // Total of stacked income sources
      const totalIncome =
        (data.workIncome || 0) + (data.socialSecurity || 0) + (data.pension || 0) + (data.policyIncome || 0)
      maxValue = Math.max(maxValue, totalIncome)
    })
  }

  // Check person2 data
  if (person2.enabled && person2.retirementData.length > 0) {
    person2.retirementData.forEach((data) => {
      // Check income-related fields
      maxValue = Math.max(maxValue, data.workIncome || 0)
      maxValue = Math.max(maxValue, data.socialSecurity || 0)
      maxValue = Math.max(maxValue, data.pension || 0)
      maxValue = Math.max(maxValue, data.policyIncome || 0) // Include policy income
      maxValue = Math.max(maxValue, data.incomeNeeded || 0)
      // Total of stacked income sources
      const totalIncome =
        (data.workIncome || 0) + (data.socialSecurity || 0) + (data.pension || 0) + (data.policyIncome || 0)
      maxValue = Math.max(maxValue, totalIncome)
    })
  }

  // Check combined data
  if (combinedData.length > 0) {
    combinedData.forEach((data) => {
      // Check all income-related fields with prefixes
      Object.entries(data).forEach(([key, value]) => {
        if (
          typeof value === "number" &&
          (key.includes("workIncome") ||
            key.includes("socialSecurity") ||
            key.includes("pension") ||
            key.includes("policyIncome") || // Include policy income
            key.includes("incomeNeeded"))
        ) {
          maxValue = Math.max(maxValue, value)
        }
      })
    })
  }

  // Round up to a nice number for the y-axis
  return Math.ceil(maxValue / 50000) * 50000
}

// Function to get the minimum value for income chart (for negative income gap)
export const getIncomeMinValue = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]): number => {
  // For income chart, we need to show negative values for income gap
  // Calculate the maximum income gap and make it negative
  let maxIncomeGap = 0

  // Check person1 data
  if (person1.enabled && person1.retirementData.length > 0) {
    person1.retirementData.forEach((data) => {
      maxIncomeGap = Math.max(maxIncomeGap, data.incomeGap)
    })
  }

  // Check person2 data
  if (person2.enabled && person2.retirementData.length > 0) {
    person2.retirementData.forEach((data) => {
      maxIncomeGap = Math.max(maxIncomeGap, data.incomeGap)
    })
  }

  // Check combined data
  if (combinedData.length > 0) {
    combinedData.forEach((data) => {
      if (data.p1_incomeGap) maxIncomeGap = Math.max(maxIncomeGap, data.p1_incomeGap)
      if (data.p2_incomeGap) maxIncomeGap = Math.max(maxIncomeGap, data.p2_incomeGap)
      if (data.combined_incomeGap) maxIncomeGap = Math.max(maxIncomeGap, data.combined_incomeGap)
    })
  }

  // Round up to a nice number and make it negative
  return -Math.ceil(maxIncomeGap / 50000) * 50000
}

// Function to get the maximum value for asset chart
export const getAssetMaxValue = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]): number => {
  let maxValue = 0

  // Check person1 data
  if (person1.enabled && person1.retirementData.length > 0) {
    person1.retirementData.forEach((data) => {
      // Check asset-related fields
      maxValue = Math.max(maxValue, data.assets401k || 0)
      maxValue = Math.max(maxValue, data.assets401kNoPolicyScenario || 0)
      maxValue = Math.max(maxValue, data.policyCashValue || 0)
      maxValue = Math.max(maxValue, data.netWorth || 0)
      maxValue = Math.max(maxValue, data.netWorthNoPolicyScenario || 0)
    })
  }

  // Check person2 data
  if (person2.enabled && person2.retirementData.length > 0) {
    person2.retirementData.forEach((data) => {
      // Check asset-related fields
      maxValue = Math.max(maxValue, data.assets401k || 0)
      maxValue = Math.max(maxValue, data.assets401kNoPolicyScenario || 0)
      maxValue = Math.max(maxValue, data.policyCashValue || 0)
      maxValue = Math.max(maxValue, data.netWorth || 0)
      maxValue = Math.max(maxValue, data.netWorthNoPolicyScenario || 0)
    })
  }

  // Check combined data
  if (combinedData.length > 0) {
    combinedData.forEach((data) => {
      // Check all asset-related fields with prefixes
      Object.entries(data).forEach(([key, value]) => {
        if (
          typeof value === "number" &&
          (key.includes("assets401k") || key.includes("policyCashValue") || key.includes("netWorth"))
        ) {
          maxValue = Math.max(maxValue, value)
        }
      })
    })
  }

  // Round up to a nice number for the y-axis
  return Math.ceil(maxValue / 500000) * 500000
}

// Function to get the minimum value for asset chart (for withdrawals)
export const getAssetMinValue = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]): number => {
  // For asset chart, we need to show negative values for withdrawals
  // Calculate the maximum withdrawal (income gap + LTC out of pocket)
  let maxWithdrawal = 0

  // Check person1 data
  if (person1.enabled && person1.retirementData.length > 0) {
    person1.retirementData.forEach((data) => {
      if (data.age >= person1.retirementAge) {
        const withdrawal = data.incomeGap + data.ltcOutOfPocket
        maxWithdrawal = Math.max(maxWithdrawal, withdrawal)
      }
    })
  }

  // Check person2 data
  if (person2.enabled && person2.retirementData.length > 0) {
    person2.retirementData.forEach((data) => {
      if (data.age >= person2.retirementAge) {
        const withdrawal = data.incomeGap + data.ltcOutOfPocket
        maxWithdrawal = Math.max(maxWithdrawal, withdrawal)
      }
    })
  }

  // Check combined data
  if (combinedData.length > 0) {
    combinedData.forEach((data) => {
      let p1Withdrawal = 0
      let p2Withdrawal = 0

      if (data.p1_incomeGap && data.p1_ltcOutOfPocket && person1.enabled && data.age >= person1.retirementAge) {
        p1Withdrawal = data.p1_incomeGap + data.p1_ltcOutOfPocket
      }

      if (data.p2_incomeGap && data.p2_ltcOutOfPocket && person2.enabled && data.age >= person2.retirementAge) {
        p2Withdrawal = data.p2_incomeGap + data.p2_ltcOutOfPocket
      }

      maxWithdrawal = Math.max(maxWithdrawal, p1Withdrawal, p2Withdrawal)
    })
  }

  // Round up to a nice number and make it negative
  // Use a smaller scale for withdrawals, but ensure it's at least -50000
  return -Math.max(50000, Math.ceil(maxWithdrawal / 50000) * 50000)
}

// Function to get the maximum value for LTC chart
export const getLtcMaxValue = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]): number => {
  let maxValue = 0

  // Check person1 data
  if (person1.enabled && person1.retirementData.length > 0) {
    person1.retirementData.forEach((data) => {
      // Check LTC-related fields
      maxValue = Math.max(maxValue, data.ltcCosts || 0)
      maxValue = Math.max(maxValue, data.ltcBenefits || 0)
      maxValue = Math.max(maxValue, data.ltcOutOfPocket || 0)
    })
  }

  // Check person2 data
  if (person2.enabled && person2.retirementData.length > 0) {
    person2.retirementData.forEach((data) => {
      // Check LTC-related fields
      maxValue = Math.max(maxValue, data.ltcCosts || 0)
      maxValue = Math.max(maxValue, data.ltcBenefits || 0)
      maxValue = Math.max(maxValue, data.ltcOutOfPocket || 0)
    })
  }

  // Check combined data
  if (combinedData.length > 0) {
    combinedData.forEach((data) => {
      // Check all LTC-related fields with prefixes
      Object.entries(data).forEach(([key, value]) => {
        if (
          typeof value === "number" &&
          (key.includes("ltcCosts") || key.includes("ltcBenefits") || key.includes("ltcOutOfPocket"))
        ) {
          maxValue = Math.max(maxValue, value)
        }
      })
    })
  }

  // Round up to a nice number for the y-axis
  return Math.ceil(maxValue / 50000) * 50000
}

// Function to get the age range for consistent x-axis scaling
export const getAgeRange = (person1: Person, person2: Person): [number, number] => {
  let minAge = 100
  let maxAge = 0

  if (person1.enabled) {
    minAge = Math.min(minAge, person1.currentAge)
    maxAge = Math.max(maxAge, 95) // We project to age 95
  }

  if (person2.enabled) {
    minAge = Math.min(minAge, person2.currentAge)
    maxAge = Math.max(maxAge, 95) // We project to age 95
  }

  return [minAge, maxAge]
}

