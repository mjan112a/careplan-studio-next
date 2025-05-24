import type { Person, YearlyData, PolicyData } from "../types/financial-types"

export interface CombinedYearlyData {
  age: number
  year: number
  [key: string]: number | boolean // Added boolean to support bankruptcy flag
  p1_workIncome?: number
  p1_socialSecurity?: number
  p1_pension?: number
  p1_policyIncome?: number // Policy income during LTC events
  p1_incomeNeeded?: number
  p1_incomeGap?: number
  p1_assets401k?: number
  p1_assets401kNoPolicyScenario?: number
  p1_policyPremium?: number
  p1_policyCashValue?: number
  p1_policyDeathBenefit?: number
  p1_ltcCosts?: number
  p1_ltcBenefits?: number
  p1_ltcOutOfPocket?: number
  p1_netWorth?: number
  p1_netWorthNoPolicyScenario?: number
  p1_bankrupt?: boolean // Added bankruptcy flag
  p1_bankruptAge?: number // Added bankruptcy age
  p1_isDeathYear?: boolean // Added death year flag
  p2_workIncome?: number
  p2_socialSecurity?: number
  p2_pension?: number
  p2_policyIncome?: number // Policy income during LTC events
  p2_incomeNeeded?: number
  p2_incomeGap?: number
  p2_assets401k?: number
  p2_assets401kNoPolicyScenario?: number
  p2_policyPremium?: number
  p2_policyCashValue?: number
  p2_policyDeathBenefit?: number
  p2_ltcCosts?: number
  p2_ltcBenefits?: number
  p2_ltcOutOfPocket?: number
  p2_netWorth?: number
  p2_netWorthNoPolicyScenario?: number
  p2_bankrupt?: boolean // Added bankruptcy flag
  p2_bankruptAge?: number // Added bankruptcy age
  p2_isDeathYear?: boolean // Added death year flag
  combined_netWorth?: number
  combined_netWorthNoPolicyScenario?: number
  combined_ltcCosts?: number
  combined_ltcBenefits?: number
  combined_ltcOutOfPocket?: number
  combined_bankrupt?: boolean // Added bankruptcy flag
  combined_bankruptAge?: number // Added bankruptcy age
  combined_workIncome?: number
  combined_socialSecurity?: number
  combined_pension?: number
  combined_policyIncome?: number
  combined_incomeNeeded?: number
  combined_incomeGap?: number
  combined_assets401k?: number
  combined_assets401kNoPolicyScenario?: number
  combined_policyPremium?: number
  combined_policyCashValue?: number
  combined_policyDeathBenefit?: number
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper function to find the appropriate policy data for a given year
// Uses interpolation for years that don't have exact matches
const findPolicyDataForYear = (policyData: PolicyData[], policyYear: number): PolicyData => {
  // If policy year is less than 1, use the first year
  if (policyYear < 1) return policyData[0]

  // Try to find exact match
  const exactMatch = policyData.find((p) => p.year === policyYear)
  if (exactMatch) return exactMatch

  // Find the closest years before and after
  const sortedData = [...policyData].sort((a, b) => a.year - b.year)

  // If policy year is beyond the last year in data, use the last year
  if (policyYear > sortedData[sortedData.length - 1].year) {
    return sortedData[sortedData.length - 1]
  }

  // Find the years that bracket the policy year
  let lowerIndex = 0
  for (let i = 0; i < sortedData.length; i++) {
    if (sortedData[i].year < policyYear) {
      lowerIndex = i
    } else {
      break
    }
  }

  const upperIndex = lowerIndex + 1

  // If we can't interpolate (shouldn't happen with our checks above), return the closest
  if (upperIndex >= sortedData.length) return sortedData[lowerIndex]

  const lowerYear = sortedData[lowerIndex].year
  const upperYear = sortedData[upperIndex].year

  // Calculate how far between the two years we are (0 to 1)
  const ratio = (policyYear - lowerYear) / (upperYear - lowerYear)

  // FIXED: Don't interpolate premiums - use exact values only
  // Premiums are discrete payments, not smooth curves
  // For non-exact years, use the premium from the lower year (previous year's premium structure)
  return {
    year: policyYear,
    premium: sortedData[lowerIndex].premium, // Use exact premium, no interpolation
    cashValue: interpolate(sortedData[lowerIndex].cashValue, sortedData[upperIndex].cashValue, ratio),
    deathBenefit: interpolate(sortedData[lowerIndex].deathBenefit, sortedData[upperIndex].deathBenefit, ratio),
    totalLTCBenefit: interpolate(sortedData[lowerIndex].totalLTCBenefit, sortedData[upperIndex].totalLTCBenefit, ratio),
    aobMonthly: interpolate(sortedData[lowerIndex].aobMonthly, sortedData[upperIndex].aobMonthly, ratio),
    cobMonthly: interpolate(sortedData[lowerIndex].cobMonthly, sortedData[upperIndex].cobMonthly, ratio),
  }
}

// Helper function to interpolate between two values
const interpolate = (a: number, b: number, ratio: number): number => {
  return a + (b - a) * ratio
}

export const calculateRetirementScenario = (person: Person): Person => {
  if (!person.enabled) return person

  console.log(
    `CALCULATION START: ${person.name}, policy enabled: ${person.policyEnabled}, currentAge: ${person.currentAge}`,
  )

  // SUPER DETAILED DEBUGGING
  console.log(`DETAILED DEBUG - ${person.name} input parameters:`, {
    currentAge: person.currentAge,
    annualIncome: person.annualIncome,
    retirementAge: person.retirementAge,
  })

  const retirementData: YearlyData[] = []
  const currentYear = new Date().getFullYear()

  // Initialize variables for tracking WITH policy scenario
  let currentIncome = person.annualIncome
  let assets401k = person.fourOhOneKBalance
  let isBankrupt = false
  let bankruptAge = 0
  let legacyAmount = 0

  // Initialize variables for tracking WITHOUT policy scenario
  let assets401kNoPolicyScenario = person.fourOhOneKBalance
  let isNoPolicyBankrupt = false
  let noPolicyBankruptAge = 0

  // Calculate for each year from current age to 95
  for (let age = person.currentAge; age <= 95; age++) {
    const year = currentYear + (age - person.currentAge)
    const isRetired = age >= person.retirementAge
    const yearsSinceStart = age - person.currentAge
    const isDeathYear = age === person.deathAge

    // Income calculations
    if (!isRetired) {
      // Working years
      currentIncome = person.annualIncome * Math.pow(1 + person.payRaise / 100, yearsSinceStart)
    }

    // Calculate retirement income needed (inflated)
    const finalWorkingIncome =
      person.annualIncome * Math.pow(1 + person.payRaise / 100, person.retirementAge - person.currentAge)
    const baseRetirementNeed = finalWorkingIncome * person.incomeReplacement
    const baseIncomeNeeded = isRetired
      ? baseRetirementNeed * Math.pow(1 + person.generalInflationRate / 100, age - person.retirementAge)
      : 0

    // Social Security and Pension (with inflation)
    const socialSecurity = isRetired
      ? person.expectedSocialSecurity * Math.pow(1 + person.generalInflationRate / 100, age - person.retirementAge)
      : 0

    const pension = isRetired
      ? person.expectedPension * Math.pow(1 + person.generalInflationRate / 100, age - person.retirementAge)
      : 0

    // LTC calculations
    const hasLtcEvent =
      person.ltcEventEnabled && age >= person.ltcEventAge && age < person.ltcEventAge + person.ltcDuration

    // Calculate inflated LTC costs
    const ltcInflationFactor = Math.pow(1 + person.ltcInflationRate / 100, age - person.currentAge)
    const monthlyLtcCost = hasLtcEvent ? person.ltcMonthlyNeed * ltcInflationFactor : 0
    const annualLtcCost = monthlyLtcCost * 12

    // Simple policy year calculation: Policy Year 1 = person's current age
    const policyYear = age - person.currentAge + 1
    const policyDataForYear = person.policyData ? findPolicyDataForYear(person.policyData, policyYear) : null

    // Policy benefits for LTC - ONLY if policy is enabled
    let ltcBenefits = 0
    if (person.policyEnabled && hasLtcEvent && policyDataForYear) {
      // Use the appropriate monthly benefit (COB)
      const monthlyBenefit = policyDataForYear.cobMonthly
      ltcBenefits = Math.min(monthlyBenefit * 12, annualLtcCost)
    }

    // Calculate out-of-pocket LTC expenses
    const ltcOutOfPocket = Math.max(0, annualLtcCost - ltcBenefits)

    // Calculate policy income - ONLY during LTC events
    // This is the same as the LTC benefits, but we track it separately for display purposes
    let policyIncome = 0
    if (person.policyEnabled && hasLtcEvent && policyDataForYear) {
      policyIncome = ltcBenefits // Policy income equals LTC benefits
    }

    // IMPORTANT: Total income needed includes both base income needs and LTC costs
    const incomeNeeded = baseIncomeNeeded + annualLtcCost

    // Income gap calculation - total income needed minus all income sources
    // We include LTC costs in income needed and policy income (LTC benefits) in income sources
    const incomeGap = Math.max(0, incomeNeeded - socialSecurity - pension - policyIncome)

    // TIMING RECONCILIATION: Policy premium calculation
    // Premium for Policy Year N is paid at the BEGINNING of that policy year
    let policyPremium = 0
    if (person.policyEnabled && policyDataForYear) {
      policyPremium = policyDataForYear.premium
      
      // Debug logging to understand the timing issue
      if (age <= person.currentAge + 10) {
        console.log(`DEBUG PREMIUM: Age ${age}, PolicyYear ${policyYear}, Premium $${policyPremium}, YearsSinceStart ${yearsSinceStart}`)
        console.log(`  policyDataForYear:`, JSON.stringify(policyDataForYear, null, 2))
      }
    }

    // WITH POLICY SCENARIO - Asset calculations
    if (!isBankrupt) {
      if (!isRetired) {
        // During working years
        assets401k =
          assets401k * (1 + person.assetReturnRate / 100) +
          person.annualContribution -
          (person.policyEnabled ? policyPremium : 0)
      } else {
        // During retirement
        // We withdraw the income gap which already accounts for LTC costs and benefits
        assets401k = assets401k * (1 + person.retirementReturnRate / 100) - incomeGap
      }

      // Check if person has gone bankrupt
      if (assets401k <= 0 && isRetired) {
        isBankrupt = true
        bankruptAge = age
        assets401k = 0
      }
    }

    // WITHOUT POLICY SCENARIO - Asset calculations
    if (!isNoPolicyBankrupt) {
      if (!isRetired) {
        // During working years - no premium deduction
        assets401kNoPolicyScenario =
          assets401kNoPolicyScenario * (1 + person.assetReturnRate / 100) + person.annualContribution
      } else {
        // During retirement - full income gap with no policy benefits
        const noPolicyIncomeGap = Math.max(0, incomeNeeded - socialSecurity - pension) // No policy income
        assets401kNoPolicyScenario =
          assets401kNoPolicyScenario * (1 + person.retirementReturnRate / 100) - noPolicyIncomeGap
      }

      // Check if person has gone bankrupt in no-policy scenario
      if (assets401kNoPolicyScenario <= 0 && isRetired) {
        isNoPolicyBankrupt = true
        noPolicyBankruptAge = age
        assets401kNoPolicyScenario = 0
      }
    }

    // Policy cash value and death benefit - ONLY if policy is enabled
    const policyCashValue = person.policyEnabled && policyDataForYear ? policyDataForYear.cashValue : 0
    const policyDeathBenefit = person.policyEnabled && policyDataForYear ? policyDataForYear.deathBenefit : 0

    // Net worth calculations
    const netWorth = assets401k + policyCashValue
    const netWorthNoPolicyScenario = assets401kNoPolicyScenario

    // If this is the death year and policy is enabled, capture the death benefit as legacy amount
    if (isDeathYear && person.policyEnabled && policyDataForYear) {
      legacyAmount = policyDeathBenefit
    }

    // Add data for this year
    retirementData.push({
      age,
      year,
      workIncome: !isRetired ? currentIncome : 0,
      socialSecurity,
      pension,
      policyIncome, // Policy income during LTC events (same as LTC benefits)
      incomeNeeded,
      incomeGap,
      assets401k,
      assets401kNoPolicyScenario,
      policyPremium,
      policyCashValue,
      policyDeathBenefit,
      ltcCosts: annualLtcCost,
      ltcBenefits,
      ltcOutOfPocket,
      netWorth,
      netWorthNoPolicyScenario,
      bankrupt: isBankrupt,
      bankruptAge: bankruptAge,
      isDeathYear,
    })
  }

  // Calculate summary metrics
  const lastYearData = retirementData[retirementData.length - 1]
  const totalAssets = lastYearData.netWorth

  // Calculate LTC metrics
  let totalLtcNeeded = 0
  let totalLtcCovered = 0
  let totalPolicyIncome = 0

  retirementData.forEach((year) => {
    totalLtcNeeded += year.ltcCosts
    totalLtcCovered += year.ltcBenefits
    totalPolicyIncome += year.policyIncome
  })

  const ltcGap = totalLtcNeeded - totalLtcCovered

  // Calculate income gap (average during retirement years)
  const retirementYears = retirementData.filter((d) => d.age >= person.retirementAge)
  const totalIncomeGap = retirementYears.reduce((sum, year) => sum + year.incomeGap, 0)
  const avgIncomeGap = retirementYears.length > 0 ? totalIncomeGap / retirementYears.length : 0

  console.log(`CALCULATION COMPLETE: ${person.name}, policy enabled: ${person.policyEnabled}`)
  console.log(`  - Bankrupt: ${isBankrupt}, Age: ${bankruptAge}`)
  console.log(`  - Total LTC Needed: ${totalLtcNeeded}, Covered: ${totalLtcCovered}`)
  console.log(`  - Total Policy Income: ${totalPolicyIncome}`)
  console.log(`  - Final Assets: ${totalAssets}`)
  console.log(`  - Legacy Amount: ${legacyAmount}`)

  return {
    ...person,
    retirementData,
    incomeGap: avgIncomeGap,
    ltcGap,
    totalAssets,
    totalLtcNeeded,
    totalLtcCovered,
    bankrupt: isBankrupt,
    bankruptAge: bankruptAge,
    legacyAmount,
  }
}

export const combineRetirementData = (person1: Person, person2: Person): CombinedYearlyData[] => {
  if (!person1.enabled && !person2.enabled) return []

  console.log("COMBINING DATA: Creating combined retirement data")

  const combinedData: CombinedYearlyData[] = []

  // Determine the start age (minimum of both people's current ages)
  const startAge = Math.min(person1.enabled ? person1.currentAge : 999, person2.enabled ? person2.currentAge : 999)

  // Determine the end age (maximum of 95 or the highest age in either person's data)
  const endAge = 95

  // Get the current year
  const currentYear = new Date().getFullYear()

  // Create data for each year from start age to end age
  for (let age = startAge; age <= endAge; age++) {
    const year = currentYear + (age - startAge)
    const yearsFromNow = age - startAge

    // Create a data point for this age
    const dataPoint: CombinedYearlyData = {
      age,
      year,
      yearsFromNow,
    }

    // Find data for this age for each person
    const p1Data = person1.enabled ? person1.retirementData.find((d) => d.age === age) : undefined
    const p2Data = person2.enabled ? person2.retirementData.find((d) => d.age === age) : undefined

    // Calculate Person 1's work income for this age
    if (person1.enabled) {
      // If we have data for this age, use it
      if (p1Data) {
        // Add all Person 1 data with p1_ prefix
        Object.keys(p1Data).forEach((key) => {
          if (key !== "age" && key !== "year") {
            dataPoint[`p1_${key}`] = p1Data[key as keyof typeof p1Data] as number | boolean
          }
        })
      } else if (age >= person1.currentAge) {
        // If we don't have data for this age but it's within Person 1's projection range,
        // calculate the expected work income based on the parameters
        const yearsSinceStart = age - person1.currentAge
        const isRetired = age >= person1.retirementAge

        // Calculate work income (only if not retired)
        if (!isRetired) {
          const workIncome = person1.annualIncome * Math.pow(1 + person1.payRaise / 100, yearsSinceStart)
          dataPoint.p1_workIncome = workIncome
        } else {
          dataPoint.p1_workIncome = 0
        }
      }
    }

    // Calculate Person 2's work income for this age
    if (person2.enabled) {
      // If we have data for this age, use it
      if (p2Data) {
        // Add all Person 2 data with p2_ prefix
        Object.keys(p2Data).forEach((key) => {
          if (key !== "age" && key !== "year") {
            dataPoint[`p2_${key}`] = p2Data[key as keyof typeof p2Data] as number | boolean
          }
        })
      } else if (age >= person2.currentAge) {
        // If we don't have data for this age but it's within Person 2's projection range,
        // calculate the expected work income based on the parameters
        const yearsSinceStart = age - person2.currentAge
        const isRetired = age >= person2.retirementAge

        // Calculate work income (only if not retired)
        if (!isRetired) {
          const workIncome = person2.annualIncome * Math.pow(1 + person2.payRaise / 100, yearsSinceStart)
          dataPoint.p2_workIncome = workIncome
        } else {
          dataPoint.p2_workIncome = 0
        }
      }
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

  // Post-process to ensure bankruptcy is consistent
  let bankruptAge = 0
  for (let i = 0; i < combinedData.length; i++) {
    if ((combinedData[i].p1_bankrupt || combinedData[i].p2_bankrupt) && bankruptAge === 0) {
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

  console.log("COMBINING DATA: Combined data created with length:", combinedData.length)
  return combinedData
}

