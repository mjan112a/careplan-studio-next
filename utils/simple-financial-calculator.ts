import type { Person } from "@/types/person"
import { PolicyData } from '@/types/simulator-interfaces'

export interface SimpleYearlyData {
  // Year identifiers
  age: number
  year: number
  policyYear: number
  
  // Income sources
  workIncome: number
  socialSecurityIncome: number
  otherRetirementIncome: number
  ltcBenefits: number
  totalIncome: number
  
  // Expense sources  
  basicExpenses: number
  ltcExpenses: number
  premiumExpenses: number // Direct from policy table
  totalExpenses: number
  
  // Cash flow
  netCashFlow: number
  
  // Asset tracking
  assets: number
  policyValue: number
  totalAssets: number
  
  // Withdrawals (when expenses > income)
  withdrawal: number
  taxOnWithdrawal: number
  
  // Status flags
  isRetired: boolean
  hasLTCEvent: boolean
  isAlive: boolean
  
  // Policy data (direct from table)
  deathBenefit: number
  policyLoanTaken: number
  policyLoanBalance: number
  policyLoanInterest: number
  cumulativeLTCBenefits: number
}

/**
 * Simple Financial Calculator
 * 
 * Core Principle: Policy Annual Data Table is the Single Source of Truth
 * 
 * For each year:
 * 1. Map person age to policy year (age - startAge + 1)
 * 2. Get exact data from policy table for that year
 * 3. Calculate income, expenses, cash flow
 * 4. Update assets
 */
