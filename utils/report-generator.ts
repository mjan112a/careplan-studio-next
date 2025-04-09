import type { Person, CombinedYearlyData } from "../types/financial-types"

// Helper function to format a date as MM/DD/YYYY
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// Function to generate report data
export const generateReportData = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]) => {
  const reportData = {
    generatedDate: formatDate(new Date()),
    person1: {
      ...person1,
      enabled: person1.enabled,
      policyEnabled: person1.policyEnabled,
      retirementSummary: getRetirementSummary(person1),
      ltcSummary: getLtcSummary(person1),
      assetSummary: getAssetSummary(person1),
      keyAges: getKeyAges(person1),
    },
    person2: {
      ...person2,
      enabled: person2.enabled,
      policyEnabled: person2.policyEnabled,
      retirementSummary: getRetirementSummary(person2),
      ltcSummary: getLtcSummary(person2),
      assetSummary: getAssetSummary(person2),
      keyAges: getKeyAges(person2),
    },
    combined: {
      enabled: person1.enabled || person2.enabled,
      retirementSummary: getCombinedRetirementSummary(person1, person2, combinedData),
      ltcSummary: getCombinedLtcSummary(person1, person2, combinedData),
      assetSummary: getCombinedAssetSummary(person1, person2, combinedData),
      keyAges: getCombinedKeyAges(combinedData),
    },
  }

  return reportData
}

// Helper function to get retirement summary for a person
const getRetirementSummary = (person: Person) => {
  if (!person.enabled) return null

  // Find the retirement year data
  const retirementYearData = person.retirementData.find((d) => d.age === person.retirementAge)

  // Find the final year data
  const finalYearData = person.retirementData[person.retirementData.length - 1]

  return {
    retirementAge: person.retirementAge,
    currentAge: person.currentAge,
    yearsUntilRetirement: person.retirementAge - person.currentAge,
    incomeNeeded: retirementYearData?.incomeNeeded || 0,
    incomeGap: retirementYearData?.incomeGap || 0,
    socialSecurity: retirementYearData?.socialSecurity || 0,
    pension: retirementYearData?.pension || 0,
    assetsAtRetirement: retirementYearData?.netWorth || 0,
    finalAssets: finalYearData?.netWorth || 0,
    finalAssetsNoPolicyScenario: finalYearData?.netWorthNoPolicyScenario || 0,
    policyImpact: (finalYearData?.netWorth || 0) - (finalYearData?.netWorthNoPolicyScenario || 0),
    bankrupt: person.bankrupt || false,
    bankruptAge: person.bankruptAge || 0,
  }
}

// Helper function to get LTC summary for a person
const getLtcSummary = (person: Person) => {
  if (!person.enabled || !person.ltcEventEnabled) return null

  // Find the LTC event year data
  const ltcEventYearData = person.retirementData.find((d) => d.age === person.ltcEventAge)

  return {
    ltcEventAge: person.ltcEventAge,
    ltcDuration: person.ltcDuration,
    ltcMonthlyNeed: person.ltcMonthlyNeed,
    ltcAnnualCost: ltcEventYearData?.ltcCosts || 0,
    ltcBenefits: ltcEventYearData?.ltcBenefits || 0,
    ltcOutOfPocket: ltcEventYearData?.ltcOutOfPocket || 0,
    coverageRatio: ltcEventYearData?.ltcCosts
      ? Math.round((ltcEventYearData.ltcBenefits / ltcEventYearData.ltcCosts) * 100)
      : 0,
    totalLtcNeeded: person.totalLtcNeeded,
    totalLtcCovered: person.totalLtcCovered,
    totalCoverageRatio: person.totalLtcNeeded ? Math.round((person.totalLtcCovered / person.totalLtcNeeded) * 100) : 0,
  }
}

// Helper function to get asset summary for a person
const getAssetSummary = (person: Person) => {
  if (!person.enabled) return null

  // Calculate total policy premium
  const totalPolicyPremium = person.retirementData.reduce((sum, year) => sum + year.policyPremium, 0)

  // Find the retirement year data
  const retirementYearData = person.retirementData.find((d) => d.age === person.retirementAge)

  // Find the death year data
  const deathYearData = person.retirementData.find((d) => d.age === person.deathAge)

  // Find the final year data
  const finalYearData = person.retirementData[person.retirementData.length - 1]

  return {
    currentAssets: person.fourOhOneKBalance,
    annualContribution: person.annualContribution,
    assetReturnRate: person.assetReturnRate,
    retirementReturnRate: person.retirementReturnRate,
    assetsAtRetirement: retirementYearData?.assets401k || 0,
    finalAssets: finalYearData?.assets401k || 0,
    finalAssetsNoPolicyScenario: finalYearData?.assets401kNoPolicyScenario || 0,
    policyEnabled: person.policyEnabled,
    isPremiumSingle: person.isPremiumSingle,
    totalPolicyPremium: totalPolicyPremium,
    finalPolicyCashValue: finalYearData?.policyCashValue || 0,
    finalPolicyDeathBenefit: finalYearData?.policyDeathBenefit || 0,
    legacyAmount: person.legacyAmount || 0,
    assetsAtDeath: deathYearData?.assets401k || 0,
    totalToHeirs: (person.legacyAmount || 0) + (deathYearData?.assets401k || 0),
    deathAge: person.deathAge,
  }
}

// Helper function to get key ages for a person
const getKeyAges = (person: Person) => {
  if (!person.enabled) return null

  return {
    currentAge: person.currentAge,
    retirementAge: person.retirementAge,
    ltcEventAge: person.ltcEventEnabled ? person.ltcEventAge : null,
    bankruptAge: person.bankrupt ? person.bankruptAge : null,
  }
}

// Helper function to get combined retirement summary
const getCombinedRetirementSummary = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]) => {
  if (!person1.enabled && !person2.enabled) return null

  // Find the earliest retirement age
  const earliestRetirementAge = Math.min(
    person1.enabled ? person1.retirementAge : 999,
    person2.enabled ? person2.retirementAge : 999,
  )

  // Find the retirement year data
  const retirementYearData = combinedData.find((d) => d.age === earliestRetirementAge)

  // Find the final year data
  const finalYearData = combinedData[combinedData.length - 1]

  // Find if combined is bankrupt
  const isBankrupt = combinedData.some((d) => d.combined_bankrupt === true)
  const bankruptAge = isBankrupt ? combinedData.find((d) => d.combined_bankrupt === true)?.combined_bankruptAge || 0 : 0

  return {
    earliestRetirementAge,
    incomeNeeded: retirementYearData?.combined_incomeNeeded || 0,
    incomeGap: retirementYearData?.combined_incomeGap || 0,
    socialSecurity: retirementYearData?.combined_socialSecurity || 0,
    pension: retirementYearData?.combined_pension || 0,
    assetsAtRetirement: retirementYearData?.combined_netWorth || 0,
    finalAssets: finalYearData?.combined_netWorth || 0,
    finalAssetsNoPolicyScenario: finalYearData?.combined_netWorthNoPolicyScenario || 0,
    policyImpact: (finalYearData?.combined_netWorth || 0) - (finalYearData?.combined_netWorthNoPolicyScenario || 0),
    bankrupt: isBankrupt,
    bankruptAge,
  }
}

// Helper function to get combined LTC summary
const getCombinedLtcSummary = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]) => {
  if (!person1.enabled && !person2.enabled) return null
  if (!person1.ltcEventEnabled && !person2.ltcEventEnabled) return null

  // Calculate total LTC costs and benefits
  let totalLtcCosts = 0
  let totalLtcBenefits = 0

  combinedData.forEach((year) => {
    totalLtcCosts += year.combined_ltcCosts || 0
    totalLtcBenefits += year.combined_ltcBenefits || 0
  })

  return {
    totalLtcCosts,
    totalLtcBenefits,
    totalLtcOutOfPocket: totalLtcCosts - totalLtcBenefits,
    totalCoverageRatio: totalLtcCosts ? Math.round((totalLtcBenefits / totalLtcCosts) * 100) : 0,
  }
}

// Helper function to get combined asset summary
const getCombinedAssetSummary = (person1: Person, person2: Person, combinedData: CombinedYearlyData[]) => {
  if (!person1.enabled && !person2.enabled) return null

  // Calculate total current assets
  const totalCurrentAssets =
    (person1.enabled ? person1.fourOhOneKBalance : 0) + (person2.enabled ? person2.fourOhOneKBalance : 0)

  // Calculate total annual contribution
  const totalAnnualContribution =
    (person1.enabled ? person1.annualContribution : 0) + (person2.enabled ? person2.annualContribution : 0)

  // Calculate total policy premium
  let totalPolicyPremium = 0
  combinedData.forEach((year) => {
    totalPolicyPremium += year.combined_policyPremium || 0
  })

  // Find the earliest retirement age
  const earliestRetirementAge = Math.min(
    person1.enabled ? person1.retirementAge : 999,
    person2.enabled ? person2.retirementAge : 999,
  )

  // Find the retirement year data
  const retirementYearData = combinedData.find((d) => d.age === earliestRetirementAge)

  // Find the final year data
  const finalYearData = combinedData[combinedData.length - 1]

  return {
    totalCurrentAssets,
    totalAnnualContribution,
    assetsAtRetirement: retirementYearData?.combined_assets401k || 0,
    finalAssets: finalYearData?.combined_assets401k || 0,
    finalAssetsNoPolicyScenario: finalYearData?.combined_assets401kNoPolicyScenario || 0,
    totalPolicyPremium,
    finalPolicyCashValue: finalYearData?.combined_policyCashValue || 0,
    finalPolicyDeathBenefit: finalYearData?.combined_policyDeathBenefit || 0,
  }
}

// Helper function to get combined key ages
const getCombinedKeyAges = (combinedData: CombinedYearlyData[]) => {
  if (combinedData.length === 0) return null

  // Find if combined is bankrupt
  const isBankrupt = combinedData.some((d) => d.combined_bankrupt === true)
  const bankruptAge = isBankrupt ? combinedData.find((d) => d.combined_bankrupt === true)?.combined_bankruptAge || 0 : 0

  return {
    startAge: combinedData[0].age,
    endAge: combinedData[combinedData.length - 1].age,
    bankruptAge: isBankrupt ? bankruptAge : null,
  }
}