export function calculateSimpleFinancialProjection(
  person: Person,
  personIndex = 0,
  policyData?: PolicyData[] | null
): SimpleYearlyData[] {
  
  const projection: SimpleYearlyData[] = []
  let currentAssets = person.retirementSavings
  let policyLoanBalance = 0
  let cumulativeLTCBenefits = 0
  
  // Get policy data for this person
  const personPolicy = policyData && policyData.length > personIndex ? policyData[personIndex] : null
  
  console.log(`=== SIMPLE CALCULATOR START ===`)
  console.log(`Person: ${person.name}, Age: ${person.age}`)
  console.log(`Policy Data Available: ${!!personPolicy}`)
  if (personPolicy) {
    console.log(`Policy has ${personPolicy.annual_policy_data.length} years of data`)
    console.log(`Sample policy years:`, personPolicy.annual_policy_data.slice(0, 5).map(d => ({
      policy_year: d.policy_year,
      annual_premium: d.annual_premium,
      surrender_value: d.surrender_value
    })))
  }
  
  // Calculate for each year from current age to death age
  for (let currentAge = person.age; currentAge <= person.deathAge; currentAge++) {
    const yearsFromStart = currentAge - person.age
    const currentYear = new Date().getFullYear() + yearsFromStart
    
    // Simple policy year mapping: Policy Year 1 = Person's starting age
    const policyYear = yearsFromStart + 1
    
    console.log(`\n--- Year ${yearsFromStart + 1}: Age ${currentAge}, Policy Year ${policyYear} ---`)
    
    // Status flags
    const isRetired = currentAge >= person.retirementAge
    const hasLTCEvent = person.ltcEventEnabled && 
                       currentAge >= person.ltcEventAge && 
                       currentAge < person.ltcEventAge + person.ltcDuration
    const isAlive = currentAge <= person.deathAge
    
    // === INCOME CALCULATION ===
    
    // Work income (pay increase compounded) - reduced during LTC events
    let workIncome = !isRetired
      ? person.income * Math.pow(1 + person.annualPayIncrease, yearsFromStart)
      : 0
    
    // Reduce work income by 80% during LTC events (unable to work full-time)
    if (hasLTCEvent && !isRetired) {
      workIncome = workIncome * 0.2 // Keep only 20% of normal income
      console.log(`  Work income reduced due to LTC event: ${workIncome} (80% reduction)`)
    }
    
    // Social Security (COLA adjusted during retirement - typically lower than general inflation)
    const socialSecurityCOLA = Math.max(0, person.generalInflation - 0.005) // Typically 0.5% lower than general inflation
    const socialSecurityIncome = isRetired
      ? person.socialSecurityIncome * Math.pow(1 + socialSecurityCOLA, yearsFromStart)
      : 0
      
    // Other retirement income (inflation adjusted during retirement)
    const otherRetirementIncome = isRetired
      ? person.otherRetirementIncome * Math.pow(1 + person.generalInflation, yearsFromStart)
      : 0
    
    // LTC expenses (inflation adjusted) - MOVED UP to calculate before benefits
    const ltcExpenses = hasLTCEvent
      ? person.ltcCostPerYear * Math.pow(1 + person.ltcInflation, yearsFromStart)
      : 0
    
    // LTC benefits from policy (direct from policy table)
    let ltcBenefits = 0
    if (hasLTCEvent && personPolicy && person.policyEnabled) {
      const policyYearData = personPolicy.annual_policy_data.find(data => data.policy_year === policyYear)
      if (policyYearData && policyYearData.monthly_benefit_limit) {
        const maxAnnualBenefit = policyYearData.monthly_benefit_limit * 12
        // FIXED: Cap benefits at actual LTC expenses - benefits should never exceed actual costs
        ltcBenefits = Math.min(maxAnnualBenefit, ltcExpenses)
        
        // Track cumulative benefits and check for lifetime maximum
        const potentialCumulative = cumulativeLTCBenefits + ltcBenefits
        
        // Check if there's a total LTC benefit limit (lifetime maximum)
        if (policyYearData.total_ltc_benefit && potentialCumulative > policyYearData.total_ltc_benefit) {
          const remainingBenefit = Math.max(0, policyYearData.total_ltc_benefit - cumulativeLTCBenefits)
          ltcBenefits = Math.min(ltcBenefits, remainingBenefit)
          console.log(`  LTC Benefits capped by lifetime maximum: remaining=${remainingBenefit}, final=${ltcBenefits}`)
        }
        
        cumulativeLTCBenefits += ltcBenefits
        console.log(`SIMPLE CALC - LTC Benefits: maxAnnual=${maxAnnualBenefit}, ltcExpenses=${ltcExpenses}, final=${ltcBenefits}, cumulative=${cumulativeLTCBenefits}`)
      }
    }
    
    const totalIncome = workIncome + socialSecurityIncome + otherRetirementIncome + ltcBenefits
    
    console.log(`Income: Work=$${workIncome.toFixed(0)} (base: $${person.income}, increase: ${(person.annualPayIncrease*100).toFixed(1)}%), SS=$${socialSecurityIncome.toFixed(0)}, Other=$${otherRetirementIncome.toFixed(0)}, LTC=$${ltcBenefits.toFixed(0)}`)
    
    // === EXPENSE CALCULATION ===
    
    // Basic living expenses (only in retirement, inflation adjusted)
    const basicExpenses = isRetired
      ? person.income * person.incomeReplacementRatio * Math.pow(1 + person.generalInflation, yearsFromStart)
      : 0
    
    // LTC expenses calculation moved up above LTC benefits calculation
    
    // Premium expenses (DIRECT FROM POLICY TABLE)
    let premiumExpenses = 0
    let premiumFromAssets = 0
    let premiumPaidFromIncome = 0
    
    if (person.policyEnabled && personPolicy) {
      const policyYearData = personPolicy.annual_policy_data.find(data => data.policy_year === policyYear)
      if (policyYearData) {
        const rawPremium = policyYearData.annual_premium
        console.log(`Found policy data for year ${policyYear}: Premium = $${rawPremium}`)
        
        // Determine how premium is paid based on toggles
        const isFirstYear = yearsFromStart === 0
        const shouldPayFromAssets = (isFirstYear && person.initialPremiumFromAssets) ||
                                   (!isRetired && person.premiumsFromAssetsPreRetirement)
        
        if (shouldPayFromAssets && rawPremium > 0) {
          // Premium paid from assets - exclude from regular expenses
          premiumFromAssets = rawPremium
          premiumExpenses = 0
          console.log(`  Premium will be paid from assets: $${premiumFromAssets}`)
        } else {
          // Premium paid from income - include in regular expenses
          premiumExpenses = rawPremium
          premiumPaidFromIncome = rawPremium
          console.log(`  Premium will be paid from income: $${premiumExpenses}`)
        }
      } else {
        console.log(`No policy data found for year ${policyYear} - Premium = $0`)
      }
    }
    
    const totalExpenses = basicExpenses + ltcExpenses + premiumExpenses
    
    console.log(`Expenses: Basic=$${basicExpenses.toFixed(0)}, LTC=$${ltcExpenses.toFixed(0)}, Premium from income=$${premiumPaidFromIncome.toFixed(0)}, Premium from assets=$${premiumFromAssets.toFixed(0)}`)
    
    // === CASH FLOW CALCULATION ===
    
    const netCashFlow = totalIncome - totalExpenses
    
    console.log(`Net Cash Flow: $${netCashFlow}`)
    
    // === ASSET CALCULATION ===
    
    let withdrawal = 0
    let taxOnWithdrawal = 0
    
    // Store initial assets before any transactions
    const assetsBefore = currentAssets
    const returnRate = isRetired ? person.assetReturns : person.preRetirementAssetReturns
    
    // FIXED: Handle all withdrawals FIRST, then apply investment returns to remaining assets
    
    // Handle premium payments from assets first (if applicable)
    if (premiumFromAssets > 0) {
      // Calculate gross withdrawal needed to cover premium + tax
      const grossPremiumWithdrawal = premiumFromAssets / (1 - person.retirementAssetsTaxRate)
      const premiumWithdrawal = Math.min(grossPremiumWithdrawal, currentAssets)
      const taxOnPremium = premiumWithdrawal * person.retirementAssetsTaxRate
      
      withdrawal += premiumWithdrawal
      taxOnWithdrawal += taxOnPremium
      currentAssets -= premiumWithdrawal
      
      console.log(`  Premium from assets: Gross withdrawal=$${premiumWithdrawal.toFixed(0)}, Tax=$${taxOnPremium.toFixed(0)} (${(person.retirementAssetsTaxRate*100).toFixed(1)}%), Net premium=$${(premiumWithdrawal - taxOnPremium).toFixed(0)}`)
    }
    
    // FIXED: Handle annual savings separately from cash flow (working people can save even with negative cash flow)
    if (!isRetired && !hasLTCEvent) {
      // Add annual savings when working and not in LTC event
      currentAssets += person.annualSavings
      console.log(`  Added annual savings: $${person.annualSavings}`)
    }
    
    // Handle regular cash flow shortfalls
    if (netCashFlow < 0) {
      // Negative cash flow - withdraw from assets
      const grossWithdrawalNeeded = Math.abs(netCashFlow) / (1 - person.retirementAssetsTaxRate)
      const additionalWithdrawal = Math.min(grossWithdrawalNeeded, currentAssets)
      const additionalTax = additionalWithdrawal * person.retirementAssetsTaxRate
      
      withdrawal += additionalWithdrawal
      taxOnWithdrawal += additionalTax
      currentAssets -= additionalWithdrawal
      
      console.log(`  Cash flow shortfall: Need=$${Math.abs(netCashFlow)}, Withdrawn=$${additionalWithdrawal}, Tax=$${additionalTax}`)
    }
    
    // FIXED: Apply investment returns AFTER all withdrawals are handled
    const assetsAfterWithdrawals = currentAssets
    currentAssets = currentAssets * (1 + returnRate)
    
    if (currentAge <= person.age + 5) {
      console.log(`Assets: Start=$${assetsBefore.toFixed(0)}, After withdrawals=$${assetsAfterWithdrawals.toFixed(0)}, After ${(returnRate*100).toFixed(1)}% return=$${currentAssets.toFixed(0)}`)
    }
    
    // Get policy values (direct from policy table)
    let policyValue = 0
    let deathBenefit = 0
    if (person.policyEnabled && personPolicy) {
      const policyYearData = personPolicy.annual_policy_data.find(data => data.policy_year === policyYear)
      if (policyYearData) {
        policyValue = policyYearData.surrender_value || policyYearData.accumulation_value || 0
        deathBenefit = policyYearData.death_benefit || 0
      }
    }
    
    const totalAssets = currentAssets + policyValue
    
    console.log(`Assets: Retirement=$${currentAssets}, Policy=$${policyValue}, Total=$${totalAssets}`)
    
    // Add this year's data
    projection.push({
      age: currentAge,
      year: currentYear,
      policyYear,
      workIncome,
      socialSecurityIncome,
      otherRetirementIncome,
      ltcBenefits,
      totalIncome,
      basicExpenses,
      ltcExpenses,
      premiumExpenses: premiumFromAssets + premiumPaidFromIncome, // Total premium for chart display
      totalExpenses,
      netCashFlow,
      assets: currentAssets,
      policyValue,
      totalAssets,
      withdrawal,
      taxOnWithdrawal,
      isRetired,
      hasLTCEvent,
      isAlive,
      deathBenefit,
      policyLoanTaken: 0, // Simplified - no policy loans for now
      policyLoanBalance: 0,
      policyLoanInterest: 0,
      cumulativeLTCBenefits
    })
  }
  
  console.log(`=== SIMPLE CALCULATOR COMPLETE ===`)
  
  return projection
}

/**
 * Convert SimpleYearlyData to YearlyFinancialData format for chart compatibility
 */
export function convertToYearlyFinancialData(simpleData: SimpleYearlyData[]): any[] {
  return simpleData.map(data => ({
    age: data.age,
    year: data.year,
    income: data.totalIncome,
    workIncome: data.workIncome,
    socialSecurityIncome: data.socialSecurityIncome,
    otherRetirementIncome: data.otherRetirementIncome,
    expenses: data.totalExpenses,
    basicExpenses: data.basicExpenses,
    ltcExpenses: data.ltcExpenses,
    premiumExpenses: data.premiumExpenses,
    ltcBenefits: data.ltcBenefits,
    netCashFlow: data.netCashFlow,
    withdrawal: data.withdrawal,
    taxOnWithdrawal: data.taxOnWithdrawal,
    assets: data.assets,
    policyValue: data.policyValue,
    totalAssets: data.totalAssets,
    cumulativeLTCBenefits: data.cumulativeLTCBenefits || 0,
    hasLTCEvent: data.hasLTCEvent,
    isAlive: data.isAlive,
    deathBenefit: data.deathBenefit,
    policyYear: data.policyYear,
    policyLoanTaken: data.policyLoanTaken,
    policyLoanBalance: data.policyLoanBalance,
    policyLoanInterest: data.policyLoanInterest
  }))
}